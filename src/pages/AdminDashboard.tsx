import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, FileText, Users, Activity, Plus, Edit, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, fetchPlaybooks, getAdminStats } from '../lib/api';
import type { Playbook } from '../data/playbooks';

export default function AdminDashboard() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalPlaybooks: 0, totalCompletions: 0 });

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const loadAdminData = async () => {
            try {
                const profile = await getProfile(user.id, user.email || '');
                setIsAdmin(!!profile?.is_admin);

                const [fetchedStats, fetchedPlaybooks] = await Promise.all([
                    getAdminStats(),
                    fetchPlaybooks()
                ]);

                setStats(fetchedStats);
                setPlaybooks(fetchedPlaybooks);
            } catch (err) {
                console.error('Error loading admin dashboard:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadAdminData();
    }, [user, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-light flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark"></div>
            </div>
        );
    }

    if (!isAdmin) return null; // Failsafe

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
                    <Link to="/workspace" className="text-brand-dark/70 hover:text-brand-dark flex items-center gap-1 text-sm bg-white px-3 py-1.5 rounded-full border border-slate-200">
                        <ChevronLeft className="w-4 h-4" />
                        Back to My Workspace
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
                            <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-antigravity-xs flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Live Playbooks</p>
                            <p className="text-3xl font-bold">{stats.totalPlaybooks.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-antigravity-xs flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Total Completions</p>
                            <p className="text-3xl font-bold">{stats.totalCompletions.toLocaleString()}</p>
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
                                            <button className="inline-flex p-2 text-slate-400 hover:text-brand-dark bg-slate-50 hover:bg-slate-200 rounded-lg transition-colors cursor-not-allowed" title="Edit (Coming Soon)">
                                                <Edit className="w-4 h-4" />
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
