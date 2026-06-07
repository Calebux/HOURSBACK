import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";
import { getKapsoApiKey, sendKapsoText } from "../_shared/kapso.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const KAPSO_WEBHOOK_SECRET = Deno.env.get("KAPSO_WEBHOOK_SECRET") || "";
const KAPSO_ALLOW_UNSIGNED_WEBHOOKS = Deno.env.get("KAPSO_ALLOW_UNSIGNED_WEBHOOKS") === "true";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "https://www.hoursback.xyz";

const headers = { "Content-Type": "application/json" };

type ParsedMessage = {
  messageId?: string;
  phoneNumberId?: string;
  from?: string;
  to?: string;
  contactName?: string;
  type?: string;
  direction?: string;
  text?: string;
  receiptUrl?: string;
};

type ParsedOrder = {
  items?: Array<{ name: string; qty?: number | null; unit_price?: number | null }>;
  delivery_address?: string | null;
  payment_method?: string | null;
  customer_name?: string | null;
  notes?: string | null;
};

type CustomerAIAction =
  | "answer"
  | "order"
  | "payment_claim"
  | "receipt_submitted"
  | "workflow_request"
  | "handoff";

type CustomerAIResponse = {
  action: CustomerAIAction;
  reply?: string | null;
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

async function logAnalyticsEvent(
  supabase: any,
  userId: string | null,
  eventName: string,
  properties: Record<string, unknown> = {},
  source = "webhook",
) {
  try {
    await supabase.from("app_analytics_events").insert({
      user_id: userId,
      event_name: eventName,
      properties,
      source,
    });
  } catch (err) {
    console.error("Analytics event log failed:", err);
  }
}

async function getProfile(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function findReceiptUrl(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const embeddedUrl = trimmed.match(/https?:\/\/[^\s)]+/i)?.[0];
    if (embeddedUrl) return embeddedUrl;
  }
  return undefined;
}

function extensionForContentType(contentType: string) {
  if (/png/i.test(contentType)) return "png";
  if (/webp/i.test(contentType)) return "webp";
  if (/pdf/i.test(contentType)) return "pdf";
  return "jpg";
}

