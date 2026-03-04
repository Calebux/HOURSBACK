import "jsr:@supabase/functions-js/edge-runtime.d.ts"

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

function buildPrompt(agentAutomation: any, playbookTitle: string): string {
  return `Build a Make.com blueprint for this automation:

Playbook: ${playbookTitle}
Trigger: ${agentAutomation.trigger}
Actions:
${agentAutomation.actions.map((a: string) => `- ${a}`).join('\n')}
Tools to use: ${agentAutomation.tools.join(', ')}

Setup context:
${agentAutomation.setupSteps.map((s: any, i: number) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')}

Generate a complete Make.com scenario blueprint JSON that implements this workflow end to end.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { agentAutomation, playbookTitle } = await req.json()

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
        messages: [{ role: 'user', content: buildPrompt(agentAutomation, playbookTitle) }],
      }),
    })

    const data = await response.json()
    const text = data.content[0].text

    // Extract JSON from Claude's response (inside ```json block or raw)
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
