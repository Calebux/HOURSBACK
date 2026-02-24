import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// WE MUST USE SERVICE ROLE KEY TO BYPASS RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials (Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env for bypassing RLS)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const smbPlaybooks = [
    {
        title: 'The 30-Day Social Media Content Engine',
        slug: '30-day-social-media-content-engine',
        category: 'Marketing',
        subtitle: 'Generate a full month of engaging, brand-aligned social media posts for your local business in 10 minutes.',
        difficulty: 'Beginner',
        timeToComplete: 10,
        timeSaved: 300, // 5 hours
        isPro: false,
        isNew: true,
        expectedOutcome: 'A complete 30-day social media calendar with fully written captions and suggested imagery.',
        tools: ['ChatGPT', 'Claude'],
        rating: 4.8,
        completionCount: 2041,
        steps: [
            {
                stepNumber: 1,
                title: 'Define Your Brand Voice',
                instruction: 'Open ChatGPT and give it the context of your business so the posts don\'t sound generic.',
                promptTemplate: 'I own [Business Name & Industry]. My target audience is [Target Audience]. We currently have the following offers: [Current Promotions/Offers]. Adopt a brand voice that is friendly, local, and professional.',
                expectedOutput: 'An acknowledgment from the AI confirming it understands your brand voice.'
            },
            {
                stepNumber: 2,
                title: 'Generate the Calendar',
                instruction: 'Ask the AI to structure a 30-day plan that mixes different types of content.',
                promptTemplate: 'Generate a 30-day social media content calendar in a table format. Include columns for: Day, Content Theme (e.g., Behind-the-scenes, Customer Spotlight, Promotion), and the Suggested Image/Video to post.',
                expectedOutput: 'A structured 30-row table outlining a month of varied content.'
            },
            {
                stepNumber: 3,
                title: 'Write the Captions & Hashtags',
                instruction: 'Turn the calendar into actual ready-to-post text.',
                promptTemplate: 'Now, write the exact captions for the first week (Days 1-7) based on the calendar you just generated. Include relevant local and industry hashtags. Keep the tone conversational and include a clear Call-To-Action (like "Visit our store today" or "Link in bio") for the promotional posts.',
                expectedOutput: '7 fully written, emoji-ready captions you can copy directly into Facebook or Instagram.'
            }
        ]
    },
    {
        title: 'Professional Overdue Invoice Chaser',
        slug: 'professional-overdue-invoice-chaser',
        category: 'Finance',
        subtitle: 'Recover unpaid invoices without ruining your client relationships using perfectly toned follow-up emails.',
        difficulty: 'Beginner',
        timeToComplete: 5,
        timeSaved: 60, // 1 hour
        isPro: false,
        isNew: true,
        expectedOutcome: 'A professional, escalating sequence of 3 emails designed to get you paid immediately.',
        tools: ['ChatGPT', 'Claude', 'Email Client'],
        rating: 4.9,
        completionCount: 3125,
        steps: [
            {
                stepNumber: 1,
                title: 'The Polite Reminder (Day 3 Overdue)',
                instruction: 'Tone is everything when chasing money. Start by assuming they just forgot.',
                promptTemplate: 'Write a polite, friendly email to [Client Name] reminding them that [Invoice Number & Amount] is currently [Days Overdue] days overdue. Assume they just forgot or missed the email. Keep it short and professional.',
                expectedOutput: 'A short, polite reminder email.'
            },
            {
                stepNumber: 2,
                title: 'The Firm Follow-Up (Day 15 Overdue)',
                instruction: 'If they don\'t respond to the first check-in, escalate the tone slightly.',
                promptTemplate: 'Write a second follow-up email to [Client Name] regarding the same [Invoice Number & Amount]. The tone should be firm but professional, requesting an immediate update on the payment status and offering a call if there are any issues with the invoice.',
                expectedOutput: 'A firmer email requesting a payment status update.'
            },
            {
                stepNumber: 3,
                title: 'The Final Notice (Day 30+ Overdue)',
                instruction: 'For severe delays, issue a final warning email.',
                promptTemplate: 'Write a final notice email to [Client Name] for [Invoice Number & Amount]. State clearly that the invoice is severely overdue and that further delays may result in paused services or late fees (if applicable). Maintain a strictly formal and objective business tone without sounding purely emotional.',
                expectedOutput: 'A formal final notice detailing consequences for non-payment.'
            }
        ]
    },
    {
        title: 'Local SEO Competitor Analysis',
        slug: 'local-seo-competitor-analysis',
        category: 'Growth',
        subtitle: 'Find out exactly why the business down the street is ranking higher on Google, and how to beat them.',
        difficulty: 'Beginner',
        timeToComplete: 10,
        timeSaved: 180, // 3 hours
        isPro: true,
        isNew: true,
        expectedOutcome: 'A clear intelligence report on your competitor and an actionable 5-step checklist to outrank them.',
        tools: ['Perplexity'],
        rating: 4.7,
        completionCount: 890,
        steps: [
            {
                stepNumber: 1,
                title: 'Gather Market Data',
                instruction: 'Open Perplexity.ai (a search-connected AI) to analyze your local market web presence.',
                promptTemplate: 'Search the web for [Your Business Name & Website] and [Top Competitor Name & Website] in [Your Local City]. Summarize the overall online presence, search ranking focus, and Google Business Profile reputation of both businesses.',
                expectedOutput: 'A side-by-side comparison of local online visibility.'
            },
            {
                stepNumber: 2,
                title: 'Identify the Content Gap',
                instruction: 'Ask the AI to find what your competitor is talking about that you are missing.',
                promptTemplate: 'Based on the websites of both businesses, identify 3 specific services, keywords, or customer pain points that my competitor highlights well on their website, but my website does not address clearly.',
                expectedOutput: 'A list of "content gaps" you currently have compared to your competitor.'
            },
            {
                stepNumber: 3,
                title: 'Action Plan Extraction',
                instruction: 'Turn the analysis into a to-do list for yourself or your marketing assistant.',
                promptTemplate: 'Give me a step-by-step checklist of 5 exact things I can do this week to improve my website\'s local SEO and compete directly with [Top Competitor Name] based on the content gaps you just found.',
                expectedOutput: '5 clear, actionable steps you can execute immediately to improve rankings.'
            }
        ]
    },
    {
        title: 'De-escalate Angry Customer Complaints',
        slug: 'de-escalate-angry-customer-complaints',
        category: 'Customer Success',
        subtitle: 'Turn 1-star reviews or angry emails into loyal, repeat customers with empathetic, AI-crafted responses.',
        difficulty: 'Beginner',
        timeToComplete: 5,
        timeSaved: 45,
        isPro: false,
        isNew: true,
        expectedOutcome: 'A highly empathetic, professional email response that de-escalates tension without admitting unneeded legal fault.',
        tools: ['ChatGPT', 'Claude'],
        rating: 4.9,
        completionCount: 4200,
        steps: [
            {
                stepNumber: 1,
                title: 'Remove Emotion from the Equation',
                instruction: 'When a customer is angry, it\'s hard to reply calmly. Let the AI inject the empathy for you. Open ChatGPT.',
            },
            {
                stepNumber: 2,
                title: 'Draft the Response',
                instruction: 'Share the exact complaint and your company policy with the AI.',
                promptTemplate: 'Act as a senior customer service manager. Read the following angry complaint from a customer: "[Paste the Customer\'s Complaint/Review]". Write a highly empathetic, de-escalating response. Apologize for their frustration, validate their feelings, and offer the following resolution based on our standard policy: [Your Business Policy on Refunds/Make-Goods].',
                expectedOutput: 'A calm, perfectly structured apologetic email offering your defined resolution.'
            },
            {
                stepNumber: 3,
                title: 'Review and Send',
                instruction: 'Read the drafted email. Ensure it sounds human and sincere. If it looks good, copy and paste it into your email client or the review platform (like Yelp or Google My Business) to publicly or privately address the customer.',
                expectedOutput: 'A successfully resolved customer escalation.'
            }
        ]
    },
    {
        title: 'Vendor Price Negotiation Script',
        slug: 'vendor-price-negotiation-script',
        category: 'Operations',
        subtitle: 'Confidently ask your suppliers for better rates or payment terms using proven negotiation framing.',
        difficulty: 'Beginner',
        timeToComplete: 10,
        timeSaved: 120, // 2 hours
        isPro: true,
        isNew: true,
        expectedOutcome: 'A negotiation strategy and a professionally drafted outreach email to your vendor requesting better terms.',
        tools: ['ChatGPT', 'Claude'],
        rating: 4.6,
        completionCount: 1540,
        steps: [
            {
                stepNumber: 1,
                title: 'Prepare the Strategy',
                instruction: 'Before emailing a vendor, use AI to structure your argument solidly based on loyalty or market rates.',
                promptTemplate: 'I need to renegotiate terms with my supplier, [Supplier Name], for [Current Product/Service Bought]. My goal is to get [Your Goal (e.g., 10% discount, Net-60 terms)]. Act as an expert procurement negotiator and give me a 3-bullet strategy on how to frame this request so it sounds like a win-win partnership rather than an aggressive demand.',
                expectedOutput: 'A psychological and business strategy for framing your request to the vendor.'
            },
            {
                stepNumber: 2,
                title: 'Draft the Outreach Email',
                instruction: 'Let the AI write the delicate first email using the strategy it just created.',
                promptTemplate: 'Write the initial email to my account rep at [Supplier Name]. Highlight our history of reliable business together, and gracefully request [Your Goal]. Keep the email concise, professional, and entirely open to discussion. Do not make ultimatums.',
                expectedOutput: 'A drafted email ready to be sent to your supplier rep.'
            },
            {
                stepNumber: 3,
                title: 'Counter-Offer Practice (Optional)',
                instruction: 'If they say no, have a backup plan ready.',
                promptTemplate: 'If the supplier replies saying their margins are too tight to offer a direct discount, what are two alternative business concessions I should immediately ask for instead (e.g., free shipping, better payment terms)? Draft a polite reply email pivoting to these alternatives.',
                expectedOutput: 'A backup email pivoting to other valuable terms like Net-60 or volume shipping discounts.'
            }
        ]
    }
];

