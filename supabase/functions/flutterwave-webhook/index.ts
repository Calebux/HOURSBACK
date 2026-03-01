import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, verif-hash',
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

      if (!userId || userId === 'guest') {
        console.warn('Webhook payload missing explicit user_id in meta. Cannot upgrade user.')
        return new Response('Ignored: Missing Valid user_id', { status: 200 })
      }

      // Initialize Supabase with SERVICE ROLE to bypass RLS and update DB directly
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Upgrade User to Pro
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'pro' })
        .eq('id', userId)

      if (error) {
        console.error('Failed to upgrade user:', error)
        throw new Error('Database update failed')
      }

      console.log(`Successfully upgraded user ${userId} to Pro plan via Flutterwave webhook.`)
    }

    return new Response('Webhook received', { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})
