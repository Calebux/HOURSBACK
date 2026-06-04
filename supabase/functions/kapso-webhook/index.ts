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

type ParsedOrder = {
  items?: Array<{ name: string; qty?: number | null; unit_price?: number | null }>;
  delivery_address?: string | null;
  payment_method?: string | null;
  customer_name?: string | null;
  notes?: string | null;
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

function looksLikeWorkflowRequest(text: string) {
  return /\b(schedule|send|deliver|every day|daily|weekly|monthly|every week|report|p&l|profit and loss|pdf|email)\b/i.test(text)
    && /\b(workflow|report|summary|p&l|profit and loss|sales)\b/i.test(text);
}

function parseWorkflowRequest(text: string) {
  const cadence = /\b(monthly|every month)\b/i.test(text)
    ? "monthly"
    : /\b(weekly|every week)\b/i.test(text)
      ? "weekly"
      : /\b(daily|every day)\b/i.test(text)
        ? "daily"
        : "one_off";
  const wantsEmail = /\bemail\b/i.test(text);
  const wantsWhatsapp = /\bwhatsapp|wa\b/i.test(text);
  const wantsPdf = /\bpdf|document|doc\b/i.test(text);
  const reportType = /\bp&l|profit and loss|profit\b/i.test(text) ? "profit_and_loss" : "sales_summary";
  return { cadence, wantsEmail, wantsWhatsapp, wantsPdf, reportType };
}

async function saveWorkflowRequest(supabase: any, connection: any, message: ParsedMessage, text: string) {
  const parsed = parseWorkflowRequest(text);
  await supabase.from("kapso_workflow_requests").insert({
    user_id: connection.user_id,
    connection_id: connection.id,
    from_number: message.from || null,
    request_text: text,
    parsed_intent: parsed,
  });

  return [
    "Workflow request saved as a draft.",
    `${parsed.cadence.replace(/_/g, " ")} ${parsed.reportType.replace(/_/g, " ")}${parsed.wantsPdf ? " as PDF" : ""}${parsed.wantsEmail ? " by email" : ""}${parsed.wantsWhatsapp ? " to WhatsApp" : ""}.`,
    "Open Hoursback Workflows to review and activate it.",
  ].join("\n");
}

function looksLikeCloseoutStart(text: string) {
  return /^(\/)?(close|closeout|close out|end day|eod)\b/i.test(text.trim());
}

function looksLikeOrderMessage(text: string) {
  return /\b(order|deliver|delivery|pickup|buy|want|need|send me|i'll take|i want)\b/i.test(text)
    || /\b(bowl|plate|pack|piece|pcs|rice|chicken|drink|coke|shawarma|pizza|burger)\b/i.test(text);
}

async function parseOrderWithAI(text: string): Promise<ParsedOrder> {
  if (!ANTHROPIC_API_KEY) {
    return { items: [{ name: text, qty: null, unit_price: null }], delivery_address: null, payment_method: null, notes: text };
  }

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const parseRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 260,
      messages: [{
        role: "user",
        content: `Extract a customer WhatsApp order from this message: "${text}"\nReturn JSON only:\n{"items":[{"name":string,"qty":number|null,"unit_price":number|null}],"delivery_address":string|null,"payment_method":string|null,"customer_name":string|null,"notes":string|null}\nIf the customer is only answering a missing detail, return empty items and fill the detail.`,
      }],
    });
    const raw = (parseRes.content[0] as { text: string }).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("WhatsApp order parse error:", err);
  }

  return { items: [{ name: text, qty: null, unit_price: null }], delivery_address: null, payment_method: null, notes: text };
}

function orderItemsSummary(items: any[]) {
  if (!items?.length) return "your order";
  return items.map((item) => `${item.qty ? `${item.qty} x ` : ""}${item.name}`).join(", ");
}

