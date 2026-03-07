import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Compute next_run timestamp based on schedule string
function computeNextRun(schedule: string): string {
  const now = new Date();
  switch (schedule) {
    case "hourly":  now.setHours(now.getHours() + 1); break;
    case "weekly":  now.setDate(now.getDate() + 7); break;
    case "daily":
    default:        now.setDate(now.getDate() + 1); break;
  }
  return now.toISOString();
}

// Markdown to HTML helper for email formatting
function markdownToHtml(md: string): string {
  if (!md) return "";
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) { html.push("</ul>"); inList = false; }
  };

  const inline = (text: string) =>
    text
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code style="background:#e5e7eb;padding:1px 5px;border-radius:4px;">$1</code>');

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("```")) continue;

    if (/^# /.test(line))   { closeList(); html.push(`<h1 style="font-size:22px;font-weight:700;margin:24px 0 8px;">${inline(line.slice(2))}</h1>`); continue; }
    if (/^## /.test(line))  { closeList(); html.push(`<h2 style="font-size:18px;font-weight:700;margin:20px 0 6px;">${inline(line.slice(3))}</h2>`); continue; }
    if (/^### /.test(line)) { closeList(); html.push(`<h3 style="font-size:15px;font-weight:600;margin:16px 0 4px;">${inline(line.slice(4))}</h3>`); continue; }

    const ulMatch = line.match(/^[-*] (.+)/);
    if (ulMatch) {
      if (!inList) { html.push('<ul style="margin:8px 0;padding-left:20px;">'); inList = true; }
      html.push(`<li style="margin:4px 0;">${inline(ulMatch[1])}</li>`); continue;
    }

    if (line.trim() === "") { closeList(); continue; }
    closeList();
    html.push(`<p style="margin:8px 0;line-height:1.6;">${inline(line)}</p>`);
  }
  closeList();
  return html.join("\n");
}

// Fetch data from source
async function fetchData(sourceType: string, config: any): Promise<string> {
  if (sourceType === "google_sheets" && config.url) {
    try {
      let csvUrl = config.url;
      if (csvUrl.includes("/edit")) {
        csvUrl = csvUrl.replace(/\/edit.*$/, "/export?format=csv");
      }
      const res = await fetch(csvUrl);
      if (res.ok) return (await res.text()).substring(0, 4000);
    } catch (e) {
      console.error("Sheet fetch error", e);
    }
  } else if (sourceType === "api" && config.url) {
    try {
      const res = await fetch(config.url);
      if (res.ok) return (await res.text()).substring(0, 4000);
    } catch (e) {
      console.error("API fetch error", e);
    }
  }

  // Firecrawl fallback
  if (config.url && FIRECRAWL_API_KEY) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${FIRECRAWL_API_KEY}` },
        body: JSON.stringify({ url: config.url, formats: ["markdown"] }),
      });
      const json = await res.json();
      if (json.success && json.data?.markdown) return json.data.markdown.substring(0, 4000);
    } catch (e) { console.error("Firecrawl error", e); }
  }

  return "No data retrieved or unsupported source type.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const now = new Date().toISOString();

    // Fetch active watchers that are due (next_run is null or in the past)
    const { data: watchers, error: fetchErr } = await supabase
      .from("watchers")
      .select("*")
      .eq("status", "active")
      .or(`next_run.is.null,next_run.lte.${now}`);

    if (fetchErr || !watchers) {
      throw new Error(`Failed to fetch watchers: ${fetchErr?.message}`);
    }

    let runsCount = 0;
    let triggeredCount = 0;

    for (const watcher of watchers) {
      console.log(`[Watcher] Processing: ${watcher.id} — ${watcher.name}`);
      let triggered = false;
      let reason = "Evaluation failed.";
      let analysisText: string | null = null;
      let errorMessage: string | null = null;

      try {
        // 1. Fetch data
        const data = await fetchData(watcher.data_source_type, watcher.data_source_config || {});

        // 2. Fast condition evaluation (Haiku — cheap)
        const evalPrompt = `You are a data monitor.
Look at this data:
<data>
${data}
</data>

The user's monitoring rule is: "${watcher.condition_prompt}"

Determine if the rule is currently met based strictly on the data provided.
Respond in JSON format: { "triggered": boolean, "reason": "1 sentence explanation" }`;

        const evalResponse = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{ role: "user", content: evalPrompt }],
        });

        const evalText = (evalResponse.content[0] as any).text as string;
        try {
          const jsonMatch = evalText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            triggered = !!parsed.triggered;
            reason = parsed.reason || reason;
          }
        } catch (e) {
          console.error("[Watcher] Failed to parse eval JSON", evalText);
        }

        console.log(`[Watcher] Triggered? ${triggered} — ${reason}`);

        // 3. Deep analysis (Sonnet — only when triggered)
        if (triggered) {
          triggeredCount++;

          const analysisPrompt = `You are a business analyst.
The following watcher condition just triggered: "${watcher.condition_prompt}"
Reason: ${reason}

User's requested analysis: "${watcher.ai_prompt}"

Data:
<data>
${data}
</data>

Provide a clear, well-formatted markdown report addressing the user's analysis prompt. Be concise and business-focused.`;

          const analysisResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2000,
            messages: [{ role: "user", content: analysisPrompt }],
          });

          analysisText = (analysisResponse.content[0] as any).text as string;

          // 4. Deliver alert
          if (watcher.action_type === "email" && RESEND_API_KEY) {
            const { data: userData } = await supabase.auth.admin.getUserById(watcher.user_id);
            const email = userData?.user?.email;
            if (email) {
              const htmlContent = `
<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#f8fafc;padding:24px;border-radius:12px;margin-bottom:24px;border:1px solid #e2e8f0;">
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:20px;">🚨 Watcher Alert: ${watcher.name}</h2>
    <p style="margin:0;color:#475569;font-size:15px;">Condition met: <strong>${watcher.condition_prompt}</strong></p>
    <p style="margin:12px 0 0 0;color:#64748b;font-size:14px;background:#fff;padding:12px;border-radius:6px;border:1px solid #cbd5e1;">${reason}</p>
  </div>
  <div style="background:#fff;padding:24px;border-radius:12px;border:1px solid #e2e8f0;">
    ${markdownToHtml(analysisText)}
  </div>
  <div style="margin-top:24px;text-align:center;font-size:13px;color:#94a3b8;">
    You are receiving this because you configured a Watcher via Hoursback.
  </div>
</div>`;

              const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  from: "Hoursback Watchers <watchers@hoursback.com>",
                  to: email,
                  subject: `[Alert] ${watcher.name} triggered`,
                  html: htmlContent,
                }),
              });
              if (!res.ok) console.error("[Watcher] Email send failed", await res.text());
              else console.log(`[Watcher] Email sent to ${email}`);
            }
          }
          // dashboard action: analysis stored in log below — UI reads it from there

          // Update last_triggered_at
          await supabase.from("watchers").update({ last_triggered_at: now }).eq("id", watcher.id);
        }
      } catch (err: any) {
        console.error(`[Watcher] Error processing ${watcher.id}:`, err);
        errorMessage = err.message || "Unknown error";
      }

      // 5. Write run log
      await supabase.from("watcher_logs").insert({
        watcher_id: watcher.id,
        triggered,
        summary: reason,
        analysis_text: analysisText,
        error_message: errorMessage,
      });

      // 6. Update last_run + next_run
      await supabase.from("watchers").update({
        last_run: now,
        next_run: computeNextRun(watcher.schedule || "daily"),
      }).eq("id", watcher.id);

      runsCount++;
    }

    return new Response(
      JSON.stringify({ success: true, message: `Processed ${runsCount} watchers. Triggered ${triggeredCount}.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err: any) {
    console.error("[Watcher] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
