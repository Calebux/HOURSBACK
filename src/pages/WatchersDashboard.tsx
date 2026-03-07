import { useState, useEffect } from 'react';
import { Eye, Plus, ArrowRight, Clock, Zap, Database, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Watcher {
    id: string;
    name: string;
    data_source_type: string;
    status: string;
    last_run: string | null;
    last_triggered_at: string | null;
    next_run: string | null;
}

export default function WatchersDashboard() {
    const [watchers, setWatchers] = useState<Watcher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchWatchers() {
            if (!user) return;
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('watchers')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (data) setWatchers(data);
            } catch (err) {
                console.error('Failed to fetch watchers', err);
                toast.error('Failed to load watchers');
            } finally {
                setIsLoading(false);
            }
        }
        fetchWatchers();
    }, [user]);

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        const { error } = await supabase
            .from('watchers')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast.error('Failed to update watcher status');
            return;
        }
        setWatchers(watchers.map(w => w.id === id ? { ...w, status: newStatus } : w));
        toast.success(`Watcher ${newStatus}`);
    };

    const deleteWatcher = async (id: string) => {
        if (!confirm('Are you sure you want to delete this watcher?')) return;
        const { error } = await supabase.from('watchers').delete().eq('id', id);
        if (error) {
            toast.error('Failed to delete watcher');
            return;
        }
        setWatchers(watchers.filter(w => w.id !== id));
        toast.success('Watcher deleted');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-light flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-light text-brand-dark">
            {/* Navigation */}
            <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center">
                        <img src="/logo.svg" alt="Hoursback" className="h-[36px] w-auto" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/playbooks" className="text-sm font-medium text-brand-dark hover:text-[#635BFF] transition-colors bg-brand-dark/5 px-3 py-1.5 rounded-full">
                            Playbooks
                        </Link>
                        <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200">
                            <span className="text-sm font-medium">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-8 max-w-6xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                            <Eye className="w-8 h-8 text-[#635BFF] fill-[#635BFF]/10" />
                            Watchers
                        </h1>
                        <p className="text-brand-dark/70">Continuous background monitoring for your business alerts.</p>
                    </div>
                    <button
                        onClick={() => navigate('/watchers/new')}
                        className="bg-[#635BFF] hover:bg-[#524be3] text-white px-5 py-2.5 rounded-xl font-medium shadow-antigravity-md transition-all flex items-center gap-2 w-fit"
                    >
                        <Plus className="w-5 h-5" />
                        Create Watcher
                    </button>
                </div>

                {watchers.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-brand-dark/10 rounded-3xl shadow-antigravity-md">
                        <div className="w-20 h-20 bg-[#635BFF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Eye className="w-10 h-10 text-[#635BFF]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">No watchers yet</h2>
                        <p className="text-brand-dark/60 mb-8 max-w-md mx-auto">
                            Automate your data monitoring. Set up a watcher to track spreadsheets or APIs and receive AI analysis whenever conditions trigger.
                        </p>
                        <button
                            onClick={() => navigate('/watchers/new')}
                            className="bg-[#635BFF] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#524be3] transition-colors"
                        >
                            Create Your First Watcher
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {watchers.map(watcher => (
                            <div key={watcher.id} className="bg-white border border-brand-dark/10 rounded-3xl p-6 shadow-antigravity-md flex flex-col hover:shadow-antigravity-lg transition-shadow relative overflow-hidden">
                                {watcher.status === 'paused' && (
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-amber-400"></div>
                                )}
                                {watcher.status === 'active' && (
                                    <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-400"></div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Database className="w-5 h-5 text-slate-400" />
                                        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-600 uppercase tracking-wider">
                                            {watcher.data_source_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => toggleStatus(watcher.id, watcher.status)}
                                            className={`text-xs font-medium px-3 py-1 rounded-full border ${watcher.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'}`}
                                            title={watcher.status === 'active' ? 'Click to Pause' : 'Click to Resume'}
                                        >
                                            {watcher.status === 'active' ? 'Active' : 'Paused'}
                                        </button>
                                        <button
                                            onClick={() => deleteWatcher(watcher.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete watcher"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <Link to={`/watchers/${watcher.id}`} className="flex-grow">
                                    <h3 className="text-xl font-bold mb-4 hover:text-[#635BFF] transition-colors">{watcher.name}</h3>
                                </Link>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-dark/60 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Last check</span>
                                        <span className="font-medium">{watcher.last_run ? new Date(watcher.last_run).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : 'Never'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-dark/60 flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Last trigger</span>
                                        <span className="font-medium text-amber-600">{watcher.last_triggered_at ? new Date(watcher.last_triggered_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : 'Never'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-brand-dark/60 flex items-center gap-1.5"><ArrowRight className="w-4 h-4 text-brand-blue" /> Next run</span>
                                        <span className="font-medium text-brand-dark/70">{watcher.next_run ? new Date(watcher.next_run).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : '—'}</span>
                                    </div>
                                </div>

                                <Link
                                    to={`/watchers/${watcher.id}`}
                                    className="text-xs text-[#635BFF] hover:text-[#524be3] font-medium flex items-center gap-1 mt-auto pt-2 border-t border-brand-dark/5"
                                >
                                    View history <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
