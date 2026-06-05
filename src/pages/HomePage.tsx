import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Inbox,
  MessageCircle,
  Plus,
  Radio,
  Receipt,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MobileNav } from '../components/MobileNav';
import { UserAvatar } from '../components/UserAvatar';

interface BotEntry {
  entry_type: string;
  parsed_data?: { total?: number | null } | null;
  created_at: string;
}

interface CustomerRequest {
  id: string;
  status: string;
  payment_status?: string | null;
  request_type?: string | null;
  items?: Array<{ name?: string; qty?: number | null }> | null;
  order_code?: string | null;
  created_at: string;
}

interface Workflow {
  id: string;
  status: string;
}

interface WorkflowRun {
  id: string;
  status: string;
  created_at: string;
}

interface DataSource {
  id: string;
  verified: boolean;
}

interface KapsoConnection {
  connection_type?: string | null;
  phone_number_id?: string | null;
  last_webhook_at?: string | null;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function money(value: number) {
  return `₦${Number(value || 0).toLocaleString('en-NG')}`;
}

function requestSummary(items?: CustomerRequest['items']) {
  if (!items?.length) return 'Customer request';
  return items.map((item) => `${item.qty ? `${item.qty} x ` : ''}${item.name || 'item'}`).join(', ');
}

function timeAgo(iso?: string | null) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<BotEntry[]>([]);
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [connections, setConnections] = useState<KapsoConnection[]>([]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const today = startOfToday();
    const [entriesRes, requestsRes, workflowsRes, runsRes, sourcesRes, connectionsRes] = await Promise.all([
      supabase
        .from('bot_entries')
        .select('entry_type, parsed_data, created_at')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .limit(500),
      supabase
        .from('kapso_orders')
        .select('id,status,payment_status,request_type,items,order_code,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('workflows')
        .select('id,status')
        .eq('user_id', user.id),
      supabase
        .from('workflow_runs')
        .select('id,status,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('data_sources')
        .select('id,verified')
        .eq('user_id', user.id),
      supabase
        .from('kapso_connections')
        .select('connection_type,phone_number_id,last_webhook_at')
        .eq('user_id', user.id),
    ]);

    const firstError = [entriesRes, requestsRes, workflowsRes, runsRes, sourcesRes, connectionsRes].find((res) => res.error)?.error;
    if (firstError) {
      toast.error(firstError.message || 'Could not load command center');
    } else {
      setEntries((entriesRes.data as BotEntry[]) || []);
      setRequests((requestsRes.data as CustomerRequest[]) || []);
      setWorkflows((workflowsRes.data as Workflow[]) || []);
      setRuns((runsRes.data as WorkflowRun[]) || []);
      setSources((sourcesRes.data as DataSource[]) || []);
      setConnections((connectionsRes.data as KapsoConnection[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const stats = useMemo(() => {
    const sales = entries
      .filter((entry) => entry.entry_type === 'sale')
      .reduce((sum, entry) => sum + Number(entry.parsed_data?.total || 0), 0);
    const expenses = entries
      .filter((entry) => entry.entry_type === 'expense')
      .reduce((sum, entry) => sum + Number(entry.parsed_data?.total || 0), 0);
    const openRequests = requests.filter((request) => !['fulfilled', 'cancelled'].includes(request.status));
    const receipts = requests.filter((request) => request.payment_status === 'receipt_sent');
    const activeWorkflows = workflows.filter((workflow) => workflow.status === 'active');
    const failedRuns = runs.filter((run) => run.status === 'failed');
    const connectedChannels = connections.filter((connection) => !!connection.phone_number_id);
    const verifiedSources = sources.filter((source) => source.verified);
    return {
      sales,
      expenses,
      profit: sales - expenses,
      openRequests,
      receipts,
      activeWorkflows,
      failedRuns,
      connectedChannels,
      verifiedSources,
    };
  }, [entries, requests, workflows, runs, sources, connections]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light pb-24">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/home" className="flex items-center">
            <img src="/logo.svg" alt="Hoursback" className="h-[32px] w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Link to="/capture" className="px-3 py-1.5 rounded-full text-slate-600 hover:bg-slate-100">Capture</Link>
            <Link to="/data-log" className="px-3 py-1.5 rounded-full text-slate-600 hover:bg-slate-100">Operations</Link>
            <Link to="/reports" className="px-3 py-1.5 rounded-full text-slate-600 hover:bg-slate-100">Reports</Link>
            <Link to="/workflows" className="px-3 py-1.5 rounded-full text-slate-600 hover:bg-slate-100">Automations</Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-brand-dark"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <Link to="/account" title="Account">
              <UserAvatar user={user} size="sm" />
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="rounded-3xl border border-brand-dark/10 bg-white p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Command center</p>
              <h1 className="mt-2 text-3xl font-bold text-brand-dark">Capture activity. Run operations. Generate reports.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                Hoursback brings business activity from WhatsApp, manual entries, spreadsheets, uploads, and webhooks into one operating layer.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/capture" className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark/90">
                <Plus className="w-4 h-4" />
                Capture data
              </Link>
              <Link to="/workflows/new" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Bot className="w-4 h-4" />
                Create automation
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          {[
            { label: 'Sales today', value: money(stats.sales), icon: TrendingUp, tone: 'emerald' },
            { label: 'Estimated profit', value: money(stats.profit), icon: Activity, tone: 'blue' },
            { label: 'Open requests', value: String(stats.openRequests.length), icon: Inbox, tone: 'amber' },
            { label: 'Receipts to verify', value: String(stats.receipts.length), icon: Receipt, tone: 'purple' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl border border-brand-dark/10 bg-white p-4">
              <div className={`mb-3 inline-flex rounded-xl p-2 ${
                tone === 'emerald' ? 'bg-emerald-50 text-emerald-700'
                  : tone === 'blue' ? 'bg-blue-50 text-blue-700'
                    : tone === 'amber' ? 'bg-amber-50 text-amber-700'
                      : 'bg-purple-50 text-purple-700'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium text-slate-400">{label}</p>
              <p className="mt-1 text-2xl font-bold text-brand-dark">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-brand-dark/10 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-dark">Operations queue</p>
                <p className="text-xs text-slate-500">Requests, receipts, and follow-ups that need attention.</p>
              </div>
              <Link to="/orders" className="text-sm font-semibold text-emerald-700 hover:underline">View requests</Link>
            </div>
            <div className="mt-4 space-y-3">
              {stats.receipts.slice(0, 3).map((request) => (
                <Link key={request.id} to="/orders" className="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{requestSummary(request.items)}</p>
                    <p className="mt-0.5 text-xs text-blue-700">Receipt waiting for owner verification {request.order_code ? `· ${request.order_code}` : ''}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </Link>
              ))}
              {stats.openRequests.slice(0, 4).map((request) => (
                <Link key={request.id} to="/orders" className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{requestSummary(request.items)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{request.status.replace(/_/g, ' ')} · {timeAgo(request.created_at)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              ))}
              {!stats.openRequests.length && !stats.receipts.length && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="mt-2 text-sm font-semibold text-brand-dark">No open customer queue</p>
                  <p className="mt-1 text-xs text-slate-500">Capture requests through WhatsApp, forms, uploads, or manual entry.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-brand-dark/10 bg-white p-5">
            <p className="text-sm font-semibold text-brand-dark">System health</p>
            <div className="mt-4 space-y-3">
              {[
                {
                  label: 'Capture channels',
                  value: `${stats.connectedChannels.length} WhatsApp number${stats.connectedChannels.length === 1 ? '' : 's'} connected`,
                  icon: Radio,
                  to: '/capture',
                },
                {
                  label: 'Data sources',
                  value: `${stats.verifiedSources.length}/${sources.length} verified`,
                  icon: Database,
                  to: '/data-sources',
                },
                {
                  label: 'Automations',
                  value: `${stats.activeWorkflows.length} active workflow${stats.activeWorkflows.length === 1 ? '' : 's'}`,
                  icon: Bot,
                  to: '/workflows',
                },
                {
                  label: 'Latest reports',
                  value: stats.failedRuns.length ? `${stats.failedRuns.length} recent issue${stats.failedRuns.length === 1 ? '' : 's'}` : `${runs.length} recent run${runs.length === 1 ? '' : 's'}`,
                  icon: FileText,
                  to: '/reports',
                },
              ].map(({ label, value, icon: Icon, to }) => (
                <Link key={label} to={to} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50">
                  <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{label}</p>
                    <p className="text-xs text-slate-500">{value}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { title: 'Capture', body: 'Bring in WhatsApp messages, manual entries, uploads, spreadsheets, and webhook events.', icon: ClipboardList, to: '/capture' },
            { title: 'Operate', body: 'Manage requests, sales, expenses, closeout, receipts, and payment review.', icon: MessageCircle, to: '/orders' },
            { title: 'Report', body: 'Review generated outputs and export polished reports for decisions.', icon: FileText, to: '/reports' },
            { title: 'Automate', body: 'Schedule recurring monitoring, summaries, and business workflows.', icon: Bot, to: '/workflows' },
          ].map(({ title, body, icon: Icon, to }) => (
            <Link key={title} to={to} className="rounded-3xl border border-brand-dark/10 bg-white p-5 hover:border-emerald-200 hover:bg-emerald-50/30">
              <Icon className="w-5 h-5 text-emerald-600" />
              <p className="mt-4 text-sm font-semibold text-brand-dark">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
            </Link>
          ))}
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
