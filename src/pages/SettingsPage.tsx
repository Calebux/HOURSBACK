import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Database } from 'lucide-react';
import { ChevronLeft, Save, Settings, Shield, Link as LinkIcon, ExternalLink, Send, CheckCircle, Copy, Unlink } from 'lucide-react';
import { TelegramSetupGuide } from '../components/TelegramSetupGuide';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfile } from '../lib/api';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../lib/validation';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [fullName, setFullName] = useState('');
    const [makeWebhook, setMakeWebhook] = useState('');
    const [zapierWebhook, setZapierWebhook] = useState('');
    const [password, setPassword] = useState('');

    // Telegram state
    const [telegramBotUsername, setTelegramBotUsername] = useState('');
    const [telegramBotName, setTelegramBotName] = useState('');
    const [telegramConnected, setTelegramConnected] = useState(false);
    const [managerToken, setManagerToken] = useState('');
    const [staffToken, setStaffToken] = useState('');
    const [isConnectingTelegram, setIsConnectingTelegram] = useState(false);
    const [isDisconnectingTelegram, setIsDisconnectingTelegram] = useState(false);
    const [copiedLink, setCopiedLink] = useState<'manager' | 'staff' | null>(null);
    const [showTelegramGuide, setShowTelegramGuide] = useState(false);
    const [handoverWatcherEnabled, setHandoverWatcherEnabled] = useState(false);
    const [shiftEndTime, setShiftEndTime] = useState('18:00');
    const [isSavingWatcher, setIsSavingWatcher] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const loadData = async () => {
            try {
                const profile = await getProfile(user.id, user.email || '');
                if (profile) {
                    setFullName(profile.full_name || '');
                    setMakeWebhook(profile.make_webhook_url || '');
                    setZapierWebhook(profile.zapier_webhook_url || '');
                }

                // Load Telegram bot status — query directly so we're not dependent on edge function
                const { data: botData } = await supabase
                    .from('telegram_bots')
                    .select('bot_username, bot_name, webhook_registered, manager_token, staff_token, handover_watcher_enabled, shift_end_time')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (botData?.bot_username) {
                    setTelegramConnected(true);
                    setTelegramBotUsername(botData.bot_username);
                    setTelegramBotName(botData.bot_name || '');
                    setManagerToken(botData.manager_token || '');
                    setStaffToken(botData.staff_token || '');
                    setHandoverWatcherEnabled(botData.handover_watcher_enabled ?? false);
                    setShiftEndTime(botData.shift_end_time || '18:00');
                }
            } catch (err) {
                console.error('Error loading profile:', err);
                toast.error('Failed to load settings');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user, navigate]);

    const handleDisconnectTelegram = async () => {
        setIsDisconnectingTelegram(true);
        try {
            await supabase.functions.invoke('telegram-setup', { body: { action: 'disconnect' } });
            setTelegramConnected(false);
            setTelegramBotUsername('');
            setTelegramBotName('');
            setManagerToken('');
            setStaffToken('');
            toast.success('Telegram bot disconnected.');
        } catch (err: any) {
            toast.error(err.message || 'Failed to disconnect');
        } finally {
            setIsDisconnectingTelegram(false);
        }
    };

    const handleCopyLink = async (type: 'manager' | 'staff') => {
        const token = type === 'manager' ? managerToken : staffToken;
        if (!telegramBotUsername || !token) return;
        const link = `https://t.me/${telegramBotUsername}?start=${token}`;
        try {
            await navigator.clipboard.writeText(link);
        } catch {
            // Fallback for browsers that block clipboard API
            const el = document.createElement('textarea');
            el.value = link;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopiedLink(type);
        setTimeout(() => setCopiedLink(null), 2000);
    };

    const handleSaveWatcher = async () => {
        setIsSavingWatcher(true);
        try {
            await supabase.functions.invoke('telegram-setup', {
                body: { action: 'update_watcher', handover_watcher_enabled: handoverWatcherEnabled, shift_end_time: shiftEndTime },
            });
            toast.success('Watcher settings saved.');
        } catch (err: any) {
            toast.error(err.message || 'Failed to save watcher settings');
        } finally {
            setIsSavingWatcher(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        try {
            // 1. Update Profile (Name & Webhooks)
            const success = await updateProfile(user.id, {
                full_name: fullName,
                make_webhook_url: makeWebhook,
                zapier_webhook_url: zapierWebhook,
            });

            if (!success) throw new Error('Failed to update profile');

            // 2. Update Password if provided
            if (password) {
                const passwordError = validatePassword(password);
                if (passwordError) {
                    throw new Error(passwordError);
                }

                const { error } = await supabase.auth.updateUser({ password });
                if (error) throw error;
                setPassword(''); // Clear field on success
            }

            toast.success('Settings saved successfully!');
        } catch (err: any) {
            toast.error(err.message || 'Error saving settings');
        } finally {
            setIsSaving(false);
        }
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
                    <Link to="/">
                        <img src="/logo.svg" alt="Hoursback" className="h-[36px] w-auto" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => signOut()}
                            className="text-sm text-brand-dark/80 hover:text-brand-dark transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-12 max-w-3xl">
                <div className="flex items-center gap-2 mb-8">
                    <button onClick={() => navigate(-1)} className="text-brand-dark/70 hover:text-brand-dark flex items-center gap-1 text-sm">
                        <ChevronLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-antigravity-md border border-brand-dark/10"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <Settings className="w-8 h-8 text-brand-blue" />
                        <h1 className="text-3xl font-semibold">Account Settings</h1>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">

                        {/* Account Info */}
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Shield className="w-5 h-5 text-slate-400" />
                                Profile & Security
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-brand-dark/70 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-blue"
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-dark/70 mb-1">Email</label>
                                    <input
                                        type="text"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-brand-dark/70 mb-1">New Password (leave blank to keep current)</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-blue"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100" />

                        {/* Telegram Bot */}
                        <section className="space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Send className="w-5 h-5 text-slate-400" />
                                    Telegram Bot
                                </h2>
                                <p className="text-sm text-brand-dark/70 mt-1">
                                    Give your team a private Telegram bot they own — for cash reconciliation, shift handovers, escalations, and more. 24/7, no app needed.
                                </p>
                            </div>

                            {telegramConnected ? (
                                /* ── Connected state ── */
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-green-900 text-sm">{telegramBotName} connected</p>
                                            <p className="text-green-700 text-xs">@{telegramBotUsername} · Webhook active · 24/7</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleDisconnectTelegram}
                                            disabled={isDisconnectingTelegram}
                                            className="shrink-0 text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
                                        >
                                            <Unlink className="w-3.5 h-3.5" />
                                            {isDisconnectingTelegram ? 'Disconnecting...' : 'Disconnect'}
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-brand-dark/70">Invite links — share with your team</p>

                                        {/* Manager link */}
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">Manager</span>
                                                <span className="text-xs text-brand-dark/50">Full access — assign to trusted leads</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`https://t.me/${telegramBotUsername}?start=${managerToken}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-brand-blue font-mono truncate hover:underline"
                                                >
                                                    t.me/{telegramBotUsername}?start={managerToken}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyLink('manager')}
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-brand-dark text-white text-sm rounded-lg hover:bg-brand-dark/90 transition-colors"
                                                >
                                                    {copiedLink === 'manager' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    {copiedLink === 'manager' ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Staff link */}
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Staff</span>
                                                <span className="text-xs text-brand-dark/50">Limited access — share with all team members</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`https://t.me/${telegramBotUsername}?start=${staffToken}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-brand-blue font-mono truncate hover:underline"
                                                >
                                                    t.me/{telegramBotUsername}?start={staffToken}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyLink('staff')}
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-brand-dark text-white text-sm rounded-lg hover:bg-brand-dark/90 transition-colors"
                                                >
                                                    {copiedLink === 'staff' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    {copiedLink === 'staff' ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-brand-dark/50">Team members tap their link to activate the bot with the right role. Share manager links only with trusted leads.</p>
                                    </div>

                                    {/* Handover watcher */}
                                    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-brand-dark">Handover watcher</p>
                                                <p className="text-xs text-brand-dark/50 mt-0.5">Ping staff who haven't submitted /handover by shift end</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setHandoverWatcherEnabled(!handoverWatcherEnabled)}
                                                className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${handoverWatcherEnabled ? 'bg-brand-blue' : 'bg-slate-200'}`}
                                            >
                                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${handoverWatcherEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                        {handoverWatcherEnabled && (
                                            <div className="flex items-center gap-3">
                                                <label className="text-xs font-medium text-brand-dark/70 shrink-0">Shift ends at</label>
                                                <input
                                                    type="time"
                                                    value={shiftEndTime}
                                                    onChange={(e) => setShiftEndTime(e.target.value)}
                                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue"
                                                />
                                                <span className="text-xs text-brand-dark/40">UTC</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleSaveWatcher}
                                            disabled={isSavingWatcher}
                                            className="text-xs font-medium text-brand-blue hover:underline disabled:opacity-50"
                                        >
                                            {isSavingWatcher ? 'Saving...' : 'Save watcher settings'}
                                        </button>
                                    </div>

                                    {/* Data Sources link */}
                                    <Link
                                        to="/data-sources"
                                        className="flex items-center justify-between p-3 bg-brand-blue/5 border border-brand-blue/20 rounded-xl hover:bg-brand-blue/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Database className="w-4 h-4 text-brand-blue" />
                                            <div>
                                                <p className="text-sm font-semibold text-brand-dark">Data Sources</p>
                                                <p className="text-xs text-brand-dark/50">Register sheets so staff skip manual entry</p>
                                            </div>
                                        </div>
                                        <ChevronLeft className="w-4 h-4 text-slate-400 rotate-180" />
                                    </Link>

                                    <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
                                        <p className="text-xs font-semibold text-brand-dark/60 uppercase tracking-wide">Available commands</p>
                                        {[
                                            ['/reconcile', 'Daily cash reconciliation'],
                                            ['/handover', 'Shift handover log'],
                                            ['/sop', 'SOP compliance check'],
                                            ['/sopupdate', 'SOP update notifier'],
                                            ['/restock', 'Supplier outreach'],
                                            ['/audit', 'Inventory audit'],
                                            ['/assign', 'Task assignment'],
                                            ['/escalate', 'Escalation router'],
                                        ].map(([cmd, desc]) => (
                                            <div key={cmd} className="flex items-center gap-2 text-xs">
                                                <span className="font-mono text-brand-blue w-24 shrink-0">{cmd}</span>
                                                <span className="text-brand-dark/60">{desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* ── Setup flow ── */
                                <div className="space-y-4">
                                    <div className="bg-slate-50 rounded-2xl p-5 text-center space-y-3">
                                        <div className="text-4xl">🤖</div>
                                        <p className="font-semibold text-brand-dark">No bot connected yet</p>
                                        <p className="text-sm text-brand-dark/60">
                                            Set up a private Telegram bot your team can message 24/7 — for reconciliations, handovers, escalations, and more.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowTelegramGuide(true)}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-dark text-white rounded-full text-sm font-semibold hover:bg-brand-dark/90 transition-colors"
                                        >
                                            <Send className="w-4 h-4" />
                                            Set up my Telegram bot
                                        </button>
                                        <p className="text-xs text-brand-dark/40">Takes about 3 minutes · Step-by-step guide included</p>
                                    </div>
                                </div>
                            )}
                        </section>

                        <hr className="border-slate-100" />

                        {/* Webhook Integrations */}
                        <section className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <LinkIcon className="w-5 h-5 text-slate-400" />
                                        Webhook Integrations
                                    </h2>
                                    <p className="text-sm text-brand-dark/70 mt-1">
                                        Connect your API automations. Playbooks will automatically route data to these Webhooks when you click "Run Agent".
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-brand-dark/70 mb-1 flex items-center justify-between">
                                        Make.com Custom Webhook URL
                                        <a href="https://make.com" target="_blank" rel="noreferrer" className="text-xs text-brand-blue flex items-center gap-1 hover:underline">
                                            Get one <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </label>
                                    <input
                                        type="url"
                                        value={makeWebhook}
                                        onChange={(e) => setMakeWebhook(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-blue"
                                        placeholder="https://hook.us1.make.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-dark/70 mb-1 flex items-center justify-between">
                                        Zapier Catch Hook URL
                                        <a href="https://zapier.com" target="_blank" rel="noreferrer" className="text-xs text-brand-blue flex items-center gap-1 hover:underline">
                                            Get one <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </label>
                                    <input
                                        type="url"
                                        value={zapierWebhook}
                                        onChange={(e) => setZapierWebhook(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-blue"
                                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full md:w-auto px-8 py-3 bg-brand-dark text-white rounded-full font-medium hover:bg-brand-dark/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save Configuration
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </motion.div>
            </main>
        <TelegramSetupGuide
            isOpen={showTelegramGuide}
            onClose={() => setShowTelegramGuide(false)}
            isConnecting={isConnectingTelegram}
            connectedBotUsername={telegramBotUsername}
            managerToken={managerToken}
            staffToken={staffToken}
            onConnect={async (token) => {
                setIsConnectingTelegram(true);
                try {
                    const res = await supabase.functions.invoke('telegram-setup', {
                        body: { action: 'connect', token: token.trim() },
                    });
                    if (res.error || res.data?.error) throw new Error(res.data?.error || 'Connection failed');
                    setTelegramConnected(true);
                    setTelegramBotUsername(res.data.bot_username);
                    setTelegramBotName(res.data.bot_name);
                    setManagerToken(res.data.manager_token || '');
                    setStaffToken(res.data.staff_token || '');
                } catch (err: any) {
                    toast.error(err.message || 'Failed to connect bot');
                    throw err;
                } finally {
                    setIsConnectingTelegram(false);
                }
            }}
        />
        </div>
    );
}
