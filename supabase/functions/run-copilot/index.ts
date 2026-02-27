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
    const { prompt, provider = 'openai' } = await req.json()

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Authenticate the user via their JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use anon key client to verify the user's JWT
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await anonClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + (userError?.message || 'invalid token') }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Use service role client (bypasses RLS) to manage profile & quota
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch or create profile
    let { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('copilot_runs')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      // Profile doesn't exist — create one with default 5 copilot_runs
      console.log('Creating missing profile for user:', user.id)
      const { data: newProfile, error: createError } = await serviceClient
        .from('profiles')
        .insert([{ id: user.id, email: user.email || '', is_admin: false, copilot_runs: 5 }])
        .select('copilot_runs')
        .single()

      if (createError || !newProfile) {
        console.error('Failed to create profile:', createError)
        return new Response(JSON.stringify({ error: 'Could not create user profile: ' + (createError?.message || 'unknown error') }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      profile = newProfile
    }

    if (profile.copilot_runs <= 0) {
      return new Response(JSON.stringify({ error: 'You have exhausted your Copilot runs. Please upgrade to Pro.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Route to the correct AI provider
    let resultText: string

    if (provider === 'anthropic') {
      // --- Claude API ---
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (!anthropicApiKey) {
        return new Response(JSON.stringify({ error: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in Supabase secrets.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: 'You are Claude, simulating a Claude Cowork plugin response for the Hoursback business application. Respond as if you are the actual Cowork plugin — produce realistic, structured, actionable output that matches what the plugin would generate. Format your response in clear Markdown with headers, bullet points, and tables where appropriate. Be specific and practical, not generic.',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Anthropic API error:', errorData)
        return new Response(JSON.stringify({ error: 'Claude API error: ' + errorData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const data = await response.json()
      console.log('Claude API response keys:', Object.keys(data))

      if (data?.content?.[0]?.text) {
        resultText = data.content[0].text
      } else {
        console.error('Unexpected Claude response:', JSON.stringify(data))
        return new Response(JSON.stringify({ error: 'Unexpected Claude response: ' + JSON.stringify(data).substring(0, 500) }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

    } else {
      // --- OpenAI API (default) ---
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiApiKey) {
        return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

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
        const errorData = await response.text()
        console.error('OpenAI API error:', errorData)
        return new Response(JSON.stringify({ error: 'OpenAI API error: ' + errorData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const data = await response.json()
      resultText = data.choices[0].message.content
    }

    // 4. Decrement the user's copilot_runs (using service role to bypass RLS)
    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ copilot_runs: profile.copilot_runs - 1 })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to deduct run credit:', updateError)
    }

    return new Response(
      JSON.stringify({ result: resultText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      },
    )
  } catch (error) {
    console.error('Function error:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: 'Server error: ' + errMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
