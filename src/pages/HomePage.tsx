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
import { track } from '../lib/analytics';

interface BotEntry {
  entry_type: string;
  parsed_data?: { total?: number | null } | null;
  created_at: string;
  sale_date?: string | null;
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
  customer_menu?: string | null;
  payment_instructions?: string | null;
  fulfillment_rules?: string | null;
  owner_notification_number?: string | null;
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
        .select('entry_type, parsed_data, created_at, sale_date')
        .eq('user_id', user.id)
        .or(`created_at.gte.${today},sale_date.gte.${today}`)
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
        .select('connection_type,phone_number_id,last_webhook_at,customer_menu,payment_instructions,fulfillment_rules,owner_notification_number')
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
    const todayStart = new Date(startOfToday()).getTime();
    const todaysEntries = entries.filter((entry) => {
      const effectiveDate = entry.sale_date || entry.created_at;
      return new Date(effectiveDate).getTime() >= todayStart;
    });
    const sales = todaysEntries
      .filter((entry) => entry.entry_type === 'sale')
      .reduce((sum, entry) => sum + Number(entry.parsed_data?.total || 0), 0);
    const expenses = todaysEntries
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

  const setupSteps = useMemo(() => {
    const hasCapture = stats.connectedChannels.length > 0 || sources.length > 0;
    const hasActivity = entries.length > 0 || requests.length > 0 || stats.verifiedSources.length > 0;
    const hasOperations = stats.openRequests.length > 0 || stats.receipts.length > 0 || entries.length > 0;
    const hasOutput = runs.length > 0 || stats.activeWorkflows.length > 0;

    const steps = [
      {
        title: 'Connect a capture source',
        body: 'Start with WhatsApp, manual entry, a spreadsheet, upload, or webhook.',
        done: hasCapture,
        to: '/capture',
        action: 'Choose source',
        icon: Radio,
      },
      {
        title: 'Add first business activity',
        body: 'Log a sale, import a sheet, upload a receipt, or capture a customer request.',
        done: hasActivity,
        to: hasCapture ? '/operations' : '/capture',
        action: hasCapture ? 'Add activity' : 'Set up capture',
        icon: Plus,
      },
      {
        title: 'Review operations',
        body: 'Check customer requests, sales, expenses, receipts, and follow-ups.',
        done: hasOperations,
        to: '/operations',
        action: 'Open operations',
        icon: Inbox,
      },
      {
        title: 'Create a report or automation',
        body: 'Turn the activity you capture into summaries, PDFs, emails, and scheduled updates.',
        done: hasOutput,
        to: hasActivity ? '/reports' : '/workflows/new',
        action: hasActivity ? 'View reports' : 'Create automation',
        icon: Bot,
      },
    ];

    const nextIndex = steps.findIndex((step) => !step.done);
    return { steps, nextIndex };
  }, [entries.length, requests.length, runs.length, sources.length, stats]);

  const customerLaunchSteps = useMemo(() => {
    const customerConnection = connections.find((connection) => connection.connection_type === 'customer');
    const hasCustomerNumber = !!customerConnection?.phone_number_id;
    const hasCatalogue = !!customerConnection?.customer_menu?.trim();
    const hasPayment = !!customerConnection?.payment_instructions?.trim();
    const hasRules = !!customerConnection?.fulfillment_rules?.trim();
    const hasTestMessage = !!customerConnection?.last_webhook_at;
    const hasReceiptFlow = requests.some((request) => request.payment_status === 'receipt_sent' || request.payment_status === 'verified');

    const steps = [
      {
        title: 'Connect customer WhatsApp number',
        body: 'Use this for customer orders, bookings, service requests, catalogue questions, and receipts.',
        done: hasCustomerNumber,
        to: '/whatsapp',
        action: 'Connect number',
      },
      {
        title: 'Add catalogue or service list',
        body: 'Add products, services, prices, delivery fees, appointment rules, and availability notes.',
        done: hasCatalogue,
        to: '/whatsapp',
        action: 'Add list',
      },
      {
        title: 'Add payment and fulfillment rules',
        body: 'Set bank details, cash-on-pickup rules, delivery/service fees, and staff handoff instructions.',
        done: hasPayment && hasRules,
        to: '/whatsapp',
        action: 'Add rules',
      },
      {
        title: 'Send a real test message',
        body: 'Ask for the menu, place a request, say paid, and send a receipt from a phone you control.',
        done: hasTestMessage,
        to: '/whatsapp',
        action: 'Test customer chat',
      },
      {
        title: 'Verify receipt workflow',
        body: 'Confirm a receipt appears in Orders, verify it, and make sure the customer gets the update.',
        done: hasReceiptFlow,
        to: '/orders',
        action: 'Open orders',
      },
    ];
    const nextIndex = steps.findIndex((step) => !step.done);
    const completed = steps.filter((step) => step.done).length;
    return { steps, nextIndex, completed };
  }, [connections, requests]);

