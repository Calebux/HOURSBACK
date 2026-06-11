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
