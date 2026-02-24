import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile } from '../lib/api';
import { toast } from 'sonner';
import type { Playbook } from '../data/playbooks';

interface WebhookExecutorProps {
    playbook: Playbook;
}

export default function WebhookExecutor({ playbook }: WebhookExecutorProps) {
    const { user } = useAuth();
    const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isExecuting, setIsExecuting] = useState(false);
    const [inputs, setInputs] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchWebhook = async () => {
            if (!user) {
                setIsLoadingProfile(false);
                return;
            }
            try {
                const profile = await getProfile(user.id, user.email || '');
                // Prioritize Make webhook if both exist, otherwise fallback to Zapier
                setWebhookUrl(profile?.make_webhook_url || profile?.zapier_webhook_url || null);
            } catch (err) {
                console.error('Error fetching profile for webhook:', err);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchWebhook();
    }, [user]);

    if (!playbook.webhookConfig) return null;

    const handleInputChange = (id: string, value: string) => {
        setInputs(prev => ({ ...prev, [id]: value }));
    };

    const handleExecute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('You must be logged in to execute agents.');
            return;
        }
        if (!webhookUrl) {
            toast.error('No Webhook URL configured in your settings.');
            return;
        }

        setIsExecuting(true);

        // Construct the Universal Payload
        const payload = {
            playbook_id: playbook.slug,
            user_email: user.email,
            inputs: inputs
        };

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            toast.success('Agent Executed Successfully! Payload sent to your Webhook.');
            // Optional: clear inputs
            // setInputs({});

        } catch (err: any) {
            console.error('Webhook execution failed:', err);
            toast.error(`Agent Execution Failed: ${err.message}`);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-antigravity-md border border-brand-dark/10 mt-8">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Play className="w-5 h-5 text-brand-blue" />
                        Live Agent Execution
                    </h3>
                    <p className="text-sm text-brand-dark/70 mt-1">
                        Trigger this automated workflow seamlessly using your configured Webhook.
                    </p>
                </div>
                {!isLoadingProfile && webhookUrl ? (
                    <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Webhook Connected
                    </div>
                ) : !isLoadingProfile && !webhookUrl ? (
                    <div className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <a href="#/settings" className="hover:underline flex items-center gap-1">
                            Configure Webhook in Settings
                            <LinkIcon className="w-3 h-3" />
                        </a>
                    </div>
                ) : (
                    <div className="text-xs text-slate-400">Loading connection...</div>
                )}
            </div>

            <form onSubmit={handleExecute} className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-4">
                    {playbook.webhookConfig.inputs.map((inputSchema) => (
                        <div key={inputSchema.id}>
                            <label htmlFor={inputSchema.id} className="block text-sm font-medium text-brand-dark/80 mb-1">
                                {inputSchema.label}
                            </label>
                            <input
                                id={inputSchema.id}
                                type={inputSchema.type || 'text'}
                                required
                                placeholder={inputSchema.placeholder}
                                value={inputs[inputSchema.id] || ''}
                                onChange={(e) => handleInputChange(inputSchema.id, e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-blue transition-colors"
                                disabled={!webhookUrl || isExecuting}
                            />
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={!webhookUrl || isExecuting}
                    className="w-full py-3 bg-brand-dark text-white rounded-xl font-medium hover:bg-brand-dark/90 transition-all shadow-antigravity-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isExecuting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Running Agent...
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            Run Agent Now
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
