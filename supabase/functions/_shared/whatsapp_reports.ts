// Business metrics, summaries, AI reports, and report email delivery.
import Anthropic from "npm:@anthropic-ai/sdk";
import { AI_REPORT_ROW_LIMIT, checkWebhookRateLimit, getProfile, isProProfile, logAnalyticsEvent, planReportLimit } from "./whatsapp_core.ts";
import { looksLikeProfitAndLossQuestion } from "./whatsapp_intents.ts";
import { getTodayStart } from "./whatsapp_sales.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "https://www.hoursback.xyz";

export async function getTodayBusinessMetrics(supabase: any, userId: string, timeZone?: string) {
  const start = getTodayStart(timeZone);
  const { data: entries } = await supabase
    .from("bot_entries")
    .select("entry_type, parsed_data, triggered_by, sale_date, created_at")
    .eq("user_id", userId)
    .or(`created_at.gte.${start.toISOString()},sale_date.gte.${start.toISOString()}`)
    .order("created_at", { ascending: false });

  const rows = (entries || []).filter((entry: any) => entryDate(entry) >= start);
  const sales = rows.filter((e: any) => e.entry_type === "sale");
  const expenses = rows.filter((e: any) => e.entry_type === "expense");
  const refunds = rows.filter((e: any) => e.entry_type === "refund");
  const grossSales = sales.reduce((sum: number, e: any) => sum + Number(e.parsed_data?.total || 0), 0);
  const totalRefunds = refunds.reduce((sum: number, e: any) => sum + Number(e.parsed_data?.total || 0), 0);
  const totalSales = grossSales - totalRefunds;
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.parsed_data?.total || 0), 0);
  const counts = new Map<string, number>();
  for (const e of sales) {
    const item = e.parsed_data?.item || "Unspecified";
    counts.set(item, (counts.get(item) || 0) + Number(e.parsed_data?.qty || 1));
  }
  const topItem = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const { data: closeouts } = await supabase
    .from("kapso_closeouts")
    .select("actual_collected_total, variance_total, status, created_at")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: false })
    .limit(1);
  const latestCloseout = closeouts?.[0];

  return {
    rows,
    grossSales,
    totalRefunds,
    totalSales,
    totalExpenses,
    estimatedProfit: totalSales - totalExpenses,
    topItem,
    latestCloseout,
  };
}

export async function buildSalesSummary(supabase: any, userId: string, timeZone?: string) {
  const metrics = await getTodayBusinessMetrics(supabase, userId, timeZone);

  return [
    `Today so far:`,
    `Net sales: ₦${metrics.totalSales.toLocaleString()}`,
    metrics.totalRefunds ? `Gross sales: ₦${metrics.grossSales.toLocaleString()} | Refunds: ₦${metrics.totalRefunds.toLocaleString()}` : `Gross sales: ₦${metrics.grossSales.toLocaleString()}`,
    `Expenses: ₦${metrics.totalExpenses.toLocaleString()}`,
    `Entries logged: ${metrics.rows.length}`,
    metrics.topItem ? `Top item: ${metrics.topItem[0]} (${metrics.topItem[1]} units/entries)` : `Top item: none yet`,
    metrics.latestCloseout
      ? `Closeout: ${metrics.latestCloseout.status.replace(/_/g, " ")} (collected ₦${Number(metrics.latestCloseout.actual_collected_total || 0).toLocaleString()}, variance ₦${Number(metrics.latestCloseout.variance_total || 0).toLocaleString()})`
      : `Closeout: not done yet`,
  ].join("\n");
}

export async function buildProfitAndLossSummary(supabase: any, userId: string, timeZone?: string) {
  const metrics = await getTodayBusinessMetrics(supabase, userId, timeZone);
  return [
    "Estimated profit and loss today:",
    `Net revenue: ₦${metrics.totalSales.toLocaleString()}`,
    metrics.totalRefunds ? `Gross sales: ₦${metrics.grossSales.toLocaleString()} | Refunds: ₦${metrics.totalRefunds.toLocaleString()}` : `Gross sales: ₦${metrics.grossSales.toLocaleString()}`,
    `Expenses: ₦${metrics.totalExpenses.toLocaleString()}`,
    `Estimated profit: ₦${metrics.estimatedProfit.toLocaleString()}`,
    metrics.latestCloseout
      ? `Closeout variance: ₦${Number(metrics.latestCloseout.variance_total || 0).toLocaleString()}`
      : "Closeout variance: not closed yet",
  ].join("\n");
}

