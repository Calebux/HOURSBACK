import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronLeft, LayoutDashboard, FileText, Users, Activity, Plus, Edit, Eye, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, fetchPlaybooks, getAdminStats, deletePlaybook } from '../lib/api';
import type { Playbook } from '../data/playbooks';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { BILLING_LIMITS } from '../lib/billing';

interface LaunchHealth {
    webhookInvalidSignature1h: number | null;
    webhookErrors1h: number | null;
    kapsoReplyFailures24h: number | null;
    reportEmailFailures24h: number | null;
    failedCustomerSends: number | null;
    receiptStorageFailures: number | null;
    stuckReceiptSent: number | null;
    stuckUnpaid: number | null;
    incompleteCustomerSetups: number | null;
}

interface MigrationReadiness {
    receipt_storage_bucket?: boolean;
    order_audit_logs_table?: boolean;
    analytics_events_table?: boolean;
    bot_entries_source_order_id?: boolean;
    source_order_id_unique_index?: boolean;
}

type SupportRow = Record<string, unknown>;

interface SupportQueues {
    broken_webhook_setup?: SupportRow[];
    failed_customer_replies?: SupportRow[];
    orders_needing_receipt_resend?: SupportRow[];
    pro_customer_whatsapp_incomplete?: SupportRow[];
    recent_ai_handoffs?: SupportRow[];
}

type SupportQueueCard = [string, SupportRow[] | undefined, string];

