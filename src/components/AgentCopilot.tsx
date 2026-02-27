import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AgentCopilotProps {
    prompt: string;
    tools?: string[];
}

export default function AgentCopilot({ prompt, tools = [] }: AgentCopilotProps) {
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!user) return;

        setIsGenerating(true);
        setError(null);
        setResponse(null);

        try {
            // Refresh the session to get a fresh JWT (avoids expired token issues)
            const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
            const token = sessionData.session?.access_token;

            if (sessionError || !token) {
                throw new Error('Session expired — please log out and log back in');
            }

            // Determine which AI provider to use based on playbook tools
            const useClaude = tools.some(t => t.toLowerCase().includes('claude'));

            // Call Edge Function directly via fetch for reliable error handling
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const res = await fetch(`${supabaseUrl}/functions/v1/run-copilot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'apikey': anonKey,
                },
                body: JSON.stringify({ prompt, provider: useClaude ? 'anthropic' : 'openai' }),
            });

            const data = await res.json();
            console.log('Edge Function response:', JSON.stringify(data));

            // Handle all error formats: { error: "..." }, { message: "..." }, or non-2xx
            if (data?.error) {
                throw new Error(data.error);
            }
            if (data?.message && data?.code && data.code !== 200) {
                throw new Error(data.message);
            }
            if (!res.ok) {
                throw new Error(`Edge Function returned ${res.status}: ${JSON.stringify(data)}`);
            }
            if (!data?.result) {
                throw new Error('No result returned from AI');
            }

            setResponse(data.result);

        } catch (err: any) {
            console.error('AgentCopilot error:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Check for unfilled variables like [Company Name]
    const hasUnfilledVariables = prompt.includes('[') && prompt.includes(']');

    return (
        <div className="mt-4">
            {/* Action Button */}
            {!response && !isGenerating && !error && (
                <div className="relative group/btn">
                    <button
                        onClick={handleGenerate}
                        disabled={hasUnfilledVariables}
                        className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${hasUnfilledVariables
                            ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 hover:shadow-antigravity-sm'
                            }`}
                    >
                        <Sparkles className={`w-5 h-5 ${!hasUnfilledVariables && 'group-hover/btn:scale-110 transition-transform'}`} />
                        Run with AI Copilot
                    </button>

                    {/* Tooltip for disabled state */}
                    {hasUnfilledVariables && (
                        <div className="absolute right-0 left-0 -top-10 flex justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                            <span className="bg-slate-800 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl shrink-0 whitespace-nowrap">
                                Please fill all required variables to run Copilot
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {isGenerating && (
                <div className="w-full bg-indigo-50 border border-indigo-100 py-6 px-4 rounded-xl flex flex-col items-center justify-center gap-3 animate-pulse">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    <p className="text-sm font-medium text-indigo-600">Executing playbook step...</p>
                </div>
            )}

            {/* General Error */}
            {error && (
                <div className="w-full bg-red-50 border border-red-200 py-4 px-5 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-red-800 text-sm">Execution Failed</h4>
                        <p className="text-xs text-red-700/80 mt-1">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-xs text-red-600 font-medium hover:underline mt-2"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* Success Response */}
            {response && (
                <div className="w-full bg-white shadow-antigravity-md border border-brand-dark/10 rounded-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none" />

                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h4 className="font-medium text-brand-dark flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            AI Copilot Output
                        </h4>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(response);
                                }}
                                className="text-xs font-medium text-brand-dark/60 hover:text-brand-dark transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200"
                            >
                                Copy Text
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full"
                            >
                                Regenerate
                            </button>
                        </div>
                    </div>

                    <div className="p-6 relative z-10">
                        <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:text-slate-800">
                            {/* Minimal markdown rendering via whitespace */}
                            <div className="whitespace-pre-wrap text-brand-dark/90 text-[15px] leading-relaxed break-words font-sans">
                                {response}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
