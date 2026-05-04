import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { launchCatalog, getCategoryColor } from '../data/playbooks';
import { toast } from 'sonner';
import posthog from 'posthog-js';
import { ArrowLeft, ChevronRight, Copy, CheckCheck, ExternalLink, Upload, FileSpreadsheet, Clock, Lock, Bell, Plus, X, ChevronDown, Send, Activity } from 'lucide-react';
import { ProUpgradeButton } from '../components/ProUpgradeButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import * as XLSX from 'xlsx';

interface WorkflowInput {
  label: string;
  placeholder: string;
  type: 'url' | 'text' | 'textarea';
}

interface HubSubsetDefinition {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

interface HubSheetTemplate {
  tab: string;
  purpose: string;
  headers: string[];
  sampleRow: string[];
}

interface WorkbookValidationState {
  status: 'idle' | 'checking' | 'valid' | 'warning' | 'unavailable';
  availableTabs: string[];
  missingTabs: string[];
  message: string;
}

const HUB_WORKFLOW_ID = 'wkflow-hub';

const HUB_SUBSETS: HubSubsetDefinition[] = [
  {
    id: 'internet-renewal-watch',
    title: 'Internet Renewal Watch',
    description: 'Expiring today, tomorrow, and within 7 days, with reminder-ready follow-ups.',
    prompt: `Analyze the "Internet_Customers" sheet.

Identify:
- customers whose Expiry_Date is today
- customers whose Expiry_Date is tomorrow
- customers expiring within the next 7 days
- customers with Balance > 0
- customers whose usage appears to be dropping based on Days_Used_Last_7 vs Days_Used_Last_30

For each customer include:
Full_Name, Phone, Plan_Name, Expiry_Date, Balance, Status, and the recommended next action.

Output sections:
## Priority Follow-Ups
## Expiring Today
## Expiring Tomorrow
## Expiring This Week
## Customers Likely To Lapse
## Reminder Scripts

Reminder scripts should include:
- expiring today
- expiring tomorrow
- already expired`,
  },
  {
    id: 'overdue-balance-recovery',
    title: 'Overdue Balance Recovery',
    description: 'A receptionist chase list across internet renewals and class fees.',
    prompt: `Analyze the "Internet_Customers" and "Class_Enrollments" sheets for unpaid balances.

Group accounts into:
- 1 to 3 days overdue
- 4 to 7 days overdue
- more than 7 days overdue

For each person include:
name, phone, service type, amount owed, relevant date (Expiry_Date or Next_Class_Date), and urgency.

Output sections:
## Collections Priority List
## 1–3 Days Overdue
## 4–7 Days Overdue
## 7+ Days Overdue
## Highest-Value Balances
## Reminder Scripts
## Manager Note

Be specific with names, balances, and dates.`,
  },
  {
    id: 'class-fee-reminder',
    title: 'Class Fee Reminder',
    description: 'Flags students with upcoming classes and unpaid balances.',
    prompt: `Analyze the "Class_Enrollments" sheet for payment follow-up.

Identify:
- students with Next_Class_Date today or tomorrow who still have Balance > 0
- students with Payment_Status marked Partly Paid
- students with both low Attendance_Rate and unpaid balances

For each student include:
Student_Name, Phone, Class_Name, Tutor_Name, Next_Class_Date, Amount_Paid, Balance, Payment_Status, and recommended action.

Output sections:
## Receptionist Follow-Up List
## Students With Class Today
## Students With Class Tomorrow
## Partly Paid Students
## Payment Risk By Class
## Reminder Scripts`,
  },
  {
    id: 'attendance-dropoff-predictor',
    title: 'Attendance Drop-off Predictor',
    description: 'Predicts which students are likely to stop showing up.',
    prompt: `Analyze the "Attendance_Log" and "Class_Enrollments" sheets for attendance risk.

Flag students who:
- missed 2 or more recent sessions
- have low Attendance_Rate
- have not attended recently compared to their Next_Class_Date
- also have unpaid balances

For each at-risk student include:
Student_Name, Class_Name, Attendance_Rate, Last_Attended_Date, Balance, Payment_Status, and risk level: Low, Medium, High.

Output sections:
## At-Risk Students
## Why Each Student Is At Risk
## Retention Actions This Week
## Classes With Highest Drop-Off Risk`,
  },
  {
    id: 'revenue-trend-forecast',
    title: 'Revenue Trend & Forecast',
    description: 'Tracks internet vs classes revenue and predicts the next 7 days.',
    prompt: `Analyze the "Daily_Transactions" sheet.

Calculate:
- total revenue by day
- revenue split by Category
- average daily revenue for the last 7 days
- average daily revenue for the last 30 days if available
- strongest and weakest categories

Then estimate:
- likely revenue for the next 7 days
- whether the trend is up, flat, or down
- the biggest risk to next week's revenue

Output sections:
## Revenue Summary
## Revenue By Category
## Trend Signals
## 7-Day Forecast
## Recommended Actions`,
  },
  {
    id: 'class-demand-capacity-forecast',
    title: 'Class Demand & Capacity Forecast',
    description: 'Shows which classes are filling, weak, or worth promoting.',
    prompt: `Analyze the "Classes_Master" and "Class_Enrollments" sheets.

For each active class calculate:
- Capacity
- Current_Enrollment
- fill rate
- expected fee revenue
- unpaid balance concentration
- attendance weakness if enough context exists

Flag:
- classes above 80% full
- classes below 40% full
- classes with high unpaid balances
- classes with weak attendance and weak enrollment together

Output sections:
## Class-by-Class Demand Summary
## Near Full Classes
## Underfilled Classes
## Revenue Opportunity By Class
## Manager Recommendations`,
  },
  {
    id: 'daily-reception-summary',
    title: 'Daily Reception Summary',
    description: 'A closing brief for front desk activity, receipts, and tomorrow’s follow-ups.',
    prompt: `Produce a daily hub operations summary using the workbook data, especially "Daily_Transactions", "Internet_Customers", and "Class_Enrollments".

Summarize:
- today's total revenue
- revenue from Internet vs Classes
- major expenses logged today
- number of renewals processed
- number of students or customers with unpaid balances
- who must be followed up tomorrow

Output sections:
## Today's Numbers
## Payments And Renewals
## Expenses Logged
## Follow-Ups For Tomorrow
## Closing Note For The Manager`,
  },
  {
    id: 'manager-oversight-brief',
    title: 'Manager Oversight Brief',
    description: 'One high-level operating brief across revenue, renewals, classes, and risk.',
    prompt: `Produce a hub manager briefing using all workbook tabs available.

Cover:
- current revenue picture
- internet renewals and upcoming expiries
- overdue balances and recovery risk
- attendance drop-off signals
- class demand and capacity issues
- near-term revenue outlook

Structure the response exactly as:
## Executive Summary
## Key Findings
## Revenue And Collections
## Student And Class Risks
## What Changed Or Needs Attention
## Recommended Actions

Be specific with names, balances, classes, and dates.`,
  },
];

const HUB_DEFAULT_SUBSETS = [
  'internet-renewal-watch',
  'overdue-balance-recovery',
  'daily-reception-summary',
];

const EXPECTED_HUB_TABS = [
  'Internet_Customers',
  'Class_Enrollments',
  'Attendance_Log',
  'Daily_Transactions',
  'Classes_Master',
];

const HUB_SHEET_TEMPLATES: HubSheetTemplate[] = [
  {
    tab: 'Internet_Customers',
    purpose: 'Renewals, expiry reminders, internet balance follow-up, usage-based churn risk.',
    headers: ['Customer_ID', 'Full_Name', 'Phone', 'Plan_Name', 'Start_Date', 'Expiry_Date', 'Last_Payment_Date', 'Amount_Due', 'Amount_Paid', 'Balance', 'Status', 'Days_Used_Last_7', 'Days_Used_Last_30', 'Notes'],
    sampleRow: ['INT-001', 'John Ade', '08031234567', 'Weekly Pass', '2026-05-01', '2026-05-08', '2026-05-01', '5000', '5000', '0', 'Active', '5', '18', 'Usually renews on time'],
  },
  {
    tab: 'Class_Enrollments',
    purpose: 'Class fee reminders, unpaid balances, per-class student follow-up.',
    headers: ['Enrollment_ID', 'Student_ID', 'Student_Name', 'Phone', 'Class_Name', 'Tutor_Name', 'Fee_Total', 'Amount_Paid', 'Balance', 'Enrollment_Date', 'Next_Class_Date', 'Payment_Status', 'Attendance_Rate', 'Last_Attended_Date', 'Notes'],
    sampleRow: ['ENR-001', 'STD-001', 'Precious Udo', '08034445566', 'Graphics Design', 'Tutor A', '25000', '15000', '10000', '2026-04-20', '2026-05-05', 'Partly Paid', '85', '2026-05-02', 'Promising student'],
  },
  {
    tab: 'Attendance_Log',
    purpose: 'Drop-off prediction and class attendance risk tracking.',
    headers: ['Attendance_ID', 'Session_Date', 'Student_ID', 'Student_Name', 'Class_Name', 'Tutor_Name', 'Present', 'Arrival_Time', 'Session_Status', 'Reason_If_Absent'],
    sampleRow: ['ATT-001', '2026-05-02', 'STD-001', 'Precious Udo', 'Graphics Design', 'Tutor A', 'Yes', '09:05', 'Completed', ''],
  },
  {
    tab: 'Daily_Transactions',
    purpose: 'Revenue trends, daily summary, and short-term forecasting.',
    headers: ['Transaction_ID', 'Date', 'Category', 'Subcategory', 'Customer_or_Student', 'Item_or_Service', 'Qty', 'Unit_Price', 'Total_Amount', 'Payment_Method', 'Handled_By', 'Status', 'Notes'],
    sampleRow: ['TX-001', '2026-05-03', 'Internet', 'Weekly Pass', 'John Ade', 'Weekly Pass', '1', '5000', '5000', 'Cash', 'Receptionist', 'Paid', 'Renewal'],
  },
  {
    tab: 'Classes_Master',
    purpose: 'Capacity planning, weak classes, and demand forecasting.',
    headers: ['Class_ID', 'Class_Name', 'Tutor_Name', 'Capacity', 'Current_Enrollment', 'Start_Time', 'End_Time', 'Days', 'Fee', 'Active_Status', 'Room', 'Notes'],
    sampleRow: ['CLS-001', 'Graphics Design', 'Tutor A', '20', '14', '09:00', '11:00', 'Mon/Wed/Fri', '25000', 'Active', 'Room 1', 'Steady demand'],
  },
];

function getSheetColumnLabel(index: number): string {
  let value = index + 1;
  let label = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }

  return label;
}

function getWorkflowDisplayName(name: string): string {
  return name.replace(/^Hub:\s*/, '');
}

function buildWorkbookValidation(sheetNames: string[]): WorkbookValidationState {
  const availableTabs = sheetNames.filter(Boolean);
  const missingTabs = EXPECTED_HUB_TABS.filter(tab => !availableTabs.includes(tab));

  if (availableTabs.length === 0) {
    return {
      status: 'unavailable',
      availableTabs,
      missingTabs: EXPECTED_HUB_TABS,
      message: 'We could not inspect the workbook tabs automatically.',
    };
  }

  if (missingTabs.length > 0) {
    return {
      status: 'warning',
      availableTabs,
      missingTabs,
      message: `Missing expected tabs: ${missingTabs.join(', ')}`,
    };
  }

  return {
    status: 'valid',
    availableTabs,
    missingTabs: [],
    message: 'Workbook tabs look good.',
  };
}

