// Sales-log query tests: a question naming a shop must never be answered with
// another shop's numbers.
// Run: cd supabase/functions && deno test --node-modules-dir=none tests/
import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { buildSalesLogQueryAnswer, salesLogQueryFilters } from "../_shared/whatsapp_reports.ts";

type Tables = Record<string, unknown[]>;

function stubSupabase(tables: Tables) {
  return {
    from(table: string) {
      const builder: Record<string, unknown> = {};
      for (const method of ["select", "eq", "or", "order", "limit", "gt"]) {
        builder[method] = () => builder;
      }
      builder.then = (resolve: (value: unknown) => unknown) =>
        resolve({ data: tables[table] || [], error: null });
      return builder;
    },
  };
}

function sale(shop: string, total: number, item = "wig", staff = "Ada") {
  return {
    entry_type: "sale",
    parsed_data: { item, qty: 1, total, shop, payment_method: "cash" },
    triggered_by: staff,
    raw_text: `sold ${item} ${total}`,
    source: "whatsapp",
    channel: "whatsapp",
    sale_date: null,
    created_at: new Date().toISOString(),
  };
}

const TWO_SHOPS = {
  business_shops: [
    { name: "Ikeja", aliases: ["Ikeja Branch"] },
    { name: "Surulere", aliases: [] },
  ],
  business_staff: [{ name: "Ada", aliases: [], default_shop: "Surulere" }],
  business_catalog_items: [{ name: "wig", aliases: ["wigs"] }],
};

Deno.test("named shop with no entries reports zero, not the other shop's total", async () => {
  const supabase = stubSupabase({
    ...TWO_SHOPS,
    bot_entries: [sale("Surulere", 180000)],
  });

  const answer = await buildSalesLogQueryAnswer(supabase, "user-1", "how much did Ikeja make today?");

  assertStringIncludes(answer, "Shop: Ikeja");
  assertStringIncludes(answer, "Net sales: ₦0");
  assertEquals(answer.includes("180,000"), false);
});

Deno.test("shop alias in the question resolves to the configured outlet", async () => {
  const supabase = stubSupabase({
    ...TWO_SHOPS,
    bot_entries: [sale("Ikeja", 42000), sale("Surulere", 180000)],
  });

  const answer = await buildSalesLogQueryAnswer(supabase, "user-1", "how much did Ikeja Branch make today?");

  assertStringIncludes(answer, "Shop: Ikeja");
  assertStringIncludes(answer, "Net sales: ₦42,000");
  assertEquals(answer.includes("180,000"), false);
});

Deno.test("partial shop name matches an outlet stored under a longer name", async () => {
  const supabase = stubSupabase({
    business_shops: [{ name: "Ikeja Shop", aliases: ["Ikeja"] }, { name: "Surulere", aliases: [] }],
    business_staff: [],
    business_catalog_items: [],
    bot_entries: [sale("Ikeja Shop", 42000), sale("Surulere", 180000)],
  });

  const answer = await buildSalesLogQueryAnswer(supabase, "user-1", "how much did Ikeja make today?");

  assertStringIncludes(answer, "Net sales: ₦42,000");
  assertEquals(answer.includes("180,000"), false);
});

Deno.test("item with no sales reports zero rather than total revenue", async () => {
  const supabase = stubSupabase({
    ...TWO_SHOPS,
    bot_entries: [sale("Surulere", 180000, "sandals")],
  });

  const answer = await buildSalesLogQueryAnswer(supabase, "user-1", "how many wigs did we sell today?");

  assertStringIncludes(answer, "Item: wig");
  assertStringIncludes(answer, "Net sales: ₦0");
  assertEquals(answer.includes("180,000"), false);
});

Deno.test("unscoped question still totals every outlet", async () => {
  const supabase = stubSupabase({
    ...TWO_SHOPS,
    bot_entries: [sale("Ikeja", 42000), sale("Surulere", 180000)],
  });

  const answer = await buildSalesLogQueryAnswer(supabase, "user-1", "how much did we sell today?");

  assertStringIncludes(answer, "Net sales: ₦222,000");
  assertEquals(answer.includes("Shop:"), false);
});

Deno.test("unrecognised outlet name falls back to all outlets but says so", async () => {
  const supabase = stubSupabase({
    ...TWO_SHOPS,
    bot_entries: [sale("Ikeja", 42000), sale("Surulere", 180000)],
  });

  const answer = await buildSalesLogQueryAnswer(supabase, "user-1", "how much did the Ikaja shop make today?");

  assertStringIncludes(answer, "Covering all outlets: Ikeja, Surulere");
  assertStringIncludes(answer, "Net sales: ₦222,000");
});

Deno.test("configured shop is matched even when the range holds no rows at all", () => {
  const filters = salesLogQueryFilters([], "how much did Ikeja make today?", {
    shops: TWO_SHOPS.business_shops,
  });

  assertEquals(filters.shopMatches.names, ["Ikeja"]);
  assertEquals(filters.shopMatches.labels.includes("ikeja branch"), true);
});
