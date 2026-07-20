import { ParsedMessage, firstString } from "./whatsapp_core.ts";
import { findReceiptUrl } from "./whatsapp_media.ts";
// Provider payload normalization into the internal ParsedMessage shape.

export function parseKapsoMessage(payload: any): ParsedMessage | null {
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
    replyTo: firstString(kapso?.reply_to, kapso?.conversation_id, data?.reply_to, conversation?.id),
    to: firstString(msg?.to, data?.to, kapso?.to),
    contactName: firstString(conversationKapso?.contact_name, kapso?.contact_name, msg?.contact_name, data?.contact_name, data?.contact?.name, data?.profile?.name),
    type: firstString(msg?.type, data?.type) || (text ? "text" : undefined),
    direction: firstString(kapso?.direction, data?.direction, msg?.direction, conversationKapso?.direction),
    text,
    mediaId: firstString(
      msg?.media_id,
      data?.media_id,
      msg?.image?.id,
      msg?.document?.id,
      msg?.video?.id,
      msg?.audio?.id,
    ),
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

export function hasMediaMessage(message: ParsedMessage) {
  const type = String(message.type || "").toLowerCase();
  return ["image", "document", "video"].includes(type) || !!message.receiptUrl;
}


// ── Meta WhatsApp Cloud API payloads ─────────────────────────────────────────

/** Normalize one message from a Meta Cloud API webhook `value` into the internal shape. */
export function normalizeMetaValueMessage(value: any, message: any, origin = "meta") {
  const metadata = value?.metadata || {};
  const contact = (value?.contacts || []).find((c: any) => c?.wa_id === message?.from)
    || value?.contacts?.[0] || {};
  const phoneNumberId = firstString(metadata?.phone_number_id, message?.phone_number_id);
  const from = firstString(message?.from);
  const type = firstString(message?.type) || "text";
  const textBody = firstString(message?.text?.body, message?.[type]?.caption, message?.caption);

  let mediaId: string | undefined;
  let mediaUrl: string | undefined;
  if (["image", "document", "audio", "video", "sticker"].includes(type)) {
    mediaId = firstString(message?.[type]?.id);
    mediaUrl = firstString(message?.[type]?.url, message?.[type]?.link);
  }

  return {
    event: "whatsapp.message.received",
    message: {
      id: firstString(message?.id),
      from,
      to: firstString(metadata?.display_phone_number),
      text: textBody ? { body: textBody } : undefined,
      type,
      timestamp: firstString(message?.timestamp) || String(Math.floor(Date.now() / 1000)),
      phone_number_id: phoneNumberId,
      contact_name: firstString(contact?.profile?.name),
      media_id: mediaId,
      media_url: mediaUrl,
      kapso: {
        direction: "inbound",
        content: textBody,
        status: "received",
        origin,
      },
    },
    phone_number_id: phoneNumberId,
    gateway: { provider: origin, raw_event: "messages" },
  };
}

/** Extract every inbound message event from a Meta Cloud API webhook payload. */
export function extractMetaEvents(payload: any, origin = "meta") {
  const events: ReturnType<typeof normalizeMetaValueMessage>[] = [];
  for (const entry of payload?.entry || []) {
    for (const change of entry?.changes || []) {
      if (change?.field && change.field !== "messages") continue;
      const value = change?.value || {};
      for (const message of value?.messages || []) {
        events.push(normalizeMetaValueMessage(value, message, origin));
      }
    }
  }
  return events;
}
