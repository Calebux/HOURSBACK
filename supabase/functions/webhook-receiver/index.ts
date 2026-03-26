import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";
import { sanitizeText, isValidUUID, getClientIp, checkRateLimit, rateLimitResponse, fetchWithTimeout } from "../_shared/security.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function markdownToHtml(md: string): string {
  if (!md) return "";
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => { if (inList) { html.push("</ul>"); inList = false; } };
  const inline = (text: string) => text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`([^`]+)`/g, '<code style="background:#e5e7eb;padding:1px 5px;border-radius:4px;">$1</code>');

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("```")) continue;
    if (/^# /.test(line)) { closeList(); html.push(`<h1 style="font-size:22px;font-weight:700;margin:24px 0 8px;">${inline(line.slice(2))}</h1>`); continue; }
    if (/^## /.test(line)) { closeList(); html.push(`<h2 style="font-size:18px;font-weight:700;margin:20px 0 6px;">${inline(line.slice(3))}</h2>`); continue; }
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

function tryParseJson(raw: string): any | null {
  try { return JSON.parse(raw); } catch {}
  for (const c of [']}', '}}', '}]}', '"}]}']) {
    try { return JSON.parse(raw + c); } catch {}
  }
  return null;
}

function buildQuickChartUrl(spec: string): string | null {
  const config = tryParseJson(spec);
  if (!config || !config.data?.length) return null;
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  try {
    const chartJs = {
      type: config.type === 'line' ? 'line' : config.type === 'pie' ? 'pie' : 'bar',
      data: {
        labels: config.data.map((d: any) => d.name),
        datasets: [{ label: config.title || 'Value', data: config.data.map((d: any) => d.value), backgroundColor: config.type === 'pie' ? colors.slice(0, config.data.length) : (config.color || '#3B82F6'), borderColor: config.type === 'line' ? (config.color || '#3B82F6') : undefined, borderWidth: config.type === 'line' ? 2 : undefined, fill: false, tension: 0.3, borderRadius: config.type === 'bar' ? 6 : undefined }],
      },
      options: { plugins: { title: { display: !!config.title, text: config.title, font: { size: 14, weight: 'bold' } }, legend: { display: config.type === 'pie' } }, scales: config.type !== 'pie' ? { y: { grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } } : undefined },
    };
    const encoded = encodeURIComponent(JSON.stringify(chartJs));
    return `https://quickchart.io/chart?c=${encoded}&width=600&height=300&backgroundColor=white&devicePixelRatio=2`;
  } catch { return null; }
}

function renderEmailHtml(md: string): string {
  const chartHtmlMap = new Map<string, string>();
  let idx = 0;
  const mdWithTokens = md.replace(/```chart\s*([\s\S]*?)(?:```|$)/g, (_, spec) => {
    const token = `HBCHARTTOK${idx++}`;
    const url = buildQuickChartUrl(spec.trim());
    if (!url) return '';
    const title = tryParseJson(spec.trim())?.title || '';
    chartHtmlMap.set(`<p style="margin:8px 0;line-height:1.6;">${token}</p>`, `<div style="margin:16px 0;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background:#fff;">${title ? `<p style="margin:0;padding:12px 16px 4px;font-size:13px;font-weight:600;color:#374151;">${title}</p>` : ''}<img src="${url}" alt="${title || 'Chart'}" width="600" style="width:100%;max-width:600px;display:block;" /></div>`);
    return token;
  });
  let html = markdownToHtml(mdWithTokens);
  for (const [placeholder, chartHtml] of chartHtmlMap.entries()) {
    html = html.replace(placeholder, chartHtml);
  }
  return html;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const workflowId = url.searchParams.get("workflow_id");

    if (!workflowId) {
      return new Response(JSON.stringify({ error: "Missing workflow_id query parameter." }), { status: 400, headers: corsHeaders });
    }

    // Validate workflow_id format to prevent injection
    if (!isValidUUID(workflowId)) {
      return new Response(JSON.stringify({ error: "Invalid workflow_id format." }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Rate limit: 60 requests per minute per IP
    const clientIp = getClientIp(req);
    const rl = await checkRateLimit(supabase, `webhook:${clientIp}`, 60, 60);
    if (!rl.allowed) return rateLimitResponse();

    // Read and sanitize payload — cap at 50KB to prevent context stuffing
    const MAX_PAYLOAD = 50_000;
    let rawPayload = "";
    if (req.headers.get("content-type")?.includes("application/json")) {
      const payload = await req.json();
      rawPayload = JSON.stringify(payload, null, 2);
    } else {
      rawPayload = await req.text();
    }
    const payloadText = sanitizeText(rawPayload, MAX_PAYLOAD);
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    // 1. Fetch the workflow
    const { data: workflow, error: fetchErr } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (fetchErr || !workflow) {
      return new Response(JSON.stringify({ error: "Workflow not found or invalid." }), { status: 404, headers: corsHeaders });
    }

    // Verify webhook secret — must match the value generated at deploy time
    const incomingSecret = url.searchParams.get("secret") || req.headers.get("x-webhook-secret");
    if (workflow.webhook_secret && incomingSecret !== workflow.webhook_secret) {
      return new Response(JSON.stringify({ error: "Invalid webhook secret." }), { status: 401, headers: corsHeaders });
    }

    // Pro workflow check — verify user has an active Pro subscription
    if (workflow.is_pro) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", workflow.user_id)
        .maybeSingle();
      if (profileRow?.subscription_status !== "pro") {
        return new Response(
          JSON.stringify({ error: "This workflow requires a Pro subscription." }),
          { status: 403, headers: corsHeaders }
        );
      }
    }

    if (workflow.status !== "active") {
      return new Response(JSON.stringify({ message: "Workflow is paused." }), { status: 200, headers: corsHeaders });
    }

    console.log(`[Webhook] Processing workflow ${workflowId}: ${workflow.name}`);
    let analysisText: string | null = null;
    let errorMessage: string | null = null;
    let runStatus = "success";

    try {
      // 2. Fetch business profile for personalisation
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("business_profile")
        .eq("id", workflow.user_id)
        .maybeSingle();
      const bp = profileRow?.business_profile as any;
      const businessContext = bp?.businessName ? `## About This Business
You are analysing data specifically for ${bp.businessName}, a ${bp.industry} business.
${bp.products ? `Products/services: ${bp.products}.` : ""}
${bp.metrics?.length ? `Key metrics they track: ${bp.metrics.join(", ")}.` : ""}
${bp.competitors ? `Their main competitors: ${bp.competitors}.` : ""}
${bp.challenge ? `Their current biggest challenge: ${bp.challenge}.` : ""}
${bp.currency ? `They operate in ${bp.currency}.` : ""}

Frame your findings in context of this specific business. Mention ${bp.businessName} by name where relevant.

` : "";

      // 3. Deep analysis (Sonnet) based on the agent's prompt + webhook payload
      const agentConfig = workflow.agent_config || {};
      const aiPrompt = agentConfig.prompt || "Analyze the following incoming webhook data.";
      const model = agentConfig.model || "claude-sonnet-4-6";

      const triggerConfig = workflow.trigger_config || {};
      const webhookAlerts: Array<{ metric: string; condition: string; value: string }> = triggerConfig.alerts || [];
      const alertInstructions = webhookAlerts.length > 0 ? `## Decision Triggers — EVALUATE FIRST
The user has set the following alert conditions. Check each one against the incoming data:
${webhookAlerts.map((a, i) => `${i + 1}. If **${a.metric}** ${a.condition.replace(/_/g, ' ')} **${a.value}** → flag as TRIGGERED`).join('\n')}

If ANY condition is triggered, add this section at the very top of your report (before everything else):

## 🚨 Alert Triggered
[List each triggered condition. State the actual value found vs the threshold.]

If NO conditions are triggered, omit the alerts section entirely.

` : '';

      const analysisPrompt = `You are an AI automated workflow agent.
Workflow Name: "${workflow.name}"
Task/Prompt: "${aiPrompt}"

${alertInstructions}${businessContext}Incoming Webhook Data:
<data>
${payloadText}
</data>

Perform the task described in your prompt using the data provided. Respond with a clear, well-formatted markdown report containing the insights or required output. Be concise.`;

      const analysisResponse = await anthropic.messages.create({
        model: model === "claude-sonnet-4-6" ? "claude-sonnet-4-6" : "claude-3-5-sonnet-20240620", // Default mapper
        max_tokens: 2000,
        messages: [{ role: "user", content: analysisPrompt }],
      });

      analysisText = (analysisResponse.content[0] as any).text as string;

      // 3. Action delivery (e.g. email)
      const actionConfig = workflow.action_config || {};
      if (actionConfig.type === "email" && RESEND_API_KEY) {
        const { data: userData } = await supabase.auth.admin.getUserById(workflow.user_id);
        const email = actionConfig.to || userData?.user?.email;

        if (email) {
          const htmlContent = `
<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#f8fafc;padding:24px;border-radius:12px;margin-bottom:24px;border:1px solid #e2e8f0;">
    <h2 style="margin:0 0 8px 0;color:#0f172a;font-size:20px;">⚡ Webhook Workflow Completed</h2>
    <p style="margin:0;color:#475569;font-size:15px;"><strong>${workflow.name}</strong> just processed new data.</p>
  </div>
  <div style="background:#fff;padding:24px;border-radius:12px;border:1px solid #e2e8f0;">
    ${renderEmailHtml(analysisText)}
  </div>
</div>`;

          const res = await fetchWithTimeout("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Hoursback Autopilot <autopilot@hoursback.xyz>",
              to: email,
              subject: `[Workflow Result] ${workflow.name}`,
              html: htmlContent,
            }),
          }, 10_000);
          if (!res.ok) console.error("[Webhook] Email send failed", await res.text());
        }
      }
    } catch (err: any) {
      console.error(`[Webhook] Error processing ${workflowId}:`, err);
      errorMessage = err.message || "Unknown error";
      runStatus = "failed";
    }

    // 4. Write run log
    await supabase.from("workflow_runs").insert({
      workflow_id: workflow.id,
      user_id: workflow.user_id,
      status: runStatus,
      generated_output: analysisText,
      error_message: errorMessage,
    });

    return new Response(JSON.stringify({ success: true, run_status: runStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[Webhook] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
