import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUSINESS_TIME_ZONE = Deno.env.get("BUSINESS_TIME_ZONE") || "Africa/Lagos";

const DAY_ABBR: Record<number, string> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get("Authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return bearer.length > 0 && bearer === SUPABASE_SERVICE_ROLE_KEY;
}

async function sendMessage(botToken: string, chatId: number, text: string): Promise<boolean> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    console.error("Telegram summary send failed:", res.status, await res.text());
    return false;
  }
  return true;
}

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const weekday = get("weekday").slice(0, 3).toLowerCase();
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    hour: get("hour"),
    weekday,
  };
}

function entryDateKey(entry: { sale_date?: string | null; created_at?: string | null }) {
  const raw = entry.sale_date || entry.created_at;
  if (!raw) return "";
  return zonedParts(new Date(raw)).dateKey;
}

serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const now = new Date();
  const today = zonedParts(now);
  const currentHour = today.hour;
  const todayAbbr = today.weekday || DAY_ABBR[now.getUTCDay()];
  const todayDate = today.dateKey;
  const recentCutoff = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString();

  // Find all bots with summary enabled
  const { data: bots } = await supabase
    .from("telegram_bots")
    .select("user_id, bot_token, shift_end_time, shift_days, sales_summary_enabled")
    .eq("sales_summary_enabled", true);

  if (!bots?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  let sent = 0;

  for (const bot of bots) {
    // Only fire at shift_end_time hour
    const botHour = (bot.shift_end_time || "18:00").substring(0, 2);
    if (botHour !== currentHour) continue;

    // Only on shift days
    const shiftDays: string[] = bot.shift_days || ["mon", "tue", "wed", "thu", "fri", "sat"];
    if (!shiftDays.includes(todayAbbr)) continue;

    // Dedup — skip if already sent today
    const { data: alreadySent } = await supabase
      .from("sales_summary_checks")
      .select("id")
      .eq("user_id", bot.user_id)
      .eq("check_date", todayDate)
      .maybeSingle();

    if (alreadySent) continue;

    // Get today's bot_entries for this workspace
    const { data: rawEntries } = await supabase
      .from("bot_entries")
      .select("entry_type, parsed_data, triggered_by, sale_date, created_at")
      .eq("user_id", bot.user_id)
      .or(`created_at.gte.${recentCutoff},sale_date.gte.${todayDate}`);

    const entries = (rawEntries ?? []).filter((entry) => entryDateKey(entry) === todayDate);

    // Find manager connections to message
    const { data: managers } = await supabase
      .from("telegram_connections")
      .select("chat_id")
      .eq("user_id", bot.user_id)
      .eq("role", "manager");

    if (!managers?.length) continue;

    // Build summary
    const sales    = entries.filter(e => e.entry_type === "sale");
    const expenses = entries.filter(e => e.entry_type === "expense");

    const totalSales    = sales.reduce((s, e) => s + (e.parsed_data?.total ?? 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.parsed_data?.total ?? 0), 0);
    const netRecordedMovement = totalSales - totalExpenses;

    // Top 5 items by total
    const itemTotals: Record<string, number> = {};
    for (const e of sales) {
      const item = e.parsed_data?.item as string | null;
      if (item) itemTotals[item] = (itemTotals[item] ?? 0) + (e.parsed_data?.total ?? 0);
    }
    const topItems = Object.entries(itemTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Staff activity
    const staffCounts: Record<string, number> = {};
    for (const e of (entries ?? [])) {
      const name = (e.triggered_by as string | null) ?? "Unknown";
      staffCounts[name] = (staffCounts[name] ?? 0) + 1;
    }
    const staffLines = Object.entries(staffCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `• ${name}: ${count}`)
      .join("\n");

    const dateLabel = now.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "short", year: "numeric",
      timeZone: BUSINESS_TIME_ZONE,
    });

    const fmt = (n: number) => `₦${n.toLocaleString("en-US")}`;

    let message: string;

    if (!entries?.length) {
      message = `Daily Sales Summary\n${dateLabel}\n\nNo entries logged today.\n\nRemind your team to use /log or send a photo of the sales book.`;
    } else {
      const lines = [
        `Daily Sales Summary`,
        `${dateLabel}`,
        ``,
        `Sales: ${fmt(totalSales)} (${sales.length} ${sales.length === 1 ? "entry" : "entries"})`,
        `Expenses: ${fmt(totalExpenses)} (${expenses.length})`,
        `Net recorded movement: ${fmt(netRecordedMovement)}`,
      ];

      if (topItems.length) {
        lines.push(``, `Top items:`);
        for (const [item, total] of topItems) {
          lines.push(`• ${item} — ${fmt(total)}`);
        }
      }

      if (staffLines) {
        lines.push(``, `Logged by:`, staffLines);
      }

      lines.push(``, `View full log: https://www.hoursback.xyz/data-log`);
      message = lines.join("\n");
    }

    // Send to all managers
    let delivered = 0;
    for (const mgr of managers) {
      const ok = await sendMessage(bot.bot_token, mgr.chat_id as number, message);
      if (ok) delivered++;
    }

    if (delivered === 0) continue;

    // Mark as sent
    await supabase.from("sales_summary_checks").insert({
      user_id: bot.user_id,
      check_date: todayDate,
    });

    sent++;
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