  useEffect(() => {
    if (!user) return;
    const emitOnce = (key: string, event: string, props: Record<string, string | number | boolean> = {}) => {
      const storageKey = `hb_analytics_${user.id}_${key}`;
      if (localStorage.getItem(storageKey)) return;
      track(event, props);
      localStorage.setItem(storageKey, new Date().toISOString());
    };

    if (connections.some((connection) => connection.last_webhook_at)) {
      emitOnce('first_webhook_received', 'first_webhook_received');
    }
    if (requests.length > 0) {
      emitOnce('first_customer_order', 'first_customer_order');
    }
    if (requests.some((request) => request.payment_status === 'receipt_sent' || request.payment_status === 'verified')) {
      emitOnce('first_receipt_received', 'first_receipt_received');
    }
    if (customerLaunchSteps.completed === customerLaunchSteps.steps.length) {
      emitOnce('customer_launch_checklist_completed', 'customer_launch_checklist_completed', {
        steps: customerLaunchSteps.steps.length,
      });
    }
  }, [connections, customerLaunchSteps, requests, user]);

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
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Link to="/capture" className="px-3 py-1.5 rounded-full text-slate-600 hover:bg-slate-100">Capture</Link>
              <Link to="/operations" className="px-3 py-1.5 rounded-full text-slate-600 hover:bg-slate-100">Operations</Link>
              <Link to="/reports" className="px-3 py-1.5 rounded-full text-slate-600 hover:bg-slate-100">Reports</Link>
              <Link to="/workflows" className="px-3 py-1.5 rounded-full text-slate-600 hover:bg-slate-100">Automations</Link>
            </div>
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

        <section className="rounded-3xl border border-brand-dark/10 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-dark">Start here</p>
              <p className="mt-1 text-xs text-slate-500">Follow the next open step. Completed steps stay checked as your business data grows.</p>
            </div>
            {setupSteps.nextIndex >= 0 ? (
              <Link
                to={setupSteps.steps[setupSteps.nextIndex].to}
                className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark/90"
              >
                {setupSteps.steps[setupSteps.nextIndex].action}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/operations"
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Continue operating
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {setupSteps.steps.map((step, index) => {
              const Icon = step.icon;
              const isNext = setupSteps.nextIndex === index;
              return (
                <Link
                  key={step.title}
                  to={step.to}
                  onClick={() => track('customer_launch_checklist_clicked', {
                    step: step.title,
                    done: step.done,
                    next: isNext,
                  })}
                  className={`rounded-2xl border p-4 transition ${
                    step.done
                      ? 'border-emerald-100 bg-emerald-50/60'
                      : isNext
                        ? 'border-brand-dark/20 bg-slate-50 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`rounded-xl p-2 ${
                      step.done ? 'bg-emerald-100 text-emerald-700' : isNext ? 'bg-brand-dark text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {step.done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    {isNext && <span className="rounded-full bg-brand-dark px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Next</span>}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-brand-dark">{step.title}</p>
                  <p className="mt-1 min-h-[48px] text-xs leading-relaxed text-slate-500">{step.body}</p>
                  <span className="mt-3 inline-flex text-xs font-semibold text-emerald-700">{step.done ? 'Done' : step.action}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-dark">Customer request go-live checklist</p>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
                Use this when you want customers to order, book, ask questions, and send receipts from WhatsApp. Businesses that do not run customer work on WhatsApp can keep using Capture, Operations, Reports, and Data Sources.
              </p>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              {customerLaunchSteps.completed}/{customerLaunchSteps.steps.length} ready
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-5">
            {customerLaunchSteps.steps.map((step, index) => {
              const isNext = customerLaunchSteps.nextIndex === index;
              return (
                <Link
                  key={step.title}
                  to={step.to}
                  className={`rounded-2xl border p-4 transition ${
                    step.done
                      ? 'border-emerald-100 bg-emerald-50/70'
                      : isNext
                        ? 'border-brand-dark/20 bg-slate-50 shadow-sm'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold ${
                      step.done ? 'bg-emerald-100 text-emerald-700' : isNext ? 'bg-brand-dark text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {step.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </span>
                    {isNext && <span className="rounded-full bg-brand-dark px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Next</span>}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-brand-dark">{step.title}</p>
                  <p className="mt-1 min-h-[64px] text-xs leading-relaxed text-slate-500">{step.body}</p>
                  <span className="mt-3 inline-flex text-xs font-semibold text-emerald-700">{step.done ? 'Done' : step.action}</span>
                </Link>
              );
            })}
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
            { title: 'Operate', body: 'Manage requests, sales, expenses, closeout, receipts, and payment review.', icon: MessageCircle, to: '/operations' },
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
