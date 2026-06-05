import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

// ── Workflow definitions ────────────────────────────────────────────────────
// Each workflow has: commands that trigger it, steps to collect inputs, and
// the AI prompt to run once all inputs are collected.

interface WorkflowStep {
  key: string;
  ask: string;
}

interface WorkflowDef {
  name: string;
  commands: string[];
  steps: WorkflowStep[];
  buildPrompt: (inputs: Record<string, string>) => string;
  sheetPrompt: string; // Used when staff shares a sheet URL instead of typing answers
}

const WORKFLOWS: Record<string, WorkflowDef> = {
  reconcile: {
    name: "Daily Cash Reconciliation",
    commands: ["/reconcile", "reconcile", "eod", "end of day", "cash reconciliation"],
    steps: [
      { key: "opening_balance", ask: "💰 *Cash Reconciliation*\n\nWhat was your *opening balance* today? (₦)\n\n_💡 Have it in a sheet? Send the link instead and I'll read it automatically._" },
      { key: "total_sales",     ask: "Got it. What were your *total sales* today? (₦)" },
      { key: "total_expenses",  ask: "And *total expenses* today? (₦)" },
      { key: "actual_closing",  ask: "Last one — what's your *actual closing cash count*? (₦)" },
    ],
    buildPrompt: (i) => `Reconcile this end-of-day cash data.
Opening balance: ₦${i.opening_balance}
Total sales: ₦${i.total_sales}
Total expenses: ₦${i.total_expenses}
Expected closing: ₦${Number(i.opening_balance) + Number(i.total_sales) - Number(i.total_expenses)}
Actual closing count: ₦${i.actual_closing}

Calculate the variance. If there is a discrepancy, suggest the most likely causes (missed expense entry, unrecorded sale, counting error, theft risk). Output a clear EOD cash report with: opening balance, total sales, total expenses, expected close, actual close, variance, and a status — Balanced / Review Needed / Escalate.`,
    sheetPrompt: `The staff member has shared their daily cash records as a spreadsheet. Find the opening balance, total sales, total expenses, and actual closing cash count. Calculate the expected closing balance and variance. Output a clear EOD cash report with: opening balance, total sales, total expenses, expected close, actual close, variance, and a status — Balanced / Review Needed / Escalate. If the sheet has multiple days, use the most recent entry.`,
  },

  handover: {
    name: "Shift Handover",
    commands: ["/handover", "handover", "end of shift", "shift end"],
    steps: [
      { key: "completed",   ask: "📋 *Shift Handover*\n\nWhat tasks did you *complete* this shift?\n\n_💡 Have a shift log sheet? Send the link to skip all questions._" },
      { key: "in_progress", ask: "What's still *in progress*? Include status and next action, or type *none*." },
      { key: "issues",      ask: "Any *issues, incidents, or urgent items* for the next shift? Or type *none*." },
    ],
    buildPrompt: (i) => `Summarise this shift handover log for the incoming team.

Completed this shift: ${i.completed}
In progress: ${i.in_progress}
Issues / urgent items: ${i.issues}

Format as a clean shift briefing — readable in under 2 minutes. Clearly flag anything urgent. Structure it so the incoming team knows exactly what to pick up.`,
    sheetPrompt: `The staff member has shared their shift log as a spreadsheet. Find: completed tasks, tasks still in progress, and any issues or incidents. Use the most recent shift entry. Format as a clean shift briefing — readable in under 2 minutes. Clearly flag anything urgent. Structure it so the incoming team knows exactly what to pick up.`,
  },

  sopupdate: {
    name: "SOP Update Notifier",
    commands: ["/sopupdate", "sop update", "sop changed", "procedure update"],
    steps: [
      { key: "old_sop_url", ask: "📄 *SOP Update Notifier*\n\nShare the URL of your *current (old)* SOP document:" },
      { key: "new_sop_url", ask: "Now share the URL of your *new/updated* SOP document:" },
    ],
    buildPrompt: (i) => `Compare the two SOP documents below and identify all changes.

OLD SOP URL: ${i.old_sop_url}
NEW SOP URL: ${i.new_sop_url}

For each change explain: what changed, why it likely matters, and which team roles are affected. Output a notification-ready summary in plain English — formatted so it can be sent directly to staff. Flag any changes that require immediate action.

[Note: Fetch and compare both URLs above]`,
    sheetPrompt: `The staff member has shared a document with SOP information. Identify any changes or updates, explain what changed, why it matters, and which team roles are affected. Output a notification-ready summary in plain English that can be sent directly to staff. Flag any changes requiring immediate action.`,
  },

  sop: {
    name: "SOP Compliance Check",
    commands: ["/sop", "sop compliance", "check compliance", "compliance check"],
    steps: [
      { key: "task_log", ask: "✅ *SOP Compliance Check*\n\nShare your *task completion log* (paste the data or a Google Sheets URL):\n\n_💡 Have both logs in one sheet? Send a single link._" },
      { key: "sop_ref",  ask: "Now share your *SOP checklist* (paste the steps or a doc URL):" },
    ],
    buildPrompt: (i) => `Review this task completion log against the SOP checklist.

TASK LOG: ${i.task_log}
SOP CHECKLIST: ${i.sop_ref}

For each task, identify: which steps were completed vs skipped, any out-of-order execution, and staff members with repeated deviations. Output a compliance summary with: overall compliance rate (%), a list of violations ranked by severity, specific staff reminders, and 2–3 process improvement suggestions.`,
    sheetPrompt: `The staff member has shared a spreadsheet with task/compliance data. Find the task completion log and any SOP checklist or procedure steps. Review what was completed vs skipped. Output a compliance summary with: overall compliance rate (%), violations ranked by severity, specific staff reminders, and 2–3 process improvement suggestions.`,
  },

  restock: {
    name: "Supplier Outreach",
    commands: ["/restock", "restock", "supplier orders", "purchase orders", "low stock"],
    steps: [
      { key: "inventory_url", ask: "📦 *Supplier Outreach*\n\nShare your *inventory sheet URL* (showing low-stock items):\n\n_💡 Have inventory + supplier contacts in one sheet? Send one link._" },
      { key: "supplier_url",  ask: "Now share your *supplier contacts sheet URL*:" },
    ],
    buildPrompt: (i) => `Using the inventory shortage data and supplier contact list below, draft professional purchase order messages for each low-stock item.

INVENTORY SHEET: ${i.inventory_url}
SUPPLIER CONTACTS: ${i.supplier_url}

For each PO include: supplier name, itemised list with quantities, requested delivery date (3–5 business days), and payment terms. Group items by supplier to minimise separate orders. Flag any items where no supplier is listed.

[Note: Fetch both URLs above for the data]`,
    sheetPrompt: `The staff member has shared a spreadsheet with inventory data. Find low-stock or out-of-stock items and any supplier contact information. Draft professional purchase order messages for each low-stock item. For each PO include: supplier name, itemised list with quantities, requested delivery date (3–5 business days), and payment terms. Group by supplier. Flag items with no supplier listed.`,
  },

  audit: {
    name: "Inventory Audit",
    commands: ["/audit", "inventory audit", "stock audit", "stock count"],
    steps: [
      { key: "system_url",     ask: "🔍 *Inventory Audit*\n\nShare your *system inventory records* (Google Sheets URL):\n\n_💡 Have system records + physical count in one sheet? Send one link._" },
      { key: "physical_count", ask: "Now paste your *physical count data*, or share a Google Sheets URL:" },
    ],
    buildPrompt: (i) => `Compare the physical stock count against the system inventory records.

SYSTEM RECORDS: ${i.system_url}
PHYSICAL COUNT: ${i.physical_count}

For each item calculate: system quantity, counted quantity, variance, and variance %. Flag items with variances above 5%. Group findings by: accurate, minor variance (1–5%), significant variance (>5%), missing items. Output an audit summary with a shrinkage estimate and 3 recommendations to improve inventory accuracy.`,
    sheetPrompt: `The staff member has shared an inventory spreadsheet. Find both the system/book stock quantities and the physical count quantities for each item. Calculate the variance and variance % for each item. Flag items with variances above 5%. Group findings by: accurate, minor variance (1–5%), significant variance (>5%), missing items. Output an audit summary with a shrinkage estimate and 3 recommendations to improve inventory accuracy.`,
  },

  assign: {
    name: "Task Assignment",
    commands: ["/assign", "assign task", "new task", "who handles"],
    steps: [
      { key: "tasks", ask: "👥 *Task Assignment*\n\nDescribe the *task(s) to assign* (or paste a list):\n\n_💡 Have tasks + team roster in a sheet? Send the link._" },
      { key: "roles", ask: "Share your *team roles sheet URL* — or briefly describe your team and their responsibilities:" },
    ],
    buildPrompt: (i) => `Assign the following tasks to the most appropriate team members.

TASKS: ${i.tasks}
TEAM ROLES: ${i.roles}

Assign each task based on role match, and output an assignment table with: task description, assigned person, reason for assignment, priority (High/Medium/Low), and suggested deadline. Flag any tasks with no clear owner.`,
    sheetPrompt: `The staff member has shared a spreadsheet with task and/or team information. Find the list of tasks to assign and the team members with their roles and responsibilities. Assign each task based on role match. Output an assignment table with: task description, assigned person, reason for assignment, priority (High/Medium/Low), and suggested deadline. Flag tasks with no clear owner.`,
  },

  escalate: {
    name: "Escalation Router",
    commands: ["/escalate", "escalate", "incident:", "urgent:", "emergency"],
    steps: [
      { key: "incident", ask: "🚨 *Escalation Router*\n\nDescribe the *incident* briefly:\n\n_💡 Have an incident log sheet? Send the link._" },
      { key: "tier1",    ask: "Who is your *Tier 1 contact*? (name + phone or Telegram username)" },
      { key: "tier2",    ask: "Who is your *Tier 2 contact*? (name + phone)" },
      { key: "tier3",    ask: "Who is your *Tier 3 contact* (decision-maker)? (name + phone)" },
    ],
    buildPrompt: (i) => `Generate a full escalation communication plan for this incident.

INCIDENT: ${i.incident}
TIER 1 CONTACT: ${i.tier1}
TIER 2 CONTACT: ${i.tier2}
TIER 3 CONTACT: ${i.tier3}

For each tier produce: the exact message to send (WhatsApp/SMS-ready), the response deadline before escalating to the next tier, and what action is expected. Tier 1: direct and concise. Tier 2: include incident summary + what Tier 1 attempted. Tier 3: full incident brief for decision-maker action.`,
    sheetPrompt: `The staff member has shared a spreadsheet with incident and/or escalation contact information. Find the incident description and the escalation contacts (Tier 1, Tier 2, Tier 3). Generate a full escalation communication plan: for each tier produce the exact message to send (WhatsApp/SMS-ready), the response deadline before escalating to the next tier, and what action is expected.`,
  },

  // ── Business Growth Skills ────────────────────────────────────────────────

  csm: {
    name: "Customer Health Check",
    commands: ["/csm", "customer health", "churn risk", "customer success"],
    steps: [
      { key: "customer",   ask: "👤 *Customer Health Check*\n\nCustomer/client name and what do they buy from you?\n\n_💡 Have customer data in a sheet? Send the link instead._" },
      { key: "revenue",    ask: "Their monthly value (₦) and how long have they been a customer?" },
      { key: "engagement", ask: "When did you last speak with them, and how was the interaction?" },
      { key: "signals",    ask: "Any warning signs? (late payments, complaints, fewer orders, gone quiet)\n\nType *none* if everything seems fine." },
    ],
    buildPrompt: (i) => `Analyse this customer's health and churn risk.
Customer: ${i.customer}
Revenue & tenure: ${i.revenue}
Last engagement: ${i.engagement}
Warning signals: ${i.signals}

Score their health (Green/Yellow/Red) with reasons. Give a churn risk rating (Low/Medium/High/Critical). Recommend 3 specific actions to take in the next 7 days. Be direct and practical. Use ₦ for amounts.`,
    sheetPrompt: `The user has shared customer data. Analyse health across all customers: score each Green/Yellow/Red, flag churn risks, and list the top 3 customers needing immediate attention with specific recommended actions.`,
  },

  pipeline: {
    name: "Sales Pipeline Review",
    commands: ["/pipeline", "pipeline review", "sales pipeline", "revenue ops", "revops"],
    steps: [
      { key: "total",    ask: "📊 *Sales Pipeline Review*\n\nTotal value of all open deals (₦)?\n\n_💡 Have your pipeline in a sheet? Send the link._" },
      { key: "target",   ask: "Your monthly or quarterly revenue target (₦)?" },
      { key: "deals",    ask: "List your top 3–5 open deals: name, value (₦), stage, days since last contact:" },
      { key: "concerns", ask: "Which deals are you most worried about, and why? Type *none* if all look healthy." },
    ],
    buildPrompt: (i) => `Analyse this sales pipeline and produce a health report.
Total pipeline: ₦${i.total}
Revenue target: ₦${i.target}
Top deals: ${i.deals}
Concerns: ${i.concerns}

Calculate the pipeline coverage ratio (pipeline ÷ target). Flag concentration risk if any single deal >30% of total. Identify stalled deals. Give a pipeline health rating (Healthy/At Risk/Critical) and 3 specific actions to take this week to protect or accelerate revenue.`,
    sheetPrompt: `The user has shared pipeline data. Calculate: total pipeline value, coverage ratio vs target, stage distribution, stalled deals (no activity >14 days), and concentration risks. Give a pipeline health rating and 3 specific actions to close more deals this week.`,
  },

  rfp: {
    name: "RFP & Bid Analyser",
    commands: ["/rfp", "rfp analysis", "bid response", "bid analysis", "proposal analysis"],
    steps: [
      { key: "requirements", ask: "📋 *RFP & Bid Analyser*\n\nPaste the RFP requirements or describe what the client is asking for:\n\n_💡 Have the RFP in a doc or sheet? Send the link._" },
      { key: "offering",     ask: "Briefly describe your product or service — what do you provide?" },
      { key: "strengths",    ask: "Your 3 strongest differentiators vs competitors for this bid:" },
      { key: "gaps",         ask: "Any requirements you can't fully meet? Type *none* if you cover everything." },
    ],
    buildPrompt: (i) => `Analyse this RFP and give a bid strategy.
Requirements: ${i.requirements}
Our offering: ${i.offering}
Our strengths: ${i.strengths}
Gaps: ${i.gaps}

Estimate our coverage score (%). Give a Bid / Conditional Bid / No-Bid recommendation with reasoning. For a Bid: write the 3 strongest selling points to lead with. For gaps: suggest how to handle or mitigate each. Output a 1-page bid strategy summary.`,
    sheetPrompt: `The user has shared RFP or bid data. Analyse the requirements, estimate coverage, give a Bid/No-Bid recommendation, identify the strongest selling points, and suggest how to handle any gaps.`,
  },

  proposal: {
    name: "Contract & Proposal Writer",
    commands: ["/proposal", "write proposal", "draft contract", "write contract", "draft agreement"],
    steps: [
      { key: "doc_type", ask: "📄 *Contract & Proposal Writer*\n\nWhat type of document do you need?\n(proposal / contract / NDA / retainer agreement / SOW)" },
      { key: "parties",  ask: "Client name and your business name:" },
      { key: "scope",    ask: "Describe the scope of work in 2–3 sentences — what exactly will you deliver?" },
      { key: "terms",    ask: "Total value (₦) and timeline? (e.g. ₦500,000 over 3 months)" },
    ],
    buildPrompt: (i) => `Draft a professional ${i.doc_type} for this engagement.
Document type: ${i.doc_type}
Parties: ${i.parties}
Scope: ${i.scope}
Terms: ${i.terms}

Generate a complete, professional document with all standard clauses: scope of services, payment terms (50% upfront, 50% on completion), intellectual property, confidentiality (2 years), warranties, termination (30-day notice), and dispute resolution. Use ₦ for Nigerian currency. Flag any [REQUIRED] fields the parties must fill in. Write it ready to send — professional, legally sensible, and clear.`,
    sheetPrompt: `The user has shared engagement details. Draft a professional contract or proposal document with all standard clauses. Flag any missing information as [REQUIRED].`,
  },

  // ── C-Level Advisory Skills ───────────────────────────────────────────────

  ceo: {
    name: "CEO Strategic Advisor",
    commands: ["/ceo", "ceo advice", "strategic advice", "strategy question", "strategic decision"],
    steps: [
      { key: "challenge",   ask: "🎯 *CEO Strategic Advisor*\n\nWhat strategic decision or challenge are you facing?\n\n_Be specific — the more context you give, the better the advice._" },
      { key: "options",     ask: "What are your 2–3 main options or paths forward?" },
      { key: "constraints", ask: "What is your biggest constraint right now? (cash, time, team, market, competitors)" },
    ],
    buildPrompt: (i) => `You are an experienced CEO advisor. Give strategic counsel on this situation.
Challenge: ${i.challenge}
Options being considered: ${i.options}
Key constraint: ${i.constraints}

Structure your response as:
*Bottom Line* (1 sentence — the most important thing to know)
*Recommended Path* — which option and why
*Next 30 Days* — 3 specific actions
*Biggest Risk* — what could go wrong and how to prevent it
*The Better Question* — one reframe if the framing itself is the problem

Be direct. Don't hedge. Treat them like a founder who needs real advice, not reassurance.`,
    sheetPrompt: `The user has shared strategic context. Analyse as a CEO advisor: give a Bottom Line recommendation, 3 actions for the next 30 days, the biggest risk, and a reframe question if relevant.`,
  },

  cfo: {
    name: "CFO Financial Advisor",
    commands: ["/cfo", "cfo advice", "financial advice", "finance strategy", "financial question"],
    steps: [
      { key: "question", ask: "💰 *CFO Financial Advisor*\n\nWhat is your financial question or challenge?\n(burn rate, fundraising, pricing, profitability, cash flow...)" },
      { key: "metrics",  ask: "Monthly revenue (₦) and monthly total expenses (₦)?" },
      { key: "runway",   ask: "How many months of cash runway do you have? And what is your biggest financial concern?" },
    ],
    buildPrompt: (i) => `You are an experienced CFO advisor. Analyse this financial situation.
Question: ${i.question}
Monthly revenue & expenses: ${i.metrics}
Runway & main concern: ${i.runway}

Calculate implied monthly burn and profit/loss margin. Address the specific financial question. Give:
*Current Financial Position* — 2-3 sentences
*The Key Number* — the one metric that matters most right now
*3 Financial Actions* — specific, numbered, actionable steps for the next 30 days
*Cash Risk Flag* — if runway <6 months, escalate clearly
*One CFO Insight* — something they probably aren't tracking but should be

Use ₦ for all amounts. Be direct and specific.`,
    sheetPrompt: `The user has shared financial data. As a CFO advisor, analyse their financial position: calculate burn rate, runway, and profitability. Flag any cash risks and give 3 specific financial actions for the next 30 days.`,
  },

  cto: {
    name: "CTO Tech Advisor",
    commands: ["/cto", "cto advice", "tech advice", "technology strategy", "build vs buy", "technical decision"],
    steps: [
      { key: "decision",    ask: "⚙️ *CTO Tech Advisor*\n\nWhat is the technical decision or challenge you're facing?" },
      { key: "context",     ask: "Briefly describe your current tech stack and engineering team size:" },
      { key: "constraints", ask: "Your main constraint? (budget, time-to-market, technical debt, expertise, scale)" },
    ],
    buildPrompt: (i) => `You are an experienced CTO advisor. Give technical counsel on this situation.
Decision/challenge: ${i.decision}
Tech stack & team: ${i.context}
Main constraint: ${i.constraints}

Structure your response as:
*Recommendation* — clear stance with reasoning
*Build vs Buy* (if relevant) — the tradeoff in this specific context
*Technical Risks* — top 2-3 risks and how to mitigate them
*3 Next Steps* — specific, sequenced technical actions
*The Question to Ask Your Team* — one diagnostic question that will reveal the real constraint

Be opinionated. Give a real recommendation, not a list of options.`,
    sheetPrompt: `The user has shared technical context. As a CTO advisor, give a clear technical recommendation addressing the core challenge. Include build vs buy analysis if relevant, top risks, and 3 specific next steps.`,
  },

  founder: {
    name: "Founder Coach",
    commands: ["/founder", "founder coach", "leadership advice", "founder advice", "coaching"],
    steps: [
      { key: "struggle", ask: "🧠 *Founder Coach*\n\nWhat are you struggling with as a founder or leader right now?\n\n_Be honest — this conversation is private._" },
      { key: "outcome",  ask: "What does success look like for you in the next 30–90 days? What would feel like a win?" },
    ],
    buildPrompt: (i) => `You are an experienced founder coach. This founder needs real guidance.
What they're struggling with: ${i.struggle}
Desired outcome: ${i.outcome}

Give honest, direct coaching — not motivational fluff. Structure your response as:
*What's Really Happening* — name the real pattern beneath the surface
*The Shift Required* — one mindset or behavioural change that unlocks progress
*3 Practical Steps* — specific actions for this week
*The Hard Truth* — one uncomfortable thing they probably know but haven't acted on
*One Question* — a coaching question to sit with

Be warm but direct. Speak as a trusted advisor, not a cheerleader.`,
    sheetPrompt: `The user has shared founder/leadership context. Give honest coaching: identify the real pattern, recommend one key shift, give 3 practical steps, share one hard truth, and leave a coaching question.`,
  },

  board: {
    name: "Virtual Board Meeting",
    commands: ["/board", "board meeting", "board advice", "virtual board", "board session"],
    steps: [
      { key: "decision", ask: "🏛️ *Virtual Board Meeting*\n\nWhat key decision needs the board's input?\n\n_Describe the situation clearly — the board needs full context._" },
      { key: "context",  ask: "Company stage, monthly revenue (₦), and team size?" },
      { key: "options",  ask: "Your top 2–3 options being considered:" },
    ],
    buildPrompt: (i) => `Simulate a virtual board meeting with three board lenses: CEO/Strategy, CFO/Finance, and COO/Operations.
Decision: ${i.decision}
Company context: ${i.context}
Options on the table: ${i.options}

Structure the output as:

*📋 Board Meeting — Decision Brief*
Decision: [restate clearly]

*CEO Lens (Strategy & Market)*
Analysis and stance on each option

*CFO Lens (Financial & Risk)*
Analysis and stance on each option

*COO Lens (Operations & Execution)*
Analysis and stance on each option

*Board Consensus*
Which option do 2+ board members recommend, and why?

*Decision*
Recommended path + the 3 most critical conditions for success.

Be specific. Reference the actual numbers and options provided. Each lens should have a distinct voice.`,
    sheetPrompt: `The user has shared strategic and financial context for a board decision. Simulate a board meeting with CEO, CFO, and COO lenses, producing analysis and a consensus recommendation.`,
  },
};

