/**
 * Shared security utilities for Hoursback edge functions.
 * Import with: import { ... } from "../_shared/security.ts"
 */

/** Strip control characters and truncate to maxLength. */
export function sanitizeText(input: unknown, maxLength = 5000): string {
  if (typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    // Remove ASCII control chars except tab (\x09), LF (\x0A), CR (\x0D)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

/** Returns true if the string is a valid UUID. */
export function isValidUUID(str: unknown): boolean {
  if (typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Validates a URL and blocks SSRF targets (localhost, private IPs, cloud metadata).
 * Returns the cleaned URL string, or null if unsafe/invalid.
 */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  try {
    const url = new URL(input.trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const h = url.hostname.toLowerCase();
    if (
      h === "localhost" ||
      h === "0.0.0.0" ||
      h === "169.254.169.254" || // AWS metadata
      h === "metadata.google.internal" || // GCP metadata
      /^127\./.test(h) ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      h.endsWith(".local") ||
      h.endsWith(".internal") ||
      h.endsWith(".localhost")
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Sanitize an array of URLs, filtering out unsafe/invalid ones. Caps at maxUrls. */
export function sanitizeUrlList(input: unknown, maxUrls = 10): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((u) => sanitizeUrl(u))
    .filter((u): u is string => u !== null)
    .slice(0, maxUrls);
}

/** Extract the best available client IP from request headers. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Atomic rate-limit check via Supabase RPC.
 * Fails open on DB error (doesn't block legitimate traffic if DB is down).
 */
export async function checkRateLimit(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error || !data) return { allowed: true, remaining: limit };
    return {
      allowed: data.allowed as boolean,
      remaining: data.remaining as number,
    };
  } catch {
    return { allowed: true, remaining: limit };
  }
}

/** Standard 429 Too Many Requests response. */
export function rateLimitResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  );
}

/**
 * Sanitize JSONB data_source_config coming from user-controlled workflow config.
 * Cleans URLs and text fields to prevent SSRF and injection.
 */
// deno-lint-ignore no-explicit-any
export function sanitizeDataSourceConfig(config: any): any {
  if (!config || typeof config !== "object") return config;
  const safe = { ...config };

  // Sanitize URL fields
  if (safe.url) {
    safe.url = sanitizeUrl(safe.url) ?? "";
  }
  if (safe.urls) {
    safe.urls = sanitizeUrlList(safe.urls);
  }

  // Sanitize text fields
  if (safe.query) safe.query = sanitizeText(safe.query, 500);
  if (safe.context) safe.context = sanitizeText(safe.context, 500);
  if (safe.text) safe.text = sanitizeText(safe.text, 10000);

  return safe;
}
