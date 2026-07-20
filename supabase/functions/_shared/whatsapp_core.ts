// Shared core for every WhatsApp provider webhook (Kapso, Zernio, WABA gateway, Meta).
// Types, plan limits, analytics, rate limiting, and the webhook event inbox.
import { checkRateLimit } from "./security.ts";

export const PHONE_WEBHOOK_LIMIT_PER_MINUTE = 180;
export const FREE_INTERNAL_MESSAGES_PER_DAY = 300;
export const PRO_MESSAGES_PER_DAY = 10_000;
export const PRO_AI_MESSAGES_PER_DAY = 1_500;
export const FREE_AI_MESSAGES_PER_DAY = 80;
export const FREE_REPORTS_PER_HOUR = 2;
export const PRO_REPORTS_PER_HOUR = 12;
export const AI_REPORT_ROW_LIMIT = 1_000;

export type ParsedMessage = {
  messageId?: string;
  phoneNumberId?: string;
  from?: string;
  replyTo?: string;
  to?: string;
  contactName?: string;
  type?: string;
  direction?: string;
  text?: string;
  receiptUrl?: string;
  mediaId?: string;
};

export type ParsedOrder = {
  items?: Array<{ name: string; qty?: number | null; unit_price?: number | null }>;
  delivery_address?: string | null;
  payment_method?: string | null;
  customer_name?: string | null;
  notes?: string | null;
};

export type CustomerAIAction =
  | "answer"
  | "order"
  | "payment_claim"
  | "receipt_submitted"
  | "workflow_request"
  | "handoff";

export type CustomerAIResponse = {
  action: CustomerAIAction;
  reply?: string | null;
};

export function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function logAnalyticsEvent(
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

export async function getProfile(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function normalizePhone(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

export function isProProfile(profile: any) {
  return profile?.subscription_status === "pro";
}

export async function checkWebhookRateLimit(
  supabase: any,
  key: string,
  limit: number,
  windowSeconds: number,
  eventName: string,
  userId: string | null,
  properties: Record<string, unknown>,
) {
  const result = await checkRateLimit(supabase, key, limit, windowSeconds);
  if (result.allowed) return true;
  await logAnalyticsEvent(supabase, userId, eventName, {
    ...properties,
    limit,
    window_seconds: windowSeconds,
  });
  return false;
}

export function planMessageLimit(profile: any, connectionType: string) {
  if (isProProfile(profile)) return PRO_MESSAGES_PER_DAY;
  return connectionType === "customer" ? 0 : FREE_INTERNAL_MESSAGES_PER_DAY;
}

export function planAiLimit(profile: any) {
  return isProProfile(profile) ? PRO_AI_MESSAGES_PER_DAY : FREE_AI_MESSAGES_PER_DAY;
}

export function planReportLimit(profile: any) {
  return isProProfile(profile) ? PRO_REPORTS_PER_HOUR : FREE_REPORTS_PER_HOUR;
}


// ── Webhook event inbox ──────────────────────────────────────────────────────

export async function recordInboundEvent(
  supabase: any,
  idempotencyKey: string,
  event: string | null,
  provider: string,
  payload: unknown,
): Promise<{ duplicate: boolean; eventId: string | null }> {
  const { data, error } = await supabase
    .from("kapso_webhook_events")
    .insert({
      idempotency_key: idempotencyKey,
      event,
      provider,
      payload: payload ?? null,
      status: "received",
    })
    .select("id")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return { duplicate: true, eventId: null };
    throw error;
  }
  return { duplicate: false, eventId: data?.id || null };
}

export async function markInboundEvent(
  supabase: any,
  eventId: string | null,
  status: "processed" | "failed",
  errorMessage: string | null = null,
) {
  if (!eventId) return;
  try {
    await supabase
      .from("kapso_webhook_events")
      .update({ status, error: errorMessage, completed_at: new Date().toISOString() })
      .eq("id", eventId);
  } catch (err) {
    console.error("Failed to mark webhook event:", err);
  }
}

// Fast-ack support: run processing after the HTTP response has been returned.
export function runInBackground(work: Promise<unknown>) {
  const edge = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (edge?.waitUntil) {
    edge.waitUntil(work);
  } else {
    work.catch((err) => console.error("Background webhook processing failed:", err));
  }
}

// Generic HMAC-SHA256 signature check (hex digests; sha256=/v1= prefixes; comma lists).
export async function verifyHmacSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  const signatureCandidates = signature
    .trim()
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      const [, value] = trimmed.match(/^(?:sha256|v1)=([^,]+)$/i) || [];
      return [trimmed, value].filter(Boolean) as string[];
    })
    .map((value) => value.replace(/^sha256=/i, "").trim());

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const bodiesToCheck = [rawBody];
  try {
    bodiesToCheck.push(JSON.stringify(JSON.parse(rawBody)));
  } catch {
    // raw body only
  }

  for (const body of bodiesToCheck) {
    const expected = bytesToHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
    if (signatureCandidates.some((candidate) => timingSafeEqual(candidate, expected))) return true;
  }
  return false;
}