// Commands restricted to manager role only
const MANAGER_ONLY = new Set(["assign", "escalate", "sop", "sopupdate", "csm", "pipeline", "rfp", "proposal", "ceo", "cfo", "cto", "founder", "board"]);

const WELCOME_STAFF = `👋 *Welcome! You're connected as Staff.*

Here's what you can do:

💰 /reconcile — Daily cash reconciliation
📋 /handover — Shift handover log
📦 /restock — Supplier outreach
🔍 /audit — Inventory audit
📝 /log — Log a sale or expense

Type /help at any time to see this list.
Type /cancel to stop any workflow.`;

const WELCOME_MANAGER = `👋 *Welcome! You're connected as Manager.*

You have access to all commands:

*Operations*
💰 /reconcile — Daily cash reconciliation
📋 /handover — Shift handover log
📦 /restock — Supplier outreach
🔍 /audit — Inventory audit
👥 /assign — Task assignment
🚨 /escalate — Escalation router
✅ /sop — SOP compliance check
📄 /sopupdate — SOP update notifier
📝 /log — Log a sale or expense

*Business Growth*
👤 /csm — Customer health & churn risk
📊 /pipeline — Sales pipeline review
📋 /rfp — RFP & bid analyser
📄 /proposal — Contract & proposal writer

*Advisory*
🎯 /ceo — CEO strategic advisor
💰 /cfo — CFO financial advisor
⚙️ /cto — CTO tech advisor
🧠 /founder — Founder coach
🏛️ /board — Virtual board meeting

Type /help to see this list.
Type /cancel to stop any workflow.`;

