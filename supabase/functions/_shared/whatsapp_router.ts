// Provider-agnostic inbound WhatsApp message processing.
// Every provider webhook (Kapso, Zernio, WABA gateway, Meta) verifies its own
// signature, normalizes to ParsedMessage, records the event, and calls
// processInboundMessage — no HTTP self-forwarding between functions.
import { getOutboundMessageId, sendWhatsAppTextForProvider } from "./kapso.ts";
import { PHONE_WEBHOOK_LIMIT_PER_MINUTE, ParsedMessage, checkWebhookRateLimit, getProfile, isProProfile, logAnalyticsEvent, normalizePhone, planAiLimit, planMessageLimit } from "./whatsapp_core.ts";
import { looksLikeCancelRequest, looksLikeCatalogSetup, looksLikeCloseoutStart, looksLikeDirectorySetup, looksLikeFiveLineSummary, looksLikeMenuRequest, looksLikeOrderEditRequest, looksLikeOrderMessage, looksLikePaymentConfirmation, looksLikeProfitAndLossQuestion, looksLikeReceiptSubmission, looksLikeRefundRequest, looksLikeReportGenerationRequest, looksLikeSalesEntry, looksLikeSalesLogQuestion, looksLikeSummaryQuestion, looksLikeWorkflowRequest } from "./whatsapp_intents.ts";
import { hasMediaMessage } from "./whatsapp_normalize.ts";
import { buildAvailabilityReply, buildMenuReply, cancelCustomerOrderByText, extractAvailabilityItem, findLatestActiveCustomerOrder, findOpenCustomerOrder, getCustomerAIResponse, handleCustomerAIAction, handleCustomerOrder, handleMediaWithoutReceiptMatch, logCustomerAIAction, markLatestOrderReceiptSent, promptForReceipt, saveOwnerReviewRequest, saveWorkflowRequest } from "./whatsapp_orders.ts";
import { buildFiveLineSummary, buildProfitAndLossSummary, buildSalesLogQueryAnswer, generateWhatsAppBusinessReport } from "./whatsapp_reports.ts";
import { applyCatalogContext, applyDirectoryContext, closeoutPrompt, contextPrompt, findActiveCloseoutSession, findActiveSalesLogSession, handleCatalogSetup, handleDirectorySetup, handlePendingSalesLogSession, internalContactsConfigured, internalWelcomeReply, loadBusinessDirectory, loadCatalogItems, loadInternalContact, parseEntryWithAI, permissionDeniedReply, persistSalesLogEntries, recordPendingInternalSender, saveCloseout, savePendingSalesLogSession, shouldRequireContext, unauthorizedInternalReply } from "./whatsapp_sales.ts";

export type InboundMode = "customer" | "internal";

export type InboundOptions = {
  /** User id when the webhook URL is scoped (?uid=...); otherwise routed by phone_number_id. */
  uid?: string | null;
  requestedMode?: InboundMode | null;
  /** Provider to stamp on auto-created connections (kapso | waba_gateway | zernio | meta). */
  provider?: string | null;
  /** Whether the calling webhook has a signature secret configured (stored on new connections). */
  webhookSecretSet?: boolean;
};

export type InboundResult = {
  status: "processed" | "ignored";
  reason?: string;
  replied?: boolean;
};