export async function buildFiveLineSummary(supabase: any, userId: string, timeZone?: string) {
  const metrics = await getTodayBusinessMetrics(supabase, userId, timeZone);
  return [
    `Net sales: ₦${metrics.totalSales.toLocaleString()}`,
    `Expenses: ₦${metrics.totalExpenses.toLocaleString()}`,
    `Estimated profit: ₦${metrics.estimatedProfit.toLocaleString()}`,
    metrics.topItem ? `Top item: ${metrics.topItem[0]} (${metrics.topItem[1]})` : "Top item: none yet",
    metrics.latestCloseout ? `Closeout: ${metrics.latestCloseout.status.replace(/_/g, " ")}` : "Closeout: not done yet",
  ].join("\n");
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function markdownToEmailHtml(markdown: string) {
  const inline = (text: string) => escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:12px;font-family:monospace;">$1</code>');

  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`<h2 style="font-size:18px;font-weight:700;color:#0f172a;margin:22px 0 8px;">${inline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`<h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:24px 0 8px;">${inline(trimmed.slice(2))}</h1>`);
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)/);
    if (bullet) {
      if (!inList) {
        html.push('<ul style="margin:8px 0;padding-left:20px;">');
        inList = true;
      }
      html.push(`<li style="margin:5px 0;color:#334155;line-height:1.7;">${inline(bullet[1])}</li>`);
      continue;
    }
    closeList();
    html.push(`<p style="margin:8px 0;color:#334155;line-height:1.75;font-size:15px;">${inline(trimmed)}</p>`);
  }
  closeList();
  return html.join("\n");
}

export function getZonedDateParts(date: Date, timeZone = "Africa/Lagos") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(value.year),
    month: Number(value.month),
    day: Number(value.day),
  };
}

