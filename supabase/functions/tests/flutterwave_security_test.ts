import { ANNUAL_PRO_AMOUNT_NGN, fetchVerifiedFlutterwaveTransaction, isValidFlutterwaveWebhook, MONTHLY_PRO_AMOUNT_NGN, validateVerifiedProPayment } from "../_shared/flutterwave.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test("Flutterwave webhook verification fails closed", async () => {
  const body = JSON.stringify({ event: "charge.completed" });
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("secret"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hmacSignature = btoa(String.fromCharCode(...new Uint8Array(digest)));

  assert(
    !await isValidFlutterwaveWebhook(body, new Headers(), "secret"),
    "unsigned webhook was accepted",
  );
  assert(
    !await isValidFlutterwaveWebhook(
      body,
      new Headers({ "verif-hash": "anything" }),
      "secret",
    ),
    "arbitrary legacy signature was accepted",
  );
  assert(
    !await isValidFlutterwaveWebhook(
      body,
      new Headers({ "verif-hash": "secret" }),
      "",
    ),
    "webhook was accepted without a configured secret",
  );
  assert(
    await isValidFlutterwaveWebhook(
      body,
      new Headers({ "verif-hash": "secret" }),
      "secret",
    ),
    "valid legacy signature was rejected",
  );
  assert(
    await isValidFlutterwaveWebhook(
      body,
      new Headers({ "flutterwave-signature": hmacSignature }),
      "secret",
    ),
    "valid HMAC signature was rejected",
  );
});

Deno.test("verified Pro payment must match plan, amount, currency, and reference", () => {
  const verified = {
    status: "successful",
    amount: MONTHLY_PRO_AMOUNT_NGN,
    currency: "NGN",
    tx_ref: "hb_tx_123_456",
    meta: {
      user_id: "00000000-0000-4000-8000-000000000001",
      plan_name: "pro",
      billing_interval: "monthly",
    },
    customer: { email: "owner@example.com" },
  };

  const valid = validateVerifiedProPayment(verified, {
    tx_ref: verified.tx_ref,
  });
  assert(
    valid.ok && valid.payment?.billingInterval === "monthly",
    "valid payment was rejected",
  );

  const underpaid = validateVerifiedProPayment({
    ...verified,
    amount: MONTHLY_PRO_AMOUNT_NGN - 1,
  }, verified);
  assert(!underpaid.ok, "underpaid transaction was accepted");

  const wrongReference = validateVerifiedProPayment(verified, {
    tx_ref: "hb_tx_different",
  });
  assert(!wrongReference.ok, "mismatched transaction reference was accepted");

  const annual = validateVerifiedProPayment({
    ...verified,
    amount: ANNUAL_PRO_AMOUNT_NGN,
    meta: { ...verified.meta, billing_interval: "annual" },
  }, { tx_ref: verified.tx_ref });
  assert(
    annual.ok && annual.payment?.billingInterval === "annual",
    "valid annual payment was rejected",
  );
});

Deno.test("transaction verification uses Flutterwave's API and secret key", async () => {
  let requestedUrl = "";
  let authorization = "";
  const fetcher = ((url: string | URL | Request, init?: RequestInit) => {
    requestedUrl = String(url);
    authorization = new Headers(init?.headers).get("authorization") || "";
    return Promise.resolve(
      new Response(
        JSON.stringify({
          status: "success",
          data: { id: 42, status: "successful" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
  }) as typeof fetch;

  const result = await fetchVerifiedFlutterwaveTransaction(
    42,
    "test-secret",
    fetcher,
  );
  assert(
    requestedUrl.endsWith("/v3/transactions/42/verify"),
    "wrong verification endpoint",
  );
  assert(
    authorization === "Bearer test-secret",
    "secret key was not sent as a bearer token",
  );
  assert(result.id === 42, "verified transaction was not returned");
});
