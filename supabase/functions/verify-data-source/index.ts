import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ParsedCsvRow = Record<string, string>;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function rowsFromCsv(text: string): ParsedCsvRow[] {
  const rows = parseCsv(text);
  const headers = rows[0]?.map(normalizeHeader) ?? [];
  if (!headers.length) return [];

  return rows.slice(1).map((cells) => {
    const record: ParsedCsvRow = {};
    headers.forEach((header, index) => {
      if (header) record[header] = cells[index] ?? "";
    });
    return record;
  });
}

function firstValue(row: ParsedCsvRow, names: string[]) {
  for (const name of names) {
    const value = row[name];
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function parseAmount(value: string) {
  const cleaned = value.replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function classifyEntry(row: ParsedCsvRow, total: number | null) {
  const typeText = firstValue(row, ["entry_type", "type", "category", "transaction_type", "kind"]).toLowerCase();
  if (/\b(expense|cost|debit|outflow|purchase|spent|spend)\b/.test(typeText)) return "expense";
  if (/\b(note|memo)\b/.test(typeText)) return "note";
  if (total != null && total < 0) return "expense";
  return "sale";
}

function importableEntries(csvText: string, sourceId: string) {
  return rowsFromCsv(csvText)
    .map((row, index) => {
      const total = parseAmount(firstValue(row, [
        "total",
        "total_amount",
        "amount",
        "sales",
        "sale",
        "revenue",
        "income",
        "paid",
        "payment",
      ]));
      if (total == null) return null;

      const qty = parseAmount(firstValue(row, ["qty", "quantity", "units", "count"]));
      const unitPrice = parseAmount(firstValue(row, ["unit_price", "price", "rate"]));
      const saleDate = parseDate(firstValue(row, ["sale_date", "date", "created_at", "day", "timestamp"]));
      const entryType = classifyEntry(row, total);
      const item = firstValue(row, ["item", "item_or_service", "product", "service", "description", "name"]);
      const customer = firstValue(row, ["customer", "customer_or_student", "client", "buyer", "name"]);
      const notes = firstValue(row, ["notes", "note", "memo", "status"]);

      return {
        entry_type: entryType,
        sale_date: saleDate,
        parsed_data: {
          entry_type: entryType,
          item: item || null,
          qty,
          unit_price: unitPrice,
          total: Math.abs(total),
          customer: customer || null,
          notes: notes || null,
          data_source_id: sourceId,
          data_source_row: index + 2,
        },
        raw_text: JSON.stringify(row),
      };
    })
    .filter(Boolean);
}

function previewEntry(entry: ReturnType<typeof importableEntries>[number]) {
  return {
    entry_type: entry!.entry_type,
    sale_date: entry!.sale_date,
    item: entry!.parsed_data.item,
    qty: entry!.parsed_data.qty,
    total: entry!.parsed_data.total,
    customer: entry!.parsed_data.customer,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const { data: { user }, error: authError } = await createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  ).auth.getUser();

  if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const { url, source_id, import_ledger } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: "URL required" }), { status: 400, headers: corsHeaders });

  try {
    let preview = "";
    let rowCount: number | null = null;
    let importableEntriesCount = 0;
    let importPreview: ReturnType<typeof previewEntry>[] = [];
    let importedEntries = 0;

    if (url.includes("docs.google.com/spreadsheets")) {
      // Export as CSV
      const csvUrl = url.replace(/\/edit.*$/, "/export?format=csv");
      const res = await fetch(csvUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return new Response(JSON.stringify({
          ok: false,
          error: `Could not access sheet (HTTP ${res.status}). Make sure it is set to "Anyone with the link can view".`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await res.text();
      const lines = text.trim().split("\n").filter(Boolean);
      rowCount = Math.max(0, lines.length - 1); // minus header row
      preview = lines.slice(0, 4).join("\n");

      const entries = source_id ? importableEntries(text, source_id) : importableEntries(text, "preview");
      importableEntriesCount = entries.length;
      importPreview = entries.slice(0, 5).map(previewEntry);

      if (source_id && import_ledger === true) {
        await supabase
          .from("bot_entries")
          .delete()
          .eq("user_id", user.id)
          .eq("source", "data_source")
          .filter("parsed_data->>data_source_id", "eq", source_id);

        if (entries.length) {
          const rows = entries.map((entry) => ({
            user_id: user.id,
            chat_id: 0,
            triggered_by: "Data source import",
            role: "system",
            raw_text: entry!.raw_text,
            entry_type: entry!.entry_type,
            parsed_data: entry!.parsed_data,
            sale_date: entry!.sale_date,
            source: "data_source",
            channel: "data_source",
          }));
          const { error: insertError } = await supabase.from("bot_entries").insert(rows);
          if (insertError) throw insertError;
          importedEntries = rows.length;
        }
      }
    } else if (url.includes("docs.google.com/document")) {
      const exportUrl = url.replace(/\/edit.*$/, "/export?format=txt");
      const res = await fetch(exportUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return new Response(JSON.stringify({
          ok: false,
          error: `Could not access document (HTTP ${res.status}). Make sure sharing is set to "Anyone with the link".`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await res.text();
      preview = text.substring(0, 300);
    } else {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        return new Response(JSON.stringify({
          ok: false,
          error: `Could not access URL (HTTP ${res.status}).`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await res.text();
      preview = text.substring(0, 300);
    }

    // If a source_id was passed, update verified status
    if (source_id) {
      await supabase.from("data_sources")
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq("id", source_id)
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ ok: true, preview, rowCount, importableEntries: importableEntriesCount, importPreview, importedEntries }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message || "Could not reach that URL" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
