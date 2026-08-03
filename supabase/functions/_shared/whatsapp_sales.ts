// Staff-line operations: closeout, sales log, directory/catalog, internal contacts.
import Anthropic from "npm:@anthropic-ai/sdk";
import { appendGoogleSheetRows, getGoogleAccessToken, googleTokenConnected } from "./google_sheets.ts";
import { ParsedMessage, logAnalyticsEvent, normalizePhone } from "./whatsapp_core.ts";
import { compactList, entryDate } from "./whatsapp_reports.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

export function moneyFromLabel(text: string, labels: string[]) {
  const labelPattern = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = text.match(new RegExp(`(?:${labelPattern})(?:\\s+(?:total|amount|at hand))?\\s*[:=\\-]?\\s*(?:₦|ngn|naira)?\\s*([0-9][0-9,]*(?:\\.\\d+)?)`, "i"));
  if (!match) return null;
  return Number(match[1].replace(/,/g, ""));
}

export function parseCloseoutFallback(text: string) {
  return {
    cash_total: moneyFromLabel(text, ["cash", "cash at hand", "cash total"]),
    pos_total: moneyFromLabel(text, ["pos", "card", "terminal"]),
    transfer_total: moneyFromLabel(text, ["transfer", "bank", "bank transfer"]),
    expenses_total: moneyFromLabel(text, ["expenses", "expense", "spent"]),
    notes: null,
  };
}

export async function parseCloseoutWithAI(text: string) {
  const fallback = parseCloseoutFallback(text);
  if (!ANTHROPIC_API_KEY) return fallback;

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const parseRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 180,
      messages: [{
        role: "user",
        content: `Extract end-of-day closeout totals from this WhatsApp message: "${text}"\nReturn JSON only, no explanation:\n{"cash_total":number|null,"pos_total":number|null,"transfer_total":number|null,"expenses_total":number|null,"notes":string|null}\nUse null when a total is not mentioned. Do not invent numbers.`,
      }],
    });
    const raw = (parseRes.content[0] as { text: string }).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return { ...fallback, ...JSON.parse(jsonMatch[0]) };
  } catch (err) {
    console.error("WhatsApp closeout parse error:", err);
  }

  return fallback;
}

export function closeoutPrompt() {
  return [
    "Closeout started.",
    "Reply with today's totals like:",
    "Cash 39000, POS 12000, Transfer 34000, Expenses 7500",
    "Send cancel closeout to stop.",
  ].join("\n");
}