export function zonedStartOfDay(date: Date, timeZone = "Africa/Lagos") {
  const { year, month, day } = getZonedDateParts(date, timeZone);
  if (timeZone === "Africa/Lagos") {
    return new Date(Date.UTC(year, month - 1, day, -1, 0, 0));
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

export function parseReportRange(text: string, timeZone = "Africa/Lagos") {
  const now = new Date();
  const end = new Date(now);
  const start = zonedStartOfDay(now, timeZone);
  let label = "Today";

  if (/\b(yesterday)\b/i.test(text)) {
    start.setUTCDate(start.getUTCDate() - 1);
    end.setTime(start.getTime() + 24 * 60 * 60 * 1000 - 1);
    label = "Yesterday";
  } else if (/\b(week|weekly|last 7 days|7 days)\b/i.test(text)) {
    start.setUTCDate(start.getUTCDate() - 6);
    label = "Last 7 days";
  } else if (/\b(month|monthly|this month)\b/i.test(text)) {
    const { year, month } = getZonedDateParts(now, timeZone);
    start.setTime(timeZone === "Africa/Lagos"
      ? Date.UTC(year, month - 1, 1, -1, 0, 0)
      : Date.UTC(year, month - 1, 1, 0, 0, 0));
    label = "This month";
  } else {
    label = "Today";
  }

  return { start, end, label };
}

export function entryDate(entry: any) {
  return new Date(entry.sale_date || entry.created_at);
}

export function compactList(values: string[], limit = 3) {
  if (!values.length) return "";
  const shown = values.slice(0, limit);
  const more = values.length > limit ? ` +${values.length - limit} more` : "";
  return `${shown.join(", ")}${more}`;
}

export function uniqueFieldValues(rows: any[], getter: (entry: any) => unknown) {
  return [...new Set(rows
    .map((entry) => String(getter(entry) || "").trim())
    .filter((value) => value.length > 1))]
    .sort((a, b) => b.length - a.length);
}

export function valuesMentionedInText(values: string[], text: string) {
  const lower = text.toLowerCase();
  return values.filter((value) => lower.includes(value.toLowerCase()));
}

export async function collectReportMetrics(supabase: any, userId: string, text: string, timeZone?: string) {
  const range = parseReportRange(text, timeZone);
  const lowerBound = range.start.toISOString();

  const { data: entries, error } = await supabase
    .from("bot_entries")
    .select("entry_type,parsed_data,triggered_by,raw_text,source,channel,sale_date,created_at")
    .eq("user_id", userId)
    .or(`created_at.gte.${lowerBound},sale_date.gte.${lowerBound}`)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;

  const rows = (entries || []).filter((entry: any) => {
    const date = entryDate(entry);
    return date >= range.start && date <= range.end;
  });
  const sales = rows.filter((entry: any) => entry.entry_type === "sale");
  const expenses = rows.filter((entry: any) => entry.entry_type === "expense");
  const refunds = rows.filter((entry: any) => entry.entry_type === "refund");
  const grossRevenue = sales.reduce((sum: number, entry: any) => sum + Number(entry.parsed_data?.total || 0), 0);
  const refundTotal = refunds.reduce((sum: number, entry: any) => sum + Number(entry.parsed_data?.total || 0), 0);
  const revenue = grossRevenue - refundTotal;
  const expenseTotal = expenses.reduce((sum: number, entry: any) => sum + Number(entry.parsed_data?.total || 0), 0);
  const itemCounts = new Map<string, { qty: number; revenue: number }>();

  for (const entry of sales) {
    const item = String(entry.parsed_data?.item || "Unspecified");
    const current = itemCounts.get(item) || { qty: 0, revenue: 0 };
    current.qty += Number(entry.parsed_data?.qty || 1);
    current.revenue += Number(entry.parsed_data?.total || 0);
    itemCounts.set(item, current);
  }

  const topItems = [...itemCounts.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([item, value]) => ({ item, ...value }));

  const channels = rows.reduce((acc: Record<string, number>, entry: any) => {
    const key = entry.channel || (String(entry.source || "").startsWith("data_source") ? "data_source" : entry.source || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    range,
    rows,
    sales,
    expenses,
    refunds,
    grossRevenue,
    refundTotal,
    revenue,
    expenseTotal,
    profit: revenue - expenseTotal,
    topItems,
    channels,
  };
}

export function salesLogQueryFilters(rows: any[], text: string) {
  const itemMatches = valuesMentionedInText(uniqueFieldValues(rows, (entry) => entry.parsed_data?.item), text);
  const shopMatches = valuesMentionedInText(uniqueFieldValues(rows, (entry) => entry.parsed_data?.shop), text);
  const staffMatches = valuesMentionedInText(uniqueFieldValues(rows, (entry) => entry.triggered_by), text);
  const paymentMatches = valuesMentionedInText(uniqueFieldValues(rows, (entry) => entry.parsed_data?.payment_method), text);

  return {
    itemMatches,
    shopMatches,
    staffMatches,
    paymentMatches,
  };
}

export async function buildSalesLogQueryAnswer(supabase: any, userId: string, text: string, timeZone?: string) {
  const metrics = await collectReportMetrics(supabase, userId, text, timeZone);
  const filters = salesLogQueryFilters(metrics.rows, text);
  let rows = metrics.rows;

  if (filters.itemMatches.length) {
    rows = rows.filter((entry: any) => filters.itemMatches.some((item) =>
      String(entry.parsed_data?.item || "").toLowerCase().includes(item.toLowerCase())
    ));
  }
  if (filters.shopMatches.length) {
    rows = rows.filter((entry: any) => filters.shopMatches.some((shop) =>
      String(entry.parsed_data?.shop || "").toLowerCase().includes(shop.toLowerCase())
    ));
  }
  if (filters.staffMatches.length) {
    rows = rows.filter((entry: any) => filters.staffMatches.some((staff) =>
      String(entry.triggered_by || "").toLowerCase().includes(staff.toLowerCase())
    ));
  }
  if (filters.paymentMatches.length) {
    rows = rows.filter((entry: any) => filters.paymentMatches.some((method) =>
      String(entry.parsed_data?.payment_method || "").toLowerCase().includes(method.toLowerCase())
    ));
  }

  const sales = rows.filter((entry: any) => entry.entry_type === "sale");
  const expenses = rows.filter((entry: any) => entry.entry_type === "expense");
  const refunds = rows.filter((entry: any) => entry.entry_type === "refund");
  const grossRevenue = sales.reduce((sum: number, entry: any) => sum + Number(entry.parsed_data?.total || 0), 0);
  const refundTotal = refunds.reduce((sum: number, entry: any) => sum + Number(entry.parsed_data?.total || 0), 0);
  const revenue = grossRevenue - refundTotal;
  const expenseTotal = expenses.reduce((sum: number, entry: any) => sum + Number(entry.parsed_data?.total || 0), 0);
  const qtySold = sales.reduce((sum: number, entry: any) => sum + Number(entry.parsed_data?.qty || (entry.parsed_data?.item ? 1 : 0)), 0);
  const itemCounts = new Map<string, { qty: number; revenue: number }>();

  for (const entry of sales) {
    const item = String(entry.parsed_data?.item || "Unspecified");
    const current = itemCounts.get(item) || { qty: 0, revenue: 0 };
    current.qty += Number(entry.parsed_data?.qty || 1);
    current.revenue += Number(entry.parsed_data?.total || 0);
    itemCounts.set(item, current);
  }

  const topItems = [...itemCounts.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 3)
    .map(([item, value]) => `${item}: ₦${value.revenue.toLocaleString("en-NG")} (${value.qty})`);

  const appliedFilters = [
    filters.itemMatches.length ? `Item: ${compactList(filters.itemMatches)}` : "",
    filters.shopMatches.length ? `Shop: ${compactList(filters.shopMatches)}` : "",
    filters.staffMatches.length ? `Staff: ${compactList(filters.staffMatches)}` : "",
    filters.paymentMatches.length ? `Payment: ${compactList(filters.paymentMatches)}` : "",
  ].filter(Boolean);

  const lines = [`Sales Log - ${metrics.range.label}${appliedFilters.length ? ` (${appliedFilters.join("; ")})` : ""}`];
  if (!rows.length) {
    lines.push("No matching entries found.");
    lines.push("Try a wider question, for example: “How much did we sell this week?”");
    return lines.join("\n");
  }

  lines.push(`Net sales: ₦${revenue.toLocaleString("en-NG")}`);
  if (refundTotal) lines.push(`Gross sales: ₦${grossRevenue.toLocaleString("en-NG")} | Refunds: ₦${refundTotal.toLocaleString("en-NG")}`);
  lines.push(`Expenses: ₦${expenseTotal.toLocaleString("en-NG")}`);
  if (filters.itemMatches.length || /\bhow many\b/i.test(text)) lines.push(`Qty sold: ${qtySold.toLocaleString("en-NG")}`);
  lines.push(`Entries: ${rows.length} (${sales.length} sales, ${expenses.length} expenses${refunds.length ? `, ${refunds.length} refunds` : ""})`);
  lines.push(topItems.length ? `Top items: ${topItems.join("; ")}` : "Top items: none yet");

  const recent = rows
    .slice()
    .sort((a: any, b: any) => entryDate(b).getTime() - entryDate(a).getTime())
    .slice(0, 3)
    .map((entry: any) => {
      const parsed = entry.parsed_data || {};
      const item = parsed.item || entry.entry_type;
      const amount = parsed.total ? `₦${Number(parsed.total).toLocaleString("en-NG")}` : "no amount";
      const staff = entry.triggered_by ? ` by ${entry.triggered_by}` : "";
      return `${item}${parsed.qty ? ` x ${parsed.qty}` : ""}: ${amount}${staff}`;
    });
  if (/\b(show|list|entries|details|what sold)\b/i.test(text) && recent.length) {
    lines.push(`Recent: ${recent.join(" | ")}`);
  }

  return lines.join("\n");
}

export function deterministicReport(metrics: any, reportType: string) {
  const lines = [
    `# ${reportType === "profit_and_loss" ? "Profit and Loss Report" : "Sales Report"} - ${metrics.range.label}`,
    "",
    "## At a glance",
    `- Net revenue: ₦${metrics.revenue.toLocaleString("en-NG")}`,
    `- Gross sales: ₦${Number(metrics.grossRevenue || metrics.revenue || 0).toLocaleString("en-NG")}`,
    `- Refunds: ₦${Number(metrics.refundTotal || 0).toLocaleString("en-NG")}`,
    `- Expenses: ₦${metrics.expenseTotal.toLocaleString("en-NG")}`,
    `- Estimated profit: ₦${metrics.profit.toLocaleString("en-NG")}`,
    `- Entries reviewed: ${metrics.rows.length}`,
    `- Sales entries: ${metrics.sales.length}`,
    `- Expense entries: ${metrics.expenses.length}`,
    `- Refund entries: ${metrics.refunds?.length || 0}`,
    "",
    "## Top items or services",
    metrics.topItems.length
      ? metrics.topItems.map((item: any) => `- ${item.item}: ₦${item.revenue.toLocaleString("en-NG")} (${item.qty} entries/units)`).join("\n")
      : "- No item-level sales found for this period.",
    "",
    "## Data coverage",
    `- Channels used: ${Object.entries(metrics.channels).map(([key, count]) => `${key} (${count})`).join(", ") || "none"}`,
    "- This report uses records captured in Hoursback from Sheets/imports, manual entries, WhatsApp logs, scans, and verified customer orders.",
    "",
    "## Recommendations",
    metrics.rows.length
      ? "- Review any high-value expenses and confirm uncategorized sales items before making final financial decisions."
      : "- Connect a Google Sheet or add sales entries before relying on this report.",
  ];
  return lines.join("\n");
}

export async function generateReportWithAI(metrics: any, reportType: string) {
  const fallback = deterministicReport(metrics, reportType);
  if (!ANTHROPIC_API_KEY || !metrics.rows.length || metrics.rows.length > AI_REPORT_ROW_LIMIT) return fallback;

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const sample = metrics.rows.slice(0, 80).map((entry: any) => ({
      type: entry.entry_type,
      item: entry.parsed_data?.item || null,
      total: entry.parsed_data?.total || null,
      qty: entry.parsed_data?.qty || null,
      customer: entry.parsed_data?.customer || null,
      source: entry.channel || entry.source || null,
      date: entry.sale_date || entry.created_at,
    }));
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          `Write a concise ${reportType === "profit_and_loss" ? "profit and loss" : "sales"} report for a business owner.`,
          "Use Markdown headings and bullets. No emoji. Do not invent numbers.",
          "Use these verified totals exactly:",
          JSON.stringify({
            period: metrics.range.label,
            revenue: metrics.revenue,
            gross_revenue: metrics.grossRevenue,
            refunds: metrics.refundTotal,
            expenses: metrics.expenseTotal,
            estimated_profit: metrics.profit,
            entries_reviewed: metrics.rows.length,
            sales_entries: metrics.sales.length,
            expense_entries: metrics.expenses.length,
            refund_entries: metrics.refunds?.length || 0,
            top_items: metrics.topItems,
            channels: metrics.channels,
          }),
          "Sample rows for context:",
          JSON.stringify(sample),
          "Sections: At a glance, What changed or stands out, Top items/services, Risks or gaps, Recommended actions, Data coverage.",
        ].join("\n"),
      }],
    });
    const text = (result.content[0] as { text: string }).text.trim();
    return text || fallback;
  } catch (err) {
    console.error("WhatsApp report generation failed:", err);
    return fallback;
  }
}

