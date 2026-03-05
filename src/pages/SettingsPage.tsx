import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Settings, Shield, Link as LinkIcon, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfile } from '../lib/api';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../components/AuthModal';
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
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [password, setPassword] = useState('');

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
                    setOpenaiApiKey(profile.openai_api_key || '');
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
                openai_api_key: openaiApiKey
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

                        {/* AI Copilot Integration */}
                        <section className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-indigo-500" />
                                        AI Copilot Integration (BYOK)
                                    </h2>
                                    <p className="text-sm text-brand-dark/70 mt-1">
                                        Bring Your Own Key. Enter your OpenAI API key to enable direct playbook execution inside Hoursback.
                                        Your key is stored securely in your private profile and is only used when you click "Run with AI".
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-brand-dark/70 mb-1 flex items-center justify-between">
                                        OpenAI API Key
                                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-xs text-brand-blue flex items-center gap-1 hover:underline">
                                            Get API Key <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </label>
                                    <input
                                        type="password"
                                        value={openaiApiKey}
                                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-blue"
                                        placeholder="sk-..."
                                    />
                                </div>
                            </div>
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
        </div>
    );
}
