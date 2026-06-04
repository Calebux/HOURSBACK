import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  createKapsoCustomer,
  createKapsoSetupLink,
  getKapsoApiKey,
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

    if (action === "manual_connect") {
      const phoneNumberId = String(body.phone_number_id || "").trim();
      const phoneNumber = String(body.phone_number || "").trim();
      const displayName = String(body.display_name || "WhatsApp").trim();
      const connectionType = body.connection_type === "customer" ? "customer" : "internal";

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
        .eq("connection_type", "internal")
        .maybeSingle();

      let customerId = existing?.kapso_customer_id;
      const externalCustomerId = existing?.external_customer_id || `hoursback:${user.id}`;

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
          connection_type: "internal",
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
