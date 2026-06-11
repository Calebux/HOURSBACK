const ZERNIO_API_BASE = (Deno.env.get("ZERNIO_API_BASE") || "https://zernio.com/api/v1").replace(/\/+$/, "");

export class ZernioApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ZernioApiError";
    this.status = status;
    this.details = details;
  }
}

export function getZernioApiKey(): string | null {
  return Deno.env.get("ZERNIO_API_KEY") || null;
}

export function getZernioWebhookSecret(): string {
  return Deno.env.get("ZERNIO_WEBHOOK_SECRET") || "";
}

export async function zernioFetch(path: string, init: RequestInit = {}) {
  const apiKey = getZernioApiKey();
  if (!apiKey) throw new Error("ZERNIO_API_KEY is not configured");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${ZERNIO_API_BASE}${path}`, { ...init, headers });

  const text = await response.text();
  let json: any = null;
  if (text) {
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
  }

  if (!response.ok) {
    const message = json?.error || json?.message || `Zernio request failed with ${response.status}`;
    throw new ZernioApiError(message, response.status, json);
  }

  return json;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function getOrCreateZernioProfile(name: string) {
  const configuredProfileId = Deno.env.get("ZERNIO_PROFILE_ID");
  if (configuredProfileId) return configuredProfileId;

  const profilesResponse = await zernioFetch("/profiles");
  const profiles = Array.isArray(profilesResponse?.profiles) ? profilesResponse.profiles : [];
  const existing = profiles.find((profile: any) => profile?.isDefault) || profiles[0];
  const existingId = firstString(existing?._id, existing?.id, existing?.profileId);
  if (existingId) return existingId;

  const created = await zernioFetch("/profiles", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  const profile = created?.profile || created?.data || created;
  const profileId = firstString(profile?._id, profile?.id, profile?.profileId);
  if (!profileId) throw new Error("Zernio did not return a profile id");
  return profileId;
}

export async function createZernioWhatsAppConnectUrl(profileId: string, redirectUrl: string) {
  const params = new URLSearchParams({ profileId, redirect_url: redirectUrl });
  const response = await zernioFetch(`/connect/whatsapp?${params.toString()}`);
  const authUrl = firstString(response?.authUrl, response?.data?.authUrl, response?.url);
  if (!authUrl) throw new Error("Zernio did not return an authUrl");
  return { authUrl, state: response?.state || null };
}

export async function ensureZernioWebhook(url: string) {
  const secret = getZernioWebhookSecret();
  if (!secret) throw new Error("ZERNIO_WEBHOOK_SECRET is not configured");

  const desired = {
    name: "Hoursback WhatsApp",
    url,
    secret,
    events: ["message.received"],
    isActive: true,
  };

  const existingResponse = await zernioFetch("/webhooks/settings");
  const webhooks = Array.isArray(existingResponse?.webhooks)
    ? existingResponse.webhooks
    : Array.isArray(existingResponse?.data)
      ? existingResponse.data
      : [];
  const existing = webhooks.find((webhook: any) => firstString(webhook?.url) === url);

  if (existing?._id) {
    return zernioFetch("/webhooks/settings", {
      method: "PUT",
      body: JSON.stringify({ _id: existing._id, ...desired }),
    });
  }

  return zernioFetch("/webhooks/settings", {
    method: "POST",
    body: JSON.stringify(desired),
  });
}

export async function sendZernioText(accountId: string, conversationId: string, body: string) {
  return zernioFetch(`/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    body: JSON.stringify({
      accountId,
      message: body,
    }),
  });
}

/** Verify an inbound Zernio or Meta-compatible HMAC. */
export async function verifyZernioSignature(rawBody: string, signature: string | null): Promise<boolean> {
  const secret = getZernioWebhookSecret();
  if (!signature || !secret) return false;

  const hex = signature.replace(/^sha256=/i, "").trim();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = [...new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)),
  )].map((b) => b.toString(16).padStart(2, "0")).join("");

  // Timing-safe compare
  if (hex.length !== expected.length) return false;
  let result = 0;
  for (let i = 0; i < hex.length; i++) result |= hex.charCodeAt(i) ^ expected.charCodeAt(i);
  return result === 0;
}