async function persistReceiptMedia(supabase: any, order: any, message: ParsedMessage, receiptUrl: string | null) {
  if (!receiptUrl) {
    return { status: "failed", error: "No receipt media URL found" };
  }

  try {
    const apiKey = getKapsoApiKey();
    const response = await fetch(receiptUrl, {
      headers: apiKey
        ? {
            "X-API-Key": apiKey,
            "Authorization": `Bearer ${apiKey}`,
          }
        : undefined,
    });
    if (!response.ok) throw new Error(`Receipt fetch failed with ${response.status}`);

    const maxReceiptBytes = 8 * 1024 * 1024;
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > maxReceiptBytes) {
      throw new Error("Receipt file is larger than 8MB");
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!/^image\//i.test(contentType) && !/application\/pdf/i.test(contentType)) {
      throw new Error(`Unsupported receipt content type: ${contentType}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxReceiptBytes) {
      throw new Error("Receipt file is larger than 8MB");
    }
    const ext = extensionForContentType(contentType);
    const messageId = String(message.messageId || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, "_");
    const path = `${order.user_id}/${order.id}/${messageId}.${ext}`;

    const { error } = await supabase.storage
      .from("kapso-receipts")
      .upload(path, arrayBuffer, {
        contentType,
        upsert: true,
      });
    if (error) throw error;

    return {
      status: "saved",
      path,
      filename: `receipt-${messageId}.${ext}`,
      contentType,
    };
  } catch (err) {
    console.error("Receipt media persistence failed:", err);
    return {
      status: "failed",
      error: err instanceof Error ? err.message : "Receipt media persistence failed",
    };
  }
}

function parseKapsoMessage(payload: any): ParsedMessage | null {
  const data = payload?.data || payload;
  const msg = data?.message || data?.messages?.[0] || data;
  const conversation = data?.conversation || payload?.conversation || {};
  const kapso = msg?.kapso || data?.kapso || {};
  const conversationKapso = conversation?.kapso || {};
  const text = firstString(
    msg?.text?.body,
    msg?.image?.caption,
    msg?.document?.caption,
    msg?.video?.caption,
    data?.text?.body,
    data?.image?.caption,
    data?.document?.caption,
    data?.video?.caption,
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
    direction: firstString(kapso?.direction, data?.direction, msg?.direction, conversationKapso?.direction),
    text,
    receiptUrl: findReceiptUrl(
      msg?.image?.url,
      msg?.image?.link,
      msg?.document?.url,
      msg?.document?.link,
      msg?.video?.url,
      msg?.video?.link,
      msg?.media?.url,
      msg?.media_url,
      msg?.kapso?.media_url,
      msg?.kapso?.attachment_url,
      data?.image?.url,
      data?.image?.link,
      data?.document?.url,
      data?.document?.link,
      data?.media?.url,
      data?.media_url,
      data?.kapso?.media_url,
      data?.attachments?.[0]?.url,
      payload?.attachments?.[0]?.url,
      text
    ),
  };
}

function looksLikeSalesEntry(text: string) {
  return /\b(sold|sell|sale|sales|spent|expense|bought|paid|cash|transfer|pos|₦|ngn|naira)\b/i.test(text);
}

function looksLikeSummaryQuestion(text: string) {
  return /\b(how much|total|summary|sold most|top item|today|sales today|what sold|report|5\s*-?\s*liner?|five\s*-?\s*line)\b/i.test(text);
}

function looksLikeWorkflowRequest(text: string) {
  return /\b(schedule|deliver|every day|daily|weekly|monthly|every week|workflow|pdf|email|whatsapp)\b/i.test(text)
    && /\b(workflow|report|summary|p&l|profit and loss|sales|5\s*-?\s*liner?|five\s*-?\s*line)\b/i.test(text);
}

function looksLikeRecurringWorkflowRequest(text: string) {
  return /\b(every day|every week|every month|daily|weekly|monthly|schedule|recurring|automatically|auto|deliver every)\b/i.test(text)
    && /\b(report|summary|p&l|profit and loss|sales|workflow|email|whatsapp|pdf)\b/i.test(text);
}

function looksLikeReportGenerationRequest(text: string) {
  if (looksLikeRecurringWorkflowRequest(text)) return false;
  if (looksLikeFiveLineSummary(text) && !/\b(report|pdf|email|generate|create|send)\b/i.test(text)) return false;
  return /\b(report|pdf|email|send|generate|create|p&l|profit and loss|profit\/loss|profit loss|sales summary|5\s*-?\s*liner?|five\s*-?\s*line)\b/i.test(text)
    && /\b(report|pdf|email|p&l|profit|sales|summary|5\s*-?\s*liner?|five\s*-?\s*line)\b/i.test(text);
}

function looksLikeProfitAndLossQuestion(text: string) {
  return /\b(p&l|profit and loss|profit\/loss|profit loss)\b/i.test(text);
}

function looksLikeFiveLineSummary(text: string) {
  return /\b(5\s*-?\s*liner?|five\s*-?\s*line|five\s+liner?)\b/i.test(text);
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

function generateOrderCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

function extractOrderCode(text: string) {
  const match = text.match(/\b(?:order\s*)?#?\s*([A-Z0-9]{8})\b/i);
  return match?.[1]?.toUpperCase() || null;
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
  return /\b(order|book|booking|appointment|deliver|delivery|pickup|pick up|buy|purchase|want|need|send me|i'll take|i want|reserve|request|quote|invoice)\b/i.test(text)
    || /\b(size|colour|color|service|repair|consultation|installation|subscription|package|unit|piece|pcs|pack|item|product)\b/i.test(text);
}

function looksLikePaymentConfirmation(text: string) {
  return /\b(paid|payment done|sent receipt|receipt sent|i have paid|i've paid|done payment|transfer(?:red)?|bank transfer done)\b/i.test(text);
}

function hasMediaMessage(message: ParsedMessage) {
  const type = String(message.type || "").toLowerCase();
  return ["image", "document", "video"].includes(type) || !!message.receiptUrl;
}

function looksLikeReceiptIntent(text: string) {
  return /\b(receipt|proof|payment proof|transfer receipt|bank receipt)\b/i.test(text)
    && /\b(sent|attached|upload|uploaded|here|proof|receipt)\b/i.test(text);
}

function looksLikeReceiptSubmission(text: string, message: ParsedMessage) {
  return looksLikeReceiptIntent(text) || (hasMediaMessage(message) && /\b(receipt|proof|paid|payment|transfer)\b/i.test(text));
}

function looksLikeNonPaymentMediaCaption(text: string) {
  return /\b(style|sample|reference|design|color|colour|size|damage|damaged|broken|fault|issue|photo of|picture of|this item|this product|inspiration)\b/i.test(text)
    && !/\b(receipt|proof|paid|payment|transfer)\b/i.test(text);
}

function looksLikeMenuRequest(text: string) {
  return /\b(menu|catalogue|catalog|service list|price list|pricelist|prices|how much|what do you sell|what services|what do you offer|what do you have|available items|available services|list of items|list of services)\b/i.test(text);
}

function extractAvailabilityItem(text: string) {
  const patterns = [
    /\b(?:do you have|have you got|is there|is|are)\s+(.+?)(?:\?| available| in stock|$)/i,
    /\b(.+?)\s+(?:available|in stock)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/\b(today|please|pls|now|for delivery|for pickup)\b/gi, "")
        .trim();
    }
  }
  return null;
}

function normalizeItemText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\b(x|and|with|the|a|an|some|any)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function menuHasItem(menu: string | null | undefined, item: string) {
  if (!menu || !item) return false;
  const normalizedMenu = normalizeItemText(menu);
  const normalizedItem = normalizeItemText(item);
  if (!normalizedItem) return false;
  if (normalizedMenu.includes(normalizedItem)) return true;

  const itemWords = normalizedItem.split(" ").filter((word) => word.length > 2);
  return itemWords.length > 0 && itemWords.every((word) =>
    normalizedMenu.includes(word) || normalizedMenu.includes(word.replace(/s$/, ""))
  );
}

function buildMenuReply(connection: any) {
  const menu = String(connection.customer_menu || "").trim();
  if (!menu) {
    return "The catalogue or service list is not configured yet. Please tell us what you need and a staff member will confirm availability.";
  }

  return [
    "Here is our catalogue / price list:",
    menu,
    "Send your order or request with delivery, pickup, appointment, or job details when ready.",
  ].join("\n");
}

function buildAvailabilityReply(connection: any, item: string) {
  const menu = String(connection.customer_menu || "").trim();
  if (!menu) {
    return `I need a staff member to confirm ${item}. The catalogue or service list is not configured yet.`;
  }

  if (menuHasItem(menu, item)) {
    return `Yes, ${item} is listed. Send the quantity and delivery, pickup, appointment, or job details to continue.`;
  }

  return `I cannot find ${item} on the current catalogue or service list. Here is what is listed:\n${menu}`;
}

function orderTotal(items: Array<{ unit_price?: number | null; qty?: number | null }>) {
  const total = items.reduce((sum, item) => {
    const qty = Number(item.qty || 1);
    const price = Number(item.unit_price || 0);
    return price > 0 ? sum + qty * price : sum;
  }, 0);
  return total > 0 ? total : null;
}

function isPickupDelivery(value: string | null | undefined) {
  return /^(pickup|pick up|collection|collect)$/i.test(String(value || "").trim());
}

function extractMoney(text: string) {
  const match = text.replace(/,/g, "").match(/(?:₦|ngn|naira)?\s*([0-9][0-9]*(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function deliveryFeeFromMenu(menu: string | null | undefined, deliveryAddress: string | null | undefined) {
  if (!menu || !deliveryAddress || isPickupDelivery(deliveryAddress)) return null;
  const address = String(deliveryAddress).toLowerCase();
  const deliveryLines = String(menu)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /\bdeliver|delivery\b/i.test(line));

  let fallback: number | null = null;
  for (const line of deliveryLines) {
    const amount = extractMoney(line);
    if (!amount) continue;
    const normalized = line.toLowerCase();
    if (/\boutside\b/.test(normalized)) {
      if (!fallback) fallback = amount;
      continue;
    }
    const locationMatch = normalized.match(/\b(?:within|to|in)\s+([a-z0-9\s-]+)/i);
    const location = locationMatch?.[1]?.replace(/[-–—].*$/, "").trim();
    if (location && address.includes(location)) return amount;
    if (!fallback) fallback = amount;
  }

  return fallback;
}

function expectedOrderTotal(items: any[], deliveryFee: number | null) {
  const itemTotal = orderTotal(items);
  if (!itemTotal && !deliveryFee) return null;
  return Number(itemTotal || 0) + Number(deliveryFee || 0);
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function parseClaimedPaymentAmount(text: string) {
  const normalized = text.replace(/,/g, "");
  const labelled = normalized.match(/\b(?:amount|amont|paid|payment|transferred|sent)\b\s*(?:was|is|of|for|:|-)?\s*(?:₦|ngn|naira)?\s*([0-9][0-9]*(?:\.\d+)?)/i);
  if (labelled) return Number(labelled[1]);

  const currency = normalized.match(/(?:₦|ngn|naira)\s*([0-9][0-9]*(?:\.\d+)?)/i);
  return currency ? Number(currency[1]) : null;
}

function cleanPaymentMethod(value: string | null | undefined) {
  const paymentMethod = String(value || "").trim();
  if (!paymentMethod) return null;
  if (/^(pickup|pick up|delivery|address|none|not specified)$/i.test(paymentMethod)) return null;
  return paymentMethod;
}

function isPickupReply(text: string) {
  return /^(pickup|pick up|collection|collect|i will pick up|i'll pick up)$/i.test(text.trim());
}

function allowsCashOnPickup(connection: any) {
  const combined = [
    connection.fulfillment_rules || "",
    connection.payment_instructions || "",
    connection.customer_menu || "",
  ].join("\n");
  return /\b(cash on pickup|cash at pickup|pay on pickup|pay at pickup|cash on collection|pay on collection|pay cash when collecting)\b/i.test(combined);
}

function looksLikeAddressReply(text: string) {
  const normalized = text.trim();
  if (!normalized || normalized.length > 160) return false;
  if (looksLikeMenuRequest(normalized) || extractAvailabilityItem(normalized) || looksLikeWorkflowRequest(normalized)) return false;
  if (looksLikeOrderMessage(normalized)) return false;
  return /[a-z]/i.test(normalized);
}

async function parseOrderWithAI(text: string, menu?: string | null, existingOrder?: any): Promise<ParsedOrder> {
  if (existingOrder?.items?.length) {
    if (isPickupReply(text)) {
      return {
        items: [],
        delivery_address: "Pickup",
        payment_method: null,
        customer_name: null,
        notes: null,
      };
    }

    if (!existingOrder.delivery_address && looksLikeAddressReply(text)) {
      return {
        items: [],
        delivery_address: text.trim(),
        payment_method: null,
        customer_name: null,
        notes: null,
      };
    }
  }

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
        content: [
          "Extract a customer WhatsApp order, booking, product request, or service request from the message.",
          menu ? `Business catalogue / service list / price list:\n${menu}` : "Business catalogue / service list / price list: not configured.",
          existingOrder ? `Open order waiting for details:\n${JSON.stringify({
            items: existingOrder.items || [],
            delivery_address: existingOrder.delivery_address || null,
            payment_method: existingOrder.payment_method || null,
            customer_name: existingOrder.customer_name || null,
          })}` : "Open order waiting for details: none.",
          `Message: "${text}"`,
          'Return JSON only: {"items":[{"name":string,"qty":number|null,"unit_price":number|null}],"delivery_address":string|null,"payment_method":string|null,"customer_name":string|null,"notes":string|null}',
          "Use the saved catalogue/service prices when the requested product or service clearly matches a listed item. Do not invent prices, products, or services.",
          "If there is an open order and the customer replies with an address, place, pickup/collection, appointment time, or job detail, set delivery_address to that value and return no new items.",
          "If the customer is only answering a missing detail, return empty items and fill the detail.",
        ].join("\n"),
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

function requestSummaryLabel(requestType?: string | null) {
  return ["booking", "service", "repair", "quote"].includes(String(requestType || "")) ? "Request" : "Items";
}

function classifyRequestType(text: string, items: any[] = [], deliveryAddress?: string | null) {
  const combined = [
    text,
    deliveryAddress || "",
    ...(items || []).map((item) => item?.name || ""),
  ].join(" ").toLowerCase();

  if (/\b(repair|fix|screen|fault|broken|diagnose|diagnosis)\b/.test(combined)) return "repair";
  if (/\b(book|booking|appointment|schedule|slot|reserve|reservation)\b/.test(combined)) return "booking";
  if (/\b(service|consultation|install|installation|fitting|alteration|styling|cleaning)\b/.test(combined)) return "service";
  if (/\b(quote|quotation|estimate|invoice)\b/.test(combined)) return "quote";
  return "order";
}

async function findOpenCustomerOrder(supabase: any, connection: any, from?: string) {
  if (!from) return null;
  const { data: openOrders } = await supabase
    .from("kapso_orders")
    .select("*")
    .eq("user_id", connection.user_id)
    .eq("customer_phone", from)
    .eq("status", "needs_details")
    .order("created_at", { ascending: false })
    .limit(1);

  return openOrders?.[0] || null;
}

async function findLatestActiveCustomerOrder(supabase: any, connection: any, from?: string) {
  if (!from) return null;
  const { data: orders } = await supabase
    .from("kapso_orders")
    .select("*")
    .eq("user_id", connection.user_id)
    .eq("customer_phone", from)
    .in("status", ["confirmed", "needs_details"])
    .order("created_at", { ascending: false })
    .limit(1);

  return orders?.[0] || null;
}

async function findRecentDuplicateCustomerOrder(supabase: any, connection: any, message: ParsedMessage, text: string) {
  if (!message.from || !text.trim()) return null;
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: orders } = await supabase
    .from("kapso_orders")
    .select("*")
    .eq("user_id", connection.user_id)
    .eq("customer_phone", message.from)
    .neq("status", "cancelled")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5);

  const normalized = text.trim().toLowerCase();
  return (orders || []).find((order: any) => String(order.raw_text || "").trim().toLowerCase() === normalized) || null;
}

async function findAwaitingReceiptOrders(supabase: any, connection: any, from?: string) {
  if (!from) return [];
  const { data: orders } = await supabase
    .from("kapso_orders")
    .select("*")
    .eq("user_id", connection.user_id)
    .eq("customer_phone", from)
    .eq("status", "confirmed")
    .in("payment_status", ["unpaid", "receipt_sent"])
    .order("created_at", { ascending: false })
    .limit(5);

  return (orders || []).filter((order: any) => String(order.payment_method || "").toLowerCase() !== "cash on pickup");
}

async function cancelCustomerOrderByText(supabase: any, connection: any, message: ParsedMessage, text: string) {
  const orderCode = extractOrderCode(text);
  let query = supabase
    .from("kapso_orders")
    .select("*")
    .eq("user_id", connection.user_id)
    .eq("customer_phone", message.from || "")
    .neq("status", "cancelled")
    .neq("status", "fulfilled")
    .order("created_at", { ascending: false })
    .limit(orderCode ? 1 : 5);

  if (orderCode) query = query.eq("order_code", orderCode);
  const { data: orders, error } = await query;
  if (error) throw error;
  if (!orderCode && (orders || []).length > 1) {
    const choices = (orders || [])
      .slice(0, 5)
      .map((item: any) => `${item.order_code}: ${orderItemsSummary(item.items || [])}`)
      .join("\n");
    return [
      "I found more than one active request for this number.",
      "Please cancel with the request reference so I do not cancel the wrong one.",
      `Example: cancel ${orders[0].order_code}`,
      "Active requests:",
      choices,
    ].join("\n");
  }
  const order = orders?.[0];
  if (!order) {
    return orderCode
      ? `I could not find an active request with reference ${orderCode}. A staff member will review this.`
      : "I could not find an active request to cancel from this number. A staff member will review this.";
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("kapso_orders")
    .update({
      status: "cancelled",
      owner_notes: [order.owner_notes, `Customer cancelled from WhatsApp at ${now}.`].filter(Boolean).join("\n"),
      updated_at: now,
    })
    .eq("id", order.id);
  if (updateError) throw updateError;

  await supabase.from("kapso_order_audit_logs").insert({
    user_id: connection.user_id,
    connection_id: connection.id,
    order_id: order.id,
    actor_type: "customer",
    action: "cancelled_by_customer",
    details: { text },
    message_sent: true,
  });

  return [
    "Request cancelled.",
    order.order_code ? `Reference: ${order.order_code}` : null,
    `Request: ${orderItemsSummary(order.items || [])}`,
    "If you already paid, a staff member will review and follow up.",
  ].filter(Boolean).join("\n");
}

function looksLikeCancelRequest(text: string) {
  return /\b(cancel|cancelled|canceled|stop|drop|forget it|no longer need)\b/i.test(text)
    && /\b(order|request|booking|appointment|reference|ref|#|[A-Z0-9]{8})\b/i.test(text);
}

function looksLikeOrderEditRequest(text: string) {
  return /\b(add|remove|change|switch|update|move|reschedule|postpone|instead|make it|can we|modify)\b/i.test(text)
    && /\b(order|request|booking|appointment|delivery|pickup|address|time|date|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|item|service)\b/i.test(text);
}

function looksLikeRefundRequest(text: string) {
  return /\b(refund|reverse|reversal|chargeback|money back|return my money)\b/i.test(text);
}

async function saveOwnerReviewRequest(supabase: any, connection: any, order: any, message: ParsedMessage, text: string) {
  const now = new Date().toISOString();
  const ownerNotes = [
    String(order.owner_notes || "").trim(),
    `Customer requested a change at ${now}: ${text}`,
  ].filter(Boolean).join("\n");

  await supabase
    .from("kapso_orders")
    .update({
      owner_notes: ownerNotes,
      updated_at: now,
    })
    .eq("id", order.id);

  await supabase.from("kapso_order_audit_logs").insert({
    user_id: connection.user_id,
    connection_id: connection.id,
    order_id: order.id,
    actor_type: "customer",
    action: "change_requested",
    details: { text, from_number: message.from || null },
    message_sent: true,
  });

  return [
    "I have noted the change request.",
    order.order_code ? `Reference: ${order.order_code}` : null,
    "A staff member will confirm the updated details before we proceed.",
  ].filter(Boolean).join("\n");
}

async function handleMediaWithoutReceiptMatch(supabase: any, connection: any, message: ParsedMessage, text: string, payload: any) {
  if (!hasMediaMessage(message)) return null;
  if (looksLikeNonPaymentMediaCaption(text)) {
    const latestOrder = await findLatestActiveCustomerOrder(supabase, connection, message.from);
    if (latestOrder) {
      return saveOwnerReviewRequest(supabase, connection, latestOrder, message, text || "Customer sent a non-payment image.");
    }
    return "Image received. A staff member will review it and reply.";
  }

  const awaiting = await findAwaitingReceiptOrders(supabase, connection, message.from);
  if (looksLikeReceiptIntent(text) || (!text && awaiting.length > 0)) {
    return markLatestOrderReceiptSent(supabase, connection, message, text, payload);
  }
  return null;
}

async function findLatestAwaitingReceiptOrder(supabase: any, connection: any, from?: string, text = "") {
  const orders = await findAwaitingReceiptOrders(supabase, connection, from);
  if (!orders?.length) return null;
  const orderCode = extractOrderCode(text);
  if (orderCode) {
    return orders.find((order: any) => String(order.order_code || "").toUpperCase() === orderCode) || null;
  }
  if (orders.length > 1) {
    return { needsOrderCode: true, orders };
  }
  return orders[0];
}

async function findCashPickupOrderByText(supabase: any, connection: any, from?: string, text = "") {
  if (!from) return null;
  const orderCode = extractOrderCode(text);
  let query = supabase
    .from("kapso_orders")
    .select("*")
    .eq("user_id", connection.user_id)
    .eq("customer_phone", from)
    .eq("status", "confirmed")
    .eq("payment_method", "cash on pickup")
    .order("created_at", { ascending: false })
    .limit(1);
  if (orderCode) query = query.eq("order_code", orderCode);
  const { data: orders } = await query;
  return orders?.[0] || null;
}

function ambiguousPaymentReferenceReply(prefix: string, orders: any[]) {
  const visibleOrders = orders.slice(0, 3);
  const choices = visibleOrders
    .map((item: any) => `${item.order_code}: ${orderItemsSummary(item.items || [])}`)
    .join("\n");
  const firstCode = visibleOrders[0]?.order_code;

  return [
    prefix,
    "Please send the receipt again with the request reference in the caption so I match it correctly.",
    firstCode ? `Example caption: ${firstCode}` : null,
    "If you cannot add a caption, reply with just the reference first, then send the receipt.",
    "Unpaid requests:",
    choices,
    orders.length > visibleOrders.length ? `There ${orders.length - visibleOrders.length === 1 ? "is" : "are"} ${orders.length - visibleOrders.length} older unpaid request${orders.length - visibleOrders.length === 1 ? "" : "s"} too.` : null,
  ].filter(Boolean).join("\n");
}

async function promptForReceipt(supabase: any, connection: any, message: ParsedMessage, text = "") {
  const order = await findLatestAwaitingReceiptOrder(supabase, connection, message.from, text);
  if (!order) {
    const cashPickupOrder = await findCashPickupOrderByText(supabase, connection, message.from, text);
    if (cashPickupOrder) {
      return [
        "This request is marked for cash on pickup.",
        cashPickupOrder.order_code ? `Reference: ${cashPickupOrder.order_code}` : null,
        `Request: ${orderItemsSummary(cashPickupOrder.items || [])}`,
        "Please pay when collecting. Staff will complete the request after cash is received.",
      ].filter(Boolean).join("\n");
    }
    return "Thanks. I could not find a confirmed request waiting for payment proof from this number. A staff member will review this message.";
  }
  if (order.needsOrderCode) {
    return ambiguousPaymentReferenceReply("I found more than one unpaid request for this number.", order.orders);
  }

  const claimedAmount = parseClaimedPaymentAmount(text);
  if (claimedAmount) {
    await supabase
      .from("kapso_orders")
      .update({
        payment_claimed_amount: claimedAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
  }

  return [
    "Thanks. Please send your payment receipt or transfer screenshot here as proof.",
    order.order_code ? `Reference: ${order.order_code}` : null,
    `Request: ${orderItemsSummary(order.items || [])}`,
    claimedAmount ? `Amount noted: ${formatNaira(claimedAmount)}.` : null,
    "You do not need to type the amount. Staff will confirm the receipt and update you.",
  ].filter(Boolean).join("\n");
}

async function markLatestOrderReceiptSent(supabase: any, connection: any, message: ParsedMessage, text: string, payload: any) {
  const order = await findLatestAwaitingReceiptOrder(supabase, connection, message.from, text);
  if (!order) {
    const cashPickupOrder = await findCashPickupOrderByText(supabase, connection, message.from, text);
    if (cashPickupOrder) {
      return [
        "Image received, but this request is marked for cash on pickup.",
        cashPickupOrder.order_code ? `Reference: ${cashPickupOrder.order_code}` : null,
        "Staff will complete it after cash is collected.",
      ].filter(Boolean).join("\n");
    }
    return "Receipt received. I could not match it to a confirmed unpaid request from this number, so a staff member will review it.";
  }
  if (order.needsOrderCode) {
    return ambiguousPaymentReferenceReply("Receipt received, but I found more than one unpaid request for this number.", order.orders);
  }

  const receivedAt = new Date().toISOString();
  const claimedAmount = parseClaimedPaymentAmount(text);
  const receiptUrl = message.receiptUrl || order.receipt_url || findReceiptUrl(text) || null;
  const storedReceipt = await persistReceiptMedia(supabase, order, message, receiptUrl);
  const receiptSaved = storedReceipt?.status === "saved";
  const notes = [
    order.notes,
    `Payment receipt received from WhatsApp.${claimedAmount ? ` Customer claimed ${formatNaira(claimedAmount)}.` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await supabase
    .from("kapso_orders")
    .update({
      payment_status: "receipt_sent",
      receipt_received_at: receivedAt,
      receipt_message_id: message.messageId || null,
      receipt_url: receiptUrl,
      receipt_storage_path: receiptSaved ? storedReceipt.path : order.receipt_storage_path || null,
      receipt_filename: receiptSaved ? storedReceipt.filename : order.receipt_filename || null,
      receipt_content_type: receiptSaved ? storedReceipt.contentType : order.receipt_content_type || null,
      receipt_storage_status: receiptSaved ? "saved" : "failed",
      receipt_storage_error: receiptSaved ? null : storedReceipt?.error || "Receipt media could not be saved",
      receipt_storage_failed_at: receiptSaved ? null : receivedAt,
      receipt_payload: payload,
      payment_claimed_amount: claimedAmount || order.payment_claimed_amount || null,
      notes,
      updated_at: receivedAt,
    })
    .eq("id", order.id);

  if (error) throw error;
  await logAnalyticsEvent(supabase, connection.user_id, "receipt_received", {
    order_id: order.id,
    order_code: order.order_code || null,
    receipt_saved: receiptSaved,
    receipt_storage_status: receiptSaved ? "saved" : "failed",
  });

  const ownerNumber = String(connection.owner_notification_number || "").trim();
  if (ownerNumber && connection.phone_number_id) {
    try {
      const expectedTotal = order.owner_adjusted_total_amount || order.expected_total_amount || expectedOrderTotal(order.items || [], order.delivery_fee_amount || null);
      const ownerLines = [
        "New payment receipt received.",
        order.order_code ? `Reference: ${order.order_code}` : null,
        `Request: ${orderItemsSummary(order.items || [])}`,
        expectedTotal ? `Expected: ${formatNaira(Number(expectedTotal))}` : null,
        claimedAmount || order.payment_claimed_amount ? `Customer paid: ${formatNaira(Number(claimedAmount || order.payment_claimed_amount))}` : null,
        receiptSaved ? "Receipt: saved in Hoursback" : "Receipt: needs resend or manual review",
        "Open Hoursback /orders to verify payment.",
      ].filter(Boolean);
      await sendKapsoText(connection.phone_number_id, ownerNumber, ownerLines.join("\n"));
    } catch (err) {
      console.error("Owner receipt notification failed:", err);
    }
  }

  return [
    receiptSaved ? "Receipt received. Thank you." : "Receipt received, but we could not save the image for review.",
    order.order_code ? `Reference: ${order.order_code}` : null,
    `Request: ${orderItemsSummary(order.items || [])}`,
    receiptSaved
      ? "We will confirm the payment and update you once it is received."
      : "Please resend the receipt with the reference so a staff member can verify payment.",
  ].filter(Boolean).join("\n");
}

function sanitizeCustomerAIResponse(value: any): CustomerAIResponse | null {
  const action = String(value?.action || "").trim() as CustomerAIAction;
  if (!["answer", "order", "payment_claim", "receipt_submitted", "workflow_request", "handoff"].includes(action)) {
    return null;
  }
  const reply = typeof value?.reply === "string" && value.reply.trim() ? value.reply.trim() : null;
  return { action, reply };
}

async function getLatestCustomerOrderContext(supabase: any, connection: any, from?: string) {
  if (!from) return null;
  const { data: orders } = await supabase
    .from("kapso_orders")
    .select("id,status,payment_status,items,delivery_address,payment_method,receipt_received_at,payment_verified_at,created_at")
    .eq("user_id", connection.user_id)
    .eq("customer_phone", from)
    .order("created_at", { ascending: false })
    .limit(1);

  return orders?.[0] || null;
}

async function getCustomerAIResponse(supabase: any, connection: any, message: ParsedMessage, text: string, openOrder: any): Promise<CustomerAIResponse | null> {
  if (!ANTHROPIC_API_KEY) return null;

  try {
    const latestOrder = await getLatestCustomerOrderContext(supabase, connection, message.from);
    const awaitingReceiptOrder = await findLatestAwaitingReceiptOrder(supabase, connection, message.from);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 420,
      messages: [{
        role: "user",
        content: [
          "You are the WhatsApp customer-service assistant for this business.",
          "Reply naturally and briefly, but never invent products, services, prices, payment details, delivery guarantees, appointment slots, discounts, opening hours, or policies that are not provided.",
          "Do not add emojis or decorative symbols. If showing the catalogue, service list, or price list, preserve the saved text as closely as possible.",
          "If the customer asks something not covered by the supplied business info, answer what you can and say a staff member will confirm the unknown part.",
          "For payment: never say payment is received or verified. Customers can only send proof. Staff verifies payment inside Hoursback.",
          "Do not ask customers to type figures or payment amounts. The normal proof is a receipt screenshot/image/document.",
          "If the customer says they paid but sends no receipt/proof, action must be payment_claim and ask for a receipt screenshot/image.",
          "If the customer sends a receipt/proof or media receipt while an order is awaiting receipt/proof, action must be receipt_submitted.",
          "If the customer sends a product photo, style reference, damaged item photo, or other non-payment image, action must be order or handoff, not receipt_submitted.",
          "If the customer asks to cancel an order, booking, or request, action must be handoff.",
          "If the customer is placing or continuing an order, action must be order.",
          "If the customer asks to schedule reports/workflows, action must be handoff because customer mode cannot create internal workflow drafts.",
          "For normal questions, action must be answer.",
          "Return JSON only with this shape: {\"action\":\"answer|order|payment_claim|receipt_submitted|workflow_request|handoff\",\"reply\":string|null}",
          "",
          `Business type:\n${String(connection.business_type || "Not configured").trim()}`,
          `Operating hours:\n${String(connection.operating_hours || "Not configured").trim()}`,
          `Business catalogue / service list / price list:\n${String(connection.customer_menu || "Not configured").trim()}`,
          `Fulfillment rules:\n${String(connection.fulfillment_rules || "Not configured").trim()}`,
          `Payment instructions:\n${String(connection.payment_instructions || "Not configured").trim()}`,
          `Escalation instructions:\n${String(connection.escalation_instructions || "Not configured").trim()}`,
          `Open order waiting for details:\n${JSON.stringify(openOrder || null)}`,
          `Latest order from this customer:\n${JSON.stringify(latestOrder || null)}`,
          `Order awaiting receipt/proof:\n${JSON.stringify(awaitingReceiptOrder || null)}`,
          `Incoming message type: ${message.type || "unknown"}`,
          `Incoming receipt URL present: ${message.receiptUrl ? "yes" : "no"}`,
          `Customer message: ${text || "[no text]"}`,
        ].join("\n"),
      }],
    });
    const raw = (response.content[0] as { text: string }).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return sanitizeCustomerAIResponse(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Customer AI response error:", err);
    return null;
  }
}

async function handleCustomerAIAction(
  supabase: any,
  connection: any,
  message: ParsedMessage,
  text: string,
  payload: any,
  openOrder: any,
  ai: CustomerAIResponse | null,
) {
  if (!ai) return null;

  if (ai.action === "workflow_request") {
    if (connection.connection_type === "customer") {
      return "A staff member will help with that request.";
    }
    return saveWorkflowRequest(supabase, connection, message, text);
  }
  if (ai.action === "receipt_submitted") {
    if (hasMediaMessage(message) && looksLikeNonPaymentMediaCaption(text)) return null;
    const awaiting = await findAwaitingReceiptOrders(supabase, connection, message.from);
    if (!looksLikeReceiptIntent(text) && !awaiting.length) return null;
    return markLatestOrderReceiptSent(supabase, connection, message, text, payload);
  }
  if (ai.action === "payment_claim") {
    return promptForReceipt(supabase, connection, message, text);
  }
  if (ai.action === "order") {
    return handleCustomerOrder(supabase, connection, message, text, openOrder);
  }
  if ((ai.action === "answer" || ai.action === "handoff") && ai.reply) {
    return ai.reply;
  }

  return null;
}

async function logCustomerAIAction(
  supabase: any,
  connection: any,
  message: ParsedMessage,
  text: string,
  openOrder: any,
  ai: CustomerAIResponse | null,
  reply: string | null,
) {
  if (!ai) return;
  await supabase.from("kapso_ai_logs").insert({
    user_id: connection.user_id,
    connection_id: connection.id,
    order_id: openOrder?.id || null,
    from_number: message.from || null,
    message_id: message.messageId || null,
    message_text: text || null,
    action: ai.action,
    reply: reply || ai.reply || null,
    raw_response: ai,
  });
}

async function handleCustomerOrder(supabase: any, connection: any, message: ParsedMessage, text: string, openOrder?: any) {
  const existing = openOrder || await findOpenCustomerOrder(supabase, connection, message.from);
  if (!existing) {
    const duplicate = await findRecentDuplicateCustomerOrder(supabase, connection, message, text);
    if (duplicate) {
      return [
        "I already have this request.",
        duplicate.order_code ? `Reference: ${duplicate.order_code}` : null,
        `Request: ${orderItemsSummary(duplicate.items || [])}`,
        duplicate.status === "confirmed"
          ? "Please send the receipt screenshot after transfer, or wait for staff to confirm any unclear details."
          : "Please send the missing delivery, pickup, appointment, or job details.",
      ].filter(Boolean).join("\n");
    }
  }
  const parsed = await parseOrderWithAI(text, connection.customer_menu, existing);
  const parsedItems = Array.isArray(parsed.items) ? parsed.items.filter((item) => item?.name) : [];
  const items = parsedItems.length ? parsedItems : existing?.items || [];
  const deliveryAddress = parsed.delivery_address || existing?.delivery_address || null;
  const requestedCashPickup = /\bcash\b/i.test(text) && isPickupDelivery(deliveryAddress);
  const paymentMethod = requestedCashPickup && allowsCashOnPickup(connection)
    ? "cash on pickup"
    : cleanPaymentMethod(parsed.payment_method || existing?.payment_method);
  const customerName = parsed.customer_name || existing?.customer_name || message.contactName || null;
  const status = items.length && deliveryAddress ? "confirmed" : "needs_details";
  const requestType = existing?.request_type || classifyRequestType(text, items, deliveryAddress);
  const orderCode = existing?.order_code || generateOrderCode();
  const deliveryFee = deliveryAddress
    ? deliveryFeeFromMenu(connection.customer_menu, deliveryAddress) ?? existing?.delivery_fee_amount ?? null
    : existing?.delivery_fee_amount ?? null;
  const expectedTotal = status === "confirmed"
    ? expectedOrderTotal(items, deliveryFee)
    : existing?.expected_total_amount ?? null;

  const payload = {
    user_id: connection.user_id,
    connection_id: connection.id,
    order_code: orderCode,
    customer_phone: message.from || null,
    customer_name: customerName,
    status,
    request_type: requestType,
    items,
    delivery_address: deliveryAddress,
    payment_method: paymentMethod,
    delivery_fee_amount: deliveryFee,
    expected_total_amount: expectedTotal,
    notes: parsed.notes || existing?.notes || null,
    raw_text: existing?.raw_text ? `${existing.raw_text}\n${text}` : text,
    source_message_id: message.messageId || existing?.source_message_id || null,
    confirmed_at: status === "confirmed" ? existing?.confirmed_at || new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const result = existing
    ? await supabase.from("kapso_orders").update(payload).eq("id", existing.id).select("*").single()
    : await supabase.from("kapso_orders").insert(payload).select("*").single();
  if (result.error) throw result.error;
  if (!existing) {
    await logAnalyticsEvent(supabase, connection.user_id, "customer_order_created", {
      order_id: result.data.id,
      order_code: result.data.order_code || null,
      request_type: result.data.request_type || null,
      status: result.data.status,
    });
  }

  if (!items.length) {
    return "I can help with your order or request. What would you like?";
  }
  if (!deliveryAddress) {
    return `Got it: ${orderItemsSummary(items)}.\nPlease send your delivery, pickup, appointment, or job details.`;
  }

  const total = Number(expectedTotal || orderTotal(items) || 0) || null;
  const paymentInstructions = String(connection.payment_instructions || "").trim();
  const cashPickupAllowed = isPickupDelivery(deliveryAddress) && allowsCashOnPickup(connection);
  const lines = [
    "Request confirmed.",
    `Reference: ${orderCode}`,
    `${requestSummaryLabel(requestType)}: ${orderItemsSummary(items)}`,
    `Fulfillment details: ${deliveryAddress}`,
  ];
  if (deliveryFee) lines.push(`Delivery/service fee: ${formatNaira(Number(deliveryFee))}`);
  if (total) lines.push(`Total: ${formatNaira(total)}`);
  if (paymentMethod && paymentMethod !== "cash on pickup") lines.push(`Payment: ${paymentMethod}`);
  if (paymentMethod === "cash on pickup" || cashPickupAllowed) {
    lines.push("Payment: cash on pickup is available for this request.");
    if (paymentInstructions) {
      lines.push("To pay before pickup instead, use:", paymentInstructions, "Then send the receipt screenshot here.");
    }
  } else if (paymentInstructions) {
    lines.push("Payment details:", paymentInstructions, "After transfer, send the receipt screenshot here as proof.");
  } else {
    lines.push("Payment details are not configured yet. A staff member will send payment instructions.");
  }
  lines.push(
    "A staff member will follow up if anything is unclear.",
  );
  return lines.join("\n");
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

function getTodayStart(timeZone = "Africa/Lagos") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(value.year);
  const month = Number(value.month);
  const day = Number(value.day);
  if (timeZone === "Africa/Lagos") {
    return new Date(Date.UTC(year, month - 1, day, -1, 0, 0));
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

async function getDailyTotals(supabase: any, userId: string, timeZone?: string) {
  const start = getTodayStart(timeZone);
  const { data: entries } = await supabase
    .from("bot_entries")
    .select("entry_type, parsed_data, sale_date, created_at")
    .eq("user_id", userId)
    .or(`created_at.gte.${start.toISOString()},sale_date.gte.${start.toISOString()}`);

  const rows = (entries || []).filter((entry: any) => entryDate(entry) >= start);
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
  const totals = await getDailyTotals(supabase, connection.user_id, connection.business_timezone);
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

async function getTodayBusinessMetrics(supabase: any, userId: string, timeZone?: string) {
  const start = getTodayStart(timeZone);
  const { data: entries } = await supabase
    .from("bot_entries")
    .select("entry_type, parsed_data, triggered_by, sale_date, created_at")
    .eq("user_id", userId)
    .or(`created_at.gte.${start.toISOString()},sale_date.gte.${start.toISOString()}`)
    .order("created_at", { ascending: false });

  const rows = (entries || []).filter((entry: any) => entryDate(entry) >= start);
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

  return {
    rows,
    totalSales,
    totalExpenses,
    estimatedProfit: totalSales - totalExpenses,
    topItem,
    latestCloseout,
  };
}

async function buildSalesSummary(supabase: any, userId: string, timeZone?: string) {
  const metrics = await getTodayBusinessMetrics(supabase, userId, timeZone);

  return [
    `Today so far:`,
    `Sales: ₦${metrics.totalSales.toLocaleString()}`,
    `Expenses: ₦${metrics.totalExpenses.toLocaleString()}`,
    `Entries logged: ${metrics.rows.length}`,
    metrics.topItem ? `Top item: ${metrics.topItem[0]} (${metrics.topItem[1]} units/entries)` : `Top item: none yet`,
    metrics.latestCloseout
      ? `Closeout: ${metrics.latestCloseout.status.replace(/_/g, " ")} (collected ₦${Number(metrics.latestCloseout.actual_collected_total || 0).toLocaleString()}, variance ₦${Number(metrics.latestCloseout.variance_total || 0).toLocaleString()})`
      : `Closeout: not done yet`,
  ].join("\n");
}

async function buildProfitAndLossSummary(supabase: any, userId: string, timeZone?: string) {
  const metrics = await getTodayBusinessMetrics(supabase, userId, timeZone);
  return [
    "Estimated profit and loss today:",
    `Revenue: ₦${metrics.totalSales.toLocaleString()}`,
    `Expenses: ₦${metrics.totalExpenses.toLocaleString()}`,
    `Estimated profit: ₦${metrics.estimatedProfit.toLocaleString()}`,
    metrics.latestCloseout
      ? `Closeout variance: ₦${Number(metrics.latestCloseout.variance_total || 0).toLocaleString()}`
      : "Closeout variance: not closed yet",
  ].join("\n");
}

async function buildFiveLineSummary(supabase: any, userId: string, timeZone?: string) {
  const metrics = await getTodayBusinessMetrics(supabase, userId, timeZone);
  return [
    `Sales: ₦${metrics.totalSales.toLocaleString()}`,
    `Expenses: ₦${metrics.totalExpenses.toLocaleString()}`,
    `Estimated profit: ₦${metrics.estimatedProfit.toLocaleString()}`,
    metrics.topItem ? `Top item: ${metrics.topItem[0]} (${metrics.topItem[1]})` : "Top item: none yet",
    metrics.latestCloseout ? `Closeout: ${metrics.latestCloseout.status.replace(/_/g, " ")}` : "Closeout: not done yet",
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownToEmailHtml(markdown: string) {
  const inline = (text: string) => escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:12px;font-family:monospace;">$1</code>');

  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`<h2 style="font-size:18px;font-weight:700;color:#0f172a;margin:22px 0 8px;">${inline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`<h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:24px 0 8px;">${inline(trimmed.slice(2))}</h1>`);
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)/);
    if (bullet) {
      if (!inList) {
        html.push('<ul style="margin:8px 0;padding-left:20px;">');
        inList = true;
      }
      html.push(`<li style="margin:5px 0;color:#334155;line-height:1.7;">${inline(bullet[1])}</li>`);
      continue;
    }
    closeList();
    html.push(`<p style="margin:8px 0;color:#334155;line-height:1.75;font-size:15px;">${inline(trimmed)}</p>`);
  }
  closeList();
  return html.join("\n");
}

function getZonedDateParts(date: Date, timeZone = "Africa/Lagos") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(value.year),
    month: Number(value.month),
    day: Number(value.day),
  };
}

function zonedStartOfDay(date: Date, timeZone = "Africa/Lagos") {
  const { year, month, day } = getZonedDateParts(date, timeZone);
  if (timeZone === "Africa/Lagos") {
    return new Date(Date.UTC(year, month - 1, day, -1, 0, 0));
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

function parseReportRange(text: string, timeZone = "Africa/Lagos") {
  const now = new Date();
  const end = new Date(now);
  const start = zonedStartOfDay(now, timeZone);
  let label = "Today";

  if (/\b(yesterday)\b/i.test(text)) {
    start.setUTCDate(start.getUTCDate() - 1);
    end.setTime(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    label = "Yesterday";
  } else if (/\b(week|weekly|last 7 days|7 days)\b/i.test(text)) {
    start.setUTCDate(start.getUTCDate() - 6);
    label = "Last 7 days";
  } else if (/\b(month|monthly|this month)\b/i.test(text)) {
    const { year, month } = getZonedDateParts(now, timeZone);
    start.setTime(timeZone === "Africa/Lagos"
      ? Date.UTC(year, month - 1, 1, -1, 0, 0)
      : Date.UTC(year, month - 1, 1, 0, 0, 0));
    label = "This month";
  } else {
    label = "Today";
  }

  return { start, end, label };
}

function entryDate(entry: any) {
  return new Date(entry.sale_date || entry.created_at);
}

async function collectReportMetrics(supabase: any, userId: string, text: string, timeZone?: string) {
  const range = parseReportRange(text, timeZone);
  const lowerBound = range.start.toISOString();

  const { data: entries, error } = await supabase
    .from("bot_entries")
    .select("entry_type,parsed_data,raw_text,source,channel,sale_date,created_at")
    .eq("user_id", userId)
    .or(`created_at.gte.${lowerBound},sale_date.gte.${lowerBound}`)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;

  const rows = (entries || []).filter((entry: any) => {
    const date = entryDate(entry);
    return date >= range.start && date <= range.end;
  });
  const sales = rows.filter((entry: any) => entry.entry_type === "sale");
  const expenses = rows.filter((entry: any) => entry.entry_type === "expense");
  const revenue = sales.reduce((sum: number, entry: any) => sum + Number(entry.parsed_data?.total || 0), 0);
  const expenseTotal = expenses.reduce((sum: number, entry: any) => sum + Number(entry.parsed_data?.total || 0), 0);
  const itemCounts = new Map<string, { qty: number; revenue: number }>();

  for (const entry of sales) {
    const item = String(entry.parsed_data?.item || "Unspecified");
    const current = itemCounts.get(item) || { qty: 0, revenue: 0 };
    current.qty += Number(entry.parsed_data?.qty || 1);
    current.revenue += Number(entry.parsed_data?.total || 0);
    itemCounts.set(item, current);
  }

  const topItems = [...itemCounts.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([item, value]) => ({ item, ...value }));

  const channels = rows.reduce((acc: Record<string, number>, entry: any) => {
    const key = entry.channel || (String(entry.source || "").startsWith("data_source") ? "data_source" : entry.source || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    range,
    rows,
    sales,
    expenses,
    revenue,
    expenseTotal,
    profit: revenue - expenseTotal,
    topItems,
    channels,
  };
}

function deterministicReport(metrics: any, reportType: string) {
  const lines = [
    `# ${reportType === "profit_and_loss" ? "Profit and Loss Report" : "Sales Report"} - ${metrics.range.label}`,
    "",
    "## At a glance",
    `- Revenue: ₦${metrics.revenue.toLocaleString("en-NG")}`,
    `- Expenses: ₦${metrics.expenseTotal.toLocaleString("en-NG")}`,
    `- Estimated profit: ₦${metrics.profit.toLocaleString("en-NG")}`,
    `- Entries reviewed: ${metrics.rows.length}`,
    `- Sales entries: ${metrics.sales.length}`,
    `- Expense entries: ${metrics.expenses.length}`,
    "",
    "## Top items or services",
    metrics.topItems.length
      ? metrics.topItems.map((item: any) => `- ${item.item}: ₦${item.revenue.toLocaleString("en-NG")} (${item.qty} entries/units)`).join("\n")
      : "- No item-level sales found for this period.",
    "",
    "## Data coverage",
    `- Channels used: ${Object.entries(metrics.channels).map(([key, count]) => `${key} (${count})`).join(", ") || "none"}`,
    "- This report uses records captured in Hoursback from Sheets/imports, manual entries, WhatsApp logs, scans, and verified customer orders.",
    "",
    "## Recommendations",
    metrics.rows.length
      ? "- Review any high-value expenses and confirm uncategorized sales items before making final financial decisions."
      : "- Connect a Google Sheet or add sales entries before relying on this report.",
  ];
  return lines.join("\n");
}

async function generateReportWithAI(metrics: any, reportType: string) {
  const fallback = deterministicReport(metrics, reportType);
  if (!ANTHROPIC_API_KEY || !metrics.rows.length) return fallback;

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const sample = metrics.rows.slice(0, 80).map((entry: any) => ({
      type: entry.entry_type,
      item: entry.parsed_data?.item || null,
      total: entry.parsed_data?.total || null,
      qty: entry.parsed_data?.qty || null,
      customer: entry.parsed_data?.customer || null,
      source: entry.channel || entry.source || null,
      date: entry.sale_date || entry.created_at,
    }));
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          `Write a concise ${reportType === "profit_and_loss" ? "profit and loss" : "sales"} report for a business owner.`,
          "Use Markdown headings and bullets. No emoji. Do not invent numbers.",
          "Use these verified totals exactly:",
          JSON.stringify({
            period: metrics.range.label,
            revenue: metrics.revenue,
            expenses: metrics.expenseTotal,
            estimated_profit: metrics.profit,
            entries_reviewed: metrics.rows.length,
            sales_entries: metrics.sales.length,
            expense_entries: metrics.expenses.length,
            top_items: metrics.topItems,
            channels: metrics.channels,
          }),
          "Sample rows for context:",
          JSON.stringify(sample),
          "Sections: At a glance, What changed or stands out, Top items/services, Risks or gaps, Recommended actions, Data coverage.",
        ].join("\n"),
      }],
    });
    const text = (result.content[0] as { text: string }).text.trim();
    return text || fallback;
  } catch (err) {
    console.error("WhatsApp report generation failed:", err);
    return fallback;
  }
}

async function getOrCreateWhatsAppReportWorkflow(supabase: any, userId: string) {
  const { data: existing, error: existingError } = await supabase
    .from("workflows")
    .select("*")
    .eq("user_id", userId)
    .eq("name", "WhatsApp Reports")
    .eq("category", "WhatsApp Report")
    .order("created_at", { ascending: true })
    .limit(1);
  if (existingError) throw existingError;
  if (existing?.[0]) return existing[0];

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      user_id: userId,
      name: "WhatsApp Reports",
      category: "WhatsApp Report",
      status: "active",
      trigger_config: { type: "whatsapp_command" },
      data_source_config: { source: "bot_entries" },
      agent_config: { kind: "business_report" },
      action_config: { type: "whatsapp" },
    })
    .select("*")
    .single();
  if (error?.code === "23505") {
    const retry = await supabase
      .from("workflows")
      .select("*")
      .eq("user_id", userId)
      .eq("name", "WhatsApp Reports")
      .eq("category", "WhatsApp Report")
      .order("created_at", { ascending: true })
      .limit(1);
    if (retry.error) throw retry.error;
    if (retry.data?.[0]) return retry.data[0];
  }
  if (error) throw error;
  return data;
}

