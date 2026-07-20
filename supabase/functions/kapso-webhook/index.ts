// Kapso provider adapter: verify signature, normalize, record the event,
// fast-ack, and hand the message to the shared WhatsApp router.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  bytesToHex,
  firstString,
  logAnalyticsEvent,
  markInboundEvent,
  recordInboundEvent,
  runInBackground,
  timingSafeEqual,
} from "../_shared/whatsapp_core.ts";
import { hasMediaMessage, parseKapsoMessage } from "../_shared/whatsapp_normalize.ts";
import { processInboundMessage } from "../_shared/whatsapp_router.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KAPSO_WEBHOOK_SECRET = Deno.env.get("KAPSO_WEBHOOK_SECRET") || "";
const KAPSO_ALLOW_UNSIGNED_WEBHOOKS = Deno.env.get("KAPSO_ALLOW_UNSIGNED_WEBHOOKS") === "true";

const headers = { "Content-Type": "application/json" };

async function verifySignature(rawBody: string, signature: string | null) {
  if (!KAPSO_WEBHOOK_SECRET) return KAPSO_ALLOW_UNSIGNED_WEBHOOKS;
  if (!signature) return false;
  const normalizedSignature = signature.trim();
  const signatureCandidates = normalizedSignature
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      const [, value] = trimmed.match(/^(?:sha256|v1)=([^,]+)$/i) || [];
      return [trimmed, value].filter(Boolean);
    })
    .map((value) => value.replace(/^sha256=/i, "").trim());

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(KAPSO_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const bodiesToCheck = [rawBody];
  try {
    bodiesToCheck.push(JSON.stringify(JSON.parse(rawBody)));
  } catch {
    // Keep raw body only when JSON parsing is not possible.
  }

  for (const body of bodiesToCheck) {
    const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const expectedHex = bytesToHex(digest);
    const expectedBase64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
    if (signatureCandidates.some((candidate) =>
      timingSafeEqual(candidate, expectedHex) || timingSafeEqual(candidate, expectedBase64)
    )) {
      return true;
    }
  }

  return false;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Not found", { status: 404 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    if (!KAPSO_WEBHOOK_SECRET && !KAPSO_ALLOW_UNSIGNED_WEBHOOKS) {
      console.error("Kapso webhook rejected: KAPSO_WEBHOOK_SECRET is not configured");
      await logAnalyticsEvent(supabase, null, "webhook_missing_secret", {
        has_allow_unsigned: KAPSO_ALLOW_UNSIGNED_WEBHOOKS,
      });
      return new Response(JSON.stringify({ error: "Webhook signature secret is not configured" }), { status: 500, headers });
    }
    const signature = firstString(
      req.headers.get("X-Webhook-Signature"),
      req.headers.get("X-Kapso-Signature"),
      req.headers.get("X-Signature")
    );
    const isValid = await verifySignature(rawBody, signature || null);
    if (!isValid) {
      console.log("Kapso webhook rejected: invalid signature", { hasSignature: !!signature });
      await logAnalyticsEvent(supabase, null, "webhook_invalid_signature", {
        has_signature: !!signature,
        event: firstString(req.headers.get("X-Webhook-Event"), payload?.event) || null,
      });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers });
    }

    const event = firstString(req.headers.get("X-Webhook-Event"), payload?.event)?.toLowerCase();
    if (event && event !== "whatsapp.message.received") {
      return new Response(JSON.stringify({ success: true, ignored: true }), { headers });
    }

    const message = parseKapsoMessage(payload);
    if (!message?.phoneNumberId || (!message.text && !hasMediaMessage(message))) {
      console.log("Kapso webhook ignored: no usable message or phone number id", {
        hasText: !!message?.text,
        type: message?.type || null,
        phoneNumberId: message?.phoneNumberId || null,
        event: event || null,
      });
      return new Response(JSON.stringify({ success: true, ignored: "no usable message" }), { headers });
    }
    const messageDirection = message.direction?.toLowerCase();
    if (messageDirection && messageDirection !== "inbound" && messageDirection !== "received") {
      return new Response(JSON.stringify({ success: true, ignored: "non-inbound message" }), { headers });
    }

    const idempotencyKey = req.headers.get("X-Idempotency-Key")
      || (message.messageId ? `kapso-message:${message.messageId}` : null);
    let eventId: string | null = null;
    if (idempotencyKey) {
      const record = await recordInboundEvent(supabase, idempotencyKey, event || payload?.event || null, "kapso", payload);
      if (record.duplicate) {
        return new Response(JSON.stringify({ success: true, duplicate: true }), { headers });
      }
      eventId = record.eventId;
    }

    const url = new URL(req.url);
    const uid = url.searchParams.get("uid");
    const mode = url.searchParams.get("mode");
    const requestedMode = mode === "customer" || mode === "internal" ? mode : null;

    runInBackground((async () => {
      try {
        await processInboundMessage(supabase, payload, message, {
          uid,
          requestedMode,
          webhookSecretSet: !!KAPSO_WEBHOOK_SECRET,
        });
        await markInboundEvent(supabase, eventId, "processed");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Internal error";
        console.error("kapso-webhook processing error:", err);
        await logAnalyticsEvent(supabase, null, "webhook_function_error", { error: errorMessage });
        await markInboundEvent(supabase, eventId, "failed", errorMessage);
      }
    })());

    return new Response(JSON.stringify({ success: true, accepted: true }), { headers });
  } catch (err) {
    console.error("kapso-webhook error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    try {
      await logAnalyticsEvent(supabase, null, "webhook_function_error", {
        error: message,
      });
    } catch (logErr) {
      console.error("Failed to log webhook function error:", logErr);
    }
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
