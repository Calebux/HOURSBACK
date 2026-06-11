import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verifyZernioSignature } from "../_shared/zernio.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KAPSO_WEBHOOK_SECRET = Deno.env.get("KAPSO_WEBHOOK_SECRET") || "";
const ZERNIO_VERIFY_TOKEN = Deno.env.get("ZERNIO_VERIFY_TOKEN") || Deno.env.get("KAPSO_WEBHOOK_SECRET") || "";

const headers = { "Content-Type": "application/json" };

function firstString(...values: unknown[]) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return [...new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  )].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function logAnalyticsEvent(
  supabase: any,
  userId: string | null,
  eventName: string,
  properties: Record<string, unknown> = {},
) {
  try {
    await supabase.from("app_analytics_events").insert({
      user_id: userId,
      event_name: eventName,
      properties,
      source: "zernio_webhook",
    });
  } catch (err) {
    console.error("Zernio analytics log failed:", err);
  }
}

/** Parse a standard Meta Cloud API webhook payload. */
function normalizeMetaPayload(payload: any) {
  const value = payload?.entry?.[0]?.changes?.[0]?.value || {};
  const metadata = value?.metadata || {};
  const message = value?.messages?.[0] || {};
  const contact = value?.contacts?.[0] || {};

  const phoneNumberId = firstString(metadata?.phone_number_id, message?.phone_number_id);
  const from = firstString(message?.from);
  const textBody = firstString(message?.text?.body, message?.caption);
  const type = firstString(message?.type) || "text";

  let mediaId: string | undefined;
  let mediaUrl: string | undefined;
  if (["image", "document", "audio", "video"].includes(type)) {
    mediaId = message?.[type]?.id;
    mediaUrl = message?.[type]?.url;
  }

  return {
    event: "whatsapp.message.received",
    message: {
      id: firstString(message?.id),
      from,
      to: firstString(metadata?.display_phone_number),
      text: textBody ? { body: textBody } : undefined,
      type,
      timestamp: firstString(message?.timestamp) || String(Math.floor(Date.now() / 1000)),
      phone_number_id: phoneNumberId,
      contact_name: firstString(contact?.profile?.name),
      media_id: mediaId,
      media_url: mediaUrl,
      kapso: {
        direction: "inbound",
        content: textBody,
        status: "received",
        origin: "zernio",
      },
    },
    phone_number_id: phoneNumberId,
    gateway: {
      provider: "zernio",
      raw_event: "messages",
    },
  };
}

/** Parse Zernio's Inbox webhook payload. */
function normalizeZernioPayload(payload: any) {
  const message = payload?.message || {};
  const conversation = payload?.conversation || {};
  const account = payload?.account || {};
  const accountId = firstString(account?._id, account?.id, account?.accountId, message?.accountId, conversation?.accountId);
  const conversationId = firstString(conversation?.id, conversation?._id, conversation?.conversationId, message?.conversationId);
  const textBody = firstString(message?.text, message?.message, message?.body, message?.content);
  const contactPhone = firstString(
    message?.from?.phone,
    message?.from?.phoneNumber,
    message?.from?.wa_id,
    message?.from?.whatsapp,
    message?.from?.id,
    typeof message?.from === "string" && /^\+?\d[\d\s()+-]+$/.test(message.from) ? message.from : undefined,
    conversation?.contactPhone,
    conversation?.phone,
    conversation?.phoneNumber,
    conversation?.wa_id,
    conversation?.contact?.phone,
    conversation?.contact?.phoneNumber,
    conversation?.contact?.wa_id,
    payload?.contact?.phone,
    payload?.contact?.phoneNumber,
    payload?.contact?.wa_id,
  );
  const from = contactPhone || conversationId || firstString(message?.from?.id, message?.from, conversation?.contactId);
  const contactName = firstString(
    conversation?.contactName,
    conversation?.name,
    message?.from?.name,
    message?.senderName,
  );

  return {
    event: "whatsapp.message.received",
    message: {
      id: firstString(message?.id, message?._id, message?.messageId, payload?.id),
      from,
      to: firstString(account?.username, account?.displayName),
      text: textBody ? { body: textBody } : undefined,
      type: firstString(message?.type) || (textBody ? "text" : "message"),
      timestamp: firstString(message?.createdAt, message?.timestamp, payload?.timestamp) || new Date().toISOString(),
      phone_number_id: accountId,
      contact_name: contactName,
      media_url: firstString(message?.attachmentUrl, message?.attachments?.[0]?.url),
      kapso: {
        direction: "inbound",
        content: textBody,
        status: "received",
        origin: "zernio",
        conversation_id: conversationId,
        account_id: accountId,
        reply_to: conversationId,
      },
    },
    phone_number_id: accountId,
    gateway: {
      provider: "zernio",
      raw_event: payload?.event || "message.received",
      conversation_id: conversationId,
      account_id: accountId,
    },
  };
}

