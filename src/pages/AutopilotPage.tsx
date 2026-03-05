import { useState, useEffect } from 'react';
import { Bot, Calendar, Clock, CheckCircle2, Play, Pause, ExternalLink, XCircle, ChevronLeft, Edit2, Trash2, AlertTriangle, RotateCcw, FileDown, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mockPlaybooks, smbPlaybooks, coworkPlaybooks, designerAIPlaybooks, coworkPluginPlaybooks, ecommercePlaybooks, launchPlaybooks, personalBrandPlaybooks, educationPlaybooks } from '../data/playbooks';
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

const allPlaybooks = [...mockPlaybooks, ...smbPlaybooks, ...coworkPlaybooks, ...designerAIPlaybooks, ...coworkPluginPlaybooks, ...ecommercePlaybooks, ...launchPlaybooks, ...personalBrandPlaybooks, ...educationPlaybooks];

function markdownToHtml(md: string): string {
    const lines = md.split('\n');
    const html: string[] = [];
    let inList = false;
    let listType = '';
    let inTable = false;
    let tableHeaders: string[] | null = null;
    let tableRows: string[][] = [];

    const closeList = () => {
        if (inList) { html.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; listType = ''; }
    };
    const flushTable = () => {
        if (!inTable || !tableHeaders) return;
        const thCells = tableHeaders.map((h, i) =>
            `<th style="padding:11px 14px;text-align:${i === 0 ? 'left' : 'right'};font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;${i < tableHeaders!.length - 1 ? 'border-right:1px solid #dbeafe;' : ''}">${h}</th>`
        ).join('');
        const tdRows = tableRows.map((row, ri) =>
            `<tr style="background:${ri % 2 === 0 ? '#ffffff' : '#f8fafc'};">${
                row.map((cell, ci) =>
                    `<td style="padding:9px 14px;font-size:13px;color:${ci === 0 ? '#111827' : '#374151'};font-weight:${ci === 0 ? '600' : '400'};text-align:${ci === 0 ? 'left' : 'right'};${ci < row.length - 1 ? 'border-right:1px solid #f1f5f9;' : ''}border-bottom:1px solid #f1f5f9;white-space:nowrap;">${cell}</td>`
                ).join('')
            }</tr>`
        ).join('');
        html.push(
            `<div style="overflow-x:auto;margin:16px 0;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;">`
            + `<table style="width:100%;border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">`
            + `<thead><tr style="background:#eff6ff;border-bottom:2px solid #bfdbfe;">${thCells}</tr></thead>`
            + `<tbody>${tdRows}</tbody>`
            + `</table></div>`
        );
        inTable = false; tableHeaders = null; tableRows = [];
    };
    const inline = (text: string) =>
        text
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code style="background:#e5e7eb;padding:1px 5px;border-radius:4px;font-size:13px;">$1</code>');

    for (const raw of lines) {
        const line = raw.trimEnd();

        // Markdown table rows start and end with |
        if (/^\|.+\|/.test(line)) {
            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            // Separator row (|---|---|) — skip it
            if (cells.every(c => /^[-:| ]+$/.test(c))) continue;
            if (!inTable) {
                inTable = true;
                tableHeaders = cells;
                tableRows = [];
            } else {
                tableRows.push(cells);
            }
            continue;
        }

        // Non-table line — flush any open table first
        if (inTable) flushTable();

        if (/^---+$/.test(line)) { closeList(); html.push('<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">'); continue; }
        if (/^# /.test(line)) { closeList(); html.push(`<h1 style="font-size:22px;font-weight:700;color:#111827;margin:28px 0 8px;">${inline(line.slice(2))}</h1>`); continue; }
        if (/^## /.test(line)) { closeList(); html.push(`<h2 style="font-size:18px;font-weight:700;color:#111827;margin:22px 0 6px;">${inline(line.slice(3))}</h2>`); continue; }
        if (/^### /.test(line)) { closeList(); html.push(`<h3 style="font-size:15px;font-weight:600;color:#374151;margin:16px 0 4px;">${inline(line.slice(4))}</h3>`); continue; }
        const ulMatch = line.match(/^[-*] (.+)/);
        if (ulMatch) { if (!inList || listType !== 'ul') { closeList(); html.push('<ul style="margin:10px 0;padding-left:22px;">'); inList = true; listType = 'ul'; } html.push(`<li style="margin:5px 0;color:#374151;line-height:1.7;">${inline(ulMatch[1])}</li>`); continue; }
        const olMatch = line.match(/^\d+\. (.+)/);
        if (olMatch) { if (!inList || listType !== 'ol') { closeList(); html.push('<ol style="margin:10px 0;padding-left:22px;">'); inList = true; listType = 'ol'; } html.push(`<li style="margin:5px 0;color:#374151;line-height:1.7;">${inline(olMatch[1])}</li>`); continue; }
        if (line.trim() === '') { closeList(); html.push(''); continue; }
        closeList();
        html.push(`<p style="margin:7px 0;color:#374151;line-height:1.8;font-size:15px;">${inline(line)}</p>`);
    }
    if (inTable) flushTable();
    closeList();
    return html.join('\n');
}

export default function AutopilotPage() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState<ScheduledPlaybook[]>([]);
    const [runs, setRuns] = useState<AutonomousRun[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'agents' | 'history'>('agents');
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
    const [runningAgainId, setRunningAgainId] = useState<string | null>(null);
    const [runningNowId, setRunningNowId] = useState<string | null>(null);

    // Edit modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ScheduledPlaybook | null>(null);

    const fetchAutopilotData = async () => {
        if (!user) return;
        setIsLoading(true);

        const [schedulesRes, runsRes] = await Promise.all([
            supabase.from('scheduled_playbooks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('autonomous_runs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
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

    const handleRunNow = async (scheduleId: string) => {
        setRunningNowId(scheduleId);
        try {
            const { error } = await supabase.functions.invoke('execute-scheduled-playbooks', {
                body: { schedule_id: scheduleId }
            });
            if (error) throw error;
            toast.success('Agent ran successfully — check your email!');
            fetchAutopilotData();
            setActiveTab('history');
        } catch (err: any) {
            toast.error(err.message || 'Failed to run agent');
        } finally {
            setRunningNowId(null);
        }
    };

    const handleRunAgain = async (run: AutonomousRun) => {
        if (!run.schedule_id) { toast.error('No schedule linked to this run'); return; }
        setRunningAgainId(run.id);
        try {
            const { error } = await supabase.functions.invoke('execute-scheduled-playbooks', {
                body: { schedule_id: run.schedule_id }
            });
            if (error) throw error;
            toast.success('Agent re-run complete — check your email!');
            fetchAutopilotData();
        } catch (err: any) {
            toast.error(err.message || 'Failed to re-run agent');
        } finally {
            setRunningAgainId(null);
        }
    };

    const handleDownloadPdf = (run: AutonomousRun) => {
        const title = getPlaybookTitle(run.playbook_slug);
        const date = new Date(run.created_at).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title} — Hoursback</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#202124;padding:48px 40px;max-width:760px;margin:0 auto}.header{border-bottom:2px solid #f3f4f6;padding-bottom:24px;margin-bottom:32px}.badge{display:inline-block;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:10px}h1{font-size:24px;font-weight:800;color:#202124;margin-bottom:6px;letter-spacing:-0.5px}.meta{font-size:13px;color:#9ca3af}p{margin:8px 0;color:#374151;line-height:1.8;font-size:15px}h2{font-size:17px;font-weight:700;color:#111827;margin:20px 0 6px}h3{font-size:15px;font-weight:600;color:#374151;margin:16px 0 4px}ul,ol{margin:10px 0;padding-left:22px}li{margin:5px 0;color:#374151;line-height:1.7}hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}strong{color:#111827}</style></head><body><div class="header"><div class="badge">✓ Autopilot Result</div><h1>${title}</h1><p class="meta">${date}</p></div>${markdownToHtml(run.generated_content)}</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 400);
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

                                    <div className="mt-auto pt-4 border-t border-brand-dark/10 w-full space-y-3">
                                        <div>
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
                                        <button
                                            onClick={() => handleRunNow(schedule.id)}
                                            disabled={runningNowId === schedule.id || !schedule.is_active}
                                            className="w-full flex items-center justify-center gap-2 bg-[#DA7756] text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-[#c9684a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={!schedule.is_active ? 'Resume the agent to run it' : 'Run immediately and email you the result'}
                                        >
                                            {runningNowId === schedule.id ? (
                                                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Running…</>
                                            ) : (
                                                <><Zap className="w-3 h-3" />Run Now</>
                                            )}
                                        </button>
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
                                        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                                            {run.run_status === 'success' && (
                                                <>
                                                    <button
                                                        className="text-xs font-semibold bg-white border border-brand-dark/20 shadow-antigravity-sm px-4 py-2 rounded-xl text-brand-dark hover:border-brand-dark/40 transition-colors flex items-center gap-2"
                                                        onClick={() => {
                                                            const w = window.open('', '_blank');
                                                            if (!w) return;
                                                            const title = getPlaybookTitle(run.playbook_slug);
                                                            const date = new Date(run.created_at).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                                            const rawContent = run.generated_content || '';
                                                            const infoMatch = rawContent.match(/__INFOGRAPH_START__\n([\s\S]*?)\n__INFOGRAPH_END__\n\n([\s\S]*)/);
                                                            const infographHtml = infoMatch ? infoMatch[1] : '';
                                                            const content = infographHtml ? infoMatch![2] : rawContent;
                                                            w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Hoursback</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#F8F9FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;color:#202124}
    .topbar{background:#202124;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
    .topbar-left{display:flex;align-items:center;gap:10px}
    .logo-dot{width:28px;height:28px;background:linear-gradient(135deg,#4285F4,#6366f1);border-radius:8px}
    .logo-text{color:#fff;font-size:16px;font-weight:700;letter-spacing:-0.3px}
    .badge{background:rgba(66,133,244,0.2);color:#93bbfc;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;border:1px solid rgba(66,133,244,0.3)}
    .topbar-actions{display:flex;gap:8px}
    .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:all .15s}
    .btn-copy{background:rgba(255,255,255,0.12);color:#fff}
    .btn-copy:hover{background:rgba(255,255,255,0.2)}
    .btn-copy.copied{background:#22c55e;color:#fff}
    .btn-print{background:#4285F4;color:#fff}
    .btn-print:hover{background:#3574e2}
    .accent-bar{height:3px;background:linear-gradient(90deg,#4285F4,#6366f1,#DA7756)}
    .page{max-width:760px;margin:0 auto;padding:48px 24px 80px}
    .meta-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap}
    .status-badge{display:inline-flex;align-items:center;gap:5px;background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px}
    .status-dot{width:6px;height:6px;background:#22c55e;border-radius:50%;display:inline-block}
    .date-text{font-size:12px;color:#9ca3af}
    h1.report-title{font-size:28px;font-weight:800;color:#0F1012;line-height:1.2;margin-bottom:6px;letter-spacing:-0.6px}
    .divider{border:none;border-top:1px solid #e5e7eb;margin:24px 0}
    /* Infographic wrapper */
    .infograph-wrap{position:relative;cursor:pointer;margin-bottom:28px}
    .infograph-wrap:hover .expand-hint{opacity:1}
    .expand-hint{position:absolute;bottom:14px;right:16px;background:rgba(15,16,18,0.75);color:#fff;font-size:10px;font-weight:700;padding:5px 12px;border-radius:20px;letter-spacing:0.5px;opacity:0;transition:opacity .2s;pointer-events:none}
    /* Fullscreen modal */
    .infograph-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:1000;align-items:flex-start;justify-content:center;padding:32px 20px;overflow-y:auto}
    .infograph-modal.open{display:flex}
    .modal-inner{max-width:860px;width:100%;position:relative}
    .modal-close{position:fixed;top:20px;right:20px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:300;transition:background .15s}
    .modal-close:hover{background:rgba(255,255,255,0.25)}
    .modal-label{text-align:center;margin-top:16px;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.5px}
    /* Content card */
    .content-card{background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)}
    .content-card h1{font-size:20px;font-weight:700;color:#111827;margin:24px 0 8px}
    .content-card h2{font-size:17px;font-weight:700;color:#111827;margin:20px 0 6px}
    .content-card h3{font-size:15px;font-weight:600;color:#374151;margin:16px 0 4px}
    .content-card p{margin:8px 0;color:#374151;line-height:1.8;font-size:15px}
    .content-card ul,.content-card ol{margin:10px 0;padding-left:22px}
    .content-card li{margin:5px 0;color:#374151;line-height:1.7;font-size:15px}
    .content-card strong{color:#111827}
    .content-card em{color:#4b5563}
    .content-card hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
    .content-card code{background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;font-family:monospace}
    .section-label{font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px}
    .footer{text-align:center;margin-top:48px;font-size:12px;color:#9ca3af}
    .footer a{color:#4285F4;text-decoration:none}
    @media print{.topbar,.topbar-actions,.expand-hint,.infograph-modal{display:none!important}.page{padding:0}.content-card{box-shadow:none;border-radius:0}}
  </style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-left">
      <div class="logo-dot"></div>
      <span class="logo-text">hoursback</span>
      <span class="badge">Autopilot</span>
    </div>
    <div class="topbar-actions">
      <button class="btn btn-copy" id="copyBtn" onclick="copyContent()">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy
      </button>
      <button class="btn btn-print" onclick="window.print()">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print / PDF
      </button>
    </div>
  </div>
  <div class="accent-bar"></div>

  <div class="page">
    <div class="meta-row">
      <span class="status-badge"><span class="status-dot"></span> Autopilot Result</span>
      <span class="date-text">${date}</span>
    </div>
    <h1 class="report-title">${title}</h1>
    <hr class="divider">

    ${infographHtml ? `
    <div class="section-label">At a Glance</div>
    <div class="infograph-wrap" onclick="openInfograph()">
      ${infographHtml}
      <div class="expand-hint">⤢ Click to expand</div>
    </div>

    <!-- Fullscreen infograph modal -->
    <div class="infograph-modal" id="infographModal" onclick="if(event.target===this)closeInfograph()">
      <div class="modal-inner">
        <button class="modal-close" onclick="closeInfograph()">×</button>
        ${infographHtml}
        <p class="modal-label">Click outside or press Esc to close</p>
      </div>
    </div>

    <div class="divider"></div>
    ` : ''}

    <div class="section-label" style="margin-bottom:14px;">Full Analysis</div>
    <div class="content-card" id="reportContent">
      ${markdownToHtml(content)}
    </div>
    <div class="footer">
      <p>Generated by <a href="https://www.hoursback.xyz">Hoursback Autopilot</a> &nbsp;·&nbsp; <a href="https://www.hoursback.xyz/autopilot">Manage agents</a></p>
    </div>
  </div>

  <script>
    const rawText = ${JSON.stringify(content)};
    function copyContent() {
      navigator.clipboard.writeText(rawText).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy'; btn.classList.remove('copied'); }, 2000);
      });
    }
    function openInfograph() {
      document.getElementById('infographModal').classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeInfograph() {
      document.getElementById('infographModal').classList.remove('open');
      document.body.style.overflow = '';
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInfograph(); });
  </script>
</body>
</html>`);
                                                            w.document.close();
                                                        }}
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        Read
                                                    </button>
                                                    <button
                                                        className="text-xs font-semibold bg-white border border-brand-dark/20 shadow-antigravity-sm px-4 py-2 rounded-xl text-brand-dark hover:border-brand-dark/40 transition-colors flex items-center gap-2"
                                                        onClick={() => handleDownloadPdf(run)}
                                                    >
                                                        <FileDown className="w-3 h-3" />
                                                        PDF
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleRunAgain(run)}
                                                disabled={runningAgainId === run.id}
                                                className="text-xs font-semibold bg-[#DA7756]/10 border border-[#DA7756]/20 px-4 py-2 rounded-xl text-[#DA7756] hover:bg-[#DA7756]/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {runningAgainId === run.id ? (
                                                    <><div className="w-3 h-3 border-2 border-[#DA7756] border-t-transparent rounded-full animate-spin" />Running…</>
                                                ) : (
                                                    <><RotateCcw className="w-3 h-3" />Run again</>
                                                )}
                                            </button>
                                        </div>
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
