import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";
import { sendKapsoText } from "../_shared/kapso.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const KAPSO_WEBHOOK_SECRET = Deno.env.get("KAPSO_WEBHOOK_SECRET") || "";

const headers = { "Content-Type": "application/json" };

type ParsedMessage = {
  messageId?: string;
  phoneNumberId?: string;
  from?: string;
  to?: string;
  contactName?: string;
  type?: string;
  text?: string;
};

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function verifySignature(rawBody: string, signature: string | null) {
  if (!KAPSO_WEBHOOK_SECRET) return true;
  if (!signature) return false;
  const normalizedSignature = signature.replace(/^sha256=/i, "").trim();

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(KAPSO_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = bytesToHex(await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  ));
  return timingSafeEqual(normalizedSignature, expected);
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function parseKapsoMessage(payload: any): ParsedMessage | null {
  const data = payload?.data || payload;
  const msg = data?.message || data?.messages?.[0] || data;
  const conversation = data?.conversation || payload?.conversation || {};
  const kapso = msg?.kapso || data?.kapso || {};
  const conversationKapso = conversation?.kapso || {};
  const text = firstString(
    msg?.text?.body,
    data?.text?.body,
    typeof msg?.text === "string" ? msg.text : undefined,
    typeof data?.text === "string" ? data.text : undefined,
    msg?.kapso?.transcript?.text,
    data?.kapso?.transcript?.text,
    conversationKapso?.last_message_text,
    kapso?.content,
    msg?.content,
    data?.content
  );

  return {
    messageId: firstString(msg?.id, data?.id, data?.message_id, msg?.whatsapp_message_id),
    phoneNumberId: firstString(
      data?.phone_number_id,
      payload?.phone_number_id,
      conversation?.phone_number_id,
      kapso?.phone_number_id,
      msg?.phone_number_id
    ),
    from: firstString(
      msg?.from,
      data?.from,
      kapso?.from,
      conversation?.phone_number,
      data?.contact?.wa_id,
      conversation?.business_scoped_user_id,
      conversation?.username
    ),
    to: firstString(msg?.to, data?.to, kapso?.to),
    contactName: firstString(conversationKapso?.contact_name, kapso?.contact_name, data?.contact?.name, data?.profile?.name),
    type: firstString(msg?.type, data?.type) || (text ? "text" : undefined),
    text,
  };
}

function looksLikeSalesEntry(text: string) {
  return /\b(sold|sell|sale|sales|spent|expense|bought|paid|cash|transfer|pos|₦|ngn|naira)\b/i.test(text);
}

function looksLikeSummaryQuestion(text: string) {
  return /\b(how much|total|summary|sold most|top item|today|sales today|what sold|report)\b/i.test(text);
}

async function parseEntryWithAI(text: string) {
  if (!ANTHROPIC_API_KEY) {
    return { entry_type: "note", item: null, qty: null, unit_price: null, total: null, customer: null, notes: text };
  }

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const parseRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      messages: [{
        role: "user",
        content: `Extract a structured business log entry from this WhatsApp message: "${text}"\nReturn JSON only, no explanation:\n{"entry_type":"sale"|"expense"|"note","item":string|null,"qty":number|null,"unit_price":number|null,"total":number|null,"customer":string|null,"notes":string|null}\nIf a field is not mentioned, use null.`,
      }],
    });
    const raw = (parseRes.content[0] as { text: string }).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("WhatsApp parse error:", err);
  }

  return { entry_type: "note", item: null, qty: null, unit_price: null, total: null, customer: null, notes: text };
}

