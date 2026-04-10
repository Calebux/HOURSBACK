/**
 * dataset_aggregator.ts
 *
 * Deterministic server-side aggregation for CSV/Excel data.
 * No LLM in the math path. Produces exact metrics Claude must use verbatim.
 *
 * Handles:
 *   - RFC 4180 CSV: quoted fields, embedded commas, embedded newlines,
 *     escaped quotes (""), CRLF + LF line endings, leading BOM
 *   - Identifier columns (ID, phone, zip, SKU…) — excluded from aggregation
 *   - Year columns (1900–2099) — excluded from SUM/AVG (meaningless)
 *   - All-unique integer columns — detected as ID columns, excluded
 *   - Numeric columns — SUM, AVG, MEDIAN, MIN, MAX, COUNT
 *   - Categorical columns (2–30 unique values) — frequency + %
 *   - Numeric values redacted in sample — Claude cannot re-derive totals
 */

// ---------------------------------------------------------------------------
// RFC 4180 CSV parser
// ---------------------------------------------------------------------------
function parseCsv(csv: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip BOM
  const content = csv.charCodeAt(0) === 0xFEFF ? csv.slice(1) : csv;

  const allRows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }  // escaped quote ""
      else if (ch === '"')            { inQuotes = false; }  // closing quote
      else                            { cell += ch; }        // any char incl \n (multiline cell)
    } else {
      if      (ch === '"')                    { inQuotes = true; }
      else if (ch === ',')                    { row.push(cell.trim()); cell = ""; }
      else if (ch === '\r' && next === '\n')  { row.push(cell.trim()); cell = ""; flushRow(); i++; }
      else if (ch === '\n')                   { row.push(cell.trim()); cell = ""; flushRow(); }
      else                                    { cell += ch; }
    }
  }
  row.push(cell.trim());
  if (row.some(c => c !== "")) allRows.push(row);

  function flushRow() {
    if (row.some(c => c !== "")) allRows.push(row);
    row = [];
  }

  if (allRows.length === 0) return { headers: [], rows: [] };

  // Strip stray surrounding quotes from header names
  const headers = allRows[0].map(h => h.replace(/^"|"$/g, "").trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < allRows.length; i++) {
    const r: Record<string, string> = {};
    headers.forEach((h, idx) => { r[h] = allRows[i][idx] ?? ""; });
    rows.push(r);
  }
  return { headers, rows };
}

// ---------------------------------------------------------------------------
// Column classification
// ---------------------------------------------------------------------------

/**
 * Column names that represent identifiers, codes, or date-parts —
 * technically numeric but meaningless to SUM or AVERAGE.
 */
const IDENTIFIER_NAME_RE =
  /\b(ids?|identifier|uuid|guid|key|ref|reference|serial|code|sku|part_?no?|item_?no?|order_?no?|invoice_?no?|account_?no?|batch|phone|tel|mobile|cell|fax|zip|postal|postcode|pincode|year|month|day|date|time|timestamp|hour|minute|second|index|rank|row_?no?|line_?no?|seq|sequence)\b/i;

function isIdentifierByName(header: string): boolean {
  return IDENTIFIER_NAME_RE.test(header);
}

/** All non-empty values are integers AND all unique → primary-key style ID column. */
function isIdentifierByValues(values: string[]): boolean {
  const nonEmpty = values.filter(v => v.trim() !== "");
  if (nonEmpty.length < 5) return false;                          // too small to tell
  if (!nonEmpty.every(v => /^\d+$/.test(v.trim()))) return false; // must be all integers
  return new Set(nonEmpty).size === nonEmpty.length;              // all unique
}

/** Values are all 4-digit integers in the year range 1900–2099. */
function isYearColumn(values: string[]): boolean {
  const nonEmpty = values.filter(v => v.trim() !== "");
  if (nonEmpty.length === 0) return false;
  return nonEmpty.every(v => {
    const trimmed = v.trim();
    if (!/^\d{4}$/.test(trimmed)) return false;
    const n = parseInt(trimmed, 10);
    return n >= 1900 && n <= 2099;
  });
}

const STRIP_RE = /[$£€₦,%\s]/g;

function toNumber(val: string): number | null {
  if (!val || !val.trim()) return null;
  const cleaned = val.replace(STRIP_RE, "");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : null;
}

