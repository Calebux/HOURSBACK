import { ParsedMessage } from "./whatsapp_core.ts";
import { hasMediaMessage } from "./whatsapp_normalize.ts";
import { extractAvailabilityItem } from "./whatsapp_orders.ts";
// Pure text classifiers for routing inbound WhatsApp messages.

export function looksLikeSalesEntry(text: string) {
  return /\b(sold|sell|sale|sales|refund|refunded|return|returned|reversal|spent|expense|bought|paid|cash|transfer|pos|₦|ngn|naira|\d+\s+(?:at|for|x|@)|\d+\s*[a-z][a-z\s-]*\s+(?:at|were|was)|\d+\s+[a-z][a-z\s-]{1,40}\s+[0-9][0-9,]*(?:\.\d+)?\s*k?\s*(?:each|per)?)\b/i.test(text);
}

export function looksLikeSummaryQuestion(text: string) {
  return /\b(how much|total|summary|sold most|top item|today|sales today|what sold|report|5\s*-?\s*liner?|five\s*-?\s*line)\b/i.test(text);
}

export function looksLikeSalesLogQuestion(text: string) {
  return /\b(how much|how many|what did|what sold|show|list|total|summary|top item|sales today|sales yesterday|sold today|sold yesterday|this week|this month|last 7 days|sales log)\b/i.test(text)
    || (/\?/.test(text) && /\b(sales?|sold|sell|revenue|expenses?|entries|log|shop|branch|staff|item|cash|transfer|pos|today|yesterday|week|month)\b/i.test(text));
}

export function looksLikeDirectorySetup(text: string) {
  return /^\/?(staff|shops?)\s*[:=-]\s*/i.test(text.trim())
    || /\b(add|set|register)\s+(staff|sales reps?|shops?|branches?)\b/i.test(text);
}

export function looksLikeCatalogSetup(text: string) {
  const trimmed = text.trim();
  return /^\/?(catalog|items?|products?|stock)\s*[:=-]\s*/i.test(trimmed)
    || /\b(add|set|update)\s+(catalog|items?|products?|stock)\b/i.test(trimmed)
    || /^\/?(restock|price)\s+/i.test(trimmed);
}

export function looksLikeWorkflowRequest(text: string) {
  return /\b(schedule|deliver|every day|daily|weekly|monthly|every week|workflow|pdf|email|whatsapp)\b/i.test(text)
    && /\b(workflow|report|summary|p&l|profit and loss|sales|5\s*-?\s*liner?|five\s*-?\s*line)\b/i.test(text);
}

export function looksLikeRecurringWorkflowRequest(text: string) {
  return /\b(every day|every week|every month|daily|weekly|monthly|schedule|recurring|automatically|auto|deliver every)\b/i.test(text)
    && /\b(report|summary|p&l|profit and loss|sales|workflow|email|whatsapp|pdf)\b/i.test(text);
}

export function looksLikeReportGenerationRequest(text: string) {
  if (looksLikeRecurringWorkflowRequest(text)) return false;
  if (looksLikeFiveLineSummary(text) && !/\b(report|pdf|email|generate|create|send)\b/i.test(text)) return false;
  return /\b(report|pdf|email|send|generate|create|p&l|profit and loss|profit\/loss|profit loss|sales summary|5\s*-?\s*liner?|five\s*-?\s*line)\b/i.test(text)
    && /\b(report|pdf|email|p&l|profit|sales|summary|5\s*-?\s*liner?|five\s*-?\s*line)\b/i.test(text);
}

export function looksLikeProfitAndLossQuestion(text: string) {
  return /\b(p&l|profit and loss|profit\/loss|profit loss)\b/i.test(text);
}

export function looksLikeFiveLineSummary(text: string) {
  return /\b(5\s*-?\s*liner?|five\s*-?\s*line|five\s+liner?)\b/i.test(text);
}

export function parseWorkflowRequest(text: string) {
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

export function looksLikeCloseoutStart(text: string) {
  return /^(\/)?(close|closeout|close out|end day|eod)\b/i.test(text.trim());
}

export function looksLikeOrderMessage(text: string) {
  return /\b(order|book|booking|appointment|deliver|delivery|pickup|pick up|buy|purchase|want|need|send me|i'll take|i want|reserve|request|quote|invoice)\b/i.test(text)
    || /\b(size|colour|color|service|repair|consultation|installation|subscription|package|unit|piece|pcs|pack|item|product)\b/i.test(text);
}

export function looksLikePaymentConfirmation(text: string) {
  return /\b(paid|payment done|sent receipt|receipt sent|i have paid|i've paid|done payment|transfer(?:red)?|bank transfer done)\b/i.test(text);
}

export function looksLikeReceiptIntent(text: string) {
  return /\b(receipt|proof|payment proof|transfer receipt|bank receipt)\b/i.test(text)
    && /\b(sent|attached|upload|uploaded|here|proof|receipt)\b/i.test(text);
}

export function looksLikeReceiptSubmission(text: string, message: ParsedMessage) {
  return looksLikeReceiptIntent(text) || (hasMediaMessage(message) && /\b(receipt|proof|paid|payment|transfer)\b/i.test(text));
}

export function looksLikeNonPaymentMediaCaption(text: string) {
  return /\b(style|sample|reference|design|color|colour|size|damage|damaged|broken|fault|issue|photo of|picture of|this item|this product|inspiration)\b/i.test(text)
    && !/\b(receipt|proof|paid|payment|transfer)\b/i.test(text);
}

export function looksLikeMenuRequest(text: string) {
  return /\b(menu|catalogue|catalog|service list|price list|pricelist|prices|how much|what do you sell|what services|what do you offer|what do you have|available items|available services|list of items|list of services)\b/i.test(text);
}

export function isPickupReply(text: string) {
  return /^(pickup|pick up|collection|collect|i will pick up|i'll pick up)$/i.test(text.trim());
}

export function looksLikeAddressReply(text: string) {
  const normalized = text.trim();
  if (!normalized || normalized.length > 160) return false;
  if (looksLikeMenuRequest(normalized) || extractAvailabilityItem(normalized) || looksLikeWorkflowRequest(normalized)) return false;
  if (looksLikeOrderMessage(normalized)) return false;
  return /[a-z]/i.test(normalized);
}

export function looksLikeCancelRequest(text: string) {
  return /\b(cancel|cancelled|canceled|stop|drop|forget it|no longer need)\b/i.test(text)
    && /\b(order|request|booking|appointment|reference|ref|#|[A-Z0-9]{8})\b/i.test(text);
}

export function looksLikeOrderEditRequest(text: string) {
  return /\b(add|remove|change|switch|update|move|reschedule|postpone|instead|make it|can we|modify)\b/i.test(text)
    && /\b(order|request|booking|appointment|delivery|pickup|address|time|date|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|item|service)\b/i.test(text);
}

export function looksLikeRefundRequest(text: string) {
  return /\b(refund|reverse|reversal|chargeback|money back|return my money)\b/i.test(text);
}

