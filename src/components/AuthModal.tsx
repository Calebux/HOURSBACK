import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, AlertCircle, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { updateProfile } from '../lib/api';
import { toast } from 'sonner';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultView?: 'signin' | 'signup';
}

export const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    return null;
};

export function AuthModal({ isOpen, onClose, defaultView = 'signin' }: AuthModalProps) {
    const [view, setView] = useState<'signin' | 'signup' | 'reset' | 'success'>(defaultView as any);
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
                const passwordError = validatePassword(password);
                if (passwordError) {
                    throw new Error(passwordError);
                }

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                        emailRedirectTo: `${window.location.origin}/`,
                    }
                });
                if (signUpError) throw signUpError;

                // If session is null, it means email confirmation is required
                if (signUpData.user && signUpData.session === null) {
                    setView('success');
                    return;
                }

                // If the user already bought Pro and has it in local storage, sync it with their new account
                if (localStorage.getItem('has_pro_access') === 'true' && signUpData.user) {
                    try {
                        await updateProfile(signUpData.user.id, { subscription_status: 'pro' });
                    } catch (e) {
                        console.error("Failed to sync pro status on signup", e);
                    }
                }
                onClose();
            } else if (view === 'reset') {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/settings`,
                });
                if (resetError) throw resetError;
                toast.success('Check your email for the password reset link!');
                onClose();
                return;
            } else {
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                // Sync local storage Pro status for returning users who paid while logged out
                if (localStorage.getItem('has_pro_access') === 'true' && signInData?.user) {
                    try {
                        await updateProfile(signInData.user.id, { subscription_status: 'pro' });
                    } catch (e) {
                        console.error("Failed to sync pro status on signin", e);
                    }
                }
                onClose();
            }
        } catch (err: any) {
            const errorMessage = err.message || '';
            if (errorMessage.toLowerCase().includes('confirm') || errorMessage.toLowerCase().includes('check your email')) {
                // If it's a confirmation error, show the success view instead of an error message
                setView('success');
            } else {
                setError(errorMessage || 'An error occurred during authentication.');
            }
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

                        {view === 'success' ? (
                            <div className="p-8 sm:p-10 text-center flex flex-col items-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                                    className="w-20 h-20 bg-brand-blue/10 rounded-3xl flex items-center justify-center mb-6"
                                >
                                    <Mail className="w-10 h-10 text-brand-blue" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-brand-dark mb-3">Check your email</h3>
                                <p className="text-brand-dark/60 mb-8 leading-relaxed">
                                    We've sent a magic link to <span className="font-semibold text-brand-dark">{email}</span>.<br />
                                    Please click the link to confirm your account and start using Hoursback.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3.5 bg-brand-dark text-white rounded-full font-medium hover:bg-brand-blue transition-all shadow-antigravity-sm"
                                >
                                    Got it, thanks!
                                </button>
                                <p className="mt-6 text-sm text-brand-dark/40">
                                    Didn't receive it? Check your spam folder or <button onClick={() => setView('signup')} className="text-brand-blue hover:underline">try again</button>.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Header Area with subtle gradient */}
                                <div className="pt-10 pb-6 px-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-bl-full -mr-20 -mt-20 pointer-events-none" />
                                    <h2 className="text-3xl font-bold tracking-tight text-brand-dark mb-2">
                                        {view === 'signin' ? 'Welcome back' : view === 'signup' ? 'Create account' : 'Reset password'}
                                    </h2>
                                    <p className="text-brand-dark/70">
                                        {view === 'signin'
                                            ? 'Enter your details to access your workspace.'
                                            : view === 'signup'
                                                ? 'Start leveraging AI playbooks today.'
                                                : 'Enter your email to receive a reset link.'}
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

                                        {view !== 'reset' && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5 ml-1 ring-0">
                                                    <label className="block text-sm font-medium text-brand-dark">Password</label>
                                                    {view === 'signin' && (
                                                        <button type="button" onClick={() => setView('reset')} className="text-sm text-brand-blue hover:underline">
                                                            Forgot password?
                                                        </button>
                                                    )}
                                                </div>
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
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3.5 mt-2 bg-brand-dark text-white rounded-full font-medium hover:bg-[#7C3AED] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>{view === 'signin' ? 'Sign In' : view === 'signup' ? 'Create Account' : 'Send Reset Link'}</>
                                            )}
                                        </button>
                                    </form>

                                    {/* Toggle View */}
                                    <div className="mt-8 text-center flex flex-col items-center gap-2">
                                        {view !== 'signin' && (
                                            <p className="text-sm text-brand-dark/70">
                                                Already have an account?{' '}
                                                <button type="button" onClick={() => setView('signin')} className="text-brand-blue font-medium hover:underline">
                                                    Sign in
                                                </button>
                                            </p>
                                        )}
                                        {view === 'signin' && (
                                            <p className="text-sm text-brand-dark/70">
                                                Don't have an account?{' '}
                                                <button type="button" onClick={() => setView('signup')} className="text-brand-blue font-medium hover:underline">
                                                    Sign up
                                                </button>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
