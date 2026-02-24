import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Initialize Supabase Client with User's Auth Context to enforce RLS
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 2. Get User and verify quota
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized or invalid user token')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('copilot_runs')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Could not fetch user profile')
    }

    if (profile.copilot_runs <= 0) {
      return new Response(JSON.stringify({ error: 'You have exhausted your Copilot runs. Please upgrade to Pro.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Setup OpenAI API Key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI Copilot for a business application called Hoursback. Perform the requested task efficiently and return clear, actionable results formatted in Markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      return new Response(JSON.stringify({ error: 'Failed to generate response from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    const resultText = data.choices[0].message.content

    // 5. Decrement the user's copilot_runs securely
    // In a production app, use an RPC call here to prevent race conditions.
    // Assuming RLS allows the user to update their own profile:
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ copilot_runs: profile.copilot_runs - 1 })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to deduct run credit:', updateError)
      // We still return the text to the user since it succeeded, but log the failure
    }

    return new Response(
      JSON.stringify({ result: resultText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
