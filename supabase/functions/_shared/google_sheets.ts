export const GOOGLE_SHEET_HEADERS = [
  "Date",
  "Shop",
  "Staff",
  "Item",
  "Qty",
  "Unit Price",
  "Total",
  "Customer",
  "Payment Method",
  "Type",
  "Channel",
  "Source",
  "Raw",
];

function sheetRange(sheetName: string, range: string) {
  const safeName = sheetName.replace(/'/g, "''");
  return encodeURIComponent(`'${safeName}'!${range}`);
}

async function googleSheetsFetch(path: string, accessToken: string, init: RequestInit = {}) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let json: any = null;
  if (text) {
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
  }
  if (!response.ok) {
    throw new Error(json?.error?.message || json?.message || `Google Sheets request failed (${response.status})`);
  }
  return json;
}

function formatDate(value: string | null | undefined) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function googleSheetRowFromEntry(entry: any) {
  const parsed = entry?.parsed_data || {};
  return [
    formatDate(entry.sale_date || entry.created_at),
    parsed.shop || "",
    entry.triggered_by || "",
    parsed.item || "",
    parsed.qty ?? "",
    parsed.unit_price ?? "",
    parsed.total ?? "",
    parsed.customer || "",
    parsed.payment_method || "",
    entry.entry_type || parsed.entry_type || "",
    entry.channel || "",
    entry.source || "",
    entry.raw_text || "",
  ];
}

export async function ensureGoogleSheetHeader(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string,
) {
  const range = sheetRange(sheetName, "A1:M1");
  const current = await googleSheetsFetch(`${spreadsheetId}/values/${range}`, accessToken);
  const values = current?.values || [];
  if (values[0]?.length) return false;
  await googleSheetsFetch(`${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, accessToken, {
    method: "PUT",
    body: JSON.stringify({ values: [GOOGLE_SHEET_HEADERS] }),
  });
  return true;
}

export async function appendGoogleSheetRows(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string,
  rows: any[],
) {
  if (!rows.length) return { updatedRows: 0 };
  await ensureGoogleSheetHeader(spreadsheetId, sheetName, accessToken);
  const range = sheetRange(sheetName, "A:M");
  const result = await googleSheetsFetch(
    `${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ values: rows.map(googleSheetRowFromEntry) }),
    },
  );
  return result?.updates || result;
}

export function googleTokenValid(destination: any) {
  if (!destination?.access_token) return false;
  if (!destination?.token_expires_at) return true;
  return new Date(destination.token_expires_at).getTime() > Date.now() + 60_000;
}

export function googleTokenConnected(destination: any) {
  return destination?.auth_method === "service_account" || googleTokenValid(destination) || Boolean(destination?.refresh_token);
}

function refreshedTokenExpiresAt(expiresIn: unknown) {
  const seconds = Number(expiresIn || 3600);
  return new Date(Date.now() + Math.max(300, seconds) * 1000).toISOString();
}

function base64UrlEncode(input: string | Uint8Array) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string) {
  const normalized = pem.replace(/\\n/g, "\n");
  const base64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function getGoogleServiceAccount() {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getGoogleServiceAccountEmail() {
  return getGoogleServiceAccount()?.client_email || null;
}

export async function getGoogleServiceAccountAccessToken() {
  const serviceAccount = getGoogleServiceAccount();
  if (!serviceAccount) {
    throw new Error("Google Sheets service account is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccount.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsignedJwt)));
  const assertion = `${unsignedJwt}.${base64UrlEncode(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.access_token) {
    throw new Error(json?.error_description || json?.error || "Google service account token failed.");
  }
  return json.access_token;
}

export async function getGoogleAccessToken(supabase: any, destination: any) {
  if (destination?.auth_method === "service_account") {
    return await getGoogleServiceAccountAccessToken();
  }

  if (googleTokenValid(destination)) return destination.access_token;

  const refreshToken = destination?.refresh_token;
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Google connection expired. Reconnect Google Sheets.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.access_token) {
    throw new Error(json?.error_description || json?.error || "Google connection expired. Reconnect Google Sheets.");
  }

  const updates = {
    access_token: json.access_token,
    token_expires_at: refreshedTokenExpiresAt(json.expires_in),
    refresh_token: json.refresh_token || refreshToken,
    token_type: json.token_type || destination?.token_type || "Bearer",
    last_sync_error: null,
    updated_at: new Date().toISOString(),
  };
  await supabase
    .from("google_sheet_destinations")
    .update(updates)
    .eq("id", destination.id);

  return json.access_token;
}
