import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  createKapsoCustomer,
  createKapsoPhoneWebhook,
  createKapsoSetupLink,
  getKapsoApiKey,
  listKapsoPhoneWebhooks,
  sendWhatsAppText,
  updateKapsoPhoneWebhook,
} from "../_shared/kapso.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const KAPSO_WEBHOOK_SECRET = Deno.env.get("KAPSO_WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const { data: { user } } = await createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  ).auth.getUser();

  return user;
}

async function logOrderAudit(
  supabase: any,
  order: any,
  action: string,
  details: Record<string, unknown> = {},
  messageSent = false,
) {
  try {
    await supabase.from("kapso_order_audit_logs").insert({
      user_id: order.user_id,
      connection_id: order.connection_id || null,
      order_id: order.id,
      actor_type: "owner",
      action,
      details,
      message_sent: messageSent,
    });
  } catch (err) {
    console.error("Kapso order audit log failed:", err);
  }
}

async function safeSendKapsoText(phoneNumberId: string, to: string, text: string) {
  try {
    await sendWhatsAppText(phoneNumberId, to, text);
    return true;
  } catch (err) {
    console.error("WhatsApp customer notification failed:", err);
    return false;
  }
}

async function getProfile(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function isProProfile(profile: any) {
  return profile?.subscription_status === "pro";
}

function requireProForCustomerMode(profile: any, connectionType: string) {
  if (connectionType !== "customer" || isProProfile(profile)) return null;
  return new Response(
    JSON.stringify({ error: "Customer-facing WhatsApp is a Pro feature. Internal WhatsApp setup is available on Free." }),
    { status: 403, headers: corsHeaders },
  );
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizedOrigin(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function kapsoWebhookUrl(userId: string, connectionType: string) {
  return `${SUPABASE_URL}/functions/v1/kapso-webhook?uid=${userId}&mode=${connectionType}`;
}

function wabaGatewayWebhookUrl(userId: string, connectionType: string) {
  return `${SUPABASE_URL}/functions/v1/waba-gateway-webhook?uid=${userId}&mode=${connectionType}`;
}

function getWhatsAppSetupProvider() {
  return Deno.env.get("WABA_GATEWAY_PROVIDER") === "waba_gateway" ? "waba_gateway" : "kapso";
}

function gatewaySetupUrl(userId: string, connectionType: string) {
  const base = Deno.env.get("WABA_GATEWAY_SETUP_URL")
    || `${(Deno.env.get("WABA_GATEWAY_BASE_URL") || "https://waba.hoursback.xyz").replace(/\/+$/, "")}/connect`;
  const webhookSecret = Deno.env.get("WABA_GATEWAY_WEBHOOK_SECRET") || KAPSO_WEBHOOK_SECRET;
  const url = new URL(base);
  url.searchParams.set("uid", userId);
  url.searchParams.set("mode", connectionType);
  if (webhookSecret) url.searchParams.set("webhook_secret", webhookSecret);
  return url.toString();
}

function extractKapsoWebhookId(webhook: any) {
  return firstString(webhook?.id, webhook?.data?.id, webhook?.whatsapp_webhook?.id);
}

function extractKapsoSetupLinkId(setupLink: any) {
  return firstString(setupLink?.id, setupLink?.setup_link?.id, setupLink?.data?.id);
}

function extractKapsoSetupLinkUrl(setupLink: any) {
  return firstString(setupLink?.url, setupLink?.setup_link?.url, setupLink?.data?.url);
}

function extractKapsoSetupLinkExpiry(setupLink: any) {
  return firstString(setupLink?.expires_at, setupLink?.setup_link?.expires_at, setupLink?.data?.expires_at);
}

function extractKapsoWebhookRows(response: any) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.whatsapp_webhooks)) return response.whatsapp_webhooks;
  return [];
}

function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Unexpected error";
}

function errorStatus(err: unknown) {
  if (typeof err === "object" && err && "status" in err) {
    const status = Number((err as { status?: unknown }).status);
    if (Number.isFinite(status)) return status;
  }
  return null;
}

