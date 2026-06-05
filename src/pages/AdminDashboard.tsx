import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, LayoutDashboard, FileText, Users, Activity, Plus, Edit, Eye, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, fetchPlaybooks, getAdminStats, deletePlaybook } from '../lib/api';
import type { Playbook } from '../data/playbooks';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface LaunchHealth {
    recentMessages: number | null;
    failedCustomerSends: number | null;
    receiptStorageFailures: number | null;
    stuckUnpaidRequests: number | null;
    incompleteCustomerSetups: number | null;
}

export default function AdminDashboard() {
    const { user, signOut, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [stats, setStats] = useState<{ totalUsers: number | null; totalPlaybooks: number; totalCompletions: number | null }>({ totalUsers: null, totalPlaybooks: 0, totalCompletions: null });
    const [launchHealth, setLaunchHealth] = useState<LaunchHealth>({
        recentMessages: null,
        failedCustomerSends: null,
        receiptStorageFailures: null,
        stuckUnpaidRequests: null,
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

                const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

                const [
                    fetchedStats,
                    fetchedPlaybooks,
                    recentMessages,
                    failedSends,
                    receiptFailures,
                    stuckUnpaid,
                    incompleteSetups,
                ] = await Promise.all([
                    getAdminStats(),
                    fetchPlaybooks(),
                    supabase.from('kapso_messages').select('id', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
                    supabase.from('kapso_order_audit_logs').select('id', { count: 'exact', head: true }).eq('message_sent', false).gte('created_at', oneDayAgo),
                    supabase.from('kapso_orders').select('id', { count: 'exact', head: true }).eq('receipt_storage_status', 'failed'),
                    supabase.from('kapso_orders').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').eq('payment_status', 'unpaid').lt('created_at', twoDaysAgo),
                    supabase
                        .from('kapso_connections')
                        .select('id', { count: 'exact', head: true })
                        .eq('connection_type', 'customer')
                        .or('phone_number_id.is.null,customer_menu.is.null,payment_instructions.is.null,fulfillment_rules.is.null'),
                ]);

                setStats(fetchedStats);
                setPlaybooks(fetchedPlaybooks);
                setLaunchHealth({
                    recentMessages: recentMessages.error ? null : recentMessages.count ?? 0,
                    failedCustomerSends: failedSends.error ? null : failedSends.count ?? 0,
                    receiptStorageFailures: receiptFailures.error ? null : receiptFailures.count ?? 0,
                    stuckUnpaidRequests: stuckUnpaid.error ? null : stuckUnpaid.count ?? 0,
                    incompleteCustomerSetups: incompleteSetups.error ? null : incompleteSetups.count ?? 0,
                });
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
                    <div className="grid md:grid-cols-5 gap-3">
                        {[
                            ['Messages 24h', launchHealth.recentMessages, 'Recent inbound/outbound WhatsApp rows.'],
                            ['Failed sends 24h', launchHealth.failedCustomerSends, 'Owner actions where customer message was not sent.'],
                            ['Receipt failures', launchHealth.receiptStorageFailures, 'Receipts received but not saved for review.'],
                            ['Stuck unpaid', launchHealth.stuckUnpaidRequests, 'Confirmed unpaid requests older than 48 hours.'],
                            ['Incomplete setup', launchHealth.incompleteCustomerSetups, 'Customer channels missing launch fields.'],
                        ].map(([label, value, help]) => {
                            const count = typeof value === 'number' ? value : null;
                            const risky = label !== 'Messages 24h' && count != null && count > 0;
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
