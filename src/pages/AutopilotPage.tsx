import { useState, useEffect } from 'react';
import { Bot, Calendar, Clock, CheckCircle2, Play, Pause, ExternalLink, XCircle, ChevronLeft, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mockPlaybooks, smbPlaybooks, coworkPlaybooks, designerAIPlaybooks, coworkPluginPlaybooks } from '../data/playbooks';
import AutopilotModal from '../components/AutopilotModal';
import { AuthModal } from '../components/AuthModal';
import { toast } from 'sonner';

interface ScheduledPlaybook {
    id: string;
    playbook_slug: string;
    playbook_data?: any;
    custom_delivery_email?: string;
    cron_expression: string;
    is_active: boolean;
    variables: Record<string, string>;
    created_at: string;
}

interface AutonomousRun {
    id: string;
    schedule_id: string;
    playbook_slug: string;
    run_status: 'success' | 'failed';
    generated_content: string;
    created_at: string;
}

const allPlaybooks = [...mockPlaybooks, ...smbPlaybooks, ...coworkPlaybooks, ...designerAIPlaybooks, ...coworkPluginPlaybooks];

export default function AutopilotPage() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState<ScheduledPlaybook[]>([]);
    const [runs, setRuns] = useState<AutonomousRun[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'agents' | 'history'>('agents');
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

    // Edit modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ScheduledPlaybook | null>(null);

    const fetchAutopilotData = async () => {
        if (!user) return;
        setIsLoading(true);

        const [schedulesRes, runsRes] = await Promise.all([
            supabase.from('scheduled_playbooks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('autonomous_runs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
        ]);

        if (schedulesRes.data) setSchedules(schedulesRes.data);
        if (runsRes.data) setRuns(runsRes.data);

        setIsLoading(false);
    };

    useEffect(() => {
        fetchAutopilotData();
    }, [user]);

    useEffect(() => {
        if (!authLoading && !user) {
            setAuthModalOpen(true);
        }
    }, [authLoading, user]);

    const toggleScheduleStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('scheduled_playbooks')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (!error) {
            setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
            toast.success(currentStatus ? 'Agent paused' : 'Agent resumed');
        } else {
            toast.error('Failed to update agent status. Please try again.');
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('scheduled_playbooks')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete agent');
        } else {
            setSchedules(prev => prev.filter(s => s.id !== id));
            setConfirmingDelete(null);
            toast.success('Agent deleted');
        }
    };

    const handleEdit = (schedule: ScheduledPlaybook) => {
        setEditingSchedule(schedule);
        setIsModalOpen(true);
    };

    const getPlaybookTitle = (slug: string) => {
        const playbook = allPlaybooks.find(p => p.slug === slug);
        return playbook ? playbook.title : slug;
    };

    const formatCron = (cron: string) => {
        // Basic humanizer for the 3 generated cron types
        if (cron.endsWith('* * *')) {
            const parts = cron.split(' ');
            return `Daily at ${parts[1]}:${parts[0].padStart(2, '0')} UTC`;
        }
        if (cron.endsWith('* * 1-5')) {
            const parts = cron.split(' ');
            return `Weekdays at ${parts[1]}:${parts[0].padStart(2, '0')} UTC`;
        }
        if (cron.endsWith('* * 1')) {
            const parts = cron.split(' ');
            return `Weekly (Mon) at ${parts[1]}:${parts[0].padStart(2, '0')} UTC`;
        }
        return cron;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-light flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-brand-dark border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-light pb-20">
            <div className="bg-brand-dark text-white pt-10 pb-20 px-6 sm:px-8 shadow-antigravity-md rounded-b-[3rem] sm:rounded-b-[4rem]">
                <div className="container mx-auto">
                    <Link to="/workspace" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm mb-6 font-medium">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Workspace
                    </Link>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Bot className="w-6 h-6 text-[#DA7756]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Autopilot Dashboard</h1>
                            <p className="text-white/70">Manage your autonomous agents and execution history.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 -mt-10">
                <div className="bg-white rounded-3xl p-2 flex border border-brand-dark/5 shadow-antigravity-md mb-8 w-fit mx-auto lg:mx-0">
                    <button
                        onClick={() => setActiveTab('agents')}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all ${activeTab === 'agents' ? 'bg-brand-dark text-white shadow-md' : 'text-brand-dark/60 hover:text-brand-dark'}`}
                    >
                        Active Agents ({schedules.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-brand-dark text-white shadow-md' : 'text-brand-dark/60 hover:text-brand-dark'}`}
                    >
                        Run History
                    </button>
                </div>

                {activeTab === 'agents' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {schedules.length === 0 ? (
                            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-brand-dark/10 shadow-antigravity-md">
                                <Bot className="w-12 h-12 mx-auto mb-4 text-brand-dark/20" />
                                <h3 className="text-xl font-bold text-brand-dark mb-2">No active agents</h3>
                                <p className="text-brand-dark/60 max-w-sm mx-auto mb-6">You haven't automated any playbooks yet. Find a playbook and click "Deploy Autopilot Agent" to get started.</p>
                                <Link to="/playbooks" className="inline-block bg-brand-dark text-white px-6 py-3 rounded-full font-medium hover:bg-[#DA7756] transition-colors shadow-antigravity-sm">
                                    Browse Playbooks
                                </Link>
                            </div>
                        ) : (
                            schedules.map(schedule => (
                                <div key={schedule.id} className="bg-white rounded-3xl p-6 border border-brand-dark/10 shadow-antigravity-md flex flex-col items-start h-full group relative overflow-hidden transition-all hover:border-[#DA7756]/30">
                                    <div className="flex items-center justify-between w-full mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${schedule.is_active ? 'bg-[#DA7756]/10 text-[#DA7756]' : 'bg-slate-100 text-slate-500'}`}>
                                                {schedule.is_active ? '● Running' : '❚❚ Paused'}
                                            </span>
                                            {schedule.custom_delivery_email && (
                                                <span className="px-1.5 py-1 bg-brand-blue/10 text-brand-blue text-[10px] font-bold uppercase tracking-wider rounded-md" title={`Sending to: ${schedule.custom_delivery_email}`}>
                                                    ✉ Custom Email
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {confirmingDelete === schedule.id ? (
                                                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-2 py-1">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                    <span className="text-xs text-red-600 font-medium">Delete?</span>
                                                    <button onClick={() => handleDelete(schedule.id)} className="text-xs font-bold text-red-600 hover:text-red-800 px-1">Yes</button>
                                                    <button onClick={() => setConfirmingDelete(null)} className="text-xs text-brand-dark/50 hover:text-brand-dark px-1">No</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => toggleScheduleStatus(schedule.id, schedule.is_active)}
                                                        className="p-2 hover:bg-slate-50 border border-transparent hover:border-brand-dark/10 rounded-xl transition-all text-brand-dark/50 hover:text-brand-dark"
                                                        title={schedule.is_active ? 'Pause Agent' : 'Resume Agent'}
                                                    >
                                                        {schedule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(schedule)}
                                                        className="p-2 hover:bg-slate-50 border border-transparent hover:border-brand-dark/10 rounded-xl transition-all text-brand-dark/50 hover:text-brand-dark"
                                                        title="Edit Agent"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmingDelete(schedule.id)}
                                                        className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition-all text-brand-dark/30 hover:text-red-500"
                                                        title="Delete Agent"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-brand-dark text-lg mb-1 leading-tight">{getPlaybookTitle(schedule.playbook_slug)}</h3>

                                    <div className="flex items-center gap-2 text-xs font-medium text-brand-dark/60 mb-6 mt-3 bg-slate-50 px-3 py-2 rounded-xl">
                                        <Clock className="w-4 h-4 text-brand-blue" />
                                        {formatCron(schedule.cron_expression)}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-brand-dark/10 w-full">
                                        <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">Injected Variables</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(schedule.variables).slice(0, 3).map(([key, value]) => (
                                                <div key={key} className="bg-brand-dark/5 text-brand-dark/70 text-[10px] px-2 py-1 rounded truncate max-w-[120px]" title={`${key}: ${value}`}>
                                                    <span className="font-semibold">{key}:</span> {value}
                                                </div>
                                            ))}
                                            {Object.keys(schedule.variables).length > 3 && (
                                                <div className="bg-brand-dark/5 text-brand-dark/60 text-[10px] px-2 py-1 rounded">+{Object.keys(schedule.variables).length - 3} more</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-brand-dark/10 shadow-antigravity-md">
                        {runs.length === 0 ? (
                            <div className="py-12 text-center text-brand-dark/60">No execution history found yet. Agents will run automatically based on their schedule.</div>
                        ) : (
                            <div className="space-y-4">
                                {runs.map(run => (
                                    <div key={run.id} className="border border-brand-dark/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${run.run_status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {run.run_status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-brand-dark text-sm sm:text-base">{getPlaybookTitle(run.playbook_slug)}</h4>
                                                <p className="text-xs text-brand-dark/60 mt-0.5 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(run.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        {run.run_status === 'success' && (
                                            <button
                                                className="text-xs font-semibold bg-white border border-brand-dark/20 shadow-antigravity-sm px-4 py-2 rounded-xl text-brand-dark hover:border-brand-dark/40 transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
                                                onClick={() => {
                                                    const w = window.open('', '_blank');
                                                    if (w) w.document.write(`<pre style="font-family:sans-serif;padding:2rem;max-width:800px;margin:0 auto;white-space:pre-wrap;line-height:1.6">${run.generated_content}</pre>`);
                                                }}
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Read Report
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingSchedule && (
                <AutopilotModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingSchedule(null);
                        fetchAutopilotData();
                    }}
                    playbook={allPlaybooks.find(p => p.slug === editingSchedule.playbook_slug) || (editingSchedule.playbook_data as any)}
                    variables={editingSchedule.variables}
                    userId={user?.id}
                    initialData={{
                        id: editingSchedule.id,
                        cron_expression: editingSchedule.cron_expression,
                        custom_delivery_email: editingSchedule.custom_delivery_email
                    }}
                />
            )}

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => { setAuthModalOpen(false); navigate('/playbooks'); }}
                defaultView="signup"
            />
        </div>
    );
}
