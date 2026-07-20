// Receipt/media persistence for inbound WhatsApp messages, provider-aware.
import { getKapsoApiKey } from "./kapso.ts";
import { getMetaAccessToken, getMetaMediaUrl } from "./meta.ts";
import { ParsedMessage } from "./whatsapp_core.ts";

export function findReceiptUrl(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const embeddedUrl = trimmed.match(/https?:\/\/[^\s)]+/i)?.[0];
    if (embeddedUrl) return embeddedUrl;
  }
  return undefined;
}

export function extensionForContentType(contentType: string) {
  if (/png/i.test(contentType)) return "png";
  if (/webp/i.test(contentType)) return "webp";
  if (/pdf/i.test(contentType)) return "pdf";
  return "jpg";
}

export async function persistReceiptMedia(supabase: any, order: any, message: ParsedMessage, receiptUrl: string | null, provider?: string) {
  const isMetaMedia = provider === "meta" && !!message.mediaId;
  if (!receiptUrl && !isMetaMedia) {
    return { status: "failed", error: "No receipt media URL found" };
  }

  try {
    // Meta media is fetched by id: resolve the short-lived CDN URL, then
    // download with the Graph token. Zernio URLs are pre-signed; Kapso
    // media needs the Kapso API key.
    const mediaUrl = isMetaMedia ? await getMetaMediaUrl(message.mediaId!) : receiptUrl!;
    let authHeaders: Record<string, string> | undefined;
    if (isMetaMedia) {
      authHeaders = { "Authorization": `Bearer ${getMetaAccessToken() || ""}` };
    } else if (provider !== "zernio" && provider !== "meta") {
      const apiKey = getKapsoApiKey();
      if (apiKey) {
        authHeaders = {
          "X-API-Key": apiKey,
          "Authorization": `Bearer ${apiKey}`,
        };
      }
    }
    const response = await fetch(mediaUrl, {
      headers: authHeaders,
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