export async function processInboundMessage(
  supabase: any,
  payload: any,
  message: ParsedMessage,
  opts: InboundOptions = {},
): Promise<InboundResult> {
  const uid = opts.uid || null;
  const requestedMode = opts.requestedMode || null;

  const phoneAllowed = await checkWebhookRateLimit(
    supabase,
    `kapso-phone:${message.phoneNumberId}`,
    PHONE_WEBHOOK_LIMIT_PER_MINUTE,
    60,
    "whatsapp_webhook_rate_limited",
    null,
    {
      scope: "phone_number",
      phone_number_id: message.phoneNumberId,
      message_id: message.messageId || null,
    },
  );
  if (!phoneAllowed) {
    return { status: "ignored", reason: "rate limited" };
  }

  let query = supabase.from("kapso_connections").select("*").limit(2);
  if (uid && requestedMode) {
    query = query.eq("user_id", uid).eq("connection_type", requestedMode);
  } else {
    query = uid
      ? query.eq("user_id", uid).eq("phone_number_id", message.phoneNumberId)
      : query.eq("phone_number_id", message.phoneNumberId);
  }

  let { data: connections, error: connectionError } = await query;
  if (connectionError) throw connectionError;
  let connection = connections?.[0];
  if (!connection && uid) {
    const fallback = await supabase
      .from("kapso_connections")
      .select("*")
      .eq("user_id", uid)
      .eq("phone_number_id", message.phoneNumberId)
      .order("connection_type", { ascending: true })
      .limit(1);
    if (fallback.error) throw fallback.error;
    connections = fallback.data;
    connection = connections?.[0];
  }
  if (!connection) {
    if (!uid) {
      console.log("WhatsApp webhook ignored: no matching connection", { phoneNumberId: message.phoneNumberId });
      return { status: "ignored", reason: "no matching connection" };
    }

    const { data: createdConnection, error: createConnectionError } = await supabase
      .from("kapso_connections")
      .insert({
        user_id: uid,
        connection_type: requestedMode || "internal",
        phone_number_id: message.phoneNumberId,
        phone_number: message.to || null,
        display_name: requestedMode === "customer" ? "Customer Requests" : "Business WhatsApp",
        status: "connected",
        webhook_secret_set: opts.webhookSecretSet ?? true,
        last_webhook_at: new Date().toISOString(),
        ...(opts.provider ? { whatsapp_provider: opts.provider } : {}),
      })
      .select("*")
      .single();

    if (createConnectionError) throw createConnectionError;
    connection = createdConnection;
  }

  if (
    uid
    && requestedMode
    && connection.phone_number_id
    && connection.phone_number_id !== message.phoneNumberId
  ) {
    console.log("WhatsApp webhook phone number id changed for signed mode URL", {
      mode: requestedMode,
      previousPhoneNumberId: connection.phone_number_id,
      incomingPhoneNumberId: message.phoneNumberId,
    });
    await logAnalyticsEvent(supabase, connection.user_id, "whatsapp_phone_number_id_changed", {
      connection_type: requestedMode,
      previous_phone_number_id: connection.phone_number_id,
      incoming_phone_number_id: message.phoneNumberId,
    });
  }

  await supabase.from("kapso_connections").update({
    phone_number_id: message.phoneNumberId,
    phone_number: connection.phone_number || message.to || null,
    status: connection.kapso_webhook_registered_at ? "webhook_active" : "connected",
    last_webhook_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", connection.id);

  const profile = await getProfile(supabase, connection.user_id);
  if (connection.connection_type === "customer" && profile?.subscription_status !== "pro") {
    await logAnalyticsEvent(supabase, connection.user_id, "customer_webhook_blocked_free_plan", {
      phone_number_id: message.phoneNumberId,
      message_id: message.messageId || null,
    });
    return { status: "ignored", reason: "customer WhatsApp requires Pro" };
  }

  const accountMessageLimit = planMessageLimit(profile, connection.connection_type || "internal");
  const accountAllowed = accountMessageLimit > 0
    ? await checkWebhookRateLimit(
      supabase,
      `whatsapp-user:${connection.user_id}`,
      accountMessageLimit,
      24 * 60 * 60,
      "whatsapp_plan_limit_reached",
      connection.user_id,
      {
        connection_type: connection.connection_type || "internal",
        plan: isProProfile(profile) ? "pro" : "free",
        phone_number_id: message.phoneNumberId,
      },
    )
    : false;
  if (!accountAllowed) {
    return { status: "ignored", reason: "plan limit reached" };
  }

  await logAnalyticsEvent(supabase, connection.user_id, "webhook_received", {
    connection_type: connection.connection_type || "internal",
    message_type: message.type || null,
    has_text: !!message.text,
    has_media: hasMediaMessage(message),
  });

  await supabase.from("kapso_messages").insert({
    user_id: connection.user_id,
    connection_id: connection.id,
    kapso_message_id: message.messageId || null,
    phone_number_id: message.phoneNumberId,
    direction: "inbound",
    from_number: message.from || null,
    to_number: message.to || null,
    contact_name: message.contactName || null,
    message_type: message.type || null,
    content: message.text,
    raw_payload: payload,
  });

  let reply = "";
  const text = (message.text || "").trim();

  const activeCloseoutSession = await findActiveCloseoutSession(supabase, connection.user_id, message.from);
  const activeSalesLogSession = await findActiveSalesLogSession(supabase, connection.user_id, message.from);
  const internalContact = connection.connection_type === "internal"
    ? await loadInternalContact(supabase, connection.user_id, message.from)
    : null;
  const hasInternalContacts = connection.connection_type === "internal"
    ? await internalContactsConfigured(supabase, connection.user_id)
    : false;

  if (connection.connection_type === "customer") {
    const openOrder = await findOpenCustomerOrder(supabase, connection, message.from);
    if (looksLikeCancelRequest(text)) {
      reply = await cancelCustomerOrderByText(supabase, connection, message, text);
    } else if (looksLikeRefundRequest(text)) {
      const latestActiveOrder = await findLatestActiveCustomerOrder(supabase, connection, message.from);
      if (latestActiveOrder) {
        reply = await saveOwnerReviewRequest(supabase, connection, latestActiveOrder, message, text);
      } else {
        reply = "A staff member will review your refund request and follow up.";
      }
    } else {
      const mediaReply = await handleMediaWithoutReceiptMatch(supabase, connection, message, text, payload);
      if (mediaReply) {
        reply = mediaReply;
      } else {
        const latestActiveOrder = await findLatestActiveCustomerOrder(supabase, connection, message.from);
        if (!openOrder && latestActiveOrder?.status === "confirmed" && looksLikeOrderEditRequest(text)) {
          reply = await saveOwnerReviewRequest(supabase, connection, latestActiveOrder, message, text);
        } else {
          const aiAllowed = await checkWebhookRateLimit(
            supabase,
            `whatsapp-ai:${connection.user_id}`,
            planAiLimit(profile),
            24 * 60 * 60,
            "whatsapp_ai_limit_reached",
            connection.user_id,
            {
              connection_type: connection.connection_type || "customer",
              plan: isProProfile(profile) ? "pro" : "free",
              message_id: message.messageId || null,
            },
          );
          const ai = aiAllowed ? await getCustomerAIResponse(supabase, connection, message, text, openOrder) : null;
          const aiReply = await handleCustomerAIAction(supabase, connection, message, text, payload, openOrder, ai);
          await logCustomerAIAction(supabase, connection, message, text, openOrder, ai, aiReply);
          const availabilityItem = extractAvailabilityItem(text);
          if (aiReply) {
            reply = aiReply;
          } else if (looksLikeWorkflowRequest(text)) {
            reply = "A staff member will help with that request.";
          } else if (looksLikeReceiptSubmission(text, message)) {
            reply = await markLatestOrderReceiptSent(supabase, connection, message, text, payload);
          } else if (looksLikePaymentConfirmation(text)) {
            reply = await promptForReceipt(supabase, connection, message, text);
          } else if (availabilityItem) {
            reply = buildAvailabilityReply(connection, availabilityItem);
          } else if (looksLikeMenuRequest(text)) {
            reply = buildMenuReply(connection);
          } else if (openOrder) {
            reply = await handleCustomerOrder(supabase, connection, message, text, openOrder);
          } else if (looksLikeOrderMessage(text)) {
            reply = await handleCustomerOrder(supabase, connection, message, text);
          } else {
            reply = [
              "Hi. Send your order or request here, for example: “I want the black sandals in size 42 delivered to Lekki” or “Book hair styling for Friday.”",
              "You can also ask for the catalogue, price list, services, or availability.",
            ].join("\n");
          }
        }
      }
    }
  } else if (!internalContact) {
    await recordPendingInternalSender(supabase, connection.user_id, message, text);
    reply = unauthorizedInternalReply(hasInternalContacts);
    await logAnalyticsEvent(supabase, connection.user_id, "unauthorized_internal_whatsapp_blocked", {
      from_number: normalizePhone(message.from),
      has_internal_contacts: hasInternalContacts,
      attempted_text: text.slice(0, 120),
    });
  } else if (activeCloseoutSession && /\b(cancel|stop)\b/i.test(text)) {
    if (!internalContact.can_closeout) {
      reply = permissionDeniedReply("run closeout");
    } else {
    await supabase
      .from("kapso_closeout_sessions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", activeCloseoutSession.id);
    reply = "Closeout cancelled.";
    }
  } else if (activeCloseoutSession) {
    if (!internalContact.can_closeout) {
      reply = permissionDeniedReply("run closeout");
    } else {
      const closeout = await saveCloseout(supabase, connection, message, text);
      reply = closeout.reply;
    }
  } else if (looksLikeCloseoutStart(text)) {
    if (!internalContact.can_closeout) {
      reply = permissionDeniedReply("run closeout");
    } else {
    const hasTotals = /\d/.test(text);
    if (hasTotals) {
      const closeout = await saveCloseout(supabase, connection, message, text);
      reply = closeout.reply;
    } else if (message.from) {
      await supabase
        .from("kapso_closeout_sessions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("user_id", connection.user_id)
        .eq("from_number", message.from)
        .eq("status", "awaiting_closeout");

      await supabase.from("kapso_closeout_sessions").insert({
        user_id: connection.user_id,
        connection_id: connection.id,
        from_number: message.from,
        status: "awaiting_closeout",
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      });
      reply = closeoutPrompt();
    } else {
      reply = closeoutPrompt();
    }
    }
  } else if (activeSalesLogSession) {
    reply = internalContact.can_log_sales
      ? await handlePendingSalesLogSession(supabase, connection, { ...message, contactName: internalContact.name || message.contactName }, text, activeSalesLogSession)
      : permissionDeniedReply("log sales");
  } else if (looksLikeDirectorySetup(text)) {
    reply = internalContact.can_manage_setup
      ? await handleDirectorySetup(supabase, connection.user_id, text)
      : permissionDeniedReply("manage staff or outlets");
  } else if (looksLikeCatalogSetup(text)) {
    reply = internalContact.can_manage_setup
      ? await handleCatalogSetup(supabase, connection.user_id, text)
      : permissionDeniedReply("manage catalog or stock");
  } else if (looksLikeReportGenerationRequest(text)) {
    reply = internalContact.can_query_reports
      ? await generateWhatsAppBusinessReport(supabase, connection, text)
      : permissionDeniedReply("generate reports");
  } else if (looksLikeWorkflowRequest(text)) {
    reply = internalContact.can_manage_setup
      ? await saveWorkflowRequest(supabase, connection, message, text)
      : permissionDeniedReply("create workflows");
  } else if (looksLikeProfitAndLossQuestion(text)) {
    reply = internalContact.can_query_reports
      ? await buildProfitAndLossSummary(supabase, connection.user_id, connection.business_timezone)
      : permissionDeniedReply("query reports");
  } else if (looksLikeFiveLineSummary(text)) {
    reply = internalContact.can_query_reports
      ? await buildFiveLineSummary(supabase, connection.user_id, connection.business_timezone)
      : permissionDeniedReply("query reports");
  } else if (looksLikeSalesLogQuestion(text)) {
    reply = internalContact.can_query_reports
      ? await buildSalesLogQueryAnswer(supabase, connection.user_id, text, connection.business_timezone)
      : permissionDeniedReply("query sales data");
  } else if (looksLikeSummaryQuestion(text)) {
    reply = internalContact.can_query_reports
      ? await buildSalesLogQueryAnswer(supabase, connection.user_id, text, connection.business_timezone)
      : permissionDeniedReply("query sales data");
  } else if (looksLikeOrderMessage(text) && !looksLikeSalesEntry(text)) {
    reply = [
      "This WhatsApp number is for staff operations.",
      "Please use the business customer number for orders, bookings, and customer requests.",
      "Staff can use this line for sales logs, closeout, P&L, 5-line summaries, and workflow requests.",
    ].join("\n");
  } else if (looksLikeSalesEntry(text) || text.toLowerCase().startsWith("/log ")) {
    if (!internalContact.can_log_sales) {
      reply = permissionDeniedReply("log sales");
    } else {
    const logText = text.toLowerCase().startsWith("/log ") ? text.slice(5).trim() : text;
    const parseAiAllowed = await checkWebhookRateLimit(
      supabase,
      `whatsapp-ai:${connection.user_id}`,
      planAiLimit(profile),
      24 * 60 * 60,
      "whatsapp_ai_limit_reached",
      connection.user_id,
      {
        connection_type: connection.connection_type || "internal",
        plan: isProProfile(profile) ? "pro" : "free",
        message_id: message.messageId || null,
      },
    );
    const parsedEntries = parseAiAllowed
      ? await parseEntryWithAI(logText)
      : [{ entry_type: "note", item: null, qty: null, unit_price: null, total: null, customer: null, notes: logText }];
    const directory = await loadBusinessDirectory(supabase, connection.user_id);
    const catalogItems = await loadCatalogItems(supabase, connection.user_id);
    const fallbackStaff = internalContact.name || message.contactName || message.from || "WhatsApp";
    const entries = applyCatalogContext(
      applyDirectoryContext(Array.isArray(parsedEntries) ? parsedEntries : [parsedEntries], directory, logText, fallbackStaff),
      catalogItems,
    ).map((entry: any) => ({ ...entry, raw_text: logText }));
    const required = shouldRequireContext(directory, entries);
    const missingFields = [
      required.staff ? "staff" : null,
      required.shop ? "shop" : null,
    ].filter(Boolean) as string[];
    if (missingFields.length) {
      await savePendingSalesLogSession(supabase, connection, message, entries, missingFields);
      reply = contextPrompt(missingFields, directory);
    } else {
      reply = await persistSalesLogEntries(supabase, connection, { ...message, contactName: fallbackStaff }, entries, logText);
    }
    }
  } else {
    reply = internalWelcomeReply(internalContact);
  }

  if (message.from && message.phoneNumberId && reply) {
    try {
      const sendResult = await sendWhatsAppTextForProvider(connection.whatsapp_provider, message.phoneNumberId, message.replyTo || message.from, reply);
      await supabase.from("kapso_messages").insert({
        user_id: connection.user_id,
        connection_id: connection.id,
        kapso_message_id: getOutboundMessageId(sendResult),
        phone_number_id: message.phoneNumberId,
        direction: "outbound",
        from_number: message.to || null,
        to_number: message.from,
        message_type: "text",
        content: reply,
        raw_payload: sendResult,
      });
    } catch (err) {
      console.error("WhatsApp reply failed after inbound processing:", err);
      await logAnalyticsEvent(supabase, connection.user_id, "kapso_reply_failed", {
        connection_type: connection.connection_type || "internal",
        message_id: message.messageId || null,
        error: err instanceof Error ? err.message : "WhatsApp reply failed",
      });
    }
  }

  return { status: "processed", replied: !!reply };
}
