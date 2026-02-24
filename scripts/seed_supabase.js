import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as fs from 'fs';

// Setup environment variables config
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables in .env (Need URL and Service Key)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// We need to read the mockPlaybooks array. Since it contains complex objects and TypeScript, 
// the easiest way for a one-off script is to parse a JSON export of it, or write a tiny TS script.
// Let's use a dynamic import of the compiled JS, or since we are generic, we can just grab the raw data string 
// and evaluate it, but that's messy. 

// Actually, let's just create a small list of the main playbooks to seed, or 
// read the file and extract it. For safety and speed, we will write a generic seeder 
// that you can run with ts-node, or we provide the payload directly here for the top 3 playbooks to prove it works.

const playbooksSeed = [
    {
        slug: 'account-research-brief',
        title: 'Account Research Brief',
        subtitle: 'Generate a comprehensive briefing document before your discovery call.',
        category: 'Sales Ops',
        difficulty: 'Beginner',
        time_to_complete: 5,
        time_saved: 45,
        completion_count: 1240,
        rating: 4.8,
        is_pro: false,
        is_new: false,
        tools: ['Perplexity', 'Apollo', 'Claude'],
        before_you_start: [
            'Ensure you have the company domain name',
            'Identify 1-2 key executives you are meeting with'
        ],
        expected_outcome: 'A 2-page briefing document detailing recent company news, strategic priorities, and tailored discovery questions.',
        steps: [
            {
                step_number: 1,
                title: 'Gather Raw Intelligence',
                instruction: 'Go to Perplexity.ai and use this prompt to gather the latest strategic information about the target company.',
                prompt_template: 'Research [Company Name]. Identify their top 3 strategic initiatives for this year based on their recent earnings calls, press releases, and CEO interviews. Also list any recent leadership changes or major product launches in the last 6 months.',
                expected_output: 'A bulleted list of recent news and strategic focus areas.',
                tips: 'If the company is private, tell Perplexity to specifically search industry news sites like TechCrunch or Bloomberg rather than relying on earnings reports.'
            },
            {
                step_number: 2,
                title: 'Analyze Executive Personas',
                instruction: 'Take the names of the executives you are meeting with and run them through Claude to build a personality profile.',
                prompt_template: 'I am pitching a B2B SaaS product to [Executive Name], the [Executive Title] at [Company Name]. Based on their role, what are their likely top 3 KPIs? What kind of communication style do [Executive Title]s typically prefer (e.g., data-heavy, visionary, risk-averse)?',
                expected_output: 'A breakdown of the buyer\'s expected motivations and communication preferences.',
                tools: ['Claude']
            },
            {
                step_number: 3,
                title: 'Synthesize with AI',
                instruction: 'Combine the company intelligence and the executive persona into a final briefing document.',
                prompt_template: 'You\'re a senior business development strategist preparing for a call with [Company Name]. \n\nHere is the company data: [Paste Perplexity Results]\nHere is the executive persona: [Paste Claude Results]\n\nBased on this, generate a 1-page briefing document containing:\n1. Executive Summary of the business\n2. 3 highly-tailored discovery questions to ask on the call\n3. 1 potential objection they might have and how to handle it.',
                expected_output: 'Your final, ready-to-read briefing document.'
            }
        ]
    },
    {
        slug: 'icp-generation',
        title: 'Ideal Customer Profile Generator',
        subtitle: 'Use AI to map out your perfect buyer personas based on market data.',
        category: 'Marketing',
        difficulty: 'Intermediate',
        time_to_complete: 15,
        time_saved: 120,
        completion_count: 850,
        rating: 4.9,
        is_pro: true,
        is_new: true,
        tools: ['ChatGPT', 'G2'],
        before_you_start: [
            'Have a list of your top 5 best current customers',
            'Know your product\'s core value proposition'
        ],
        expected_outcome: 'A detailed matrix of 3 distinct buyer personas with their pain points, watering holes, and buying triggers.',
        steps: [
            {
                step_number: 1,
                title: 'Extract Competitor Reviews',
                instruction: 'Go to G2 or Capterra, find your biggest competitor, and copy 10 of their 1-star and 5-star reviews.',
                prompt_template: 'Analyze these reviews for [Competitor Name]. What is the primary reason people buy them? What is the primary reason people churn or complain? \n\nReviews:\n[Paste Reviews]',
                expected_output: 'A summary of market gaps and buyer motivations.'
            }
        ]
    }
];

async function seedDatabase() {
    console.log('🌱 Starting database seed...');

    for (const pb of playbooksSeed) {
        const { steps, ...playbookData } = pb;

        // 1. Insert Playbook
        console.log(`Inserting playbook: ${pb.title}`);
        const { data: playbookObj, error: pbError } = await supabase
            .from('playbooks')
            .insert(playbookData)
            .select()
            .single();

        if (pbError) {
            console.error(`❌ Error inserting ${pb.title}:`, pbError.message);
            continue;
        }

        // 2. Insert Steps
        if (playbookObj && steps.length > 0) {
            const stepsToInsert = steps.map(step => ({
                playbook_id: playbookObj.id,
                ...step
            }));

            const { error: stepsError } = await supabase
                .from('playbook_steps')
                .insert(stepsToInsert);

            if (stepsError) {
                console.error(`❌ Error inserting steps for ${pb.title}:`, stepsError.message);
            } else {
                console.log(`✅ Successfully seeded ${pb.title} and its steps.`);
            }
        }
    }

    console.log('🎉 Seeding complete!');
    process.exit(0);
}

seedDatabase();