export function getTodayStart(timeZone = "Africa/Lagos") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(value.year);
  const month = Number(value.month);
  const day = Number(value.day);
  if (timeZone === "Africa/Lagos") {
    return new Date(Date.UTC(year, month - 1, day, -1, 0, 0));
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

export async function getDailyTotals(supabase: any, userId: string, timeZone?: string) {
  const start = getTodayStart(timeZone);
  const { data: entries } = await supabase
    .from("bot_entries")
    .select("entry_type, parsed_data, sale_date, created_at")
    .eq("user_id", userId)
    .or(`created_at.gte.${start.toISOString()},sale_date.gte.${start.toISOString()}`);

  const rows = (entries || []).filter((entry: any) => entryDate(entry) >= start);
  const sales = rows
    .filter((e: any) => e.entry_type === "sale")
    .reduce((sum: number, e: any) => sum + Number(e.parsed_data?.total || 0), 0);
  const refunds = rows
    .filter((e: any) => e.entry_type === "refund")
    .reduce((sum: number, e: any) => sum + Number(e.parsed_data?.total || 0), 0);
  return {
    entries: rows.length,
    sales: sales - refunds,
    grossSales: sales,
    refunds,
    expenses: rows
      .filter((e: any) => e.entry_type === "expense")
      .reduce((sum: number, e: any) => sum + Number(e.parsed_data?.total || 0), 0),
  };
}

export function classifyCloseoutVariance(variance: number) {
  if (Math.abs(variance) < 1) return "balanced";
  return variance < 0 ? "short" : "over";
}

export async function findActiveCloseoutSession(supabase: any, userId: string, fromNumber?: string) {
  if (!fromNumber) return null;
  const { data } = await supabase
    .from("kapso_closeout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("from_number", fromNumber)
    .eq("status", "awaiting_closeout")
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(1);

  return data?.[0] || null;
}

export async function saveCloseout(supabase: any, connection: any, message: ParsedMessage, text: string) {
  const parsed = await parseCloseoutWithAI(text);
  const values = [parsed.cash_total, parsed.pos_total, parsed.transfer_total, parsed.expenses_total];
  if (!values.some((value) => typeof value === "number" && Number.isFinite(value))) {
    return { saved: false, reply: `I couldn't find the closeout totals.\n\n${closeoutPrompt()}` };
  }

  const cashTotal = Number(parsed.cash_total || 0);
  const posTotal = Number(parsed.pos_total || 0);
  const transferTotal = Number(parsed.transfer_total || 0);
  const expensesTotal = Number(parsed.expenses_total || 0);
  const actualCollectedTotal = cashTotal + posTotal + transferTotal;
  const totals = await getDailyTotals(supabase, connection.user_id, connection.business_timezone);
  const variance = actualCollectedTotal - totals.sales;
  const status = classifyCloseoutVariance(variance);

  await supabase.from("kapso_closeouts").insert({
    user_id: connection.user_id,
    connection_id: connection.id,
    from_number: message.from || null,
    staff_name: message.contactName || message.from || "WhatsApp",
    expected_sales_total: totals.sales,
    expected_expenses_total: totals.expenses,
    cash_total: cashTotal,
    pos_total: posTotal,
    transfer_total: transferTotal,
    expenses_total: expensesTotal,
    actual_collected_total: actualCollectedTotal,
    variance_total: variance,
    status,
    notes: parsed.notes || null,
    raw_text: text,
  });

  if (message.from) {
    await supabase
      .from("kapso_closeout_sessions")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("user_id", connection.user_id)
      .eq("from_number", message.from)
      .eq("status", "awaiting_closeout");
  }

  const statusLine = status === "balanced"
    ? "Balanced."
    : status === "short"
      ? `Short by ₦${Math.abs(variance).toLocaleString()}. Review needed.`
      : `Over by ₦${Math.abs(variance).toLocaleString()}. Review needed.`;

  return {
    saved: true,
    reply: [
      "Day closed.",
      `Logged sales: ₦${totals.sales.toLocaleString()}`,
      `Collected: ₦${actualCollectedTotal.toLocaleString()} (cash ₦${cashTotal.toLocaleString()}, POS ₦${posTotal.toLocaleString()}, transfer ₦${transferTotal.toLocaleString()})`,
      `Expenses reported: ₦${expensesTotal.toLocaleString()}`,
      statusLine,
    ].join("\n"),
  };
}

export async function parseEntryWithAI(text: string) {
  const fallbackEntries = parseEntriesFallback(text);
  if (!ANTHROPIC_API_KEY) {
    return fallbackEntries;
  }

  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const parseRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      messages: [{
        role: "user",
        content: `Extract spreadsheet-ready business ledger rows from this WhatsApp message: "${text}"
Return JSON only, no explanation:
{"entries":[{"entry_type":"sale"|"expense"|"refund"|"note","item":string|null,"qty":number|null,"unit_price":number|null,"total":number|null,"customer":string|null,"payment_method":"cash"|"transfer"|"pos"|"card"|"mixed"|null,"shop":string|null,"notes":string|null}]}
Rules:
- If multiple products/services are mentioned, return one entry per item.
- Compute total = qty * unit_price when possible.
- Nigerian shorthand: 10k means 10000, 5k means 5000.
- "3 gowns, 2 fittings and 3 shoes; gowns were 10k each..." means 3 separate sale rows.
- Use entry_type "refund" for returned/refunded/reversed sales. Keep total positive; Hoursback subtracts it in reports.
- If a shop/branch/location is mentioned, put it in shop.
- A person before "sold", like "Ada sold..." or "John at Lekki sold...", is staff/sales rep context, not the customer. Do not put that person in customer.
- Only fill customer when the message explicitly says customer, client, or buyer name.
- Use note only when there is no sale/expense amount or quantity.`,
      }],
    });
    const raw = (parseRes.content[0] as { text: string }).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return normalizeParsedEntries(parsed, text, fallbackEntries);
    }
  } catch (err) {
    console.error("WhatsApp parse error:", err);
  }

  return fallbackEntries;
}

export function parseMoneyValue(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[,₦\s]/g, "");
  const match = normalized.match(/^([0-9]+(?:\.[0-9]+)?)(k)?$/);
  if (!match) return null;
  return Number(match[1]) * (match[2] ? 1000 : 1);
}

