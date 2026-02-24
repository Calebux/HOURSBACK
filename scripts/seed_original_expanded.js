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

const expandedPlaybooks = [
    {
        slug: 'vendor-performance-scorecard',
        title: 'Vendor Performance Scorecard',
        subtitle: 'Data-driven supplier evaluation in 15 minutes',
        category: 'Operations',
        difficulty: 'Intermediate',
        time_to_complete: 15,
        time_saved: 180,
        completion_count: 634,
        rating: 4.6,
        is_pro: true,
        tools: ['Claude', 'Sheets'],
        before_you_start: [
            'List of top 10 vendors',
            'Last 12 months of transaction data',
            'Any existing SLA metrics'
        ],
        expected_outcome: 'A visual scorecard ranking vendors by performance with actionable recommendations.',
        steps: [
            {
                step_number: 1,
                title: 'Gather Vendor Data',
                instruction: 'Collect all relevant data about your vendors including spend, delivery times, quality scores, and support response times.',
                prompt_template: '',
                expected_output: 'Spreadsheet with vendor metrics.',
                tools: ['Sheets']
            },
            {
                step_number: 2,
                title: 'AI Metric Normalization',
                instruction: 'Paste your raw vendor data into Claude or ChatGPT to quickly normalize the scoring across different metrics.',
                prompt_template: 'I have the following data on my top vendors: [Vendor Data CSV]. Please normalize these metrics to a 1-10 scale based on standard industry KPIs, where 10 is best-in-class performance. Provide the normalized data in a clean Markdown table.',
                expected_output: 'A normalized scoring table for all vendors.',
                tools: ['Claude']
            },
            {
                step_number: 3,
                title: 'Generate Action Plan',
                instruction: 'Based on the scorecard, ask the AI to generate a renegotiation or improvement strategy for the bottom 25% of vendors.',
                prompt_template: 'Based on the normalized scores you just provided, identify the bottom 25% of vendors. Draft a professional, constructive email to each of their account managers requesting a QBR (Quarterly Business Review) to discuss lagging metrics such as [Specific Lagging Metrics].',
                expected_output: 'Drafted QBR request emails.',
                tools: []
            }
        ]
    },
    {
        slug: 'cold-email-personalizer',
        title: 'Cold Email Personalizer',
        subtitle: 'Generate 50 personalized emails from a CSV in 15 minutes',
        category: 'Business Development',
        difficulty: 'Beginner',
        time_to_complete: 15,
        time_saved: 120,
        completion_count: 2156,
        rating: 4.9,
        is_pro: false,
        is_new: true,
        tools: ['Claude', 'Apollo'],
        before_you_start: [
            'CSV with prospect names, companies, and LinkedIn URLs',
            'Your value proposition (one sentence)',
            'Claude Pro or ChatGPT Plus'
        ],
        expected_outcome: '50 personalized cold emails with unique opening lines for each prospect.',
        steps: [
            {
                step_number: 1,
                title: 'Prepare Prospect List',
                instruction: 'Export your target prospect list as a CSV containing Name, Company, Title, and LinkedIn URL.',
                prompt_template: '',
                expected_output: '',
                tools: ['Apollo']
            },
            {
                step_number: 2,
                title: 'Bulk AI Personalization',
                instruction: 'Upload your CSV to Claude or ChatGPT Pro with Data Analysis enabled.',
                prompt_template: 'I am running a cold outreach campaign selling [Value Proposition]. Here is my prospect list: [Prospect CSV]. For each row, write a 1-sentence highly personalized opening line that mentions their specific company or industry trend, and seamlessly transitions into our value proposition. Output a downloadable CSV with the new "Opening Line" and "Body" columns.',
                expected_output: 'A downloadable spreadsheet with custom email copy.',
                tools: ['Claude']
            },
            {
                step_number: 3,
                title: 'Import to Sequencing Tool',
                instruction: 'Import the newly generated CSV into your email sequencing tool mapping the new customized columns as variables.',
                prompt_template: '',
                expected_output: '',
                tools: []
            }
        ]
    },
    {
        slug: 'crm-data-enrichment',
        title: 'CRM Data Enrichment',
        subtitle: 'Auto-fill missing lead data using AI lookup',
        category: 'Sales Ops',
        difficulty: 'Intermediate',
        time_to_complete: 20,
        time_saved: 240,
        completion_count: 845,
        rating: 4.5,
        is_pro: true,
        tools: ['Perplexity', 'Salesforce'],
        before_you_start: [
            'List of accounts missing firmographic data',
            'Perplexity Pro account'
        ],
        expected_outcome: 'A clean CSV ready to import back into your CRM with filled company sizes, HQ locations, and industries.',
        steps: [
            {
                step_number: 1,
                title: 'Export CRM Data',
                instruction: 'Export a list of contacts from your CRM that are missing key demographic data (e.g., Company Size, Industry, HQ Location).',
                prompt_template: '',
                expected_output: '',
                tools: ['Salesforce']
            },
            {
                step_number: 2,
                title: 'Perplexity Batch Enrichment',
                instruction: 'Use Perplexity or ChatGPT with Web Browsing to fill in the blanks using their company domain names.',
                prompt_template: 'Here is a list of company domains: [Domains List]. Please browse the web and return a table containing the approximate Employee Count, Industry, and Headquarter City for each company. Format the output strictly as CSV so I can import it back into my CRM.',
                expected_output: 'A CSV of enriched firmographic data.',
                tools: ['Perplexity']
            },
            {
                step_number: 3,
                title: 'Clean and Import',
                instruction: 'Review the output for any hallucinations, match the column headers to your CRM requirements, and run the bulk import update.',
                prompt_template: '',
                expected_output: '',
                tools: []
            }
        ]
    },
    {
        slug: 'proposal-first-draft',
        title: 'Proposal First Draft',
        subtitle: 'Turn discovery notes into client-ready proposal',
        category: 'Sales',
        difficulty: 'Advanced',
        time_to_complete: 10,
        time_saved: 90,
        completion_count: 1432,
        rating: 4.8,
        is_pro: true,
        tools: ['ChatGPT', 'DocSend'],
        before_you_start: [
            'Raw discovery call notes or transcript',
            'Your standard service offerings and pricing list'
        ],
        expected_outcome: 'An 80% complete custom proposal tailored specifically to the prospect\'s pain points.',
        steps: [
            {
                step_number: 1,
                title: 'Compile Discovery Notes',
                instruction: 'Gather all raw notes, call transcripts, and email threads from your discovery calls with the prospect.',
                prompt_template: '',
                expected_output: '',
                tools: []
            },
            {
                step_number: 2,
                title: 'Generate the Executive Summary',
                instruction: 'Have the AI extract the core pain points and desired outcomes into a compelling summary.',
                prompt_template: 'You are an expert sales strategist. Based on these raw discovery notes: [Discovery Notes], construct a 3-paragraph Executive Summary for our upcoming proposal. Paragraph 1: The current situation and pain points. Paragraph 2: The desired future state. Paragraph 3: How our company uniquely bridges that gap.',
                expected_output: '',
                tools: ['ChatGPT']
            },
            {
                step_number: 3,
                title: 'Structure the Deliverables',
                instruction: 'Feed the AI your standard services list and map them to the prospect\'s needs.',
                prompt_template: 'Now, given our standard service offerings: [Service Offerings], map the specific deliverables that address the pain points identified above. Create a phased timeline (Month 1, Month 2, etc.) outlining exactly what steps we will take.',
                expected_output: '',
                tools: ['ChatGPT']
            }
        ]
    },
    {
        slug: 'competitive-battle-card',
        title: 'Competitive Battle Card',
        subtitle: 'One-page sales aid for any competitor',
        category: 'Product Marketing',
        difficulty: 'Intermediate',
        time_to_complete: 30,
        time_saved: 240,
        completion_count: 512,
        rating: 4.7,
        is_pro: true,
        tools: ['Perplexity', 'Notion'],
        before_you_start: [
            'Target competitor name',
            'Your own product\'s core differentiators'
        ],
        expected_outcome: 'A single page document detailing the competitor\'s weaknesses and exactly how to counter-pitch them.',
        steps: [
            {
                step_number: 1,
                title: 'Gather Rival Intelligence',
                instruction: 'Pull the competitor\'s website copy, recent press releases, and G2/Capterra reviews.',
                prompt_template: '',
                expected_output: '',
                tools: []
            },
            {
                step_number: 2,
                title: 'Analyze Strengths & Weaknesses',
                instruction: 'Ask the AI to critically analyze the competitor\'s positioning against your own.',
                prompt_template: 'Analyze our competitor based on this data: [Competitor Data]. Our own product focuses on [Our Core Differentiator]. Generate a 1-page Competitive Battle Card including: \n1. Their core value proposition.\n2. Their primary weaknesses (look closely at negative public reviews).\n3. "How to Win": Three specific talking points for sales reps to use when a prospect mentions this competitor.',
                expected_output: '',
                tools: ['Perplexity']
            }
        ]
    },
    {
        slug: 'pipeline-health-report',
        title: 'Pipeline Health Report',
        subtitle: 'AI-powered risk scoring and action items',
        category: 'Sales Management',
        difficulty: 'Intermediate',
        time_to_complete: 20,
        time_saved: 120,
        completion_count: 890,
        rating: 4.6,
        is_pro: true,
        tools: ['ChatGPT', 'Salesforce'],
        before_you_start: [
            'Export of all open pipeline deals (CSV)'
        ],
        expected_outcome: 'A brutal, honest assessment of your pipeline highlighting "stale" deals that are unlikely to close, saving you forecasting headaches.',
        steps: [
            {
                step_number: 1,
                title: 'Export Pipeline',
                instruction: 'Export your current open deals, including Deal Stage, Days in Stage, Close Date, and Total Value.',
                prompt_template: '',
                expected_output: '',
                tools: ['Salesforce']
            },
            {
                step_number: 2,
                title: 'AI Risk Assessment',
                instruction: 'Paste the data into ChatGPT for an unbiased pipeline scrub.',
                prompt_template: 'Act as a ruthless Sales Manager. Here is my current pipeline: [Pipeline Data]. Identify "Stale Deals" (deals that have sat in their current stage for more than 2x the average time) and "Risk Deals" (deals closing this month but still in early stages). Group these deals and provide a harsh, realistic analysis of my actual pipeline health.',
                expected_output: '',
                tools: ['ChatGPT']
            },
            {
                step_number: 3,
                title: 'Action Item Generation',
                instruction: 'Identify immediate next steps to unstick the pipeline.',
                prompt_template: 'For each "Stale Deal" identified, draft a short, direct "breakup" or "re-engagement" email I can send to the prospect to force a yes-or-no decision.',
                expected_output: '',
                tools: ['ChatGPT']
            }
        ]
    },
    {
        slug: 'content-calendar-generator',
        title: 'Content Calendar Generator',
        subtitle: '30-day editorial calendar from product updates',
        category: 'Marketing',
        difficulty: 'Beginner',
        time_to_complete: 15,
        time_saved: 240,
        completion_count: 3412,
        rating: 4.9,
        is_pro: false,
        tools: ['ChatGPT', 'Notion'],
        before_you_start: [
            'List of recent product shipped features or company updates',
            'Understanding of your target persona'
        ],
        expected_outcome: 'A 30-day posting schedule complete with post topics and content angles.',
        steps: [
            {
                step_number: 1,
                title: 'List Product Updates',
                instruction: 'Compile your recent feature releases, company news, or core brand pillars.',
                prompt_template: '',
                expected_output: '',
                tools: []
            },
            {
                step_number: 2,
                title: 'Generate Content Ideas',
                instruction: 'Feed the topics to an AI to extrapolate them into a multi-channel calendar.',
                prompt_template: 'My company recently shipped these updates: [Product Updates]. My target audience is [Target Audience Persona]. Generate a 30-day content calendar spanning LinkedIn, Twitter, and our Blog. Each week should have a unified theme. Provide the Date, Channel, Post Topic, and a 1-sentence angle for the copy.',
                expected_output: '',
                tools: ['ChatGPT']
            },
            {
                step_number: 3,
                title: 'Draft the Key Assets',
                instruction: 'Pick the top 3 best ideas from the calendar and ask the AI to draft the full copy for them instantly.',
                prompt_template: '',
                expected_output: '',
                tools: []
            }
        ]
    },
    {
        slug: 'seo-brief-writer',
        title: 'SEO Brief Writer',
        subtitle: 'Complete content brief from target keyword',
        category: 'SEO',
        difficulty: 'Intermediate',
        time_to_complete: 15,
        time_saved: 90,
        completion_count: 1256,
        rating: 4.8,
        is_pro: true,
        tools: ['Perplexity', 'Ahrefs'],
        before_you_start: [
            'Target Keyword identified in Ahrefs or SEMRush'
        ],
        expected_outcome: 'A highly structured H1-H3 document brief ready to hand off to a human writer.',
        steps: [
            {
                step_number: 1,
                title: 'Research Keyword',
                instruction: 'Identify a target keyword using Ahrefs or SEMRush (e.g., "Best CRM for Startups").',
                prompt_template: '',
                expected_output: '',
                tools: ['Ahrefs']
            },
            {
                step_number: 2,
                title: 'Generate the Outline',
                instruction: 'Use Perplexity or ChatGPT with Web Browsing to analyze the Top 10 Google results and reverse-engineer a superior outline.',
                prompt_template: 'I want to rank #1 on Google for the keyword "[Target Keyword]". Analyze the current top-ranking articles for this search intent. Generate a comprehensive Content Brief for my writers. Include: \n1. Recommended Title & Meta Description\n2. H2 and H3 structure that covers everything the competitors cover, plus missing gaps.\n3. A list of LSI keywords to include.\n4. Recommended internal and external link targets.',
                expected_output: '',
                tools: ['Perplexity']
            },
            {
                step_number: 3,
                title: 'Hand-off to Writers',
                instruction: 'Paste the AI-generated brief into Google Docs and assign it to your content team.',
                prompt_template: '',
                expected_output: '',
                tools: []
            }
        ]
    },
    {
        slug: 'cash-flow-projection',
        title: 'Cash Flow Projection',
        subtitle: '13-week rolling forecast from historical data',
        category: 'Finance',
        difficulty: 'Advanced',
        time_to_complete: 30,
        time_saved: 300,
        completion_count: 421,
        rating: 4.5,
        is_pro: true,
        tools: ['ChatGPT', 'Excel'],
        before_you_start: [
            'Export of Accounts Receivable and Accounts Payable',
            'ChatGPT Plus (Data Analysis)'
        ],
        expected_outcome: 'A forward-looking cash burn model highlighting any upcoming capital crunch weeks.',
        steps: [
            {
                step_number: 1,
                title: 'Export Financial Data',
                instruction: 'Export the last 6 months of Accounts Receivable, Accounts Payable, and operating expenses.',
                prompt_template: '',
                expected_output: '',
                tools: ['Excel']
            },
            {
                step_number: 2,
                title: 'AI Trend Analysis',
                instruction: 'Use the AI to identify payment patterns and model the expected future burn rate.',
                prompt_template: 'I am a CFO building a 13-week cash flow forecast. Here is my historical data: [Financial Data]. Based on the average time it takes our clients to pay (Accounts Receivable turnover) and our recurring fixed expenses, project out our weekly cash balance for the next 13 weeks. Highlight any weeks where cash reserves dip below [Minimum Safety Threshold].',
                expected_output: '',
                tools: ['ChatGPT']
            },
            {
                step_number: 3,
                title: 'Scenario Planning',
                instruction: 'Ask the AI to model a "Worst Case" scenario.',
                prompt_template: 'Recalculate the 13-week forecast assuming 20% of Accounts Receivable are delayed by an additional 30 days. What is the impact on week 8?',
                expected_output: '',
                tools: ['ChatGPT']
            }
        ]
    },
    {
        slug: 'job-description-optimizer',
        title: 'Job Description Optimizer',
        subtitle: 'Market-competitive JD from rough requirements',
        category: 'HR',
        difficulty: 'Beginner',
        time_to_complete: 10,
        time_saved: 60,
        completion_count: 1890,
        rating: 4.8,
        is_pro: false,
        tools: ['ChatGPT'],
        before_you_start: [
            'Rough list of required skills and responsibilities',
            'Company culture summary'
        ],
        expected_outcome: 'A compelling, bias-free job posting optimized to attract top-tier talent.',
        steps: [
            {
                step_number: 1,
                title: 'Input Requirements',
                instruction: 'Note down the core technical skills, the salary range, and the primary objective of the role.',
                prompt_template: '',
                expected_output: '',
                tools: []
            },
            {
                step_number: 2,
                title: 'Generate the JD',
                instruction: 'Have the AI write an inclusive, conversion-optimized job description.',
                prompt_template: 'Write a compelling Job Description for a [Job Title] role. Our company culture is [Company Culture]. The core requirements are [Requirements]. Instead of a boring bulleted list, use engaging language that sells the opportunity. Include a "What you\'ll accomplish in your first 90 days" section. Ensure the language is checked for bias and promotes diversity.',
                expected_output: '',
                tools: ['ChatGPT']
            },
            {
                step_number: 3,
                title: 'Review and Post',
                instruction: 'Double-check the requirements against your internal rubric, convert the output to a PDF, and post to your ATS.',
                prompt_template: '',
                expected_output: '',
                tools: []
            }
        ]
    }
];

async function seedAgents() {
    console.log('Publishing heavily expanded original playbooks...');
    for (const pb of expandedPlaybooks) {
        const { steps, ...playbookData } = pb;
        const { data: playbook, error: pbError } = await supabase
            .from('playbooks')
            .upsert(playbookData, { onConflict: 'slug' })
            .select()
            .single();

        if (pbError) {
            console.error(`❌ Error embedding playbook ${pb.slug}:`, pbError.message);
            continue;
        }

        console.log(`✅ Upserted Playbook: ${playbook.title}`);

        // Remove old stubs to ensure clean insert of new steps array
        await supabase.from('playbook_steps').delete().eq('playbook_id', playbook.id);

        for (const step of steps) {
            const stepData = { playbook_id: playbook.id, ...step };
            const { error: insertError } = await supabase.from('playbook_steps').insert(stepData);
            if (insertError) {
                console.error(`  ❌ Error inserting step ${step.step_number}:`, insertError.message);
            } else {
                console.log(`  ✅ Inserted Step ${step.step_number}`);
            }
        }
    }
    console.log('🎉 Done! All 10 legacy playbooks fully populated.');
    process.exit(0);
}

seedAgents();