async function registerKapsoWebhookForNumber(
  supabase: any,
  userId: string,
  connectionType: string,
  phoneNumberId: string,
) {
  if (!getKapsoApiKey()) {
    throw new Error("KAPSO_API_KEY is not configured in Supabase secrets");
  }
  if (!KAPSO_WEBHOOK_SECRET) {
    throw new Error("KAPSO_WEBHOOK_SECRET is not configured in Supabase secrets");
  }

  const url = kapsoWebhookUrl(userId, connectionType);
  let existingWebhook: any = null;

  try {
    const webhooks = await listKapsoPhoneWebhooks(phoneNumberId);
    existingWebhook = extractKapsoWebhookRows(webhooks).find((item: any) => (
      firstString(item?.url, item?.whatsapp_webhook?.url) === url
    ));
  } catch (err) {
    console.warn("Kapso webhook list failed, creating a fresh webhook:", err);
  }

  const existingWebhookId = existingWebhook ? extractKapsoWebhookId(existingWebhook) : null;
  const created = existingWebhook && existingWebhookId
    ? await updateKapsoPhoneWebhook(
      phoneNumberId,
      existingWebhookId,
      url,
      KAPSO_WEBHOOK_SECRET,
      ["whatsapp.message.received"],
    )
    : await createKapsoPhoneWebhook(
      phoneNumberId,
      url,
      KAPSO_WEBHOOK_SECRET,
      ["whatsapp.message.received"],
    );
  const webhook = created?.data || created?.whatsapp_webhook || created;
  const webhookId = extractKapsoWebhookId(webhook);
  const registeredAt = new Date().toISOString();

  await supabase
    .from("kapso_connections")
    .update({
      kapso_webhook_id: webhookId || null,
      kapso_webhook_url: url,
      kapso_webhook_registered_at: registeredAt,
      kapso_webhook_error: null,
      webhook_secret_set: true,
      status: "webhook_active",
      updated_at: registeredAt,
    })
    .eq("user_id", userId)
    .eq("connection_type", connectionType);

  await logAnalyticsEvent(supabase, userId, "whatsapp_webhook_registered", {
    connection_type: connectionType,
    phone_number_id: phoneNumberId,
    reused_existing_webhook: !!existingWebhook,
    updated_existing_webhook: !!existingWebhookId,
  }, "edge");

  return {
    id: webhookId,
    url,
    reused_existing_webhook: !!existingWebhook,
    updated_existing_webhook: !!existingWebhookId,
    registered_at: registeredAt,
  };
}

