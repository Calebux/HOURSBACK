export interface Step {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  promptTemplate?: string;
  expectedOutput?: string;
  screenshotUrl?: string;
  tips?: string;
  tools?: string[];
}

export interface WebhookInput {
  id: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'url' | 'email';
}

export interface WebhookConfig {
  supportedTools: ('make' | 'zapier' | 'clay')[];
  inputs: WebhookInput[];
}

export interface Playbook {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeToComplete: number;
  timeSaved: number;
  completionCount: number;
  rating: number;
  isPro: boolean;
  isNew?: boolean;
  coworkCompatible?: boolean;
  tools: string[];
  beforeYouStart: string[];
  expectedOutcome: string;
  troubleshooting: { problem: string; solution: string }[];
  steps: Step[];
  agentAutomation?: {
    description: string;
    trigger: string;
    actions: string[];
    setupSteps: { title: string; description: string; }[];
    tools: string[];
  };
  webhookConfig?: WebhookConfig;
  relatedPlaybooks: { id: string; title: string; slug: string }[];
}

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
    tools: ['Perplexity', 'ChatGPT'],
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
        id: 'step-1',
        stepNumber: 1,
        title: 'Gather Raw Intelligence',
        instruction: 'Go to perplexity.ai and search for comprehensive company intelligence. This will give you recent news, funding information, and competitive positioning in one query.',
        promptTemplate: `[Company Name] recent news funding leadership changes competitive positioning "hiring" OR "layoffs" 2024`,
        expectedOutput: 'A summary paragraph + 5-8 source links with snippets covering recent developments.',
        tips: 'No recent news? Add "site:linkedin.com" to find employee posts. Too generic? Add "AND [specific product line]" to narrow.',
        tools: ['Perplexity AI']
      },
      {
        id: 'step-2',
        stepNumber: 2,
        title: 'Deep Dive on Leadership',
        instruction: 'Use LinkedIn Sales Navigator to identify recent leadership changes and decision makers. Filter by "Changed jobs in last 90 days" to find new hires who are likely evaluating vendors.',
        expectedOutput: 'List of new hires with titles, start dates, previous companies, and any posts about priorities.',
        tips: 'New VPs in your target department are gold—they\'re building their tech stack and haven\'t chosen vendors yet.',
        tools: ['LinkedIn Sales Navigator']
      },
      {
        id: 'step-3',
        stepNumber: 3,
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
        stepNumber: 4,
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
  }
];