/** ≥60% of non-empty values parse as finite numbers. */
function isNumericColumn(values: string[]): boolean {
  const nonEmpty = values.filter(v => v.trim() !== "");
  if (nonEmpty.length === 0) return false;
  const count = nonEmpty.filter(v => toNumber(v) !== null).length;
  return count / nonEmpty.length >= 0.6;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function aggregateCsvData(
  csvContent: string,
  _workflowPrompt: string,   // kept for API compat — no longer used for LLM planning
  _anthropicApiKey: string,  // kept for API compat — no longer needed
): Promise<{ aggregatedSummary: string; safeSample: string }> {
  try {
    const { headers, rows } = parseCsv(csvContent);

    if (headers.length === 0 || rows.length === 0) {
      return { aggregatedSummary: "", safeSample: csvContent.substring(0, 2000) };
    }

    // Small datasets pass through whole — nothing to hide
    if (rows.length <= 20) {
      return {
        aggregatedSummary: `Dataset: ${rows.length} rows, ${headers.length} columns (${headers.join(", ")}).`,
        safeSample: csvContent.substring(0, 4000),
      };
    }

    const lines: string[] = [
      `## VERIFIED METRICS — CODE-COMPUTED, NOT ESTIMATED`,
      `CRITICAL: Every figure below was calculated by deterministic server-side code`,
      `across ALL ${rows.length} rows. These numbers are exact. You MUST use them verbatim.`,
      `Do NOT re-derive, re-sum, or re-average from the sample rows — the sample`,
      `is a layout preview only and contains redacted numeric values.`,
      ``,
      `Dataset: ${rows.length} rows · ${headers.length} columns`,
      `Columns: ${headers.join(", ")}`,
      ``,
    ];

    let hasAnyMetric = false;
    const numericHeaders = new Set<string>();
    const skippedHeaders = new Set<string>();

    for (const header of headers) {
      const colValues = rows.map(r => r[header] ?? "");
      const nonEmpty   = colValues.filter(v => v.trim() !== "");

      // Skip fully empty columns
      if (nonEmpty.length === 0) { skippedHeaders.add(header); continue; }

      // Classify and skip identifier / date-part columns
      if (isIdentifierByName(header) || isIdentifierByValues(colValues) || isYearColumn(colValues)) {
        skippedHeaders.add(header);
        continue;
      }

      if (isNumericColumn(colValues)) {
        numericHeaders.add(header);

        const nums = colValues
          .map(toNumber)
          .filter((n): n is number => n !== null);

        nums.sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        const avg = sum / nums.length;
        const med = median(nums);

        lines.push(`### ${header}`);
        lines.push(`- Count (non-empty): ${nums.length}`);
        lines.push(`- SUM:     ${fmt(sum)}`);
        lines.push(`- Average: ${fmt(avg)}`);
        lines.push(`- Median:  ${fmt(med)}`);
        lines.push(`- Min:     ${fmt(nums[0])}`);
        lines.push(`- Max:     ${fmt(nums[nums.length - 1])}`);
        lines.push(``);
        hasAnyMetric = true;

      } else {
        // Categorical — only useful if low-cardinality
        const freq: Record<string, number> = {};
        for (const v of colValues) {
          const key = v.trim();
          if (!key) continue;
          freq[key] = (freq[key] ?? 0) + 1;
        }
        const unique = Object.keys(freq).length;
        if (unique >= 2 && unique <= 30) {
          const top = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
          lines.push(`### ${header} (${unique} unique values)`);
          for (const [val, count] of top) {
            const pct = ((count / rows.length) * 100).toFixed(1);
            lines.push(`- ${val}: ${count} rows (${pct}%)`);
          }
          if (Object.keys(freq).length > 10) lines.push(`  ... and ${Object.keys(freq).length - 10} more values`);
          lines.push(``);
          hasAnyMetric = true;
        }
      }
    }

    if (skippedHeaders.size > 0) {
      lines.push(`_Columns excluded from aggregation (identifiers / date-parts): ${[...skippedHeaders].join(", ")}_`);
      lines.push(``);
    }

    if (!hasAnyMetric) {
      lines.push(`No numeric or groupable columns detected.`);
    }

    // ---------------------------------------------------------------------------
    // Safe sample: 5 rows, numeric columns redacted
    // Claude sees column structure and text values — not raw numbers to re-add.
    // ---------------------------------------------------------------------------
    const sampleLines = [headers.join(",")];
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      sampleLines.push(
        headers.map(h =>
          numericHeaders.has(h) ? "[see aggregations above]" : (rows[i][h] ?? "")
        ).join(",")
      );
    }
    sampleLines.push(`[${rows.length} total rows — numeric columns redacted to prevent re-calculation]`);

    return {
      aggregatedSummary: lines.join("\n"),
      safeSample: sampleLines.join("\n"),
    };

  } catch (err: any) {
    console.error("[dataset_aggregator] error:", err);
    // Fallback: truncated raw data (old behaviour — better than crashing)
    return { aggregatedSummary: "", safeSample: csvContent.substring(0, 3000) };
  }
}
