import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Markdown → HTML converter (handles Claude's typical output)
// ---------------------------------------------------------------------------
function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;
  let listType = "";

  const closeList = () => {
    if (inList) {
      html.push(listType === "ul" ? "</ul>" : "</ol>");
      inList = false;
      listType = "";
    }
  };

  const inline = (text: string) =>
    text
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code style="background:#e5e7eb;padding:1px 5px;border-radius:4px;font-size:13px;">$1</code>');

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Horizontal rule
    if (/^---+$/.test(line)) { closeList(); html.push('<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">'); continue; }

    // H1
    if (/^# /.test(line)) { closeList(); html.push(`<h1 style="font-size:20px;font-weight:700;color:#202124;margin:24px 0 8px;">${inline(line.slice(2))}</h1>`); continue; }

    // H2
    if (/^## /.test(line)) { closeList(); html.push(`<h2 style="font-size:17px;font-weight:700;color:#202124;margin:20px 0 6px;">${inline(line.slice(3))}</h2>`); continue; }

    // H3
    if (/^### /.test(line)) { closeList(); html.push(`<h3 style="font-size:15px;font-weight:600;color:#202124;margin:16px 0 4px;">${inline(line.slice(4))}</h3>`); continue; }

    // Unordered list item
    const ulMatch = line.match(/^[\-\*] (.+)/);
    if (ulMatch) {
      if (!inList || listType !== "ul") { closeList(); html.push('<ul style="margin:8px 0;padding-left:20px;">'); inList = true; listType = "ul"; }
      html.push(`<li style="margin:4px 0;color:#374151;line-height:1.7;">${inline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list item
    const olMatch = line.match(/^\d+\. (.+)/);
    if (olMatch) {
      if (!inList || listType !== "ol") { closeList(); html.push('<ol style="margin:8px 0;padding-left:20px;">'); inList = true; listType = "ol"; }
      html.push(`<li style="margin:4px 0;color:#374151;line-height:1.7;">${inline(olMatch[1])}</li>`);
      continue;
    }

    // Blank line
    if (line.trim() === "") { closeList(); html.push(""); continue; }

    // Regular paragraph
    closeList();
    html.push(`<p style="margin:6px 0;color:#374151;line-height:1.8;font-size:14px;">${inline(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}

// ---------------------------------------------------------------------------
// Cron expression matcher — supports the 3 schedule types we generate:
//   daily:    "MM HH * * *"
//   weekdays: "MM HH * * 1-5"
//   weekly:   "MM HH * * 1"
// ---------------------------------------------------------------------------
function cronMatchesNow(cron: string): boolean {
  const parts = cron.split(" ");
  if (parts.length !== 5) return false;
  const [cronMin, cronHour, , , cronDow] = parts;

  const now = new Date();
  const nowMin = now.getUTCMinutes();
  const nowHour = now.getUTCHours();
  const nowDow = now.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat

  if (parseInt(cronMin) !== nowMin) return false;
  if (parseInt(cronHour) !== nowHour) return false;

  if (cronDow === "*") return true;                         // daily
  if (cronDow === "1-5") return nowDow >= 1 && nowDow <= 5; // weekdays
  return parseInt(cronDow) === nowDow;                      // specific day
}

// ---------------------------------------------------------------------------
// Execute a single schedule: call Claude, email the result, log the run
// ---------------------------------------------------------------------------
async function executeSchedule(schedule: any, supabaseAdmin: any): Promise<void> {
  const playbookData = schedule.playbook_data;
  const playbookSlug = schedule.playbook_slug;
  const variables = schedule.variables || {};

  // Get user email via admin auth API
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(schedule.user_id);
  if (userError || !userData?.user?.email) {
    throw new Error(`Could not fetch email for user ${schedule.user_id}`);
  }
  const deliveryEmail = schedule.custom_delivery_email || userData.user.email;

  // Build the full prompt from playbook steps
  let compiledPrompt = `You are an autonomous AI Agent executing the playbook: "${playbookData?.title || playbookSlug}".\n\n`;
  compiledPrompt += `### USER CONFIGURATION:\n`;
  Object.entries(variables).forEach(([key, value]) => {
    compiledPrompt += `- ${key}: ${value}\n`;
  });
  compiledPrompt += `\n### EXECUTION STEPS:\n`;

  if (playbookData?.steps) {
    playbookData.steps.forEach((step: any, index: number) => {
      let stepPrompt = step.promptTemplate || "";
      Object.keys(variables).forEach((v) => {
        if (variables[v]) {
          stepPrompt = stepPrompt.split(`[${v}]`).join(variables[v]);
        }
      });
      compiledPrompt += `STEP ${index + 1}: ${step.title}\n`;
      compiledPrompt += `Instruction: ${step.instruction}\n`;
      if (stepPrompt) compiledPrompt += `Prompt: ${stepPrompt}\n`;
      compiledPrompt += `\n`;
    });
  } else {
    compiledPrompt += `Generate a comprehensive, actionable response based on the configuration. Format as a professional brief.`;
  }

  compiledPrompt += `\n### FINAL TASK:\n`;
  compiledPrompt += `Process all steps and produce the final result. ${playbookData?.expectedOutcome ? `Expected Outcome: ${playbookData.expectedOutcome}` : ""}\n`;
  compiledPrompt += `No conversational filler — only polished, high-quality output.`;

  console.log(`[Autopilot] Executing "${playbookData?.title || playbookSlug}" for ${deliveryEmail}`);

  // Call Claude
  if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system:
      "You are an autonomous expert consultant. Produce polished, insightful work based exactly on the user's scheduled configuration. No conversational filler — only the final report.",
    messages: [{ role: "user", content: compiledPrompt }],
  });

  // @ts-ignore
  const generatedContent = msg.content[0].text;

  // Send email via Resend
  if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
  const now = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F8F9FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F9FA;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background-color:#202124;border-radius:16px 16px 0 0;padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <!-- Logo mark: clock arc -->
                  <span style="display:inline-block;width:36px;height:36px;background:#4285F4;border-radius:50%;vertical-align:middle;margin-right:10px;"></span>
                  <span style="color:#ffffff;font-size:18px;font-weight:600;vertical-align:middle;letter-spacing:-0.3px;">hoursback</span>
                </td>
                <td align="right">
                  <span style="background:#4285F4;color:#ffffff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">AUTOPILOT</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Blue accent bar -->
        <tr><td style="background:#4285F4;height:3px;"></td></tr>

        <!-- Title block -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 24px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#4285F4;letter-spacing:1px;text-transform:uppercase;">Agent Report</p>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#202124;line-height:1.2;">${playbookData?.title || playbookSlug}</h1>
            <p style="margin:0;font-size:13px;color:#6b7280;">Completed on ${now}</p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="background:#ffffff;padding:0 40px;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>

        <!-- Report content -->
        <tr>
          <td style="background:#ffffff;padding:28px 40px;">
            <div style="background:#F8F9FA;border-left:3px solid #4285F4;border-radius:0 8px 8px 0;padding:24px;font-size:14px;line-height:1.8;color:#202124;">${markdownToHtml(generatedContent)}</div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#ffffff;padding:8px 40px 36px;text-align:center;">
            <a href="https://www.hoursback.xyz/autopilot"
               style="display:inline-block;background:#202124;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:24px;text-decoration:none;letter-spacing:0.2px;">
              View Autopilot Dashboard
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8F9FA;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
              Sent automatically by <strong style="color:#202124;">Hoursback Autopilot</strong>
            </p>
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              <a href="https://www.hoursback.xyz/autopilot" style="color:#4285F4;text-decoration:none;">Manage agents</a>
              &nbsp;·&nbsp;
              <a href="https://www.hoursback.xyz" style="color:#4285F4;text-decoration:none;">hoursback.xyz</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Hoursback Autopilot <autopilot@hoursback.xyz>",
      to: [deliveryEmail],
      subject: `[Agent Report] ${playbookData?.title || playbookSlug}`,
      html: emailHtml,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    throw new Error(`Email delivery failed: ${errText}`);
  }

  // Log the successful run
  await supabaseAdmin.from("autonomous_runs").insert({
    schedule_id: schedule.id,
    user_id: schedule.user_id,
    playbook_slug: playbookSlug,
    generated_content: generatedContent,
    run_status: "success",
  });

  console.log(`[Autopilot] Done — report delivered to ${deliveryEmail}`);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));

    // ── MODE 1: Manual single-schedule execution (triggered from UI) ──
    if (body.schedule_id) {
      const { data: schedule, error: scheduleError } = await supabaseAdmin
        .from("scheduled_playbooks")
        .select("*")
        .eq("id", body.schedule_id)
        .single();

      if (scheduleError || !schedule) {
        throw new Error(`Schedule not found: ${scheduleError?.message}`);
      }
      if (!schedule.is_active) {
        return new Response(
          JSON.stringify({ error: "Schedule is paused" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      await executeSchedule(schedule, supabaseAdmin);
      return new Response(
        JSON.stringify({ success: true, message: "Agent execution complete" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── MODE 2: Batch cron mode (triggered by pg_cron every minute) ──
    if (body.trigger === "cron") {
      const { data: schedules, error } = await supabaseAdmin
        .from("scheduled_playbooks")
        .select("*")
        .eq("is_active", true);

      if (error) throw new Error(`Failed to fetch schedules: ${error.message}`);
      if (!schedules || schedules.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No active schedules" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const due = schedules.filter((s) => cronMatchesNow(s.cron_expression));
      console.log(`[Autopilot Cron] ${due.length}/${schedules.length} schedules due to run`);

      // Run all due schedules in parallel, capture individual errors
      const results = await Promise.allSettled(
        due.map((s) => executeSchedule(s, supabaseAdmin))
      );

      // Log any failures
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === "rejected") {
          const err = (results[i] as PromiseRejectedResult).reason;
          console.error(`[Autopilot] Schedule ${due[i].id} failed:`, err?.message);
          await supabaseAdmin.from("autonomous_runs").insert({
            schedule_id: due[i].id,
            user_id: due[i].user_id,
            playbook_slug: due[i].playbook_slug,
            generated_content: null,
            run_status: "failed",
            error_message: err?.message || "Unknown error",
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, ran: due.length, total: schedules.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Provide schedule_id or trigger: cron" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error: any) {
    console.error("[Autopilot] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
