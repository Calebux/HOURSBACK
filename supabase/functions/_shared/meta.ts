// Direct Meta WhatsApp Cloud API client (no BSP in between).
// Env: META_ACCESS_TOKEN, META_APP_SECRET, META_VERIFY_TOKEN, optional META_GRAPH_VERSION.

const META_GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v23.0";
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export class MetaApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "MetaApiError";
    this.status = status;
    this.details = details;
  }
}

export function getMetaAccessToken(): string | null {
  return Deno.env.get("META_ACCESS_TOKEN") || null;
}

export function getMetaVerifyToken(): string {
  return Deno.env.get("META_VERIFY_TOKEN") || "";
}

export async function metaFetch(path: string, init: RequestInit = {}) {
  const token = getMetaAccessToken();
  if (!token) throw new Error("META_ACCESS_TOKEN is not configured");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${META_GRAPH_BASE}${path}`, { ...init, headers });

  const text = await response.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  if (!response.ok) {
    const message = json?.error?.message || json?.error || `Meta request failed with ${response.status}`;
    throw new MetaApiError(message, response.status, json);
  }

  return json;
}

export async function sendMetaText(phoneNumberId: string, to: string, body: string) {
  return metaFetch(`/${phoneNumberId}/messages`, {
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

/**
 * Send a pre-approved template message — required outside Meta's 24-hour
 * customer service window (owner alerts, digests, restock notices).
 */
export async function sendMetaTemplate(
  phoneNumberId: string,
  to: string,
  templateName: string,
  languageCode = "en",
  components: unknown[] = [],
) {
  return metaFetch(`/${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length ? { components } : {}),
      },
    }),
  });
}

/** Resolve a media id to its short-lived CDN URL (download needs the Bearer token). */
export async function getMetaMediaUrl(mediaId: string): Promise<string> {
  const json = await metaFetch(`/${mediaId}`);
  const url = typeof json?.url === "string" ? json.url : null;
  if (!url) throw new MetaApiError("Meta media response did not include a URL", 404, json);
  return url;
}

/** Verify Meta's X-Hub-Signature-256 header (HMAC-SHA256 of the raw body with the app secret). */
export async function verifyMetaSignature(rawBody: string, signature: string | null): Promise<boolean> {
  const secret = Deno.env.get("META_APP_SECRET") || "";
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

  if (hex.length !== expected.length) return false;
  let result = 0;
  for (let i = 0; i < hex.length; i++) result |= hex.charCodeAt(i) ^ expected.charCodeAt(i);
  return result === 0;
}