function normalizeWorkbookExportUrl(url: string): string {
  let exportUrl = url.trim();
  if (exportUrl.includes('/edit')) {
    exportUrl = exportUrl.replace(/\/edit.*$/, '/export?format=xlsx');
  } else if (!exportUrl.includes('/export?format=xlsx')) {
    exportUrl = exportUrl.replace(/\?.*$/, '');
    exportUrl = `${exportUrl}/export?format=xlsx`;
  }
  return exportUrl;
}

const workflowDescriptions: Record<string, string> = {
  'wkflow-1': 'Every week, Hoursback reads your Google Sheets dashboard, synthesises sales, finance, and operations metrics, and delivers a plain-English executive briefing to your inbox — so you start the week with a full picture of business health without opening a single spreadsheet.',
  'wkflow-2': 'Connects to your CRM data and reviews every open deal each week. Flags stalled opportunities, tracks probability changes, and surfaces at-risk deals so your sales team can act before revenue slips through the cracks.',
  'wkflow-3': 'Scans your accounting data for invoices past 30, 60, or 90 days overdue. Delivers a prioritised list of late payments with suggested follow-up actions — so you never lose track of money owed to you.',
  'wkflow-4': 'Reads your P&L from QuickBooks, Xero, or Google Sheets and produces a narrative monthly summary — comparing revenue, expenses, and margins to the previous month in plain English, so you always know your financial position.',
  'wkflow-5': 'Watches your competitors\' websites for changes — pricing updates, new product launches, or messaging shifts. Sends a weekly digest of what changed and what it might mean for your business, so you\'re never caught off guard.',
  'wkflow-6': 'Monitors your suppliers\' pricing pages and alerts you the moment prices change — giving you time to renegotiate, find alternatives, or adjust your own pricing before it hits your margins.',
  'wkflow-7': 'Scans news, blogs, and publications in your industry every week and delivers a curated digest of the most important trends — so you\'re always informed without spending hours reading through noise.',
  'wkflow-8': 'Tracks mentions of your brand across news sites, forums, and social platforms. Sends a weekly digest of what people are saying — positive and negative — so you can respond quickly and protect your reputation.',
  'wkflow-9': 'Monitors regulatory bodies and news sources in your jurisdiction for rule changes, new guidelines, or enforcement updates — so you\'re never caught off-guard by compliance requirements that could affect your business.',
  'wkflow-10': 'Watches your supplier product pages for inventory changes, new arrivals, or discontinued items. Keeps you ahead of supply chain disruptions before they affect your stock levels and customer orders.',
  'wkflow-11': 'Tracks key customer companies for news events — funding rounds, leadership changes, expansions, or downturns — so your account managers can reach out at the right moment with the right message to expand the relationship.',
  'wkflow-14': 'Reads your income and expense data from Google Sheets and delivers a weekly cash flow summary — highlighting trends, upcoming cash gaps, and actionable recommendations to keep your business financially healthy.',
  'wkflow-15': 'Monitors your supplier catalog and product pages for stock availability changes. Alerts you when items are low, back in stock, or discontinued — so you can reorder proactively and avoid stockouts.',
  'wkflow-20': 'Scans YouTube and social platforms for trending topics, video formats, and keywords in your niche. Delivers a weekly digest of what\'s gaining traction so you can create content that rides the wave before it peaks.',
  'wkflow-21': 'Analyses your niche\'s trending topics, seasonal patterns, and audience interests, then generates a ready-to-use 7-day content calendar — complete with post ideas, hooks, and optimal formats for each platform.',
  'wkflow-22': 'Crawls your website every week and emails a prioritised SEO report — missing meta tags, thin content, broken links, keyword gaps, and a ranked list of exactly what to fix first to move up in search.',
  'wkflow-23': 'Reads your landing page every week and emails specific conversion improvements — exact copy rewrites, CTA placement fixes, trust signal gaps, and a score for each element so you know what to tackle first.',
  'wkflow-25': 'Searches the web, Reddit, and news sources for mentions of your brand every week. Tells you where you\'re showing up, what people are saying, whether competitors are dominating the conversation, and what to do about it.',
  'wkflow-26': 'Every week, generates a fresh 5-email cold outreach sequence tailored to your target customer — opener, case study, value pitch, objection handler, and breakup email. Ready to paste into your email tool.',
  'wkflow-28': 'Reads your customer activity spreadsheet every week and flags who\'s at risk of churning — with a risk score, the reason why, and a recommended action for each at-risk customer prioritised by revenue.',
  // Nigeria-specific
  'wkflow-30': 'Every run, Hoursback pulls live USD/NGN, EUR/NGN, and GBP/NGN exchange rates, analyses whether they\'ve moved significantly, explains what\'s driving the movement, and tells you whether now is a good time to convert — so you never get caught off guard by a rate swing.',
  'wkflow-31': 'Reads your weekly income and expense data from Google Sheets, calculates your net Naira cash position, flags the biggest cost drivers, and tells you whether your runway is healthy — delivered to your inbox every Monday morning before business starts.',
  'wkflow-32': 'Scans your invoice log every week and categorises overdue balances in Naira — 0–30, 31–60, 61–90, and 90+ days — with a specific follow-up recommendation for each client so you always know who owes you and what to do next.',
  'wkflow-33': 'Compares your actual weekly sales in Naira against your targets, highlights the biggest gaps, names the under-performing products or channels, and tells you exactly what to do this week to close the gap before month end.',
  'wkflow-34': 'Reads your WhatsApp lead log from Google Sheets, groups leads by temperature (hot, warm, cold), and generates ready-to-paste WhatsApp follow-up messages for each group — so no lead gets forgotten and your follow-up is consistent every week.',
  'wkflow-35': 'Analyses your customer order history to predict who is due for a reorder, who is overdue, and who is slipping away — with the likelihood score, last order date, and a specific outreach recommendation for each customer sorted by revenue at risk.',
  // Telegram-only workflows
  'wkflow-40': 'Staff type /sop in Telegram and describe what they\'re about to do — the bot checks it against your SOPs and tells them immediately if they\'re following the correct procedure. No more "I didn\'t know" moments.',
  'wkflow-42': 'When you update a procedure, broadcast the change to your whole team via Telegram instantly. Staff confirm they\'ve read it — so you have a record and no-one can say they weren\'t told.',
  'wkflow-44': 'Staff type /reconcile at end of shift, enter their opening float, cash received, and expenses — the bot calculates the variance and logs the result. Managers get notified of any discrepancy immediately.',
  'wkflow-47': 'Managers type /restock in Telegram and describe what\'s running low — the bot drafts a reorder message to the supplier, including product details and suggested quantity, ready to copy and send.',
  'wkflow-48': 'Managers type /audit to start an inventory check — the bot guides them through each product category step by step, collects counts, and produces a discrepancy report at the end.',
  'wkflow-49': 'Managers type /assign and describe a task — the bot asks who it\'s for, when it\'s due, and any notes. Creates a clear assignment record that both the manager and staff member can refer back to.',
  'wkflow-51': 'Staff type /handover at the end of their shift — the bot asks what was completed, what\'s pending, any issues, and who to follow up with. Structured logs every time, no format to remember.',
  'wkflow-53': 'Staff or managers type /escalate and describe the issue — the bot asks the right questions to assess urgency, then routes it to the right person with a summary. Nothing falls through the cracks.',
  // SOP
  'wkflow-41': 'Turns your SOP or procedures document into a structured onboarding guide for new hires — with Day 1 essentials, Week 1 tasks, key contacts, and a self-check quiz — so every new starter gets the same quality introduction.',
  // Cash & Expenses
  'wkflow-43': 'Reads your pasted receipts or expense notes, categorises each item automatically, and outputs a clean table with subtotals per category and a grand total — ready to paste straight into your accounts sheet.',
  'wkflow-45': 'Reads your budget vs actual spending sheet and generates a traffic-light dashboard — showing which categories are over budget, at risk, or on track — with specific actions to cut overspend this week.',
  // Inventory
  'wkflow-46': 'Reads your inventory sheet, compares stock levels against reorder points, and delivers a prioritised reorder list — flagging critical shortfalls, upcoming risks, and overstocked products — so you never run out unexpectedly.',
  // Staff
  'wkflow-50': 'Reads your task list, spots every overdue item by owner, and writes personalised nudge messages grouped by urgency — so nothing slips through the cracks without a follow-up.',
  // Crisis
  'wkflow-52': 'Reads your pasted error logs, complaints, or operational notes and classifies every incident by severity (P1–P4) — giving you a clear action dashboard with immediate steps for critical issues.',
  'wkflow-54': 'Takes your incident notes and resolution summary and produces a professional post-mortem — with root cause analysis, business impact, response timeline, lessons learned, and 5 prevention actions with clear owners.',
  'wkflow-55': 'Upload your monthly bank statement or sales & expense sheet and get a complete 5-Line Income Statement — Revenue, COGS, Gross Profit, Operating Expenses, Net Profit — with plain-English interpretation and specific flags for theft risk, vendor price hikes, and pricing opportunities.',
  'wkflow-hub': 'Connect one workbook, choose the reports you want, and let Hoursback watch renewals, class fees, attendance risk, and revenue from a single setup.',
  // Business Growth Skills
  'wkflow-71': 'Paste or share your customer list and the bot scores every account — Green, Yellow, or Red — flags your highest churn risks, and gives you specific actions for each at-risk customer before they walk out the door.',
  'wkflow-72': 'Enter your open deals and revenue target — the bot calculates your pipeline coverage ratio, flags stalled and concentrated deals, and tells you exactly what to do this week to protect your number.',
  'wkflow-73': 'Paste the RFP requirements and describe your offering — the bot estimates your coverage score, gives a Bid/No-Bid recommendation, identifies your strongest selling points, and tells you how to handle every gap.',
  'wkflow-74': 'Tell the bot what document you need (contract, proposal, NDA, SOW), the parties, scope, and value — and it generates a complete, professional draft with all standard clauses, ready to send.',
  // C-Level Advisory
  'wkflow-75': 'Describe your strategic challenge and options — the CEO Advisor gives you a Bottom Line recommendation, the 3 most important actions for the next 30 days, the biggest risk to watch, and the question you should really be asking.',
  'wkflow-76': 'Share your revenue, expenses, and runway — the CFO Advisor calculates your financial position, identifies the key metric that matters most right now, flags cash risks, and gives you 3 specific financial actions for the next 30 days.',
  'wkflow-77': 'Describe your technical decision — the CTO Advisor gives you a clear recommendation (not a list of options), a build vs buy analysis if relevant, the top technical risks, and the question to ask your team.',
  'wkflow-78': 'Tell the Founder Coach what you\'re struggling with and what winning looks like — you get honest coaching, the real pattern beneath the surface, one key shift, 3 practical steps, and one hard truth to act on.',
  'wkflow-79': 'Bring your key decision to the virtual board — CEO, CFO, and COO each analyse it independently, then reach a consensus recommendation with the 3 conditions that must be true for success.',
};