serve(async (req) => {
  const url = new URL(req.url);

  // ── Meta webhook verification challenge (GET) ────────────────────────────
  if (req.method === "GET") {
    const hubMode = url.searchParams.get("hub.mode");
    const hubChallenge = url.searchParams.get("hub.challenge");
    const hubVerifyToken = url.searchParams.get("hub.verify_token");

    if (hubMode === "subscribe" && hubVerifyToken === ZERNIO_VERIFY_TOKEN && hubChallenge) {
      return new Response(hubChallenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return new Response("Not found", { status: 404 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Zernio-Signature")
      || req.headers.get("X-Late-Signature")
      || req.headers.get("X-Hub-Signature-256")
      || req.headers.get("X-Webhook-Signature");
    const validSignature = await verifyZernioSignature(rawBody, signature);
    const payload = JSON.parse(rawBody);

    // Status updates (delivery receipts) — acknowledge but don't process
    const hasMetaMessage = !!payload?.entry?.[0]?.changes?.[0]?.value?.messages?.length;
    const hasZernioMessage = payload?.event === "message.received" && !!payload?.message;
    if (!hasMetaMessage && !hasZernioMessage) {
      return new Response(JSON.stringify({ success: true, ignored: "no message" }), { headers });
    }

    const normalized = hasZernioMessage ? normalizeZernioPayload(payload) : normalizeMetaPayload(payload);
    if (!normalized.phone_number_id || !normalized.message?.from) {
      await logAnalyticsEvent(supabase, null, "zernio_unusable_payload", {
        has_phone_number_id: !!normalized.phone_number_id,
        has_from: !!normalized.message?.from,
      });
      return new Response(JSON.stringify({ success: true, ignored: "no usable message" }), { headers });
    }

    // ── Route by phone_number_id — no ?uid= needed ───────────────────────
    const { data: connection } = await supabase
      .from("kapso_connections")
      .select("user_id, connection_type")
      .eq("phone_number_id", normalized.phone_number_id)
      .eq("whatsapp_provider", "zernio")
      .maybeSingle();

    if (!validSignature) {
      await logAnalyticsEvent(supabase, connection?.user_id || null, "zernio_invalid_signature", {
        has_signature: !!signature,
        known_account: !!connection,
        phone_number_id: normalized.phone_number_id,
      });
      if (signature || !connection) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers });
      }
      await logAnalyticsEvent(supabase, connection.user_id, "zernio_unsigned_known_account_accepted", {
        phone_number_id: normalized.phone_number_id,
      });
    }

    if (!connection) {
      await logAnalyticsEvent(supabase, null, "zernio_unknown_number", {
        phone_number_id: normalized.phone_number_id,
      });
      // Return 200 so Zernio doesn't retry unrecognised numbers
      return new Response(JSON.stringify({ success: true, ignored: "unknown number" }), { headers });
    }

    const { user_id: uid, connection_type: mode } = connection;

    if (!KAPSO_WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: "Internal Hoursback webhook secret is not configured" }),
        { status: 500, headers },
      );
    }

    // Forward to kapso-webhook (shared processing hub)
    const handoffBody = JSON.stringify(normalized);
    const handoffSignature = `sha256=${await hmacHex(KAPSO_WEBHOOK_SECRET, handoffBody)}`;
    const handoffUrl = `${SUPABASE_URL}/functions/v1/kapso-webhook?uid=${encodeURIComponent(uid)}&mode=${mode}`;
    const idempotencyKey = normalized.message.id ? `zernio:${normalized.message.id}` : undefined;

    const response = await fetch(handoffUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": handoffSignature,
        "X-Webhook-Event": "whatsapp.message.received",
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
      },
      body: handoffBody,
    });
    const responseText = await response.text();

    if (!response.ok) {
      await logAnalyticsEvent(supabase, uid, "zernio_handoff_failed", {
        mode,
        status: response.status,
        response: responseText.slice(0, 500),
      });
      return new Response(responseText || JSON.stringify({ error: "Hoursback handoff failed" }), {
        status: response.status,
        headers,
      });
    }

    await logAnalyticsEvent(supabase, uid, "zernio_handoff_succeeded", {
      mode,
      phone_number_id: normalized.phone_number_id,
      message_id: normalized.message.id || null,
    });
    return new Response(responseText || JSON.stringify({ success: true }), { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("zernio-webhook error:", err);
    await logAnalyticsEvent(supabase, null, "zernio_function_error", { error: message });
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
