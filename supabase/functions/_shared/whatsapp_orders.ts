// Customer-line order flow: menus, orders, payments, receipts, customer AI.
import Anthropic from "npm:@anthropic-ai/sdk";
import { sendWhatsAppTextForProvider } from "./kapso.ts";
import { CustomerAIAction, CustomerAIResponse, ParsedMessage, ParsedOrder, logAnalyticsEvent } from "./whatsapp_core.ts";
import { isPickupReply, looksLikeAddressReply, looksLikeNonPaymentMediaCaption, looksLikeReceiptIntent, parseWorkflowRequest } from "./whatsapp_intents.ts";
import { findReceiptUrl, persistReceiptMedia } from "./whatsapp_media.ts";
import { hasMediaMessage } from "./whatsapp_normalize.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

export function generateOrderCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function extractOrderCode(text: string) {
  const match = text.match(/\b(?:order\s*)?#?\s*([A-Z0-9]{8})\b/i);
  return match?.[1]?.toUpperCase() || null;
}

export async function saveWorkflowRequest(supabase: any, connection: any, message: ParsedMessage, text: string) {
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

export function extractAvailabilityItem(text: string) {
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

export function normalizeItemText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\b(x|and|with|the|a|an|some|any)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function menuHasItem(menu: string | null | undefined, item: string) {
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

export function buildMenuReply(connection: any) {
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

export function buildAvailabilityReply(connection: any, item: string) {
  const menu = String(connection.customer_menu || "").trim();
  if (!menu) {
    return `I need a staff member to confirm ${item}. The catalogue or service list is not configured yet.`;
  }

  if (menuHasItem(menu, item)) {
    return `Yes, ${item} is listed. Send the quantity and delivery, pickup, appointment, or job details to continue.`;
  }

  return `I cannot find ${item} on the current catalogue or service list. Here is what is listed:\n${menu}`;
}

export function orderTotal(items: Array<{ unit_price?: number | null; qty?: number | null }>) {
  const total = items.reduce((sum, item) => {
    const qty = Number(item.qty || 1);
    const price = Number(item.unit_price || 0);
    return price > 0 ? sum + qty * price : sum;
  }, 0);
  return total > 0 ? total : null;
}

export function isPickupDelivery(value: string | null | undefined) {
  return /^(pickup|pick up|collection|collect)$/i.test(String(value || "").trim());
}

export function extractMoney(text: string) {
  const match = text.replace(/,/g, "").match(/(?:₦|ngn|naira)?\s*([0-9][0-9]*(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

export function deliveryFeeFromMenu(menu: string | null | undefined, deliveryAddress: string | null | undefined) {
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

export function expectedOrderTotal(items: any[], deliveryFee: number | null) {
  const itemTotal = orderTotal(items);
  if (!itemTotal && !deliveryFee) return null;
  return Number(itemTotal || 0) + Number(deliveryFee || 0);
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function parseClaimedPaymentAmount(text: string) {
  const normalized = text.replace(/,/g, "");
  const labelled = normalized.match(/\b(?:amount|amont|paid|payment|transferred|sent)\b\s*(?:was|is|of|for|:|-)?\s*(?:₦|ngn|naira)?\s*([0-9][0-9]*(?:\.\d+)?)/i);
  if (labelled) return Number(labelled[1]);

  const currency = normalized.match(/(?:₦|ngn|naira)\s*([0-9][0-9]*(?:\.\d+)?)/i);
  return currency ? Number(currency[1]) : null;
}

export function cleanPaymentMethod(value: string | null | undefined) {
  const paymentMethod = String(value || "").trim();
  if (!paymentMethod) return null;
  if (/^(pickup|pick up|delivery|address|none|not specified)$/i.test(paymentMethod)) return null;
  return paymentMethod;
}

export function allowsCashOnPickup(connection: any) {
  const combined = [
    connection.fulfillment_rules || "",
    connection.payment_instructions || "",
    connection.customer_menu || "",
  ].join("\n");
  return /\b(cash on pickup|cash at pickup|pay on pickup|pay at pickup|cash on collection|pay on collection|pay cash when collecting)\b/i.test(combined);
}

export async function parseOrderWithAI(text: string, menu?: string | null, existingOrder?: any): Promise<ParsedOrder> {
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

export function orderItemsSummary(items: any[]) {
  if (!items?.length) return "your order";
  return items.map((item) => `${item.qty ? `${item.qty} x ` : ""}${item.name}`).join(", ");
}

export function requestSummaryLabel(requestType?: string | null) {
  return ["booking", "service", "repair", "quote"].includes(String(requestType || "")) ? "Request" : "Items";
}

export function classifyRequestType(text: string, items: any[] = [], deliveryAddress?: string | null) {
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

export async function findOpenCustomerOrder(supabase: any, connection: any, from?: string) {
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

export async function findLatestActiveCustomerOrder(supabase: any, connection: any, from?: string) {
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

export async function findRecentDuplicateCustomerOrder(supabase: any, connection: any, message: ParsedMessage, text: string) {
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

export async function findAwaitingReceiptOrders(supabase: any, connection: any, from?: string) {
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

export async function cancelCustomerOrderByText(supabase: any, connection: any, message: ParsedMessage, text: string) {
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

export async function saveOwnerReviewRequest(supabase: any, connection: any, order: any, message: ParsedMessage, text: string) {
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

export async function handleMediaWithoutReceiptMatch(supabase: any, connection: any, message: ParsedMessage, text: string, payload: any) {
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

export async function findLatestAwaitingReceiptOrder(supabase: any, connection: any, from?: string, text = "") {
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

export async function findCashPickupOrderByText(supabase: any, connection: any, from?: string, text = "") {
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

export function ambiguousPaymentReferenceReply(prefix: string, orders: any[]) {
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

export async function promptForReceipt(supabase: any, connection: any, message: ParsedMessage, text = "") {
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

export async function markLatestOrderReceiptSent(supabase: any, connection: any, message: ParsedMessage, text: string, payload: any) {
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
  const storedReceipt = await persistReceiptMedia(supabase, order, message, receiptUrl, connection?.whatsapp_provider);
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
      await sendWhatsAppTextForProvider(connection.whatsapp_provider, connection.phone_number_id, ownerNumber, ownerLines.join("\n"));
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

export function sanitizeCustomerAIResponse(value: any): CustomerAIResponse | null {
  const action = String(value?.action || "").trim() as CustomerAIAction;
  if (!["answer", "order", "payment_claim", "receipt_submitted", "workflow_request", "handoff"].includes(action)) {
    return null;
  }
  const reply = typeof value?.reply === "string" && value.reply.trim() ? value.reply.trim() : null;
  return { action, reply };
}

export async function getLatestCustomerOrderContext(supabase: any, connection: any, from?: string) {
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

export async function getCustomerAIResponse(supabase: any, connection: any, message: ParsedMessage, text: string, openOrder: any): Promise<CustomerAIResponse | null> {
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

export async function handleCustomerAIAction(
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

export async function logCustomerAIAction(
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

export async function handleCustomerOrder(supabase: any, connection: any, message: ParsedMessage, text: string, openOrder?: any) {
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

