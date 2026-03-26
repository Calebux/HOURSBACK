import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ProUpgradeButton } from '../components/ProUpgradeButton';
import {
  ChevronLeft, Send, CheckCircle2, XCircle, Download,
  Search, ChevronDown, ChevronUp, Users, Activity, Crown
} from 'lucide-react';
import { MobileNav } from '../components/MobileNav';

interface TelegramRun {
  id: string;
  workflow_key: string;
  workflow_name: string;
  triggered_by: string | null;
  role: string;
  status: 'success' | 'error';
  result: string | null;
  error_message: string | null;
  created_at: string;
}

function downloadCSV(runs: TelegramRun[]) {
  const header = ['Date', 'Time', 'Workflow', 'Command', 'Triggered By', 'Role', 'Status', 'Result'];
  const escape = (v: string | null | undefined) =>
    `"${(v ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
  const rows = runs.map(r => {
    const d = new Date(r.created_at);
    return [
      escape(d.toLocaleDateString('en-GB')),
      escape(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })),
      escape(r.workflow_name),
      escape(`/${r.workflow_key}`),
      escape(r.triggered_by),
      escape(r.role),
      escape(r.status),
      escape(r.result),
    ].join(',');
  });
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hoursback-telegram-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

const PAGE_SIZE = 25;
const FREE_LIMIT = 50;

export default function TelegramPage() {
  const { user, isPro } = useAuth();
  const navigate = useNavigate();
  const [runs, setRuns] = useState<TelegramRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [botUsername, setBotUsername] = useState('');
  const [staffCount, setStaffCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filterWorkflow, setFilterWorkflow] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    async function load() {
      const [{ data: runsData }, { data: botData }, { count: sc }] = await Promise.all([
        supabase
          .from('telegram_runs')
          .select('id, workflow_key, workflow_name, triggered_by, role, status, result, error_message, created_at')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase.from('telegram_bots').select('bot_username').eq('user_id', user!.id).maybeSingle(),
        supabase.from('telegram_connections').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      ]);
      if (runsData) setRuns(runsData);
      if (botData?.bot_username) setBotUsername(botData.bot_username);
      setStaffCount(sc ?? 0);
      setLoading(false);
    }
    load();
  }, [user, navigate]);

  // Stats
  const totalRuns = runs.length;
  const successCount = runs.filter(r => r.status === 'success').length;
  const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 100) : null;

  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthCount = runs.filter(r => new Date(r.created_at) >= monthStart).length;
  const usagePct = Math.min(100, Math.round((monthCount / FREE_LIMIT) * 100));

  const workflowOptions = useMemo(() =>
    [...new Set(runs.map(r => r.workflow_name))].sort(), [runs]);

  const filtered = useMemo(() => {
    return runs.filter(r => {
      if (filterWorkflow && r.workflow_name !== filterWorkflow) return false;
      if (filterRole && r.role !== filterRole) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.workflow_name.toLowerCase().includes(q) ||
          (r.triggered_by ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [runs, filterWorkflow, filterRole, filterStatus, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v); setPage(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/workflows" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-500" />
              <h1 className="text-base font-semibold text-brand-dark">Telegram Activity</h1>
              {botUsername && (
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">@{botUsername}</span>
              )}
            </div>
          </div>
          {filtered.length > 0 && (
            <button
              onClick={() => downloadCSV(filtered)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-dark border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <p className="text-xs text-slate-400 mb-1">Total runs</p>
            <p className="text-2xl font-bold text-brand-dark">{totalRuns}</p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <p className="text-xs text-slate-400 mb-1">Success rate</p>
            <p className="text-2xl font-bold text-brand-dark">
              {successRate !== null ? `${successRate}%` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <div className="flex items-center gap-1 mb-1">
              <Users className="w-3 h-3 text-slate-400" />
              <p className="text-xs text-slate-400">Team members</p>
            </div>
            <p className="text-2xl font-bold text-brand-dark">{staffCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <div className="flex items-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-slate-400" />
              <p className="text-xs text-slate-400">This month</p>
            </div>
            <p className="text-2xl font-bold text-brand-dark">{monthCount}</p>
          </div>
        </div>

        {/* Usage bar — free tier only */}
        {!isPro && (
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-brand-dark">Bot runs this month</p>
                <p className="text-xs text-slate-400">
                  {monthCount} of {FREE_LIMIT} free runs used
                  {monthCount >= FREE_LIMIT && (
                    <span className="text-red-500 font-semibold ml-1">— limit reached</span>
                  )}
                </p>
              </div>
              <ProUpgradeButton className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors">
                <Crown className="w-3 h-3" /> Upgrade
              </ProUpgradeButton>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usagePct >= 90 ? 'bg-red-400' : usagePct >= 70 ? 'bg-amber-400' : 'bg-sky-400'}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-brand-dark/10 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by workflow or staff name…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none bg-slate-50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterWorkflow}
              onChange={e => handleFilterChange(setFilterWorkflow)(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-brand-dark/70 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="">All workflows</option>
              {workflowOptions.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <select
              value={filterRole}
              onChange={e => handleFilterChange(setFilterRole)(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-brand-dark/70 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="">All roles</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => handleFilterChange(setFilterStatus)(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-brand-dark/70 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            {(filterWorkflow || filterRole || filterStatus || search) && (
              <button
                onClick={() => { setSearch(''); setFilterWorkflow(''); setFilterRole(''); setFilterStatus(''); setPage(0); }}
                className="text-sm text-slate-500 hover:text-red-500 px-2 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
          {(filterWorkflow || filterRole || filterStatus || search) && (
            <p className="text-xs text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Run list */}
        {paginated.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-10 text-center">
            <Send className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            {totalRuns === 0 ? (
              <>
                <p className="text-sm font-medium text-brand-dark/60 mb-1">No bot activity yet</p>
                <Link to="/settings" className="text-sm text-sky-600 hover:underline font-medium">
                  Set up your Telegram bot →
                </Link>
              </>
            ) : (
              <p className="text-sm text-brand-dark/50">No runs match your filters</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-brand-dark/10 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {paginated.map(run => (
                <div key={run.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className={`mt-0.5 shrink-0 ${run.status === 'success' ? 'text-emerald-500' : 'text-red-400'}`}>
                      {run.status === 'success'
                        ? <CheckCircle2 className="w-4 h-4" />
                        : <XCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{run.workflow_name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {run.triggered_by && (
                          <span className="text-xs text-slate-500">by {run.triggered_by}</span>
                        )}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                          run.role === 'manager'
                            ? 'bg-purple-50 text-purple-600 border-purple-200'
                            : 'bg-sky-50 text-sky-600 border-sky-200'
                        }`}>
                          {run.role}
                        </span>
                        <span className="text-xs font-mono text-slate-400">/{run.workflow_key}</span>
                        <span className="text-xs text-slate-400">{timeAgo(run.created_at)}</span>
                        <span className="text-xs text-slate-300 hidden sm:inline">
                          {new Date(run.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' '}
                          {new Date(run.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-slate-300">
                      {expandedId === run.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {expandedId === run.id && (
                    <div className="px-4 pb-4 pl-11">
                      {run.status === 'success' && run.result ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-brand-dark/80 whitespace-pre-wrap leading-relaxed font-mono text-xs">
                          {run.result}
                        </div>
                      ) : run.status === 'error' ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                          {run.error_message || 'An error occurred during this run.'}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
