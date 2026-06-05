import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DAY_ABBR: Record<number, string> = {
  0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
};

async function sendMessage(botToken: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const now = new Date();
  const currentHour = String(now.getUTCHours()).padStart(2, "0");
  const todayAbbr = DAY_ABBR[now.getUTCDay()];
  const todayDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // Day start / end in UTC for querying today's entries
  const dayStart = `${todayDate}T00:00:00.000Z`;
  const dayEnd   = `${todayDate}T23:59:59.999Z`;

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
    const { data: entries } = await supabase
      .from("bot_entries")
      .select("entry_type, parsed_data, triggered_by")
      .eq("user_id", bot.user_id)
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd);

    // Find manager connections to message
    const { data: managers } = await supabase
      .from("telegram_connections")
      .select("chat_id")
      .eq("user_id", bot.user_id)
      .eq("role", "manager");

    if (!managers?.length) continue;

    // Build summary
    const sales    = (entries ?? []).filter(e => e.entry_type === "sale");
    const expenses = (entries ?? []).filter(e => e.entry_type === "expense");

    const totalSales    = sales.reduce((s, e) => s + (e.parsed_data?.total ?? 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.parsed_data?.total ?? 0), 0);
    const net           = totalSales - totalExpenses;

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
    });

    const fmt = (n: number) => `₦${n.toLocaleString("en-US")}`;

    let message: string;

    if (!entries?.length) {
      message = `📊 *Daily Sales Summary*\n_${dateLabel}_\n\nNo entries logged today.\n\nRemind your team to use /log or send a photo of the sales book.`;
    } else {
      const lines = [
        `📊 *Daily Sales Summary*`,
        `_${dateLabel}_`,
        ``,
        `💰 Sales: *${fmt(totalSales)}* (${sales.length} ${sales.length === 1 ? "entry" : "entries"})`,
        `💸 Expenses: ${fmt(totalExpenses)} (${expenses.length})`,
        `📈 Net: *${fmt(net)}*`,
      ];

      if (topItems.length) {
        lines.push(``, `*Top items:*`);
        for (const [item, total] of topItems) {
          lines.push(`• ${item} — ${fmt(total)}`);
        }
      }

      if (staffLines) {
        lines.push(``, `*Logged by:*`, staffLines);
      }

      lines.push(``, `_View full log → hoursback.xyz/data-log_`);
      message = lines.join("\n");
    }

    // Send to all managers
    for (const mgr of managers) {
      await sendMessage(bot.bot_token, mgr.chat_id as number, message);
    }

    // Mark as sent
    await supabase.from("sales_summary_checks").insert({
      user_id: bot.user_id,
      check_date: todayDate,
    });

    sent++;
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
