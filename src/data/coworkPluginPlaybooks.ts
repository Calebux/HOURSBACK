import type { Playbook } from '../types/playbook';

export const coworkPluginPlaybooks: Playbook[] = [
  {
    id: 'cwp-1',
    slug: 'cowork-data-analysis-power-user',
    title: 'Master Data Analysis with Claude Cowork',
    subtitle: 'Drop a CSV, get instant insights. Use /data:explore and /data:write-query to find revenue leaks, anomalies, and trends in minutes.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 180,
    tools: ['Claude Cowork', 'Data Analysis Plugin', 'Excel/CSV'],
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    completionCount: 1840,
    rating: 4.9,
    expectedOutcome: 'A complete data analysis workflow — from raw CSV to actionable business insights — using Claude\'s S-tier Data Analysis plugin.',
    beforeYouStart: [
      'Have a Claude Pro subscription ($20/month) with Cowork enabled',
      'Install the Data Analysis plugin from Claude\'s plugin library',
      'Prepare a CSV or Excel file with business data (sales, revenue, customers, etc.)',
      'Optional: Connect Snowflake, BigQuery, or Databricks for live queries'
    ],
    steps: [
      {
        id: 'cwp-1-step-1',
        stepNumber: 1,
        title: 'Install & Set Up the Data Analysis Plugin',
        instruction: 'Open Claude Cowork → Plugins → Install "Data Analysis". This plugin connects to Snowflake, Databricks, BigQuery, Hex, Amplitude, and Jira. Once installed, drop your CSV/Excel file into the Cowork project folder (or connect a database via Settings → Connectors). Then create a context file to tell Claude what matters to your business — paste the prompt below into your Cowork context file.',
        promptTemplate: '# Data Context\n- Company: [YOUR_COMPANY]\n- Dataset: [DESCRIBE_YOUR_DATA e.g. "Q4 2025 revenue by product line, 45,000 rows"]\n- Key metrics I care about: [e.g. "MRR, churn rate, ARPU, renewal rates"]\n- Business questions: [e.g. "Where are we losing revenue? Which segments are growing?"]',
        expectedOutput: 'The Data Analysis plugin is installed, your data file is loaded into the project, and Claude has context about what matters to your business.',
        tips: 'Think of the context file as briefing a new analyst on day one. The more specific you are about what metrics matter, the better the analysis.',
        tools: ['Claude Cowork']
      },
      {
        id: 'cwp-1-step-2',
        stepNumber: 2,
        title: 'Explore Your Data with /data:explore',
        instruction: 'Type /data:explore in Claude Cowork to get an instant overview of your entire dataset. Claude reads every column, flags data quality issues, spots anomalies, and suggests analyses worth running — all before you ask. After the initial exploration, follow up with the prompt below to drill into what matters.',
        promptTemplate: 'Focus on the [METRIC_COLUMN] column. I want to understand:\n1. What\'s the distribution across [SEGMENT e.g. product lines, regions, customer tiers]?\n2. Are there any outliers or anomalies?\n3. What trends do you see over the [TIME_PERIOD e.g. last 4 quarters]?\n4. What\'s the most interesting pattern you found that I might not expect?',
        expectedOutput: 'Claude summarises every column, flags data quality issues (missing values, outliers, type mismatches), and suggests 3-5 analyses worth running.',
        tips: 'In testing, /data:explore found a $14,000/month pricing anomaly in renewal data that the client\'s own data team had missed for two quarters. Let Claude surprise you.',
        tools: ['Claude Cowork', 'Data Analysis Plugin']
      },
      {
        id: 'cwp-1-step-3',
        stepNumber: 3,
        title: 'Write Queries in Plain English',
        instruction: 'Type /data:write-query in Claude Cowork, then describe what you want to know in plain English. Claude writes the SQL, validates it, explains the logic, and runs it against your connected database. Chain your questions — start broad, then drill down.',
        promptTemplate: 'Show me [YOUR_ANALYSIS e.g. monthly revenue by product line for the last 12 months, with month-over-month growth rates, highlighting any months where growth dropped below 5%].\n\nThen break this down by [SEGMENT e.g. customer tier] and show me which segment is driving the decline.\n\nCreate a summary table I can paste into a slide deck for the [AUDIENCE e.g. board meeting].',
        expectedOutput: 'Claude writes validated SQL, explains what it\'s doing, runs the query, and presents results ready for stakeholders.',
        tips: 'Chain your questions. Start broad ("show me revenue trends"), then drill down ("which product is underperforming?"), then action ("what should we do about it?").',
        tools: ['Claude Cowork', 'Data Analysis Plugin']
      }
    ],
    troubleshooting: [
      { problem: 'Claude says it can\'t read my file', solution: 'Make sure the file is in your Cowork project folder, not just attached to a message. Supported: CSV, TSV, Excel, JSON, Parquet.' },
      { problem: 'Query results seem wrong', solution: 'Ask Claude to "show me the first 10 rows of the raw data" to verify column names.' },
      { problem: 'Database connector isn\'t working', solution: 'Settings → Connectors → Data Analysis. Snowflake requires account ID, warehouse, database, and schema.' }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cwp-2',
    slug: 'cowork-ai-productivity-system',
    title: 'Build Your AI Productivity System',
    subtitle: 'Start every day with /productivity:start. Claude becomes your chief of staff — managing tasks, priorities, and daily workflows.',
    category: 'Operations',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 120,
    tools: ['Claude Cowork', 'Productivity Plugin', 'Slack', 'Notion'],
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    completionCount: 2650,
    rating: 4.8,
    expectedOutcome: 'A daily AI-powered productivity system where Claude reviews your day, organises priorities, and compounds its knowledge of your working style over time.',
    beforeYouStart: [
      'Install the Productivity plugin from Claude\'s plugin library',
      'Optional: Connect Slack, Notion, Asana, Linear, Jira, or ClickUp',
      'Prepare a brief description of your role and recurring priorities'
    ],
    steps: [
      {
        id: 'cwp-2-step-1',
        stepNumber: 1,
        title: 'Set Up Your Productivity Context',
        instruction: 'Install the Productivity plugin, then connect your tools: Settings → Connectors → Productivity → Connect Slack, Notion, etc. Create a file called "my-context.md" in your Cowork folder and paste the template below. Fill in the variables with your actual info.',
        promptTemplate: '# About Me\n- Role: [YOUR_ROLE e.g. "VP of Marketing at a B2B SaaS company"]\n- Team size: [NUMBER]\n- Key responsibilities: [LIST 3-5]\n- Tools I use daily: [e.g. "Slack, Notion, Linear, Google Docs"]\n\n# My Priorities This Quarter\n1. [PRIORITY_1]\n2. [PRIORITY_2]\n3. [PRIORITY_3]\n\n# Working Style\n- I prefer [STYLE e.g. "bullet points over paragraphs"]\n- Peak focus hours: [TIME e.g. "9-11am"]\n- Meetings clustered on: [DAYS]',
        expectedOutput: 'A personal context file that Claude references every session. Connected tools allow Claude to pull your real calendar, tasks, and messages.',
        tips: 'After a week of use, the Productivity plugin paired with good context makes Claude feel like a chief of staff who knows your schedule.',
        tools: ['Claude Cowork']
      },
      {
        id: 'cwp-2-step-2',
        stepNumber: 2,
        title: 'Start Every Day with /productivity:start',
        instruction: 'Run /productivity:start every morning before email. Claude reviews your day, organises priorities, identifies conflicts, and sets up your task list. After the initial briefing, use the follow-up prompts below to dig deeper.',
        promptTemplate: 'Given my priorities this quarter, what should I definitely get done today vs what can wait?\n\nAre there any follow-ups from yesterday I haven\'t addressed?\n\nBlock out my calendar for [TASK e.g. deep work on the product launch doc] — suggest the best 2-hour window based on my meetings.',
        expectedOutput: 'A structured daily briefing with prioritised tasks, meeting prep notes, follow-up reminders, and suggested time blocks.',
        tips: 'The magic is consistency. After 5 days, Claude starts anticipating your patterns. After 2 weeks, it feels indispensable.',
        tools: ['Claude Cowork', 'Productivity Plugin']
      },
      {
        id: 'cwp-2-step-3',
        stepNumber: 3,
        title: 'Build Weekly Reviews & Meeting Prep',
        instruction: 'At the end of each week, run a review. Before meetings, ask Claude to pull context from Slack and prepare talking points. Use these prompts throughout the week.',
        promptTemplate: 'Review my week. What did I accomplish against my quarterly priorities? What slipped? What should I carry forward to next week?\n\nI have a meeting with [PERSON/TEAM] about [TOPIC] in 30 minutes. Pull context from our recent Slack threads and prepare 3 talking points and 2 questions I should ask.\n\nWhat\'s my task load this week? Am I overcommitted?',
        expectedOutput: 'A weekly review with progress against goals, and meeting prep briefs that pull real context from connected tools.',
        tips: 'Connect Slack and your project management tool for best results. The plugin pulls real data to make recommendations grounded, not generic.',
        tools: ['Claude Cowork', 'Productivity Plugin', 'Slack']
      }
    ],
    troubleshooting: [
      { problem: 'Claude doesn\'t know my schedule', solution: 'Connect Microsoft 365 or Google Calendar via the Productivity connector.' },
      { problem: 'Task recommendations feel generic', solution: 'Enrich your my-context.md with more specific priorities and past decisions.' }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cwp-3',
    slug: 'cowork-sales-intelligence-battlecards',
    title: 'AI-Powered Sales Intelligence & Battlecards',
    subtitle: 'Replace 90 minutes of pre-call prep with 10. Build call briefs, competitive battlecards, and outreach sequences with /sales commands.',
    category: 'Sales Ops',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 240,
    tools: ['Claude Cowork', 'Sales Plugin', 'HubSpot', 'Clay'],
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    completionCount: 1520,
    rating: 4.9,
    expectedOutcome: 'A complete sales intelligence workflow: call prep briefs, competitive battlecards with specific rebuttals, and personalised outreach.',
    beforeYouStart: [
      'Install the Sales plugin from Claude\'s plugin library',
      'Optional: Connect HubSpot, Close, Clay, or ZoomInfo for CRM data',
      'Have your product info and key competitors identified'
    ],
    steps: [
      {
        id: 'cwp-3-step-1',
        stepNumber: 1,
        title: 'Set Up Sales Context & CRM Connection',
        instruction: 'Create a file called "sales-context.md" in your Cowork folder with your product info, competitors, and sales process. Then connect your CRM: Settings → Connectors → Sales → HubSpot / Close / Clay. Paste the template below and fill in your details.',
        promptTemplate: '# Our Product\n- Company: [YOUR_COMPANY]\n- Product: [PRODUCT_NAME] — [ONE_LINE_DESCRIPTION]\n- ICP: [IDEAL_CUSTOMER_PROFILE]\n- Price range: [RANGE]\n- Key differentiators: [LIST 3-5]\n\n# Top Competitors\n1. [COMPETITOR_1] — [POSITIONING]\n2. [COMPETITOR_2] — [POSITIONING]\n3. [COMPETITOR_3] — [POSITIONING]\n\n# Common Objections\n1. [OBJECTION_1]\n2. [OBJECTION_2]\n3. [OBJECTION_3]',
        expectedOutput: 'A sales context file that grounds all outputs in YOUR product, market, and process.',
        tips: 'Battlecard quality is directly proportional to how detailed your competitor section is. Include specific claims they make.',
        tools: ['Claude Cowork']
      },
      {
        id: 'cwp-3-step-2',
        stepNumber: 2,
        title: 'Generate Call Prep with /sales:call-prep',
        instruction: 'Type /sales:call-prep in Cowork. Claude pulls CRM data (if connected), researches the company, identifies recent news and triggers, and produces a structured briefing. Use the prompt below to specify what you need.',
        promptTemplate: 'Prepare me for a call with [PROSPECT_NAME] at [COMPANY].\nThey\'re in [DEAL_STAGE e.g. discovery / post-demo / negotiation].\nThe meeting is about [TOPIC].\n\nI need:\n1. Company overview and recent news/triggers\n2. Key stakeholder map\n3. 5 discovery questions tailored to their industry\n4. Likely objections and how to handle each\n5. Suggested next steps to advance the deal',
        expectedOutput: 'A structured call prep brief with company research, talking points, questions, objection rebuttals, and next steps.',
        tips: 'One sales manager said this replaced what used to take his team 90 minutes of pre-call prep. Connect HubSpot for automatic deal context.',
        tools: ['Claude Cowork', 'Sales Plugin', 'HubSpot']
      },
      {
        id: 'cwp-3-step-3',
        stepNumber: 3,
        title: 'Build Competitive Battlecards',
        instruction: 'Type /sales:battlecard in Cowork. Claude builds a side-by-side competitive comparison with specific rebuttal language mapped to competitor claims — not generic "we\'re better" talking points.',
        promptTemplate: 'Build a battlecard: [YOUR_PRODUCT] vs [COMPETITOR_NAME]\n\nInclude:\n1. Side-by-side feature comparison\n2. Their specific claims and our rebuttals\n3. When we win vs when we lose\n4. Proof points and customer stories to cite\n5. Discovery questions that expose their weaknesses\n6. Pricing comparison and value positioning\n\nThen create a one-page cheat sheet I can pull up during a live call.',
        expectedOutput: 'A detailed competitive battlecard with specific rebuttals, plus a quick-reference cheat sheet for live calls.',
        tips: 'Create battlecards for your top 3 competitors and save them in your Cowork folder. Update them monthly.',
        tools: ['Claude Cowork', 'Sales Plugin']
      }
    ],
    troubleshooting: [
      { problem: 'Call prep feels generic', solution: 'Connect your CRM so Claude pulls real deal data, not just web research.' },
      { problem: 'Battlecard misses competitor features', solution: 'Add competitor product pages or G2 reviews to your Cowork folder.' }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cwp-4',
    slug: 'cowork-contract-review-legal-ops',
    title: 'Automate Contract Review with Claude',
    subtitle: 'The plugin that crashed $285B in market value. Review NDAs, flag risk clauses, and draft legal briefs 10x faster.',
    category: 'Legal',
    difficulty: 'Intermediate',
    timeToComplete: 20,
    timeSaved: 300,
    tools: ['Claude Cowork', 'Legal Plugin', 'Box', 'Microsoft 365'],
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    completionCount: 980,
    rating: 4.7,
    expectedOutcome: 'A legal review workflow that automates NDA triage, contract risk analysis, compliance checks, and legal brief drafting.',
    beforeYouStart: [
      'Install the Legal plugin from Claude\'s plugin library',
      'Prepare a sample contract, NDA, or agreement for testing',
      'Optional: Connect Box or Egnyte for document management'
    ],
    steps: [
      {
        id: 'cwp-4-step-1',
        stepNumber: 1,
        title: 'Set Up Legal Context & Risk Tolerances',
        instruction: 'Create a file called "legal-context.md" in your Cowork folder. This tells Claude your organisation\'s specific risk tolerances, so it reviews contracts against YOUR standards, not generic ones. Paste the template below and fill in your details.',
        promptTemplate: '# Legal Standards\n- Company: [YOUR_COMPANY]\n- Industry: [INDUSTRY]\n- Jurisdiction: [PRIMARY_JURISDICTION]\n\n# Contract Review Standards\n- Indemnification cap: [e.g. "Up to 2x contract value"]\n- IP ownership: [e.g. "All work product owned by us"]\n- Data processing: [e.g. "Must comply with GDPR and SOC 2"]\n- Non-compete: [e.g. "Max 12 months, limited geography"]\n\n# Red Lines (always flag)\n1. [e.g. "Unlimited liability"]\n2. [e.g. "Right to assign without consent"]\n3. [e.g. "Non-standard termination clauses"]',
        expectedOutput: 'A legal context file that turns Claude from a generic reviewer into one calibrated to your risk tolerances.',
        tips: 'Thomson Reuters fell 18% and LegalZoom crashed 20% when this plugin launched. Customised to your playbook, it handles 60% of legal work.',
        tools: ['Claude Cowork']
      },
      {
        id: 'cwp-4-step-2',
        stepNumber: 2,
        title: 'Review Contracts & Flag Risk Clauses',
        instruction: 'Drop a contract into your Cowork project folder. Then use the prompt below to get a structured risk analysis with every clause flagged, rated, and accompanied by suggested alternative language.',
        promptTemplate: 'Review this [CONTRACT_TYPE e.g. SaaS agreement / NDA / vendor contract] and provide:\n\n1. Executive summary (key terms)\n2. Risk analysis — flag clauses conflicting with our standards\n3. For each flagged clause:\n   - Quote the exact language\n   - Explain the risk\n   - Suggest alternative language\n   - Rate severity: Red Line / Negotiate / Acceptable\n4. Missing protections — what standard clauses are absent?\n5. Recommended negotiation strategy',
        expectedOutput: 'A structured contract review with every risky clause quoted, explained, rated, and accompanied by alternative language.',
        tips: 'For NDAs, ask: "Is this mutual or one-way? Does it favour the disclosing or receiving party?" Claude rebalances one-sided NDAs.',
        tools: ['Claude Cowork', 'Legal Plugin']
      },
      {
        id: 'cwp-4-step-3',
        stepNumber: 3,
        title: 'Draft Legal Briefs & Compliance Checks',
        instruction: 'Use Claude to draft legal briefs on specific topics or run compliance audits against regulations like SOC 2, GDPR, or HIPAA.',
        promptTemplate: 'Draft a legal brief on [TOPIC e.g. our data processing obligations under our new EU customer contract]:\n\n1. Issue statement\n2. Relevant legal framework\n3. Analysis of our obligations\n4. Recommended actions\n5. Risk if we don\'t comply\n\nThen review our [PROCESS] against [REGULATION e.g. SOC 2 / GDPR / HIPAA]. Create a checklist with compliant areas, gaps needing attention, and non-compliant areas with remediation steps.',
        expectedOutput: 'Structured legal briefs and compliance checklists that would take a junior associate hours to draft.',
        tips: 'Save common contract templates in your Cowork folder. Claude uses them as baselines for reviewing incoming contracts.',
        tools: ['Claude Cowork', 'Legal Plugin']
      }
    ],
    troubleshooting: [
      { problem: 'Reviews are too generic', solution: 'Customise legal-context.md with specific risk tolerances. The plugin moves from A-tier to S-tier with proper customisation.' },
      { problem: 'Claude flags too many clauses', solution: 'Adjust risk tolerances. Tell Claude your risk appetite — startup vs enterprise.' }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cwp-5',
    slug: 'cowork-product-specs-roadmaps',
    title: 'Product Specs & Roadmaps in Minutes',
    subtitle: 'Turn vague product ideas into structured specs with user stories, acceptance criteria, and prioritised roadmaps.',
    category: 'Product',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 180,
    tools: ['Claude Cowork', 'Product Management Plugin', 'Linear', 'Figma'],
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    completionCount: 1230,
    rating: 4.8,
    expectedOutcome: 'A structured product spec with user stories, acceptance criteria, and a prioritised roadmap.',
    beforeYouStart: [
      'Install the Product Management plugin from Claude\'s plugin library',
      'Optional: Connect Linear, Asana, Jira, Notion, Figma, or Amplitude',
      'Have a product idea or feature request to spec out'
    ],
    steps: [
      {
        id: 'cwp-5-step-1',
        stepNumber: 1,
        title: 'Generate a Full Product Spec from an Idea',
        instruction: 'Type /product-management:write-spec in Cowork. Claude asks you clarifying questions first (constraints, users, timeline), then generates a full spec. Use the prompt below to give it your idea and context upfront.',
        promptTemplate: 'I want to build [FEATURE_IDEA e.g. a self-serve analytics dashboard for our customers]\n\nContext:\n- This is for [USER_TYPE]\n- We\'re a [COMPANY_CONTEXT]\n- Main goal: [WHY e.g. reduce support tickets by 40%]\n- Technical constraints: [ANY]\n- Timeline target: [e.g. ship MVP in 6 weeks]',
        expectedOutput: 'A structured spec with: problem statement, user stories with acceptance criteria, technical requirements, success metrics, and phased delivery plan.',
        tips: 'Claude asks clarifying questions — answer them. This grounds the output in your constraints. Saves 2-3 hours vs writing from scratch.',
        tools: ['Claude Cowork', 'Product Management Plugin']
      },
      {
        id: 'cwp-5-step-2',
        stepNumber: 2,
        title: 'Build a Prioritised Roadmap',
        instruction: 'Ask Claude to synthesise your backlog into a prioritised roadmap. If Linear or Jira is connected, Claude pulls your actual backlog. Otherwise, paste your items below.',
        promptTemplate: 'Build a product roadmap for [TIMEFRAME e.g. Q2 2026]:\n\nBacklog: [PASTE_YOUR_ITEMS or "pull from Linear"]\n\nPrioritise using:\n- Impact on [METRIC e.g. retention, revenue]\n- Engineering effort (S/M/L/XL)\n- Alignment with [COMPANY_GOAL]\n\nFor each item: priority ranking with rationale, effort, dependencies, success metrics, and risks.\n\nFormat as a timeline for [AUDIENCE e.g. engineering leads, the board].',
        expectedOutput: 'A prioritised roadmap with rationale, effort estimates, dependencies, and risks — formatted for your audience.',
        tips: 'Connect Linear or Jira for real backlog data. With Amplitude, Claude prioritises based on actual usage patterns.',
        tools: ['Claude Cowork', 'Product Management Plugin']
      },
      {
        id: 'cwp-5-step-3',
        stepNumber: 3,
        title: 'Generate Competitive Analysis',
        instruction: 'Ask Claude to build a feature-by-feature competitive analysis and a user research plan. Connect Intercom and Amplitude for data-driven insights.',
        promptTemplate: 'Competitive analysis: [YOUR_PRODUCT] vs [COMPETITOR_1], [COMPETITOR_2], [COMPETITOR_3]:\n- Feature comparison\n- Pricing and packaging\n- User sentiment\n- Where we lead vs behind\n- Strategic recommendations: what should we build to win?\n\nThen design a user research plan for [FEATURE/HYPOTHESIS] with research questions, methods, participant criteria, and a discussion guide.',
        expectedOutput: 'A competitive brief and research plan that would take a PM 2-3 hours to build manually.',
        tips: 'Connect Intercom and Amplitude — Claude pulls real feedback and usage data to ground the analysis.',
        tools: ['Claude Cowork', 'Product Management Plugin']
      }
    ],
    troubleshooting: [
      { problem: 'Spec is too vague', solution: 'Provide more context: user, problem, constraints. Answer Claude\'s clarifying questions thoroughly.' },
      { problem: 'Roadmap priorities feel off', solution: 'Add strategic goals to context. Without them, Claude defaults to generic scoring.' }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cwp-6',
    slug: 'cowork-marketing-content-your-voice',
    title: 'AI Marketing Content That Sounds Like You',
    subtitle: 'Use /marketing:draft-content with your brand voice file to create campaigns and content that doesn\'t sound like AI.',
    category: 'Marketing',
    difficulty: 'Beginner',
    timeToComplete: 15,
    timeSaved: 200,
    tools: ['Claude Cowork', 'Marketing Plugin', 'Canva', 'HubSpot'],
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    completionCount: 2100,
    rating: 4.8,
    expectedOutcome: 'A full content workflow — brand voice guide, on-brand drafts, multi-channel campaign plans, and competitive briefings.',
    beforeYouStart: [
      'Install the Marketing plugin from Claude\'s plugin library',
      'Optional: Install the Brand Voice plugin (by Tribe AI)',
      'Gather 10-20 examples of your best existing content',
      'Optional: Connect Canva, HubSpot, Ahrefs, or Klaviyo'
    ],
    steps: [
      {
        id: 'cwp-6-step-1',
        stepNumber: 1,
        title: 'Create Your Brand Voice File',
        instruction: 'Paste 10-20 examples of your best content (emails, blogs, social posts) into Claude and ask it to create a brand voice guide. Save the output as brand-voice.md in your Cowork folder — the Marketing plugin references it automatically for every future draft.',
        promptTemplate: 'Analyse these examples of our content and create a brand-voice.md file capturing:\n\n1. Voice attributes (3-5 adjectives)\n2. Writing principles (DO / DON\'T)\n3. Vocabulary preferences (words we use vs avoid)\n4. Sentence structure patterns\n5. How voice changes by channel (blog vs email vs social)\n6. Example phrases that are "very us" vs "not us at all"\n\nAudience: [YOUR_AUDIENCE]\nBrand personality: [e.g. Smart but not pretentious, direct but warm]',
        expectedOutput: 'A brand voice guide Claude references automatically. The difference between generic AI content and content that sounds like you.',
        tips: 'The Brand Voice plugin by Tribe AI can also create this. Feed it 10+ examples and it distils your voice into enforceable guidelines.',
        tools: ['Claude Cowork', 'Brand Voice Plugin']
      },
      {
        id: 'cwp-6-step-2',
        stepNumber: 2,
        title: 'Draft Content with /marketing:draft-content',
        instruction: 'Type /marketing:draft-content in Cowork. Point it at your brand-voice.md file, specify audience and goal, and it produces content that sounds like your brand. Use the prompt below.',
        promptTemplate: 'Write a [CONTENT_TYPE e.g. blog post / email / LinkedIn post] about [TOPIC]:\n\nAudience: [TARGET]\nGoal: [OBJECTIVE e.g. drive demos / build thought leadership]\nChannel: [WHERE]\nTone: Reference our brand-voice.md\nLength: [e.g. 800 words for blog, 150 for LinkedIn]\nCTA: [e.g. Book a demo / Download guide]\n\nKey points:\n1. [POINT_1]\n2. [POINT_2]\n3. [POINT_3]',
        expectedOutput: 'Content drafted in YOUR brand voice — right tone, vocabulary, and structure for the channel.',
        tips: 'Test it: show the output to a colleague without saying it\'s AI-generated. If your brand-voice.md is good, they won\'t tell.',
        tools: ['Claude Cowork', 'Marketing Plugin']
      },
      {
        id: 'cwp-6-step-3',
        stepNumber: 3,
        title: 'Build Multi-Channel Campaign Plans',
        instruction: 'Ask Claude to create a full campaign plan with channel-specific messaging, content calendar, email sequences, social posts, and KPIs. Use the prompt below.',
        promptTemplate: 'Create a campaign plan for [GOAL e.g. launching our enterprise plan]:\n\n- Launch date: [DATE]\n- Budget: [BUDGET]\n- Audience: [AUDIENCE]\n- Key message: [CORE_MESSAGE]\n\nI need:\n1. Channel strategy with specific messaging per channel\n2. Content calendar with dates and owners\n3. Email sequence with subject lines and timing\n4. Social posts for 2 weeks pre and post launch\n5. KPIs per channel\n6. A/B test suggestions\n\nThen create a competitive briefing: how does [COMPETITOR] position their equivalent and how should we differentiate?',
        expectedOutput: 'A complete campaign plan with content calendar, email sequences, social posts, KPIs, and competitive positioning.',
        tips: 'Connect HubSpot for email data and Ahrefs for SEO insights. Claude recommends channels based on your track record.',
        tools: ['Claude Cowork', 'Marketing Plugin']
      }
    ],
    troubleshooting: [
      { problem: 'Content sounds generic', solution: 'Your brand-voice.md needs more examples. Add 10+ pieces and include "very us" vs "not us" phrases.' },
      { problem: 'Campaign plan too high-level', solution: 'Add more constraints: budget, team size, past performance data.' }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cwp-8',
    slug: 'claude-code-figma-mcp-workflow',
    title: 'Figma to React with Claude Code & MCP',
    subtitle: 'Connect your IDE directly to Figma using the Model Context Protocol. Extract exact design tokens, build React components from frames, and push new UI variations back to the canvas.',
    category: 'AI for Designers',
    difficulty: 'Advanced',
    timeToComplete: 25,
    timeSaved: 600,
    tools: ['Claude Code', 'Figma MCP Server', 'Terminal'],
    isPro: true,
    isNew: true,
    coworkCompatible: true,
    completionCount: 420,
    rating: 5.0,
    expectedOutcome: 'A seamless pipeline where your ID (Claude Code / Antigravity) reads directly from your live Figma files to build pixel-perfect reacting components, and can generate new design pages back into Figma.',
    beforeYouStart: [
      'Have Claude Code installed on your machine (`npm install -g @anthropic-ai/claude-code`) or use Antigravity IDE',
      'Have a Figma Personal Access Token (Settings → Personal Access Tokens)',
      'Have the URL of the Figma file you want to connect to'
    ],
    steps: [
      {
        id: 'cwp-8-step-1',
        stepNumber: 1,
        title: 'Connect the Figma MCP Server',
        instruction: 'First, you need to authenticate Claude Code with Figma using the Model Context Protocol (MCP). This gives Claude read/write access to your design files without leaving the terminal or IDE.',
        promptTemplate: 'Run this in your terminal or Claude Code CLI to configure the Figma MCP server:\n\n`claude mcp add figma --env FIGMA_ACCESS_TOKEN="[YOUR_FIGMA_TOKEN]"`\n\nOnce added, type `/mcp` in Claude to verify the Figma server is connected and active.',
        expectedOutput: 'Claude Code confirms the Figma MCP server is connected, granting the AI access to tools like `figma_get_file`, `figma_get_nodes`, and `figma_generate_design`.',
        tips: 'Never commit your `FIGMA_ACCESS_TOKEN` to git. The MCP configuration securely stores it locally for Claude Code to use.',
        tools: ['Claude Code', 'Terminal']
      },
      {
        id: 'cwp-8-step-2',
        stepNumber: 2,
        title: 'Extract Design Tokens into CSS/Tailwind',
        instruction: 'Instead of manually inspecting Figma, ask Claude to read the file and generate your exact design system code. Claude uses the MCP to fetch the live variables.',
        promptTemplate: 'Read the Figma file at `[YOUR_FIGMA_FILE_URL]`.\n\nExtract all the local variables (Colors, Typography, Spacing).\nGenerate a generic `index.css` file with all these values mapped to CSS Custom Properties (`--color-primary`, etc.) on the `:root` selector.\n\nEnsure semantic naming based on how they are named in Figma.',
        expectedOutput: 'Claude uses the `figma_get_file` tool to read the literal hex codes and spacing values from your Figma file and writes a perfect CSS file to your project.',
        tips: 'If you use Tailwind, you can alter the prompt to say "Generate a `tailwind.config.js` file extending the theme with these tokens" instead of CSS variables.',
        tools: ['Claude Code', 'Figma MCP']
      },
      {
        id: 'cwp-8-step-3',
        stepNumber: 3,
        title: 'Build a Component directly from a Frame',
        instruction: 'Find the specific Node ID of the component or UI section you want to build in Figma (Click it, copy the URL, the `node-id=` part is what you need). Ask Claude to build it.',
        promptTemplate: 'Read the specific Figma node: `[YOUR_NODE_ID]` from file `[YOUR_FIGMA_FILE_URL]`.\n\nBased on its layout, text, and styling, build a React + TypeScript component named `[COMPONENT_NAME].tsx`.\n- Use the CSS variables we generated earlier.\n- Make it responsive (the Figma frame might be desktop-only, so infer the mobile layout).\n- Extract the text into sensible props.',
        expectedOutput: 'Claude translates the absolute positioning and flexbox rules from Figma into a clean, responsive React component.',
        tips: 'Figma\'s auto-layout translates beautifully to CSS Flexbox. If your design isn\'t using auto-layout, Claude will have to guess the responsive behavior, so always auto-layout in Figma first!',
        tools: ['Claude Code', 'Figma MCP']
      },
      {
        id: 'cwp-8-step-4',
        stepNumber: 4,
        title: 'Generate New Design Pages back to Figma',
        instruction: 'Now for the magic. You can ask Claude Code to take your existing design system and generate entirely new pages directly onto your Figma canvas.',
        promptTemplate: 'Look at the design language in file `[YOUR_FIGMA_FILE_URL]`.\n\nI need a new "Settings / Profile" page. It should include:\n- A header matching the other pages\n- A sidebar navigation for (Account, Security, Billing, Notifications)\n- A main content area showing a Profile form (Avatar, Name, Email, Bio)\n\nGenerate this new design and push it as a new Frame onto the current Figma page.',
        expectedOutput: 'Claude uses the `figma_generate_design` (or Code to Canvas API via MCP) to construct a new Frame in your live Figma file, assembling it using your existing branding and components.',
        tips: 'This is perfect for "filling in the gaps". If you designed the Dashboard, you can have Claude automatically generate the tedious Settings, Terms of Service, and 404 pages directly in Figma.',
        tools: ['Claude Code', 'Figma MCP']
      }
    ],
    troubleshooting: [
      { problem: 'Claude says "Figma tool not found"', solution: 'Verify the MCP server is running. Type `/mcp` or check your `claude.json` configuration file to ensure the token is correct.' },
      { problem: 'The generated React component uses weird absolute positioning', solution: 'The source frame in Figma must be using Auto-Layout. If a frame has elements dragged freely onto it, the API reads them as absolute coordinates.' },
      { problem: 'Cannot access Figma link', solution: 'Ensure the link is properly formatted and the Personal Access Token belongs to a Figma account with read access to that file.' }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cwp-9',
    slug: 'cowork-financial-budget-analysis',
    title: 'Financial & Budget Analysis Automation',
    subtitle: 'Turn raw budget spreadsheets into variance reports and leadership slides using the xlsx, docx, and pptx skills.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 15,
    timeSaved: 120,
    tools: ['Claude Cowork', 'xlsx skill', 'docx skill', 'pptx skill', 'Windsor.ai'],
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    completionCount: 95,
    rating: 4.8,
    expectedOutcome: 'A complete financial analysis pipeline that processes messy spreadsheets and outputs formatted Board-ready executive summaries and slide decks.',
    beforeYouStart: [
      'A budget vs actuals spreadsheet (CSV/Excel)',
      'Claude with the xlsx, docx, and pptx skills enabled'
    ],
    steps: [
      {
        id: 'cwp-9-step-1',
        stepNumber: 1,
        title: 'Upload & Clean Data',
        instruction: 'Share your Excel or CSV file directly in the Cowork chat. The `xlsx` skill will open the file, identify structures, handle messy data, and prepare it for analysis automatically.',
        promptTemplate: 'This is our Q1 budget vs actuals spreadsheet — analyse it for variances over 10% and flag any categories trending over budget.',
        expectedOutput: 'Claude processes the file without you needing to clean up merged cells or blank rows manually.',
        tips: 'Power move: Connect Windsor.ai or Coupler.io to pull live financial data directly from your accounting platform instead of uploading a file manually.',
        tools: ['Claude Cowork', 'xlsx skill']
      },
      {
        id: 'cwp-9-step-2',
        stepNumber: 2,
        title: 'Generate Visualisations',
        instruction: 'Ask Claude to synthesize the findings visually. The `xlsx` skill will inject charts directly into the spreadsheet.',
        promptTemplate: 'Add a bar chart comparing budget vs actual by department, and a line chart showing the monthly spend trend.',
        expectedOutput: 'Visual charts embedded directly into your working dataset.',
        tips: 'Keep chart requests simple (Bar, Line, Pie) for the highest fidelity output.',
        tools: ['Claude Cowork', 'xlsx skill']
      },
      {
        id: 'cwp-9-step-3',
        stepNumber: 3,
        title: 'Generate Written Narrative',
        instruction: 'Use the `docx` skill to construct a formal, formatted written report suitable for stakeholders.',
        promptTemplate: 'Now write a one-page executive summary of the findings as a Word doc. Include key callouts, a variance table, and recommendations.',
        expectedOutput: 'A fully formatted `.docx` file summarizing the raw dataset.',
        tips: 'Always ask for the "so what," not just the numbers. Claude will give you actionable recommendations.',
        tools: ['Claude Cowork', 'docx skill']
      },
      {
        id: 'cwp-9-step-4',
        stepNumber: 4,
        title: 'Build the Leadership Slide',
        instruction: 'Convert the narrative into a presentation. The `pptx` skill will construct a deck using the charts and summary.',
        promptTemplate: 'Turn the top 3 findings into 3 slides for the board update.',
        expectedOutput: 'A presentation-ready `.pptx` deck.',
        tips: 'You can chain skills together! xlsx -> docx -> pptx is the golden workflow.',
        tools: ['Claude Cowork', 'pptx skill']
      }
    ],
    troubleshooting: [
      { problem: 'Charts look deformed', solution: 'Explicitly describe the X and Y axes you want when prompting the xlsx skill.' }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cwp-10',
    slug: 'cowork-marketing-campaign-analysis',
    title: 'Automated Marketing & Campaign Analysis',
    subtitle: 'Evaluate campaign performance across multiple channels and produce monthly performance reports instantly.',
    category: 'Marketing',
    difficulty: 'Intermediate',
    timeToComplete: 20,
    timeSaved: 180,
    tools: ['Claude Cowork', 'Supermetrics', 'Windsor.ai', 'docx skill', 'pptx skill'],
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    completionCount: 140,
    rating: 4.9,
    expectedOutcome: 'A unified view of ad spend and performance across Google, Meta, and Organic channels natively inside a presentation.',
    beforeYouStart: [
      'Install Windsor.ai or Supermetrics from the connector marketplace',
      'Have target KPIs (e.g. Target CPA, ROAS) ready'
    ],
    steps: [
      {
        id: 'cwp-10-step-1',
        stepNumber: 1,
        title: 'Connect Live Data Sources',
        instruction: 'Use the marketplace connectors to pull live performance data without needing to export and sanitize CSVs manually.',
        promptTemplate: 'Pull my Google Ads and Meta Ads performance data for the previous month — I want spend, impressions, clicks, conversions, and CPA by campaign.',
        expectedOutput: 'Live API extraction straight into Claude\'s context window.',
        tips: 'Using connectors prevents data latency and copy-paste formatting errors.',
        tools: ['Claude Cowork', 'Windsor.ai', 'Supermetrics']
      },
      {
        id: 'cwp-10-step-2',
        stepNumber: 2,
        title: 'Cross-Channel Analysis',
        instruction: 'Leverage Claude to compare disparate datasets to find anomalies and highlight top-performing campaigns.',
        promptTemplate: 'Which campaigns had a CPA above our £25 target? Which channels delivered the best ROAS? Flag anything that looks like an anomaly.\n\nCompare Google vs Meta vs organic — which channel drove the most revenue at the lowest cost?',
        expectedOutput: 'A synthesized textual breakdown of performance and anomalies.',
        tips: 'Be specific about what "good" looks like. Don\'t just say "analyse this." Give it your exact Target CPAs.',
        tools: ['Claude Cowork']
      },
      {
        id: 'cwp-10-step-3',
        stepNumber: 3,
        title: 'Build the Performance Report',
        instruction: 'Generate the raw analytical breakdown into a formal monthly marketing update.',
        promptTemplate: 'Create a monthly marketing report as a Word document — include an executive summary, channel-by-channel breakdown, top performing creatives, and recommendations for next month.',
        expectedOutput: 'A clean, formatted `.docx` report to share with stakeholders.',
        tips: 'You can explicitly ask Claude to format the tables identically each month for consistency.',
        tools: ['Claude Cowork', 'docx skill']
      },
      {
        id: 'cwp-10-step-4',
        stepNumber: 4,
        title: 'Build the Client Deck',
        instruction: 'Condense the formal report into a digestible visual slide deck.',
        promptTemplate: 'Now turn this into a 10-slide presentation for the marketing review.',
        expectedOutput: 'A `.pptx` deck featuring charts, callouts, and next-step recommendations.',
        tips: 'Tell Claude to limit text-heavy slides to bullet points instead of paragraphs.',
        tools: ['Claude Cowork', 'pptx skill']
      }
    ],
    troubleshooting: [
      { problem: 'Connector fails to access data', solution: 'Ensure your Supermetrics/Windsor OAuth tokens are refreshed in the Cowork settings menu.' }
    ],
    relatedPlaybooks: []
  },
  {
    id: 'cwp-11',
    slug: 'cowork-prospect-outreach',
    title: 'Prospect Research & Personal Outreach',
    subtitle: 'From prospect research to an automated personalised outreach sequence logged natively to your CRM.',
    category: 'Sales Ops',
    difficulty: 'Beginner',
    timeToComplete: 10,
    timeSaved: 90,
    tools: ['Claude Cowork', 'HubSpot', 'Close', 'Gmail'],
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    completionCount: 205,
    rating: 4.8,
    expectedOutcome: 'A heavily researched account profile and a deeply personalized 5-step email sequence automatically synced to your CRM.',
    beforeYouStart: [
      'Connect HubSpot, Close, or Attio from the marketplace',
      'Connect Gmail to draft sequences natively'
    ],
    steps: [
      {
        id: 'cwp-11-step-1',
        stepNumber: 1,
        title: 'Research the Prospect',
        instruction: 'Feed Claude initial targets and let it synthesize strategy and account profiles from internet access.',
        promptTemplate: 'I\'m targeting Acme Corp — they\'re a 500-person SaaS company, Series C funded, expanding into Europe. Their main pain point appears to be customer retention. Find out what you can about their positioning.',
        expectedOutput: 'A robust breakdown of the target account\'s product positioning, news, challenges, and your fit.',
        tips: 'The more constraints and initial context you give, the deeper the research.',
        tools: ['Claude Cowork']
      },
      {
        id: 'cwp-11-step-2',
        stepNumber: 2,
        title: 'Build a Personalised Outreach Sequence',
        instruction: 'Draft the multi-touch outreach flow. Use the `Gmail` integration to queue the drafts or copy them out manually.',
        promptTemplate: 'Write a 5-email sequence for this prospect — initial outreach, follow-up 1 (value add), follow-up 2 (case study), follow-up 3 (direct ask), and a break-up email. Adjust tone for each stage. Reference their European expansion, and connect it to how we\'ve helped similar SaaS companies reduce churn by 30%.',
        expectedOutput: 'A complete, varied, and heavily targeted email flow.',
        tips: 'Tell Claude to avoid sales buzzwords explicitly for a more authentic tone.',
        tools: ['Claude Cowork', 'Gmail']
      },
      {
        id: 'cwp-11-step-3',
        stepNumber: 3,
        title: 'Log to CRM',
        instruction: 'Push all the prospect data, the sequence, and follow-up tasks to your CRM in one go.',
        promptTemplate: 'Create a contact record for Sarah Jones at Acme Corp, add these emails to the sequence, and set a follow-up task for 3 days after the first send.',
        expectedOutput: 'Data automatically synced to HubSpot or Close without switching tabs.',
        tips: 'Ensure your CRM fields match standard naming conventions so the Connector maps them perfectly.',
        tools: ['Claude Cowork', 'HubSpot', 'Close']
      }
    ],
    troubleshooting: [],
    relatedPlaybooks: []
  },
  {
    id: 'cwp-12',
    slug: 'cowork-winning-proposals',
    title: 'Winning Proposals & Pitch Decks',
    subtitle: 'Transform a messy client brief into a formal proposal, pricing matrix, and pitch deck using the pdf, docx, and pptx skills.',
    category: 'Sales Ops',
    difficulty: 'Advanced',
    timeToComplete: 25,
    timeSaved: 360,
    tools: ['Claude Cowork', 'pdf skill', 'docx skill', 'xlsx skill', 'pptx skill'],
    isPro: false,
    isNew: true,
    coworkCompatible: true,
    completionCount: 112,
    rating: 5.0,
    expectedOutcome: 'A complete RFP/Proposal package generated natively from an initial brief.',
    beforeYouStart: [
      'A client brief, RFP, or scope document in PDF format',
      'Your company\'s standard credentials boilerplate'
    ],
    steps: [
      {
        id: 'cwp-12-step-1',
        stepNumber: 1,
        title: 'Read the Brief',
        instruction: 'Use the `pdf` skill to ingest complex RFPs and extract the actual success criteria.',
        promptTemplate: 'Read this client brief and pull out: their key objectives, their timeline, their stated budget, their success criteria, and any red flags I should address in the proposal.',
        expectedOutput: 'Claude summarizes what actually matters and flags what to address in your pitch.',
        tips: 'Any PDF that is publicly available (competitor reports, annual reviews) can also be interrogated to strengthen your approach.',
        tools: ['Claude Cowork', 'pdf skill']
      },
      {
        id: 'cwp-12-step-2',
        stepNumber: 2,
        title: 'Build the Proposal Structure & Copy',
        instruction: 'Use the `docx` skill to construct a fully formatted proposal outline and content body based on the brief.',
        promptTemplate: 'Based on this brief, suggest a proposal structure for a 12-page Word document. We\'re a brand strategy agency pitching to a retail brand.\n\nWrite the full proposal using this structure. Include an executive summary, our understanding of the brief, our proposed approach, team credentials, timeline, and investment. Here\'s our standard credentials text [paste it].',
        expectedOutput: 'A formatted `.docx` file complete with document sections and boilerplate injected natively.',
        tips: 'Feed it context! Your past notes from discovery calls and pricing guidelines dramatically improve the output quality.',
        tools: ['Claude Cowork', 'docx skill']
      },
      {
        id: 'cwp-12-step-3',
        stepNumber: 3,
        title: 'Build the Pricing Model',
        instruction: 'Construct the financial breakdown using the `xlsx` skill so the client has an editable matrix.',
        promptTemplate: 'Create a pricing spreadsheet for this project — it\'s a 3-month brand strategy engagement. Break it down by phase: Discovery (£8k), Strategy (£15k), Delivery (£12k). Include a summary tab with totals and an optional add-ons section.',
        expectedOutput: 'A clean, calculated `.xlsx` pricing workbook.',
        tips: 'A combination of xlsx and docx enables building a pricing model in a spreadsheet and pulling the summary seamlessly into the Word document.',
        tools: ['Claude Cowork', 'xlsx skill']
      },
      {
        id: 'cwp-12-step-4',
        stepNumber: 4,
        title: 'Create the Pitch Deck',
        instruction: 'Distill the massive proposal into a visual live meeting presentaton using the `pptx` skill.',
        promptTemplate: 'Turn this proposal into a 15-slide pitch deck for a face-to-face presentation. Make it more visual and less text-heavy than the document. Lead with the problem, our solution, proof, and the ask.',
        expectedOutput: 'A visual `.pptx` deck summarizing the extensive proposal logic.',
        tips: 'Build master templates once, then customize per prospect in seconds.',
        tools: ['Claude Cowork', 'pptx skill']
      }
    ],
    troubleshooting: [
      { problem: 'Proposal feels too generic', solution: 'The AI drafts, you refine. Use the output as a strong structural starting point, but always add human insight and relationship context manually before sending.' }
    ],
    relatedPlaybooks: []
  }
];
