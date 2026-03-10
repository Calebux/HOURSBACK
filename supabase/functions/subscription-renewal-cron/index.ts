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
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Pro expires in 3 days — Hoursback</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#202124;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;width:32px;height:32px;background:#4285F4;border-radius:50%;vertical-align:middle;margin-right:10px;"></span>
                    <span style="color:#ffffff;font-size:17px;font-weight:600;vertical-align:middle;letter-spacing:-0.3px;">hoursback</span>
                  </td>
                  <td align="right">
                    <span style="background:rgba(251,191,36,0.2);color:#fbbf24;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">RENEWAL REMINDER</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Amber accent bar -->
          <tr><td style="background:#f59e0b;height:3px;"></td></tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 36px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">Your Pro access expires in 3 days</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Your Hoursback Pro subscription expires on <strong style="color:#111827;">${expiryStr}</strong>. Renew now to keep your Autopilot Agents running without interruption.
              </p>

              <!-- Warning box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#92400e;">What happens when Pro expires</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:4px 0;">
                          <span style="display:inline-block;width:28px;height:28px;background:#fef3c7;border-radius:8px;text-align:center;line-height:28px;font-size:13px;vertical-align:middle;margin-right:10px;">⏸</span>
                          <span style="font-size:14px;color:#78350f;vertical-align:middle;">Autopilot Agents will be paused</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;">
                          <span style="display:inline-block;width:28px;height:28px;background:#fef3c7;border-radius:8px;text-align:center;line-height:28px;font-size:13px;vertical-align:middle;margin-right:10px;">🔒</span>
                          <span style="font-size:14px;color:#78350f;vertical-align:middle;">Pro playbooks will be locked</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;">
                          <span style="display:inline-block;width:28px;height:28px;background:#fef3c7;border-radius:8px;text-align:center;line-height:28px;font-size:13px;vertical-align:middle;margin-right:10px;">👁</span>
                          <span style="font-size:14px;color:#78350f;vertical-align:middle;">Watchers will stop running</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:24px;background:#202124;">
                    <a href="https://www.hoursback.xyz/playbooks"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;border-radius:24px;">
                      Renew Pro →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
                Your agent schedules are saved — renewing picks up exactly where you left off.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">
                <a href="https://www.hoursback.xyz" style="color:#4285F4;text-decoration:none;">hoursback.xyz</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
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
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Pro has expired — Hoursback</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#202124;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;width:32px;height:32px;background:#4285F4;border-radius:50%;vertical-align:middle;margin-right:10px;"></span>
                    <span style="color:#ffffff;font-size:17px;font-weight:600;vertical-align:middle;letter-spacing:-0.3px;">hoursback</span>
                  </td>
                  <td align="right">
                    <span style="background:rgba(239,68,68,0.2);color:#fca5a5;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">PRO EXPIRED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Red accent bar -->
          <tr><td style="background:#ef4444;height:3px;"></td></tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 36px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">Your Pro subscription has expired</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Your Hoursback Pro access has ended. Your Autopilot Agents, Pro playbooks, and Watchers are now paused. Renew to pick up exactly where you left off — your agent schedules are saved.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:24px;background:#202124;">
                    <a href="https://www.hoursback.xyz/playbooks"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;border-radius:24px;">
                      Renew Pro →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background:#ffffff;padding:0 36px;">
              <div style="border-top:1px solid #f3f4f6;"></div>
            </td>
          </tr>

          <!-- Reassurance -->
          <tr>
            <td style="background:#ffffff;padding:24px 36px 36px;">
              <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#4285F4;letter-spacing:1px;text-transform:uppercase;">What's waiting when you renew</p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:6px 0;">
                    <span style="display:inline-block;width:28px;height:28px;background:#eff6ff;border-radius:8px;text-align:center;line-height:28px;font-size:14px;vertical-align:middle;margin-right:12px;">🤖</span>
                    <span style="font-size:14px;color:#374151;vertical-align:middle;">All your Autopilot Agent schedules, ready to resume</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="display:inline-block;width:28px;height:28px;background:#eff6ff;border-radius:8px;text-align:center;line-height:28px;font-size:14px;vertical-align:middle;margin-right:12px;">📋</span>
                    <span style="font-size:14px;color:#374151;vertical-align:middle;">Full access to all Pro playbooks</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="display:inline-block;width:28px;height:28px;background:#eff6ff;border-radius:8px;text-align:center;line-height:28px;font-size:14px;vertical-align:middle;margin-right:12px;">👁</span>
                    <span style="font-size:14px;color:#374151;vertical-align:middle;">Watchers back on, monitoring your signals</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
                Questions? Reply to this email — we're here to help.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">
                <a href="https://www.hoursback.xyz" style="color:#4285F4;text-decoration:none;">hoursback.xyz</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
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
