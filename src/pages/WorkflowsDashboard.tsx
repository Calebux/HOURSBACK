import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ReportRenderer } from '../components/ReportRenderer';
import {
  Play, Plus, Clock, CheckCircle2, XCircle, Bot,
  Trash2, Copy, CheckCheck, Pencil, X, Link2, FileText,
  Loader2, MoreVertical, Pause, TrendingUp, Activity,
  ChevronDown, ChevronUp, ExternalLink
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

export default function WorkflowsDashboard() {
  const { user, refreshPro } = useAuth();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
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
        const [{ data: wData }, { data: rData }] = await Promise.all([
          supabase.from('workflows').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
          supabase.from('workflow_runs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50),
        ]);
        if (wData) setWorkflows(wData);
        if (rData) setRuns(rData);
      } catch (err) {
        console.error('Error loading workflows', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, navigate]);

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
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark" />
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
      <div className="bg-white rounded-2xl border border-brand-dark/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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
          <div className="border-t border-slate-100 bg-slate-50/60">
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
            <Link to="/workspace" className="hidden sm:flex text-sm font-medium text-brand-dark/60 hover:text-brand-dark transition-colors px-3 py-1.5">
              Workspace
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

        {/* Stats bar */}
        {workflows.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
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

        <div className="grid md:grid-cols-3 gap-8">
          {/* Workflow cards */}
          <div className="md:col-span-2 space-y-8">
            {workflows.length === 0 ? (
              <div className="space-y-6">
                {/* Hero empty state */}
                <div className="bg-white rounded-3xl p-10 border border-brand-dark/10 text-center">
                  <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Deploy your first AI workflow</h3>
                  <p className="text-brand-dark/60 max-w-md mx-auto mb-6">
                    Pick a workflow, connect your data source, and Hoursback will monitor it automatically — delivering insights to your inbox on schedule.
                  </p>
                  <Link to="/workflows/new">
                    <button className="bg-brand-dark text-white px-6 py-3 rounded-full font-medium hover:bg-brand-dark/90 transition-colors inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Deploy Your First Workflow
                    </button>
                  </Link>
                </div>

                {/* How it works */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { step: '1', title: 'Choose a workflow', desc: 'Pick from 15 pre-built AI workflows for business intelligence.' },
                    { step: '2', title: 'Connect your data', desc: 'Link a Google Sheet, website, or paste keywords — takes 30 seconds.' },
                    { step: '3', title: 'Get automatic reports', desc: 'Hoursback runs on your schedule and emails you insights.' },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="bg-white rounded-2xl p-5 border border-brand-dark/10">
                      <div className="w-8 h-8 rounded-full bg-brand-dark text-white text-sm font-bold flex items-center justify-center mb-3">{step}</div>
                      <p className="font-semibold text-sm mb-1">{title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>

                {/* Popular starting workflows */}
                <div className="bg-white rounded-2xl border border-brand-dark/10 p-5">
                  <p className="text-sm font-semibold text-slate-500 mb-3">Popular starting workflows</p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {[
                      { id: 'wkflow-7', name: 'Industry News Digest', tag: 'Free', color: 'bg-indigo-50 text-indigo-700' },
                      { id: 'wkflow-8', name: 'Brand Mention Monitor', tag: 'Free', color: 'bg-pink-50 text-pink-700' },
                      { id: 'wkflow-14', name: 'Cash Flow Weekly', tag: 'Free', color: 'bg-emerald-50 text-emerald-700' },
                    ].map(wf => (
                      <Link key={wf.id} to={`/workflows/new?id=${wf.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-blue/40 hover:bg-blue-50/20 transition-all cursor-pointer">
                          <span className="text-sm font-medium">{wf.name}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${wf.color}`}>{wf.tag}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Recent runs */}
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
        </div>
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
