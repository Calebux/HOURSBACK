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
    troubleshooting: [],
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
    troubleshooting: [],
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
    troubleshooting: [],
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
    'Legal': '#475569',
    'Claude Crash Course': '#DA7756'
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

export const claudeCrashCoursePlaybooks: Playbook[] = [
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
    expectedOutcome: 'A complete, useful work deliverable produced through a multi-turn conversation with Claude — plus the confidence to start any future conversation effectively.',
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
        solution: 'Don\'t start over. Reply with: "Not quite — I meant [X]. Specifically, I need [concrete deliverable]." Claude corrects well from feedback.'
      }
    ],
    steps: [
      {
        id: 'cc1-s1',
        stepNumber: 1,
        title: 'Set the Stage — Tell Claude Who You Are',
        instruction: 'Before asking anything, give Claude a one-sentence snapshot of your role, your context, and the problem you\'re solving. This single step eliminates 80% of generic responses.',
        promptTemplate: `I work as a [YOUR ROLE] at a [COMPANY TYPE / INDUSTRY].\n\nRight now I am working on [SPECIFIC PROJECT OR CHALLENGE]. My goal is to [WHAT SUCCESS LOOKS LIKE].\n\nTalk to me like a sharp colleague who already knows my field — skip the basics and be direct.`,
        expectedOutput: 'Claude should reply acknowledging your context and asking a clarifying question, or dive straight into useful guidance tailored to your situation.',
        tips: 'Example: "I work as a product marketing manager at a B2B SaaS startup. Right now I am working on our Q3 launch messaging for a new analytics feature. My goal is to have three positioning angles ready for our messaging workshop on Friday. Talk to me like a sharp colleague who already knows my field — skip the basics and be direct."'
      },
      {
        id: 'cc1-s2',
        stepNumber: 2,
        title: 'Ask for a Concrete Deliverable',
        instruction: 'Now that Claude has context, ask for something specific you can actually use. Be precise about format, length, and audience.',
        promptTemplate: `Now write me a [DELIVERABLE TYPE] that I can [HOW YOU WILL USE IT].\n\nRequirements:\n- Audience: [WHO WILL READ/SEE THIS]\n- Length: [WORD COUNT OR FORMAT CONSTRAINT]\n- Tone: [PROFESSIONAL / CASUAL / PERSUASIVE / etc.]\n- Must include: [ANY NON-NEGOTIABLE ELEMENTS]`,
        expectedOutput: 'A structured, ready-to-use deliverable matching your specifications — not a vague suggestion or outline.',
        tips: 'Example: "Now write me a one-page competitive positioning brief that I can present at our Friday workshop. Audience: VP of Marketing and two PMMs. Length: 400 words max. Tone: confident and data-driven. Must include: our differentiator vs. Mixpanel, one customer proof point, and a suggested tagline."'
      },
      {
        id: 'cc1-s3',
        stepNumber: 3,
        title: 'Iterate — Give Feedback Like a Colleague',
        instruction: 'Claude\'s first draft is a starting point. Reply with specific feedback: what to keep, what to cut, what to change. This is where the real value happens.',
        promptTemplate: `This is [GOOD / CLOSE / OFF-TRACK]. Here is my feedback:\n\n- Keep: [WHAT WORKED]\n- Change: [WHAT NEEDS TO BE DIFFERENT AND WHY]\n- Add: [ANYTHING MISSING]\n- Remove: [ANYTHING UNNECESSARY]\n\nRevise it with these changes.`,
        expectedOutput: 'An improved second draft that incorporates your feedback while preserving what was already working.',
        tips: 'Example: "This is close. Keep the structure and the Mixpanel comparison. Change the tagline — it\'s too generic, make it edgier and outcome-focused. Add a stat about our average implementation time (it\'s 2 days vs. their 2 weeks). Remove the paragraph about market size — the audience already knows this. Revise it with these changes."'
      },
      {
        id: 'cc1-s4',
        stepNumber: 4,
        title: 'Reshape the Output',
        instruction: 'Once the content is right, ask Claude to reformat it for a different context. This shows how one conversation can produce multiple assets.',
        promptTemplate: `Now take this same content and turn it into:\n\n1. A [NEW FORMAT 1] — for [USE CASE 1]\n2. A [NEW FORMAT 2] — for [USE CASE 2]\n\nKeep the core messaging identical. Adapt only the length and format.`,
        expectedOutput: 'The same core content reshaped into two new formats, ready to use in different contexts.',
        tips: 'Example: "Now take this same content and turn it into: 1. A 3-slide executive summary — for our Slack channel update to leadership. 2. A 5-bullet email — for the sales team to use in competitive deals. Keep the core messaging identical. Adapt only the length and format."'
      }
    ],
    relatedPlaybooks: [
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
      'Completed Playbook 1 or basic familiarity with Claude',
      'A real writing, analysis, or brainstorming task',
      '15 minutes'
    ],
    expectedOutcome: 'Hands-on experience with 5 reusable prompt patterns — Role Assignment, Chain of Thought, Few-Shot Examples, Constraint Setting, and Structured Output — that you can remix for any future task.',
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
        title: 'Pattern 1 — Role Assignment',
        instruction: 'Assign Claude an expert persona to activate domain-specific knowledge. This consistently improves output quality for specialized tasks.',
        promptTemplate: `You are a [SPECIFIC EXPERT ROLE] with 15 years of experience in [DOMAIN].\n\nA client has asked you: "[PASTE THE ACTUAL QUESTION OR TASK]"\n\nRespond as this expert would — with specific recommendations, not generic advice. Reference real frameworks, tools, or methodologies from this field.`,
        expectedOutput: 'A response noticeably more specific and expert-level than a generic prompt would produce — using industry terminology and frameworks appropriately.',
        tips: 'Try it: "You are a senior UX researcher with 15 years of experience in enterprise SaaS. A client has asked you: \'We\'re redesigning our dashboard but don\'t have time for full user testing. What\'s the fastest way to validate our new design before launch?\' Respond as this expert would — with specific recommendations, not generic advice."'
      },
      {
        id: 'cc2-s2',
        stepNumber: 2,
        title: 'Pattern 2 — Chain of Thought',
        instruction: 'Force Claude to show its reasoning step by step. This dramatically improves accuracy on complex analysis, math, and strategic decisions.',
        promptTemplate: `I need you to [ANALYSIS OR DECISION TASK].\n\nThink through this step by step:\n1. First, identify [RELEVANT FACTORS]\n2. Then, analyze [KEY RELATIONSHIPS]\n3. Then, weigh [TRADEOFFS]\n4. Finally, give me your recommendation with reasoning\n\nShow your work at each step.`,
        expectedOutput: 'A structured analysis that walks through the reasoning, making it easy to spot where you agree or disagree with Claude\'s logic.',
        tips: 'Try it: "I need you to evaluate whether we should build our analytics feature in-house or buy a third-party solution. Our team is 4 engineers, timeline is 8 weeks, budget is $50K. Think through this step by step: 1. First, identify the key decision criteria. 2. Then, analyze build vs. buy against each criterion. 3. Then, weigh the risks of each option. 4. Finally, give me your recommendation with reasoning. Show your work at each step."'
      },
      {
        id: 'cc2-s3',
        stepNumber: 3,
        title: 'Pattern 3 — Few-Shot Examples',
        instruction: 'Show Claude 1-2 examples of what good output looks like. This is the fastest way to get Claude to match your voice, format, or quality bar.',
        promptTemplate: `I need you to write [CONTENT TYPE] in a specific style. Here are examples of what good looks like:\n\n---\nExample 1:\n[PASTE A REAL EXAMPLE YOU LIKE]\n---\nExample 2:\n[PASTE ANOTHER EXAMPLE]\n---\n\nNow write one for: [YOUR SPECIFIC TOPIC/CONTEXT]\n\nMatch the tone, structure, and level of detail from the examples.`,
        expectedOutput: 'Output that closely mirrors the style and quality of your examples, applied to your new topic.',
        tips: 'Try it: Paste two of your best-performing LinkedIn posts and ask Claude to write a new one about a different topic. The style match is usually uncanny.'
      },
      {
        id: 'cc2-s4',
        stepNumber: 4,
        title: 'Pattern 4 — Constraint Setting',
        instruction: 'Set hard boundaries on length, format, audience, and what to exclude. Constraints force Claude to be concise and relevant instead of comprehensive and rambling.',
        promptTemplate: `Write a [DELIVERABLE] about [TOPIC].\n\nConstraints:\n- Maximum [X] words\n- Written for [SPECIFIC AUDIENCE] — assume they already know [BASELINE KNOWLEDGE]\n- Use [BULLET POINTS / NUMBERED LIST / PARAGRAPHS]\n- Do NOT include [THINGS TO EXCLUDE]\n- Every point must include [REQUIRED ELEMENT — e.g., a specific example, a metric, an action item]`,
        expectedOutput: 'A tightly scoped deliverable that respects every constraint — no filler, no fluff.',
        tips: 'Try it: "Write a project status update about our mobile app redesign. Constraints: Maximum 200 words. Written for our CEO — assume she knows the project background. Use bullet points. Do NOT include technical details or timelines already shared. Every point must include a specific decision or risk that needs her attention."'
      },
      {
        id: 'cc2-s5',
        stepNumber: 5,
        title: 'Pattern 5 — Structured Output',
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
      'Optionally: a screenshot or chart image you want Claude to interpret',
      'Claude Pro or Free account (free allows limited uploads)'
    ],
    expectedOutcome: 'A completed analysis of your real document — summary, extracted data, identified issues, or a reformatted output — all produced through file upload + targeted prompts.',
    troubleshooting: [
      {
        problem: 'Claude says it can\'t read the file',
        solution: 'Check the file type — Claude supports PDF, DOCX, CSV, TXT, PNG, JPEG, and more. If it\'s a proprietary format, export it to PDF first.'
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
        promptTemplate: `I just uploaded [DOCUMENT NAME]. Here is what I need:\n\nSummarize this document for [SPECIFIC AUDIENCE] who needs to [SPECIFIC PURPOSE].\n\nStructure:\n- Executive summary (3 sentences max)\n- Key findings or decisions (bullet points)\n- Action items or open questions\n- Anything surprising or concerning\n\nSkip background context the audience already knows. Focus on what is new, changed, or requires a decision.`,
        expectedOutput: 'A purpose-driven summary that highlights what matters to your audience — not a generic document overview.',
        tips: 'Try it with a meeting transcript: "Summarize this document for our VP of Engineering who missed the meeting and needs to know what was decided, what\'s blocked, and what he needs to weigh in on. Skip background context — he knows the project. Focus on decisions, blockers, and his action items."'
      },
      {
        id: 'cc3-s2',
        stepNumber: 2,
        title: 'Data Extraction — Pull Structure from Chaos',
        instruction: 'Upload a messy document (contract, report, email thread) and ask Claude to extract specific data points into a structured format.',
        promptTemplate: `From this uploaded document, extract the following into a table:\n\n| [Column 1] | [Column 2] | [Column 3] | [Column 4] |\n\nRules:\n- If a value is not explicitly stated, write "Not specified"\n- If a value is ambiguous, write your best interpretation + "(inferred)"\n- Include the page number or section where you found each data point\n\nAfter the table, list any inconsistencies or red flags you noticed.`,
        expectedOutput: 'A clean, structured table pulling specific data points from an unstructured source, with page references and flagged issues.',
        tips: 'Try it with a vendor contract: "Extract: Vendor Name | Contract Value | Start Date | End Date | Auto-Renewal Terms | Termination Notice Period | Key SLA Commitments. After the table, list any inconsistencies or clauses that seem unusual."'
      },
      {
        id: 'cc3-s3',
        stepNumber: 3,
        title: 'Image + Screenshot Analysis',
        instruction: 'Upload a chart, screenshot, whiteboard photo, or UI mockup. Claude can read visual content and turn it into structured text or actionable analysis.',
        promptTemplate: `I uploaded [IMAGE TYPE — e.g., a screenshot of our analytics dashboard / a photo of our whiteboard / a chart from a report].\n\nDo the following:\n1. Describe what you see in detail\n2. Extract all data points, numbers, or text visible in the image\n3. [SPECIFIC ASK — e.g., identify the top 3 trends / flag any concerning metrics / convert the whiteboard notes into a structured task list]\n\nPresent your analysis as [FORMAT — e.g., bullet points / a table / a formatted summary].`,
        expectedOutput: 'A text-based extraction and analysis of the visual content, structured in your requested format.',
        tips: 'Try it: Upload a screenshot of a cluttered Jira board and ask Claude to "List every visible ticket with its status and assignee in a table. Then identify which tickets appear blocked and suggest a priority order for our standup tomorrow."'
      },
      {
        id: 'cc3-s4',
        stepNumber: 4,
        title: 'Compare and Cross-Reference',
        instruction: 'Upload two related documents and ask Claude to compare them. This is powerful for contract redlines, version comparisons, or competitive analysis.',
        promptTemplate: `I uploaded two documents:\n- Document A: [NAME / DESCRIPTION]\n- Document B: [NAME / DESCRIPTION]\n\nCompare them and produce:\n\n1. **What changed** — key differences between A and B (table format)\n2. **What's new in B** — anything added that wasn't in A\n3. **What's missing from B** — anything in A that was removed\n4. **Risk assessment** — any changes that could be problematic and why\n\nBe specific. Quote exact language where differences matter.`,
        expectedOutput: 'A structured comparison with specific differences called out, additions and removals identified, and risk flags for material changes.',
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
      '2-3 reference documents you frequently re-explain to AI (brand guidelines, templates, specs)',
      'A recurring workflow where you want consistency across conversations'
    ],
    expectedOutcome: 'A fully configured Claude Project with uploaded knowledge, custom instructions, and a test conversation proving that Claude correctly references your documents and follows your rules without being reminded.',
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
        instruction: 'Go to claude.ai/projects and create a new project. Give it a specific, outcome-oriented name — not a vague label.',
        promptTemplate: `Before creating the project, ask Claude to help you scope it:\n\n"I want to set up a Claude Project for [WORKFLOW — e.g., writing customer case studies / preparing board meeting materials / managing our product launch].\n\nHelp me define:\n1. What documents should I upload as the knowledge base?\n2. What project instructions would ensure consistency?\n3. What should this project NOT be used for (scope boundaries)?\n\nKeep each answer to 3-5 bullet points."`,
        expectedOutput: 'A clear project scope with recommended documents, instructions, and boundaries — giving you a setup checklist before you start.',
        tips: 'Great project names: "Q3 Product Launch Content", "Client Onboarding — Acme Corp", "Weekly Sales Report Generator". Bad names: "Marketing Stuff", "Misc", "Project 1".'
      },
      {
        id: 'cc4-s2',
        stepNumber: 2,
        title: 'Write Bulletproof Project Instructions',
        instruction: 'Your project instructions are the rules Claude follows in every conversation within the project. Write them like you\'re onboarding a new team member — specific, unambiguous, and prioritized.',
        promptTemplate: `Help me write project instructions for a Claude Project called "[PROJECT NAME]".\n\nContext: [WHAT THIS PROJECT IS FOR — 2 sentences]\n\nI need instructions that cover:\n1. Role: Who should Claude act as in this project?\n2. Tone: [FORMAL / CONVERSATIONAL / TECHNICAL / etc.]\n3. Format rules: [DEFAULT OUTPUT FORMAT — e.g., always use bullet points, always include an executive summary]\n4. Must-do rules: [THINGS CLAUDE MUST ALWAYS DO — e.g., cite uploaded documents, use our company terminology]\n5. Must-avoid rules: [THINGS CLAUDE MUST NEVER DO — e.g., never suggest competitor products, never use passive voice]\n\nWrite these as clear, numbered instructions I can paste directly into the Project Instructions field. Keep it under 300 words.`,
        expectedOutput: 'A copy-paste-ready set of project instructions, numbered and specific enough that Claude can follow them without ambiguity.',
        tips: 'Try it: "Help me write project instructions for a Claude Project called \'Customer Case Studies\'. Context: We create 2-page case studies for enterprise SaaS customers. They follow a Problem → Solution → Results structure. I need instructions covering: Role (B2B content strategist), Tone (professional but not stiff), Format (always use our case study template structure), Must-do (always ask for specific metrics and customer quotes), Must-avoid (never use jargon our customers wouldn\'t know)."'
      },
      {
        id: 'cc4-s3',
        stepNumber: 3,
        title: 'Upload Your Knowledge Base',
        instruction: 'Upload the documents Claude should reference across all conversations in this project. Use descriptive filenames — Claude uses filenames to locate content.',
        promptTemplate: `After uploading your documents, test that Claude can find and reference them:\n\n"Based on the uploaded documents, answer these questions:\n1. What is the main topic of [DOCUMENT NAME]?\n2. Find the specific section in [DOCUMENT NAME] that covers [TOPIC].\n3. If I asked you to [COMMON TASK IN THIS PROJECT], which uploaded documents would you reference and why?\n\nQuote specific passages from the documents in your answers."`,
        expectedOutput: 'Claude should accurately reference your uploaded documents, quote specific passages, and explain which documents it would use for different tasks.',
        tips: 'Name files descriptively: "Q4-2024-Brand-Voice-Guidelines.pdf" is way better than "guidelines_v2_final.pdf". Upload 3-5 focused documents rather than one massive file. Claude handles multiple specific files better than one 200-page omnibus.'
      },
      {
        id: 'cc4-s4',
        stepNumber: 4,
        title: 'The Acid Test — Run a Real Task',
        instruction: 'Put your project through a real-world test. Give Claude a task you\'d normally do yourself and check whether it follows your instructions and references your documents without being reminded.',
        promptTemplate: `[Give Claude a real task from your workflow — no special hints or reminders]\n\nExample task prompts:\n- "Write a case study introduction for [CLIENT NAME] based on these call notes: [PASTE NOTES]"\n- "Draft this week's board update using the latest metrics: [PASTE DATA]"\n- "Review this email draft and align it with our brand voice: [PASTE DRAFT]"\n\nAfter Claude responds, evaluate:\n- Did it follow the tone from my instructions?\n- Did it reference the uploaded documents?\n- Did it respect the must-do and must-avoid rules?`,
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
      'A Claude account with Artifacts enabled (Settings → Feature Preview)',
      'An idea for a simple tool, calculator, or document you need',
      'No coding knowledge required — Claude writes all the code'
    ],
    expectedOutcome: 'At least two working artifacts: a practical interactive tool (calculator, form, or dashboard) and a polished document — both ready to download or share.',
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
        instruction: 'Ask Claude to build an interactive tool you\'d actually use at work. Describe what it should do, what inputs it needs, and what output it shows. No coding knowledge needed.',
        promptTemplate: `Build me an interactive [TOOL TYPE] as an artifact.\n\nWhat it does:\n- [CORE FUNCTION — e.g., calculates ROI for our marketing campaigns]\n\nInputs I need to enter:\n- [INPUT 1 — e.g., campaign budget]\n- [INPUT 2 — e.g., expected conversion rate]\n- [INPUT 3 — e.g., average deal size]\n\nOutput it should show:\n- [OUTPUT 1 — e.g., projected ROI percentage]\n- [OUTPUT 2 — e.g., break-even point]\n- [OUTPUT 3 — e.g., a visual chart of projected returns]\n\nDesign: Clean and professional. Use a modern dark theme. Make it look like a real product, not a prototype.`,
        expectedOutput: 'A working interactive artifact with input fields, calculations, and visual output — rendered in the artifact panel, ready to use.',
        tips: 'Try it: "Build me an interactive SaaS pricing calculator as an artifact. Inputs: number of users, plan tier (starter/growth/enterprise), billing period (monthly/annual). Output: monthly cost, annual cost, savings from annual billing, and a comparison table across all tiers. Design: Clean and professional with a blue/white color scheme."'
      },
      {
        id: 'cc5-s2',
        stepNumber: 2,
        title: 'Create a Polished Document or Report',
        instruction: 'Use artifacts to create formatted documents — project plans, reports, templates — that you can download as real files.',
        promptTemplate: `Create a [DOCUMENT TYPE] as an artifact.\n\nTopic: [SUBJECT]\nAudience: [WHO WILL READ THIS]\nLength: [PAGE / WORD TARGET]\n\nStructure it as:\n1. [SECTION 1]\n2. [SECTION 2]\n3. [SECTION 3]\n4. [SECTION 4]\n\nInclude:\n- [SPECIFIC ELEMENTS — e.g., an executive summary, data tables, recommendations]\n\nStyle: Professional and polished. This will be shared externally.`,
        expectedOutput: 'A rendered, formatted document in the artifact panel that you can preview, copy, and download.',
        tips: 'Try it: "Create a quarterly business review template as an artifact. Structure: 1. Executive Summary, 2. Key Metrics (as a table with YoY comparison columns), 3. Highlights & Lowlights, 4. Next Quarter Priorities, 5. Resource Requests. Each section should have placeholder text showing what to fill in. Style: clean, corporate, ready to present."'
      },
      {
        id: 'cc5-s3',
        stepNumber: 3,
        title: 'Build a Visual Diagram or Flowchart',
        instruction: 'Ask Claude to create Mermaid diagrams for processes, org charts, user flows, or system architecture. These render as real, visual diagrams in the artifact panel.',
        promptTemplate: `Create a [DIAGRAM TYPE — flowchart / sequence diagram / org chart / user journey] as a Mermaid diagram artifact.\n\nShow: [WHAT THE DIAGRAM SHOULD ILLUSTRATE]\n\nInclude:\n- [KEY NODES or STEPS]\n- [DECISION POINTS if it's a flowchart]\n- [CONNECTIONS between elements]\n\nKeep it readable — no more than [N] nodes. Use clear, short labels.`,
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
      'Research Mode toggle enabled (bottom-left of the chat interface)',
      'A complex question that needs multiple sources to answer properly'
    ],
    expectedOutcome: 'A cite-backed research report synthesizing information from multiple web sources and (optionally) your connected integrations — ready to share with stakeholders.',
    troubleshooting: [
      {
        problem: 'Research is taking too long (30+ minutes)',
        solution: 'Your prompt is too broad. Next time, be more specific: narrow the scope, add constraints, or define the exact sections you want.'
      },
      {
        problem: 'The report doesn\'t cover what I actually needed',
        solution: 'Specify the exact sections upfront. "Structure the report as: Market Size, Key Players (top 5), Pricing Trends, Our Opportunity" gives Claude a roadmap.'
      },
      {
        problem: 'Citations are from low-quality sources',
        solution: 'Add: "Prioritize data from: industry reports, company filings, and established publications. Deprioritize blog posts and forums unless they provide unique data."'
      }
    ],
    steps: [
      {
        id: 'cc6-s1',
        stepNumber: 1,
        title: 'Write a Research Brief — Tell Claude What to Investigate',
        instruction: 'Enable Research mode (the toggle at the bottom-left of the chat interface turns blue). Then write a structured research prompt — think of it as a brief to a research analyst.',
        promptTemplate: `Research the following topic and produce a comprehensive report:\n\n**Topic:** [SPECIFIC RESEARCH QUESTION]\n\n**Context:** I need this for [PURPOSE — e.g., a board presentation / market entry decision / competitive analysis]. My audience is [WHO WILL READ THIS].\n\n**Scope:**\n- Focus areas: [LIST 3-5 SPECIFIC AREAS]\n- Time frame: [CURRENT / LAST 12 MONTHS / LAST 5 YEARS]\n- Geography: [GLOBAL / US ONLY / SPECIFIC REGIONS]\n\n**Report structure:**\n1. Executive Summary (200 words)\n2. [SECTION 2 WITH SPECIFIC FOCUS]\n3. [SECTION 3 WITH SPECIFIC FOCUS]\n4. [SECTION 4 WITH SPECIFIC FOCUS]\n5. Key Risks and Open Questions\n6. Recommended Next Steps\n\n**Requirements:**\n- Cite all claims with sources\n- Include data and numbers wherever possible\n- Flag any areas where data is limited or conflicting`,
        expectedOutput: 'Claude will work for 5-15 minutes, conducting multiple searches, and deliver a structured research report with citations.',
        tips: 'Try it: "Research the current state of AI-powered customer support tools and produce a report. Context: I\'m evaluating vendors for our 50-person support team. Focus areas: top 5 players by market share, pricing models, implementation timelines, customer satisfaction scores. Structure: Executive Summary, Market Landscape (table), Vendor Deep Dives (top 5), Build vs Buy Analysis, Recommended Shortlist."'
      },
      {
        id: 'cc6-s2',
        stepNumber: 2,
        title: 'Competitive Landscape Deep Dive',
        instruction: 'Use Research mode for competitive intelligence — Claude will pull from multiple sources to build a comprehensive picture of your competitive landscape.',
        promptTemplate: `Run a competitive analysis on [YOUR COMPANY/PRODUCT] vs these competitors: [COMPETITOR 1], [COMPETITOR 2], [COMPETITOR 3].\n\nFor each competitor, investigate:\n1. Core product and positioning (one paragraph each)\n2. Pricing (specific tiers and numbers if publicly available)\n3. Recent announcements or product launches (last 6 months)\n4. Customer reviews — common praise and complaints\n5. Estimated company size and funding\n\nPresent as a comparison table where possible.\n\nThen add a section called "Our Opportunity" — based on competitor gaps and customer complaints, where should we focus?\n\nCite everything.`,
        expectedOutput: 'A structured competitive analysis with specific data points, comparison tables, and an opportunity assessment — all cited.',
        tips: 'This prompt beats generic competitor research because it asks for specifics (pricing tiers, recent launches, review sentiment) rather than allowing Claude to stay surface-level.'
      },
      {
        id: 'cc6-s3',
        stepNumber: 3,
        title: 'Research + Internal Data Combo',
        instruction: 'If you have Google Workspace connected, Claude can combine web research with your internal documents, emails, and calendar for richer analysis.',
        promptTemplate: `I need you to combine web research with my connected Google Workspace data.\n\n**External research:**\n- [WHAT TO RESEARCH ON THE WEB — e.g., industry benchmarks for SaaS metrics in our space]\n\n**Internal context to pull in:**\n- [WHAT TO LOOK FOR IN MY CONNECTED TOOLS — e.g., recent emails or docs mentioning our Q4 targets]\n\n**Deliverable:**\nA [REPORT TYPE] that compares our internal situation against the external benchmarks.\n\nStructure:\n1. Industry Benchmarks (from web research)\n2. Our Current Performance (from internal data)\n3. Gap Analysis (comparing the two)\n4. Recommended Actions (prioritized, specific)`,
        expectedOutput: 'A report that blends external research with your internal data — comparing your company\'s situation against market benchmarks.',
        tips: 'If you don\'t have Google Workspace connected, you can upload internal documents directly to the chat and combine them with Research mode\'s web results.'
      },
      {
        id: 'cc6-s4',
        stepNumber: 4,
        title: 'Turn Research into Actions',
        instruction: 'After Claude delivers the research report, use a follow-up prompt to turn insights into a concrete action plan.',
        promptTemplate: `Based on the research report you just produced, create an action plan.\n\nFor each recommendation:\n- **Action:** What specifically to do (one sentence)\n- **Owner:** What role should own this (e.g., Head of Product, Marketing Lead)\n- **Timeline:** Suggested deadline or timeframe\n- **Dependencies:** What needs to happen first\n- **Success metric:** How we'll know this worked\n\nPrioritize by impact. Put quick wins (under 1 week) at the top.\nFormat as a numbered list I can paste into our project tracker.`,
        expectedOutput: 'A prioritized, assignable action plan derived from the research findings — ready to paste into Notion, Asana, Jira, or any project management tool.',
        tips: 'This two-step approach (research first → action plan second) consistently produces better results than trying to get research + recommendations in one prompt. The research builds Claude\'s context so the action plan is grounded in specifics.'
      }
    ],
    relatedPlaybooks: [
      { id: 'cc-5', title: 'Artifacts & Interactive Outputs', slug: 'claude-105-artifacts-and-interactive-outputs' },
      { id: 'cc-1', title: 'Your First Conversation with Claude', slug: 'claude-101-your-first-conversation' }
    ]
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
    troubleshooting: [],
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
    troubleshooting: [],
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
  }
];