export function singularItem(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ").toLowerCase();
  if (cleaned.endsWith("ies")) return `${cleaned.slice(0, -3)}y`;
  if (cleaned.endsWith("s") && !cleaned.endsWith("ss")) return cleaned.slice(0, -1);
  return cleaned;
}

export function inferPaymentMethod(text: string) {
  const lower = text.toLowerCase();
  const methods = [
    lower.includes("transfer") || lower.includes("bank") ? "transfer" : null,
    lower.includes("pos") ? "pos" : null,
    lower.includes("cash") ? "cash" : null,
    lower.includes("card") ? "card" : null,
  ].filter(Boolean);
  return methods.length > 1 ? "mixed" : methods[0] || null;
}

export function inferShop(text: string) {
  const match = text.match(/\b(?:shop|branch|store|location)\s*[:=-]?\s*([a-z0-9\s'-]{2,40})(?:[.,;]|$)/i)
    || text.match(/\b(?:at|in)\s+([a-z0-9\s'-]{2,30})\s+(?:shop|branch|store)\b/i);
  return match?.[1]?.trim() || null;
}

export function inferStaffFromSalesText(text: string) {
  const match = text.match(/^\s*([a-z][a-z\s'-]{1,40}?)(?:\s+(?:at|in)\s+[a-z0-9\s'-]{2,40})?\s+sold\b/i);
  if (!match) return null;
  const name = match[1]
    .replace(/\b(i|we|they|he|she|customer|client|buyer)\b/gi, "")
    .trim()
    .replace(/\s+/g, " ");
  return name.length >= 2 ? name : null;
}

export function parseEntriesFallback(text: string) {
  const entries: any[] = [];
  const paymentMethod = inferPaymentMethod(text);
  const shop = inferShop(text);
  const isRefund = /\b(refund|refunded|return|returned|reversal|reverse)\b/i.test(text);
  const quantityPattern = /(\d+(?:\.\d+)?)\s+([a-z][a-z\s-]*?)(?=\s*(?:,|;|\.|\band\b|\bwere\b|\bwas\b|\bat\b|\bfor\b|$))/gi;
  const pricePattern = /([a-z][a-z\s-]*?)\s+(?:were|was|at|for)\s*(?:₦|ngn|naira)?\s*([0-9][0-9,]*(?:\.\d+)?\s*k?)\s*(?:each|per)?/gi;
  const quantities = new Map<string, { item: string; qty: number }>();
  const prices = new Map<string, number>();
  let match: RegExpExecArray | null;

  while ((match = quantityPattern.exec(text)) !== null) {
    const qty = Number(match[1]);
    const rawItem = singularItem(match[2].replace(/\b(the|were|was|at|for)\b/gi, "").trim());
    if (rawItem && Number.isFinite(qty)) quantities.set(rawItem, { item: rawItem, qty });
  }
  while ((match = pricePattern.exec(text)) !== null) {
    const rawItem = singularItem(match[1].replace(/\b(the|and)\b/gi, "").trim());
    const price = parseMoneyValue(match[2]);
    if (rawItem && price != null) prices.set(rawItem, price);
  }

  for (const { item, qty } of quantities.values()) {
    const unitPrice = prices.get(item) || null;
    entries.push({
      entry_type: unitPrice ? (isRefund ? "refund" : "sale") : "note",
      item,
      qty,
      unit_price: unitPrice,
      total: unitPrice ? qty * unitPrice : null,
      customer: null,
      payment_method: paymentMethod,
      shop,
      notes: unitPrice ? null : text,
    });
  }

  if (!entries.length) {
    entries.push({ entry_type: "note", item: null, qty: null, unit_price: null, total: null, customer: null, payment_method: paymentMethod, shop, notes: text });
  }

  return entries;
}

export function normalizeParsedEntries(parsed: any, rawText: string, fallbackEntries: any[]) {
  const isRefundText = /\b(refund|refunded|return|returned|reversal|reverse)\b/i.test(rawText);
  const sourceEntries = Array.isArray(parsed?.entries) ? parsed.entries : [parsed];
  const entries = sourceEntries
    .filter((entry: any) => entry && typeof entry === "object")
    .map((entry: any) => {
      const qty = entry.qty == null ? null : Number(entry.qty);
      const unitPrice = entry.unit_price == null ? null : Number(entry.unit_price);
      const total = entry.total == null && qty != null && unitPrice != null
        ? qty * unitPrice
        : entry.total == null ? null : Number(entry.total);
      const normalizedType = ["sale", "expense", "refund", "note"].includes(entry.entry_type)
        ? entry.entry_type
        : (total ? (isRefundText ? "refund" : "sale") : "note");
      return {
        entry_type: isRefundText && normalizedType === "sale" ? "refund" : normalizedType,
        item: entry.item || null,
        qty: Number.isFinite(qty) ? qty : null,
        unit_price: Number.isFinite(unitPrice) ? unitPrice : null,
        total: Number.isFinite(total) ? total : null,
        customer: entry.customer || null,
        payment_method: entry.payment_method || inferPaymentMethod(rawText),
        shop: entry.shop || inferShop(rawText),
        notes: entry.notes || null,
      };
    });

  const usefulEntries = entries.filter((entry: any) => entry.entry_type !== "note" || entry.total || entry.item);
  return usefulEntries.length ? usefulEntries : fallbackEntries;
}

export function splitDirectoryNames(value: string) {
  return value
    .split(/,|\n|;|\band\b/i)
    .map((name) => name.trim().replace(/^[-•]\s*/, ""))
    .filter((name) => name.length >= 2 && name.length <= 80);
}

export function parseDirectorySetup(text: string) {
  const trimmed = text.trim();
  const direct = trimmed.match(/^\/?(staff|shops?)\s*[:=-]\s*(.+)$/i);
  if (direct) {
    return {
      type: /^shop/i.test(direct[1]) ? "shop" : "staff",
      names: splitDirectoryNames(direct[2]),
    };
  }
  const natural = trimmed.match(/\b(?:add|set|register)\s+(staff|sales reps?|shops?|branches?)\s*[:=-]?\s*(.+)$/i);
  if (!natural) return null;
  return {
    type: /shop|branch/i.test(natural[1]) ? "shop" : "staff",
    names: splitDirectoryNames(natural[2]),
  };
}

export function parseCatalogLines(text: string) {
  const cleaned = text
    .trim()
    .replace(/^\/?(catalog|items?|products?|stock)\s*[:=-]\s*/i, "")
    .replace(/^\b(add|set|update)\s+(catalog|items?|products?|stock)\s*[:=-]?\s*/i, "")
    .replace(/^\/?(restock|price)\s+/i, "");
  return cleaned
    .split(/\n|;/)
    .flatMap((line) => line.split(/\s*,\s*(?=[a-z][a-z\s'-]+\s+(?:₦|ngn|naira|\d))/i))
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseCatalogItemLine(line: string) {
  const priceMatch = line.match(/\b(?:price|at|for)?\s*(?:₦|ngn|naira)?\s*([0-9][0-9,]*(?:\.\d+)?\s*k?)\s*(?:each|per)?\b/i);
  const stockMatch = line.match(/\b(?:stock|qty|quantity|count)\s*[:=-]?\s*([+-]?[0-9]+(?:\.\d+)?)\b/i);
  const reorderMatch = line.match(/\b(?:reorder|low\s*stock|low|minimum|min)\s*[:=-]?\s*([0-9]+(?:\.\d+)?)\b/i);
  const categoryMatch = line.match(/\b(?:category|cat)\s*[:=-]?\s*([a-z0-9\s'-]{2,40})(?:$|\s+(?:stock|qty|quantity|reorder|low|minimum|min|price)\b)/i);
  const aliasMatch = line.match(/\b(?:aliases?|aka)\s*[:=-]?\s*([a-z0-9\s,'-]{2,80})$/i);
  const firstMarker = [priceMatch?.index, stockMatch?.index, reorderMatch?.index, categoryMatch?.index, aliasMatch?.index]
    .filter((index) => typeof index === "number")
    .sort((a, b) => Number(a) - Number(b))[0];
  const name = (firstMarker == null ? line : line.slice(0, Number(firstMarker)))
    .replace(/\b(price|stock|qty|quantity|count|reorder|low|minimum|min|category|cat|aliases?|aka)\b.*$/i, "")
    .trim()
    .replace(/\s+/g, " ");
  if (!name || name.length < 2) return null;
  const explicitPrice = priceMatch
    && (/\b(price|at|for)\b/i.test(priceMatch[0])
      || /\b(each|per)\b/i.test(priceMatch[0])
      || stockMatch?.index == null
      || Number(priceMatch.index) < Number(stockMatch.index));
  return {
    name,
    aliases: [name, ...splitDirectoryNames(aliasMatch?.[1] || "")],
    category: categoryMatch?.[1]?.trim() || null,
    unit_price: explicitPrice ? parseMoneyValue(priceMatch[1]) : null,
    stock_qty: stockMatch ? Number(stockMatch[1]) : null,
    reorder_point: reorderMatch ? Number(reorderMatch[1]) : null,
  };
}

export function parseCatalogSetup(text: string) {
  return parseCatalogLines(text)
    .map(parseCatalogItemLine)
    .filter(Boolean) as any[];
}

export async function handleDirectorySetup(supabase: any, userId: string, text: string) {
  const parsed = parseDirectorySetup(text);
  if (!parsed?.names.length) {
    return "Send staff or shops like:\nstaff: Ada, Tola\nshops: Lekki, Ikeja";
  }
  const table = parsed.type === "shop" ? "business_shops" : "business_staff";
  const rows = parsed.names.map((name) => ({
    user_id: userId,
    name,
    aliases: [name],
    active: true,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "user_id,name" });
  if (error) throw error;
  return `${parsed.type === "shop" ? "Shops" : "Staff"} saved: ${parsed.names.join(", ")}`;
}

export async function handleCatalogSetup(supabase: any, userId: string, text: string) {
  const parsed = parseCatalogSetup(text);
  if (!parsed.length) {
    return [
      "Send catalog items like:",
      "catalog: gowns 10000 stock 20 reorder 5",
      "catalog: fittings 5000; shoes 23000 stock 12",
    ].join("\n");
  }
  const rows = parsed.map((item: any) => ({
    user_id: userId,
    name: item.name,
    aliases: item.aliases?.length ? item.aliases : [item.name],
    category: item.category,
    unit_price: item.unit_price,
    stock_qty: item.stock_qty,
    reorder_point: item.reorder_point,
    track_stock: item.stock_qty != null || item.reorder_point != null,
    active: true,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("business_catalog_items").upsert(rows, { onConflict: "user_id,name" });
  if (error) throw error;
  return `Catalog saved: ${parsed.map((item: any) => item.name).join(", ")}`;
}

export async function loadBusinessDirectory(supabase: any, userId: string) {
  const [{ data: staff }, { data: shops }] = await Promise.all([
    supabase.from("business_staff").select("name,aliases,default_shop").eq("user_id", userId).eq("active", true).order("name"),
    supabase.from("business_shops").select("name,aliases").eq("user_id", userId).eq("active", true).order("name"),
  ]);
  return { staff: staff || [], shops: shops || [] };
}

export async function loadCatalogItems(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("business_catalog_items")
    .select("id,name,aliases,unit_price,stock_qty,reorder_point,track_stock,active")
    .eq("user_id", userId)
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data || [];
}

export async function loadInternalContact(supabase: any, userId: string, fromNumber?: string | null) {
  const raw = String(fromNumber || "").trim();
  const phone = normalizePhone(fromNumber);
  const candidates = [...new Set([phone, raw].filter(Boolean))];
  if (!candidates.length) return null;
  const { data, error } = await supabase
    .from("business_internal_contacts")
    .select("*")
    .eq("user_id", userId)
    .in("phone_number", candidates)
    .eq("active", true)
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

export async function internalContactsConfigured(supabase: any, userId: string) {
  const { count, error } = await supabase
    .from("business_internal_contacts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("active", true);
  if (error) throw error;
  return Number(count || 0) > 0;
}

export async function recordPendingInternalSender(supabase: any, userId: string, message: ParsedMessage, text: string) {
  const senderId = String(message.from || "").trim();
  if (!senderId) return;
  const normalizedId = normalizePhone(senderId);
  const { error } = await supabase
    .from("business_pending_internal_senders")
    .upsert({
      user_id: userId,
      sender_id: senderId,
      normalized_id: normalizedId || null,
      contact_name: message.contactName || null,
      last_message: text.slice(0, 240),
      status: "pending",
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,sender_id" });
  if (error) {
    console.error("Failed to record pending internal sender", error);
  }
}

export function unauthorizedInternalReply(hasContacts: boolean) {
  return hasContacts
    ? "This WhatsApp number is not authorized for internal operations. Ask the owner to approve it in Team & Outlets."
    : "Internal operations are locked. Add authorized contacts in Hoursback > Operations > Team & Outlets before using this WhatsApp number.";
}

export function permissionDeniedReply(action: string) {
  return `You are not authorized to ${action}. Ask the owner to update your permission in Team & Outlets.`;
}

export function internalWelcomeReply(contact: any) {
  const name = String(contact?.name || "there").replace(/\s*\([^)]*\)\s*$/g, "").trim() || "there";
  const capabilities = [
    contact?.can_log_sales ? "log sales, expenses, and refunds" : null,
    contact?.can_query_reports ? "ask for sales totals and reports" : null,
    contact?.can_closeout ? "run end-of-day closeout" : null,
    contact?.can_manage_setup ? "manage staff and outlet setup" : null,
  ].filter(Boolean);
  const examples = [
    contact?.can_log_sales ? "Ada at Lekki sold 3 gowns 10000 each transfer" : null,
    contact?.can_query_reports ? "How much did Lekki sell today?" : null,
    contact?.can_closeout ? "closeout" : null,
    contact?.can_manage_setup ? "staff: Ada, Tola" : null,
  ].filter(Boolean);
  return [
    `Hi ${name}. Welcome to Hoursback operations.`,
    capabilities.length
      ? `You can ${capabilities.join("; ")}.`
      : "Your number is authorized, but no actions are enabled yet.",
    examples.length ? `Try: ${examples.slice(0, 2).join(" | ")}` : "Ask the owner to enable permissions in Team & Outlets.",
  ].join("\n");
}

export function directoryLabels(items: any[]) {
  return items.flatMap((item) => [item.name, ...(item.aliases || [])]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map((value) => ({ value, item })))
    .sort((a, b) => b.value.length - a.value.length);
}

export function matchDirectoryItems(text: string, items: any[]) {
  const lower = ` ${text.toLowerCase()} `;
  const matched: any[] = [];
  for (const label of directoryLabels(items)) {
    if (matched.includes(label.item)) continue;
    const escaped = label.value.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(lower)) matched.push(label.item);
  }
  return matched;
}

export function matchDirectoryItem(text: string, items: any[]) {
  return matchDirectoryItems(text, items)[0] || null;
}

// Every name a directory entry can be referred to by, lowercased — used to match
// a question against configured shops/staff/items, and to match stored rows back.
export function directoryItemLabels(item: any) {
  return [item?.name, ...(item?.aliases || [])]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
}

export function shouldRequireContext(directory: { staff: any[]; shops: any[] }, entries: any[]) {
  const materialRows = entries.filter((entry: any) => entry.entry_type !== "note" || entry.total || entry.item);
  return {
    staff: directory.staff.length > 1 && materialRows.some((entry: any) => !entry.staff),
    shop: directory.shops.length > 1 && materialRows.some((entry: any) => !entry.shop),
  };
}

export function applyDirectoryContext(entries: any[], directory: { staff: any[]; shops: any[] }, text: string, fallbackStaff: string) {
  const lookupText = `${text} ${fallbackStaff || ""}`;
  const matchedStaff = matchDirectoryItem(lookupText, directory.staff);
  const inferredStaff = inferStaffFromSalesText(text);
  const matchedShop = matchDirectoryItem(lookupText, directory.shops) || (matchedStaff?.default_shop
    ? directory.shops.find((shop) => shop.name.toLowerCase() === String(matchedStaff.default_shop).toLowerCase())
    : null);
  return entries.map((entry: any) => {
    const staffName = entry.staff || matchedStaff?.name || inferredStaff || null;
    const customer = staffName && String(entry.customer || "").trim().toLowerCase() === String(staffName).trim().toLowerCase()
      ? null
      : entry.customer || null;
    return {
      ...entry,
      customer,
      staff: staffName,
      shop: entry.shop || matchedShop?.name || null,
      triggered_by: staffName || fallbackStaff,
    };
  });
}

export function applyCatalogContext(entries: any[], catalogItems: any[]) {
  return entries.map((entry: any) => {
    const matched = entry.item ? matchDirectoryItem(String(entry.item), catalogItems) : null;
    if (!matched) return entry;
    const qty = entry.qty == null ? null : Number(entry.qty);
    const unitPrice = entry.unit_price == null && matched.unit_price != null
      ? Number(matched.unit_price)
      : entry.unit_price == null ? null : Number(entry.unit_price);
    const total = entry.total == null && qty != null && unitPrice != null
      ? qty * unitPrice
      : entry.total;
    return {
      ...entry,
      item: matched.name || entry.item,
      unit_price: Number.isFinite(unitPrice) ? unitPrice : entry.unit_price,
      total: Number.isFinite(Number(total)) ? Number(total) : entry.total,
      catalog_item_id: matched.id,
    };
  });
}

export async function findActiveSalesLogSession(supabase: any, userId: string, fromNumber?: string) {
  if (!fromNumber) return null;
  const { data } = await supabase
    .from("kapso_sales_log_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("from_number", fromNumber)
    .eq("status", "awaiting_context")
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(1);
  return data?.[0] || null;
}

export async function savePendingSalesLogSession(
  supabase: any,
  connection: any,
  message: ParsedMessage,
  entries: any[],
  missingFields: string[],
) {
  if (!message.from) return;
  await supabase
    .from("kapso_sales_log_sessions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("user_id", connection.user_id)
    .eq("from_number", message.from)
    .eq("status", "awaiting_context");

  await supabase
    .from("kapso_sales_log_sessions")
    .insert({
      user_id: connection.user_id,
      connection_id: connection.id,
      from_number: message.from,
      pending_rows: entries,
      missing_fields: missingFields,
      status: "awaiting_context",
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
}

export function contextPrompt(missingFields: string[], directory: { staff: any[]; shops: any[] }) {
  const lines = ["I can log this, but I need context first."];
  if (missingFields.includes("staff")) {
    lines.push(`Who made the sale? Reply with: ${directory.staff.map((staff) => staff.name).join(", ")}`);
  }
  if (missingFields.includes("shop")) {
    lines.push(`Which shop? Reply with: ${directory.shops.map((shop) => shop.name).join(", ")}`);
  }
  return lines.join("\n");
}

export async function persistSalesLogEntries(supabase: any, connection: any, message: ParsedMessage, entries: any[], logText: string) {
  const batchId = crypto.randomUUID();
  const rows = entries.map((parsed: any) => {
    const staffName = parsed.triggered_by || parsed.staff || message.contactName || message.from || "WhatsApp";
    return {
      user_id: connection.user_id,
      chat_id: 0,
      triggered_by: staffName,
      role: "staff",
      raw_text: logText,
      entry_type: parsed.entry_type || "sale",
      parsed_data: {
        ...parsed,
        staff: staffName,
        currency: "NGN",
        batch_id: batchId,
        connection_type: connection.connection_type || "internal",
      },
      source: "whatsapp_text",
      channel: "whatsapp",
    };
  });
  const { data: insertedRows, error: insertError } = await supabase
    .from("bot_entries")
    .insert(rows)
    .select("*");
  if (insertError) throw insertError;
  const stockNotes = await recordStockMovementsForEntries(supabase, connection.user_id, insertedRows || rows);
  await appendEntriesToGoogleSheetIfConfigured(supabase, connection.user_id, insertedRows || rows);
  await logAnalyticsEvent(supabase, connection.user_id, "sales_log_entry_created", {
    source: "whatsapp_text",
    entry_type: rows.length === 1 ? rows[0].entry_type : "batch",
    row_count: rows.length,
    total: entries.reduce((sum: number, entry: any) => sum + Number(entry.total || 0), 0),
    has_staff: entries.some((entry: any) => Boolean(entry.staff || entry.triggered_by)),
    has_shop: entries.some((entry: any) => Boolean(entry.shop)),
  });

  const salesTotal = entries
    .filter((entry: any) => entry.entry_type === "sale")
    .reduce((sum: number, entry: any) => sum + Number(entry.total || 0), 0);
  const expenseTotal = entries
    .filter((entry: any) => entry.entry_type === "expense")
    .reduce((sum: number, entry: any) => sum + Number(entry.total || 0), 0);
  const refundTotal = entries
    .filter((entry: any) => entry.entry_type === "refund")
    .reduce((sum: number, entry: any) => sum + Number(entry.total || 0), 0);
  const incompleteItems = entries
    .filter((entry: any) => entry.entry_type === "note" && entry.item && entry.qty && !entry.total)
    .map((entry: any) => `${entry.item}${entry.qty ? ` x ${entry.qty}` : ""}`);
  const lines = [`Logged ${rows.length} row${rows.length === 1 ? "" : "s"} from WhatsApp.`];
  for (const entry of entries.slice(0, 5)) {
    const label = entry.entry_type === "expense" ? "Expense" : entry.entry_type === "refund" ? "Refund" : entry.entry_type === "note" ? "Note" : "Sale";
    const item = entry.item ? `${entry.item}${entry.qty ? ` x ${entry.qty}` : ""}` : label;
    const amount = entry.total ? ` — ₦${Number(entry.total).toLocaleString()}` : "";
    const context = [entry.staff, entry.shop].filter(Boolean).join(" / ");
    lines.push(`${label}: ${item}${amount}${context ? ` (${context})` : ""}`);
  }
  if (entries.length > 5) lines.push(`+${entries.length - 5} more rows`);
  if (salesTotal) lines.push(`Sales total: ₦${salesTotal.toLocaleString()}`);
  if (expenseTotal) lines.push(`Expenses total: ₦${expenseTotal.toLocaleString()}`);
  if (refundTotal) lines.push(`Refunds total: ₦${refundTotal.toLocaleString()}`);
  if (stockNotes.length) lines.push(...stockNotes);
  if (incompleteItems.length) {
    lines.push(`Missing amount for: ${compactList(incompleteItems)}.`);
    lines.push("Reply with the prices, for example: “gowns 10000 each, fittings 5000 each”.");
  }
  return lines.join("\n");
}

export async function recordStockMovementsForEntries(supabase: any, userId: string, rows: any[]) {
  const notes: string[] = [];
  for (const row of rows || []) {
    const parsed = row.parsed_data || {};
    const catalogItemId = parsed.catalog_item_id;
    const qty = parsed.qty == null ? null : Number(parsed.qty);
    if (!catalogItemId || !qty || !["sale", "refund"].includes(row.entry_type)) continue;
    const delta = row.entry_type === "refund" ? qty : -qty;
    const { data: item, error: itemError } = await supabase
      .from("business_catalog_items")
      .select("id,name,stock_qty,reorder_point,track_stock")
      .eq("user_id", userId)
      .eq("id", catalogItemId)
      .eq("active", true)
      .maybeSingle();
    if (itemError || !item?.track_stock) continue;
    const nextQty = Number(item.stock_qty || 0) + delta;
    const { error: updateError } = await supabase
      .from("business_catalog_items")
      .update({ stock_qty: nextQty, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    if (updateError) {
      console.error("Stock update failed", updateError);
      continue;
    }
    await supabase.from("business_stock_movements").insert({
      user_id: userId,
      catalog_item_id: item.id,
      movement_type: row.entry_type,
      qty_delta: delta,
      source_entry_id: row.id || null,
      notes: `From WhatsApp Sales Log: ${row.raw_text || ""}`.slice(0, 240),
    });
    if (item.reorder_point != null && nextQty <= Number(item.reorder_point)) {
      notes.push(`Low stock: ${item.name} is now ${nextQty.toLocaleString()}.`);
    }
  }
  return notes;
}

export async function handlePendingSalesLogSession(supabase: any, connection: any, message: ParsedMessage, text: string, session: any) {
  if (/\b(cancel|stop)\b/i.test(text)) {
    await supabase
      .from("kapso_sales_log_sessions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", session.id);
    return "Sales log cancelled.";
  }
  const directory = await loadBusinessDirectory(supabase, connection.user_id);
  const catalogItems = await loadCatalogItems(supabase, connection.user_id);
  const fallbackStaff = message.contactName || message.from || "WhatsApp";
  const entries = applyCatalogContext(
    applyDirectoryContext(Array.isArray(session.pending_rows) ? session.pending_rows : [], directory, text, fallbackStaff),
    catalogItems,
  );
  const required = shouldRequireContext(directory, entries);
  const missingFields = [
    required.staff ? "staff" : null,
    required.shop ? "shop" : null,
  ].filter(Boolean) as string[];
  if (missingFields.length) {
    await savePendingSalesLogSession(supabase, connection, message, entries, missingFields);
    return contextPrompt(missingFields, directory);
  }
  await supabase
    .from("kapso_sales_log_sessions")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", session.id);
  return await persistSalesLogEntries(supabase, connection, message, entries, String(entries?.[0]?.raw_text || text));
}

export async function appendEntriesToGoogleSheetIfConfigured(supabase: any, userId: string, rows: any[]) {
  try {
    const { data: destination } = await supabase
      .from("google_sheet_destinations")
      .select("*")
      .eq("user_id", userId)
      .eq("enabled", true)
      .maybeSingle();
    if (!googleTokenConnected(destination)) return;

    const accessToken = await getGoogleAccessToken(supabase, destination);
    await appendGoogleSheetRows(destination.spreadsheet_id, destination.sheet_name, accessToken, rows);
    await supabase
      .from("google_sheet_destinations")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", destination.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google Sheets append failed";
    console.error("Google Sheets append failed:", err);
    await supabase
      .from("google_sheet_destinations")
      .update({ last_sync_error: message, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    await logAnalyticsEvent(supabase, userId, "google_sheets_append_failed", { error: message });
  }
}