async function fetchConnectionForUser(supabase: any, userId: string, connectionType: string) {
  const { data, error } = await supabase
    .from("kapso_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("connection_type", connectionType)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function orderItemsSummary(items: any[]) {
  if (!items?.length) return "your request";
  return items.map((item) => `${item.qty ? `${item.qty} x ` : ""}${item.name}`).join(", ");
}

function orderTotal(items: any[]) {
  const total = (items || []).reduce((sum, item) => {
    const qty = Number(item.qty || 1);
    const price = Number(item.unit_price || 0);
    return price > 0 ? sum + qty * price : sum;
  }, 0);
  return total > 0 ? total : null;
}

async function logAnalyticsEvent(
  supabase: any,
  userId: string | null,
  eventName: string,
  properties: Record<string, unknown> = {},
  source = "server",
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

async function syncVerifiedOrderToSalesLog(supabase: any, order: any) {
  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(
    order.owner_adjusted_total_amount
    || order.expected_total_amount
    || orderTotal(items)
    || 0,
  );
  if (!total || total <= 0) return false;

  const paidAt = order.paid_at || order.payment_verified_at || new Date().toISOString();
  const parsedData = {
    item: orderItemsSummary(items),
    qty: null,
    unit_price: null,
    total,
    customer: order.customer_name || order.customer_phone || null,
    notes: [
      order.order_code ? `Reference: ${order.order_code}` : null,
      order.request_type ? `Type: ${order.request_type}` : null,
      order.delivery_address ? `Fulfillment: ${order.delivery_address}` : null,
    ].filter(Boolean).join(" | ") || null,
    sale_date: paidAt.slice(0, 10),
  };

  const { error } = await supabase.from("bot_entries").insert({
    user_id: order.user_id,
    chat_id: 0,
    triggered_by: order.customer_name || order.customer_phone || "WhatsApp customer",
    role: "customer",
    raw_text: order.raw_text || `Verified WhatsApp request ${order.order_code || order.id}`,
    entry_type: "sale",
    parsed_data: parsedData,
    sale_date: paidAt,
    source: "whatsapp_customer_order",
    channel: "whatsapp",
    source_order_id: order.id,
  });

  if (error?.code === "23505") return true;
  if (error) throw error;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const profile = await getProfile(supabase, user.id);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    if (action === "status") {
      const { data } = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", user.id)
        .order("connection_type", { ascending: true });

      const connections = data || [];
      const primary = connections.find((item: any) => item.connection_type === "internal") || connections[0] || null;

      return new Response(JSON.stringify({
        connected: connections.some((item: any) => !!item.phone_number_id),
        api_configured: !!getKapsoApiKey(),
        webhook_secret_configured: !!KAPSO_WEBHOOK_SECRET,
        connection: primary,
        connections,
      }), { headers: corsHeaders });
    }

    if (action === "disconnect") {
      const connectionType = body.connection_type === "customer" ? "customer" : body.connection_type === "internal" ? "internal" : null;
      let query = supabase.from("kapso_connections").delete().eq("user_id", user.id);
      if (connectionType) query = query.eq("connection_type", connectionType);
      const { error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === "register_webhook") {
      const connectionType = body.connection_type === "customer" ? "customer" : "internal";
      const proResponse = requireProForCustomerMode(profile, connectionType);
      if (proResponse) return proResponse;

      const connection = await fetchConnectionForUser(supabase, user.id, connectionType);
      if (!connection?.phone_number_id) {
        return new Response(JSON.stringify({ error: "Connect a WhatsApp number before registering message routing." }), { status: 400, headers: corsHeaders });
      }

      try {
        const webhook = await registerKapsoWebhookForNumber(supabase, user.id, connectionType, connection.phone_number_id);
        const refreshed = await fetchConnectionForUser(supabase, user.id, connectionType);
        return new Response(JSON.stringify({ success: true, connection: refreshed || connection, webhook }), { headers: corsHeaders });
      } catch (err) {
        const message = errorMessage(err);
        await supabase
          .from("kapso_connections")
          .update({
            kapso_webhook_error: message,
            webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("connection_type", connectionType);
        await logAnalyticsEvent(supabase, user.id, "whatsapp_webhook_registration_failed", {
          connection_type: connectionType,
          phone_number_id: connection.phone_number_id,
          status: errorStatus(err),
          error: message,
        }, "edge");
        return new Response(JSON.stringify({ success: false, connection, error: message }), { status: 502, headers: corsHeaders });
      }
    }

    if (action === "customer_settings") {
      const proResponse = requireProForCustomerMode(profile, "customer");
      if (proResponse) return proResponse;

      const customerMenu = String(body.customer_menu || "").trim();
      const paymentInstructions = String(body.payment_instructions || "").trim();
      const ownerNotificationNumber = String(body.owner_notification_number || "").trim();
      const businessType = String(body.business_type || "").trim();
      const operatingHours = String(body.operating_hours || "").trim();
      const fulfillmentRules = String(body.fulfillment_rules || "").trim();
      const escalationInstructions = String(body.escalation_instructions || "").trim();

      const { data: existing } = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("connection_type", "customer")
        .maybeSingle();

      const { data, error } = await supabase
        .from("kapso_connections")
        .upsert({
          user_id: user.id,
          connection_type: "customer",
          phone_number_id: existing?.phone_number_id || null,
          phone_number: existing?.phone_number || null,
          display_name: existing?.display_name || "Customer Requests",
          status: existing?.kapso_webhook_registered_at ? "webhook_active" : existing?.phone_number_id ? "connected" : "settings_saved",
          webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
          customer_menu: customerMenu || null,
          payment_instructions: paymentInstructions || null,
          owner_notification_number: ownerNotificationNumber || null,
          business_type: businessType || null,
          operating_hours: operatingHours || null,
          fulfillment_rules: fulfillmentRules || null,
          escalation_instructions: escalationInstructions || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,connection_type" })
        .select("*")
        .single();

      if (error) throw error;
      await logAnalyticsEvent(supabase, user.id, "whatsapp_customer_settings_saved", {
        has_customer_menu: !!customerMenu,
        has_payment_instructions: !!paymentInstructions,
        has_fulfillment_rules: !!fulfillmentRules,
        has_owner_notification_number: !!ownerNotificationNumber,
      }, "edge");
      return new Response(JSON.stringify({ success: true, connection: data }), { headers: corsHeaders });
    }

    if (action === "verify_order_payment") {
      const orderId = String(body.order_id || "").trim();
      const deliveryNote = String(body.delivery_note || "").trim();
      if (!orderId) {
        return new Response(JSON.stringify({ error: "order_id is required" }), { status: 400, headers: corsHeaders });
      }

      const { data: order, error: orderError } = await supabase
        .from("kapso_orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();
      if (orderError) throw orderError;
      if (!order.receipt_storage_path) {
        return new Response(
          JSON.stringify({ error: "Receipt file is not available. Ask the customer to resend the receipt before confirming payment." }),
          { status: 400, headers: corsHeaders }
        );
      }
      if (order.status !== "confirmed" || order.payment_status !== "receipt_sent") {
        return new Response(
          JSON.stringify({ error: "Only confirmed requests with a pending receipt can be marked paid." }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { data: connection, error: connectionError } = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("connection_type", "customer")
        .maybeSingle();
      if (connectionError) throw connectionError;

      const verifiedAt = new Date().toISOString();
      const { data: updatedOrder, error: updateError } = await supabase
        .from("kapso_orders")
        .update({
          payment_status: "verified",
          paid_at: order.paid_at || verifiedAt,
          payment_verified_at: verifiedAt,
          updated_at: verifiedAt,
        })
        .eq("id", order.id)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (updateError) throw updateError;

      let messageSent = false;
      if (connection?.phone_number_id && order.customer_phone) {
        const items = Array.isArray(order.items) ? orderItemsSummary(order.items) : "your request";
        const message = [
          "Payment received. Thank you.",
          `Request: ${items}`,
          deliveryNote || "We are processing your request now and will update you if anything changes.",
        ].join("\n");
        messageSent = await safeSendKapsoText(connection.phone_number_id, order.customer_phone, message);
      }

      await logOrderAudit(supabase, updatedOrder, "payment_verified", {
        delivery_note: deliveryNote || null,
      }, messageSent);
      const salesLogSynced = await syncVerifiedOrderToSalesLog(supabase, updatedOrder);
      await logAnalyticsEvent(supabase, user.id, "customer_order_verified", {
        order_id: updatedOrder.id,
        order_code: updatedOrder.order_code || null,
        request_type: updatedOrder.request_type || null,
        message_sent: messageSent,
        sales_log_synced: salesLogSynced,
      }, "edge");

      return new Response(JSON.stringify({ success: true, order: updatedOrder, message_sent: messageSent, sales_log_synced: salesLogSynced }), { headers: corsHeaders });
    }

    if (action === "reject_order_payment") {
      const orderId = String(body.order_id || "").trim();
      if (!orderId) {
        return new Response(JSON.stringify({ error: "order_id is required" }), { status: 400, headers: corsHeaders });
      }

      const { data: order, error: orderError } = await supabase
        .from("kapso_orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();
      if (orderError) throw orderError;
      if (order.status !== "confirmed" || order.payment_status !== "receipt_sent") {
        return new Response(
          JSON.stringify({ error: "Only confirmed requests with a pending receipt can be rejected." }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { data: connection, error: connectionError } = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("connection_type", "customer")
        .maybeSingle();
      if (connectionError) throw connectionError;

      const now = new Date().toISOString();
      const existingNotes = String(order.owner_notes || "").trim();
      const ownerNotes = [existingNotes, `Payment receipt rejected at ${now}; customer asked to resend proof.`]
        .filter(Boolean)
        .join("\n");
      const { data: updatedOrder, error: updateError } = await supabase
        .from("kapso_orders")
        .update({
          payment_status: "unpaid",
          payment_verified_at: null,
          paid_at: null,
          owner_notes: ownerNotes,
          updated_at: now,
        })
        .eq("id", order.id)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (updateError) throw updateError;

      let messageSent = false;
      if (connection?.phone_number_id && order.customer_phone) {
        const items = Array.isArray(order.items) ? orderItemsSummary(order.items) : "your request";
        messageSent = await safeSendKapsoText(connection.phone_number_id, order.customer_phone, [
          "We could not verify the payment receipt yet.",
          `Request: ${items}`,
          order.order_code ? `Reference: ${order.order_code}` : null,
          "Please resend a clear receipt or contact staff for help.",
        ].filter(Boolean).join("\n"));
      }

      await logOrderAudit(supabase, updatedOrder, "payment_rejected", {}, messageSent);

      return new Response(JSON.stringify({ success: true, order: updatedOrder, message_sent: messageSent }), { headers: corsHeaders });
    }

    if (action === "cancel_order") {
      const orderId = String(body.order_id || "").trim();
      const notifyCustomer = body.notify_customer !== false;
      const reason = String(body.reason || "Cancelled by owner").trim();
      if (!orderId) {
        return new Response(JSON.stringify({ error: "order_id is required" }), { status: 400, headers: corsHeaders });
      }

      const { data: order, error: orderError } = await supabase
        .from("kapso_orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();
      if (orderError) throw orderError;
      if (order.status === "cancelled" || order.status === "fulfilled") {
        return new Response(JSON.stringify({ error: "Cancelled or fulfilled requests cannot be cancelled again." }), { status: 400, headers: corsHeaders });
      }

      const { data: connection, error: connectionError } = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("connection_type", "customer")
        .maybeSingle();
      if (connectionError) throw connectionError;

      const now = new Date().toISOString();
      const ownerNotes = [String(order.owner_notes || "").trim(), `${reason} at ${now}.`]
        .filter(Boolean)
        .join("\n");
      const { data: updatedOrder, error: updateError } = await supabase
        .from("kapso_orders")
        .update({
          status: "cancelled",
          owner_notes: ownerNotes,
          updated_at: now,
        })
        .eq("id", order.id)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (updateError) throw updateError;

      let messageSent = false;
      if (notifyCustomer && connection?.phone_number_id && order.customer_phone) {
        const items = Array.isArray(order.items) ? orderItemsSummary(order.items) : "your request";
        messageSent = await safeSendKapsoText(connection.phone_number_id, order.customer_phone, [
          "This request has been cancelled.",
          order.order_code ? `Reference: ${order.order_code}` : null,
          `Request: ${items}`,
          "If you already paid, a staff member will review and follow up.",
        ].filter(Boolean).join("\n"));
      }

      await logOrderAudit(supabase, updatedOrder, "cancelled_by_owner", { reason }, messageSent);

      return new Response(JSON.stringify({ success: true, order: updatedOrder, message_sent: messageSent }), { headers: corsHeaders });
    }

    if (action === "mark_stale_unpaid_orders") {
      const daysRaw = Number(body.days || 2);
      const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(daysRaw, 30) : 2;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const reason = `Marked stale after ${days} day${days === 1 ? "" : "s"}`;

      const { data: orders, error: selectError } = await supabase
        .from("kapso_orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .in("payment_status", ["unpaid", "receipt_sent"])
        .lt("created_at", cutoff)
        .limit(100);
      if (selectError) throw selectError;

      const rows = (orders || []).filter((order: any) => String(order.payment_method || "").toLowerCase() !== "cash on pickup");
      if (!rows.length) {
        return new Response(JSON.stringify({ success: true, count: 0 }), { headers: corsHeaders });
      }

      const ids = rows.map((order: any) => order.id);
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("kapso_orders")
        .update({
          status: "cancelled",
          updated_at: now,
        })
        .eq("user_id", user.id)
        .in("id", ids);
      if (updateError) throw updateError;

      await supabase.from("kapso_order_audit_logs").insert(rows.map((order: any) => ({
        user_id: order.user_id,
        connection_id: order.connection_id || null,
        order_id: order.id,
        actor_type: "owner",
        action: "marked_stale",
        details: { reason, cutoff },
        message_sent: false,
      })));

      return new Response(JSON.stringify({ success: true, count: rows.length }), { headers: corsHeaders });
    }

    if (action === "update_order_review") {
      const orderId = String(body.order_id || "").trim();
      if (!orderId) {
        return new Response(JSON.stringify({ error: "order_id is required" }), { status: 400, headers: corsHeaders });
      }

      const deliveryFee = body.delivery_fee_amount === "" || body.delivery_fee_amount == null ? null : Number(body.delivery_fee_amount);
      const expectedTotal = body.expected_total_amount === "" || body.expected_total_amount == null ? null : Number(body.expected_total_amount);
      const adjustedTotal = body.owner_adjusted_total_amount === "" || body.owner_adjusted_total_amount == null ? null : Number(body.owner_adjusted_total_amount);
      const ownerNotes = String(body.owner_notes || "").trim();
      if ([deliveryFee, expectedTotal, adjustedTotal].some((value) => value !== null && (!Number.isFinite(value) || value < 0))) {
        return new Response(JSON.stringify({ error: "Amounts must be valid non-negative numbers." }), { status: 400, headers: corsHeaders });
      }

      const { data, error } = await supabase
        .from("kapso_orders")
        .update({
          delivery_fee_amount: deliveryFee,
          expected_total_amount: expectedTotal,
          owner_adjusted_total_amount: adjustedTotal,
          owner_notes: ownerNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) throw error;
      await logOrderAudit(supabase, data, "review_updated", {
        delivery_fee_amount: deliveryFee,
        expected_total_amount: expectedTotal,
        owner_adjusted_total_amount: adjustedTotal,
        owner_notes: ownerNotes || null,
      }, false);
      return new Response(JSON.stringify({ success: true, order: data }), { headers: corsHeaders });
    }

    if (action === "update_order_fulfillment") {
      const orderId = String(body.order_id || "").trim();
      const fulfillmentStatus = String(body.fulfillment_status || "").trim();
      if (!orderId) {
        return new Response(JSON.stringify({ error: "order_id is required" }), { status: 400, headers: corsHeaders });
      }
      if (!["preparing", "ready_for_pickup", "out_for_delivery", "delivered", "completed"].includes(fulfillmentStatus)) {
        return new Response(JSON.stringify({ error: "Invalid fulfillment_status" }), { status: 400, headers: corsHeaders });
      }

      const { data: order, error: orderError } = await supabase
        .from("kapso_orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();
      if (orderError) throw orderError;
      if (order.status === "cancelled" || order.status === "fulfilled") {
        return new Response(JSON.stringify({ error: "Cancelled or fulfilled requests cannot be updated." }), { status: 400, headers: corsHeaders });
      }

      const { data: connection, error: connectionError } = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("connection_type", "customer")
        .maybeSingle();
      if (connectionError) throw connectionError;

      const now = new Date().toISOString();
      const updatePayload: any = {
        fulfillment_status: fulfillmentStatus,
        updated_at: now,
      };
      if (["delivered", "completed"].includes(fulfillmentStatus)) {
        updatePayload.status = "fulfilled";
        updatePayload.fulfilled_at = now;
      }

      const { data: updatedOrder, error: updateError } = await supabase
        .from("kapso_orders")
        .update(updatePayload)
        .eq("id", order.id)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (updateError) throw updateError;

      let messageSent = false;
      if (connection?.phone_number_id && order.customer_phone) {
        const items = Array.isArray(order.items) ? orderItemsSummary(order.items) : "your request";
        const statusLine = fulfillmentStatus === "preparing"
          ? "Your request is now being prepared."
          : fulfillmentStatus === "ready_for_pickup"
            ? "Your request is ready for pickup."
            : fulfillmentStatus === "out_for_delivery"
              ? "Your request is out for delivery."
              : "Your request has been completed. Thank you.";
        messageSent = await safeSendKapsoText(connection.phone_number_id, order.customer_phone, [
          statusLine,
          `Request: ${items}`,
        ].join("\n"));
      }

      await logOrderAudit(supabase, updatedOrder, "fulfillment_updated", {
        fulfillment_status: fulfillmentStatus,
      }, messageSent);

      return new Response(JSON.stringify({ success: true, order: updatedOrder, message_sent: messageSent }), { headers: corsHeaders });
    }

    if (action === "manual_connect") {
      const phoneNumberId = String(body.phone_number_id || "").trim();
      const phoneNumber = String(body.phone_number || "").trim();
      const displayName = String(body.display_name || "WhatsApp").trim();
      const connectionType = body.connection_type === "customer" ? "customer" : "internal";
      const proResponse = requireProForCustomerMode(profile, connectionType);
      if (proResponse) return proResponse;
      const customerMenu = String(body.customer_menu || "").trim();
      const paymentInstructions = String(body.payment_instructions || "").trim();
      const ownerNotificationNumber = String(body.owner_notification_number || "").trim();
      const businessType = String(body.business_type || "").trim();
      const operatingHours = String(body.operating_hours || "").trim();
      const fulfillmentRules = String(body.fulfillment_rules || "").trim();
      const escalationInstructions = String(body.escalation_instructions || "").trim();

      if (!phoneNumberId) {
        return new Response(JSON.stringify({ error: "phone_number_id is required" }), { status: 400, headers: corsHeaders });
      }

      const { data, error } = await supabase
        .from("kapso_connections")
        .upsert({
          user_id: user.id,
          connection_type: connectionType,
          phone_number_id: phoneNumberId,
          phone_number: phoneNumber || null,
          display_name: displayName,
          customer_menu: connectionType === "customer" ? customerMenu || null : null,
          payment_instructions: connectionType === "customer" ? paymentInstructions || null : null,
          owner_notification_number: connectionType === "customer" ? ownerNotificationNumber || null : null,
          business_type: connectionType === "customer" ? businessType || null : null,
          operating_hours: connectionType === "customer" ? operatingHours || null : null,
          fulfillment_rules: connectionType === "customer" ? fulfillmentRules || null : null,
          escalation_instructions: connectionType === "customer" ? escalationInstructions || null : null,
          status: "connected",
          kapso_webhook_error: null,
          webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,connection_type" })
        .select("*")
        .single();

      if (error) throw error;
      let webhook = null;
      if (getWhatsAppSetupProvider() === "waba_gateway") {
        await supabase
          .from("kapso_connections")
          .update({
            status: "webhook_active",
            kapso_webhook_url: wabaGatewayWebhookUrl(user.id, connectionType),
            kapso_webhook_registered_at: new Date().toISOString(),
            kapso_webhook_error: null,
            webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("connection_type", connectionType);
      } else {
        try {
          webhook = await registerKapsoWebhookForNumber(supabase, user.id, connectionType, phoneNumberId);
        } catch (err) {
          const message = errorMessage(err);
          await supabase
            .from("kapso_connections")
            .update({
              status: "connected",
              kapso_webhook_error: message,
              webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .eq("connection_type", connectionType);
          await logAnalyticsEvent(supabase, user.id, "whatsapp_webhook_registration_failed", {
            connection_type: connectionType,
            phone_number_id: phoneNumberId,
            status: errorStatus(err),
            error: message,
          }, "edge");
          return new Response(JSON.stringify({ success: false, connection: data, error: message }), { status: 502, headers: corsHeaders });
        }
      }

      const { data: refreshed } = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("connection_type", connectionType)
        .maybeSingle();

      await logAnalyticsEvent(supabase, user.id, "whatsapp_connection_saved", {
        connection_type: connectionType,
        has_customer_menu: !!customerMenu,
        has_payment_instructions: !!paymentInstructions,
        has_fulfillment_rules: !!fulfillmentRules,
      }, "edge");
      return new Response(JSON.stringify({ success: true, connection: refreshed || data, webhook }), { headers: corsHeaders });
    }

    if (action === "generate_setup_link") {
      const connectionType = body.connection_type === "customer" ? "customer" : "internal";
      const proResponse = requireProForCustomerMode(profile, connectionType);
      if (proResponse) return proResponse;
      const appOrigin = normalizedOrigin(body.app_origin)
        || normalizedOrigin(req.headers.get("Origin"))
        || Deno.env.get("APP_URL")
        || "https://www.hoursback.xyz";

      if (getWhatsAppSetupProvider() === "waba_gateway") {
        const setupLinkUrl = gatewaySetupUrl(user.id, connectionType);
        const externalCustomerId = `hoursback:${user.id}:${connectionType}`;

        const { data, error } = await supabase
          .from("kapso_connections")
          .upsert({
            user_id: user.id,
            connection_type: connectionType,
            external_customer_id: externalCustomerId,
            setup_link_url: setupLinkUrl,
            setup_link_expires_at: null,
            status: "setup_pending",
            webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
            kapso_webhook_error: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,connection_type" })
          .select("*")
          .single();

        if (error) throw error;
        await logAnalyticsEvent(supabase, user.id, "whatsapp_gateway_setup_link_created", {
          connection_type: connectionType,
          provider: "waba_gateway",
        }, "edge");
        return new Response(JSON.stringify({ success: true, connection: data, provider: "waba_gateway" }), { headers: corsHeaders });
      }

      if (!getKapsoApiKey()) {
        return new Response(
          JSON.stringify({ error: "KAPSO_API_KEY is not configured in Supabase secrets" }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { data: existing } = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("connection_type", connectionType)
        .maybeSingle();

      let customerId = existing?.kapso_customer_id;
      const externalCustomerId = existing?.external_customer_id || `hoursback:${user.id}:${connectionType}`;

      if (!customerId) {
        const customer = await createKapsoCustomer(
          user.user_metadata?.full_name || user.email || "Hoursback customer",
          externalCustomerId
        );
        customerId = customer?.data?.id || customer?.id;
      }

      if (!customerId) throw new Error("Kapso did not return a customer id");

      const callbackBase = `${appOrigin}/whatsapp/callback?mode=${connectionType}`;
      let setup;
      let setupLinkFallbackUsed = false;
      try {
        setup = await createKapsoSetupLink(customerId, {
          allowed_connection_types: ["coexistence"],
          success_redirect_url: `${callbackBase}&status=success`,
          failure_redirect_url: `${callbackBase}&status=failed`,
        });
      } catch (err) {
        console.warn("Kapso enhanced setup link failed, falling back to basic setup link:", err);
        setupLinkFallbackUsed = true;
        setup = await createKapsoSetupLink(customerId);
      }
      const setupLink = setup?.data || setup;
      const setupLinkUrl = extractKapsoSetupLinkUrl(setupLink);
      const setupLinkExpiry = extractKapsoSetupLinkExpiry(setupLink);
      const setupLinkId = extractKapsoSetupLinkId(setupLink);

      const { data, error } = await supabase
        .from("kapso_connections")
        .upsert({
          user_id: user.id,
          connection_type: connectionType,
          kapso_customer_id: customerId,
          external_customer_id: externalCustomerId,
          setup_link_id: setupLinkId,
          setup_link_url: setupLinkUrl,
          setup_link_expires_at: setupLinkExpiry,
          status: existing?.phone_number_id ? "connected" : "setup_pending",
          webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,connection_type" })
        .select("*")
        .single();

      if (error) throw error;
      await logAnalyticsEvent(supabase, user.id, "whatsapp_setup_link_created", {
        connection_type: connectionType,
        allowed_connection_types: ["coexistence"],
        fallback_used: setupLinkFallbackUsed,
      }, "edge");
      return new Response(JSON.stringify({ success: true, connection: data }), { headers: corsHeaders });
    }

    if (action === "finalize_setup") {
      const connectionType = body.connection_type === "customer" ? "customer" : "internal";
      const proResponse = requireProForCustomerMode(profile, connectionType);
      if (proResponse) return proResponse;
      const phoneNumberId = String(body.phone_number_id || body.phoneNumberId || "").trim();
      const phoneNumber = String(body.phone_number || body.phoneNumber || "").trim();
      const displayName = String(body.display_name || body.displayName || (connectionType === "customer" ? "Customer Requests" : "Internal Operations")).trim();
      const setupLinkId = String(body.setup_link_id || body.setupLinkId || "").trim();

      if (!phoneNumberId) {
        return new Response(JSON.stringify({ error: "phone_number_id is required to finish WhatsApp setup" }), { status: 400, headers: corsHeaders });
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("kapso_connections")
        .upsert({
          user_id: user.id,
          connection_type: connectionType,
          phone_number_id: phoneNumberId,
          phone_number: phoneNumber || null,
          display_name: displayName,
          setup_link_id: setupLinkId || null,
          status: "connected",
          kapso_webhook_error: null,
          webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
          updated_at: now,
        }, { onConflict: "user_id,connection_type" })
        .select("*")
        .single();

      if (error) throw error;

      let webhook = null;
      if (getWhatsAppSetupProvider() === "waba_gateway") {
        await supabase
          .from("kapso_connections")
          .update({
            status: "webhook_active",
            kapso_webhook_url: wabaGatewayWebhookUrl(user.id, connectionType),
            kapso_webhook_registered_at: new Date().toISOString(),
            kapso_webhook_error: null,
            webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("connection_type", connectionType);
      } else {
        try {
          webhook = await registerKapsoWebhookForNumber(supabase, user.id, connectionType, phoneNumberId);
        } catch (err) {
          const message = errorMessage(err);
          await supabase
            .from("kapso_connections")
            .update({
              status: "connected",
              kapso_webhook_error: message,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .eq("connection_type", connectionType);
          await logAnalyticsEvent(supabase, user.id, "whatsapp_webhook_registration_failed", {
            connection_type: connectionType,
            phone_number_id: phoneNumberId,
            status: errorStatus(err),
            error: message,
          }, "edge");
          return new Response(JSON.stringify({ success: false, connection: data, error: message }), { status: 502, headers: corsHeaders });
        }
      }

      const { data: refreshed } = await supabase
        .from("kapso_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("connection_type", connectionType)
        .maybeSingle();

      await logAnalyticsEvent(supabase, user.id, "whatsapp_connection_finalized", {
        connection_type: connectionType,
        phone_number_id: phoneNumberId,
        setup_link_id: setupLinkId || null,
      }, "edge");

      return new Response(JSON.stringify({ success: true, connection: refreshed || data, webhook }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("kapso-setup error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders });
  }
});