async function saveWhatsAppReportRun(supabase: any, userId: string, output: string) {
  const workflow = await getOrCreateWhatsAppReportWorkflow(supabase, userId);
  const { data, error } = await supabase
    .from("workflow_runs")
    .insert({
      workflow_id: workflow.id,
      user_id: userId,
      status: "success",
      generated_output: output,
    })
    .select("*")
    .single();
  if (error) throw error;
  return { workflow, run: data };
}

async function sendReportEmail(supabase: any, userId: string, subject: string, output: string) {
  if (!RESEND_API_KEY) return false;
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email;
  if (!email) return false;

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
      <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;padding:28px 32px 26px;">
        <p style="margin:0 0 10px;color:#64748b;font-size:10px;font-family:Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;font-weight:700;">HOURSBACK · WHATSAPP REPORT</p>
        <h1 style="margin:0;color:#f8fafc;font-size:24px;font-family:Arial,Helvetica,sans-serif;font-weight:800;line-height:1.25;">${escapeHtml(subject)}</h1>
      </td></tr>
      <tr><td style="background:linear-gradient(90deg,#10b981 0%,#3b82f6 50%,#8b5cf6 100%);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="background:#ffffff;padding:28px;font-family:-apple-system,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#1e293b;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        ${markdownToEmailHtml(output)}
      </td></tr>
      <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:16px 28px;text-align:center;">
        <p style="margin:0;font-family:-apple-system,Helvetica,sans-serif;font-size:12px;color:#94a3b8;">
          Delivered by <a href="${APP_URL}" style="color:#3b82f6;text-decoration:none;font-weight:600;">Hoursback</a>
          &nbsp;·&nbsp; <a href="${APP_URL}/reports" style="color:#94a3b8;text-decoration:none;">Open reports</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Hoursback Reports <reports@hoursback.xyz>",
      to: email,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    console.error("WhatsApp report email failed:", errorBody);
    await logAnalyticsEvent(supabase, userId, "report_email_failed", {
      status: res.status,
      subject,
      error: errorBody.slice(0, 500),
    });
    return false;
  }
  return true;
}