export async function getOrCreateWhatsAppReportWorkflow(supabase: any, userId: string) {
  const { data: existing, error: existingError } = await supabase
    .from("workflows")
    .select("*")
    .eq("user_id", userId)
    .eq("name", "WhatsApp Reports")
    .eq("category", "WhatsApp Report")
    .order("created_at", { ascending: true })
    .limit(1);
  if (existingError) throw existingError;
  if (existing?.[0]) return existing[0];

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      user_id: userId,
      name: "WhatsApp Reports",
      category: "WhatsApp Report",
      status: "active",
      trigger_config: { type: "whatsapp_command" },
      data_source_config: { source: "bot_entries" },
      agent_config: { kind: "business_report" },
      action_config: { type: "whatsapp" },
    })
    .select("*")
    .single();
  if (error?.code === "23505") {
    const retry = await supabase
      .from("workflows")
      .select("*")
      .eq("user_id", userId)
      .eq("name", "WhatsApp Reports")
      .eq("category", "WhatsApp Report")
      .order("created_at", { ascending: true })
      .limit(1);
    if (retry.error) throw retry.error;
    if (retry.data?.[0]) return retry.data[0];
  }
  if (error) throw error;
  return data;
}

export async function saveWhatsAppReportRun(supabase: any, userId: string, output: string) {
  const workflow = await getOrCreateWhatsAppReportWorkflow(supabase, userId);
  const { data, error } = await supabase
    .from("workflow_runs")
    .insert({
      workflow_id: workflow.id,
      user_id: userId,
      status: "success",
      generated_output: output,
    })
    .select("*")
    .single();
  if (error) throw error;
  return { workflow, run: data };
}

