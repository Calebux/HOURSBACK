import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { ProUpgradeButton } from '../components/ProUpgradeButton';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ReportRenderer } from '../components/ReportRenderer';
import {
  Play, Plus, Clock, CheckCircle2, XCircle, Bot,
  Trash2, Copy, CheckCheck, Pencil, X, Link2, FileText,
  Loader2, MoreVertical, Pause, TrendingUp, Activity,
  ChevronDown, ChevronUp, ExternalLink, Send, Crown, Lock
} from 'lucide-react';
import { MobileNav } from '../components/MobileNav';

interface Workflow {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'paused';
  trigger_config: any;
  action_config: any;
  next_run?: string;
  last_run?: string;
}

interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: 'success' | 'failed';
  generated_output: string;
  error_message?: string;
  created_at: string;
}

interface TelegramRun {
  id: string;
  workflow_key: string;
  workflow_name: string;
  triggered_by: string | null;
  role: string;
  status: 'success' | 'error';
  result: string | null;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}


function SuccessRateBadge({ rate, total }: { rate: number | null; total: number }) {
  if (total === 0) return <span className="text-xs text-slate-400">No runs yet</span>;
  const color = rate! >= 80 ? 'text-emerald-600 bg-emerald-50' : rate! >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {rate}% success
    </span>
  );
}

