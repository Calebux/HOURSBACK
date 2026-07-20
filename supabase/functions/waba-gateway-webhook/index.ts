// WABA gateway provider adapter: verify signature, normalize the gateway's
// Meta-flavoured payload, fast-ack, and process through the shared router.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  firstString,
  logAnalyticsEvent,
  markInboundEvent,
  recordInboundEvent,
  runInBackground,
  verifyHmacSignature,
} from "../_shared/whatsapp_core.ts";
import { hasMediaMessage, parseKapsoMessage } from "../_shared/whatsapp_normalize.ts";
import { processInboundMessage } from "../_shared/whatsapp_router.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WABA_GATEWAY_WEBHOOK_SECRET = Deno.env.get("WABA_GATEWAY_WEBHOOK_SECRET") || "";
const KAPSO_WEBHOOK_SECRET = Deno.env.get("KAPSO_WEBHOOK_SECRET") || "";

const headers = { "Content-Type": "application/json" };

function normalizeGatewayPayload(payload: any, eventHeader: string | null) {
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
      await logAnalyticsEvent(supabase, uid, "waba_gateway_missing_secret", { mode }, "waba_gateway_webhook");
      return new Response(JSON.stringify({ error: "WABA gateway webhook secret is not configured" }), { status: 500, headers });
    }

    const valid = await verifyHmacSignature(rawBody, signature || null, gatewaySecret);
    if (!valid) {
      await logAnalyticsEvent(supabase, uid, "waba_gateway_invalid_signature", {
        mode,
        has_signature: !!signature,
        event: req.headers.get("X-Webhook-Event"),
      }, "waba_gateway_webhook");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers });
    }

    const payload = JSON.parse(rawBody);
    const normalized = normalizeGatewayPayload(payload, req.headers.get("X-Webhook-Event"));
    const message = parseKapsoMessage(normalized);
    if (!normalized.phone_number_id || !message?.from || (!message.text && !hasMediaMessage(message))) {
      await logAnalyticsEvent(supabase, uid, "waba_gateway_unusable_payload", {
        mode,
        has_phone_number_id: !!normalized.phone_number_id,
        has_from: !!message?.from,
      }, "waba_gateway_webhook");
      return new Response(JSON.stringify({ success: true, ignored: "no usable message" }), { headers });
    }

    const idempotencyKey = firstString(
      req.headers.get("X-Idempotency-Key"),
      message.messageId ? `waba-gateway:${message.messageId}` : undefined,
    );
    let eventId: string | null = null;
    if (idempotencyKey) {
      const record = await recordInboundEvent(supabase, idempotencyKey, normalized.event, "waba_gateway", normalized);
      if (record.duplicate) {
        return new Response(JSON.stringify({ success: true, duplicate: true }), { headers });
      }
      eventId = record.eventId;
    }

    runInBackground((async () => {
      try {
        await processInboundMessage(supabase, normalized, message, {
          uid,
          requestedMode: mode,
          provider: "waba_gateway",
          webhookSecretSet: !!gatewaySecret,
        });
        await markInboundEvent(supabase, eventId, "processed");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Internal error";
        console.error("waba-gateway-webhook processing error:", err);
        await logAnalyticsEvent(supabase, uid, "waba_gateway_function_error", { mode, error: errorMessage }, "waba_gateway_webhook");
        await markInboundEvent(supabase, eventId, "failed", errorMessage);
      }
    })());

    return new Response(JSON.stringify({ success: true, accepted: true }), { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("waba-gateway-webhook error:", err);
    await logAnalyticsEvent(supabase, uid, "waba_gateway_function_error", { mode, error: message }, "waba_gateway_webhook");
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