export default function AdminDashboard() {
    const { user, signOut, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [stats, setStats] = useState<{ totalUsers: number | null; totalPlaybooks: number; totalCompletions: number | null }>({ totalUsers: null, totalPlaybooks: 0, totalCompletions: null });
    const [migrationReadiness, setMigrationReadiness] = useState<MigrationReadiness>({});
    const [supportQueues, setSupportQueues] = useState<SupportQueues>({});
    const [launchHealth, setLaunchHealth] = useState<LaunchHealth>({
        webhookInvalidSignature1h: null,
        webhookErrors1h: null,
        kapsoReplyFailures24h: null,
        reportEmailFailures24h: null,
        failedCustomerSends: null,
        receiptStorageFailures: null,
        stuckReceiptSent: null,
        stuckUnpaid: null,
        incompleteCustomerSetups: null,
    });

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate('/');
            return;
        }

        const loadAdminData = async () => {
            try {
                const profile = await getProfile(user.id, user.email || '');
                setIsAdmin(!!profile?.is_admin);

                const [
                    fetchedStats,
                    fetchedPlaybooks,
                    observability,
                    queues,
                ] = await Promise.all([
                    getAdminStats(),
                    fetchPlaybooks(),
                    supabase.rpc('get_launch_observability'),
                    supabase.rpc('get_launch_support_queues', { p_limit: 8 }),
                ]);

                setStats(fetchedStats);
                setPlaybooks(fetchedPlaybooks);
                if (observability.error) {
                    console.error('Launch observability RPC failed:', observability.error);
                } else {
                    const monitoring = observability.data?.monitoring || {};
                    setMigrationReadiness(observability.data?.migration_readiness || {});
                    setLaunchHealth({
                        webhookInvalidSignature1h: Number(monitoring.webhook_invalid_signature_1h ?? 0),
                        webhookErrors1h: Number(monitoring.webhook_errors_1h ?? 0),
                        kapsoReplyFailures24h: Number(monitoring.kapso_reply_failures_24h ?? 0),
                        reportEmailFailures24h: Number(monitoring.report_email_failures_24h ?? 0),
                        failedCustomerSends: Number(monitoring.failed_customer_sends_24h ?? 0),
                        receiptStorageFailures: Number(monitoring.receipt_storage_failures_open ?? 0),
                        stuckReceiptSent: Number(monitoring.stuck_receipt_sent_48h ?? 0),
                        stuckUnpaid: Number(monitoring.stuck_unpaid_48h ?? 0),
                        incompleteCustomerSetups: Number(monitoring.incomplete_customer_setups ?? 0),
                    });
                }
                if (queues.error) {
                    console.error('Launch support queues RPC failed:', queues.error);
                } else {
                    setSupportQueues(queues.data || {});
                }
            } catch (err) {
                console.error('Error loading admin dashboard:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadAdminData();
    }, [user, navigate, authLoading]);

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
            return;
        }

        const success = await deletePlaybook(id);
        if (success) {
            setPlaybooks(playbooks.filter(pb => pb.id !== id));
            setStats(prev => ({ ...prev, totalPlaybooks: prev.totalPlaybooks - 1 }));
            toast.success(`Playbook "${title}" has been deleted.`);
        } else {
            toast.error('Failed to delete playbook. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-light flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <X className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-brand-dark mb-2">Access Denied</h1>
                <p className="text-brand-dark/70 max-w-md mb-6">
                    You do not have the necessary permissions to view the Admin Dashboard. Your account must be explicitly elevated to continue.
                </p>
                <Link to="/" className="bg-brand-dark text-white px-6 py-3 rounded-full font-medium hover:bg-brand-dark/90 transition-colors">
                    Return to Homepage
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-light text-brand-dark">
            {/* Navigation */}
            <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-dark text-white rounded-full flex items-center justify-center">
                            <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <span className="text-xl font-semibold">Admin Panel</span>
                    </Link>
                    <button
                        onClick={() => signOut()}
                        className="text-sm text-brand-dark/80 hover:text-brand-dark transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-8">
                <div className="flex items-center gap-2 mb-8">
                    <Link to="/workflows" className="text-brand-dark/70 hover:text-brand-dark flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-full border border-slate-200">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Workflows
                    </Link>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Platform Overview</h1>
                        <p className="text-brand-dark/70">Manage your playbooks and track system growth.</p>
                    </div>
                    <Link to="/admin/playbooks/new" className="hidden md:flex items-center gap-2 bg-[#635BFF] text-white px-5 py-2.5 rounded-full hover:bg-[#524be3] transition-colors shadow-antigravity-xs font-medium">
                        <Plus className="w-5 h-5" />
                        Create Playbook
                    </Link>
                </div>

                {/* Analytics Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-antigravity-xs flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Total Users</p>
                            <p className="text-3xl font-bold">{stats.totalUsers != null ? stats.totalUsers.toLocaleString() : '—'}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-antigravity-xs flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Live Playbooks</p>
                            <p className="text-3xl font-bold">{playbooks.length.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-antigravity-xs flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Total Completions</p>
                            <p className="text-3xl font-bold">{stats.totalCompletions != null ? stats.totalCompletions.toLocaleString() : '—'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-brand-dark/10 shadow-antigravity-md p-6 mb-12">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-xl font-semibold">Launch Health</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Operational checks for customer WhatsApp rollout. Kapso delivery 401/500 alerts still need to be watched in Kapso and Supabase Edge Function logs.
                            </p>
                        </div>
                        <Link to="/orders" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                            Open Orders
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            ['Webhook 401s 1h', launchHealth.webhookInvalidSignature1h, 'Invalid Kapso signatures or wrong webhook secret.'],
                            ['Webhook 500s 1h', launchHealth.webhookErrors1h, 'Webhook runtime errors or missing production secret.'],
                            ['Reply failures 24h', launchHealth.kapsoReplyFailures24h, 'Kapso sends that failed after processing inbound messages.'],
                            ['Email failures 24h', launchHealth.reportEmailFailures24h, 'WhatsApp report emails that could not be sent.'],
                            ['Failed sends 24h', launchHealth.failedCustomerSends, 'Owner actions where customer message was not sent.'],
                            ['Receipt failures', launchHealth.receiptStorageFailures, 'Receipts received but not saved for review.'],
                            ['Stuck receipts', launchHealth.stuckReceiptSent, 'Receipt sent but unverified for over 48 hours.'],
                            ['Stuck unpaid', launchHealth.stuckUnpaid, 'Confirmed unpaid requests older than 48 hours.'],
                            ['Incomplete setup', launchHealth.incompleteCustomerSetups, 'Customer channels missing launch fields.'],
                        ].map(([label, value, help]) => {
                            const count = typeof value === 'number' ? value : null;
                            const risky = count != null && count > 0;
                            return (
                                <div key={String(label)} className={`rounded-2xl border p-4 ${risky ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-semibold text-slate-500">{label}</p>
                                        {risky && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                                    </div>
                                    <p className="mt-2 text-2xl font-bold text-brand-dark">{count == null ? '—' : count}</p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{help}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-brand-dark">Production migration readiness</p>
                        <div className="mt-3 grid gap-2 md:grid-cols-5">
                            {[
                                ['Receipt storage', migrationReadiness.receipt_storage_bucket],
                                ['Audit logs', migrationReadiness.order_audit_logs_table],
                                ['Analytics events', migrationReadiness.analytics_events_table],
                                ['Sales sync column', migrationReadiness.bot_entries_source_order_id],
                                ['Sales sync idempotency', migrationReadiness.source_order_id_unique_index],
                            ].map(([label, ok]) => (
                                <div key={String(label)} className={`rounded-xl border px-3 py-2 ${ok ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
                                    <div className="flex items-center gap-1.5">
                                        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                                        <span className="text-xs font-semibold">{label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-brand-dark">Support workflow</p>
                        <div className="mt-2 grid gap-2 md:grid-cols-2 text-xs leading-relaxed text-slate-600">
                            <p>Setup fails: verify Kapso API key, phone number ID, webhook URL, webhook secret, and connection mode.</p>
                            <p>Receipt missing: ask the customer to resend the receipt with the request reference.</p>
                            <p>AI reply is wrong: update catalogue, payment instructions, fulfillment rules, and escalation instructions, then retest.</p>
                            <p>Payment dispute/refund: handle manually and record notes on the request. Refunds are not automated.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-brand-dark/10 shadow-antigravity-md p-6 mb-12">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-xl font-semibold">Support Queues</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Cross-workspace admin queues for launch support and customer issue triage.
                            </p>
                        </div>
                        <Link to="/whatsapp" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                            WhatsApp Setup
                        </Link>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {([
                            ['Broken webhook setup', supportQueues.broken_webhook_setup, 'Missing number, webhook secret, or setup stuck.'],
                            ['Failed replies', supportQueues.failed_customer_replies, 'Kapso, email, or webhook failures needing follow-up.'],
                            ['Receipt resend needed', supportQueues.orders_needing_receipt_resend, 'Receipt exists but file is missing or failed to save.'],
                            ['Pro setup incomplete', supportQueues.pro_customer_whatsapp_incomplete, 'Pro customer channels not ready for launch.'],
                            ['Recent AI handoffs', supportQueues.recent_ai_handoffs, 'Customer replies routed to staff review.'],
                        ] as SupportQueueCard[]).map(([title, rows, description]) => (
                            <div key={String(title)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-brand-dark">{title}</p>
                                        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                                    </div>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                                        {Array.isArray(rows) ? rows.length : 0}
                                    </span>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {Array.isArray(rows) && rows.length ? rows.slice(0, 4).map((row, index) => (
                                        <div key={`${String(title)}-${index}`} className="rounded-xl border border-white bg-white px-3 py-2 text-xs text-slate-600">
                                            <p className="font-semibold text-slate-800">
                                                {String(row.email || row.order_code || row.event_name || row.action || row.id || 'Issue')}
                                            </p>
                                            <p className="mt-0.5 truncate">
                                                {String(row.message_text || row.customer_phone || row.status || row.receipt_storage_error || row.connection_type || row.created_at || '')}
                                            </p>
                                        </div>
                                    )) : (
                                        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-400">
                                            No current issues.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-brand-dark/10 shadow-antigravity-md p-6 mb-12">
                    <h2 className="text-xl font-semibold">Launch Limits</h2>
                    <p className="mt-1 text-sm text-slate-500">Customer-facing WhatsApp remains Pro-only. These are the limits support should communicate.</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        {(['free', 'pro'] as const).map((tier) => (
                            <div key={tier} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <p className="text-sm font-bold text-brand-dark">{BILLING_LIMITS[tier].label}</p>
                                <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
                                    <p><span className="font-semibold text-slate-800">WhatsApp:</span> {BILLING_LIMITS[tier].whatsapp}</p>
                                    <p><span className="font-semibold text-slate-800">Customer requests:</span> {BILLING_LIMITS[tier].customerRequests}</p>
                                    <p><span className="font-semibold text-slate-800">AI usage:</span> {BILLING_LIMITS[tier].aiUsage}</p>
                                    <p><span className="font-semibold text-slate-800">Reports:</span> {BILLING_LIMITS[tier].summaries}</p>
                                    <p><span className="font-semibold text-slate-800">Scanner:</span> {BILLING_LIMITS[tier].scanner}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Playbooks Table */}
                <div className="bg-white rounded-3xl border border-brand-dark/10 shadow-antigravity-md overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Content Library</h2>
                        <Link to="/admin/playbooks/new" className="md:hidden flex items-center gap-2 bg-[#635BFF] text-white px-4 py-2 rounded-full hover:bg-[#524be3] transition-colors text-sm font-medium">
                            <Plus className="w-4 h-4" />
                            New
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-medium border-b border-slate-100">Playbook Name</th>
                                    <th className="px-6 py-4 font-medium border-b border-slate-100">Category</th>
                                    <th className="px-6 py-4 font-medium border-b border-slate-100">Tier</th>
                                    <th className="px-6 py-4 font-medium border-b border-slate-100">Completions</th>
                                    <th className="px-6 py-4 font-medium border-b border-slate-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {playbooks.map((pb) => (
                                    <tr key={pb.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-brand-dark">{pb.title}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-xs">{pb.slug}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {pb.category}
                                        </td>
                                        <td className="px-6 py-4">
                                            {pb.isPro ? (
                                                <span className="px-2.5 py-1 bg-brand-dark text-white rounded-full text-xs font-medium">Pro</span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Free</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                            {pb.completionCount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Link to={`/playbooks/${pb.slug}`} className="inline-flex p-2 text-slate-400 hover:text-brand-blue bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors" title="View Live">
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link to={`/admin/playbooks/${pb.id}/edit`} className="inline-flex p-2 text-slate-400 hover:text-brand-dark bg-slate-50 hover:bg-slate-200 rounded-lg transition-colors" title="Edit Playbook">
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(pb.id, pb.title)}
                                                className="inline-flex p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Playbook"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
