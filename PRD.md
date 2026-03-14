# Hoursback v2 Product Specification

## Overview

Hoursback is a platform that allows users to deploy AI workflows that run automatically in the background.

Instead of using prompts manually, users activate workflows that monitor data sources, analyze signals, and deliver insights or actions automatically.

Hoursback acts as the AI reasoning and monitoring layer for recurring business workflows.

## Core Product Concept

Every workflow follows this structure:

Trigger / Watcher
↓
Fetch Data
↓
AI Agent Reasoning
↓
Insight Generation
↓
Output Delivery

Example:

Weekly Schedule
↓
Read Google Sheets Metrics
↓
AI analyzes revenue trends
↓
Generate CEO briefing
↓
Email report

## Product Rules

**Rule 1**
Every workflow must run automatically after setup.
If a workflow requires repeated manual input, it does not belong in the deployable catalog.

**Rule 2**
Every workflow must have a trigger (watcher).

**Rule 3**
Outputs must provide insight, not generic summaries.
Each output should answer:
- What changed
- Why it matters
- What to do next

**Rule 4**
Avoid deep native integrations early.
Use universal input mechanisms instead.

## Website Copy Direction

### Homepage Hero

Get hours back every week.
Deploy AI workflows that monitor your business, analyze the signal, and send you insights automatically.

Alternative:
Stop checking dashboards. Start getting answers.
Hoursback watches your workflows and tells you what matters.

### Hero Subtext

Connect Google Sheets, websites, inboxes, or webhooks.
Hoursback monitors changes, analyzes them, and sends clear insights.

### Primary CTA

Deploy a Workflow

Alternative CTAs:
- Start With a Workflow
- Activate Your First AI Worker

## Product Explanation Section

### Step 1
Choose a workflow.
Examples:
- CEO Briefing
- Competitor Monitoring
- Pricing Intelligence

### Step 2
Connect your data source.
Examples:
- Google Sheets
- Websites
- Email forwarding
- Webhooks
- File uploads

### Step 3
Let it run automatically.
Hoursback watches for changes and delivers insights.

## System Architecture

### Components

**Watcher (Trigger)**
Detects events.
Supported watcher types:
- schedule
- google_sheets
- webhook
- email_inbox
- website_monitor
- file_upload

**Data Fetcher**
Collects the relevant data.
Examples:
- spreadsheet rows
- scraped web pages
- webhook payloads
- email body content
- uploaded files

**AI Agent**
Processes data using prompt logic.
Example prompt:
Analyze the data and identify trends, anomalies, and key insights.

**Output Formatter**
Structures responses.
Example format:
- Summary
- Key changes
- Why it matters
- Recommended action

**Action Layer**
Delivers output.
Supported actions:
- send_email
- store_report
- send_notification

### Workflow Schema

Example workflow JSON:
```json
{
  "name": "Weekly CEO Briefing",
  "category": "Finance",
  "trigger": {
    "type": "schedule",
    "frequency": "weekly",
    "day": "monday",
    "time": "07:00"
  },
  "data_source": {
    "type": "google_sheets",
    "sheet_id": "metrics_sheet"
  },
  "agent": {
    "base_prompt": "Analyze business metrics and produce a concise CEO briefing with wins, risks, and recommended actions."
  },
  "action": {
    "type": "send_email"
  },
  "learning": {
    "enabled": true
  }
}
```

## Supported Watchers

**Schedule Watcher**
Runs workflows periodically.
Examples: daily, weekly, monthly

**Google Sheets Watcher**
Triggers on: sheet updates, scheduled analysis

**Webhook Watcher**
Endpoint example: `POST /hooks/{workflow_id}`
Example payload:
```json
{
  "event": "new_customer",
  "value": 1200
}
```

**Email Watcher**
Each workspace gets a unique inbox.
Example: `workspace@inbox.hoursback.xyz`
Emails forwarded here trigger workflows.

**Website Watcher**
Scrapes pages using Firecrawl.
Detects: content changes, price changes, new announcements

**File Upload Watcher**
Runs workflows when files are uploaded.
Supported formats: CSV, Excel, PDF

## External Tools

The system uses these scraping and automation tools.

- **Firecrawl**: Used for scraping websites and monitoring page changes.
- **Apify**: Used for crawling platforms such as job boards, social media, review platforms, directories.

## Self-Improving Workflow System

Workflows should improve over time using memory and feedback.

**Learning Loop**
Trigger ↓ Workflow runs ↓ Output generated ↓ User feedback / evaluation ↓ Memory stored ↓ Next run improved

**Preference Memory**
Store user preferences.
Example: include profit margin, max 5 bullets, always include recommendation.
These are injected into prompts.

**Run History Memory**
Store previous workflow runs.
Example: previous revenue, previous pricing, previous alerts.
This allows comparisons.
Example output improvement:
- Without memory: Competitor price is $39.
- With memory: Competitor increased price from $29 to $39.

**Evaluator Layer**
A lightweight evaluation agent checks output quality.
Evaluation criteria: specificity, actionability, clarity, repetition.
Example evaluator output:
```yaml
specificity_score: 8
actionability_score: 7
missing_elements: recommendation
```

**Prompt Adaptation**
Prompts are composed dynamically:
`base_prompt + user_preferences + workflow_memory + evaluator_rules`

**Feedback Loop**
Users can react to outputs: useful, not useful, too vague, too long.
Feedback influences prompt adjustments.

## Deployable Workflow Catalog

**Strategic Monitoring**
- Industry News Digest
- Competitor Intelligence Tracker
- Pricing Intelligence Agent
- Brand Mention Monitor
- Job Market Scout
- Supplier Price Tracker
- Regulatory & Compliance Monitor

**Finance Intelligence**
- Weekly CEO Briefing
- Sales Pipeline Health
- Accounts Receivable Aging
- Monthly Financial Snapshot
- Profit Margin Analyzer

**Customer Intelligence**
- Customer Expansion Radar
- Employer Brand Monitor
- Review Response Generator

**Marketing Intelligence**
- Directory Listing Auditor
- SEO Content Gap Analyzer

**Growth Automation**
- TikTok Creator Outreach Agent
- Brand Mention Monitor

**Workflows Removed**
The following workflows are removed because they require manual prompt usage:
- Product Description Generator
- Thought Leadership Article
- LinkedIn Content Strategy
- Landing Page Builder
- Vendor Negotiation Script
- Waitlist Builder Campaign
- Pricing Strategy Reset
- Resume Tailor
- Designer's AI Shipping Playbook
- Create SaaS Dashboard Web App

## Launch Catalog

Recommended launch set (10–12 workflows):
- Weekly CEO Briefing
- Sales Pipeline Health
- Accounts Receivable Aging
- Monthly Financial Snapshot
- Competitor Intelligence Tracker
- Pricing Intelligence Agent
- Industry News Digest
- Brand Mention Monitor
- Regulatory Monitor
- Supplier Price Tracker
- Customer Expansion Radar

## Implementation Priorities

- **Priority 1**: Watcher infrastructure.
- **Priority 2**: Workflow deployment system.
- **Priority 3**: Website copy update.
- **Priority 4**: Self-improving workflow memory.
- **Priority 5**: Launch core workflow catalog.

## Product Identity

Hoursback is an AI workflow platform that monitors business signals and delivers insights automatically.
It is not a prompt library and not a manual AI tool.
The product value comes from continuous monitoring and intelligent analysis of recurring workflows.