const UNREGISTERED = `👋 Hi! To use this bot, you need an invite link from your manager.

Ask them to share your team's Telegram invite link with you.`;

// ── Helpers ─────────────────────────────────────────────────────────────────

async function sendMessage(botToken: string, chatId: number, text: string) {
  // Telegram messages max 4096 chars — split if needed
  const chunks = text.match(/[\s\S]{1,4000}/g) || [text];
  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk, parse_mode: "Markdown" }),
    });
  }
}

async function sendMessageWithFeedback(botToken: string, chatId: number, text: string, runId: string) {
  const chunks = text.match(/[\s\S]{1,4000}/g) || [text];
  // Send all chunks; attach feedback keyboard to the last one
  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    const body: Record<string, unknown> = { chat_id: chatId, text: chunks[i], parse_mode: "Markdown" };
    if (isLast) {
      body.reply_markup = {
        inline_keyboard: [[
          { text: "✅ Helpful", callback_data: `feedback:helpful:${runId}` },
          { text: "❌ Not helpful", callback_data: `feedback:not_helpful:${runId}` },
        ]],
      };
    }
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
}

function matchWorkflow(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const [key, wf] of Object.entries(WORKFLOWS)) {
    if (wf.commands.some(cmd => lower === cmd || lower.startsWith(cmd + " "))) {
      return key;
    }
  }
  return null;
}