async function seedSMBPlaybooks() {
    console.log('Seeding SMB Playbooks...');

    try {
        for (const pb of smbPlaybooks) {
            console.log(`Processing ${pb.title}...`);

            const { data: playbook, error: pError } = await supabase
                .from('playbooks')
                .upsert({
                    title: pb.title,
                    slug: pb.slug,
                    category: pb.category,
                    subtitle: pb.subtitle,
                    difficulty: pb.difficulty,
                    time_to_complete: pb.timeToComplete,
                    time_saved: pb.timeSaved,
                    is_pro: pb.isPro,
                    is_new: pb.isNew,
                    expected_outcome: pb.expectedOutcome,
                    tools: pb.tools,
                    rating: pb.rating,
                    completion_count: pb.completionCount
                }, { onConflict: 'slug' })
                .select()
                .single();

            if (pError) throw pError;

            console.log(`✓ Inserted/Updated playbook: ${playbook.title}`);

            // Delete existing steps to avoid duplication
            const { error: deleteError } = await supabase
                .from('playbook_steps')
                .delete()
                .eq('playbook_id', playbook.id);

            if (deleteError) throw deleteError;

            // Insert new steps
            const stepsToInsert = pb.steps.map(step => ({
                playbook_id: playbook.id,
                step_number: step.stepNumber,
                title: step.title,
                instruction: step.instruction,
                prompt_template: step.promptTemplate,
                expected_output: step.expectedOutput,
                tips: step.tips || null
            }));

            const { error: sError } = await supabase
                .from('playbook_steps')
                .insert(stepsToInsert);

            if (sError) throw sError;
            console.log(`  ✓ Inserted ${stepsToInsert.length} steps`);
        }

        console.log('✅ SMB seed completed successfully!');
    } catch (error) {
        console.error('Error during seeding:', error);
    }
}

seedSMBPlaybooks();
