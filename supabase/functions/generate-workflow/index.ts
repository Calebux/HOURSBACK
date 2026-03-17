import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { sanitizeText, getClientIp, checkRateLimit, rateLimitResponse } from "../_shared/security.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are an expert at building Make.com automation scenarios.
Output ONLY a valid Make.com blueprint JSON inside a \`\`\`json code block — no explanation.

Make.com blueprint format:
{
  "name": "Scenario Name",
  "flow": [
    {
      "id": 1,
      "module": "MODULE_NAME",
      "version": 1,
      "parameters": {},
      "mapper": {},
      "metadata": { "designer": { "x": 0, "y": 0 } }
    }
  ],
  "metadata": { "instant": false, "version": 1 }
}

Common module names:
- google-sheets:watchRows (trigger: new row)
- google-sheets:addRow
- openai:createChatCompletion (for AI text generation)
- http:makeRequest (for Anthropic Claude API or any REST call)
- gmail:sendEmail
- gmail:watchEmails
- convertkit:createSubscriber
- buffer:createUpdate
- slack:createMessage
- mailchimp:addNewSubscriber
- airtable:watchRecords
- airtable:createRecord

For Claude/Anthropic API calls, use http:makeRequest with:
  url: https://api.anthropic.com/v1/messages
  method: POST
  headers: { x-api-key: "{{YOUR_ANTHROPIC_KEY}}", anthropic-version: "2023-06-01" }

Space modules 250px apart horizontally in designer coordinates.
Use realistic placeholder values for parameters. Mark credential fields with "{{REPLACE_WITH_YOUR_CREDENTIAL}}".`

function buildPrompt(agentAutomation: {
  trigger: string;
  actions: string[];
  tools: string[];
  setupSteps: Array<{ title: string; description: string }>;
}, playbookTitle: string): string {
  return `Build a Make.com blueprint for this automation:

Playbook: ${playbookTitle}
Trigger: ${agentAutomation.trigger}
Actions:
${agentAutomation.actions.map((a) => `- ${a}`).join('\n')}
Tools to use: ${agentAutomation.tools.join(', ')}

Setup context:
${agentAutomation.setupSteps.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')}

Generate a complete Make.com scenario blueprint JSON that implements this workflow end to end.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Authenticate — require a valid JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await anonClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limit: 20 blueprint generations per hour per user
    const rl = await checkRateLimit(serviceClient, `gen-workflow:${user.id}`, 20, 3600)
    if (!rl.allowed) return rateLimitResponse()

    // IP-level fallback (belt-and-suspenders)
    const clientIp = getClientIp(req)
    const ipRl = await checkRateLimit(serviceClient, `gen-workflow-ip:${clientIp}`, 30, 3600)
    if (!ipRl.allowed) return rateLimitResponse()

    const body = await req.json()
    const { agentAutomation, playbookTitle } = body

    // Validate structure
    if (!agentAutomation || typeof agentAutomation !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid agentAutomation payload.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Sanitize all user-controlled fields
    const safe = {
      trigger: sanitizeText(agentAutomation.trigger, 500),
      actions: Array.isArray(agentAutomation.actions)
        ? agentAutomation.actions.slice(0, 20).map((a: unknown) => sanitizeText(a, 200))
        : [],
      tools: Array.isArray(agentAutomation.tools)
        ? agentAutomation.tools.slice(0, 20).map((t: unknown) => sanitizeText(t, 100))
        : [],
      setupSteps: Array.isArray(agentAutomation.setupSteps)
        ? agentAutomation.setupSteps.slice(0, 10).map((s: any) => ({
            title: sanitizeText(s?.title, 200),
            description: sanitizeText(s?.description, 500),
          }))
        : [],
    }
    const safeTitle = sanitizeText(playbookTitle, 200)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(safe, safeTitle) }],
      }),
    })

    const data = await response.json()
    const text = data.content[0].text

    const match = text.match(/```json\n([\s\S]+?)\n```/) || text.match(/```\n([\s\S]+?)\n```/)
    const blueprint = match ? match[1] : text

    return new Response(JSON.stringify({ blueprint }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Failed to generate blueprint' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
