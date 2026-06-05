import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  createKapsoCustomer,
  createKapsoSetupLink,
  getKapsoApiKey,
  sendKapsoText,
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthedUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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
      await supabase.from("kapso_connections").delete().eq("user_id", user.id);
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === "customer_settings") {
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
          status: existing?.phone_number_id ? "connected" : "settings_saved",
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
        const items = Array.isArray(order.items)
          ? order.items.map((item: any) => `${item.qty ? `${item.qty} x ` : ""}${item.name}`).join(", ")
          : "your request";
        const message = [
          "Payment received. Thank you.",
          `Request: ${items}`,
          deliveryNote || "We are processing your request now and will update you if anything changes.",
        ].join("\n");
        await sendKapsoText(connection.phone_number_id, order.customer_phone, message);
        messageSent = true;
      }

      await logOrderAudit(supabase, updatedOrder, "payment_verified", {
        delivery_note: deliveryNote || null,
      }, messageSent);

      return new Response(JSON.stringify({ success: true, order: updatedOrder, message_sent: messageSent }), { headers: corsHeaders });
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
        const items = Array.isArray(order.items)
          ? order.items.map((item: any) => `${item.qty ? `${item.qty} x ` : ""}${item.name}`).join(", ")
          : "your request";
        await sendKapsoText(connection.phone_number_id, order.customer_phone, [
          "We could not verify the payment receipt yet.",
          `Request: ${items}`,
          order.order_code ? `Reference: ${order.order_code}` : null,
          "Please resend a clear receipt or contact staff for help.",
        ].filter(Boolean).join("\n"));
        messageSent = true;
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
        const items = Array.isArray(order.items)
          ? order.items.map((item: any) => `${item.qty ? `${item.qty} x ` : ""}${item.name}`).join(", ")
          : "your request";
        await sendKapsoText(connection.phone_number_id, order.customer_phone, [
          "This request has been cancelled.",
          order.order_code ? `Reference: ${order.order_code}` : null,
          `Request: ${items}`,
          "If you already paid, a staff member will review and follow up.",
        ].filter(Boolean).join("\n"));
        messageSent = true;
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

      const rows = orders || [];
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

      const { data, error } = await supabase
        .from("kapso_orders")
        .update({
          delivery_fee_amount: Number.isFinite(deliveryFee) ? deliveryFee : null,
          expected_total_amount: Number.isFinite(expectedTotal) ? expectedTotal : null,
          owner_adjusted_total_amount: Number.isFinite(adjustedTotal) ? adjustedTotal : null,
          owner_notes: ownerNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) throw error;
      await logOrderAudit(supabase, data, "review_updated", {
        delivery_fee_amount: Number.isFinite(deliveryFee) ? deliveryFee : null,
        expected_total_amount: Number.isFinite(expectedTotal) ? expectedTotal : null,
        owner_adjusted_total_amount: Number.isFinite(adjustedTotal) ? adjustedTotal : null,
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
        const items = Array.isArray(order.items)
          ? order.items.map((item: any) => `${item.qty ? `${item.qty} x ` : ""}${item.name}`).join(", ")
          : "your request";
        const statusLine = fulfillmentStatus === "preparing"
          ? "Your request is now being prepared."
          : fulfillmentStatus === "ready_for_pickup"
            ? "Your request is ready for pickup."
            : fulfillmentStatus === "out_for_delivery"
              ? "Your request is out for delivery."
              : "Your request has been completed. Thank you.";
        await sendKapsoText(connection.phone_number_id, order.customer_phone, [
          statusLine,
          `Request: ${items}`,
        ].join("\n"));
        messageSent = true;
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
          webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,connection_type" })
        .select("*")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, connection: data }), { headers: corsHeaders });
    }

    if (action === "generate_setup_link") {
      const connectionType = body.connection_type === "customer" ? "customer" : "internal";
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

      const setup = await createKapsoSetupLink(customerId);
      const setupLink = setup?.data || setup;

      const { data, error } = await supabase
        .from("kapso_connections")
        .upsert({
          user_id: user.id,
          connection_type: connectionType,
          kapso_customer_id: customerId,
          external_customer_id: externalCustomerId,
          setup_link_url: setupLink?.url || null,
          setup_link_expires_at: setupLink?.expires_at || null,
          status: existing?.phone_number_id ? "connected" : "setup_pending",
          webhook_secret_set: !!KAPSO_WEBHOOK_SECRET,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,connection_type" })
        .select("*")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, connection: data }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("kapso-setup error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders });
  }
});
