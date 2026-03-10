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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:32px 16px 48px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0F1012;border-radius:12px 12px 0 0;padding:24px 32px;">
            <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Hoursback</span>
            <span style="font-size:13px;color:#9CA3AF;margin-left:10px;">Pro Confirmation</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px 32px 28px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0F1012;">You're now Pro!</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6B7280;">Here's your payment confirmation and invoice.</p>

            <!-- Invoice box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Invoice</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:14px;color:#6B7280;padding:6px 0;">Date</td>
                      <td align="right" style="font-size:14px;color:#0F1012;font-weight:600;">${now}</td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;color:#6B7280;padding:6px 0;">Reference</td>
                      <td align="right" style="font-size:14px;color:#0F1012;font-weight:600;">${txRef}</td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;color:#6B7280;padding:6px 0;">Plan</td>
                      <td align="right" style="font-size:14px;color:#0F1012;font-weight:600;">Hoursback Pro (Monthly)</td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;color:#6B7280;padding:6px 0;">Amount paid</td>
                      <td align="right" style="font-size:14px;color:#0F1012;font-weight:600;">${amount} ${currency}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top:14px;border-top:1px solid #E5E7EB;"></td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;color:#6B7280;padding:6px 0;">Pro access until</td>
                      <td align="right" style="font-size:14px;color:#16A34A;font-weight:700;">${expiryStr}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:14px;color:#6B7280;">
              You now have full access to all Pro playbooks, the Autopilot Agent, and Watchers.
              We'll remind you 3 days before your subscription renews.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#ffffff;padding:0 32px 32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
            <a href="https://www.hoursback.xyz/playbooks" style="display:inline-block;background:#0F1012;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">
              Explore Pro Playbooks →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;padding:20px 32px;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;">
              Hoursback · Questions? Reply to this email.<br>
              You're receiving this because you upgraded to Pro.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
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
    const signature = req.headers.get('verif-hash')
    const secretHash = Deno.env.get('FLUTTERWAVE_WEBHOOK_HASH')

    // If a webhook hash is configured in Supabase secrets, verify it
    if (secretHash && signature !== secretHash) {
      console.error('Invalid signature')
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