function FirstRunOnboarding({ user }: { user: any }) {
  const firstName = (user?.user_metadata?.name || user?.email || '').split(/[\s@]/)[0] || 'there';

  const starters = [
    {
      id: 'wkflow-55',
      title: '5-Line Profit Check',
      category: 'Finance',
      color: '#4285F4',
      desc: 'Upload your bank statement or paste your sales & expense sheet. Get a complete 5-Line Income Statement — Revenue, COGS, Gross Profit, Operating Expenses, Net Profit — with plain-English interpretation and specific flags for theft risk, vendor price hikes, and pricing opportunities you\'re leaving on the table.',
      time: '2 min setup',
    },
    {
      id: 'wkflow-14',
      title: 'Weekly Cash Flow Report',
      category: 'Finance',
      color: '#10b981',
      desc: 'Connects to your Google Sheets income & expense data. Delivers a weekly cash position summary every Monday morning — so you always know your runway before the week starts.',
      time: '5 min setup',
    },
    {
      id: 'wkflow-7',
      title: 'Industry News Digest',
      category: 'Research',
      color: '#6366f1',
      desc: 'Monitors news and publications in your niche every week. Curated digest of the trends you actually need to know — without spending hours reading through noise.',
      time: '3 min setup',
    },
    {
      id: 'wkflow-5',
      title: 'Competitor Monitor',
      category: 'Marketing',
      color: '#f59e0b',
      desc: 'Watches your competitors\' websites for price changes, new product launches, and messaging shifts. Weekly alert so you\'re never caught off guard.',
      time: '3 min setup',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-10">
      {/* Greeting */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-brand-dark rounded-2xl flex items-center justify-center mx-auto text-white text-xl font-bold">
          {(user?.email?.[0] || 'H').toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold">Welcome, {firstName}</h2>
          <p className="text-slate-500 text-sm mt-1.5 max-w-sm mx-auto">
            Pick a workflow to get started. Setup takes under 5 minutes — then it runs automatically on a schedule you choose.
          </p>
        </div>
      </div>

      {/* Starter workflows */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recommended starting points</p>
        <div className="space-y-3">
        {starters.map(wf => (
          <Link key={wf.id} to={`/workflows/new?id=${wf.id}`}>
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 flex items-center gap-4 hover:border-brand-dark/20 hover:shadow-sm transition-all cursor-pointer group">
              <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: wf.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${wf.color}15`, color: wf.color }}>{wf.category}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">Free</span>
                </div>
                <p className="font-bold text-sm text-brand-dark leading-snug">{wf.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{wf.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-brand-dark group-hover:text-white transition-all">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-slate-400">{wf.time}</span>
              </div>
            </div>
          </Link>
        ))}
        </div>
        <Link to="/workflows/new" className="flex items-center justify-center gap-1 text-sm text-slate-400 hover:text-brand-dark transition-colors py-2">
          Browse all 50+ workflows →
        </Link>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { n: '1', t: 'Connect your data', d: 'Paste a Google Sheets URL or website link. Takes 30 seconds.' },
          { n: '2', t: 'Set a schedule', d: 'Daily, weekly, or monthly — runs automatically, no input needed.' },
          { n: '3', t: 'Inbox insights', d: 'A plain-English report lands in your email every time it runs.' },
        ].map(s => (
          <div key={s.n} className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
            <div className="w-7 h-7 rounded-full bg-brand-dark text-white text-xs font-bold flex items-center justify-center mx-auto mb-2.5">{s.n}</div>
            <p className="font-semibold text-xs text-brand-dark mb-1">{s.t}</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkflowsDashboard() {
  const { user, refreshPro, isPro } = useAuth();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [telegramRuns, setTelegramRuns] = useState<TelegramRun[]>([]);
  const [telegramConnected, setTelegramConnected] = useState<boolean | null>(null);
  const [telegramMonthCount, setTelegramMonthCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [justRanId, setJustRanId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editSchedule, setEditSchedule] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    refreshPro();
    async function loadData() {
      try {
        const monthStart = new Date();
        monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const [{ data: wData }, { data: rData }, { data: tgData }, { data: botData }, { count: monthCnt }] = await Promise.all([
          supabase.from('workflows').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
          supabase.from('workflow_runs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50),
          supabase.from('telegram_runs').select('id, workflow_key, workflow_name, triggered_by, role, status, result, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
          supabase.from('telegram_bots').select('bot_username').eq('user_id', user!.id).maybeSingle(),
          supabase.from('telegram_runs').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).gte('created_at', monthStart.toISOString()),
        ]);
        if (wData) setWorkflows(wData);
        if (rData) setRuns(rData);
        if (tgData) setTelegramRuns(tgData);
        setTelegramConnected(!!botData?.bot_username);
        setTelegramMonthCount(monthCnt ?? 0);
      } catch (err) {
        console.error('Error loading workflows', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, navigate, refreshPro]);

  // Computed stats
  const activeWorkflows = workflows.filter(w => w.status === 'active');
  const pausedWorkflows = workflows.filter(w => w.status === 'paused');
  const successfulRuns = runs.filter(r => r.status === 'success').length;
  const successRate = runs.length > 0 ? Math.round((successfulRuns / runs.length) * 100) : null;

  const getWorkflowStats = (workflowId: string) => {
    const wRuns = runs.filter(r => r.workflow_id === workflowId);
    const success = wRuns.filter(r => r.status === 'success').length;
    return {
      total: wRuns.length,
      rate: wRuns.length > 0 ? Math.round((success / wRuns.length) * 100) : null,
      lastRun: wRuns[0]?.created_at,
      latestOutput: wRuns[0],
    };
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await supabase.from('workflows').update({ status: newStatus }).eq('id', id);
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: newStatus as 'active' | 'paused' } : w));
    toast.success(`Workflow ${newStatus}`);
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Delete this workflow? This cannot be undone.')) return;
    await supabase.from('workflows').delete().eq('id', id);
    setWorkflows(prev => prev.filter(w => w.id !== id));
    toast.success('Workflow deleted');
  };

  const runNow = async (workflow: Workflow) => {
    setRunningId(workflow.id);
    setJustRanId(null);
    try {
      const { error } = await supabase.functions.invoke('execute-watchers', { body: { workflow_id: workflow.id } });
      if (error) throw error;
      const { data } = await supabase.from('workflow_runs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50);
      if (data) setRuns(data);
      setJustRanId(workflow.id);
      posthog.capture('workflow_run', { workflow_id: workflow.id, workflow_name: workflow.name, category: workflow.category });
      toast.success('Run complete!');
    } catch (err: any) {
      toast.error(err.message || 'Run failed');
    } finally {
      setRunningId(null);
    }
  };

  const copyWebhookUrl = (id: string) => {
    navigator.clipboard.writeText(`${supabaseUrl}/functions/v1/webhook-receiver?workflow_id=${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setEditEmail(workflow.action_config?.to || '');
    setEditSchedule(workflow.trigger_config?.schedule || 'weekly');
  };

  const saveEdit = async () => {
    if (!editingWorkflow) return;
    setIsSaving(true);
    try {
      const updates: any = { action_config: { ...editingWorkflow.action_config, to: editEmail } };
      if (editingWorkflow.trigger_config?.type === 'schedule') {
        updates.trigger_config = { ...editingWorkflow.trigger_config, schedule: editSchedule };
      }
      await supabase.from('workflows').update(updates).eq('id', editingWorkflow.id);
      setWorkflows(prev => prev.map(w => w.id === editingWorkflow.id ? { ...w, ...updates } : w));
      toast.success('Workflow updated');
      setEditingWorkflow(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light text-brand-dark">
        {/* Nav skeleton */}
        <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="h-9 w-36 bg-slate-200 rounded-lg animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-7 w-20 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-7 w-24 bg-slate-200 rounded-full animate-pulse" />
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-8 max-w-6xl">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-8 w-44 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-10 w-36 bg-slate-200 rounded-full animate-pulse" />
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-brand-dark/10 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* Workflow cards skeleton */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2">
                      <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  <div className="flex gap-1.5 mt-4">
                    {[1,2,3,4,5,6].map(j => (
                      <div key={j} className="w-2 h-2 bg-slate-100 rounded-full animate-pulse" />
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                    <div className="h-8 w-20 bg-slate-100 rounded-full animate-pulse" />
                    <div className="h-8 w-16 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const WorkflowCard = ({ workflow }: { workflow: Workflow }) => {
    const stats = getWorkflowStats(workflow.id);
    const isWebhook = workflow.trigger_config?.type === 'webhook';
    const isScheduled = workflow.trigger_config?.type === 'schedule';
    const justRan = justRanId === workflow.id;
    const latestRun = justRan ? stats.latestOutput : null;

    return (
      <div className="bg-white rounded-2xl border border-brand-dark/10 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${workflow.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              <h3 className="font-semibold text-base leading-tight">{workflow.name}</h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">{workflow.category}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => runNow(workflow)}
                disabled={!!runningId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
              >
                {runningId === workflow.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Play className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{runningId === workflow.id ? 'Running...' : 'Run now'}</span>
              </button>

              {/* 3-dot menu */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === workflow.id ? null : workflow.id)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openMenuId === workflow.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                    <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[150px]">
                      <button
                        onClick={() => { openEdit(workflow); setOpenMenuId(null); }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => { toggleStatus(workflow.id, workflow.status); setOpenMenuId(null); }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        {workflow.status === 'active'
                          ? <><Pause className="w-3.5 h-3.5" /> Pause</>
                          : <><Play className="w-3.5 h-3.5" /> Activate</>}
                      </button>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => { deleteWorkflow(workflow.id); setOpenMenuId(null); }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Second row: trigger + health */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-brand-dark/50">
              <Clock className="w-3 h-3" />
              {isWebhook ? 'Webhook trigger' : `${workflow.trigger_config?.schedule || 'Scheduled'}`}
              {isScheduled && workflow.trigger_config?.time ? ` · ${workflow.trigger_config.time}` : ''}
            </span>
            {stats.lastRun && (
              <span className="text-xs text-slate-400">Last ran {timeAgo(stats.lastRun)}</span>
            )}
            <SuccessRateBadge rate={stats.rate} total={stats.total} />
          </div>

          {/* Mini run history dots */}
          {stats.total > 0 && (() => {
            const recent = runs.filter(r => r.workflow_id === workflow.id).slice(0, 8);
            return (
              <div className="flex items-center gap-1.5 mt-3">
                <span className="text-[10px] text-slate-400 mr-0.5">Last {recent.length} runs</span>
                {recent.reverse().map((r) => (
                  <div
                    key={r.id}
                    title={`${r.status === 'success' ? '✓' : '✗'} ${timeAgo(r.created_at)}`}
                    className={`w-2 h-2 rounded-full ${r.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`}
                  />
                ))}
              </div>
            );
          })()}

          {/* Next run */}
          {isScheduled && workflow.next_run && (
            <p className="text-xs text-slate-400 mt-1">
              Next: {new Date(workflow.next_run).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}

          {/* Webhook URL */}
          {isWebhook && (
            <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
              <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <code className="text-xs text-slate-600 truncate flex-1 font-mono">
                {supabaseUrl}/functions/v1/webhook-receiver?workflow_id={workflow.id}
              </code>
              <button onClick={() => copyWebhookUrl(workflow.id)} className="shrink-0 p-1 hover:bg-slate-200 rounded transition-colors">
                {copiedId === workflow.id ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Inline result after Run Now */}
        {justRan && latestRun && (
          <div className="border-t border-slate-100 bg-slate-50/60 rounded-b-2xl overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {latestRun.status === 'success'
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : <XCircle className="w-4 h-4 text-red-500" />}
                <span className="text-sm font-medium">
                  {latestRun.status === 'success' ? 'Run completed successfully' : 'Run failed'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/reports" className="flex items-center gap-1 text-xs text-brand-blue hover:underline font-medium">
                  <ExternalLink className="w-3 h-3" /> Full report
                </Link>
                <button onClick={() => setJustRanId(null)} className="text-slate-400 hover:text-slate-600 ml-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {latestRun.status === 'success' && latestRun.generated_output && (
              <div className="px-5 pb-4 max-h-80 overflow-y-auto">
                <ReportRenderer output={latestRun.generated_output} compact />
              </div>
            )}
            {latestRun.status === 'failed' && (
              <div className="px-5 pb-4">
                <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 border border-red-100">{latestRun.error_message || 'Unknown error'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark">
      {/* Nav */}
      <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Hoursback" className="h-[36px] w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/workflows/new" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand-dark/60 hover:text-brand-dark transition-colors px-3 py-1.5">
              <Plus className="w-4 h-4" /> Browse
            </Link>
            <Link to="/workflows" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#DA7756] bg-[#DA7756]/10 px-3 py-1.5 rounded-full">
              <Bot className="w-4 h-4" /> Workflows
            </Link>
            <Link to="/reports" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand-dark/60 hover:text-brand-dark transition-colors px-3 py-1.5">
              <FileText className="w-4 h-4" /> Reports
            </Link>
            <Link to="/account" className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 hover:border-brand-dark/30 transition-colors" title="Account">
              <span className="text-sm font-medium">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-6xl pb-24 md:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Workflows</h1>
            <p className="text-brand-dark/60">Automated AI agents running on your schedule.</p>
          </div>
          <Link to="/workflows/new">
            <button className="bg-brand-dark text-white px-5 py-2.5 rounded-full font-medium hover:bg-brand-dark/90 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Workflow
            </button>
          </Link>
        </div>

        {/* Pro teaser strip — shown when user has < 3 workflows */}
        {!isPro && workflows.length < 3 && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Unlock powerful Pro workflows</p>
                <p className="text-slate-500 text-xs mt-0.5">₦9,900/month · Cancel anytime</p>
              </div>
              <ProUpgradeButton className="shrink-0 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                Upgrade to Pro →
              </ProUpgradeButton>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'wkflow-44', name: 'Daily Cash Reconciliation Bot', subtitle: 'Bot logs float, sales, expenses and calculates variance automatically' },
                { id: 'wkflow-1', name: 'Weekly CEO Briefing', subtitle: 'Reads your business data and writes a weekly executive summary' },
                { id: 'wkflow-53', name: 'Escalation Router', subtitle: 'Routes urgent issues to the right person automatically' },
                { id: 'wkflow-2', name: 'Sales Pipeline Health', subtitle: 'Alerts you to stalled deals and changes in probability' },
              ].map(wf => (
                <Link key={wf.id} to="/workflows/new">
                  <div className="bg-white border border-slate-200 rounded-xl p-3 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer">
                    <div className="flex items-start gap-2">
                      <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 leading-tight">{wf.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{wf.subtitle}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contextual upgrade — user is at the 3-workflow limit */}
        {!isPro && workflows.length >= 3 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-amber-900 text-sm">You've deployed 3 workflows — that's the free limit</p>
              <p className="text-amber-700 text-xs mt-0.5">Upgrade to Pro to unlock 12 more workflows and run them all simultaneously.</p>
            </div>
            <ProUpgradeButton className="shrink-0 bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-amber-700 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              Unlock more workflows →
            </ProUpgradeButton>
          </div>
        )}

        {/* Telegram onboarding nudge — shown after first workflow if bot not connected */}
        {telegramConnected === false && workflows.length >= 1 && telegramRuns.length === 0 && (
          <div className="mb-6 bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sky-900 text-sm">Give your team a 24/7 Telegram bot</p>
                <p className="text-sky-700 text-xs mt-0.5">Staff can run cash reconciliations, handovers, and escalations on Telegram — you get every result by email.</p>
              </div>
            </div>
            <a
              href="/settings"
              className="shrink-0 bg-sky-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-sky-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              Set up bot →
            </a>
          </div>
        )}

        {/* Milestone banner — after 10 runs, nudge with hours saved */}
        {!isPro && runs.length >= 10 && workflows.length < 3 && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-emerald-900 text-sm">
                Your workflows have run {runs.length} times — you're saving ~{Math.round(runs.length * 0.5)} hours
              </p>
              <p className="text-emerald-700 text-xs mt-0.5">Go Pro to unlock advanced workflows and multiply those savings.</p>
            </div>
            <ProUpgradeButton className="shrink-0 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              Upgrade to Pro →
            </ProUpgradeButton>
          </div>
        )}

        {/* Stats bar */}
        {workflows.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-brand-dark/10 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeWorkflows.length}</p>
                <p className="text-xs text-slate-500">Active workflows</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-brand-dark/10 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runs.length}</p>
                <p className="text-xs text-slate-500">Total runs</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-brand-dark/10 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{successRate !== null ? `${successRate}%` : '—'}</p>
                <p className="text-xs text-slate-500">Success rate</p>
              </div>
            </div>
          </div>
        )}

        {workflows.length === 0 ? (
          <FirstRunOnboarding user={user} />
        ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Workflow cards */}
          <div className="md:col-span-2 space-y-8">
            <>
              {/* Active */}
              {activeWorkflows.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Active — {activeWorkflows.length}
                  </h2>
                  {activeWorkflows.map(wf => <WorkflowCard key={wf.id} workflow={wf} />)}
                </div>
              )}

              {/* Paused */}
              {pausedWorkflows.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    Paused — {pausedWorkflows.length}
                  </h2>
                  <div className="opacity-70">
                    {pausedWorkflows.map(wf => <WorkflowCard key={wf.id} workflow={wf} />)}
                  </div>
                </div>
              )}
            </>
          </div>

          {/* Recent runs + Telegram Activity */}
          <div className="space-y-6">
            <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Recent Runs</h2>
              {runs.length > 0 && (
                <Link to="/reports" className="text-xs text-brand-blue hover:underline font-medium flex items-center gap-1">
                  View all <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-brand-dark/10 overflow-hidden">
              {runs.length === 0 ? (
                <div className="p-6 text-center text-brand-dark/40 text-sm">No runs yet.</div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                  {runs.slice(0, 20).map(run => {
                    const wf = workflows.find(w => w.id === run.workflow_id);
                    const isSuccess = run.status === 'success';
                    const isExpanded = expandedRunId === run.id;
                    return (
                      <div key={run.id}>
                        <button
                          onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                          className="w-full p-3.5 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 shrink-0 ${isSuccess ? 'text-emerald-500' : 'text-red-500'}`}>
                              {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight truncate">{wf?.name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{timeAgo(run.created_at)}</p>
                            </div>
                            {isSuccess && (
                              <div className="shrink-0 text-slate-300">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </div>
                            )}
                          </div>
                        </button>
                        {isExpanded && isSuccess && run.generated_output && (
                          <div className="px-4 pb-4 border-t border-slate-100 max-h-72 overflow-y-auto bg-slate-50/40">
                            <div className="pt-3">
                              <ReportRenderer output={run.generated_output} compact />
                            </div>
                            <Link to="/reports" className="flex items-center gap-1 text-xs text-brand-blue hover:underline mt-3 font-medium">
                              <ExternalLink className="w-3 h-3" /> Open full report
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </div>

            {/* Telegram Activity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-500" />
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Telegram Activity</h2>
                </div>
                <Link to="/telegram" className="text-xs text-sky-600 hover:underline font-medium">
                  View all →
                </Link>
              </div>
              {/* Free-tier usage bar */}
              {!isPro && telegramConnected && (
                <div className="mb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">{telegramMonthCount}/50 runs this month</p>
                    {telegramMonthCount >= 50 && (
                      <ProUpgradeButton className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Upgrade
                      </ProUpgradeButton>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${telegramMonthCount >= 50 ? 'bg-red-400' : telegramMonthCount >= 35 ? 'bg-amber-400' : 'bg-sky-400'}`}
                      style={{ width: `${Math.min(100, Math.round((telegramMonthCount / 50) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="bg-white rounded-2xl border border-brand-dark/10 overflow-hidden">
                {telegramRuns.length === 0 ? (
                  <div className="p-5 text-center space-y-2">
                    <p className="text-sm text-brand-dark/40">No bot activity yet.</p>
                    <a href="/settings" className="text-xs text-sky-600 hover:underline font-medium block">
                      Set up Telegram bot →
                    </a>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {telegramRuns.map(run => (
                      <div key={run.id} className="p-3.5 flex items-start gap-2.5">
                        <div className={`mt-0.5 shrink-0 ${run.status === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {run.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight truncate">{run.workflow_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {run.triggered_by && (
                              <span className="text-xs text-slate-500">by {run.triggered_by}</span>
                            )}
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              run.role === 'manager'
                                ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                : 'bg-sky-50 text-sky-600 border border-sky-200'
                            }`}>
                              {run.role}
                            </span>
                            <span className="text-xs text-slate-400">{timeAgo(run.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}{/* end workflows.length > 0 */}
      </div>

      <MobileNav />

      {/* Edit modal */}
      {editingWorkflow && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Workflow</h2>
              <button onClick={() => setEditingWorkflow(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-0.5">Workflow</p>
              <p className="font-semibold">{editingWorkflow.name}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Notify email</label>
              <input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
              />
            </div>
            {editingWorkflow.trigger_config?.type === 'schedule' && (
              <div>
                <label className="block text-sm font-semibold mb-2">Frequency</label>
                <select
                  value={editSchedule}
                  onChange={e => setEditSchedule(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingWorkflow(null)} className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={isSaving || !editEmail}
                className="flex-1 px-4 py-2.5 rounded-full bg-brand-dark text-white text-sm font-medium hover:bg-brand-dark/90 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
