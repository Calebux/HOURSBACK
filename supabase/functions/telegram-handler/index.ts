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
}

const WORKFLOWS: Record<string, WorkflowDef> = {
  reconcile: {
    name: "Daily Cash Reconciliation",
    commands: ["/reconcile", "reconcile", "eod", "end of day", "cash reconciliation"],
    steps: [
      { key: "opening_balance", ask: "💰 *Cash Reconciliation*\n\nWhat was your *opening balance* today? (₦)" },
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
  },

  handover: {
    name: "Shift Handover",
    commands: ["/handover", "handover", "end of shift", "shift end"],
    steps: [
      { key: "completed",   ask: "📋 *Shift Handover*\n\nWhat tasks did you *complete* this shift?" },
      { key: "in_progress", ask: "What's still *in progress*? Include status and next action, or type *none*." },
      { key: "issues",      ask: "Any *issues, incidents, or urgent items* for the next shift? Or type *none*." },
    ],
    buildPrompt: (i) => `Summarise this shift handover log for the incoming team.

Completed this shift: ${i.completed}
In progress: ${i.in_progress}
Issues / urgent items: ${i.issues}

Format as a clean shift briefing — readable in under 2 minutes. Clearly flag anything urgent. Structure it so the incoming team knows exactly what to pick up.`,
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
  },

  sop: {
    name: "SOP Compliance Check",
    commands: ["/sop", "sop compliance", "check compliance", "compliance check"],
    steps: [
      { key: "task_log", ask: "✅ *SOP Compliance Check*\n\nShare your *task completion log* (paste the data or a Google Sheets URL):" },
      { key: "sop_ref",  ask: "Now share your *SOP checklist* (paste the steps or a doc URL):" },
    ],
    buildPrompt: (i) => `Review this task completion log against the SOP checklist.

TASK LOG: ${i.task_log}
SOP CHECKLIST: ${i.sop_ref}

For each task, identify: which steps were completed vs skipped, any out-of-order execution, and staff members with repeated deviations. Output a compliance summary with: overall compliance rate (%), a list of violations ranked by severity, specific staff reminders, and 2–3 process improvement suggestions.`,
  },

  restock: {
    name: "Supplier Outreach",
    commands: ["/restock", "restock", "supplier orders", "purchase orders", "low stock"],
    steps: [
      { key: "inventory_url", ask: "📦 *Supplier Outreach*\n\nShare your *inventory sheet URL* (showing low-stock items):" },
      { key: "supplier_url",  ask: "Now share your *supplier contacts sheet URL*:" },
    ],
    buildPrompt: (i) => `Using the inventory shortage data and supplier contact list below, draft professional purchase order messages for each low-stock item.

INVENTORY SHEET: ${i.inventory_url}
SUPPLIER CONTACTS: ${i.supplier_url}

For each PO include: supplier name, itemised list with quantities, requested delivery date (3–5 business days), and payment terms. Group items by supplier to minimise separate orders. Flag any items where no supplier is listed.

[Note: Fetch both URLs above for the data]`,
  },

  audit: {
    name: "Inventory Audit",
    commands: ["/audit", "inventory audit", "stock audit", "stock count"],
    steps: [
      { key: "system_url",     ask: "🔍 *Inventory Audit*\n\nShare your *system inventory records* (Google Sheets URL):" },
      { key: "physical_count", ask: "Now paste your *physical count data*, or share a Google Sheets URL:" },
    ],
    buildPrompt: (i) => `Compare the physical stock count against the system inventory records.

SYSTEM RECORDS: ${i.system_url}
PHYSICAL COUNT: ${i.physical_count}

For each item calculate: system quantity, counted quantity, variance, and variance %. Flag items with variances above 5%. Group findings by: accurate, minor variance (1–5%), significant variance (>5%), missing items. Output an audit summary with a shrinkage estimate and 3 recommendations to improve inventory accuracy.`,
  },

  assign: {
    name: "Task Assignment",
    commands: ["/assign", "assign task", "new task", "who handles"],
    steps: [
      { key: "tasks", ask: "👥 *Task Assignment*\n\nDescribe the *task(s) to assign* (or paste a list):" },
      { key: "roles", ask: "Share your *team roles sheet URL* — or briefly describe your team and their responsibilities:" },
    ],
    buildPrompt: (i) => `Assign the following tasks to the most appropriate team members.

TASKS: ${i.tasks}
TEAM ROLES: ${i.roles}

Assign each task based on role match, and output an assignment table with: task description, assigned person, reason for assignment, priority (High/Medium/Low), and suggested deadline. Flag any tasks with no clear owner.`,
  },

  escalate: {
    name: "Escalation Router",
    commands: ["/escalate", "escalate", "incident:", "urgent:", "emergency"],
    steps: [
      { key: "incident", ask: "🚨 *Escalation Router*\n\nDescribe the *incident* briefly:" },
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
  },
};

// Commands restricted to manager role only
const MANAGER_ONLY = new Set(["assign", "escalate", "sop", "sopupdate"]);

const WELCOME_STAFF = `👋 *Welcome! You're connected as Staff.*

Here's what you can do:

💰 /reconcile — Daily cash reconciliation
📋 /handover — Shift handover log
📦 /restock — Supplier outreach
🔍 /audit — Inventory audit

Type /help at any time to see this list.
Type /cancel to stop any workflow.`;

const WELCOME_MANAGER = `👋 *Welcome! You're connected as Manager.*

You have access to all commands:

💰 /reconcile — Daily cash reconciliation
📋 /handover — Shift handover log
📦 /restock — Supplier outreach
🔍 /audit — Inventory audit
👥 /assign — Task assignment
🚨 /escalate — Escalation router
✅ /sop — SOP compliance check
📄 /sopupdate — SOP update notifier

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

  const message = update?.message;
  if (!message?.text) return new Response("OK");

  const chatId: number = message.chat.id;
  const text: string = message.text.trim();
  const firstName: string = message.from?.first_name || "there";
  const telegramUsername: string = message.from?.username || "";

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
    .select("subscription_expires_at")
    .eq("id", userId)
    .single();

  const isPro = proRow?.subscription_expires_at && new Date(proRow.subscription_expires_at) > new Date();

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

      let runStatus: "success" | "error" = "success";
      let runResult = "";
      let runError = "";

      try {
        runResult = await runWorkflow(session.workflow_key, updatedInputs, businessContext);
        await sendMessage(botToken, chatId, `✅ *${wf.name} Complete*\n\n${runResult}`);
      } catch (err: any) {
        console.error("Workflow error:", err);
        runStatus = "error";
        runError = err.message || "Unknown error";
        await sendMessage(botToken, chatId, "❌ Something went wrong. Please try again.");
      }

      // Log the run
      await supabase.from("telegram_runs").insert({
        user_id: userId,
        chat_id: chatId,
        workflow_key: session.workflow_key,
        workflow_name: wf.name,
        triggered_by: firstName,
        role: userRole,
        status: runStatus,
        result: runResult || null,
        error_message: runError || null,
      });

      // Notify owner via email if run was successful
      if (runStatus === "success") {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .single();

        if (RESEND_API_KEY && ownerProfile?.email) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "Hoursback <noreply@hoursback.xyz>",
              to: ownerProfile.email,
              subject: `📋 ${wf.name} — ${firstName} just ran a workflow`,
              text: `${firstName} ran /${session.workflow_key} via Telegram.\n\n${runResult}`,
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

  // ── Unrecognised ──────────────────────────────────────────────────────────
  await sendMessage(botToken, chatId, `I didn't recognise that. Send /help to see available commands.`);
  return new Response("OK");
});