const sampleReportLines: Record<string, string[]> = {
  'wkflow-1':  ['Weekly Business Health — 7 Apr 2025', '● Revenue this week: ₦2.4M (+12% vs last week)', '● Top sales rep: Chidi O. — ₦680k', '● Action needed: 3 deals stalled >14 days'],
  'wkflow-2':  ['Pipeline Health Alert — 7 Apr 2025', '● At-risk deals: 4 (₦1.1M combined value)', '● "Abuja Expansion" — no activity in 18 days', '● Recommended: call Nkechi today'],
  'wkflow-5':  ['Competitor Update — 7 Apr 2025', '● Jumia dropped delivery fee on electronics', '● Konga added "Buy Now Pay Later" at checkout', '● Your opportunity: match free delivery threshold'],
  'wkflow-7':  ['Industry Digest — 7 Apr 2025', '● CBN raises MPR to 27.5% — impact on SME lending', '● Top story: Flutterwave launches offline POS product', '● This week\'s must-read: 3 links inside'],
  'wkflow-14': ['Cash Flow Summary — 7 Apr 2025', '● Net cash this week: ₦340k (↑ from ₦180k)', '● Biggest outflow: Rent ₦250k due Friday', '● Runway: ~6 weeks at current burn rate'],
  'wkflow-55': ['5-Line Income Statement — Mar 2025', '● Revenue: ₦4,200,000', '● COGS: ₦1,680,000 → Gross Profit: ₦2,520,000 (60%)', '● Signal: Vendor spike detected — packaging cost +22%'],
  'wkflow-44': ['Cash Reconciliation — Shift: 6 Apr 2025', '● Opening float: ₦50,000', '● Cash received: ₦184,500', '● Variance: ₦0 — No discrepancy found'],
  'wkflow-31': ['Weekly Cash Position — 7 Apr 2025', '● Net Naira cash: ₦1,240,000', '● Biggest cost driver: Salaries (38% of outflows)', '● Runway is healthy — 8 weeks remaining'],
  'wkflow-hub': ['Workflow Bundle — Morning Brief', '● 8 internet users expire in the next 3 days', '● 5 students have balances before tomorrow’s classes', '● Forecast: class revenue flat, internet renewals slightly up this week'],
};

const dataSourceHelp: Record<string, string> = {
  'wkflow-1': 'Share your Google Sheet and set access to "Anyone with link can view".',
  'wkflow-4': 'Export your QuickBooks or Xero P&L to Google Sheets for best results.',
  'wkflow-5': 'One URL per line. Pages must be publicly accessible (no login required).',
  'wkflow-6': 'Add pricing or catalog pages from each supplier — one URL per line.',
  'wkflow-7': 'Be specific — "AI SaaS productivity tools" works better than "tech".',
  'wkflow-8': 'Include common abbreviations or alternate spellings of your brand name.',
  'wkflow-9': 'Include your industry and the regulatory body — e.g. "fintech, SEC, GDPR".',
  'wkflow-10': 'Add product listing pages, not just the homepage of each supplier.',
  'wkflow-11': 'Use exact company names as they appear on LinkedIn.',
  'wkflow-14': 'Set your Google Sheet to "Anyone with link can view" before pasting the URL.',
  'wkflow-15': 'Add the product listing or catalog pages — not the supplier homepage.',
  'wkflow-20': 'Use 2–3 specific keywords — "personal finance tips" works better than "money".',
  'wkflow-21': 'Be specific about your niche — "keto recipes for busy moms" beats "food".',
  'wkflow-22': 'Enter your homepage URL. The audit will crawl the page and check for common SEO issues.',
  'wkflow-23': 'Enter the URL of the landing page you want to improve. Make sure it is publicly accessible.',
  'wkflow-25': 'Enter your brand name exactly as it appears online, including any common variations.',
  'wkflow-26': 'Describe your ideal customer in 2–3 sentences and what problem your product solves for them.',
  'wkflow-28': 'Share a Google Sheet with columns for customer name, last login, plan, and any usage metrics.',
  'wkflow-30': 'No data source needed — Hoursback fetches live exchange rates automatically. Just tell it what to watch for.',
  'wkflow-31': 'Your sheet should have columns for date, description, inflow amount (₦), and outflow amount (₦). Set sharing to "Anyone with link can view".',
  'wkflow-32': 'Your sheet should have columns for client name, invoice number, amount (₦), invoice date, and payment status. "Anyone with link can view" sharing required.',
  'wkflow-33': 'Your sheet should have columns for product/service name, actual sales this week (₦), and target (₦). Add a notes column for context if you have it.',
  'wkflow-34': 'Export your WhatsApp leads to a Google Sheet with columns: name, phone, lead source, last contact date, status (New/Interested/Negotiating/Cold), and any notes.',
  'wkflow-35': 'Your sheet should have columns: customer name, product ordered, order date, and order value (₦). More order history = more accurate predictions.',
  // Telegram-optional workflows
  'wkflow-40': 'Paste both your task log and SOP checklist directly. The more detail you include, the more accurate the compliance check.',
  'wkflow-42': 'Share published Google Docs URLs for both versions. Go to File → Share → Publish to web in each doc.',
  'wkflow-44': 'Enter the exact Naira amounts for each field. The agent will calculate variance and flag discrepancies.',
  'wkflow-47': 'Both sheets need "Anyone with link can view" sharing. Inventory sheet needs: item, qty, reorder point. Supplier sheet needs: item, supplier name, contact.',
  'wkflow-48': 'System records sheet needs: item, quantity. Physical count can be pasted directly as a list or as a sheet URL.',
  'wkflow-49': 'Describe tasks clearly with any deadlines. Team roles can be pasted as a list (Name: Role) or as a Google Sheets URL.',
  'wkflow-51': 'Be specific about in-progress items — include who owns them and the next action needed for handover to work smoothly.',
  'wkflow-53': 'Include real phone numbers or Telegram handles for each contact tier. The more context in the incident description, the better the escalation messages.',
  // SOP
  'wkflow-41': 'Go to File → Share → Publish to web in Google Docs, then paste the published URL here. Or share a Google Sheets URL set to "Anyone with link can view".',
  // Cash & Expenses
  'wkflow-43': 'Paste your receipts or expense list directly — vendor name, amount, and date for each item. No specific format required; the agent will extract and clean the data.',
  'wkflow-45': 'Your sheet needs columns for: category, budgeted amount (₦), and actual spend to date (₦). Set sharing to "Anyone with link can view".',
  // Inventory
  'wkflow-46': 'Your sheet needs columns for: item name, current quantity, reorder point, and max stock level. Add a unit price column to get an estimated reorder cost.',
  // Staff
  'wkflow-50': 'Your sheet needs columns for: task name, assigned to, due date, and status. Add a notes column for context on blocked tasks.',
  // Crisis
  'wkflow-52': 'Paste your error logs, complaints, or incident notes. Include timestamps and short descriptions. The more context you give, the more accurate the severity classification.',
  'wkflow-54': 'Paste a timeline of what happened, when, what was done, and how it was resolved. Include timestamps where possible — more detail means a more specific report.',
  'wkflow-55': 'Download your bank statement as CSV or Excel from your banking app (most Nigerian banks support this). Alternatively, paste your data into Google Sheets with columns: Date, Description, Amount In (₦), Amount Out (₦). Do not include your account number or BVN in the file.',
  'wkflow-hub': 'Use one workbook with tabs named exactly: Internet_Customers, Class_Enrollments, Attendance_Log, Daily_Transactions, and Classes_Master. If you use Google Sheets, set it to "Anyone with link can view".',
};

