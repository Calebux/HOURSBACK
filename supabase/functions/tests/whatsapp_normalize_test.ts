// Golden tests: raw provider payload in → normalized ParsedMessage out.
// Run: cd supabase/functions && deno test --node-modules-dir=none tests/
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { extractMetaEvents, hasMediaMessage, parseKapsoMessage } from "../_shared/whatsapp_normalize.ts";

const META_TEXT_PAYLOAD = {
  object: "whatsapp_business_account",
  entry: [{
    id: "102290129340398",
    changes: [{
      field: "messages",
      value: {
        messaging_product: "whatsapp",
        metadata: { display_phone_number: "15550001111", phone_number_id: "106540352242922" },
        contacts: [{ profile: { name: "Ada" }, wa_id: "2348012345678" }],
        messages: [{
          from: "2348012345678",
          id: "wamid.HBgNMjM0ODAxMjM0NTY3OBUCABIYFjNFQjBEMUZGQzdGQjVEQzE2NUYzRUEA",
          timestamp: "1752771600",
          type: "text",
          text: { body: "sold 3 bags of rice 4500 each cash" },
        }],
      },
    }],
  }],
};

const META_IMAGE_PAYLOAD = {
  object: "whatsapp_business_account",
  entry: [{
    changes: [{
      field: "messages",
      value: {
        metadata: { display_phone_number: "15550001111", phone_number_id: "106540352242922" },
        contacts: [{ profile: { name: "Ada" }, wa_id: "2348012345678" }],
        messages: [{
          from: "2348012345678",
          id: "wamid.IMAGE1",
          timestamp: "1752771700",
          type: "image",
          image: { id: "media-123", mime_type: "image/jpeg", caption: "payment receipt HB-1234" },
        }],
      },
    }],
  }],
};

const META_STATUS_PAYLOAD = {
  object: "whatsapp_business_account",
  entry: [{
    changes: [{
      field: "messages",
      value: {
        metadata: { phone_number_id: "106540352242922" },
        statuses: [{ id: "wamid.X", status: "delivered", recipient_id: "2348012345678" }],
      },
    }],
  }],
};

Deno.test("extractMetaEvents: text message normalizes end-to-end", () => {
  const events = extractMetaEvents(META_TEXT_PAYLOAD, "meta");
  assertEquals(events.length, 1);
  const message = parseKapsoMessage(events[0]);
  assertEquals(message?.phoneNumberId, "106540352242922");
  assertEquals(message?.from, "2348012345678");
  assertEquals(message?.text, "sold 3 bags of rice 4500 each cash");
  assertEquals(message?.type, "text");
  assertEquals(message?.contactName, "Ada");
  assertEquals(message?.direction, "inbound");
  assertEquals(message?.messageId?.startsWith("wamid."), true);
});

Deno.test("extractMetaEvents: image message carries media id and caption", () => {
  const events = extractMetaEvents(META_IMAGE_PAYLOAD, "meta");
  assertEquals(events.length, 1);
  const message = parseKapsoMessage(events[0]);
  assertEquals(message?.type, "image");
  assertEquals(message?.mediaId, "media-123");
  assertEquals(message?.text, "payment receipt HB-1234");
  assertEquals(message ? hasMediaMessage(message) : false, true);
});

Deno.test("extractMetaEvents: status-only payloads yield no events", () => {
  assertEquals(extractMetaEvents(META_STATUS_PAYLOAD, "meta").length, 0);
});

Deno.test("extractMetaEvents: multiple messages in one payload all extracted", () => {
  const payload = structuredClone(META_TEXT_PAYLOAD);
  payload.entry[0].changes[0].value.messages.push({
    from: "2348099999999",
    id: "wamid.SECOND",
    timestamp: "1752771601",
    type: "text",
    text: { body: "how much is delivery to Yaba" },
  });
  const events = extractMetaEvents(payload, "meta");
  assertEquals(events.length, 2);
  assertEquals(parseKapsoMessage(events[1])?.from, "2348099999999");
});

Deno.test("parseKapsoMessage: Kapso-native payload still parses", () => {
  const message = parseKapsoMessage({
    event: "whatsapp.message.received",
    data: {
      message: {
        id: "kapso-msg-1",
        from: "2348012345678",
        to: "2348000000000",
        type: "text",
        text: { body: "closeout" },
        kapso: { direction: "inbound" },
      },
      phone_number_id: "kapso-phone-1",
    },
  });
  assertEquals(message?.messageId, "kapso-msg-1");
  assertEquals(message?.phoneNumberId, "kapso-phone-1");
  assertEquals(message?.text, "closeout");
  assertEquals(message?.direction, "inbound");
});
