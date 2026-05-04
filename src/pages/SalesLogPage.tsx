import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Download, FileText, Camera, X, Loader2, CheckCircle2, Lock, Trash2 } from 'lucide-react';
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
    notes?: string | null;
    sale_date?: string | null;
  } | null;
  sale_date: string | null;
  source: string | null;
  created_at: string;
}

interface ParsedEntry {
  entry_type: string;
  item: string | null;
  qty: number | null;
  unit_price: number | null;
  total: number | null;
  customer: string | null;
  notes: string | null;
  sale_date: string | null;
}

function fmt(n: number | null | undefined) {
  if (n == null) return '';
  return `₦${Number(n).toLocaleString()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function SalesLogPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<BotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStaff, setFilterStaff] = useState('');

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

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    // Check pro status
    supabase
      .from('profiles')
      .select('subscription_expires_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsPro(!!data?.subscription_expires_at && new Date(data.subscription_expires_at) > new Date());
      });
    loadEntries();
  }, [user, navigate]);

  const staffOptions = useMemo(() =>
    [...new Set(entries.map(e => e.triggered_by).filter(Boolean))].sort() as string[],
    [entries]
  );

  const filtered = useMemo(() =>
    entries.filter(e => {
      if (filterType && e.entry_type !== filterType) return false;
      if (filterStaff && e.triggered_by !== filterStaff) return false;
      return true;
    }),
    [entries, filterType, filterStaff]
  );

  const totalAmount = useMemo(() =>
    filtered
      .filter(e => e.entry_type === 'sale')
      .reduce((sum, e) => sum + (e.parsed_data?.total ?? 0), 0),
    [filtered]
  );

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth = entries.filter(e => new Date(e.created_at) >= monthStart).length;

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
      if (e.entry_type === 'expense') day.expenses += e.parsed_data?.total ?? 0;
    }
    return days;
  }, [entries, chartDays]);

  const hasChartData = chartData.some(d => d.sales > 0 || d.expenses > 0);

  const downloadCsv = () => {
    const rows = [
      ['Date', 'Staff', 'Item', 'Qty', 'Unit Price', 'Total', 'Customer', 'Type', 'Source', 'Raw'],
      ...filtered.map(e => [
        fmtDate(e.sale_date ?? e.created_at),
        e.triggered_by ?? '',
        e.parsed_data?.item ?? '',
        e.parsed_data?.qty != null ? String(e.parsed_data.qty) : '',
        e.parsed_data?.unit_price != null ? String(e.parsed_data.unit_price) : '',
        e.parsed_data?.total != null ? String(e.parsed_data.total) : '',
        e.parsed_data?.customer ?? '',
        e.entry_type,
        e.source ?? 'telegram_text',
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
            <Link to="/telegram" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Link>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <p className="text-xs text-slate-400 mb-1">Total entries</p>
            <p className="text-2xl font-bold text-brand-dark">{entries.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <p className="text-xs text-slate-400 mb-1">Total sales</p>
            <p className="text-2xl font-bold text-brand-dark">
              {totalAmount > 0 ? `₦${totalAmount.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <p className="text-xs text-slate-400 mb-1">This month</p>
            <p className="text-2xl font-bold text-brand-dark">{thisMonth}</p>
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
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-10 text-center">
            <p className="text-2xl mb-3">📝</p>
            <p className="font-semibold text-brand-dark mb-1">No entries yet</p>
            <p className="text-sm text-slate-400">
              Staff can log sales by typing{' '}
              <code className="font-mono bg-slate-100 px-1 rounded">/log</code> in your Telegram bot,
              or scan your sales book with the button above.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-brand-dark/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Staff</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Item</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Customer</th>
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
                          ? <span className="ml-1.5 text-[10px] text-slate-300">📷</span>
                          : null
                        }
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{e.triggered_by ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate">
                        {e.parsed_data?.item ?? <span className="text-slate-400 italic">{e.raw_text.slice(0, 40)}</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{e.parsed_data?.qty ?? ''}</td>
                      <td className="px-4 py-3 text-right font-medium text-brand-dark">{fmt(e.parsed_data?.total)}</td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{e.parsed_data?.customer ?? ''}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                          e.entry_type === 'sale'    ? 'bg-emerald-50 text-emerald-700' :
                          e.entry_type === 'expense' ? 'bg-red-50 text-red-600' :
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
                {filtered.some(e => e.entry_type === 'sale' && e.parsed_data?.total) && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase">
                        Total (sales)
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-brand-dark">
                        {fmt(totalAmount)}
                      </td>
                      <td colSpan={3} />
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
