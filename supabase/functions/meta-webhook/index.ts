// Direct Meta WhatsApp Cloud API webhook (no BSP).
// GET  — Meta's hub.challenge verification handshake.
// POST — verify X-Hub-Signature-256, fast-ack, process messages in the background.
// Routes by phone_number_id: the matching kapso_connections row must have
// whatsapp_provider = 'meta' so replies go out through the Graph API.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getMetaVerifyToken, verifyMetaSignature } from "../_shared/meta.ts";
import {
  logAnalyticsEvent,
  markInboundEvent,
  recordInboundEvent,
  runInBackground,
} from "../_shared/whatsapp_core.ts";
import { extractMetaEvents, hasMediaMessage, parseKapsoMessage } from "../_shared/whatsapp_normalize.ts";
import { processInboundMessage } from "../_shared/whatsapp_router.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const headers = { "Content-Type": "application/json" };

serve(async (req) => {
  const url = new URL(req.url);

  // ── Meta webhook verification challenge (GET) ────────────────────────────
  if (req.method === "GET") {
    const hubMode = url.searchParams.get("hub.mode");
    const hubChallenge = url.searchParams.get("hub.challenge");
    const hubVerifyToken = url.searchParams.get("hub.verify_token");
    const verifyToken = getMetaVerifyToken();

    if (hubMode === "subscribe" && verifyToken && hubVerifyToken === verifyToken && hubChallenge) {
      return new Response(hubChallenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Not found", { status: 404 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Hub-Signature-256") || req.headers.get("X-Hub-Signature");
    const validSignature = await verifyMetaSignature(rawBody, signature);
    if (!validSignature) {
      await logAnalyticsEvent(supabase, null, "meta_invalid_signature", {
        has_signature: !!signature,
      }, "meta_webhook");
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers });
    }

    const payload = JSON.parse(rawBody);
    // Status updates (sent/delivered/read/failed) carry no messages — ack them.
    const events = extractMetaEvents(payload, "meta");
    if (!events.length) {
      return new Response(JSON.stringify({ success: true, ignored: "no message" }), { headers });
    }

    const accepted: string[] = [];
    for (const normalized of events) {
      const message = parseKapsoMessage(normalized);
      if (!message?.phoneNumberId || (!message.text && !hasMediaMessage(message))) continue;

      let eventId: string | null = null;
      if (message.messageId) {
        const record = await recordInboundEvent(
          supabase,
          `meta:${message.messageId}`,
          "whatsapp.message.received",
          "meta",
          normalized,
        );
        if (record.duplicate) continue;
        eventId = record.eventId;
      }
      accepted.push(message.messageId || "unknown");

      runInBackground((async () => {
        try {
          await processInboundMessage(supabase, normalized, message, { provider: "meta" });
          await markInboundEvent(supabase, eventId, "processed");
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Internal error";
          console.error("meta-webhook processing error:", err);
          await logAnalyticsEvent(supabase, null, "meta_webhook_function_error", { error: errorMessage }, "meta_webhook");
          await markInboundEvent(supabase, eventId, "failed", errorMessage);
        }
      })());
    }

    // Always 200 quickly — Meta retries and eventually pauses slow/failing endpoints.
    return new Response(JSON.stringify({ success: true, accepted: accepted.length }), { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("meta-webhook error:", err);
    await logAnalyticsEvent(supabase, null, "meta_webhook_function_error", { error: message }, "meta_webhook");
    // Malformed body: still 200 so Meta does not hammer retries for junk we can't parse.
    return new Response(JSON.stringify({ success: true, ignored: message }), { headers });
  }
});
