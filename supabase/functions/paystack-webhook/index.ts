import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { createHmac } from "node:crypto"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    if (!signature) {
      return new Response('Missing signature', { status: 401 })
    }

    const secret = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!secret) {
      console.error('Missing PAYSTACK_SECRET_KEY')
      return new Response('Configuration error', { status: 500 })
    }

    // Verify Paystack Signature
    const hash = createHmac('sha512', secret).update(rawBody).digest('hex')
    if (hash !== signature) {
      console.error('Invalid signature')
      return new Response('Invalid signature', { status: 401 })
    }

    const event = JSON.parse(rawBody)

    // Only process successful payments
    if (event.event === 'charge.success') {
      const data = event.data
      const userId = data.metadata?.custom_fields?.find(
        (f: any) => f.variable_name === 'user_id'
      )?.value

      if (!userId) {
        console.error('Webhook payload missing user_id in metadata')
        return new Response('Missing user_id', { status: 400 })
      }

      // Initialize Supabase with SERVICE ROLE to bypass RLS and update DB
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Upgrade User to Pro
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'pro' })
        .eq('id', userId)

      if (error) {
        console.error('Failed to upgrade user:', error)
        throw new Error('Database update failed')
      }

      console.log(`Successfully upgraded user ${userId} to Pro plan via webhook.`)
    }

    return new Response('Webhook received', { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})
