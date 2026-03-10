import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------
async function sendReminderEmail(email: string, expiresAt: Date) {
  if (!RESEND_API_KEY) return;

  const expiryStr = expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:32px 16px 48px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:#0F1012;border-radius:12px 12px 0 0;padding:24px 32px;">
            <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Hoursback</span>
            <span style="font-size:13px;color:#9CA3AF;margin-left:10px;">Pro Renewal Reminder</span>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:36px 32px 28px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0F1012;">Your Pro access expires in 3 days</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6B7280;">
              Your Hoursback Pro subscription expires on <strong>${expiryStr}</strong>.
              Renew now to keep your Autopilot Agents running without interruption.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF9C3;border:1px solid #FDE047;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:14px;color:#854D0E;font-weight:600;">
                    What happens when Pro expires?
                  </p>
                  <ul style="margin:8px 0 0;padding-left:18px;font-size:14px;color:#854D0E;">
                    <li>Autopilot Agents will be paused</li>
                    <li>Pro playbooks will be locked</li>
                    <li>Watchers will stop running</li>
                  </ul>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:0 32px 32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
            <a href="https://www.hoursback.xyz/playbooks" style="display:inline-block;background:#0F1012;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">
              Renew Pro →
            </a>
          </td>
        </tr>

        <tr>
          <td style="background:#F9FAFB;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;padding:20px 32px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">
              Hoursback · Questions? Reply to this email.
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
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Hoursback <hello@hoursback.xyz>",
      to: [email],
      subject: "Your Hoursback Pro expires in 3 days",
      html,
    }),
  });
}

async function sendExpiredEmail(email: string) {
  if (!RESEND_API_KEY) return;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:32px 16px 48px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:#0F1012;border-radius:12px 12px 0 0;padding:24px 32px;">
            <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Hoursback</span>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:36px 32px 28px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0F1012;">Your Pro subscription has expired</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6B7280;">
              Your Hoursback Pro access has ended. Your Autopilot Agents, Pro playbooks, and Watchers are now paused.
              Renew to pick up exactly where you left off — your agent schedules are saved.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:0 32px 32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
            <a href="https://www.hoursback.xyz/playbooks" style="display:inline-block;background:#0F1012;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">
              Renew Pro →
            </a>
          </td>
        </tr>

        <tr>
          <td style="background:#F9FAFB;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;padding:20px 32px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">Hoursback · Questions? Reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Hoursback <hello@hoursback.xyz>",
      to: [email],
      subject: "Your Hoursback Pro has expired",
      html,
    }),
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing Supabase env vars", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // ── 1. Send reminder to users expiring within the next 3 days ──
  // Window: expires between now+2d and now+3d (narrow window so they only get one reminder)
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const { data: expiringSoon, error: reminderErr } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("subscription_status", "pro")
    .gte("subscription_expires_at", in2Days.toISOString())
    .lte("subscription_expires_at", in3Days.toISOString());

  if (reminderErr) {
    console.error("Error fetching expiring-soon users:", reminderErr);
  } else {
    console.log(`[RenewalCron] ${expiringSoon?.length ?? 0} users expiring in ~3 days`);
    for (const user of expiringSoon ?? []) {
      if (user.email) {
        const expiresAt = new Date(
          (await supabase.from("profiles").select("subscription_expires_at").eq("id", user.id).single())
            .data?.subscription_expires_at
        );
        await sendReminderEmail(user.email, expiresAt);
        console.log(`[RenewalCron] Reminder sent to ${user.email}`);
      }
    }
  }

  // ── 2. Downgrade users whose subscription has expired ──
  const { data: expired, error: expireErr } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("subscription_status", "pro")
    .lt("subscription_expires_at", now.toISOString());

  if (expireErr) {
    console.error("Error fetching expired users:", expireErr);
  } else {
    console.log(`[RenewalCron] ${expired?.length ?? 0} users to downgrade`);
    for (const user of expired ?? []) {
      const { error: downgradeErr } = await supabase
        .from("profiles")
        .update({ subscription_status: "free" })
        .eq("id", user.id);

      if (downgradeErr) {
        console.error(`[RenewalCron] Failed to downgrade ${user.id}:`, downgradeErr);
        continue;
      }

      console.log(`[RenewalCron] Downgraded user ${user.id} to free`);

      if (user.email) {
        await sendExpiredEmail(user.email);
        console.log(`[RenewalCron] Expiry email sent to ${user.email}`);
      }
    }
  }

  return new Response(
    JSON.stringify({
      reminders: expiringSoon?.length ?? 0,
      downgraded: expired?.length ?? 0,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
