import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = "https://app.hoursback.xyz";
const FROM = "Caleb at Hoursback <caleb@hoursback.xyz>";

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

function baseTemplate(preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hoursback</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;‌&zwnj;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:24px;" align="center">
          <img src="https://app.hoursback.xyz/logo.png" alt="Hoursback" height="32" style="display:block;" />
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You're receiving this because you signed up for Hoursback.<br/>
            <a href="${APP_URL}/account" style="color:#9ca3af;">Manage email preferences</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:100px;margin-top:8px;">${text} →</a>`;
}

function welcomeEmail(email: string): string {
  const body = `
    <!-- Dark header -->
    <div style="background:#0f172a;padding:40px 40px 32px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#4285F4;text-transform:uppercase;letter-spacing:1px;">Welcome to Hoursback</p>
      <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;">Your account is ready.<br/>Let's get your first workflow live.</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
        Hi there — Hoursback lets you deploy AI agents that monitor your business and email you what matters, automatically. No code. No dashboards. Just results in your inbox.
      </p>

      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Popular starting workflows</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${["Weekly CEO Briefing", "Cash Flow Weekly", "Competitor Intelligence", "Industry News Digest"].map((name, i) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <span style="display:inline-block;width:22px;height:22px;border-radius:6px;background:#f1f5f9;font-size:11px;font-weight:700;color:#64748b;text-align:center;line-height:22px;margin-right:10px;">${i + 1}</span>
            <span style="font-size:14px;color:#111827;font-weight:500;">${name}</span>
          </td>
        </tr>`).join("")}
      </table>

      <div style="text-align:center;padding:8px 0 16px;">
        ${ctaButton("Deploy your first workflow", `${APP_URL}/workflows/new`)}
      </div>

      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">Takes under 5 minutes. Free forever plan available.</p>
    </div>
  `;
  return baseTemplate("Your account is ready — deploy your first AI workflow in under 5 minutes.", body);
}

function day2Email(): string {
  const workflows = [
    { name: "Supplier Price Tracker", desc: "Monitors your suppliers for unannounced price hikes and alerts you the same day.", cat: "Operations", color: "#f59e0b" },
    { name: "Sales Pipeline Health", desc: "Flags stalled deals and probability changes so nothing slips through the cracks.", cat: "Sales", color: "#10b981" },
    { name: "AR Aging Monitor", desc: "Notifies you when key clients go 30+ days overdue — before it becomes a problem.", cat: "Finance", color: "#ef4444" },
  ];

  const cards = workflows.map(w => `
    <tr>
      <td style="padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:12px;display:block;">
        <span style="font-size:11px;font-weight:600;color:${w.color};text-transform:uppercase;letter-spacing:0.5px;">${w.cat}</span>
        <p style="margin:4px 0 4px;font-size:15px;font-weight:600;color:#111827;">${w.name}</p>
        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${w.desc}</p>
      </td>
    </tr>
    <tr><td style="height:10px;"></td></tr>
  `).join("");

  const body = `
    <div style="background:#0f172a;padding:40px 40px 32px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#4285F4;text-transform:uppercase;letter-spacing:1px;">Day 2</p>
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">What other businesses are monitoring with Hoursback</h1>
    </div>

    <div style="padding:32px 40px;">
      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
        Here are three workflows that business owners deploy in their first week. Each one runs on your schedule and emails you a clear summary — automatically.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${cards}
      </table>

      <div style="text-align:center;padding:8px 0 16px;">
        ${ctaButton("Browse all 15+ workflows", `${APP_URL}/workflows/new`)}
      </div>
    </div>
  `;
  return baseTemplate("What other businesses are monitoring with Hoursback — 3 examples worth trying.", body);
}

function day5Email(): string {
  const commands = [
    { cmd: "/reconcile", emoji: "💰", desc: "Daily cash log + variance check" },
    { cmd: "/handover", emoji: "📋", desc: "End-of-shift log in seconds" },
    { cmd: "/escalate", emoji: "🚨", desc: "Route urgent issues instantly" },
    { cmd: "/audit", emoji: "🔍", desc: "Guided inventory count" },
  ];

  const cmdRows = commands.map(c => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
        <span style="font-size:16px;margin-right:8px;">${c.emoji}</span>
        <code style="font-size:13px;font-weight:700;color:#0284c7;background:#f0f9ff;padding:2px 8px;border-radius:6px;">${c.cmd}</code>
        <span style="font-size:13px;color:#6b7280;margin-left:10px;">${c.desc}</span>
      </td>
    </tr>
  `).join("");

  const body = `
    <div style="background:#0c4a6e;padding:40px 40px 32px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;">New feature</p>
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">Your team can run workflows on Telegram — 24/7</h1>
    </div>

    <div style="padding:32px 40px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
        Connect a private Telegram bot to Hoursback and your staff can trigger workflows from their phone — cash reconciliations, shift handovers, escalations. You get every result by email.
      </p>

      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Commands your team gets</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${cmdRows}
      </table>

      <div style="background:#f0f9ff;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
        <p style="margin:0;font-size:13px;color:#0369a1;line-height:1.5;">
          <strong>Takes 3 minutes to set up.</strong> Create a bot on Telegram's BotFather, paste the token into Hoursback, and your team is live.
        </p>
      </div>

      <div style="text-align:center;padding:8px 0 16px;">
        ${ctaButton("Set up your Telegram bot", `${APP_URL}/settings`)}
      </div>
    </div>
  `;
  return baseTemplate("Your team can run AI workflows on Telegram — set up in 3 minutes.", body);
}

