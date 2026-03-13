import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const workflowId = url.searchParams.get("workflow_id");

    if (!workflowId) {
      return new Response(JSON.stringify({ error: "Missing workflow_id query parameter." }), { status: 400, headers: corsHeaders });
    }

    let payloadText = "";
    if (req.headers.get("content-type")?.includes("application/json")) {
      const payload = await req.json();
      payloadText = JSON.stringify(payload, null, 2);
    } else {
      payloadText = await req.text();
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
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

    if (workflow.status !== "active") {
      return new Response(JSON.stringify({ message: "Workflow is paused." }), { status: 200, headers: corsHeaders });
    }

    console.log(`[Webhook] Processing workflow ${workflowId}: ${workflow.name}`);
    let analysisText: string | null = null;
    let errorMessage: string | null = null;
    let runStatus = "success";

    try {
      // 2. Deep analysis (Sonnet) based on the agent's prompt + webhook payload
      const agentConfig = workflow.agent_config || {};
      const aiPrompt = agentConfig.prompt || "Analyze the following incoming webhook data.";
      const model = agentConfig.model || "claude-sonnet-4-6";

      const analysisPrompt = `You are an AI automated workflow agent.
Workflow Name: "${workflow.name}"
Task/Prompt: "${aiPrompt}"

Incoming Webhook Data:
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
    ${markdownToHtml(analysisText)}
  </div>
</div>`;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Hoursback Autopilot <autopilot@hoursback.xyz>",
              to: email,
              subject: `[Workflow Result] ${workflow.name}`,
              html: htmlContent,
            }),
          });
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