const workflowInputs: Record<string, WorkflowInput> = {
  'wkflow-1': { label: 'Dashboard or spreadsheet URL', placeholder: 'https://docs.google.com/spreadsheets/...', type: 'url' },
  'wkflow-2': { label: 'CRM or pipeline data URL', placeholder: 'Your Salesforce or HubSpot export URL', type: 'url' },
  'wkflow-3': { label: 'Accounting software export URL', placeholder: 'Your QuickBooks webhook or export URL', type: 'url' },
  'wkflow-4': { label: 'Financial data source URL', placeholder: 'Your QuickBooks, Xero, or spreadsheet URL', type: 'url' },
  'wkflow-5': { label: 'Competitor website URLs to monitor (one per line)', placeholder: 'https://competitor1.com\nhttps://competitor2.com', type: 'textarea' },
  'wkflow-6': { label: 'Pricing page URLs to monitor (one per line)', placeholder: 'https://supplier.com/pricing\nhttps://competitor.com/pricing', type: 'textarea' },
  'wkflow-7': { label: 'Industry or niche keywords', placeholder: 'e.g. SaaS, fintech, climate tech', type: 'text' },
  'wkflow-8': { label: 'Brand or company name to monitor', placeholder: 'e.g. Acme Corp', type: 'text' },
  'wkflow-9': { label: 'Industry and jurisdiction to watch', placeholder: 'e.g. fintech, United States — SEC', type: 'text' },
  'wkflow-10': { label: 'Supplier website URLs to monitor (one per line)', placeholder: 'https://supplier1.com/products\nhttps://supplier2.com/catalog', type: 'textarea' },
  'wkflow-11': { label: 'Customer company names to track (one per line)', placeholder: 'Acme Corp\nBeta Industries\nGamma LLC', type: 'textarea' },
  'wkflow-14': { label: 'Google Sheets URL (your income & expense data)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  'wkflow-15': { label: 'Supplier product page URLs (one per line)', placeholder: 'https://supplier.com/products\nhttps://wholesale.com/catalog', type: 'textarea' },
  'wkflow-20': { label: 'Niche or topic keywords', placeholder: 'e.g. personal finance, home workouts, productivity tips', type: 'text' },
  'wkflow-21': { label: 'Your content niche or topic', placeholder: 'e.g. small business tips, travel on a budget, fitness for beginners', type: 'text' },
  'wkflow-22': { label: 'Your website URL', placeholder: 'https://yourwebsite.com', type: 'url' },
  'wkflow-23': { label: 'Landing page URL to audit', placeholder: 'https://yourwebsite.com/landing-page', type: 'url' },
  'wkflow-25': { label: 'Brand or product name to monitor', placeholder: 'e.g. Hoursback, Acme Corp', type: 'text' },
  'wkflow-26': { label: 'Target customer profile + product description', placeholder: 'e.g. We sell project management software to marketing agencies with 5–20 employees who struggle to track client deliverables.', type: 'textarea' },
  'wkflow-28': { label: 'Customer activity spreadsheet URL', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  'wkflow-30': { label: 'Business context (optional)', placeholder: 'e.g. We import electronics and pay USD suppliers monthly. Alert me if USD/NGN moves more than 2%.', type: 'textarea' },
  'wkflow-31': { label: 'Google Sheets URL (income & expense data)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  'wkflow-32': { label: 'Google Sheets URL (invoice log)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  'wkflow-33': { label: 'Google Sheets URL (sales vs target data)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  'wkflow-34': { label: 'Google Sheets URL (WhatsApp leads log)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  'wkflow-35': { label: 'Google Sheets URL (customer order history)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  // Telegram-optional workflows — also deployable as scheduled email reports
  'wkflow-40': { label: 'Task completion log + SOP checklist', placeholder: 'Paste your task log AND your SOP checklist steps below — separate them clearly.\n\nTASK LOG:\n[paste here]\n\nSOP CHECKLIST:\n[paste steps here]', type: 'textarea' },
  'wkflow-42': { label: 'Old SOP URL + New SOP URL', placeholder: 'OLD SOP URL: https://docs.google.com/...\nNEW SOP URL: https://docs.google.com/...', type: 'textarea' },
  'wkflow-44': { label: 'End-of-day cash data', placeholder: 'Opening balance: ₦\nTotal sales: ₦\nTotal expenses: ₦\nActual closing count: ₦', type: 'textarea' },
  'wkflow-47': { label: 'Inventory sheet URL + Supplier contacts URL', placeholder: 'INVENTORY URL: https://docs.google.com/...\nSUPPLIER CONTACTS URL: https://docs.google.com/...', type: 'textarea' },
  'wkflow-48': { label: 'System records URL + Physical count data', placeholder: 'SYSTEM RECORDS URL: https://docs.google.com/...\nPHYSICAL COUNT: (paste count data or URL)', type: 'textarea' },
  'wkflow-49': { label: 'Task list + Team roles', placeholder: 'TASKS:\n- Task 1\n- Task 2\n\nTEAM ROLES:\n- Amaka: Cashier\n- Tunde: Stockkeeper\n(or paste a Google Sheets URL)', type: 'textarea' },
  'wkflow-51': { label: 'Shift summary', placeholder: 'COMPLETED:\n- [what was done]\n\nIN PROGRESS:\n- [what\'s still ongoing]\n\nISSUES:\n- [any incidents or urgent items]', type: 'textarea' },
  'wkflow-53': { label: 'Incident + Escalation contacts', placeholder: 'INCIDENT: [brief description]\n\nTIER 1: Name — phone/Telegram\nTIER 2: Name — phone\nTIER 3: Name — phone (decision-maker)', type: 'textarea' },
  // SOP
  'wkflow-41': { label: 'SOP or procedures document URL', placeholder: 'https://docs.google.com/document/d/.../pub  (published to web)', type: 'url' },
  // Cash & Expenses
  'wkflow-43': { label: 'Paste your receipts or expense descriptions', placeholder: 'e.g.\nSpar Market — ₦12,500 — 24 Mar\nDHL delivery — ₦8,000 — 25 Mar\nElectricity bill — ₦45,000 — 26 Mar\nFuel — ₦6,200 — 26 Mar', type: 'textarea' },
  'wkflow-45': { label: 'Google Sheets URL (budget vs actual spending)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  // Inventory
  'wkflow-46': { label: 'Google Sheets URL (inventory data)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  // Staff
  'wkflow-50': { label: 'Google Sheets URL (task list with owners)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  // Crisis
  'wkflow-52': { label: 'Paste your logs, errors, or complaints', placeholder: 'e.g.\n[09:42] Payment gateway timeout — 3 customers affected\n[10:15] Broken display fridge reported by staff\n[11:00] 2 complaints about late delivery\n[12:30] Generator alarm triggered', type: 'textarea' },
  'wkflow-54': { label: 'Paste incident timeline and resolution notes', placeholder: 'e.g.\n13:00 — Customer orders stopped processing\n13:15 — IT team alerted\n13:45 — Root cause found: database timeout\n14:30 — Fix deployed, orders resuming\n15:00 — All systems normal\n\nResolution: Increased DB connection pool size.', type: 'textarea' },
  'wkflow-55': { label: 'Upload your bank statement (CSV/Excel) or paste a Google Sheets URL', placeholder: 'https://docs.google.com/spreadsheets/d/...\n\nOr upload your bank statement export. Your sheet needs 4 columns:\nDate | Description | Amount In (₦) | Amount Out (₦)', type: 'url' },
  'wkflow-hub': { label: 'Workbook URL', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  'wkflow-custom': { label: 'Your data (Google Sheets URL, any URL, or upload a file)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  // Business Growth Skills
  'wkflow-71': { label: 'Paste your customer list (one per line or a table)', placeholder: 'Customer: Acme Corp | MRR: ₦250,000 | Last login: 2 weeks ago | Support tickets: 3 | Sponsor: Tunde\nCustomer: Beta Ltd | MRR: ₦80,000 | Last login: yesterday | Tickets: 0 | Sponsor: Amaka\n...', type: 'textarea' },
  'wkflow-72': { label: 'Paste your open deals (one per line or a table)', placeholder: 'Deal: Acme Corp | Stage: Proposal | Value: ₦1.2m | Close date: 30 Apr | Days stale: 14\nDeal: Beta Ltd | Stage: Negotiation | Value: ₦450k | Close date: 15 May | Days stale: 3\n...\nRevenue target this quarter: ₦5m', type: 'textarea' },
  'wkflow-73': { label: 'Paste the RFP requirements and your offering description', placeholder: 'RFP REQUIREMENTS:\n[paste the RFP sections here]\n\nOUR OFFERING:\n[describe your product/service, differentiators, past wins, any gaps vs requirements]', type: 'textarea' },
  'wkflow-74': { label: 'Describe the document you need', placeholder: 'Document type: Service Agreement\nParties: Hoursback Ltd (provider) and Acme Corp (client)\nScope: 6-month SEO retainer — 4 blog posts/month, monthly reporting\nValue: ₦150,000/month\nAny special clauses: IP ownership, 30-day termination notice', type: 'textarea' },
  // C-Level Advisory
  'wkflow-75': { label: 'Describe your strategic challenge', placeholder: 'Context: [your business, stage, team size]\nChallenge: [what you\'re wrestling with]\nOptions on the table: [what you\'re considering]\nWhat\'s at stake: [downside if you get this wrong]', type: 'textarea' },
  'wkflow-76': { label: 'Share your financial snapshot', placeholder: 'Revenue this month: ₦\nRevenue last month: ₦\nTotal expenses: ₦\nCash in bank: ₦\nMonthly burn: ₦\nAR outstanding: ₦\nKey concern: [what keeps you up at night financially]', type: 'textarea' },
  'wkflow-77': { label: 'Describe your technical decision', placeholder: 'Decision: [what you\'re deciding]\nOptions: [what you\'re choosing between]\nTeam size / skills: [relevant context]\nTimeline pressure: [hard deadline or flexible]\nBiggest constraint: [budget / people / time / risk tolerance]', type: 'textarea' },
  'wkflow-78': { label: 'Tell me what you\'re struggling with', placeholder: 'What\'s the challenge: [be honest — this is confidential]\nWhat winning looks like: [your ideal outcome]\nWhat you\'ve already tried: [so we don\'t repeat it]\nWhat you\'re afraid to admit: [optional but powerful]', type: 'textarea' },
  'wkflow-79': { label: 'Describe the key decision for the board', placeholder: 'Decision: [what needs to be decided]\nBackground: [brief context]\nOptions: [what\'s on the table]\nYour current lean: [which way are you leaning and why]\nKey risks: [what could go wrong with each option]', type: 'textarea' },
};

// Workflows delivered via Telegram bot conversation (not the standard deploy pipeline)
const TELEGRAM_WORKFLOWS: Record<string, { command: string; role: 'staff' | 'manager' | 'both'; description: string }> = {
  'wkflow-40': { command: '/sop',       role: 'manager', description: 'Staff describe what they\'re about to do — bot checks it against your SOPs.' },
  'wkflow-42': { command: '/sopupdate', role: 'manager', description: 'Broadcast procedure changes to your team and collect confirmations.' },
  'wkflow-44': { command: '/reconcile', role: 'both',    description: 'Staff enter their float, cash received, and expenses — bot logs variance.' },
  'wkflow-47': { command: '/restock',   role: 'manager', description: 'Describe what\'s low — bot drafts a supplier reorder message.' },
  'wkflow-48': { command: '/audit',     role: 'manager', description: 'Step-by-step inventory count guided by the bot.' },
  'wkflow-49': { command: '/assign',    role: 'manager', description: 'Create a task assignment with owner, deadline, and notes.' },
  'wkflow-51': { command: '/handover',  role: 'both',    description: 'Structured end-of-shift log — completed tasks, pending items, issues.' },
  'wkflow-53': { command: '/escalate',  role: 'both',    description: 'Assess urgency and route issues to the right person.' },
  // Business Growth Skills
  'wkflow-71': { command: '/csm',      role: 'manager', description: 'Score customer health, flag churn risks, and get specific retention actions.' },
  'wkflow-72': { command: '/pipeline', role: 'manager', description: 'Pipeline coverage ratio, stalled deals, and what to do this week.' },
  'wkflow-73': { command: '/rfp',      role: 'manager', description: 'Coverage score, Bid/No-Bid recommendation, and gap handling strategy.' },
  'wkflow-74': { command: '/proposal', role: 'manager', description: 'Generate a complete contract, proposal, or NDA in minutes.' },
  // C-Level Advisory
  'wkflow-75': { command: '/ceo',     role: 'manager', description: 'Strategic challenge → Bottom Line recommendation + 30-day action plan.' },
  'wkflow-76': { command: '/cfo',     role: 'manager', description: 'Financial challenge → position, key metric, cash risk, 3 actions.' },
  'wkflow-77': { command: '/cto',     role: 'manager', description: 'Technical decision → clear recommendation, risks, and next steps.' },
  'wkflow-78': { command: '/founder', role: 'manager', description: 'Founder struggle → real pattern, key shift, 3 steps, hard truth.' },
  'wkflow-79': { command: '/board',   role: 'manager', description: 'Board-level decision → CEO, CFO, COO lenses + consensus.' },
};

function detectSourceType(url: string): 'google_sheets' | 'website' | 'api' {
  if (!url) return 'api';
  if (url.includes('docs.google.com/spreadsheets')) return 'google_sheets';
  if (url.startsWith('http')) return 'website';
  return 'api';
}

function getDataSourceConfig(workflowId: string, dataSource: string): Record<string, any> {
  switch (workflowId) {
    case 'wkflow-7': return { type: 'news_search', query: dataSource };
    case 'wkflow-8': return { type: 'brand_monitor', query: dataSource };
    case 'wkflow-9': return { type: 'regulatory_monitor', query: dataSource };
    case 'wkflow-11': return { type: 'linkedin_monitor', query: dataSource };
    case 'wkflow-5':
    case 'wkflow-6':
    case 'wkflow-10':
      return { type: 'website_list', urls: dataSource.split('\n').map(u => u.trim()).filter(Boolean) };
    case 'wkflow-14': return { type: 'google_sheets', url: dataSource };
    case 'wkflow-15': return { type: 'website_list', urls: dataSource.split('\n').map(u => u.trim()).filter(Boolean) };
    case 'wkflow-20': return { type: 'youtube_trends', query: dataSource };
    case 'wkflow-21': return { type: 'brand_monitor', query: dataSource };
    case 'wkflow-22': return { type: 'website', url: dataSource };
    case 'wkflow-23': return { type: 'website', url: dataSource };
    case 'wkflow-25': return { type: 'brand_monitor', query: dataSource };
    case 'wkflow-26': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-28': return { type: 'google_sheets', url: dataSource };
    case 'wkflow-30': return { type: 'forex', context: dataSource, currencies: ['USD', 'EUR', 'GBP'] };
    case 'wkflow-31': return { type: 'google_sheets', url: dataSource };
    case 'wkflow-32': return { type: 'google_sheets', url: dataSource };
    case 'wkflow-33': return { type: 'google_sheets', url: dataSource };
    case 'wkflow-34': return { type: 'google_sheets', url: dataSource };
    case 'wkflow-35': return { type: 'google_sheets', url: dataSource };
    // Telegram-optional workflows
    case 'wkflow-40': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-42': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-44': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-47': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-48': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-49': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-51': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-53': return { type: 'text_prompt', text: dataSource };
    // SOP
    case 'wkflow-41': return { type: 'website', url: dataSource };
    // Cash & Expenses
    case 'wkflow-43': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-45': return { type: 'google_sheets', url: dataSource };
    // Inventory
    case 'wkflow-46': return { type: 'google_sheets', url: dataSource };
    // Staff
    case 'wkflow-50': return { type: 'google_sheets', url: dataSource };
    // Crisis
    case 'wkflow-52': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-54': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-55': return { type: 'google_sheets', url: dataSource };
    // Business Growth Skills + C-Level Advisory
    case 'wkflow-71': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-72': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-73': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-74': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-75': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-76': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-77': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-78': return { type: 'text_prompt', text: dataSource };
    case 'wkflow-79': return { type: 'text_prompt', text: dataSource };
    default:
      return { type: detectSourceType(dataSource), url: dataSource };
  }
}

export default function WorkflowBuilder() {
  const { user } = useAuth();

  const [searchParams] = useSearchParams();

  const preselectedId = searchParams.get('id') ?? '';
  const [step, setStep] = useState(preselectedId ? 2 : 1);
  const [selectedWorkflow, setSelectedWorkflow] = useState(preselectedId);
  const [activeCategory, setActiveCategory] = useState('All');
  const [triggerType, setTriggerType] = useState('schedule');
  const [schedule, setSchedule] = useState('weekly');
  const [runTime, setRunTime] = useState('08:00');
  const [runDay, setRunDay] = useState('monday');
  const [runMonthDay, setRunMonthDay] = useState(1);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const utcOffset = -new Date().getTimezoneOffset() / 60;
  const [notifyEmail, setNotifyEmail] = useState(user?.email ?? '');
  const [teamEmails, setTeamEmails] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedWebhookUrl, setDeployedWebhookUrl] = useState('');
  const [deployedWorkflowTitle, setDeployedWorkflowTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [telegramDeployId, setTelegramDeployId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [hubSubsets, setHubSubsets] = useState<string[]>(HUB_DEFAULT_SUBSETS);
  const [deployedWorkflowNames, setDeployedWorkflowNames] = useState<string[]>([]);
  const [selectedHubSheetTab, setSelectedHubSheetTab] = useState(HUB_SHEET_TEMPLATES[0].tab);
  const [workbookValidation, setWorkbookValidation] = useState<WorkbookValidationState>({
    status: 'idle',
    availableTabs: [],
    missingTabs: [],
    message: '',
  });
  const { isPro: hasPro, refreshPro } = useAuth();
  useEffect(() => { refreshPro(); }, [refreshPro]);
  const [dataSourceMode, setDataSourceMode] = useState<'url' | 'excel'>('url');
  const [xlsxPath, setXlsxPath] = useState('');
  const [xlsxFileName, setXlsxFileName] = useState('');
  const [xlsxUploading, setXlsxUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoveredWorkflow, setHoveredWorkflow] = useState<string>('');

  // Decision triggers
  type Alert = { metric: string; condition: 'drops_by' | 'rises_by' | 'exceeds' | 'falls_below'; value: string };
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const addAlert = () => setAlerts(a => [...a, { metric: '', condition: 'drops_by', value: '' }]);
  const removeAlert = (i: number) => setAlerts(a => a.filter((_, idx) => idx !== i));
  const updateAlert = (i: number, field: keyof Alert, val: string) =>
    setAlerts(a => a.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const workflow = launchCatalog.find(p => p.id === selectedWorkflow);
  const inputConfig = workflow ? workflowInputs[workflow.id] : null;
  const isHubWorkflow = selectedWorkflow === HUB_WORKFLOW_ID;
  const selectedHubSubsetDefs = HUB_SUBSETS.filter(subset => hubSubsets.includes(subset.id));
  const activeHubSheetTemplate = HUB_SHEET_TEMPLATES.find(template => template.tab === selectedHubSheetTab) ?? HUB_SHEET_TEMPLATES[0];

  useEffect(() => {
    if (selectedWorkflow === HUB_WORKFLOW_ID) {
      setTriggerType('schedule');
      if (hubSubsets.length === 0) {
        setHubSubsets(HUB_DEFAULT_SUBSETS);
      }
    }
  }, [selectedWorkflow]);

  const toggleHubSubset = (subsetId: string) => {
    setHubSubsets(prev =>
      prev.includes(subsetId)
        ? prev.filter(id => id !== subsetId)
        : [...prev, subsetId]
    );
  };

  const inspectWorkbookTabs = async (source: File | string, mode: 'excel' | 'url') => {
    try {
      setWorkbookValidation({
        status: 'checking',
        availableTabs: [],
        missingTabs: [],
        message: 'Checking workbook tabs…',
      });

      let workbook: XLSX.WorkBook;
      if (mode === 'excel') {
        const buffer = await (source as File).arrayBuffer();
        workbook = XLSX.read(buffer, { type: 'array' });
      } else {
        const exportUrl = normalizeWorkbookExportUrl(source as string);
        const res = await fetch(exportUrl);
        if (!res.ok) throw new Error(`Failed to fetch workbook (${res.status})`);
        const buffer = await res.arrayBuffer();
        workbook = XLSX.read(buffer, { type: 'array' });
      }

      setWorkbookValidation(buildWorkbookValidation(workbook.SheetNames));
    } catch {
      setWorkbookValidation({
        status: 'unavailable',
        availableTabs: [],
        missingTabs: [],
        message: mode === 'url'
          ? 'Could not inspect the public workbook automatically. We will still use it on run if the link is valid.'
          : 'Could not inspect the uploaded workbook automatically.',
      });
    }
  };

  const handleXlsxUpload = async (file: File) => {
    if (!user) return;
    setXlsxUploading(true);
    try {
      if (isHubWorkflow) {
        await inspectWorkbookTabs(file, 'excel');
      }
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('excel-uploads').upload(path, file);
      if (error) throw error;
      setXlsxPath(path);
      setXlsxFileName(file.name);
      toast.success('File uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setXlsxUploading(false);
    }
  };

  useEffect(() => {
    if (!isHubWorkflow || dataSourceMode !== 'url') {
      return;
    }

    const trimmed = dataSource.trim();
    if (!trimmed) {
      setWorkbookValidation({
        status: 'idle',
        availableTabs: [],
        missingTabs: [],
        message: '',
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      inspectWorkbookTabs(trimmed, 'url');
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [isHubWorkflow, dataSourceMode, dataSource]);

  const handleDeploy = async () => {
    if (!user || !workflow) return;
    if (workflow.isPro && !hasPro) {
      toast.error('This workflow requires a Pro subscription.');
      return;
    }
    setIsDeploying(true);
    try {
      if (isHubWorkflow && selectedHubSubsetDefs.length === 0) {
        throw new Error('Choose at least one hub subset to deploy.');
      }
      if (isHubWorkflow && workbookValidation.status === 'warning' && workbookValidation.missingTabs.length > 0) {
        throw new Error(`Fix workbook tabs before deploying. Missing: ${workbookValidation.missingTabs.join(', ')}`);
      }

      const validAlerts = alerts.filter(a => a.metric.trim() && a.value.trim());
      const effectiveTriggerType = isHubWorkflow ? 'schedule' : triggerType;
      const trigger_config = effectiveTriggerType === 'schedule'
        ? { type: 'schedule', schedule, time: runTime, utcOffset, ...(schedule === 'weekly' || schedule === 'biweekly' ? { day: runDay } : {}), ...(schedule === 'monthly' ? { monthDay: runMonthDay } : {}), ...(validAlerts.length ? { alerts: validAlerts } : {}) }
        : { type: 'webhook', ...(validAlerts.length ? { alerts: validAlerts } : {}) };

      const dsConfig = dataSourceMode === 'excel' && xlsxPath
        ? { type: 'excel_file', storage_path: xlsxPath }
        : isHubWorkflow
          ? { type: 'google_sheets_workbook', url: dataSource }
        : getDataSourceConfig(selectedWorkflow, dataSource);

      if (isHubWorkflow) {
        const rows = selectedHubSubsetDefs.map(subset => ({
          user_id: user.id,
          name: `Hub: ${subset.title}`,
          category: 'Workflow Bundle',
          status: 'active',
          is_pro: true,
          trigger_config,
          agent_config: {
            prompt: subset.prompt,
            model: 'claude-sonnet-4-6',
            data_source: dataSourceMode === 'excel' ? xlsxFileName : dataSource,
            hub_bundle: HUB_WORKFLOW_ID,
            hub_subset: subset.id,
          },
          action_config: {
            type: 'email',
            to: notifyEmail || user.email,
            ...(hasPro && teamEmails.trim()
              ? { cc: teamEmails.split(',').map(e => e.trim()).filter(Boolean) }
              : {}),
          },
          data_source_config: dsConfig,
        }));

        const { data: newWorkflows, error } = await supabase
          .from('workflows')
          .insert(rows)
          .select();

        if (error) throw error;

        const deployedNames = newWorkflows?.map(item => item.name) ?? rows.map(item => item.name);
        setDeployedWorkflowNames(deployedNames);
        setDeployedWorkflowTitle(`Workflow Bundle (${deployedNames.length} subsets)`);
        setDeployedWebhookUrl('');
        setStep(4);

        posthog.capture('hub_workflow_deployed', {
          workflow_id: HUB_WORKFLOW_ID,
          workflow_name: workflow.title,
          subset_ids: selectedHubSubsetDefs.map(subset => subset.id),
          subset_count: selectedHubSubsetDefs.length,
          data_source_mode: dataSourceMode,
        });
      } else {
        const { data: newWorkflow, error } = await supabase
          .from('workflows')
          .insert({
            user_id: user.id,
            name: workflow.title,
            category: workflow.category,
            status: 'active',
            is_pro: workflow.isPro ?? false,
            trigger_config,
            agent_config: {
              prompt: workflow.id === 'wkflow-custom' ? customPrompt : workflow.expectedOutcome,
              model: 'claude-sonnet-4-6',
              data_source: dataSourceMode === 'excel' ? xlsxFileName : dataSource,
            },
            action_config: {
              type: 'email',
              to: notifyEmail || user.email,
              ...(hasPro && teamEmails.trim()
                ? { cc: teamEmails.split(',').map(e => e.trim()).filter(Boolean) }
                : {}),
            },
            data_source_config: dsConfig,
          })
          .select()
          .single();

        if (error) throw error;

        posthog.capture('workflow_deployed', {
          workflow_id: selectedWorkflow,
          workflow_name: workflow.title,
          category: workflow.category,
          trigger_type: effectiveTriggerType,
          data_source_mode: dataSourceMode,
          is_pro: workflow.isPro,
        });

        setDeployedWorkflowNames([workflow.title]);
        if (effectiveTriggerType === 'webhook' && newWorkflow) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          setDeployedWebhookUrl(`${supabaseUrl}/functions/v1/webhook-receiver?workflow_id=${newWorkflow.id}&secret=${newWorkflow.webhook_secret}`);
          setDeployedWorkflowTitle(workflow.title);
          setStep(4);
        } else {
          setDeployedWebhookUrl('');
          setDeployedWorkflowTitle(workflow.title);
          setStep(4);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to deploy workflow');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(deployedWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="min-h-screen bg-slate-50 text-brand-dark flex flex-col">
      <nav className="bg-white border-b border-brand-dark/10 px-6 py-4 flex items-center gap-4">
        <Link to="/workflows" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 flex-1 justify-center max-w-2xl mx-auto">
          {[
            { s: 1, label: 'Select AI' },
            { s: 2, label: 'Set Trigger' },
            { s: 3, label: 'Connect Data' }
          ].map((item, i, arr) => (
            <div key={item.s} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 transition-all ${step >= item.s ? 'text-brand-dark' : 'text-slate-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step === item.s ? 'bg-brand-dark text-white shadow-md' : 
                  step > item.s ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {step > item.s ? <CheckCheck className="w-4 h-4" /> : item.s}
                </div>
                <span className={`text-sm tracking-wide hidden md:block ${step === item.s ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="w-8 flex items-center">
                   <div className={`h-[2px] w-full transition-all duration-300 ${step > item.s ? 'bg-gradient-to-r from-green-500 to-brand-dark' : 'bg-slate-200'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="w-9" /> {/* Spacer to balance back button */}
      </nav>

      <div className="container mx-auto max-w-6xl px-6 py-12 flex-1">

        {/* Step 1: Choose workflow */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold mb-2">Choose a workflow</h1>
              <p className="text-slate-600 mb-8">Click any workflow to configure and deploy it automatically.</p>
            </div>

            {/* Custom Workflow Banner */}
            <div className="bg-slate-900 rounded-2xl p-4 text-white mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3 text-center sm:text-left w-full sm:w-auto">
                <div className="hidden sm:flex w-10 h-10 rounded-xl bg-white/10 items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-base leading-snug">Have a custom analysis?</h2>
                  <p className="text-slate-300 text-xs mt-0.5">Bring your own data and write your own rules.</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedWorkflow('wkflow-custom'); setTelegramDeployId(null); setStep(2); }}
                className="w-full sm:w-auto bg-white text-slate-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                Create Custom Workflow
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Featured / Start here */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start here — most popular</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { id: 'wkflow-hub', title: 'Workflow Bundle',        category: 'Operations', color: '#0f766e', free: false, desc: 'One workbook, one oversight layer, multiple reports. Choose renewal reminders, class fee follow-ups, attendance risk, revenue forecasting, and more.' },
                  { id: 'wkflow-55', title: '5-Line Profit Check',     category: 'Finance',   color: '#4285F4', free: true, desc: 'Upload your bank statement or paste your sales & expense sheet. Get a complete 5-Line Income Statement — Revenue, COGS, Gross Profit, Operating Expenses, Net Profit — with plain-English interpretation and flags for theft risk, vendor price hikes, and pricing opportunities you\'re leaving on the table.' },
                  { id: 'wkflow-14', title: 'Weekly Cash Flow Report', category: 'Finance',   color: '#10b981', free: true, desc: 'Reads your Google Sheets income & expense data. Delivers a weekly cash position summary every Monday — so you always know your runway before the week starts.' },
                  { id: 'wkflow-7',  title: 'Industry News Digest',    category: 'Research',  color: '#6366f1', free: true, desc: 'Monitors news in your niche every week and curates the trends you actually need to know — without spending hours reading through noise.' },
                  { id: 'wkflow-5',  title: 'Competitor Monitor',      category: 'Marketing', color: '#f59e0b', free: true, desc: 'Watches competitor websites for price changes, new launches, and messaging shifts. Weekly alert so you\'re never caught off guard.' },
                ].map(wf => (
                    <div
                      key={wf.id}
                      onClick={() => {
                        setSelectedWorkflow(wf.id);
                        setTelegramDeployId(null);
                        if (!wf.free && !hasPro) return;
                        setStep(2);
                      }}
                      onMouseEnter={() => setHoveredWorkflow(wf.id)}
                      className="bg-white border border-slate-200 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-slate-300 group flex flex-col h-full relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: wf.color }} />
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md" style={{ backgroundColor: `${wf.color}15`, color: wf.color }}>{wf.category}</span>
                          <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md border ${wf.free ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                            {wf.free ? 'Free' : 'Pro'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-dark group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="font-bold text-base text-slate-900 leading-snug mb-2 group-hover:text-brand-blue transition-colors">{wf.title}</p>
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{wf.desc}</p>
                    </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">All workflows</p>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
              {['All', 'Finance', 'Sales', 'Marketing', 'Operations', 'HR/People', 'Research', 'Creator', 'Executive', 'Legal/Compliance'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeCategory === cat
                      ? 'bg-brand-dark text-white border-brand-dark'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Split layout: grid on left, sticky detail panel on right */}
            <div className="flex gap-6 items-start">

              {/* Left: workflow grid */}
              <div
                className="flex-1 min-w-0 space-y-4"
                onMouseLeave={() => setHoveredWorkflow('')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {launchCatalog.filter(p => (activeCategory === 'All' || p.category === activeCategory) && p.id !== 'wkflow-custom').map(p => {
                    const locked = p.isPro && !hasPro;
                    const color = getCategoryColor(p.category);
                    const isSelected = selectedWorkflow === p.id;
                    return (
                      <div
                        key={p.id}
                        onMouseEnter={() => setHoveredWorkflow(p.id)}
                        onClick={() => {
                          setSelectedWorkflow(p.id);
                          if (!locked) {
                            if (TELEGRAM_WORKFLOWS[p.id]) {
                              setTelegramDeployId(p.id);
                            } else {
                              setTelegramDeployId(null);
                              setStep(2);
                            }
                          }
                        }}
                        className={`group relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-0.5 ${
                          isSelected && !locked
                            ? TELEGRAM_WORKFLOWS[p.id]
                              ? 'border-sky-400 bg-white shadow-[0_8px_30px_rgb(56,189,248,0.12)] ring-1 ring-sky-400/20'
                              : 'border-brand-dark bg-white shadow-[0_8px_30px_rgb(15,23,42,0.08)] ring-1 ring-brand-dark/10'
                            : locked
                              ? 'border-slate-200 bg-slate-50/50 opacity-80 hover:opacity-100'
                              : TELEGRAM_WORKFLOWS[p.id]
                                ? 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-[0_8px_30px_rgb(56,189,248,0.06)]'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                        }`}
                      >
                        {/* Color accent bar */}
                        <div className="h-1 w-full shrink-0" style={{ backgroundColor: locked ? '#CBD5E1' : color }} />

                        <div className="flex flex-col flex-1 p-5">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md"
                                style={{ backgroundColor: `${locked ? '#64748B' : color}12`, color: locked ? '#64748B' : color }}
                              >
                                {p.category}
                              </span>
                              {p.isPro && (
                                <span className={`flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md ${locked ? 'bg-slate-100 text-slate-500' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                                  {locked && <Lock className="w-2.5 h-2.5" />} Pro
                                </span>
                              )}
                              {TELEGRAM_WORKFLOWS[p.id] && !locked && (
                                <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 border border-sky-100">
                                  <Send className="w-2.5 h-2.5" /> Telegram
                                </span>
                              )}
                            </div>
                            <div className="shrink-0 transition-transform duration-300 group-hover:translate-x-1">
                              {locked
                                ? <Lock className="w-4 h-4 text-slate-300" />
                                : TELEGRAM_WORKFLOWS[p.id]
                                  ? <ChevronRight className="w-4 h-4 text-sky-300 group-hover:text-sky-500" />
                                  : <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-dark" />
                              }
                            </div>
                          </div>
                          <h3 className="font-bold text-[15px] text-slate-900 mb-1.5 leading-snug group-hover:text-brand-blue transition-colors">{p.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 flex-1">
                            {workflowDescriptions[p.id] || p.subtitle}
                          </p>
                          <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            Saves ~{p.timeSaved} min/week
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Upgrade prompt when Pro workflow selected without Pro access */}
                {selectedWorkflow && workflow?.isPro && !hasPro && (
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-purple-900 text-sm">This workflow requires Pro</p>
                      <p className="text-purple-700 text-xs mt-0.5">{workflow.subtitle}</p>
                    </div>
                    <ProUpgradeButton className="shrink-0 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors">
                      Upgrade to Pro
                    </ProUpgradeButton>
                  </div>
                )}

                {/* Telegram deploy Modal */}
                {telegramDeployId && TELEGRAM_WORKFLOWS[telegramDeployId] && (() => {
                  const tg = TELEGRAM_WORKFLOWS[telegramDeployId];
                  const sel = launchCatalog.find(p => p.id === telegramDeployId);
                  return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center shrink-0">
                            <Send className="w-6 h-6 text-sky-600" />
                          </div>
                          <div className="flex-1 pr-4">
                            <p className="font-bold text-slate-900 text-lg leading-snug">{sel?.title} via Telegram</p>
                            <p className="text-slate-500 text-sm mt-1">{tg.description}</p>
                          </div>
                          <button onClick={() => setTelegramDeployId(null)} className="text-slate-400 hover:text-slate-600 shrink-0 p-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-bold text-sky-700 bg-sky-100/50 px-3 py-1.5 rounded-lg border border-sky-100">{tg.command}</span>
                          </div>
                          <div className="text-sm text-slate-600">
                            Available to:{' '}
                            <span className="font-semibold text-slate-900">
                              {tg.role === 'both' ? 'Managers & Staff' : tg.role === 'manager' ? 'Managers only' : 'Staff'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Setup Instructions</p>
                          <ol className="space-y-3 text-sm text-slate-600">
                            <li className="flex items-start gap-3"><span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ring-1 ring-slate-200">1</span><div>Connect your Telegram bot in <a href="/settings" className="underline font-semibold text-slate-900 hover:text-brand-blue">Settings → Telegram</a>.</div></li>
                            <li className="flex items-start gap-3"><span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ring-1 ring-slate-200">2</span><div>Share the {tg.role === 'manager' ? 'Manager' : tg.role === 'staff' ? 'Staff' : 'Manager or Staff'} invite link with your team.</div></li>
                            <li className="flex items-start gap-3"><span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ring-1 ring-slate-200">3</span><div>Anyone on your team can type <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{tg.command}</span> to trigger.</div></li>
                          </ol>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => setTelegramDeployId(null)}
                            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
                          >
                            Close
                          </button>
                          <a
                            href="/settings#telegram"
                            className="flex-1 text-center py-3 bg-brand-dark text-white rounded-xl text-sm font-semibold hover:bg-brand-dark/90 transition-colors shadow-sm"
                          >
                            Go to Settings
                          </a>
                        </div>
                        
                        <div className="text-center">
                          <button
                            onClick={() => { setTelegramDeployId(null); setSelectedWorkflow(telegramDeployId); setStep(2); }}
                            className="text-xs font-medium text-slate-400 hover:text-brand-blue transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-px after:bg-brand-blue/30 after:scale-x-0 outline-none hover:after:scale-x-100 after:transition-transform after:origin-left"
                          >
                            Or schedule this as an email report →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right: sticky detail panel */}
              {(() => {
                const previewId = hoveredWorkflow || selectedWorkflow;
                const previewWf = previewId ? launchCatalog.find(p => p.id === previewId) : null;
                const previewLocked = previewWf ? (previewWf.isPro && !hasPro) : false;
                const previewColor = previewWf ? getCategoryColor(previewWf.category) : '#94a3b8';
                const previewDesc = previewWf ? (workflowDescriptions[previewWf.id] || previewWf.subtitle) : '';
                const previewTip = previewWf ? dataSourceHelp[previewWf.id] : '';
                const isTelegramWf = previewWf ? !!TELEGRAM_WORKFLOWS[previewWf.id] : false;
                return (
                  <div className="hidden lg:flex flex-col w-80 xl:w-96 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                    {previewWf ? (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="h-1.5 w-full" style={{ backgroundColor: previewLocked ? '#CBD5E1' : previewColor }} />
                        <div className="p-5 space-y-4">
                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: `${previewColor}18`, color: previewColor }}
                            >
                              {previewWf.category}
                            </span>
                            {previewWf.isPro && (
                              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${previewLocked ? 'bg-slate-100 text-slate-500' : 'bg-purple-100 text-purple-700'}`}>
                                {previewLocked && <Lock className="w-3 h-3" />} Pro
                              </span>
                            )}
                            {isTelegramWf && !previewLocked && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 border border-sky-200">
                                <Send className="w-2.5 h-2.5" /> Telegram
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h2 className="text-lg font-bold leading-snug">{previewWf.title}</h2>

                          {/* Full description */}
                          <p className="text-sm text-slate-600 leading-relaxed">{previewDesc}</p>

                          {/* What you'll need */}
                          {previewTip && (
                            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">What you'll need to connect</p>
                              <p className="text-xs text-slate-600 leading-relaxed">{previewTip}</p>
                            </div>
                          )}

                          {/* Time saved */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Saves ~{previewWf.timeSaved} min/week</span>
                          </div>

                          {/* CTA */}
                          {previewLocked ? (
                            <ProUpgradeButton className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                              <Lock className="w-4 h-4" /> Upgrade to unlock
                            </ProUpgradeButton>
                          ) : isTelegramWf ? (
                            <button
                              onClick={() => {
                                setSelectedWorkflow(previewWf.id);
                                setTelegramDeployId(previewWf.id);
                              }}
                              className="w-full py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Send className="w-4 h-4" /> Set up on Telegram
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedWorkflow(previewWf.id);
                                setTelegramDeployId(null);
                                setStep(2);
                              }}
                              className="w-full py-2.5 bg-brand-dark text-white rounded-xl text-sm font-semibold hover:bg-brand-dark/90 transition-colors flex items-center justify-center gap-2"
                            >
                              Set up this workflow <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center space-y-2 min-h-[200px]">
                        <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">Hover a workflow</p>
                        <p className="text-xs text-slate-400">to see what it does</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>{/* end split layout */}
          </div>
        )}

        {/* Step 2: Trigger */}
        {step === 2 && workflow && (
          <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300 max-w-2xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold mb-2">Configure trigger</h1>
              <p className="text-slate-600">How should <span className="font-medium">{workflow.title}</span> be triggered?</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
              {isHubWorkflow && (
                <>
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-teal-950 mb-1">Workflow bundle</p>
                    <p className="text-sm text-teal-800 leading-relaxed">
                      Choose the subset reports you want. Hoursback will deploy each selected subset as its own scheduled workflow behind the scenes, all reading from the same workbook.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <label className="block font-semibold">Subset reports</label>
                      <span className="text-xs text-slate-400">{selectedHubSubsetDefs.length} selected</span>
                    </div>
                    <div className="grid gap-3">
                      {HUB_SUBSETS.map(subset => {
                        const checked = hubSubsets.includes(subset.id);
                        return (
                          <button
                            key={subset.id}
                            type="button"
                            onClick={() => toggleHubSubset(subset.id)}
                            className={`text-left rounded-2xl border p-4 transition-all ${
                              checked
                                ? 'border-brand-blue bg-blue-50/40 ring-1 ring-brand-blue/30'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center ${checked ? 'bg-brand-blue border-brand-blue text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                                <CheckCheck className="w-3 h-3" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-brand-dark">{subset.title}</p>
                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{subset.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {!isHubWorkflow && (
                <div>
                  <label className="block font-semibold mb-3">Trigger type</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer ${triggerType === 'schedule' ? 'border-brand-blue bg-blue-50/30 ring-1 ring-brand-blue' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="trigger" value="schedule" checked={triggerType === 'schedule'} onChange={() => setTriggerType('schedule')} className="hidden" />
                      <div className="font-semibold text-center mt-1">Scheduled</div>
                      <div className="text-xs text-center text-slate-500 mt-1">Runs automatically on a timer</div>
                    </label>
                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer ${triggerType === 'webhook' ? 'border-brand-blue bg-blue-50/30 ring-1 ring-brand-blue' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="trigger" value="webhook" checked={triggerType === 'webhook'} onChange={() => setTriggerType('webhook')} className="hidden" />
                      <div className="font-semibold text-center mt-1">Webhook</div>
                      <div className="text-xs text-center text-slate-500 mt-1">Listens for external events</div>
                    </label>
                  </div>
                </div>
              )}

              {(triggerType === 'schedule' || isHubWorkflow) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block font-semibold mb-2">Frequency</label>
                    <select
                      value={schedule}
                      onChange={e => setSchedule(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekdays">Weekdays only (Mon–Fri)</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                      <option value="once">Run once</option>
                    </select>
                  </div>

                  {schedule !== 'hourly' && (
                    <div className="grid grid-cols-2 gap-4">
                      {(schedule === 'weekly' || schedule === 'biweekly') && (
                        <div>
                          <label className="block font-semibold mb-2">{schedule === 'biweekly' ? 'Starting day' : 'Day'}</label>
                          <select
                            value={runDay}
                            onChange={e => setRunDay(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                          >
                            {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => (
                              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {schedule === 'monthly' && (
                        <div>
                          <label className="block font-semibold mb-2">Day of month</label>
                          <select
                            value={runMonthDay}
                            onChange={e => setRunMonthDay(Number(e.target.value))}
                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                          >
                            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28].map(d => (
                              <option key={d} value={d}>{d}{d===1?'st':d===2?'nd':d===3?'rd':'th'} of the month</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {schedule !== 'once' && (
                      <div className={schedule === 'weekly' || schedule === 'biweekly' || schedule === 'monthly' ? '' : 'col-span-2'}>
                        <label className="block font-semibold mb-2">Time</label>
                        <input
                          type="time"
                          value={runTime}
                          onChange={e => setRunTime(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          {userTimezone} (UTC{utcOffset >= 0 ? `+${utcOffset}` : utcOffset})
                        </p>
                      </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {triggerType === 'webhook' && !isHubWorkflow && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm">
                  A unique webhook URL will be generated after deployment. Use it to trigger this workflow from Zapier, Make, or any external service.
                </div>
              )}
            </div>

            {/* Report preview */}
            {(() => {
              const lines = sampleReportLines[selectedWorkflow ?? ''];
              if (!lines) return null;
              return (
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  {/* Email header */}
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center shrink-0">
                      <span className="text-white text-[10px] font-bold">HB</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700">Hoursback <span className="text-slate-400 font-normal">&lt;reports@hoursback.ai&gt;</span></p>
                      <p className="text-[11px] text-slate-400 truncate">📬 {lines[0]}</p>
                    </div>
                    <span className="ml-auto text-[10px] text-slate-300 shrink-0">Preview</span>
                  </div>
                  {/* Body */}
                  <div className="bg-white px-4 py-3 relative">
                    <div className="space-y-1.5">
                      {lines.slice(1).map((line, i) => (
                        <p key={i} className="text-xs text-slate-600 font-mono leading-relaxed">{line}</p>
                      ))}
                      <p className="text-xs text-slate-300 font-mono">● ············ ···· ··· ···· ···</p>
                    </div>
                    {/* Fade overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  </div>
                  <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 text-center">
                    <p className="text-[10px] text-slate-400">This is what you'll receive in your inbox after each run</p>
                  </div>
                </div>
              );
            })()}

            <div className="pt-6 flex justify-between border-t border-slate-200 items-center">
              <button onClick={() => setStep(1)} className="text-slate-500 hover:text-brand-dark px-4 py-2 font-medium">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-brand-dark text-white px-8 py-3 rounded-full font-medium hover:bg-brand-dark/90 transition-colors"
              >
                {isHubWorkflow ? 'Connect Hub Workbook' : 'Connect Data Source'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Data source + notification */}
        {step === 3 && workflow && (
          <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300 max-w-2xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold mb-2">{isHubWorkflow ? 'Connect your hub workbook' : 'Connect your data'}</h1>
              <p className="text-slate-600">{isHubWorkflow ? 'Connect one workbook, confirm the sheet structure, and choose who receives the reports.' : 'Tell the workflow what to watch and where to send results.'}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
              {inputConfig && (
                <div>
                  {selectedWorkflow === 'wkflow-custom' && (
                    <div className="mb-4">
                      <label className="block font-semibold mb-2">Analysis Instructions</label>
                      <textarea
                        value={customPrompt}
                        onChange={e => setCustomPrompt(e.target.value)}
                        placeholder="E.g. Look through my sales sheet and flag any clients ordering 20% less week over week."
                        rows={4}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none resize-none text-sm"
                      />
                      <p className="text-xs text-slate-400 mt-1">Tell Custom AI precisely what analysis to run on your attached data.</p>
                    </div>
                  )}
                  {isHubWorkflow && (
                    <div className="mb-4 p-4 rounded-2xl bg-teal-50 border border-teal-200">
                      <p className="text-sm font-semibold text-teal-950 mb-1">One workbook, multiple child workflows</p>
                      <p className="text-sm text-teal-800 leading-relaxed">
                        If you use Google Sheets, point this to the full workbook. Hoursback will read each tab it finds. If you upload a file instead, use an Excel workbook with separate tabs rather than a single CSV.
                      </p>
                    </div>
                  )}
                  {/* xlsx mode toggle — shown for URL-type inputs */}
                  {(inputConfig.type === 'url' || inputConfig.type === 'text') && (
                    <div className="flex gap-1 mb-3 p-1 bg-slate-100 rounded-xl w-fit">
                      <button
                        onClick={() => setDataSourceMode('url')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dataSourceMode === 'url' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {isHubWorkflow ? 'Workbook URL' : inputConfig.type === 'url' ? 'Google Sheets / URL' : 'Keywords'}
                      </button>
                      <button
                        onClick={() => setDataSourceMode('excel')}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dataSourceMode === 'excel' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Upload Excel / CSV
                      </button>
                    </div>
                  )}

                  {dataSourceMode === 'excel' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleXlsxUpload(f); }}
                      />
                      {xlsxPath ? (
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                          <FileSpreadsheet className="w-5 h-5 text-green-600 shrink-0" />
                          <span className="text-sm font-medium text-green-800 flex-1 truncate">{xlsxFileName}</span>
                          <button
                            onClick={() => { setXlsxPath(''); setXlsxFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="text-xs text-slate-400 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={xlsxUploading}
                          className="w-full p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-brand-blue/40 hover:bg-blue-50/20 transition-all flex flex-col items-center gap-2 text-slate-500 disabled:opacity-50"
                        >
                          <Upload className="w-6 h-6" />
                          <span className="text-sm font-medium">{xlsxUploading ? 'Uploading...' : isHubWorkflow ? 'Click to upload a multi-tab .xlsx workbook' : 'Click to upload .xlsx, .xls, or .csv'}</span>
                          <span className="text-xs text-slate-400">Max 10MB</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold mb-2">{inputConfig.label}</label>
                      {inputConfig.type === 'textarea' ? (
                        <textarea
                          value={dataSource}
                          onChange={e => setDataSource(e.target.value)}
                          placeholder={inputConfig.placeholder}
                          rows={4}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none resize-none text-sm"
                        />
                      ) : (
                        <input
                          type={inputConfig.type}
                          value={dataSource}
                          onChange={e => setDataSource(e.target.value)}
                          placeholder={inputConfig.placeholder}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                        />
                      )}
                      {dataSourceHelp[selectedWorkflow] && (
                        <p className="text-xs text-slate-400 mt-1.5">{dataSourceHelp[selectedWorkflow]}</p>
                      )}
                    </div>
                  )}

                </div>
              )}

              {isHubWorkflow && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Workbook template</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Keep one tab per data type. Row 1 should always be headers, dates should use <span className="font-mono">YYYY-MM-DD</span>, and money should be plain numbers like <span className="font-mono">5000</span>, not formatted currency text.
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {HUB_SHEET_TEMPLATES.map(template => (
                          <button
                            key={template.tab}
                            onClick={() => setSelectedHubSheetTab(template.tab)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                              activeHubSheetTemplate.tab === template.tab
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                            }`}
                          >
                            {template.tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-b border-slate-200 px-4 py-3 bg-white">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-brand-dark">{activeHubSheetTemplate.tab}</p>
                          <p className="text-sm text-slate-500 mt-1">{activeHubSheetTemplate.purpose}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-slate-200 bg-[#f8fafc] px-3 py-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-medium">fx</span>
                        <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-400">
                          Row 1 contains the exact sheet titles. Add one customer, student, attendance record, or transaction per row below it.
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto bg-white">
                      <Table className="min-w-[1100px]">
                        <TableHeader>
                          <TableRow className="border-b border-slate-200 bg-slate-100 hover:bg-slate-100">
                            <TableHead className="w-14 border-r border-slate-200 text-center text-[11px] font-semibold text-slate-500">#</TableHead>
                            {activeHubSheetTemplate.headers.map((_, index) => (
                              <TableHead
                                key={`${activeHubSheetTemplate.tab}-column-${index}`}
                                className="border-r border-slate-200 text-center text-[11px] font-semibold text-slate-500"
                              >
                                {getSheetColumnLabel(index)}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="hover:bg-white">
                            <TableCell className="border-r border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500">1</TableCell>
                            {activeHubSheetTemplate.headers.map(header => (
                              <TableCell
                                key={`${activeHubSheetTemplate.tab}-header-${header}`}
                                className="min-w-[140px] whitespace-normal border-r border-slate-200 bg-emerald-50/60 text-xs font-semibold text-slate-800"
                              >
                                {header}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-white">
                            <TableCell className="border-r border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500">2</TableCell>
                            {activeHubSheetTemplate.sampleRow.map((value, index) => (
                              <TableCell
                                key={`${activeHubSheetTemplate.tab}-sample-${index}`}
                                className="min-w-[140px] whitespace-normal border-r border-slate-200 text-xs text-slate-700"
                              >
                                {value || '—'}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-white">
                            <TableCell className="border-r border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500">3</TableCell>
                            {activeHubSheetTemplate.headers.map((_, index) => (
                              <TableCell
                                key={`${activeHubSheetTemplate.tab}-blank-${index}`}
                                className="h-11 min-w-[140px] border-r border-slate-200 text-xs text-slate-300"
                              >
                                &nbsp;
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {HUB_SHEET_TEMPLATES.map(template => (
                          <button
                            key={`${template.tab}-bottom-tab`}
                            onClick={() => setSelectedHubSheetTab(template.tab)}
                            className={`rounded-t-xl border px-3 py-2 text-xs font-medium transition-colors ${
                              activeHubSheetTemplate.tab === template.tab
                                ? '-mb-[13px] border-slate-300 border-b-white bg-white text-slate-900'
                                : 'border-slate-200 bg-slate-100 text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {template.tab}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {workbookValidation.status !== 'idle' && (
                    <div className={`rounded-2xl border px-4 py-3 text-sm ${
                      workbookValidation.status === 'valid'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : workbookValidation.status === 'checking'
                          ? 'border-slate-200 bg-white text-slate-600'
                          : workbookValidation.status === 'warning'
                            ? 'border-amber-200 bg-amber-50 text-amber-800'
                            : 'border-slate-200 bg-white text-slate-600'
                    }`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {workbookValidation.status === 'valid' && 'Workbook check passed'}
                          {workbookValidation.status === 'checking' && 'Checking workbook'}
                          {workbookValidation.status === 'warning' && 'Workbook needs attention'}
                          {workbookValidation.status === 'unavailable' && 'Workbook check unavailable'}
                        </span>
                        {workbookValidation.availableTabs.length > 0 && (
                          <span className="text-xs opacity-80">
                            Found tabs: {workbookValidation.availableTabs.join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 leading-relaxed">{workbookValidation.message}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold mb-2">{isHubWorkflow ? 'Manager email' : 'Notify email'}</label>
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">{isHubWorkflow ? 'Manager oversight reports will be emailed here.' : 'Workflow results will be emailed here.'}</p>
              </div>

              {/* Team alerts — Pro only */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block font-semibold">{isHubWorkflow ? 'Also notify receptionist / team members' : 'Also notify team members'}</label>
                  {!hasPro && (
                    <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Pro
                    </span>
                  )}
                </div>
                {hasPro ? (
                  <>
                    <input
                      type="text"
                      value={teamEmails}
                      onChange={e => setTeamEmails(e.target.value)}
                      placeholder={isHubWorkflow ? 'reception@hub.com, owner@hub.com' : 'colleague@company.com, manager@company.com'}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                    />
                    <p className="text-xs text-slate-400 mt-1">{isHubWorkflow ? 'Separate multiple emails with commas. This is the easiest way to keep the receptionist and manager in sync from one setup.' : 'Separate multiple emails with commas. Each person receives the full report.'}</p>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                    Upgrade to Pro to send results to your whole team in one workflow.
                  </div>
                )}
              </div>
            </div>

            {/* Decision Triggers */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowAlerts(s => !s)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-blue" />
                  <span className="font-semibold text-sm">Decision Triggers</span>
                  {alerts.length > 0 && (
                    <span className="text-xs font-semibold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full">{alerts.length} set</span>
                  )}
                  <span className="text-xs text-slate-400 font-normal">Optional</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showAlerts ? 'rotate-180' : ''}`} />
              </button>

              {showAlerts && (
                <div className="px-6 pb-5 border-t border-slate-100 pt-4 space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Set thresholds that flag a special alert inside your report when triggered. Example: "Alert if revenue drops by more than 10%."
                  </p>

                  {alerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400 shrink-0">Alert if</span>
                      <input
                        value={alert.metric}
                        onChange={e => updateAlert(i, 'metric', e.target.value)}
                        placeholder="e.g. revenue, price, margin"
                        className="flex-1 min-w-[120px] p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 outline-none"
                      />
                      <select
                        value={alert.condition}
                        onChange={e => updateAlert(i, 'condition', e.target.value as Alert['condition'])}
                        className="p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 outline-none"
                      >
                        <option value="drops_by">drops by more than</option>
                        <option value="rises_by">rises by more than</option>
                        <option value="falls_below">falls below</option>
                        <option value="exceeds">exceeds</option>
                      </select>
                      <input
                        value={alert.value}
                        onChange={e => updateAlert(i, 'value', e.target.value)}
                        placeholder="10%"
                        className="w-20 p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 outline-none"
                      />
                      <button onClick={() => removeAlert(i)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addAlert}
                    className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-brand-dark transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add trigger
                  </button>
                </div>
              )}
            </div>

            {/* Deployment summary */}
            {notifyEmail && workflow && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Deployment Summary</p>
                <div className="space-y-1.5 text-sm text-slate-700">
                  <p><span className="text-slate-400">Workflow:</span> <strong>{workflow.title}</strong></p>
                  {isHubWorkflow && selectedHubSubsetDefs.length > 0 && (
                    <p>
                      <span className="text-slate-400">Subsets:</span> {selectedHubSubsetDefs.map(subset => subset.title).join(', ')}
                    </p>
                  )}
                  <p>
                    <span className="text-slate-400">Schedule:</span>{' '}
                    {!isHubWorkflow && triggerType === 'webhook'
                      ? 'Webhook triggered'
                      : `${schedule.charAt(0).toUpperCase() + schedule.slice(1)}${schedule === 'weekly' ? ` on ${runDay.charAt(0).toUpperCase() + runDay.slice(1)}` : ''} at ${runTime}`}
                  </p>
                  <p><span className="text-slate-400">Results to:</span> {notifyEmail}{hasPro && teamEmails.trim() ? ` + ${teamEmails.split(',').filter(Boolean).length} team member(s)` : ''}</p>
                  {dataSourceMode === 'excel' && xlsxFileName && (
                    <p><span className="text-slate-400">Data file:</span> {xlsxFileName}</p>
                  )}
                  {dataSourceMode !== 'excel' && dataSource && (
                    <p><span className="text-slate-400">Data source:</span> {dataSource.length > 50 ? dataSource.slice(0, 50) + '…' : dataSource}</p>
                  )}
                  {alerts.filter(a => a.metric.trim() && a.value.trim()).length > 0 && (
                    <p><span className="text-slate-400">Triggers:</span> {alerts.filter(a => a.metric && a.value).length} alert condition{alerts.filter(a => a.metric && a.value).length > 1 ? 's' : ''} set</p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-between border-t border-slate-200 items-center">
              <button onClick={() => setStep(2)} className="text-slate-500 hover:text-brand-dark px-4 py-2 font-medium">
                Back
              </button>
              <button
                onClick={handleDeploy}
                disabled={isDeploying || !notifyEmail || (dataSourceMode === 'excel' && !xlsxPath) || (isHubWorkflow && dataSourceMode !== 'excel' && !dataSource.trim()) || (isHubWorkflow && selectedHubSubsetDefs.length === 0)}
                className="bg-brand-blue text-white px-8 py-3 rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isDeploying ? 'Deploying...' : 'Deploy Workflow'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success screen */}
        {step === 4 && (
          <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
              {/* Icon */}
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border-4 border-green-100">
                <CheckCheck className="w-9 h-9 text-green-600" />
              </div>

              {/* Headline */}
              <div>
                <h1 className="text-2xl font-bold mb-1">You're all set!</h1>
                <p className="text-slate-500 text-sm">
                  <span className="font-medium text-brand-dark">{deployedWorkflowTitle}</span> is now live
                </p>
              </div>

              {/* Details */}
              {deployedWebhookUrl ? (
                <>
                  <div className="text-left bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your Webhook URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs text-slate-700 break-all font-mono leading-relaxed">
                        {deployedWebhookUrl}
                      </code>
                      <button onClick={handleCopy} className="shrink-0 p-2 rounded-lg hover:bg-slate-200 transition-colors" title="Copy URL">
                        {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-left text-sm text-blue-800">
                    <p className="font-semibold mb-1">How to trigger it:</p>
                    <p>Send a <code className="bg-blue-100 px-1 rounded">POST</code> request with your data as JSON. The AI agent analyzes the payload and emails you the results.</p>
                  </div>
                </>
	              ) : (
	                <div className="text-left bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3">
	                  {isHubWorkflow && (
	                    <>
	                      <div className="grid gap-3 sm:grid-cols-2">
	                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
	                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Manager email</p>
	                          <p className="text-sm font-medium text-brand-dark break-all">{notifyEmail}</p>
	                        </div>
	                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
	                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Workbook source</p>
	                          <p className="text-sm font-medium text-brand-dark break-all">
	                            {dataSourceMode === 'excel'
	                              ? (xlsxFileName || 'Uploaded workbook')
	                              : (dataSource.length > 70 ? `${dataSource.slice(0, 70)}…` : dataSource)}
	                          </p>
	                        </div>
	                      </div>
	                      {hasPro && teamEmails.trim() && (
	                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
	                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Also notifying</p>
	                          <p className="text-sm font-medium text-brand-dark break-all">{teamEmails}</p>
	                        </div>
	                      )}
	                    </>
	                  )}
	                  <div className="flex items-start gap-3">
	                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
	                      <span className="text-sm">🕐</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Runs</p>
                      <p className="text-sm font-medium text-brand-dark capitalize">
                        {schedule === 'hourly' && 'Every hour'}
                        {schedule === 'daily' && `Every day at ${runTime}`}
                        {schedule === 'weekdays' && `Weekdays (Mon–Fri) at ${runTime}`}
                        {schedule === 'weekly' && `Every ${runDay} at ${runTime}`}
                        {schedule === 'biweekly' && `Every 2 weeks (${runDay}) at ${runTime}`}
                        {schedule === 'monthly' && `Monthly on the ${runMonthDay}${runMonthDay===1?'st':runMonthDay===2?'nd':runMonthDay===3?'rd':'th'} at ${runTime}`}
                        {schedule === 'once' && 'Runs one time immediately'}
                      </p>
                      {schedule !== 'once' && schedule !== 'hourly' && (
                        <p className="text-xs text-slate-400 mt-0.5">{userTimezone}</p>
                      )}
                    </div>
                  </div>
	                  <div className="flex items-start gap-3">
	                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
	                      <span className="text-sm">📧</span>
	                    </div>
	                    <div>
	                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{isHubWorkflow ? 'Primary recipient' : 'Results sent to'}</p>
	                      <p className="text-sm font-medium text-brand-dark">{notifyEmail}</p>
	                    </div>
	                  </div>
                  {deployedWorkflowNames.length > 1 && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sm">🧩</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Deployed subsets</p>
                        <div className="flex flex-wrap gap-2">
                          {deployedWorkflowNames.map(name => (
                            <span key={name} className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                              {getWorkflowDisplayName(name)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-col gap-3 pt-2">
                <Link to="/workflows">
                  <button className="w-full bg-brand-dark text-white px-6 py-3 rounded-full font-medium hover:bg-brand-dark/90 transition-colors flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View My Workflows
                  </button>
                </Link>
                <button
                  onClick={() => { setStep(1); setSelectedWorkflow(''); setDeployedWebhookUrl(''); setDeployedWorkflowTitle(''); setDeployedWorkflowNames([]); }}
                  className="w-full text-slate-500 hover:text-brand-dark text-sm py-2 font-medium transition-colors"
                >
                  Deploy another workflow →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
