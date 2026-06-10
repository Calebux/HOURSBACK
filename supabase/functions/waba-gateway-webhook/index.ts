import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WABA_GATEWAY_WEBHOOK_SECRET = Deno.env.get("WABA_GATEWAY_WEBHOOK_SECRET") || "";
const KAPSO_WEBHOOK_SECRET = Deno.env.get("KAPSO_WEBHOOK_SECRET") || "";

const headers = { "Content-Type": "application/json" };

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
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
  return bytesToHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
}

async function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  const signatureCandidates = signature
    .trim()
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      const [, value] = trimmed.match(/^(?:sha256|v1)=([^,]+)$/i) || [];
      return [trimmed, value].filter(Boolean);
    })
    .map((value) => value.replace(/^sha256=/i, "").trim());

  const bodiesToCheck = [rawBody];
  try {
    bodiesToCheck.push(JSON.stringify(JSON.parse(rawBody)));
  } catch {
    // raw body only
  }

  for (const body of bodiesToCheck) {
    const expected = await hmacHex(secret, body);
    if (signatureCandidates.some((candidate) => timingSafeEqual(candidate, expected))) return true;
  }
  return false;
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
      source: "waba_gateway_webhook",
    });
  } catch (err) {
    console.error("WABA gateway analytics log failed:", err);
  }
}

function normalizeGatewayPayload(payload: any, eventHeader?: string | null) {
  const message = payload?.message || payload?.data?.message || payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] || {};
  const value = payload?.entry?.[0]?.changes?.[0]?.value || {};
  const metadata = value?.metadata || {};
  const contact = value?.contacts?.[0] || {};
  const textBody = firstString(
    message?.text?.body,
    message?.text,
    payload?.text?.body,
    payload?.text,
    payload?.message_text,
    payload?.body,
  );
  const phoneNumberId = firstString(
    payload?.phone_number_id,
    payload?.phoneNumberId,
    message?.phone_number_id,
    message?.phoneNumberId,
    metadata?.phone_number_id,
  );
  const from = firstString(message?.from, payload?.from, payload?.from_number);
  const to = firstString(message?.to, payload?.to, payload?.to_number, metadata?.display_phone_number);
  const type = firstString(message?.type, payload?.type, textBody ? "text" : undefined) || "text";

  return {
    event: firstString(eventHeader, payload?.event) || "whatsapp.message.received",
    message: {
      id: firstString(message?.id, payload?.message_id, payload?.id),
      from,
      to,
      text: textBody ? { body: textBody } : undefined,
      type,
      timestamp: firstString(message?.timestamp, payload?.timestamp) || String(Math.floor(Date.now() / 1000)),
      phone_number_id: phoneNumberId,
      contact_name: firstString(contact?.profile?.name, payload?.contact_name, payload?.customer?.name),
      kapso: {
        direction: "inbound",
        content: textBody,
        status: "received",
        origin: "waba_gateway",
      },
    },
    phone_number_id: phoneNumberId,
    customer: payload?.customer || null,
    gateway: {
      provider: "waba_gateway",
      raw_event: payload?.event || eventHeader || null,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return new Response("Not found", { status: 404 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const url = new URL(req.url);
  const uid = url.searchParams.get("uid");
  const mode = url.searchParams.get("mode") === "internal" ? "internal" : "customer";

  try {
    const rawBody = await req.text();
    const signature = firstString(
      req.headers.get("X-Webhook-Signature"),
      req.headers.get("X-Waba-Signature"),
      req.headers.get("X-Signature"),
    );

    const gatewaySecret = WABA_GATEWAY_WEBHOOK_SECRET || KAPSO_WEBHOOK_SECRET;
    if (!gatewaySecret) {
      await logAnalyticsEvent(supabase, uid, "waba_gateway_missing_secret", { mode });
      return new Response(JSON.stringify({ error: "WABA gateway webhook secret is not configured" }), { status: 500, headers });
    }

    const valid = await verifySignature(rawBody, signature || null, gatewaySecret);
    if (!valid) {
      await logAnalyticsEvent(supabase, uid, "waba_gateway_invalid_signature", {
        mode,
        has_signature: !!signature,
        event: req.headers.get("X-Webhook-Event"),
      });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers });
    }

    const payload = JSON.parse(rawBody);
    const normalized = normalizeGatewayPayload(payload, req.headers.get("X-Webhook-Event"));
    if (!normalized.phone_number_id || !normalized.message?.from) {
      await logAnalyticsEvent(supabase, uid, "waba_gateway_unusable_payload", {
        mode,
        has_phone_number_id: !!normalized.phone_number_id,
        has_from: !!normalized.message?.from,
      });
      return new Response(JSON.stringify({ success: true, ignored: "no usable message" }), { headers });
    }

    if (!KAPSO_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Internal Hoursback webhook secret is not configured" }), { status: 500, headers });
    }

    const handoffBody = JSON.stringify(normalized);
    const handoffSignature = `sha256=${await hmacHex(KAPSO_WEBHOOK_SECRET, handoffBody)}`;
    const handoffUrl = `${SUPABASE_URL}/functions/v1/kapso-webhook?uid=${encodeURIComponent(uid || "")}&mode=${mode}`;
    const idempotencyKey = firstString(
      req.headers.get("X-Idempotency-Key"),
      normalized.message.id ? `waba-gateway:${normalized.message.id}` : undefined,
    );

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
      await logAnalyticsEvent(supabase, uid, "waba_gateway_handoff_failed", {
        mode,
        status: response.status,
        response: responseText.slice(0, 500),
      });
      return new Response(responseText || JSON.stringify({ error: "Hoursback handoff failed" }), {
        status: response.status,
        headers,
      });
    }

    await logAnalyticsEvent(supabase, uid, "waba_gateway_handoff_succeeded", {
      mode,
      phone_number_id: normalized.phone_number_id,
      message_id: normalized.message.id || null,
    });
    return new Response(responseText || JSON.stringify({ success: true }), { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("waba-gateway-webhook error:", err);
    await logAnalyticsEvent(supabase, uid, "waba_gateway_function_error", { mode, error: message });
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
