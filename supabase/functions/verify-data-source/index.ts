import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const { data: { user }, error: authError } = await createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  ).auth.getUser();

  if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const { url, source_id } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: "URL required" }), { status: 400, headers: corsHeaders });

  try {
    let preview = "";
    let rowCount: number | null = null;

    if (url.includes("docs.google.com/spreadsheets")) {
      // Export as CSV
      const csvUrl = url.replace(/\/edit.*$/, "/export?format=csv");
      const res = await fetch(csvUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return new Response(JSON.stringify({
          ok: false,
          error: `Could not access sheet (HTTP ${res.status}). Make sure it is set to "Anyone with the link can view".`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await res.text();
      const lines = text.trim().split("\n").filter(Boolean);
      rowCount = Math.max(0, lines.length - 1); // minus header row
      preview = lines.slice(0, 4).join("\n");
    } else if (url.includes("docs.google.com/document")) {
      const exportUrl = url.replace(/\/edit.*$/, "/export?format=txt");
      const res = await fetch(exportUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return new Response(JSON.stringify({
          ok: false,
          error: `Could not access document (HTTP ${res.status}). Make sure sharing is set to "Anyone with the link".`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await res.text();
      preview = text.substring(0, 300);
    } else {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return new Response(JSON.stringify({
          ok: false,
          error: `Could not access URL (HTTP ${res.status}).`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await res.text();
      preview = text.substring(0, 300);
    }

    // If a source_id was passed, update verified status
    if (source_id) {
      await supabase.from("data_sources")
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq("id", source_id)
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ ok: true, preview, rowCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message || "Could not reach that URL" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