async function handleCustomerOrder(supabase: any, connection: any, message: ParsedMessage, text: string) {
  const parsed = await parseOrderWithAI(text);
  const { data: openOrders } = await supabase
    .from("kapso_orders")
    .select("*")
    .eq("user_id", connection.user_id)
    .eq("customer_phone", message.from || "")
    .eq("status", "needs_details")
    .order("created_at", { ascending: false })
    .limit(1);

  const existing = openOrders?.[0];
  const parsedItems = Array.isArray(parsed.items) ? parsed.items.filter((item) => item?.name) : [];
  const items = parsedItems.length ? parsedItems : existing?.items || [];
  const deliveryAddress = parsed.delivery_address || existing?.delivery_address || null;
  const paymentMethod = parsed.payment_method || existing?.payment_method || null;
  const customerName = parsed.customer_name || existing?.customer_name || message.contactName || null;
  const status = items.length && deliveryAddress ? "confirmed" : "needs_details";

  const payload = {
    user_id: connection.user_id,
    connection_id: connection.id,
    customer_phone: message.from || null,
    customer_name: customerName,
    status,
    items,
    delivery_address: deliveryAddress,
    payment_method: paymentMethod,
    notes: parsed.notes || existing?.notes || null,
    raw_text: existing?.raw_text ? `${existing.raw_text}\n${text}` : text,
    source_message_id: message.messageId || existing?.source_message_id || null,
    confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const result = existing
    ? await supabase.from("kapso_orders").update(payload).eq("id", existing.id).select("*").single()
    : await supabase.from("kapso_orders").insert(payload).select("*").single();
  if (result.error) throw result.error;

  if (!items.length) {
    return "I can help with your order. What would you like to buy?";
  }
  if (!deliveryAddress) {
    return `Got it: ${orderItemsSummary(items)}.\nPlease send your delivery address or say pickup.`;
  }

  return [
    "Order confirmed.",
    `Items: ${orderItemsSummary(items)}`,
    `Delivery: ${deliveryAddress}`,
    paymentMethod ? `Payment: ${paymentMethod}` : "Payment: not specified",
    "A staff member will follow up if anything is unclear.",
  ].join("\n");
}

function moneyFromLabel(text: string, labels: string[]) {
  const labelPattern = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = text.match(new RegExp(`(?:${labelPattern})(?:\\s+(?:total|amount|at hand))?\\s*[:=\\-]?\\s*(?:₦|ngn|naira)?\\s*([0-9][0-9,]*(?:\\.\\d+)?)`, "i"));
  if (!match) return null;
  return Number(match[1].replace(/,/g, ""));
}

function parseCloseoutFallback(text: string) {
  return {
    cash_total: moneyFromLabel(text, ["cash", "cash at hand", "cash total"]),
    pos_total: moneyFromLabel(text, ["pos", "card", "terminal"]),
    transfer_total: moneyFromLabel(text, ["transfer", "bank", "bank transfer"]),
    expenses_total: moneyFromLabel(text, ["expenses", "expense", "spent"]),
    notes: null,
  };
}

async function parseCloseoutWithAI(text: string) {
  const fallback = parseCloseoutFallback(text);
  if (!ANTHROPIC_API_KEY) return fallback;

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const parseRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 180,
      messages: [{
        role: "user",
        content: `Extract end-of-day closeout totals from this WhatsApp message: "${text}"\nReturn JSON only, no explanation:\n{"cash_total":number|null,"pos_total":number|null,"transfer_total":number|null,"expenses_total":number|null,"notes":string|null}\nUse null when a total is not mentioned. Do not invent numbers.`,
      }],
    });
    const raw = (parseRes.content[0] as { text: string }).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return { ...fallback, ...JSON.parse(jsonMatch[0]) };
  } catch (err) {
    console.error("WhatsApp closeout parse error:", err);
  }

  return fallback;
}

function closeoutPrompt() {
  return [
    "Closeout started.",
    "Reply with today's totals like:",
    "Cash 39000, POS 12000, Transfer 34000, Expenses 7500",
    "Send cancel closeout to stop.",
  ].join("\n");
}

function getTodayStart() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

async function getDailyTotals(supabase: any, userId: string) {
  const start = getTodayStart();
  const { data: entries } = await supabase
    .from("bot_entries")
    .select("entry_type, parsed_data, created_at")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());

  const rows = entries || [];
  return {
    entries: rows.length,
    sales: rows
      .filter((e: any) => e.entry_type === "sale")
      .reduce((sum: number, e: any) => sum + Number(e.parsed_data?.total || 0), 0),
    expenses: rows
      .filter((e: any) => e.entry_type === "expense")
      .reduce((sum: number, e: any) => sum + Number(e.parsed_data?.total || 0), 0),
  };
}

function classifyCloseoutVariance(variance: number) {
  if (Math.abs(variance) < 1) return "balanced";
  return variance < 0 ? "short" : "over";
}

