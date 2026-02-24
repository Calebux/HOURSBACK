import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, AlertCircle, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProfile } from '../lib/api';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultView?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultView = 'signin' }: AuthModalProps) {
    const [view, setView] = useState<'signin' | 'signup'>(defaultView);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (view === 'signup') {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        }
                    }
                });
                if (signUpError) throw signUpError;

                // If the user already bought Pro and has it in local storage, sync it with their new account
                if (localStorage.getItem('has_pro_access') === 'true' && signUpData.user) {
                    try {
                        await updateProfile(signUpData.user.id, { subscription_status: 'pro' });
                    } catch (e) {
                        console.error("Failed to sync pro status on signup", e);
                    }
                }
                onClose();
            } else {
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;

                // Sync local storage Pro status for returning users who paid while logged out
                if (localStorage.getItem('has_pro_access') === 'true' && signInData.user) {
                    try {
                        await updateProfile(signInData.user.id, { subscription_status: 'pro' });
                    } catch (e) {
                        console.error("Failed to sync pro status on signin", e);
                    }
                }
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/20 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-md rounded-[32px] shadow-antigravity-lg overflow-hidden relative"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-brand-dark/50 hover:text-brand-dark hover:bg-brand-dark/5 rounded-full transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header Area with subtle gradient */}
                        <div className="pt-10 pb-6 px-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-bl-full -mr-20 -mt-20 pointer-events-none" />
                            <h2 className="text-3xl font-bold tracking-tight text-brand-dark mb-2">
                                {view === 'signin' ? 'Welcome back' : 'Create account'}
                            </h2>
                            <p className="text-brand-dark/70">
                                {view === 'signin'
                                    ? 'Enter your details to access your workspace.'
                                    : 'Start leveraging AI playbooks today.'}
                            </p>
                        </div>

                        {/* Form Area */}
                        <div className="px-8 pb-10">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-2xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {view === 'signup' && (
                                    <div>
                                        <label className="block text-sm font-medium text-brand-dark mb-1.5 ml-1">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-dark/40">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="block w-full pl-11 pr-4 py-3 bg-brand-light border border-brand-dark/10 rounded-2xl text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-brand-dark mb-1.5 ml-1">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-dark/40">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3 bg-brand-light border border-brand-dark/10 rounded-2xl text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-brand-dark mb-1.5 ml-1">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-dark/40">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-11 pr-4 py-3 bg-brand-light border border-brand-dark/10 rounded-2xl text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 mt-2 bg-brand-dark text-white rounded-full font-medium hover:bg-[#7C3AED] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>{view === 'signin' ? 'Sign In' : 'Create Account'}</>
                                    )}
                                </button>
                            </form>

                            {/* Toggle View */}
                            <div className="mt-8 text-center">
                                <p className="text-sm text-brand-dark/70">
                                    {view === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
                                    <button
                                        onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
                                        className="text-brand-blue font-medium hover:underline"
                                    >
                                        {view === 'signin' ? 'Sign up' : 'Sign in'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
