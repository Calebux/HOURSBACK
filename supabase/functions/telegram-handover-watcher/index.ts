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
  // Can be triggered by cron (no body) or manually
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const now = new Date();
  const currentTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
  const todayAbbr = DAY_ABBR[now.getUTCDay()];
  const todayDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // Find all bots with watcher enabled where shift_end_time matches current UTC hour
  // We run every hour so we check if current time is within the same hour as shift_end_time
  const currentHour = currentTime.substring(0, 2); // "18"

  const { data: bots, error: botsError } = await supabase
    .from("telegram_bots")
    .select("user_id, bot_token, shift_end_time, shift_days")
    .eq("handover_watcher_enabled", true);

  if (botsError || !bots?.length) {
    return new Response(JSON.stringify({ checked: 0 }), { status: 200 });
  }

  let notified = 0;

  for (const bot of bots) {
    const botHour = (bot.shift_end_time || "18:00").substring(0, 2);

    // Only process if current hour matches shift end hour
    if (botHour !== currentHour) continue;

    // Only process if today is a shift day
    const shiftDays: string[] = bot.shift_days || ["mon", "tue", "wed", "thu", "fri", "sat"];
    if (!shiftDays.includes(todayAbbr)) continue;

    const userId = bot.user_id;
    const botToken = bot.bot_token;

    // Get today's reminder state for this workspace
    const { data: checkRow } = await supabase
      .from("handover_checks")
      .select("id, reminded_chat_ids")
      .eq("user_id", userId)
      .eq("check_date", todayDate)
      .single();

    const alreadyRemindedIds: number[] = checkRow?.reminded_chat_ids || [];

    // Get all staff connections for this workspace
    const { data: connections } = await supabase
      .from("telegram_connections")
      .select("chat_id, first_name, role")
      .eq("user_id", userId);

    if (!connections?.length) continue;

    // Check who submitted a handover today
    const { data: todayHandovers } = await supabase
      .from("telegram_runs")
      .select("chat_id")
      .eq("user_id", userId)
      .eq("workflow_key", "handover")
      .eq("status", "success")
      .gte("created_at", `${todayDate}T00:00:00.000Z`)
      .lt("created_at", `${todayDate}T23:59:59.999Z`);

    const handoveredChatIds = new Set((todayHandovers || []).map((r: any) => r.chat_id));

    // Find staff who haven't submitted and haven't been reminded yet
    const toRemind = connections.filter(
      (c) => !handoveredChatIds.has(c.chat_id) && !alreadyRemindedIds.includes(c.chat_id)
    );

    if (!toRemind.length) continue;

    // Send reminders
    const newlyRemindedIds: number[] = [];
    for (const conn of toRemind) {
      await sendMessage(
        botToken,
        conn.chat_id,
        `⏰ *Shift Handover Reminder*\n\nHi ${conn.first_name || "there"}! Your shift is wrapping up and your handover log hasn't been submitted yet.\n\nType /handover to complete it now — it takes less than 2 minutes.`
      );
      newlyRemindedIds.push(conn.chat_id);
      notified++;
    }

    // Upsert the check record with updated reminded IDs
    const updatedIds = [...alreadyRemindedIds, ...newlyRemindedIds];
    await supabase.from("handover_checks").upsert(
      { user_id: userId, check_date: todayDate, reminded_chat_ids: updatedIds },
      { onConflict: "user_id,check_date" }
    );

    // Notify the owner if anyone was reminded
    if (newlyRemindedIds.length > 0) {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();

      if (RESEND_API_KEY && ownerProfile?.email) {
        const names = toRemind.map((c) => c.first_name || "Unknown").join(", ");
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "Hoursback <noreply@hoursback.xyz>",
            to: ownerProfile.email,
            subject: `⏰ Handover reminder sent to ${newlyRemindedIds.length} staff member${newlyRemindedIds.length > 1 ? "s" : ""}`,
            text: `These team members haven't submitted their shift handover yet: ${names}.\n\nA reminder was sent to them on Telegram at ${currentTime} UTC.`,
          }),
        });
      }
    }
  }

  return new Response(JSON.stringify({ notified }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
