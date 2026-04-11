import type { Step, Playbook, WebhookConfig, WebhookInput } from '../types/playbook';

export type { Step, Playbook, WebhookConfig, WebhookInput };

export const launchCatalog: Playbook[] = [
  {
    id: 'wkflow-1',
    slug: 'weekly-ceo-briefing',
    title: 'Weekly CEO Briefing',
    subtitle: 'High-level synthesis of metrics across sales, finance, and operations.',
    category: 'Executive',
    difficulty: 'Advanced',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Supabase', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'A weekly email summarizing business health.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-2',
    slug: 'sales-pipeline-health',
    title: 'Sales Pipeline Health',
    subtitle: 'Alerts you to stalled deals and changes in probability.',
    category: 'Sales',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Salesforce', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'A clear view of at-risk deals in your pipeline.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-3',
    slug: 'ar-aging',
    title: 'Accounts Receivable Aging',
    subtitle: 'Notifies you when key clients go 30+ days overdue.',
    category: 'Finance',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 60,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['QuickBooks', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'Alerts for late payments with suggested follow-ups.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-70',
    slug: 'virtual-cfo-weekly-report',
    title: 'Virtual CFO Weekly Report',
    subtitle: 'Reads your transactions, invoices, and budget every week and delivers a complete financial officer briefing — cash position, AR aging, budget health, anomalies, and a 4-week cash forecast.',
    category: 'Finance',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 300,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: `Analyze all financial data provided (transactions, invoices, budget). Produce a complete Weekly CFO Report with every section below. Be specific with numbers — never write vague summaries.

## 1. Cash Position This Week
Calculate and show as a summary table:
- Opening balance (balance at start of the week or earliest entry)
- Total inflows (all income recorded this week)
- Total outflows (all expenses recorded this week)
- Net cash movement
- Closing balance (current cash position)

## 2. Accounts Receivable Aging
List every unpaid invoice. Categorize by age:
- Current (0–30 days): list with amounts
- Overdue (31–60 days): list with amounts, days overdue, recommended follow-up action
- Seriously Overdue (61–90 days): list with amounts, escalation action
- Critical (90+ days): list with amounts, write-off risk assessment
Show total AR outstanding in ₦. Name the highest-value overdue client and the exact message to send them today.

## 3. Budget vs Actual
For each expense category: budgeted amount (₦), actual spend (₦), variance (₦), % of budget used, and status — On Track / At Risk / Over Budget. Flag every category above 80% burn with weeks remaining in the month. Flag the 3 most overspent categories with a specific action to reduce each.

## 4. Expense Anomalies
Flag any transactions that are: significantly larger than usual for that category, missing a category, potential duplicates (same amount + vendor within 7 days), or have unusual timing. For each: date, amount, vendor, category, reason flagged, recommended action.

## 5. 4-Week Cash Forecast
Project the cash closing balance for each of the next 4 weeks based on: current closing balance, average weekly burn rate from transactions, and any known recurring expenses. Present as a table: Week | Projected Inflows | Projected Outflows | Projected Balance. Flag any week where cash may fall below ₦500,000 (or the lowest single-week balance in the data if no baseline exists). Give a runway estimate in weeks at current burn.

## 6. This Week's 5 Financial Actions
Give exactly 5 numbered, specific actions to take this week. Include names, amounts, and deadlines. Prioritize by financial impact. Examples of the specificity required: "Call [Client Name] today — ₦240,000 invoice is 45 days overdue", "Cut [Category] spend — you are 94% through budget with 11 days left in the month."`,
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-4',
    slug: 'monthly-financial-snapshot',
    title: 'Monthly Financial Snapshot',
    subtitle: 'Narrative summary of P&L changes vs last month.',
    category: 'Finance',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 180,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['QuickBooks', 'Xero', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'Plain-English breakdown of your financials.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-5',
    slug: 'competitor-intelligence',
    title: 'Competitor Intelligence Tracker',
    subtitle: 'Monitors competitor websites for pricing or feature changes.',
    category: 'Marketing',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Firecrawl', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'Alerts when your competitors update their sites.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-6',
    slug: 'pricing-intelligence',
    title: 'Pricing Intelligence Agent',
    subtitle: 'Tracks supplier and competitor price movements.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Firecrawl', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'A table of price changes across your industry.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-7',
    slug: 'industry-news-digest',
    title: 'Industry News Digest',
    subtitle: 'Curates top news from your specific niche and provides a summary.',
    category: 'Research',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 60,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['RSS', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'Daily or weekly summary of important industry news.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-8',
    slug: 'brand-mention-monitor',
    title: 'Brand Mention Monitor',
    subtitle: 'Searches Google and Google Maps for new reviews and online mentions of your business each week.',
    category: 'Marketing',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['TinyFish', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'A weekly Brand Mention Report with: all new customer reviews (star rating + key quote), overall sentiment score, competitor comparisons customers made, any news or forum mentions, and 3 specific action items for the week.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-9',
    slug: 'regulatory-monitor',
    title: 'Regulatory Monitor',
    subtitle: 'Watches government/compliance sites for new rule changes affecting your business.',
    category: 'Legal/Compliance',
    difficulty: 'Advanced',
    timeToComplete: 0,
    timeSaved: 300,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Firecrawl', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'Summaries of regulatory changes and their business impact.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-10',
    slug: 'supplier-price-tracker',
    title: 'Supplier Price Tracker',
    subtitle: 'Monitors your core suppliers for unannounced price hikes.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 150,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Firecrawl', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'Alerts when raw material or vendor pricing changes.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-60',
    slug: 'jiji-price-tracker',
    title: 'Jiji Market Price Tracker',
    subtitle: 'Searches Jiji.ng for current market prices on any product so you always know what buyers are paying.',
    category: 'Operations',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['TinyFish', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'A weekly Market Price Report with: a full table of current Jiji listings (title, price, location, condition), price summary (lowest / highest / average), market insights (new vs used gap, location patterns, outliers), and a clear buy/restock recommendation.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-11',
    slug: 'customer-expansion-radar',
    title: 'Customer Expansion Radar',
    subtitle: 'Monitors your existing clients for hiring surges or funding news indicating upsell opportunity.',
    category: 'Sales',
    difficulty: 'Advanced',
    timeToComplete: 0,
    timeSaved: 200,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Firecrawl', 'LinkedIn', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'Upsell signals delivered directly to your sales team.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-14',
    slug: 'cash-flow-weekly',
    title: 'Cash Flow Weekly',
    subtitle: 'Reads your spreadsheet and delivers a plain-English cash position summary with trends.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'Analyze this cash flow spreadsheet. Calculate total income, total expenses, and net cash position. Identify top expense categories, any unusual spikes or drops, and month-over-month trends. Project next period cash position if current trends continue. Flag any cash flow risks.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-15',
    slug: 'product-restock-alert',
    title: 'Product Restock Alert',
    subtitle: 'Monitors your supplier pages for inventory changes, price shifts, and new products.',
    category: 'Operations',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 60,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Firecrawl', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'Monitor these supplier pages for inventory and product changes. Flag items that are back in stock, newly out of stock, have changed in price, or are newly listed. Create a clear status table of all products found with current availability and any price changes.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-20',
    slug: 'youtube-trend-tracker',
    title: 'YouTube Trend Tracker',
    subtitle: 'Surfaces trending videos in your niche and identifies content gaps you can fill.',
    category: 'Creator',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Apify', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: 'Analyze trending YouTube content in this niche. Identify the most common themes, formats, and topics performing well. Highlight content gaps — topics with audience interest but few quality videos. Suggest 5 specific video ideas with titles, hooks, and why each would perform well right now.',
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-21',
    slug: 'content-calendar-planner',
    title: 'Content Calendar Planner',
    subtitle: "Builds a 7-day content plan based on what's trending in your niche right now.",
    category: 'Creator',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 180,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Reddit', 'RSS', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Based on these trending topics and discussions, create a 7-day content calendar. For each day include: a specific post topic, a compelling hook or angle, the best platform (Instagram, X/Twitter, YouTube Shorts, or Newsletter), and why it's timely. Format as a table. End with 3 evergreen backup ideas.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-22',
    slug: 'weekly-seo-audit',
    title: 'Weekly SEO Audit',
    subtitle: 'Scrapes your website and emails a prioritised list of SEO issues to fix this week.',
    category: 'Marketing',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Firecrawl', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Audit this website for SEO issues. Check for: missing or duplicate title tags, missing meta descriptions, missing alt text on images, thin content, missing H1 tags, and keyword opportunities. Rate overall SEO health out of 10. List the top 5 issues to fix this week ranked by impact with specific actionable fixes for each — not generic advice.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-23',
    slug: 'landing-page-cro',
    title: 'Landing Page CRO Report',
    subtitle: 'Analyses your landing page each week and emails specific conversion improvements.',
    category: 'Marketing',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Firecrawl', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Analyze this landing page for conversion optimization. Evaluate: headline clarity, value proposition strength, CTA placement and copy, social proof and trust signals, form friction, above-the-fold content, and objection handling. Score each element out of 10. List the 5 highest-impact changes to make this week. Be specific — give exact copy rewrites, not just 'improve your headline'.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-25',
    slug: 'ai-search-visibility',
    title: 'AI Search Visibility Monitor',
    subtitle: 'Tracks whether your brand appears when people search your category online.',
    category: 'Marketing',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Web', 'Reddit', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Search for mentions and discussions of this brand/product across the web and forums. Assess: Is the brand being mentioned positively or negatively? What contexts is it appearing in? Are competitors dominating the conversation? What questions are people asking that this brand should be answering? Give a visibility score out of 10 and 3 specific actions to improve search presence this week.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-26',
    slug: 'cold-email-sequence',
    title: 'Cold Email Sequence Builder',
    subtitle: 'Generates a fresh 5-email outreach sequence each week based on your target customer.',
    category: 'Sales',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 150,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Claude'],
    beforeYouStart: [],
    expectedOutcome: "Based on this target customer profile and product description, write a 5-email cold outreach sequence. Email 1: Pattern interrupt opener referencing a specific pain point. Email 2: Case study or social proof. Email 3: Direct value proposition. Email 4: Objection handler. Email 5: Breakup email. For each provide: subject line, preview text, body (under 100 words), and CTA. Write at a human, conversational level — not salesy.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-28',
    slug: 'churn-risk-analysis',
    title: 'Churn Risk Analysis',
    subtitle: 'Scans your customer activity data and flags who is at risk of leaving this week.',
    category: 'Sales',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 200,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Analyze this customer activity data. Identify customers showing churn signals: declining usage, missed payments, support tickets, reduced logins, or stagnant accounts. For each at-risk customer give: a risk score (1–10), the reason for risk, and a recommended action (email re-engagement, discount offer, personal outreach, etc.). Prioritise by revenue at risk. Output as a clear action table.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },

  // ── 5-Line Financial Health Check ─────────────────────────────────────────
  {
    id: 'wkflow-55',
    slug: 'five-line-profit-check',
    title: '5-Line Profit Check',
    subtitle: 'Upload your monthly sales and expense data and get a plain-English income statement with AI interpretation — no accounting knowledge required.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 180,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: `You are a business financial advisor for a small business owner who has no accounting background. Analyze the data provided and produce a clean 5-Line Income Statement with a full plain-English interpretation.

## Step 1: Build the 5-Line Model
Calculate and display the following as an HTML table with 3 columns: Line number, Label, and Amount in ₦. The 5 rows are:
1. Total Revenue — sum of all sales/income this period
2. Total Cost of Goods Sold (COGS) — raw materials + direct production costs + transportation to make the sale
3. Gross Profit — Revenue minus COGS
4. Total Operating Expenses — rent + salaries + utilities + all fixed costs
5. Net Profit — Gross Profit minus Operating Expenses

Also show:
- Gross Profit Margin: (Gross Profit ÷ Revenue × 100) as a %
- Net Profit Margin: (Net Profit ÷ Revenue × 100) as a %

## Step 2: Plain-English Interpretation
Write a short paragraph (3–5 sentences) explaining what these numbers mean in simple language. No jargon. Assume the reader has never seen an income statement before.

## Step 3: Flag These Critical Signals
Check for the following and explain each one clearly if found. Use the exact label format shown — these are section headers, not inline text.

**Risk: Staff Theft — Elevated COGS**
If COGS is unusually high relative to revenue (gross margin below 30% for a product business, or a sudden drop vs prior period), flag it: "Your cost of goods is unusually high. This could mean staff are taking stock without recording it, or suppliers are overcharging you."

**Signal: Vendor Price Increase**
If COGS increased month-over-month without a matching revenue increase, flag it: "Your input costs went up but your sales price did not. Check whether your suppliers increased prices recently."

**Opportunity: Pricing Adjustment**
If gross margin is healthy (above 50%) but net profit is thin (below 10%), flag it: "Your product pricing is good but your fixed costs are eating your profit. A price increase of 5–10% would protect your margins."

**Status: Business Health**
If net profit is positive and margins are stable, say this clearly: "Your business is profitable. Many owners worry because they do not see the numbers clearly — but this report shows you are in a healthy position."

## Step 4: The 3 Most Important Actions This Month
Give exactly 3 numbered, specific actions the owner should take based on these numbers. Be direct. Example: "1. Call your flour supplier — your COGS jumped 18% this month. Ask if they changed their prices."

Keep the entire report readable in under 3 minutes. Write as if you are a trusted advisor, not a consultant writing a report.`,
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },

  // ── Nigeria-specific workflows ──────────────────────────────────────────
  {
    id: 'wkflow-30',
    slug: 'forex-rate-alert',
    title: 'FOREX Rate Alert',
    subtitle: 'Monitors USD/NGN, EUR/NGN, and GBP/NGN rates and alerts you to significant moves.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 60,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['ExchangeRate API', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "You will receive current USD/NGN, EUR/NGN, and GBP/NGN rates with analysis of whether rates have moved significantly, what is driving the movement, and what it means for your business costs, pricing, or FX exposure. Include a recommendation on whether to convert now or wait.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-31',
    slug: 'cash-flow-weekly-snapshot',
    title: 'Cash Flow Weekly Snapshot',
    subtitle: 'Reads your income and expense sheet and delivers a plain-English Naira cash flow summary.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Analyze this cash flow data in Naira (₦). Report: total inflows vs outflows this week, net cash position, the 3 largest expenses, any unusual spikes or drops compared to the previous period, and a runway estimate if current burn rate continues. Flag any upcoming cash gaps. End with 2–3 specific actions to improve cash position.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-32',
    slug: 'invoice-aging-naira',
    title: 'Invoice Aging Monitor (₦)',
    subtitle: 'Flags overdue invoices in Naira and tells you exactly who owes what and for how long.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Analyze this invoice data (amounts in ₦). Categorise all unpaid invoices into: Current (0–30 days), Overdue (31–60 days), Seriously Overdue (61–90 days), Critical (90+ days). For each overdue invoice give: client name, amount owed in ₦, days overdue, and a recommended follow-up action. Calculate total outstanding in ₦. Highlight which clients represent the highest collection risk.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-33',
    slug: 'weekly-sales-vs-target',
    title: 'Weekly Sales vs Target',
    subtitle: 'Compares your actual sales against your weekly targets and explains the gap.',
    category: 'Sales',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Compare actual sales figures against targets in this data. Report: percentage to target this week, which products/services are above vs below target, total revenue in ₦ vs target, the 3 biggest gaps and their likely causes, and whether the business is on track to hit monthly/quarterly targets at current pace. End with 3 specific actions to close the gap this week.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-34',
    slug: 'whatsapp-lead-tracker',
    title: 'WhatsApp Lead Tracker',
    subtitle: 'Reads your WhatsApp leads from Google Sheets and tells you who to follow up with today.',
    category: 'Sales',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Analyze this WhatsApp lead data. Identify: leads that have gone cold (no contact in 7+ days), leads that showed high interest but haven't converted, new leads added this week, and leads ready to close. For each group give a specific follow-up message template in plain English (ready to paste into WhatsApp). Prioritise by highest likelihood to convert. Give a conversion rate summary if data allows.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-35',
    slug: 'customer-reorder-predictor',
    title: 'Customer Reorder Predictor',
    subtitle: 'Analyses your order history to predict who is likely to reorder soon — and who you are about to lose.',
    category: 'Sales',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 150,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Analyze this customer order history. Identify: customers due for a reorder based on their typical purchase frequency, customers whose reorder is overdue (last ordered longer ago than their average cycle), and customers who have not reordered at all in 30+ days. For each group provide: customer name, last order date, typical frequency, reorder probability (High/Medium/Low), and a recommended outreach action. Sort by revenue at risk.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },

  // ── SOP Manual workflows ──────────────────────────────────────────────────
  {
    id: 'wkflow-40',
    slug: 'sop-compliance-bot',
    title: 'SOP Compliance Bot',
    subtitle: 'Monitors task completions, flags deviations, and reminds staff of required steps via Slack or email.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 180,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Review this task completion log against the SOP checklist provided. For each task, identify: which steps were completed vs skipped, any out-of-order execution, time gaps that exceed the SOP threshold, and staff members with repeated deviations. Output a compliance summary with: overall compliance rate (%), a list of violations ranked by severity, specific staff reminders to send, and 2–3 process improvement suggestions based on the deviation patterns.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-41',
    slug: 'onboarding-agent',
    title: 'Onboarding Agent',
    subtitle: "Walks new hires through your SOPs interactively and answers questions based on your company's procedures.",
    category: 'HR/People',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 240,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Docs', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Using the SOP document provided, create a structured onboarding guide for a new team member. Break it down into: Day 1 essentials (must-know rules and processes), Week 1 tasks (step-by-step with clear instructions), key contacts and who to go to for what, and a self-check quiz (5 questions) to confirm understanding. Write in plain, friendly language as if you are walking them through it personally. Highlight any common mistakes new starters make.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-42',
    slug: 'sop-update-notifier',
    title: 'SOP Update Notifier',
    subtitle: 'Detects changes in your procedure documents and pushes a plain-English diff to relevant staff.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Docs', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Compare these two versions of the SOP document (old and new). Identify all changes: added steps, removed steps, modified instructions, changed thresholds or timelines, and updated contact names or roles. For each change explain: what changed, why it likely matters, and which team roles are affected. Output a notification-ready summary in plain English — no jargon — formatted so it can be pasted directly into a Slack message or email. Flag any changes that require immediate action.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },

  // ── Cash & Expenses Log workflows ─────────────────────────────────────────
  {
    id: 'wkflow-43',
    slug: 'expense-tracker-agent',
    title: 'Expense Tracker Agent',
    subtitle: 'Parses receipt descriptions or text, extracts amounts and categories, and logs them to your sheet.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Extract and categorize expense data from this input (receipt text, photo description, or raw list). For each expense identify: vendor/payee name, amount (₦ or original currency), date, and the best-fit category from this list: Inventory, Salaries, Rent, Utilities, Transport, Marketing, Equipment, Maintenance, Miscellaneous. Flag any amounts that seem unusual or duplicated. Output a clean table ready to paste into Google Sheets with a subtotal per category and a grand total.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-44',
    slug: 'daily-cash-reconciliation',
    title: 'Daily Cash Reconciliation Bot',
    subtitle: 'Compares expected vs actual cash at end of day and flags any discrepancies with likely causes.',
    category: 'Finance',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Reconcile this end-of-day cash data. Compare: opening balance + recorded sales − recorded expenses = expected closing balance vs the actual closing balance counted. Calculate the variance (overage or shortage). If there is a discrepancy, suggest the most likely causes (missed expense entry, unrecorded sale, counting error, theft risk). Output a one-page EOD cash report with: opening balance, total sales, total expenses, expected close, actual close, variance, and a status — Balanced / Review Needed / Escalate.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-45',
    slug: 'budget-alert-agent',
    title: 'Budget Alert Agent',
    subtitle: 'Watches your spend by category and sends alerts when any budget threshold is hit or at risk.',
    category: 'Finance',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Analyze this budget vs actual spending data. For each category calculate: amount spent, budget allocated, percentage used, and projected month-end spend at current pace. Flag categories that are: over budget (red), above 80% with weeks remaining (amber), or on track (green). Output a traffic-light budget dashboard. For any over-budget category, give a specific recommendation to reduce spend. End with a single-line executive summary of overall budget health.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },

  // ── Inventory Sheet workflows ─────────────────────────────────────────────
  {
    id: 'wkflow-46',
    slug: 'stock-level-monitor',
    title: 'Stock Level Monitor',
    subtitle: 'Polls your inventory sheet and triggers reorder alerts when items fall below minimum thresholds.',
    category: 'Operations',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Review this inventory data. For each item compare current stock level against the reorder point and maximum stock level. Identify: items below reorder point (urgent), items approaching reorder point (within 20% buffer), items with zero stock, and overstocked items. Output a prioritised reorder list with: item name, current quantity, reorder point, suggested order quantity to reach max stock, and an urgency level (Critical / Soon / Monitor). Include a total estimated reorder cost if unit prices are provided.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-47',
    slug: 'supplier-outreach-bot',
    title: 'Supplier Outreach Bot',
    subtitle: 'Automatically drafts purchase orders for low-stock items and sends them to the right supplier.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 150,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Using this inventory shortage data and supplier contact list, draft professional purchase order messages for each low-stock item. For each PO include: business name and contact, supplier name, a clear itemised list of products needed with quantities and unit prices, requested delivery date (suggest 3–5 business days), and payment terms. Write in a professional but direct tone. Group items by supplier to minimise the number of separate orders. Flag any items where no supplier is listed.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-48',
    slug: 'inventory-audit-agent',
    title: 'Inventory Audit Agent',
    subtitle: 'Schedules periodic stock count reminders and logs variances between system records and physical counts.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 180,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Compare the physical stock count against the system inventory records in this data. For each item calculate: system quantity, counted quantity, variance (over/short), and variance percentage. Flag items with variances above 5%. Group findings by: no variance (accurate), minor variance (1–5%), significant variance (>5%), and missing items (in system but not counted). Identify patterns — are variances concentrated in specific categories or storage locations? Output an audit summary with a shrinkage estimate and 3 recommendations to improve inventory accuracy.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },

  // ── Staff Roles & Accountability workflows ────────────────────────────────
  {
    id: 'wkflow-49',
    slug: 'task-assignment-bot',
    title: 'Task Assignment Bot',
    subtitle: 'Routes incoming tasks and requests to the correct team member based on role rules you define.',
    category: 'HR/People',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Review this list of incoming tasks/requests and the staff roles/responsibilities matrix provided. Assign each task to the most appropriate team member based on: their role, current workload (if data provided), skill match, and priority level. Output an assignment table with: task description, assigned staff member, reason for assignment, priority (High/Medium/Low), and suggested deadline. Flag any tasks that are unassigned due to no suitable owner. Highlight overloaded team members.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-50',
    slug: 'accountability-nudge-agent',
    title: 'Accountability Nudge Agent',
    subtitle: 'Tracks overdue tasks by owner and sends personalised escalation messages before things fall through the cracks.',
    category: 'HR/People',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 90,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Analyze this task list with owners, due dates, and statuses. Identify all overdue or at-risk tasks. For each overdue task owner, draft a professional but firm nudge message that: references the specific task and how many days it is overdue, acknowledges they may have been blocked, asks for a status update or new completion date, and offers help if needed. Keep messages under 80 words each. Group by urgency: Critical (5+ days overdue), Overdue (1–4 days), Due Today. Flag any patterns of repeat lateness.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-51',
    slug: 'shift-handover-bot',
    title: 'Shift Handover Bot',
    subtitle: 'Prompts outgoing staff to log their status at shift end and summarises it clearly for the incoming team.',
    category: 'HR/People',
    difficulty: 'Beginner',
    timeToComplete: 0,
    timeSaved: 60,
    completionCount: 0,
    rating: 5.0,
    isPro: false,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Summarize this shift handover log for the incoming team. Extract and clearly present: tasks completed this shift, tasks still in progress (with status and next action), any issues or incidents that occurred, items that need urgent attention in the next shift, low stock or resource alerts, and any customer or client matters pending. Format as a clean shift briefing — readable in under 2 minutes. Flag anything marked urgent. Include outgoing staff names and shift times.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },

  // ── Crisis & Escalation Plan workflows ────────────────────────────────────
  {
    id: 'wkflow-52',
    slug: 'incident-detection-agent',
    title: 'Incident Detection Agent',
    subtitle: 'Monitors error feeds, customer complaints, and operational logs to classify incidents by severity.',
    category: 'Operations',
    difficulty: 'Advanced',
    timeToComplete: 0,
    timeSaved: 300,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Sheets', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Analyze this log of events, errors, or complaints. Classify each incident by severity: P1 Critical (business stopped or major revenue loss), P2 High (significant impact, workaround exists), P3 Medium (partial disruption), P4 Low (minor issue, no immediate impact). For each P1 or P2 incident provide: a plain-English description of what is happening, estimated business impact, immediate action required, and who should be notified now. Group P3 and P4 into a watch list. Output a live incident dashboard view.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-53',
    slug: 'escalation-router',
    title: 'Escalation Router',
    subtitle: 'Contacts Tier 1 → Tier 2 → Tier 3 automatically with escalation messages and built-in timeout logic.',
    category: 'Operations',
    difficulty: 'Advanced',
    timeToComplete: 0,
    timeSaved: 240,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Claude'],
    beforeYouStart: [],
    expectedOutcome: "Using this incident description and escalation contact list, generate a full escalation communication plan. For each tier produce: the exact message to send (SMS/WhatsApp/email ready), the information the recipient needs to act, the response deadline before escalating to the next tier, and what action is expected from them. Tier 1 message should be direct and concise. Tier 2 should include incident summary and what Tier 1 attempted. Tier 3 should be a full incident brief for decision-maker action. Flag if any contact details are missing.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-54',
    slug: 'post-incident-reporter',
    title: 'Post-Incident Reporter',
    subtitle: 'After an incident is resolved, drafts a structured post-mortem report and logs it automatically.',
    category: 'Operations',
    difficulty: 'Intermediate',
    timeToComplete: 0,
    timeSaved: 180,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Google Docs', 'Claude'],
    beforeYouStart: [],
    expectedOutcome: "Using this incident timeline and resolution notes, write a professional post-incident report. Include: incident summary (what happened, when, and for how long), root cause analysis (the actual underlying cause, not just symptoms), business impact (revenue lost, customers affected, team hours spent), response timeline (what was done and when), what worked well in the response, what did not work, and 5 specific action items to prevent recurrence with clear owners and deadlines. Write for a mixed audience — clear enough for non-technical stakeholders but detailed enough for the ops team.",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  },
  {
    id: 'wkflow-custom',
    slug: 'custom-ai-analysis',
    title: 'Custom AI Analysis',
    subtitle: 'Bring your own dataset and define custom rules for the AI to analyze it.',
    category: 'Operations',
    difficulty: 'Advanced',
    timeToComplete: 0,
    timeSaved: 120,
    completionCount: 0,
    rating: 5.0,
    isPro: true,
    tools: ['Claude'],
    beforeYouStart: [],
    expectedOutcome: "",
    troubleshooting: [],
    steps: [],
    relatedPlaybooks: []
  }
];

export const publicPlaybooks = launchCatalog;
export const allPlaybooks = launchCatalog;
// Exporting mockPlaybooks temporarily to prevent build errors until components are updated
export const mockPlaybooks = launchCatalog;
export const smbPlaybooks = launchCatalog;
export const coworkPlaybooks = launchCatalog;
export const coworkPluginPlaybooks = launchCatalog;
export const designerAIPlaybooks = launchCatalog;
export const ecommercePlaybooks = launchCatalog;
export const launchPlaybooks = launchCatalog;
export const personalBrandPlaybooks = launchCatalog;
export const educationPlaybooks = launchCatalog;
export const leadMagnetPlaybooks = launchCatalog;
export const claudeCrashCoursePlaybooks: Playbook[] = [];

export function getCategoryColor(category: string) {
  const customColors: Record<string, string> = {
    'Finance': '#10B981',
    'Executive': '#8B5CF6',
    'Sales': '#F59E0B',
    'Marketing': '#EC4899',
    'Operations': '#3B82F6',
    'Research': '#6366F1',
    'Legal/Compliance': '#EF4444',
    'Creator': '#F97316',
    'HR/People': '#06B6D4',
  };
  return customColors[category] || '#64748B';
}
export const pricingPlans = [
  {
    name: "Starter",
    description: "For individuals getting started with AI automation",
    features: [
      "3 free workflows (Competitor Intel, Brand Monitor, Industry News)",
      "Scheduled & webhook triggers",
      "Email delivery of insights",
      "Run history & reports",
    ],
    cta: "Get Started Free",
    popular: false,
    monthlyPrice: 0,
    annualPrice: 0,
  },
  {
    name: "Pro",
    description: "For teams that need full business intelligence coverage",
    features: [
      "All 11 workflows unlocked",
      "Memory layer — reports improve over time",
      "Apify-powered LinkedIn & platform data",
      "Priority email support",
      "Unlimited workflow runs",
    ],
    cta: "Upgrade to Pro",
    popular: true,
    monthlyPrice: 9900,
    annualPrice: 7900,
  },
  {
    name: "Custom",
    price: "Custom",
    description: "Custom AI workflow setup for your organization",
    features: [
      "Everything in Pro",
      "Custom workflow development",
      "Dedicated account manager",
      "Private deployment & data handling",
    ],
    cta: "Contact Us",
    popular: false,
    monthlyPrice: 0,
    annualPrice: 0,
  },
];
