import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, verif-hash',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

async function sendConfirmationEmail(email: string, amount: string, currency: string, txRef: string, expiresAt: Date) {
  if (!RESEND_API_KEY) return

  const expiryStr = expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're now Pro — Hoursback</title>
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
                    <span style="background:rgba(66,133,244,0.2);color:#93c5fd;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">PRO CONFIRMED</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Blue accent bar -->
          <tr><td style="background:#4285F4;height:3px;"></td></tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 36px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">You're now Pro!</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                Here's your payment confirmation and invoice. Full access to all Pro playbooks, Autopilot Agents, and Watchers is now active.
              </p>

              <!-- Invoice box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#4285F4;letter-spacing:1px;text-transform:uppercase;">Invoice</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:14px;color:#6b7280;padding:5px 0;">Date</td>
                        <td align="right" style="font-size:14px;color:#111827;font-weight:600;">${now}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#6b7280;padding:5px 0;">Reference</td>
                        <td align="right" style="font-size:14px;color:#111827;font-weight:600;">${txRef}</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#6b7280;padding:5px 0;">Plan</td>
                        <td align="right" style="font-size:14px;color:#111827;font-weight:600;">Hoursback Pro (Monthly)</td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#6b7280;padding:5px 0;">Amount paid</td>
                        <td align="right" style="font-size:14px;color:#111827;font-weight:600;">${amount} ${currency}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:12px;border-top:1px solid #e5e7eb;"></td>
                      </tr>
                      <tr>
                        <td style="font-size:14px;color:#6b7280;padding:5px 0;">Pro access until</td>
                        <td align="right" style="font-size:14px;color:#16a34a;font-weight:700;">${expiryStr}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:24px;background:#202124;">
                    <a href="https://www.hoursback.xyz/playbooks"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;border-radius:24px;">
                      Explore Pro Playbooks →
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

          <!-- What's included -->
          <tr>
            <td style="background:#ffffff;padding:24px 36px 36px;">
              <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#4285F4;letter-spacing:1px;text-transform:uppercase;">What's now unlocked</p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:6px 0;">
                    <span style="display:inline-block;width:28px;height:28px;background:#eff6ff;border-radius:8px;text-align:center;line-height:28px;font-size:14px;vertical-align:middle;margin-right:12px;">📋</span>
                    <span style="font-size:14px;color:#374151;vertical-align:middle;">All Pro playbooks across growth, finance, sales &amp; more</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="display:inline-block;width:28px;height:28px;background:#eff6ff;border-radius:8px;text-align:center;line-height:28px;font-size:14px;vertical-align:middle;margin-right:12px;">🤖</span>
                    <span style="font-size:14px;color:#374151;vertical-align:middle;">Autopilot Agents — run playbooks on a schedule, results to your inbox</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="display:inline-block;width:28px;height:28px;background:#eff6ff;border-radius:8px;text-align:center;line-height:28px;font-size:14px;vertical-align:middle;margin-right:12px;">👁</span>
                    <span style="font-size:14px;color:#374151;vertical-align:middle;">Watchers — monitor competitors, jobs, and trends automatically</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
                We'll remind you 3 days before your subscription expires.
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
</html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Hoursback <hello@hoursback.xyz>',
      to: [email],
      subject: 'Your Hoursback Pro confirmation',
      html,
    }),
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = (req.headers.get('verif-hash') || req.headers.get('verif_hash'))?.trim()
    const secretHash = Deno.env.get('FLUTTERWAVE_WEBHOOK_HASH')?.trim()

    // If a webhook hash is configured in Supabase secrets, verify it
    if (!signature) {
      console.error('CRITICAL: Missing verif-hash header from Flutterwave.')
      const skipVerify = Deno.env.get('SKIP_WEBHOOK_VERIFICATION') === 'true'
      if (!skipVerify) {
        return new Response('Missing verif-hash header', { status: 401 })
      }
      console.warn('WARNING: Proceeding without signature verification (SKIP_WEBHOOK_VERIFICATION=true)')
    } else if (secretHash && signature !== secretHash) {
      console.error('Invalid signature mismatch.')
      return new Response('Invalid signature', { status: 401 })
    }

    const payload = await req.json()

    // Only process successful payments from Flutterwave
    if (payload.event === 'charge.completed' && payload.data?.status === 'successful') {
      const data = payload.data
      const userId = data.meta?.user_id
      const customerEmail = data.customer?.email
      const amount = data.amount?.toString() ?? '0'
      const currency = data.currency ?? ''
      const txRef = data.tx_ref ?? data.flw_ref ?? 'N/A'

      if (!userId || userId === 'guest') {
        console.warn('Webhook payload missing explicit user_id in meta. Cannot upgrade user.')
        return new Response('Ignored: Missing Valid user_id', { status: 200 })
      }

      // Initialize Supabase with SERVICE ROLE to bypass RLS and update DB directly
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Upgrade user to Pro and set expiry 30 days from now
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'pro',
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('Failed to upgrade user:', error)
        throw new Error('Database update failed')
      }

      console.log(`Successfully upgraded user ${userId} to Pro plan via Flutterwave webhook. Expires: ${expiresAt.toISOString()}`)

      // Send confirmation email if we have the customer email
      const emailToUse = customerEmail ?? data.customer?.email
      if (emailToUse) {
        await sendConfirmationEmail(emailToUse, amount, currency, txRef, expiresAt)
        console.log(`Confirmation email sent to ${emailToUse}`)
      }
    }

    return new Response('Webhook received', { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})
