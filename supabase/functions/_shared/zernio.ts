const ZERNIO_API_BASE = (Deno.env.get("ZERNIO_API_BASE") || "https://api.zernio.com").replace(/\/+$/, "");

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

export async function sendZernioText(phoneNumberId: string, to: string, body: string) {
  return zernioFetch(`/meta/whatsapp/v24.0/${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body },
    }),
  });
}

/** Verify an inbound Meta X-Hub-Signature-256 HMAC. */
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
