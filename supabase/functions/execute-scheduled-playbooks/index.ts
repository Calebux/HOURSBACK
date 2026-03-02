import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initialize admin clients
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }
    
    // We use the Service Role key to bypass RLS and fetch all scheduled jobs across the platform
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // In a full production implementation, pg_cron would trigger this endpoint,
    // and we would iterate over `scheduled_playbooks` where the cron_expression matches the current time.
    // For this MVP execution agent, we will just expect a specific `schedule_id` to be passed in to run it manually.
    
    const { schedule_id } = await req.json();
    
    if (!schedule_id) {
        return new Response(JSON.stringify({ error: "No schedule_id provided" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }

    // 2. Fetch the specific schedule and the user's email
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('scheduled_playbooks')
      .select('*, profiles(email)')
      .eq('id', schedule_id)
      .single();

    if (scheduleError || !schedule) {
       throw new Error(`Failed to find schedule: ${scheduleError?.message}`);
    }

    // Bug fix: don't run paused agents
    if (!schedule.is_active) {
      return new Response(JSON.stringify({ error: "Schedule is paused" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const userEmail = schedule.profiles?.email;
    const deliveryEmail = schedule.custom_delivery_email || userEmail;

    if (!deliveryEmail) throw new Error("Could not determine delivery email");

    // 3. Compile the full playbook "Recipe"
    const variables = schedule.variables || {};
    const playbookSlug = schedule.playbook_slug;
    const playbookData = schedule.playbook_data;
    
    let compiledPrompt = `You are an autonomous AI Agent executing the following playbook: "${playbookData?.title || playbookSlug}".\n\n`;
    compiledPrompt += `### USER CONFIGURATION:\n`;
    Object.entries(variables).forEach(([key, value]) => {
      compiledPrompt += `- ${key}: ${value}\n`;
    });
    compiledPrompt += `\n### EXECUTION STEPS:\n`;

    if (playbookData && playbookData.steps) {
      playbookData.steps.forEach((step: any, index: number) => {
        let stepPrompt = step.promptTemplate || '';
        // Inject variables into step template
        Object.keys(variables).forEach(v => {
          if (variables[v]) {
            stepPrompt = stepPrompt.split(`[${v}]`).join(variables[v]);
          }
        });
        
        compiledPrompt += `STEP ${index + 1}: ${step.title}\n`;
        compiledPrompt += `Instruction: ${step.instruction}\n`;
        if (stepPrompt) {
          compiledPrompt += `Prompt: ${stepPrompt}\n`;
        }
        compiledPrompt += `\n`;
      });
    } else {
      // Fallback for legacy schedules without playbook_data
      compiledPrompt += `Please generate a comprehensive, actionable response based on the provided configuration. Output your findings as a well-formatted professional brief.`;
    }

    compiledPrompt += `\n### FINAL TASK:\n`;
    compiledPrompt += `Please process all the steps above and produce the final result. ${playbookData?.expectedOutcome ? `Expected Outcome: ${playbookData.expectedOutcome}` : ''}\n`;
    compiledPrompt += `Do not include conversational filler, only the final high-quality output formatted as a professional brief.`;

    console.log(`[Agent Waking Up] Executing ${playbookSlug} for ${deliveryEmail}`);

    // 4. Generate the work using Claude 3.5 Sonnet
    if (!ANTHROPIC_API_KEY) throw new Error("Missing Anthropic API Key");
    
    const anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY,
    });

    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: "You are an autonomous expert consultant. Produce polished, insightful work based exactly on the user's scheduled configuration. Do not generate conversational filler, only the final report.",
        messages: [{ role: "user", content: compiledPrompt }],
    });

    // @ts-ignore - The SDK types can be slightly wonky in Deno
    const generatedContent = msg.content[0].text;

    // 5. Deliver the result via Email first
    if (!RESEND_API_KEY) throw new Error("Missing Resend API Key");

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">🤖 Your Autonomous Agent Finished Running!</h2>
        <p>Your scheduled playbook execution for <strong>${playbookSlug}</strong> successfully completed.</p>
        <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
        <div style="white-space: pre-wrap; background: #f8fafc; padding: 20px; border-radius: 8px;">${generatedContent}</div>
        <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 12px;">Sent automatically by Hoursback.<br/>You can manage your schedules in your dashboard.</p>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: "Hoursback Autopilot <onboarding@resend.dev>",
            to: [deliveryEmail],
            subject: `[Agent Report] ${playbookSlug}`,
            html: emailHtml,
        }),
    });

    if (!resendRes.ok) {
        const errObj = await resendRes.text();
        console.error("Failed to send email via Resend:", errObj);
        throw new Error("Email delivery failed");
    }

    // 6. Only log as success after email is confirmed delivered
    const { error: logError } = await supabaseAdmin
        .from('autonomous_runs')
        .insert({
            schedule_id: schedule.id,
            user_id: schedule.user_id,
            playbook_slug: playbookSlug,
            generated_content: generatedContent,
            run_status: 'success'
        });

    if (logError) {
        console.error("Failed to log run to database:", logError);
    }

    return new Response(JSON.stringify({ success: true, message: "Agent execution complete and delivered" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Agent Execution Failed:", error);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
