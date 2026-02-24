import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// We temporarily need the service role key again purely to bypass RLS to perform these master inserts
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const newPlaybooks = [
    {
        slug: 'always-on-support-agent',
        title: 'Build an Always-On Customer Support Agent',
        subtitle: 'Create a custom AI assistant trained on your docs to answer questions 24/7.',
        category: 'Customer Support',
        difficulty: 'Beginner',
        time_to_complete: 15,
        time_saved: 200,
        completion_count: 852,
        rating: 4.8,
        is_pro: false,
        is_new: true,
        tools: ['ChatGPT Plus'],
        before_you_start: ['Export your FAQ or manuals as a PDF.'],
        expected_outcome: 'A custom GPT you can share with clients to handle tier-1 support queries completely autonomously.',
        steps: [
            {
                step_number: 1,
                title: 'Review The Strategy',
                instruction: 'Before building the agent, understand that Custom GPTs work best when given strict boundaries. We will define a strict persona, provide it a knowledge base document, and explicitly instruct it not to hallucinate answers.',
                prompt_template: '',
                expected_output: '',
                tools: []
            },
            {
                step_number: 2,
                title: 'Configure the Agent Profile',
                instruction: 'Navigate to ChatGPT > Explore > Create a GPT. Switch to the "Configure" tab. Paste this strict system prompt into the Instructions box and upload your PDF into the Knowledge section.',
                prompt_template: 'You are the official Customer Support Agent for [Company Name], a company that provides [Product or Service]. Your goal is to answer user questions accurately, politely, and entirely based on the uploaded knowledge base documents. Your tone should be [Brand Tone]. If the user asks a question that is NOT covered in the knowledge base, you must politely inform them that you do not know the answer and direct them to email support@[Company Name].com. Under no circumstances should you invent pricing, offer unauthorized refunds, or make up features that are not explicitly documented.',
                expected_output: 'The GPT understands its boundary constraints and brand tone.',
                tools: ['ChatGPT Plus']
            },
            {
                step_number: 3,
                title: 'Publish and Embed',
                instruction: 'Test the agent by asking it a question completely unrelated to your business. If it correctly declines to answer, publish the GPT. You can now share this direct link with customers or embed it on your website.',
                prompt_template: '',
                expected_output: '',
                tools: []
            }
        ]
    },
    {
        slug: 'autonomous-lead-researcher',
        title: 'The Autonomous Lead Researcher',
        subtitle: 'An agent that watches your CRM and googles new leads automatically.',
        category: 'Sales Ops',
        difficulty: 'Beginner',
        time_to_complete: 20,
        time_saved: 480,
        completion_count: 512,
        rating: 4.9,
        is_pro: true,
        is_new: true,
        tools: ['Make.com', 'Google Sheets', 'Perplexity'],
        before_you_start: ['Create a free Make.com account.', 'Create a Google Sheet with a "Company Name" column.'],
        expected_outcome: 'Every time you paste a company name into the sheet, the agent performs a deep Google search and summarizes their profile automatically in the next column.',
        steps: [
            {
                step_number: 1,
                title: 'Configure the Setup',
                instruction: 'In Make.com, create a new scenario starting with a "Google Sheets: Watch Rows" trigger.',
                prompt_template: '',
                expected_output: '',
                tools: ['Make.com', 'Google Sheets']
            },
            {
                step_number: 2,
                title: 'The Perplexity Search Agent',
                instruction: 'Add the Perplexity module. Paste this prompt and ensure you map the "Company Name" variable directly from your Google Sheets module output.',
                prompt_template: 'Research the company "[Company Name]" thoroughly. I am evaluating them against our Ideal Customer Profile which involves [Ideal Customer Profile Details]. Please provide a concise briefing that includes: 1. A 2-sentence summary of what they do. 2. Who their primary competitors are, specifically looking to see if they compete with [Key Competitors]. 3. Details on: [Data Points Needed]. Return the output as plain text formatted with clear headings.',
                expected_output: 'Perplexity browses the web and generates the structured research summary.',
                tools: ['Perplexity']
            },
            {
                step_number: 3,
                title: 'Save the Briefing',
                instruction: 'Add a final "Google Sheets: Update Row" module. Map the response from Perplexity into an empty column next to your company name to complete the automated workflow loop.',
                prompt_template: '',
                expected_output: '',
                tools: ['Make.com']
            }
        ]
    },
    {
        slug: 'zero-inbox-email-triage',
        title: 'Zero-Inbox Email Triage Agent',
        subtitle: 'Have an AI agent categorize incoming emails and draft replies for VIPs.',
        category: 'Productivity',
        difficulty: 'Beginner',
        time_to_complete: 25,
        time_saved: 600,
        completion_count: 120,
        rating: 5.0,
        is_pro: true,
        is_new: true,
        tools: ['Zapier', 'Gmail', 'OpenAI'],
        before_you_start: ['Create an OpenAI API key.'],
        expected_outcome: 'Important emails in your Gmail are automatically flagged and have a draft reply waiting for your approval.',
        steps: [
            {
                step_number: 1,
                title: 'The Email Trigger',
                instruction: 'In Zapier, set up the trigger "New Email Matching Search" in Gmail (e.g., exclude newsletters to save API costs).',
                prompt_template: '',
                expected_output: '',
                tools: ['Zapier', 'Gmail']
            },
            {
                step_number: 2,
                title: 'The Triage Agent',
                instruction: 'Pass the email body to an OpenAI step in Zapier. Paste this triage prompt to instruct the agent how to evaluate the message.',
                prompt_template: 'You are an executive assistant to [Your Name]. Analyze the following email body and metadata. Determine if it is Urgent, VIP, General, or Spam. An email is VIP if it comes from [VIP Client Domains or Names]. An email is Urgent if it contains keywords like [Urgent Keywords]. If it is VIP or Urgent, draft a polite, brief reply acknowledging receipt and stating [Your Name] will review it today. Return the output as a JSON object with keys: "Category" (string), "Summary" (1 sentence string), and "SuggestedReply" (string, empty if not VIP/Urgent).\n\nEmail Body: [Email Text]',
                expected_output: 'OpenAI returns a structured JSON payload identifying VIPs.',
                tools: ['OpenAI']
            },
            {
                step_number: 3,
                title: 'Draft the Reply',
                instruction: 'Add a final Gmail module to "Create Draft". Map the "SuggestedReply" variable into the body so all you have to do is hit Send.',
                prompt_template: '',
                expected_output: '',
                tools: ['Gmail']
            }
        ]
    }
];