export async function sendReportEmail(supabase: any, userId: string, subject: string, output: string) {
  if (!RESEND_API_KEY) return false;
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email;
  if (!email) return false;

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f1f5f9;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
      <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;padding:28px 32px 26px;">
        <p style="margin:0 0 10px;color:#64748b;font-size:10px;font-family:Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;font-weight:700;">HOURSBACK · WHATSAPP REPORT</p>
        <h1 style="margin:0;color:#f8fafc;font-size:24px;font-family:Arial,Helvetica,sans-serif;font-weight:800;line-height:1.25;">${escapeHtml(subject)}</h1>
      </td></tr>
      <tr><td style="background:linear-gradient(90deg,#10b981 0%,#3b82f6 50%,#8b5cf6 100%);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="background:#ffffff;padding:28px;font-family:-apple-system,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#1e293b;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        ${markdownToEmailHtml(output)}
      </td></tr>
      <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:16px 28px;text-align:center;">
        <p style="margin:0;font-family:-apple-system,Helvetica,sans-serif;font-size:12px;color:#94a3b8;">
          Delivered by <a href="${APP_URL}" style="color:#3b82f6;text-decoration:none;font-weight:600;">Hoursback</a>
          &nbsp;·&nbsp; <a href="${APP_URL}/reports" style="color:#94a3b8;text-decoration:none;">Open reports</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Hoursback Reports <reports@hoursback.xyz>",
      to: email,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const errorBody = await res.text();
    console.error("WhatsApp report email failed:", errorBody);
    await logAnalyticsEvent(supabase, userId, "report_email_failed", {
      status: res.status,
      subject,
      error: errorBody.slice(0, 500),
    });
    return false;
  }
  return true;
}