async function buildSalesSummary(supabase: any, userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data: entries } = await supabase
    .from("bot_entries")
    .select("entry_type, parsed_data, triggered_by, created_at")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: false });

  const rows = entries || [];
  const sales = rows.filter((e: any) => e.entry_type === "sale");
  const expenses = rows.filter((e: any) => e.entry_type === "expense");
  const totalSales = sales.reduce((sum: number, e: any) => sum + Number(e.parsed_data?.total || 0), 0);
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.parsed_data?.total || 0), 0);
  const counts = new Map<string, number>();
  for (const e of sales) {
    const item = e.parsed_data?.item || "Unspecified";
    counts.set(item, (counts.get(item) || 0) + Number(e.parsed_data?.qty || 1));
  }
  const topItem = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  return [
    `Today so far:`,
    `Sales: ₦${totalSales.toLocaleString()}`,
    `Expenses: ₦${totalExpenses.toLocaleString()}`,
    `Entries logged: ${rows.length}`,
    topItem ? `Top item: ${topItem[0]} (${topItem[1]} units/entries)` : `Top item: none yet`,
  ].join("\n");
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Not found", { status: 404 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const signature = firstString(
      req.headers.get("X-Webhook-Signature"),
      req.headers.get("X-Kapso-Signature"),
      req.headers.get("X-Signature")
    );
    const isValid = await verifySignature(rawBody, signature || null);
    if (!isValid) {
      console.log("Kapso webhook rejected: invalid signature", { hasSignature: !!signature });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers });
    }

    const idempotencyKey = req.headers.get("X-Idempotency-Key");
    if (idempotencyKey) {
      const { error } = await supabase.from("kapso_webhook_events").insert({
        idempotency_key: idempotencyKey,
        event: req.headers.get("X-Webhook-Event") || payload?.event || null,
      });
      if (error?.code === "23505") {
        return new Response(JSON.stringify({ success: true, duplicate: true }), { headers });
      }
    }

    const event = firstString(req.headers.get("X-Webhook-Event"), payload?.event);
    if (event && event !== "whatsapp.message.received") {
      return new Response(JSON.stringify({ success: true, ignored: true }), { headers });
    }

    const message = parseKapsoMessage(payload);
    if (!message?.text || !message.phoneNumberId) {
      console.log("Kapso webhook ignored: no text or phone number id", {
        hasText: !!message?.text,
        phoneNumberId: message?.phoneNumberId || null,
        event: event || null,
      });
      return new Response(JSON.stringify({ success: true, ignored: "no text message" }), { headers });
    }

    const uid = new URL(req.url).searchParams.get("uid");
    let query = supabase.from("kapso_connections").select("*").limit(1);
    query = uid
      ? query.eq("user_id", uid)
      : query.eq("phone_number_id", message.phoneNumberId);

    const { data: connections, error: connectionError } = await query;
    if (connectionError) throw connectionError;
    let connection = connections?.[0];
    if (!connection) {
      if (!uid) {
        console.log("Kapso webhook ignored: no matching connection", { phoneNumberId: message.phoneNumberId });
        return new Response(JSON.stringify({ success: true, ignored: "no matching connection" }), { headers });
      }

      const { data: createdConnection, error: createConnectionError } = await supabase
        .from("kapso_connections")
        .insert({
          user_id: uid,
          phone_number_id: message.phoneNumberId,
          phone_number: message.to || null,
          display_name: "Kapso WhatsApp",
          status: "connected",
          webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
          last_webhook_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (createConnectionError) throw createConnectionError;
      connection = createdConnection;
    }

    await supabase.from("kapso_connections").update({
      phone_number_id: message.phoneNumberId,
      phone_number: connection.phone_number || message.to || null,
      status: "connected",
      last_webhook_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", connection.id);

    await supabase.from("kapso_messages").insert({
      user_id: connection.user_id,
      connection_id: connection.id,
      kapso_message_id: message.messageId || null,
      phone_number_id: message.phoneNumberId,
      direction: "inbound",
      from_number: message.from || null,
      to_number: message.to || null,
      contact_name: message.contactName || null,
      message_type: message.type || null,
      content: message.text,
      raw_payload: payload,
    });

    let reply = "";
    const text = message.text.trim();

    if (looksLikeSummaryQuestion(text)) {
      reply = await buildSalesSummary(supabase, connection.user_id);
    } else if (looksLikeSalesEntry(text) || text.toLowerCase().startsWith("/log ")) {
      const logText = text.toLowerCase().startsWith("/log ") ? text.slice(5).trim() : text;
      const parsed = await parseEntryWithAI(logText);
      const entryType = parsed.entry_type || "sale";
      await supabase.from("bot_entries").insert({
        user_id: connection.user_id,
        chat_id: 0,
        triggered_by: message.contactName || message.from || "WhatsApp",
        role: "staff",
        raw_text: logText,
        entry_type: entryType,
        parsed_data: parsed,
        source: "whatsapp_text",
        channel: "whatsapp",
      });

      const lines = [`Logged from WhatsApp.`];
      lines.push(`Type: ${entryType === "expense" ? "Expense" : entryType === "note" ? "Note" : "Sale"}`);
      if (parsed.item) lines.push(`Item: ${parsed.item}${parsed.qty ? ` x ${parsed.qty}` : ""}`);
      if (parsed.total) lines.push(`Amount: ₦${Number(parsed.total).toLocaleString()}`);
      if (parsed.customer) lines.push(`Customer: ${parsed.customer}`);
      reply = lines.join("\n");
    } else {
      reply = "Received. Send a sales update like “Sold 5 jollof, 3 chicken. Transfer ₦42,000” or ask “How much did we sell today?”";
    }

    if (message.from && reply) {
      try {
        const sendResult = await sendKapsoText(message.phoneNumberId, message.from, reply);
        await supabase.from("kapso_messages").insert({
          user_id: connection.user_id,
          connection_id: connection.id,
          kapso_message_id: sendResult?.messages?.[0]?.id || null,
          phone_number_id: message.phoneNumberId,
          direction: "outbound",
          from_number: message.to || null,
          to_number: message.from,
          message_type: "text",
          content: reply,
          raw_payload: sendResult,
        });
      } catch (err) {
        console.error("Kapso reply failed after inbound processing:", err);
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers });
  } catch (err) {
    console.error("kapso-webhook error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers });
  }
});
