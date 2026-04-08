const DATA_KEYWORDS = ['csv', 'data', 'sheet', 'spreadsheet', 'list', 'table', 'records',
  'customers', 'transactions', 'entries', 'rows', 'contacts', 'leads', 'inventory', 'products', 'sales'];

export function isCsvVariable(varName: string): boolean {
  const lower = varName.toLowerCase();
  return DATA_KEYWORDS.some(k => lower.includes(k));
}

export function isGoogleSheetsUrl(val: string): boolean {
  return val.startsWith('https://docs.google.com/spreadsheets/');
}