async function findActiveCloseoutSession(supabase: any, userId: string, fromNumber?: string) {
  if (!fromNumber) return null;
  const { data } = await supabase
    .from("kapso_closeout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("from_number", fromNumber)
    .eq("status", "awaiting_closeout")
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(1);

  return data?.[0] || null;
}

async function saveCloseout(supabase: any, connection: any, message: ParsedMessage, text: string) {
  const parsed = await parseCloseoutWithAI(text);
  const values = [parsed.cash_total, parsed.pos_total, parsed.transfer_total, parsed.expenses_total];
  if (!values.some((value) => typeof value === "number" && Number.isFinite(value))) {
    return { saved: false, reply: `I couldn't find the closeout totals.\n\n${closeoutPrompt()}` };
  }

  const cashTotal = Number(parsed.cash_total || 0);
  const posTotal = Number(parsed.pos_total || 0);
  const transferTotal = Number(parsed.transfer_total || 0);
  const expensesTotal = Number(parsed.expenses_total || 0);
  const actualCollectedTotal = cashTotal + posTotal + transferTotal;
  const totals = await getDailyTotals(supabase, connection.user_id);
  const variance = actualCollectedTotal - totals.sales;
  const status = classifyCloseoutVariance(variance);

  await supabase.from("kapso_closeouts").insert({
    user_id: connection.user_id,
    connection_id: connection.id,
    from_number: message.from || null,
    staff_name: message.contactName || message.from || "WhatsApp",
    expected_sales_total: totals.sales,
    expected_expenses_total: totals.expenses,
    cash_total: cashTotal,
    pos_total: posTotal,
    transfer_total: transferTotal,
    expenses_total: expensesTotal,
    actual_collected_total: actualCollectedTotal,
    variance_total: variance,
    status,
    notes: parsed.notes || null,
    raw_text: text,
  });

  if (message.from) {
    await supabase
      .from("kapso_closeout_sessions")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("user_id", connection.user_id)
      .eq("from_number", message.from)
      .eq("status", "awaiting_closeout");
  }

  const statusLine = status === "balanced"
    ? "Balanced."
    : status === "short"
      ? `Short by ₦${Math.abs(variance).toLocaleString()}. Review needed.`
      : `Over by ₦${Math.abs(variance).toLocaleString()}. Review needed.`;

  return {
    saved: true,
    reply: [
      "Day closed.",
      `Logged sales: ₦${totals.sales.toLocaleString()}`,
      `Collected: ₦${actualCollectedTotal.toLocaleString()} (cash ₦${cashTotal.toLocaleString()}, POS ₦${posTotal.toLocaleString()}, transfer ₦${transferTotal.toLocaleString()})`,
      `Expenses reported: ₦${expensesTotal.toLocaleString()}`,
      statusLine,
    ].join("\n"),
  };
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
  const start = getTodayStart();

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
  const { data: closeouts } = await supabase
    .from("kapso_closeouts")
    .select("actual_collected_total, variance_total, status, created_at")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: false })
    .limit(1);
  const latestCloseout = closeouts?.[0];

  return [
    `Today so far:`,
    `Sales: ₦${totalSales.toLocaleString()}`,
    `Expenses: ₦${totalExpenses.toLocaleString()}`,
    `Entries logged: ${rows.length}`,
    topItem ? `Top item: ${topItem[0]} (${topItem[1]} units/entries)` : `Top item: none yet`,
    latestCloseout
      ? `Closeout: ${latestCloseout.status.replace(/_/g, " ")} (collected ₦${Number(latestCloseout.actual_collected_total || 0).toLocaleString()}, variance ₦${Number(latestCloseout.variance_total || 0).toLocaleString()})`
      : `Closeout: not done yet`,
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
    let query = supabase.from("kapso_connections").select("*").limit(2);
    query = uid
      ? query.eq("user_id", uid).eq("phone_number_id", message.phoneNumberId)
      : query.eq("phone_number_id", message.phoneNumberId);

    let { data: connections, error: connectionError } = await query;
    if (connectionError) throw connectionError;
    let connection = connections?.[0];
    if (!connection && uid) {
      const fallback = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", uid)
        .order("connection_type", { ascending: true })
        .limit(1);
      if (fallback.error) throw fallback.error;
      connections = fallback.data;
      connection = connections?.[0];
    }
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

    const activeCloseoutSession = await findActiveCloseoutSession(supabase, connection.user_id, message.from);

    if (connection.connection_type === "customer") {
      if (looksLikeWorkflowRequest(text)) {
        reply = await saveWorkflowRequest(supabase, connection, message, text);
      } else if (looksLikeOrderMessage(text)) {
        reply = await handleCustomerOrder(supabase, connection, message, text);
      } else {
        reply = "Hi. Send your order here, for example: “I want 3 rice bowls and 2 chicken delivered to Lekki.”";
      }
    } else if (activeCloseoutSession && /\b(cancel|stop)\b/i.test(text)) {
      await supabase
        .from("kapso_closeout_sessions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", activeCloseoutSession.id);
      reply = "Closeout cancelled.";
    } else if (activeCloseoutSession) {
      const closeout = await saveCloseout(supabase, connection, message, text);
      reply = closeout.reply;
    } else if (looksLikeCloseoutStart(text)) {
      const hasTotals = /\d/.test(text);
      if (hasTotals) {
        const closeout = await saveCloseout(supabase, connection, message, text);
        reply = closeout.reply;
      } else if (message.from) {
        await supabase
          .from("kapso_closeout_sessions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("user_id", connection.user_id)
          .eq("from_number", message.from)
          .eq("status", "awaiting_closeout");

        await supabase.from("kapso_closeout_sessions").insert({
          user_id: connection.user_id,
          connection_id: connection.id,
          from_number: message.from,
          status: "awaiting_closeout",
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        });
        reply = closeoutPrompt();
      } else {
        reply = closeoutPrompt();
      }
    } else if (looksLikeWorkflowRequest(text)) {
      reply = await saveWorkflowRequest(supabase, connection, message, text);
    } else if (looksLikeSummaryQuestion(text)) {
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