async function seedAgents() {
    console.log('Beginning Agent Playbook database injection...');

    for (const pb of newPlaybooks) {
        const { steps, ...playbookData } = pb;

        // Insert playbook
        const { data: playbook, error: pbError } = await supabase
            .from('playbooks')
            .upsert(playbookData, { onConflict: 'slug' })
            .select()
            .single();

        if (pbError) {
            console.error(`❌ Error inserting playbook ${pb.slug}:`, pbError.message);
            continue;
        }

        console.log(`✅ Upserted Playbook: ${playbook.title}`);

        // Insert steps
        for (const step of steps) {
            const stepData = {
                playbook_id: playbook.id,
                ...step
            };

            const { error: stepError } = await supabase
                .from('playbook_steps')
                .upsert(stepData, { onConflict: 'playbook_id,step_number' }); // Need unique constraint on (playbook_id, step_number) for this to work natively usually, but we'll try standard insert if it doesn't conflict

            if (stepError) {
                // fallback to simple insert if upsert fails due to missing constraint
                const { error: insertError } = await supabase.from('playbook_steps').insert(stepData);
                if (insertError) {
                    console.error(`  ❌ Error inserting step ${step.step_number}:`, insertError.message);
                } else {
                    console.log(`  ✅ Inserted Step ${step.step_number}`);
                }
            } else {
                console.log(`  ✅ Inserted/Upserted Step ${step.step_number}`);
            }
        }
    }

    console.log('🎉 AI Agent Playbook database injection complete!');
    process.exit(0);
}

seedAgents();
