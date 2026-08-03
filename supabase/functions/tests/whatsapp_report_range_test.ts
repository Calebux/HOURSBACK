// Date-range parsing for sales-log questions and reports.
// Run: cd supabase/functions && deno test --node-modules-dir=none tests/
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { parseReportRange } from "../_shared/whatsapp_reports.ts";

// Wednesday 12 Aug 2026, 10:00 Lagos. Lagos is UTC+1, so a Lagos day starts at 23:00Z.
const NOW = new Date("2026-08-12T10:00:00+01:00");
const LAGOS = "Africa/Lagos";

function range(text: string) {
  return parseReportRange(text, LAGOS, NOW);
}

Deno.test("last month is the previous calendar month, not this one", () => {
  const { start, end, label } = range("how much did we make last month?");

  assertEquals(label, "Jul 2026");
  assertEquals(start.toISOString(), "2026-06-30T23:00:00.000Z");
  assertEquals(end.toISOString(), "2026-07-31T22:59:59.999Z");
});

Deno.test("this month still runs from the first of the month", () => {
  const { start, label } = range("sales this month");

  assertEquals(label, "This month");
  assertEquals(start.toISOString(), "2026-07-31T23:00:00.000Z");
});

Deno.test("last week is the previous Monday-Sunday, excluding today", () => {
  const { start, end, label } = range("how much did we sell last week?");

  assertEquals(label, "Last week");
  assertEquals(start.toISOString(), "2026-08-02T23:00:00.000Z");
  assertEquals(end.toISOString(), "2026-08-09T22:59:59.999Z");
});

Deno.test("this week starts on Monday rather than rolling seven days", () => {
  const { start, label } = range("sales this week");

  assertEquals(label, "This week");
  assertEquals(start.toISOString(), "2026-08-09T23:00:00.000Z");
});

Deno.test("last 7 days stays a rolling window", () => {
  const { start, label } = range("sales for the last 7 days");

  assertEquals(label, "Last 7 days");
  assertEquals(start.toISOString(), "2026-08-05T23:00:00.000Z");
});

Deno.test("last N days is honoured", () => {
  const { start, label } = range("how much did we sell in the last 30 days?");

  assertEquals(label, "Last 30 days");
  assertEquals(start.toISOString(), "2026-07-13T23:00:00.000Z");
});

Deno.test("yesterday covers only yesterday", () => {
  const { start, end, label } = range("how much did Ikeja make yesterday?");

  assertEquals(label, "Yesterday");
  assertEquals(start.toISOString(), "2026-08-10T23:00:00.000Z");
  assertEquals(end.toISOString(), "2026-08-11T22:59:59.999Z");
});

Deno.test("a named weekday resolves to its most recent occurrence", () => {
  const { start, end, label } = range("how much did we make on Monday?");

  assertEquals(label, "10 Aug 2026");
  assertEquals(start.toISOString(), "2026-08-09T23:00:00.000Z");
  assertEquals(end.toISOString(), "2026-08-10T22:59:59.999Z");
});

Deno.test("today's own weekday means today", () => {
  assertEquals(range("sales on Wednesday").label, "Today");
});

Deno.test("explicit dates parse in day-first, month-name, and ISO forms", () => {
  for (const text of ["sales on 11/4", "sales on 11 April", "sales on April 11", "sales on 2026-04-11"]) {
    const { start, end, label } = range(text);
    assertEquals(label, "11 Apr 2026", `failed for: ${text}`);
    assertEquals(start.toISOString(), "2026-04-10T23:00:00.000Z", `failed for: ${text}`);
    assertEquals(end.toISOString(), "2026-04-11T22:59:59.999Z", `failed for: ${text}`);
  }
});

Deno.test("a bare date still ahead of us means last year", () => {
  const { start, label } = range("how much did we make on December 28?");

  assertEquals(label, "28 Dec 2025");
  assertEquals(start.toISOString(), "2025-12-27T23:00:00.000Z");
});

Deno.test("an explicit year is respected", () => {
  assertEquals(range("sales on 11/4/2025").label, "11 Apr 2025");
});

Deno.test("today is the default and is flagged as an unmatched range", () => {
  const plain = range("how much did we sell?");
  assertEquals(plain.label, "Today");
  assertEquals(plain.matched, false);

  assertEquals(range("how much did we sell today?").matched, true);
});

Deno.test("an unsupported period does not silently become today", () => {
  const quarter = range("how much did we make this quarter?");

  assertEquals(quarter.label, "Today");
  assertEquals(quarter.matched, false);
});