async function generateWhatsAppBusinessReport(supabase: any, connection: any, text: string) {
  const reportType = looksLikeProfitAndLossQuestion(text) ? "profit_and_loss" : "sales_summary";
  const wantsEmail = /\b(email|mail|inbox)\b/i.test(text);
  const wantsPdf = /\b(pdf|document|download)\b/i.test(text);
  const metrics = await collectReportMetrics(supabase, connection.user_id, text, connection.business_timezone);
  if (!metrics.rows.length) {
    return [
      `I found no records for ${metrics.range.label.toLowerCase()}.`,
      "Connect or refresh a Google Sheet in Data Sources, add manual entries, or log sales on WhatsApp first.",
      "You can also ask for a wider range, for example: “Send this month’s P&L report”.",
      `${APP_URL}/data-sources`,
    ].join("\n");
  }
  const output = await generateReportWithAI(metrics, reportType);
  const { run } = await saveWhatsAppReportRun(supabase, connection.user_id, output);
  const subject = `${reportType === "profit_and_loss" ? "Profit and Loss" : "Sales"} Report - ${metrics.range.label}`;
  const emailed = wantsEmail ? await sendReportEmail(supabase, connection.user_id, subject, output) : false;
  await logAnalyticsEvent(supabase, connection.user_id, "whatsapp_report_generated", {
    run_id: run.id,
    report_type: reportType,
    period: metrics.range.label,
    rows: metrics.rows.length,
    revenue: metrics.revenue,
    expenses: metrics.expenseTotal,
    emailed,
    wants_pdf: wantsPdf,
  });

  return [
    `${subject} generated.`,
    `Revenue: ₦${metrics.revenue.toLocaleString("en-NG")}`,
    `Expenses: ₦${metrics.expenseTotal.toLocaleString("en-NG")}`,
    `Estimated profit: ₦${metrics.profit.toLocaleString("en-NG")}`,
    `Entries reviewed: ${metrics.rows.length}`,
    emailed ? "Email sent." : wantsEmail ? "Email could not be sent. Open Reports to view it." : null,
    wantsPdf ? "Open Reports to download the PDF version." : null,
    `${APP_URL}/reports`,
  ].filter(Boolean).join("\n");
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

    if (!idempotencyKey && message.messageId) {
      const { error } = await supabase.from("kapso_webhook_events").insert({
        idempotency_key: `kapso-message:${message.messageId}`,
        event: req.headers.get("X-Webhook-Event") || payload?.event || null,
      });
      if (error?.code === "23505") {
        return new Response(JSON.stringify({ success: true, duplicate: true }), { headers });
      }
    }

    const url = new URL(req.url);
    const uid = url.searchParams.get("uid");
    const mode = url.searchParams.get("mode");
    const requestedMode = mode === "customer" || mode === "internal" ? mode : null;
    let query = supabase.from("kapso_connections").select("*").limit(2);
    if (uid && requestedMode) {
      query = query.eq("user_id", uid).eq("connection_type", requestedMode);
    } else {
      query = uid
        ? query.eq("user_id", uid).eq("phone_number_id", message.phoneNumberId)
        : query.eq("phone_number_id", message.phoneNumberId);
    }

    let { data: connections, error: connectionError } = await query;
    if (connectionError) throw connectionError;
    let connection = connections?.[0];
    if (!connection && uid) {
      const fallback = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", uid)
        .eq("phone_number_id", message.phoneNumberId)
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
          connection_type: requestedMode || "internal",
          phone_number_id: message.phoneNumberId,
          phone_number: message.to || null,
          display_name: requestedMode === "customer" ? "Customer Requests" : "Kapso WhatsApp",
          status: "connected",
          webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
          last_webhook_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (createConnectionError) throw createConnectionError;
      connection = createdConnection;
    }

    if (
      uid
      && requestedMode
      && connection.phone_number_id
      && connection.phone_number_id !== message.phoneNumberId
    ) {
      console.log("Kapso webhook ignored: phone number id mismatch for mode", {
        mode: requestedMode,
        expectedPhoneNumberId: connection.phone_number_id,
        incomingPhoneNumberId: message.phoneNumberId,
      });
      return new Response(JSON.stringify({ success: true, ignored: "phone number mismatch" }), { headers });
    }

    await supabase.from("kapso_connections").update({
      phone_number_id: message.phoneNumberId,
      phone_number: connection.phone_number || message.to || null,
      status: "connected",
      last_webhook_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", connection.id);

    const profile = await getProfile(supabase, connection.user_id);
    if (connection.connection_type === "customer" && profile?.subscription_status !== "pro") {
      await logAnalyticsEvent(supabase, connection.user_id, "customer_webhook_blocked_free_plan", {
        phone_number_id: message.phoneNumberId,
        message_id: message.messageId || null,
      });
      return new Response(JSON.stringify({ success: true, ignored: "customer WhatsApp requires Pro" }), { headers });
    }

    await logAnalyticsEvent(supabase, connection.user_id, "webhook_received", {
      connection_type: connection.connection_type || "internal",
      message_type: message.type || null,
      has_text: !!message.text,
      has_media: hasMediaMessage(message),
    });

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
    const text = (message.text || "").trim();

    const activeCloseoutSession = await findActiveCloseoutSession(supabase, connection.user_id, message.from);

    if (connection.connection_type === "customer") {
      const openOrder = await findOpenCustomerOrder(supabase, connection, message.from);
      if (looksLikeCancelRequest(text)) {
        reply = await cancelCustomerOrderByText(supabase, connection, message, text);
      } else if (looksLikeRefundRequest(text)) {
        const latestActiveOrder = await findLatestActiveCustomerOrder(supabase, connection, message.from);
        if (latestActiveOrder) {
          reply = await saveOwnerReviewRequest(supabase, connection, latestActiveOrder, message, text);
        } else {
          reply = "A staff member will review your refund request and follow up.";
        }
      } else {
        const mediaReply = await handleMediaWithoutReceiptMatch(supabase, connection, message, text, payload);
        if (mediaReply) {
          reply = mediaReply;
        } else {
          const latestActiveOrder = await findLatestActiveCustomerOrder(supabase, connection, message.from);
          if (!openOrder && latestActiveOrder?.status === "confirmed" && looksLikeOrderEditRequest(text)) {
            reply = await saveOwnerReviewRequest(supabase, connection, latestActiveOrder, message, text);
          } else {
            const ai = await getCustomerAIResponse(supabase, connection, message, text, openOrder);
            const aiReply = await handleCustomerAIAction(supabase, connection, message, text, payload, openOrder, ai);
            await logCustomerAIAction(supabase, connection, message, text, openOrder, ai, aiReply);
            const availabilityItem = extractAvailabilityItem(text);
            if (aiReply) {
              reply = aiReply;
            } else if (looksLikeWorkflowRequest(text)) {
              reply = "A staff member will help with that request.";
            } else if (looksLikeReceiptSubmission(text, message)) {
              reply = await markLatestOrderReceiptSent(supabase, connection, message, text, payload);
            } else if (looksLikePaymentConfirmation(text)) {
              reply = await promptForReceipt(supabase, connection, message, text);
            } else if (availabilityItem) {
              reply = buildAvailabilityReply(connection, availabilityItem);
            } else if (looksLikeMenuRequest(text)) {
              reply = buildMenuReply(connection);
            } else if (openOrder) {
              reply = await handleCustomerOrder(supabase, connection, message, text, openOrder);
            } else if (looksLikeOrderMessage(text)) {
              reply = await handleCustomerOrder(supabase, connection, message, text);
            } else {
              reply = [
                "Hi. Send your order or request here, for example: “I want the black sandals in size 42 delivered to Lekki” or “Book hair styling for Friday.”",
                "You can also ask for the catalogue, price list, services, or availability.",
              ].join("\n");
            }
          }
        }
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
    } else if (looksLikeReportGenerationRequest(text)) {
      reply = await generateWhatsAppBusinessReport(supabase, connection, text);
    } else if (looksLikeWorkflowRequest(text)) {
      reply = await saveWorkflowRequest(supabase, connection, message, text);
    } else if (looksLikeProfitAndLossQuestion(text)) {
      reply = await buildProfitAndLossSummary(supabase, connection.user_id, connection.business_timezone);
    } else if (looksLikeFiveLineSummary(text)) {
      reply = await buildFiveLineSummary(supabase, connection.user_id, connection.business_timezone);
    } else if (looksLikeSummaryQuestion(text)) {
      reply = await buildSalesSummary(supabase, connection.user_id, connection.business_timezone);
    } else if (looksLikeOrderMessage(text) && !looksLikeSalesEntry(text)) {
      reply = [
        "This WhatsApp number is for staff operations.",
        "Please use the business customer number for orders, bookings, and customer requests.",
        "Staff can use this line for sales logs, closeout, P&L, 5-line summaries, and workflow requests.",
      ].join("\n");
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
      await logAnalyticsEvent(supabase, connection.user_id, "sales_log_entry_created", {
        source: "whatsapp_text",
        entry_type: entryType,
        has_total: !!parsed.total,
      });

      const lines = [`Logged from WhatsApp.`];
      lines.push(`Type: ${entryType === "expense" ? "Expense" : entryType === "note" ? "Note" : "Sale"}`);
      if (parsed.item) lines.push(`Item: ${parsed.item}${parsed.qty ? ` x ${parsed.qty}` : ""}`);
      if (parsed.total) lines.push(`Amount: ₦${Number(parsed.total).toLocaleString()}`);
      if (parsed.customer) lines.push(`Customer: ${parsed.customer}`);
      reply = lines.join("\n");
    } else {
      reply = "Received. Send a sales update like “Sold 3 gowns, 2 fittings. Transfer ₦42,000” or ask “How much did we sell today?”";
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
        await logAnalyticsEvent(supabase, connection.user_id, "kapso_reply_failed", {
          connection_type: connection.connection_type || "internal",
          message_id: message.messageId || null,
          error: err instanceof Error ? err.message : "Kapso reply failed",
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers });
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
