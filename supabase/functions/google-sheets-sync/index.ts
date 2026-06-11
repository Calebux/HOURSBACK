import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  appendGoogleSheetRows,
  ensureGoogleSheetHeader,
  getGoogleAccessToken,
  getGoogleServiceAccountAccessToken,
  getGoogleServiceAccountEmail,
  googleTokenConnected,
} from "../_shared/google_sheets.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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
    { global: { headers: { Authorization: authHeader } } },
  ).auth.getUser();
  return user;
}

function parseSpreadsheetId(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([^/]+)/);
  return match?.[1] || trimmed;
}

function tokenExpiresAt(expiresIn: unknown) {
  const seconds = Number(expiresIn || 3600);
  return new Date(Date.now() + Math.max(300, seconds) * 1000).toISOString();
}

async function destinationForUser(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("google_sheet_destinations")
    .select("id,user_id,spreadsheet_id,sheet_name,enabled,auth_method,access_token,refresh_token,token_type,token_expires_at,last_sync_at,last_sync_error,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function publicDestination(destination: any) {
  if (!destination) return null;
  return {
    id: destination.id,
    spreadsheet_id: destination.spreadsheet_id,
    sheet_name: destination.sheet_name,
    enabled: destination.enabled,
    auth_method: destination.auth_method || "oauth",
    connected: googleTokenConnected(destination),
    last_sync_at: destination.last_sync_at,
    last_sync_error: destination.last_sync_error,
    updated_at: destination.updated_at,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });

  const user = await getAuthedUser(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const body = await req.json().catch(() => ({}));
  const action = body.action || "status";

  try {
    if (action === "status") {
      const destination = await destinationForUser(supabase, user.id);
      return new Response(JSON.stringify({
        destination: publicDestination(destination),
        service_account_email: getGoogleServiceAccountEmail(),
      }), { headers: corsHeaders });
    }

    if (action === "configure_service_account") {
      const spreadsheetId = parseSpreadsheetId(String(body.spreadsheet_id || body.spreadsheet_url || ""));
      const sheetName = String(body.sheet_name || "Sales Log").trim() || "Sales Log";
      if (!spreadsheetId) {
        return new Response(JSON.stringify({ error: "Spreadsheet ID or URL is required" }), { status: 400, headers: corsHeaders });
      }

      const accessToken = await getGoogleServiceAccountAccessToken();
      await ensureGoogleSheetHeader(spreadsheetId, sheetName, accessToken);
      const { data, error } = await supabase
        .from("google_sheet_destinations")
        .upsert({
          user_id: user.id,
          spreadsheet_id: spreadsheetId,
          sheet_name: sheetName,
          enabled: body.enabled !== false,
          auth_method: "service_account",
          access_token: null,
          refresh_token: null,
          token_type: "Bearer",
          token_expires_at: null,
          last_sync_error: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        .select("*")
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ destination: publicDestination(data) }), { headers: corsHeaders });
    }

    if (action === "configure") {
      const spreadsheetId = parseSpreadsheetId(String(body.spreadsheet_id || body.spreadsheet_url || ""));
      const sheetName = String(body.sheet_name || "Sales Log").trim() || "Sales Log";
      const accessToken = String(body.access_token || "");
      const existing = await destinationForUser(supabase, user.id);
      const refreshToken = String(body.refresh_token || existing?.refresh_token || "");
      if (!spreadsheetId) {
        return new Response(JSON.stringify({ error: "Spreadsheet ID or URL is required" }), { status: 400, headers: corsHeaders });
      }
      if (!accessToken) {
        return new Response(JSON.stringify({ error: "Connect Google first so Hoursback can write to the sheet" }), { status: 400, headers: corsHeaders });
      }

      await ensureGoogleSheetHeader(spreadsheetId, sheetName, accessToken);
      const { data, error } = await supabase
        .from("google_sheet_destinations")
        .upsert({
          user_id: user.id,
          spreadsheet_id: spreadsheetId,
          sheet_name: sheetName,
          enabled: body.enabled !== false,
          auth_method: "oauth",
          access_token: accessToken,
          refresh_token: refreshToken || null,
          token_type: String(body.token_type || "Bearer"),
          token_expires_at: tokenExpiresAt(body.expires_in),
          last_sync_error: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        .select("*")
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ destination: publicDestination(data) }), { headers: corsHeaders });
    }

    if (action === "sync") {
      const destination = await destinationForUser(supabase, user.id);
      if (!googleTokenConnected(destination)) {
        return new Response(JSON.stringify({ error: "Google connection expired. Reconnect Google Sheets." }), { status: 400, headers: corsHeaders });
      }
      const accessToken = await getGoogleAccessToken(supabase, destination);
      const since = body.since || destination.last_sync_at || null;
      let query = supabase
        .from("bot_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1000);
      if (since) query = query.gt("created_at", since);
      const { data: entries, error } = await query;
      if (error) throw error;

      const updates = await appendGoogleSheetRows(destination.spreadsheet_id, destination.sheet_name, accessToken, entries || []);
      await supabase
        .from("google_sheet_destinations")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", destination.id);

      return new Response(JSON.stringify({ synced: entries?.length || 0, updates }), { headers: corsHeaders });
    }

    if (action === "disconnect") {
      await supabase
        .from("google_sheet_destinations")
        .delete()
        .eq("user_id", user.id);
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google Sheets sync failed";
    if (action !== "status") {
      await supabase
        .from("google_sheet_destinations")
        .update({ last_sync_error: message, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders });
  }
});