// Claude Cowork-optimized playbooks (new finance/banking verticals)
export const coworkPlaybooks: Playbook[] = [
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    annualPrice: 4.49,
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
    price: "Custom",
    description: "For institutions requiring custom automation process building and training",
    features: [
      "Custom playbook creation",
      "Deploy to government compliance",
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
    'Legal': '#475569'
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
    troubleshooting: [],
    beforeYouStart: [],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'smb-1-s1',
        stepNumber: 1,
        title: 'Define Your Brand Voice',
        instruction: 'Open ChatGPT and give it the context of your business so the posts don\'t sound generic.',
        promptTemplate: 'I own [Business Name & Industry]. My target audience is [Target Audience]. We currently have the following offers: [Current Promotions/Offers]. Adopt a brand voice that is friendly, local, and professional.',
        expectedOutput: 'An acknowledgment from the AI confirming it understands your brand voice.'
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
        promptTemplate: 'Now, write the exact captions for the first week (Days 1-7) based on the calendar you just generated. Include relevant local and industry hashtags. Keep the tone conversational and include a clear Call-To-Action (like "Visit our store today" or "Link in bio") for the promotional posts.',
        expectedOutput: '7 fully written, emoji-ready captions you can copy directly into Facebook or Instagram.'
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    id: 'clay-gtm-1',
    slug: 'job-change-value-prop',
    title: 'The "Job-Change Value Prop" Agent',
    subtitle: 'Auto-detect when past champions switch jobs and email them instantly.',
    category: 'Sales',
    difficulty: 'Advanced',
    timeToComplete: 15,
    timeSaved: 180,
    completionCount: 420,
    rating: 4.9,
    isPro: true,
    tools: ['Clay', 'LinkedIn', 'ChatGPT'],
    beforeYouStart: [
      'A CSV export of your current best customers/champions.',
      'A free Clay account.',
      'Basic understanding of what tech stack your product integrates with.'
    ],
    expectedOutcome: 'A live table tracking your past champions, which automatically enriches their new contact details and writes a hyper-personalized email the second they change jobs on LinkedIn.',
    agentAutomation: {
      description: 'Use Clay to continuously monitor a list of LinkedIn profiles. When their current company changes, trigger an enrichment tool to find their new work email, look up their new company’s tech stack, and auto-generate an outreach draft.',
      trigger: 'LinkedIn Profile Change Detected via Clay',
      actions: [
        'Find verified work email',
        'Analyze new company tech stack',
        'Draft personalized congratulatory email comparing old/new tech'
      ],
      setupSteps: [
        { title: 'Create a New Clay Table', description: "Log into Clay and click 'New Table' -> 'Start blank'. Upload your CSV of past champions, ensuring you have a column with their LinkedIn Profile URLs." },
        { title: 'Add the Job Change Tracker', description: "Click 'Add Column' and select 'Enrich Data'. Search for 'LinkedIn Profile' and select 'Find Person from LinkedIn Profile'. Map the LinkedIn URL column. Set this enrichment to run automatically (or manually bulk-run it)." },
        { title: 'Extract Current Company', description: "Once the LinkedIn data loads, click into the JSON result, find the 'Current Company' field, and map it to a new column called 'New Company'." },
        { title: 'Find New Work Email', description: "Click 'Add Column' -> 'Enrich Data'. Search for 'Find Work Email'. Map the person's 'First Name', 'Last Name', and their 'New Company' domain. Clay will waterfall through 10+ providers instantly to find a verified email." },
        { title: 'Draft the Email with Claygent', description: "Add a 'Use AI (Claygent)' column. Prompt it: 'Act as a sales rep. [First Name] used our product at their old job. They just moved to [New Company]. Write a short, friendly congratulatory note offering to show them how our product can help their new team.' Map the AI output directly to your email tool." }
      ],
      tools: ['Clay', 'Clearbit/Apollo via Clay', 'Claygent']
    },
    troubleshooting: [
      {
        problem: 'Email not found',
        solution: 'Not all providers have every email. In Clay, ensure you select multiple providers in the waterfall settings to maximize hit rates.'
      }
    ],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'cg1-s1',
        stepNumber: 1,
        title: 'Define Your Champions',
        instruction: 'Before tracking them, clearly define who your top champions are. Run a report in your CRM for closed-won deals and pull the primary contacts.',
        promptTemplate: 'I am building a list of "Past Champions" to track for job changes. We sell [Your Product] to [Target Persona]. Besides the obvious "Decision Maker", who are 3 other job titles within an organization that typically champion our product internally?',
        expectedOutput: 'A list of secondary titles to export from your CRM.'
      }
    ]
  },
  {
    id: 'clay-gtm-2',
    slug: 'website-deanonymizer',
    title: 'The Auto-Scoring Website Deanonymizer',
    subtitle: 'Turn anonymous traffic into fully enriched, scored leads in Slack.',
    category: 'Marketing',
    difficulty: 'Advanced',
    timeToComplete: 25,
    timeSaved: 240,
    completionCount: 890,
    rating: 4.8,
    isPro: true,
    tools: ['Clay', 'RB2B/Clearbit', 'Slack'],
    beforeYouStart: [
      'A reverse-IP identifying tool on your site (RB2B, Clearbit Reveal, etc).',
      'A webhook connection or Zapier set up.',
      'Your Ideal Customer Profile (ICP) criteria clearly defined.'
    ],
    expectedOutcome: 'A slack channel bursting with highly qualified, fully enriched companies that are actively looking at your pricing page right now.',
    agentAutomation: {
      description: 'Feed anonymous visitors into Clay via Webhook. Clay instantly enriches the domain, scores it against your ICP, finds the relevant decision-makers, and alerts sales in Slack.',
      trigger: 'Reverse-IP tool detects a company on your pricing page.',
      actions: [
        'Enrich Company Domain (Revenue, Tech Stack, Employee Count)',
        'Filter based on ICP Rules (e.g. >100 employees)',
        'Find Top 3 Contacts matching Persona',
        'Send Slack Alert to Sales'
      ],
      setupSteps: [
        { title: 'Set Up Clay Webhook', description: "In Clay, create a new table from a 'Webhook'. Copy the unique Webhook URL provided. Go into your intent tool (like RB2B) and set it to send a POST request with the 'Company Domain' to this Clay URL whenever someone visits your pricing page." },
        { title: 'Enrich the Company', description: "In your new Clay table, add a column to 'Enrich Company'. Use the incoming domain. Pull in fields like Employee Count, Industry, and Estimated Revenue." },
        { title: 'Build Scoring Logic', description: "Add a 'Formula' column in Clay. Write a simple IF statement to flag the company as 'Tier 1' if they meet your criteria (e.g., `IF(Employees > 50, 'Yes', 'No')`). Filter the table view so it only processes companies flagged as 'Yes'." },
        { title: 'Find the Decision Makers', description: "For the 'Tier 1' companies, add a 'Find Contacts at Company' column. Tell it to search for titles containing 'VP Sales' or 'Director of Operations' (your target persona)." },
        { title: 'Alert the Team', description: "Add a 'Send Slack Message' integration column in Clay. Format the message: '🔥 High Intent: [Company Name] is on the pricing page. It has [Employee Count] employees. Here are the top contacts: [Contact Names].'" }
      ],
      tools: ['Clay', 'LinkedIn Sales Nav', 'Slack']
    },
    troubleshooting: [],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'cg2-s1',
        stepNumber: 1,
        title: 'Define ICP Scoring',
        instruction: 'To avoid spamming your sales team, clearly define what makes a website visitor qualified enough to warrant an alert.',
        promptTemplate: 'I am building an automated logic flow to score inbound website companies. Our best customers are [Describe your best customers, e.g. SaaS companies with 50-200 employees using Salesforce]. What are 3 data points I must check against an enriched domain to programmatically verify they are a good fit?',
        expectedOutput: 'The exact data points to map into your Clay scoring formula.'
      }
    ]
  },
  {
    id: 'clay-gtm-3',
    slug: 'deep-dive-rfp-brief',
    title: 'Deep-Dive Account Research Brief',
    subtitle: 'Automate enterprise research: summarize 10K, SEC filings, and news in seconds.',
    category: 'Sales',
    difficulty: 'Intermediate',
    timeToComplete: 10,
    timeSaved: 120,
    completionCount: 1150,
    rating: 4.9,
    isPro: true,
    tools: ['Claygent', 'Google Docs'],
    beforeYouStart: [
      'A list of target Enterprise accounts.',
      'A Clay account.'
    ],
    expectedOutcome: 'A 1-page intelligence brief on any enterprise account summarizing their strategic goals, recent news, and potential pain points based on their public filings.',
    agentAutomation: {
      description: 'Use Claygent (Clay’s AI agent) to navigate to the investors page of public companies, read their latest earnings call transcripts or 10-K filings, and extract the top 3 strategic initiatives executives care about right now.',
      trigger: 'Add a Company Domain to a Clay Table',
      actions: [
        'Claygent searches Google for the company\'s investor relations page.',
        'Claygent reads the latest earnings transcript.',
        'Claygent summarizes the top 3 priorities and challenges.',
        'Export to a formatted Google Doc or PDF.'
      ],
      setupSteps: [
        { title: 'Start Your Research Table', description: "In Clay, create a new table and paste in a list of Enterprise company URLs (e.g., target.com, walmart.com)." },
        { title: 'Deploy Claygent for Search', description: "Click 'Add Column' -> 'Use AI (Claygent)'. In the prompt box, instruct Claygent: 'Search Google to find the most recent Earnings Call Transcript or 10-K filing for [Company Domain]. Return the URL of the document.' Claygent will autonomously search the web and bring back the link." },
        { title: 'Deploy Claygent for Reading', description: "Add another 'Use AI (Claygent)' column. Prompt it: 'Read the webpage at [URL from Step 2]. Identify the top 3 strategic priorities the CEO mentioned, and the top 2 challenges they are facing regarding [Your Industry/Space]. Summarize this in 5 bullet points.' Claygent will read the massive document and return just the gold." },
        { title: 'Draft the Executive Email', description: "Add one final 'Use AI' column. Prompt: 'Write a highly personalized cold email to the CIO of [Company]. Reference their strategic priority of [Strategic Priority from Step 3] and explicitly state how [Your Product] helps them achieve it faster.' You now have hyper-relevant outreach for complex accounts." },
        { title: 'Sync to CRM', description: "Add a CRM integration column (like Salesforce or HubSpot) to push these strategic summaries directly into the 'Account Notes' field so reps have the intel where they work." }
      ],
      tools: ['Claygent', 'Salesforce / HubSpot']
    },
    webhookConfig: {
      supportedTools: ['make', 'zapier', 'clay'],
      inputs: [
        {
          id: 'company_domain',
          label: 'Target Company Domain',
          placeholder: 'e.g., apple.com',
          type: 'url'
        }
      ]
    },
    troubleshooting: [],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'cg3-s1',
        stepNumber: 1,
        title: 'Identify the "Why Now"',
        instruction: 'Use ChatGPT to help figure out what specific signals you should ask Claygent to look for in the earnings reports.',
        promptTemplate: 'I sell [Your Product] to Enterprise companies. I am programming an AI agent to read their quarterly earnings reports. What are 3 specific keywords, phrases, or strategic themes I should instruct the AI to look for that indicate they urgently need a solution like mine?',
        expectedOutput: 'Actionable search terms to feed into your Claygent prompt.'
      }
    ]
  },
  {
    id: 'clay-gtm-4',
    slug: 'gong-to-outreach-recap',
    title: 'The Personalized Gong-to-Outreach Recap',
    subtitle: 'Automatically craft hyper-personalized post-demo follow-ups based on call transcripts.',
    category: 'Sales',
    difficulty: 'Advanced',
    timeToComplete: 15,
    timeSaved: 90,
    completionCount: 630,
    rating: 4.8,
    isPro: true,
    tools: ['Clay', 'Gong (or Zoom info)', 'Gmail/Outreach'],
    beforeYouStart: [
      'Access to your team\'s call recording tool (Gong, Chorus, Zoom AI).',
      'API access or integration permissions for Gong and Clay.'
    ],
    expectedOutcome: 'A drafted email sitting in your outbox minutes after a call ends, perfectly summarizing the exact pain points the prospect complained about and linking to the specific features they asked to see again.',
    agentAutomation: {
      description: 'Connect Clay to your call recording software via an API or Webhook. When a call ends, Claygent ingests the raw transcript, extracts key objections and pain points, and drafts a contextual follow-up email ready for the rep to review and send.',
      trigger: 'Call State changes to "Completed" in Gong/CRM.',
      actions: [
        'Fetch Call Transcript via API',
        'Analyze transcript for pain points, competitors named, and next steps promised',
        'Draft a highly tailored follow-up email',
        'Create draft in Gmail/Outreach'
      ],
      setupSteps: [
        { title: 'Set Up The Trigger', description: "In Clay, you can either set up a schedule to pull recent calls from your CRM every hour, or use a Webhook from Gong/Zapier that triggers when a call finishes. Either way, bring the 'Call ID' and 'Prospect Email' into your Clay table." },
        { title: 'Fetch the Transcript', description: "Add an 'HTTP API' column in Clay. Use the Gong API (or your provider of choice) to GET the raw text transcript of the call associated with that Call ID." },
        { title: 'Extract the Insights', description: "Add a 'Use AI (Claygent)' column. Prompt: 'Here is a transcript of my sales call: [Transcript Text]. Extract exactly three things: 1) The main problem they are trying to solve. 2) Any competitors they mentioned using. 3) What I promised to send them next.'" },
        { title: 'Draft the Perfect Follow Up', description: "Add another 'Use AI' column. Prompt: 'Draft a short follow-up email to the prospect. Acknowledge their main problem: [Problem]. Gently position our product against [Competitor] without bashing them. Finally, include the link to [Promised Next Step Document]. Keep the tone helpful and concise.'" },
        { title: 'Push to Drafts', description: "Use the 'Gmail -> Create Draft' integration (or Outreach/SalesLoft) to push that text into your outbox. The rep just needs to open their drafts, quickly review, and hit send, saving them 20 minutes of recap-writing per call." }
      ],
      tools: ['Clay', 'Gong API', 'Gmail / Outreach']
    },
    troubleshooting: [],
    relatedPlaybooks: [],
    steps: [
      {
        id: 'cg4-s1',
        stepNumber: 1,
        title: 'Standardize Your Next Steps',
        instruction: 'To make the automation work, you need standard materials to link to when certain topics come up.',
        promptTemplate: 'I am automating post-call follow-ups. Give me a checklist of standard sales collateral I should have prepared as "Next Step Links" based on common objections (e.g. security objections = SOC2 doc link, pricing objections = ROI calculator link). List 5 common objections and the ideal collateral to link.',
        expectedOutput: 'A map of objections to collateral.'
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
    troubleshooting: [],
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
    troubleshooting: [],
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
  }
];
