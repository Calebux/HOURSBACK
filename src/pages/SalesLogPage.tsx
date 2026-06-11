import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Download, FileText, Camera, X, Loader2, CheckCircle2, Lock, Trash2, MessageCircle, Sheet, Shield, Maximize2, Minimize2 } from 'lucide-react';
import { MobileNav } from '../components/MobileNav';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BotEntry {
  id: string;
  triggered_by: string | null;
  role: string | null;
  raw_text: string;
  entry_type: string;
  parsed_data: {
    item?: string | null;
    qty?: number | null;
    unit_price?: number | null;
    total?: number | null;
    customer?: string | null;
    payment_method?: string | null;
    shop?: string | null;
    notes?: string | null;
    sale_date?: string | null;
  } | null;
  sale_date: string | null;
  source: string | null;
  channel?: string | null;
  created_at: string;
}

interface ParsedEntry {
  entry_type: string;
  item: string | null;
  qty: number | null;
  unit_price: number | null;
  total: number | null;
  customer: string | null;
  payment_method?: string | null;
  shop?: string | null;
  notes: string | null;
  sale_date: string | null;
}

interface Closeout {
  id: string;
  staff_name: string | null;
  expected_sales_total: number;
  expenses_total: number;
  actual_collected_total: number;
  variance_total: number;
  status: string;
  created_at: string;
}

interface SheetDestination {
  spreadsheet_id: string;
  sheet_name: string;
  enabled: boolean;
  auth_method?: string;
  connected: boolean;
  last_sync_at: string | null;
  last_sync_error: string | null;
}