function day10Email(): string {
  const body = `
    <div style="background:#0f172a;padding:40px 40px 32px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#f59e0b;text-transform:uppercase;letter-spacing:1px;">Still with us?</p>
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">You haven't deployed your first workflow yet — let's fix that</h1>
    </div>

    <div style="padding:32px 40px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
        It's been 10 days since you signed up. Most people who deploy their first workflow do it in under 5 minutes — but we know it can feel like a bigger commitment than it is.
      </p>

      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;">Here's all it takes:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${[
          ["Pick a workflow template", "Finance, Sales, Operations, Marketing — 15+ options"],
          ["Add a data source", "A Google Sheet URL or website — takes 30 seconds"],
          ["Set your email + schedule", "Weekly, daily, or monthly — your choice"],
        ].map(([step, sub]) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="width:8px;height:8px;border-radius:50%;background:#4285F4;display:inline-block;margin-right:6px;flex-shrink:0;"></span>
              <div>
                <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827;">${step}</p>
                <p style="margin:0;font-size:13px;color:#6b7280;">${sub}</p>
              </div>
            </div>
          </td>
        </tr>`).join("")}
      </table>

      <div style="text-align:center;padding:8px 0 16px;">
        ${ctaButton("Deploy in 5 minutes", `${APP_URL}/workflows/new`)}
      </div>

      <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
        If something's blocking you, reply to this email — I read every one.
      </p>
    </div>
  `;
  return baseTemplate("You haven't deployed your first workflow yet — it takes 5 minutes.", body);
}

// ---------------------------------------------------------------------------
// Send via Resend
// ---------------------------------------------------------------------------
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    console.error(`Resend error for ${to}:`, await res.text());
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Load all users with their signup time and email
  const { data: users, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr || !users) {
    console.error("Failed to list users:", usersErr);
    return new Response("Error", { status: 500 });
  }

  // Load already-sent emails
  const { data: sentEmails } = await supabase
    .from("onboarding_emails")
    .select("user_id, email_key");

  const sentSet = new Set(
    (sentEmails ?? []).map((r: { user_id: string; email_key: string }) => `${r.user_id}:${r.email_key}`)
  );

  // Load workflow counts per user
  const { data: workflowRows } = await supabase
    .from("workflows")
    .select("user_id");
  const workflowCounts: Record<string, number> = {};
  for (const row of workflowRows ?? []) {
    workflowCounts[row.user_id] = (workflowCounts[row.user_id] ?? 0) + 1;
  }

  // Load Telegram-connected users
  const { data: telegramRows } = await supabase
    .from("telegram_bots")
    .select("user_id");
  const telegramConnected = new Set((telegramRows ?? []).map((r: { user_id: string }) => r.user_id));

  let sent = 0;

  for (const user of users.users) {
    const email = user.email;
    if (!email) continue;

    const createdAt = new Date(user.created_at);
    const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const hasWorkflow = (workflowCounts[user.id] ?? 0) > 0;
    const hasTelegram = telegramConnected.has(user.id);

    const alreadySent = (key: string) => sentSet.has(`${user.id}:${key}`);

    const record = async (key: string) => {
      await supabase.from("onboarding_emails").insert({ user_id: user.id, email_key: key });
      sentSet.add(`${user.id}:${key}`);
    };

    // Email 1 — Welcome (within first 2 hours)
    if (hoursSince <= 2 && !alreadySent("welcome")) {
      const ok = await sendEmail(email, "Your Hoursback account is ready", welcomeEmail(email));
      if (ok) { await record("welcome"); sent++; }
      continue;
    }

    // Email 2 — Day 2 workflow examples (48–72 hours, no workflow yet)
    if (hoursSince >= 48 && !hasWorkflow && !alreadySent("day2_workflows")) {
      const ok = await sendEmail(email, "What other businesses are monitoring with Hoursback", day2Email());
      if (ok) { await record("day2_workflows"); sent++; }
      continue;
    }

    // Email 3 — Day 5 Telegram pitch (120–168 hours, no Telegram connected)
    if (hoursSince >= 120 && !hasTelegram && !alreadySent("day5_telegram")) {
      const ok = await sendEmail(email, "Your team can run workflows on Telegram too", day5Email());
      if (ok) { await record("day5_telegram"); sent++; }
      continue;
    }

    // Email 4 — Day 10 re-engagement (240+ hours, still no workflow)
    if (hoursSince >= 240 && !hasWorkflow && !alreadySent("day10_reengage")) {
      const ok = await sendEmail(email, "You haven't deployed your first workflow yet", day10Email());
      if (ok) { await record("day10_reengage"); sent++; }
      continue;
    }
  }

  console.log(`Onboarding emails: processed ${users.users.length} users, sent ${sent} emails`);
  return new Response(JSON.stringify({ processed: users.users.length, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
