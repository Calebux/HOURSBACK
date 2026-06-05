import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Pro check
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    const isPro = profile?.subscription_status === "pro";
    if (!isPro) {
      return new Response(
        JSON.stringify({ error: "Sales Book Scanner is a Pro feature. Upgrade at hoursback.xyz" }),
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { image_base64, media_type = "image/jpeg" } = body as {
      image_base64: string;
      media_type?: string;
    };

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "image_base64 is required" }), { status: 400, headers: corsHeaders });
    }

    // Vision parse with Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const visionRes = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: media_type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: image_base64,
            },
          },
          {
            type: "text",
            text: `This is a photo of a physical sales ledger or record book. Extract every line item you can read.

Return a JSON array only, no explanation:
[{"entry_type":"sale"|"expense"|"note","item":string|null,"qty":number|null,"unit_price":number|null,"total":number|null,"customer":string|null,"notes":string|null,"sale_date":"YYYY-MM-DD"|null}]

Rules:
- entry_type: "sale" for sales/revenue, "expense" for costs, "note" for anything else
- sale_date: if a date is visible on the page (e.g. "April 11", "11/4"), convert to YYYY-MM-DD using year ${new Date().getFullYear()}; otherwise null
- Only extract what is clearly readable — do not guess or invent data
- If no entries are readable, return []`,
          },
        ],
      }],
    });

    const visionText = (visionRes.content[0] as { text: string }).text.trim();
    const jsonMatch = visionText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ entries: [] }), { headers: corsHeaders });
    }

    const entries: Array<Record<string, unknown>> = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify({ entries }), { headers: corsHeaders });

  } catch (err: any) {
    console.error("parse-sales-photo error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