function fmt(n: number | null | undefined) {
  if (n == null) return '';
  return `₦${Number(n).toLocaleString()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function inferChannel(source?: string | null) {
  if (!source) return 'unknown';
  if (source.startsWith('whatsapp')) return 'whatsapp';
  if (source.startsWith('telegram')) return 'telegram';
  if (source.startsWith('web')) return 'web';
  if (source.startsWith('data_source')) return 'data_source';
  return 'unknown';
}

function labelChannel(channel?: string | null) {
  switch (channel) {
    case 'whatsapp': return 'WhatsApp';
    case 'web': return 'Web';
    case 'telegram': return 'Telegram';
    case 'data_source': return 'Data source';
    default: return channel || 'Unknown';
  }
}

function channelClass(channel?: string | null) {
  switch (channel) {
    case 'whatsapp': return 'bg-emerald-50 text-emerald-700';
    case 'web': return 'bg-blue-50 text-blue-700';
    case 'telegram': return 'bg-sky-50 text-sky-700';
    case 'data_source': return 'bg-amber-50 text-amber-700';
    default: return 'bg-slate-100 text-slate-500';
  }
}

export default function SalesLogPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<BotEntry[]>([]);
  const [recentCloseout, setRecentCloseout] = useState<Closeout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterShop, setFilterShop] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [sheetDestination, setSheetDestination] = useState<SheetDestination | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('Sales Log');
  const [sheetSaving, setSheetSaving] = useState(false);
  const [sheetSyncing, setSheetSyncing] = useState(false);
  const [serviceAccountEmail, setServiceAccountEmail] = useState<string | null>(null);
  const [expandedTable, setExpandedTable] = useState(false);

  // Photo upload state
  const [uploadState, setUploadState] = useState<'idle' | 'parsing' | 'preview' | 'saving'>('idle');
  const [previewEntries, setPreviewEntries] = useState<ParsedEntry[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [chartDays, setChartDays] = useState<14 | 30>(14);

  const loadEntries = () => {
    if (!user) return;
    supabase
      .from('bot_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setEntries(data ?? []);
        setLoading(false);
      });
  };

  const loadCloseout = () => {
    if (!user) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    supabase
      .from('kapso_closeouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setRecentCloseout(data ?? null);
      });
  };

  const loadSheetDestination = async () => {
    if (!user) return;
    const { data } = await supabase.functions.invoke('google-sheets-sync', {
      body: { action: 'status' },
    });
    const destination = data?.destination || null;
    setServiceAccountEmail(data?.service_account_email || null);
    setSheetDestination(destination);
    if (destination) {
      setSheetUrl(destination.spreadsheet_id || '');
      setSheetName(destination.sheet_name || 'Sales Log');
    }
  };

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    // Check pro status
    supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsPro(data?.subscription_status === 'pro');
    });
    loadEntries();
    loadCloseout();
    void loadSheetDestination();
  }, [user, navigate]);

  const staffOptions = useMemo(() =>
    [...new Set(entries.map(e => e.triggered_by).filter(Boolean))].sort() as string[],
    [entries]
  );

  const channelOptions = useMemo(() =>
    [...new Set(entries.map(e => e.channel || inferChannel(e.source)).filter(Boolean))].sort(),
    [entries]
  );

  const shopOptions = useMemo(() =>
    [...new Set(entries.map(e => e.parsed_data?.shop).filter(Boolean))].sort() as string[],
    [entries]
  );

  const filtered = useMemo(() =>
    entries.filter(e => {
      if (filterType && e.entry_type !== filterType) return false;
      if (filterStaff && e.triggered_by !== filterStaff) return false;
      if (filterShop && e.parsed_data?.shop !== filterShop) return false;
      if (filterChannel && (e.channel || inferChannel(e.source)) !== filterChannel) return false;
      return true;
    }),
    [entries, filterType, filterStaff, filterShop, filterChannel]
  );

  const totalAmount = useMemo(() =>
    filtered
      .filter(e => e.entry_type === 'sale')
      .reduce((sum, e) => sum + (e.parsed_data?.total ?? 0), 0),
    [filtered]
  );
  const refundAmount = useMemo(() =>
    filtered
      .filter(e => e.entry_type === 'refund')
      .reduce((sum, e) => sum + (e.parsed_data?.total ?? 0), 0),
    [filtered]
  );
  const netSalesAmount = totalAmount - refundAmount;

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth = entries.filter(e => new Date(e.created_at) >= monthStart).length;
  const whatsappCount = entries.filter(e => (e.channel || inferChannel(e.source)) === 'whatsapp').length;

  const deleteEntry = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('bot_entries').delete().eq('id', id);
    if (error) {
      toast.error('Could not delete entry');
    } else {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
    setDeletingId(null);
  };

  // Chart: daily sales vs expenses for last N days
  const chartData = useMemo(() => {
    const days: { date: string; label: string; sales: number; expenses: number }[] = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      days.push({ date: key, label, sales: 0, expenses: 0 });
    }
    for (const e of entries) {
      const dateKey = (e.sale_date ?? e.created_at).slice(0, 10);
      const day = days.find(d => d.date === dateKey);
      if (!day) continue;
      if (e.entry_type === 'sale') day.sales += e.parsed_data?.total ?? 0;
      if (e.entry_type === 'refund') day.sales -= e.parsed_data?.total ?? 0;
      if (e.entry_type === 'expense') day.expenses += e.parsed_data?.total ?? 0;
    }
    return days;
  }, [entries, chartDays]);

  const hasChartData = chartData.some(d => d.sales > 0 || d.expenses > 0);

  const downloadCsv = () => {
    const rows = [
      ['Date', 'Shop', 'Staff', 'Item', 'Qty', 'Unit Price', 'Total', 'Customer', 'Payment Method', 'Type', 'Channel', 'Source', 'Raw'],
      ...filtered.map(e => [
        fmtDate(e.sale_date ?? e.created_at),
        e.parsed_data?.shop ?? '',
        e.triggered_by ?? '',
        e.parsed_data?.item ?? '',
        e.parsed_data?.qty != null ? String(e.parsed_data.qty) : '',
        e.parsed_data?.unit_price != null ? String(e.parsed_data.unit_price) : '',
        e.parsed_data?.total != null ? String(e.parsed_data.total) : '',
        e.parsed_data?.customer ?? '',
        e.parsed_data?.payment_method ?? '',
        e.entry_type,
        e.channel || inferChannel(e.source),
        e.source ?? 'whatsapp_text',
        e.raw_text,
      ]),
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = rows.map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';

    setUploadState('parsing');

    try {
      // Convert to base64
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const image_base64 = btoa(binary);
      const media_type = file.type || 'image/jpeg';

      // Call edge function
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-sales-photo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ image_base64, media_type }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Could not read image');
        setUploadState('idle');
        return;
      }

      if (!json.entries?.length) {
        toast.error("Couldn't find any entries in that photo. Try a clearer image.");
        setUploadState('idle');
        return;
      }

      setPreviewEntries(json.entries);
      setUploadState('preview');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
      setUploadState('idle');
    }
  };

  const savePhotoEntries = async () => {
    if (!user || !previewEntries.length) return;
    setUploadState('saving');

    try {
      const rows = previewEntries.map(e => ({
        user_id: user.id,
        chat_id: 0,
        triggered_by: 'Web upload',
        role: 'manager',
        raw_text: '[photo scan]',
        entry_type: e.entry_type || 'sale',
        parsed_data: e,
        sale_date: e.sale_date ? new Date(e.sale_date).toISOString() : null,
        source: 'web_upload',
      }));

      const { error } = await supabase.from('bot_entries').insert(rows);
      if (error) throw error;

      toast.success(`${rows.length} ${rows.length === 1 ? 'entry' : 'entries'} saved`);
      setUploadState('idle');
      setPreviewEntries([]);
      loadEntries();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save entries. Please try again.');
      setUploadState('saving');
    }
  };

  const saveSheetDestination = async () => {
    if (!sheetUrl.trim()) {
      toast.error('Paste a Google Sheet URL or spreadsheet ID');
      return;
    }
    setSheetSaving(true);
    try {
      if (!serviceAccountEmail) {
        toast.error('Google Sheets service account is not configured yet');
        return;
      }

      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: {
          action: 'configure_service_account',
          spreadsheet_url: sheetUrl.trim(),
          sheet_name: sheetName.trim() || 'Sales Log',
        },
      });
      if (error) throw error;
      setSheetDestination(data.destination);
      toast.success('Google Sheet connected. New WhatsApp rows will append automatically.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not connect Google Sheet');
    } finally {
      setSheetSaving(false);
    }
  };

  const syncSheetNow = async () => {
    setSheetSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: { action: 'sync', since: null },
      });
      if (error) throw error;
      await loadSheetDestination();
      toast.success(`Synced ${data?.synced || 0} rows to Google Sheets`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google Sheets sync failed');
    } finally {
      setSheetSyncing(false);
    }
  };

  const dismissPreview = () => {
    setPreviewEntries([]);
    setUploadState('idle');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <h1 className="text-base font-semibold text-brand-dark">Sales Log</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Photo upload button */}
            {isPro ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState === 'parsing'}
                className="flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {uploadState === 'parsing'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading...</>
                  : <><Camera className="w-4 h-4" /> Scan book</>
                }
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg cursor-not-allowed"
                title="Upgrade to Pro to use Sales Book Scanner">
                <Lock className="w-3.5 h-3.5" />
                Scan book
              </div>
            )}
            {filtered.length > 0 && (
              <button
                onClick={downloadCsv}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-dark border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Preview modal */}
      {(uploadState === 'preview' || uploadState === 'saving') && previewEntries.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-brand-dark">
                  Found {previewEntries.length} {previewEntries.length === 1 ? 'entry' : 'entries'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Review before saving to your log</p>
              </div>
              <button onClick={dismissPreview} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
              {previewEntries.map((e, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        e.entry_type === 'sale'    ? 'bg-emerald-50 text-emerald-700' :
                        e.entry_type === 'expense' ? 'bg-red-50 text-red-600' :
                        e.entry_type === 'refund'  ? 'bg-amber-50 text-amber-700' :
                                                     'bg-slate-100 text-slate-500'
                      }`}>
                        {e.entry_type}
                      </span>
                      {e.sale_date && (
                        <span className="text-xs text-slate-400">{fmtDate(e.sale_date)}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-brand-dark mt-1">
                      {e.item ?? <span className="text-slate-400 italic">Unknown item</span>}
                      {e.qty ? ` × ${e.qty}` : ''}
                    </p>
                    {e.customer && (
                      <p className="text-xs text-slate-400">{e.customer}</p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-brand-dark flex-shrink-0">
                    {e.total ? fmt(e.total) : '—'}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={dismissPreview}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePhotoEntries}
                disabled={uploadState === 'saving'}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {uploadState === 'saving'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  : <><CheckCircle2 className="w-4 h-4" /> Save {previewEntries.length} {previewEntries.length === 1 ? 'entry' : 'entries'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {whatsappCount > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-950">WhatsApp is feeding this log</p>
              <p className="text-xs text-emerald-700 mt-1">
                Sales sent from WhatsApp are saved here automatically. Connect Google Sheets once to append new rows there too.
              </p>
              <Link
                to="/team-outlets"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Shield className="h-3.5 w-3.5" />
                Manage staff, outlets, and WhatsApp access
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white border border-brand-dark/10 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-dark">Google Sheets destination</p>
              <p className="text-xs text-slate-500 mt-1">
                Share your Sheet with Hoursback, paste the URL, and new WhatsApp sales append as formula-friendly rows.
              </p>
              {serviceAccountEmail && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Share sheet with</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-700">{serviceAccountEmail}</p>
                </div>
              )}
              {sheetDestination?.last_sync_at && (
                <p className="text-xs text-emerald-700 mt-1">
                  Last sync {new Date(sheetDestination.last_sync_at).toLocaleString()}
                </p>
              )}
              {sheetDestination?.last_sync_error && (
                <p className="text-xs text-red-600 mt-1">{sheetDestination.last_sync_error}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto_auto]">
            <input
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="Google Sheet URL or spreadsheet ID"
            />
            <input
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="Tab name"
            />
            <button
              type="button"
              onClick={saveSheetDestination}
              disabled={sheetSaving}
              className="rounded-lg bg-brand-dark px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark/90 disabled:opacity-60"
            >
              {sheetSaving ? 'Saving...' : 'Save sheet'}
            </button>
            <button
              type="button"
              onClick={syncSheetNow}
              disabled={sheetSyncing || !sheetDestination?.connected}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              {sheetSyncing ? 'Syncing...' : 'Sync rows'}
            </button>
          </div>
        </div>

        {recentCloseout && (
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-400">Latest closeout</p>
                <p className="mt-1 text-sm font-semibold text-brand-dark">
                  {recentCloseout.status.replace(/_/g, ' ')} by {recentCloseout.staff_name || 'WhatsApp'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Logged sales {fmt(recentCloseout.expected_sales_total)} · Collected {fmt(recentCloseout.actual_collected_total)} · Expenses {fmt(recentCloseout.expenses_total)}
                </p>
              </div>
              <div className={`rounded-xl px-3 py-2 text-sm font-bold ${
                Math.abs(Number(recentCloseout.variance_total || 0)) < 1
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                Variance {fmt(recentCloseout.variance_total)}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <p className="text-xs text-slate-400 mb-1">Total entries</p>
            <p className="text-2xl font-bold text-brand-dark">{entries.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <p className="text-xs text-slate-400 mb-1">Total sales</p>
            <p className="text-2xl font-bold text-brand-dark">
              {totalAmount > 0 ? `₦${totalAmount.toLocaleString()}` : '—'}
              {refundAmount > 0 && (
                <span className="block text-xs font-medium text-amber-600 mt-0.5">
                  Net ₦{netSalesAmount.toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <p className="text-xs text-slate-400 mb-1">This month</p>
            <p className="text-2xl font-bold text-brand-dark">{thisMonth}</p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <p className="text-xs text-slate-400 mb-1">WhatsApp</p>
            <p className="text-2xl font-bold text-brand-dark">{whatsappCount}</p>
          </div>
        </div>

        {/* Sales chart */}
        {hasChartData && (
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-brand-dark">Sales & Expenses</p>
              <div className="flex gap-1">
                {([14, 30] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setChartDays(n)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      chartDays === n
                        ? 'bg-brand-dark text-white'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {n}d
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={chartDays === 14 ? 12 : 6} barGap={2}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={chartDays === 14 ? 1 : 4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`}
                  width={48}
                />
                <Tooltip
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, '']}
                  labelStyle={{ fontSize: 12, color: '#0F1012' }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" fill="#f87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pro upsell banner for free users */}
        {!isPro && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4">
            <Camera className="w-8 h-8 text-emerald-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900">Sales Book Scanner</p>
              <p className="text-xs text-emerald-700 mt-0.5">Take a photo of your physical sales book — AI reads every entry and logs them automatically. Pro only.</p>
            </div>
            <Link
              to="/account"
              className="flex-shrink-0 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              Upgrade
            </Link>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="">All types</option>
            <option value="sale">Sale</option>
            <option value="expense">Expense</option>
            <option value="refund">Refund</option>
            <option value="note">Note</option>
          </select>
          {staffOptions.length > 0 && (
            <select
              value={filterStaff}
              onChange={e => setFilterStaff(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="">All staff</option>
              {staffOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          {shopOptions.length > 0 && (
            <select
              value={filterShop}
              onChange={e => setFilterShop(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="">All shops</option>
              {shopOptions.map(shop => (
                <option key={shop} value={shop}>{shop}</option>
              ))}
            </select>
          )}
          {channelOptions.length > 0 && (
            <select
              value={filterChannel}
              onChange={e => setFilterChannel(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-slate-400"
            >
              <option value="">All channels</option>
              {channelOptions.map(channel => (
                <option key={channel} value={channel}>{labelChannel(channel)}</option>
              ))}
            </select>
          )}
          {filtered.length > 0 && (
            <button
              onClick={() => setExpandedTable(true)}
              className="inline-flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              title="Expand Sales Log table"
            >
              <Maximize2 className="w-4 h-4" />
              Expand
            </button>
          )}
          {filtered.length > 0 && (
            <button
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 text-sm border border-emerald-200 rounded-lg px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Download a CSV you can import into Google Sheets"
            >
              <Sheet className="w-4 h-4" />
              Sheets CSV
            </button>
          )}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-10 text-center">
            <p className="text-2xl mb-3">📝</p>
            <p className="font-semibold text-brand-dark mb-1">No entries yet</p>
            <p className="text-sm text-slate-400">
              Staff can log sales by typing{' '}
              <code className="font-mono bg-slate-100 px-1 rounded">Sold 2 fittings for 5000 cash</code>{' '}
              in WhatsApp, or scanning your sales book with the button above.
            </p>
          </div>
        ) : (
          <div className={expandedTable ? 'fixed inset-0 z-50 flex flex-col bg-white p-4' : 'bg-white rounded-2xl border border-brand-dark/10 overflow-hidden'}>
            {expandedTable && (
              <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-brand-dark">Sales Log Table</h2>
                  <p className="text-xs text-slate-500">{filtered.length} rows · scroll across to inspect every column</p>
                </div>
                <button
                  onClick={() => setExpandedTable(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Minimize2 className="h-4 w-4" />
                  Close
                </button>
              </div>
            )}
            <div className={expandedTable ? 'flex-1 overflow-auto rounded-xl border border-slate-100' : 'overflow-x-auto'}>
              <table className={`${expandedTable ? 'min-w-[1280px]' : 'w-full min-w-[1040px]'} text-sm`}>
                <thead className="sticky top-0 bg-white z-[1]">
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Shop</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Staff</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Item</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Unit Price</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Channel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => (
                    <tr
                      key={e.id}
                      className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}
                      title={e.raw_text}
                    >
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {fmtDate(e.sale_date ?? e.created_at)}
                        {e.source === 'telegram_photo' || e.source === 'web_upload'
                          ? <span className="ml-1.5 text-[10px] text-slate-300">Photo</span>
                          : null
                        }
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{e.parsed_data?.shop ?? ''}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{e.triggered_by ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate">
                        {e.parsed_data?.item ?? <span className="text-slate-400 italic">{e.raw_text.slice(0, 40)}</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{e.parsed_data?.qty ?? ''}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(e.parsed_data?.unit_price)}</td>
                      <td className="px-4 py-3 text-right font-medium text-brand-dark">{fmt(e.parsed_data?.total)}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[140px] truncate">{e.parsed_data?.customer ?? ''}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{e.parsed_data?.payment_method ?? ''}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${channelClass(e.channel || inferChannel(e.source))}`}>
                          {labelChannel(e.channel || inferChannel(e.source))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                          e.entry_type === 'sale'    ? 'bg-emerald-50 text-emerald-700' :
                          e.entry_type === 'expense' ? 'bg-red-50 text-red-600' :
                          e.entry_type === 'refund'  ? 'bg-amber-50 text-amber-700' :
                                                       'bg-slate-100 text-slate-500'
                        }`}>
                          {e.entry_type.charAt(0).toUpperCase() + e.entry_type.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => deleteEntry(e.id)}
                          disabled={deletingId === e.id}
                          className="p-1 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
                          title="Delete entry"
                        >
                          {deletingId === e.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filtered.some(e => ['sale', 'refund'].includes(e.entry_type) && e.parsed_data?.total) && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td colSpan={6} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                        Net sales
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-brand-dark">
                        {fmt(netSalesAmount)}
                      </td>
                      <td colSpan={5} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  );
}
