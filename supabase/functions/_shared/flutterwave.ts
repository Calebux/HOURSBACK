export const MONTHLY_PRO_AMOUNT_NGN = 9_900;
export const ANNUAL_PRO_AMOUNT_NGN = 94_800;
export const SUPPORTED_CURRENCY = "NGN";

export type BillingInterval = "monthly" | "annual";

interface VerifiedPayment {
  userId: string;
  customerEmail: string | null;
  amount: number;
  currency: string;
  txRef: string;
  billingInterval: BillingInterval;
}

interface PaymentValidationResult {
  ok: boolean;
  reason?: string;
  payment?: VerifiedPayment;
}

function constantTimeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const maxLength = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }

  return mismatch === 0;
}

async function hmacSha256Base64(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Flutterwave v3 sends the configured secret directly in `verif-hash`.
 * Newer webhook versions send an HMAC-SHA256 signature in
 * `flutterwave-signature`. Accept either valid scheme, but never accept an
 * unsigned request or run without a configured secret.
 */
export async function isValidFlutterwaveWebhook(
  rawBody: string,
  headers: Headers,
  secretHash: string,
) {
  if (!secretHash) return false;

  const legacySignature = headers.get("verif-hash") ||
    headers.get("verif_hash");
  const hmacSignature = headers.get("flutterwave-signature");

  if (hmacSignature) {
    const expected = await hmacSha256Base64(rawBody, secretHash);
    if (constantTimeEqual(hmacSignature.trim(), expected)) return true;
  }

  return !!legacySignature &&
    constantTimeEqual(legacySignature.trim(), secretHash);
}

export function resolveBillingInterval(
  payload: any,
  amount: number,
): BillingInterval | null {
  const interval = payload?.meta?.billing_interval;
  if (interval === "monthly" || interval === "annual") return interval;
  if (amount === MONTHLY_PRO_AMOUNT_NGN) return "monthly";
  if (amount === ANNUAL_PRO_AMOUNT_NGN) return "annual";
  return null;
}

export async function fetchVerifiedFlutterwaveTransaction(
  transactionId: string | number,
  secretKey: string,
  fetcher: typeof fetch = fetch,
) {
  if (!secretKey) throw new Error("FLUTTERWAVE_SECRET_KEY is not configured");
  if (
    transactionId === undefined || transactionId === null ||
    transactionId === ""
  ) {
    throw new Error(
      "Webhook payload is missing the Flutterwave transaction ID",
    );
  }

  const response = await fetcher(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Flutterwave verification failed with status ${response.status}`,
    );
  }

  const result = await response.json();
  if (result?.status !== "success" || !result?.data) {
    throw new Error("Flutterwave did not return a verified transaction");
  }

  return result.data;
}

export function validateVerifiedProPayment(
  verified: any,
  webhookData: any,
): PaymentValidationResult {
  const status = String(verified?.status || "").toLowerCase();
  if (status !== "successful" && status !== "succeeded") {
    return {
      ok: false,
      reason: `transaction status is ${status || "missing"}`,
    };
  }

  const amount = Number(verified?.amount);
  const currency = String(verified?.currency || "").toUpperCase();
  const billingInterval = resolveBillingInterval(verified, amount);
  const expectedAmount = billingInterval === "annual" ? ANNUAL_PRO_AMOUNT_NGN : billingInterval === "monthly" ? MONTHLY_PRO_AMOUNT_NGN : null;

  if (currency !== SUPPORTED_CURRENCY) {
    return {
      ok: false,
      reason: `unsupported currency ${currency || "missing"}`,
    };
  }
  if (
    !billingInterval || expectedAmount === null || !Number.isFinite(amount) ||
    amount < expectedAmount
  ) {
    return { ok: false, reason: `unsupported amount ${amount} ${currency}` };
  }

  const txRef = String(verified?.tx_ref || verified?.reference || "");
  const webhookTxRef = String(
    webhookData?.tx_ref || webhookData?.reference || "",
  );
  if (!txRef || !txRef.startsWith("hb_tx_")) {
    return {
      ok: false,
      reason: "transaction reference is not an Hoursback checkout",
    };
  }
  if (webhookTxRef && webhookTxRef !== txRef) {
    return {
      ok: false,
      reason: "verified transaction reference does not match the webhook",
    };
  }

  const userId = String(verified?.meta?.user_id || "");
  if (!userId || userId === "guest") {
    return {
      ok: false,
      reason: "verified transaction is missing a valid user ID",
    };
  }
  if (String(verified?.meta?.plan_name || "").toLowerCase() !== "pro") {
    return {
      ok: false,
      reason: "verified transaction is not for the Pro plan",
    };
  }

  const customerEmail = verified?.customer?.email ? String(verified.customer.email) : null;

  return {
    ok: true,
    payment: {
      userId,
      customerEmail,
      amount,
      currency,
      txRef,
      billingInterval,
    },
  };
}
