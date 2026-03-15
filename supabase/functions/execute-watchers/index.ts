import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";
import * as XLSX from "npm:xlsx";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const APIFY_API_KEY = Deno.env.get("APIFY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function computeNextRun(schedule: string, time = "08:00", day = "monday"): string {
  const now = new Date();
  const [h, m] = time.split(":").map(Number);

  if (schedule === "hourly") {
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now.toISOString();
  }

  if (schedule === "daily") {
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.toISOString();
  }

  if (schedule === "weekly") {
    const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const target = days.indexOf(day.toLowerCase());
    const next = new Date();
    next.setHours(h, m, 0, 0);
    let diff = (target - next.getDay() + 7) % 7;
    if (diff === 0 && next <= now) diff = 7;
    next.setDate(next.getDate() + diff);
    return next.toISOString();
  }

  now.setDate(now.getDate() + 1);
  return now.toISOString();
}

function markdownToHtml(md: string): string {
  if (!md) return "";
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => { if (inList) { html.push("</ul>"); inList = false; } };
  const inline = (text: string) => text
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

function parseNewsRss(xml: string, query: string, limit = 15): string {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  const parsed = items.slice(0, limit).map(item => {
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      || item.match(/<title>(.*?)<\/title>/)?.[1] || "";
    const desc = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
      || item.match(/<description>(.*?)<\/description>/)?.[1] || "")
      .replace(/<[^>]+>/g, "").substring(0, 200);
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
    return `- **${title}** (${pubDate})\n  ${desc}`;
  });
  return parsed.length ? `Recent results for "${query}":\n\n${parsed.join("\n\n")}` : "No results found.";
}