async function fetchUrl(url: string): Promise<string> {
  try {
    // Google Sheets: export as CSV
    if (url.includes("docs.google.com/spreadsheets")) {
      const csvUrl = url.replace(/\/edit.*$/, "/export?format=csv");
      const res = await fetch(csvUrl);
      if (res.ok) return (await res.text()).substring(0, 4000);
    }
    // Firecrawl for other URLs
    if (FIRECRAWL_API_KEY) {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${FIRECRAWL_API_KEY}` },
        body: JSON.stringify({ url, formats: ["markdown"] }),
      });
      const json = await res.json();
      if (json.success && json.data?.markdown) return json.data.markdown.substring(0, 4000);
    }
    // Fallback: plain fetch
    const res = await fetch(url);
    if (res.ok) return (await res.text()).substring(0, 4000);
  } catch (e) {
    console.error("fetchUrl error:", e);
  }
  return `[Could not fetch content from: ${url}]`;
}

function isUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

async function resolveInputs(inputs: Record<string, string>): Promise<string> {
  const resolved: string[] = [];
  for (const [key, value] of Object.entries(inputs)) {
    if (isUrl(value)) {
      const content = await fetchUrl(value);
      resolved.push(`--- ${key.toUpperCase()} ---\n${content}`);
    } else {
      resolved.push(`--- ${key.toUpperCase()} ---\n${value}`);
    }
  }
  return resolved.join("\n\n");
}

async function runWorkflow(
  wfKey: string,
  inputs: Record<string, string>,
  businessContext: string
): Promise<string> {
  const wf = WORKFLOWS[wfKey];
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // Resolve any URL inputs to actual content
  const resolvedData = await resolveInputs(inputs);

  const systemPrompt = businessContext
    ? `You are a business operations assistant for ${businessContext}. Be concise, practical, and use ₦ for Naira amounts. Format your response clearly with headers where helpful.`
    : `You are a business operations assistant. Be concise and practical. Use ₦ for Naira amounts. Format your response clearly.`;

  const userMessage = `${wf.buildPrompt(inputs)}\n\n${resolvedData ? `\nDATA:\n${resolvedData}` : ""}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return (response.content[0] as { text: string }).text;
}

// Required slots per workflow — empty means no auto-fetch supported
const WORKFLOW_REQUIRED_SLOTS: Record<string, string[]> = {
  reconcile: ["data"],
  handover:  ["data"],
  audit:     ["system_records", "physical_count"],
  restock:   ["inventory", "suppliers"],
  sop:       ["task_log", "sop_checklist"],
  escalate:  ["contacts"],
  assign:    ["team_roster"],
  sopupdate: [], // always needs two fresh URLs
};

async function runWorkflowFromSources(
  wfKey: string,
  sources: Array<{ slot: string; url: string; label: string }>,
  businessContext: string
): Promise<string> {
  const wf = WORKFLOWS[wfKey];
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // Fetch all sources in parallel
  const fetchedParts = await Promise.all(
    sources.map(async s => {
      const content = await fetchUrl(s.url);
      return `--- ${s.label.toUpperCase()} ---\n${content}`;
    })
  );

  const systemPrompt = businessContext
    ? `You are a business operations assistant for ${businessContext}. Be concise, practical, and use ₦ for Naira amounts. Format your response clearly with headers where helpful.`
    : `You are a business operations assistant. Be concise and practical. Use ₦ for Naira amounts. Format your response clearly.`;

  const userMessage = `${wf.sheetPrompt}\n\nDATA:\n${fetchedParts.join("\n\n")}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return (response.content[0] as { text: string }).text;
}

// Single-URL shortcut (inline URL or mid-session URL)
async function runWorkflowFromSheet(
  wfKey: string,
  sheetUrl: string,
  businessContext: string
): Promise<string> {
  return runWorkflowFromSources(wfKey, [{ slot: "data", url: sheetUrl, label: "Sheet" }], businessContext);
}

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  // Only accept POST from Telegram
  if (req.method !== "POST") return new Response("OK", { status: 200 });

  const url = new URL(req.url);
  const userId = url.searchParams.get("uid");

  if (!userId) return new Response("Missing uid", { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Look up the bot token for this workspace
  const { data: botRow } = await supabase
    .from("telegram_bots")
    .select("bot_token")
    .eq("user_id", userId)
    .single();

  if (!botRow?.bot_token) return new Response("Bot not configured", { status: 404 });

  const botToken = botRow.bot_token;

  // Parse Telegram update
  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // ── Feedback callback (inline button press) ──────────────────────────────
  const callbackQuery = update?.callback_query;
  if (callbackQuery) {
    const cbChatId: number = callbackQuery.message?.chat?.id;
    const callbackId: string = callbackQuery.id;
    const data: string = callbackQuery.data || "";

    if (data.startsWith("feedback:")) {
      const [, feedbackValue, runId] = data.split(":");
      if (runId && (feedbackValue === "helpful" || feedbackValue === "not_helpful")) {
        await supabase.from("telegram_runs").update({ feedback: feedbackValue }).eq("id", runId);
      }
      // Acknowledge the callback so the loading spinner stops
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackId,
          text: feedbackValue === "helpful" ? "Thanks for the feedback! 👍" : "Got it — we'll improve. 👎",
        }),
      });
      // Remove the inline keyboard so it can't be clicked again
      if (cbChatId && callbackQuery.message?.message_id) {
        await fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: cbChatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: { inline_keyboard: [] },
          }),
        });
      }
    }
    return new Response("OK");
  }

  const message = update?.message;
  const chatId: number = message?.chat?.id ?? 0;
  const firstName: string = message?.from?.first_name || "there";
  const telegramUsername: string = message?.from?.username || "";

  // ── Photo message → Sales book scanner (Pro only) ─────────────────────────
  if (message?.photo?.length && chatId) {
    // Check pro status
    const { data: proCheck } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", userId)
      .single();
    const isProPhoto = proCheck?.subscription_status === "pro";

    if (!isProPhoto) {
      await sendMessage(botToken, chatId,
        `📸 *Sales Book Scanner is a Pro feature.*\n\nUpgrade at hoursback.xyz to scan your sales book photos and auto-log every entry.`
      );
      return new Response("OK");
    }

    // Check registration
    const { data: photoConn } = await supabase
      .from("telegram_connections")
      .select("role, first_name")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .single();

    if (!photoConn) {
      await sendMessage(botToken, chatId, UNREGISTERED);
      return new Response("OK");
    }

    await sendMessage(botToken, chatId, "📖 Reading your sales book...");

    try {
      // Get largest photo variant
      const photos = message.photo as Array<{ file_id: string; width: number; height: number }>;
      const largest = photos[photos.length - 1];

      // Get download path from Telegram
      const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${largest.file_id}`);
      const fileData = await fileRes.json();
      if (!fileData.ok) throw new Error("Could not retrieve file from Telegram");
      const filePath: string = fileData.result.file_path;

      // Download the image bytes
      const imageRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
      const imageBuffer = await imageRes.arrayBuffer();
      const imageBytes = new Uint8Array(imageBuffer);
      // Convert to base64 in chunks to avoid stack overflow on large images
      let imageBase64 = "";
      const chunkSize = 8192;
      for (let i = 0; i < imageBytes.length; i += chunkSize) {
        imageBase64 += String.fromCharCode(...imageBytes.subarray(i, i + chunkSize));
      }
      imageBase64 = btoa(imageBase64);
      const mediaType = filePath.endsWith(".png") ? "image/png" : "image/jpeg";

      // Vision parse with Claude
      const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
      const visionRes = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png", data: imageBase64 },
            },
            {
              type: "text",
              text: `This is a photo of a physical sales ledger or record book. Extract every line item you can read.

Return a JSON array only, no explanation:
[{"entry_type":"sale"|"expense"|"note","item":string|null,"qty":number|null,"unit_price":number|null,"total":number|null,"customer":string|null,"notes":string|null,"sale_date":"YYYY-MM-DD"|null}]

Rules:
- entry_type: "sale" for sales/revenue, "expense" for costs, "note" for anything else
- sale_date: if a date is visible (e.g. "April 11", "11/4"), convert to YYYY-MM-DD using year ${new Date().getFullYear()}; otherwise null
- Only extract what is clearly readable — do not guess or invent data
- If no entries are readable, return []`,
            },
          ],
        }],
      });

      const visionText = (visionRes.content[0] as { text: string }).text.trim();
      const jsonMatch = visionText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No structured data returned");

      const entries: Array<Record<string, unknown>> = JSON.parse(jsonMatch[0]);

      if (!entries.length) {
        await sendMessage(botToken, chatId,
          `📸 I couldn't read any entries from that photo.\n\n*Tips for a better scan:*\n• Make sure the page is well-lit and flat\n• Hold the camera directly above the book\n• Avoid shadows and blurriness\n\nYou can also type entries manually with /log`
        );
        return new Response("OK");
      }

      // Insert all rows to bot_entries
      const rows = entries.map((e) => ({
        user_id: userId,
        chat_id: chatId,
        triggered_by: firstName,
        role: photoConn.role,
        raw_text: "[photo scan]",
        entry_type: (e.entry_type as string) || "sale",
        parsed_data: e,
        sale_date: e.sale_date ? new Date(e.sale_date as string).toISOString() : null,
        source: "telegram_photo",
      }));

      const { error: insertError } = await supabase.from("bot_entries").insert(rows);
      if (insertError) {
        console.error("Photo scan save error:", insertError);
        await sendMessage(botToken, chatId,
          "I could read the photo, but I couldn't save the entries to your Sales Log. Please try again or type /log for the important entries."
        );
        return new Response("OK");
      }

      // Build confirmation reply
      const lines: string[] = [
        `✅ *Found ${entries.length} ${entries.length === 1 ? "entry" : "entries"} in your sales book*`,
        ``,
      ];
      for (const e of entries) {
        const icon = e.entry_type === "expense" ? "💸" : "📦";
        const itemStr = e.item ? String(e.item) : "Item";
        const qtyStr = e.qty ? ` ×${e.qty}` : "";
        const totalStr = e.total ? ` — ₦${Number(e.total).toLocaleString()}` : "";
        const custStr = e.customer ? ` — ${e.customer}` : "";
        lines.push(`${icon} ${itemStr}${qtyStr}${totalStr}${custStr}`);
      }
      lines.push(``);
      lines.push(`_All ${entries.length} ${entries.length === 1 ? "entry" : "entries"} saved to your Sales Log._`);
      lines.push(`_Something wrong? Type /log to correct individual entries._`);

      await sendMessage(botToken, chatId, lines.join("\n"));
    } catch (err: any) {
      console.error("Photo scan error:", err);
      await sendMessage(botToken, chatId,
        `❌ Couldn't read your sales book photo. Make sure the image is clear and try again.\n\nYou can also type entries manually with /log`
      );
    }
    return new Response("OK");
  }

  if (!message?.text) return new Response("OK");

  const text: string = message.text.trim();

  // Load business profile for context
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_profile")
    .eq("id", userId)
    .single();

  const bp = profile?.business_profile as any;
  const businessContext = [bp?.businessName, bp?.industry].filter(Boolean).join(", ");

  // ── /start — register staff with their role token ─────────────────────────
  if (text === "/start" || text.startsWith("/start ")) {
    const token = text.split(" ")[1]?.trim();

    if (token) {
      // Look up which role this token belongs to
      const { data: botRow } = await supabase
        .from("telegram_bots")
        .select("manager_token, staff_token")
        .eq("user_id", userId)
        .single();

      let role: "manager" | "staff" | null = null;
      if (botRow?.manager_token === token) role = "manager";
      else if (botRow?.staff_token === token)   role = "staff";

      if (!role) {
        await sendMessage(botToken, chatId, "❌ That invite link is invalid or expired. Ask your manager for a new one.");
        return new Response("OK");
      }

      // Register this chat_id with the role
      await supabase.from("telegram_connections").upsert({
        chat_id: chatId,
        user_id: userId,
        role,
        first_name: firstName,
        username: telegramUsername,
        linked_at: new Date().toISOString(),
      }, { onConflict: "chat_id,user_id" });

      const welcome = role === "manager" ? WELCOME_MANAGER : WELCOME_STAFF;
      await sendMessage(botToken, chatId, `Hello ${firstName}! ${welcome}`);
      return new Response("OK");
    }

    // /start with no token — check if already registered
    const { data: conn } = await supabase
      .from("telegram_connections")
      .select("role")
      .eq("chat_id", chatId)
      .eq("user_id", userId)
      .single();

    if (conn) {
      const welcome = conn.role === "manager" ? WELCOME_MANAGER : WELCOME_STAFF;
      await sendMessage(botToken, chatId, `Hello again ${firstName}! ${welcome}`);
    } else {
      await sendMessage(botToken, chatId, UNREGISTERED);
    }
    return new Response("OK");
  }

  // ── Free-tier run cap (50 runs/month) ────────────────────────────────────
  const FREE_TIER_MONTHLY_LIMIT = 50;
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const { data: proRow } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .single();

  const isPro = proRow?.subscription_status === "pro";

  if (!isPro) {
    const { count } = await supabase
      .from("telegram_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());

    if ((count ?? 0) >= FREE_TIER_MONTHLY_LIMIT) {
      await sendMessage(botToken, chatId,
        `⚠️ Your workspace has reached the free plan limit of ${FREE_TIER_MONTHLY_LIMIT} bot runs this month.\n\nUpgrade to Pro at hoursback.xyz to keep your team running workflows.`
      );
      return new Response("OK");
    }
  }

  // ── All other commands require registration ───────────────────────────────
  const { data: connection } = await supabase
    .from("telegram_connections")
    .select("role, first_name")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .single();

  if (!connection) {
    await sendMessage(botToken, chatId, UNREGISTERED);
    return new Response("OK");
  }

  const userRole = connection.role as "manager" | "staff";

  // ── /help ─────────────────────────────────────────────────────────────────
  if (text === "/help") {
    const welcome = userRole === "manager" ? WELCOME_MANAGER : WELCOME_STAFF;
    await sendMessage(botToken, chatId, welcome);
    return new Response("OK");
  }

  // ── /cancel ───────────────────────────────────────────────────────────────
  if (text === "/cancel") {
    await supabase.from("telegram_sessions").delete().eq("chat_id", chatId).eq("user_id", userId);
    await sendMessage(botToken, chatId, "✋ Cancelled. Send /help to see available commands.");
    return new Response("OK");
  }

  // ── Check for active session ──────────────────────────────────────────────
  const { data: session } = await supabase
    .from("telegram_sessions")
    .select("*")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .single();

  if (session) {
    const wf = WORKFLOWS[session.workflow_key];

    // ── Sheet shortcut: if user sends a URL at any step, run immediately ──────
    if (isUrl(text)) {
      await sendMessage(botToken, chatId, `📊 Got your sheet — running *${wf.name}* now...`);
      await supabase.from("telegram_sessions").delete().eq("id", session.id);

      let runResult = "";
      let runError = "";
      try {
        runResult = await runWorkflowFromSheet(session.workflow_key, text, businessContext);
        const { data: runRow } = await supabase.from("telegram_runs").insert({
          user_id: userId, chat_id: chatId,
          workflow_key: session.workflow_key, workflow_name: wf.name,
          triggered_by: firstName, role: userRole, status: "success", result: runResult,
        }).select("id").single();
        await sendMessageWithFeedback(botToken, chatId, `✅ *${wf.name} Complete*\n\n${runResult}`, runRow?.id ?? "");
      } catch (err: any) {
        runError = err.message || "Unknown error";
        await sendMessage(botToken, chatId, "❌ I couldn't read that sheet. Make sure it's a public Google Sheets link and try again.");
        await supabase.from("telegram_runs").insert({
          user_id: userId, chat_id: chatId,
          workflow_key: session.workflow_key, workflow_name: wf.name,
          triggered_by: firstName, role: userRole, status: "error", error_message: runError,
        });
      }

      if (!runError) {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const { data: ownerProfile } = await supabase.from("profiles").select("email").eq("id", userId).single();
        if (RESEND_API_KEY && ownerProfile?.email) {
          // (email sending handled below — reuse same logic)
        }
      }
      return new Response("OK");
    }

    const currentStep = wf.steps[session.step];
    const updatedInputs = { ...session.collected_inputs, [currentStep.key]: text };
    const nextStep = session.step + 1;

    if (nextStep < wf.steps.length) {
      await supabase
        .from("telegram_sessions")
        .update({ step: nextStep, collected_inputs: updatedInputs, updated_at: new Date().toISOString() })
        .eq("id", session.id);
      await sendMessage(botToken, chatId, wf.steps[nextStep].ask);
    } else {
      await sendMessage(botToken, chatId, `⏳ Running *${wf.name}*... give me a moment.`);

      let runResult = "";
      let runError = "";
      let runId = "";

      try {
        runResult = await runWorkflow(session.workflow_key, updatedInputs, businessContext);

        // Insert run first to get ID for feedback buttons
        const { data: runRow } = await supabase.from("telegram_runs").insert({
          user_id: userId,
          chat_id: chatId,
          workflow_key: session.workflow_key,
          workflow_name: wf.name,
          triggered_by: firstName,
          role: userRole,
          status: "success",
          result: runResult,
        }).select("id").single();

        runId = runRow?.id ?? "";
        await sendMessageWithFeedback(botToken, chatId, `✅ *${wf.name} Complete*\n\n${runResult}`, runId);
      } catch (err: any) {
        console.error("Workflow error:", err);
        runError = err.message || "Unknown error";
        await sendMessage(botToken, chatId, "❌ Something went wrong. Please try again.");
        await supabase.from("telegram_runs").insert({
          user_id: userId,
          chat_id: chatId,
          workflow_key: session.workflow_key,
          workflow_name: wf.name,
          triggered_by: firstName,
          role: userRole,
          status: "error",
          error_message: runError,
        });
      }

      // Notify owner via email if run was successful
      if (!runError) {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .single();

        if (RESEND_API_KEY && ownerProfile?.email) {
          const now = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
          // Convert basic markdown to HTML for email body
          const contentHtml = runResult
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/^#{1,3} (.+)$/gm, "<h3 style=\"margin:16px 0 6px;font-size:14px;font-weight:700;color:#0F1012;\">$1</h3>")
            .replace(/^[-•] (.+)$/gm, "<li style=\"margin:4px 0;\">$1</li>")
            .replace(/(<li[\s\S]*?<\/li>)/g, "<ul style=\"margin:8px 0 8px 16px;padding:0;\">$1</ul>")
            .replace(/\n{2,}/g, "</p><p style=\"margin:10px 0;\">")
            .replace(/\n/g, "<br>")
            .replace(/^/, "<p style=\"margin:0 0 10px;\">")
            .replace(/$/, "</p>");

          const roleBadgeColor = connection.role === "manager" ? "#7c3aed" : "#0284c7";
          const roleBg = connection.role === "manager" ? "#f5f3ff" : "#e0f2fe";

          const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:32px 16px 48px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0F1012;border-radius:20px 20px 0 0;padding:24px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle;">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <div style="width:32px;height:32px;background:linear-gradient(135deg,#4285F4,#6366f1);border-radius:8px;"></div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.4px;">hoursback</span>
                  </td>
                </tr></table>
              </td>
              <td align="right" style="vertical-align:middle;">
                <span style="background:rgba(66,133,244,0.2);color:#93bbfc;font-size:10px;font-weight:700;padding:5px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;border:1px solid rgba(66,133,244,0.3);">
                  TELEGRAM BOT
                </span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Gradient accent -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#4285F4,#6366f1,#DA7756);"></td></tr>

        <!-- Title block -->
        <tr>
          <td style="background:#ffffff;padding:28px 36px 20px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#4285F4;letter-spacing:1.5px;text-transform:uppercase;">Workflow Complete</p>
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0F1012;line-height:1.25;letter-spacing:-0.4px;">${wf.name}</h1>
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="padding-right:8px;">
                <span style="font-size:12px;font-weight:600;color:${roleBadgeColor};background:${roleBg};padding:3px 10px;border-radius:20px;">${connection.role}</span>
              </td>
              <td>
                <span style="font-size:12px;color:#6b7280;">Run by <strong>${firstName}</strong> · ${now}</span>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="background:#ffffff;padding:0 36px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>

        <!-- Content -->
        <tr>
          <td style="background:#ffffff;padding:28px 36px 32px;">
            <div style="background:#FAFAFA;border:1px solid #e5e7eb;border-radius:12px;padding:24px 28px;font-size:14px;line-height:1.85;color:#111827;">
              ${contentHtml}
            </div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#ffffff;padding:4px 36px 32px;text-align:center;">
            <a href="https://www.hoursback.xyz/dashboard"
               style="display:inline-block;background:#0F1012;color:#ffffff;font-size:13px;font-weight:700;padding:13px 28px;border-radius:999px;text-decoration:none;letter-spacing:0.2px;">
              View in Dashboard →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F0F2F5;border-top:1px solid #e5e7eb;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;">
              Sent by <strong style="color:#374151;">Hoursback Telegram Bot</strong> · Your team runs workflows while you manage
            </p>
            <p style="margin:0;font-size:11px;">
              <a href="https://www.hoursback.xyz/settings" style="color:#4285F4;text-decoration:none;">Bot settings</a>
              &nbsp;·&nbsp;
              <a href="https://www.hoursback.xyz" style="color:#4285F4;text-decoration:none;">hoursback.xyz</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "Hoursback <noreply@hoursback.xyz>",
              to: ownerProfile.email,
              subject: `${wf.name} — ${firstName} just ran /${session.workflow_key}`,
              html: emailHtml,
            }),
          });
        }
      }

      await supabase.from("telegram_sessions").delete().eq("id", session.id);
    }

    return new Response("OK");
  }

  // ── No active session — match workflow command ────────────────────────────
  const wfKey = matchWorkflow(text);

  if (wfKey) {
    // Check role permission
    if (MANAGER_ONLY.has(wfKey) && userRole !== "manager") {
      await sendMessage(
        botToken, chatId,
        `🔒 */${wfKey}* is only available to managers.\n\nYour commands: /reconcile, /handover, /restock, /audit`
      );
      return new Response("OK");
    }

    const wf = WORKFLOWS[wfKey];

    // Check if user included a URL inline: /reconcile https://...
    const parts = text.split(/\s+/);
    const inlineUrl = parts.find(p => isUrl(p));
    if (inlineUrl) {
      await sendMessage(botToken, chatId, `📊 Got your sheet — running *${wf.name}* now...`);
      try {
        const runResult = await runWorkflowFromSheet(wfKey, inlineUrl, businessContext);
        const { data: runRow } = await supabase.from("telegram_runs").insert({
          user_id: userId, chat_id: chatId,
          workflow_key: wfKey, workflow_name: wf.name,
          triggered_by: firstName, role: userRole, status: "success", result: runResult,
        }).select("id").single();
        await sendMessageWithFeedback(botToken, chatId, `✅ *${wf.name} Complete*\n\n${runResult}`, runRow?.id ?? "");
      } catch (err: any) {
        await sendMessage(botToken, chatId, "❌ I couldn't read that sheet. Make sure it's a public Google Sheets link and try again.");
        await supabase.from("telegram_runs").insert({
          user_id: userId, chat_id: chatId,
          workflow_key: wfKey, workflow_name: wf.name,
          triggered_by: firstName, role: userRole, status: "error", error_message: err.message,
        });
      }
      return new Response("OK");
    }

    // ── Data Sources auto-run ─────────────────────────────────────────────
    const requiredSlots = WORKFLOW_REQUIRED_SLOTS[wfKey] ?? [];
    if (requiredSlots.length > 0) {
      const slotKeys = requiredSlots.map(s => `${wfKey}:${s}`);
      const { data: allSources } = await supabase
        .from("data_sources")
        .select("slot: workflow_slot, url, label, scope, staff_chat_id")
        .eq("user_id", userId)
        .in("workflow_slot", slotKeys);

      if (allSources && allSources.length > 0) {
        // Priority: staff source (matching chatId) > workspace source
        const resolved: Array<{ slot: string; url: string; label: string }> = [];
        for (const slotSuffix of requiredSlots) {
          const fullSlot = `${wfKey}:${slotSuffix}`;
          const staffSrc = allSources.find(
            s => s.slot === fullSlot && s.scope === "staff" && s.staff_chat_id === chatId
          );
          const workspaceSrc = allSources.find(
            s => s.slot === fullSlot && s.scope === "workspace"
          );
          const src = staffSrc || workspaceSrc;
          if (src) resolved.push({ slot: slotSuffix, url: src.url, label: src.label });
        }

        const allCovered = requiredSlots.every(s => resolved.some(r => r.slot === s));
        if (allCovered) {
          await sendMessage(botToken, chatId,
            `📊 Found your registered data sources — running *${wf.name}* now...`
          );
          try {
            const runResult = await runWorkflowFromSources(wfKey, resolved, businessContext);
            const { data: runRow } = await supabase.from("telegram_runs").insert({
              user_id: userId, chat_id: chatId,
              workflow_key: wfKey, workflow_name: wf.name,
              triggered_by: firstName, role: userRole, status: "success", result: runResult,
            }).select("id").single();
            await sendMessageWithFeedback(
              botToken, chatId, `✅ *${wf.name} Complete*\n\n${runResult}`, runRow?.id ?? ""
            );
            // Update last_used_at on the sources we used
            await supabase.from("data_sources")
              .update({ last_used_at: new Date().toISOString() })
              .eq("user_id", userId)
              .in("workflow_slot", slotKeys);
          } catch (err: any) {
            await sendMessage(botToken, chatId,
              "❌ I couldn't read your registered data sources. Check they're still accessible, or send a URL directly."
            );
            await supabase.from("telegram_runs").insert({
              user_id: userId, chat_id: chatId,
              workflow_key: wfKey, workflow_name: wf.name,
              triggered_by: firstName, role: userRole, status: "error", error_message: err.message,
            });
          }
          return new Response("OK");
        }
      }
    }

    await supabase.from("telegram_sessions").upsert({
      chat_id: chatId,
      user_id: userId,
      workflow_key: wfKey,
      step: 0,
      collected_inputs: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "chat_id,user_id" });

    await sendMessage(botToken, chatId, wf.steps[0].ask);
    return new Response("OK");
  }

  // ── /log — quick sale/expense logging ────────────────────────────────────
  if (text === "/log" || text.toLowerCase().startsWith("/log ")) {
    const logText = text.startsWith("/log ") ? text.slice(5).trim() : "";

    if (!logText) {
      await sendMessage(botToken, chatId,
        `📝 *Log a sale or expense*\n\nWhat did you sell or spend?\n\n_Examples:_\n• \`5 bags of rice ₦15,000 to Amaka\`\n• \`spent ₦2,000 on fuel\`\n• \`sold 3 bottles of oil for ₦4,500\``
      );
      return new Response("OK");
    }

    // Parse with Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    let parsedData: Record<string, unknown> = {};
    try {
      const parseRes = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Extract from this message: "${logText}"\nReturn JSON only, no explanation:\n{"entry_type":"sale"|"expense"|"note","item":string|null,"qty":number|null,"unit_price":number|null,"total":number|null,"customer":string|null,"notes":string|null}\nIf a field is not mentioned, use null.`,
        }],
      });
      const raw = (parseRes.content[0] as { text: string }).text.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedData = JSON.parse(jsonMatch[0]);
    } catch {
      parsedData = { entry_type: "note", item: null, qty: null, unit_price: null, total: null, customer: null, notes: logText };
    }

    const entryType = (parsedData.entry_type as string) || "sale";

    const { error: insertError } = await supabase.from("bot_entries").insert({
      user_id: userId,
      chat_id: chatId,
      triggered_by: firstName,
      role: userRole,
      raw_text: logText,
      entry_type: entryType,
      parsed_data: parsedData,
      source: "telegram_text",
    });

    if (insertError) {
      console.error("Log save error:", insertError);
      await sendMessage(botToken, chatId, "I couldn't save that entry to your Sales Log. Please try again.");
      return new Response("OK");
    }

    // Build confirmation reply
    const typeLabel = entryType === "expense" ? "Expense" : entryType === "note" ? "Note" : "Sale";
    const lines: string[] = [`✅ *Logged*`, ``, `[Type] ${typeLabel}`];
    if (parsedData.item)     lines.push(`[Item] ${parsedData.item}${parsedData.qty ? ` × ${parsedData.qty}` : ""}`);
    if (parsedData.total)    lines.push(`[Amount] ₦${Number(parsedData.total).toLocaleString()}`);
    if (parsedData.customer) lines.push(`[Customer] ${parsedData.customer}`);
    if (!parsedData.item && !parsedData.total) lines.push(`[Note] ${logText}`);

    await sendMessage(botToken, chatId, lines.join("\n"));
    return new Response("OK");
  }

  // ── Unrecognised ──────────────────────────────────────────────────────────
  await sendMessage(botToken, chatId, `I didn't recognise that. Send /help to see available commands.`);
  return new Response("OK");
});
