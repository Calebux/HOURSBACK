import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const newPlaybooks = [
    {
        slug: 'meeting-synthesizer-action-tracker',
        title: 'Meeting Synthesizer & Action Tracker',
        subtitle: 'Turn messy meeting transcripts into structured operational plans with zero manual data entry.',
        category: 'Operations',
        difficulty: 'Beginner',
        time_to_complete: 10,
        time_saved: 45,
        completion_count: 320,
        rating: 4.9,
        is_pro: false,
        is_new: true,
        tools: ['Otter.ai', 'Fathom', 'ChatGPT'],
        before_you_start: ['Record your meeting using Otter.ai, Fathom, or comparable transcription software.'],
        expected_outcome: 'A clear Markdown document containing an Executive Summary, Decisions Made, and a structured Action Items table ready to paste into Asana or Notion.',
        steps: [
            {
                step_number: 1,
                title: 'Record the Meeting',
                instruction: 'Use an automated meeting recorder like Otter or Fathom to capture the raw transcript of your call regarding [Project Name]. Export the raw `.txt` transcript payload.',
                prompt_template: '',
                expected_output: '',
                tools: []
            },
            {
                step_number: 2,
                title: 'The Synthesizer Agent',
                instruction: 'Paste the raw transcript into ChatGPT along with the structured instruction prompt to analyze the meeting.',
                prompt_template: 'You are a Senior Project Manager attending a meeting for [Project Name]. The attendees discussed the project at length. Here is the raw transcript: [Paste Transcript]. \n\nPlease synthesize this meeting by providing: \n1. A 3-bullet Executive Summary.\n2. A clear list of Decisions Made.\n3. An Action Items table detailing the Task, the Assignee (mapped to one of these team members: [Team Members]), and the Deadline (if mentioned). If no assignee is clear, label it "Unassigned". Format the output in Markdown.',
                expected_output: 'ChatGPT returns a fully structured markdown operational plan.',
                tools: ['ChatGPT']
            },
            {
                step_number: 3,
                title: 'Export to Notion/Asana',
                instruction: 'Take the clean Markdown output and paste it directly into your project management tool for instant tracking. The markdown tables will copy and paste perfectly.',
                prompt_template: '',
                expected_output: '',
                tools: []
            }
        ]
    },
    {
        slug: 'social-media-content-repurposing',
        title: 'Social Media Content Repurposing Engine',
        subtitle: 'Build a workflow that automatically turns every new long-form blog post into a week\'s worth of short-form social posts.',
        category: 'Marketing',
        difficulty: 'Beginner',
        time_to_complete: 20,
        time_saved: 120,
        completion_count: 580,
        rating: 4.7,
        is_pro: true,
        is_new: true,
        tools: ['Zapier', 'Claude'],
        before_you_start: ['Ensure your website has an active RSS feed.'],
        expected_outcome: 'An automated pipeline that reads new blog posts and drafts 3 conversational LinkedIn posts in your CMS or Draft folder.',
        steps: [
            {
                step_number: 1,
                title: 'The RSS Trigger',
                instruction: 'Set up a Zapier workflow that triggers every time a new blog post goes live on your website\'s RSS feed (or when a new Google Doc is moved to a specific folder).',
                prompt_template: '',
                expected_output: '',
                tools: ['Zapier']
            },
            {
                step_number: 2,
                title: 'The "Ghostwriter" Agent',
                instruction: 'Pass the blog text to Claude or OpenAI via Zapier. Use this highly specialized growth prompt.',
                prompt_template: 'You are a viral social media manager writing for an audience of [Target Audience Persona]. Your tone is [Brand Voice]. Take the following blog post text and break it down into 3 distinct, engaging LinkedIn posts. Each post should highlight a different core lesson from the article. The final sentence of each post should be a conversational question to drive engagement, followed by this call to action: "[Call to Action] - Link in the comments." Do not use hashtags. \n\nBlog Post: [Blog Post Text]',
                expected_output: 'The AI returns 3 separate LinkedIn posts formatted for engagement.',
                tools: ['Claude']
            },
            {
                step_number: 3,
                title: 'Automated Delivery',
                instruction: 'Connect the final step of the Zap to Buffer, Hootsuite, or simply draft an email to yourself with the three ready-to-publish posts so you can review them before they go live.',
                prompt_template: '',
                expected_output: '',
                tools: []
            }
        ]
    }
];

async function seedAgents() {
    console.log('Publishing remaining agent playbooks...');
    for (const pb of newPlaybooks) {
        const { steps, ...playbookData } = pb;
        const { data: playbook, error: pbError } = await supabase
            .from('playbooks')
            .upsert(playbookData, { onConflict: 'slug' })
            .select()
            .single();

        if (pbError) {
            console.error(`❌ Error:`, pbError.message);
            continue;
        }

        console.log(`✅ Upserted Playbook: ${playbook.title}`);
        for (const step of steps) {
            const stepData = { playbook_id: playbook.id, ...step };
            const { error: stepError } = await supabase.from('playbook_steps').upsert(stepData, { onConflict: 'playbook_id,step_number' });
            if (stepError) {
                const { error: insertError } = await supabase.from('playbook_steps').insert(stepData);
                if (!insertError) console.log(`  ✅ Inserted Step ${step.step_number}`);
            } else {
                console.log(`  ✅ Upserted Step ${step.step_number}`);
            }
        }
    }
    console.log('🎉 Done!');
    process.exit(0);
}

seedAgents();
