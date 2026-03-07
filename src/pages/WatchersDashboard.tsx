import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Plus, Clock, Zap, Database, Trash2, ArrowRight } from 'lucide-react';
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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

function fmt(iso: string | null) {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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

    const toggleStatus = async (e: React.MouseEvent, id: string, currentStatus: string) => {
        e.preventDefault();
        e.stopPropagation();
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        const { error } = await supabase.from('watchers').update({ status: newStatus }).eq('id', id);
        if (error) { toast.error('Failed to update watcher status'); return; }
        setWatchers(watchers.map(w => w.id === id ? { ...w, status: newStatus } : w));
        toast.success(`Watcher ${newStatus}`);
    };

    const deleteWatcher = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this watcher?')) return;
        const { error } = await supabase.from('watchers').delete().eq('id', id);
        if (error) { toast.error('Failed to delete watcher'); return; }
        setWatchers(watchers.filter(w => w.id !== id));
        toast.success('Watcher deleted');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-light flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark" />
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
                    <div className="flex items-center gap-2">
                        <Link to="/playbooks" className="flex items-center gap-1.5 px-3 py-2 text-sm text-brand-dark/80 hover:text-brand-dark hover:bg-slate-100 rounded-full transition-all">
                            Playbooks
                        </Link>
                        <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200">
                            <span className="text-sm font-medium">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-10 max-w-6xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Watchers</h1>
                        <p className="text-brand-dark/60">Continuous background monitoring for your business alerts.</p>
                    </div>
                    <button
                        onClick={() => navigate('/watchers/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-full hover:bg-brand-dark/90 transition-colors text-sm font-medium shadow-antigravity-md w-fit"
                    >
                        <Plus className="w-4 h-4" />
                        Create Watcher
                    </button>
                </div>

                {/* Empty State */}
                {watchers.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 bg-white border border-brand-dark/10 rounded-3xl shadow-antigravity-md"
                    >
                        <div className="w-16 h-16 bg-brand-dark/5 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Eye className="w-8 h-8 text-brand-dark/30" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No watchers yet</h2>
                        <p className="text-brand-dark/50 text-sm mb-8 max-w-sm mx-auto">
                            Set up a watcher to monitor spreadsheets or APIs and receive AI analysis whenever your conditions trigger.
                        </p>
                        <button
                            onClick={() => navigate('/watchers/new')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand-dark text-white rounded-full hover:bg-brand-dark/90 transition-colors text-sm font-medium mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Create Your First Watcher
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {watchers.map(watcher => (
                            <motion.div
                                key={watcher.id}
                                variants={itemVariants}
                                whileHover={{ y: -4 }}
                                className="group relative bg-white shadow-antigravity-md border border-brand-dark/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all"
                            >
                                <Link to={`/watchers/${watcher.id}`} className="block p-6">
                                    {/* Badge row */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                                watcher.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${watcher.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                                {watcher.status === 'active' ? 'Active' : 'Paused'}
                                            </span>
                                            <span className="text-xs text-brand-dark/40 font-medium uppercase tracking-wider flex items-center gap-1">
                                                <Database className="w-3 h-3" />
                                                {watcher.data_source_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => deleteWatcher(e, watcher.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-semibold mb-1 group-hover:text-brand-blue transition-colors line-clamp-2">
                                        {watcher.name}
                                    </h3>
                                    <p className="text-brand-dark/50 text-sm mb-4">
                                        Next run: {fmt(watcher.next_run)}
                                    </p>

                                    {/* Footer meta */}
                                    <div className="flex items-center justify-between pt-4 border-t border-brand-dark/10">
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {fmt(watcher.last_run)}
                                            </span>
                                            <span className="flex items-center gap-1 text-amber-500">
                                                <Zap className="w-3 h-3" />
                                                {fmt(watcher.last_triggered_at)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => toggleStatus(e, watcher.id, watcher.status)}
                                            className="text-xs text-brand-dark/50 hover:text-brand-dark transition-colors font-medium"
                                        >
                                            {watcher.status === 'active' ? 'Pause' : 'Resume'}
                                        </button>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}

                        {/* Create new card */}
                        <motion.div variants={itemVariants} whileHover={{ y: -4 }}>
                            <button
                                onClick={() => navigate('/watchers/new')}
                                className="w-full h-full min-h-[180px] bg-white border-2 border-dashed border-brand-dark/10 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-brand-dark/20 hover:bg-slate-50/50 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-brand-dark/5 flex items-center justify-center group-hover:bg-brand-dark/10 transition-colors">
                                    <Plus className="w-5 h-5 text-brand-dark/40" />
                                </div>
                                <span className="text-sm text-brand-dark/40 font-medium flex items-center gap-1">
                                    New Watcher <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