async function fetchData(sourceType: string, config: any, supabaseClient?: any): Promise<string> {
  if (sourceType === "excel_file" && config.storage_path && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.storage
        .from("excel-uploads")
        .download(config.storage_path);
      if (error) throw error;
      const arrayBuffer = await data.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
      const results: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) results.push(`## Sheet: ${sheetName}\n${csv.substring(0, 3000)}`);
      }
      return results.join("\n\n") || "Excel file is empty.";
    } catch (e) { console.error("excel_file error", e); }
  }

  if (sourceType === "google_sheets" && config.url) {
    try {
      let csvUrl = config.url;
      if (csvUrl.includes("/edit")) csvUrl = csvUrl.replace(/\/edit.*$/, "/export?format=csv");
      const res = await fetch(csvUrl);
      if (res.ok) return (await res.text()).substring(0, 4000);
    } catch (e) { console.error("Sheet fetch error", e); }
  }

  else if (sourceType === "api" && config.url) {
    try {
      const res = await fetch(config.url);
      if (res.ok) return (await res.text()).substring(0, 4000);
    } catch (e) { console.error("API fetch error", e); }
  }

  else if (sourceType === "website" && config.url && FIRECRAWL_API_KEY) {
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

  else if (sourceType === "website_list") {
    const urls: string[] = config.urls || (config.url ? config.url.split("\n").filter(Boolean) : []);
    if (!urls.length) return "No URLs provided.";
    const results: string[] = [];
    for (const rawUrl of urls.slice(0, 5)) {
      const url = rawUrl.trim();
      try {
        if (FIRECRAWL_API_KEY) {
          const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${FIRECRAWL_API_KEY}` },
            body: JSON.stringify({ url, formats: ["markdown"] }),
          });
          const json = await res.json();
          if (json.success && json.data?.markdown) results.push(`## ${url}\n${json.data.markdown.substring(0, 1500)}`);
        } else {
          const res = await fetch(url);
          if (res.ok) results.push(`## ${url}\n${(await res.text()).substring(0, 1500)}`);
        }
      } catch (e) { console.error("website_list fetch error", url, e); }
    }
    return results.join("\n\n---\n\n") || "No data retrieved from URLs.";
  }

  else if (sourceType === "news_search" && config.query) {
    try {
      const q = encodeURIComponent(config.query);
      const res = await fetch(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) return parseNewsRss(await res.text(), config.query, 15);
    } catch (e) { console.error("news_search error", e); }
  }

  else if (sourceType === "brand_monitor" && config.query) {
    try {
      const q = encodeURIComponent(config.query);
      const redditRes = await fetch(`https://www.reddit.com/search.json?q=${q}&sort=new&limit=20&t=week`, { headers: { "User-Agent": "HoursbackWorkflows/1.0" } });
      let redditSection = "No Reddit mentions found.";
      if (redditRes.ok) {
        const posts = ((await redditRes.json()).data?.children || []).slice(0, 10);
        if (posts.length) redditSection = posts.map((p: any) =>
          `- **[r/${p.data.subreddit}]** ${p.data.title} (Score: ${p.data.score})\n  ${(p.data.selftext || "Link post").substring(0, 150)}`
        ).join("\n\n");
      }
      const newsRes = await fetch(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`, { headers: { "User-Agent": "Mozilla/5.0" } });
      const newsSection = newsRes.ok ? parseNewsRss(await newsRes.text(), config.query, 8) : "No news mentions found.";
      return `## Reddit Mentions (past week)\n${redditSection}\n\n## News Mentions\n${newsSection}`;
    } catch (e) { console.error("brand_monitor error", e); }
  }

  else if (sourceType === "regulatory_monitor" && config.query) {
    try {
      const q = encodeURIComponent(`${config.query} regulation law compliance rule`);
      const res = await fetch(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) return parseNewsRss(await res.text(), config.query, 20);
    } catch (e) { console.error("regulatory_monitor error", e); }
  }

  else if (sourceType === "youtube_trends" && config.query) {
    if (!APIFY_API_KEY) return "Apify API key not configured.";
    try {
      // Use Google Search Scraper to find trending YouTube videos in the niche
      const query = `site:youtube.com ${config.query} trending`;
      const runRes = await fetch(
        `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ queries: query, maxPagesPerQuery: 1, resultsPerPage: 10 }) }
      );
      let videoSection = "No YouTube results found.";
      if (runRes.ok) {
        const results = await runRes.json();
        const items = (results[0]?.organicResults || []).slice(0, 10);
        if (items.length) videoSection = items.map((r: any) =>
          `- **${r.title}**\n  ${r.url}\n  ${(r.description || "").substring(0, 200)}`
        ).join("\n\n");
      }
      // Also pull Reddit discussions about the niche for audience insight
      const redditRes = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(config.query + " youtube")}&sort=top&t=month&limit=10`,
        { headers: { "User-Agent": "HoursbackWorkflows/1.0" } }
      );
      let redditSection = "";
      if (redditRes.ok) {
        const posts = ((await redditRes.json()).data?.children || []).slice(0, 5);
        if (posts.length) redditSection = "\n\n## Audience Discussions (Reddit)\n" + posts.map((p: any) =>
          `- **[r/${p.data.subreddit}]** ${p.data.title} (Score: ${p.data.score})`
        ).join("\n");
      }
      return `Trending YouTube content for "${config.query}":\n\n${videoSection}${redditSection}`;
    } catch (e) { console.error("youtube_trends error", e); }
  }

  else if (sourceType === "text_prompt" && config.text) {
    return `User input:\n\n${config.text}`;
  }

  else if (sourceType === "forex") {
    try {
      const currencies = config.currencies || ["USD", "EUR", "GBP"];
      const res = await fetch("https://open.er-api.com/v6/latest/NGN");
      const json = await res.json();
      if (!json.rates) return "Could not fetch exchange rates.";
      // Rates are NGN per 1 unit of base — invert to get units per NGN
      const lines = currencies.map((cur: string) => {
        const rateNGNperFX = json.rates[cur] ? (1 / json.rates[cur]).toFixed(2) : "N/A";
        return `- ${cur}/NGN: ₦${rateNGNperFX}`;
      });
      const context = config.context ? `\n\nBusiness context: ${config.context}` : "";
      return `Live Exchange Rates (NGN base, as of ${new Date().toUTCString()}):\n${lines.join("\n")}${context}`;
    } catch (e) { console.error("forex fetch error", e); return "Could not fetch forex data."; }
  }

  else if (sourceType === "linkedin_monitor" && config.query) {
    if (!APIFY_API_KEY) return "Apify API key not configured.";
    try {
      const queries = config.query.split("\n").filter(Boolean).slice(0, 5)
        .map((c: string) => `${c.trim()} hiring OR funding OR expansion OR "series" OR "new office"`).join("\n");
      const runRes = await fetch(
        `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ queries, maxPagesPerQuery: 1, resultsPerPage: 5 }) }
      );
      if (runRes.ok) {
        const results = await runRes.json();
        const formatted = results.map((r: any) =>
          (r.organicResults || []).slice(0, 5).map((item: any) =>
            `- **${item.title}**\n  ${(item.description || "").substring(0, 200)}`
          ).join("\n")
        ).join("\n\n");
        return `Company expansion signals:\n\n${formatted || "No results found."}`;
      }
    } catch (e) { console.error("linkedin_monitor error", e); }
  }

  return "No data retrieved or unsupported source type.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const now = new Date().toISOString();

    // Support manual "run now" by passing workflow_id in body
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const manualWorkflowId: string | undefined = body.workflow_id;

    let workflows: any[] = [];
    if (manualWorkflowId) {
      const { data, error } = await supabase.from("workflows").select("*").eq("id", manualWorkflowId).single();
      if (error || !data) return new Response(JSON.stringify({ error: "Workflow not found." }), { status: 404, headers: corsHeaders });
      workflows = [data];
    } else {
      const { data, error: fetchErr } = await supabase
        .from("workflows")
        .select("*")
        .eq("status", "active")
        .eq("trigger_config->>type", "schedule")
        .or(`next_run.is.null,next_run.lte.${now}`);
      if (fetchErr || !data) throw new Error(`Failed to fetch workflows: ${fetchErr?.message}`);
      workflows = data;
    }

    let runsCount = 0;
    let triggeredCount = 0;

    for (const workflow of workflows) {
      console.log(`[Workflow] Processing: ${workflow.id} — ${workflow.name}`);
      let triggered = false;
      let reason = "Evaluation failed.";
      let analysisText: string | null = null;
      let errorMessage: string | null = null;
      let runStatus = "failed";

      const triggerConfig = workflow.trigger_config || {};
      const dataSourceConfig = workflow.data_source_config || {};
      const agentConfig = workflow.agent_config || {};
      const actionConfig = workflow.action_config || {};

      try {
        // Fetch current data
        const data = await fetchData(dataSourceConfig.type, dataSourceConfig, supabase);

        // Fetch last successful run for memory/comparison
        const { data: lastRun } = await supabase
          .from("workflow_runs")
          .select("generated_output, created_at, feedback")
          .eq("workflow_id", workflow.id)
          .eq("status", "success")
          .not("generated_output", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const hasMemory = !!lastRun?.generated_output;
        const lastRunDate = hasMemory ? new Date(lastRun!.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : null;
        const lastFeedback: string | null = lastRun?.feedback ?? null;

        // Condition check (Haiku) if set
        if (agentConfig.condition_prompt) {
          const evalResponse = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            messages: [{ role: "user", content: `You are a data monitor. Data:\n<data>${data}</data>\n\nRule: "${agentConfig.condition_prompt}"\n\nRespond JSON: { "triggered": boolean, "reason": "1 sentence" }` }],
          });
          try {
            const jsonMatch = ((evalResponse.content[0] as any).text as string).match(/\{[\s\S]*\}/);
            if (jsonMatch) { const p = JSON.parse(jsonMatch[0]); triggered = !!p.triggered; reason = p.reason || reason; }
          } catch (e) { console.error("Eval JSON parse error"); }
        } else {
          triggered = true;
          reason = "Scheduled execution.";
        }

        console.log(`[Workflow] Triggered? ${triggered} — ${reason}`);

        if (triggered) {
          triggeredCount++;
          runStatus = "success";

          const analysisPrompt = `You are an expert AI business analyst running an automated workflow.

Workflow: "${workflow.name}"
Run Date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Task: "${agentConfig.prompt || "Analyze the data and provide business insights."}"

${hasMemory ? `## Memory: Previous Run (${lastRunDate})
The following is what was reported in the last run. Use this to identify what has CHANGED, what is NEW, and what trends are developing:
<previous_run>
${lastRun!.generated_output!.substring(0, 2000)}
</previous_run>

` : "## Context: First Run\nNo previous data available. Establish a baseline.\n\n"}## Current Data
<current_data>
${data}
</current_data>

## Instructions
Produce a sharp, executive-level report. Be specific — cite actual names, numbers, and dates from the data. Avoid vague summaries.

${hasMemory ? "Since you have previous run data: explicitly call out what CHANGED since last time. Start findings with 'Up from...', 'Down from...', 'New since last run:', 'No change in...' where relevant." : ""}

${lastFeedback === "too_vague" ? `## ⚠️ Feedback from last run: TOO VAGUE — You MUST fix this
The user rated the previous report as too vague. This run you are REQUIRED to:
- Use exact numbers, percentages, and figures from the data (never say "significant" — say "increased by 34%")
- Name specific companies, products, people, or URLs mentioned in the data
- Every bullet point must contain at least one concrete fact
- Replace all generic phrases with specific ones` : ""}

${lastFeedback === "not_helpful" ? `## ⚠️ Feedback from last run: NOT HELPFUL — You MUST fix this
The user found the previous report unhelpful. This run you are REQUIRED to:
- Lead with the single most important actionable insight in the Executive Summary
- Every section must end with a concrete action the user can take today
- Skip all background context — go straight to what changed and what to do
- Each recommended action must be specific (who does what, by when)` : ""}

${lastFeedback === "helpful" ? "## Note: The previous report was rated helpful. Maintain the same level of specificity and depth." : ""}

Structure your response exactly as:

## Executive Summary
2-3 sentences. What is the single most important thing to know right now?

## Key Findings
Bullet points. Specific, factual. Numbers where possible.

## What Changed Since Last Run
${hasMemory ? "Compare explicitly to the previous run. What's new, what moved, what disappeared?" : "N/A — this is the first run. Note baseline values for future comparison."}

## Business Implications
What does this mean for the business? Be direct.

## Recommended Actions
Numbered list. Concrete next steps, not generic advice.

---

IMPORTANT — CHARTS ARE REQUIRED:
Every time you present numbers, you MUST immediately follow with a chart block. No exceptions.

Use this exact format (valid JSON on one line, no trailing commas):

\`\`\`chart
{"type":"bar","title":"Revenue by Month","data":[{"name":"Jan","value":45000},{"name":"Feb","value":52000}],"color":"#3B82F6"}
\`\`\`

Chart type rules:
- "bar" → comparing categories side by side
- "line" → trend over time (weeks, months, quarters)
- "pie" → parts of a whole / percentages

Strict rules:
1. ONLY use numbers that actually appear in the current data. Never fabricate chart data.
2. Each chart must be on its own line block, starting with \`\`\`chart and ending with \`\`\`
3. The JSON must be valid — double-check commas and brackets
4. Maximum 10 data points per chart
5. Place charts directly after the bullet points they visualize, not at the end`;

          const analysisResponse = await anthropic.messages.create({
            model: agentConfig.model || "claude-sonnet-4-6",
            max_tokens: 4000,
            messages: [{ role: "user", content: analysisPrompt }],
          });

          analysisText = (analysisResponse.content[0] as any).text as string;

          // Email delivery
          if (actionConfig.type === "email" && RESEND_API_KEY) {
            const { data: userData } = await supabase.auth.admin.getUserById(workflow.user_id);
            const primaryEmail = actionConfig.to || userData?.user?.email;
            const ccEmails: string[] = Array.isArray(actionConfig.cc) ? actionConfig.cc : [];
            if (primaryEmail) {
              const runDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
              const memoryLine = hasMemory ? ` · Compared to ${lastRunDate}` : " · First run";
              const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${workflow.name}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">

      <!-- Header -->
      <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px 28px;">
        <p style="margin:0;color:#94a3b8;font-size:11px;font-family:-apple-system,Helvetica,sans-serif;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Hoursback · Automated Workflow</p>
        <h1 style="margin:8px 0 4px;color:#ffffff;font-size:22px;font-family:-apple-system,Helvetica,sans-serif;font-weight:700;line-height:1.3;">${workflow.name}</h1>
        <p style="margin:0;color:#64748b;font-size:13px;font-family:-apple-system,Helvetica,sans-serif;">${runDate}${memoryLine}</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:28px;font-family:-apple-system,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#1e293b;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        ${markdownToHtml(analysisText)}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:16px 28px;text-align:center;">
        <p style="margin:0;font-family:-apple-system,Helvetica,sans-serif;font-size:12px;color:#94a3b8;">
          Delivered automatically by <a href="https://hoursback.xyz" style="color:#3b82f6;text-decoration:none;font-weight:600;">Hoursback</a>
          &nbsp;·&nbsp; <a href="https://hoursback.xyz/workflows" style="color:#94a3b8;text-decoration:none;">Manage workflows</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

              const toField = ccEmails.length > 0 ? [primaryEmail, ...ccEmails] : primaryEmail;
              const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  from: "Hoursback Autopilot <autopilot@hoursback.xyz>",
                  to: toField,
                  subject: `[${workflow.name}] ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })} Report`,
                  html: htmlContent,
                }),
              });
              if (!res.ok) console.error("[Workflow] Email send failed", await res.text());
            }
          }
        } else {
          runStatus = "success";
        }
      } catch (err: any) {
        console.error(`[Workflow] Error: ${workflow.id}`, err);
        errorMessage = err.message || "Unknown error";
      }

      await supabase.from("workflow_runs").insert({
        workflow_id: workflow.id,
        user_id: workflow.user_id,
        status: runStatus,
        generated_output: analysisText || reason,
        error_message: errorMessage,
      });

      await supabase.from("workflows").update({
        last_run: now,
        next_run: manualWorkflowId ? undefined : computeNextRun(triggerConfig.schedule || "daily", triggerConfig.time || "08:00", triggerConfig.day || "monday"),
      }).eq("id", workflow.id);

      runsCount++;
    }

    return new Response(
      JSON.stringify({ success: true, message: `Processed ${runsCount} workflows. Triggered ${triggeredCount}.` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (err: any) {
    console.error("[Workflow] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
