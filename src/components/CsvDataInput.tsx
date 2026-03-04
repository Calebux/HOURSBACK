import { useState, useRef } from 'react';
import { Upload, Link2, CheckCircle2, AlertCircle, X, Table } from 'lucide-react';

// Variable names that trigger the CSV upload UI
const DATA_KEYWORDS = ['csv', 'data', 'sheet', 'spreadsheet', 'list', 'table', 'records',
  'customers', 'transactions', 'entries', 'rows', 'contacts', 'leads', 'inventory', 'products', 'sales'];

export function isCsvVariable(varName: string): boolean {
  const lower = varName.toLowerCase();
  return DATA_KEYWORDS.some(k => lower.includes(k));
}

// Simple CSV parser — handles quoted fields and commas inside quotes
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  for (const line of lines) {
    const cols: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === ',' && !inQuote) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

// Convert parsed rows to a compact text Claude can reason about
function rowsToText(rows: string[][]): string {
  if (rows.length === 0) return '';
  const [header, ...body] = rows;
  const lines = body.map(row =>
    header.map((h, i) => `${h}: ${row[i] ?? ''}`).join(' | ')
  );
  return `[Data: ${body.length} rows, columns: ${header.join(', ')}]\n${lines.join('\n')}`;
}

function extractSheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

interface Props {
  variableName: string;
  value: string;
  onChange: (value: string) => void;
}

export default function CsvDataInput({ variableName, value, onChange }: Props) {
  const [tab, setTab] = useState<'upload' | 'sheets'>('upload');
  const [sheetUrl, setSheetUrl] = useState('');
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && !file.type.includes('comma')) {
      setStatus('error');
      setErrorMsg('Please upload a .csv file');
      return;
    }
    setStatus('loading');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length < 2) { setStatus('error'); setErrorMsg('CSV appears empty or has no data rows'); return; }
      setPreview(rows.slice(0, 6));
      onChange(rowsToText(rows));
      setStatus('ok');
    };
    reader.onerror = () => { setStatus('error'); setErrorMsg('Could not read file'); };
    reader.readAsText(file);
  };

  const handleSheetFetch = async () => {
    const id = extractSheetId(sheetUrl);
    if (!id) { setStatus('error'); setErrorMsg('Could not find a valid Google Sheets ID in that URL'); return; }
    setStatus('loading');
    try {
      // Works for sheets published to web ("File → Share → Publish to web → CSV")
      const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error('Sheet appears empty');
      setPreview(rows.slice(0, 6));
      onChange(rowsToText(rows));
      setStatus('ok');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg('Could not fetch sheet. Make sure it is publicly shared or published to web.');
    }
  };

  const handleClear = () => {
    setPreview(null);
    setStatus('idle');
    setErrorMsg('');
    setSheetUrl('');
    onChange('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="rounded-2xl border border-brand-dark/10 overflow-hidden bg-white">
      {/* Tab bar */}
      <div className="flex border-b border-brand-dark/10 bg-slate-50">
        <button
          onClick={() => setTab('upload')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${tab === 'upload' ? 'bg-white text-brand-dark border-b-2 border-brand-blue' : 'text-brand-dark/50 hover:text-brand-dark'}`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload CSV
        </button>
        <button
          onClick={() => setTab('sheets')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${tab === 'sheets' ? 'bg-white text-brand-dark border-b-2 border-brand-blue' : 'text-brand-dark/50 hover:text-brand-dark'}`}
        >
          <Link2 className="w-3.5 h-3.5" /> Google Sheets
        </button>
      </div>

      <div className="p-3">
        {status === 'ok' && preview ? (
          /* Preview table */
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Data loaded — {value.split('\n').length - 1} rows
              </span>
              <button onClick={handleClear} className="text-xs text-brand-dark/40 hover:text-red-500 flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-brand-dark/8">
              <table className="text-[10px] w-full">
                {preview.map((row, ri) => (
                  <tr key={ri} className={ri === 0 ? 'bg-brand-dark text-white font-semibold' : ri % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1.5 border-r border-brand-dark/8 last:border-r-0 truncate max-w-[120px]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </table>
            </div>
            {preview.length === 6 && <p className="text-[10px] text-brand-dark/40 mt-1 text-center">Showing first 5 rows — all rows are loaded</p>}
          </div>
        ) : tab === 'upload' ? (
          <div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
              disabled={status === 'loading'}
              className="w-full border-2 border-dashed border-brand-dark/15 rounded-xl py-6 flex flex-col items-center gap-2 text-brand-dark/50 hover:border-brand-blue/40 hover:text-brand-dark/70 transition-all cursor-pointer disabled:opacity-50"
            >
              {status === 'loading' ? (
                <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
              ) : (
                <Table className="w-6 h-6" />
              )}
              <span className="text-xs font-medium">{status === 'loading' ? 'Reading file…' : 'Click or drag a .csv file here'}</span>
              <span className="text-[10px] text-brand-dark/30">Supports any spreadsheet exported as CSV</span>
            </button>
            {status === 'error' && <p className="text-xs text-red-500 flex items-center gap-1 mt-2"><AlertCircle className="w-3.5 h-3.5" />{errorMsg}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] text-brand-dark/50 leading-relaxed">
              Open your Google Sheet → <strong>File → Share → Publish to web</strong> → select <strong>CSV</strong> → Copy the link and paste below.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-brand-dark/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
              <button
                onClick={handleSheetFetch}
                disabled={!sheetUrl || status === 'loading'}
                className="px-3 py-2 bg-brand-dark text-white text-xs font-semibold rounded-xl hover:bg-brand-dark/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {status === 'loading' ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Load'}
              </button>
            </div>
            {status === 'error' && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errorMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