export async function generateWhatsAppBusinessReport(supabase: any, connection: any, text: string) {
  const profile = await getProfile(supabase, connection.user_id);
  const reportAllowed = await checkWebhookRateLimit(
    supabase,
    `whatsapp-report:${connection.user_id}`,
    planReportLimit(profile),
    60 * 60,
    "whatsapp_report_limit_reached",
    connection.user_id,
    {
      connection_type: connection.connection_type || "internal",
      plan: isProProfile(profile) ? "pro" : "free",
    },
  );
  if (!reportAllowed) {
    return [
      "Report limit reached for this hour.",
      "Your sales messages are still being captured. Open Reports to view existing reports or try again shortly.",
      `${APP_URL}/reports`,
    ].join("\n");
  }

  const reportType = looksLikeProfitAndLossQuestion(text) ? "profit_and_loss" : "sales_summary";
  const wantsEmail = /\b(email|mail|inbox)\b/i.test(text);
  const wantsPdf = /\b(pdf|document|download)\b/i.test(text);
  const metrics = await collectReportMetrics(supabase, connection.user_id, text, connection.business_timezone);
  if (!metrics.rows.length) {
    return [
      `I found no records for ${metrics.range.label.toLowerCase()}.`,
      "Connect or refresh a Google Sheet in Data Sources, add manual entries, or log sales on WhatsApp first.",
      "You can also ask for a wider range, for example: “Send this month’s P&L report”.",
      `${APP_URL}/data-sources`,
    ].join("\n");
  }
  const output = await generateReportWithAI(metrics, reportType);
  const { run } = await saveWhatsAppReportRun(supabase, connection.user_id, output);
  const subject = `${reportType === "profit_and_loss" ? "Profit and Loss" : "Sales"} Report - ${metrics.range.label}`;
  const emailed = wantsEmail ? await sendReportEmail(supabase, connection.user_id, subject, output) : false;
  await logAnalyticsEvent(supabase, connection.user_id, "whatsapp_report_generated", {
    run_id: run.id,
    report_type: reportType,
    period: metrics.range.label,
    rows: metrics.rows.length,
    revenue: metrics.revenue,
    expenses: metrics.expenseTotal,
    emailed,
    wants_pdf: wantsPdf,
  });

  return [
    `${subject} generated.`,
    `Revenue: ₦${metrics.revenue.toLocaleString("en-NG")}`,
    `Expenses: ₦${metrics.expenseTotal.toLocaleString("en-NG")}`,
    `Estimated profit: ₦${metrics.profit.toLocaleString("en-NG")}`,
    `Entries reviewed: ${metrics.rows.length}`,
    emailed ? "Email sent." : wantsEmail ? "Email could not be sent. Open Reports to view it." : null,
    wantsPdf ? "Open Reports to download the PDF version." : null,
    `${APP_URL}/reports`,
  ].filter(Boolean).join("\n");
}

