import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Find all users who have a connected telegram bot
  const { data: bots } = await supabase
    .from("telegram_bots")
    .select("user_id, bot_username");

  if (!bots?.length) return new Response("No bots", { status: 200 });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();

  let sent = 0;
  const errors: string[] = [];

  for (const bot of bots) {
    try {
      // Get all runs for this user in the past 7 days
      const { data: runs } = await supabase
        .from("telegram_runs")
        .select("workflow_name, triggered_by, role, status, created_at")
        .eq("user_id", bot.user_id)
        .gte("created_at", weekAgoStr)
        .order("created_at", { ascending: false });

      if (!runs?.length) continue; // Skip users with no activity

      // Get owner email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, business_profile")
        .eq("id", bot.user_id)
        .single();

      if (!profile?.email || !RESEND_API_KEY) continue;

      const bp = profile.business_profile as any;
      const businessName = bp?.businessName || "Your business";

      // Compute stats
      const totalRuns = runs.length;
      const successRuns = runs.filter(r => r.status === "success").length;
      const successRate = Math.round((successRuns / totalRuns) * 100);
      const escalations = runs.filter(r => r.workflow_name.toLowerCase().includes("escalat")).length;

      // Runs by workflow
      const byWorkflow: Record<string, number> = {};
      for (const r of runs) {
        byWorkflow[r.workflow_name] = (byWorkflow[r.workflow_name] || 0) + 1;
      }

      // Active staff (unique names)
      const activeStaff = [...new Set(runs.map(r => r.triggered_by).filter(Boolean))];

      // Staff run counts
      const byStaff: Record<string, { total: number; success: number }> = {};
      for (const r of runs) {
        const name = r.triggered_by || "Unknown";
        if (!byStaff[name]) byStaff[name] = { total: 0, success: 0 };
        byStaff[name].total++;
        if (r.status === "success") byStaff[name].success++;
      }

      const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
      const weekStart = weekAgo.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const weekEnd = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

      // Build workflow rows
      const workflowRows = Object.entries(byWorkflow)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) =>
          `<tr>
            <td style="padding:10px 16px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">${name}</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#0F1012;text-align:right;border-bottom:1px solid #f3f4f6;">${count} run${count !== 1 ? "s" : ""}</td>
          </tr>`
        ).join("");

      // Build staff rows
      const staffRows = Object.entries(byStaff)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, stats]) => {
          const rate = Math.round((stats.success / stats.total) * 100);
          const color = rate >= 80 ? "#16a34a" : rate >= 50 ? "#d97706" : "#dc2626";
          return `<tr>
            <td style="padding:10px 16px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">${name}</td>
            <td style="padding:10px 16px;font-size:13px;color:#374151;text-align:right;border-bottom:1px solid #f3f4f6;">${stats.total} runs</td>
            <td style="padding:10px 16px;font-size:13px;font-weight:600;color:${color};text-align:right;border-bottom:1px solid #f3f4f6;">${rate}%</td>
          </tr>`;
        }).join("");

      const rateColor = successRate >= 80 ? "#16a34a" : successRate >= 50 ? "#d97706" : "#dc2626";

      const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:32px 16px 48px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0F1012;border-radius:20px 20px 0 0;padding:24px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="width:32px;height:32px;background:linear-gradient(135deg,#4285F4,#6366f1);border-radius:8px;"></div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.4px;">hoursback</span>
                  </td>
                </tr></table>
              </td>
              <td align="right" style="vertical-align:middle;">
                <span style="background:rgba(66,133,244,0.2);color:#93bbfc;font-size:10px;font-weight:700;padding:5px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;border:1px solid rgba(66,133,244,0.3);">
                  WEEKLY DIGEST
                </span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Gradient accent -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#4285F4,#6366f1,#DA7756);"></td></tr>

        <!-- Title block -->
        <tr>
          <td style="background:#ffffff;padding:28px 36px 20px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#4285F4;letter-spacing:1.5px;text-transform:uppercase;">Telegram Bot · ${weekStart} – ${weekEnd}</p>
            <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#0F1012;line-height:1.25;letter-spacing:-0.4px;">${businessName} — Team Activity</h1>
            <p style="margin:0;font-size:13px;color:#6b7280;">Here's how your team used the Telegram bot this week.</p>
          </td>
        </tr>

        <!-- Stats row -->
        <tr>
          <td style="background:#ffffff;padding:4px 36px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="text-align:center;padding:16px 8px;background:#F9FAFB;border-radius:12px;margin:4px;">
                  <p style="margin:0;font-size:28px;font-weight:800;color:#0F1012;">${totalRuns}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Total runs</p>
                </td>
                <td width="4px"></td>
                <td width="33%" style="text-align:center;padding:16px 8px;background:#F9FAFB;border-radius:12px;">
                  <p style="margin:0;font-size:28px;font-weight:800;color:${rateColor};">${successRate}%</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Success rate</p>
                </td>
                <td width="4px"></td>
                <td width="33%" style="text-align:center;padding:16px 8px;background:#F9FAFB;border-radius:12px;">
                  <p style="margin:0;font-size:28px;font-weight:800;color:#0F1012;">${activeStaff.length}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Active staff</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${escalations > 0 ? `<!-- Escalation alert -->
        <tr>
          <td style="background:#ffffff;padding:0 36px 20px;">
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 18px;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#dc2626;">🚨 ${escalations} escalation${escalations !== 1 ? "s" : ""} this week</p>
              <p style="margin:4px 0 0;font-size:12px;color:#ef4444;">Review in your dashboard to make sure these were resolved.</p>
            </div>
          </td>
        </tr>` : ""}

        <!-- Divider -->
        <tr><td style="background:#ffffff;padding:0 36px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>

        <!-- Workflows table -->
        <tr>
          <td style="background:#ffffff;padding:24px 36px 8px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0F1012;">Workflows run</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:10px;overflow:hidden;">
              <thead>
                <tr style="background:#F9FAFB;">
                  <th style="padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.5px;">Workflow</th>
                  <th style="padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Count</th>
                </tr>
              </thead>
              <tbody>${workflowRows}</tbody>
            </table>
          </td>
        </tr>

        <!-- Staff table -->
        <tr>
          <td style="background:#ffffff;padding:20px 36px 32px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0F1012;">Staff activity</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:10px;overflow:hidden;">
              <thead>
                <tr style="background:#F9FAFB;">
                  <th style="padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.5px;">Staff member</th>
                  <th style="padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Runs</th>
                  <th style="padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-align:right;text-transform:uppercase;letter-spacing:0.5px;">Success</th>
                </tr>
              </thead>
              <tbody>${staffRows}</tbody>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#ffffff;padding:4px 36px 32px;text-align:center;">
            <a href="https://www.hoursback.xyz/telegram"
               style="display:inline-block;background:#0F1012;color:#ffffff;font-size:13px;font-weight:700;padding:13px 28px;border-radius:999px;text-decoration:none;letter-spacing:0.2px;">
              View Full Activity Log →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F0F2F5;border-top:1px solid #e5e7eb;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;">
              Sent by <strong style="color:#374151;">Hoursback</strong> · Weekly team digest · ${now}
            </p>
            <p style="margin:0;font-size:11px;">
              <a href="https://www.hoursback.xyz/settings" style="color:#4285F4;text-decoration:none;">Bot settings</a>
              &nbsp;·&nbsp;
              <a href="https://www.hoursback.xyz" style="color:#4285F4;text-decoration:none;">hoursback.xyz</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Hoursback <noreply@hoursback.xyz>",
          to: profile.email,
          subject: `${businessName} — your team's weekly bot activity`,
          html: emailHtml,
        }),
      });

      sent++;
    } catch (err: any) {
      errors.push(`user ${bot.user_id}: ${err.message}`);
    }
  }

  return new Response(JSON.stringify({ sent, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});
