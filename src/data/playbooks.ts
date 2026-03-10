import type { Step, Playbook, WebhookConfig, WebhookInput } from '../types/playbook';

export type { Step, Playbook, WebhookConfig, WebhookInput };

export const mockPlaybooks: Playbook[] = [
  {
    id: '1',
    slug: 'account-research-brief',
    title: 'Account Research Brief',
    subtitle: 'Turn any company name into a 1-page intelligence document for sales calls',
    category: 'Business Development',
    difficulty: 'Beginner',
    timeToComplete: 5,
    timeSaved: 40,
    completionCount: 1247,
    rating: 4.8,
    isPro: false,
    tools: ['Perplexity', 'ChatGPT', 'Firecrawl'],
    beforeYouStart: [
      'LinkedIn Sales Navigator (free trial works)',
      'Company website URL',
      '10 minutes uninterrupted'
    ],
    expectedOutcome: 'A single-page document containing: company overview, recent news, leadership changes, competitive landscape, and 3 personalized talking points for your outreach.',
    troubleshooting: [
      {
        problem: 'Perplexity results are outdated',
        solution: 'Add "after:2024-01-01" to query or check company\'s /blog and /press pages directly'
      },
      {
        problem: 'Can\'t find decision makers on LinkedIn',
        solution: 'Search "[Company] + [Title] + LinkedIn" on Google, or check "People also viewed" on existing contact'
      },
      {
        problem: 'ChatGPT gives generic output',
        solution: 'Add "Be specific. Cite exact numbers, names, and dates from the intelligence."'
      }
    ],
    steps: [
      {
        id: 'step-0',
        stepNumber: 1,
        title: 'Scrape the Company Website',
        instruction: 'Enter the target company\'s website URL below. The system will automatically scrape their homepage, about page, and key content using Firecrawl — giving the AI real, up-to-date context about the company instead of relying on stale training data.',
        promptTemplate: 'Scrape and analyse this company website to extract key business intelligence:\n\n[Scrape Company URL]\n\nFrom the scraped content, extract:\n- What the company does (primary product/service)\n- Their target market and positioning\n- Any recent announcements, partnerships, or product launches visible on the site\n- Their messaging tone and key value propositions\n- Any hiring signals (careers page links, team growth mentions)\n\nOrganise this as a structured intelligence brief.',
        expectedOutput: 'A structured summary of the company based on live website data — what they do, how they position themselves, recent activity, and hiring signals.',
        tips: 'Enter the full URL including https://. For deeper intel, you can also enter specific pages like /pricing, /about, or /careers as separate comma-separated URLs.',
        tools: ['Firecrawl']
      },
      {
        id: 'step-1',
        stepNumber: 2,
        title: 'Gather Raw Intelligence',
        instruction: 'Go to perplexity.ai and search for comprehensive company intelligence. This will give you recent news, funding information, and competitive positioning in one query.',
        promptTemplate: `[Company Name] recent news funding leadership changes competitive positioning "hiring" OR "layoffs" 2024`,
        expectedOutput: 'A summary paragraph + 5-8 source links with snippets covering recent developments.',
        tips: 'No recent news? Add "site:linkedin.com" to find employee posts. Too generic? Add "AND [specific product line]" to narrow.',
        tools: ['Perplexity AI']
      },
      {
        id: 'step-2',
        stepNumber: 3,
        title: 'Deep Dive on Leadership',
        instruction: 'Use LinkedIn Sales Navigator to identify recent leadership changes and decision makers. Filter by "Changed jobs in last 90 days" to find new hires who are likely evaluating vendors.',
        expectedOutput: 'List of new hires with titles, start dates, previous companies, and any posts about priorities.',
        tips: 'New VPs in your target department are gold—they\'re building their tech stack and haven\'t chosen vendors yet.',
        tools: ['LinkedIn Sales Navigator']
      },
      {
        id: 'step-3',
        stepNumber: 4,
        title: 'Synthesize with AI',
        instruction: 'Use ChatGPT to synthesize all intelligence into a scannable brief. Copy your collected data into the prompt.',
        promptTemplate: `You're a senior business development strategist preparing for a call with [Company Name].

Based on this raw intelligence:
[Paste everything from your research]

Create a 1-page brief with:

**Company Snapshot**
- Primary business (one sentence)
- Recent momentum (funding, growth, headcount)
- Strategic priorities (based on leadership hires/posts)

**Key Stakeholders**
- 2-3 decision makers in [your target department] with their likely priorities

**3 Conversation Starters**
- Angle 1: Connect recent news to their business challenge
- Angle 2: Reference leadership change + your relevant experience  
- Angle 3: Industry trend they're facing + your insight

**Red Flags / Opportunities**
- Any budget cuts, hiring freezes, or expansion signals?

Format: Bullet points, scannable in 2 minutes.`,
        expectedOutput: 'Structured brief with company snapshot, stakeholders, conversation starters, and red flags.',
        tips: 'Save this prompt in a Google Doc titled "Account Brief Template - [Your Name]" for reuse.',
        tools: ['ChatGPT']
      },
      {
        id: 'step-4',
        stepNumber: 5,
        title: 'Save and Act',
        instruction: 'Create a standardized document for this account and schedule your outreach.',
        expectedOutput: 'Google Doc saved, calendar reminder set for follow-up, outreach scheduled within 48 hours.',
        tips: 'The best time to reach out is within 24 hours of a leadership change announcement. Speed beats perfection.'
      }
    ],
    relatedPlaybooks: [
      { id: '2', title: 'Cold Email Personalizer', slug: 'cold-email-personalizer' },
      { id: '3', title: 'CRM Data Enrichment', slug: 'crm-data-enrichment' },
      { id: '4', title: 'Competitive Battle Card', slug: 'competitive-battle-card' }
    ]
  },
  {
    id: '2',
    slug: 'expense-anomaly-detection',
    title: 'Expense Anomaly Detection',
    subtitle: 'Find unusual spending patterns in 5 minutes using AI',
    category: 'Finance',
    difficulty: 'Intermediate',
    timeToComplete: 10,
    timeSaved: 120,
    completionCount: 892,
    rating: 4.7,
    isPro: true,
    tools: ['ChatGPT', 'Excel'],
    beforeYouStart: [
      'Export of last 3 months expenses (CSV)',
      'ChatGPT Plus or Claude Pro',
      'Basic understanding of your expense categories'
    ],
    expectedOutcome: 'A categorized list of flagged transactions with risk scores and recommended actions.',
    troubleshooting: [
      {
        problem: 'Too many false positives',
        solution: 'Add more context about normal spending patterns in your prompt'
      },
      {
        problem: 'Sensitive data concerns',
        solution: 'Anonymize vendor names and amounts before uploading to AI'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Export Expense Data',
        instruction: 'Export your expense data from your accounting system (QuickBooks, Xero, etc.) as a CSV for the last 3 months.',
        expectedOutput: 'CSV file with columns: Date, Vendor, Category, Amount, Description',
        tools: ['Excel', 'QuickBooks']
      },
      {
        id: 'step-2',
        stepNumber: 2,
        title: 'Upload to AI',
        instruction: 'Upload your CSV to ChatGPT or Claude and ask it to analyze for anomalies.',
        promptTemplate: `Analyze this expense data for anomalies and unusual patterns. Look for:
1. Duplicate charges
2. Unusually large amounts per category
3. Unusual vendors
4. Spending spikes by category
5. Transactions outside business hours (if timestamp available)

Flag anything that looks suspicious with a risk score (Low/Medium/High) and explain why.`,
        expectedOutput: 'List of flagged transactions with explanations and risk scores.',
        tools: ['ChatGPT']
      }
    ],
    relatedPlaybooks: [
      { id: '11', title: 'Cash Flow Projection', slug: 'cash-flow-projection' },
      { id: '3', title: 'Vendor Performance Scorecard', slug: 'vendor-performance-scorecard' }
    ]
  },
  {
    id: '3',
    slug: 'vendor-performance-scorecard',
    title: 'Vendor Performance Scorecard',
    subtitle: 'Data-driven supplier evaluation in 15 minutes',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 180,
    completionCount: 634,
    rating: 4.6,
    isPro: true,
    tools: ['Claude', 'Sheets'],
    beforeYouStart: [
      'List of top 10 vendors',
      'Last 12 months of transaction data',
      'Any existing SLA metrics'
    ],
    expectedOutcome: 'A visual scorecard ranking vendors by performance with actionable recommendations.',
    troubleshooting: [
      {
        problem: 'Claude scores all vendors similarly with no clear differentiation',
        solution: 'Add hard numbers to your prompt — exact on-time delivery %, defect rates, and support ticket resolution times. Subjective descriptions produce flat scores; quantified data produces spread.'
      },
      {
        problem: 'Missing data for several vendors makes the scorecard incomplete',
        solution: 'For any vendor with gaps, add a "Data Unavailable" flag and exclude them from the ranking until data is collected. Do not let AI guess — instruct it: "If data is missing for a metric, score it N/A, not 0."'
      },
      {
        problem: 'The scorecard output is a wall of text instead of a scannable table',
        solution: 'Append to your prompt: "Output a markdown table with columns: Vendor, Score (1-5 per category), Total Score, and one-line recommendation. No prose explanations."'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Gather Vendor Data',
        instruction: 'Collect all relevant data about your vendors including spend, delivery times, quality scores, and support response times.',
        expectedOutput: 'Spreadsheet with vendor metrics.',
        tools: ['Sheets']
      }
    ],
    relatedPlaybooks: [
      { id: '2', title: 'Expense Anomaly Detection', slug: 'expense-anomaly-detection' },
      { id: '11', title: 'Cash Flow Projection', slug: 'cash-flow-projection' }
    ]
  },
  {
    id: '4',
    slug: 'cold-email-personalizer',
    title: 'Cold Email Personalizer',
    subtitle: 'Generate 50 personalized emails from a CSV in 15 minutes',
    category: 'Business Development',
    difficulty: 'Beginner',
    timeToComplete: 15,
    timeSaved: 120,
    completionCount: 2156,
    rating: 4.9,
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    tools: ['Claude', 'Apollo'],
    beforeYouStart: [
      'CSV with prospect names, companies, and LinkedIn URLs',
      'Your value proposition (one sentence)',
      'Claude Pro or ChatGPT Plus'
    ],
    expectedOutcome: '50 personalized cold emails with unique opening lines for each prospect.',
    troubleshooting: [
      {
        problem: 'Opening lines all sound the same despite different LinkedIn profiles',
        solution: 'Use a more specific signal: recent posts, job change dates, or company news. Replace "I noticed you work at X" with "Saw your post about Y last week" — specificity is what makes personalization feel real.'
      },
      {
        problem: 'Claude truncates or skips emails partway through the 50-contact batch',
        solution: 'Process in batches of 10-15 contacts at a time. Paste the first chunk, collect the output, then continue. Large batches hit context limits and produce degraded output.'
      },
      {
        problem: 'Apollo export is missing key fields like LinkedIn URL or company description',
        solution: 'In Apollo, manually add the "LinkedIn URL" and "Company Description" columns before exporting. Without these, Claude has nothing to personalize against — it will fall back to generic lines.'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Prepare Prospect List',
        instruction: 'Export your prospect list from Apollo or LinkedIn with name, company, title, and LinkedIn URL.',
        expectedOutput: 'CSV with prospect data.',
        tools: ['Apollo']
      }
    ],
    relatedPlaybooks: [
      { id: '1', title: 'Account Research Brief', slug: 'account-research-brief' },
      { id: '5', title: 'CRM Data Enrichment', slug: 'crm-data-enrichment' }
    ]
  },
  {
    id: '5',
    slug: 'crm-data-enrichment',
    title: 'CRM Data Enrichment',
    subtitle: 'Auto-fill missing lead data using AI lookup',
    category: 'Sales Ops',
    difficulty: 'Intermediate',
    timeToComplete: 20,
    timeSaved: 200,
    completionCount: 1567,
    rating: 4.7,
    isPro: true,
    coworkCompatible: true,
    tools: ['Clay', 'ChatGPT'],
    beforeYouStart: [
      'CRM export with email addresses',
      'Clay account (free tier works)',
      'List of fields to enrich'
    ],
    expectedOutcome: 'Enriched CRM data with company size, industry, tech stack, and decision maker info.',
    troubleshooting: [
      {
        problem: 'Clay waterfall lookup returns blank results for many contacts',
        solution: 'Check that email format is clean — no extra spaces, malformed domains, or role-based addresses (info@, hello@). Clay enrichment fails silently on malformed emails. Run a quick email validation step first.'
      },
      {
        problem: 'Tech stack data is stale or inaccurate',
        solution: 'Cross-check high-value accounts using BuiltWith or Wappalyzer directly. Clay\'s tech data is scraped and can lag by weeks — for enterprise deals, verify manually before outreach.'
      },
      {
        problem: 'CRM import creates duplicate contacts instead of enriching existing ones',
        solution: 'Before re-importing, deduplicate your export using the email field as the unique key. In HubSpot or Salesforce, use the "Upsert" option (match on email) instead of "Create New" to update existing records.'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Export CRM Data',
        instruction: 'Export your leads from your CRM with at minimum email addresses.',
        expectedOutput: 'CSV with lead data.',
        tools: ['Salesforce', 'HubSpot']
      }
    ],
    relatedPlaybooks: [
      { id: '4', title: 'Cold Email Personalizer', slug: 'cold-email-personalizer' },
      { id: '8', title: 'Pipeline Health Report', slug: 'pipeline-health-report' }
    ]
  },
  {
    id: '6',
    slug: 'proposal-first-draft',
    title: 'Proposal First Draft',
    subtitle: 'Turn discovery notes into client-ready proposal',
    category: 'Business Development',
    difficulty: 'Advanced',
    timeToComplete: 30,
    timeSaved: 180,
    completionCount: 923,
    rating: 4.8,
    isPro: true,
    tools: ['ChatGPT', 'Docs'],
    beforeYouStart: [
      'Discovery call notes',
      'Previous winning proposal (for tone)',
      'Pricing sheet'
    ],
    expectedOutcome: 'A complete first draft proposal ready for review and customization.',
    troubleshooting: [
      {
        problem: 'The proposal draft feels generic and could apply to any client',
        solution: 'Paste direct quotes from the discovery call into your prompt. Real language from the prospect — their exact words about their problem — forces Claude to write a proposal that sounds like it was written specifically for them.'
      },
      {
        problem: 'Pricing section comes out vague or inconsistent with your actual rates',
        solution: 'Never ask Claude to guess at pricing. Provide a locked pricing table in your prompt: "Use exactly these line items and prices: [paste your rate card]." Claude\'s job is structure and language, not price-setting.'
      },
      {
        problem: 'The tone does not match your previous winning proposals',
        solution: 'Upload a redacted version of a past winning proposal and say: "Match the tone, structure, and sentence length of this document exactly." Claude will adapt its style to yours rather than defaulting to generic consulting speak.'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Compile Discovery Notes',
        instruction: 'Organize all notes from discovery calls including pain points, goals, and timeline.',
        expectedOutput: 'Structured discovery document.',
        tools: ['Docs', 'Notion']
      }
    ],
    relatedPlaybooks: [
      { id: '1', title: 'Account Research Brief', slug: 'account-research-brief' },
      { id: '7', title: 'Competitive Battle Card', slug: 'competitive-battle-card' }
    ]
  },
  {
    id: '7',
    slug: 'competitive-battle-card',
    title: 'Competitive Battle Card',
    subtitle: 'One-page sales aid for any competitor',
    category: 'Business Development',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 90,
    completionCount: 1845,
    rating: 4.6,
    isPro: false,
    tools: ['Perplexity', 'Slides'],
    beforeYouStart: [
      'Competitor name',
      'Your key differentiators',
      'Recent competitor news'
    ],
    expectedOutcome: 'A one-page battle card with competitor weaknesses and your strengths.',
    troubleshooting: [
      {
        problem: 'Perplexity returns very little intelligence on a private or lesser-known competitor',
        solution: 'Search their G2, Capterra, and Trustpilot review pages directly. Customer reviews reveal real weaknesses that company websites hide. Search "site:g2.com [competitor name] reviews" for unfiltered feedback.'
      },
      {
        problem: 'The battle card lists features instead of objection-handling rebuttals',
        solution: 'Reframe your prompt: "For each competitor strength, write a one-sentence rebuttal a sales rep can say in a live call. Do not list features — write spoken responses to objections."'
      },
      {
        problem: 'Battle card becomes outdated within weeks',
        solution: 'Set a Perplexity alert or Google Alert for the competitor\'s name. When pricing or product news hits, update just the affected section — do not rebuild the whole card from scratch.'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Research Competitor',
        instruction: 'Use Perplexity to gather recent intel on your competitor.',
        expectedOutput: 'Competitor intelligence summary.',
        tools: ['Perplexity']
      }
    ],
    relatedPlaybooks: [
      { id: '6', title: 'Proposal First Draft', slug: 'proposal-first-draft' },
      { id: '1', title: 'Account Research Brief', slug: 'account-research-brief' }
    ]
  },
  {
    id: '8',
    slug: 'pipeline-health-report',
    title: 'Pipeline Health Report',
    subtitle: 'AI-powered risk scoring and action items',
    category: 'Sales Ops',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 90,
    completionCount: 745,
    rating: 4.5,
    isPro: true,
    tools: ['Claude', 'Salesforce'],
    beforeYouStart: [
      'CRM pipeline export',
      'Historical win/loss data',
      'Sales stage definitions'
    ],
    expectedOutcome: 'Risk-scored pipeline with recommended actions for each at-risk deal.',
    troubleshooting: [
      {
        problem: 'Claude flags nearly every deal as high-risk, making the report useless',
        solution: 'Add baseline context: "Our average sales cycle is [X] days. A deal is only high-risk if it has had no activity in [2x average] days or has missed a defined stage milestone." Without benchmarks, Claude has no reference for what "risky" means.'
      },
      {
        problem: 'Salesforce export is missing last activity date or contact fields',
        solution: 'Add "Last Activity Date", "Last Modified Date", and "Primary Contact" columns to your Salesforce report before exporting. These are the key signals Claude uses to assess deal momentum.'
      },
      {
        problem: 'Pipeline report does not reflect deals that were verbally updated but not logged',
        solution: 'Before running the analysis, spend 5 minutes updating deal stages and last contact dates in your CRM. Garbage in, garbage out — the AI can only act on what is in the data.'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Export Pipeline',
        instruction: 'Export your current pipeline with all relevant fields.',
        expectedOutput: 'Pipeline CSV.',
        tools: ['Salesforce']
      }
    ],
    relatedPlaybooks: [
      { id: '5', title: 'CRM Data Enrichment', slug: 'crm-data-enrichment' },
      { id: '4', title: 'Cold Email Personalizer', slug: 'cold-email-personalizer' }
    ]
  },
  {
    id: '9',
    slug: 'content-calendar-generator',
    title: 'Content Calendar Generator',
    subtitle: '30-day editorial calendar from product updates',
    category: 'Marketing',
    difficulty: 'Beginner',
    timeToComplete: 20,
    timeSaved: 180,
    completionCount: 1123,
    rating: 4.7,
    isPro: false,
    tools: ['ChatGPT', 'Notion'],
    beforeYouStart: [
      'List of product features/updates',
      'Target audience personas',
      'Content themes/pillars'
    ],
    expectedOutcome: 'A complete 30-day content calendar with topics, formats, and publishing dates.',
    troubleshooting: [
      {
        problem: 'Calendar is too promotional and lacks variety',
        solution: 'Use the 80/20 rule in your prompt: "80% of posts should educate, entertain, or inspire. Only 20% should directly promote the product. Mark each post type clearly."'
      },
      {
        problem: 'ChatGPT generates content ideas unrelated to product updates',
        solution: 'Paste your specific product updates list as numbered items in the prompt and add: "Every content idea must trace back to at least one item from this product update list — do not invent topics."'
      },
      {
        problem: 'Content calendar does not reflect seasonal events or key dates',
        solution: 'Add a "Key Dates" section to your prompt: list upcoming product launches, industry events, holidays, or campaign milestones. Claude will anchor appropriate content to those anchors automatically.'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'List Product Updates',
        instruction: 'Compile all recent and upcoming product updates.',
        expectedOutput: 'Product update list.',
        tools: ['Notion']
      }
    ],
    relatedPlaybooks: [
      { id: '10', title: 'SEO Brief Writer', slug: 'seo-brief-writer' },
      { id: '4', title: 'Cold Email Personalizer', slug: 'cold-email-personalizer' }
    ]
  },
  {
    id: '10',
    slug: 'seo-brief-writer',
    title: 'SEO Brief Writer',
    subtitle: 'Complete content brief from target keyword',
    category: 'Marketing',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 90,
    completionCount: 892,
    rating: 4.6,
    isPro: true,
    tools: ['Perplexity', 'ChatGPT'],
    beforeYouStart: [
      'Target keyword',
      'Competitor content analysis',
      'Search intent understanding'
    ],
    expectedOutcome: 'A comprehensive SEO content brief with outline, keywords, and angle.',
    troubleshooting: [
      {
        problem: 'The content brief outlines a generic article that mirrors existing top results',
        solution: 'Add a differentiation instruction: "Identify one angle or sub-topic that none of the top 10 ranking pages cover well. Build the brief around that gap — the goal is to add something new, not rewrite what already exists."'
      },
      {
        problem: 'Perplexity returns SERP data but misses long-tail semantic keywords',
        solution: 'Supplement Perplexity with "People Also Ask" and "Related Searches" from Google itself. Paste those questions into ChatGPT and ask it to group them by sub-topic to build the H2/H3 outline.'
      },
      {
        problem: 'Brief is too long and writers are not sure what to prioritize',
        solution: 'Add a "Must-Cover" vs "Nice-to-Have" section at the top of the brief. Prompt: "Flag the 3 sections that are non-negotiable for ranking and mark the rest as supplementary."'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Research Keyword',
        instruction: 'Use Perplexity to analyze top-ranking content for your target keyword.',
        expectedOutput: 'Competitor content analysis.',
        tools: ['Perplexity']
      }
    ],
    relatedPlaybooks: [
      { id: '9', title: 'Content Calendar Generator', slug: 'content-calendar-generator' },
      { id: '4', title: 'Cold Email Personalizer', slug: 'cold-email-personalizer' }
    ]
  },
  {
    id: '11',
    slug: 'cash-flow-projection',
    title: 'Cash Flow Projection',
    subtitle: '13-week rolling forecast from historical data',
    category: 'Finance',
    difficulty: 'Advanced',
    timeToComplete: 45,
    timeSaved: 300,
    completionCount: 567,
    rating: 4.8,
    isPro: true,
    tools: ['ChatGPT', 'Excel'],
    beforeYouStart: [
      '12 months of financial data',
      'Upcoming known expenses',
      'Revenue forecast assumptions'
    ],
    expectedOutcome: 'A 13-week cash flow projection with scenario planning.',
    troubleshooting: [
      {
        problem: 'Projection shows steady positive cash flow but you know payroll hits create dips',
        solution: 'Add payroll dates explicitly to your data: "Payroll of $[X] goes out on the 15th and last day of each month. Build these into the weekly outflow rows." ChatGPT will not know your pay schedule unless you state it.'
      },
      {
        problem: 'The 13-week projection ignores large one-time upcoming costs',
        solution: 'List known future expenses in your prompt as line items with dates: "Upcoming known expenses: $15k tax payment due Week 4, $8k equipment lease renewal Week 9." The model will slot them into the correct weeks.'
      },
      {
        problem: 'Excel formula errors after pasting AI-generated output into the spreadsheet',
        solution: 'Ask ChatGPT to output only values, not formulas: "Do not use Excel formulas. Give me final calculated numbers for each cell so I can paste as values only." Then add your own SUM formulas on top.'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Export Financial Data',
        instruction: 'Export P&L and cash flow data for the last 12 months.',
        expectedOutput: 'Financial data spreadsheet.',
        tools: ['Excel', 'QuickBooks']
      }
    ],
    relatedPlaybooks: [
      { id: '2', title: 'Expense Anomaly Detection', slug: 'expense-anomaly-detection' },
      { id: '3', title: 'Vendor Performance Scorecard', slug: 'vendor-performance-scorecard' }
    ]
  },
  {
    id: '12',
    slug: 'job-description-optimizer',
    title: 'Job Description Optimizer',
    subtitle: 'Market-competitive JD from rough requirements',
    category: 'HR',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 90,
    completionCount: 1456,
    rating: 4.5,
    isPro: false,
    tools: ['Claude', 'Docs'],
    beforeYouStart: [
      'Rough job requirements',
      'Salary range',
      'Company benefits list'
    ],
    expectedOutcome: 'A polished, inclusive job description optimized for applicant conversion.',
    troubleshooting: [
      {
        problem: 'The JD lists too many required qualifications and may deter qualified candidates',
        solution: 'Ask Claude to audit the requirements list: "Review these requirements and identify any that are preferences rather than true blockers. Move them to a \'Nice to Have\' section — studies show long requirement lists disproportionately discourage strong candidates from applying."'
      },
      {
        problem: 'Salary range is not included and candidates keep asking before applying',
        solution: 'Add the salary range. Even a wide band (e.g. "$80,000–$110,000 depending on experience") increases qualified application volume by 30–40%. Ask Claude: "Add a salary transparency section that presents this range positively."'
      },
      {
        problem: 'JD reads as corporate filler and does not reflect the team culture',
        solution: 'Paste 2-3 sentences your current team members would use to describe what makes the role great. Ask Claude: "Weave this authentic language into the opening without sounding like a press release."'
      }
    ],
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Input Requirements',
        instruction: 'List all requirements, nice-to-haves, and role responsibilities.',
        expectedOutput: 'Requirements document.',
        tools: ['Docs']
      }
    ],
    relatedPlaybooks: [
      { id: '9', title: 'Content Calendar Generator', slug: 'content-calendar-generator' },
      { id: '10', title: 'SEO Brief Writer', slug: 'seo-brief-writer' }
    ]
  },
  {
    id: '13',
    slug: 'investment-banking-deal-brief',
    title: 'Investment Banking Deal Brief',
    subtitle: 'Generate a full M&A target brief from public filings in 30 minutes',
    category: 'Investment Banking',
    difficulty: 'Advanced',
    timeToComplete: 30,
    timeSaved: 480,
    completionCount: 312,
    rating: 4.9,
    isPro: true,
    isNew: true,
    coworkCompatible: true,
    tools: ['Claude', 'FactSet', 'Excel'],
    beforeYouStart: [
      'Target company name and ticker (if public)',
      'Access to FactSet, Bloomberg, or public SEC filings',
      'Deal thesis or acquisition rationale'
    ],
    expectedOutcome: 'A comprehensive 2-page deal brief covering financials, strategic rationale, key risks, and comparables—ready for the first IC meeting.',
    troubleshooting: [
      {
        problem: 'FactSet data does not match the figures in the target\'s SEC filings',
        solution: 'Always reconcile against the 10-K as the authoritative source. FactSet sometimes uses adjusted vs GAAP figures — clarify in your prompt which basis you are using ("Use GAAP EBITDA as reported, not adjusted") to ensure consistency across all three steps.'
      },
      {
        problem: 'Claude\'s strategic rationale bullets are vague and could describe any acquisition',
        solution: 'Provide specific financial context: synergy estimates, exact market share numbers, and the acquirer\'s stated strategic gaps from their last earnings call or investor day materials. Specificity is what separates a credible IC memo from a generic one.'
      },
      {
        problem: 'Comps table implied valuation range is too wide to be actionable',
        solution: 'Remove clear outliers before pasting the comps set. If one comparable traded at a distressed multiple during a crisis quarter, exclude it and note why. A tighter comps set of 3-4 truly comparable companies produces a more defensible range than 8 noisy ones.'
      }
    ],
    steps: [
      {
        id: '13-s1',
        stepNumber: 1,
        title: 'Pull Financial Summary',
        instruction: 'Gather the last 3 years of revenue, EBITDA, and net income from filings or FactSet. Upload to Claude.',
        promptTemplate: `You are an investment banking analyst. Here is 3 years of financial data for [Company Name]:\n[Paste financials]\n\nSummarize: revenue CAGR, EBITDA margins, debt profile, and 2 key financial risks in a table format.`,
        expectedOutput: 'A clean financial summary table with growth and margin analysis.'
      },
      {
        id: '13-s2',
        stepNumber: 2,
        title: 'Strategic Rationale & Synergies',
        instruction: 'Describe the acquirer and ask Claude to build the strategic rationale.',
        promptTemplate: `Acquirer: [Company A]. Target: [Company B].\n\nAcquirer\'s core business: [brief description].\nWrite a 3-bullet strategic rationale for this acquisition covering: market expansion, synergies (cost/revenue), and capability gaps filled. Follow standard IB tone.`,
        expectedOutput: '3-bullet strategic rationale ready for an IC memo.'
      },
      {
        id: '13-s3',
        stepNumber: 3,
        title: 'Comparable Company Analysis',
        instruction: 'List 5 comparable public companies and ask Claude to format a comps table.',
        promptTemplate: `Here are 5 comparable companies to [Target] with their EV/EBITDA and EV/Revenue multiples:\n[Paste comps data]\n\nFormat this as a clean comps table. Calculate the median and mean multiples and apply them to [Target]\'s LTM EBITDA of $[X]M to produce an implied valuation range.`,
        expectedOutput: 'A formatted comps table with implied valuation range.'
      }
    ],
    relatedPlaybooks: [
      { id: '14', title: 'Equity Research Note', slug: 'equity-research-note' },
      { id: '2', title: 'Expense Anomaly Detection', slug: 'expense-anomaly-detection' }
    ]
  },
  {
    id: '14',
    slug: 'equity-research-note',
    title: 'Equity Research Note',
    subtitle: 'Draft a buy/sell initiation note from earnings data in 20 minutes',
    category: 'Equity Research',
    difficulty: 'Advanced',
    timeToComplete: 20,
    timeSaved: 360,
    completionCount: 198,
    rating: 4.8,
    isPro: true,
    isNew: true,
    coworkCompatible: true,
    tools: ['Claude', 'S&P Global', 'Excel'],
    beforeYouStart: [
      'Latest earnings transcript or press release',
      'Last 2 years of financial model data',
      'Your investment thesis (bull/bear)'
    ],
    expectedOutcome: 'A structured equity research initiation note with investment thesis, key catalysts, risks, and a 12-month price target rationale.',
    troubleshooting: [
      {
        problem: 'Claude writes an investment thesis in casual language instead of institutional research style',
        solution: 'Add a style constraint: "Write in the style of a Goldman Sachs or Morgan Stanley initiation note. Use precise financial terminology, avoid colloquialisms, and never use the word \'exciting\' or \'promising\'." Then paste a sentence from a real research note as a tone example.'
      },
      {
        problem: 'Earnings call summary misses key guidance changes because the transcript is too long',
        solution: 'If the transcript exceeds Claude\'s context window, split it into sections: management prepared remarks, Q&A section. Process each part separately and ask Claude to consolidate the key signals at the end. Always include the CFO\'s guidance remarks — they are the highest-signal section.'
      },
      {
        problem: 'Price target methodology feels circular or unsubstantiated',
        solution: 'Ground the DCF with a WACC calculation you provide: "Our WACC of X% is based on a risk-free rate of Y%, equity risk premium of Z%, and beta of W." Claude cannot derive a defensible discount rate without your inputs — provide them explicitly.'
      }
    ],
    steps: [
      {
        id: '14-s1',
        stepNumber: 1,
        title: 'Summarize the Earnings Call',
        instruction: 'Paste the earnings transcript into Claude to extract the key signals.',
        promptTemplate: `You are a sell-side equity analyst. Read this earnings call transcript for [Company]:\n[Paste transcript]\n\nExtract: 1) Management\'s top 3 priorities, 2) Any guidance changes, 3) The 2 most important analyst questions and answers. Format as bullet points.`,
        expectedOutput: 'A concise earnings call summary with key management signals.'
      },
      {
        id: '14-s2',
        stepNumber: 2,
        title: 'Build the Investment Thesis',
        instruction: 'Provide your bull case and ask Claude to structure it into a formal note.',
        promptTemplate: `Write a 3-paragraph equity research investment thesis for [Company] (ticker: [TICKER]).\nMy bull case is: [Your thesis in plain English].\nUse formal sell-side research language. Include: why now, the key catalyst, and the primary risk to the thesis.`,
        expectedOutput: 'A 3-paragraph formal investment thesis suitable for a research note.'
      },
      {
        id: '14-s3',
        stepNumber: 3,
        title: 'Price Target & Valuation Summary',
        instruction: 'Provide your model assumptions and have Claude write the valuation section.',
        promptTemplate: `Base case assumptions for [Company]: revenue growth of [X]%, EBITDA margins expanding to [Y]%, discount rate [Z]%.\nCurrent price: $[P]. My DCF implies a 12-month price target of $[T].\n\nWrite a 2-paragraph valuation section for a research note explaining the PT methodology and what would cause us to be wrong.`,
        expectedOutput: 'A concise valuation section with price target rationale and key risk to our view.'
      }
    ],
    relatedPlaybooks: [
      { id: '13', title: 'Investment Banking Deal Brief', slug: 'investment-banking-deal-brief' },
      { id: '15', title: 'Private Equity Deal Screener', slug: 'private-equity-deal-screener' }
    ]
  },
  {
    id: '15',
    slug: 'private-equity-deal-screener',
    title: 'Private Equity Deal Screener',
    subtitle: 'Score and rank 10 inbound deals against your fund thesis in 15 minutes',
    category: 'Private Equity',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 240,
    completionCount: 156,
    rating: 4.7,
    isPro: true,
    isNew: true,
    coworkCompatible: true,
    tools: ['Claude', 'Excel', 'Outreach'],
    beforeYouStart: [
      'List of inbound deals (CIM or one-pagers)',
      'Your fund\'s investment criteria (size, sector, geography)',
      'Minimum return thresholds (IRR/MOIC targets)'
    ],
    expectedOutcome: 'A ranked scoring sheet of all inbound deals with a pass/pursue recommendation and a one-line rationale for each.',
    troubleshooting: [
      {
        problem: 'All deals score similarly and there is no clear separation between pursue and pass',
        solution: 'Introduce a hard filter before scoring: any deal below $X EBITDA or outside your sector focus is automatically a pass with no score. Apply the rubric only to deals that clear the filter — this keeps the scoring focused on genuine candidates.'
      },
      {
        problem: 'CIM summaries are too brief for Claude to give meaningful scores on some criteria',
        solution: 'For thin one-pagers, ask Claude to flag which criteria cannot be scored due to insufficient data: "If the CIM does not provide enough detail to score a criterion, write N/A and note what information would be needed." This keeps your pipeline tracker honest.'
      },
      {
        problem: 'The rubric does not penalize deals with obvious structural risks like customer concentration',
        solution: 'Add a red flag override to your rubric prompt: "If any deal has customer concentration above 40% in a single client, cap the total score at 12/25 regardless of other criteria, and flag it as a structural risk."'
      }
    ],
    steps: [
      {
        id: '15-s1',
        stepNumber: 1,
        title: 'Define Your Scoring Rubric',
        instruction: 'Tell Claude your criteria so it can build a consistent scoring framework.',
        promptTemplate: `You are a private equity associate. Our fund invests in [Sector], targeting [revenue range] businesses with [EBITDA margin] margins. Our return target is [X]x MOIC.\n\nCreate a deal scoring rubric with 5 criteria (each scored 1-5) that I can apply consistently to every inbound CIM. Output as a table.`,
        expectedOutput: 'A 5-criteria scoring table with descriptions for each score level (1-5).'
      },
      {
        id: '15-s2',
        stepNumber: 2,
        title: 'Score Each Deal',
        instruction: 'For each deal, paste the one-pager and apply the rubric.',
        promptTemplate: `Using the rubric we built, score this deal:\n[Paste CIM summary or one-pager for Deal X]\n\nScore each of the 5 criteria 1-5, provide a total score out of 25, and give a one-sentence rationale for each score.`,
        expectedOutput: 'A scored row for this deal, ready to add to your tracker.'
      },
      {
        id: '15-s3',
        stepNumber: 3,
        title: 'Generate Pass/Pursue Recommendations',
        instruction: 'After scoring all deals, paste the full tracker and get final recommendations.',
        promptTemplate: `Here is our deal pipeline tracker with scores for [N] deals:\n[Paste full scoring table]\n\nRank them from highest to lowest score. For any deal scoring above 18/25, write a 1-sentence "pursue" rationale. For any below 12/25, write a 1-sentence pass rationale.`,
        expectedOutput: 'A ranked deal list with pursue/pass recommendations ready to share with the IC.'
      }
    ],
    relatedPlaybooks: [
      { id: '13', title: 'Investment Banking Deal Brief', slug: 'investment-banking-deal-brief' },
      { id: '16', title: 'Wealth Management Client Brief', slug: 'wealth-management-client-brief' }
    ]
  },
  {
    id: '16',
    slug: 'wealth-management-client-brief',
    title: 'Wealth Management Client Brief',
    subtitle: 'Build a personalized portfolio review brief for HNW client meetings in 10 minutes',
    category: 'Wealth Management',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 120,
    completionCount: 423,
    rating: 4.8,
    isPro: true,
    isNew: true,
    coworkCompatible: true,
    tools: ['Claude', 'Excel', 'MSCI'],
    beforeYouStart: [
      'Client portfolio summary (asset allocation, top 10 holdings)',
      'Client\'s stated goals and risk tolerance',
      'Last quarter\'s performance vs benchmark'
    ],
    expectedOutcome: 'A 1-page personalized client meeting brief covering portfolio performance, allocation commentary, and 3 concrete recommendations—ready to print or email before the meeting.',
    troubleshooting: [
      {
        problem: 'The performance narrative uses jargon the client will not understand',
        solution: 'Add a readability rule: "Explain every financial term the first time it appears. Never assume the client knows what \'duration\', \'basis points\', or \'overweight\' means. Write for a smart non-finance professional."'
      },
      {
        problem: 'Recommendations feel generic and not specific to this client\'s situation',
        solution: 'Reference the client\'s specific goal or life event in every recommendation. A client saving for a home purchase needs different framing than one in drawdown. Paste the client\'s IPS summary or goal notes into the prompt to force specificity.'
      },
      {
        problem: 'MSCI or benchmark comparison data is not available for the period',
        solution: 'Use a proxy benchmark if the specific index is unavailable. For a 60/40 portfolio, a blended 60% S&P 500 / 40% Bloomberg Aggregate return is widely understood. State the benchmark clearly so the client knows what they are being compared against.'
      }
    ],
    steps: [
      {
        id: '16-s1',
        stepNumber: 1,
        title: 'Performance Summary',
        instruction: 'Share portfolio performance data and ask Claude to write the performance section.',
        promptTemplate: `Client: [Name], Risk Profile: [Conservative/Moderate/Aggressive].\nPortfolio return last quarter: [X]%. Benchmark (S&P 500): [Y]%.\nTop performer: [Asset]. Laggard: [Asset].\n\nWrite a 2-paragraph performance summary in plain English suitable for a high-net-worth client. Avoid jargon. Acknowledge underperformance honestly if applicable.`,
        expectedOutput: 'A client-ready 2-paragraph performance section.'
      },
      {
        id: '16-s2',
        stepNumber: 2,
        title: 'Allocation & Market Commentary',
        instruction: 'Get Claude to contextualize the portfolio relative to current market conditions.',
        promptTemplate: `The client\'s current allocation is: [X]% equities, [Y]% fixed income, [Z]% alternatives/cash.\nTheir target allocation is: [paste targets].\n\nWrite a 1-paragraph commentary explaining if the portfolio is on-track with their goals and briefly connect it to current macro conditions (rising rates, equity valuations, etc.).`,
        expectedOutput: 'A 1-paragraph allocation commentary ready for the meeting brief.'
      },
      {
        id: '16-s3',
        stepNumber: 3,
        title: 'Generate 3 Recommendations',
        instruction: 'Ask Claude to turn your notes into 3 specific, actionable client recommendations.',
        promptTemplate: `Based on the client\'s goals [Goal], risk profile [Profile], and current allocation drift, I am thinking about: [Your rough ideas for rebalancing].\n\nTurn these into 3 clear, client-friendly recommendations formatted as:\n• Recommendation: [Action]\n• Why: [1-sentence rationale]\n• Suggested timeline: [Immediate / Next 30 days / Review at next meeting]`,
        expectedOutput: '3 formatted, client-ready recommendations to present in the meeting.'
      }
    ],
    relatedPlaybooks: [
      { id: '15', title: 'Private Equity Deal Screener', slug: 'private-equity-deal-screener' },
      { id: '11', title: 'Cash Flow Projection', slug: 'cash-flow-projection' }
    ]
  },
  {
    id: 'vc-1',
    slug: 'ultimate-vibe-coding-prompt',
    title: 'The Ultimate Vibe Coding Prompt',
    subtitle: 'Turn any idea into a real, working product — with AI as your technical co-founder guiding you from discovery to deployment.',
    category: 'AI Development',
    difficulty: 'Intermediate',
    timeToComplete: 60,
    timeSaved: 480,
    completionCount: 3120,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Cursor', 'v0.dev', 'ChatGPT'],
    beforeYouStart: [
      'Have your product idea written down — even a rough 2-sentence version',
      'Access to Claude, ChatGPT, or Cursor (any one works)',
      'Decide honestly: are you exploring, building for yourself, or launching publicly?',
      'Block 60–90 minutes of uninterrupted time — this is a building session, not a browsing session'
    ],
    expectedOutcome: 'A real, working v1 product — not a mockup, not a prototype. Something you can use, share, or launch. Plus a full handoff document so you\'re never dependent on a single AI conversation.',
    troubleshooting: [
      {
        problem: 'AI gives me a plan but never starts building',
        solution: 'Add "Stop planning. Start building Step 1 right now. Show me actual code." to your message.'
      },
      {
        problem: 'The build got too complicated too fast',
        solution: 'Type: "Pause. What is the absolute minimum version of this that works? Build only that." Then expand later.'
      },
      {
        problem: 'AI keeps asking clarifying questions instead of building',
        solution: 'Say: "Make reasonable assumptions and build. List what you assumed at the end. I\'ll correct anything wrong."'
      },
      {
        problem: 'The output looks like a hackathon project',
        solution: 'Run Phase 4 again with: "Audit everything for polish. Pretend a design-obsessed founder is reviewing this in 10 minutes."'
      },
      {
        problem: 'I got lost and don\'t know what stage we\'re in',
        solution: 'Type: "Summarise what we\'ve built so far, what phase we\'re in, and what the next 3 steps are."'
      },
      {
        problem: 'The AI made a decision I don\'t agree with',
        solution: 'You\'re the product owner. Say "I don\'t want that approach. Give me 3 alternatives and the trade-offs for each."'
      }
    ],
    steps: [
      {
        id: 'vc-1-s1',
        stepNumber: 1,
        title: 'Activate Your Technical Co-Founder',
        instruction: 'Start a new conversation in Claude, ChatGPT, or Cursor. Paste the master prompt below — this is the operating system for the entire build session. Fill in your idea and seriousness level before sending. Be as specific as possible about your idea. The more real detail you give, the more real the output.',
        promptTemplate: `You are now my Technical Co-Founder. Your job is to help me build a real product I can use, share, or launch. Handle all the building, but keep me in the loop and in control at all times.

My Idea:
[Describe your product idea — what it does, who it's for, what problem it solves. Be specific. Include: the target user, their pain point, and what your product does differently.]

How serious I am:
[Choose one: Just exploring / I want to use this myself / I want to share it with others / I want to launch it publicly]

Operating Rules for this session:
- Treat me as the product owner. I make the decisions, you make them happen.
- Translate all technical decisions into plain language before acting.
- Push back if I'm overcomplicating things or heading in a bad direction.
- Be honest about limitations — I'd rather adjust than be disappointed.
- Never just pick an option — always give me 2-3 choices at decision points.
- Move fast, but not so fast that I lose track of what's happening.
- I don't just want it to work — I want to be proud to show it to people.
- This is real. Not a mockup. Not a prototype. A working product.

Start with Phase 1: Discovery. Ask me the 3-5 most important questions to understand what I actually need — not just what I said.`,
        expectedOutput: 'The AI acknowledges the brief and asks 3–5 sharp discovery questions that challenge your assumptions and uncover what you actually need.',
        tips: 'Don\'t skip filling in the variables. A vague idea gets a vague product. Write your idea like you\'re pitching it to a friend who will invest $500 in it.',
        tools: ['Claude', 'ChatGPT', 'Cursor']
      },
      {
        id: 'vc-1-s2',
        stepNumber: 2,
        title: 'Phase 1 — Discovery (Answer the Hard Questions)',
        instruction: 'Answer the AI\'s discovery questions honestly. Don\'t pad your answers — the AI is trying to find the gap between what you said and what you actually need. After answering, send the follow-up prompt below to push it into planning mode. If the AI challenges your idea, engage with it — it may be saving you from building the wrong thing.',
        promptTemplate: `[Answer each question above with as much specific detail as you can.]

Additional context:
- The "must have now" features are: [List 2-3 core features you absolutely need for v1]
- Features I want later but NOT now: [List anything that feels like scope creep]
- The one thing that would make me say "this is worth it": [Your success metric]

Now: Based on everything above, tell me if my idea is the right size for v1. If it's too big, suggest a smarter starting point. If it's right-sized, move to Phase 2: Planning.`,
        expectedOutput: 'A clear verdict: is your v1 idea the right size? If yes, you proceed to planning. If not, the AI proposes a tighter starting point that you can actually finish today.',
        tips: 'When the AI says "this is too big," listen. A smaller v1 you actually finish beats a grand vision you never ship. You can always build v2.',
        tools: ['Claude', 'ChatGPT', 'Cursor']
      },
      {
        id: 'vc-1-s3',
        stepNumber: 3,
        title: 'Phase 2 — Planning (Lock the Blueprint)',
        instruction: 'Review the plan the AI proposes. Check that it covers exactly what you need — nothing more, nothing less. Before approving, run the prompt below to pressure-test it. Only move to building once you\'re satisfied with the plan. This is the cheapest moment to make changes.',
        promptTemplate: `Before we build, I want to pressure-test the plan. Answer these in plain language:

1. What exactly will a user see and do in v1? Walk me through it step by step.
2. What accounts, services, or tools will I need to set this up? (Be complete — include anything that requires signup or payment)
3. What are the 2-3 biggest technical risks in this plan, and how are we handling each one?
4. Complexity check: rate this as Simple / Medium / Ambitious and explain why.
5. Show me a rough wireframe or text outline of the finished product.

If anything in the plan is unclear or I disagree with an approach, I'll say so now. Otherwise, I'll say "Approved — start Phase 3."`,
        expectedOutput: 'A complete, plain-language blueprint: what gets built, what you need, the risks, the complexity rating, and a text outline of the finished product.',
        tips: 'Read the "accounts and services" list carefully. Discovering you need a paid API at Phase 4 kills momentum. Resolve all dependencies before you say "approved."',
        tools: ['Claude', 'ChatGPT', 'Cursor']
      },
      {
        id: 'vc-1-s4',
        stepNumber: 4,
        title: 'Phase 3 — Building (Staged Construction)',
        instruction: 'Tell the AI to start building. It will work in stages you can see and react to — never moving forward without showing you what it built. Use the prompt below to kick off the build. At each checkpoint, test what was built before saying "continue." If something\'s wrong, say so immediately rather than waiting until the end.',
        promptTemplate: `Approved. Start Phase 3: Building.

Build in stages. After each stage:
1. Show me exactly what was built (code, output, or screenshot if possible)
2. Explain what you just did in one plain-language sentence
3. Tell me what to test before you continue
4. List any decision points that need my input before proceeding

Start with Stage 1. Only move to Stage 2 after I confirm Stage 1 works.

If you hit a problem or a fork in the road, stop and give me the options with trade-offs — don't just pick one.`,
        expectedOutput: 'A working Stage 1 of your product — something you can actually see, click, or test. Clear explanation of what was built, what to test, and what comes next.',
        tips: 'Test every stage before saying "continue." Bugs are 10x harder to fix after 3 more stages are built on top of them. The best vibe coders are ruthless testers.',
        tools: ['Claude', 'Cursor', 'v0.dev']
      },
      {
        id: 'vc-1-s5',
        stepNumber: 5,
        title: 'Phase 4 — Polish (From Working to Impressive)',
        instruction: 'Once the core is built and working, run the polish phase. This is what separates a project that looks like it was built in an afternoon from one you\'re proud to show people. Paste the prompt below and give the AI one complete pass to audit and fix everything.',
        promptTemplate: `Phase 4: Polish. Do a full audit of the current build with the eyes of a design-obsessed founder reviewing it before launch.

Check and fix:
1. Visual polish — does this look professional? Fix spacing, typography, colours, and alignment issues.
2. Mobile responsiveness — test every screen on mobile. Fix anything that breaks.
3. Edge cases — what happens if a user submits an empty form? Enters the wrong format? Has no data yet? Handle all of them gracefully.
4. Error messages — rewrite any technical errors into friendly, actionable human language.
5. Loading states — every action that takes time should have a spinner or skeleton. Add them.
6. Performance — flag anything obviously slow or inefficient and fix it.
7. "Finished" details — micro-interactions, empty states, success messages. Add the small things that make it feel done.

After each fix, tell me what you changed and why. If something would take significant effort for minimal benefit, flag it as "v2" instead.`,
        expectedOutput: 'A polished, professional-looking product with no rough edges. Mobile-friendly, edge cases handled, errors humanised, and small details that make it feel finished.',
        tips: 'Polish is not optional. The difference between "it works" and "I\'m proud of this" is entirely in Phase 4. Block 20 minutes for this — it\'s worth it every time.',
        tools: ['Claude', 'Cursor', 'v0.dev']
      },
      {
        id: 'vc-1-s6',
        stepNumber: 6,
        title: 'Phase 5 — Handoff (Own What You Built)',
        instruction: 'The handoff phase makes sure you understand and can maintain everything that was built — and that you\'re not dependent on this conversation to keep it running. Paste the prompt below. Save the output somewhere permanent (Notion, Google Doc, GitHub README). This is your product\'s operating manual.',
        promptTemplate: `Phase 5: Handoff. Create a complete handoff document for this product. Structure it as:

**What Was Built**
- Plain-language description of the product and every feature in v1
- Tech stack used and why each choice was made

**How to Use It**
- Step-by-step instructions for the end user
- Any setup steps required for a new user

**How to Maintain It**
- Where to find and edit each part of the codebase
- How to update content, change settings, or swap out components
- Any recurring tasks or maintenance required

**How to Deploy** (if not already live)
- Exact steps to get this live for free or cheaply
- Recommended hosting platform and why

**What to Build in V2**
- Top 5 improvements or features to add next, in priority order
- Anything flagged as "v2" during the build

**Gotchas and Known Limitations**
- Anything I should know about edge cases, limits, or gotchas in this v1`,
        expectedOutput: 'A complete handoff document covering what was built, how to use it, how to maintain it, deployment steps, and a V2 roadmap — so you\'re never dependent on this conversation again.',
        tips: 'Save this document immediately. Paste it into Notion, a Google Doc, or your project\'s README. Future-you will thank you the moment you need to make a change 3 months from now.',
        tools: ['Claude', 'ChatGPT']
      }
    ],
    agentAutomation: {
      description: 'Schedule weekly build sessions where the AI reviews your product, identifies what to build next, and prepares a structured brief for your next vibe coding session.',
      trigger: 'Every Monday morning',
      actions: [
        'Review the current state of your product',
        'Identify the top 3 improvements from the v2 list',
        'Prepare a structured brief for the next build session',
        'Flag any maintenance or bug issues found'
      ],
      setupSteps: [
        { title: 'Connect your project', description: 'Add your handoff document and codebase summary to the agent\'s context' },
        { title: 'Set your cadence', description: 'Choose how often you want build session briefs (weekly recommended)' },
        { title: 'Define your v2 priorities', description: 'Paste your v2 roadmap from the handoff document so the agent knows what to prioritise' }
      ],
      tools: ['Claude', 'Cursor']
    },
    relatedPlaybooks: [
      { id: 'dai-3', title: 'Create a SaaS Dashboard Web App', slug: 'create-saas-dashboard-app' },
      { id: 'dai-1', title: 'Figma to Production with Claude Code', slug: 'figma-to-production-cowork-claude-code' },
      { id: 'cwp-8', title: 'Figma to React with Claude Code & MCP', slug: 'claude-code-figma-mcp-workflow' }
    ]
  }
];

// Claude Cowork-optimized playbooks (new finance/banking verticals)
export const coworkPlaybooks: Playbook[] = [
  {
    id: 'cw-smm-1',
    slug: 'automated-social-media-manager',
    title: 'The 30-Day Content Architect',
    subtitle: 'Design, edit, and schedule 30 days of high-converting social media content in 2 hours using Claude.',
    category: 'Marketing',
    difficulty: 'Advanced',
    timeToComplete: 120,
    timeSaved: 2400,
    completionCount: 89,
    rating: 5.0,
    isPro: true,
    isNew: true,
    coworkCompatible: true,
    tools: ['Claude'],
    beforeYouStart: [
      'Your target niche or industry',
      'Basic understanding of your product/service value proposition'
    ],
    expectedOutcome: 'A complete, ready-to-schedule 30-day social media calendar with tailored content, hooks, and growth strategies.',
    troubleshooting: [
      {
        problem: 'Claude generates content pillars that are too broad and produce interchangeable post ideas',
        solution: 'Narrow the niche further in your prompt. Instead of "fitness", use "fat loss for busy moms over 40." The more specific your target audience, the tighter the pillars and the more distinct each post idea becomes.'
      },
      {
        problem: 'The 30-day calendar has too many similar post types and lacks variety',
        solution: 'After generating the calendar, prompt: "Review the 30-day plan and flag any content type that repeats more than 4 times in a row. Swap duplicates with posts from a different pillar to improve variety." Balance matters more than volume.'
      },
      {
        problem: 'Generated hooks are generic (e.g. "Have you ever wondered...") and will not stop the scroll',
        solution: 'Ask Claude to rewrite using pattern-interrupt formats: "Rewrite all hooks using one of these formats: a controversial statement, a specific statistic, or a before/after scenario. No questions. No "Have you ever".'
      }
    ],
    steps: [
      {
        id: 'cw-smm-s1',
        stepNumber: 1,
        title: 'Niche Intelligence & Audience Mapping',
        instruction: 'Define the most profitable audience segments, their frustrations, and emotional triggers to build focused content around.',
        promptTemplate: 'Act as a senior social media strategist with over 10 years of experience managing brands in multiple industries. Analyze the niche [Niche/Industry] and identify the most profitable audience segments, their biggest frustrations, emotional triggers, content consumption habits, and what type of posts make them follow, engage, and buy. Present this in a clear, actionable profile I can build content around.',
        expectedOutput: 'A detailed audience profile including segments, pain points, and content preferences.'
      },
      {
        id: 'cw-smm-s2',
        stepNumber: 2,
        title: 'Market Positioning & Brand Strategy',
        instruction: 'Design a powerful social media identity and messaging strategy that makes your profile feel authoritative.',
        promptTemplate: 'Act as a brand positioning expert and help me design a powerful social media identity in the niche [Niche/Industry]. Define what my brand should stand for, what makes it different from competitors, and how it should be perceived. Then translate that into a clear messaging and content positioning strategy that makes my profile feel authoritative and trustworthy.',
        expectedOutput: 'A comprehensive brand positioning strategy with key differentiators and messaging pillars.'
      },
      {
        id: 'cw-smm-s3',
        stepNumber: 3,
        title: 'Content Pillar Architecture',
        instruction: 'Identify the main themes you should post about and how they work together to build trust.',
        promptTemplate: 'Create a complete content pillar framework for my social media brand in the niche [Niche/Industry]. Identify the main themes I should post about, explain what type of posts belong under each theme, and describe how these pillars work together to build trust, authority, and audience growth over time.',
        expectedOutput: 'A breakdown of 3-5 distinct content pillars with examples of posts for each category.'
      },
      {
        id: 'cw-smm-s4',
        stepNumber: 4,
        title: 'Scroll-Stopping Hook & Idea Generator',
        instruction: 'Generate a large set of high-impact content ideas and hooks designed to trigger curiosity and emotion.',
        promptTemplate: 'Generate a large set of high-impact content ideas and scroll-stopping hooks for the niche [Niche/Industry]. Each idea should be designed to grab attention, trigger curiosity or emotion, and make people want to read, watch, or save the post. Avoid generic or obvious ideas.',
        expectedOutput: 'A list of 15-20 highly engaging content concepts accompanied by attention-grabbing first sentences (hooks).'
      },
      {
        id: 'cw-smm-s5',
        stepNumber: 5,
        title: 'The 30-Day Content Calendar Builder',
        instruction: 'Structure all the previous research into a daily action plan specifying post goals and core ideas.',
        promptTemplate: 'Create a 30-day social media content calendar for the niche [Niche/Industry]. For each day, specify the type of post, its goal (reach, engagement, authority, or conversion), and the core idea behind it so I know exactly what to post and why.',
        expectedOutput: 'A day-by-day 30-day schedule detailing the post format, objective, and topic.'
      },
      {
        id: 'cw-smm-s6',
        stepNumber: 6,
        title: 'Audience Growth & Engagement System',
        instruction: 'Create a practical, step-by-step plan to build a loyal, interactive community instead of just passive followers.',
        promptTemplate: 'Create a practical, step-by-step audience growth and engagement plan for my social media brand in the niche [Niche/Industry]. Include posting strategy, engagement habits, and content tactics that help me build a loyal, interactive community instead of just passive followers.',
        expectedOutput: 'A daily/weekly engagement checklist and community interaction strategy.'
      }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cw-btp-1',
    slug: 'ultimate-budget-travel-planner',
    title: 'The Travel Hacker\'s Blueprint',
    subtitle: 'Plan a complete, optimized budget trip with flights, lodging, and activities using AI.',
    category: 'Travel & Lifestyle',
    difficulty: 'Beginner',
    timeToComplete: 15,
    timeSaved: 180,
    completionCount: 142,
    rating: 4.8,
    isPro: false,
    isNew: true,
    coworkCompatible: false,
    tools: ['Claude', 'Gemini', 'ChatGPT'],
    beforeYouStart: [
      'Your destination',
      'Your general travel dates or flexibility',
      'Your approximate budget'
    ],
    expectedOutcome: 'A complete end-to-end trip itinerary featuring the cheapest flights, vetted budget lodging, free activities, and local dining spots.',
    troubleshooting: [
      {
        problem: 'AI suggests flight dates that are not actually cheaper when checked on Google Flights',
        solution: 'AI cannot query live prices — it provides historical patterns and general guidance. Always verify suggested dates on Google Flights or Kayak using the price calendar view before booking. Use the AI output as a starting hypothesis, not a guarantee.'
      },
      {
        problem: 'Recommended budget hotels turn out to be poorly reviewed when checked on Booking.com',
        solution: 'After getting AI recommendations, filter each property on Booking.com or TripAdvisor to only show options with a minimum 8.0/10 score and at least 50 reviews. Recency of reviews matters — filter for "last 3 months" to catch recent quality drops.'
      },
      {
        problem: 'Local restaurant recommendations are closed or no longer exist',
        solution: 'AI training data can be months or years old. Always verify restaurant hours and existence on Google Maps by searching the exact name + city. If it does not appear with recent reviews, ask Claude for 2 backup alternatives in the same neighborhood.'
      }
    ],
    steps: [
      {
        id: 'cw-btp-s1',
        stepNumber: 1,
        title: 'Optimal Booking Window',
        instruction: 'Determine the absolute cheapest dates to fly and calculate potential savings.',
        promptTemplate: 'I have [X days] of flexibility. Analyze pricing patterns and identify the cheapest date range to fly to [Destination]. Show me how much I\'ll save.',
        expectedOutput: 'An analysis of historical/current pricing patterns with a recommended date range.'
      },
      {
        id: 'cw-btp-s2',
        stepNumber: 2,
        title: 'Pricing Error Tracker',
        instruction: 'Search for active mistake fares or flash sales to lock in impossible prices.',
        promptTemplate: 'You\'re a travel deals hunter. Search for active mistake fares or flash sales from [Your Region] to top destinations. Explain how to book them before they vanish.',
        expectedOutput: 'A list of potential active flash sales and instructions on leveraging mistake fares safely.'
      },
      {
        id: 'cw-btp-s3',
        stepNumber: 3,
        title: 'Strategic Flight Search',
        instruction: 'Find the absolute cheapest routing options using creative alternatives.',
        promptTemplate: 'I\'m departing [Your City] for [Destination] around [Dates]. Find the absolute cheapest options using flexible timing, nearby airports, and creative routing.',
        expectedOutput: '1-3 creative flight routes (e.g., hidden city ticketing, alternative airports, mixed airlines) that significantly lower the cost.'
      },
      {
        id: 'cw-btp-s4',
        stepNumber: 4,
        title: 'Affordable Stay Finder',
        instruction: 'Locate high-value, low-cost accommodations near the action.',
        promptTemplate: 'I\'m in [Destination] for [X nights]. Locate 3 hotels or Airbnbs under [$X/night] close to downtown or major attractions.',
        expectedOutput: 'Three specific neighborhood or accommodation recommendations hitting the price target.'
      },
      {
        id: 'cw-btp-s5',
        stepNumber: 5,
        title: 'Free Experience Curator',
        instruction: 'Build an itinerary of genuinely great activities that cost nothing.',
        promptTemplate: 'I\'m exploring [Destination] on a budget. Give me 5 free or nearly-free things, parks, local events, hidden spots, etc.',
        expectedOutput: 'A curated list of 5 high-quality free experiences beyond obvious tourist traps.'
      },
      {
        id: 'cw-btp-s6',
        stepNumber: 6,
        title: 'Budget Dining Advisor',
        instruction: 'Discover authentic, affordable food where locals actually eat.',
        promptTemplate: 'I want authentic food without the markup. Recommend 3 local spots in [Destination] where meals cost under [$X] and locals actually eat.',
        expectedOutput: 'Three distinct affordable dining recommendations spanning different local cuisines.'
      },
      {
        id: 'cw-btp-s7',
        stepNumber: 7,
        title: 'Complete Trip Cost Planner',
        instruction: 'Compile everything into a final budget and find one more massive saving opportunity.',
        promptTemplate: 'Using the cheapest flights, lodging, meals, and activities, calculate my total cost for [Destination], then suggest one extra way to save.',
        expectedOutput: 'A finalized budget breakdown and one creative "secret" tip for further savings.'
      }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cw-lseo-1',
    slug: 'local-business-seo-dominator',
    title: 'The Local Business SEO Dominator',
    subtitle: 'Outrank competitors by publishing helpful local pages and optimizing your Google Business Profile overnight.',
    category: 'Marketing',
    difficulty: 'Intermediate',
    timeToComplete: 45,
    timeSaved: 1920, // Agencies take weeks
    completionCount: 382,
    rating: 4.9,
    isPro: true,
    isNew: true,
    coworkCompatible: false,
    tools: ['Claude', 'Google Business Profile', 'WordPress'],
    beforeYouStart: [
      'Your exact target services (e.g., HVAC repair, emergency plumbing)',
      'A list of the cities or neighborhoods you serve',
      'Basic access to your website and Google Business Profile'
    ],
    expectedOutcome: 'A complete local SEO content suite including hyper-targeted local service pages, an optimized GBP, and review request templates.',
    troubleshooting: [
      {
        problem: 'Service area pages are flagged as duplicate content by Google',
        solution: 'Each page must have genuinely unique content beyond just swapping the city name. Add a neighborhood-specific paragraph — local landmarks, typical local problems your service solves, or a local customer quote. Even 100 words of truly unique content per page is enough to avoid duplicate penalties.'
      },
      {
        problem: 'Google Business Profile changes are not reflecting in map search results',
        solution: 'GBP updates can take 3-10 days to propagate in Google Maps, especially for description and service changes. Do not make additional edits while waiting — multiple queued changes can cause longer delays. Post a Google Update post immediately to signal fresh activity.'
      },
      {
        problem: 'Review request SMS templates feel too pushy and get low response rates',
        solution: 'Timing beats template quality. Send the review request within 1 hour of job completion while satisfaction is highest. Ask Claude to rewrite the SMS as a natural follow-up message, not a formal request: "Hey [Name], it was great working with you today!" as an opener works better than "We would appreciate a review."'
      }
    ],
    steps: [
      {
        id: 'cw-lseo-s1',
        stepNumber: 1,
        title: 'Find Your Local Keywords',
        instruction: 'Ask Claude to build a comprehensive list of high-intent local search terms for your specific services.',
        promptTemplate: 'I run a local business offering [Your Services] in [Your City/Local Areas]. Act as a Local SEO expert and analyze search intent for my market. Please list: 1) "Service + Location" keywords. 2) "Near me" intent keywords. 3) Emergency / Urgent keywords. 4) Comparison keywords (best, affordable, top-rated). Present this as a prioritized list.',
        expectedOutput: 'A structured list of targeted keywords mapped by intent and urgency.'
      },
      {
        id: 'cw-lseo-s2',
        stepNumber: 2,
        title: 'Build Service Area Pages',
        instruction: 'Feed Claude your exact offer so it can write localized, unique landing pages for each city you serve.',
        promptTemplate: 'Here is my core business information: My exact offer is [Your Offer]. My prices average [Price Range]. My process is [Brief Process]. The areas I serve are [List of Cities/Neighborhoods]. Draft SEO-optimized landing page copy for EACH of these areas individually. Include placeholders for photos, local reviews, FAQs, and a clear Call-to-Action button.',
        expectedOutput: 'Multiple drafts of localized service pages ready to be pasted into WordPress or your website builder.'
      },
      {
        id: 'cw-lseo-s3',
        stepNumber: 3,
        title: 'Turn GBP Into a Lead Machine',
        instruction: 'Optimize your Google Business Profile with rich descriptions, services, and FAQs to boost local map pack rankings.',
        promptTemplate: 'Based on my business info ([Services] in [Location]), write the following for my Google Business Profile (GBP): 1) An optimized 750-character business description. 2) A formatted list of services with short, keyword-rich blurbs. 3) 20 common FAQs with detailed answers. 4) 4 weekly Google Post ideas (offers, tips, before/afters).',
        expectedOutput: 'Ready-to-copy profile descriptions, an FAQ database, and a month of Google Post ideas.'
      },
      {
        id: 'cw-lseo-s4',
        stepNumber: 4,
        title: 'Create "Proof" Content',
        instruction: 'Turn a single recent job into 4 different pieces of marketing content that prove your expertise.',
        promptTemplate: 'I recently completed a job doing [Brief description of the job, e.g., AC repair in Bandra fixed in 45 mins]. Turn this single job into 4 pieces of content: 1) A short case study page for my website. 2) A promotional Google Post. 3) A simple 30-second script for an Instagram/Facebook Reel. 4) A new FAQ based on a question the customer asked.',
        expectedOutput: 'Four distinct pieces of content derived from one real-world job.'
      },
      {
        id: 'cw-lseo-s5',
        stepNumber: 5,
        title: 'Get Reviews on Autopilot',
        instruction: 'Generate templates to automate asking for reviews via SMS/email, and templates for responding to them.',
        promptTemplate: 'Write 3 different short, polite text message/SMS templates I can send to happy customers asking them for a Google review. Keep them casual but professional. Then, write 3 template replies I can use to respond to positive 5-star reviews on my Google Business Profile to show engagement.',
        expectedOutput: 'Copy/paste SMS review request templates and perfectly crafted GBP review responses.'
      }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cw-1',
    slug: 'investment-banking-deal-brief',
    title: 'Investment Banking Deal Brief',
    subtitle: 'Generate a full M&A target brief from public filings in 30 minutes',
    category: 'Investment Banking',
    difficulty: 'Advanced',
    timeToComplete: 30,
    timeSaved: 480,
    completionCount: 312,
    rating: 4.9,
    isPro: true,
    isNew: true,
    coworkCompatible: true,
    tools: ['Claude', 'FactSet', 'Excel'],
    beforeYouStart: [
      'Target company name and ticker (if public)',
      'Access to FactSet, Bloomberg, or public SEC filings',
      'Deal thesis or acquisition rationale'
    ],
    expectedOutcome: 'A comprehensive 2-page deal brief covering financials, strategic rationale, key risks, and comparables—ready for the first IC meeting.',
    troubleshooting: [
      {
        problem: 'Financial summary table has inconsistent figures compared to the company\'s 10-K',
        solution: 'Always paste your data with explicit labels: "Year 1 = FY2022 (ended Dec 31 2022)". Claude will otherwise guess fiscal year alignment and may mismatch periods. Labeling every column prevents silent errors in the CAGR and margin calculations.'
      },
      {
        problem: 'Strategic rationale is too generic and does not differentiate this deal from any other acquisition',
        solution: 'Include one specific numeric anchor per bullet. Instead of "expand market reach", write "the target\'s 18% share in the Southeast region fills our complete gap in that geography." Numbers make IC memos defensible.'
      },
      {
        problem: 'Control premium instruction is not applied consistently to both EV/EBITDA and EV/Revenue outputs',
        solution: 'After generating the comps table, prompt Claude: "Confirm you applied a 20% control premium to BOTH EV/EBITDA and EV/Revenue implied values and show your math." Always verify the premium was applied — it is easy to miss on one multiple.'
      }
    ],
    steps: [
      {
        id: 'cw-1-s1',
        stepNumber: 1,
        title: 'Pull the Financial Summary',
        instruction: 'Go to FactSet (or download the 10-K from SEC EDGAR) and copy the last 3 years of Revenue, EBITDA, Net Income, and Net Debt into a table. Then paste that table into Claude using the prompt below.',
        promptTemplate: `You are a senior investment banking analyst at a bulge-bracket firm. Here is 3 years of financial data for [Company Name] ([Ticker]):\n\n[Paste your table here]\n\nSummarize the following in a table:\n1. Revenue CAGR (3-year)\n2. EBITDA margins by year\n3. Net Debt / EBITDA leverage ratio\n4. Two key financial risks based on the trends you observe\n\nFormat your output as a clean, executive-ready table followed by a 2-sentence risk summary.`,
        expectedOutput: 'A clean financial summary table with growth rates, margins, and 2 key risks identified.'
      },
      {
        id: 'cw-1-s2',
        stepNumber: 2,
        title: 'Build the Strategic Rationale',
        instruction: 'Describe the acquirer\'s business model and the target\'s position in 2-3 sentences. Ask Claude to structure the strategic rationale using the three-pillar IB framework.',
        promptTemplate: `Acquirer: [Company A] — [Brief description of what they do, revenue, market position]\nTarget: [Company B] — [Brief description of what they do, revenue, market position]\n\nWrite a 3-bullet strategic rationale for this acquisition suitable for an IC memo. Each bullet should cover one of the following pillars:\n1. Market Expansion (geography, segment, or customer base)\n2. Synergies (be specific: cost reduction targets or revenue uplift mechanisms)\n3. Capability Gap (what capability or technology does this acquisition bring?)\n\nUse concise, formal investment banking language. Avoid fluffy language.`,
        expectedOutput: '3 crisp strategic rationale bullets ready to paste into an IC memo.'
      },
      {
        id: 'cw-1-s3',
        stepNumber: 3,
        title: 'Comparable Company Analysis (Comps)',
        instruction: 'Pull EV/EBITDA and EV/Revenue multiples from FactSet or Capital IQ for 5 comparable public companies. List them below and ask Claude to format the table and calculate an implied valuation range for the target.',
        promptTemplate: `Here are 5 comparable public companies to [Target Company] with their trailing-twelve-month (LTM) trading multiples:\n\n| Company | EV/EBITDA | EV/Revenue |\n|---------|-----------|------------|\n| [Comp 1] | [X]x | [Y]x |\n| [Comp 2] | [X]x | [Y]x |\n| [Comp 3] | [X]x | [Y]x |\n| [Comp 4] | [X]x | [Y]x |\n| [Comp 5] | [X]x | [Y]x |\n\nTarget's LTM EBITDA: $[X]M\nTarget's LTM Revenue: $[Y]M\n\nPlease:\n1. Calculate the median and mean EV/EBITDA and EV/Revenue multiples\n2. Apply a 20% M&A control premium to the median multiples\n3. Output an implied Enterprise Value range for the target\n4. Format everything as a clean comps table`,
        expectedOutput: 'A formatted comps table with median/mean multiples and an implied EV range including the control premium.'
      },
      {
        id: 'cw-1-s4',
        stepNumber: 4,
        title: 'Key Risks & Deal Considerations',
        instruction: 'Now compile everything Claude has generated. Ask it to summarize the top 3 deal risks and produce the final brief structure.',
        promptTemplate: `Based on the financial summary, strategic rationale, and comps analysis we just built for [Target]:\n\nWrite a "Key Risks" section with the top 3 risks to this deal: one financial risk, one integration risk, and one market/competitive risk. Keep each risk to 2 sentences max.\n\nThen compile everything into a structured deal brief outline with these sections:\n1. Executive Summary (3 sentences)\n2. Business Overview (what the target does)\n3. Financial Highlights (from Step 1)\n4. Strategic Rationale (from Step 2)\n5. Valuation Summary (from Step 3)\n6. Key Risks (from above)\n7. Recommended Next Steps`,
        expectedOutput: 'A complete deal brief structure ready to be formatted into a client-ready Word or PowerPoint deck.'
      }
    ],
    relatedPlaybooks: [
      { id: 'cw-2', title: 'Equity Research Initiation Note', slug: 'equity-research-note' },
      { id: '11', title: 'Cash Flow Projection', slug: 'cash-flow-projection' }
    ]
  },
  {
    id: 'cw-2',
    slug: 'equity-research-note',
    title: 'Equity Research Initiation Note',
    subtitle: 'Draft a professional buy/sell initiation note from earnings data in 20 minutes',
    category: 'Equity Research',
    difficulty: 'Advanced',
    timeToComplete: 20,
    timeSaved: 360,
    completionCount: 198,
    rating: 4.8,
    isPro: true,
    isNew: true,
    coworkCompatible: true,
    tools: ['Claude', 'S&P Global', 'Excel'],
    beforeYouStart: [
      'Latest earnings transcript or press release (paste or upload as PDF)',
      'Last 2 years of P&L and free cash flow model',
      'Your investment thesis in plain English (bull or bear)'
    ],
    expectedOutcome: 'A structured equity research initiation note with investment thesis, key catalysts, risk section, and 12-month price target rationale — ready to send to clients or format into a PDF.',
    troubleshooting: [
      {
        problem: 'The earnings call brief is too long and buries the key guidance changes',
        solution: 'Add a prioritization rule to Step 1: "After extracting the signals, rank them in order of importance to the investment thesis. Lead with the most surprising or material guidance change — that is what institutional readers look for first."'
      },
      {
        problem: 'Investment thesis output sounds like a blog post rather than institutional research',
        solution: 'Provide a sentence from a real research note as a style anchor in your Step 2 prompt: "Match this tone exactly: [paste one sentence from a real research note]." Style examples constrain output far more effectively than written instructions alone.'
      },
      {
        problem: 'Risk section is too short and lacks specificity about what would trigger a rating change',
        solution: 'Each risk item must include a concrete trigger: "We would revisit our BUY rating if gross margins decline more than 200bps quarter-over-quarter for two consecutive quarters." Vague risks like "competition could intensify" are not actionable for clients.'
      }
    ],
    steps: [
      {
        id: 'cw-2-s1',
        stepNumber: 1,
        title: 'Extract Key Signals from the Earnings Call',
        instruction: 'Download the earnings call transcript from Seeking Alpha, S&P Global, or your data provider. Paste the full transcript into Claude with the prompt below to rapidly distill the key signals.',
        promptTemplate: `You are a sell-side equity research analyst. Carefully read this earnings call transcript for [Company Name] ([Ticker]):\n\n[PASTE FULL TRANSCRIPT HERE]\n\nExtract and format the following:\n1. Management's top 3 stated priorities for the next 12 months\n2. Any guidance changes (revenue, EBITDA, or EPS) vs. prior guidance — note if raised, lowered, or maintained\n3. The 2 most important analyst questions and management's exact responses, summarized in 2 sentences each\n4. One quote from the CEO or CFO that best captures the overall tone of the call\n\nFormat as a structured briefing note, not bullet points.`,
        expectedOutput: 'A concise earnings call brief with management priorities, guidance changes, key Q&A, and a representative quote.'
      },
      {
        id: 'cw-2-s2',
        stepNumber: 2,
        title: 'Write the Investment Thesis',
        instruction: 'Tell Claude your position (Buy/Hold/Sell) and your bull-case reasoning in plain everyday language. It will convert it into formal sell-side research prose.',
        promptTemplate: `You are a senior equity research analyst writing an initiation note for institutional investors.\n\nMy rating: [BUY / HOLD / SELL]\nMy informal bull case: [Describe in plain English why you think this stock is mis-priced or has a compelling opportunity — e.g. "They're the only player in X segment and I think margins expand when Y happens"]\n\nConvert this into a formal 3-paragraph investment thesis for an initiation note:\n- Paragraph 1: The setup / why this company is interesting right now\n- Paragraph 2: The primary catalyst(s) that will unlock value over 12 months\n- Paragraph 3: Why the risk/reward is attractive at current levels\n\nUse precise, institutional-grade language. Do not use words like "exciting" or "promising."`,
        expectedOutput: 'A 3-paragraph formal investment thesis in sell-side research language, ready to open the initiation note.'
      },
      {
        id: 'cw-2-s3',
        stepNumber: 3,
        title: 'Build the Risk Section',
        instruction: 'Every research note needs a balanced risk section. Provide your top concerns and Claude will structure them correctly for institutional readers.',
        promptTemplate: `I am writing an equity research note rating [Company] as [BUY/HOLD/SELL]. Below are my top concerns about the investment:\n\n1. [Risk 1 in plain language, e.g. "Margins could compress if input costs stay high"]\n2. [Risk 2 in plain language]\n3. [Risk 3 in plain language]\n\nConvert each into a formal "investment risk" suitable for an institutional equity research note. Each risk should:\n- Have a one-line header in bold (the risk title)\n- Be 2-3 sentences explaining the mechanism of the risk\n- End with a sentence on what would cause us to revisit our rating\n\nAlso add a standard disclaimer sentence at the end of the risk section.`,
        expectedOutput: 'Three formatted investment risks with headers, explanations, and a trigger for rating change — ready to paste into the research note.'
      },
      {
        id: 'cw-2-s4',
        stepNumber: 4,
        title: 'Price Target & Valuation Write-Up',
        instruction: 'Provide your DCF or multiple-based model assumptions and have Claude write the valuation section and price target rationale.',
        promptTemplate: `I am setting a 12-month price target of $[TARGET] for [Company] (current price: $[CURRENT]).\n\nMy valuation methodology: [DCF / EV/EBITDA multiple / P/E multiple]\nKey assumptions:\n- Revenue growth rate: [X]% in Year 1, [Y]% in Year 2\n- EBITDA margin expansion to: [Z]% by end of forecast period\n- Discount rate / WACC: [X]% (for DCF) OR Target multiple: [X]x (for comps)\n\nWrite a 3-paragraph valuation section for a research initiation note:\n- Paragraph 1: Methodology and key assumptions\n- Paragraph 2: How we arrive at our $[TARGET] price target\n- Paragraph 3: What would cause us to be wrong (upside and downside scenarios)\n\nThis should read as professional sell-side research, not a personal blog post.`,
        expectedOutput: 'A 3-paragraph valuation section with PT rationale and scenario analysis — ready to close the research initiation note.'
      }
    ],
    relatedPlaybooks: [
      { id: 'cw-1', title: 'Investment Banking Deal Brief', slug: 'investment-banking-deal-brief' },
      { id: 'cw-3', title: 'Private Equity Deal Screener', slug: 'private-equity-deal-screener' }
    ]
  },
  {
    id: 'cw-3',
    slug: 'private-equity-deal-screener',
    title: 'Private Equity Deal Screener',
    subtitle: 'Score and rank 10 inbound deals against your fund thesis in 15 minutes',
    category: 'Private Equity',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 240,
    completionCount: 156,
    rating: 4.7,
    isPro: true,
    isNew: true,
    coworkCompatible: true,
    tools: ['Claude', 'Excel', 'Outreach'],
    beforeYouStart: [
      'A batch of inbound deal one-pagers or CIMs (even rough executive summaries work)',
      'Your fund\'s core investment criteria clearly defined (sector, EBITDA threshold, geography)',
      'Your minimum return thresholds (target IRR range and MOIC)'
    ],
    expectedOutcome: 'A scored and ranked pipeline sheet with a clear pass/pursue recommendation and a one-line rationale for every deal — ready to share with partners or the IC in under 20 minutes.',
    troubleshooting: [
      {
        problem: 'Scoring rubric criteria overlap too much and produce inconsistent results across team members',
        solution: 'After generating the rubric, run a calibration test: score the same known deal independently with two team members using the rubric. Where scores diverge by 2+ points on a criterion, add more concrete examples to the descriptor for that score level.'
      },
      {
        problem: 'Claude assigns high scores to deals with thin data because it gives benefit of the doubt',
        solution: 'Add an explicit instruction: "If a criterion cannot be assessed because the CIM does not provide sufficient data, score it 2 out of 5, not 3. Lack of information is a yellow flag in deal screening, not a neutral."'
      },
      {
        problem: 'Executive summary for IC update reads like a list of individual scores rather than an overall view',
        solution: 'After generating the pipeline report, add: "Write the IC executive summary as a narrative, not as a list. Start with the overall quality signal of this cohort, then highlight the one deal worth fast-tracking and the most common reason for passes."'
      }
    ],
    steps: [
      {
        id: 'cw-3-s1',
        stepNumber: 1,
        title: 'Define Your Scoring Rubric',
        instruction: 'Before scoring any deal, you need a consistent rubric. Define your fund\'s investment criteria and let Claude build you a reusable scoring framework.',
        promptTemplate: `You are a private equity associate building a deal pipeline tracking system.\n\nOur fund strategy:\n- Sector focus: [e.g. B2B Software / Healthcare Services / Industrial]\n- Target company profile: [Revenue range: $X-$YM] [EBITDA: $AM-$BM] [Geography: e.g. North America]\n- Return targets: [X]x MOIC, [Y]% IRR over [Z]-year hold\n- Investment stage: [e.g. lower-middle-market buyout / growth equity]\n\nCreate a deal scoring rubric with exactly 5 criteria, each scored 1-5 (5 = excellent fit, 1 = poor fit). The criteria should reflect what we care about most given our strategy. Output:\n1. A table with each criterion, a 1-sentence description, and what a score of 1, 3, and 5 looks like for each\n2. A "total score interpretation" guide: what score thresholds mean Pursue, Watch, or Pass`,
        expectedOutput: 'A 5-criterion scoring rubric table with score descriptors and a total-score interpretation guide.'
      },
      {
        id: 'cw-3-s2',
        stepNumber: 2,
        title: 'Score Each Inbound Deal',
        instruction: 'For each deal in your pipeline, paste the one-pager or CIM summary into Claude with the rubric. Do this for each deal in turn — it takes under 2 minutes per deal.',
        promptTemplate: `Using the scoring rubric we just built, score this inbound deal:\n\n--- DEAL SUMMARY ---\n[Paste the full one-pager, executive summary, or CIM highlights here]\n--- END OF DEAL SUMMARY ---\n\nPlease:\n1. Score each of the 5 criteria from 1-5 with a 1-sentence justification for the score\n2. Total the score out of 25\n3. Apply the interpretation guide and state: PURSUE / WATCH / PASS\n4. Write a single sentence (max 20 words) that captures the core reason for the recommendation\n5. Flag any deal-breakers or red flags you spotted, if any\n\nOutput as a clean, single-row table entry ready to paste into a pipeline tracker.`,
        expectedOutput: 'A scored deal row: 5 criteria scores with justifications, total, recommendation, and one-line rationale.'
      },
      {
        id: 'cw-3-s3',
        stepNumber: 3,
        title: 'Generate the Ranked Pipeline Report',
        instruction: 'After scoring all deals, paste the full collection of scored rows into Claude to get a final ranked report with executive commentary.',
        promptTemplate: `Here is our complete deal pipeline tracker with scores for [N] inbound deals:\n\n[Paste all your scored deal rows here]\n\nPlease:\n1. Sort all deals from highest to lowest total score\n2. Group them into three tiers: Pursue (18-25), Watch (12-17), Pass (below 12)\n3. For the Pursue tier: write 2-3 sentences on what due diligence workstreams to prioritize first\n4. For the Watch tier: write 1 sentence on what information would move each deal into Pursue or Pass\n5. Write a 3-sentence executive summary of the overall quality of this deal cohort suitable for a weekly IC update email\n\nFormat the output as a clean pipeline report I can share directly with partners.`,
        expectedOutput: 'A complete ranked pipeline report with tiered recommendations, DD priorities, and an IC-ready executive summary.'
      }
    ],
    relatedPlaybooks: [
      { id: 'cw-1', title: 'Investment Banking Deal Brief', slug: 'investment-banking-deal-brief' },
      { id: 'cw-4', title: 'Wealth Management Client Brief', slug: 'wealth-management-client-brief' }
    ]
  },
  {
    id: 'cw-4',
    slug: 'wealth-management-client-brief',
    title: 'Wealth Management Client Brief',
    subtitle: 'Build a personalized portfolio review for HNW client meetings in 10 minutes',
    category: 'Wealth Management',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 120,
    completionCount: 423,
    rating: 4.8,
    isPro: true,
    isNew: true,
    coworkCompatible: true,
    tools: ['Claude', 'Excel', 'MSCI'],
    beforeYouStart: [
      'Client\'s current portfolio summary (asset allocation and top 10 holdings)',
      'Client\'s stated financial goals and risk tolerance rating',
      'Last quarter\'s performance vs. benchmark (e.g. S&P 500 or 60/40 blend)'
    ],
    expectedOutcome: 'A 1-page personalized client meeting brief covering portfolio performance, market context, and 3 specific, actionable recommendations — ready to print, email, or present on screen.',
    troubleshooting: [
      {
        problem: 'Performance narrative uses passive language that softens underperformance too much',
        solution: 'Give Claude a directness rule: "If the portfolio underperformed its benchmark, state that directly in the first sentence of the performance paragraph. Clients trust advisors who are honest about underperformance more than those who obscure it."'
      },
      {
        problem: 'Allocation commentary is technically correct but disconnected from the client\'s stated goal',
        solution: 'Always reference the client\'s specific goal in the allocation commentary prompt — not just their risk profile. "Capital preservation for retirement in 3 years" requires a very different commentary tone than "aggressive growth for a 30-year-old." Paste the goal explicitly.'
      },
      {
        problem: 'Recommendation cards use financial shorthand the client will not recognize ("rotate into", "add duration")',
        solution: 'Add a translation rule to your Step 3 prompt: "Convert all financial jargon into plain English. \'Reduce equity exposure\' should become \'we want to hold a little less in stocks right now.\'  The client should be able to explain each recommendation to a friend."'
      }
    ],
    steps: [
      {
        id: 'cw-4-s1',
        stepNumber: 1,
        title: 'Write the Performance Summary',
        instruction: 'Share last quarter\'s performance data with Claude. It will write a plain-English performance narrative suitable for a high-net-worth client who may not be financially sophisticated.',
        promptTemplate: `You are a wealth management advisor writing a quarterly portfolio review for a high-net-worth client.\n\nClient profile:\n- Name: [Client Name]\n- Risk profile: [Conservative / Moderate / Aggressive / Custom]\n- Investment goal: [e.g. Capital preservation / Retirement income / Wealth growth]\n\nPerformance data:\n- Portfolio return last quarter: [X]%\n- Benchmark return (specify which): [Y]%\n- Top performing holding: [Asset name, return %]\n- Worst performing holding: [Asset name, return %]\n- Cash position: [Z]%\n\nWrite a 2-paragraph performance summary:\n- Paragraph 1: How the portfolio did vs. benchmark and what drove performance\n- Paragraph 2: Context for any underperformance (if applicable) and why it was consistent with the client's strategy\n\nTone: warm, confident, and jargon-free. The client is intelligent but not a finance professional.`,
        expectedOutput: 'A 2-paragraph plain-English performance narrative suitable for a client meeting or quarterly email.'
      },
      {
        id: 'cw-4-s2',
        stepNumber: 2,
        title: 'Add Market Context & Allocation Commentary',
        instruction: 'Provide the current portfolio allocation and let Claude contextualise it against current macro conditions and the client\'s target allocation.',
        promptTemplate: `The client's current portfolio allocation is:\n- Equities: [X]%\n  - US Large Cap: [%], International Developed: [%], Emerging Markets: [%]\n- Fixed Income: [Y]%\n  - Investment Grade: [%], High Yield: [%], Treasuries: [%]\n- Alternatives / Real Assets: [Z]%\n- Cash: [W]%\n\nThe client's target allocation per their IPS is:\n[Paste or describe target allocation]\n\nKey market context this quarter: [e.g. "Fed held rates steady. Tech led the market. Credit spreads widened slightly."]\n\nWrite a 1-paragraph allocation commentary that:\n1. Notes any meaningful drift from the target allocation\n2. Connects the macro environment to portfolio positioning\n3. Sets up the recommendations section without making specific recommendations yet\n\nKeep it under 120 words and avoid financial jargon.`,
        expectedOutput: 'A tight 1-paragraph allocation commentary connecting the macro environment to the client\'s current positioning.'
      },
      {
        id: 'cw-4-s3',
        stepNumber: 3,
        title: 'Generate 3 Personalized Recommendations',
        instruction: 'Think through any rebalancing, tax-loss harvesting, or strategic shifts you\'re considering for this client. Describe them in plain language and Claude will convert them into client-ready recommendation cards.',
        promptTemplate: `Based on this client's goals ([Goal]), risk profile ([Profile]), and current allocation drift, I am considering the following changes:\n\n1. [Your first idea in plain language — e.g. "Trim tech exposure and rotate into dividend payers to reduce volatility"]\n2. [Your second idea — e.g. "Increase short-duration bond allocation given rate uncertainty"]\n3. [Your third idea — e.g. "Deploy the 8% cash position since we've been sitting on it since Q2"]\n\nFor each recommendation, create a client-ready recommendation card formatted as follows:\n\n📌 **Recommendation:** [Action in plain English]\n**Why now:** [1-sentence rationale tied to their specific goal or market context]\n**What this means for your portfolio:** [1 sentence on expected impact — e.g. "This reduces your equity concentration from 72% to 65%"]\n**Suggested timeline:** [Immediate / Within 30 days / Review at next quarter]`,
        expectedOutput: '3 formatted, client-ready recommendation cards ready to present or include in a meeting brief.'
      }
    ],
    relatedPlaybooks: [
      { id: 'cw-3', title: 'Private Equity Deal Screener', slug: 'private-equity-deal-screener' },
      { id: '11', title: 'Cash Flow Projection', slug: 'cash-flow-projection' }
    ]
  }
];

export const pricingPlans = [
  {
    name: "Starter",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "For individuals exploring AI workflows",
    features: [
      "3 free playbooks",
      "Basic tools only",
      "Community support",
      "Monthly newsletter"
    ],
    cta: "Get started",
    popular: false
  },
  {
    name: "Pro",
    monthlyPrice: 4.99,
    annualPrice: 3.99,
    description: "For professionals serious about efficiency",
    features: [
      "All 50+ playbooks",
      "Advanced tool stacks",
      "Personal playbook library",
      "Priority email support",
      "New playbooks weekly",
      "Time tracking analytics"
    ],
    cta: "Upgrade to Pro",
    popular: true
  },
  {
    name: "Enterprise",
    monthlyPrice: 29.99,
    annualPrice: 24.99,
    description: "For teams needing admin control and basic organization features",
    features: [
      "Everything in Pro",
      "Team collaboration tools",
      "Admin activity dashboard",
      "Group billing",
      "Priority secure support"
    ],
    cta: "Start Enterprise",
    popular: false
  },
  {
    name: "Custom Build",
    monthlyPrice: 0,
    annualPrice: 0,
    price: "Custom",
    description: "Done-for-you migration, custom agents, and team training workshops",
    features: [
      "SOP & Policy Analysis integration",
      "Mass Data Sanitization",
      "Employee Training Solutions",
      "On-premise deployment options"
    ],
    cta: "Contact sales",
    popular: false
  }
];

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Business Development': '#4F46E5',
    'Sales Ops': '#059669',
    'Marketing': '#D97706',
    'Finance': '#DB2777',
    'Operations': '#7C3AED',
    'HR': '#0D9488',
    'Product': '#EA580C',
    'Legal': '#475569',
    'Claude Crash Course': '#DA7756',
    'Fitness & Wellness': '#10B981',
    'Risk & Strategy': '#DC2626',
    'Content': '#8B5CF6',
    'Career': '#0EA5E9'
  };
  return colors[category] || '#4F46E5';
};

export const smbPlaybooks: Playbook[] = [
  {
    id: 'smb-1',
    title: 'The 30-Day Social Media Content Engine',
    slug: '30-day-social-media-content-engine',
    category: 'Marketing',
    subtitle: 'Generate a full month of engaging, brand-aligned social media posts for your local business in 10 minutes.',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 300,
    isPro: false,
    isNew: true,
    expectedOutcome: 'A complete 30-day social media calendar with fully written captions and suggested imagery.',
    tools: ['ChatGPT', 'Claude'],
    rating: 4.8,
    completionCount: 2041,
    agentAutomation: {
      description: 'Fully automate this process so posts generate and publish themselves weekly.',
      trigger: 'Every Monday morning at 8 AM via Make.com',
      actions: [
        'Watch for new promotional ideas in a Google Sheet',
        'Send ideas to ChatGPT to generate a weekly social media schedule and write captions',
        'Send approved posts to Buffer API to automatically schedule them across all social channels'
      ],
      setupSteps: [
        { title: 'Create a Make.com Account & Scenario', description: "Go to Make.com and sign up for a free account. Once logged in, click 'Scenarios' on the left sidebar, then click the purple 'Create a new scenario' button in the top right. Click the big plus '+' icon in the middle of the screen." },
        { title: 'Set Up the Google Sheets Trigger', description: "Search for 'Google Sheets' and select the 'Watch Rows' trigger. Click 'Add' to connect your Google account. Select your specific spreadsheet and the worksheet containing your promotional ideas. This tells Make to check for new rows automatically." },
        { title: 'Add the OpenAI (ChatGPT) Module', description: "Click 'Add another module' next to Google Sheets. Search for 'OpenAI' and select 'Create a Chat Completion'. Click 'Add' to enter your OpenAI API key (found at platform.openai.com). Select 'gpt-4o-mini' as the model." },
        { title: 'Configure the AI Prompt', description: "Inside the OpenAI module settings, add a Message. Set the Role to 'User'. In the Content field, type: 'Write 7 social media posts based on this offer: '. Then, click inside the box and select the column name from your Google Sheet to dynamically inject the data." },
        { title: 'Connect to Buffer & Activate', description: "Add a final module: 'Buffer -> Create a Status'. Connect your Buffer account. In the 'Text' field, map the 'Choices[].Message.Content' variable output from OpenAI. Click 'OK', save your scenario, and toggle the switch at the bottom left to 'ON'." }
      ],
      tools: ['Make.com', 'Google Sheets', 'OpenAI', 'Buffer']
    },
    troubleshooting: [
      {
        problem: 'Posts sound identical even after brand voice setup',
        solution: 'Add more texture to your brand voice prompt. Instead of "friendly and professional", describe it with examples: "We sound like a knowledgeable friend, not a corporation. We use contractions, short sentences, and never use the word \'leverage\' or \'synergy\'."'
      },
      {
        problem: 'Buffer scheduling fails and posts do not go out at the right times',
        solution: 'Verify that your Buffer account has the correct time zone set and that the social channel is still connected (tokens expire). Reconnect the channel in Buffer before activating the Make.com automation to prevent silent failures.'
      },
      {
        problem: 'Calendar runs out of variety by week 3 and becomes repetitive',
        solution: 'Add a "content rotation rule" to your Make.com prompt: "For each 7-day block, include no more than 2 posts of the same content theme. Rotate across promotional, educational, behind-the-scenes, and social proof categories."'
      }
    ],
    beforeYouStart: [],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'smb-1-s1',
        stepNumber: 1,
        title: 'Define Your Brand Voice',
        instruction: 'Give the AI full context about your business — including your website and real post examples — so every caption sounds authentically like you.',
        promptTemplate: 'I own [Business Name & Industry]. My target audience is [Target Audience]. We currently have the following offers: [Current Promotions/Offers]. My website is [Your Website URL]. Here are 2–3 of my best recent posts so you can match my tone: [Your Best 2-3 Posts]. Study my website and example posts, then adopt that exact voice and style for all content you generate.',
        expectedOutput: 'Confirmation that the AI has studied your brand voice, with a short summary of the tone and style it will use.'
      },
      {
        id: 'smb-1-s2',
        stepNumber: 2,
        title: 'Generate the Calendar',
        instruction: 'Ask the AI to structure a 30-day plan that mixes different types of content.',
        promptTemplate: 'Generate a 30-day social media content calendar in a table format. Include columns for: Day, Content Theme (e.g., Behind-the-scenes, Customer Spotlight, Promotion), and the Suggested Image/Video to post.',
        expectedOutput: 'A structured 30-row table outlining a month of varied content.'
      },
      {
        id: 'smb-1-s3',
        stepNumber: 3,
        title: 'Write the Captions & Hashtags',
        instruction: 'Turn the calendar into actual ready-to-post text.',
        promptTemplate: 'Now, write the exact captions for ALL 30 days based on the calendar you just generated. For each day, label it clearly (e.g. "Day 1 — [Theme]:") then write the full caption. Include relevant local and industry hashtags. Keep the tone conversational and include a clear Call-To-Action (like "Visit our store today" or "Link in bio") for promotional posts.',
        expectedOutput: '30 fully written, emoji-ready captions — one for each day — that you can copy directly into Facebook or Instagram.'
      }
    ]
  },
  {
    id: 'smb-2',
    title: 'Professional Overdue Invoice Chaser',
    slug: 'professional-overdue-invoice-chaser',
    category: 'Finance',
    subtitle: 'Recover unpaid invoices without ruining your client relationships using perfectly toned follow-up emails.',
    difficulty: 'Beginner',
    timeToComplete: 5,
    timeSaved: 60,
    isPro: false,
    isNew: true,
    expectedOutcome: 'A professional, escalating sequence of 3 emails designed to get you paid immediately.',
    tools: ['ChatGPT', 'Email Client'],
    rating: 4.9,
    completionCount: 3125,
    agentAutomation: {
      description: 'Automatically trigger follow-up sequences when an invoice becomes overdue in your accounting software.',
      trigger: 'When an invoice status changes to "Overdue" in QuickBooks or Xero via Zapier',
      actions: [
        'Zapier calculates days overdue',
        'Send details to ChatGPT to generate an appropriately toned email',
        'Save the draft directly into your Gmail Drafts folder for quick review and sending'
      ],
      setupSteps: [
        { title: 'Create a Zapier Account & Make a Zap', description: "Go to Zapier.com, sign up, and click the bold 'Create a Zap' button. A Zap is exactly like a playbook, but for software talking to other software automatically." },
        { title: 'Configure the QuickBooks Trigger', description: "For the Trigger step, search for 'QuickBooks Online' (or Xero) and select the 'New Invoice' event. Connect your account and test it. Add a 'Filter by Zapier' step to only continue if 'Status' matches 'Overdue' and Due Date is past." },
        { title: 'Set Up OpenAI for Email Drafting', description: "Add an Action step, search for 'OpenAI (ChatGPT)', and choose 'Send Prompt'. Connect your API key. In the Prompt field, type your instructions (e.g., 'Write a polite follow-up') and click to insert variables from QuickBooks, like Customer Name and Balance Due." },
        { title: 'Create a Gmail Draft', description: "Add a final Action step: 'Gmail -> Create Draft'. Connect your Google account. Put the Customer Email variable (from QuickBooks) in the 'To' field. In the 'Body' field, insert the 'Choices Text' variable generated by OpenAI in the previous step." },
        { title: 'Test and Publish', description: "Click 'Test step' on the Gmail module. Go to your actual Gmail Drafts folder to see the perfectly written email waiting for you! If it looks good, return to Zapier and click 'Publish' to make this run automatically in the background." }
      ],
      tools: ['Zapier', 'QuickBooks / Xero', 'OpenAI', 'Gmail']
    },
    troubleshooting: [
      {
        problem: 'Clients are not responding to any of the three emails',
        solution: 'Check whether your emails are landing in spam — especially the final notice, which can trigger spam filters due to payment-related language. Ask Claude to remove words like "overdue", "past due", and "final notice" from subject lines and replace with neutral language like "A follow-up on Invoice #[X]".'
      },
      {
        problem: 'The firm follow-up email is too similar in tone to the initial reminder',
        solution: 'Explicitly instruct Claude to escalate tone between emails: "Email 1 should sound like a friendly check-in. Email 2 should sound like a professional follow-up expecting a response. Email 3 should be formal and create urgency without being aggressive." Label the tone shift clearly in your prompt.'
      },
      {
        problem: 'QuickBooks invoice status does not update to Overdue automatically',
        solution: 'QuickBooks marks invoices as Overdue only after the payment due date passes. If your due date field is blank or incorrect, no Zapier trigger will fire. Check that every invoice has an explicit due date set in QuickBooks before relying on automation.'
      }
    ],
    beforeYouStart: [],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'smb-2-s1',
        stepNumber: 1,
        title: 'The Polite Reminder (Day 3 Overdue)',
        instruction: 'Tone is everything when chasing money. Start by assuming they just forgot.',
        promptTemplate: 'Write a polite, friendly email to [Client Name] reminding them that [Invoice Number & Amount] is currently [Days Overdue] days overdue. Assume they just forgot or missed the email. Keep it short and professional.',
        expectedOutput: 'A short, polite reminder email.'
      },
      {
        id: 'smb-2-s2',
        stepNumber: 2,
        title: 'The Firm Follow-Up (Day 15 Overdue)',
        instruction: 'If they don\'t respond to the first check-in, escalate the tone slightly.',
        promptTemplate: 'Write a second follow-up email to [Client Name] regarding the same [Invoice Number & Amount]. The tone should be firm but professional, requesting an immediate update on the payment status and offering a call if there are any issues with the invoice.',
        expectedOutput: 'A firmer email requesting a payment status update.'
      },
      {
        id: 'smb-2-s3',
        stepNumber: 3,
        title: 'The Final Notice (Day 30+ Overdue)',
        instruction: 'For severe delays, issue a final warning email.',
        promptTemplate: 'Write a final notice email to [Client Name] for [Invoice Number & Amount]. State clearly that the invoice is severely overdue and that further delays may result in paused services or late fees (if applicable). Maintain a strictly formal and objective business tone without sounding purely emotional.',
        expectedOutput: 'A formal final notice detailing consequences for non-payment.'
      }
    ]
  },
  {
    id: 'smb-3',
    title: 'Local SEO Competitor Analysis',
    slug: 'local-seo-competitor-analysis',
    category: 'Growth',
    subtitle: 'Find out exactly why the business down the street is ranking higher on Google, and how to beat them.',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 180,
    isPro: true,
    isNew: true,
    expectedOutcome: 'A clear intelligence report on your competitor and an actionable 5-step checklist to outrank them.',
    tools: ['Perplexity'],
    rating: 4.7,
    completionCount: 890,
    agentAutomation: {
      description: 'Get an automated weekly brief on your top competitor\'s marketing changes without lifting a finger.',
      trigger: 'Every Friday afternoon via Make.com schedule',
      actions: [
        'Scrape your competitor\'s website for new pages or updated offers using a web scraper module',
        'Send new data to ChatGPT to summarize what changed this week',
        'Send a concise summary directly to your Slack channel or email'
      ],
      setupSteps: [
        { title: 'Set Up Make.com & Web Scraper', description: "In Make.com, create a new scenario. Click the '+' button, search for 'HTTP', and select 'Make a request'. In the URL field, paste your competitor's Pricing or Features page URL. Set the Method to 'GET'. This module will fetch the raw HTML of their webpage." },
        { title: 'Clean the Scraped Data', description: "Websites have a lot of code. Add a 'Text parser' module and select 'HTML to text'. Connect the 'Data' variable from the HTTP module into the text parser. This strips out all the coding language, leaving only the readable text from your competitor's site." },
        { title: 'Analyze with ChatGPT', description: "Add an 'OpenAI -> Create a Chat Completion' module. In the Message Content, type 'Review this competitor website text and summarize the 3 biggest changes or offers they are pushing: '. Immediately after that sentence, map the clean text variable from your Text Parser module." },
        { title: 'Send the Report to Slack', description: "Add a 'Slack -> Create a Message' module (or Email). Connect your team workspace. Choose the channel (e.g., #marketing-intel). In the Text field, map the output variable ('Choices[].Message.Content') from the OpenAI module." },
        { title: 'Set the Weekly Schedule', description: "Click the clock icon attached to your very first module (HTTP). Change the schedule from 'Every 15 minutes' to 'Days of the week'. Select Friday, and set the time to 16:00 (4:00 PM). Turn the scenario 'ON' to get automated weekly reports." }
      ],
      tools: ['Make.com', 'Web Scraper', 'OpenAI', 'Slack']
    },
    troubleshooting: [
      {
        problem: 'Perplexity cannot find much information about a very small local competitor',
        solution: 'Search directly instead: type the competitor\'s business name and city into Google, then check their Google Business Profile, Facebook page, and Nextdoor for customer mentions. Paste what you find into Claude and ask it to do the gap analysis from that raw data.'
      },
      {
        problem: 'The 5-step action checklist includes technical SEO tasks the owner cannot do without a developer',
        solution: 'Add a constraint to your Step 3 prompt: "All 5 action steps must be things I can do myself in under 30 minutes each, with no coding or technical skills required. Focus on Google Business Profile updates, website copy edits, and review generation."'
      },
      {
        problem: 'Make.com web scraper returns garbled HTML instead of readable competitor content',
        solution: 'Add a "Text Parser → HTML to Text" module immediately after the HTTP request module. This strips the raw HTML tags and leaves only the readable text. Without this step the OpenAI module receives HTML noise, not usable content.'
      }
    ],
    beforeYouStart: [],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'smb-3-s1',
        stepNumber: 1,
        title: 'Gather Market Data',
        instruction: 'Open Perplexity.ai (a search-connected AI) to analyze your local market web presence.',
        promptTemplate: 'Search the web for [Your Business Name & Website] and [Top Competitor Name & Website] in [Your Local City]. Summarize the overall online presence, search ranking focus, and Google Business Profile reputation of both businesses.',
        expectedOutput: 'A side-by-side comparison of local online visibility.'
      },
      {
        id: 'smb-3-s2',
        stepNumber: 2,
        title: 'Identify the Content Gap',
        instruction: 'Ask the AI to find what your competitor is talking about that you are missing.',
        promptTemplate: 'Based on the websites of both businesses, identify 3 specific services, keywords, or customer pain points that my competitor highlights well on their website, but my website does not address clearly.',
        expectedOutput: 'A list of "content gaps" you currently have compared to your competitor.'
      },
      {
        id: 'smb-3-s3',
        stepNumber: 3,
        title: 'Action Plan Extraction',
        instruction: 'Turn the analysis into a to-do list for yourself or your marketing assistant.',
        promptTemplate: 'Give me a step-by-step checklist of 5 exact things I can do this week to improve my website\'s local SEO and compete directly with [Top Competitor Name] based on the content gaps you just found.',
        expectedOutput: '5 clear, actionable steps you can execute immediately to improve rankings.'
      }
    ]
  },
  {
    id: 'smb-4',
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
    agentAutomation: {
      description: 'Automatically draft empathetic responses the second a bad review or complaint email comes in.',
      trigger: 'When a 1-star review is posted or an email arrives in your support inbox',
      actions: [
        'Zapier triggers on the new negative feedback',
        'ChatGPT analyzes the sentiment and drafts an empathetic, policy-compliant response based on your custom prompt constraints',
        'Zapier stages the response in Zendesk or Gmail as an internal note/draft for a human to hit "send"'
      ],
      setupSteps: [
        { title: 'Trigger on Negative Reviews', description: "In Zapier, click 'Create a Zap'. Choose your customer service platform (like Zendesk, Gmail, or Trustpilot) as the Trigger. Select 'New Ticket'. Add a 'Filter by Zapier' step. Set the filter condition to continue ONLY if the text contains keywords like 'angry' or if the rating is '1 Star'." },
        { title: 'Connect the AI Empathy Engine', description: "Add an 'OpenAI -> Send Prompt' action. In the prompt field, type 'You are an empathetic customer service expert. De-escalate this customer complaint. Validate their frustration but do not admit legal fault. Here is the complaint: '. Then, map the Ticket Text variable from step 1." },
        { title: 'Configure Output Constraints', description: "In the same OpenAI step, set the 'Temperature' setting to 0.7 (this makes the AI sound more human). Add to your prompt: 'Ensure the response is under 150 words and ends with an offer to schedule a call with management.'" },
        { title: 'Stage as an Internal Note', description: "You don't want AI sending emails to angry customers unsupervised. Add an action for your platform (e.g., Zendesk 'Add Comment to Ticket'). Map the AI's generated response into the comment body, and ensure it is marked as 'Private' or 'Internal'." },
        { title: 'Review and Train', description: "Publish the Zap. The next time an angry complaint comes in, your team will open the ticket and see a perfectly drafted, empathetic response waiting in the internal notes. They can simply review, edit if necessary, and send it to the customer." }
      ],
      tools: ['Zapier', 'Zendesk / Gmail', 'OpenAI']
    },
    troubleshooting: [
      {
        problem: 'The AI-generated response sounds robotic and the customer will know it was written by AI',
        solution: 'After generating the draft, add a humanization pass: "Rewrite this email in first person from the business owner. Add one specific personal detail — mention the customer\'s exact complaint by name, not generically. Remove any phrase that sounds like a template."'
      },
      {
        problem: 'Response inadvertently admits fault and creates legal liability',
        solution: 'Add a legal safety instruction to your prompt: "Do not use language that admits fault or implies the business was negligent. Use phrases like \'I\'m sorry you had this experience\' instead of \'You\'re right, we made a mistake.\' Validate emotion without conceding liability."'
      },
      {
        problem: 'Public Google review response is too long and looks defensive',
        solution: 'For public review responses, add a length constraint: "Keep the response under 80 words. Short, warm, and specific beats long and defensive every time for public reviews. Invite them to continue the conversation privately."'
      }
    ],
    beforeYouStart: [],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'smb-4-s1',
        stepNumber: 1,
        title: 'Remove Emotion from the Equation',
        instruction: 'When a customer is angry, it\'s hard to reply calmly. Let the AI inject the empathy for you. Open ChatGPT.',
      },
      {
        id: 'smb-4-s2',
        stepNumber: 2,
        title: 'Draft the Response',
        instruction: 'Share the exact complaint and your company policy with the AI.',
        promptTemplate: 'Act as a senior customer service manager. Read the following angry complaint from a customer: "[Paste the Customer\'s Complaint/Review]". Write a highly empathetic, de-escalating response. Apologize for their frustration, validate their feelings, and offer the following resolution based on our standard policy: [Your Business Policy on Refunds/Make-Goods].',
        expectedOutput: 'A calm, perfectly structured apologetic email offering your defined resolution.'
      },
      {
        id: 'smb-4-s3',
        stepNumber: 3,
        title: 'Review and Send',
        instruction: 'Read the drafted email. Ensure it sounds human and sincere. If it looks good, copy and paste it into your email client or the review platform (like Yelp or Google My Business) to publicly or privately address the customer.',
        expectedOutput: 'A successfully resolved customer escalation.'
      }
    ]
  },
  {
    id: 'smb-5',
    title: 'Vendor Price Negotiation Script',
    slug: 'vendor-price-negotiation-script',
    category: 'Operations',
    subtitle: 'Confidently ask your suppliers for better rates or payment terms using proven negotiation framing.',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 120,
    isPro: true,
    isNew: true,
    expectedOutcome: 'A negotiation strategy and a professionally drafted outreach email to your vendor requesting better terms.',
    tools: ['ChatGPT', 'Claude'],
    rating: 4.6,
    completionCount: 1540,
    agentAutomation: {
      description: 'While actual negotiations should be human-led, you can automate vendor performance tracking to trigger renegotiations.',
      trigger: 'When vendor spend crosses a set threshold ($10,000) in your ERP or accounting tool',
      actions: [
        'Make.com watches for spend thresholds',
        'ChatGPT analyzes your historical spend with that vendor and drafts a data-backed renegotiation strategy email',
        'Save the email as a draft and send you a Slack notification reading: "Time to negotiate with [VendorName]"'
      ],
      setupSteps: [
        { title: 'Trigger on Spend Thresholds', description: "In Make.com, create a scenario starting with your accounting tool (like QuickBooks). Choose 'Watch Bills'. Add a 'Router' module to split the flow. On one route, add a filter to only proceed if the 'Vendor Name' equals your target supplier AND the 'Total Amount' is greater than $10,000." },
        { title: 'Pull Historical Context', description: "Before negotiating, you need leverage. Add a 'Google Sheets -> Search Rows' module linked to a spreadsheet where you track competitor pricing. Search for the service you are buying to fetch the current market rate." },
        { title: 'Draft Negotiation Strategy', description: "Add an 'OpenAI -> Create Chat Completion' module. Prompt it: 'Act as a ruthless procurement officer. My vendor [Vendor Name] just billed me [Amount]. Market rate is [Competitor Rate]. Draft an email to my account rep asking for a 10% volume discount.' Map the variables from your QuickBooks/Sheets modules into the brackets." },
        { title: 'Alert Operator in Slack', description: "Add a 'Slack -> Create a Message' module. Send it to yourself as a Direct Message. Format the text as: '🚨 Time to negotiate with [Vendor Name]! Here is your strategy & drafted email: ' followed by the output from the OpenAI module." },
        { title: 'Review and Execute', description: "Save and activate the scenario. You now have an automated watchdog that tracks supplier spend and proactively hands you a tailored, data-backed negotiation script exactly when you have the most leverage to ask for a discount." }
      ],
      tools: ['Make.com', 'QuickBooks / ERP', 'OpenAI', 'Slack']
    },
    troubleshooting: [
      {
        problem: 'The negotiation email is too aggressive and risks damaging the vendor relationship',
        solution: 'Review the AI draft and soften any language that positions it as a demand. Add: "Rewrite this to sound collaborative, not adversarial. Frame the ask as wanting to grow the relationship, not a threat to leave." The best vendor negotiations feel like partnership conversations.'
      },
      {
        problem: 'Vendor responds that their margins do not allow a discount',
        solution: 'Use the alternative concessions approach from Step 3. Shift the conversation to non-cash value: extended payment terms (Net-60 instead of Net-30), free delivery, priority stock allocation, or a price lock for 12 months. Ask Claude to generate an email pivoting to two of these alternatives.'
      },
      {
        problem: 'Market rate comparison data used in the negotiation is out of date',
        solution: 'Get at least one real competing quote before negotiating — even an informal one. A quote email from a competitor is worth more than any AI-generated market rate estimate. Mention the quote in general terms ("we\'ve received a quote for less from another supplier") without necessarily naming them.'
      }
    ],
    beforeYouStart: [],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'smb-5-s1',
        stepNumber: 1,
        title: 'Prepare the Strategy',
        instruction: 'Before emailing a vendor, use AI to structure your argument solidly based on loyalty or market rates.',
        promptTemplate: 'I need to renegotiate terms with my supplier, [Supplier Name], for [Current Product/Service Bought]. My goal is to get [Your Goal (e.g., 10% discount, Net-60 terms)]. Act as an expert procurement negotiator and give me a 3-bullet strategy on how to frame this request so it sounds like a win-win partnership rather than an aggressive demand.',
        expectedOutput: 'A psychological and business strategy for framing your request to the vendor.'
      },
      {
        id: 'smb-5-s2',
        stepNumber: 2,
        title: 'Draft the Outreach Email',
        instruction: 'Let the AI write the delicate first email using the strategy it just created.',
        promptTemplate: 'Write the initial email to my account rep at [Supplier Name]. Highlight our history of reliable business together, and gracefully request [Your Goal]. Keep the email concise, professional, and entirely open to discussion. Do not make ultimatums.',
        expectedOutput: 'A drafted email ready to be sent to your supplier rep.'
      },
      {
        id: 'smb-5-s3',
        stepNumber: 3,
        title: 'Counter-Offer Practice (Optional)',
        instruction: 'If they say no, have a backup plan ready.',
        promptTemplate: 'If the supplier replies saying their margins are too tight to offer a direct discount, what are two alternative business concessions I should immediately ask for instead (e.g., free shipping, better payment terms)? Draft a polite reply email pivoting to these alternatives.',
        expectedOutput: 'A backup email pivoting to other valuable terms like Net-60 or volume shipping discounts.'
      }
    ]
  },
  {
    id: 'legal-1',
    slug: 'automated-contract-review',
    title: 'Automated Contract Redlining',
    subtitle: 'Extract risks, missing clauses, and non-standard terms from legal PDFs in seconds.',
    category: 'Legal',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 120,
    completionCount: 310,
    rating: 4.8,
    isPro: true,
    tools: ['ChatGPT', 'Google Drive', 'Make.com'],
    beforeYouStart: [
      'A folder to drop unreviewed contracts into.',
      'A firm-approved "Standard Terms" checklist or playbook.'
    ],
    expectedOutcome: 'A highly structured summary document flagging deviations from your standard clauses and suggesting redlines.',
    agentAutomation: {
      description: 'Connect a Google Drive folder to OpenAI via Make.com. Whenever a new contract is uploaded, an AI agent parses the text, compares it against your standard legal playbook, and outputs a risk analysis document.',
      trigger: 'New File Uploaded to Google Drive Folder',
      actions: [
        'Extract text from PDF',
        'Compare clauses against Legal Playbook',
        'Flag non-standard liability, indemnification, or governing law clauses',
        'Generate Contract Summary Doc'
      ],
      setupSteps: [
        { title: 'Drive Setup', description: "Create two folders in Google Drive: '1. Unreviewed Contracts' and '2. AI Contract Summaries'." },
        { title: 'Trigger on Make.com', description: "In Make.com, create a new scenario starting with 'Google Drive -> Watch Files in a Folder'. Set it to watch your 'Unreviewed Contracts' folder." },
        { title: 'Read the PDF', description: "Add a 'Google Drive -> Download a File' module, followed by a 'PDF.co' or 'Google Cloud Vision' module to parse the raw text out of the uploaded PDF." },
        { title: 'Analyze with AI', description: "Add an 'OpenAI -> Create Chat Completion' module. Prompt: 'Act as a senior paralegal. I am providing a contract. Please review it against these standard guidelines: 1. Governing Law must be Delaware. 2. Net-30 payment terms. 3. Mutual indemnification. Flag any deviations and summarize the key risks.' Map the PDF text into the prompt." },
        { title: 'Format the Output', description: "Add a 'Google Docs -> Create a Document' module. Save the AI's analysis directly into your 'AI Contract Summaries' folder, named 'Review: [Original File Name]'." }
      ],
      tools: ['Make.com', 'OpenAI', 'Google Drive / Docs']
    },
    troubleshooting: [
      {
        problem: 'PDF.co fails to extract text from scanned or image-based PDFs',
        solution: 'Scanned PDFs need OCR before extraction. Use Google Cloud Vision OCR or Adobe PDF Extract API as a pre-processing step before passing text to Claude. Alternatively, switch to contracts sent as Word documents (.docx) where text extraction is straightforward.'
      },
      {
        problem: 'AI flags non-standard clauses that your legal team has already approved as acceptable deviations',
        solution: 'Add an approved exceptions list to your system prompt: "The following deviations from standard terms are pre-approved and should NOT be flagged: [list]. Only flag deviations not on this list." This prevents your team from reviewing the same approved exceptions repeatedly.'
      },
      {
        problem: 'Contract summary document is too long and legal team is not reading the full output',
        solution: 'Ask Claude to output an "Executive Risk Summary" at the top limited to 5 bullet points — the 5 most material deviations only. Full detail below for anyone who needs it. Teams read summaries; long analysis documents get skimmed or ignored.'
      }
    ],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'leg1-s1',
        stepNumber: 1,
        title: 'Define Standard Terms',
        instruction: 'The AI needs a benchmark to compare against. Use ChatGPT to help standardize your terms.',
        promptTemplate: 'I am building an automated contract review agent. I usually push for [List your standard terms, e.g. Net-30, Delaware law, 30-day out clause]. Draft a highly explicit prompt instruction block I can feed into my AI agent so it knows exactly what to look for and what is considered an acceptable deviation.',
        expectedOutput: 'A dense, strict system prompt defining your legal boundaries.'
      }
    ]
  },
  {
    id: 'product-1',
    slug: 'user-feedback-synthesizer',
    title: 'The AI Feature Request Synthesizer',
    subtitle: 'Group 1,000s of messy Zendesk tickets and Gong calls into prioritized product features.',
    category: 'Product',
    difficulty: 'Advanced',
    timeToComplete: 20,
    timeSaved: 300,
    completionCount: 540,
    rating: 4.9,
    isPro: true,
    tools: ['Zapier', 'Zendesk / Intercom', 'Notion', 'OpenAI'],
    beforeYouStart: [
      'A place where customer feedback lives (Zendesk, Intercom, Gong).',
      'A Product Management hub (Jira, Notion, Linear).'
    ],
    expectedOutcome: 'A continuously updating Notion board that clusters random feature requests into Epic-level initiatives, ranked by volume of requests.',
    agentAutomation: {
      description: 'Stream all customer feedback tags into a central AI processor. Once a week, the AI reads all new feedback, clusters similar requests together, assigns a severity score, and updates your Product backlog roadmap automatically.',
      trigger: 'Ticket Tagged "Feature Request"',
      actions: [
        'Queue request text in a database',
        'Weekly AI batch processing and clustering',
        'Identify duplicate underlying pain points',
        'Update Notion/Jira Roadmap with request volume'
      ],
      setupSteps: [
        { title: 'Catch the Feedback', description: "In Zapier, set your trigger to 'New Ticket' in Zendesk (or Intercom). Add a Filter step so it only continues if the ticket has the tag 'feature_request'." },
        { title: 'Store Raw Data', description: "Add a step to append the ticket text, user email, and MRR (if available) into a raw Google Sheet or Airtable base." },
        { title: 'The Weekly Synthesizer', description: "Create a *second* Zap that runs on a schedule (e.g., Every Friday at 4 PM). Set it to pull all new rows from your raw feedback sheet from that week." },
        { title: 'Cluster with AI', description: "Pass the batch of rows into OpenAI. Prompt: 'Here is this week's raw product feedback. Group them into the top 3 core pain points. For each pain point, suggest a potential Epic or Feature that solves it, and count how many disparate users asked for it.'" },
        { title: 'Update the Roadmap', description: "Use the 'Notion -> Create Database Item' (or Jira) step to take the AI's clusters and automatically create new PM tickets in your backlog, tagged with 'AI Synthesized' and the volume count." }
      ],
      tools: ['Zapier', 'Zendesk', 'OpenAI', 'Notion']
    },
    troubleshooting: [
      {
        problem: 'AI clusters feedback into the same 2-3 themes every week regardless of actual variance',
        solution: 'Constrain the clustering instruction: "Do not default to the same themes. Compare this week\'s clusters against last week\'s output and flag any new themes that did not appear previously. New themes are more actionable than recurring ones."'
      },
      {
        problem: 'Feature requests from low-MRR customers are overwhelming the roadmap signal',
        solution: 'Add MRR weighting to the clustering prompt: "When grouping requests, note the total MRR of the customers who requested each feature. Prioritize clusters where the requesting customers represent above-average MRR, not just raw request volume."'
      },
      {
        problem: 'Notion tickets created by automation are missing enough context for the PM to take action',
        solution: 'Ensure each Notion ticket includes: the cluster theme, a verbatim example request, total request count, estimated MRR represented, and a one-line product recommendation. Without the verbatim example, PMs cannot validate whether the AI cluster is accurate.'
      }
    ],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'prod1-s1',
        stepNumber: 1,
        title: 'Calibrate the AI Product Manager',
        instruction: 'If the AI doesn\'t understand your product, it will suggest useless features. Build a context block.',
        promptTemplate: 'I am building an AI that automatically clusters user feedback into feature requests. Our product is a [Describe your product], built for [Target Persona]. The core value proposition is [Core Value]. If a user asks for [Give an example of a bad request], we do NOT build it. Based on this, write a rigid system prompt teaching the AI how to categorize feedback aligned with our vision.',
        expectedOutput: 'A product-vision prompt to guide the AI clustering.'
      }
    ]
  },

  // ─── SMB BOOKKEEPING PLAYBOOKS ────────────────────────────────────────────

  {
    id: 'smb-bk-1',
    slug: 'ai-bookkeeper-weekly-transaction-categorization',
    title: 'AI Bookkeeper: Weekly Transaction Categorization',
    subtitle: 'Categorize a week of business spending in 15 minutes — works whether your records are in Excel, a notebook, a shoebox of receipts, or a bank statement.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 15,
    timeSaved: 180,
    completionCount: 892,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['ChatGPT', 'Claude', 'Excel', 'Google Sheets'],
    beforeYouStart: [
      'Your spending records for the week in ANY format — an Excel spreadsheet you built yourself, a notebook with handwritten entries, a stack of paper receipts, a printed bank statement, or a photo of your records. All of these work.',
      'A rough list of the expense categories you want to use (e.g. Rent, Supplies, Staff, Marketing, Transport). If you don\'t have one, the AI will suggest categories for your business type.',
      'Access to ChatGPT (free tier works) or Claude — just the chat window, nothing else needed.',
      'Optional: a simple blank Excel or Google Sheet to paste the cleaned results into.'
    ],
    expectedOutcome: 'Every transaction from the week labeled with the correct category, a clean table you can save in Excel or Google Sheets, and a one-paragraph plain-English summary of where the money went.',
    agentAutomation: {
      description: 'Connect your bank via Plaid or a CSV export to Make.com, let AI auto-categorize every transaction, and push the results straight into your accounting software — zero manual data entry.',
      trigger: 'Every Sunday at 11 PM, Make.com fetches the week\'s transactions from your bank export in Google Drive.',
      actions: [
        'Download new transaction rows from a watched Google Sheet (your bank CSV dump)',
        'Send transactions in batches to Claude via API for categorization against your chart of accounts',
        'Write categorized rows back to a "Ledger" Google Sheet tab',
        'Create a draft journal entry in QuickBooks Online or Xero via their API',
        'Email you a summary of flagged transactions that need your manual review'
      ],
      setupSteps: [
        { title: 'Set Up Your Master Google Sheet', description: "Create a Google Sheet with two tabs: 'Raw Imports' (where you paste your bank CSV each week) and 'Categorized Ledger' (where AI results land). Add columns: Date, Description, Amount, Category, Notes, Confidence. Share the sheet with your Make.com Google Sheets connection." },
        { title: 'Configure the Make.com Scenario', description: "In Make.com, create a scenario. Add a 'Google Sheets — Watch New Rows' trigger pointed at your 'Raw Imports' tab. Set it to run every Sunday at 11 PM. This fires the automation whenever you paste new bank transactions into the sheet." },
        { title: 'Add the Claude/OpenAI Categorization Module', description: "Add an 'OpenAI — Create a Chat Completion' module (or HTTP module for Claude). Set the model to gpt-4o or claude-sonnet. In the prompt field, inject the transaction row data dynamically: 'Categorize this transaction: [Date] [Description] [Amount]. Chart of accounts: [paste your list]. Reply ONLY with the category name and a confidence score 1-10.'" },
        { title: 'Write Results Back to the Ledger', description: "Add a 'Google Sheets — Update a Row' module to write the AI\'s category and confidence score into the 'Categorized Ledger' tab. Add a condition: if confidence < 7, also set a 'Needs Review' flag in a separate column." },
        { title: 'Push to QuickBooks or Xero', description: "Add a QuickBooks Online 'Create Expense' module (or Xero 'Create Bank Transaction'). Map: Date → Date, Amount → Amount, Category → Account. For Wave or FreshBooks, use their CSV import instead — export the Categorized Ledger tab as CSV and import it manually each week." }
      ],
      tools: ['Make.com', 'Google Sheets', 'Claude', 'QuickBooks Online', 'Xero']
    },
    troubleshooting: [
      {
        problem: 'The AI keeps miscategorizing the same vendor (e.g. puts "AWS" under Utilities instead of Software)',
        solution: 'Add a "Known Vendors" section to your prompt: "Always categorize transactions containing \'AWS\' or \'Amazon Web Services\' as Software & Subscriptions." Keep a running list and paste it at the top of your prompt each week.'
      },
      {
        problem: 'My bank export has combined transactions (e.g. "PAYROLL" covers multiple employees)',
        solution: 'Ask the AI to split it: "This transaction description is \'PAYROLL $8,500\'. I have 3 employees: [names and salaries]. Split this into separate line items per employee under the Payroll category."'
      },
      {
        problem: 'QuickBooks import fails due to CSV format errors',
        solution: 'QuickBooks expects columns in this exact order: Date (MM/DD/YYYY), Description, Amount (negative for expenses). Ask Claude: "Reformat this ledger into QuickBooks-compatible CSV format with columns: Date, Description, Amount. Expenses should be negative numbers."'
      },
      {
        problem: 'Wave or FreshBooks does not accept my CSV',
        solution: 'Wave requires: Date, Description, Withdrawal Amount, Deposit Amount (separate columns). FreshBooks needs: Date, Category, Amount, Currency, Notes. Tell the AI which platform you use and ask it to reformat accordingly.'
      },
      {
        problem: 'I have hundreds of transactions — the AI hits the context limit',
        solution: 'Process in batches of 50 transactions at a time. Paste 50, get the output, paste the next 50. Alternatively, filter out small transactions under $5 first — they\'re rarely worth the categorization effort.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-bk-2', title: 'Monthly Financial Snapshot & P&L Analyzer', slug: 'monthly-financial-snapshot-pl-analyzer' },
      { id: 'smb-bk-3', title: 'Invoice & Cash Flow Guardian', slug: 'invoice-cash-flow-guardian' },
      { id: 'smb-bk-4', title: 'Tax Season Prep Assistant', slug: 'tax-season-prep-assistant' }
    ],
    steps: [
      {
        id: 'smb-bk-1-s1',
        stepNumber: 1,
        title: 'Get Your Records Into the AI (Any Format Works)',
        instruction: 'You do not need a bank CSV or accounting software. You just need a list of what you spent and received this week — in any form. Pick the method that matches how you actually track money:\n\n• PAPER RECEIPTS / NOTEBOOK: Flip through your receipts or notebook and type each transaction as a simple line: Date, What it was for, Amount. Takes 5-10 minutes.\n• EXCEL / GOOGLE SHEETS: Copy and paste the rows directly from your spreadsheet into the chat.\n• PRINTED BANK STATEMENT: Read across the rows and type the entries. Skip the opening balance, interest lines, and any personal transactions.\n• PHONE PHOTOS: Take a photo of your notebook or receipt pile, upload it to ChatGPT (or Claude), and it will read the text for you automatically.',
        promptTemplate: 'I need help categorizing my business transactions for the week of [WEEK START DATE] to [WEEK END DATE].\n\nMy business is: [business_type]\n\nHere are all my transactions for the week (Date, Description, Amount — negative means money spent, positive means money received):\n\n[transaction_data]\n\nI do not have a formal chart of accounts — please suggest appropriate categories for a business like mine, then categorize each transaction.',
        expectedOutput: 'The AI suggests 6-8 appropriate expense and income categories for your business type, then immediately categorizes every transaction you typed into a clean table.',
        tips: 'If you have a photo of your records, upload the image directly to ChatGPT or Claude and say "Read all the transactions in this image and list them as Date, Description, Amount." Then paste what it reads into the next prompt. This turns a paper notebook into digital records in under 2 minutes.',
        tools: ['ChatGPT', 'Claude']
      },
      {
        id: 'smb-bk-1-s2',
        stepNumber: 2,
        title: 'Feed the AI Your Chart of Accounts',
        instruction: 'Before categorizing, give the AI your exact expense categories so it uses your terminology — not generic defaults. This step is the difference between output you can import and output you have to clean up.',
        promptTemplate: 'Here is my complete Chart of Accounts. When categorizing my transactions, you MUST use only these exact category names — do not invent new ones:\n\nINCOME CATEGORIES:\n- [e.g. Services Revenue]\n- [e.g. Product Sales]\n- [e.g. Consulting Fees]\n\nEXPENSE CATEGORIES:\n- [e.g. Rent & Office Space]\n- [e.g. Payroll & Contractor Fees]\n- [e.g. Software & Subscriptions]\n- [e.g. Marketing & Advertising]\n- [e.g. Meals & Entertainment (50% deductible)]\n- [e.g. Travel & Transportation]\n- [e.g. Office Supplies & Equipment]\n- [e.g. Professional Services (Legal/Accounting)]\n- [e.g. Bank Fees & Interest]\n- [e.g. Utilities]\n- [e.g. Insurance]\n- [e.g. Owner\'s Draw / Distributions]\n- [e.g. Transfers — NOT an expense]\n\nIf you cannot confidently categorize a transaction, label it "NEEDS REVIEW" and explain why.',
        expectedOutput: 'The AI acknowledges the categories and notes any ambiguous ones it may have trouble distinguishing (e.g. the difference between Contractor Fees vs Professional Services).',
        tips: 'Don\'t have a formal chart of accounts yet? Ask the AI: "I run a [type of business]. Create a chart of accounts with 10-15 categories appropriate for a small business filing Schedule C taxes in the US."'
      },
      {
        id: 'smb-bk-1-s3',
        stepNumber: 3,
        title: 'Run the Categorization',
        instruction: 'Paste all your transactions and request categorized output in a format ready for import. The key is asking for structured output — a table or CSV — not prose.',
        promptTemplate: 'Here are all my transactions for the week. Categorize each one using ONLY the chart of accounts I provided. Return the results as a table with these exact columns:\n\nDate | Description | Amount | Category | Notes\n\nRules:\n- Amounts: use negative numbers for expenses, positive for income\n- For transfers between my own accounts, use category "Transfers — NOT an expense"\n- If a description is ambiguous (e.g. just a last name or a random code), label it "NEEDS REVIEW" and note what additional info would help\n- Round amounts to 2 decimal places\n\nHere are the transactions:\n[transaction_data]',
        expectedOutput: 'A clean table with every transaction categorized. Ambiguous ones are flagged as NEEDS REVIEW with an explanation.',
        tips: 'If the table gets cut off (AI hits its output limit), just say "continue from where you left off" and it will pick up at the next transaction.'
      },
      {
        id: 'smb-bk-1-s4',
        stepNumber: 4,
        title: 'Review Flagged Items & Spot-Check',
        instruction: 'Focus your attention on the NEEDS REVIEW items. These are typically ATM withdrawals, peer-to-peer payments (Venmo, Zelle), vague merchant names, or anything unusual. Also spot-check 5-10% of auto-categorized items — AI gets 95% right, but that last 5% needs your judgment.',
        promptTemplate: 'These transactions were flagged as NEEDS REVIEW:\n\n[flagged_transactions]\n\nFor each one, here is the additional context:\n- [e.g. "The $450 Zelle to John Smith is a contractor payment for social media work"]\n- [e.g. "The $89.99 charge from AMZN*MKTP is office paper I ordered"]\n- [e.g. "The $200 ATM withdrawal was for a team lunch — it\'s Meals & Entertainment"]\n\nUpdate the categories based on this context and give me the final corrected rows in the same table format.',
        expectedOutput: 'All previously flagged transactions now correctly categorized with your context applied.',
        tips: 'Keep a running "Known Transactions" doc. Over time, recurring vendors get categorized correctly by default — you\'ll only need to review truly new or unusual items.'
      },
      {
        id: 'smb-bk-1-s5',
        stepNumber: 5,
        title: 'Format for Import & Get Your Weekly Summary',
        instruction: 'Convert the final table to a platform-ready import file and generate a plain-English summary of the week\'s financials you can paste into your team Slack or personal records.',
        promptTemplate: 'Here is my final categorized ledger for the week:\n\n[final_ledger]\n\nPlease do two things:\n\n1. IMPORT FILE: Reformat this as a CSV ready to import into [CHOOSE: QuickBooks Online / Xero / Wave / FreshBooks / Excel]. For QuickBooks, format: Date (MM/DD/YYYY), Name, Memo, Amount (negative = expense). For Xero: Date, Description, Amount, Account Code. For Wave/FreshBooks: I will specify the format. Output the raw CSV text I can copy and save as a .csv file.\n\n2. WEEKLY SUMMARY: Write a 3-sentence plain-English summary of this week\'s finances: total income, total expenses by category, and one observation about anything unusual or notable. Format it as a Slack-ready message.',
        expectedOutput: 'A copy-paste-ready CSV for your accounting platform and a 3-sentence financial summary for your records.',
        tips: 'In QuickBooks Online, import via: Banking > Upload Transactions. In Xero: Accounting > Bank Accounts > Import. In Wave: Transactions > Import. In FreshBooks: Expenses > Import.'
      }
    ]
  },

  {
    id: 'smb-bk-2',
    slug: 'monthly-financial-snapshot-pl-analyzer',
    title: 'Monthly Financial Snapshot & P&L Analyzer',
    subtitle: 'Turn a month of income and spending into a clear Profit & Loss statement — works from a notebook, Excel file, receipts, or any records you already have.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 20,
    timeSaved: 240,
    completionCount: 654,
    rating: 4.8,
    isPro: false,
    isNew: true,
    tools: ['ChatGPT', 'Claude', 'Excel', 'Google Sheets'],
    beforeYouStart: [
      'A rough list of what you earned and what you spent this month — from any source: a notebook, an Excel file you built yourself, receipts you collected in a folder, or just your memory of the main transactions.',
      'Approximate totals are fine. Even if you don\'t have every small transaction, the AI can work with your best estimates to give you a meaningful P&L.',
      'If you ran last month\'s numbers already (even roughly), have those handy — the AI will compare the two months for you.',
      'Access to ChatGPT or Claude — no special software, just the chat window.'
    ],
    expectedOutcome: 'A clean Profit & Loss statement for the month, an AI-generated narrative explaining what the numbers mean, 3 specific observations about trends, and a one-page financial snapshot ready to share with a business partner, investor, or accountant.',
    agentAutomation: {
      description: 'On the 1st of every month, the agent pulls your prior month\'s categorized ledger from Google Sheets, computes the P&L, compares it to the prior month, and emails you a formatted financial snapshot before you\'ve had your morning coffee.',
      trigger: 'First day of every month at 7 AM.',
      actions: [
        'Pull all categorized transactions from prior month from Google Sheets Ledger tab',
        'Group by category and compute totals using a formula step in Make.com',
        'Send the grouped totals to Claude with a comparison prompt',
        'Format AI narrative + P&L table into an HTML email',
        'Send finished Monthly Snapshot email to owner and any co-owners or accountants'
      ],
      setupSteps: [
        { title: 'Structure Your Ledger Sheet', description: "Ensure your Google Sheet Ledger has a \'Month\' column (add one with =TEXT(A2,\"YYYY-MM\") formula). This lets Make.com filter rows by month automatically without complex date logic." },
        { title: 'Create the Monthly Aggregation Step', description: "In Make.com, use a \'Google Sheets — Search Rows\' module to pull all rows where Month = last month. Feed those into a \'Tools — Array Aggregator\' module grouped by the Category column, summing the Amount column. This gives you totals per category." },
        { title: 'Send Totals to Claude', description: "Add an HTTP module to call the Claude API. Build a prompt that includes the aggregated totals, your prior month\'s totals (stored in a separate Summary sheet), and asks for P&L narrative. Store Claude\'s response in a variable." },
        { title: 'Build and Send the Email', description: "Use Make.com\'s Gmail or Resend module to compose an HTML email. Include the P&L table (formatted from your aggregation data) and the AI narrative text. Send to the business owner\'s email and optionally CC your accountant." },
        { title: 'Archive the Summary', description: "Add a final \'Google Sheets — Add Row\' step to write the monthly totals into a \'Monthly Summary\' tab. This builds your historical record automatically — you\'ll use it for year-over-year comparisons later." }
      ],
      tools: ['Make.com', 'Google Sheets', 'Claude', 'Gmail']
    },
    troubleshooting: [
      {
        problem: 'My revenue categories are mixed up (some invoices were partially paid across months)',
        solution: 'Tell the AI: "Some payments are partial — I received $2,000 of a $5,000 invoice. Only count cash actually received this month, not the full invoice value. We use cash-basis accounting." This is critical: always clarify cash-basis vs accrual-basis before the analysis.'
      },
      {
        problem: 'The AI P&L shows profit, but I know I\'m losing money — something is off',
        solution: 'The most common culprit: owner\'s draws, loan repayments, or inventory purchases are being counted as expenses. Confirm with: "Is owner\'s draw ($X) included as an expense? It should reduce cash but not appear on the P&L. Same for any loan principal payments."'
      },
      {
        problem: 'I have both business and personal expenses mixed in the same account',
        solution: 'Before analysis: "Please ignore any transaction I\'ve labeled \'Personal\' in the Notes column. These are not business expenses. Calculate the P&L using only the categorized business transactions."'
      },
      {
        problem: 'Comparing to last month is misleading because of a big one-time expense',
        solution: 'Tell the AI: "In [month], I had a one-time equipment purchase of $3,200 under Office Supplies. Please flag this as non-recurring when analyzing the month-over-month trend so it doesn\'t distort the comparison."'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-bk-1', title: 'AI Bookkeeper: Weekly Transaction Categorization', slug: 'ai-bookkeeper-weekly-transaction-categorization' },
      { id: 'smb-bk-3', title: 'Invoice & Cash Flow Guardian', slug: 'invoice-cash-flow-guardian' },
      { id: 'smb-bk-4', title: 'Tax Season Prep Assistant', slug: 'tax-season-prep-assistant' }
    ],
    steps: [
      {
        id: 'smb-bk-2-s1',
        stepNumber: 1,
        title: 'Upload Your Financial Data',
        instruction: 'Upload your transactions or summary spreadsheet. The AI will group everything by category, calculate totals, and build the full P&L automatically — no manual aggregation needed.',
        promptTemplate: 'I need a complete Profit & Loss statement and financial analysis for [Business Name] — [Month & Year].\n\nCRITICAL FORMATTING INSTRUCTIONS:\n- Format all tables as clean Markdown tables.\n- NEVER wrap your response or any tables in markdown code blocks (```). Just output the raw markdown text so it renders properly.\n- Format all large numbers with commas (e.g. $1,250,500) for readability.\n- Keep columns concise so tables display well when exported to PDF or Google Docs.\n\nBusiness type: [Business Type]\n\nHere is the complete financial data for the month:\n[Monthly Financial Data]\n\nFrom this data please:\n1. Group and total all transactions by category (Income vs Expenses)\n2. Build a formatted P&L — Revenue → Gross Profit → Operating Expenses → Net Profit/Loss\n3. Add a "% of Revenue" column to every line\n4. Write a 2-sentence executive summary of overall profitability\n5. List 2–3 things that went well and 2–3 areas of concern\n6. Calculate key metrics: Gross Margin %, Net Margin %, largest expense category\n\nPresent everything in one clean, structured response.',
        expectedOutput: 'A complete P&L table with category totals, margin percentages, and a plain-English financial narrative — all from your uploaded data.',
        tips: 'Upload your bank export, accounting software CSV, or a simple two-column spreadsheet (Description, Amount). The AI handles the categorization.'
      },
      {
        id: 'smb-bk-2-s2',
        stepNumber: 2,
        title: 'Generate the Formatted P&L Statement',
        instruction: 'Ask the AI to produce a formal Profit & Loss statement in a clean, readable format.',
        promptTemplate: 'Now format the P&L for [Business Name] — [Month & Year] as a clean table using standard accounting structure:\n\nCRITICAL FORMATTING INSTRUCTIONS:\n- Use a standard Markdown table.\n- NEVER wrap your response or any tables in markdown code blocks (```). Just output the raw markdown text so it renders and copies properly.\n- Format all large numbers with commas (e.g. $1,250,500) for readability.\n- Keep column widths compact so the table displays well when exported to PDF or Google Docs.\n\n1. REVENUE — all income categories with subtotal\n2. COST OF GOODS SOLD (skip if service business)\n3. GROSS PROFIT\n4. OPERATING EXPENSES — all expense categories with subtotal\n5. NET PROFIT (LOSS)\n\nInclude a "% of Revenue" column.',
        expectedOutput: 'A structured P&L table with all numbers organized by section, subtotals, and a "% of Revenue" column.',
        tips: 'If your business is a service business (no COGS), tell the AI to go straight from Revenue to Operating Expenses.'
      },
      {
        id: 'smb-bk-2-s3',
        stepNumber: 3,
        title: 'Get the AI Financial Narrative',
        instruction: 'A table of numbers tells you what happened. A narrative tells you what it means.',
        promptTemplate: 'Write a financial narrative for [Business Name] — [Month & Year]:\n\n**Executive Summary** (2 sentences: overall profitability and the single most important thing to know)\n\n**What Went Well** (2–3 bullets: revenue drivers, controlled costs, improvements)\n\n**Areas of Concern** (2–3 bullets: expenses growing faster than revenue, margin compression, anything unusual)\n\n**Key Metrics**\n- Gross Margin: X%\n- Net Margin: X%\n- Largest Expense: [category] at X% of revenue\n- Month-over-Month change: +/-$X\n\n**One Question to Investigate** — the single number you would want to dig into further\n\nWrite as a CFO briefing a smart, non-accountant business owner.',
        expectedOutput: 'A clear, human-readable analysis — interpretation and insight, not a repeat of the numbers.',
        tips: 'Share this narrative with your accountant instead of raw numbers — it makes review meetings dramatically shorter.'
      },
      {
        id: 'smb-bk-2-s4',
        stepNumber: 4,
        title: 'Build a 3-Month Trend View',
        instruction: 'A single month is a snapshot; three months is a trend. Use this step to see whether your margins are expanding or contracting.',
        promptTemplate: 'Based on the data provided, identify revenue and expense trends. Then create a forward projection:\n\n1. Is revenue growing, flat, or declining? At what rate?\n2. Are expenses growing slower or faster than revenue?\n3. Is net margin improving or compressing?\n4. Which expense category is growing fastest relative to revenue?\n5. If this trend continues 3 more months, what does the financial position look like?\n\nBe specific — use percentages and dollar amounts.',
        expectedOutput: 'A data-backed trend analysis with growth rates, margin trajectory, and a 3-month forward projection.',
        tips: 'No prior months? Run this step anyway — Claude will project forward from the current month as a baseline.'
      },
      {
        id: 'smb-bk-2-s5',
        stepNumber: 5,
        title: 'Create the Shareable Financial Snapshot',
        instruction: 'Package everything into a one-page summary to share with a partner, accountant, or keep in your records.',
        promptTemplate: 'Create a highly detailed, visual PowerBI-style Monthly Financial Dashboard for [Business Name] — [Month & Year]:\n\nCRITICAL FORMATTING INSTRUCTIONS:\n- Act as a BI Dashboard generator. You must create a visual, text-based dashboard that mimics a FreshBooks or PowerBI dashboard layout.\n- NEVER wrap your response or any tables in markdown code blocks (```). This is extremely important. Just output the raw markdown text so it renders as actual UI tables.\n- Use standard Markdown tables for KPI grids and trends.\n- Format all large numbers with commas and currency symbols (e.g. $327,535).\n- Use ASCII horizontal bar charts (using the ▇ character) to visualize categorical data.\n- Ensure it fits elegantly on a PDF or Google Doc export.\n\n**[Business Name] — Profit and Loss Dashboard — [Month & Year]**\n\n📊 1. KPI SCORECARD (Format as a clean Markdown table grid)\n- Row 1: Gross Profit | Net Profit | Gross Profit Margin | Net Profit Margin\n- Row 2: Revenue This Month | Revenue Last Month | Revenue % Change\n- Row 3: Expenses This Month | Expenses Last Month | Expenses % Change\n- Row 4: Outstanding Revenue | Cost of Goods Sold\n\n📉 2. 6-MONTH REVENUE & PROFIT TREND\n[Create a clean Markdown table showing Month | Revenue | Expenses | Net Profit for the last 6 months]\n\n🌎 3. TOP 5 REVENUE SOURCES\n[Use ASCII horizontal bar charts to visualize. Example:\nSource A    | ▇▇▇▇▇▇▇▇▇▇ $15.0K\nSource B    | ▇▇▇▇▇▇ $8.0K]\n\n💳 4. TOP 5 EXPENSES BY CATEGORY\n[Use ASCII horizontal bar charts for the top 5 expenses. Example:\nRent/Lease  | ▇▇▇▇▇▇▇▇▇▇ $8.9K\nAdvertising | ▇▇▇▇▇▇▇ $7.7K]\n\n⚠️ WATCH LIST\n[1-2 sentence narrative on anomalies or flagged items]\n\n✅ NEXT STEPS\n- 1 financial action to take this month\n- 1 cost to investigate\n- 1 revenue opportunity',
        expectedOutput: 'A complete, professional Monthly Financial Snapshot — ready to share, store, or present.',
        tips: 'Save as "[Business Name] — Financial Snapshot — [Month Year]" in a Monthly Financials folder. Build the archive month by month.'
      }
    ]
  },

  {
    id: 'smb-bk-3',
    slug: 'invoice-cash-flow-guardian',
    title: 'Invoice & Cash Flow Guardian',
    subtitle: 'Never lose track of who owes you money — even if you track invoices in a notebook or Excel. Get a payment follow-up email and a 30-day cash projection in one session.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 20,
    timeSaved: 200,
    completionCount: 478,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['ChatGPT', 'Claude', 'Excel', 'FreshBooks', 'QuickBooks', 'Wave'],
    beforeYouStart: [
      'A mental or written list of clients who owe you money — even just names and rough amounts is enough to start. If you have a notebook, Excel file, or handwritten invoice book, have it open.',
      'A rough sense of your current bank or mobile money balance (even an approximation works for the cash flow forecast).',
      'A rough list of your biggest upcoming expenses this month — rent, staff, supplier payments, airtime.',
      'Access to ChatGPT or Claude — free tier is sufficient. No accounting software needed.'
    ],
    expectedOutcome: 'A prioritized list of overdue invoices ranked by urgency, ready-to-send personalized follow-up emails for each overdue client, and a 30-day cash flow projection showing your expected runway.',
    agentAutomation: {
      description: 'Every Monday morning, the agent checks your QuickBooks or FreshBooks for overdue invoices, drafts personalized collection emails for any invoice over 7 days past due, sends them automatically (or queues for approval), and updates you with a weekly cash position report.',
      trigger: 'Every Monday at 8 AM.',
      actions: [
        'Query QuickBooks Online or FreshBooks API for all open invoices past their due date',
        'Filter to invoices more than 7 days overdue',
        'Send each overdue invoice to Claude with client context to draft a personalized follow-up email',
        'Queue emails in Gmail Drafts for owner approval (or send automatically if confidence is high)',
        'Compile all outstanding amounts and upcoming known expenses into a cash flow summary',
        'Email the weekly Cash Position Report to the business owner'
      ],
      setupSteps: [
        { title: 'Connect QuickBooks or FreshBooks to Make.com', description: "In Make.com, create a new scenario. Search for \'QuickBooks Online\' and add a \'Search Invoices\' module. Authenticate with your QuickBooks account. Set filters: Status = Unpaid AND Due Date is before Today. Alternatively, use the FreshBooks \'List Invoices\' module with status = \'overdue\'." },
        { title: 'Build the Overdue Filter', description: "Add a \'Router\' module in Make.com to split invoices by urgency: Path 1: Due date was 7-14 days ago (Gentle reminder). Path 2: Due date was 15-30 days ago (Firm reminder). Path 3: Due date was 30+ days ago (Final notice). Each path sends a different tone prompt to Claude." },
        { title: 'Draft Collection Emails with Claude', description: "For each path, add an HTTP module calling the Claude API. Include the invoice details (client name, amount, invoice number, days overdue) and ask Claude to write a professional email matching the urgency tier. Store the draft email text in a variable." },
        { title: 'Create Gmail Drafts', description: "Add a \'Gmail — Create a Draft\' module for each path. Map: To = client email (from your invoice data), Subject = \'Invoice #[number] — Payment Reminder\', Body = Claude\'s email draft. You\'ll review and send from Gmail — it stays in Drafts until you approve." },
        { title: 'Send the Weekly Cash Report', description: "After processing all invoices, add a \'Gmail — Send an Email\' module to send yourself a weekly summary: Total AR Outstanding: $X | Invoices 7-14 days: $X | 15-30 days: $X | 30+ days: $X | Estimated next 30 days cash receipts: $X." }
      ],
      tools: ['Make.com', 'QuickBooks Online', 'FreshBooks', 'Claude', 'Gmail']
    },
    troubleshooting: [
      {
        problem: 'A client disputes the invoice amount — the AI collection email makes things worse',
        solution: 'Before pasting any invoice into the AI, add a Notes column to your list. If an invoice is disputed, note it. In your prompt, tell the AI: "This invoice is disputed. The client claims [brief reason]. Write a conciliatory email that opens dialogue rather than demanding payment."'
      },
      {
        problem: 'My cash flow forecast is wildly off because of unpredictable client payment timing',
        solution: 'Add a "Historical Pay Rate" to each client entry: "Client A always pays within 3 days of reminder. Client B consistently pays 15 days after due date." Tell the AI to use this when building the projection instead of assuming payment on the due date.'
      },
      {
        problem: 'I have a large project deposit coming in next month — should I include it?',
        solution: 'Yes, but flag it: "Include $8,000 expected project deposit from [Client] around [Date] but flag it as \'Expected — Not Confirmed\' in the projection. Show me both a scenario where it arrives and a scenario where it is delayed by 2 weeks."'
      },
      {
        problem: 'My Wave account does not show aging — I only see a list of invoices',
        solution: 'In Wave, go to Accounting > Invoices, set filter to "Overdue", and export to CSV. Then paste the export into the AI and say: "Calculate the number of days overdue for each invoice based on today\'s date of [TODAY\'S DATE]."'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-bk-1', title: 'AI Bookkeeper: Weekly Transaction Categorization', slug: 'ai-bookkeeper-weekly-transaction-categorization' },
      { id: 'smb-bk-2', title: 'Monthly Financial Snapshot & P&L Analyzer', slug: 'monthly-financial-snapshot-pl-analyzer' },
      { id: 'smb-bk-4', title: 'Tax Season Prep Assistant', slug: 'tax-season-prep-assistant' }
    ],
    steps: [
      {
        id: 'smb-bk-3-s1',
        stepNumber: 1,
        title: 'Build Your Accounts Receivable Aging Report',
        instruction: 'Export all open invoices from your platform (QuickBooks, FreshBooks, Wave, Xero, or a manual spreadsheet). You need: client name, invoice number, invoice amount, due date, and days overdue. This is your AR Aging — the foundation for everything that follows.',
        promptTemplate: 'I need help managing my accounts receivable. Here is my current list of outstanding invoices as of today, [TODAY\'S DATE]:\n\nClient Name | Invoice # | Amount | Invoice Date | Due Date | Days Overdue\n[Client A] | [INV-001] | [$X] | [Date] | [Date] | [X days]\n[Client B] | [INV-002] | [$X] | [Date] | [Date] | [X days]\n[...paste all rows]\n\nBusiness context: [describe your payment terms, e.g. "We net-30 for all clients. Clients over 60 days get referred to collections."]\n\nFirst, organize these into aging buckets:\n- Current (not yet due)\n- 1-15 days overdue\n- 16-30 days overdue\n- 31-60 days overdue\n- 60+ days overdue (critical)\n\nProvide totals for each bucket and flag the 3 highest-priority invoices I should contact today.',
        expectedOutput: 'A structured AR Aging table with bucket totals and a prioritized action list for your most urgent collection calls or emails.',
        tips: 'In QuickBooks: Reports > Accounts Receivable Aging. In FreshBooks: Reports > Accounts Aging. In Wave: Accounting > Invoices > filter Overdue. In Xero: Reports > Aged Receivables. Export all of these as CSV.'
      },
      {
        id: 'smb-bk-3-s2',
        stepNumber: 2,
        title: 'Write Personalized Collection Emails',
        instruction: 'Generic "payment reminder" emails get ignored. Personalized ones that reference the specific project, the relationship, and the exact amount get paid. Use the AI to write 3 tiers of collection emails: gentle (1-15 days), firm (16-30 days), and urgent (31-60+ days).',
        promptTemplate: 'Write collection emails for the following overdue invoices. Adjust the tone based on how overdue each invoice is:\n\nFOR EACH INVOICE BELOW, write a separate email:\n\n[INVOICE 1]\n- Client: [Client Name]\n- Amount: $[Amount]\n- Days Overdue: [X]\n- Project: [Brief description of what you delivered]\n- Prior contact: [e.g. "No prior follow-up" or "Emailed once on [date]"]\n- Relationship: [e.g. "Long-term client, usually pays on time" or "New client, first project"]\n\n[INVOICE 2]\n- Client: [Client Name]\n- Amount: $[Amount]\n- Days Overdue: [X]\n[...]\n\nEmail guidelines:\n- 1-15 days overdue: warm and helpful tone, assume it was an oversight, offer a payment link\n- 16-30 days: firm and professional, reference prior emails if any, give a specific deadline to respond\n- 31+ days: serious tone, reference consequences (late fees if applicable, potential hold on future work), suggest a payment plan if needed\n- Keep each email under 100 words — shorter gets more responses\n- Always include the Invoice # and Amount in the subject line\n- End with a specific call-to-action (pay by link, reply to discuss, call me at X)',
        expectedOutput: 'Ready-to-send email drafts for each overdue client, properly calibrated in tone to the severity of the overdue status.',
        tips: 'Never send collection emails on a Friday — they get buried over the weekend. Tuesday and Wednesday mornings have the highest open and response rates.'
      },
      {
        id: 'smb-bk-3-s3',
        stepNumber: 3,
        title: 'Build Your 30-Day Cash Flow Projection',
        instruction: 'Cash flow is not about profit — it\'s about timing. A business can be profitable on paper and still miss payroll. This step projects your actual bank account balance for the next 30 days based on what you expect to collect and what you know you\'ll spend.',
        promptTemplate: 'Help me build a 30-day cash flow projection. Here is my current financial situation:\n\nCURRENT BANK BALANCE: $[Amount]\n\nEXPECTED CASH INFLOWS (next 30 days):\n- Invoice #[X] from [Client] — $[Amount] — expected by [Date] (probability: [High/Medium/Low])\n- Invoice #[X] from [Client] — $[Amount] — expected by [Date] (probability: [High/Medium/Low])\n- [Any other expected income]\n\nKNOWN CASH OUTFLOWS (next 30 days):\n- Payroll/Contractors: $[Amount] on [Date(s)]\n- Rent/Office: $[Amount] on [Date]\n- Software subscriptions: $[Amount] (spread across month)\n- [Other known bills]\n\nBuild a week-by-week projection table:\nWeek | Opening Balance | Inflows | Outflows | Closing Balance | Flag\n\nFor the "Flag" column: mark any week where the closing balance drops below $[YOUR MINIMUM COMFORT LEVEL] as ⚠️ CASH CRUNCH RISK.\n\nAlso give me 2 scenarios: Optimistic (all high/medium invoices pay on time) and Conservative (only high-probability invoices pay on time).',
        expectedOutput: 'A week-by-week cash flow table for the next 30 days with both optimistic and conservative scenarios, and any cash crunch weeks flagged.',
        tips: 'Set your minimum comfort level at 1 month of operating expenses. If your monthly expenses are $12,000, flag any week where the balance drops below $12,000.'
      },
      {
        id: 'smb-bk-3-s4',
        stepNumber: 4,
        title: 'Identify Risk & Get a Collection Strategy',
        instruction: 'Based on the aging report and cash flow projection, ask the AI to prioritize your collection effort and suggest practical tactics for your most at-risk invoices.',
        promptTemplate: 'Based on my AR aging report and 30-day cash flow projection, help me build a collection strategy.\n\nMy situation:\n- Total AR outstanding: $[Amount]\n- Invoices 30+ days overdue: $[Amount] across [X] clients\n- Cash flow crunch risk: [Yes — Week of [Date] / No — we\'re comfortable]\n\nFor my three highest-risk invoices:\n1. [Client A] — $[Amount] — [X] days overdue\n2. [Client B] — $[Amount] — [X] days overdue\n3. [Client C] — $[Amount] — [X] days overdue\n\nFor each one, recommend:\n- The most effective next action (call, email, certified letter, payment plan offer, collections referral)\n- What to say — give me a 2-sentence phone script if a call is recommended\n- Whether to offer a payment plan and at what terms\n- At what point (number of days) I should stop internal collection and consider a collections agency or small claims court (given that I\'m in [YOUR STATE/COUNTRY])\n\nAlso: what is the one thing I should change in my invoicing process to prevent these situations in the future?',
        expectedOutput: 'A per-client collection playbook with specific next actions, phone scripts, and a systemic recommendation to reduce future AR issues.',
        tips: 'The best preventive measure for late payments: require a 25-50% deposit upfront and net-14 instead of net-30. The AI will likely suggest this — implement it on your next new client engagement.'
      }
    ]
  },

  {
    id: 'smb-bk-4',
    slug: 'tax-season-prep-assistant',
    title: 'Tax Season Prep Assistant',
    subtitle: 'Turn a year of transactions into a complete tax-ready package: deduction analysis, Schedule C breakdown, and accountant handoff checklist — in one session.',
    category: 'Finance',
    difficulty: 'Intermediate',
    timeToComplete: 45,
    timeSaved: 600,
    completionCount: 312,
    rating: 4.9,
    isPro: true,
    isNew: true,
    tools: ['ChatGPT', 'Claude', 'Excel', 'QuickBooks', 'Wave', 'Xero'],
    beforeYouStart: [
      'Your annual income and expense records in any format — a year-end Excel summary, a notebook with monthly totals, physical receipts gathered in a folder, or even rough mental estimates of the main categories. You do not need formal accounting records.',
      'Your business structure: Sole Proprietor / Self-Employed, Limited Company, Partnership, or other. If you\'re not sure, describe how you operate and the AI will help identify it.',
      'A rough figure for total income received during the year (check your bank statements or mobile money history if unsure).',
      'A rough figure for your biggest expenses — staff, rent, supplies, transport, marketing. Estimates are acceptable as a starting point.',
      'Any major purchases (equipment, vehicles) or loans made during the year — these often have special tax treatment.'
    ],
    expectedOutcome: 'A complete Schedule C-ready expense breakdown (or equivalent for your entity type), a prioritized list of all deductions you may have missed, a red-flag report of items likely to trigger IRS scrutiny, and a complete accountant handoff package your CPA can use to file immediately.',
    agentAutomation: {
      description: 'In January, the agent automatically pulls your full prior year\'s transactions, groups them by IRS category, checks for common missed deductions, cross-references 1099 income reported vs income recorded, and delivers a complete tax prep package to you and your accountant before tax season starts.',
      trigger: 'January 5th at 9 AM (annual run).',
      actions: [
        'Pull all transactions from the prior year from the Google Sheets Ledger archive',
        'Group by IRS-aligned expense categories and compute annual totals',
        'Check totals against prior year for significant changes that could trigger audit flags',
        'Send data to Claude for deduction gap analysis and red-flag check',
        'Compile the full tax prep report as a formatted PDF-ready Google Doc',
        'Email the report to the business owner and their accountant CC'
      ],
      setupSteps: [
        { title: 'Build the Annual Ledger Archive', description: "Ensure all 12 months of categorized transactions are in your Google Sheets Ledger with a \'Year\' column (add =YEAR(A2) formula). This lets the automation pull a full year\'s data with a single filter. If you used the weekly categorization playbook all year, this is already done." },
        { title: 'Map Categories to IRS Schedule C Lines', description: "In a separate tab, create a mapping table: Your Category Name → IRS Schedule C Line. Example: \'Software & Subscriptions\' → Line 18 (Office Expense). \'Business Meals\' → Line 24b (Meals — 50% deductible). This mapping tells Make.com how to regroup your categories for tax purposes." },
        { title: 'Configure the Annual Make.com Scenario', description: "Create a new Make.com scenario. Set the trigger to \'Schedule — At a Specific Date/Time\' set to January 5. Add a \'Google Sheets — Search Rows\' module filtered to Year = prior year. Run the rows through the category mapping table using a \'Tools — Set Variable\' or \'Router\' module." },
        { title: 'Generate the Tax Report with Claude', description: "After aggregating all categories, send the totals to Claude via HTTP module. Use the Tax Deduction Analysis prompt (see Step 3 of this playbook). Store the response as a Google Doc using the \'Google Docs — Create a Document\' module, formatting the content into the final report." },
        { title: 'Deliver to Accountant', description: "Use \'Gmail — Send Email\' with the Google Doc link attached. CC your accountant. Subject line: \'[Business Name] — [Year] Tax Prep Package — Ready for Review\'. This gives your CPA everything they need to file with minimal back-and-forth." }
      ],
      tools: ['Make.com', 'Google Sheets', 'Claude', 'Google Docs', 'Gmail']
    },
    troubleshooting: [
      {
        problem: 'My categories do not match standard IRS Schedule C lines — my accountant is confused',
        solution: 'Ask the AI: "Here are my custom expense category names and totals. Map each one to the correct IRS Schedule C line number (Part II) and flag any that don\'t have a clear match. For ambiguous ones, suggest the closest line and explain the rationale." Give the output to your accountant — it bridges the gap between your tracking system and the tax form.'
      },
      {
        problem: 'I have both personal and business use for my car / phone / home office — how do I split?',
        solution: 'Use the AI to calculate the deductible portion: "I used my car for both business and personal driving. I drove approximately [X] total miles this year. My mileage log shows [X] business miles. Calculate the business-use percentage and the deductible amount using the standard IRS mileage rate for [YEAR]." Same approach for home office: business sq ft ÷ total sq ft = deductible percentage of rent, utilities, and internet.'
      },
      {
        problem: 'The AI flagged several transactions as potential audit risks — should I be worried?',
        solution: 'Audit flags are warnings, not convictions. For each flagged item, the AI will explain why it\'s unusual (e.g., meals over 50% of revenue, home office over 300 sq ft, 100% auto use). For each one, make sure you have documentation: receipts, mileage logs, photos of your home office. Tell your accountant about the flags before filing — they can advise whether to include, modify, or exclude the deduction.'
      },
      {
        problem: 'I received income but no 1099 — do I still have to report it?',
        solution: 'Yes. All business income is taxable regardless of whether a 1099 was issued. Ask the AI: "My records show I received $[X] from [Client] but I haven\'t received a 1099-NEC from them. Is this income still reportable? How should it appear on my Schedule C?" The answer is always yes — the IRS requires self-reporting of all income.'
      },
      {
        problem: 'I missed deductions in previous years — can I go back and claim them?',
        solution: 'In the US, you can amend returns up to 3 years back. Ask the AI: "I have a list of business expenses I failed to deduct in [YEAR]. Here are the amounts by category. What is the estimated tax refund I may be eligible for if I file an amended return (Form 1040-X)?" This is a conversation to continue with your CPA, but the AI can give you a rough estimate.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-bk-1', title: 'AI Bookkeeper: Weekly Transaction Categorization', slug: 'ai-bookkeeper-weekly-transaction-categorization' },
      { id: 'smb-bk-2', title: 'Monthly Financial Snapshot & P&L Analyzer', slug: 'monthly-financial-snapshot-pl-analyzer' },
      { id: 'smb-bk-3', title: 'Invoice & Cash Flow Guardian', slug: 'invoice-cash-flow-guardian' }
    ],
    steps: [
      {
        id: 'smb-bk-4-s1',
        stepNumber: 1,
        title: 'Compile & Validate Your Annual Totals',
        instruction: 'Before touching taxes, verify your numbers are complete and accurate. Missing transactions are the #1 cause of incorrect returns. Use this step to compile all income and all expenses for the tax year and let the AI check for obvious gaps.',
        promptTemplate: 'I am preparing my taxes for the [TAX YEAR] tax year. My business is [BUSINESS NAME], structured as a [Sole Proprietor / Single-Member LLC / S-Corp / Partnership]. I am [located in / operating in] [STATE/COUNTRY].\n\nHere are my annual totals from my accounting records:\n\nTOTAL GROSS INCOME: $[Amount]\nSource breakdown:\n- [Income Source 1]: $[Amount]\n- [Income Source 2]: $[Amount]\n\nTOTAL EXPENSES BY CATEGORY:\n- [Category 1]: $[Amount]\n- [Category 2]: $[Amount]\n- [Category 3]: $[Amount]\n[...all categories]\n\nNET PROFIT (Income minus Expenses): $[Amount]\n\nAdditional context:\n- 1099-NEC forms received totaling: $[Amount] (or "none received")\n- Equipment/asset purchases over $500: [list items and amounts, or "none"]\n- Home office: [Yes — X sq ft of X total sq ft / No]\n- Business vehicle miles driven: [X miles / not applicable]\n- Business loans taken out: [Yes — $X / No]\n\nFirst, check if my net profit makes sense given my revenue and expense levels. Flag anything that looks incomplete, inconsistent, or unusually high/low for a business of my type.',
        expectedOutput: 'A validation check on your numbers — the AI will flag any category that looks suspiciously low (possible missing transactions), unusually high (possible double-counting), or inconsistent with the business type.',
        tips: 'Cross-check total income against your bank deposits for the year. They should match (within a few hundred dollars for timing differences). If they\'re off by more than $1,000, you likely have missing income or unrecorded transactions.'
      },
      {
        id: 'smb-bk-4-s2',
        stepNumber: 2,
        title: 'Run the Missed Deductions Scan',
        instruction: 'Most small business owners miss 3-5 legitimate deductions every year. The AI will compare your expense categories against a comprehensive checklist of commonly-overlooked deductions for your business type and flag anything you may have forgotten to track.',
        promptTemplate: 'Scan my [tax_year] expenses for missed deductions. My business: [business_type e.g. freelance designer / consultant / e-commerce seller]\n\nHere are my recorded expense totals by category:\n[expense_totals]\n\nAdditional context:\n- Home office: [yes — X sq ft of X total / no]\n- Business miles driven: [miles or "none"]\n- Health insurance premiums paid: [$ or "not applicable"]\n\nCheck for anything I likely missed or under-recorded. For each gap, tell me: what the deduction is, what documentation I need, and the estimated tax saving at a 25% rate.',
        expectedOutput: 'A gap analysis listing every potential missed deduction, estimated dollar value, required documentation, and estimated tax savings for each.',
        tips: 'The home office deduction alone is worth an average of $1,500-$3,000 for a typical freelancer or consultant. If you have a dedicated workspace at home, make sure you\'re claiming it.'
      },
      {
        id: 'smb-bk-4-s3',
        stepNumber: 3,
        title: 'Map to Schedule C / Tax Form Categories',
        instruction: 'Your bookkeeping categories and IRS form lines don\'t always match 1:1. This step translates your internal categories into the exact line items your accountant needs to fill out Schedule C (or the equivalent for your entity type).',
        promptTemplate: 'Map my expense categories to the correct IRS Schedule C (Form 1040) line items for [TAX YEAR]. My updated deductions after the missed-deductions scan are:\n\n[PASTE YOUR FINAL EXPENSE TOTALS BY CATEGORY]\n\nAdditional items to include:\n- Home Office Deduction: $[Amount] (using simplified method: $5/sq ft × [X] sq ft = $[Total], capped at $1,500 / OR actual expense method: X% of rent + utilities)\n- Vehicle: $[X] business miles × $[CURRENT IRS RATE] = $[Amount]\n- Section 179 equipment expensing: $[Amount] for [description of item]\n\nFor each of my categories, assign:\n1. The correct Schedule C Part II line number (e.g., Line 8: Advertising, Line 18: Office Expense, Line 22: Supplies)\n2. The exact dollar amount to enter on that line\n3. Any that require a separate supporting form or schedule (like Form 8829 for home office, Form 4562 for depreciation)\n\nOutput this as a table my accountant can use directly:\n\nSchedule C Line | Description | Amount | Supporting Form Needed\n\nAlso calculate my Schedule C net profit (Line 31) and estimated self-employment tax (15.3% of 92.35% of net profit).',
        expectedOutput: 'A complete Schedule C mapping table with every line filled in, the net profit figure, and estimated self-employment tax — everything your accountant needs to file.',
        tips: 'For S-Corp filers: replace "Schedule C" with "Form 1120-S." For partnerships: "Form 1065." Ask the AI to use the correct form for your entity type — the line numbering is different.'
      },
      {
        id: 'smb-bk-4-s4',
        stepNumber: 4,
        title: 'Audit Risk Check — Flag Before Filing',
        instruction: 'The IRS uses statistical models to flag returns that deviate from norms for businesses of your type and size. This step runs your numbers through common audit triggers so you can either document properly or reconsider a deduction before filing.',
        promptTemplate: 'Review my [TAX YEAR] Schedule C numbers for common IRS audit risk factors. Here are my final figures:\n\n- Gross Revenue: $[Amount]\n- Net Profit: $[Amount]\n- Net Profit Margin: [X%]\n- Total Meals & Entertainment: $[Amount] ([X%] of revenue)\n- Auto/Mileage Deduction: $[Amount] ([X%] of revenue)\n- Home Office Deduction: $[Amount]\n- Travel: $[Amount]\n- Contract Labor (1099s issued): $[Amount] to [X] contractors\n- Total Deductions: $[Amount] ([X%] of gross revenue)\n\nCheck for these IRS red flags:\n1. Net profit margin below 25% (or negative) for multiple years — signals hobby loss rules may apply\n2. Meals & entertainment over 1-2% of revenue — high audit risk\n3. Auto use claimed at 100% — nearly always flagged\n4. Home office claimed on rented home plus high travel — double-dipping risk\n5. Round number deductions (e.g. exactly $10,000 for supplies) — suggests estimation, not records\n6. Contract labor amounts that don\'t match 1099s filed\n7. Business losses for 3+ consecutive years — IRS may reclassify as a hobby\n\nFor each flag you find, tell me:\n- The specific risk level (Low / Medium / High)\n- What documentation to prepare before filing\n- Whether I should reconsider the deduction amount or be confident if I have records',
        expectedOutput: 'A red-flag report with risk levels, documentation requirements, and specific guidance on any deductions to reconsider or strengthen with documentation.',
        tips: 'A red flag does not mean do not take the deduction — it means document it thoroughly. If you have the receipts, mileage log, and a legitimate business purpose, you can take any legitimate deduction confidently.'
      },
      {
        id: 'smb-bk-4-s5',
        stepNumber: 5,
        title: 'Generate the Accountant Handoff Package',
        instruction: 'Package everything into a single document your accountant can pick up and use without asking you 20 follow-up questions. A well-organized handoff saves you accountant fees and gets your return filed faster.',
        promptTemplate: 'Create a complete Accountant Handoff Package for [BUSINESS NAME] — [TAX YEAR] Taxes. Compile all our analysis into a single, professional document:\n\n---\n**[BUSINESS NAME] — TAX YEAR [YEAR] — ACCOUNTANT PACKAGE**\n**Prepared: [TODAY\'S DATE]**\n**Entity Type: [Sole Proprietor / LLC / S-Corp]**\n**EIN (or SSN): [I will add this manually]**\n**Accounting Method: [Cash / Accrual]**\n\n**SECTION 1: BUSINESS OVERVIEW**\n- Business description: [brief description]\n- Significant changes in [TAX YEAR]: [list any major changes — new revenue streams, new employees, moved offices, etc.]\n\n**SECTION 2: INCOME SUMMARY**\n[Total income with source breakdown]\n[1099s received list]\n\n**SECTION 3: DEDUCTIONS — SCHEDULE C READY**\n[The complete line-by-line Schedule C mapping table]\n\n**SECTION 4: SPECIAL ITEMS REQUIRING ACCOUNTANT REVIEW**\n[The red-flag items and documentation notes]\n[Home office calculation method used]\n[Vehicle/mileage details]\n[Section 179 assets]\n\n**SECTION 5: DOCUMENTS ATTACHED**\n(I will complete this manually with the actual documents I am providing)\n☐ Bank statements — all 12 months\n☐ Credit card statements — business cards\n☐ All 1099-NEC received\n☐ All 1099-NEC issued to contractors (if any)\n☐ Home office floor plan or lease\n☐ Mileage log\n☐ Equipment purchase receipts\n☐ Prior year tax return (for comparison)\n\n**SECTION 6: QUESTIONS FOR MY ACCOUNTANT**\n[List any areas of uncertainty identified during our analysis]\n\n---\n\nFormat this as a clean document I can export to PDF and email alongside my source documents.',
        expectedOutput: 'A complete, professional tax package ready to hand to your accountant — covering income, deductions, special items, and a document checklist — that minimizes back-and-forth and gets your return filed efficiently.',
        tips: 'Send this package to your accountant in January, not April. Accountants charge 20-40% more for rush filings and give less thorough attention to returns that arrive in the final weeks. Early filers also get faster refunds and are less likely to be victims of tax identity theft.'
      }
    ]
  },

  // ─── BUSINESS DECISION PLAYBOOKS ──────────────────────────────────────────

  {
    id: 'smb-bd-1',
    slug: 'profit-margin-analyzer-most-profitable-work',
    title: 'Profit Margin Analyzer: Find Your Most Profitable Work',
    subtitle: 'Discover which clients, products, or services actually make you money — and which ones secretly drain you. Make the decision to focus or cut in one session.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 20,
    timeSaved: 300,
    completionCount: 541,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['ChatGPT', 'Claude'],
    beforeYouStart: [
      'A rough list of the main things your business sells or does — products, services, or client types.',
      'Rough revenue figures for each (what you charge / what you earned from each).',
      'A sense of what each one costs you to deliver — time, materials, staff, transport. Estimates are fine.',
      'Access to ChatGPT or Claude. No spreadsheets required — this runs entirely in the chat.'
    ],
    expectedOutcome: 'A ranked profitability table for every product, service, or client type — showing which ones make the most money per hour of effort. Plus a clear recommendation: what to do more of, what to raise prices on, and what to consider cutting.',
    agentAutomation: {
      description: 'Every month, the agent pulls your revenue by product/service from your records, calculates margins against your known cost structures, and emails you a ranked profitability report — so you always know which work is worth saying yes to.',
      trigger: 'First Monday of every month.',
      actions: [
        'Pull monthly revenue totals by product or service line from Google Sheets',
        'Apply your cost-per-unit or cost-per-hour estimates to calculate gross margin per line',
        'Rank all lines by net margin percentage',
        'Send Claude the ranked list to generate a plain-English recommendations memo',
        'Email the full profitability report to the business owner'
      ],
      setupSteps: [
        { title: 'Build a Revenue Tracking Sheet', description: "Create a Google Sheet with columns: Product/Service | Units Sold | Revenue | Direct Cost | Gross Profit | Margin%. Fill in each line at the end of every month. This becomes the input for the automation." },
        { title: 'Set Up the Monthly Make.com Trigger', description: "In Make.com, create a scenario triggered on the first Monday of the month. Add a 'Google Sheets — Read Range' module to pull the prior month's revenue rows." },
        { title: 'Calculate Margins in Make.com', description: "Use a 'Tools — Set Variable' module to compute Gross Profit = Revenue - Direct Cost, and Margin% = (Gross Profit / Revenue) × 100 for each row. Sort the output by Margin% descending." },
        { title: 'Generate AI Recommendations', description: "Send the ranked table to Claude via an HTTP module. Prompt: 'Here is our product/service profitability for last month. Write a short memo identifying our 2 most profitable lines to grow, 1 line with a margin problem to investigate, and 1 action to take this month.'" },
        { title: 'Deliver the Report', description: "Use Gmail to send the full table + AI memo to the business owner. Subject: '[Business Name] — Profitability Report — [Month Year]'." }
      ],
      tools: ['Make.com', 'Google Sheets', 'Claude', 'Gmail']
    },
    troubleshooting: [
      {
        problem: 'I don\'t know the exact cost of delivering each service — I just charge a flat rate',
        solution: 'Start with time. Ask yourself: "How many hours does this typically take me or my team?" Then multiply by your effective hourly cost (monthly overhead ÷ monthly working hours). Even a rough hourly rate reveals which work pays well and which does not.'
      },
      {
        problem: 'My most profitable product is one I don\'t enjoy doing',
        solution: 'This is a real business decision, not just a math problem. Tell the AI: "This service has the best margin but I dislike doing it. What are my options — can I systemize it, delegate it, or charge enough more to make it worth my time?" The AI will think through the tradeoffs with you.'
      },
      {
        problem: 'My margins are very different per client even for the same service',
        solution: 'Do a client-level profitability analysis. List each client, what they pay you, and roughly how much time/effort they require. You\'ll almost always find 20% of clients generate 80% of profit — and some clients are genuinely not worth keeping.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-bd-2', title: 'Pricing Strategy Reset', slug: 'pricing-strategy-reset' },
      { id: 'smb-bd-3', title: 'Hire or Stay Solo: The Financial Decision', slug: 'hire-or-stay-solo-financial-decision' },
      { id: 'smb-bk-2', title: 'Monthly Financial Snapshot & P&L Analyzer', slug: 'monthly-financial-snapshot-pl-analyzer' }
    ],
    steps: [
      {
        id: 'smb-bd-1-s1',
        stepNumber: 1,
        title: 'List Every Way You Make Money',
        instruction: 'Before comparing, you need a complete list of everything you sell or do. This includes products, services, client types, and even side revenue streams. Do not leave anything out — the goal is to see the full picture, not the flattering one.',
        promptTemplate: 'I need help understanding which parts of my business are actually most profitable. I run [DESCRIBE YOUR BUSINESS — e.g. a tailoring shop / a digital marketing agency / a food catering business / an IT support company].\n\nHere is every way I currently make money:\n1. [Product/Service/Client Type 1] — I charge [amount per unit / per hour / per project]\n2. [Product/Service/Client Type 2] — I charge [amount per unit / per hour / per project]\n3. [Product/Service/Client Type 3] — I charge [amount per unit / per hour / per project]\n[...list all]\n\nFor context, last month my total revenue was approximately [AMOUNT] and I work roughly [X hours per week / I have X employees].\n\nAcknowledge the list and ask me the cost questions I need to answer to calculate actual profitability for each.',
        expectedOutput: 'The AI acknowledges your revenue streams and asks focused questions about direct costs and time investment for each — prompting you to think about costs you may have overlooked.',
        tips: 'Be honest about the low-performers. Many business owners omit services they secretly know are not making money. The whole point of this exercise is to find them.'
      },
      {
        id: 'smb-bd-1-s2',
        stepNumber: 2,
        title: 'Build the Profitability Table',
        instruction: 'Now answer the cost questions and let the AI calculate the real margins. You do not need exact figures — good estimates will reveal the winners and losers clearly enough to make decisions.',
        promptTemplate: 'Here are my costs for each revenue stream:\n\n[PRODUCT/SERVICE 1]: [e.g. "charges ₦15,000. Materials cost ₦4,000. Takes me 2 hours of my time."]\n[PRODUCT/SERVICE 2]: [e.g. "charges ₦50,000/month retainer. No materials. Takes about 10 hours of work per month."]\n[PRODUCT/SERVICE 3]: [e.g. "charges ₦8,000. Materials ₦5,500. 30 minutes to make."]\n\nMy approximate cost for 1 hour of my own time (or my team\'s time) is [e.g. ₦3,000/hour — based on my monthly overhead of ₦300,000 divided by 100 working hours]. If you think I should calculate this differently, tell me.\n\nBuild a profitability table with these columns:\nProduct/Service | Price | Direct Costs | Time Cost | Total Cost | Gross Profit | Margin% | Profit per Hour\n\nSort by Margin% from highest to lowest.',
        expectedOutput: 'A complete profitability table ranked from most to least profitable, with Margin% and Profit per Hour — the two most decision-relevant metrics.',
        tips: 'Profit per Hour is the most important column. A service charging twice as much can still be less profitable if it takes 5x longer. Find the work that makes the most money per hour of effort.'
      },
      {
        id: 'smb-bd-1-s3',
        stepNumber: 3,
        title: 'Get the Strategic Recommendation',
        instruction: 'The table tells you what is true. Now ask the AI to tell you what to do about it — with specific, actionable recommendations based on your numbers.',
        promptTemplate: 'Based on this profitability table, give me a strategic recommendation structured as:\n\n🏆 DOUBLE DOWN ON (highest margin, highest value)\n- Which 1-2 products/services to prioritize, promote more, or expand\n- Why they are the strongest, and what would happen if I did 30% more volume in these\n\n⚠️ FIX OR REPRICE (decent volume, poor margin)\n- Which products/services are earning revenue but leaving money on the table\n- Specific suggestion: should I raise prices, cut costs, or both? By how much?\n\n🔴 CONSIDER CUTTING OR OUTSOURCING (worst margin, most time)\n- Which work might not be worth doing at current rates\n- If I cut this, what is the impact on total revenue vs total profit? Would I actually be better off?\n\n📊 ONE KEY INSIGHT\n- The single most important thing you notice in this data that I might be missing\n\nBe direct and specific. Give me numbers, not vague advice.',
        expectedOutput: 'A clear 3-part strategic recommendation covering what to grow, what to fix, and what to cut — with specific reasoning tied to your actual numbers.',
        tips: 'The "cut" recommendation is often the most valuable but hardest to act on. Give yourself 30 days to test raising the price on low-margin work before cutting it — you may find some clients accept the higher rate.'
      },
      {
        id: 'smb-bd-1-s4',
        stepNumber: 4,
        title: 'Set a 30-Day Focus Decision',
        instruction: 'A profitability analysis is only useful if it changes something you do. Use this final step to commit to one specific decision based on the data — and get the AI to build the plan for executing it.',
        promptTemplate: 'Based on the analysis, I want to make the following change in the next 30 days:\n\n[Choose one and fill in the blank:]\n- "I want to increase revenue from [BEST MARGIN SERVICE] by [X%] in the next 30 days."\n- "I want to raise the price of [LOW MARGIN SERVICE] from [CURRENT PRICE] to [NEW PRICE]."\n- "I want to reduce the time I spend on [LOWEST PROFIT/HR SERVICE] by [X hours/week] and redirect that time to [BETTER SERVICE]."\n- "I want to drop [UNPROFITABLE SERVICE] entirely and replace it with more [BEST SERVICE] work."\n\nFor the goal I chose above, give me:\n1. A specific 30-day action plan (weekly milestones, not vague goals)\n2. The expected impact on monthly profit if I succeed\n3. The one obstacle most likely to stop me and how to pre-empt it',
        expectedOutput: 'A 30-day action plan tied directly to your most profitable opportunity — with weekly milestones, projected profit impact, and a pre-emptive plan for the most likely obstacle.',
        tips: 'Put the 30-day plan somewhere you will see it every day. This analysis is worthless if it lives only in a chat window. Copy it into your phone notes, print it, or paste it into a WhatsApp message to yourself.'
      }
    ]
  },

  {
    id: 'smb-bd-2',
    slug: 'pricing-strategy-reset',
    title: 'Pricing Strategy Reset',
    subtitle: 'Find out if you are undercharging, calculate your true cost to deliver, benchmark against the market, and get a step-by-step script for raising your prices.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 25,
    timeSaved: 240,
    completionCount: 723,
    rating: 4.8,
    isPro: false,
    isNew: true,
    tools: ['ChatGPT', 'Claude'],
    beforeYouStart: [
      'Your current prices for your main products or services.',
      'A rough estimate of your monthly business expenses — rent, staff, materials, transport, utilities.',
      'A rough idea of how many hours per week you work in the business.',
      'Access to ChatGPT or Claude — free tier works.'
    ],
    expectedOutcome: 'Your minimum viable price (the floor you cannot go below without losing money), a market-benchmarked recommended price range, and a word-for-word script for communicating a price increase to existing clients without losing them.',
    agentAutomation: {
      description: 'Every quarter, the agent runs a pricing health check — comparing your current rates against your cost structure, checking whether margins are being squeezed as costs rise, and flagging any service where you may be losing money without realizing it.',
      trigger: 'First day of every quarter (Jan 1, Apr 1, Jul 1, Oct 1).',
      actions: [
        'Pull current price list from a Google Sheet',
        'Pull latest monthly expense totals from the Bookkeeping Ledger sheet',
        'Recalculate minimum viable prices based on updated costs',
        'Compare current prices to minimum viable prices — flag any that are below the threshold',
        'Send a Pricing Health Check email: which services need a price review and by how much'
      ],
      setupSteps: [
        { title: 'Create a Pricing Sheet', description: "Add a new tab to your Google Sheets workbook called 'Pricing'. Columns: Service Name | Current Price | Min Viable Price | Last Updated | Notes. Fill in manually after doing this playbook. Update Min Viable Price each quarter." },
        { title: 'Set Up Quarterly Make.com Trigger', description: "In Make.com, use a 'Schedule' trigger set to run on the 1st of January, April, July, and October at 9 AM. This fires the quarterly pricing review." },
        { title: 'Pull Costs and Prices', description: "Add two 'Google Sheets — Read Range' modules: one pulling the current price list, one pulling the last 3 months of expense totals from your Ledger. This gives the automation fresh cost data every quarter." },
        { title: 'Calculate and Compare', description: "Use a 'Tools — Set Variable' module to compute monthly cost per hour: Total Monthly Expenses ÷ Total Monthly Working Hours. Then for each service, compute Min Viable Price = (Hours Required × Cost Per Hour) + (Materials Cost × 1.2 markup). Flag any where Current Price < Min Viable Price." },
        { title: 'Send the Pricing Health Check', description: "Use Gmail to email yourself a summary table: Service | Current Price | Min Viable Price | Status (OK / BELOW COST / NEEDS REVIEW). Add Claude to write a one-paragraph commentary on the most urgent issue." }
      ],
      tools: ['Make.com', 'Google Sheets', 'Claude', 'Gmail']
    },
    troubleshooting: [
      {
        problem: 'I\'m scared to raise prices because I\'ll lose clients',
        solution: 'Tell the AI your specific fear: "I want to raise prices by 20% but I\'m worried client X will leave — they make up 40% of my revenue." The AI will model the actual risk for you: how many clients can you afford to lose and still come out ahead? The answer is often more than you think.'
      },
      {
        problem: 'My competitors charge much less than what the AI recommends',
        solution: 'Lower-priced competitors are usually less skilled, slower, or not making money — they will eventually raise prices or close. Ask the AI: "My competitor charges [X] but my minimum viable price is [Y]. How do I position my offering to justify the price difference to a skeptical client?"'
      },
      {
        problem: 'I have clients on long-term contracts at old prices — I can\'t raise those',
        solution: 'Raise prices only on new clients first. This builds confidence. Then, when existing contracts come up for renewal, apply the new pricing. Ask the AI to write a contract renewal letter that introduces the new rate professionally.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-bd-1', title: 'Profit Margin Analyzer: Find Your Most Profitable Work', slug: 'profit-margin-analyzer-most-profitable-work' },
      { id: 'smb-bd-3', title: 'Hire or Stay Solo: The Financial Decision', slug: 'hire-or-stay-solo-financial-decision' },
      { id: 'smb-bk-2', title: 'Monthly Financial Snapshot & P&L Analyzer', slug: 'monthly-financial-snapshot-pl-analyzer' }
    ],
    steps: [
      {
        id: 'smb-bd-2-s1',
        stepNumber: 1,
        title: 'Calculate Your True Cost to Deliver',
        instruction: 'Most business owners set prices based on gut feel or competitor copying — without ever calculating what it actually costs to deliver their work. This step builds your real cost baseline. Without it, any price is a guess.',
        promptTemplate: 'Help me calculate the true cost to deliver my work so I can set prices that actually make me money.\n\nMy business: [describe what you do and who you serve]\nMonthly fixed costs (rent, staff, tools, etc.): [total monthly expenses in $]\nHours I work per week on billable/client work: [hours]\n\nMy main services and what each involves:\n1. [service name] — roughly [X hours] to deliver, materials cost about [$ or "none"]\n2. [service name] — roughly [X hours] to deliver, materials cost about [$ or "none"]\n\nCurrent prices:\n1. [service name]: [current price]\n2. [service name]: [current price]\n\nCalculate my true hourly overhead rate, the full cost to deliver each service, and tell me clearly whether I am making or losing money on each one.',
        expectedOutput: 'A breakdown of your true cost to deliver each product/service, your effective hourly overhead rate, and a direct comparison showing whether your current prices are profitable.',
        tips: 'If your effective hourly overhead rate surprises you (it usually does), that is the point of this exercise. Many small business owners discover they have been effectively paying themselves less than minimum wage on their worst-performing services.'
      },
      {
        id: 'smb-bd-2-s2',
        stepNumber: 2,
        title: 'Set Your Minimum Viable Price Floor',
        instruction: 'The minimum viable price is the lowest price you can charge and still cover all your costs. Below this number, every sale loses you money. This is your absolute floor — not your target price, just the number you can never go below.',
        promptTemplate: 'Based on my cost analysis, calculate the Minimum Viable Price (MVP) for each product/service. The MVP must:\n- Cover 100% of direct material costs\n- Cover the allocated overhead for the time it takes to deliver\n- Leave at least [X%] gross margin (I want at least [15% / 20% / 30%] — tell me what is typical for my business type)\n\nFor each product/service:\n1. State the Minimum Viable Price (floor)\n2. State my current price\n3. State whether I am: ABOVE floor (profitable), AT floor (breaking even), or BELOW floor (losing money)\n4. State the recommended price increase to reach my target margin\n\nAlso: what is a reasonable target margin for a business like mine? Give me context on what similar businesses in my industry typically operate at.',
        expectedOutput: 'A clear price floor for every product/service, your current price vs. the floor, and a specific recommended price for each based on target margin.',
        tips: 'If your current price is below your minimum viable price for any service, that is the most urgent thing you have learned today. Do not take another order at that price until you have a plan.'
      },
      {
        id: 'smb-bd-2-s3',
        stepNumber: 3,
        title: 'Benchmark Against the Market',
        instruction: 'Your cost floor tells you what you cannot charge below. The market tells you what customers are willing to pay. The gap between the two is your pricing opportunity. This step positions your price where it belongs — not the cheapest, and not randomly expensive.',
        promptTemplate: 'Help me benchmark my prices against the market for my business type.\n\nMy business: [DESCRIBE] operating in [CITY/REGION/COUNTRY]\nMy current prices:\n- [Service A]: [Current Price]\n- [Service B]: [Current Price]\n- [Service C]: [Current Price]\n\nBased on your knowledge of market rates for businesses like mine:\n1. What is the typical LOW-END price range in my market for each service? (the budget option)\n2. What is the typical MID-MARKET price range? (competent, established providers)\n3. What is the typical PREMIUM price range? (specialists, high reputation)\n4. Where does my current pricing sit relative to these tiers?\n5. What would I need to demonstrate or change to justify charging mid-market or premium rates?\n\nThen give me a recommended price for each service that:\n- Is above my minimum viable price floor\n- Is appropriate for my current reputation and client base\n- Has room to grow as my reputation improves\n\nBe specific. Give me actual numbers, not ranges.',
        expectedOutput: 'A market benchmark for each service, your current position in the market (budget/mid/premium), and a specific recommended price that is both profitable and market-justified.',
        tips: 'If you have been charging budget prices, do not jump straight to premium — move to mid-market first. A 20-30% price increase with the right framing loses far fewer clients than you fear.'
      },
      {
        id: 'smb-bd-2-s4',
        stepNumber: 4,
        title: 'Get the Price Increase Script',
        instruction: 'Knowing the right price means nothing if you cannot tell your clients about it. This step gives you a word-for-word script for announcing a price increase — for both new and existing clients — that is honest, professional, and does not apologize unnecessarily.',
        promptTemplate: 'Write me two price increase communications:\n\nCONTEXT:\n- My new prices take effect: [DATE — ideally 30-60 days from now]\n- My current price for [MAIN SERVICE]: [Old Price]\n- My new price for [MAIN SERVICE]: [New Price] — a [X%] increase\n- I have been working with some clients for [X months/years]\n- The main reason for the increase: [choose one — rising costs / I have underpriced for years / I have invested in improving my skills/service / market rates have increased]\n\nCOMMUNICATION 1: Email to existing long-term clients\n- Warm and personal in tone\n- Acknowledge the relationship\n- Explain (briefly) the reason without over-apologizing\n- Give them a clear effective date\n- Offer: the old rate is locked in for any work booked before [DATE]\n- End with confidence and a clear next step\n\nCOMMUNICATION 2: Updated new client quote/proposal language\n- Professional, value-focused\n- Frame the price as an investment, not a cost\n- No mention of it being a recent increase\n- 2-3 sentences maximum for the pricing section of a proposal\n\nDo not use weak language like "I\'m sorry to inform you" or "I hope you understand." Be direct and confident.',
        expectedOutput: 'Two ready-to-use communications: one personalized email for existing clients and one updated proposal pricing paragraph for new clients.',
        tips: 'Most clients who leave after a price increase were already low-value clients. Studies show 80-90% of clients accept reasonable price increases from providers they trust. The key is giving enough notice and framing it around value, not cost.'
      }
    ]
  },

  {
    id: 'smb-bd-3',
    slug: 'hire-or-stay-solo-financial-decision',
    title: 'Hire or Stay Solo: The Financial Decision',
    subtitle: 'Stop guessing whether you can afford to hire. Build the full financial model — employee vs contractor, break-even revenue, and the exact month it starts making sense.',
    category: 'Finance',
    difficulty: 'Intermediate',
    timeToComplete: 30,
    timeSaved: 300,
    completionCount: 289,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['ChatGPT', 'Claude'],
    beforeYouStart: [
      'Your current monthly revenue (rough figure is fine).',
      'Your current monthly costs (rent, supplies, transport, your own take-home pay).',
      'A sense of what role you want to fill — what work would this person do, and roughly what you would pay them.',
      'An honest assessment of how many hours per week you are currently overwhelmed, working on things that someone else could do.'
    ],
    expectedOutcome: 'A full cost comparison of employee vs contractor, the exact break-even revenue you need to justify the hire, a month-by-month projection for the first 6 months after hiring, and a clear decision recommendation based on your numbers.',
    agentAutomation: {
      description: 'When your monthly revenue consistently hits your hiring threshold for 3 consecutive months, the agent automatically flags that you have crossed the financial break-even for hiring and sends you a ready-to-use job post draft and a suggested first-month onboarding schedule.',
      trigger: 'Monthly revenue check — fires when 3-month average exceeds your hiring break-even threshold.',
      actions: [
        'Check current 3-month average revenue from the Google Sheets Monthly Summary tab',
        'Compare against the hiring break-even threshold calculated in this playbook',
        'If threshold is exceeded for 3 consecutive months, trigger the hiring decision alert',
        'Send alert email with a drafted job description and a financial summary showing why the math now works',
        'Optionally post the job to relevant platforms via API (LinkedIn, local job boards)'
      ],
      setupSteps: [
        { title: 'Record Your Hiring Break-Even Number', description: "After completing this playbook, add your hiring break-even revenue figure to a 'Business Decisions' tab in your Google Sheets. This is the number Make.com will monitor each month." },
        { title: 'Set Up the Monthly Revenue Check', description: "In Make.com, create a scenario triggered on the 1st of each month. Pull the last 3 months of revenue totals from your Google Sheets Monthly Summary tab. Calculate the 3-month average." },
        { title: 'Build the Threshold Logic', description: "Add a 'Filter' module: only continue if the 3-month average is greater than or equal to your hiring break-even figure. This prevents false alarms from one good month." },
        { title: 'Send the Hiring Green-Light Alert', description: "If the filter passes for 3 consecutive months (track this with a counter in a Google Sheet cell), send yourself an email: 'Your revenue has supported a hire for 3 straight months. The math works. Here is your job post draft and the financial summary.'" }
      ],
      tools: ['Make.com', 'Google Sheets', 'Claude', 'Gmail']
    },
    troubleshooting: [
      {
        problem: 'I want to hire but I can\'t afford to pay someone a full salary',
        solution: 'Start with a part-time contractor, not an employee. A contractor for 10 hours/week at market rates gives you 80% of the capacity boost at 25% of the cost and zero administrative overhead. The AI will model this option for you.'
      },
      {
        problem: 'The break-even revenue seems impossibly high given my current numbers',
        solution: 'This is the most useful output of the exercise. If the break-even is far above your current revenue, your next priority is revenue growth, not hiring. Ask: "Given that I cannot yet afford to hire, what is the most high-leverage thing I can do in the next 90 days to close the gap?"'
      },
      {
        problem: 'I\'m worried about managing someone — I\'ve never been a boss',
        solution: 'This playbook addresses the financial decision only. For the management side, ask the AI separately: "I have never managed anyone before. I am about to hire my first employee for [role]. What are the 5 things I must do right in the first 30 days to set this up for success?"'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-bd-1', title: 'Profit Margin Analyzer: Find Your Most Profitable Work', slug: 'profit-margin-analyzer-most-profitable-work' },
      { id: 'smb-bd-2', title: 'Pricing Strategy Reset', slug: 'pricing-strategy-reset' },
      { id: 'smb-bd-4', title: 'Business Health Score & 90-Day Action Plan', slug: 'business-health-score-90-day-action-plan' }
    ],
    steps: [
      {
        id: 'smb-bd-3-s1',
        stepNumber: 1,
        title: 'Model the Full Cost of the Hire',
        instruction: 'Most business owners dramatically underestimate the true cost of a hire. The salary or daily rate is only the beginning. This step calculates the full economic cost so you are not surprised six months in.',
        promptTemplate: 'Help me calculate the true total cost of my first hire. I am considering two options and want to compare them.\n\nMY BUSINESS CONTEXT:\n- Business type: [DESCRIBE]\n- Current monthly revenue: approximately [AMOUNT]\n- Current monthly profit (what I take home): approximately [AMOUNT]\n- Location: [CITY, COUNTRY]\n\nOPTION A — FULL-TIME EMPLOYEE:\n- Role: [e.g. junior assistant / driver / production helper / admin staff]\n- Planned salary: [AMOUNT per month]\n- Expected working hours: [X hours/week]\n\nOPTION B — PART-TIME CONTRACTOR:\n- Same role but contracted\n- Expected hours per week: [X hours]\n- Rate you would pay: [AMOUNT per hour OR per day OR per deliverable]\n\nFor each option, calculate:\n1. Monthly salary/contractor cost\n2. Employer taxes and social contributions (if applicable in my country)\n3. Onboarding and training time cost (assume [X weeks] at [X hours/week] of my own time at [my effective hourly rate])\n4. Equipment/tools/workspace cost for the new person: [List what they would need, or say "nothing additional needed"]\n5. TOTAL true monthly cost for each option\n6. Annual cost for each option\n\nWhich option is cheaper for the first year? By how much?',
        expectedOutput: 'A complete cost comparison of employee vs contractor for the first year — including all hidden costs, not just the headline rate.',
        tips: 'Employers consistently underestimate onboarding cost. A new person takes 4-8 weeks to reach full productivity, during which they require your time and attention. Model this honestly or your projections will look better than reality.'
      },
      {
        id: 'smb-bd-3-s2',
        stepNumber: 2,
        title: 'Calculate Your Break-Even Revenue',
        instruction: 'The break-even revenue is the monthly revenue you need to cover all your existing costs PLUS the cost of the new hire AND still take home what you need. Below this number, hiring costs you money. Above it, you are fine.',
        promptTemplate: 'Calculate my hiring break-even revenue — the monthly revenue I need before a hire makes financial sense.\n\nMY CURRENT FINANCIALS:\n- Monthly fixed costs (before my pay): [AMOUNT]\n- My target monthly take-home pay: [AMOUNT — what I need to live comfortably]\n- Current average monthly revenue: [AMOUNT]\n- Current average monthly profit margin: approximately [X%]\n\nTHE HIRE:\n- Total monthly cost of hire (from Step 1): [AMOUNT]\n- Expected productivity ramp: [X months] before this person is fully productive\n- Expected revenue uplift from the hire: [Choose one]\n  a) "Direct revenue generator — I expect them to generate [AMOUNT] additional revenue per month once trained"\n  b) "Capacity liberator — by taking [X hours/week] off my plate, I can take on [AMOUNT] more client work"\n  c) "No direct revenue impact — they support operations only"\n\nCalculate:\n1. Break-even revenue (the number I need to cover everything including the hire)\n2. How far am I from that number today? What % growth do I need?\n3. Time to break-even: At my current growth rate of approximately [X% per month], when would I naturally hit this revenue?\n4. Risk scenario: What happens to my finances if the hire does not generate the expected uplift for 3 months?\n\nGive me a month-by-month projection for the first 6 months after hiring.',
        expectedOutput: 'Your specific break-even revenue number, how far you are from it today, a projected timeline to reach it, and a 6-month post-hire financial projection.',
        tips: 'If your break-even date is more than 18 months away at your current growth rate, the hire is premature. If it is less than 6 months away, the hire is likely overdue and the cost of NOT hiring (lost capacity, burnout) may already be affecting your growth.'
      },
      {
        id: 'smb-bd-3-s3',
        stepNumber: 3,
        title: 'The Capacity Audit — Is This Actually the Right Problem?',
        instruction: 'Sometimes what looks like a hiring problem is actually a pricing problem or a time-management problem. Before committing to a hire, do an honest audit of where your time actually goes — you might find a cheaper solution.',
        promptTemplate: 'Before I commit to hiring, help me audit whether this is the right solution.\n\nI feel I need to hire because: [describe the actual problem — e.g. "I\'m working 70-hour weeks and still missing deadlines" / "I can\'t take on new clients because I\'m at capacity" / "I spend all my time on admin instead of the work I\'m good at"]\n\nHere is a rough breakdown of how I spend my 50 working hours this week:\n- [Task/activity 1]: [X hours]\n- [Task/activity 2]: [X hours]\n- [Task/activity 3]: [X hours]\n- [Admin/paperwork/invoicing/messages]: [X hours]\n- [Travel/logistics]: [X hours]\n- [Other]: [X hours]\n\nOf these, the tasks I MUST do myself (only I can do these):\n[List them]\n\nOf these, tasks someone else could learn to do with training:\n[List them]\n\nOf these, tasks I could eliminate, automate, or stop doing entirely:\n[List them]\n\nAnalyze this and tell me:\n1. What is the minimum type of help I actually need? (Full-time / Part-time / Specific task only)\n2. Is there an automation or system that could solve part of this without hiring at all?\n3. If I raised my prices by 20%, could I afford to serve fewer clients at higher margin without needing to hire?\n4. What is your final recommendation: hire now, hire in [X months], or solve differently?',
        expectedOutput: 'An honest analysis of whether hiring is actually the right solution — or whether a pricing change, delegation, or automation could solve the capacity problem at lower cost.',
        tips: 'The most common finding: business owners spend 10-15 hours per week on admin tasks (invoicing, messages, scheduling, record-keeping) that could be handled by a virtual assistant for a fraction of a full hire\'s cost.'
      }
    ]
  },

  {
    id: 'smb-bd-4',
    slug: 'business-health-score-90-day-action-plan',
    title: 'Business Health Score & 90-Day Action Plan',
    subtitle: 'Score your business across 5 dimensions, pinpoint the single biggest lever for growth, and get a concrete 90-day plan to pull it — in one focused session.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 30,
    timeSaved: 400,
    completionCount: 418,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['ChatGPT', 'Claude'],
    beforeYouStart: [
      'Rough figures for your monthly revenue and main expenses — even estimates are fine.',
      'A sense of how many clients or customers you have and how often they come back.',
      'An honest assessment of what is working and what is frustrating you about the business right now.',
      'Access to ChatGPT or Claude — free tier works. This is a thinking session, not a data session.'
    ],
    expectedOutcome: 'A Business Health Score across 5 dimensions (Revenue, Margin, Cash, Growth, Risk), a diagnosis of your biggest constraint, and a specific 90-day action plan with weekly milestones targeting the highest-leverage opportunity in your business right now.',
    agentAutomation: {
      description: 'Every quarter, the agent automatically re-scores your Business Health across all 5 dimensions using your latest financial data, compares the score to last quarter, and delivers an updated 90-day plan focused on your new top constraint.',
      trigger: 'First day of every quarter.',
      actions: [
        'Pull latest 3-month revenue, expense, and cash data from Google Sheets',
        'Calculate updated scores for all 5 health dimensions',
        'Compare to prior quarter scores to detect improvement or decline',
        'Send data to Claude to identify the current top constraint and generate a fresh 90-day plan',
        'Deliver the Quarterly Business Review email with scores, trend arrows, and the new 90-day plan'
      ],
      setupSteps: [
        { title: 'Create a Business Health Tracker Tab', description: "Add a tab to your Google Sheets called 'Health Scores'. Columns: Quarter | Revenue Score | Margin Score | Cash Score | Growth Score | Risk Score | Overall Score | Top Constraint. After each quarterly review, enter your scores manually. This builds a historical record of business health over time." },
        { title: 'Set Up the Quarterly Make.com Scenario', description: "Create a Make.com scenario triggered on January 1, April 1, July 1, and October 1. Pull the prior quarter's financial totals from your Monthly Summary tab. Calculate the 5 health scores using the scoring formulas from this playbook." },
        { title: 'Generate the Updated 90-Day Plan', description: "Send the 5 scores and the prior quarter's top constraint to Claude via HTTP. Prompt: 'Here are our business health scores for Q[X]. Our prior top constraint was [X]. Identify the current top constraint, compare to last quarter, and generate a specific 90-day action plan for the new priority.'" },
        { title: 'Deliver the Quarterly Business Review', description: "Use Gmail to send a Quarterly Business Review email with: a scorecard table with trend arrows (up/down/flat per dimension), a 2-paragraph AI narrative on what the scores mean, and the 90-day action plan. This becomes your quarterly board meeting with yourself." }
      ],
      tools: ['Make.com', 'Google Sheets', 'Claude', 'Gmail']
    },
    troubleshooting: [
      {
        problem: 'My scores are all low and I feel overwhelmed about where to start',
        solution: 'This is exactly why the playbook forces a single top constraint. You cannot fix everything at once. Trust the process: fix the one biggest problem with full focus for 90 days, then reassess. A business that improves one dimension per quarter is a dramatically different business in 2 years.'
      },
      {
        problem: 'The AI identifies Cash as my top constraint but I thought it was Growth',
        solution: 'Cash always beats growth as a priority. A business can survive slow growth for years. A business that runs out of cash is dead in weeks. Work the cash problem first — the growth plan means nothing if you cannot make payroll next month.'
      },
      {
        problem: 'My 90-day plan feels too ambitious — I can\'t do all of this while running the business',
        solution: 'Tell the AI: "This plan has too many actions for someone running a business solo with [X hours/week] available. Reduce it to the 3 highest-impact actions only and sequence them so I\'m doing one thing at a time, not five things poorly."'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-bd-1', title: 'Profit Margin Analyzer: Find Your Most Profitable Work', slug: 'profit-margin-analyzer-most-profitable-work' },
      { id: 'smb-bd-2', title: 'Pricing Strategy Reset', slug: 'pricing-strategy-reset' },
      { id: 'smb-bd-3', title: 'Hire or Stay Solo: The Financial Decision', slug: 'hire-or-stay-solo-financial-decision' },
      { id: 'smb-bk-2', title: 'Monthly Financial Snapshot & P&L Analyzer', slug: 'monthly-financial-snapshot-pl-analyzer' }
    ],
    steps: [
      {
        id: 'smb-bd-4-s1',
        stepNumber: 1,
        title: 'Score Your Business Across 5 Dimensions',
        instruction: 'Before you can improve, you need an honest baseline. The Business Health Score measures five distinct areas of your business — each one can be strong while another is critically weak. Answering these questions as honestly as possible will give you a diagnosis, not just a description.',
        promptTemplate: 'Score my business health across 5 dimensions and tell me my single biggest constraint. Be direct — not reassuring.\n\nMy business: [what you do, how long you\'ve been running it, rough size]\n\nRevenue: [monthly revenue], trending [growing / flat / declining], clients are [diversified / 1-2 big clients]\nMargin: roughly [X%] net profit, [stable / improving / shrinking]\nCash: [X months] of expenses saved, clients pay [on time / I chase invoices]\nGrowth: new clients come from [referrals / ads / social / random], I [have a system / it\'s unpredictable]\nRisk: if my biggest client left, I\'d lose [X%] of revenue\n\nScore each dimension 1-10, give me an overall score, then name the single top constraint — the one thing that if fixed would move everything else.',
        expectedOutput: 'A scored Business Health assessment across all 5 dimensions, an overall score, and an identified top constraint — the single biggest problem holding the business back.',
        tips: 'The dimension that is hardest to answer honestly is almost always the one that needs the most attention. If you catch yourself softening a score, push back and answer with the true number.'
      },
      {
        id: 'smb-bd-4-s2',
        stepNumber: 2,
        title: 'Diagnose the Root Cause of Your Top Constraint',
        instruction: 'A score tells you what the problem is. A diagnosis tells you why it exists. The same symptom (e.g. low cash) can have a dozen different causes — and the wrong cure for the actual cause wastes months of effort.',
        promptTemplate: 'My top constraint is [TOP CONSTRAINT DIMENSION FROM STEP 1] with a score of [X/10].\n\nHere is more detail on what I observe about this problem:\n[Write 3-5 sentences describing what you actually see happening. Be specific. For example: "I always seem to have money coming in but then I check my bank and it\'s gone. I have been doing this for 2 years and I\'m never sure if I\'ll make payroll next month. I think the problem is my clients pay slowly but I\'m not sure."]\n\nBased on my score and description, diagnose the ROOT CAUSE of this problem. Do not accept my framing at face value — probe deeper. Common root causes include:\n\nFor Cash problems: Poor payment terms, high overhead, profit leaking to owner draws, seasonal patterns, invoice delays, pricing too low\nFor Revenue problems: No lead generation system, over-reliance on referrals, pricing, poor conversion, wrong target market\nFor Margin problems: Underpricing, scope creep, inefficient delivery, hidden costs, wrong service mix\nFor Growth problems: No marketing, invisible brand, serving wrong clients, geography limit, capacity ceiling\nFor Risk problems: Key person dependency, single client concentration, no cash buffer, unresolved legal issues\n\nGive me:\n1. Your diagnosis of the most likely root cause (not the symptom)\n2. The diagnostic question I should ask myself to confirm whether this is the true root cause\n3. What "fixing this" would look like in concrete, observable terms — how would I know it is solved?',
        expectedOutput: 'A root cause diagnosis that goes deeper than the surface symptom, a self-diagnostic question to confirm the diagnosis, and a clear definition of what "fixed" looks like.',
        tips: 'If the AI identifies a root cause that feels uncomfortable or challenges your assumptions — that is probably the right answer. Easy diagnoses lead to easy but ineffective solutions.'
      },
      {
        id: 'smb-bd-4-s3',
        stepNumber: 3,
        title: 'Build Your 90-Day Action Plan',
        instruction: 'Ninety days is long enough to make real progress and short enough to stay focused. This step converts your diagnosis into a specific, weekly-level action plan with clear milestones. The plan should have one primary goal, not ten.',
        promptTemplate: 'Build me a 90-day action plan to solve my top constraint: [TOP CONSTRAINT]\nRoot cause identified: [ROOT CAUSE FROM STEP 2]\n\nMY CONSTRAINTS:\n- Hours available per week for improvement work (not day-to-day operations): [X hours/week]\n- Budget available for this initiative: approximately [AMOUNT or "zero budget — free actions only"]\n- Skills I can use: [e.g. "I can design, I can write, I am good with people but not tech"]\n- Support available: [e.g. "I work alone" / "I have 1 staff member who can help" / "I have a business partner"]\n\nStructure the plan as:\n\n🎯 THE 90-DAY GOAL\n[One specific, measurable outcome — not a vague improvement but a number]\n\n📅 MONTH 1: FOUNDATION (Weeks 1-4)\nWeek 1: [Specific action]\nWeek 2: [Specific action]\nWeek 3: [Specific action]\nWeek 4: [Specific action]\nMonth 1 Milestone: [What should be true by end of Month 1?]\n\n📅 MONTH 2: EXECUTION (Weeks 5-8)\n[Weekly actions]\nMonth 2 Milestone: [What should be true?]\n\n📅 MONTH 3: SCALE (Weeks 9-12)\n[Weekly actions]\nMonth 3 Milestone: [Final measurable outcome]\n\n⚠️ THE ONE BIGGEST RISK\n[What is the most likely thing that will derail this plan? What is the pre-emptive solution?]\n\n📊 HOW I\'LL TRACK PROGRESS\n[One number to track weekly that shows whether the plan is working]',
        expectedOutput: 'A specific 90-day action plan with weekly-level milestones, a single measurable goal, a risk pre-emption strategy, and one weekly tracking metric.',
        tips: 'Print this plan or save it as your phone wallpaper. The difference between a business owner who implements and one who does not is almost never intelligence or capability — it is visibility. Make the plan impossible to ignore.'
      },
      {
        id: 'smb-bd-4-s4',
        stepNumber: 4,
        title: 'Set Your Weekly Review Ritual',
        instruction: 'A plan without a review ritual is just a wish. This final step sets up the simplest possible weekly check-in to keep you on track — 10 minutes every Friday that will compound into real results over 90 days.',
        promptTemplate: 'Create a weekly review ritual for my 90-day plan. I want the simplest possible structure that will take no more than 10 minutes every Friday.\n\nMy 90-day goal: [PASTE FROM STEP 3]\nMy weekly tracking metric: [PASTE FROM STEP 3]\n\nBuild me:\n\n1. A weekly review template I fill in every Friday (5 questions max, all answerable in 2 minutes)\n2. A simple scoring system: Green (on track), Yellow (slightly behind), Red (off track) — with clear definitions of what each colour means for my specific plan\n3. A rule: "If I am Red for 2 weeks in a row, I will [specific action — adjust the plan / ask for help / change the approach]"\n4. A suggested accountability method for someone running a business mostly alone: [e.g. weekly WhatsApp message to a friend / posting a number to a business group / putting a sticker on a visible chart]\n5. The ONE question I should ask myself at the end of Week 12 to decide whether the 90-day plan was a success',
        expectedOutput: 'A 5-question weekly review template, a Red/Yellow/Green tracking system, a contingency rule for when things fall behind, and a final success question for Day 90.',
        tips: 'The accountability method is more powerful than it sounds. Research consistently shows that sharing progress with even one other person — even informally — doubles the rate of follow-through. Pick a person and tell them your 90-day goal today.'
      }
    ]
  },

  // ── Fitness & Wellness ──────────────────────────────────────────────────────

  {
    id: 'fit-1',
    title: 'AI Meal Plan Generator',
    slug: 'ai-meal-plan-generator',
    category: 'Fitness & Wellness',
    subtitle: 'Generate a personalised weekly meal plan tailored to your dietary needs, health goals, and taste preferences — in under 5 minutes.',
    difficulty: 'Beginner',
    timeToComplete: 5,
    timeSaved: 120,
    isPro: false,
    isNew: true,
    expectedOutcome: 'A complete 7-day meal plan with breakfast, lunch, dinner, and snacks — customised to your calories, macros, allergies, and food preferences.',
    tools: ['Claude'],
    rating: 4.9,
    completionCount: 1340,
    beforeYouStart: [
      'Know your daily calorie target (use a TDEE calculator if unsure — search "TDEE calculator" online).',
      'Note any food allergies or intolerances (e.g. gluten, dairy, nuts).',
      'Have a rough idea of your health goal: lose weight, build muscle, maintain, or improve energy.',
      'Open Claude at claude.ai — the AI Copilot on each step lets you run the prompt directly.'
    ],
    troubleshooting: [
      { problem: 'The meal plan feels too repetitive', solution: 'Add "variety is important to me, include at least 3 different cuisines" to your prompt.' },
      { problem: 'The calories don\'t match my target', solution: 'Add "Each day should total exactly [X] calories. Show the calorie count per meal." to your prompt.' },
      { problem: 'I don\'t like some of the foods suggested', solution: 'Run the prompt again with "I dislike [food]. Do not include it or any dish containing it."' }
    ],
    steps: [
      {
        id: 'fit-1-s1',
        stepNumber: 1,
        title: 'Tell Claude your health profile',
        instruction: 'Give Claude the key details about your body, goals, and dietary restrictions so it can build a plan that actually fits your life.',
        tools: ['Claude'],
        promptTemplate: `Please create a personalised 7-day meal plan for me based on the following profile:

**Goal:** [e.g. lose weight / build muscle / maintain / more energy]
**Daily calorie target:** [e.g. 1,800 kcal]
**Dietary style:** [e.g. omnivore / vegetarian / vegan / pescatarian / keto / paleo]
**Allergies or foods to avoid:** [e.g. none / gluten-free / no nuts / no dairy]
**Meals per day:** [e.g. 3 meals + 2 snacks]
**Cooking time available:** [e.g. max 30 minutes per meal / I prefer quick recipes]
**Cuisine preferences:** [e.g. African, Mediterranean, Asian, or no preference]

For each day, list:
- Breakfast
- Lunch
- Dinner
- Snacks (if applicable)
- Approximate calories per meal

Keep ingredients practical and budget-friendly. At the end, add a short grocery list grouped by category (produce, proteins, dairy, pantry staples).`,
        expectedOutput: 'A structured 7-day meal plan with calories per meal and a grouped grocery list at the end.',
        tips: 'The more specific you are, the better the plan. If you have a calorie goal, include it. If you hate certain vegetables, say so. Claude will remember your preferences within the conversation, so you can ask follow-up questions like "swap out the Tuesday lunch for something high-protein."'
      },
      {
        id: 'fit-1-s2',
        stepNumber: 2,
        title: 'Generate a shopping list and meal prep guide',
        instruction: 'Ask Claude to turn the meal plan into a practical shopping list and a 30-minute Sunday meal prep guide so you actually stick to the plan.',
        tools: ['Claude'],
        promptTemplate: `Based on the 7-day meal plan above, please:

1. Consolidate all ingredients into one master shopping list, grouped by supermarket section (produce, meat/fish, dairy, grains, pantry).
2. List estimated quantities for each item so I know how much to buy.
3. Create a short Sunday meal-prep guide (max 30 minutes of active prep) that will make weekday meals faster. Focus on things that can be batch-cooked or prepped in advance.

Format the shopping list clearly so I can screenshot it and use it at the store.`,
        expectedOutput: 'A consolidated shopping list with quantities grouped by aisle, plus a time-saving Sunday prep routine.',
        tips: 'You can paste this shopping list into any notes app or share it directly. Ask Claude to "add estimated costs for each section" if you want a rough budget too.'
      },
      {
        id: 'fit-1-s3',
        stepNumber: 3,
        title: 'Customise and iterate',
        instruction: 'Refine any meals you don\'t love, swap for convenience options, or ask Claude for recipe cards for your favourite meals in the plan.',
        tools: ['Claude'],
        promptTemplate: `I'd like to make a few tweaks to the meal plan:

[Describe your adjustments, e.g.:]
- Replace the Thursday dinner with a high-protein option under 500 calories
- I don't have time to cook on Wednesdays — suggest a healthy takeout or ready-meal alternative
- Give me a detailed recipe card (ingredients + instructions) for [specific meal from the plan]
- Adjust the whole plan to [new calorie target] kcal per day`,
        expectedOutput: 'Updated meals, recipe cards, or a revised plan based on your feedback.',
        tips: 'Treat this as a conversation. Claude remembers the meal plan from earlier in the chat, so you can say "keep everything the same but change breakfast to something with eggs" and it will update just that part.'
      }
    ],
    relatedPlaybooks: [
      { id: 'fit-2', title: 'Personalised Fitness Plan Builder', slug: 'personalised-fitness-plan-builder' }
    ]
  },

  {
    id: 'fit-2',
    title: 'Personalised Fitness Plan Builder',
    slug: 'personalised-fitness-plan-builder',
    category: 'Fitness & Wellness',
    subtitle: 'Build a custom workout plan for any body part or goal — whether you have a gym, dumbbells, or just your bodyweight.',
    difficulty: 'Beginner',
    timeToComplete: 5,
    timeSaved: 180,
    isPro: false,
    isNew: true,
    expectedOutcome: 'A detailed weekly workout schedule with exercises, sets, reps, rest periods, and progressive overload guidance — tailored to your fitness level and available equipment.',
    tools: ['Claude'],
    rating: 4.8,
    completionCount: 980,
    beforeYouStart: [
      'Decide which body part or goal to focus on: full body, chest, back, legs, core, glutes, arms, or fat loss.',
      'Know your current fitness level: complete beginner, intermediate, or advanced.',
      'Know what equipment you have access to: no equipment (bodyweight), dumbbells, resistance bands, or a full gym.',
      'Open Claude at claude.ai — use the AI Copilot button on each step to run the prompt directly.'
    ],
    troubleshooting: [
      { problem: 'The exercises feel too hard', solution: 'Tell Claude "I\'m finding [exercise] too difficult. Suggest a beginner regression." Claude will suggest an easier variation.' },
      { problem: 'I don\'t have the equipment listed', solution: 'Say "Replace all exercises requiring [equipment] with bodyweight alternatives." Claude will rebuild the plan accordingly.' },
      { problem: 'I want more variety', solution: 'Ask "Give me 3 alternative exercises for each movement in the plan." Claude will expand your exercise library.' }
    ],
    steps: [
      {
        id: 'fit-2-s1',
        stepNumber: 1,
        title: 'Define your fitness profile and goal',
        instruction: 'Tell Claude what you\'re working with — your goal, fitness level, available equipment, and how many days per week you can train — so it can build the right plan for you.',
        tools: ['Claude'],
        promptTemplate: `Please build me a personalised fitness plan based on the following:

**Primary focus / goal:** [e.g. build glutes / lose belly fat / full body strength / bigger arms / improve cardio / recover from injury]
**Fitness level:** [beginner / intermediate / advanced]
**Available equipment:** [none (bodyweight only) / dumbbells / resistance bands / home gym / full commercial gym]
**Days per week I can train:** [e.g. 3 / 4 / 5]
**Session length:** [e.g. 30 minutes / 45 minutes / 60 minutes]
**Any injuries or areas to avoid:** [e.g. lower back pain, bad knees, shoulder injury, or none]

For each training day, provide:
- Day name and muscle focus
- Full exercise list with sets, reps (or duration), and rest periods
- A brief tip on form or technique for the most important exercise of the day
- A note on how to progress (progressive overload guidance) once the workout feels too easy

End with a short weekly recovery and stretching recommendation.`,
        expectedOutput: 'A weekly workout schedule with every exercise, sets, reps, rest times, form tips, and a progression plan.',
        tips: 'Be honest about your fitness level. A beginner plan built for a beginner is far more effective than an advanced plan you can\'t complete. If you\'re not sure, describe what you can currently do (e.g. "I can do 5 push-ups") and Claude will calibrate the plan for you.'
      },
      {
        id: 'fit-2-s2',
        stepNumber: 2,
        title: 'Get a step-by-step guide for your key exercises',
        instruction: 'Pick 2–3 exercises from the plan that are new to you and ask Claude to explain how to perform them safely and correctly.',
        tools: ['Claude'],
        promptTemplate: `For the following exercises from my plan, please give me a detailed step-by-step guide on how to perform each one:

[List 2-3 exercises, e.g.:]
- Romanian Deadlift
- Bulgarian Split Squat
- Cable Lateral Raise

For each exercise:
1. Starting position (how to set up)
2. The movement (step-by-step breakdown)
3. Common mistakes to avoid
4. How to scale it up or down based on difficulty
5. A cue or mental trick that helps with form`,
        expectedOutput: 'Detailed form guides for your chosen exercises with beginner tips and common mistake warnings.',
        tips: 'You can also ask Claude to describe what a correct rep should feel like (muscle activation cues). For example: "When should I feel the glutes engaging during a hip thrust?" — this is often more useful than purely mechanical instructions.'
      },
      {
        id: 'fit-2-s3',
        stepNumber: 3,
        title: 'Build a 4-week progressive overload tracker',
        instruction: 'Ask Claude to lay out how the plan should progress over 4 weeks so you\'re always improving without overtraining.',
        tools: ['Claude'],
        promptTemplate: `Based on the fitness plan above, please create a 4-week progressive overload schedule.

For each week, show:
- How sets, reps, or weight should change compared to the previous week
- When to add a deload week (if applicable) and what that looks like
- How to know when I'm ready to move to the next level of difficulty

Format it as a simple week-by-week table I can follow and check off as I go.

Also add: what results can I realistically expect after 4 weeks if I follow this plan consistently?`,
        expectedOutput: 'A 4-week progressive plan with clear weekly targets and realistic result expectations.',
        tips: 'Progressive overload is the single most important principle in fitness. Simply doing the same workout every week leads to plateaus. Even adding one extra rep per week adds up to 52 extra reps over a year — which compounds into significant strength and muscle gains.'
      }
    ],
    relatedPlaybooks: [
      { id: 'fit-1', title: 'AI Meal Plan Generator', slug: 'ai-meal-plan-generator' }
    ]
  },

  // ── Business Research ────────────────────────────────────────────────────────

  {
    id: 'biz-res-1',
    title: 'AI Competitor Intelligence Report',
    slug: 'ai-competitor-intelligence-report',
    category: 'Business Development',
    subtitle: 'Map your competitive landscape, uncover rival weaknesses, and build a sharp positioning statement — all in under 30 minutes.',
    difficulty: 'Beginner',
    timeToComplete: 30,
    timeSaved: 300,
    isPro: false,
    isNew: true,
    expectedOutcome: 'A structured competitor intelligence brief with a positioning statement that clearly differentiates your business.',
    tools: ['Claude'],
    rating: 4.8,
    completionCount: 870,
    beforeYouStart: [
      'Know the names of 2–4 direct competitors (Google them if needed).',
      'Have a one-sentence description of your own business ready.',
      'Open Claude at claude.ai — every step has a Copilot prompt you can run directly.',
    ],
    troubleshooting: [
      { problem: 'I don\'t know who my competitors are', solution: 'Start Step 1 with just your product description and ask Claude: "Who are the top 5 competitors in this space?" It will identify them for you.' },
      { problem: 'Claude\'s information about a competitor seems outdated', solution: 'Paste the competitor\'s homepage text into the chat and ask Claude to analyse it directly. This is more reliable than relying on its training data.' },
    ],
    steps: [
      {
        id: 'biz-res-1-s1',
        stepNumber: 1,
        title: 'Map the competitive landscape',
        instruction: 'Give Claude your business context and competitor names so it can build a side-by-side comparison of the market.',
        tools: ['Claude'],
        promptTemplate: `I need a competitor analysis for my business. Here is the context:

**My business:** [Describe what you do and who you serve in 2-3 sentences]
**My competitors:** [List 2-4 competitor names, e.g. Company A, Company B, Company C]
**My market/industry:** [e.g. B2B SaaS for accountants, local restaurant delivery, freelance design services]

For each competitor, please create a table showing:
1. Their primary product or service
2. Target customer
3. Price positioning (premium / mid-market / budget)
4. Key strengths (top 2)
5. Visible weaknesses or gaps (top 2)
6. What they are known for (their "claim to fame")

End with a 3-sentence summary of the overall competitive landscape.`,
        expectedOutput: 'A competitor comparison table with a landscape summary.',
        tips: 'If Claude doesn\'t have information on a niche competitor, paste their website\'s "About" or homepage text into the same message — Claude can analyse any text you give it.',
      },
      {
        id: 'biz-res-1-s2',
        stepNumber: 2,
        title: 'Find the gaps your competitors are ignoring',
        instruction: 'Based on the competitive map, ask Claude to identify underserved customer needs and market white spaces your business could own.',
        tools: ['Claude'],
        promptTemplate: `Based on the competitive analysis above, please identify:

1. **Customer pain points no one is fully solving** — what are buyers in this market still complaining about even with existing solutions?
2. **Underserved customer segments** — is there a specific type of buyer, geography, or use case that all the competitors seem to overlook?
3. **Positioning white space** — is there a value proposition (e.g. simplest, fastest, most personal, most affordable for a specific group) that no competitor currently owns clearly?
4. **Emerging trends** — what shifts in the market (technology, regulation, buyer behaviour) could create a new opportunity in the next 12–24 months?

Present this as a ranked list of opportunities, most actionable first.`,
        expectedOutput: 'A ranked list of market gaps and untapped opportunities.',
        tips: 'The white space analysis is the most valuable output here. Ask Claude to go deeper on whichever gap resonates most: "Tell me more about the [gap]. What would a business need to do to credibly own that position?"',
      },
      {
        id: 'biz-res-1-s3',
        stepNumber: 3,
        title: 'Write your differentiated positioning statement',
        instruction: 'Use the gap analysis to craft a sharp one-sentence positioning statement that tells customers exactly why they should choose you over anyone else.',
        tools: ['Claude'],
        promptTemplate: `Based on everything above — the competitive landscape and the gaps we identified — please write 3 positioning statement options for my business.

Each statement should follow this structure:
"For [specific target customer], [my business] is the [category] that [key benefit] because [reason to believe]."

Make each option bet on a different competitive angle:
- Option 1: Bet on simplicity / ease
- Option 2: Bet on a specific customer segment we can serve better than anyone else
- Option 3: Bet on the biggest unmet need we identified

Then recommend which one you think is strongest and why.`,
        expectedOutput: '3 positioning statement options with a recommended choice and rationale.',
        tips: 'Pick one and test it. Paste it into your website headline, a LinkedIn post, or a 30-second pitch. The market will tell you which one lands. You can always run this step again in 3 months as your market evolves.',
      },
    ],
    relatedPlaybooks: [
      { id: 'smb-bd-1', title: 'Profit Margin Analyzer', slug: 'profit-margin-analyzer-most-profitable-work' },
      { id: 'risk-1', title: 'Business Risk Scorecard', slug: 'business-risk-scorecard' },
    ],
  },

  // ── Sales ────────────────────────────────────────────────────────────────────

  {
    id: 'sales-ai-1',
    title: 'AI Cold Outreach Machine',
    slug: 'ai-cold-outreach-machine',
    category: 'Sales Ops',
    subtitle: 'Build a hyper-personalised outreach sequence for any prospect in minutes — emails, LinkedIn messages, and objection responses included.',
    difficulty: 'Beginner',
    timeToComplete: 20,
    timeSaved: 240,
    isPro: false,
    isNew: true,
    expectedOutcome: 'A 3-touch outreach sequence (email + LinkedIn + follow-up) personalised to a specific prospect, plus a ready-made objection-handling guide.',
    tools: ['Claude'],
    rating: 4.9,
    completionCount: 1540,
    beforeYouStart: [
      'Know who you are trying to reach — their job title, company, and ideally their name.',
      'Have a clear one-sentence description of what you are selling and the primary pain it solves.',
      'Have the prospect\'s LinkedIn URL or company website open in another tab.',
    ],
    troubleshooting: [
      { problem: 'My emails sound too formal or robotic', solution: 'Add this to your prompt: "Write in a conversational, direct tone — like a trusted peer, not a sales rep. No buzzwords." Claude will adjust the register immediately.' },
      { problem: 'I don\'t know enough about the prospect to personalise', solution: 'Paste their LinkedIn "About" section or a recent post they made into the chat. Ask Claude to identify a relevant hook based on that content.' },
    ],
    steps: [
      {
        id: 'sales-ai-1-s1',
        stepNumber: 1,
        title: 'Build your ideal customer profile and hook',
        instruction: 'Define exactly who you are targeting and what business pain they are most likely feeling right now — this becomes the foundation of every message.',
        tools: ['Claude'],
        promptTemplate: `Help me build a sharp outreach profile for the following prospect:

**Prospect name:** [e.g. Sarah Mensah]
**Job title:** [e.g. Head of Operations]
**Company:** [e.g. Trove Logistics — 50-person freight company in Lagos]
**What I sell:** [e.g. AI-powered route optimisation software that cuts delivery costs by 15-20%]
**Primary pain I solve:** [e.g. Rising fuel costs and manual dispatch errors causing late deliveries]

Based on this, please tell me:
1. The #1 business pain Sarah is most likely stressed about in her role right now
2. The outcome she is personally responsible for that my product directly impacts
3. A relevant conversation hook (something timely — an industry trend, a recent news event, or a challenge common at her stage of growth)
4. The single most compelling stat or result I should lead with in my outreach`,
        expectedOutput: 'A sharp prospect profile with a pain point, personal outcome, hook, and lead stat.',
        tips: 'The "personal outcome" is often more powerful than the business outcome. A Head of Operations doesn\'t just want lower costs — they want to be the person who solved the delivery problem. Frame your message around their win, not just the company\'s.',
      },
      {
        id: 'sales-ai-1-s2',
        stepNumber: 2,
        title: 'Write a 3-touch outreach sequence',
        instruction: 'Generate a complete multi-touch sequence — first email, LinkedIn connection note, and a follow-up — all personalised to the prospect profile.',
        tools: ['Claude'],
        promptTemplate: `Based on the prospect profile above, write a 3-touch outreach sequence:

**Touch 1 — Cold email (subject line + body)**
- Max 100 words
- Open with the hook, not a product pitch
- One specific pain point
- One result/stat
- One clear, low-friction call to action (e.g. "Worth a 15-min call this week?")

**Touch 2 — LinkedIn connection request note**
- Max 300 characters
- Personal, not salesy
- Reference something specific about their work or company

**Touch 3 — Follow-up email (3 days after Touch 1)**
- Max 80 words
- Don't repeat the same angle — try a different hook or offer a resource
- Make it easy to say "not now" rather than pushing for a yes

Label each touch clearly. Keep the tone warm, direct, and human.`,
        expectedOutput: 'A complete 3-touch sequence ready to copy and send.',
        tips: 'The best follow-up emails acknowledge that the person is busy and make it easy to respond with a single word. Try ending with: "Is this even on your radar for [quarter]?" — it\'s binary and requires almost no effort to answer.',
      },
      {
        id: 'sales-ai-1-s3',
        stepNumber: 3,
        title: 'Prepare your objection-handling guide',
        instruction: 'Anticipate the 5 most likely objections for this specific prospect and get sharp, non-pushy responses ready before your first conversation.',
        tools: ['Claude'],
        promptTemplate: `Based on what I sell ([your product/service]) and the prospect profile above, write an objection-handling guide for my sales conversations.

For each of the 5 most likely objections, provide:
1. The exact objection (word-for-word how a prospect typically says it)
2. What the prospect really means underneath that objection
3. A 2-3 sentence response that acknowledges, reframes, and moves forward
4. A follow-up question to keep the conversation going

The 5 objections to cover:
- "We don't have budget right now"
- "We're already using [competitor]"
- "Now isn't a good time"
- "I need to talk to [someone else] first"
- [Most industry-specific objection for my product]

Keep the responses conversational — not scripted.`,
        expectedOutput: 'A 5-objection handling guide with reframes and follow-up questions.',
        tips: 'The most important column is "what they really mean." Most objections are not the literal words being said. "No budget" often means "I\'m not convinced the ROI is worth it yet." Once you understand the real concern, the response writes itself.',
      },
    ],
    relatedPlaybooks: [
      { id: 'smb-1', title: '30-Day Social Media Content Engine', slug: '30-day-social-media-content-engine' },
      { id: 'biz-res-1', title: 'AI Competitor Intelligence Report', slug: 'ai-competitor-intelligence-report' },
    ],
  },

  // ── Risk Analysis ────────────────────────────────────────────────────────────

  {
    id: 'risk-1',
    title: 'Business Risk Scorecard',
    slug: 'business-risk-scorecard',
    category: 'Risk & Strategy',
    subtitle: 'Identify, score, and build mitigation plans for the top risks threatening your business — before they become emergencies.',
    difficulty: 'Intermediate',
    timeToComplete: 25,
    timeSaved: 360,
    isPro: false,
    isNew: true,
    expectedOutcome: 'A prioritised risk register with likelihood scores, impact ratings, and actionable mitigation plans for your top 5 business risks.',
    tools: ['Claude'],
    rating: 4.7,
    completionCount: 620,
    beforeYouStart: [
      'Think about your business model — how do you make money and where could that break?',
      'Consider your key dependencies: suppliers, staff, clients, technology, or regulations.',
      'This works for any business stage — a side hustle, growing SMB, or established company.',
    ],
    troubleshooting: [
      { problem: 'The risks feel too generic', solution: 'In Step 1, give Claude more specific details about your business: your revenue model, your biggest client concentration, your key supplier, and your team size. The more specific the input, the more specific the risks.' },
      { problem: 'I don\'t know how to score risks', solution: 'Use the 1–5 scale Claude suggests. When in doubt, ask: "How would this risk affect my revenue in the next 90 days?" If the answer is "significantly," score it high impact.' },
    ],
    steps: [
      {
        id: 'risk-1-s1',
        stepNumber: 1,
        title: 'Identify your business risk categories',
        instruction: 'Give Claude a snapshot of your business so it can generate a tailored risk inventory across all the key risk categories.',
        tools: ['Claude'],
        promptTemplate: `I want to identify and analyse risks for my business. Here is the context:

**Business type:** [e.g. freelance marketing agency / retail shop / SaaS startup / logistics company]
**Revenue model:** [e.g. monthly retainers / product sales / subscription fees / per-project]
**Team size:** [e.g. just me / 3-person team / 15 employees]
**Stage:** [e.g. just launched / 2 years in / scaling rapidly]
**Key dependencies:** [e.g. 2 main clients make up 80% of revenue / rely on one supplier / fully remote team]
**Industry:** [e.g. digital marketing, food & beverage, fintech, logistics]

Based on this, please identify the top 8–10 risks across these categories:
- Financial risks (cash flow, client concentration, pricing)
- Operational risks (team, technology, processes)
- Market risks (competition, demand shifts, pricing pressure)
- Compliance & legal risks (regulations, contracts, IP)
- Reputation risks (online reviews, social media, PR)

For each risk, write one sentence describing what it looks like in practice for MY specific business.`,
        expectedOutput: 'A tailored list of 8–10 specific, named risks across all categories.',
        tips: 'Don\'t skip the "key dependencies" field. A business with 80% of revenue from one client has a fundamentally different risk profile than one with 50 clients. Claude needs that context to give you useful, non-generic risks.',
      },
      {
        id: 'risk-1-s2',
        stepNumber: 2,
        title: 'Score and prioritise your risks',
        instruction: 'Rate each risk by likelihood and impact so you know which ones deserve your attention first.',
        tools: ['Claude'],
        promptTemplate: `For the risks identified above, please create a Risk Scorecard table with the following columns:

| Risk | Likelihood (1–5) | Impact if it happens (1–5) | Risk Score (L × I) | Priority |

Scoring guide:
- Likelihood: 1 = very unlikely, 3 = possible, 5 = already happening or very likely in 6 months
- Impact: 1 = minor inconvenience, 3 = significant disruption, 5 = could end the business

After scoring, rank the top 5 risks by Risk Score and explain in 1–2 sentences why each scored that way for my specific business.

Then identify: which 1–2 risks are most urgent to address in the next 30 days?`,
        expectedOutput: 'A scored risk table with top 5 prioritised risks and a 30-day urgent action list.',
        tips: 'High likelihood + high impact = your house is on fire. High impact + low likelihood = buy insurance. Low impact + high likelihood = manage it with a process. This matrix tells you where to spend your energy versus where to just have a backup plan.',
      },
      {
        id: 'risk-1-s3',
        stepNumber: 3,
        title: 'Build your mitigation plan',
        instruction: 'For your top 5 risks, get specific, actionable steps to either reduce the likelihood, reduce the impact, or have a contingency ready.',
        tools: ['Claude'],
        promptTemplate: `For the top 5 risks identified and scored above, please create a Mitigation Plan for each one.

For each risk, provide:
1. **Prevention action** — one concrete step I can take to reduce the likelihood of this risk happening (with a specific next action I can do this week)
2. **Contingency plan** — if this risk does happen, what are the first 3 steps I should take?
3. **Early warning signal** — what is the first sign I would notice that this risk is becoming real? (so I catch it early)
4. **Owner** — for a small team, who should be responsible for monitoring this risk? (by role, e.g. founder, ops lead, finance)

Format as a clear table or section per risk. Be specific and actionable — not generic advice.`,
        expectedOutput: 'A 5-risk mitigation plan with prevention actions, contingency steps, and early warning signals.',
        tips: 'The early warning signal is the most underused column. Most businesses only act when the risk has already hit. Identify one leading indicator per risk — for example, "if outstanding invoices exceed 45 days" is an early warning for a cash flow crisis — and check it monthly.',
      },
    ],
    relatedPlaybooks: [
      { id: 'biz-res-1', title: 'AI Competitor Intelligence Report', slug: 'ai-competitor-intelligence-report' },
      { id: 'smb-bd-4', title: 'Business Health Score & 90-Day Action Plan', slug: 'business-health-score-90-day-action-plan' },
    ],
  },

  // ── Marketing ────────────────────────────────────────────────────────────────

  {
    id: 'mktg-ai-1',
    title: '60-Minute AI Marketing Strategy',
    slug: '60-minute-ai-marketing-strategy',
    category: 'Marketing',
    subtitle: 'Build a complete go-to-market strategy — positioning, channels, messaging, and a 90-day campaign plan — faster than any agency brief.',
    difficulty: 'Intermediate',
    timeToComplete: 40,
    timeSaved: 480,
    isPro: false,
    isNew: true,
    expectedOutcome: 'A clear marketing strategy doc with positioning, top 3 channels, core messaging pillars, and a 90-day campaign plan with weekly actions.',
    tools: ['Claude'],
    rating: 4.8,
    completionCount: 1120,
    beforeYouStart: [
      'Know your target customer — who is the specific person you are trying to reach?',
      'Know your primary goal: get more leads, increase brand awareness, retain customers, or launch a new product.',
      'Have your monthly marketing budget in mind (even a rough range).',
    ],
    troubleshooting: [
      { problem: 'The strategy feels too broad', solution: 'Add more constraints: "I have a ₦200k/month budget, a team of 2, and I only want to focus on Lagos for now." Constraints are what make strategies actionable.' },
      { problem: 'I\'m not sure which channels to focus on', solution: 'Tell Claude "I\'m a complete beginner with all channels." It will recommend the 1-2 that offer the best ROI for your specific business type and audience.' },
    ],
    steps: [
      {
        id: 'mktg-ai-1-s1',
        stepNumber: 1,
        title: 'Define your positioning and target customer',
        instruction: 'Build a precise customer profile and a clear positioning statement — this is the foundation everything else rests on.',
        tools: ['Claude'],
        promptTemplate: `I need to build a marketing strategy for my business. Here is the context:

**Business:** [What you do and who you serve in 2-3 sentences]
**Primary goal:** [e.g. generate 20 new leads per month / increase brand awareness / launch new product / grow from 100 to 500 customers]
**Target customer:** [Describe the person: their job/role, age range, location, what they care about, their biggest frustration related to what you sell]
**Budget (monthly):** [e.g. under ₦100k / ₦200-500k / no fixed budget]
**Current marketing:** [What you already do — social media, word of mouth, ads, events, nothing]
**Competitors:** [2-3 names if you know them]

Based on this, please:
1. Write a one-sentence customer persona that captures who I am really speaking to
2. Identify their top 3 buying motivations (why they would pay for my solution)
3. Identify their top 2 buying objections (what stops them from buying)
4. Write a positioning statement: "For [persona], [my brand] is the [category] that [benefit] because [reason to believe]."`,
        expectedOutput: 'A customer persona, buying motivations, objections, and positioning statement.',
        tips: 'The "buying objections" are often more useful than the motivations. Knowing exactly what stops someone from buying tells you exactly what your marketing needs to address. Build your messaging around eliminating those objections.',
      },
      {
        id: 'mktg-ai-1-s2',
        stepNumber: 2,
        title: 'Choose your channels and core messaging',
        instruction: 'Select the 2–3 channels where your customers actually spend time and build a messaging framework that works across all of them.',
        tools: ['Claude'],
        promptTemplate: `Based on the positioning and customer profile above, please recommend:

**Channel Strategy:**
1. The top 3 marketing channels I should focus on (from: Instagram, LinkedIn, TikTok, Facebook, Google Ads, content/SEO, email, WhatsApp, events, partnerships, referrals)
2. For each channel: why it fits my customer, what type of content works best, and realistic expectations for my budget level
3. Which channel to start with if I can only do one

**Messaging Framework:**
1. My hero message — the single most important thing I want people to associate with my brand (10 words or less)
2. Three messaging pillars — the 3 main themes I should consistently communicate (one sentence each)
3. Proof points — 3 specific facts, results, or stories that make my claims believable
4. A tagline option (max 7 words)`,
        expectedOutput: 'A channel recommendation with rationale and a messaging framework.',
        tips: 'Most small businesses try to be on every channel and do none of them well. Pick 2 channels and master them for 90 days before adding more. Consistency beats variety every time.',
      },
      {
        id: 'mktg-ai-1-s3',
        stepNumber: 3,
        title: 'Build your 90-day campaign plan',
        instruction: 'Turn the strategy into a concrete 90-day action plan with monthly themes, weekly actions, and measurable goals.',
        tools: ['Claude'],
        promptTemplate: `Based on our positioning, channels, and messaging above, create a 90-day marketing campaign plan.

Structure it as:
**Month 1 — Foundation (Weeks 1–4):** Theme + 3 weekly content/campaign actions + 1 key metric to hit
**Month 2 — Growth (Weeks 5–8):** Theme + 3 weekly content/campaign actions + 1 key metric to hit
**Month 3 — Scale (Weeks 9–12):** Theme + 3 weekly content/campaign actions + 1 key metric to hit

For each weekly action, be specific (e.g. "Post 3x on Instagram: 1 behind-the-scenes, 1 customer result, 1 educational" — not just "post on Instagram").

End with:
- 5 KPIs I should track monthly
- One quick win I can execute in the next 7 days to build momentum`,
        expectedOutput: 'A 90-day marketing calendar with weekly actions and monthly KPIs.',
        tips: 'The "quick win in 7 days" is the most important output. Don\'t file this strategy away — execute the quick win today or tomorrow. Momentum compounds. A strategy that stays in a doc is worth nothing.',
      },
    ],
    relatedPlaybooks: [
      { id: 'smb-1', title: '30-Day Social Media Content Engine', slug: '30-day-social-media-content-engine' },
      { id: 'biz-res-1', title: 'AI Competitor Intelligence Report', slug: 'ai-competitor-intelligence-report' },
    ],
  },

  // ── Financial Analysis ───────────────────────────────────────────────────────

  {
    id: 'fin-analysis-1',
    title: 'Business Financial Health Check',
    slug: 'business-financial-health-check',
    category: 'Finance',
    subtitle: 'Feed Claude your revenue, costs, and cash flow numbers and get a frank diagnosis of your financial health — with a clear action plan.',
    difficulty: 'Beginner',
    timeToComplete: 20,
    timeSaved: 180,
    isPro: false,
    isNew: true,
    expectedOutcome: 'A financial health score with a breakdown of your profitability, cash flow, and cost structure — plus 3 specific actions to improve each area.',
    tools: ['Claude'],
    rating: 4.8,
    completionCount: 980,
    beforeYouStart: [
      'Pull up your last 3 months of revenue and expense figures — from a spreadsheet, bank statement, or accounting app.',
      'Know your rough fixed costs (rent, salaries, subscriptions) vs variable costs (materials, commissions).',
      'No accounting knowledge needed — Claude will explain everything in plain English.',
    ],
    troubleshooting: [
      { problem: 'I don\'t have exact numbers', solution: 'Use estimates. Round to the nearest ₦10,000 or $1,000. The analysis is about identifying patterns and ratios, not exact precision.' },
      { problem: 'My numbers look bad — I\'m nervous to share them', solution: 'Claude has no memory between conversations and no way to share your data. Be honest with the numbers — a financial diagnosis only helps if it\'s based on real figures.' },
    ],
    steps: [
      {
        id: 'fin-analysis-1-s1',
        stepNumber: 1,
        title: 'Upload your financial data',
        instruction: 'Upload your bank export, accounting CSV, or spreadsheet. Claude will extract the numbers, calculate your key ratios, and identify patterns — no manual entry needed.',
        tools: ['Claude'],
        promptTemplate: `Please analyse the financial health of my business based on the following data.

Business type: [Business Type]

Here is my complete financial data (last 3 months of transactions, P&L, or expense records):
[Your Financial Data]

From this data, please calculate and explain:
1. Average monthly revenue and revenue trend (growing / flat / declining)
2. Gross profit margin
3. Net profit margin
4. Fixed cost ratio (fixed costs as % of revenue)
5. Cash conversion cycle — how long does it take from selling to receiving cash?

Present all ratios with plain-English explanations of what each means for the business.`,
        expectedOutput: 'Calculated financial ratios with plain-English explanations of what each means for your business.',
        tips: 'Upload a bank statement CSV, QuickBooks export, or a simple spreadsheet with Date, Description, and Amount columns. Claude handles the rest.',
      },
      {
        id: 'fin-analysis-1-s2',
        stepNumber: 2,
        title: 'Get your financial health diagnosis',
        instruction: 'Ask Claude to benchmark your numbers and give you a frank assessment of where your business stands financially.',
        tools: ['Claude'],
        promptTemplate: `Based on the financial data and ratios above, please give me a frank financial health diagnosis:

1. **Overall financial health score:** Rate my business out of 10 across these dimensions:
   - Profitability (am I making enough margin?)
   - Cash flow (can I pay my bills reliably?)
   - Revenue stability (is income predictable?)
   - Cost efficiency (am I spending wisely?)

2. **The #1 financial strength** of my business right now

3. **The #1 financial risk** I should address in the next 90 days

4. **Red flags** — are there any numbers that would concern a banker or investor? What are they and why?

5. **How do my margins compare** to typical benchmarks for a [Business Type] business?

Be direct and honest — I need accurate feedback, not reassurance.`,
        expectedOutput: 'A financial health scorecard with strengths, risks, red flags, and benchmark comparisons.',
        tips: 'The benchmark comparison is eye-opening. A 10% net margin in retail is excellent; in consulting it\'s low. Industry context changes how you should interpret your own numbers.',
      },
      {
        id: 'fin-analysis-1-s3',
        stepNumber: 3,
        title: 'Build your financial improvement plan',
        instruction: 'Get a specific, prioritised action plan to improve your weakest financial metrics in the next 90 days.',
        tools: ['Claude'],
        promptTemplate: `Based on the financial diagnosis above, please create a 90-day financial improvement plan.

Focus on the 3 most impactful areas to improve. For each area:

1. **The metric to improve** (e.g. net margin, cash flow timing, cost ratio)
2. **Current state vs target** (e.g. "Net margin is 8% — target 15% by end of 90 days")
3. **3 specific actions** to get there (with a first step I can take this week)
4. **How to measure progress** — one number I check monthly

Also answer:
- If I could only do ONE thing to improve my financial health in the next 30 days, what would it be and why?
- Are there any costs I should consider cutting based on the data I shared?
- Is there any revenue I might be leaving on the table?`,
        expectedOutput: 'A 90-day financial improvement plan with specific actions and monthly progress metrics.',
        tips: 'The "one thing" question forces prioritisation. Financial improvement tries to do too many things at once and ends up doing none of them. Pick the single highest-leverage action and do it well for 30 days.',
      },
    ],
    relatedPlaybooks: [
      { id: 'smb-bd-1', title: 'Profit Margin Analyzer', slug: 'profit-margin-analyzer-most-profitable-work' },
      { id: 'biz-loan-1', title: 'Business Loan Application Prep Kit', slug: 'business-loan-application-prep-kit' },
    ],
  },

  // ── Business Loan ────────────────────────────────────────────────────────────

  {
    id: 'biz-loan-1',
    title: 'Business Loan Application Prep Kit',
    slug: 'business-loan-application-prep-kit',
    category: 'Finance',
    subtitle: 'Prepare everything a lender needs to say yes — your business narrative, financial summary, and a lender comparison — all in one session.',
    difficulty: 'Intermediate',
    timeToComplete: 35,
    timeSaved: 420,
    isPro: false,
    isNew: true,
    expectedOutcome: 'A loan-ready business narrative, a clean financial summary document, a list of the best-fit lenders for your profile, and a checklist of documents to gather.',
    tools: ['Claude'],
    rating: 4.7,
    completionCount: 540,
    beforeYouStart: [
      'Know how much you want to borrow and exactly what you will use it for.',
      'Have your last 6–12 months of revenue figures available.',
      'Know whether your business is registered and how long it has been operating.',
    ],
    troubleshooting: [
      { problem: 'My financials are not strong enough to qualify', solution: 'Run the Financial Health Check playbook first to improve your numbers before applying. Lenders look at trend — even 3 months of improving margins helps your case.' },
      { problem: 'I don\'t know which type of loan to apply for', solution: 'Step 3 of this playbook will help you identify the right product. If unsure, tell Claude your situation and it will explain the options available for your business profile.' },
    ],
    steps: [
      {
        id: 'biz-loan-1-s1',
        stepNumber: 1,
        title: 'Write your business loan narrative',
        instruction: 'Every lender wants to understand your business and why you need the loan. Claude will help you write a compelling, credible narrative that answers their key questions before they ask.',
        tools: ['Claude'],
        promptTemplate: `Help me write a compelling business loan narrative. Here is my information:

**Business name:** [name]
**What the business does:** [2-3 sentences]
**Years in operation:** [e.g. 2 years]
**Legal structure:** [e.g. sole proprietor / LLC / limited company]
**Number of employees:** [e.g. 5 full-time, 3 part-time]
**Monthly revenue (average last 6 months):** [amount]
**Loan amount requested:** [amount]
**Exact purpose of the loan:** [Be specific — e.g. "Purchase a second delivery van to fulfil a new contract with XYZ company" or "Fund 3 months of inventory ahead of the holiday season"]
**How the loan will directly generate revenue:** [e.g. "The new van will allow us to take on 8 more deliveries per day, generating an estimated additional ₦400k/month in revenue"]
**How I plan to repay it:** [e.g. "Monthly revenue comfortably covers repayments — our current net profit is X, and the loan repayment would be Y"]

Write a 3-paragraph loan narrative that:
1. Introduces the business and establishes credibility
2. Explains the specific use of funds and the business opportunity
3. Demonstrates repayment ability and future outlook

Write in a professional but confident tone.`,
        expectedOutput: 'A 3-paragraph loan narrative ready to include in any application.',
        tips: 'The most common mistake in loan applications is being vague about the use of funds. "Working capital" is not a use of funds. "Purchase 500 units of product X at ₦2,000 each to fulfil a confirmed order from client Y" is. Lenders fund plans, not intentions.',
      },
      {
        id: 'biz-loan-1-s2',
        stepNumber: 2,
        title: 'Prepare your financial summary',
        instruction: 'Build a clean, lender-ready financial summary from your numbers — including a simple 12-month cash flow projection.',
        tools: ['Claude'],
        promptTemplate: `Based on the loan narrative above, help me prepare a financial summary document for lenders.

Here are my financial details:

**Last 12 months revenue (monthly):**
[Paste or type each month: e.g. Jan: X, Feb: X, Mar: X...]

**Monthly operating costs (fixed):**
[List: staff, rent, utilities, subscriptions, etc.]

**Monthly variable costs:**
[List: materials, commissions, delivery, etc.]

**Current outstanding debt/loans:** [amount or "none"]
**Current bank balance:** [approximate]
**Outstanding receivables (money owed to you):** [approximate]

Please create:
1. A clean financial summary table (revenue, costs, gross profit, net profit for each of last 6 months)
2. Key financial ratios a lender will look at: debt-to-income ratio, profit margin, revenue growth rate
3. A simple 12-month cash flow projection assuming the loan is approved (show monthly inflow, outflow, and net cash including loan repayment)
4. A "Loan Impact" section: how the loan changes my financial position and when I break even on the investment`,
        expectedOutput: 'A financial summary table, key ratios, 12-month cash flow projection, and loan impact analysis.',
        tips: 'The 12-month projection is where many applicants fall down. Be realistic — lenders have seen thousands of projections and they know when numbers are inflated. A conservative projection you can defend is far more credible than an optimistic one you can\'t.',
      },
      {
        id: 'biz-loan-1-s3',
        stepNumber: 3,
        title: 'Identify the right lenders and gather your documents',
        instruction: 'Match your profile to the right loan products, create a targeted lender list, and get a complete document checklist so nothing delays your application.',
        tools: ['Claude'],
        promptTemplate: `Based on my business profile and loan request above, help me identify the best funding options.

**My profile summary:**
- Business age: [X years]
- Monthly revenue: [amount]
- Loan amount: [amount]
- Country/location: [e.g. Nigeria, UK, Ghana, USA]
- Credit history: [good / fair / limited / unknown]
- Collateral available: [yes — describe / no]
- Registered business: [yes / no]

Please provide:
1. **Best-fit loan types** for my profile (e.g. SME bank loan, microfinance, invoice financing, government-backed loan, revenue-based financing) — explain why each does or doesn't fit
2. **3 specific lenders or programs** in my country/region to apply to first, with notes on their typical requirements
3. **A complete document checklist** — every document I will likely need for a standard SME loan application
4. **Red flags to fix before applying** — based on my profile, what might cause a rejection and what can I do about it now?
5. **One thing I can do this week** to move my application forward`,
        expectedOutput: 'A lender shortlist, document checklist, red flags to address, and a next-step action.',
        tips: 'Apply to 2–3 lenders simultaneously, not sequentially. Each application takes weeks to process. Spreading applications doesn\'t hurt your chances — it multiplies them. If one declines, you still have others in progress.',
      },
    ],
    relatedPlaybooks: [
      { id: 'fin-analysis-1', title: 'Business Financial Health Check', slug: 'business-financial-health-check' },
      { id: 'smb-bd-4', title: 'Business Health Score & 90-Day Action Plan', slug: 'business-health-score-90-day-action-plan' },
    ],
  },

  // ── Weekly CEO Briefing ──────────────────────────────────────────────────
  {
    id: 'smb-bk-5',
    slug: 'weekly-ceo-briefing',
    title: 'Weekly CEO Briefing',
    subtitle: 'Every Monday your agent pulls your business metrics, scores your health, and drops a 1-page CEO brief — wins, risks, one key decision, and a team message — in your inbox before 7am.',
    category: 'Finance',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 120,
    completionCount: 0,
    rating: 4.9,
    isPro: true,
    isNew: true,
    tools: ['Claude', 'Google Sheets', 'ChatGPT'],
    beforeYouStart: [
      'A Google Sheet with your key business metrics — revenue, expenses, headcount, pipeline, NPS, or whatever you track weekly. Even a simple 5-column sheet works.',
      'The sheet must be publicly accessible ("Anyone with the link can view") so the agent can pull live data.',
      'Decide on your 3–5 most important KPIs before your first run — the brief will score and comment on whatever columns you provide.',
    ],
    expectedOutcome: 'A concise 1-page CEO brief emailed every Monday morning covering: a business health score with rationale, top 3 wins, top 2 risks, one key decision you should make, and a draft team message ready to send as-is.',
    agentAutomation: {
      description: 'Every Monday at 7 AM, the agent fetches your live metrics sheet, computes a business health score, and emails you a structured 1-page CEO brief — ready before your first meeting of the week.',
      trigger: 'Every Monday at 7 AM.',
      actions: [
        'Fetch the latest rows from your Google Sheets business metrics tracker',
        'Score business health across revenue, growth, margin, cash, and risk dimensions',
        'Write a 1-page CEO brief: health score, wins, risks, one key decision, team message',
        'Email the formatted brief with an infographic dashboard to your inbox',
      ],
      setupSteps: [
        {
          title: 'Prepare Your Metrics Sheet',
          description: 'Create a Google Sheet with one row per week. Recommended columns: Week Ending Date, Revenue, Expenses, Net Profit, Open Pipeline Value, Deals Closed, New Customers, Churn, Team Headcount, Cash Balance. The agent adapts to whatever columns you include — no fixed schema required.',
        },
        {
          title: 'Make the Sheet Publicly Readable',
          description: "In Google Sheets, click Share > Change to 'Anyone with the link' > set to Viewer. Copy the URL and paste it into the Business Metrics Sheet variable in the Prompt Variables panel.",
        },
        {
          title: 'Set Your Business Context',
          description: "Fill in the Business Name & Type variable (e.g. 'Acme Logistics — freight forwarding, 12 staff, Nigeria'). This helps the agent benchmark scores correctly and write a team message in the right voice.",
        },
        {
          title: 'Schedule the Agent',
          description: 'Click the Autopilot button, choose Weekly (Mondays), set the time to 07:00. Deploy. Your first brief arrives next Monday morning.',
        },
      ],
      tools: ['Google Sheets', 'Claude', 'ChatGPT', 'Gmail'],
    },
    troubleshooting: [
      {
        problem: 'The health score penalises normal seasonal dips',
        solution: 'Add a Context Notes column to your sheet with a short annotation for unusual weeks (e.g. "Ramadan slowdown"). The agent reads these and adjusts its interpretation.',
      },
      {
        problem: 'The team message sounds too generic',
        solution: 'Add a row to your sheet called Tone Example and paste a real internal message you have sent before. The agent will mirror your voice.',
      },
      {
        problem: 'The agent pulls stale data',
        solution: 'Make sure you update your sheet before Monday 7 AM. Set a Sunday evening reminder.',
      },
    ],
    steps: [
      {
        id: 'smb-bk-5-s1',
        stepNumber: 1,
        title: 'Load and Validate Your Metrics',
        instruction: 'Paste your business metrics or connect your Google Sheet. The agent confirms the data structure and flags missing columns before scoring.',
        promptTemplate: `I am preparing a weekly CEO briefing for [Business Name & Type].

Here is my business metrics data for the current week:
[Business Metrics Sheet]

Today's date: [TODAY'S DATE]

First, confirm:
1. What columns you have received and what time period the data covers
2. Any columns that are missing that would affect the health score
3. Whether the most recent row appears to be this week's data

Then proceed to Step 2 only after confirming the data is valid.`,
        expectedOutput: 'A data receipt confirming columns detected, date range, row count, and any gaps flagged before the analysis runs.',
        tips: 'If you only have 1–2 weeks of data, the agent will note it cannot compute trends yet but will still produce the brief from available data.',
        tools: ['Claude', 'ChatGPT'],
      },
      {
        id: 'smb-bk-5-s2',
        stepNumber: 2,
        title: 'Score Business Health',
        instruction: 'The agent scores your business across five dimensions and produces an overall health grade. Every other section flows from this score.',
        promptTemplate: `Using the metrics data provided, score [Business Name & Type] on these 5 dimensions. Score each 1–10 with one sentence of reasoning.

SCORING DIMENSIONS:
1. Revenue Momentum — growing, flat, or declining week-over-week vs 4-week average?
2. Profitability — making or losing money this week? Is margin improving or compressing?
3. Pipeline Health — how full is the pipeline relative to typical close rates?
4. Cash Position — based on balance and burn, how many weeks of runway?
5. Operational Risk — any signs of churn, team issues, concentration risk, or missed targets?

FORMAT as a table:
| Dimension | Score | One-Line Rationale |
|---|---|---|

OVERALL HEALTH GRADE: A / B / C / D / F
SCORE RATIONALE: 2 sentences — what is driving the grade and what would move it up one letter.`,
        expectedOutput: 'A 5-row scoring table with an overall grade and 2-sentence rationale in plain business language.',
        tips: 'A C is not bad — it means the business is operating but has clear improvement levers. Share the rationale with your leadership team.',
        tools: ['Claude', 'ChatGPT'],
      },
      {
        id: 'smb-bk-5-s3',
        stepNumber: 3,
        title: 'Write the 1-Page CEO Brief',
        instruction: 'The final deliverable. Scannable, specific, and actionable — readable in under 2 minutes.',
        promptTemplate: `Write a 1-page CEO brief for [Business Name & Type] — week of [TODAY'S DATE].

Use this exact structure:

## BUSINESS HEALTH: [Grade] — [Score rationale in one sentence]

## TOP 3 WINS THIS WEEK
- Win 1: specific, quantified if possible
- Win 2: specific
- Win 3: specific

## TOP 2 RISKS TO WATCH
- Risk 1: name the risk, one data point, what to watch
- Risk 2: name the risk, one data point, watch signal

## ONE KEY DECISION THIS WEEK
State the decision clearly. Include: what you are deciding, the two main options, what the data suggests, and a recommended action.

## TEAM MESSAGE (ready to send)
Write a short internal message (3–5 sentences) the CEO can send to the team this Monday. Reference 1 specific win and 1 priority for the week. Conversational and energising — not corporate-speak.

---
CRITICAL: Every bullet must reference a specific number from the data. No generic observations. Do NOT repeat the KPI table — the infographic dashboard handles that.`,
        expectedOutput: 'A complete 1-page CEO brief with all five sections fully written — ready to forward to your leadership team or board.',
        tips: 'Copy the Team Message section directly into WhatsApp, Slack, or email as your Monday kick-off. The brief typically takes under 90 seconds to read.',
        tools: ['Claude', 'ChatGPT'],
      },
    ],
    relatedPlaybooks: [
      { id: 'smb-bk-2', title: 'Monthly Financial Snapshot & P&L Analyzer', slug: 'monthly-financial-snapshot-pl-analyzer' },
      { id: 'smb-bd-4', title: 'Business Health Score & 90-Day Action Plan', slug: 'business-health-score-90-day-action-plan' },
      { id: 'smb-bk-6', title: 'Sales Pipeline Health', slug: 'sales-pipeline-health' },
    ],
  },

  // ── Sales Pipeline Health ────────────────────────────────────────────────
  {
    id: 'smb-bk-6',
    slug: 'sales-pipeline-health',
    title: 'Sales Pipeline Health',
    subtitle: 'Every Friday the agent audits your deals, flags stalled opportunities (14+ days no contact), calculates weighted pipeline value by stage, and drafts personalised follow-up messages — ready before the weekend.',
    category: 'Finance',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 90,
    completionCount: 0,
    rating: 4.8,
    isPro: true,
    isNew: true,
    tools: ['Claude', 'Google Sheets', 'ChatGPT'],
    beforeYouStart: [
      'A Google Sheet with your current deals. Required columns: Company, Stage, Value, Last Contact Date, Expected Close Date. Optional: Owner, Next Step, Notes.',
      'The sheet must be shared publicly ("Anyone with the link can view") so the agent pulls fresh data each Friday.',
      'Make sure Last Contact Date is filled for every deal — this is the primary stall-detection signal.',
    ],
    expectedOutcome: 'A weekly pipeline health report emailed every Friday with: total pipeline value by stage, a stalled deals list, win probability assessment, and ready-to-send follow-up drafts for every deal over 14 days without contact.',
    agentAutomation: {
      description: 'Every Friday at 5 PM, the agent reads your live pipeline sheet, flags stalled deals, calculates weighted pipeline value, and emails you a health report with personalised follow-up drafts for every deal over 14 days without contact.',
      trigger: 'Every Friday at 5 PM.',
      actions: [
        'Fetch current pipeline rows from your Google Sheets deal tracker',
        'Flag all deals where Last Contact Date is 14+ days ago',
        'Calculate total pipeline value and weighted value by stage',
        'Assess each stalled deal and draft a personalised follow-up email',
        'Email the pipeline health report with infographic dashboard',
      ],
      setupSteps: [
        {
          title: 'Set Up Your Deal Tracker Sheet',
          description: 'Create a Google Sheet with these columns: Company | Stage (e.g. Prospect, Qualified, Proposal Sent, Negotiation, Closed Won) | Value | Last Contact Date | Expected Close Date. One row per deal.',
        },
        {
          title: 'Share and Connect the Sheet',
          description: "Share as 'Anyone with the link — Viewer'. Copy the URL and paste it into the Sales Pipeline Sheet variable in the Prompt Variables panel.",
        },
        {
          title: 'Define Your Stage Weights',
          description: "Fill in the Stage Win Probabilities variable — e.g. 'Prospect 10%, Qualified 25%, Proposal Sent 40%, Negotiation 70%'. If unsure, leave blank and the agent uses industry-standard defaults.",
        },
        {
          title: 'Schedule for Friday Afternoons',
          description: 'Click Autopilot, select Weekly, set time to 17:00. The report lands before end-of-business Friday — you triage Friday, act Monday morning.',
        },
      ],
      tools: ['Google Sheets', 'Claude', 'ChatGPT', 'Gmail'],
    },
    troubleshooting: [
      {
        problem: 'The agent flags deals I deliberately parked until next quarter',
        solution: 'Add a Status column. For parked deals write "PARKED — Q3" in the Notes column. The agent skips deals explicitly marked as parked.',
      },
      {
        problem: 'Follow-up drafts sound too generic',
        solution: 'Add a Last Discussion Summary column with 1–2 sentences about the last conversation. The agent writes context-specific follow-ups instead of generic check-ins.',
      },
      {
        problem: 'Pipeline value does not match my CRM',
        solution: 'Make sure Value cells are numbers only — no currency symbols or commas. If your CRM shows different numbers, your sheet may have outdated deal values.',
      },
    ],
    steps: [
      {
        id: 'smb-bk-6-s1',
        stepNumber: 1,
        title: 'Load Pipeline and Flag Stalled Deals',
        instruction: 'The agent reads your pipeline sheet, calculates days since last contact for every deal, and flags anything 14+ days without contact as stalled.',
        promptTemplate: `I need a pipeline health audit for my sales team.

Today's date: [TODAY'S DATE]
Stage win probabilities: [Stage Win Probabilities — e.g. "Prospect 10%, Qualified 25%, Proposal Sent 40%, Negotiation 70%"]

Here is my current pipeline data:
[Sales Pipeline Sheet]

Step 1 — Compute days since last contact for EVERY deal.
Step 2 — Flag as STALLED any deal where days since last contact >= 14.
Step 3 — Produce this table:

| Company | Stage | Value | Days Since Contact | Status |
|---|---|---|---|---|

Step 4 — Summary:
- Total active deals: X
- Stalled deals (14+ days): X
- Total pipeline value: X
- Weighted pipeline value: X
- Value at risk in stalled deals: X`,
        expectedOutput: 'A full pipeline table with days-since-contact and stall flags, plus a 5-line summary showing total and weighted pipeline value with dollar amount at risk in stalled deals.',
        tips: 'Sort your sheet by Expected Close Date before connecting it — the agent will prioritise near-term deals in its follow-up drafts.',
        tools: ['Claude', 'ChatGPT'],
      },
      {
        id: 'smb-bk-6-s2',
        stepNumber: 2,
        title: 'Assess Pipeline Quality and Shape',
        instruction: 'A healthy pipeline is balanced — not all deals bunched in early stages with nothing near close. This step assesses shape, velocity, and concentration risk.',
        promptTemplate: `Using the pipeline data already loaded, assess pipeline quality:

STAGE DISTRIBUTION:
- Count and total value of deals at each stage
- Flag if more than 60% of value is concentrated in one stage
- Flag if there are zero deals in Negotiation or Proposal Sent

VELOCITY ANALYSIS:
- Which deals have been in the same stage for more than 30 days?
- Which deals have an Expected Close Date already past today?

CONCENTRATION RISK:
- Is any single deal worth more than 40% of total pipeline value? Name it.
- Is any single company appearing in more than 2 deals?

Use ## headings for each section. One action recommendation per finding.`,
        expectedOutput: 'A pipeline quality report with stage distribution, velocity flags, and concentration risks — each with a one-line action recommendation.',
        tips: 'The concentration risk check is often the most valuable output. A pipeline where one deal is 60% of the value is not a pipeline — it is a single bet.',
        tools: ['Claude', 'ChatGPT'],
      },
      {
        id: 'smb-bk-6-s3',
        stepNumber: 3,
        title: 'Draft Follow-Up Emails for Stalled Deals',
        instruction: 'For every stalled deal, the agent writes a personalised follow-up calibrated to the deal stage and days without contact. Ready to send.',
        promptTemplate: `Write personalised follow-up emails for every STALLED deal from Step 1.

For each deal, write a separate email:
- Subject line that references the company name and specific context — not "Checking in"
- Opening that naturally acknowledges the gap since last contact
- Body: 2–3 sentences calibrated by stage:
  - Prospect/Qualified: Re-open the conversation, reference a relevant trigger
  - Proposal Sent: Confirm receipt, offer to answer questions or adjust
  - Negotiation: Acknowledge the silence, give a soft deadline, offer a clarification
- One specific call-to-action: a question, meeting request, or decision deadline
- Under 80 words total per email

Header format: ## [Company Name] — [Stage] — [X days stalled]`,
        expectedOutput: 'One ready-to-send follow-up email per stalled deal, each under 80 words, with a specific subject line and hard call-to-action.',
        tips: 'Send these on Monday morning, not Friday. Emails sent Friday afternoon have the lowest open rates of the week.',
        tools: ['Claude', 'ChatGPT'],
      },
    ],
    relatedPlaybooks: [
      { id: 'smb-bk-7', title: 'Accounts Receivable Aging', slug: 'accounts-receivable-aging' },
      { id: 'smb-bk-5', title: 'Weekly CEO Briefing', slug: 'weekly-ceo-briefing' },
      { id: 'smb-bk-3', title: 'Invoice & Cash Flow Guardian', slug: 'invoice-cash-flow-guardian' },
    ],
  },

  // ── Accounts Receivable Aging ────────────────────────────────────────────
  {
    id: 'smb-bk-7',
    slug: 'accounts-receivable-aging',
    title: 'Accounts Receivable Aging',
    subtitle: 'Twice a week the agent reads your invoice sheet, buckets outstanding balances by aging, calculates your Days Sales Outstanding, and drafts escalating chase emails — so nothing slips past due unnoticed.',
    category: 'Finance',
    difficulty: 'Intermediate',
    timeToComplete: 20,
    timeSaved: 150,
    completionCount: 0,
    rating: 4.9,
    isPro: true,
    isNew: true,
    tools: ['Claude', 'Google Sheets', 'ChatGPT'],
    beforeYouStart: [
      'A Google Sheet with your invoices. Required columns: Client, Invoice Number, Amount, Invoice Date, Due Date, Paid? (Yes/No or leave blank for unpaid).',
      'The sheet must be shared publicly ("Anyone with the link can view").',
      'Mark invoices as paid by entering "Yes" or the payment date — the agent skips paid invoices automatically.',
      'Keep the sheet updated within 24 hours of receiving payment.',
    ],
    expectedOutcome: 'A twice-weekly AR aging report showing: total outstanding by aging bucket (Current, 1–30, 31–60, 61–90, 90+ days), your DSO figure vs target, a priority chase list, and ready-to-send escalating email drafts for every overdue client.',
    agentAutomation: {
      description: 'Every Monday and Thursday morning, the agent fetches your live invoice sheet, computes aging buckets and DSO, and emails you a prioritised AR report with personalised chase emails for every overdue invoice.',
      trigger: 'Every Monday and Thursday at 8 AM.',
      actions: [
        'Fetch all open (unpaid) invoices from your Google Sheets invoice tracker',
        'Compute days overdue for each invoice based on today\'s date',
        'Bucket outstanding balances: Current, 1–30, 31–60, 61–90, 90+ days',
        'Calculate Days Sales Outstanding (DSO) and compare to target',
        'Draft escalating chase emails calibrated to overdue severity',
        'Email the AR aging report with infographic dashboard',
      ],
      setupSteps: [
        {
          title: 'Create Your Invoice Tracker Sheet',
          description: 'Set up a Google Sheet with these columns: Client | Invoice Number | Amount | Invoice Date | Due Date | Paid? (leave blank for unpaid, enter Yes or the payment date when paid). One row per invoice. Keep all invoices — paid and unpaid — in the sheet so DSO is calculated correctly.',
        },
        {
          title: 'Share and Connect',
          description: "Share as 'Anyone with the link — Viewer'. Paste the URL into the Invoices Sheet variable in the Prompt Variables panel. The agent automatically filters to unpaid invoices for the aging analysis.",
        },
        {
          title: 'Set Your Payment Terms',
          description: "Fill in Standard Payment Terms — e.g. 'Net 30' or 'Net 14 for new clients, Net 45 for enterprise'. If you have mixed terms, add a Terms column to your sheet and the agent will respect per-client terms.",
        },
        {
          title: 'Schedule Twice Weekly',
          description: 'Create two separate scheduled agents for this playbook — one Weekly (Monday) and one Weekly (Thursday). Both pull from the same sheet. The Monday run catches weekend payments; Thursday catches mid-week.',
        },
      ],
      tools: ['Google Sheets', 'Claude', 'ChatGPT', 'Gmail'],
    },
    troubleshooting: [
      {
        problem: 'DSO seems unusually high',
        solution: "Check that Invoice Date is the issue date not the delivery date. Also confirm all recently paid invoices are marked Yes in the Paid column — unpaid rows from completed jobs skew DSO up.",
      },
      {
        problem: 'Chase emails are generated for clients on a payment plan',
        solution: 'Add a Notes column. For clients on a plan write "Payment plan agreed — $X on [Date]". The agent acknowledges the plan in the email instead of treating it as standard overdue.',
      },
      {
        problem: 'A 90+ day client is in a dispute — a chase email would make things worse',
        solution: 'Add "DISPUTE" to the Notes column for that invoice row. The agent skips chase drafts for disputed invoices and flags them separately for manual handling.',
      },
    ],
    steps: [
      {
        id: 'smb-bk-7-s1',
        stepNumber: 1,
        title: 'Build the AR Aging Buckets',
        instruction: 'The agent loads your invoice sheet, filters to unpaid invoices only, computes days overdue, and groups amounts into the 5 standard aging buckets.',
        promptTemplate: `I need an accounts receivable aging report for [Business Name & Type].

Standard payment terms: [Standard Payment Terms — e.g. "Net 30"]
Today's date: [TODAY'S DATE]

Invoice data:
[Invoices Sheet]

Instructions:
1. Filter to UNPAID invoices only (Paid column is blank or "No")
2. For each unpaid invoice: Days Overdue = Today minus Due Date (negative = not yet due = Current)
3. Bucket each invoice:
   - Current: not yet due
   - 1–30 days overdue
   - 31–60 days overdue
   - 61–90 days overdue
   - 90+ days overdue (CRITICAL)
4. Aging table sorted by days overdue descending:

| Client | Invoice # | Amount | Due Date | Days Overdue | Bucket |
|---|---|---|---|---|---|

5. Summary:
| Bucket | Count | Total Amount | % of AR |
|---|---|---|---|
[5 bucket rows + Totals row]`,
        expectedOutput: 'A complete AR aging table sorted by urgency, plus a 5-bucket summary showing dollar amounts and percentage of total AR in each bucket.',
        tips: 'If the 90+ days bucket exceeds 15% of total AR, you have a collection problem that needs immediate escalation — not just emails.',
        tools: ['Claude', 'ChatGPT'],
      },
      {
        id: 'smb-bk-7-s2',
        stepNumber: 2,
        title: 'Calculate Days Sales Outstanding (DSO)',
        instruction: 'DSO tells you how many days on average it takes to collect payment. A rising DSO is an early warning sign of cash flow problems. Target DSO should be no more than 1.5x your payment terms.',
        promptTemplate: `Using the invoice data already loaded, calculate Days Sales Outstanding (DSO).

Formula: DSO = (Total AR Outstanding / Total Credit Sales in last 90 days) x 90

Show:
1. DSO: X days
2. Target DSO for [Standard Payment Terms]: X days (1.5x the terms)
3. DSO Status: On Track / Warning / Critical
4. Which clients consistently appear in the 31+ day buckets? Name them.
5. One DSO improvement action: the single highest-impact change to bring DSO down.`,
        expectedOutput: 'A DSO calculation with target comparison, status flag, names of chronically slow-paying clients, and one specific improvement recommendation.',
        tips: 'If your DSO is higher than 1.5x your terms, the problem is usually invoicing timing — invoices issued more than 3 days after delivery are significantly more likely to pay late.',
        tools: ['Claude', 'ChatGPT'],
      },
      {
        id: 'smb-bk-7-s3',
        stepNumber: 3,
        title: 'Draft Escalating Chase Emails',
        instruction: 'For every overdue invoice, the agent drafts a chase email calibrated to the aging bucket. Tone escalates from friendly (1–30 days) to firm (31–60) to urgent (61–90) to formal final notice (90+).',
        promptTemplate: `Write chase emails for every overdue invoice from Step 1.

Calibrate tone by bucket:

1–30 DAYS — Friendly reminder:
- Assume oversight, not avoidance
- Reference invoice number and amount in subject
- Offer payment details, ask if anything is blocking payment
- Under 60 words

31–60 DAYS — Firm follow-up:
- Acknowledge prior contact
- State the specific overdue amount and days past due
- Give a payment deadline 7 days from today
- Under 80 words

61–90 DAYS — Urgent notice:
- State clearly this requires immediate attention
- Offer a payment plan as alternative to full payment
- State next step if no response
- Under 100 words

90+ DAYS — Final notice:
- Formal language, no pleasantries
- Final deadline: 5 business days
- Reference next step: collections or legal action
- Under 80 words

Header format: ## [Client Name] — Invoice [#] — [Amount] — [X days overdue]`,
        expectedOutput: 'One escalating chase email per overdue invoice, correctly toned by aging bucket, with a specific subject line and hard call-to-action.',
        tips: 'The 90+ emails should always be reviewed before sending — they imply legal action. Make sure you are prepared to follow through before hitting send.',
        tools: ['Claude', 'ChatGPT'],
      },
    ],
    relatedPlaybooks: [
      { id: 'smb-bk-3', title: 'Invoice & Cash Flow Guardian', slug: 'invoice-cash-flow-guardian' },
      { id: 'smb-bk-6', title: 'Sales Pipeline Health', slug: 'sales-pipeline-health' },
      { id: 'smb-bk-2', title: 'Monthly Financial Snapshot & P&L Analyzer', slug: 'monthly-financial-snapshot-pl-analyzer' },
    ],
  },
  {
    id: 'smb-excel-1',
    slug: 'claude-in-excel-master-class',
    title: 'Claude in Excel Master Class',
    subtitle: 'Most of what takes you two hours in Excel should take twenty minutes. This playbook closes that gap using the official Claude for Excel add-in.',
    category: 'Operations',
    difficulty: 'Beginner',
    timeToComplete: 25,
    timeSaved: 180,
    completionCount: 412,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Microsoft Excel'],
    beforeYouStart: [
      'Microsoft Excel desktop version (Windows or Mac) — the web version does not support add-ins.',
      'A Claude Pro, Max, Team, or Enterprise plan ($20/month and above). Free plan users do not have access to the Excel add-in.',
      'Install the add-in: Home > Add-ins > search "Claude by Anthropic for Excel" > Install > Sign in. Shortcut: Ctrl+Alt+C (Windows) or Ctrl+Option+C (Mac).',
      'An existing spreadsheet you want to work with — your own messy data, someone else\'s workbook, or a monthly report you dread updating.'
    ],
    expectedOutcome: 'You will be able to instantly understand any formula, clean messy data in seconds, build charts from plain English, generate executive summaries from raw numbers, and automate the repetitive Excel tasks that eat your week.',
    agentAutomation: {
      description: 'Deploy a weekly agent that opens your recurring report template, refreshes all summary figures with the latest data tab, checks for formula errors, and emails you the updated executive summary every Monday morning.',
      trigger: 'Every Monday at 7 AM.',
      actions: [
        'Open the recurring Excel report template from Google Drive or SharePoint.',
        'Detect the newest data tab and map it to the summary formulas.',
        'Run a full error check across the workbook for #REF, #VALUE, and circular references.',
        'Regenerate the executive summary section at the top of the Summary tab.',
        'Export the updated workbook as a PDF and email it to the stakeholder list.'
      ],
      setupSteps: [
        { title: 'Upload your template', description: 'Store your recurring report template in Google Drive or SharePoint. In Make.com, add a "Watch Files" trigger for that folder.' },
        { title: 'Add fresh data', description: 'Create a scenario step that downloads the latest data export (from your CRM, accounting tool, or a shared CSV) and inserts it as a new tab in the template.' },
        { title: 'Process with Claude', description: 'Use the Claude API module to send the workbook context. Prompt: "The newest data tab has been added. Update all summary formulas in the Summary tab. Check for errors. Regenerate the executive summary paragraph."' },
        { title: 'Export and deliver', description: 'Add an "Export to PDF" step and a "Gmail — Send Email" step to deliver the updated report to your team automatically.' }
      ],
      tools: ['Make.com', 'Claude', 'Google Drive', 'Gmail']
    },
    troubleshooting: [
      {
        problem: 'Claude gives generic advice instead of reading my actual sheet',
        solution: 'Make sure you are using the official Claude for Excel add-in sidebar, not a browser tab. The add-in reads your live workbook. If you are pasting data into claude.ai, it cannot see your formulas or cell references.'
      },
      {
        problem: 'Claude suggests a formula but it breaks my other cells',
        solution: 'Before accepting any change, review the highlighted cells. Claude highlights every cell it touches. If a formula feeds into other calculations, ask Claude: "Will changing this formula break any dependent cells? Show me the dependency chain first."'
      },
      {
        problem: 'My workbook is very large and Claude is slow or times out',
        solution: 'For workbooks with thousands of rows across many tabs, narrow the scope. Instead of "Summarise this workbook," say "Summarise only the data in tab Sales_Q4, columns A through G, rows 1 to 500." Smaller context = faster, more accurate results.'
      },
      {
        problem: 'I opened a spreadsheet from the internet and Claude is behaving strangely',
        solution: 'This could be a prompt injection attack. Hidden instructions can be embedded in cells or named ranges that manipulate Claude. Only use the add-in with files you trust. If in doubt, copy just the data (Paste Values) into a new blank workbook first.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-bk-2', title: 'Monthly Financial Snapshot & P&L Analyzer', slug: 'monthly-financial-snapshot-pl-analyzer' },
      { id: 'smb-bk-3', title: 'Invoice & Cash Flow Guardian', slug: 'invoice-cash-flow-guardian' }
    ],
    steps: [
      {
        id: 'smb-excel-1-s1',
        stepNumber: 1,
        title: 'Formulas & Calculations — Understand, Write, and Scenario-Test',
        instruction: 'This is where Claude saves the most time. Whether you inherited a workbook full of mystery formulas, need to write a new calculation, or want to run "what if" scenarios — Claude handles all three from the sidebar.',
        promptTemplate: 'I have an Excel workbook open. Help me with the following:\\n\\n**Task (choose one):**\\n\\n1. UNDERSTAND A FORMULA:\\n   "Explain what the formula in cell [Cell Reference, e.g. C14] does in plain English. Trace it back to its source inputs and tell me what assumptions it relies on."\\n\\n2. WRITE A NEW FORMULA:\\n   "Write a formula that [describe what you need, e.g. finds the average sales for customers in the East region only]. Place it in [target cell] and explain what it does."\\n\\n3. SCENARIO ANALYSIS:\\n   "What happens to the totals in [column/cell] if I change [input cell, e.g. the growth rate in B2] from [current value] to [new value]? Show me what shifts and why. Keep all formula dependencies intact."',
        expectedOutput: 'A clear plain-English explanation of any formula with cell references, a ready-to-use formula placed in the correct cell, or a fully traced scenario analysis showing exactly what changed and why — with all highlighted cells preserved.',
        tips: 'Always reference specific cells ("cell D8") instead of vague descriptions ("that formula"). Tell Claude what you expect the result to be so it can spot the mismatch. One task at a time gives you more control over the output.'
      },
      {
        id: 'smb-excel-1-s2',
        stepNumber: 2,
        title: 'Data Cleaning & Organising — Fix Messy Exports in Seconds',
        instruction: 'Every messy data export — inconsistent dates, duplicate rows, names split wrong, numbers stored as text — can be cleaned with a single prompt. You can also upload a PDF or CSV directly into the Claude sidebar and pull data into your sheet.',
        promptTemplate: 'I have messy data in this workbook. Please help me clean it up:\\n\\n**Pick the tasks that apply (or ask for all):**\\n\\n1. "Clean up the date column [Column Letter]. There are at least three different formats. Standardise them all to [DD/MM/YYYY or MM/DD/YYYY or YYYY-MM-DD]."\\n\\n2. "Merge the [First Name Column] and [Last Name Column] into one column called Full Name."\\n\\n3. "Find and flag all duplicate entries based on the [Column Name, e.g. Email] column."\\n\\n4. "Standardise the country names in column [Letter] so they are all consistent (e.g. UK, U.K., and United Kingdom should all be United Kingdom)."\\n\\n5. "Remove all blank rows from this sheet."\\n\\n6. "Convert all the figures in column [Letter] from numbers-stored-as-text to actual numbers."\\n\\n**PDF/CSV Import:**\\n"I have uploaded a [PDF/CSV] with our [describe the data, e.g. Q4 sales figures]. Pull the data into column [Letter] starting from row [Number] and match the existing format."',
        expectedOutput: 'A fully cleaned dataset with every changed cell highlighted for your review. Dates standardised, duplicates flagged, blanks removed, and imported data neatly placed in the correct columns.',
        tips: 'Claude highlights every cell it changes, so you always stay in control. For PDF imports, upload the file directly into the chat sidebar using the attachment button — do not paste screenshots.'
      },
      {
        id: 'smb-excel-1-s3',
        stepNumber: 3,
        title: 'Charts & Visualisations — Build from Plain English',
        instruction: 'Skip the manual chart-building workflow entirely. Describe what you want to visualise and Claude creates the chart, selects the right type, and references the correct cells. If you are unsure, ask Claude to recommend the best chart type for your data.',
        promptTemplate: 'Create a chart from the data in this workbook:\\n\\n**Option A — You know what you want:**\\n"Create a [bar chart / line chart / pie chart] showing [what you want to show, e.g. monthly revenue] from [describe the data range or table, e.g. the table in Sheet1 columns A through C]."\\n\\n**Option B — You want a recommendation:**\\n"I have [describe your data briefly, e.g. 12 months of sales data for two teams]. I want to show [trends over time / a comparison / proportions]. What is the best chart type and can you build it for me?"\\n\\n**Option C — Comparative:**\\n"Make a line chart comparing [Metric 1, e.g. 2024 Sales] vs [Metric 2, e.g. 2025 Sales] using columns [B] and [C]. Add clear labels."',
        expectedOutput: 'A properly formatted chart embedded in your workbook with the correct data range, chart type, and labels — ready to copy into a presentation or report.',
        tips: 'Ask Claude to recommend the chart type if you are unsure — it will explain why a bar chart works better than a pie chart for your specific data. You can then adjust colours and styling manually as you normally would.'
      },
      {
        id: 'smb-excel-1-s4',
        stepNumber: 4,
        title: 'Reports & Summaries — From Raw Data to Executive Brief',
        instruction: 'If you produce regular reports from Excel data, this step saves you the most time week-to-week. Claude can summarise an entire workbook, build summary tables from raw data, and update recurring report templates automatically.',
        promptTemplate: 'Help me with reporting from this workbook:\\n\\n**Option A — Summarise:**\\n"Summarise what this workbook is showing me. What are the key numbers I should pay attention to? Reference specific cells."\\n\\n**Option B — Build a report:**\\n"Create a summary table showing [metric, e.g. total sales] by [category, e.g. region] and by [time period, e.g. quarter] using the data in [tab/range]."\\n\\n**Option C — Executive summary:**\\n"I need an executive summary section at the top of this sheet. Pull the key figures from the data below and write 2-3 sentences interpreting the results. Format it cleanly."\\n\\n**Option D — Update a recurring report:**\\n"I have added this month\'s data in the new tab called [Tab Name]. Update all the figures in the Summary tab to reflect the latest numbers. Highlight what changed."',
        expectedOutput: 'A clean, presentation-ready summary table or executive brief with specific cell references, properly formatted numbers, and clear interpretation of the key takeaways.',
        tips: 'For recurring reports, keep a consistent template structure. The more predictable your layout is, the more accurately Claude can update it each period without breaking anything.'
      },
      {
        id: 'smb-excel-1-s5',
        stepNumber: 5,
        title: 'Automate Repetitive Tasks — Error Checking, Formatting, Templates',
        instruction: 'Anything you do the same way every week is worth asking Claude to speed up. This step covers three big time-sinks: hunting for errors, applying consistent formatting, and building reusable templates from scratch.',
        promptTemplate: 'Help me automate repetitive Excel work:\\n\\n**Error Checking:**\\n"Find all #REF, #VALUE, and #NAME errors in this workbook. For each one, tell me what is causing it and suggest the corrected formula."\\n\\n**Formatting:**\\n"Apply consistent formatting to all data tables in this workbook: freeze the top row, bold all headers, add alternating row colours, and right-align all number columns."\\n\\n**Template Building:**\\n"Build me a [type of template, e.g. monthly budget tracker] with the following sections: [e.g. Income, Fixed Costs, Variable Costs, Running Total]. Include formulas that automatically calculate the totals and a summary row at the bottom. Make it ready to use — I want to just start entering numbers."',
        expectedOutput: 'All errors identified with root causes and fixes, consistent professional formatting applied across the workbook, or a fully functional template with working formulas ready for immediate use.',
        tips: 'For error checking, ask Claude to also check for logical errors — not just formula errors. Say: "Are there any formulas that might be returning technically valid but incorrect results? Check the logic." This catches things like a SUM that accidentally includes a header row.'
      },
      {
        id: 'smb-excel-1-s6',
        stepNumber: 6,
        title: 'Prompt Cheat Sheet — Copy, Paste, Use Immediately',
        instruction: 'Keep this step bookmarked. These are battle-tested prompts you can copy and paste directly into the Claude for Excel sidebar the next time you need them. Replace the bracketed text with your own details.',
        promptTemplate: 'Here is your quick-reference prompt library for Claude in Excel. Copy any of these directly into the sidebar:\\n\\n📊 UNDERSTANDING YOUR DATA:\\n"Summarise what this workbook is doing and what the key outputs are."\\n\\n🔢 FORMULAS:\\n"Explain what the formula in [cell] does in plain English."\\n"Write a formula that [describe what you need]."\\n\\n🧹 CLEANING:\\n"Clean up the [column name] column. There are inconsistencies in formatting."\\n"Find and remove all duplicates based on the [column name] column."\\n\\n🐛 ERRORS:\\n"Find all errors in this workbook and explain what is causing them."\\n\\n📈 CHARTS:\\n"Create a [chart type] showing [what you want to show] from this data."\\n\\n📋 REPORTS:\\n"Build a summary table showing [metric] by [category] using this data."\\n\\n🔄 UPDATES:\\n"I have added new data to [tab name]. Update the summary in [tab name] to reflect it."\\n\\n⚠️ IMPORTANT LIMITATIONS TO REMEMBER:\\n- Claude CANNOT write or run VBA macros inside the add-in.\\n- Claude CANNOT interact with Power Query or Power Pivot.\\n- Always verify outputs for financial models or anything going to a client.\\n- Stick to files you trust — hidden prompt injections can exist in downloaded spreadsheets.',
        expectedOutput: 'A permanent reference card of prompts you can return to any time you open Excel and need Claude to help with a specific task.',
        tips: 'The single biggest improvement to your prompts: always reference specific cells, say what you expect the result to be, and mention what is currently going wrong. "Fix my formula" is vague. "The formula in D8 should sum only Confirmed orders but it is including other values too" gives Claude everything it needs.'
      }
    ]
  },
  {
    id: 'smb-gws-1',
    slug: 'google-workspace-cli-agent-setup',
    title: 'Connect Your AI Agent to Google Workspace in 20 Minutes',
    subtitle: 'Install the open-source gws CLI, authenticate once, and give Claude or Codex full read/write access to Gmail, Calendar, Drive, Sheets, Docs, and Slides.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 20,
    timeSaved: 300,
    completionCount: 189,
    rating: 4.8,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Google Workspace', 'Terminal'],
    beforeYouStart: [
      'Node.js installed on your computer (download from nodejs.org if you don\'t have it — takes 3 minutes and gives you npm automatically).',
      'A Google account with access to the Workspace apps you want to connect (Gmail, Calendar, Drive, Sheets, Docs, Slides).',
      'Access to Google Cloud Console (console.cloud.google.com) — it\'s free, you just need to create a project.',
      'An AI agent that supports MCP: Claude Code, Claude Desktop, Codex, or Cursor.'
    ],
    expectedOutcome: 'Your AI agent will have authenticated, read/write access to every Google Workspace app. You\'ll be able to ask it to triage your inbox, prep for meetings, summarise your week, and run multi-step workflows across Gmail, Calendar, Drive, Sheets, Docs, and Slides — all from a single chat interface.',
    agentAutomation: {
      description: 'Once wired in, your agent can run pre-built "skills" like /gws-gmail-triage and /gws-workflow-weekly-digest on a schedule — triaging your inbox every morning and sending you a weekly summary across all Google services.',
      trigger: 'Daily at 8 AM (inbox triage) / Weekly on Friday at 5 PM (weekly digest).',
      actions: [
        'Run /gws-gmail-triage to read unread emails and produce a prioritised summary.',
        'Run /gws-calendar-agenda to pull upcoming events with context from related emails and docs.',
        'Run /gws-workflow-meeting-prep before each meeting to gather agenda, relevant documents, and attendee info.',
        'Run /gws-workflow-weekly-digest every Friday to summarise what happened, what needs attention, and what\'s coming next.',
        'Deliver the output to Slack or email.'
      ],
      setupSteps: [
        { title: 'Complete Steps 1-5 of this playbook', description: 'Install gws, create OAuth credentials, authenticate, smoke test, and wire the MCP server into your agent.' },
        { title: 'Install the 107 pre-built skills (Step 6)', description: 'Run: npx skills add -y -g https://github.com/googleworkspace/cli' },
        { title: 'Schedule with Make.com or cron', description: 'Use a Make.com scenario or a local cron job to trigger your agent to run specific gws skills at set times and deliver the output via email or Slack webhook.' }
      ],
      tools: ['gws CLI', 'Claude', 'Make.com', 'Slack']
    },
    troubleshooting: [
      {
        problem: 'gws authenticates fine but every API call fails silently',
        solution: 'This is the #1 setup mistake. You need to enable each API individually in Google Cloud Console before using it. Go to console.cloud.google.com/apis/library and search for: Gmail API, Google Calendar API, Google Drive API, Google Sheets API, Google Docs API, Google Slides API, Tasks API. Click "Enable" on each one.'
      },
      {
        problem: 'I get an "unverified app" warning when logging in',
        solution: 'This is completely normal for personal OAuth apps. Click "Advanced," then "Go to [your app name] (unsafe)." Your tokens are encrypted at rest with AES-256-GCM and never leave your machine.'
      },
      {
        problem: 'gws is not showing up in Claude Code after I saved the config',
        solution: 'Claude Code, Claude Desktop, and Cowork all require a full restart to pick up new MCP server configs. Save the file, close the app completely, and reopen it. Then run /mcp in the chat to verify. If it\'s still missing, double-check your JSON syntax — a missing comma or bracket is usually the culprit.'
      },
      {
        problem: 'Claude keeps asking me to approve tool access on every message',
        solution: 'The first time your agent uses a gws tool category, Claude Code prompts you for a one-time approval. After approving, it should not ask again for that category. If it keeps asking, check that you\'re using the global config (~/.claude/settings.json) not a project-level one that gets reset.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-excel-1', title: 'Claude in Excel Master Class', slug: 'claude-in-excel-master-class' }
    ],
    steps: [
      {
        id: 'smb-gws-1-s1',
        stepNumber: 1,
        title: 'Install the gws CLI',
        instruction: 'Install the Google Workspace CLI tool on your computer with a single terminal command. This gives you the gws command, which is the bridge between your AI agent and every Google Workspace app.',
        promptTemplate: 'Open your terminal and run:\\n\\nnpm install -g @googleworkspace/cli\\n\\nOnce installed, verify it worked by running:\\n\\ngws --help\\n\\nYou should see a list of available commands covering Gmail, Calendar, Drive, Sheets, Docs, Slides, and Tasks.\\n\\nIf you get a "command not found" error, you need to install Node.js first from nodejs.org. It takes 3 minutes and gives you npm automatically.',
        expectedOutput: 'The gws CLI is installed globally and the gws --help command prints a list of all available services and commands.',
        tips: 'If you already have Node.js but an older version, run "node --version" to check. gws works best with Node 18+.'
      },
      {
        id: 'smb-gws-1-s2',
        stepNumber: 2,
        title: 'Create Your OAuth Credentials in Google Cloud Console',
        instruction: 'This step creates a secure key that lets gws access your Google account with your explicit permission. You will enable the APIs, create an OAuth client, and download the credentials file.',
        promptTemplate: '**Step-by-step:**\\n\\n1. Go to console.cloud.google.com/apis/credentials\\n   - If you have never used Google Cloud Console, click "New Project" and name it anything (e.g. "My AI Agent"). It is free.\\n\\n2. CRITICAL — Enable the APIs FIRST:\\n   Go to console.cloud.google.com/apis/library and search for and enable each of these:\\n   - Gmail API\\n   - Google Calendar API\\n   - Google Drive API\\n   - Google Sheets API\\n   - Google Docs API\\n   - Google Slides API\\n   - Tasks API\\n   ⚠️ Skip this and gws will authenticate fine but every API call will fail silently. This is the #1 setup mistake.\\n\\n3. Create an OAuth 2.0 Client ID:\\n   - Go back to Credentials > Create Credentials > OAuth 2.0 Client ID\\n   - Application type: "Desktop app"\\n   - Download the JSON file it generates\\n\\n4. Move the file to where gws expects it:\\n\\n   Mac:\\n   cp ~/Downloads/client_secret_*.json ~/Library/Application\\\\ Support/gws/client_secret.json\\n\\n   Linux:\\n   cp ~/Downloads/client_secret_*.json ~/.config/gws/client_secret.json\\n\\n   Windows (PowerShell):\\n   Copy-Item ~\\\\Downloads\\\\client_secret_*.json ~\\\\AppData\\\\Roaming\\\\gws\\\\client_secret.json',
        expectedOutput: 'All 7 Google APIs are enabled in your Cloud Console project, and the client_secret.json file is saved in the correct location for your operating system.',
        tips: 'You may need to create the gws directory first if it does not exist. On Mac: mkdir -p ~/Library/Application\\ Support/gws'
      },
      {
        id: 'smb-gws-1-s3',
        stepNumber: 3,
        title: 'Authenticate and Authorize All Services',
        instruction: 'Log in through the browser and grant gws access to all your Google Workspace apps in one go. Your tokens are encrypted at rest with AES-256-GCM and never leave your machine.',
        promptTemplate: 'Run this in your terminal:\\n\\ngws auth login\\n\\nA browser window will open. You will see an "unverified app" warning — this is completely normal for personal OAuth apps.\\n\\n1. Click "Advanced"\\n2. Click "Go to [your app name] (unsafe)"\\n3. CHECK EVERY SCOPE BOX: Drive, Gmail, Calendar, Sheets, Docs, Slides, Tasks — all of them\\n\\n⚠️ If you miss one, you will have to re-authenticate later to add it. Check them all now to save yourself the hassle.',
        expectedOutput: 'The terminal confirms successful authentication. Your encrypted tokens are stored locally and gws now has authorized access to all selected Google Workspace services.',
        tips: 'The "unsafe" warning sounds scary but it is standard for any personal OAuth app that has not been through Google\'s formal verification process. Your credentials never leave your machine.'
      },
      {
        id: 'smb-gws-1-s4',
        stepNumber: 4,
        title: 'Smoke Test — Confirm Everything Works',
        instruction: 'Before connecting to your AI agent, verify the connection works by pulling your next 3 calendar events. If this works, everything downstream will too.',
        promptTemplate: 'Run this command in your terminal:\\n\\ngws calendar events list --params \'{"calendarId":"primary","maxResults":3,"timeMin":"2026-03-04T00:00:00Z","orderBy":"startTime","singleEvents":true}\'\\n\\nReplace the date in timeMin with today\'s date in ISO format (e.g. 2026-03-06T00:00:00Z).\\n\\nYou should see your next 3 calendar events printed as structured JSON data.',
        expectedOutput: 'Your next 3 calendar events are printed in the terminal as clean, structured data — confirming that authentication, API access, and the CLI are all working correctly.',
        tips: 'Don\'t worry about memorizing the command syntax. Your AI agent handles that part once it\'s connected. This step is just to prove the pipes are working.'
      },
      {
        id: 'smb-gws-1-s5',
        stepNumber: 5,
        title: 'Wire gws Into Your AI Agent via MCP',
        instruction: 'Add gws as an MCP server to your AI agent. This gives your agent full read/write access to all 25 Google Workspace services. One config block, one restart, done.',
        promptTemplate: '**Choose your agent and add the config:**\\n\\n🔵 Claude Code — add to ~/.claude/settings.json:\\n"mcpServers": {\\n  "gws": {\\n    "command": "gws",\\n    "args": ["mcp", "-s", "all", "-w", "-e"]\\n  }\\n}\\n\\n🔵 Claude Desktop / Cowork — add to ~/Library/Application Support/Claude/claude_desktop_config.json (same block as above)\\n\\n🟢 Codex — add to ~/.codex/config.toml:\\n[mcp_servers.gws]\\ncommand = "gws"\\nargs = ["mcp", "-s", "all", "-w", "-e"]\\n\\n**Flag breakdown:**\\n-s all = expose every Google Workspace service\\n-w = enable write operations (without it, your agent can only read)\\n-e = enable extended helper tools\\n\\n**Want a lighter setup?** Replace "all" with just the services you need: -s calendar,gmail,drive\\n\\n⚠️ CRITICAL: Restart your agent after saving. Save the file, close the app completely, reopen it. Then verify: in Claude Code, run /mcp in the chat. You should see gws listed with all its available tools.',
        expectedOutput: 'After restarting your agent, running /mcp (in Claude Code) shows gws listed as a connected MCP server with all its tools available. Your AI agent can now read and write to Gmail, Calendar, Drive, Sheets, Docs, and Slides.',
        tips: 'Global vs project config: ~/.claude/settings.json makes gws available in every project. To scope it to one project, add it to that project\'s .claude/settings.json instead.'
      },
      {
        id: 'smb-gws-1-s6',
        stepNumber: 6,
        title: 'Install 107 Pre-Built Skills',
        instruction: 'Instead of making your AI agent figure out complex multi-step workflows from scratch, install 107 ready-made playbooks with a single command. These are recipes your agent already knows how to run.',
        promptTemplate: 'Run this one command:\\n\\nnpx skills add -y -g https://github.com/googleworkspace/cli\\n\\nThis installs 107 skills across four categories:\\n\\n📦 25 Service Skills — direct API access to each Google Workspace app\\n🛠️ 20 Helper Skills — inbox triage, calendar summaries, drive organisation\\n👤 10 Persona Skills — executive assistant, IT admin, project manager\\n🧪 47 Recipe Skills — multi-step workflows across multiple Google apps\\n\\nThese install across Claude Code, Codex, Cursor, Gemini CLI, and any other agent that reads skills.',
        expectedOutput: 'All 107 skills are installed and available to your AI agent. You can now invoke them as slash commands or natural language requests.',
        tips: 'You can browse the full list of installed skills in the skills directory. Each skill is a markdown file your agent reads as instructions — you can customize them if you want to change the workflow.'
      },
      {
        id: 'smb-gws-1-s7',
        stepNumber: 7,
        title: 'Run the Workflows That Actually Save Time',
        instruction: 'These are the workflows that replace 30+ minutes of manual clicking every day. Start with inbox triage and meeting prep — once your AI is handling these, you will not go back to doing them manually.',
        promptTemplate: 'Try these workflows in your AI agent right now:\\n\\n📧 INBOX TRIAGE:\\n/gws-gmail-triage\\nYour agent reads your unread inbox and gives you a prioritised summary. No more scanning 47 emails to find the 3 that matter.\\n\\n📅 CALENDAR AGENDA:\\n/gws-calendar-agenda\\nUpcoming events at a glance, with context pulled from related emails and docs.\\n\\n🤝 MEETING PREP:\\n/gws-workflow-meeting-prep\\nBefore any meeting, your agent pulls the agenda, relevant documents, and attendee info. Walk in prepared without doing the prep yourself.\\n\\n📊 WEEKLY DIGEST:\\n/gws-workflow-weekly-digest\\nA summary across all your Google services. What happened this week, what needs attention, what is coming next.\\n\\n🗓️ SCHEDULE OPTIMISER:\\n/recipe-plan-weekly-schedule\\nYour agent reviews your calendar and suggests optimisations. Block focus time, flag conflicts, batch similar meetings.',
        expectedOutput: 'Your AI agent is actively triaging your inbox, preparing you for meetings, and summarising your week across Gmail, Calendar, Drive, and Docs — all from a single chat interface.',
        tips: 'Start with /gws-gmail-triage. It is the fastest way to see the power of having your agent connected to Google Workspace. Once you see your inbox summarised in 10 seconds instead of 10 minutes, you will immediately want to explore the other workflows.'
      }
    ]
  },
  {
    id: 'smb-ci-1',
    slug: 'competitor-intelligence-tracker',
    title: 'Competitor Intelligence Tracker',
    subtitle: 'Your competitors are making moves right now. Get a weekly intelligence briefing delivered to your inbox — powered by live web scraping and AI analysis.',
    category: 'Strategy',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 120,
    completionCount: 327,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'A list of 2-5 competitor website URLs (e.g. https://competitor1.com, https://competitor2.com).',
      'A brief description of your own business and what makes you different.',
      'Know what you care about tracking: pricing changes, new features, hiring signals, content strategy, partnerships.'
    ],
    expectedOutcome: 'A structured competitive intelligence report with per-competitor change detection, threat level ratings, and specific recommended actions — formatted as an executive dashboard you can share with your team.',
    agentAutomation: {
      description: 'Deploy a weekly agent that scrapes your competitor websites via Firecrawl, compares this week\'s data to last week\'s, and emails you a prioritised intelligence briefing every Monday morning.',
      trigger: 'Every Monday at 8 AM.',
      actions: [
        'Scrape each competitor URL via Firecrawl to extract current homepage, pricing, blog, and careers content.',
        'Send all scraped data to Claude with a comparison prompt.',
        'Generate a structured intelligence report with change detection and threat ratings.',
        'Email the weekly report to the business owner.'
      ],
      setupSteps: [
        { title: 'Enter your competitor URLs', description: 'When deploying the agent, enter your competitor website URLs as a comma-separated list in the "Competitor URLs" field. The system will scrape these automatically each week.' },
        { title: 'Describe your business', description: 'Fill in your business name and what you do so the AI can assess threats relative to your positioning.' },
        { title: 'Set your schedule', description: 'Choose weekly delivery (Monday recommended) and enter your email address.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'The report says "Could not scrape" for one of my competitors',
        solution: 'Some websites block automated scraping. Try entering the specific pages you want tracked instead of just the homepage (e.g. https://competitor.com/pricing rather than https://competitor.com). Firecrawl handles most JavaScript-rendered sites, but some may have aggressive bot protection.'
      },
      {
        problem: 'The intelligence report is too generic',
        solution: 'Be more specific in your "What to Track" field. Instead of "everything," say "pricing changes, new integrations, and job postings in engineering." The more focused your brief, the more actionable the AI\'s analysis will be.'
      },
      {
        problem: 'I want to track social media, not just websites',
        solution: 'Enter the specific social media profile URLs as competitor URLs (e.g. https://twitter.com/competitor or https://linkedin.com/company/competitor). Firecrawl can scrape public social profiles too.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-bk-2', title: 'Monthly Financial Snapshot & P&L Analyzer', slug: 'monthly-financial-snapshot-pl-analyzer' }
    ],
    steps: [
      {
        id: 'smb-ci-1-s1',
        stepNumber: 1,
        title: 'Define Your Competitive Landscape',
        instruction: 'Enter your business details and competitor information. The AI will create a structured competitive map showing who competes where, their positioning, and their current strengths.',
        promptTemplate: 'I need a competitive intelligence analysis for my business.\\n\\n**My Business:** [Your Business Name & Description]\\n\\n**My Key Differentiators:** [What Makes You Different]\\n\\n**Competitors to Track:** [Competitor URLs]\\n\\n**What I Care About Tracking:**\\n[What to Track]\\n\\nFirst, create a COMPETITIVE MAP that shows:\\n1. Each competitor\'s core positioning (one sentence each)\\n2. Where we overlap vs. where we are differentiated\\n3. Their likely target customer vs. ours\\n4. A quick SWOT for each competitor relative to us\\n\\nFormat this as a clean table.',
        expectedOutput: 'A structured competitive map table showing each competitor\'s positioning, overlap areas, target customers, and a relative SWOT analysis.',
        tips: 'Be honest about your own weaknesses in the "What Makes You Different" field. The more honest you are, the more useful the threat analysis will be.'
      },
      {
        id: 'smb-ci-1-s2',
        stepNumber: 2,
        title: 'Deep-Dive Snapshot — Live Web Intelligence',
        instruction: 'The system scrapes your competitor websites via Firecrawl and feeds the live content to the AI for analysis. In manual mode, you can paste competitor website content directly.',
        promptTemplate: 'Based on the following LIVE SCRAPED DATA from competitor websites, create a detailed intelligence snapshot for each competitor.\\n\\n**SCRAPED COMPETITOR DATA:**\\n[Competitor URLs]\\n\\nFor EACH competitor, analyse the scraped content and report:\\n\\n**Homepage & Messaging:** What is their current headline and value proposition? Has their messaging shifted toward any new themes?\\n\\n**Pricing & Plans:** What pricing is visible? Any new tiers, discounts, or "free" offers?\\n\\n**Product / Features:** Any new features, integrations, or product announcements mentioned?\\n\\n**Careers & Hiring:** Are they hiring? What roles are open? (Sales hires signal revenue push, engineering hires signal product investment.)\\n\\n**Blog & Content:** What are they publishing about? Any thought leadership themes or SEO plays?\\n\\n**Partnerships & Integrations:** Any new partner logos, integration announcements, or ecosystem plays?\\n\\nFormat each competitor as a separate section with clear headings.',
        expectedOutput: 'A per-competitor intelligence snapshot covering their latest messaging, pricing, features, hiring signals, content strategy, and partnerships — all derived from live scraped web data.',
        tips: 'For autopilot mode, the Competitor URLs variable is automatically scraped via Firecrawl before the prompt is sent to the AI. In manual mode, you can paste the content yourself or use the Firecrawl website to grab it.'
      },
      {
        id: 'smb-ci-1-s3',
        stepNumber: 3,
        title: 'Threat & Opportunity Analysis',
        instruction: 'The AI synthesises all competitor intelligence into actionable strategic insights: what to respond to, what to ignore, and where the opportunities are.',
        promptTemplate: 'Based on all the competitor intelligence gathered above, now perform a STRATEGIC ANALYSIS:\\n\\n**1. What are they doing that we are NOT doing?**\\nList specific features, strategies, or moves that our competitors have made that we have not. Rate each as HIGH / MEDIUM / LOW priority to respond to.\\n\\n**2. Where are they vulnerable?**\\nIdentify weaknesses, gaps, or blind spots in each competitor\'s strategy that we could exploit.\\n\\n**3. What should we RESPOND to vs. IGNORE?**\\nNot every competitor move requires a response. For each significant change detected, recommend either:\\n- RESPOND: Here is what we should do and why\\n- MONITOR: Watch but do not act yet\\n- IGNORE: This does not affect our positioning\\n\\n**4. Emerging Opportunities**\\nBased on gaps in the competitive landscape, what opportunities exist that NOBODY is addressing yet?\\n\\nBe specific. Reference actual data from the snapshots above.',
        expectedOutput: 'A strategic analysis with prioritised response recommendations, competitor vulnerabilities to exploit, and emerging market opportunities.',
        tips: 'The best competitive intelligence is not about copying competitors — it is about finding the gaps they are leaving open.'
      },
      {
        id: 'smb-ci-1-s4',
        stepNumber: 4,
        title: 'Executive Dashboard — Weekly Briefing',
        instruction: 'Compile everything into a single executive summary table that you can share with your team or review in 60 seconds.',
        promptTemplate: 'Create a WEEKLY COMPETITIVE INTELLIGENCE EXECUTIVE SUMMARY using this exact format:\\n\\n## Competitive Intelligence Briefing\\n\\n| Competitor | What Changed This Week | Threat Level | Recommended Action |\\n|---|---|---|---|\\n| [Name] | [1-2 sentence summary of changes] | [HIGH / MEDIUM / LOW with emoji: HIGH, MEDIUM, LOW] | [Specific action in 1 sentence] |\\n\\nRepeat for each competitor.\\n\\n## Top 3 Actions This Week\\n1. [Most urgent action with deadline]\\n2. [Second priority action]\\n3. [Third priority action]\\n\\n## Market Pulse\\n[2-3 sentences on overall competitive landscape trends — what direction is the market moving?]\\n\\nKeep the entire summary to ONE PAGE. This should be readable in 60 seconds by a busy founder.',
        expectedOutput: 'A concise, one-page executive summary with a competitor change table, threat ratings, top 3 recommended actions, and a market pulse — ready to share with your team.',
        tips: 'Save these weekly reports so you can track competitor trends over time. After 4-8 weeks, patterns emerge that are invisible in any single snapshot.'
      }
    ]
  },
  {
    id: 'smb-fc-1',
    slug: 'brand-mention-monitor',
    title: 'Brand Mention Monitor',
    subtitle: 'Track what people are saying about your brand across the web. Get a weekly sentiment report with actionable insights delivered to your inbox.',
    category: 'Marketing',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 90,
    completionCount: 214,
    rating: 4.7,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'Your brand name and any common misspellings or abbreviations.',
      'URLs of places your brand is likely mentioned: Google search results, Reddit threads, review sites (G2, Trustpilot, etc.).',
      'Know which competitors you want to compare sentiment against.'
    ],
    expectedOutcome: 'A weekly sentiment analysis report showing where your brand was mentioned, what people said, overall sentiment score, and recommended response actions.',
    agentAutomation: {
      description: 'Deploy a weekly agent that scrapes review sites, Reddit, and Google search results for your brand name, analyses sentiment, and emails you a prioritised response plan.',
      trigger: 'Every Monday at 9 AM.',
      actions: [
        'Scrape each monitoring URL via Firecrawl for fresh brand mentions.',
        'Analyse sentiment across all mentions: positive, neutral, negative.',
        'Flag urgent negative mentions that need immediate response.',
        'Email the weekly brand health report.'
      ],
      setupSteps: [
        { title: 'Enter your monitoring URLs', description: 'Add URLs where your brand gets mentioned: Google search results pages, Reddit threads, review sites, social profiles.' },
        { title: 'Describe your brand', description: 'Enter your brand name, industry, and key products so the AI can correctly identify relevant mentions.' },
        { title: 'Set your schedule', description: 'Weekly on Monday is recommended for most businesses.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Not finding many brand mentions',
        solution: 'Try adding more specific search URLs. Search Google for your brand name and paste that search results URL. Also try site-specific searches like "site:reddit.com [brand name]".'
      },
      {
        problem: 'Sentiment analysis seems inaccurate',
        solution: 'Add context in your brand description about common industry terms that might be confused with sentiment words. Also specify if your brand name is a common word.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-ci-1', title: 'Competitor Intelligence Tracker', slug: 'competitor-intelligence-tracker' }
    ],
    steps: [
      {
        id: 'smb-fc-1-s1',
        stepNumber: 1,
        title: 'Set Up Your Monitoring Sources',
        instruction: 'Enter URLs where your brand is likely to be mentioned. The system will scrape these via Firecrawl to find fresh mentions.',
        promptTemplate: 'I want to monitor brand mentions for my business.\n\n**Brand Name:** [Your Brand Name]\n**Industry:** [Your Industry]\n**Monitoring URLs (scraped via Firecrawl):**\n[Scrape Brand Mention URLs]\n\nFrom the scraped content, find every mention of my brand (including misspellings and abbreviations). For each mention found:\n1. Quote the exact mention\n2. Note the source and context\n3. Rate sentiment: Positive / Neutral / Negative\n4. Flag urgency: HIGH (negative review needing response) / MEDIUM (worth noting) / LOW (routine)\n\nOrganise findings by sentiment category.',
        expectedOutput: 'A categorised list of all brand mentions found, with sentiment ratings and urgency flags.',
        tips: 'Start with Google search results for your brand name, your G2/Trustpilot page, and any Reddit threads mentioning your product.'
      },
      {
        id: 'smb-fc-1-s2',
        stepNumber: 2,
        title: 'Sentiment Analysis & Trends',
        instruction: 'The AI analyses all mentions to identify patterns, calculate an overall sentiment score, and spot emerging themes.',
        promptTemplate: 'Based on all the brand mentions gathered above, create a BRAND HEALTH REPORT:\n\n## Overall Sentiment Score\nCalculate a score from 1-10 (10 = overwhelmingly positive). Show the breakdown: X% positive, X% neutral, X% negative.\n\n## Key Themes\nWhat topics keep coming up? Group mentions by theme (e.g. product quality, customer support, pricing, onboarding).\n\n## Urgent Actions Needed\nList any negative mentions that require an immediate response. Draft a suggested response for each one.\n\n## Competitive Comparison\nIf any competitor brands were mentioned alongside ours, how does sentiment compare?\n\n## Trend\nCompared to general industry sentiment, are we trending up or down? What is driving the trend?',
        expectedOutput: 'A complete brand health report with sentiment scores, themed analysis, urgent action items with draft responses, and trend analysis.',
        tips: 'Run this weekly and save the reports. After a month, you will see clear trends in how your brand perception is shifting.'
      }
    ]
  },
  {
    id: 'smb-fc-2',
    slug: 'seo-content-gap-analyzer',
    title: 'SEO Content Gap Analyzer',
    subtitle: 'Scrape your competitors\' blogs, find the topics they rank for that you do not, and get a prioritised content plan to close the gap.',
    category: 'Marketing',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 180,
    completionCount: 156,
    rating: 4.8,
    isPro: true,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'Your website blog/content URL (e.g. https://yourbrand.com/blog).',
      '2-3 competitor blog URLs.',
      'A general understanding of your target keywords and audience.'
    ],
    expectedOutcome: 'A prioritised list of content gaps: topics your competitors cover that you do not, ranked by estimated traffic potential, with suggested article titles and outlines for each.',
    agentAutomation: {
      description: 'Deploy a monthly agent that scrapes your blog and competitor blogs, identifies new content gaps, and emails you a prioritised content plan with article briefs.',
      trigger: 'First Monday of each month at 9 AM.',
      actions: [
        'Scrape your blog and competitor blogs via Firecrawl.',
        'Compare topic coverage and identify gaps.',
        'Prioritise gaps by estimated search volume and competition.',
        'Generate article briefs for the top 5 gaps.',
        'Email the content gap report.'
      ],
      setupSteps: [
        { title: 'Enter your blog URL', description: 'Your blog or content hub URL so the system knows what you already cover.' },
        { title: 'Enter competitor blog URLs', description: 'Add 2-3 competitor blog URLs for comparison.' },
        { title: 'Set your cadence', description: 'Monthly is recommended — content gaps do not change weekly.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'The analysis says I have no gaps but I know competitors outrank me',
        solution: 'Make sure you are providing blog/content page URLs, not just homepages. The tool needs to see your actual articles to compare topic coverage.'
      },
      {
        problem: 'Too many gaps to act on',
        solution: 'Focus on the top 5 prioritised by the AI. These are ranked by traffic potential and relevance to your business.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-ci-1', title: 'Competitor Intelligence Tracker', slug: 'competitor-intelligence-tracker' }
    ],
    steps: [
      {
        id: 'smb-fc-2-s1',
        stepNumber: 1,
        title: 'Scrape and Map Content Coverage',
        instruction: 'Enter your blog URL and competitor blog URLs. The system scrapes all of them via Firecrawl and maps what topics each site covers.',
        promptTemplate: 'Analyse content coverage across these blogs:\n\n**My Blog:** [Scrape My Blog URL]\n\n**Competitor Blogs:** [Scrape Competitor Blog URLs]\n\nFor each blog, extract:\n1. List of all article titles and topics visible on the page\n2. Main topic categories/themes covered\n3. Estimated content volume (how many articles visible)\n\nThen create a CONTENT COVERAGE MAP showing which topics each competitor covers that we do NOT cover. These are our content gaps.',
        expectedOutput: 'A side-by-side content coverage map showing exactly which topics competitors cover that you are missing.',
        tips: 'Enter the blog index page URL (e.g. /blog or /resources) so Firecrawl can see all article titles at once.'
      },
      {
        id: 'smb-fc-2-s2',
        stepNumber: 2,
        title: 'Prioritise Gaps and Generate Briefs',
        instruction: 'The AI prioritises content gaps by estimated search intent and business relevance, then generates article briefs for the top 5.',
        promptTemplate: 'Based on the content gaps identified above, create a CONTENT GAP ACTION PLAN:\n\n## Top 10 Content Gaps (Ranked by Priority)\n\n| Rank | Topic | Competitors Covering It | Estimated Intent (Informational / Commercial / Transactional) | Priority |\n|---|---|---|---|---|\n\n## Article Briefs for Top 5\n\nFor each of the top 5 gaps, provide:\n- Suggested title (SEO-optimised)\n- Target keyword\n- Article outline (H2 headings)\n- Unique angle we can take that competitors are missing\n- Estimated word count\n- Internal linking opportunities to our existing content',
        expectedOutput: 'A prioritised gap list with 5 ready-to-write article briefs including titles, outlines, and unique angles.',
        tips: 'Focus on commercial and transactional intent gaps first — these drive revenue, not just traffic.'
      }
    ]
  },
  {
    id: 'smb-fc-3',
    slug: 'pricing-intelligence-agent',
    title: 'Pricing Intelligence Agent',
    subtitle: 'Monitor competitor pricing pages weekly. Detect price changes, new tiers, discounts, and free tier launches before your customers tell you.',
    category: 'Strategy',
    difficulty: 'Beginner',
    timeToComplete: 8,
    timeSaved: 60,
    completionCount: 198,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'Competitor pricing page URLs (e.g. https://competitor.com/pricing).',
      'Your own current pricing structure for comparison.',
      'Know your key differentiators beyond price.'
    ],
    expectedOutcome: 'A weekly pricing comparison report showing exactly what changed on competitor pricing pages, how your pricing compares, and whether you need to adjust your strategy.',
    agentAutomation: {
      description: 'Deploy a weekly agent that scrapes competitor pricing pages and alerts you to any changes — new tiers, price drops, free trials, or feature bundling shifts.',
      trigger: 'Every Wednesday at 8 AM.',
      actions: [
        'Scrape each competitor pricing page via Firecrawl.',
        'Compare current pricing to your own pricing structure.',
        'Detect and flag any changes from previous reports.',
        'Email the pricing intelligence briefing.'
      ],
      setupSteps: [
        { title: 'Enter competitor pricing URLs', description: 'Add the direct /pricing page URL for each competitor.' },
        { title: 'Describe your pricing', description: 'Enter your current plans and prices so the AI can make direct comparisons.' },
        { title: 'Set your schedule', description: 'Weekly on Wednesday recommended — mid-week gives you time to react before the weekend.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Competitor pricing page is behind a login',
        solution: 'Some companies hide pricing. Try scraping their G2 or Capterra listing instead — these often list pricing details that the company does not show publicly.'
      },
      {
        problem: 'Pricing page uses JavaScript sliders or calculators',
        solution: 'Firecrawl handles JS-rendered content, but dynamic calculators may not return all tiers. Add the specific plan pages if available (e.g. /pricing/enterprise).'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-ci-1', title: 'Competitor Intelligence Tracker', slug: 'competitor-intelligence-tracker' }
    ],
    steps: [
      {
        id: 'smb-fc-3-s1',
        stepNumber: 1,
        title: 'Scrape Competitor Pricing Pages',
        instruction: 'Enter the direct pricing page URLs for your competitors. Firecrawl will extract all visible pricing tiers, features, and offers.',
        promptTemplate: 'Analyse competitor pricing from the following scraped pricing pages:\n\n**Competitor Pricing Pages (scraped):**\n[Scrape Competitor Pricing URLs]\n\n**My Current Pricing:**\n[Your Current Pricing]\n\nFor EACH competitor, extract:\n1. Plan names and prices (monthly and annual if both shown)\n2. Key features included in each tier\n3. Any free tier, free trial, or freemium offering\n4. Any visible discounts, promotions, or special offers\n5. Enterprise/custom pricing indicators\n\nOrganise as a comparison table.',
        expectedOutput: 'A detailed pricing comparison table showing every competitor plan alongside your own pricing.',
        tips: 'Use the direct /pricing URL, not the homepage. Some companies have pricing at /plans or /packages instead.'
      },
      {
        id: 'smb-fc-3-s2',
        stepNumber: 2,
        title: 'Pricing Strategy Analysis',
        instruction: 'The AI analyses the pricing landscape and gives you strategic recommendations.',
        promptTemplate: 'Based on the pricing comparison above, provide a PRICING STRATEGY ANALYSIS:\n\n## How We Compare\nFor each plan tier, are we priced above, below, or at parity with competitors? What is our price position?\n\n## Changes Detected\nFlag anything that looks new or different from typical SaaS pricing in this space.\n\n## Threat Assessment\n- Is any competitor undercutting us significantly?\n- Has anyone launched a free tier that threatens our entry-level plan?\n- Are competitors bundling features we charge extra for?\n\n## Recommended Actions\nGive 2-3 specific pricing strategy recommendations based on this competitive landscape. Should we adjust? Bundle differently? Add a free tier? Hold firm?\n\nBe specific and reference actual numbers from the comparison.',
        expectedOutput: 'A strategic pricing analysis with competitive positioning, detected changes, threat assessment, and specific recommended actions.',
        tips: 'Price is only one axis — also consider value perception. Sometimes being more expensive is the right strategy if you can justify it with features or support.'
      }
    ]
  },
  {
    id: 'smb-fc-4',
    slug: 'job-market-scout',
    title: 'Job Market Scout',
    subtitle: 'Track what your competitors are hiring for. Sales hires signal revenue push, engineering signal product investment, marketing signal growth mode.',
    category: 'Strategy',
    difficulty: 'Beginner',
    timeToComplete: 8,
    timeSaved: 45,
    completionCount: 142,
    rating: 4.6,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'Competitor careers page URLs (e.g. https://competitor.com/careers).',
      'Your own current hiring priorities for comparison.',
      'Basic understanding of what different department hires signal strategically.'
    ],
    expectedOutcome: 'A strategic hiring intelligence report showing what competitors are investing in based on their open roles, with implications for your own strategy.',
    agentAutomation: {
      description: 'Deploy a weekly agent that scrapes competitor careers pages and alerts you to new roles that signal strategic shifts — like a competitor suddenly hiring 5 SDRs or a Head of AI.',
      trigger: 'Every Friday at 8 AM.',
      actions: [
        'Scrape each competitor careers page via Firecrawl.',
        'Categorise open roles by department and seniority.',
        'Analyse what the hiring patterns signal about their strategy.',
        'Email the hiring intelligence report.'
      ],
      setupSteps: [
        { title: 'Enter competitor careers URLs', description: 'Add the careers/jobs page URL for each competitor.' },
        { title: 'Describe your priorities', description: 'Enter what you are currently focused on so the AI can flag relevant competitive hires.' },
        { title: 'Set your schedule', description: 'Weekly on Friday is recommended — review over the weekend and plan your response on Monday.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Careers page shows no jobs',
        solution: 'Many companies use Lever, Greenhouse, or Ashby for job postings. Try scraping their job board directly (e.g. jobs.lever.co/companyname).'
      },
      {
        problem: 'Too many roles to analyse',
        solution: 'Focus on leadership and strategic hires. Senior roles and new departments matter more than individual contributor backfills.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-ci-1', title: 'Competitor Intelligence Tracker', slug: 'competitor-intelligence-tracker' }
    ],
    steps: [
      {
        id: 'smb-fc-4-s1',
        stepNumber: 1,
        title: 'Scrape Competitor Careers Pages',
        instruction: 'Enter the careers page URLs for your competitors. Firecrawl extracts all visible job listings.',
        promptTemplate: 'Analyse competitor hiring from the following scraped careers pages:\n\n**Competitor Careers Pages (scraped):**\n[Scrape Competitor Careers URLs]\n\nFor EACH competitor, extract and categorise all open roles:\n\n| Department | Role Title | Seniority | Location | What It Signals |\n|---|---|---|---|---|\n\nGroup by department: Engineering, Sales, Marketing, Product, Operations, Leadership, Other.',
        expectedOutput: 'A categorised table of all open roles per competitor, grouped by department with strategic signals.',
        tips: 'Try competitor.com/careers, jobs.lever.co/competitor, or boards.greenhouse.io/competitor depending on what job board they use.'
      },
      {
        id: 'smb-fc-4-s2',
        stepNumber: 2,
        title: 'Strategic Hiring Analysis',
        instruction: 'The AI interprets what the hiring patterns mean for each competitor\'s strategy and what it means for you.',
        promptTemplate: 'Based on the hiring data above, create a STRATEGIC HIRING INTELLIGENCE REPORT:\n\n## Hiring Heatmap\nWhich departments are each competitor investing in most heavily? Show as a simple heatmap table.\n\n## Strategic Signals\nFor each competitor, what does their hiring pattern tell us about their next 6-12 months?\n- Heavy sales hiring = revenue push / market expansion\n- Engineering hiring = product investment / new features coming\n- Marketing hiring = growth mode / brand building\n- Leadership hiring = strategic pivot / scaling up\n\n## Implications for Us\n- Are they building capabilities we lack?\n- Are they entering markets we operate in?\n- Should we accelerate any of our own hiring in response?\n\n## Key Takeaways\nTop 3 things to pay attention to, ranked by urgency.',
        expectedOutput: 'A strategic hiring analysis with a heatmap, signal interpretation, implications for your business, and key takeaways.',
        tips: 'Pay special attention to leadership hires — a new VP of Product or Chief Revenue Officer signals a major strategic shift within 3-6 months.'
      }
    ]
  },
  {
    id: 'smb-fc-5',
    slug: 'content-repurposing-engine',
    title: 'Content Repurposing Engine',
    subtitle: 'Drop in a URL to your latest blog post and instantly get 3 social media posts, an email newsletter snippet, and a Twitter thread — all in your brand voice.',
    category: 'Marketing',
    difficulty: 'Beginner',
    timeToComplete: 5,
    timeSaved: 60,
    completionCount: 389,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'A URL to the content you want to repurpose (blog post, article, landing page).',
      'Your brand voice guidelines or a few example social posts that match your tone.',
      'Your primary social platforms (Twitter/X, LinkedIn, Instagram, etc.).'
    ],
    expectedOutcome: 'A complete content repurposing package: 3 platform-optimised social posts, a Twitter/X thread, an email newsletter snippet, and a LinkedIn article summary — all derived from your original content and written in your brand voice.',
    agentAutomation: {
      description: 'Deploy a weekly agent that scrapes your latest blog post and automatically generates social media content, a newsletter snippet, and a Twitter thread — emailed to you ready to copy and paste.',
      trigger: 'Every Tuesday at 9 AM.',
      actions: [
        'Scrape your blog URL to find the most recent post.',
        'Extract key points, quotes, and data from the content.',
        'Generate platform-specific social posts in your brand voice.',
        'Email the complete repurposing package.'
      ],
      setupSteps: [
        { title: 'Enter your blog URL', description: 'The main blog page URL so the agent can find your latest post each week.' },
        { title: 'Define your brand voice', description: 'Paste 2-3 example social posts or describe your tone (e.g. "professional but witty, data-driven, uses emojis sparingly").' },
        { title: 'Set your platforms', description: 'Specify which platforms you post on so the content is formatted correctly.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'The social posts do not match my brand voice',
        solution: 'Paste 2-3 of your best-performing posts in the "Brand Voice Examples" field. The AI mimics your actual tone much better with concrete examples than with descriptions like "professional."'
      },
      {
        problem: 'Content was scraped but key information is missing',
        solution: 'Some blog platforms load content dynamically. Try scraping the specific article URL rather than the blog index page.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-fc-2', title: 'SEO Content Gap Analyzer', slug: 'seo-content-gap-analyzer' }
    ],
    steps: [
      {
        id: 'smb-fc-5-s1',
        stepNumber: 1,
        title: 'Scrape and Extract Key Points',
        instruction: 'Enter the URL of your blog post or article. Firecrawl scrapes the full content and the AI extracts the key points, data, and quotable moments.',
        promptTemplate: 'Scrape and analyse this content for repurposing:\n\n**Content URL (scraped via Firecrawl):**\n[Scrape Content URL]\n\n**Brand Voice:** [Brand Voice Examples]\n\n**Target Platforms:** [Your Social Platforms]\n\nFirst, extract from the scraped content:\n1. Main thesis / key argument (1 sentence)\n2. 3-5 key supporting points or data\n3. Best quotable lines or statistics\n4. The core takeaway readers should remember',
        expectedOutput: 'A structured extraction of the article\'s key points, data, quotable moments, and core takeaway.',
        tips: 'Firecrawl returns the full article as clean markdown, so the AI gets the complete context — not just the preview.'
      },
      {
        id: 'smb-fc-5-s2',
        stepNumber: 2,
        title: 'Generate Multi-Platform Content Package',
        instruction: 'The AI creates platform-specific content from your extracted key points, all in your brand voice.',
        promptTemplate: 'Using the extracted content above and matching the brand voice provided, create a COMPLETE REPURPOSING PACKAGE:\n\n## Twitter/X Posts (3 standalone tweets)\n- Each under 280 characters\n- Hook-driven, punchy, designed for engagement\n- Include 1 with a statistic, 1 with a hot take, 1 with a question\n\n## Twitter/X Thread (5-7 tweets)\n- Start with a strong hook tweet\n- Build the argument step by step\n- End with a CTA that links back to the full article\n\n## LinkedIn Post (1 long-form post)\n- Professional tone, storytelling format\n- Open with a personal insight or counter-intuitive statement\n- 150-300 words\n- End with a question to drive comments\n\n## Email Newsletter Snippet (1 section)\n- 3-4 sentences summarising the article\n- Include the key takeaway\n- End with a "Read the full article" CTA\n\nIMPORTANT: Match the brand voice examples provided. Do not use generic marketing language.',
        expectedOutput: 'A ready-to-use content package with 3 tweets, a Twitter thread, a LinkedIn post, and an email newsletter snippet — all written in your brand voice.',
        tips: 'The LinkedIn post performs best when you open with a personal story or surprising statement, not a summary of the article.'
      }
    ]
  },
  {
    id: 'smb-fc-6',
    slug: 'lead-research-enricher',
    title: 'Lead Research Enricher',
    subtitle: 'Enter a prospect\'s company URL. Get a sales-ready intelligence brief with company overview, tech stack, team size, recent news, and 3 personalised outreach angles.',
    category: 'Business Development',
    difficulty: 'Beginner',
    timeToComplete: 5,
    timeSaved: 30,
    completionCount: 276,
    rating: 4.8,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'The prospect company\'s website URL.',
      'Your product/service and how it helps companies like this.',
      'The role/title of the person you are reaching out to (optional but improves personalisation).'
    ],
    expectedOutcome: 'A one-page sales intelligence brief containing: company overview, what they do, team size signals, tech stack clues, recent activity, and 3 personalised outreach angles tailored to the specific prospect.',
    troubleshooting: [
      {
        problem: 'The company website is very minimal and lacks detail',
        solution: 'Try scraping their LinkedIn company page or Crunchbase profile instead. You can enter multiple URLs separated by commas.'
      },
      {
        problem: 'Outreach angles are too generic',
        solution: 'Add more context about your product and the specific pain point you solve. The more you tell the AI about YOUR offering, the better it can connect your solution to the prospect\'s situation.'
      }
    ],
    relatedPlaybooks: [
      { id: '1', title: 'Account Research Brief', slug: 'account-research-brief' }
    ],
    steps: [
      {
        id: 'smb-fc-6-s1',
        stepNumber: 1,
        title: 'Scrape and Analyse the Prospect',
        instruction: 'Enter the prospect company\'s website URL. Firecrawl scrapes their site and the AI builds a comprehensive intelligence profile.',
        promptTemplate: 'Scrape and analyse this prospect company for sales outreach:\n\n**Prospect Website (scraped via Firecrawl):**\n[Scrape Prospect URL]\n\n**My Product/Service:** [Your Product Description]\n**Target Contact Role:** [Target Role Title]\n\nFrom the scraped website content, extract:\n\n## Company Profile\n- What they do (1 sentence)\n- Industry and market\n- Approximate company size (clues from team page, about page)\n- Founded / headquarters (if visible)\n\n## Tech Stack & Tools\n- Any technologies, platforms, or tools mentioned on their site\n- Integration pages or partner logos visible\n\n## Recent Activity\n- Blog posts, press releases, or announcements on the site\n- New product launches or feature updates\n- Hiring signals from a careers page\n\n## Business Signals\n- What problems are they trying to solve? (inferred from their messaging)\n- What stage are they at? (startup, growth, enterprise)\n- Any pain points visible in their positioning that my product addresses?',
        expectedOutput: 'A comprehensive company profile with business details, tech stack, recent activity, and identified pain points.',
        tips: 'For deeper intel, enter multiple URLs separated by commas: homepage, about page, careers page, and blog.'
      },
      {
        id: 'smb-fc-6-s2',
        stepNumber: 2,
        title: 'Generate Personalised Outreach Angles',
        instruction: 'The AI creates 3 personalised outreach angles based on the prospect intelligence, connecting their specific situation to your product\'s value.',
        promptTemplate: 'Based on the prospect intelligence above and my product description, create 3 PERSONALISED OUTREACH ANGLES:\n\n## Angle 1: Pain Point Match\nConnect a specific problem visible on their website to how my product solves it. Reference something concrete from their site.\n\n## Angle 2: Recent Activity Hook\nReference a recent blog post, announcement, or hire and connect it to a relevant capability of my product.\n\n## Angle 3: Industry Trend\nConnect a broader industry trend affecting companies like theirs to my product\'s value proposition.\n\nFor each angle, provide:\n- A one-line email subject line\n- A 3-sentence opening paragraph ready to paste into an outreach email\n- Why this angle should work for this specific prospect\n\nIMPORTANT: Be specific. Reference actual details from the scraped website. Generic outreach is worse than no outreach.',
        expectedOutput: '3 ready-to-use outreach angles, each with a subject line, opening paragraph, and strategic rationale — all personalised to the specific prospect.',
        tips: 'Angle 2 (Recent Activity Hook) typically gets the highest response rate because it shows you did your homework and the timing is relevant.'
      }
    ]
  },
  {
    id: 'smb-fc-7',
    slug: 'rfp-tender-scout',
    title: 'RFP & Tender Scout',
    subtitle: 'Automatically scrape government procurement portals and tender sites daily. Get alerted the moment a relevant RFP drops — before your competitors even see it.',
    category: 'Business Development',
    difficulty: 'Intermediate',
    timeToComplete: 10,
    timeSaved: 120,
    completionCount: 87,
    rating: 4.7,
    isPro: true,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'URLs of procurement portals relevant to your industry (e.g. SAM.gov, state procurement sites, industry-specific tender boards).',
      'A clear description of the types of contracts you bid on — services, products, size range, geography.',
      'Your company capabilities and past performance keywords so the AI can match relevant opportunities.'
    ],
    expectedOutcome: 'A daily or weekly digest of new RFPs and tenders matching your capabilities, with a qualification score for each, key submission deadlines, and a recommended bid/no-bid decision.',
    agentAutomation: {
      description: 'Deploy a daily agent that scrapes procurement portals for new RFPs, scores them against your capabilities, and emails you a prioritised list with deadlines and recommended actions.',
      trigger: 'Every weekday at 7 AM.',
      actions: [
        'Scrape each procurement portal URL via Firecrawl for new postings.',
        'Filter results by relevance to your capabilities and service areas.',
        'Score each opportunity: HIGH / MEDIUM / LOW fit.',
        'Flag urgent deadlines within the next 7 days.',
        'Email the daily RFP digest with qualification scores.'
      ],
      setupSteps: [
        { title: 'Enter procurement portal URLs', description: 'Add the URLs of tender sites and procurement portals you want to monitor (e.g. SAM.gov results pages, state portals, industry boards).' },
        { title: 'Describe your capabilities', description: 'Enter your company services, specialisations, certifications, geographic coverage, and typical contract size range.' },
        { title: 'Set your schedule', description: 'Daily on weekdays is recommended for competitive procurement environments.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Not finding relevant RFPs',
        solution: 'Many procurement sites use search filters — try entering the URL of a pre-filtered search results page rather than the homepage. For example, on SAM.gov, set your filters (NAICS code, location, etc.) and use that filtered URL.'
      },
      {
        problem: 'Too many irrelevant results',
        solution: 'Be more specific in your capabilities description. Instead of \"IT services\" try \"cloud migration consulting for federal agencies, FedRAMP certified, 8(a) eligible\". The more specific you are, the better the AI filters.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-fc-6', title: 'Lead Research Enricher', slug: 'lead-research-enricher' }
    ],
    steps: [
      {
        id: 'smb-fc-7-s1',
        stepNumber: 1,
        title: 'Scrape Procurement Portals',
        instruction: 'Enter the URLs of procurement portals and tender sites you want to monitor. Firecrawl scrapes them for the latest postings.',
        promptTemplate: 'Analyse these procurement portal pages for new RFP and tender opportunities:\\n\\n**Procurement Portal URLs (scraped via Firecrawl):**\\n[Scrape Procurement URLs]\\n\\n**My Company Capabilities:**\\n[Your Company Capabilities]\\n\\n**Services We Offer:** [Your Services]\\n**Geographic Coverage:** [Your Geography]\\n**Typical Contract Size:** [Your Contract Size Range]\\n\\nFrom the scraped content, identify ALL new procurement opportunities. For each one found:\\n\\n| Opportunity | Agency/Org | Due Date | Est. Value | Fit Score | Key Requirements |\\n|---|---|---|---|---|---|\\n\\nFit Score should be HIGH / MEDIUM / LOW based on how well it matches our capabilities.',
        expectedOutput: 'A table of all procurement opportunities found, scored by fit, with due dates, estimated values, and key requirements.',
        tips: 'For government portals, enter the search results page URL with filters pre-applied for your NAICS code or service category.'
      },
      {
        id: 'smb-fc-7-s2',
        stepNumber: 2,
        title: 'Qualification Analysis & Bid Strategy',
        instruction: 'The AI deep-analyses the highest-fit opportunities and provides bid/no-bid recommendations with a strategy for each.',
        promptTemplate: 'For each HIGH and MEDIUM fit opportunity identified above, provide a QUALIFICATION ANALYSIS:\\n\\n## Bid/No-Bid Recommendation\\nFor each opportunity, recommend BID or NO-BID with specific reasoning.\\n\\n## For Each BID Recommendation:\\n1. **Why we should bid:** Specific capability matches\\n2. **Key risks:** What could go wrong, where are we weak\\n3. **Win strategy:** Our competitive angle for this specific opportunity\\n4. **Key deadlines:** Submission date, Q&A period, pre-bid conference\\n5. **Teaming needs:** Do we need a subcontractor for any requirements?\\n6. **Estimated effort to respond:** Hours to prepare the proposal\\n\\n## Priority Ranking\\nRank all BID recommendations by: (Fit Score × Estimated Value) ÷ Effort to Respond\\n\\nHighest ratio = best use of our time.',
        expectedOutput: 'A detailed qualification analysis for each opportunity with bid/no-bid recommendations, win strategies, risk assessment, and a priority ranking.',
        tips: 'Focus your energy on the top 2-3 opportunities ranked by priority. Spreading too thin across many bids reduces win probability.'
      }
    ]
  },
  {
    id: 'smb-fc-8',
    slug: 'partnership-opportunity-finder',
    title: 'Partnership Opportunity Finder',
    subtitle: 'Scrape potential partner company websites to assess integration fit, co-marketing alignment, and mutual value — then generate a personalised partnership pitch.',
    category: 'Business Development',
    difficulty: 'Intermediate',
    timeToComplete: 12,
    timeSaved: 90,
    completionCount: 65,
    rating: 4.6,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'URLs of companies you are considering partnering with.',
      'A clear description of your product/service and what you bring to a partnership.',
      'What type of partnership you are looking for: integration, referral, co-marketing, reseller, white-label.'
    ],
    expectedOutcome: 'A partnership assessment for each company showing mutual fit, integration opportunities, potential deal structure, and a personalised outreach message ready to send to the partnership contact.',
    troubleshooting: [
      {
        problem: 'Cannot determine partnership fit from the website alone',
        solution: 'Supplement with their integrations page (/integrations) or partner directory (/partners). Also try scraping their LinkedIn company page for recent partnership announcements.'
      },
      {
        problem: 'Outreach pitch is too generic',
        solution: 'Add more detail about a specific use case where your products work together. The more concrete the value proposition, the better the pitch.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-fc-6', title: 'Lead Research Enricher', slug: 'lead-research-enricher' }
    ],
    steps: [
      {
        id: 'smb-fc-8-s1',
        stepNumber: 1,
        title: 'Scrape and Assess Partner Fit',
        instruction: 'Enter the website URLs of potential partner companies. Firecrawl scrapes their sites and the AI analyses partnership fit across multiple dimensions.',
        promptTemplate: 'Analyse these potential partner companies for partnership fit:\\n\\n**Partner Company Websites (scraped via Firecrawl):**\\n[Scrape Partner URLs]\\n\\n**My Company:**\\n[Your Company Description]\\n\\n**What We Offer Partners:** [Your Partnership Value]\\n**Partnership Type Seeking:** [Partnership Type]\\n\\nFor EACH potential partner, analyse:\\n\\n## Company Overview\\n- What they do, who they serve, their market position\\n\\n## Partnership Fit Assessment\\n| Dimension | Score (1-10) | Notes |\\n|---|---|---|\\n| Product Complementarity | | |\\n| Audience Overlap | | |\\n| Market Position Compatibility | | |\\n| Integration Feasibility | | |\\n| Brand Alignment | | |\\n| **Overall Fit** | | |\\n\\n## Mutual Value Proposition\\n- What we bring to them\\n- What they bring to us\\n- Specific use cases where our products work together\\n\\n## Red Flags\\n- Any reasons this partnership might NOT work',
        expectedOutput: 'A detailed partnership assessment for each company with fit scores, mutual value analysis, and red flags.',
        tips: 'Scrape their /integrations, /partners, and /about pages for the best partnership intelligence. Also check if they have an existing partner programme.'
      },
      {
        id: 'smb-fc-8-s2',
        stepNumber: 2,
        title: 'Generate Partnership Outreach',
        instruction: 'The AI creates personalised partnership pitches for the highest-fit companies, including a proposed deal structure.',
        promptTemplate: 'For each partner company with an Overall Fit score of 7 or above, create a PARTNERSHIP OUTREACH PACKAGE:\\n\\n## Proposed Partnership Structure\\n- Partnership type (integration / referral / co-marketing / reseller)\\n- Revenue model suggestion (revenue share %, referral fees, etc.)\\n- Pilot programme suggestion (scope, timeline, metrics)\\n\\n## Outreach Email\\nDraft a personalised email to their partnerships or BD team that:\\n1. Opens with something specific about their company (from the scrape)\\n2. Explains the mutual value in 2-3 sentences\\n3. Proposes a specific, low-commitment next step (\"15-min call to explore X\")\\n4. Keeps it under 150 words\\n\\n## Talking Points for First Call\\n- 3 concrete ways the partnership creates value for their customers\\n- 1 case study idea you could co-create\\n- A suggested pilot scope that can prove value in 30 days',
        expectedOutput: 'A complete partnership outreach package with proposed deal structure, personalised email, and call talking points for each high-fit partner.',
        tips: 'The best partnership outreach focuses on what you can do for THEIR customers, not what you need from the partnership. Lead with value.'
      }
    ]
  },
  {
    id: 'smb-fc-9',
    slug: 'review-response-generator',
    title: 'Review Response Generator',
    subtitle: 'Scrape your G2, Trustpilot, Yelp, and Google reviews daily. Get draft responses for every new review — empathetic for negatives, grateful for positives — ready to paste.',
    category: 'Customer Success',
    difficulty: 'Beginner',
    timeToComplete: 5,
    timeSaved: 45,
    completionCount: 423,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'URLs of your review profiles: Google Business, G2, Trustpilot, Yelp, Capterra, etc.',
      'Your brand voice and tone guidelines for customer-facing communication.',
      'Any internal policies on review responses (e.g. never offer refunds publicly, always escalate to DM for complaints).'
    ],
    expectedOutcome: 'Draft responses for every new review found, matching your brand voice. Negative reviews get empathetic, solution-oriented responses. Positive reviews get warm, specific thank-yous. All ready to copy-paste.',
    agentAutomation: {
      description: 'Deploy a daily agent that scrapes your review profiles, identifies new reviews, drafts appropriate responses for each, and emails you the complete set — ready to post.',
      trigger: 'Every weekday at 8 AM.',
      actions: [
        'Scrape each review platform URL via Firecrawl for recent reviews.',
        'Categorise each review: Positive / Neutral / Negative.',
        'Draft a personalised response for each review in your brand voice.',
        'Flag any negative reviews that need urgent escalation.',
        'Email the complete response package.'
      ],
      setupSteps: [
        { title: 'Enter your review profile URLs', description: 'Add the direct URLs to your review profiles on G2, Trustpilot, Google Business, Yelp, etc.' },
        { title: 'Define your response voice', description: 'Paste 2-3 example responses you have written before, or describe your tone (e.g. \"warm, professional, first-name basis, always acknowledge the specific issue\").' },
        { title: 'Set response policies', description: 'Any rules? E.g. \"never offer refunds in public responses\", \"always invite complainants to email support@\", \"never argue back\".' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Review pages require login to view',
        solution: 'Most review platforms show reviews publicly. Make sure you are entering the public-facing profile URL, not a dashboard URL. For Google Business, use the Google Maps listing URL.'
      },
      {
        problem: 'Responses sound too corporate',
        solution: 'Paste 2-3 of your best actual review responses in the brand voice section. The AI will mimic your real tone much better than following a description like \"professional but friendly\".'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-fc-1', title: 'Brand Mention Monitor', slug: 'brand-mention-monitor' }
    ],
    steps: [
      {
        id: 'smb-fc-9-s1',
        stepNumber: 1,
        title: 'Scrape and Categorise Reviews',
        instruction: 'Enter the URLs of your review profiles across platforms. Firecrawl scrapes the latest reviews and the AI categorises them by sentiment and urgency.',
        promptTemplate: 'Scrape and analyse my business reviews from these platforms:\\n\\n**Review Profile URLs (scraped via Firecrawl):**\\n[Scrape Review URLs]\\n\\n**My Business:** [Your Business Name]\\n**My Brand Voice:** [Your Brand Voice Examples]\\n**Response Policies:** [Your Response Policies]\\n\\nFor EACH review found, extract and categorise:\\n\\n| Reviewer | Platform | Rating | Sentiment | Key Points | Urgency |\\n|---|---|---|---|---|---|\\n\\nSentiment: Positive / Neutral / Negative\\nUrgency: URGENT (1-2 stars with specific complaint) / NORMAL / LOW\\n\\nSort by urgency, then by date (newest first).',
        expectedOutput: 'A categorised table of all recent reviews with sentiment ratings, key points extracted, and urgency classification.',
        tips: 'For Google Business reviews, use your Google Maps listing URL. For G2, use your product\'s G2 reviews page URL.'
      },
      {
        id: 'smb-fc-9-s2',
        stepNumber: 2,
        title: 'Generate Review Responses',
        instruction: 'The AI drafts personalised responses for each review, matching your brand voice and following your response policies.',
        promptTemplate: 'For EACH review listed above, draft a response following these guidelines:\\n\\n## For NEGATIVE Reviews (1-3 stars):\\n- Open with empathy: acknowledge their specific frustration (name the issue)\\n- Take responsibility without being defensive\\n- Offer a concrete next step (not vague \"we will do better\")\\n- Invite them to reach out directly for resolution\\n- Keep it under 100 words\\n- FOLLOW the response policies provided\\n\\n## For NEUTRAL Reviews (3 stars):\\n- Thank them for the honest feedback\\n- Address any specific concerns mentioned\\n- Highlight what you are doing to improve in that area\\n- Keep it under 80 words\\n\\n## For POSITIVE Reviews (4-5 stars):\\n- Thank them by referencing something SPECIFIC they mentioned (not generic \"thanks for the review\")\\n- Reinforce the positive aspect they highlighted\\n- Keep it warm and brief — under 60 words\\n- Do NOT ask them to refer friends (it cheapens the gratitude)\\n\\nFormat each response as:\\n**[Reviewer Name] — [Platform] — [Rating]**\\n> [Draft Response]',
        expectedOutput: 'Ready-to-post response drafts for every review — empathetic for negatives, warm for positives, all in your brand voice and under word limits.',
        tips: 'The fastest way to improve your review score is to respond to every negative review within 24 hours with a genuine, solution-oriented response. Many reviewers update their rating after a good response.'
      }
    ]
  },
  {
    id: 'smb-fc-10',
    slug: 'regulatory-compliance-monitor',
    title: 'Regulatory & Compliance Monitor',
    subtitle: 'Stay ahead of regulation changes. Automatically scrape government and industry regulatory sites and get a weekly compliance briefing with action items.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 10,
    timeSaved: 120,
    completionCount: 78,
    rating: 4.7,
    isPro: true,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'URLs of regulatory bodies and agencies relevant to your industry (e.g. SEC.gov, FDA.gov, ICO.org.uk, state-specific sites).',
      'Your industry and the specific regulations that apply to your business.',
      'Current compliance status — what you already comply with so the AI can identify gaps from new rules.'
    ],
    expectedOutcome: 'A weekly compliance intelligence briefing showing new regulatory developments, how they affect your business, required actions, and deadlines — preventing costly compliance surprises.',
    agentAutomation: {
      description: 'Deploy a weekly agent that scrapes regulatory websites for new rules, guidance, and enforcement actions, then emails you a prioritised compliance action plan.',
      trigger: 'Every Monday at 7 AM.',
      actions: [
        'Scrape each regulatory site URL via Firecrawl for new postings.',
        'Filter for developments relevant to your industry and business.',
        'Assess impact: HIGH (requires immediate action) / MEDIUM (plan needed) / LOW (awareness only).',
        'Generate a compliance action plan with deadlines.',
        'Email the weekly compliance briefing.'
      ],
      setupSteps: [
        { title: 'Enter regulatory site URLs', description: 'Add the URLs of regulatory bodies, industry watchdogs, and compliance news sources relevant to your business.' },
        { title: 'Describe your regulatory landscape', description: 'Enter your industry, business activities, and current compliance certifications so the AI can filter relevant changes.' },
        { title: 'Set your schedule', description: 'Weekly on Monday is recommended — gives you the full week to act on new compliance requirements.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Regulatory sites are hard to scrape',
        solution: 'Government sites often have RSS feeds or specific news/updates pages. Use those URLs instead of the homepage. For example, use FDA.gov/news-events rather than FDA.gov.'
      },
      {
        problem: 'Too much noise — irrelevant regulations flagged',
        solution: 'Be very specific about your industry activities. Instead of \"healthcare\" specify \"telehealth services in Texas for Medicare patients\". Specificity dramatically improves filtering.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-ci-1', title: 'Competitor Intelligence Tracker', slug: 'competitor-intelligence-tracker' }
    ],
    steps: [
      {
        id: 'smb-fc-10-s1',
        stepNumber: 1,
        title: 'Scrape Regulatory Sources',
        instruction: 'Enter the URLs of regulatory bodies, industry associations, and compliance news sources relevant to your business. Firecrawl scrapes them for the latest updates.',
        promptTemplate: 'Analyse these regulatory sources for new compliance developments:\\n\\n**Regulatory Site URLs (scraped via Firecrawl):**\\n[Scrape Regulatory URLs]\\n\\n**My Industry:** [Your Industry]\\n**My Business Activities:** [Your Business Activities]\\n**Current Compliance:** [Your Current Certifications and Compliance]\\n**Geography:** [Your Operating Regions]\\n\\nFrom the scraped content, identify ALL new regulatory developments. For each one found:\\n\\n| Development | Agency | Effective Date | Impact Level | Affects Our Business? |\\n|---|---|---|---|---|\\n\\nImpact Level: HIGH (requires action) / MEDIUM (plan needed) / LOW (awareness only)\\nOnly include developments that are directly or indirectly relevant to our business activities.',
        expectedOutput: 'A filtered table of relevant regulatory developments with effective dates, impact levels, and relevance assessment.',
        tips: 'Use the regulatory body\'s \"news\" or \"updates\" or \"recent changes\" page URL for the most focused results.'
      },
      {
        id: 'smb-fc-10-s2',
        stepNumber: 2,
        title: 'Compliance Action Plan',
        instruction: 'The AI creates a prioritised action plan for each HIGH and MEDIUM impact regulatory change, with specific steps and deadlines.',
        promptTemplate: 'For each HIGH and MEDIUM impact regulatory development identified above, create a COMPLIANCE ACTION PLAN:\\n\\n## For Each Development:\\n\\n### [Regulation Name/Title]\\n**Impact:** [HIGH/MEDIUM]\\n**Effective Date:** [Date]\\n**Summary:** What changed in plain English (2-3 sentences, no legal jargon)\\n\\n**What This Means For Us:**\\n- Specific business processes affected\\n- Current gaps between our practices and the new requirement\\n\\n**Required Actions:**\\n1. [Specific action] — Deadline: [Date] — Owner: [Suggested role]\\n2. [Specific action] — Deadline: [Date] — Owner: [Suggested role]\\n\\n**Risk of Non-Compliance:**\\n- Potential penalties, fines, or business impact\\n\\n**Resources Needed:**\\n- Estimated cost and time to comply\\n\\n## Priority Summary\\nRank all actions by: Deadline urgency × Impact severity',
        expectedOutput: 'A detailed compliance action plan with specific steps, deadlines, responsible roles, non-compliance risks, and a priority ranking.',
        tips: 'The most expensive compliance failure is the one you did not see coming. Even LOW impact items should be filed for quarterly review.'
      }
    ]
  },
  {
    id: 'smb-fc-11',
    slug: 'supplier-price-tracker',
    title: 'Supplier Price Tracker',
    subtitle: 'Monitor your suppliers and vendors for price changes, new product launches, and bulk discount updates. Never miss a price hike or savings opportunity.',
    category: 'Operations',
    difficulty: 'Beginner',
    timeToComplete: 8,
    timeSaved: 60,
    completionCount: 134,
    rating: 4.6,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'Pricing page URLs for your key suppliers and vendors.',
      'Your current supplier costs for comparison.',
      'Alternative suppliers you want to benchmark against.'
    ],
    expectedOutcome: 'A weekly supplier pricing report showing current prices vs. your contracted rates, any detected changes, and recommendations for renegotiation or switching opportunities.',
    agentAutomation: {
      description: 'Deploy a weekly agent that scrapes supplier pricing pages and alerts you to changes — price increases you need to budget for, new discounts you can negotiate, or cheaper alternatives available.',
      trigger: 'Every Thursday at 8 AM.',
      actions: [
        'Scrape each supplier pricing page via Firecrawl.',
        'Compare current prices against your existing contracts.',
        'Detect any changes from typical pricing.',
        'Identify potential savings from alternative suppliers.',
        'Email the supplier pricing report.'
      ],
      setupSteps: [
        { title: 'Enter supplier pricing URLs', description: 'Add the pricing or product catalog page URLs for your current suppliers and any alternatives you want to track.' },
        { title: 'Enter your current costs', description: 'List your current contracted rates or recent invoice prices so the AI can compare.' },
        { title: 'Set your schedule', description: 'Weekly on Thursday recommended — gives you time to act before month-end procurement cycles.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Supplier does not have a public pricing page',
        solution: 'Try scraping their product catalog pages instead — even without explicit prices, changes in product descriptions, minimum order quantities, or packaging can signal pricing shifts.'
      },
      {
        problem: 'Prices require a login or quote request',
        solution: 'Use distributor or marketplace sites that list the same products (e.g. Amazon Business, Alibaba, industry-specific marketplaces) as proxy pricing sources.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-fc-3', title: 'Pricing Intelligence Agent', slug: 'pricing-intelligence-agent' }
    ],
    steps: [
      {
        id: 'smb-fc-11-s1',
        stepNumber: 1,
        title: 'Scrape Supplier Pricing',
        instruction: 'Enter the pricing or catalog page URLs for your suppliers and any alternatives. Firecrawl extracts current pricing information.',
        promptTemplate: 'Analyse supplier pricing from these scraped sources:\\n\\n**Supplier Pricing Pages (scraped via Firecrawl):**\\n[Scrape Supplier URLs]\\n\\n**My Current Costs:**\\n[Your Current Supplier Costs]\\n\\nFor EACH supplier, extract all visible pricing information:\\n\\n| Supplier | Product/Service | Listed Price | Unit | Min Order | My Current Cost | Difference |\\n|---|---|---|---|---|---|---|\\n\\nFlag any prices that are HIGHER than what I currently pay (potential increase coming) or LOWER than what I currently pay (savings opportunity).',
        expectedOutput: 'A detailed supplier pricing comparison table with your current costs vs. listed prices, flagged increases and savings opportunities.',
        tips: 'Include both your current suppliers AND 2-3 alternative suppliers for the same products. This gives you leverage in negotiations.'
      },
      {
        id: 'smb-fc-11-s2',
        stepNumber: 2,
        title: 'Procurement Strategy Recommendations',
        instruction: 'The AI analyses the pricing landscape and provides specific recommendations for cost optimisation.',
        promptTemplate: 'Based on the supplier pricing comparison above, provide PROCUREMENT STRATEGY RECOMMENDATIONS:\\n\\n## Cost Alert: Price Increases Detected\\nList any products where the supplier\'s current price exceeds your contracted rate. For each:\\n- How much higher (% and absolute)\\n- Whether to renegotiate, switch suppliers, or absorb the increase\\n- Timing recommendation\\n\\n## Savings Opportunities\\nList any products where you could save money. For each:\\n- Alternative supplier and their price\\n- Estimated annual savings if you switched\\n- Any switching costs or risks to consider\\n\\n## Negotiation Talking Points\\nFor your top 3 spending categories, provide:\\n- Your leverage (alternative suppliers, volume, loyalty)\\n- Specific ask (target price, volume discount, payment terms)\\n- Best timing to renegotiate\\n\\n## Total Potential Impact\\nSum up all identified savings opportunities. What is the total annual impact if you act on all recommendations?',
        expectedOutput: 'A complete procurement strategy with price alerts, savings opportunities, negotiation talking points, and total potential financial impact.',
        tips: 'Keep a record of these reports over time. A pattern of creeping price increases is powerful leverage in your next contract renegotiation.'
      }
    ]
  },
  {
    id: 'smb-fc-12',
    slug: 'industry-news-digest',
    title: 'Industry News Digest',
    subtitle: 'Stop reading 10 industry blogs. Scrape them all automatically and get one clean daily digest with the 5 stories that actually matter to your business.',
    category: 'Strategy',
    difficulty: 'Beginner',
    timeToComplete: 5,
    timeSaved: 30,
    completionCount: 512,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'URLs of 5-10 industry blogs, news sites, and thought leader pages you want to monitor.',
      'Your specific interests and business focus so the AI can prioritise relevant stories.',
      'How you want the digest delivered — email, or as a workspace report.'
    ],
    expectedOutcome: 'A daily or weekly digest email containing the top 5 industry stories that matter to your business, each summarised in 2-3 sentences with a \"why it matters to you\" analysis and a link to the full article.',
    agentAutomation: {
      description: 'Deploy a daily agent that scrapes your curated list of industry sources, identifies the most important stories, and emails you a 2-minute-read digest before your morning coffee.',
      trigger: 'Every weekday at 6:30 AM.',
      actions: [
        'Scrape each news source URL via Firecrawl.',
        'Identify the most recent articles and developments.',
        'Filter and rank by relevance to your business.',
        'Summarise the top 5 stories.',
        'Email the morning digest.'
      ],
      setupSteps: [
        { title: 'Enter your news source URLs', description: 'Add the blog or news page URLs for industry publications, analyst blogs, competitor blogs, and thought leaders you follow.' },
        { title: 'Define your focus areas', description: 'What topics matter most? E.g. \"AI in healthcare\", \"SaaS pricing trends\", \"European fintech regulation\". This helps the AI prioritise.' },
        { title: 'Set your schedule', description: 'Daily at 6:30 AM recommended — read it before your first meeting. Weekly is also fine for less fast-moving industries.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Digest contains old stories I have already seen',
        solution: 'Make sure you are entering the blog\'s main page or latest posts page, not a specific article URL. The AI looks for the most recent content visible on the page.'
      },
      {
        problem: 'Stories are too general and not relevant',
        solution: 'Be more specific with your focus areas. Instead of \"technology news\" try \"enterprise AI adoption trends affecting B2B SaaS companies in financial services\". Specificity is everything.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-ci-1', title: 'Competitor Intelligence Tracker', slug: 'competitor-intelligence-tracker' }
    ],
    steps: [
      {
        id: 'smb-fc-12-s1',
        stepNumber: 1,
        title: 'Scrape and Curate Industry Sources',
        instruction: 'Enter the URLs of industry blogs, news sites, and thought leader pages. Firecrawl scrapes them all and the AI identifies the most recent content.',
        promptTemplate: 'Analyse these industry news sources for the latest developments:\\n\\n**News Source URLs (scraped via Firecrawl):**\\n[Scrape News Source URLs]\\n\\n**My Industry:** [Your Industry]\\n**My Focus Areas:** [Your Focus Areas]\\n**My Business:** [Your Business Description]\\n\\nFrom ALL scraped sources, identify the most recent articles and developments. Then select the TOP 5 stories that are most relevant to my business and focus areas.\\n\\nFor each of the top 5:\\n\\n## [Story #] — [Headline]\\n**Source:** [Publication name]\\n**Summary:** [2-3 sentence summary of what happened]\\n**Why It Matters to You:** [1-2 sentences connecting this story specifically to my business]\\n**Action Required:** NONE / MONITOR / ACT — with specific suggestion if ACT\\n**Read Full:** [URL if available]\\n\\nOrder by relevance to my business, not by recency.',
        expectedOutput: 'A curated digest of the top 5 industry stories, each with a summary, business relevance analysis, and action recommendation.',
        tips: 'The best sources to include are: 1-2 major industry publications, 2-3 competitor blogs, and 2-3 niche analyst or thought leader pages.'
      },
      {
        id: 'smb-fc-12-s2',
        stepNumber: 2,
        title: 'Weekly Trends & Implications',
        instruction: 'Run this at the end of each week to identify emerging trends from the week\'s stories and strategic implications for your business.',
        promptTemplate: 'Based on all the industry stories and developments identified this week, create a WEEKLY TREND ANALYSIS:\\n\\n## Emerging Trends\\nWhat patterns or themes are appearing across multiple sources? List 2-3 emerging trends with evidence from the stories.\\n\\n## Industry Shift Signals\\nAre any major shifts happening? New technology, regulatory changes, market consolidation, customer behaviour changes?\\n\\n## Implications for Our Business\\nFor each trend identified:\\n- How could this affect us in the next 3-6 months?\\n- Should we accelerate, pivot, or prepare for anything?\\n- Is there a first-mover opportunity?\\n\\n## One Thing to Do This Week\\nBased on everything above, what is the single most important action we should take this week? Be specific.',
        expectedOutput: 'A weekly trend analysis with emerging patterns, industry shift signals, business implications, and one clear action item.',
        tips: 'After running this for a month, you will have a trend radar that no one else in your company has. Use it to be the most informed person in strategy meetings.'
      }
    ]
  },
  {
    id: 'smb-fc-13',
    slug: 'customer-expansion-radar',
    title: 'Customer Expansion Radar',
    subtitle: 'Scrape your existing customers\' websites monthly. Detect growth signals — new products, hiring sprees, funding rounds — and surface upsell and cross-sell opportunities.',
    category: 'Customer Success',
    difficulty: 'Intermediate',
    timeToComplete: 10,
    timeSaved: 90,
    completionCount: 96,
    rating: 4.8,
    isPro: true,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'Website URLs of your top 10-20 customers.',
      'Your full product catalog or service offerings — especially things they are not currently buying.',
      'Their current contract or subscription details (what they already use).'
    ],
    expectedOutcome: 'A monthly expansion intelligence report for each customer, highlighting growth signals from their website and matching those signals to upsell/cross-sell opportunities from your product lineup.',
    agentAutomation: {
      description: 'Deploy a monthly agent that scrapes your customer websites, detects business changes and growth signals, and emails your account management team a prioritised upsell report.',
      trigger: 'First Monday of each month at 9 AM.',
      actions: [
        'Scrape each customer website via Firecrawl.',
        'Detect growth signals: new products, hiring, partnerships, expansion.',
        'Match growth signals to relevant products/services they do not currently use.',
        'Prioritise upsell opportunities by estimated revenue impact.',
        'Email the monthly expansion report to the CS team.'
      ],
      setupSteps: [
        { title: 'Enter customer website URLs', description: 'Add website URLs for your top customers. Focus on the ones with the most expansion potential.' },
        { title: 'List your offerings', description: 'Enter your full product/service catalog, especially features, tiers, or add-ons they could upgrade to.' },
        { title: 'Set your schedule', description: 'Monthly on the first Monday is recommended to align with quarterly business reviews.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Customer website has not changed',
        solution: 'Supplement with their LinkedIn company page and blog. Also check press release pages (/press, /news). Companies often announce changes on social media before updating their website.'
      },
      {
        problem: 'Upsell recommendations are too generic',
        solution: 'Be more specific about what each customer currently uses. The gap between \"what they have\" and \"what they could have\" is where the best upsell opportunities live.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-fc-6', title: 'Lead Research Enricher', slug: 'lead-research-enricher' }
    ],
    steps: [
      {
        id: 'smb-fc-13-s1',
        stepNumber: 1,
        title: 'Scrape Customer Websites for Growth Signals',
        instruction: 'Enter the website URLs of your key customers. Firecrawl scrapes them and the AI detects business changes and growth signals.',
        promptTemplate: 'Analyse these customer websites for growth signals and expansion opportunities:\\n\\n**Customer Website URLs (scraped via Firecrawl):**\\n[Scrape Customer URLs]\\n\\n**My Product/Service Catalog:**\\n[Your Full Product Catalog]\\n\\n**What They Currently Use:**\\n[Current Customer Contracts]\\n\\nFor EACH customer, analyse the scraped content for GROWTH SIGNALS:\\n\\n| Customer | Signal Type | Evidence | Confidence | Expansion Opportunity |\\n|---|---|---|---|---|\\n\\nSignal Types to look for:\\n- NEW PRODUCT LAUNCH (they are expanding their offering)\\n- HIRING SPREE (team growth = budget growth)\\n- NEW MARKET ENTRY (geographic or vertical expansion)\\n- FUNDING/REVENUE (capital to invest)\\n- PARTNERSHIP (new integrations or collaborations)\\n- TECH UPGRADE (changing their stack)\\n\\nConfidence: HIGH (explicitly stated) / MEDIUM (strongly implied) / LOW (inferred)',
        expectedOutput: 'A growth signal table for each customer with evidence, confidence levels, and matched expansion opportunities.',
        tips: 'Scrape the /careers, /blog, /press, and /about pages in addition to the homepage for the richest signal detection.'
      },
      {
        id: 'smb-fc-13-s2',
        stepNumber: 2,
        title: 'Expansion Playbook per Customer',
        instruction: 'The AI creates a specific expansion strategy for each customer showing growth signals, matched to products they should buy from you.',
        promptTemplate: 'For each customer with HIGH or MEDIUM confidence growth signals, create an EXPANSION PLAYBOOK:\\n\\n## [Customer Name]\\n\\n**Current Relationship:** What they currently use from us\\n**Growth Signals Detected:** Summary of what changed\\n\\n**Recommended Expansion:**\\n1. **Primary Upsell:** The #1 product/service they should add, and why the growth signal makes it timely\\n2. **Secondary Upsell:** A second relevant offering\\n3. **Estimated Additional Revenue:** Rough estimate based on typical pricing\\n\\n**Outreach Strategy:**\\n- Who to contact (suggested role/title at the customer)\\n- Opening line that references their specific growth signal\\n- Timing recommendation (when to reach out)\\n\\n**Conversation Starter:**\\nDraft a 3-sentence email opening that:\\n1. Congratulates them on [specific growth signal]\\n2. Connects it to a relevant challenge they might be facing\\n3. Proposes a brief check-in to discuss how you can help\\n\\n## Overall Portfolio Summary\\nRank all customers by expansion revenue potential. Show top 5 priorities.',
        expectedOutput: 'Individual expansion playbooks per customer with upsell recommendations, outreach strategies, and a portfolio-level priority ranking.',
        tips: 'The best time to approach a customer for expansion is right after a growth signal — they have budget momentum and are actively building. Timing is everything.'
      }
    ]
  },
  {
    id: 'smb-fc-14',
    slug: 'directory-listing-auditor',
    title: 'Directory Listing Auditor',
    subtitle: 'Scrape your business listings across Yelp, Google, Capterra, G2, and industry directories. Find inconsistencies in your name, address, phone, and description before customers do.',
    category: 'Marketing',
    difficulty: 'Beginner',
    timeToComplete: 8,
    timeSaved: 60,
    completionCount: 187,
    rating: 4.7,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'URLs of all your business directory listings (Google Business, Yelp, Capterra, G2, industry-specific directories).',
      'Your correct/canonical business information: name, address, phone, website, description, hours.',
      'Any specific branding guidelines for how your business name and description should appear.'
    ],
    expectedOutcome: 'A complete audit of your business listings across all directories, with every inconsistency flagged and specific corrections provided — ready to update.',
    agentAutomation: {
      description: 'Deploy a monthly agent that scrapes all your directory listings and emails you an inconsistency report with exact corrections needed for each listing.',
      trigger: 'First Wednesday of each month at 9 AM.',
      actions: [
        'Scrape each directory listing URL via Firecrawl.',
        'Compare each listing against your canonical business information.',
        'Flag any inconsistencies in name, address, phone, hours, description.',
        'Generate exact corrections for each inconsistency.',
        'Email the monthly listing audit report.'
      ],
      setupSteps: [
        { title: 'Enter your listing URLs', description: 'Add the URLs of your business profiles on Google, Yelp, Capterra, G2, BBB, and any industry directories.' },
        { title: 'Enter your correct information', description: 'Provide your canonical business name, address, phone, website, hours, and description exactly as they should appear everywhere.' },
        { title: 'Set your schedule', description: 'Monthly is recommended — listings rarely change without you knowing, but drift happens over time.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Cannot scrape Google Business listing',
        solution: 'Use your Google Maps URL (the one that starts with google.com/maps/place/). This is publicly accessible and contains your business information.'
      },
      {
        problem: 'Listing shows old information I already updated',
        solution: 'Some directories cache old information. If you have updated the listing but it still shows old data, note the date and check again in 2 weeks. If it persists, contact the directory\'s support team.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-fc-1', title: 'Brand Mention Monitor', slug: 'brand-mention-monitor' }
    ],
    steps: [
      {
        id: 'smb-fc-14-s1',
        stepNumber: 1,
        title: 'Scrape and Compare All Listings',
        instruction: 'Enter the URLs of your business listings across all directories. Firecrawl scrapes each one and the AI compares against your correct information.',
        promptTemplate: 'Audit my business directory listings for inconsistencies:\\n\\n**Directory Listing URLs (scraped via Firecrawl):**\\n[Scrape Directory Listing URLs]\\n\\n**My Correct Business Information:**\\nBusiness Name: [Your Correct Business Name]\\nAddress: [Your Correct Address]\\nPhone: [Your Correct Phone]\\nWebsite: [Your Correct Website]\\nHours: [Your Correct Hours]\\nDescription: [Your Correct Description]\\n\\nFor EACH listing, compare the scraped information against my correct details:\\n\\n| Directory | Name Match? | Address Match? | Phone Match? | Website Match? | Hours Match? | Description Accurate? | Issues Found |\\n|---|---|---|---|---|---|---|---|\\n\\nFor any mismatches, show EXACTLY what the listing says vs. what it should say.',
        expectedOutput: 'A comprehensive audit table comparing every listing against your canonical information, with all inconsistencies flagged.',
        tips: 'NAP consistency (Name, Address, Phone) across directories is a major local SEO factor. Inconsistencies hurt your Google ranking.'
      },
      {
        id: 'smb-fc-14-s2',
        stepNumber: 2,
        title: 'Correction Action Plan',
        instruction: 'The AI generates specific corrections for each inconsistency and prioritises which listings to fix first based on SEO and customer impact.',
        promptTemplate: 'Based on the listing audit above, create a CORRECTION ACTION PLAN:\\n\\n## Inconsistency Summary\\n- Total listings audited: [count]\\n- Listings with issues: [count]\\n- Total issues found: [count]\\n\\n## Corrections Needed (Prioritised)\\nFor each listing with issues, provide:\\n\\n### [Directory Name]\\n**URL:** [listing URL]\\n**Priority:** HIGH (Google/Yelp) / MEDIUM (industry directories) / LOW (minor directories)\\n**Issues:**\\n- Field: [what is wrong] — Currently says: \"[wrong text]\" → Should say: \"[correct text]\"\\n\\n## SEO Impact Assessment\\n- How badly are these inconsistencies likely affecting your local search ranking?\\n- Which fixes will have the biggest SEO impact?\\n\\n## Correction Checklist\\nA simple checklist format you can follow to update each listing, ordered by priority.',
        expectedOutput: 'A prioritised correction plan with exact text changes for each listing, SEO impact assessment, and a step-by-step checklist.',
        tips: 'Fix Google Business and Yelp first — these have the highest impact on local SEO and customer trust. Then work down to smaller directories.'
      }
    ]
  },
  {
    id: 'smb-fc-15',
    slug: 'salary-benchmark-scanner',
    title: 'Salary Benchmark Scanner',
    subtitle: 'Scrape job boards for similar roles at competitor companies. Extract salary ranges, benefits, and perks — so you know exactly what the market is paying.',
    category: 'Operations',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 60,
    completionCount: 108,
    rating: 4.6,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'Job board URLs with searches for roles you are hiring for or benchmarking (e.g. LinkedIn Jobs, Indeed, Glassdoor searches).',
      'The specific roles you want to benchmark: titles, seniority levels, locations.',
      'Your current compensation packages for comparison.'
    ],
    expectedOutcome: 'A salary benchmarking report showing market rates for your key roles across seniority levels, with clear positioning of your current offers vs. the market and specific recommendations for adjustment.',
    troubleshooting: [
      {
        problem: 'Job postings do not include salary information',
        solution: 'Try Glassdoor salary pages or Levels.fyi for tech roles. Also try filtering job boards for postings that include salary (many US states now require it). Indeed and LinkedIn often show estimated salary ranges.'
      },
      {
        problem: 'Wide salary ranges make benchmarking hard',
        solution: 'Focus on the midpoint of each range and compare midpoints. Also pay attention to location — a \"$120K-180K\" range usually means $180K in SF and $120K in Austin.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-fc-4', title: 'Job Market Scout', slug: 'job-market-scout' }
    ],
    steps: [
      {
        id: 'smb-fc-15-s1',
        stepNumber: 1,
        title: 'Scrape Job Boards for Salary Data',
        instruction: 'Enter job board URLs with search results for the roles you want to benchmark. Firecrawl extracts salary ranges, benefits, and requirements from the listings.',
        promptTemplate: 'Analyse these job board pages for salary benchmarking data:\\n\\n**Job Board URLs (scraped via Firecrawl):**\\n[Scrape Job Board URLs]\\n\\n**Roles I Am Benchmarking:**\\n[Your Target Roles]\\n\\n**My Current Compensation:**\\n[Your Current Salary Packages]\\n\\n**My Location:** [Your Office Location]\\n\\nFrom the scraped job listings, extract compensation data for each relevant role:\\n\\n| Company | Role Title | Seniority | Location | Salary Range | Benefits Mentioned | Remote? |\\n|---|---|---|---|---|---|---|\\n\\nAlso note any non-monetary compensation mentioned: equity, bonuses, PTO, remote work policy, signing bonus, etc.',
        expectedOutput: 'A comprehensive salary data table extracted from job board listings with ranges, benefits, remote policies, and non-monetary compensation.',
        tips: 'For the best data, scrape Glassdoor salary pages, LinkedIn Jobs with salary filter on, and Indeed with \"salary\" in the search. Also try levels.fyi for tech roles.'
      },
      {
        id: 'smb-fc-15-s2',
        stepNumber: 2,
        title: 'Compensation Strategy Analysis',
        instruction: 'The AI analyses the market data and provides specific recommendations for your compensation packages.',
        promptTemplate: 'Based on the salary benchmarking data above and my current compensation packages, create a COMPENSATION STRATEGY ANALYSIS:\\n\\n## Market Rate Summary\\nFor each benchmarked role:\\n- Market range: $X - $Y (25th to 75th percentile)\\n- Market midpoint: $X\\n- Our current offer: $X\\n- Our position: ABOVE / AT / BELOW market\\n\\n## Roles At Risk\\nFlag any roles where we are paying significantly below market (>10% under midpoint). These are flight risks.\\n\\n## Roles Over-Indexed\\nFlag any roles where we are paying significantly above market (>10% over midpoint). These may not need increases.\\n\\n## Recommended Adjustments\\nFor each role:\\n- Specific salary adjustment recommendation\\n- Priority: HIGH (retention risk) / MEDIUM / LOW\\n- Estimated budget impact\\n\\n## Total Budget Impact\\nSum all recommended adjustments. What is the total annual cost to bring all roles to competitive market positioning?\\n\\n## Non-Salary Levers\\nBased on what competitors are offering, what non-salary benefits should we consider adding? (remote work, equity, PTO, signing bonuses, etc.)',
        expectedOutput: 'A complete compensation strategy with market positioning, at-risk roles, specific adjustment recommendations, budget impact, and non-salary improvement suggestions.',
        tips: 'Being at the 50th percentile is market-matching. Aim for 60th-75th percentile for critical roles you cannot afford to lose. Below 25th percentile = expect turnover.'
      }
    ]
  },
  {
    id: 'smb-fc-16',
    slug: 'employer-brand-monitor',
    title: 'Employer Brand Monitor',
    subtitle: 'Scrape Glassdoor, Indeed, and Blind reviews about your company. Understand what employees and candidates really think — and fix issues before they become viral.',
    category: 'Operations',
    difficulty: 'Beginner',
    timeToComplete: 8,
    timeSaved: 45,
    completionCount: 92,
    rating: 4.7,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'Your company profile URLs on Glassdoor, Indeed, Blind, Comparably, or other employer review sites.',
      'Your current employer value proposition and any known internal issues you are already working on.',
      'Competitor employer profiles for comparison (optional but valuable).'
    ],
    expectedOutcome: 'A monthly employer brand health report showing employee sentiment trends, recurring themes in reviews, comparison against competitor employer brands, and specific HR actions to address issues.',
    agentAutomation: {
      description: 'Deploy a monthly agent that scrapes employee review sites, analyses sentiment trends, compares your employer brand against competitors, and emails the HR team an actionable report.',
      trigger: 'Last Friday of each month at 9 AM.',
      actions: [
        'Scrape your employer review profiles via Firecrawl.',
        'Categorise reviews by theme: culture, compensation, leadership, growth, work-life balance.',
        'Calculate sentiment scores and identify trends.',
        'Compare against competitor employer profiles if provided.',
        'Email the monthly employer brand report to HR.'
      ],
      setupSteps: [
        { title: 'Enter your employer review URLs', description: 'Add your Glassdoor, Indeed, Comparably, and Blind company profile URLs.' },
        { title: 'Add competitor employer profiles', description: 'Optional: add competitor employer profiles for benchmarking your employer brand against the competition.' },
        { title: 'Set your schedule', description: 'Monthly on the last Friday is recommended — review before your monthly HR sync.' }
      ],
      tools: ['Firecrawl', 'Claude', 'Hoursback Autopilot']
    },
    troubleshooting: [
      {
        problem: 'Glassdoor profile has very few reviews',
        solution: 'If you have fewer than 10 reviews, the analysis will be limited. Consider asking satisfied employees to leave honest reviews. Also check Indeed and Comparably — they may have reviews Glassdoor does not.'
      },
      {
        problem: 'Reviews seem to be from disgruntled ex-employees only',
        solution: 'This is common — unhappy people are more likely to leave reviews. The AI accounts for negativity bias, but the themes in negative reviews still reveal real issues worth addressing.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-fc-15', title: 'Salary Benchmark Scanner', slug: 'salary-benchmark-scanner' }
    ],
    steps: [
      {
        id: 'smb-fc-16-s1',
        stepNumber: 1,
        title: 'Scrape Employer Review Profiles',
        instruction: 'Enter your company profile URLs on employer review sites. Optionally add competitor employer profiles for comparison. Firecrawl scrapes the latest reviews.',
        promptTemplate: 'Analyse employer reviews from these platforms:\\n\\n**My Company Review URLs (scraped via Firecrawl):**\\n[Scrape Employer Review URLs]\\n\\n**Competitor Employer URLs (optional, scraped):**\\n[Scrape Competitor Employer URLs]\\n\\n**My Company:** [Your Company Name]\\n\\nFor my company, analyse ALL visible reviews:\\n\\n## Overall Ratings\\n| Platform | Overall Rating | # of Reviews | Recommend to Friend % | CEO Approval % |\\n|---|---|---|---|---|\\n\\n## Review Themes\\nCategorise all reviews by theme and sentiment:\\n\\n| Theme | Positive Mentions | Negative Mentions | Net Sentiment |\\n|---|---|---|---|\\n| Culture & Values | | | |\\n| Compensation & Benefits | | | |\\n| Leadership & Management | | | |\\n| Career Growth | | | |\\n| Work-Life Balance | | | |\\n| Diversity & Inclusion | | | |\\n| Job Security | | | |\\n\\n## Strongest Praise (Top 3 themes people love)\\n## Biggest Complaints (Top 3 themes people criticise)',
        expectedOutput: 'A comprehensive employer brand analysis with ratings, themed sentiment breakdown, top praise areas, and biggest complaint themes.',
        tips: 'For Glassdoor, use the reviews tab URL (e.g. glassdoor.com/Reviews/company-reviews-XXXXX.htm).'
      },
      {
        id: 'smb-fc-16-s2',
        stepNumber: 2,
        title: 'Employer Brand Action Plan',
        instruction: 'The AI creates a specific action plan to address employee sentiment issues and strengthen your employer brand, with competitor benchmarking if provided.',
        promptTemplate: 'Based on the employer review analysis above, create an EMPLOYER BRAND ACTION PLAN:\\n\\n## Employer Brand Score Card\\nRate our employer brand 1-10 across:\\n- Overall Attractiveness to Candidates\\n- Employee Retention Risk\\n- Culture Perception\\n- Compensation Competitiveness\\n- Leadership Trust\\n\\n## Competitor Comparison (if data available)\\nHow does our employer brand compare to competitors? Where are we ahead? Where are we behind?\\n\\n## Top 3 Issues to Address\\nFor each issue:\\n1. **The Problem:** What employees are saying (with quotes if available)\\n2. **The Impact:** How this affects hiring and retention\\n3. **Recommended Action:** Specific, concrete step to improve this\\n4. **Expected Timeline:** When employees would notice the change\\n5. **How to Measure:** What metric would show improvement\\n\\n## Quick Wins (Next 30 Days)\\nList 2-3 things the company can do immediately to improve employer sentiment. These should be low-cost, high-visibility actions.\\n\\n## Long-Term Initiatives (Next 6 Months)\\nList 2-3 structural changes that would address the root causes of dissatisfaction.',
        expectedOutput: 'A complete employer brand action plan with scorecard, competitor comparison, prioritised issues with concrete actions, quick wins, and long-term initiatives.',
        tips: 'Quick wins matter more than you think. Something as simple as improving onboarding or adding a monthly team lunch can shift employer sentiment within one quarter.'
      }
    ]
  },
  // --- Architecture Firm Playbooks ---
  {
    id: 'smb-arch-1',
    slug: 'rfp-response-builder',
    title: 'RFP Response Builder',
    subtitle: 'Turn a raw RFP document into a structured, win-theme-driven proposal outline in 20 minutes',
    category: 'Business Development',
    difficulty: 'Intermediate',
    timeToComplete: 20,
    timeSaved: 180,
    completionCount: 312,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Firecrawl'],
    beforeYouStart: [
      'The full RFP document (PDF or text)',
      'Your firm\'s project portfolio summary',
      'Your standard rate card or fee structure',
      '30 minutes of focused time'
    ],
    expectedOutcome: 'A complete proposal outline with executive summary, win themes, relevant project examples, fee narrative, and a differentiators section — ready to hand off to your writing team.',
    troubleshooting: [
      {
        problem: 'AI generates generic win themes that don\'t match our firm',
        solution: 'Feed it 2-3 lines from your firm\'s actual mission statement and past award submissions before asking for win themes. The more specific your input, the more tailored the output.'
      },
      {
        problem: 'RFP is too long to paste into Claude',
        solution: 'Paste only the Scope of Work, Evaluation Criteria, and Submission Requirements sections — those are the only parts you need for a strong outline.'
      },
      {
        problem: 'Fee narrative feels off',
        solution: 'Never ask AI to set fees. Provide your locked fee table and ask it only to write the narrative justification around it.'
      }
    ],
    agentAutomation: {
      description: 'Automatically monitor public procurement portals for new RFPs matching your firm\'s project types, summarise them, and draft an initial go/no-go brief each morning.',
      trigger: 'Daily at 7 AM — checks procurement portals for new RFPs',
      actions: [
        'Scrape configured procurement portal URLs for new RFP listings',
        'Filter for project types matching your firm\'s keywords (e.g. "mixed-use", "civic", "adaptive reuse")',
        'Summarise each matching RFP: client, deadline, scope, evaluation criteria',
        'Score each opportunity 1-10 against your firm\'s win criteria',
        'Email a daily digest with go/no-go recommendation for each new RFP'
      ],
      setupSteps: [
        { title: 'Configure procurement sources', description: 'Add the URLs of procurement portals you monitor (e.g. state eProcurement, city bids portal, AIA opportunities) to your agent context.' },
        { title: 'Define your project type keywords', description: 'List the project types your firm pursues: e.g. "K-12 education, civic/municipal, affordable housing, mixed-use commercial". The agent uses these to filter irrelevant RFPs.' },
        { title: 'Set your win criteria', description: 'Define what makes a good opportunity for your firm: budget range, geography, project type, client type. The agent scores each RFP against these.' },
        { title: 'Connect your email', description: 'Add your email address so the daily digest lands in your inbox before the morning standup.' }
      ],
      tools: ['Claude', 'Firecrawl', 'Make.com', 'Gmail']
    },
    steps: [
      {
        id: 'smb-arch-1-s1',
        stepNumber: 1,
        title: 'Extract RFP Requirements',
        instruction: 'Paste the full RFP text (or the Scope of Work + Evaluation Criteria sections) and ask Claude to extract the key requirements, evaluation weights, and any mandatory submission elements.',
        promptTemplate: 'I am responding to this RFP on behalf of an architectural firm. Extract and organise the following from the document below:\n\n1. **Project Overview** — what is being designed/built, for whom, and where\n2. **Scope of Services** — what the architect is expected to deliver\n3. **Evaluation Criteria** — how responses will be scored, with weightings if stated\n4. **Mandatory Requirements** — certifications, insurance minimums, format requirements\n5. **Key Deadlines** — submission date, interview date, project milestones\n6. **Unstated Priorities** — based on tone and emphasis, what does this client really care about?\n\nRFP TEXT:\n[Paste RFP here]\n\nOrganise your output as a structured brief I can share with my proposal team.',
        expectedOutput: 'A clean structured summary of the RFP requirements, evaluation criteria, mandatory items, and implied client priorities.',
        tips: 'Pay close attention to evaluation criteria weightings — they tell you exactly where to spend your writing energy.',
        tools: ['Claude']
      },
      {
        id: 'smb-arch-1-s2',
        stepNumber: 2,
        title: 'Define Win Themes',
        instruction: 'Based on the extracted requirements and your firm\'s strengths, generate 3 win themes — the core messages that will run through every section of your proposal.',
        promptTemplate: 'Based on the RFP requirements extracted above, and the following firm strengths, develop 3 WIN THEMES for our proposal.\n\nOur firm\'s relevant strengths:\n[Paste 3-5 bullet points about your firm\'s relevant experience, approach, or differentiators]\n\nA win theme is a short, specific, client-focused statement that:\n- Addresses a stated or implied client need\n- Differentiates our firm from competitors\n- Can be substantiated with evidence (project examples, metrics)\n\nFor each win theme, provide:\n1. The theme headline (1 sentence)\n2. The client need it addresses\n3. Our proof point (which project or credential demonstrates this)\n4. How to weave it through the proposal (executive summary hook, team intro, approach section)',
        expectedOutput: '3 win themes with headlines, proof points, and placement guidance for your proposal.',
        tips: 'The best win themes address something the client specifically called out in the RFP — not just your firm\'s general strengths.',
        tools: ['Claude']
      },
      {
        id: 'smb-arch-1-s3',
        stepNumber: 3,
        title: 'Build the Proposal Outline',
        instruction: 'Generate a full section-by-section outline with talking points, relevant project callouts, and the fee narrative structure.',
        promptTemplate: 'Using the win themes above, create a full PROPOSAL OUTLINE for this RFP.\n\nFor each section, provide:\n- Section title and recommended page length\n- 3-5 bullet points of content to include\n- Which win theme(s) this section should reinforce\n- Recommended project example to reference (I will fill in the actual project name)\n- Opening sentence to set the tone\n\nRequired sections (add others if the RFP specifies):\n1. Cover Letter / Executive Summary\n2. Firm Overview & Relevant Experience\n3. Project Team & Key Personnel\n4. Technical Approach & Methodology\n5. Similar Project Experience\n6. Project Schedule\n7. Fee Proposal Narrative\n\nFee information (do not change these numbers — only write narrative around them):\n[Paste your fee breakdown here]\n\nOutput the outline in a format I can paste directly into a Word document.',
        expectedOutput: 'A complete section-by-section proposal outline with talking points, win theme alignment, and fee narrative — ready for your writing team.',
        tips: 'Send this outline to your team with a 48-hour deadline. The outline does the hardest thinking — the writing should be fast from here.',
        tools: ['Claude']
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-arch-2', title: 'Billable Hours Audit', slug: 'billable-hours-audit' },
      { id: 'smb-arch-3', title: 'Scope Creep Log', slug: 'scope-creep-log' }
    ]
  },
  {
    id: 'smb-arch-2',
    slug: 'billable-hours-audit',
    title: 'Billable Hours Audit',
    subtitle: 'Spot budget overruns and fee bleed before they kill your project margin',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 15,
    timeSaved: 120,
    completionCount: 287,
    rating: 4.8,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Excel'],
    beforeYouStart: [
      'Timesheet export from your practice management system (Deltek, BQE, Monograph, etc.) as CSV',
      'Your contracted fee and phase breakdown for the project',
      'Project start date and current phase'
    ],
    expectedOutcome: 'A clear project health report showing burn rate by phase, projected overrun risk, staff utilisation flags, and a recommended corrective action for any phases in the red.',
    troubleshooting: [
      {
        problem: 'CSV has too many columns and AI gets confused',
        solution: 'Before pasting, delete all columns except: Date, Staff Name, Phase, Hours, Billable Rate. That\'s all the AI needs.'
      },
      {
        problem: 'Phase names in my timesheet don\'t match my fee schedule',
        solution: 'Add a mapping note in your prompt: "Phase code SD = Schematic Design, DD = Design Development" etc. Claude will reconcile them automatically.'
      }
    ],
    agentAutomation: {
      description: 'Automatically pull weekly timesheet data and generate a project health email every Friday — so you know your burn rate before it becomes a problem.',
      trigger: 'Every Friday at 4 PM',
      actions: [
        'Export this week\'s timesheet data from your practice management system via API or email',
        'Calculate hours burned vs budget remaining for each active project phase',
        'Flag any phase exceeding 80% budget consumption before phase completion',
        'Identify staff members significantly over or under their planned allocation',
        'Send a project health digest email to the principal-in-charge of each flagged project'
      ],
      setupSteps: [
        { title: 'Export your fee schedule', description: 'Create a simple spreadsheet with project name, phase, contracted fee, and budgeted hours per phase. This becomes the baseline the agent compares against.' },
        { title: 'Set up your timesheet export', description: 'Configure a weekly automated export from your PM system (most support scheduled CSV exports or API access). The agent needs: date, staff, phase, hours.' },
        { title: 'Define your alert threshold', description: 'Set the burn rate percentage that triggers an alert. 80% is a good default — it gives you time to act before you\'re over budget.' },
        { title: 'Configure recipient emails', description: 'Map each project to the principal or PM who should receive alerts. One email per project keeps it actionable.' }
      ],
      tools: ['Claude', 'Make.com', 'Google Sheets', 'Gmail']
    },
    steps: [
      {
        id: 'smb-arch-2-s1',
        stepNumber: 1,
        title: 'Prepare Your Data',
        instruction: 'Export your timesheet data as CSV and clean it down to the essential columns. Then paste it alongside your contracted fee breakdown.',
        promptTemplate: 'I am an architect reviewing the financial health of a project. Below is our timesheet data and our contracted fee breakdown.\n\nPlease analyse this data and tell me:\n1. Total hours logged to date vs total hours budgeted\n2. Hours and budget consumed by phase, sorted from most at-risk to least\n3. Any phase exceeding 80% of budgeted hours (flag these as OVERRUN RISK)\n4. Any staff member logging significantly more hours than expected for their role\n5. At current burn rate, what is the projected total hours at project completion?\n6. Overall project health rating: Green / Amber / Red — with one-line explanation\n\nCONTRACTED FEE BREAKDOWN:\n[Paste phase names, contracted fees, and budgeted hours]\n\nTIMESHEET DATA (CSV):\n[Paste timesheet export here]',
        expectedOutput: 'A phase-by-phase burn rate analysis with overrun flags, staff utilisation notes, and a projected completion hours estimate.',
        tips: 'If you have multiple projects, run this one project at a time. Mixing projects in one paste leads to confused analysis.',
        tools: ['Claude', 'Excel']
      },
      {
        id: 'smb-arch-2-s2',
        stepNumber: 2,
        title: 'Get Corrective Actions',
        instruction: 'For any phases flagged as Amber or Red, ask Claude to recommend specific corrective actions you can take this week.',
        promptTemplate: 'Based on the burn rate analysis above, the following phases are at risk:\n[Paste the flagged phases from Step 1]\n\nFor each at-risk phase, recommend:\n1. **Root cause hypothesis** — why is this phase burning faster than budgeted?\n2. **Immediate action (this week)** — one specific thing the PM can do to slow the burn\n3. **Client conversation needed?** — yes or no, and if yes, draft a 2-sentence talking point\n4. **Scope adjustment option** — what could we descope or defer without impacting project quality?\n\nKeep recommendations practical and specific to an architectural practice.',
        expectedOutput: 'A corrective action plan for each at-risk phase, with root cause analysis and a draft client talking point if needed.',
        tips: 'The most common root cause is undocumented scope additions. Run this alongside the Scope Creep Log playbook to connect the dots.',
        tools: ['Claude']
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-arch-3', title: 'Scope Creep Log', slug: 'scope-creep-log' },
      { id: 'smb-arch-1', title: 'RFP Response Builder', slug: 'rfp-response-builder' }
    ]
  },
  {
    id: 'smb-arch-3',
    slug: 'scope-creep-log',
    title: 'Scope Creep Log',
    subtitle: 'Document, price, and present out-of-scope requests so every change order sticks',
    category: 'Operations',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 90,
    completionCount: 198,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Google Docs'],
    beforeYouStart: [
      'The original Scope of Services from your contract',
      'Notes or emails documenting the client\'s out-of-scope request',
      'Your standard hourly rates by staff level'
    ],
    expectedOutcome: 'A formal change order memo with scope description, hours estimate, fee, and a client-ready justification — ready to send within 10 minutes of the request.',
    troubleshooting: [
      {
        problem: 'Client pushes back saying "this was always in scope"',
        solution: 'Paste both your original scope of services and the new request into Claude and ask it to identify the exact line where the original scope ends. Use that output verbatim in your response email.'
      },
      {
        problem: 'Not sure how to price the hours',
        solution: 'Use your standard rate card. If you don\'t have one, start with a blended rate: average your staff hourly rates weighted by how much each level would work on this task.'
      }
    ],
    agentAutomation: {
      description: 'Automatically scan your project email threads for out-of-scope language, log each instance, and draft a change order memo — so nothing falls through the cracks.',
      trigger: 'Daily scan of project email inbox',
      actions: [
        'Monitor your project email inbox for messages containing scope-change language ("can you also", "in addition to", "while you\'re at it", "one more thing")',
        'Extract the requested addition and the original scope reference',
        'Auto-generate a draft change order memo with scope description and placeholder fee',
        'Log the item to your Scope Creep Tracker spreadsheet with date, client, project, and status',
        'Send a daily digest of new scope items flagged for your review'
      ],
      setupSteps: [
        { title: 'Connect your project email', description: 'Grant the agent read access to your project email inbox or a specific project folder. Gmail and Outlook both support this via Make.com.' },
        { title: 'Upload your contract scope', description: 'Paste your standard Scope of Services template so the agent knows what is and isn\'t included.' },
        { title: 'Set your rate card', description: 'Add your hourly rates by staff level (Principal, Project Architect, Job Captain, Intern) so the agent can auto-estimate fees.' },
        { title: 'Create your tracker sheet', description: 'Create a Google Sheet with columns: Date, Project, Client, Request Description, Estimated Fee, Status (Pending / Sent / Approved). The agent will write to this automatically.' }
      ],
      tools: ['Claude', 'Make.com', 'Gmail', 'Google Sheets']
    },
    steps: [
      {
        id: 'smb-arch-3-s1',
        stepNumber: 1,
        title: 'Classify the Request',
        instruction: 'Paste the client\'s request alongside your original scope and ask Claude to determine whether it\'s in or out of scope — and why.',
        promptTemplate: 'I am an architect reviewing whether a client request is within our contracted scope of services.\n\nOUR ORIGINAL SCOPE OF SERVICES:\n[Paste the relevant section of your contract]\n\nCLIENT\'S NEW REQUEST:\n[Paste the client email or meeting note describing the request]\n\nPlease tell me:\n1. Is this request within our original contracted scope? Yes / No / Partial\n2. Which specific line of our scope includes or excludes it?\n3. If out of scope, what is the clearest one-sentence explanation for the client?\n4. What additional services would be required to fulfil this request?\n5. Estimated staff time by role: Principal (hrs), Project Architect (hrs), Job Captain (hrs)',
        expectedOutput: 'A clear in/out-of-scope verdict with contract reference, client explanation, and hours estimate by staff level.',
        tips: 'Always get the classification in writing before quoting a fee. It prevents the conversation from jumping to price before the scope is agreed.',
        tools: ['Claude']
      },
      {
        id: 'smb-arch-3-s2',
        stepNumber: 2,
        title: 'Draft the Change Order Memo',
        instruction: 'Use the classification output to generate a formal change order memo ready to send to the client.',
        promptTemplate: 'Based on the scope analysis above, draft a CHANGE ORDER MEMO I can send to my client.\n\nTone: professional but not adversarial. We value this relationship and want to be transparent about how scope changes affect fees.\n\nRate card:\n- Principal: $[X]/hr\n- Project Architect: $[X]/hr\n- Job Captain: $[X]/hr\n\nThe memo should include:\n1. A brief reference to the original scope and contract date\n2. A clear description of the additional service requested\n3. The estimated hours and fee (calculated from the rate card above)\n4. A simple approval line: "Please sign and return to authorise this change order"\n5. A note that work will commence upon written approval\n\nKeep it to one page. Use a professional memo format.',
        expectedOutput: 'A one-page change order memo ready to send, with fee calculation and approval signature line.',
        tips: 'Send the memo the same day the request is made. The longer you wait, the harder it is to price and the more awkward the conversation becomes.',
        tools: ['Claude']
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-arch-2', title: 'Billable Hours Audit', slug: 'billable-hours-audit' },
      { id: 'smb-arch-1', title: 'RFP Response Builder', slug: 'rfp-response-builder' }
    ]
  },
  {
    id: 'smb-humanizer-1',
    slug: 'humanizer-remove-ai-writing',
    title: 'Humanizer: Remove AI Writing Patterns',
    subtitle: 'Strip the 24 telltale signs of AI-generated text from any draft and rewrite it to sound genuinely human.',
    category: 'Content',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 45,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    isNew: true,
    tools: ['Claude'],
    beforeYouStart: [
      'A piece of text you want to humanize (email, article, LinkedIn post, proposal, etc.)',
      'Claude.ai or any Claude API access'
    ],
    expectedOutcome: 'A rewritten version of your text that reads like a real human wrote it — no inflation, no jargon soup, no formulaic structure.',
    troubleshooting: [
      {
        problem: 'The rewrite still sounds stiff or formal',
        solution: 'Add a voice note at the top of the Step 2 prompt: "Write in a casual, first-person tone. Short sentences. No hedging." The more specific the voice instruction, the better Claude calibrates.'
      },
      {
        problem: 'Claude keeps the same structure and just swaps words',
        solution: 'In Step 3, explicitly tell Claude: "Restructure the piece completely. Start with a different angle. Move the most interesting point to the first sentence."'
      },
      {
        problem: 'The output is too short after humanizing',
        solution: 'AI prose is often padded — shorter usually means it\'s working. If you genuinely need more content, add: "Expand each point with a concrete example or specific detail."'
      }
    ],
    steps: [
      {
        id: 'smb-humanizer-s1',
        stepNumber: 1,
        title: 'Paste Your Text',
        instruction: 'Copy the text you want to humanize. This works on anything: emails, LinkedIn posts, blog articles, proposals, cover letters, or any other draft. Paste it below so Claude can audit it in the next step.',
        expectedOutput: 'Your raw text, ready for the AI writing pattern audit.',
        tips: 'Longer pieces (500+ words) benefit most from this process. For short texts like one-paragraph emails, you can skip to Step 2 directly.'
      },
      {
        id: 'smb-humanizer-s2',
        stepNumber: 2,
        title: 'Run the 24-Pattern Audit',
        instruction: 'Paste your text into Claude along with this audit prompt. Claude will flag every instance of AI-typical writing in your draft, organized by pattern type.',
        promptTemplate: `You are an expert editor trained to identify AI-generated writing patterns. Audit the following text against these 24 patterns from Wikipedia's "Signs of AI writing" guide.

For each pattern found, quote the offending phrase and briefly explain why it's flagged.

CONTENT PATTERNS:
1. Significance inflation – words like "pivotal", "transformative", "groundbreaking", "testament to", "marking a moment in the evolution of"
2. Notability name-dropping – citing publications (NYT, Forbes, etc.) without a specific claim or date
3. Superficial -ing analyses – "symbolizing...", "reflecting...", "showcasing..." used without citing sources
4. Promotional language – "nestled within", "breathtaking", "vibrant community"
5. Vague attributions – "experts believe", "studies show", "many people feel" with no specifics
6. Formulaic challenges – "Despite challenges... continues to thrive"

LANGUAGE PATTERNS:
7. AI vocabulary – "Additionally", "Furthermore", "testament", "landscape", "delve into", "showcase", "underscore", "crucial", "vital", "pivotal"
8. Copula avoidance – "serves as", "functions as", "stands as", "acts as" instead of just "is"
9. Negative parallelisms – "It's not just X, it's Y"
10. Rule of three – triple noun/adjective lists used formulaically ("innovation, inspiration, and insights")
11. Synonym cycling – using multiple synonyms for the same noun within one piece to avoid repetition
12. False ranges – "from X to Y" constructions that don't add real information ("from startups to enterprises")

STYLE PATTERNS:
13. Em dash overuse – more than one em dash per paragraph
14. Boldface overuse – bolding terms mid-sentence that don't need emphasis
15. Inline-header lists – bullet points where the first word is bolded as a mini-header ("Speed: Performance improved...")
16. Title Case Headings – headings with unnecessary capitalisation on every word
17. Emojis used as section markers or bullet points
18. Curly/smart quotes instead of straight quotes (aesthetic choice that signals AI formatting)

COMMUNICATION PATTERNS:
19. Chatbot artifacts – "I hope this helps!", "Let me know if you'd like more!", "Great question!"
20. Cutoff disclaimers – "While details are limited based on available information...", "As of my knowledge cutoff..."
21. Sycophantic tone – "You're absolutely right!", "That's a fantastic point!"

FILLER AND HEDGING:
22. Filler phrases – "In order to", "Due to the fact that", "It is important to note that", "It goes without saying"
23. Excessive hedging – "could potentially possibly", "may or may not", "it's possible that"
24. Generic conclusions – "The future looks bright", "Exciting times lie ahead", "Only time will tell"

TEXT TO AUDIT:
[PASTE YOUR TEXT HERE]

List only the patterns actually present. If a pattern is clean, skip it. At the end, give a one-line verdict on the overall AI-score (Low / Medium / High).`,
        expectedOutput: 'A list of flagged phrases organized by pattern number, with a final Low/Medium/High AI-score verdict.',
        tips: 'Don\'t be surprised if a Medium or High score comes back — most AI-assisted drafts hit 8–12 patterns. The audit is just a map, not a judgment.'
      },
      {
        id: 'smb-humanizer-s3',
        stepNumber: 3,
        title: 'Rewrite Based on Audit',
        instruction: 'Take the audit output and ask Claude to rewrite the text, fixing every flagged issue. Add a voice direction so the rewrite matches your tone.',
        promptTemplate: `Rewrite the text below, fixing every pattern flagged in the audit above.

Rules:
- Replace significance inflation with plain facts or specific details
- Cut vague attributions entirely if you can't replace them with a source
- Remove all AI vocabulary (Additionally, Furthermore, testament, landscape, showcase, etc.)
- Replace "serves as / functions as / stands as" with "is" or "has"
- Break up the rule of three — use however many items are actually needed
- Remove em dashes where a comma or period works better
- Kill all chatbot sign-offs ("I hope this helps", "Let me know if...")
- Replace filler phrases with direct constructions ("To" instead of "In order to")
- Cut excessive hedging — pick a lane and state it directly
- Replace generic conclusions with a specific fact, plan, or next step

Voice direction: [DESCRIBE YOUR TONE — e.g. "casual and direct, first person, short sentences" or "professional but warm, third person, no jargon"]

Original text:
[PASTE YOUR TEXT HERE]`,
        expectedOutput: 'A rewritten version of your text with all flagged patterns removed, matching your specified voice.',
        tips: 'The voice direction line is the most important variable. "Write like a 35-year-old CFO explaining this to a colleague" gets dramatically better results than leaving it blank.'
      },
      {
        id: 'smb-humanizer-s4',
        stepNumber: 4,
        title: 'Final Audit Pass',
        instruction: 'Run one more audit on the rewritten text to catch anything the first rewrite missed. LLMs often reintroduce patterns in the second draft. This final pass catches the stragglers.',
        promptTemplate: `Read the rewritten text below and flag any remaining AI writing patterns from the 24-pattern list.

Pay special attention to:
- Filler phrases that crept back in
- Em dashes or inline-header formatting
- Any phrases that still sound like a chatbot (too smooth, too complete, no texture)
- Generic or vague conclusions

If the text is clean, say so directly. If there are remaining issues, quote them and suggest a specific fix for each.

Rewritten text:
[PASTE REWRITTEN TEXT HERE]`,
        expectedOutput: 'Either "Text is clean" or a short list of remaining issues with specific fixes. The second pass is usually much shorter than the first.',
        tips: 'If the final audit comes back clean, you\'re done. If there are 1–2 stubborn patterns, fix them manually rather than running another full rewrite — at this point your own judgment is faster than another round-trip.'
      }
    ],
    relatedPlaybooks: [
      { id: 'smb-1', title: 'The 30-Day Social Media Content Engine', slug: '30-day-social-media-content-engine' },
      { id: 'lm-1', title: 'The "Business Operating System" Master Prompt', slug: 'the-operating-system-prompt' }
    ]
  }
];

export const claudeCrashCoursePlaybooks: Playbook[] = [
  {
    id: 'cc-0',
    slug: 'ai-for-real-life-plain-english-guide',
    title: 'AI for Real Life: A Plain English Guide',
    subtitle: 'Based on Anthropic\'s AI Fluency Framework — the 4 skills everyone needs to use AI confidently, simply explained.',
    category: 'Claude Crash Course',
    difficulty: 'Beginner',
    timeToComplete: 15,
    timeSaved: 60,
    completionCount: 5120,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'ChatGPT'],
    beforeYouStart: [
      'No prior AI experience is needed. This is your starting point.',
      'Open Claude (claude.ai) or ChatGPT in a browser tab so you can try things as you read.',
      'Bring one real task from your life or work to use as a practice example throughout.'
    ],
    expectedOutcome: 'A clear mental model of what AI is, what it is good for, and when not to trust it. You will also learn the 4D Framework you can apply to every AI interaction from this moment on.',
    troubleshooting: [
      {
        problem: 'I tried AI once and the answer was wrong or useless',
        solution: "One bad answer is not a verdict on AI; it's usually just a prompt problem. The most common cause is that the question was too vague. Read the Description step in this lesson, then try again with more context. Rephrasing almost always gets a dramatically better result."
      },
      {
        problem: 'I don\'t know if I can trust what AI tells me',
        solution: "Good instinct, as that's exactly what Discernment is for. The simple rule is to trust AI more for creative and explanatory tasks, and trust it less for specific facts, dates, and statistics. When it matters, verify the specific claims with a quick search or a qualified professional."
      },
      {
        problem: 'I feel like I\'m cheating by using AI for work or school',
        solution: "Context matters. Using AI to draft a first version you then edit, improve, and own is a tool, much like using a calculator for maths. Submitting AI output as entirely your own unedited work in a context that prohibits it is dishonest. The Diligence section of this lesson covers exactly this line."
      },
      {
        problem: 'AI doesn\'t remember what I told it last time',
        solution: "That's by design, since most AI tools do not have memory between separate conversations. Every new chat is a blank slate. Always give context at the start including who you are, what you need, and any relevant background. Think of it as briefing a new but very capable assistant each time."
      },
      {
        problem: 'I\'m worried about privacy — what should I not share with AI?',
        solution: "Never paste passwords, government ID numbers, bank details, or sensitive personal information about other people. Treat the AI chat window like a work email where professional use is fine, but anything you would not want visible to others should stay out."
      }
    ],
    relatedPlaybooks: [
      { id: 'cc-1', title: 'Your First Conversation with Claude', slug: 'claude-101-your-first-conversation' },
      { id: 'cc-2', title: 'Prompt Engineering Essentials', slug: 'claude-102-prompt-engineering-essentials' }
    ],
    steps: [
      {
        id: 'cc0-s1',
        stepNumber: 1,
        title: 'What Even Is AI?',
        tools: ['Claude'],
        instruction: 'Before learning how to use AI well, understand what it actually is and what it is not. This removes the mystery and the fear at the same time.\n\nThink of AI (like Claude or ChatGPT) as a very well-read assistant who has read billions of articles, books, and websites. It does not "think" like a human; instead, it predicts useful responses based on patterns it learned. It is incredibly helpful for a huge range of tasks, but it is not magic, and it makes mistakes.\n\nThe single most important thing to understand upfront is that you are always the human in charge. AI is a tool and you decide what to do with what it gives you. It amplifies your thinking; it does not replace it.',
        promptTemplate: "I have never really used AI before and I want to understand what it is and what it is actually good at. I am a [DESCRIBE YOURSELF, for example a small business owner, student, teacher, or office worker]. Tell me in plain, simple language:\n1. What AI is and how it works (no technical jargon)\n2. What it is genuinely best at\n3. What it is bad at or gets wrong\n4. One thing that surprises most people when they first use it\n\nKeep the whole answer under 250 words and write it like you're talking to a curious person, not a tech student.",
        expectedOutput: 'A plain-English explanation of AI tailored to your background — what it is, what it is good for, and its real limitations. No jargon, no hype.',
        tips: 'Notice how Claude answers. It will be clear, direct, and probably shorter than you expected. That is by design — you asked for plain language and a word limit. That is the Description skill already at work.'
      },
      {
        id: 'cc0-s2',
        stepNumber: 2,
        title: 'Delegation — Know What to Hand Off',
        tools: ['Claude'],
        instruction: 'Delegation is figuring out which tasks are worth giving to AI and which ones you should keep for yourself. Getting this right saves time and avoids the biggest mistakes people make.\n\nGreat things to delegate to AI include writing first drafts of emails, essays, or reports, as well as summarizing long documents, brainstorming ideas, explaining confusing topics in simple terms, translating content, and creating to-do lists or project plans.\n\nYou should keep final decisions that affect people\'s lives for yourself, along with anything requiring your personal judgment or values, tasks where accuracy is life-or-death (medical, legal, financial), and anything requiring very recent information since AI knowledge has a cutoff date.',
        promptTemplate: 'I need to write a [DESCRIBE THE TASK — e.g. "tricky email to my landlord about a broken heating system" / "complaint letter to a company" / "proposal to my manager for a new idea"].\n\nHelp me write a polite but firm first draft. Here is the key context:\n[DESCRIBE YOUR SITUATION IN 2-3 SENTENCES]\n\nKeep it under 150 words. I will review it and decide what to send.',
        expectedOutput: 'A ready-to-edit first draft of your real task — something that would have taken you 20 minutes of staring at a blank screen, produced in seconds. You review it, tweak it, and send it. The judgment is still yours.',
        tips: 'The magic phrase is "I will review it and decide what to send." You are delegating the hard part — the blank page — not the final call. Try this with one real task from your life right now.'
      },
      {
        id: 'cc0-s3',
        stepNumber: 3,
        title: 'Description — Know How to Ask',
        tools: ['Claude'],
        instruction: 'The better you explain what you want, the better AI responds. Think of it like giving directions — vague directions get you lost.\n\nWeak prompt: "Write something about dogs"\nStrong prompt: "Write a fun 3-paragraph intro for a blog about dog training for busy parents. Casual tone, no jargon, include one surprising dog fact."\n\nWeak prompt: "Help with my resume"\nStrong prompt: "I am applying for a retail job with no experience. Help me write a 1-page resume highlighting my communication skills and reliability. No generic corporate language."\n\nThe quick-start formula to remember:\n"I am [who you are]. I need [what you want]. The context is [relevant background]. Please give me [format, length, tone]."',
        promptTemplate: 'I am a [WHO YOU ARE]. I need [WHAT YOU WANT — be specific]. The context is [RELEVANT BACKGROUND: what is this for, who will see it, and why does it matter]. Please give me [FORMAT, for example a short paragraph, a bullet list, a table, or a 3-step plan] that is [TONE, for example friendly and casual, professional, or simple enough for a 12-year-old to understand]. Keep it under [WORD COUNT].\n\nDo not include [ANYTHING YOU DO NOT WANT, such as jargon, bullet points, or an introduction paragraph].\n\nHere is a real example to replace the brackets above:\n"I am a small business owner with no marketing background. I need 5 Instagram caption ideas for our summer sale on handmade candles. The context is our brand is warm, cozy, and eco-friendly and we sell to women 25-45. Please give me 5 short captions in a casual and fun tone. Keep each under 150 characters and do not use hashtags, as I\'ll add those myself."',
        expectedOutput: 'A precise, immediately usable response that matches what you actually wanted — not a generic answer to a vague question. The quality of the output should feel noticeably better than a vague prompt would produce.',
        tips: 'Fill in the formula with your real task right now. Compare the result to what you would have gotten from a vague prompt. The difference is the whole lesson.'
      },
      {
        id: 'cc0-s4',
        stepNumber: 4,
        title: 'Discernment — Know When to Trust It',
        tools: ['Claude'],
        instruction: "AI can be wrong, outdated, or confidently make things up. This is called 'hallucination' and it is real. Discernment is knowing when to trust the output and when to verify it.\n\nYou can trust AI more for general knowledge and explanations, along with creative tasks like writing, brainstorming, and editing. It's also great for summarizing documents you provide and explaining concepts in simple terms.\n\nYou should always double-check specific statistics, dates, and numbers, as well as medical, legal, or financial advice. Recent news or events and specific names, links, or citations also require verification.\n\nThe Description-Discernment loop suggests that if the answer does not seem right, you should rephrase your question, get a new answer, and check again. It is a conversation, not a one-shot deal.",
        promptTemplate: 'Tell me [ASK FOR A SPECIFIC FACT OR CLAIM — e.g. "what is the current interest rate in Nigeria" / "what is the current price of petrol" / "what happened in the news this week"].\n\nAfter you answer, tell me honestly: how confident are you in this information, and is there anything about this answer I should verify independently before acting on it?\n\nNote: This prompt is designed to teach Discernment. Watch how the AI responds about its own confidence and limitations.',
        expectedOutput: 'An answer followed by an honest caveat from the AI about what it knows, what it might have wrong, and what you should verify. A trustworthy AI tool will flag its own uncertainty — that is a sign of a good system, not a weakness.',
        tips: 'The simple habit to build: after every AI answer, ask yourself three questions. Does this feel right? Can I verify this quickly? Would it matter if it were wrong? If the answer to the last question is yes — verify before you act.'
      },
      {
        id: 'cc0-s5',
        stepNumber: 5,
        title: 'Diligence — Stay Responsible',
        tools: ['Claude'],
        instruction: "Diligence means using AI responsibly without becoming over-reliant on it. You are accountable for everything you do with AI's output.\n\nIn practice, diligence means you should not copy-paste blindly; instead, read it, edit it, and make it yours. Avoid sharing private information like passwords, ID numbers, or sensitive personal details. Be honest about AI use when it matters, such as at school, at work, or in professional contexts. Always think about whether the content could mislead someone and keep learning as AI tools change fast.\n\nCommon mistakes include treating AI like a search engine that finds facts, since it actually generates answers and can make things up. Don't give up after one bad answer; try rephrasing instead. You should also avoid trusting it blindly for medical, legal, or financial questions, and remember that AI does not know you or remember past conversations.",
        promptTemplate: 'Review the following content I got from an AI and give me your honest assessment:\n\n[PASTE ANY AI-GENERATED TEXT HERE — an email draft, an essay paragraph, a summary, whatever you generated in the earlier steps]\n\nTell me:\n1. What looks good and is ready to use as-is\n2. What should be changed, improved, or made more personal\n3. What specific facts or claims (if any) I should verify before using this\n4. One thing that sounds a bit "AI-ish" that I should rewrite in my own voice\n\nThis is a Diligence review — help me use this responsibly.',
        expectedOutput: 'An honest editorial review of AI-generated content, flagging what is solid, what needs your personal touch, and what claims need verification before you rely on them.',
        tips: 'Apply this review habit to every important piece of AI output before you use it. After a few weeks it becomes automatic — you will instinctively read AI responses critically rather than accepting them wholesale. That habit is worth more than any single AI tip.'
      }
    ]
  },
  {
    id: 'cc-1',
    slug: 'claude-101-your-first-conversation',
    title: 'Your First Conversation with Claude',
    subtitle: 'Go from blank screen to useful output in 10 minutes flat',
    category: 'Claude Crash Course',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 30,
    completionCount: 3842,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude'],
    beforeYouStart: [
      'A free Claude account at claude.ai',
      'One real work task you need help with today',
      '10 minutes of uninterrupted focus'
    ],
    expectedOutcome: "A complete, useful work deliverable produced through a multi-turn conversation with Claude. You'll also gain the confidence to start any future conversation effectively.",
    troubleshooting: [
      {
        problem: 'Claude gives a generic, textbook-style answer',
        solution: 'You skipped the context. Re-send your prompt but start with: "I am a [role] at a [company type]. Here is what I need and why..."'
      },
      {
        problem: 'The response is way too long',
        solution: 'Add a constraint: "Keep this under 150 words" or "Give me only the top 3"'
      },
      {
        problem: 'Claude misunderstood what I wanted',
        solution: "Don't start over. Reply with: 'Not quite, I meant [X]. Specifically, I need [concrete deliverable].' Claude corrects well from feedback."
      }
    ],
    steps: [
      {
        id: 'cc1-s1',
        stepNumber: 1,
        title: 'Set the Stage: Tell Claude Who You Are',
        instruction: "Before asking anything, give Claude a one-sentence snapshot of your role, your context, and the problem you're solving. This single step eliminates the vast majority of generic responses.",
        promptTemplate: `I work as a [YOUR ROLE] at a [COMPANY TYPE / INDUSTRY].\n\nRight now I am working on [SPECIFIC PROJECT OR CHALLENGE]. My goal is to [WHAT SUCCESS LOOKS LIKE].\n\nTalk to me like a sharp colleague who already knows my field — skip the basics and be direct.`,
        expectedOutput: 'Claude should reply acknowledging your context and asking a clarifying question, or dive straight into useful guidance tailored to your situation.',
        tips: 'Example: "I work as a product marketing manager at a B2B SaaS startup. Right now I am working on our Q3 launch messaging for a new analytics feature. My goal is to have three positioning angles ready for our messaging workshop on Friday. Talk to me like a sharp colleague who already knows my field — skip the basics and be direct."'
      },
      {
        id: 'cc1-s2',
        stepNumber: 2,
        title: 'Ask for a Concrete Deliverable',
        instruction: 'Now that Claude has context, ask for something specific you can actually use. Be precise about format, length, and audience.',
        promptTemplate: `Now write me a [DELIVERABLE TYPE] that I can [HOW YOU WILL USE IT].

Please follow these requirements:
Audience: [WHO WILL READ/SEE THIS]
Length: [WORD COUNT OR FORMAT CONSTRAINT]
Tone: [PROFESSIONAL, CASUAL, PERSUASIVE, etc.]
Must include: [ANY NON-NEGOTIABLE ELEMENTS]`,
        expectedOutput: 'A structured, ready-to-use deliverable matching your specifications — not a vague suggestion or outline.',
        tips: 'Example: "Now write me a one-page competitive positioning brief that I can present at our Friday workshop. Audience: VP of Marketing and two PMMs. Length: 400 words max. Tone: confident and data-driven. Must include: our differentiator vs. Mixpanel, one customer proof point, and a suggested tagline."'
      },
      {
        id: 'cc1-s3',
        stepNumber: 3,
        title: 'Iterate — Give Feedback Like a Colleague',
        instruction: 'Claude\'s first draft is a starting point. Reply with specific feedback: what to keep, what to cut, what to change. This is where the real value happens.',
        promptTemplate: `This is [GOOD / CLOSE / OFF-TRACK]. Here is my feedback:

Keep: [WHAT WORKED]
Change: [WHAT NEEDS TO BE DIFFERENT AND WHY]
Add: [ANYTHING MISSING]
Remove: [ANYTHING UNNECESSARY]

Revise it with these changes.`,
        expectedOutput: 'An improved second draft that incorporates your feedback while preserving what was already working.',
        tips: 'Example: "This is close. Keep the structure and the Mixpanel comparison. Change the tagline because it\'s too generic and make it edgier and outcome-focused. Add a stat about our average implementation time (it\'s 2 days vs. their 2 weeks). Remove the paragraph about market size, as the audience already knows this. Revise it with these changes."'
      },
      {
        id: 'cc1-s4',
        stepNumber: 4,
        title: 'Reshape the Output',
        instruction: 'Once the content is right, ask Claude to reformat it for a different context. This shows how one conversation can produce multiple assets.',
        promptTemplate: `Now take this same content and turn it into:

1. A [NEW FORMAT 1]: for [USE CASE 1]
2. A [NEW FORMAT 2]: for [USE CASE 2]

Keep the core messaging identical. Adapt only the length and format.`,
        expectedOutput: 'The same core content reshaped into two new formats, ready to use in different contexts.',
        tips: 'Example: "Now take this same content and turn it into: 1. A 3-slide executive summary for our Slack channel update to leadership. 2. A 5-bullet email for the sales team to use in competitive deals. Keep the core messaging identical and adapt only the length and format."'
      }
    ],
    relatedPlaybooks: [
      { id: 'cc-0', title: 'AI for Real Life: A Plain English Guide', slug: 'ai-for-real-life-plain-english-guide' },
      { id: 'cc-2', title: 'Prompt Engineering Essentials', slug: 'claude-102-prompt-engineering-essentials' },
      { id: 'cc-3', title: 'Working with Files & Data', slug: 'claude-103-working-with-files-and-data' }
    ]
  },
  {
    id: 'cc-2',
    slug: 'claude-102-prompt-engineering-essentials',
    title: 'Prompt Engineering Essentials',
    subtitle: 'Master the 5 prompt patterns that cover 90% of business use cases',
    category: 'Claude Crash Course',
    difficulty: 'Beginner',
    timeToComplete: 15,
    timeSaved: 60,
    completionCount: 2917,
    rating: 4.8,
    isPro: false,
    isNew: true,
    tools: ['Claude'],
    beforeYouStart: [
      'Completion of Playbook 1 or basic familiarity with Claude',
      'A real writing, analysis, or brainstorming task',
      '15 minutes of focus'
    ],
    expectedOutcome: 'Hands-on experience with five reusable prompt patterns including Role Assignment, Chain of Thought, Few-Shot Examples, Constraint Setting, and Structured Output. You can remix these for any future task.',
    troubleshooting: [
      {
        problem: 'Claude ignores my formatting instructions',
        solution: 'Put format rules at the END of your prompt, not the beginning. Claude weighs the end of a prompt more heavily.'
      },
      {
        problem: 'Responses are too cautious or hedging',
        solution: 'Add: "Be direct and take a clear position. I want your best recommendation, not a list of options."'
      },
      {
        problem: 'Claude keeps adding disclaimers I don\'t need',
        solution: 'Say: "Skip caveats and disclaimers. I understand the limitations — give me the actionable output only."'
      }
    ],
    steps: [
      {
        id: 'cc2-s1',
        stepNumber: 1,
        title: 'Pattern 1: Role Assignment',
        instruction: 'Assign Claude an expert persona to activate domain-specific knowledge. This consistently improves output quality for specialized tasks.',
        promptTemplate: `You are a [SPECIFIC EXPERT ROLE] with 15 years of experience in [DOMAIN].\n\nA client has asked you: "[PASTE THE ACTUAL QUESTION OR TASK]"\n\nRespond as this expert would — with specific recommendations, not generic advice. Reference real frameworks, tools, or methodologies from this field.`,
        expectedOutput: 'A response noticeably more specific and expert-level than a generic prompt would produce — using industry terminology and frameworks appropriately.',
        tips: 'Try it: "You are a senior UX researcher with 15 years of experience in enterprise SaaS. A client has asked you: \'We\'re redesigning our dashboard but don\'t have time for full user testing. What\'s the fastest way to validate our new design before launch?\' Respond as this expert would — with specific recommendations, not generic advice."'
      },
      {
        id: 'cc2-s2',
        stepNumber: 2,
        title: 'Pattern 2: Chain of Thought',
        instruction: 'Force Claude to show its reasoning step by step. This dramatically improves accuracy on complex analysis, math, and strategic decisions.',
        promptTemplate: `I need you to [ANALYSIS OR DECISION TASK].\n\nThink through this step by step:\n1. First, identify [RELEVANT FACTORS]\n2. Then, analyze [KEY RELATIONSHIPS]\n3. Then, weigh [TRADEOFFS]\n4. Finally, give me your recommendation with reasoning\n\nShow your work at each step.`,
        expectedOutput: 'A structured analysis that walks through the reasoning, making it easy to spot where you agree or disagree with Claude\'s logic.',
        tips: 'Try it: "I need you to evaluate whether we should build our analytics feature in-house or buy a third-party solution. Our team is 4 engineers, timeline is 8 weeks, budget is $50K. Think through this step by step: 1. First, identify the key decision criteria. 2. Then, analyze build vs. buy against each criterion. 3. Then, weigh the risks of each option. 4. Finally, give me your recommendation with reasoning. Show your work at each step."'
      },
      {
        id: 'cc2-s3',
        stepNumber: 3,
        title: 'Pattern 3: Few-Shot Examples',
        instruction: 'Show Claude 1-2 examples of what good output looks like. This is the fastest way to get Claude to match your voice, format, or quality bar.',
        promptTemplate: `I need you to write [CONTENT TYPE] in a specific style. Here are examples of what good looks like:\n\n---\nExample 1:\n[PASTE A REAL EXAMPLE YOU LIKE]\n---\nExample 2:\n[PASTE ANOTHER EXAMPLE]\n---\n\nNow write one for: [YOUR SPECIFIC TOPIC/CONTEXT]\n\nMatch the tone, structure, and level of detail from the examples.`,
        expectedOutput: 'Output that closely mirrors the style and quality of your examples, applied to your new topic.',
        tips: 'Try it: Paste two of your best-performing LinkedIn posts and ask Claude to write a new one about a different topic. The style match is usually uncanny.'
      },
      {
        id: 'cc2-s4',
        stepNumber: 4,
        title: 'Pattern 4: Constraint Setting',
        instruction: 'Set hard boundaries on length, format, audience, and what to exclude. Constraints force Claude to be concise and relevant instead of comprehensive and rambling.',
        promptTemplate: `Write a [DELIVERABLE] about [TOPIC].

Please keep these constraints in mind:
Maximum [X] words
Written for [SPECIFIC AUDIENCE] (assume they already know [BASELINE KNOWLEDGE])
Use [BULLET POINTS, NUMBERED LIST, or PARAGRAPHS]
Do NOT include [THINGS TO EXCLUDE]
Every point must include [REQUIRED ELEMENT, for example a specific example, a metric, or an action item]`,
        expectedOutput: 'A tightly scoped deliverable that respects every constraint — no filler, no fluff.',
        tips: 'Try it: "Write a project status update about our mobile app redesign. Constraints: Maximum 200 words. Written for our CEO — assume she knows the project background. Use bullet points. Do NOT include technical details or timelines already shared. Every point must include a specific decision or risk that needs her attention."'
      },
      {
        id: 'cc2-s5',
        stepNumber: 5,
        title: 'Pattern 5: Structured Output',
        instruction: 'Tell Claude exactly what structure you want the output in. Tables, JSON, specific section headers — Claude follows structural instructions very precisely.',
        promptTemplate: `Analyze [TOPIC/DATA] and present the results in this exact structure:\n\n## [Section 1 Name]\n[What to include]\n\n## [Section 2 Name]\n[What to include]\n\n## [Section 3 Name]\nPresent this as a table with columns: [COL1] | [COL2] | [COL3]\n\n## Bottom Line\nOne paragraph: what does this mean and what should I do next?`,
        expectedOutput: 'Output that follows your exact template structure, making it immediately usable without reformatting.',
        tips: 'Try it: "Analyze our Q3 customer churn data and present the results in this exact structure: ## Key Findings (top 3 bullet points) ## Root Causes (table with columns: Cause | % of Churned Customers | Evidence) ## Recommended Actions (numbered list, each with owner and deadline suggestion) ## Bottom Line (one paragraph: what does this mean for our retention target?)"'
      }
    ],
    relatedPlaybooks: [
      { id: 'cc-1', title: 'Your First Conversation with Claude', slug: 'claude-101-your-first-conversation' },
      { id: 'cc-3', title: 'Working with Files & Data', slug: 'claude-103-working-with-files-and-data' }
    ]
  },
  {
    id: 'cc-3',
    slug: 'claude-103-working-with-files-and-data',
    title: 'Working with Files & Data',
    subtitle: 'Upload documents, spreadsheets, and images — then extract real insights',
    category: 'Claude Crash Course',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 90,
    completionCount: 1856,
    rating: 4.7,
    isPro: false,
    isNew: true,
    tools: ['Claude'],
    beforeYouStart: [
      'A PDF, DOCX, or CSV file you actually need to analyze',
      'Optional: a screenshot or chart image you want Claude to interpret',
      'Claude Pro or Free account (free allows limited uploads)'
    ],
    expectedOutcome: 'A completed analysis of your real document including a summary, extracted data, identified issues, or reformatted output. Everything is produced through file upload and targeted prompts.',
    troubleshooting: [
      {
        problem: 'Claude says it can\'t read the file',
        solution: 'Check the file type. Claude supports PDF, DOCX, CSV, TXT, PNG, JPEG, and more. If it\'s a proprietary format, export it to PDF first.'
      },
      {
        problem: 'Claude misses important details in a long document',
        solution: 'Don\'t ask about the whole document at once. Say: "Focus only on pages 12-18" or "Look specifically at Section 3.2"'
      },
      {
        problem: 'Analysis of a spreadsheet seems shallow',
        solution: 'CSV works better than XLSX for data analysis. Export as CSV and re-upload. Also, be specific: "Calculate the month-over-month growth rate for each product line" beats "analyze this data."'
      }
    ],
    steps: [
      {
        id: 'cc3-s1',
        stepNumber: 1,
        title: 'The Smart Summary — Extract What Matters',
        instruction: 'Upload a document and ask Claude to summarize it for a specific audience and purpose. The key is telling Claude WHY you need the summary — this shapes what it prioritizes.',
        promptTemplate: `I just uploaded [DOCUMENT NAME]. Here is what I need:

Summarize this document for [SPECIFIC AUDIENCE] who needs to [SPECIFIC PURPOSE].

Please structure the summary as follows:
An executive summary (3 sentences max)
Key findings or decisions
Action items or open questions
Anything surprising or concerning

Skip the background context the audience already knows and focus on what is new, changed, or requires a decision.`,
        expectedOutput: 'A purpose-driven summary that highlights what matters to your audience — not a generic document overview.',
        tips: 'Try it with a meeting transcript: "Summarize this document for our VP of Engineering who missed the meeting and needs to know what was decided, what\'s blocked, and what he needs to weigh in on. Skip background context — he knows the project. Focus on decisions, blockers, and his action items."'
      },
      {
        id: 'cc3-s2',
        stepNumber: 2,
        title: 'Data Extraction — Pull Structure from Chaos',
        instruction: 'Upload a messy document (contract, report, email thread) and ask Claude to extract specific data points into a structured format.',
        promptTemplate: `From this uploaded document, extract the following into a table:

| [Column 1] | [Column 2] | [Column 3] | [Column 4] |

Please follow these rules:
If a value is not explicitly stated, write 'Not specified'
If a value is ambiguous, write your best interpretation and mention it's inferred
Include the page number or section where you found each data point

After the table, list any inconsistencies or red flags you noticed.`,
        expectedOutput: 'A clean, structured table pulling specific data points from an unstructured source with page references and flagged issues.',
        tips: 'Try it with a vendor contract: "Extract: Vendor Name | Contract Value | Start Date | End Date | Auto-Renewal Terms | Termination Notice Period | Key SLA Commitments. After the table, list any inconsistencies or clauses that seem unusual."'
      },
      {
        id: 'cc3-s3',
        stepNumber: 3,
        title: 'Image + Screenshot Analysis',
        instruction: 'Upload a chart, screenshot, whiteboard photo, or UI mockup. Claude can read visual content and turn it into structured text or actionable analysis.',
        promptTemplate: `I uploaded [IMAGE TYPE, for example a screenshot of our analytics dashboard, a photo of our whiteboard, or a chart from a report].

Please do the following:
1. Describe what you see in detail
2. Extract all data points, numbers, or text visible in the image
3. [SPECIFIC ASK, for example identify the top 3 trends, flag concerning metrics, or convert whiteboard notes into a structured task list]

Please present your analysis as [FORMAT, such as bullet points, a table, or a formatted summary].`,
        expectedOutput: 'A text-based extraction and analysis of the visual content, structured in your requested format.',
        tips: 'Try it: Upload a screenshot of a cluttered Jira board and ask Claude to list every visible ticket with its status and assignee in a table. Then identify which tickets appear blocked and suggest a priority order for our standup tomorrow.'
      },
      {
        id: 'cc3-s4',
        stepNumber: 4,
        title: 'Compare and Cross-Reference',
        instruction: 'Upload two related documents and ask Claude to compare them. This is powerful for contract redlines, version comparisons, or competitive analysis.',
        promptTemplate: `I uploaded two documents:
Document A: [NAME / DESCRIPTION]
Document B: [NAME / DESCRIPTION]

Compare them and produce:
1. What changed: key differences between A and B (table format)
2. What's new in B: anything added that wasn't in A
3. What's missing from B: anything in A that was removed
4. Risk assessment: any changes that could be problematic and why

Be specific. Quote exact language where differences matter.`,
        expectedOutput: 'A structured comparison with specific differences called out, along with additions, removals, and risk flags for material changes.',
        tips: 'Try it with two versions of a proposal, contract, or policy document. This saves hours of manual redlining.'
      }
    ],
    relatedPlaybooks: [
      { id: 'cc-2', title: 'Prompt Engineering Essentials', slug: 'claude-102-prompt-engineering-essentials' },
      { id: 'cc-4', title: 'Projects & Persistent Context', slug: 'claude-104-projects-and-persistent-context' }
    ]
  },
  {
    id: 'cc-4',
    slug: 'claude-104-projects-and-persistent-context',
    title: 'Projects & Persistent Context',
    subtitle: 'Build a reusable workspace so Claude remembers your brand, data, and rules',
    category: 'Claude Crash Course',
    difficulty: 'Intermediate',
    timeToComplete: 20,
    timeSaved: 120,
    completionCount: 1423,
    rating: 4.8,
    isPro: false,
    isNew: true,
    tools: ['Claude'],
    beforeYouStart: [
      'Claude Pro, Max, Team, or Enterprise account (Projects require a paid plan)',
      'Two to three reference documents you frequently re-explain to AI, like brand guidelines or templates',
      'A recurring workflow where you want consistency across conversations'
    ],
    expectedOutcome: 'A fully configured Claude Project with uploaded knowledge and custom instructions, along with a test conversation to prove that Claude correctly references your documents without being reminded.',
    troubleshooting: [
      {
        problem: 'Claude doesn\'t seem to reference my uploaded documents',
        solution: 'Mention the document by name: "Based on the Brand Guidelines PDF I uploaded, ..." This helps Claude locate the right source in projects with many files.'
      },
      {
        problem: 'My project instructions are too long and Claude ignores parts',
        solution: 'Prioritize. Put the 3 most critical rules first. Use numbered lists, not paragraphs. Test each rule individually.'
      },
      {
        problem: 'Claude gives different answers in different chats within the same project',
        solution: 'This is normal for nuanced questions. Add explicit rules to your project instructions for the areas where you need consistency: "Always recommend X for Y situations."'
      }
    ],
    steps: [
      {
        id: 'cc4-s1',
        stepNumber: 1,
        title: 'Create Your Project and Name It',
        instruction: 'Go to claude.ai/projects and create a new project. Give it a specific, outcome-oriented name rather than a vague label.',
        promptTemplate: `Before creating the project, ask Claude to help you scope it by saying:

"I want to set up a Claude Project for [WORKFLOW, such as writing customer case studies or managing our product launch].

Please help me define:
1. What documents should I upload as the knowledge base?
2. What project instructions would ensure consistency?
3. What should this project NOT be used for in terms of scope boundaries?

Please keep each answer concise."`,
        expectedOutput: 'A clear project scope with recommended documents, instructions, and boundaries, which gives you a setup checklist before you start.',
        tips: "Great project names include 'Q3 Product Launch Content', 'Client Onboarding for Acme Corp', or 'Weekly Sales Report Generator'. Avoid vague names like 'Marketing Stuff', 'Misc', or 'Project 1'.",
      },
      {
        id: 'cc4-s2',
        stepNumber: 2,
        title: 'Write Bulletproof Project Instructions',
        instruction: "Your project instructions are the rules Claude follows in every conversation within the project. Write them like you're onboarding a new team member by being specific, unambiguous, and prioritized.",
        promptTemplate: `Help me write project instructions for a Claude Project called "[PROJECT NAME]".

Context: [WHAT THIS PROJECT IS FOR in two sentences]

I need instructions that cover:
1. Role: Who should Claude act as in this project?
2. Tone: [FORMAL, CONVERSATIONAL, or TECHNICAL]
3. Format rules: [DEFAULT OUTPUT FORMAT, for example always use bullet points or an executive summary]
4. Must-do rules: [THINGS CLAUDE MUST ALWAYS DO, like citing uploaded documents or using company terminology]
5. Must-avoid rules: [THINGS CLAUDE MUST NEVER DO, like never suggesting competitor products or using passive voice]

Please write these as clear, numbered instructions I can paste directly into the Project Instructions. Keep it under 300 words.`,
        expectedOutput: 'A copy-paste-ready set of project instructions, numbered and specific enough that Claude can follow them without ambiguity.',
        tips: 'Try it: "Help me write project instructions for a Claude Project called \'Customer Case Studies\'. Context: We create 2-page case studies for enterprise SaaS customers. They follow a Problem → Solution → Results structure. I need instructions covering: Role (B2B content strategist), Tone (professional but not stiff), Format (always use our case study template structure), Must-do (always ask for specific metrics and customer quotes), Must-avoid (never use jargon our customers wouldn\'t know)."'
      },
      {
        id: 'cc4-s3',
        stepNumber: 3,
        title: 'Upload Your Knowledge Base',
        instruction: 'Upload the documents Claude should reference across all conversations in this project. Use descriptive filenames, as Claude uses filenames to locate content.',
        promptTemplate: `After uploading your documents, test that Claude can find and reference them:

"Based on the uploaded documents, please answer these questions:
1. What is the main topic of [DOCUMENT NAME]?
2. Find the specific section in [DOCUMENT NAME] that covers [TOPIC].
3. If I asked you to [COMMON TASK IN THIS PROJECT], which uploaded documents would you reference and why?

Please quote specific passages from the documents in your answers."`,
        expectedOutput: 'Claude should accurately reference your uploaded documents, quote specific passages, and explain which documents it would use for different tasks.',
        tips: "Name files descriptively, as 'Q4-2024-Brand-Voice-Guidelines.pdf' is much better than 'guidelines_v2_final.pdf'. Upload three to five focused documents rather than one massive file, since Claude handles multiple specific files better than a single large one.",
      },
      {
        id: 'cc4-s4',
        stepNumber: 4,
        title: 'The Acid Test: Run a Real Task',
        instruction: "Put your project through a real-world test. Give Claude a task you'd normally do yourself and check whether it follows your instructions and references your documents without being reminded.",
        promptTemplate: `[Give Claude a real task from your workflow without any special hints or reminders]

Example task prompts:
Write a case study introduction for [CLIENT NAME] based on these call notes: [PASTE NOTES]
Draft this week's board update using the latest metrics: [PASTE DATA]
Review this email draft and align it with our brand voice: [PASTE DRAFT]

After Claude responds, please evaluate:
Did it follow the tone from my instructions?
Did it reference the uploaded documents?
Did it respect the must-do and must-avoid rules?`,
        expectedOutput: 'A deliverable that follows your project rules and references your knowledge base without being explicitly reminded — proving the project setup works.',
        tips: 'If Claude misses a rule, don\'t fix it in the conversation — fix it in the project instructions. Your instructions should be good enough to work for any new conversation in this project.'
      },
      {
        id: 'cc4-s5',
        stepNumber: 5,
        title: 'Share and Collaborate (Team Plans)',
        instruction: 'If you\'re on a Team or Enterprise plan, share the project with colleagues so everyone benefits from the same context and rules.',
        promptTemplate: `Before sharing, ask Claude to help you write a project README for your teammates:\n\n"Write a short README (under 150 words) for my teammates explaining:\n1. What this project is for\n2. What documents are in the knowledge base\n3. What kind of tasks they can ask Claude to do here\n4. Any important rules or constraints they should know about\n\nWrite it as a casual Slack message, not formal documentation."`,
        expectedOutput: 'A short, teammate-friendly description you can paste into Slack or the project description to onboard collaborators quickly.',
        tips: 'Share with "Can view" permission first. Let teammates use the project for a week before giving edit access. This prevents well-meaning changes that break your carefully tuned instructions.'
      }
    ],
    relatedPlaybooks: [
      { id: 'cc-3', title: 'Working with Files & Data', slug: 'claude-103-working-with-files-and-data' },
      { id: 'cc-5', title: 'Artifacts & Interactive Outputs', slug: 'claude-105-artifacts-and-interactive-outputs' }
    ]
  },
  {
    id: 'cc-5',
    slug: 'claude-105-artifacts-and-interactive-outputs',
    title: 'Artifacts & Interactive Outputs',
    subtitle: 'Build working apps, dashboards, and documents inside a conversation',
    category: 'Claude Crash Course',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 90,
    completionCount: 2134,
    rating: 4.7,
    isPro: false,
    isNew: true,
    tools: ['Claude'],
    beforeYouStart: [
      'A Claude account with Artifacts enabled in settings',
      'An idea for a simple tool, calculator, or document you need',
      'No coding knowledge is required, since Claude writes all the code'
    ],
    expectedOutcome: 'At least two working artifacts: a practical interactive tool like a calculator or dashboard, and a polished document, both ready to download or share.',
    troubleshooting: [
      {
        problem: 'Claude responds in the chat instead of creating an artifact',
        solution: 'Explicitly say: "Create this as an artifact" or "Build this as an interactive artifact I can use."'
      },
      {
        problem: 'The interactive artifact has a bug or doesn\'t work',
        solution: 'Tell Claude exactly what broke: "When I click the Calculate button, nothing happens. Fix the click handler." Be specific about the symptom.'
      },
      {
        problem: 'I want to add features but the artifact gets messy',
        solution: 'Add one feature at a time. Say: "Add [SPECIFIC FEATURE] to this artifact. Don\'t change anything else." Test after each addition.'
      }
    ],
    steps: [
      {
        id: 'cc5-s1',
        stepNumber: 1,
        title: 'Build a Practical Calculator or Tool',
        instruction: "Ask Claude to build an interactive tool you'd actually use at work. Describe what it should do, what inputs it needs, and what output it shows. You won't need any coding knowledge.",
        promptTemplate: `Build me an interactive [TOOL TYPE] as an artifact.

What it does:
[CORE FUNCTION, for example calculating ROI for marketing campaigns]

Inputs I need to enter:
[INPUT 1, like campaign budget]
[INPUT 2, like expected conversion rate]
[INPUT 3, like average deal size]

Output it should show:
[OUTPUT 1, like projected ROI percentage]
[OUTPUT 2, like break-even point]
[OUTPUT 3, like a visual chart of projected returns]

Design: Please keep it clean, professional, and modern. Make it look like a real product rather than a prototype.`,
        expectedOutput: 'A working interactive artifact with input fields, calculations, and visual output — rendered in the artifact panel, ready to use.',
        tips: 'Try it: "Build me an interactive SaaS pricing calculator as an artifact. Inputs: number of users, plan tier (starter/growth/enterprise), billing period (monthly/annual). Output: monthly cost, annual cost, savings from annual billing, and a comparison table across all tiers. Design: Clean and professional with a blue/white color scheme."'
      },
      {
        id: 'cc5-s2',
        stepNumber: 2,
        title: 'Create a Polished Document or Report',
        instruction: 'Use artifacts to create formatted documents like project plans or reports that you can download as real files.',
        promptTemplate: `Create a [DOCUMENT TYPE] as an artifact.

Topic: [SUBJECT]
Audience: [WHO WILL READ THIS]
Length: [PAGE or WORD TARGET]

Please structure it as:
1. [SECTION 1]
2. [SECTION 2]
3. [SECTION 3]
4. [SECTION 4]

Include:
[SPECIFIC ELEMENTS, such as an executive summary, data tables, or recommendations]

Style: Please keep it professional and polished as this will be shared externally.`,
        expectedOutput: 'A rendered, formatted document in the artifact panel that you can preview, copy, and download.',
        tips: 'Try it: "Create a quarterly business review template as an artifact. Structure: 1. Executive Summary, 2. Key Metrics (as a table with YoY comparison columns), 3. Highlights & Lowlights, 4. Next Quarter Priorities, 5. Resource Requests. Each section should have placeholder text showing what to fill in. Style: clean, corporate, ready to present."'
      },
      {
        id: 'cc5-s3',
        stepNumber: 3,
        title: 'Build a Visual Diagram or Flowchart',
        instruction: 'Ask Claude to create visual diagrams for processes, org charts, or user flows. These render as real diagrams in the artifact panel.',
        promptTemplate: `Create a [DIAGRAM TYPE, such as a flowchart or org chart] as a Mermaid diagram artifact.

Please show: [WHAT THE DIAGRAM SHOULD ILLUSTRATE]

Include:
[KEY NODES or STEPS]
[DECISION POINTS if it's a flowchart]
[CONNECTIONS between elements]

Keep it readable with a limited number of nodes and use clear, short labels.`,
        expectedOutput: 'A rendered visual diagram in the artifact panel, showing your process or structure as a clean, shareable graphic.',
        tips: 'Try it: "Create a customer support escalation flowchart as a Mermaid diagram artifact. Show: Ticket comes in → auto-categorize (billing/technical/general) → each category has different routing → escalation triggers at 24h and 48h → resolution or manager review. Include decision points for: severity level, SLA breach, and VIP customer flag. Keep it under 15 nodes."'
      },
      {
        id: 'cc5-s4',
        stepNumber: 4,
        title: 'Iterate and Share',
        instruction: 'Refine your artifact through conversation, then share it. You can publish artifacts publicly or share within your organization.',
        promptTemplate: `Make these changes to the artifact:\n\n1. [CHANGE 1 — e.g., add a reset button]\n2. [CHANGE 2 — e.g., change the color scheme to match our brand: primary=#2563EB, background=#F8FAFC]\n3. [CHANGE 3 — e.g., add a footer with "Generated by [Team Name] — [Date]"]\n\nDo NOT change anything else. Keep all existing functionality working.`,
        expectedOutput: 'An updated artifact with your requested changes applied cleanly — no regressions in existing functionality.',
        tips: 'When you\'re happy with an artifact, click the Share button to publish it or share with your org. Anyone with the link can view and interact with interactive artifacts — they don\'t need a Claude account. Others can also "remix" your artifact to build on it.'
      }
    ],
    relatedPlaybooks: [
      { id: 'cc-4', title: 'Projects & Persistent Context', slug: 'claude-104-projects-and-persistent-context' },
      { id: 'cc-6', title: 'Research Mode & Deep Dives', slug: 'claude-106-research-mode-deep-dives' }
    ]
  },
  {
    id: 'cc-6',
    slug: 'claude-106-research-mode-deep-dives',
    title: 'Research Mode & Deep Dives',
    subtitle: 'Run multi-source investigations that would take you hours — in minutes',
    category: 'Claude Crash Course',
    difficulty: 'Advanced',
    timeToComplete: 20,
    timeSaved: 180,
    completionCount: 987,
    rating: 4.8,
    isPro: false,
    isNew: true,
    tools: ['Claude'],
    beforeYouStart: [
      'Claude Pro or Max account with Web Search enabled',
      'Research Mode toggle enabled at the bottom of the chat interface',
      'A complex question that needs multiple sources to answer properly'
    ],
    expectedOutcome: 'A cite-backed research report synthesizing information from multiple sources, ready to share with stakeholders.',
    troubleshooting: [
      {
        problem: 'Research is taking too long (30+ minutes)',
        solution: 'Your prompt is too broad. Next time, be more specific by narrowing the scope, adding constraints, or defining the exact sections you want.'
      },
      {
        problem: 'The report doesn\'t cover what I actually needed',
        solution: 'Specify the exact sections upfront. "Structure the report as: Market Size, Key Players (top 5), Pricing Trends, Our Opportunity" gives Claude a roadmap.'
      },
      {
        problem: 'Citations are from low-quality sources',
        solution: 'Add: "Prioritize data from industry reports, company filings, and established publications. Deprioritize blog posts and forums unless they provide unique data."'
      }
    ],
    steps: [
      {
        id: 'cc6-s1',
        stepNumber: 1,
        title: 'Write a Research Brief — Tell Claude What to Investigate',
        instruction: "Enable Research mode by clicking the toggle at the bottom-left. Then write a structured research prompt, thinking of it as a brief to a research analyst.",
        promptTemplate: `Research the following topic and produce a comprehensive report:

**Topic:** [SPECIFIC RESEARCH QUESTION]

**Context:** I need this for [PURPOSE, for example a board presentation or market entry decision]. My audience is [WHO WILL READ THIS].

**Scope:**
Focus areas: [LIST SPECIFIC AREAS]
Time frame: [CURRENT or RECENT]
Geography: [GLOBAL or SPECIFIC REGIONS]

**Report structure:**
1. Executive Summary
2. [SECTION 2 WITH SPECIFIC FOCUS]
3. [SECTION 3 WITH SPECIFIC FOCUS]
4. [SECTION 4 WITH SPECIFIC FOCUS]
5. Key Risks and Open Questions
6. Recommended Next Steps

**Requirements:**
Please cite all claims with sources
Include data and numbers wherever possible
Flag any areas where data is limited or conflicting`,
        expectedOutput: 'Claude will work for 5-15 minutes, conducting multiple searches, and deliver a structured research report with citations.',
        tips: 'Try it: "Research the current state of AI-powered customer support tools and produce a report. Context: I\'m evaluating vendors for our 50-person support team. Focus areas: top 5 players by market share, pricing models, implementation timelines, customer satisfaction scores. Structure: Executive Summary, Market Landscape (table), Vendor Deep Dives (top 5), Build vs Buy Analysis, Recommended Shortlist."'
      },
      {
        id: 'cc6-s2',
        stepNumber: 2,
        title: 'Competitive Landscape Deep Dive',
        instruction: 'Use Research mode for competitive intelligence — Claude will pull from multiple sources to build a comprehensive picture of your competitive landscape.',
        promptTemplate: `Run a competitive analysis on [YOUR COMPANY/PRODUCT] vs these competitors: [COMPETITOR 1], [COMPETITOR 2], [COMPETITOR 3].

For each competitor, investigate:
1. Core product and positioning
2. Pricing (specific tiers and numbers if publicly available)
3. Recent announcements or product launches
4. Customer reviews including common praise and complaints
5. Estimated company size and funding

Present as a comparison table where possible.

Then add a section called 'Our Opportunity' based on competitor gaps and customer complaints, telling us where we should focus. Please cite everything.`,
        expectedOutput: 'A structured competitive analysis with specific data points, comparison tables, and an opportunity assessment — all cited.',
        tips: 'This prompt beats generic competitor research because it asks for specifics (pricing tiers, recent launches, review sentiment) rather than allowing Claude to stay surface-level.'
      },
      {
        id: 'cc6-s3',
        stepNumber: 3,
        title: 'Research + Internal Data Combo',
        instruction: 'If you have Google Workspace connected, Claude can combine web research with your internal documents, emails, and calendar for richer analysis.',
        promptTemplate: `I need you to combine web research with my internal data.

**External research:**
[WHAT TO RESEARCH ON THE WEB, for example industry benchmarks]

**Internal context to pull in:**
[WHAT TO LOOK FOR IN MY CONNECTED TOOLS, like recent emails or documents]

**Deliverable:**
A [REPORT TYPE] that compares our internal situation against the external benchmarks.

Structure:
1. Industry Benchmarks
2. Our Current Performance
3. Gap Analysis
4. Recommended Actions (prioritized and specific)`,
        expectedOutput: 'A report that blends external research with your internal data — comparing your company\'s situation against market benchmarks.',
        tips: 'If you don\'t have Google Workspace connected, you can upload internal documents directly to the chat and combine them with Research mode\'s web results.'
      },
      {
        id: 'cc6-s4',
        stepNumber: 4,
        title: 'Turn Research into Actions',
        instruction: 'After Claude delivers the research report, use a follow-up prompt to turn insights into a concrete action plan.',
        promptTemplate: `Based on the research report you just produced, please create an action plan.

For each recommendation:
Action: what specifically to do
Owner: what role should own this
Timeline: suggested deadline or timeframe
Dependencies: what needs to happen first
Success metric: how we'll know this worked

Please prioritize by impact and put quick wins at the top. Format this as a numbered list I can paste into our project tracker.`,
        expectedOutput: 'A prioritized, assignable action plan derived from the research findings — ready to paste into Notion, Asana, Jira, or any project management tool.',
        tips: 'This two-step approach (research first → action plan second) consistently produces better results than trying to get research + recommendations in one prompt. The research builds Claude\'s context so the action plan is grounded in specifics.'
      }
    ],
    relatedPlaybooks: [
      { id: 'cc-5', title: 'Artifacts & Interactive Outputs', slug: 'claude-105-artifacts-and-interactive-outputs' },
      { id: 'cc-1', title: 'Your First Conversation with Claude', slug: 'claude-101-your-first-conversation' },
      { id: 'cc-7', title: 'The 60-Second ChatGPT to Claude Migration', slug: 'chatgpt-to-claude-migration-guide' }
    ]
  },
  {
    id: 'cc-7',
    slug: 'chatgpt-to-claude-migration-guide',
    title: 'The 60-Second ChatGPT to Claude Migration',
    subtitle: 'Bring your memory, context, and history from ChatGPT into the Claude ecosystem',
    category: 'Claude Crash Course',
    difficulty: 'Beginner',
    timeToComplete: 5,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    isNew: true,
    tools: ['Claude'],
    beforeYouStart: [
      'A ChatGPT account with conversation history you want to migrate',
      'A Claude account (Pro or Team plan recommended for full Project features)',
      '60 seconds of time'
    ],
    expectedOutcome: 'Your ChatGPT context and memory successfully imported into Claude, along with a new Claude Project seeded with your historical data.',
    troubleshooting: [
      {
        problem: 'The import file is too large',
        solution: 'ChatGPT exports everything. If the file is too big, unzip it and upload only the conversation.json file, or ask Claude to summarize the ZIP first.'
      }
    ],
    steps: [
      {
        id: 'cc7-s1',
        stepNumber: 1,
        title: 'Export Your Data from ChatGPT',
        instruction: 'Go to ChatGPT Settings → Data Controls → Export Data. OpenAI will email you a ZIP file containing your entire chat history.',
        promptTemplate: 'No prompt needed for this step. Check your email for the export link from OpenAI.',
        expectedOutput: 'A .zip file in your inbox containing your historical data.',
        tips: 'This usually takes 5-15 minutes to arrive. While you wait, think about which 3-5 conversations were most valuable to your workflow.'
      },
      {
        id: 'cc7-s2',
        stepNumber: 2,
        title: 'Import Memory to Claude',
        instruction: 'Open Claude and click on your Profile → Settings → Memory. Use the "Import from ChatGPT" feature to upload your exported data.',
        promptTemplate: 'No prompt needed. Use the native import tool in Claude settings.',
        expectedOutput: 'Claude will analyze your history and populate its memory with your preferences, style, and context.',
        tips: 'Memory is best for "global" context (your name, tone, role) while Projects are best for "specific" context (a client, a coding project, a book).'
      },
      {
        id: 'cc7-s3',
        stepNumber: 3,
        title: 'Set Up Your First Workspace Project',
        instruction: 'Now that memory is moved, create a Project to hold your specific task-based files. Tell Claude to help you organize the migration.',
        promptTemplate: `I have just imported my memory from ChatGPT. I want to set up a new Project called "[PROJECT NAME]" to continue my work on [TOPIC/WORKFLOW].

Please review my imported memory and tell me:
1. What style or tone preferences did you pick up?
2. What recurring tasks did you notice in my history?
3. What files should I upload next to make this project truly autonomous?`,
        expectedOutput: 'A structured workspace plan that leverages your historical data to skip the onboarding phase entirely.',
        tips: 'This is the "Migration as a Service" secret: you\'re not just moving text, you\'re moving your intelligence layer.'
      }
    ],
    relatedPlaybooks: [
      { id: 'cc-4', title: 'Projects & Persistent Context', slug: 'claude-104-projects-and-persistent-context' },
      { id: 'cc-6', title: 'Research Mode & Deep Dives', slug: 'claude-106-research-mode-and-deep-dives' }
    ]
  },
];

export const leadMagnetPlaybooks: Playbook[] = [
  {
    id: 'lm-1',
    slug: 'the-operating-system-prompt',
    title: 'The "Business Operating System" Master Prompt',
    subtitle: 'The one prompt to turn a fresh Claude Project into a context-aware business partner',
    category: 'Lead Magnets',
    difficulty: 'Beginner',
    timeToComplete: 2,
    timeSaved: 60,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    isNew: true,
    tools: ['Claude'],
    beforeYouStart: ['A fresh Claude Project'],
    expectedOutcome: 'A Project Instructions file that defines every role, communication channel, and goal of your team.',
    troubleshooting: [
      {
        problem: 'Claude ignores the OS structure and answers questions without referencing the uploaded documents',
        solution: 'Add an explicit instruction at the top of the Project Instructions: "Before responding to ANY request, check which of the three knowledge base documents is most relevant and state which one you are drawing from." This forces Claude to reference the OS actively, not passively.'
      },
      {
        problem: 'The Brand.md, CRM.csv, or Services.md documents are too long and Claude loses track of key details',
        solution: 'Add a "Summary" section at the top of each document with the 5 most important facts in bullet points. Claude prioritizes context near the beginning of documents — front-loading the key information improves recall significantly.'
      }
    ],
    steps: [
      {
        id: 'lm1-s1',
        stepNumber: 1,
        title: 'Initialize the Brain',
        instruction: 'Paste this into your Project Instructions.',
        promptTemplate: `Act as the Chief Operating Officer for [COMPANY NAME]. Your mission is to maintain a "Business Operating System" within this Project.

Your Knowledge Base consists of:
1. Our Brand Voice (Document: Brand.md)
2. Our Active Clients (Document: CRM.csv)
3. Our Service SOPs (Document: Services.md)

Whenever I ask you to perform a task, you must first reference these three documents to ensure the output is aligned with our company operating system.`,
        expectedOutput: 'Claude confirms it has internalized the OS structure.',
        tips: 'This is the foundation of "Migration as a Service".'
      }
    ],
    relatedPlaybooks: []
  }
];

// Cowork Plugin Playbooks – defined in separate file for maintainability
export { coworkPluginPlaybooks } from './coworkPluginPlaybooks';

// Designer AI Shipping Playbook
export const designerAIPlaybooks: Playbook[] = [
  {
    id: 'dai-3',
    slug: '90-percent-design-system-generator',
    title: 'The 90% Design System Generator',
    subtitle: 'Free up your engineering bandwidth. Generate 90% of your production-ready Design System code directly from your Figma files using Claude.',
    category: 'AI for Designers',
    difficulty: 'Advanced',
    timeToComplete: 30,
    timeSaved: 12000, // Roughly a month of dedicated DS engineering
    completionCount: 156,
    rating: 4.8,
    isPro: true,
    isNew: true,
    supportsCodePreview: true,
    tools: ['Figma', 'Claude', 'React/Tailwind'],
    beforeYouStart: [
      'A Figma file with documented Design Tokens (Colors, Typography, Spacing)',
      'Basic knowledge of React and Tailwind CSS',
      'A fresh Claude chat window (Claude Pro recommended)'
    ],
    expectedOutcome: 'A complete, accessible, and structured React+Tailwind component library ready for developers to implement biz logic.',
    troubleshooting: [
      {
        problem: 'Claude hallucinates token names',
        solution: 'Always feed Claude your exact `tailwind.config.ts` or CSS variables file in every new chat or prompt so it never has to guess.'
      },
      {
        problem: 'Components lack accessibility (ARIA)',
        solution: 'Explicitly enforce the rule: "Every component must be fully accessible following WCAG 2.1 AA guidelines, including ARIA labels, focus states, and keyboard navigation support."'
      }
    ],
    steps: [
      {
        id: 'dai-3-s1',
        stepNumber: 1,
        title: 'Extract & Format the Tokens',
        instruction: 'Before generating components, you must establish the "Source of Truth". Extract your Figma Design Tokens into a format Claude and your codebase can understand.',
        promptTemplate: 'I am building a React + Tailwind CSS Design System from my Figma file.\n\nHere are my raw design tokens:\n[PASTE YOUR FIGMA VARIABLES/TOKENS HERE]\n\nPlease format these into a complete, production-ready `tailwind.config.ts` file extending the default theme. Do not use generic names; use the exact semantic names provided in my tokens (e.g., `primary-500`, `surface-muted`).',
        expectedOutput: 'A fully validated `tailwind.config.ts` encapsulating your entire brand identity.'
      },
      {
        id: 'dai-3-s2',
        stepNumber: 2,
        title: 'Generate Core Primitives (Atoms)',
        instruction: 'Build the foundational building blocks of your system first. These are the atoms that every other component will rely on.',
        promptTemplate: 'You are an expert Design Systems Engineer.\n\nUsing the `tailwind.config.ts` we just created, generate the following Core Primitives as React (TypeScript) components:\n1. `<Button />` (Variants: Primary, Secondary, Outline, Ghost, Link | Sizes: sm, md, lg)\n2. `<Input />` (States: Default, Hover, Focus, Error, Disabled)\n3. `<Badge />` (Variants: Success, Warning, Error, Info)\n\nRequirements:\n- Use `cva` (class-variance-authority) for variant management if applicable.\n- Ensure strict TypeScript interfaces.\n- Must be fully accessible (focus rings, ARIA).',
        expectedOutput: 'Production-ready React code for Buttons, Inputs, and Badges supporting all your Figma variants.'
      },
      {
        id: 'dai-3-s3',
        stepNumber: 3,
        title: 'Generate Complex Components (Molecules)',
        instruction: 'Combine your core primitives to build the more complex structures in your design system.',
        promptTemplate: 'Moving on to Molecules.\n\nUsing the `<Button />`, `<Input />`, and `<Badge />` primitives we created, generate the following components:\n1. `<Card />` (With Header, Body, and Footer sub-components)\n2. `<Modal />` (With proper focus trapping and overlay backdrop)\n3. `<DropdownMenu />` (Fully accessible with arrow-key navigation)\n\nRequirements:\n- Adhere strictly to the spacing scale defined in our Tailwind config.\n- Build them composably (e.g. `Card.Header`, `Card.Content`).',
        expectedOutput: 'Composable, accessible React code for Cards, Modals, and Dropdowns.'
      },
      {
        id: 'dai-3-s4',
        stepNumber: 4,
        title: 'Generate Layout Structures (Organisms)',
        instruction: 'Finally, construct the major page layouts and navigation elements that dictate the structure of your application.',
        promptTemplate: 'Finally, let\'s build the Organisms.\n\nGenerate the following layout structures:\n1. `<SidebarNavigation />` (Responsive: collapsible on desktop, off-canvas drawer on mobile)\n2. `<TopNavbar />` (With user profile dropdown and notification bell)\n3. `<DataTable />` (With sortable headers and pagination controls)\n\nRequirements:\n- Must be responsive out of the box using Tailwind breakpoints (`sm:`, `md:`, `lg:`).\n- Use dummy data for the tables and menus so I can visualize them immediately.',
        expectedOutput: 'Responsive layout components ready to be dropped into your routing system.'
      }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'dai-2',
    slug: 'figma-mcp-design-to-code-speedrun',
    title: 'Figma MCP: Design to Code Speedrun',
    subtitle: 'Build production-ready code straight from your Figma files with zero translation loss using Claude Code and Figma MCP.',
    category: 'AI for Designers',
    difficulty: 'Advanced',
    timeToComplete: 15,
    timeSaved: 2400, // Roughly a week of dev handoff time
    completionCount: 342,
    rating: 4.9,
    isPro: true,
    isNew: true,
    supportsCodePreview: false,
    tools: ['Figma', 'Claude Code', 'Cursor'],
    beforeYouStart: [
      'A Figma file with clean Auto Layout and Semantic naming',
      'Figma Personal Access Token',
      'Claude Code installed via Terminal'
    ],
    expectedOutcome: 'A complete, pixel-perfect React application matching your Figma design perfectly.',
    troubleshooting: [
      {
        problem: 'Claude Code cannot access the Figma file and returns a permission error',
        solution: 'Ensure your Figma Personal Access Token has "Read" scope enabled and was generated from the correct Figma account that owns the file. Check Settings → Security → Personal Access Tokens in Figma. Tokens expire — generate a fresh one if the current one is over 90 days old.'
      },
      {
        problem: 'Generated components do not match the Figma design — wrong spacing, colors, or fonts',
        solution: 'The MCP reads structural metadata, not pixel-perfect renders. After the initial code generation, open the Figma Inspect panel, grab the exact px values and hex codes for problem areas, and give Claude explicit corrections: "The card padding should be 24px not 16px, and the text color should be #1A1A2E."'
      },
      {
        problem: 'Cursor loses context halfway through a long build session and starts generating inconsistent code',
        solution: 'Create a CLAUDE.md file in the project root with your design system constants (colors, spacing scale, component names). At the start of each new Cursor session, reference it: "Follow the design system in CLAUDE.md for all styling decisions." This restores context instantly.'
      }
    ],
    steps: [
      {
        id: 'dai-2-s1',
        stepNumber: 1,
        title: 'Analyze Your Full Design',
        instruction: 'Point Claude to your Figma file so it understands the global structure, hierarchy, and aesthetic of your design before writing any code.',
        promptTemplate: 'Read my Figma design at:\nhttps://www.figma.com/design/[YOUR-FILE-ID]/[FILE-NAME]\n\nGive me:\n1. Overview of the page structure\n2. List of main sections\n3. Color palette being used\n4. Typography styles\n5. Any components you can identify',
        expectedOutput: 'A complete structural breakdown of your Figma file natively within Claude.'
      },
      {
        id: 'dai-2-s2',
        stepNumber: 2,
        title: 'Extract Design Tokens',
        instruction: 'Have Claude generate your foundational design tokens (colors, fonts, spacing) so the resulting components perfectly match the design system.',
        promptTemplate: 'From the Figma file, extract and create:\n\n1. A Tailwind config with:\n   - Custom colors matching the design\n   - Font families and sizes\n   - Spacing scale based on what you see\n\n2. CSS variables file as backup\n\nFormat the colors as semantic names (primary, secondary, accent, neutral).',
        expectedOutput: 'A tailwind.config.ts and globals.css file fully populated with your Figma tokens.'
      },
      {
        id: 'dai-2-s3',
        stepNumber: 3,
        title: 'Generate Components',
        instruction: 'Build the foundational atoms and molecules of your design system (Buttons, Cards, Inputs) before assembling the full page.',
        promptTemplate: 'Look at the [COMPONENT NAME] in my Figma file.\n\nGenerate a React component that:\n- Matches the exact styling (colors, spacing, typography)\n- Uses Tailwind CSS\n- Supports all variants I\'ve defined (if any)\n- Is fully typed with TypeScript\n- Includes hover/focus states based on the design',
        expectedOutput: 'Production-ready UI components mapping 1:1 with your Figma variants.'
      },
      {
        id: 'dai-2-s4',
        stepNumber: 4,
        title: 'Build Full Sections',
        instruction: 'Assemble the page section by section (Hero -> Features -> Footer) using the tokens and components you just generated.',
        promptTemplate: 'Generate the [SECTION NAME] section from my Figma design.\n\nRequirements:\n- Match the design exactly\n- Make it responsive:\n  - Mobile (<768px): [describe layout]\n  - Desktop (≥768px): [describe layout]\n- Use semantic HTML (section, nav, main, article)\n- Include all text content from the design',
        expectedOutput: 'A fully responsive, pixel-perfect webpage section.'
      }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'dai-1',
    slug: 'notebooklm-antigravity-product-engine',
    title: 'The NotebookLM + Anti-Gravity Product Engine',
    subtitle: 'Upload research, generate a perfect product blueprint, and ship it instantly utilizing Gemini 3.1 Pro.',
    category: 'AI for Designers',
    difficulty: 'Advanced',
    timeToComplete: 60,
    timeSaved: 4800, // Weeks of product planning
    completionCount: 112,
    rating: 5.0,
    isPro: true,
    isNew: true,
    supportsCodePreview: true,
    tools: ['NotebookLM', 'Google Anti-Gravity', 'Gemini 3.1 Pro'],
    beforeYouStart: [
      'Raw research documents, customer interviews, or market data',
      'Access to Google NotebookLM',
      'Access to Google Anti-Gravity'
    ],
    expectedOutcome: 'A market-ready, high-converting digital product or landing page uniquely positioned based on deep research.',
    troubleshooting: [
      {
        problem: 'NotebookLM gives vague product positioning that could apply to any competitor',
        solution: 'Go back to your uploaded research and highlight the most specific customer pain points — direct quotes from interviews work best. Re-prompt: "Focus only on the pain points that appear in multiple interviews. Ignore generic feedback. What specific frustration drives the most emotional language?"'
      },
      {
        problem: 'Anti-Gravity builds the landing page with generic placeholder copy instead of the blueprint content',
        solution: 'In Step 4, be explicit: "Do NOT use placeholder text anywhere. Every headline, subheading, and bullet point must come directly from the product blueprint I pasted. If you need copy, extract it from there."'
      },
      {
        problem: 'The final product does not load correctly or has broken layout on mobile',
        solution: 'After the initial build, prompt Anti-Gravity: "Test this for mobile responsiveness. Show me the layout at 375px width (iPhone SE) and fix any elements that overflow or stack incorrectly." Always check mobile before shipping — most traffic is mobile-first.'
      }
    ],
    steps: [
      {
        id: 'dai-1-s1',
        stepNumber: 1,
        title: 'Upload Research into NotebookLM',
        instruction: 'Feed all your scattered market research, customer calls, and competitor data into a single NotebookLM source.',
        promptTemplate: 'No specific prompt needed yet. Just upload all PDFs, text files, and transcripts into a new Notebook.',
        expectedOutput: 'A fully loaded NotebookLM environment ready to analyze your specific market data.'
      },
      {
        id: 'dai-1-s2',
        stepNumber: 2,
        title: 'Generate the Product Blueprint',
        instruction: 'Ask NotebookLM to synthesize the research into a concrete product positioning and offer strategy.',
        promptTemplate: 'Act as a world-class Product Strategist. Based on all the uploaded documents, analyze this market and give me: 1) The exact positioning for a new product. 2) An irresistible core offer. 3) A high-converting landing page structure (Hero, Social Proof, Features, FAQ).',
        expectedOutput: 'A detailed, strategic product blueprint grounded entirely in your uploaded data.'
      },
      {
        id: 'dai-1-s3',
        stepNumber: 3,
        title: 'Export the Strategy',
        instruction: 'Review the output, tweak if necessary, and copy the entire blueprint to your clipboard.',
        promptTemplate: 'Format the final approved blueprint cleanly so I can copy everything at once.',
        expectedOutput: 'The finalized product strategy residing on your clipboard.'
      },
      {
        id: 'dai-1-s4',
        stepNumber: 4,
        title: 'Initialize Anti-Gravity',
        instruction: 'Open your codebase with Google Anti-Gravity, powered by Gemini 3.1 Pro, and prepare your development environment.',
        promptTemplate: 'Please review the following product blueprint. Do not build it yet, just acknowledge you understand the structure and positioning: [Paste Blueprint Here]',
        expectedOutput: 'Anti-Gravity confirms understanding of the exact product specifications.'
      },
      {
        id: 'dai-1-s5',
        stepNumber: 5,
        title: 'Build the High-Converting Product',
        instruction: 'Instruct Anti-Gravity to execute the blueprint and build the actual product interface or landing page.',
        promptTemplate: 'You are now a world-class frontend engineer and UI/UX designer. Based on the product blueprint we just reviewed, build this high-converting product/landing page. Use modern, premium design aesthetics. Focus on the core offer and structured sections outlined in the blueprint. Build it now.',
        expectedOutput: 'A fully coded, functional, and beautifully designed web product ready to publish.'
      }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'dai-0',
    slug: 'ship-your-app-with-ai-designers-guide',
    title: 'Ship Your App with AI — A Designer\'s Complete Guide',
    subtitle: 'Go from Figma to a live, deployed app using Gemini, Claude, and Antigravity — no engineering team required',
    category: 'AI for Designers',
    difficulty: 'Intermediate',
    timeToComplete: 45,
    timeSaved: 480,
    completionCount: 890,
    rating: 5.0,
    isPro: false,
    isNew: false,
    supportsCodePreview: true,
    tools: ['Claude', 'Gemini', 'ChatGPT'],
    beforeYouStart: [
      'A Figma design (or clear visual reference) for the app you want to build',
      'Your design system documented — colors, typography, spacing, components (even rough notes work)',
      '45-60 minutes of focused time'
    ],
    expectedOutcome: 'A fully functional, styled web app built from your design system, pushed to your GitHub repository — ready to deploy on Vercel, Netlify, or any hosting platform.',
    troubleshooting: [
      {
        problem: 'Gemini ignores my design tokens and uses its own styles',
        solution: 'Be more explicit. Instead of "use my brand colors", say "ONLY use these exact hex values: primary: #1A1A2E, accent: #E94560. Do NOT use any other colors. If you need a shade, use opacity variants of these."'
      },
      {
        problem: 'Claude generates a different tech stack than what I wanted',
        solution: 'State the stack upfront: "Use React + TypeScript + Vite. Do NOT use Next.js, Vue, or any other framework. Do NOT add TailwindCSS."'
      },
      {
        problem: 'The AI-generated code looks nothing like my design',
        solution: 'Break it down smaller. Don\'t ask for the full page — ask for one component at a time. Start with the nav bar, verify it matches, then move to the hero section, etc.'
      }
    ],
    steps: [
      {
        id: 'dai0-s1',
        stepNumber: 1,
        title: 'Extract Your Design System into Code-Ready Tokens',
        instruction: 'Before any AI touches your code, you need your design system in a format AI can work with. Open your Figma file and extract every design decision into a structured document. This is the most important step — it becomes the "source of truth" that every AI tool will reference.',
        promptTemplate: `I'm a designer preparing to build my app with AI. Help me create a complete design system document from my design specs.

Here are my design tokens:

**Colors:**
- Primary: [PRIMARY COLOR HEX]
- Secondary: [SECONDARY COLOR HEX]
- Background: [BACKGROUND COLOR HEX]
- Text Primary: [MAIN TEXT COLOR HEX]

**Typography:**
- Font Family: [FONT FAMILY NAME]
- Base spacing unit: [BASE SPACING PIXELS]px
- Border radius: [BORDER RADIUS PIXELS]px

Convert this into a complete CSS file (index.css) with:
1. CSS custom properties (variables) on :root
2. A CSS reset
3. Base typography styles
4. Utility classes for common patterns
5. Component base styles (buttons, cards, inputs)

Use semantic naming. Make it production-ready.`,
        expectedOutput: 'A complete CSS design system file with custom properties, reset, typography, and component base styles — all using your exact design tokens.',
        tips: 'Pro tip: In Figma, use the "Inspect" panel to grab exact values. If you use Figma Tokens plugin, you can export tokens as JSON and paste them directly into the prompt.',
        tools: ['Claude'],
        hideCodePreview: true
      },
      {
        id: 'dai0-s3',
        stepNumber: 2,
        title: 'Generate the Atomic Components',
        instruction: 'Do not ask the AI to build the "whole page" right away. The secret to production-level AI apps is building bottom-up. Ask it to build the smallest pieces first.',
        promptTemplate: `Using the following design system, build the following component: [COMPONENT NAME (e.g., Primary Button, Feature Card, Nav Bar)]

**Design System:**
- Primary Color: [PRIMARY COLOR HEX]
- Secondary Color: [SECONDARY COLOR HEX]
- Background: [BACKGROUND COLOR HEX]
- Text Primary: [MAIN TEXT COLOR HEX]
- Font Family: [FONT FAMILY NAME]
- Border radius: [BORDER RADIUS PIXELS]px
- Icon Family: [ICON FAMILY (e.g., Lucide or Heroicons)]

**Icon Rules (CRITICAL):**
- Never mix icon systems. Use ONLY the specified Icon Family.
- If Heroicons: Use outline icons, 24px grid, 1.5px stroke, rounded line caps. No gradients or shadows.
- If Lucide: Use 2px stroke, rounded corners, consistent visual weight.
- Maintain consistent optical padding and do not mix stroke weights.

Requirements:
- Written in React (TypeScript) and Tailwind CSS
- Use exact hardcoded hex values or arbitrary Tailwind values (e.g., bg-[#1A1A2E])
- Make it accessible (aria labels, keyboard navigation)
- Add smooth hover states and transitions

Provide the complete, ready-to-use code.`,
        expectedOutput: 'A complete React component (.tsx) fully styled with your design system tokens, with animations and responsive behavior.',
        tips: 'Remember you can edit the prompt text freely! Start with the most important components: NavBar → Hero → Feature Cards → Footer.',
        tools: ['Claude'],
        hideCodePreview: true
      },
      {
        id: 'dai0-s4',
        stepNumber: 3,
        title: 'Assemble Pages and Polish',
        instruction: 'Now combine your components into full pages. Tell the AI which components go on which page, in what order, and ask for micro-interactions.',
        promptTemplate: `Now assemble the [PAGE NAME] page using the components we built.

**Design System (for any new layout elements):**
- Primary Color: [PRIMARY COLOR HEX]
- Secondary Color: [SECONDARY COLOR HEX]
- Background: [BACKGROUND COLOR HEX]
- Font Family: [FONT FAMILY NAME]

Page layout (top to bottom):
1. NavBar component
2. Hero Section 
3. [SPECIFIC COMPONENT NAME]
4. Footer component

Polish Requirements:
- Page title: "[PAGE SEO TITLE]"
- Ensure heading hierarchy is correct (one h1 per page)
- Check that all buttons have a subtle scale on hover (1.02)
- Mobile layout: ensure navigation collapses to a hamburger menu and Touch targets are minimum 44x44px.`,
        expectedOutput: 'A complete page component assembling all your individual components, with proper routing, scroll animations, and responsive layout.',
        tips: 'Now that the page is assembled, click the "Test Live Component" button below to preview the code in your browser! Use specific feedback in chat to tweak the design.',
        tools: ['Claude']
      }
    ],
    relatedPlaybooks: [
      { id: 'dai-1', title: 'Designer\'s AI Shipping Playbook (V2)', slug: 'figma-to-production-cowork-claude-code' }
    ]
  },
  {
    id: 'dai-1',
    slug: 'figma-to-production-cowork-claude-code',
    title: "Designer's AI Shipping Playbook (V2)",
    subtitle: 'From Figma to production with Cowork & Claude Code — 2026 Edition. Connect the Figma MCP to generate code, iterate visually, and push to GitHub without an engineer.',
    category: 'AI for Designers',
    difficulty: 'Intermediate',
    timeToComplete: 30,
    timeSaved: 1200,
    completionCount: 1420,
    rating: 5.0,
    isPro: true,
    isNew: true,
    tools: ['Claude Cowork', 'Claude Code', 'Figma MCP'],
    beforeYouStart: [
      'Have Claude Desktop installed (for Cowork) OR Claude Code installed in your terminal',
      'Have a Figma Personal Access Token (Settings → Personal Access Tokens)',
      'A Figma frame URL (right-click a specific frame in Figma → Copy link)'
    ],
    expectedOutcome: 'You will learn how to connect Claude to your Figma designs via MCP, generate structurally faithful code (React/Tailwind/HTML), iterate with visual feedback, and push to a new branch in your GitHub repository.',
    troubleshooting: [
      {
        problem: 'Claude says it cannot read the Figma file',
        solution: 'Make sure you are pasting the URL of a specific **Frame** (node-id), not the entire File URL. Ensure your Personal Access Token is active and has read permissions.'
      },
      {
        problem: 'The generated code ignores my padding or spacing',
        solution: 'If your elements in Figma are free-floating, the API reads them as absolute coordinates. Always use Auto-Layout in Figma before handoff to guarantee perfect flexbox generation.'
      },
      {
        problem: 'Claude Code pushes directly to main',
        solution: 'Always explicitly state "create a new branch called design/feature". Never let the AI choose the branching strategy without oversight.'
      }
    ],
    steps: [
      {
        id: 'dai1-s1',
        stepNumber: 1,
        title: 'Choose Your Tool: Cowork vs. Claude Code',
        instruction: 'Decide which tool fits your goal. Use **Cowork** (in the Claude desktop app) if you have no coding experience, want to go from a Figma URL to working code fast, and push to GitHub without hitting a terminal. Use **Claude Code** (terminal) if you want full codebase context, live test loops, and multi-file integration.',
        promptTemplate: 'No prompt needed for this step.\n\nDownload Claude Desktop to use Cowork, or install Claude Code by running:\ncurl -fsSL https://claude.ai/install.sh | bash',
        expectedOutput: 'You have chosen your AI agent and have the tool ready on your machine.',
        tips: 'The honest summary: Cowork is the fastest path from Figma to working code. Claude Code is the most powerful path from design to production-quality, integrated code.',
        tools: ['Claude']
      },
      {
        id: 'dai1-s2',
        stepNumber: 2,
        title: 'Connect Figma via MCP',
        instruction: 'Both tools use the Model Context Protocol (MCP) to read your actual design data (layers, tokens, spacing) — not just a flattened screenshot.',
        promptTemplate: 'For Cowork:\nSearch for the "Figma" connector in the UI and click Connect. Authenticate your account.\n\nFor Claude Code (run in terminal):\nclaude mcp add figma --env FIGMA_ACCESS_TOKEN="[YOUR_FIGMA_TOKEN]"',
        expectedOutput: 'Claude now has deep, structural read access to your Figma files directly through the API.',
        tips: 'Fact Check: You can just connect your Figma from Cowork, and then move to Claude Code! Once connected in the desktop app, it shares the MCP configuration automatically.',
        tools: ['Claude Cowork', 'Claude Code', 'Figma MCP']
      },
      {
        id: 'dai1-s3',
        stepNumber: 3,
        title: 'Extract the Design & Generate Code',
        instruction: 'Now, pass the exact Figma frame URL to Claude. Specify your tech stack upfront to prevent generic output.',
        promptTemplate: 'Read this Figma frame URL: [YOUR_FIGMA_FRAME_URL]\n\nTurn this specific screen into a fully functioning, responsive webpage using React, Tailwind V3, and TypeScript. \n\nComponents live in `/src/components`. Use the exact design tokens, hex colors, and spacing from the Figma file.',
        expectedOutput: 'Claude fetches the design context, reads the layout constraints, colors, and typography, and generates clean, structured code in your preferred format.',
        tips: 'Always share the exact Figma frame URL (right-click the specific frame → Copy link). Don\'t share a general page URL — the frame link gives the AI the precise node ID it needs.',
        tools: ['Claude Cowork', 'Claude Code']
      },
      {
        id: 'dai1-s4',
        stepNumber: 4,
        title: 'Refine and Iterate Visually',
        instruction: 'The first pass is rarely perfect. Open the newly generated code in your local browser, take a screenshot of any issue, and drop it back into the chat.',
        promptTemplate: '[ATTACH YOUR SCREENSHOT]\n\nThe button spacing looks wrong here — fix it to match the padding in the original Figma frame.\n\nAlso, make sure the mobile layout stacks these cards vertically instead of horizontally.',
        expectedOutput: 'Visual feedback loops work beautifully. Claude analyses the screenshot, cross-references it with its code, and applies the exact css fixes needed to match the design intent.',
        tips: 'Instead of trying to speak "developer", use screenshots to point out visual bugs. Claude understands visual UI flaws inherently.',
        tools: ['Claude']
      },
      {
        id: 'dai1-s5',
        stepNumber: 5,
        title: 'Push to GitHub Safely',
        instruction: 'Once the design matches, use the agent to push your work to the repository. Cowork can do this directly through the chat; Claude Code does it via the terminal. Always use a new branch!',
        promptTemplate: 'Push these changes to my repository at [REPO_URL].\n\nCreate a new branch named `design/[feature-name]` and include a commit message summarizing the design implementation.',
        expectedOutput: 'The AI clones the repo (if needed), creates the branch, stages the files, writes a professional commit message, and pushes to GitHub.',
        tips: 'Batch your screens! Provide a list: "Here are 5 Figma URLs for the onboarding flow — code each one and push to a single branch." It is dramatically more efficient.',
        tools: ['Claude Cowork', 'Claude Code', 'GitHub']
      }
    ],
    relatedPlaybooks: [
       { id: 'cwp-8', title: 'Figma to React with Claude Code & MCP', slug: 'claude-code-figma-mcp-workflow' },
       { id: 'cwp-7', title: 'Figma to Code Automation with Claude Cowork', slug: 'cowork-figma-code-to-canvas' }
    ]
  },
  {
    id: 'dai-2',
    slug: 'build-modern-landing-page-ai',
    title: "Build a Modern Landing Page in Minutes",
    subtitle: 'From a blank screen to a stunning, responsive landing page using Claude and Tailwind CSS. Perfect for product launches.',
    category: 'AI for Designers',
    difficulty: 'Beginner',
    timeToComplete: 15,
    timeSaved: 240,
    completionCount: 532,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'ChatGPT'],
    beforeYouStart: [
      'Have ideas for your brand colors (e.g., "Deep Purple and Neon Pink")',
      'Know what your main Call to Action is (e.g., "Join the Waitlist")'
    ],
    expectedOutcome: 'A fully responsive React component containing a hero section, feature grid, and footer, styled perfectly with Tailwind CSS.',
    troubleshooting: [
      {
        problem: 'The design looks too generic',
        solution: 'Use specific descriptive keywords in your prompt like "glassmorphism", "dark mode", "brutalist", or "minimalist Apple style".'
      }
    ],
    steps: [
      {
        id: 'dai2-s1',
        stepNumber: 1,
        title: 'Define the Structure',
        instruction: 'Ask the AI to generate the raw React structure of your landing page using a modern stack.',
        promptTemplate: 'Generate a modern landing page for [PRODUCT NAME]. \n\nIt must be a single file React component using Tailwind CSS. \n\nDesign Requirements:\n- The primary brand color is [PRIMARY TAILWIND COLOR e.g. blue-600]\n- The secondary accent color is [SECONDARY TAILWIND COLOR e.g. emerald-400]\n\nInclude a Hero section with a gradient text headline, a 3-column feature grid, and Call to Action section. The main CTA button should say "[MAIN CTA TEXT]". Use Lucide React icons.',
        expectedOutput: 'Claude will write a complete `App.tsx` file containing the semantic HTML and Tailwind classes.',
        tips: 'You can freely edit the prompt text before copying it. Always specify "single file React component" if you just want something easy to copy and paste!',
        tools: ['Claude'],
        hideCodePreview: true
      },
      {
        id: 'dai2-s2',
        stepNumber: 2,
        title: 'Refine the Aesthetics',
        instruction: 'Review the generated code in the live preview. Iterate on the colors and spacing by asking follow-up questions.',
        promptTemplate: 'Make the hero section background a dark gradient from #0f172a to [DARK GRADIENT END HEX]. Increase the padding on the feature cards, and make the main "[MAIN CTA TEXT]" button use a vibrant hover effect with shadow.',
        expectedOutput: 'The AI will update the specific Tailwind classes to match your exact visual requirements.',
        tips: 'Now that the basic layout exists, copy this prompt into Claude or v0.dev to iterate! You can use exact hex codes in your prompt — the AI perfectly understands color theory.',
        tools: ['Claude'],
        hideCopilot: true
      }
    ],
    relatedPlaybooks: [
       { id: 'dai-3', title: 'Create a SaaS Dashboard Web App', slug: 'create-saas-dashboard-app' }
    ]
  },
  {
    id: 'dai-3',
    slug: 'create-saas-dashboard-app',
    title: "Create a SaaS Dashboard Web App",
    subtitle: 'Generate a complex, data-rich dashboard interface with charts, sidebars, and data tables entirely through prompting.',
    category: 'AI for Designers',
    difficulty: 'Intermediate',
    timeToComplete: 20,
    timeSaved: 600,
    completionCount: 315,
    rating: 4.8,
    isPro: true,
    isNew: true,
    tools: ['Claude', 'Gemini'],
    beforeYouStart: [
      'Basic understanding of what metrics you want to display on your dashboard'
    ],
    expectedOutcome: 'A complex React dashboard layout featuring a collapsible sidebar, a top navigation bar, and a main content area with mock metric cards.',
    troubleshooting: [
      {
        problem: 'The dashboard does not fit on mobile screens',
        solution: 'Tell the AI: "Ensure the sidebar is hidden behind a hamburger menu on mobile, and stack the metric cards vertically on small screens using Tailwind md: classes."'
      }
    ],
    steps: [
      {
        id: 'dai3-s1',
        stepNumber: 1,
        title: 'Generate the Shell',
        instruction: 'Start by generating the layout shell (sidebar, header, content area) before filling it with complex data.',
        promptTemplate: 'Create a highly modern SaaS Admin Dashboard layout in React and Tailwind CSS for a [TARGET INDUSTRY OR PLATFORM] application. \n\nRequire a [SIDEBAR THEME e.g. dark-mode] styled left sidebar with navigation links ([SIDEBAR LINK 1], [SIDEBAR LINK 2], [SIDEBAR LINK 3]). Require a top sticky header with a user avatar and search bar. The main content area should have a light gray background.',
        expectedOutput: 'A clean, responsive dashboard shell ready for data widgets.',
        tips: 'Remember to edit the sidebar links in the prompt! Breaking the generation into "Shell" then "Widgets" helps the AI write more focused, precise code.',
        tools: ['Claude'],
        hideCodePreview: true
      },
      {
        id: 'dai3-s2',
        stepNumber: 2,
        title: 'Add the Data Widgets',
        instruction: 'Now instruct the AI to build the interior widgets and data visualizations.',
        promptTemplate: 'Inside the main content area of the previous code, add a grid of 4 metric cards ([METRIC 1 TITLE], [METRIC 2 TITLE], [METRIC 3 TITLE], [METRIC 4 TITLE]). \n\nBelow that, add a recent activity data table with 5 mock rows showing [TABLE DATA TYPE e.g. recent transactions]. The table should have status badges (e.g. Completed, Pending).',
        expectedOutput: 'The AI will populate the main content area with beautifully styled data components.',
        tips: 'Now that the dashboard is assembled, copy this prompt to Claude or v0.dev to generate the full layout!',
        tools: ['Claude'],
        hideCopilot: true
      }
    ],
    relatedPlaybooks: [
       { id: 'dai-2', title: 'Build a Modern Landing Page in Minutes', slug: 'build-modern-landing-page-ai' }
    ]
  },
  {
    id: 'career-1',
    slug: 'indeed-job-matcher-resume-tailor',
    title: 'Indeed Job Matcher & Resume Tailor',
    subtitle: 'Paste your resume, find your top 10 Indeed matches from the last 24–72 hours, and get a tailored resume + cover letter in minutes',
    category: 'Career',
    difficulty: 'Beginner',
    timeToComplete: 15,
    timeSaved: 180,
    completionCount: 0,
    rating: 4.9,
    isPro: false,
    isNew: true,
    tools: ['Claude', 'Indeed'],
    beforeYouStart: [
      'Your resume as a PDF or plain text (copy-paste works fine)',
      'A Claude.ai account with the Indeed connector enabled (Settings → Integrations)',
      'Your target job title, location, and remote preference ready'
    ],
    expectedOutcome: 'A ranked list of the 10 best-matched Indeed jobs posted in the last 24–72 hours, plus a tailored version of your resume and a cover letter for your top pick.',
    troubleshooting: [
      {
        problem: 'Indeed connector is not available in Claude settings',
        solution: 'Make sure you are on a Claude.ai Pro or Team plan. Connectors are not available on the free tier. Go to claude.ai → Settings → Integrations to enable Indeed.'
      },
      {
        problem: 'Too few results with hoursback=24',
        solution: 'Increase to hoursback=72 or hoursback=168 (7 days). Niche roles post less frequently — a longer window gives you more signal.'
      },
      {
        problem: 'Claude returns generic resume rewrites',
        solution: 'Paste the full job description text into the prompt, not just the job title. The more specific the JD, the more targeted the tailoring.'
      },
      {
        problem: 'Jobs returned are in the wrong location',
        solution: 'Be explicit: add your city or "remote only" to the search prompt. E.g. "Senior Product Manager, London, hybrid" or "fully remote, US only".'
      }
    ],
    steps: [
      {
        id: 'career1-s1',
        stepNumber: 1,
        title: 'Extract Your Career Profile',
        instruction: 'Open claude.ai and paste your full resume into a new conversation. Use the prompt below to extract a structured career profile. This becomes your "source of truth" for matching — save the output, you\'ll reference it in every step.',
        promptTemplate: `I'm going to give you my resume. Extract a structured career profile I can use for job matching.

[Paste your full resume here]

From my resume, extract and format:

**My Core Role Titles** (the 3–5 job titles that best describe me)
**Years of Experience** (total, and by domain)
**Key Skills** (hard skills, tools, languages, certifications — bullet list)
**Industry Background** (sectors I've worked in)
**Seniority Level** (IC, Manager, Director, VP, etc.)
**Education & Credentials**
**Standout Achievements** (3–5 metrics-backed wins from my experience)
**What I'm Looking For** (infer from career trajectory — I'll correct you if wrong)

Format this as a clean profile I can copy and paste into future prompts.`,
        expectedOutput: 'A structured 1-page career profile with your skills, experience, seniority, and standout achievements clearly formatted.',
        tips: 'If your resume is a PDF, copy the text out first. LinkedIn\'s "Save as PDF" → open in browser → select all text works well. The richer your resume, the better the matches.',
        tools: ['Claude']
      },
      {
        id: 'career1-s2',
        stepNumber: 2,
        title: 'Search Indeed for Fresh Matches',
        instruction: 'Still in the same Claude conversation, run the prompt below. Claude will use the Indeed connector to search live job listings. Set the hoursback value to control how fresh the results are — 24 is very fresh, 72 is a good balance of volume and recency.',
        promptTemplate: `Using the Indeed connector, search for jobs that match my career profile above.

**Search parameters:**
- Job titles to search: [e.g. "Senior Product Manager", "Head of Product", "Group Product Manager"]
- Location: [e.g. London / New York / Remote]
- Remote preference: [Remote / Hybrid / On-site / Any]
- hoursback: [24 = last 24 hrs | 72 = last 3 days | 168 = last week]
- Exclude: [any industries or company types to avoid, e.g. "staffing agencies"]

For each result, return:
| # | Job Title | Company | Location | Posted | Match Score (1–10) | Why It Matches |
|---|---|---|---|---|---|---|

Score each job against my career profile. Rank by match score. Return the top 10.`,
        expectedOutput: 'A ranked table of 10 Indeed jobs with match scores and a 1-line reason each is a strong fit for your profile.',
        tips: 'Run 2–3 searches with different job title variants to cast a wider net. Save the full table — you\'ll pick your top target from it in the next step.',
        tools: ['Claude', 'Indeed']
      },
      {
        id: 'career1-s3',
        stepNumber: 3,
        title: 'Deep-Dive Your Top 3 Picks',
        instruction: 'Pick your top 3 jobs from the table. For each one, ask Claude to pull the full job description and score it more precisely against your profile. This surfaces gaps you\'ll need to address in your resume.',
        promptTemplate: `For each of these 3 jobs from the Indeed results above, retrieve the full job description and do a detailed match analysis:

1. [Job Title – Company]
2. [Job Title – Company]
3. [Job Title – Company]

For each job, output:

**Role:** [Title, Company, Location, Salary if listed]
**Match Score:** X/10
**Why You're a Strong Fit:** (3 bullet points citing specific experience from my profile)
**Gaps to Address:** (skills or experience in the JD that aren't obvious in my current resume)
**Tailoring Priority:** High / Medium / Low

Rank the 3 jobs by overall opportunity (fit × role quality × company).`,
        expectedOutput: 'A side-by-side analysis of your top 3 picks with fit scores, gap analysis, and a recommended priority order.',
        tips: 'Pay close attention to the Gaps section — these are exactly the points your tailored resume needs to speak to. Don\'t fabricate experience; instead, surface adjacent experience that maps to the gap.',
        tools: ['Claude', 'Indeed']
      },
      {
        id: 'career1-s4',
        stepNumber: 4,
        title: 'Tailor Your Resume for the #1 Role',
        instruction: 'Pick your highest-priority job. Paste the full job description into Claude and ask it to rewrite your resume to match. The goal is a targeted, keyword-optimised version — not a fabricated one.',
        promptTemplate: `Rewrite my resume to be tailored for this specific role. Do not fabricate experience — only reposition, reframe, and reorder what's already there.

**Target Role:**
[Paste full job description here]

**My Current Resume / Career Profile:**
[Paste your resume or the profile from Step 1]

Instructions:
1. Rewrite the summary/objective to speak directly to this role's priorities
2. Reorder bullet points so the most relevant achievements appear first
3. Mirror keywords and phrases from the job description where truthfully applicable
4. Quantify any bullet points that are currently vague (prompt me for numbers if needed)
5. Remove bullet points that have zero relevance to this role
6. Flag any gaps from the JD that I should address in a cover letter instead

Output the full rewritten resume in clean text format, ready to paste into Google Docs.`,
        expectedOutput: 'A fully tailored version of your resume, keyword-optimised for the target role, in clean text format ready to copy into your preferred template.',
        tips: 'Run this for your top 2–3 jobs if you\'re applying to multiple roles. Each tailored version should feel distinct — generic resumes get filtered out by ATS before a human ever reads them.',
        tools: ['Claude']
      },
      {
        id: 'career1-s5',
        stepNumber: 5,
        title: 'Write the Cover Letter',
        instruction: 'With your tailored resume ready, generate a high-signal cover letter for the role. This prompt produces a letter that feels personal, not templated.',
        promptTemplate: `Write a cover letter for this role using my tailored resume above as the source of truth.

**Role:** [Job Title] at [Company Name]
**Hiring Manager name (if known):** [Name or "not known"]
**One thing I know about this company that I genuinely find interesting:** [e.g. "their recent Series B to expand into EMEA"]
**The single biggest gap in my profile vs this JD:** [Gap from Step 3 analysis]

Guidelines:
- Opening: Lead with why THIS company, not a generic "I am excited to apply"
- Para 2: 2–3 strongest relevant achievements, specific and metrics-backed
- Para 3: Address the gap honestly — frame adjacent experience or show learning momentum
- Closing: Clear call to action, professional tone
- Length: 3–4 short paragraphs, under 350 words
- Tone: Confident, specific, human — not corporate buzzword soup

Output the letter ready to paste. Then give me 2 alternative opening lines I could swap in.`,
        expectedOutput: 'A 3–4 paragraph cover letter under 350 words, tailored to the specific company and role, plus 2 alternative opening lines.',
        tips: 'The "one thing I genuinely find interesting" line is the most important input — it\'s what makes the letter feel real. Spend 5 minutes on the company\'s latest blog post, press release, or LinkedIn before filling this in.',
        tools: ['Claude']
      }
    ],
    agentAutomation: {
      description: 'Automate daily job alerts — Claude searches Indeed every morning and emails you a ranked shortlist of new matches before 9 AM.',
      trigger: 'Every weekday at 7 AM via Make.com',
      actions: [
        'Claude searches Indeed with your saved job titles, location, and hoursback=24',
        'Scores each result against your stored career profile',
        'Filters to matches scoring 7/10 or above',
        'Sends you a formatted email with the shortlist and direct Indeed links',
        'Logs all results to a Google Sheet for tracking'
      ],
      setupSteps: [
        { title: 'Store your career profile', description: 'Save your Step 1 career profile output in a Google Doc — the automation will reference this file.' },
        { title: 'Set your search parameters', description: 'Add your job titles, location, and minimum match score to a Make.com data store.' },
        { title: 'Connect Indeed via Make.com', description: 'Use Make\'s Indeed module or an HTTP module with the Indeed Publisher API to pull fresh listings.' },
        { title: 'Connect Claude for scoring', description: 'Pipe each job listing to Claude with your career profile and ask for a 1–10 match score.' },
        { title: 'Set up email + Google Sheets', description: 'Route 7+ scores to your email digest and log everything to Sheets for tracking your pipeline.' }
      ],
      tools: ['Make.com', 'Claude', 'Indeed', 'Google Sheets', 'Gmail']
    },
    relatedPlaybooks: [
      { id: '1', title: 'Account Research Brief', slug: 'account-research-brief' }
    ]
  },
  {
    id: 'career-2',
    slug: 'tiktok-creator-outreach',
    title: 'TikTok Creator Outreach Agent',
    subtitle: 'Discovers 20 creators in your niche, researches their content, and writes personalized DMs — weekly, automatically',
    category: 'Growth',
    difficulty: 'Beginner',
    timeToComplete: 2,
    timeSaved: 300,
    completionCount: 0,
    rating: 4.9,
    isPro: true,
    isNew: true,
    tools: ['Claude', 'Apify', 'TikTok'],
    beforeYouStart: [
      'Your brand name and product description (1–2 sentences)',
      'Your niche keyword (e.g. "fitness", "skincare", "home decor")',
      'Target follower range (e.g. 10,000–500,000)',
      'Preferred outreach tone (e.g. "casual and friendly" or "professional")',
    ],
    expectedOutcome: 'Every week: a scored list of 20 TikTok creators in your niche with engagement data, content summaries, and a personalized outreach DM for each — delivered to your inbox.',
    troubleshooting: [
      {
        problem: 'Fewer than 20 creators returned',
        solution: 'Broaden your niche keyword (e.g. "skin" instead of "skincare routine") or widen your follower range to capture more results.'
      },
      {
        problem: 'DMs feel generic or templated',
        solution: 'Make sure your brand product description is specific and detailed — the more context Claude has, the more targeted the DMs.'
      },
      {
        problem: 'Apify scrape returns no results',
        solution: 'Check that your APIFY_API_KEY is set correctly in Supabase Edge Function secrets and that the key has sufficient credits.'
      },
      {
        problem: 'Creators don\'t match my niche',
        solution: 'Try a more specific hashtag keyword. Instead of "fitness" try "homeworkout" or "gymtok" to narrow the audience.'
      }
    ],
    steps: [
      {
        id: 'tiktok-s1',
        stepNumber: 1,
        title: 'Define Your Creator Profile',
        instruction: 'Before searching, get crystal-clear on who you\'re looking for. Paste this prompt into Claude with your brand details filled in.',
        promptTemplate: `I'm looking for TikTok creators to partner with for [brand_name], which sells [brand_product].

Define my ideal creator profile:
- Niche: [niche]
- Follower range: [follower_min] – [follower_max]
- Engagement rate target: 3%+ (micro-influencer sweet spot)
- Content style signals: what type of content would indicate brand alignment?
- Red flags: what content or behaviours should disqualify a creator?

Output a 1-paragraph creator brief I can use as a filter when reviewing profiles.`,
        expectedOutput: 'A clear creator brief defining your ideal partner — niche, follower range, content style, and red flags.',
        tips: 'Save this brief — you\'ll use it to evaluate each creator you find in Steps 2 and 3.',
        tools: ['Claude']
      },
      {
        id: 'tiktok-s2',
        stepNumber: 2,
        title: 'Search TikTok by Hashtag',
        instruction: 'Go to TikTok and search for your niche hashtag (e.g. #skincareRoutine, #homeworkout). Sort by "Most Liked" to find the top creators in that space. Open 20–30 profiles and paste their details below.',
        promptTemplate: `Evaluate these TikTok creators for a brand partnership with [brand_name] ([brand_product]).

Creator Brief: [Paste your brief from Step 1]

Creators to evaluate:
[Paste creator handles, follower counts, and recent video descriptions]

For each creator, score them 1–10 on brand fit and explain why in one sentence.
Output a table: Handle | Followers | Fit Score | Reason`,
        expectedOutput: 'A scored table of creators ranked by brand fit, with a one-sentence rationale for each score.',
        tips: 'Focus on creators whose recent content naturally intersects with your product\'s use case — authenticity converts better than reach.',
        tools: ['Claude', 'TikTok']
      },
      {
        id: 'tiktok-s3',
        stepNumber: 3,
        title: 'Research Top Creators',
        instruction: 'Take your top 10 scoring creators and dig deeper. Watch 3–5 recent videos for each. Note their hook style, recurring themes, and any brand mentions. Paste your notes into Claude for DM generation.',
        promptTemplate: `Write personalized outreach DMs for these TikTok creators on behalf of [brand_name].

Brand: [brand_name]
Product: [brand_product]
Tone: [outreach_tone]

For each creator, write a DM (max 120 words) that:
- Opens with a specific reference to their recent content
- Connects their content style to why [brand_name] is a natural fit
- Includes a clear, low-pressure call to action
- Feels human and personal — not like a template

Creator notes:
[Paste your research notes for each creator]`,
        expectedOutput: 'A personalized outreach DM for each creator, referencing their specific content and connecting it naturally to your brand.',
        tips: 'The best DMs reference a specific video or moment — "I loved your video on X" outperforms generic compliments every time.',
        tools: ['Claude']
      },
      {
        id: 'tiktok-s4',
        stepNumber: 4,
        title: 'Send & Track',
        instruction: 'Send your DMs directly via TikTok\'s creator marketplace or Instagram DM (most creators list their IG in bio). Track responses in a simple spreadsheet: Creator, Date Sent, Response, Status.',
        expectedOutput: 'A live outreach tracker showing which creators have been contacted, responded, and are in negotiation.',
        tips: 'Follow up once after 5–7 days with a lighter message. Many creators miss DMs — one follow-up typically doubles your response rate.',
        tools: ['TikTok']
      }
    ],
    agentAutomation: {
      description: 'Deploy once. Every week Claude discovers 20 fresh creators in your niche, scores their fit, and writes personalized DMs referencing their actual videos.',
      trigger: 'Weekly (Monday 8 AM) via Hoursback Autopilot',
      actions: [
        'Scrapes TikTok via Apify for creators matching your niche hashtags',
        'Filters by your follower range and engagement rate',
        'Analyses each creator\'s recent content, hook style, and brand signals',
        'Scores each creator 1–10 against your brand fit',
        'Writes a personalized outreach DM referencing their specific videos',
        'Delivers scored list + DMs to your inbox',
      ],
      setupSteps: [
        { title: 'Set your brand context', description: 'Fill in brand name, product description, niche keyword, follower range, and outreach tone when deploying.' },
        { title: 'Deploy the agent', description: 'Click "Deploy Autopilot Agent", set your schedule (weekly recommended), done.' },
      ],
      tools: ['Apify', 'Claude', 'TikTok'],
    },
    webhookConfig: {
      supportedTools: [],
      inputs: [
        { id: 'brand_name', label: 'Brand Name', placeholder: 'e.g. GlowSkin', type: 'text' },
        { id: 'brand_product', label: 'Product / Service', placeholder: 'e.g. organic skincare for sensitive skin', type: 'text' },
        { id: 'niche', label: 'Niche Keyword', placeholder: 'e.g. skincare, fitness, home decor', type: 'text' },
        { id: 'follower_min', label: 'Min Followers', placeholder: 'e.g. 10000', type: 'text' },
        { id: 'follower_max', label: 'Max Followers', placeholder: 'e.g. 500000', type: 'text' },
        { id: 'outreach_tone', label: 'Outreach Tone', placeholder: 'e.g. casual and friendly', type: 'text' },
      ],
    },
    relatedPlaybooks: [
      { id: 'career-1', title: 'Indeed Job Matcher & Resume Tailor', slug: 'indeed-job-matcher-resume-tailor' }
    ]
  },
  {
    id: 'dai-4',
    slug: '21st-dev-ai-components',
    title: 'Build Stunning UIs with 21st.dev & Claude',
    subtitle: 'Instantly generate and integrate high-quality, animated React/Tailwind components from 21st.dev using AI.',
    category: 'AI for Designers',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 120,
    completionCount: 412,
    rating: 4.9,
    isPro: false,
    isNew: true,
    supportsCodePreview: true,
    codePreviewFiles: {
      'App.tsx': `import React from 'react';
import { motion } from 'framer-motion';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-bl-full blur-2xl" />
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/5">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 relative z-10">21st.dev Magic</h2>
        <p className="text-neutral-400 mb-8 leading-relaxed relative z-10">
          This is a live preview of a React component using Tailwind CSS and Framer Motion. 
          Use the copy button above to drop this into your app.
        </p>
        <button className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10">
          Copy to Clipboard
        </button>
      </motion.div>
    </div>
  );
}`
    },
    tools: ['21st.dev', 'Claude', 'React/Tailwind'],
    beforeYouStart: [
      'A React/Next.js codebase with Tailwind CSS installed',
      'shadcn/ui or motion.dev installed (depending on component requirements)',
      'A blank page or section where you want to add the UI'
    ],
    expectedOutcome: 'A beautiful, fully functional UI component (like a hero section, pricing table, or animated card) seamlessly integrated into your app.',
    troubleshooting: [
      {
        problem: 'Component looks completely unstyled or broken',
        solution: 'Make sure you have Tailwind CSS properly configured in your project. Check if the component requires specific `framer-motion` or `lucide-react` dependencies.'
      },
      {
        problem: 'Claude generates outdated code for 21st.dev',
        solution: 'Always paste the exact component code or use the "Magic Chat" directly on 21st.dev, then bring the generated code back to your main project in Cursor/Claude.'
      }
    ],
    steps: [
      {
        id: 'dai-4-s1',
        stepNumber: 1,
        title: 'Discover & Select a Component',
        instruction: 'Go to 21st.dev/home. Browse the registry for a component that fits your needs (e.g., an animated hero section, a pricing card, or a bento grid). The marketplace has thousands of high-quality components.',
        promptTemplate: 'No specific prompt needed. Just find a component on 21st.dev that you love.',
        expectedOutput: 'You have selected a component and are viewing its details page.',
        tools: ['21st.dev']
      },
      {
        id: 'dai-4-s2',
        stepNumber: 2,
        title: 'Use the Magic Agent to Customize',
        instruction: 'Instead of just copying the raw code, use the 21st.dev Magic Agent to customize it to your exact needs before integrating.',
        promptTemplate: 'In the 21st.dev Magic Chat input, type:\n\n"Adapt this component for a [YOUR APP TYPE]. Change the primary color to [YOUR HEX CODE], remove the secondary button, and ensure the font matches [YOUR FONT]."',
        expectedOutput: 'A fully customized variation of the component generated directly on 21st.dev.',
        tools: ['21st.dev', 'Claude']
      },
      {
        id: 'dai-4-s3',
        stepNumber: 3,
        title: 'Install Dependencies & Copy Code',
        instruction: 'Look at the installation instructions for your chosen component. Some require additional libraries like framer-motion or clsx.',
        promptTemplate: 'In your terminal, run the specific installation commands provided by 21st.dev (e.g., `npx 21st add <component-name>` or manually `npm install framer-motion lucide-react`). Then copy the component code.',
        expectedOutput: 'Your project has the necessary dependencies installed, and the component code is on your clipboard.'
      },
      {
        id: 'dai-4-s4',
        stepNumber: 4,
        title: 'Integrate with your Codebase via AI',
        instruction: 'Open your project in Cursor, or open a chat with Claude Pro. Paste the component code and ask the AI to wire it up to your actual state or business logic.',
        promptTemplate: 'I am adding this UI component from 21st.dev to my app:\n\n[PASTE COMPONENT CODE]\n\nPlease integrate this into my `LandingPage.tsx`. Replace the placeholder text with actual marketing copy for a [YOUR PRODUCT]. Hook up the "Get Started" button to my authentication flow.',
        expectedOutput: 'The beautiful UI component is now a fully functional part of your application, connected to real data and logic.',
        tools: ['Claude', 'Cursor']
      }
    ],
    relatedPlaybooks: []
  }
];

// Growth Playbooks – E-commerce, Launch & Growth, Personal Brand, Courses & Education
export { ecommercePlaybooks, launchPlaybooks, personalBrandPlaybooks, educationPlaybooks } from './growthPlaybooks';
