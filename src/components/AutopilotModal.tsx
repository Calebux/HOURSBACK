import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

import type { Playbook } from '../data/playbooks';

interface AutopilotModalProps {
    isOpen: boolean;
    onClose: () => void;
    playbook: Playbook;
    variables: Record<string, string>;
    userId: string | undefined;
    initialData?: {
        id: string;
        cron_expression: string;
        custom_delivery_email?: string;
    };
}

export default function AutopilotModal({ isOpen, onClose, playbook, variables, userId, initialData }: AutopilotModalProps) {
    const isEditMode = !!initialData;
    const [isScheduling, setIsScheduling] = useState(false);

    // Initialize from initialData if editing
    const getInitialScheduleType = () => {
        if (!initialData) return 'daily';
        if (initialData.cron_expression.endsWith('1-5')) return 'weekdays';
        if (initialData.cron_expression.endsWith('1')) return 'weekly';
        return 'daily';
    };

    const getInitialTime = () => {
        if (!initialData) return '08:00';
        const parts = initialData.cron_expression.split(' ');
        const min = parts[0].padStart(2, '0');
        const hour = parts[1].padStart(2, '0');
        return `${hour}:${min}`;
    };

    const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'weekdays'>(getInitialScheduleType());
    const [time, setTime] = useState(getInitialTime());
    const [customEmail, setCustomEmail] = useState(initialData?.custom_delivery_email || '');

    // Basic mapping of human intent to pg_cron expressions
    const getCronExpression = () => {
        const [hour, min] = time.split(':');
        switch (scheduleType) {
            case 'daily': return `${parseInt(min)} ${parseInt(hour)} * * *`;
            case 'weekdays': return `${parseInt(min)} ${parseInt(hour)} * * 1-5`;
            case 'weekly': return `${parseInt(min)} ${parseInt(hour)} * * 1`; // Defaults to Monday morning
            default: return `${parseInt(min)} ${parseInt(hour)} * * *`;
        }
    };

    const handleSchedule = async () => {
        if (!userId) {
            toast.error('Please sign in to schedule autonomous agents.');
            return;
        }

        // Verify they actually filled out the playbook variables first
        const missingVars = Object.values(variables).some(v => !v || v.trim() === '');
        if (missingVars || Object.keys(variables).length === 0) {
            toast.error('Please fill out all Prompt Variables in the sidebar first before scheduling the agent.');
            return;
        }

        setIsScheduling(true);

        try {
            const payload = {
                user_id: userId,
                playbook_slug: playbook.slug,
                playbook_data: playbook, // Store the full "recipe"
                variables: variables,
                cron_expression: getCronExpression(),
                custom_delivery_email: customEmail.trim() || null,
                is_active: true
            };

            const query = isEditMode
                ? supabase.from('scheduled_playbooks').update(payload).eq('id', initialData.id)
                : supabase.from('scheduled_playbooks').insert(payload);

            const { error } = await query;

            if (error) throw error;

            toast.success(isEditMode ? 'Agent updated successfully!' : `Agent successfully assigned! It will run ${scheduleType} at ${time}.`);
            onClose();
        } catch (err: any) {
            console.error('Failed to schedule agent:', err);
            toast.error(err.message || 'Failed to schedule agent');
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-brand-dark/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="w-full max-w-md bg-white rounded-3xl shadow-antigravity-lg overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-dark/10 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-[#DA7756]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-brand-dark text-lg sm:text-xl">
                                        {isEditMode ? 'Edit Autopilot Agent' : 'Hire Autopilot Agent'}
                                    </h3>
                                    <p className="text-xs text-brand-dark/60">Schedule "{playbook.title}"</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-brand-dark/50 hover:text-brand-dark shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
                            <div className="bg-[#DA7756]/5 border border-[#DA7756]/20 rounded-xl p-4 text-sm text-brand-dark/80">
                                <p>This agent will automatically wake up, follow the playbook instructions, and email you the final result.</p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-brand-dark text-sm">How often should it run?</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setScheduleType('daily')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${scheduleType === 'daily' ? 'border-[#DA7756] bg-[#DA7756]/5 text-[#DA7756] shadow-sm' : 'border-brand-dark/10 hover:border-brand-dark/30 text-brand-dark/60'}`}
                                    >
                                        <Calendar className="w-5 h-5" />
                                        <span className="text-xs font-medium">Daily</span>
                                    </button>
                                    <button
                                        onClick={() => setScheduleType('weekdays')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${scheduleType === 'weekdays' ? 'border-[#DA7756] bg-[#DA7756]/5 text-[#DA7756] shadow-sm' : 'border-brand-dark/10 hover:border-brand-dark/30 text-brand-dark/60'}`}
                                    >
                                        <Calendar className="w-5 h-5" />
                                        <span className="text-xs font-medium">Weekdays</span>
                                    </button>
                                    <button
                                        onClick={() => setScheduleType('weekly')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${scheduleType === 'weekly' ? 'border-[#DA7756] bg-[#DA7756]/5 text-[#DA7756] shadow-sm' : 'border-brand-dark/10 hover:border-brand-dark/30 text-brand-dark/60'}`}
                                    >
                                        <Calendar className="w-5 h-5" />
                                        <span className="text-xs font-medium">Weekly<br /><span className="text-[10px] opacity-70">(Mondays)</span></span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <h4 className="font-medium text-brand-dark text-sm">At what time? (UTC)</h4>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark/40 pointer-events-none" />
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full sm:w-auto pl-9 pr-4 py-2 bg-white border border-brand-dark/20 focus:border-brand-dark rounded-xl outline-none transition-colors text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-brand-dark text-sm">Delivery Email (Optional)</h4>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={customEmail}
                                    onChange={(e) => setCustomEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-brand-dark/20 focus:border-brand-dark rounded-xl outline-none transition-colors text-sm"
                                />
                                <p className="text-[10px] text-brand-dark/40 italic">Leave blank to use your account email.</p>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 border-t border-brand-dark/10 shrink-0">
                            <button
                                onClick={handleSchedule}
                                disabled={isScheduling}
                                className="w-full flex items-center justify-center gap-2 bg-brand-dark text-white rounded-full py-3 sm:py-3.5 font-medium hover:bg-[#DA7756] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-antigravity-md"
                            >
                                {isScheduling ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        {isEditMode ? 'Update Agent' : 'Deploy Agent'}
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-brand-dark/40 mt-3 sm:mt-4">
                                Runs securely via Supabase pg_cron + Anthropic API
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
