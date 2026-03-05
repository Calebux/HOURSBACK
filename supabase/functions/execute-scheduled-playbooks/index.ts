import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Anthropic from "npm:@anthropic-ai/sdk";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Markdown → HTML converter (handles Claude's typical output)
// ---------------------------------------------------------------------------
function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;
  let listType = "";

  const closeList = () => {
    if (inList) {
      html.push(listType === "ul" ? "</ul>" : "</ol>");
      inList = false;
      listType = "";
    }
  };

  const inline = (text: string) =>
    text
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code style="background:#e5e7eb;padding:1px 5px;border-radius:4px;font-size:13px;">$1</code>');

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Horizontal rule
    if (/^---+$/.test(line)) { closeList(); html.push('<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">'); continue; }

    // H1
    if (/^# /.test(line)) { closeList(); html.push(`<h1 style="font-size:20px;font-weight:700;color:#202124;margin:24px 0 8px;">${inline(line.slice(2))}</h1>`); continue; }

    // H2
    if (/^## /.test(line)) { closeList(); html.push(`<h2 style="font-size:17px;font-weight:700;color:#202124;margin:20px 0 6px;">${inline(line.slice(3))}</h2>`); continue; }

    // H3
    if (/^### /.test(line)) { closeList(); html.push(`<h3 style="font-size:15px;font-weight:600;color:#202124;margin:16px 0 4px;">${inline(line.slice(4))}</h3>`); continue; }

    // Unordered list item
    const ulMatch = line.match(/^[\-\*] (.+)/);
    if (ulMatch) {
      if (!inList || listType !== "ul") { closeList(); html.push('<ul style="margin:8px 0;padding-left:20px;">'); inList = true; listType = "ul"; }
      html.push(`<li style="margin:4px 0;color:#374151;line-height:1.7;">${inline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list item
    const olMatch = line.match(/^\d+\. (.+)/);
    if (olMatch) {
      if (!inList || listType !== "ol") { closeList(); html.push('<ol style="margin:8px 0;padding-left:20px;">'); inList = true; listType = "ol"; }
      html.push(`<li style="margin:4px 0;color:#374151;line-height:1.7;">${inline(olMatch[1])}</li>`);
      continue;
    }

    // Blank line
    if (line.trim() === "") { closeList(); html.push(""); continue; }

    // Regular paragraph
    closeList();
    html.push(`<p style="margin:6px 0;color:#374151;line-height:1.8;font-size:14px;">${inline(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}

// ---------------------------------------------------------------------------
// Strip HTML tags from a webpage — returns clean readable text
// ---------------------------------------------------------------------------
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<\/?(p|div|h[1-6]|li|tr|br)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------------------------------------------------------------------------
// Cron expression matcher — supports the 3 schedule types we generate:
//   daily:    "MM HH * * *"
//   weekdays: "MM HH * * 1-5"
//   weekly:   "MM HH * * 1"
// ---------------------------------------------------------------------------
function cronMatchesNow(cron: string): boolean {
  const parts = cron.split(" ");
  if (parts.length !== 5) return false;
  const [cronMin, cronHour, , , cronDow] = parts;

  const now = new Date();
  const nowMin = now.getUTCMinutes();
  const nowHour = now.getUTCHours();
  const nowDow = now.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat

  if (parseInt(cronMin) !== nowMin) return false;
  if (parseInt(cronHour) !== nowHour) return false;

  if (cronDow === "*") return true;                         // daily
  if (cronDow === "1-5") return nowDow >= 1 && nowDow <= 5; // weekdays
  return parseInt(cronDow) === nowDow;                      // specific day
}

// ---------------------------------------------------------------------------
// Execute a single schedule: call Claude, email the result, log the run
// ---------------------------------------------------------------------------
// Playbooks that deliver one piece of content per run (daily drip), not everything at once
const DAILY_DRIP_SLUGS: Record<string, { total: number; label: string }> = {
  "30-day-social-media-content-engine": { total: 30, label: "Day" },
};

// Content pillars that rotate across the 30-day cycle
const CONTENT_PILLARS = [
  "Behind-the-Scenes",
  "Educational Tip",
  "Customer Spotlight",
  "Promotional Offer",
  "Engagement Question",
  "Product / Service Feature",
  "Local Community",
  "Social Proof / Testimonial",
  "Industry News",
  "Brand Story",
];

// ---------------------------------------------------------------------------
// Playbooks that emit a visual infographic alongside their text output
// ---------------------------------------------------------------------------
const INFOGRAPHIC_SLUGS = new Set([
  "business-financial-health-check",
  "business-health-score-90-day-action-plan",
  "profit-margin-analyzer-most-profitable-work",
  "monthly-financial-snapshot-pl-analyzer",
  "expense-anomaly-detection",
  "cash-flow-projection",
  "ai-bookkeeper-weekly-transaction-categorization",
  "tax-season-prep-assistant",
  "hire-or-stay-solo-financial-decision",
  "pricing-strategy-reset",
  "invoice-cash-flow-guardian",
]);

type InfographData = {
  title: string;
  kpis: Array<{ label: string; value: string; trend?: "up" | "down" | "neutral"; note?: string }>;
  tables?: Array<{ title?: string; headers: string[]; rows: string[][] }>;
  bars?: Array<{ label: string; value: number; max: number; unit?: string }>;
  highlights?: Array<{ type: "strength" | "risk" | "action"; text: string }>;
};

function parseInfographData(text: string): { data: InfographData | null; cleanText: string } {
  // Always strip the block — two passes:
  // 1) Remove complete blocks (START...END), 2) Remove truncated blocks (START to end of string)
  const cleanText = text
    .replace(/\*{0,2}INFOGRAPH_DATA_START\*{0,2}[\s\S]*?\*{0,2}INFOGRAPH_DATA_END\*{0,2}/g, "")
    .replace(/\*{0,2}INFOGRAPH_DATA_START\*{0,2}[\s\S]*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Match the block, tolerating code fences Claude sometimes wraps around the JSON
  const match = text.match(/INFOGRAPH_DATA_START\s*(?:```(?:json)?\s*)?([\s\S]*?)(?:\s*```)?\s*INFOGRAPH_DATA_END/);
  if (!match) return { data: null, cleanText };

  const jsonStr = match[1]
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return { data: JSON.parse(jsonStr) as InfographData, cleanText };
  } catch {
    console.error("[Autopilot] Failed to parse infograph JSON:", jsonStr.slice(0, 200));
    return { data: null, cleanText };
  }
}

function generateInfographicHtml(d: InfographData): string {
  const BG    = "#13131f";
  const PANEL = "#1c1c2e";
  const PANEL2= "#21213a";
  const BORDER= "#2a2a42";
  const TEXT  = "#e2e8f0";
  const MUTED = "#7c85a0";
  const ACCENT= ["#118dff","#00b4d8","#e66c37","#8bc34a","#c77dff"];

  // ── Normalise: convert old scores schema → table ───────────────────────────
  if ((!d.tables || !d.tables.length) && (d as any).scores?.length) {
    const scores: Array<{ label: string; score: number; max: number }> = (d as any).scores;
    d = { ...d, tables: [{ title: "Health Scores", headers: ["Dimension","Score","/ Max","Status"],
      rows: scores.map(s => {
        const pct = Math.round((s.score / s.max) * 100);
        return [s.label, String(s.score), String(s.max), pct >= 70 ? "✓ Good" : pct >= 40 ? "~ Fair" : "✗ Weak"];
      }) }] };
  }

  // ── KPI tiles ──────────────────────────────────────────────────────────────
  const kpiHtml = d.kpis.map((k, i) => {
    const accent = ACCENT[i % ACCENT.length];
    const trendColor = k.trend === "up" ? "#4ade80" : k.trend === "down" ? "#f87171" : MUTED;
    const trendArrow = k.trend === "up" ? "▲" : k.trend === "down" ? "▼" : "";
    const trendBadge = trendArrow
      ? "<div style='margin-top:5px;'><span style='background:" + trendColor + "20;color:" + trendColor + ";font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px;letter-spacing:0.3px;'>"
        + trendArrow + " " + k.trend.toUpperCase() + "</span></div>" : "";
    return "<td style='padding:0;vertical-align:top;border-right:1px solid " + BORDER + ";width:" + Math.floor(100/d.kpis.length) + "%;'>"
      + "<div style='border-top:3px solid " + accent + ";padding:15px 13px;'>"
      + "<div style='font-size:9px;color:" + MUTED + ";font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;'>" + k.label + "</div>"
      + "<div style='font-size:22px;font-weight:800;color:" + TEXT + ";letter-spacing:-0.5px;line-height:1;'>" + k.value + "</div>"
      + trendBadge
      + (k.note ? "<div style='font-size:9px;color:" + MUTED + ";margin-top:4px;line-height:1.3;'>" + k.note + "</div>" : "")
      + "</div></td>";
  }).join("");

  // ── SVG bar chart (inline SVG — works perfectly in any browser) ────────────
  const svgBars = (bars: NonNullable<InfographData["bars"]>) => {
    const barColors = ["#e66c37","#118dff","#00b4d8","#8bc34a","#c77dff","#facc15"];
    const LW = 105, BW = 160, VW = 52, ROW = 28, TOP = 22, W = LW + BW + VW + 8;
    const H = bars.length * ROW + TOP + 6;
    const rows = bars.map((b, i) => {
      const fill = Math.min(BW, Math.round((b.value / b.max) * BW));
      const y = TOP + i * ROW;
      const color = barColors[i % barColors.length];
      const val = b.value + (b.unit || "");
      return `<text x="${LW - 5}" y="${y + 11}" fill="#b0bcd4" font-size="11" text-anchor="end" dominant-baseline="middle">${b.label}</text>`
        + `<rect x="${LW}" y="${y}" width="${BW}" height="16" fill="rgba(255,255,255,0.07)" rx="3"/>`
        + `<rect x="${LW}" y="${y}" width="${fill}" height="16" fill="${color}" rx="3"/>`
        + `<text x="${LW + BW + 7}" y="${y + 11}" fill="${color}" font-size="10" font-weight="bold" dominant-baseline="middle">${val}</text>`;
    }).join("");
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;max-width:${W}px;">`
      + `<text x="0" y="13" fill="#118dff" font-size="9" font-weight="bold" letter-spacing="1.5">&#9632; TOP EXPENSES</text>`
      + rows + `</svg>`;
  };

  // ── P&L summary table ──────────────────────────────────────────────────────
  const renderTable = (t: { title?: string; headers: string[]; rows: string[][] }) => {
    const th = t.headers.map((h, hi) =>
      `<td style='padding:7px 10px;font-size:9px;font-weight:700;color:#118dff;text-transform:uppercase;letter-spacing:0.5px;${hi > 0 ? "text-align:right;" : ""}${hi < t.headers.length-1 ? "border-right:1px solid " + BORDER + ";" : ""}'>${h}</td>`
    ).join("");
    const trs = t.rows.map((row, ri) => {
      const isBold = /^(total|gross|net|ebitda|profit|loss|revenue)/i.test(row[0]);
      const bg = isBold ? "#118dff16" : ri % 2 === 0 ? PANEL : PANEL2;
      const cells = row.map((c, ci) =>
        `<td style='padding:7px 10px;font-size:11px;color:${isBold ? TEXT : (ci === 0 ? TEXT : "#a8b3cf")};font-weight:${isBold ? "700" : "400"};${ci > 0 ? "text-align:right;" : ""}${ci < row.length-1 ? "border-right:1px solid " + BORDER + ";" : ""}border-bottom:1px solid ${BORDER};'>${c}</td>`
      ).join("");
      return `<tr style='background:${bg};'>${cells}</tr>`;
    }).join("");
    const title = t.title ? `<div style='font-size:9px;font-weight:700;color:#118dff;letter-spacing:1px;text-transform:uppercase;margin-bottom:7px;'>&#9632; ${t.title}</div>` : "";
    return title
      + `<div style='border-radius:6px;overflow:hidden;border:1px solid ${BORDER};'>`
      + `<table width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;'>`
      + `<thead><tr style='background:#0c1933;border-bottom:2px solid #118dff33;'>${th}</tr></thead>`
      + `<tbody>${trs}</tbody></table></div>`;
  };

  // ── Body: table left + SVG bars right ─────────────────────────────────────
  const hasTables = !!(d.tables && d.tables.length);
  const hasBars   = !!(d.bars   && d.bars.length);
  let bodySection = "";
  if (hasTables && hasBars) {
    bodySection =
      `<table width='100%' cellpadding='0' cellspacing='0' style='border-top:1px solid ${BORDER};'><tr>`
      + `<td width='58%' style='padding:18px 14px 16px 20px;vertical-align:top;border-right:1px solid ${BORDER};'>`
      + d.tables.map(renderTable).join("")
      + `</td><td width='42%' style='padding:18px 20px 16px 16px;vertical-align:top;'>`
      + svgBars(d.bars!)
      + `</td></tr></table>`;
  } else if (hasTables) {
    bodySection = `<div style='padding:18px 20px 16px;border-top:1px solid ${BORDER};'>${d.tables.map(renderTable).join("")}</div>`;
  } else if (hasBars) {
    bodySection = `<div style='padding:18px 20px 16px;border-top:1px solid ${BORDER};'>${svgBars(d.bars!)}</div>`;
  }

  // ── Insights: 3 cards side by side ────────────────────────────────────────
  const iCfg: Record<string, { accent: string; icon: string; label: string }> = {
    strength: { accent: "#4ade80", icon: "✦", label: "STRENGTH" },
    risk:     { accent: "#facc15", icon: "⚑", label: "RISK"     },
    action:   { accent: "#118dff", icon: "→", label: "ACTION"   },
  };
  const insightsSection = (d.highlights && d.highlights.length) ? (
    `<div style='padding:16px 20px;border-top:1px solid ${BORDER};'>`
    + `<div style='font-size:9px;font-weight:700;color:${MUTED};letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;'>&#9632; KEY INSIGHTS &amp; ACTIONS</div>`
    + `<table width='100%' cellpadding='0' cellspacing='0'><tr>`
    + d.highlights.map((h, hi) => {
      const cfg = iCfg[h.type] || iCfg.action;
      return `<td style='vertical-align:top;padding:${hi < d.highlights!.length-1 ? "0 8px 0 0" : "0"};width:${Math.floor(100/d.highlights!.length)}%;'>`
        + `<div style='padding:10px 12px;background:${cfg.accent}10;border-top:2px solid ${cfg.accent};border-radius:0 0 6px 6px;height:100%;'>`
        + `<div style='font-size:9px;font-weight:800;color:${cfg.accent};letter-spacing:0.8px;text-transform:uppercase;margin-bottom:5px;'>${cfg.icon} ${cfg.label}</div>`
        + `<div style='font-size:11px;color:${TEXT};line-height:1.5;font-weight:500;'>${h.text}</div>`
        + `</div></td>`;
    }).join("")
    + `</tr></table></div>`
  ) : "";

  return `<div style='font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:${BG};border-radius:14px;overflow:hidden;border:1px solid ${BORDER};'>`
    + `<div style='background:${PANEL};padding:14px 20px 12px;border-bottom:1px solid ${BORDER};'>`
    + `<table width='100%' cellpadding='0' cellspacing='0'><tr>`
    + `<td><div style='font-size:9px;color:#118dff;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:3px;'>&#9632; EXECUTIVE SUMMARY &nbsp;·&nbsp; AT A GLANCE</div>`
    + `<div style='font-size:16px;font-weight:800;color:${TEXT};letter-spacing:-0.3px;line-height:1.2;'>${d.title}</div></td>`
    + `<td align='right' style='vertical-align:middle;padding-left:12px;white-space:nowrap;'>`
    + `<div style='font-size:9px;color:${MUTED};'>${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div></td>`
    + `</tr></table></div>`
    + `<div style='height:2px;background:linear-gradient(90deg,#118dff 0%,#00b4d8 33%,#e66c37 66%,#8bc34a 100%);'></div>`
    + `<table width='100%' cellpadding='0' cellspacing='0' style='background:${PANEL};border-bottom:1px solid ${BORDER};'><tr>${kpiHtml}</tr></table>`
    + bodySection
    + insightsSection
    + `<div style='padding:7px 20px 9px;border-top:1px solid ${BORDER};background:${PANEL};'>`
    + `<p style='margin:0;font-size:9px;color:${MUTED};text-align:center;letter-spacing:0.8px;text-transform:uppercase;'>HOURSBACK AUTOPILOT &nbsp;·&nbsp; AI-POWERED BUSINESS INTELLIGENCE</p>`
    + `</div></div>`;
}

// Fetch fresh CSV data from a Google Sheets URL stored as "SHEETS_URL:..."
async function resolveVariables(variables: Record<string, string>): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(variables)) {
    if (value.startsWith('SHEETS_URL:')) {
      const url = value.slice('SHEETS_URL:'.length).trim();
      try {
        const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        if (!idMatch) throw new Error('Invalid Google Sheets URL');
        const csvUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
        const res = await fetch(csvUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error('Sheet appears empty');
        const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const rows = lines.slice(1).map(line => {
          const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
          return header.map((h, i) => `${h}: ${cols[i] ?? ''}`).join(' | ');
        });
        resolved[key] = `[Live data: ${rows.length} rows, columns: ${header.join(', ')}]\n${rows.join('\n')}`;
        console.log(`[Autopilot] Fetched live sheet for "${key}": ${rows.length} rows`);
      } catch (e: any) {
        console.error(`[Autopilot] Failed to fetch live sheet for "${key}":`, e.message);
        resolved[key] = `[Could not fetch live sheet: ${e.message}]`;
      }
    } else if (
      /website|url|site/i.test(key) &&
      /^https?:\/\//i.test(value.trim())
    ) {
      // Fetch website and extract clean text for brand voice context
      try {
        const res = await fetch(value.trim(), {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HoursbackBot/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        const text = stripHtml(html).slice(0, 3000);
        resolved[key] = `[Website content from ${value.trim()}]\n${text}`;
        console.log(`[Autopilot] Fetched website for "${key}": ${text.length} chars`);
      } catch (e: any) {
        console.error(`[Autopilot] Failed to fetch website for "${key}":`, e.message);
        resolved[key] = value; // keep raw URL as fallback
      }
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

async function executeSchedule(schedule: any, supabaseAdmin: any): Promise<void> {
  const playbookData = schedule.playbook_data;
  const playbookSlug = schedule.playbook_slug;
  // Resolve any live Google Sheets URLs to fresh CSV data before building the prompt
  const variables = await resolveVariables(schedule.variables || {});

  // Get user email via admin auth API
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(schedule.user_id);
  if (userError || !userData?.user?.email) {
    throw new Error(`Could not fetch email for user ${schedule.user_id}`);
  }
  const deliveryEmail = schedule.custom_delivery_email || userData.user.email;

  // ── Daily-drip mode: count previous runs to determine today's item ──
  const dripConfig = DAILY_DRIP_SLUGS[playbookSlug];
  let emailSubjectPrefix = "[Agent Report]";
  let emailDayBadge = "";
  let compiledPrompt = "";

  if (dripConfig) {
    // Count successful prior runs for this schedule to get the day number
    const { count: priorRuns } = await supabaseAdmin
      .from("autonomous_runs")
      .select("*", { count: "exact", head: true })
      .eq("schedule_id", schedule.id)
      .eq("run_status", "success");

    const dayNumber = ((priorRuns || 0) % dripConfig.total) + 1;
    const pillar = CONTENT_PILLARS[(dayNumber - 1) % CONTENT_PILLARS.length];

    emailSubjectPrefix = `[${dripConfig.label} ${dayNumber}/${dripConfig.total}]`;
    emailDayBadge = `${dripConfig.label} ${dayNumber} of ${dripConfig.total}`;

    console.log(`[Autopilot] Daily drip — ${playbookSlug} day ${dayNumber} for ${deliveryEmail}`);

    compiledPrompt = `You are writing the social media post for Day ${dayNumber} of a 30-day content calendar.\n\n`;
    compiledPrompt += `### BUSINESS CONTEXT:\n`;
    compiledPrompt += `Business: ${variables["Business Name & Industry"] || "a local business"}\n`;
    compiledPrompt += `Target Audience: ${variables["Target Audience"] || "local customers"}\n`;
    compiledPrompt += `Current Promotions / Offers: ${variables["Current Promotions/Offers"] || "none specified"}\n`;
    if (variables["Your Website URL"] && !variables["Your Website URL"].startsWith('http')) {
      // Already resolved to page text
      compiledPrompt += `\n### BRAND VOICE REFERENCE (from their website):\n${variables["Your Website URL"]}\n`;
    } else if (variables["Your Website URL"]) {
      compiledPrompt += `Website: ${variables["Your Website URL"]}\n`;
    }
    if (variables["Your Best 2-3 Posts"]) {
      compiledPrompt += `\n### EXAMPLE POSTS (match this exact tone and style):\n${variables["Your Best 2-3 Posts"]}\n`;
    }
    compiledPrompt += `\n`;
    compiledPrompt += `### TODAY'S BRIEF:\n`;
    compiledPrompt += `Day ${dayNumber} of 30 — Content Pillar: **${pillar}**\n\n`;
    compiledPrompt += `### DELIVER EXACTLY THIS (nothing else):\n`;
    compiledPrompt += `**Day ${dayNumber} — ${pillar}**\n\n`;
    compiledPrompt += `[Caption: 2–4 sentences, conversational, brand-aligned, with a clear call-to-action]\n\n`;
    compiledPrompt += `[3–5 relevant hashtags]\n\n`;
    compiledPrompt += `📸 Suggested visual: [1 sentence describing the ideal photo or graphic]\n\n`;
    compiledPrompt += `No extra commentary. Just the post.`;

  } else {
    // ── Standard mode: run all steps, deliver full output ──
    console.log(`[Autopilot] Executing "${playbookData?.title || playbookSlug}" for ${deliveryEmail}`);

    compiledPrompt = `You are an autonomous AI Agent executing the playbook: "${playbookData?.title || playbookSlug}".\n\n`;
    compiledPrompt += `### USER CONFIGURATION:\n`;
    Object.entries(variables).forEach(([key, value]) => {
      if (value && value.trim()) compiledPrompt += `- ${key}: ${value}\n`;
    });
    compiledPrompt += `\n### EXECUTION STEPS:\n`;

    if (playbookData?.steps) {
      playbookData.steps.forEach((step: any, index: number) => {
        let stepPrompt = step.promptTemplate || "";
        Object.keys(variables).forEach((v) => {
          // Replace filled variables; silently drop empty ones so Claude infers from data
          stepPrompt = stepPrompt.split(`[${v}]`).join(variables[v]?.trim() || '');
        });
        compiledPrompt += `STEP ${index + 1}: ${step.title}\n`;
        compiledPrompt += `Instruction: ${step.instruction}\n`;
        if (stepPrompt) compiledPrompt += `Prompt: ${stepPrompt}\n`;
        compiledPrompt += `\n`;
      });
    } else {
      compiledPrompt += `Generate a comprehensive, actionable response based on the configuration. Format as a professional brief.`;
    }

    compiledPrompt += `\n### FINAL TASK:\n`;
    compiledPrompt += `Execute ALL steps above end-to-end and produce the complete final deliverable in a single response.\n`;
    if (playbookData?.expectedOutcome) {
      compiledPrompt += `Expected Outcome: ${playbookData.expectedOutcome}\n`;
    }
    compiledPrompt += `\nCRITICAL RULES:\n`;
    compiledPrompt += `- Do NOT truncate. If a task requires 30 items, write all 30.\n`;
    compiledPrompt += `- Label each item clearly (e.g. "Day 1:", "Email 1:", "Step 1:") so the output is scannable.\n`;
    compiledPrompt += `- Use markdown headings and structure. Skip all meta-commentary about what you are doing.\n`;
    compiledPrompt += `- For any section with heavy numerical data (financial breakdown, category totals, comparisons, projections), format it as a markdown table with aligned columns.\n`;
    compiledPrompt += `- Deliver final polished content only — no draft notes, no "here is your X", just the X.`;

    // Analysis playbooks: ask Claude to append structured metric JSON
    if (INFOGRAPHIC_SLUGS.has(playbookSlug)) {
      compiledPrompt += `\n\n---\nFINAL STEP — after finishing your full analysis, append EXACTLY this block at the very end. Raw JSON only. No markdown, no code fences, no extra text after INFOGRAPH_DATA_END.\n\nINFOGRAPH_DATA_START\n{"title":"${(playbookData?.title || playbookSlug).replace(/"/g, "'")}","kpis":[{"label":"Total Revenue","value":"₦48.75M","trend":"down","note":"-0.73% vs prior"},{"label":"Net Profit","value":"₦6.01M","trend":"down","note":"-18.7% vs prior"},{"label":"Gross Margin","value":"51.8%","trend":"down"},{"label":"Net Margin","value":"12.3%","trend":"down"},{"label":"EBITDA","value":"₦9.28M","trend":"down"}],"tables":[{"title":"P&L Summary","headers":["Line Item","Amount","vs Prior"],"rows":[["TOTAL REVENUE","₦48.75M","-0.73%"],["Cost of Goods","₦23.48M","+3.9%"],["GROSS PROFIT","₦25.27M","-4.7%"],["Total Opex","₦15.99M","+4.8%"],["EBITDA","₦9.28M","-2.1%"],["NET PROFIT","₦6.01M","-18.7%"]]}],"bars":[{"label":"Raw Materials","value":13.89,"max":16,"unit":"M"},{"label":"Salaries","value":8.73,"max":16,"unit":"M"},{"label":"Rent & Utils","value":2.65,"max":16,"unit":"M"},{"label":"Marketing","value":1.78,"max":16,"unit":"M"},{"label":"Logistics","value":1.38,"max":16,"unit":"M"}],"highlights":[{"type":"strength","text":"Gross margin at 51.8% — strong pricing power maintained"},{"type":"risk","text":"Net profit fell 18.7% as OPEX grew faster than revenue"},{"type":"action","text":"Reduce Raw Materials cost — it is 28.5% of revenue and rising"}]}\nINFOGRAPH_DATA_END\n\nIMPORTANT — replace every example value with REAL numbers from your analysis above:\n- kpis: exactly 4–5 headline figures. trend = "up", "down", or "neutral". note = short comparison like "-18% vs prior".\n- tables: ONE P&L summary, max 3 columns, max 8 rows. Rows starting with TOTAL/GROSS/NET/EBITDA/REVENUE will be bold.\n- bars: top 4–5 largest costs/expenses as plain numbers. max = largest value rounded up to nearest 5 or 10.\n- highlights: exactly 3 items — one strength, one risk, one action. Max 15 words each. Be specific with numbers.\n- Output the JSON as a single line with no line breaks inside it.`;
    }
  }

  // Call Claude
  if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    system:
      "You are an autonomous expert consultant executing a scheduled playbook. Produce COMPLETE, polished output — never truncate, never summarize, never say 'and so on'. If the task is a 30-day calendar, write all 30 days. If it is a sequence, write every item in full. Structure output with clear headings and day/item labels. No conversational filler — only the final deliverable.",
    messages: [{ role: "user", content: compiledPrompt }],
  });

  // @ts-ignore
  const generatedContent = msg.content[0].text;

  // Parse infographic data from analysis playbooks
  let infographHtml = "";
  let finalContent = generatedContent;
  if (INFOGRAPHIC_SLUGS.has(playbookSlug)) {
    const { data: infData, cleanText } = parseInfographData(generatedContent);
    finalContent = cleanText; // always use stripped text — block removed even if JSON failed to parse
    if (infData) {
      infographHtml = generateInfographicHtml(infData);
      console.log(`[Autopilot] Infographic generated for "${playbookSlug}" — ${infData.kpis.length} KPIs, ${infData.scores?.length || 0} scores`);
    } else {
      console.log(`[Autopilot] No infograph data parsed for "${playbookSlug}" — block stripped from content`);
    }
  }

  // Content to store in DB (infographic HTML prefixed with a marker so the frontend can extract it)
  const storedContent = infographHtml
    ? `__INFOGRAPH_START__\n${infographHtml}\n__INFOGRAPH_END__\n\n${finalContent}`
    : finalContent; // always use stripped text — never expose raw INFOGRAPH block

  // Send email via Resend
  if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
  const now = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const contentHtml = markdownToHtml(finalContent);
  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:32px 16px 48px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- ── Header bar ── -->
        <tr>
          <td style="background:#0F1012;border-radius:20px 20px 0 0;padding:24px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:middle;padding-right:10px;">
                        <div style="width:32px;height:32px;background:linear-gradient(135deg,#4285F4,#6366f1);border-radius:8px;"></div>
                      </td>
                      <td style="vertical-align:middle;">
                        <span style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.4px;">hoursback</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <span style="background:rgba(66,133,244,0.2);color:#93bbfc;font-size:10px;font-weight:700;padding:5px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;border:1px solid rgba(66,133,244,0.3);">
                    ${emailDayBadge ? emailDayBadge.toUpperCase() : "AUTOPILOT"}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Gradient accent ── -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#4285F4,#6366f1,#DA7756);"></td></tr>

        <!-- ── Title block ── -->
        <tr>
          <td style="background:#ffffff;padding:32px 36px 20px;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#4285F4;letter-spacing:1.5px;text-transform:uppercase;">${emailDayBadge || "Agent Report"}</p>
            <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#0F1012;line-height:1.25;letter-spacing:-0.4px;">${playbookData?.title || playbookSlug}</h1>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;padding-right:6px;">
                  <div style="width:6px;height:6px;background:#22c55e;border-radius:50%;"></div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:12px;color:#6b7280;">Delivered ${now}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Infographic (analysis playbooks only) ── -->
        ${infographHtml ? `<tr>
          <td style="background:#ffffff;padding:4px 28px 24px;">
            ${infographHtml}
          </td>
        </tr>` : ""}

        <!-- ── Subtle divider ── -->
        <tr><td style="background:#ffffff;padding:0 36px;"><div style="height:1px;background:#f3f4f6;"></div></td></tr>

        <!-- ── Content ── -->
        <tr>
          <td style="background:#ffffff;padding:28px 36px 32px;">
            <div style="background:#FAFAFA;border:1px solid #e5e7eb;border-radius:12px;padding:24px 28px;font-size:14px;line-height:1.85;color:#111827;">
              ${contentHtml}
            </div>
          </td>
        </tr>

        <!-- ── CTA ── -->
        <tr>
          <td style="background:#ffffff;padding:4px 36px 32px;text-align:center;">
            <a href="https://www.hoursback.xyz/autopilot"
               style="display:inline-block;background:#0F1012;color:#ffffff;font-size:13px;font-weight:700;padding:13px 28px;border-radius:999px;text-decoration:none;letter-spacing:0.2px;">
              View in Dashboard →
            </a>
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="background:#F0F2F5;border-top:1px solid #e5e7eb;border-radius:0 0 20px 20px;padding:20px 36px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;">
              Sent by <strong style="color:#374151;">Hoursback Autopilot</strong> · Your AI runs while you sleep
            </p>
            <p style="margin:0;font-size:11px;">
              <a href="https://www.hoursback.xyz/autopilot" style="color:#4285F4;text-decoration:none;">Manage agents</a>
              &nbsp;·&nbsp;
              <a href="https://www.hoursback.xyz" style="color:#4285F4;text-decoration:none;">hoursback.xyz</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Hoursback Autopilot <autopilot@hoursback.xyz>",
      to: [deliveryEmail],
      subject: `${emailSubjectPrefix} ${playbookData?.title || playbookSlug}`,
      html: emailHtml,
    }),
  });

  if (!resendRes.ok) {
    const errText = await resendRes.text();
    throw new Error(`Email delivery failed: ${errText}`);
  }

  // Log the successful run
  await supabaseAdmin.from("autonomous_runs").insert({
    schedule_id: schedule.id,
    user_id: schedule.user_id,
    playbook_slug: playbookSlug,
    generated_content: storedContent,
    run_status: "success",
  });

  console.log(`[Autopilot] Done — report delivered to ${deliveryEmail}`);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));

    // ── MODE 1: Manual single-schedule execution (triggered from UI) ──
    if (body.schedule_id) {
      const { data: schedule, error: scheduleError } = await supabaseAdmin
        .from("scheduled_playbooks")
        .select("*")
        .eq("id", body.schedule_id)
        .single();

      if (scheduleError || !schedule) {
        throw new Error(`Schedule not found: ${scheduleError?.message}`);
      }
      if (!schedule.is_active) {
        return new Response(
          JSON.stringify({ error: "Schedule is paused" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      await executeSchedule(schedule, supabaseAdmin);
      return new Response(
        JSON.stringify({ success: true, message: "Agent execution complete" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── MODE 2: Batch cron mode (triggered by pg_cron every minute) ──
    if (body.trigger === "cron") {
      const { data: schedules, error } = await supabaseAdmin
        .from("scheduled_playbooks")
        .select("*")
        .eq("is_active", true);

      if (error) throw new Error(`Failed to fetch schedules: ${error.message}`);
      if (!schedules || schedules.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No active schedules" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const due = schedules.filter((s) => cronMatchesNow(s.cron_expression));
      console.log(`[Autopilot Cron] ${due.length}/${schedules.length} schedules due to run`);

      // Run all due schedules in parallel, capture individual errors
      const results = await Promise.allSettled(
        due.map((s) => executeSchedule(s, supabaseAdmin))
      );

      // Log any failures
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === "rejected") {
          const err = (results[i] as PromiseRejectedResult).reason;
          console.error(`[Autopilot] Schedule ${due[i].id} failed:`, err?.message);
          await supabaseAdmin.from("autonomous_runs").insert({
            schedule_id: due[i].id,
            user_id: due[i].user_id,
            playbook_slug: due[i].playbook_slug,
            generated_content: null,
            run_status: "failed",
            error_message: err?.message || "Unknown error",
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, ran: due.length, total: schedules.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Provide schedule_id or trigger: cron" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error: any) {
    console.error("[Autopilot] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
