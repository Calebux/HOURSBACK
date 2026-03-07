import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, Database, BrainCircuit, Mail, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const TEMPLATES = [
    {
        name: 'Revenue Watcher',
        dataSourceType: 'google_sheets',
        rule: 'Alert me if total revenue drops by more than 10% compared to the previous week.',
        analysisPrompt: 'Analyze the revenue drop: identify which products or segments declined most, surface any patterns, and suggest 3 immediate actions to recover.',
        actionType: 'email',
        schedule: 'daily',
    },
    {
        name: 'Operations Threshold',
        dataSourceType: 'google_sheets',
        rule: 'Alert me if any metric exceeds its defined threshold or falls below its minimum acceptable value.',
        analysisPrompt: 'Identify which operational metrics are out of range, explain likely causes, and recommend corrective steps.',
        actionType: 'email',
        schedule: 'daily',
    },
    {
        name: 'Weekly Sheet Summary',
        dataSourceType: 'google_sheets',
        rule: 'Always trigger — generate a weekly summary regardless of changes.',
        analysisPrompt: 'Summarize the key highlights from this week\'s data. Note what improved, what declined, and what requires attention in the coming week.',
        actionType: 'email',
        schedule: 'weekly',
    },
];

const STEPS = [
    { id: 'source', title: 'Data Source', icon: Database },
    { id: 'rule', title: 'Monitoring Rule', icon: Eye },
    { id: 'analysis', title: 'AI Analysis', icon: BrainCircuit },
    { id: 'action', title: 'Action & Schedule', icon: Mail },
];

export default function CreateWatcherPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        dataSourceType: 'google_sheets',
        dataSourceUrl: '',
        rule: 'Alert me if revenue drops by more than 10% compared to last week.',
        analysisPrompt: 'Analyze the dataset, explain why the change occurred, identify key drivers, and suggest 3 actionable recommendations.',
        actionType: 'email',
        schedule: 'daily',
    });

    const handleNext = () => {
        if (currentStep === 0) {
            if (!formData.name.trim()) { toast.error('Please enter a name'); return; }
            if (!formData.dataSourceUrl.trim()) { toast.error('Please enter a data source URL'); return; }
        }
        if (currentStep === 1 && !formData.rule.trim()) { toast.error('Please enter a monitoring rule'); return; }
        if (currentStep === 2 && !formData.analysisPrompt.trim()) { toast.error('Please enter an analysis prompt'); return; }

        if (currentStep < STEPS.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            createWatcher();
        }
    };

    const createWatcher = async () => {
        if (!user) { toast.error('Not logged in'); return; }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('watchers').insert({
                user_id: user.id,
                name: formData.name,
                data_source_type: formData.dataSourceType,
                data_source_config: { url: formData.dataSourceUrl },
                condition_prompt: formData.rule,
                ai_prompt: formData.analysisPrompt,
                action_type: formData.actionType,
                schedule: formData.schedule,
                status: 'active'
            });

            if (error) throw error;

            toast.success('Watcher created successfully!');
            navigate('/watchers');
        } catch (err) {
            console.error('Failed to create watcher', err);
            toast.error('Failed to create watcher');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/watchers')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg flex items-center gap-2">
                            <Eye className="w-5 h-5 text-[#635BFF]" />
                            Create Watcher
                        </h1>
                        <p className="text-xs text-slate-500 hidden sm:block">Set up an AI background monitor</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Progress */}
                <div className="hidden md:block w-72 bg-white border-r border-slate-200 p-8 overflow-y-auto shrink-0">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Setup Steps</h2>
                    <div className="space-y-6">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = idx === currentStep;
                            const isPast = idx < currentStep;
                            return (
                                <div key={idx} className={`flex items-start gap-4 ${isActive ? 'opacity-100' : isPast ? 'opacity-60' : 'opacity-30'}`}>
                                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${isActive ? 'border-[#635BFF] bg-[#635BFF] text-white' : isPast ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-slate-400'}`}>
                                        {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold text-sm ${isActive ? 'text-[#635BFF]' : isPast ? 'text-emerald-600' : 'text-slate-600'}`}>{step.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {idx === 0 && 'Where to pull data'}
                                            {idx === 1 && 'When to trigger'}
                                            {idx === 2 && 'What to analyze'}
                                            {idx === 3 && 'Where to send it'}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-[#f8fafc] overflow-y-auto">
                    <div className="max-w-2xl mx-auto py-12 px-6 pb-32">

                        {/* Step 1: Source */}
                        {currentStep === 0 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                    <Database className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold mb-3">Connect Data Source</h2>
                                <p className="text-slate-500 mb-8 max-w-lg">
                                    Where should the watcher pull data from? For spreadsheets, ensure the link is viewable.
                                </p>

                                {/* Template picker */}
                                <div className="mb-8">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Start from a template</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {TEMPLATES.map((tpl) => (
                                            <button
                                                key={tpl.name}
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    name: tpl.name,
                                                    dataSourceType: tpl.dataSourceType,
                                                    rule: tpl.rule,
                                                    analysisPrompt: tpl.analysisPrompt,
                                                    actionType: tpl.actionType,
                                                    schedule: tpl.schedule,
                                                }))}
                                                className="p-4 rounded-xl border-2 border-slate-200 bg-white text-left hover:border-[#635BFF] hover:bg-[#635BFF]/5 transition-all group"
                                            >
                                                <Zap className="w-4 h-4 text-[#635BFF] mb-2" />
                                                <div className="font-semibold text-sm text-slate-800">{tpl.name}</div>
                                                <div className="text-xs text-slate-500 mt-1 capitalize">{tpl.schedule} · {tpl.actionType}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Watcher Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Weekly Revenue Monitor"
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Source Type</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setFormData({ ...formData, dataSourceType: 'google_sheets' })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.dataSourceType === 'google_sheets' ? 'border-[#635BFF] bg-[#635BFF]/5 ring-4 ring-[#635BFF]/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                <div className="font-semibold text-sm text-slate-800">Google Sheets</div>
                                                <div className="text-xs text-slate-500 mt-1">CSV Export URL</div>
                                            </button>
                                            <button
                                                onClick={() => setFormData({ ...formData, dataSourceType: 'api' })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.dataSourceType === 'api' ? 'border-[#635BFF] bg-[#635BFF]/5 ring-4 ring-[#635BFF]/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                <div className="font-semibold text-sm text-slate-800">REST API</div>
                                                <div className="text-xs text-slate-500 mt-1">JSON Endpoint</div>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Resource URL</label>
                                        <input
                                            type="url"
                                            value={formData.dataSourceUrl}
                                            onChange={e => setFormData({ ...formData, dataSourceUrl: e.target.value })}
                                            placeholder="https://docs.google.com/spreadsheets/d/..."
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all outline-none font-mono text-sm"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">
                                            Make sure the URL is publicly readable or accessible without auth for this V1.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Rule */}
                        {currentStep === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold mb-3">Define Monitoring Rule</h2>
                                <p className="text-slate-500 mb-8 max-w-lg">
                                    Tell the AI in plain English exactly what to watch for. It will check this condition every time it runs.
                                </p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Trigger Condition</label>
                                        <div className="relative">
                                            <textarea
                                                value={formData.rule}
                                                onChange={e => setFormData({ ...formData, rule: e.target.value })}
                                                rows={5}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all outline-none resize-none leading-relaxed"
                                                placeholder="e.g. Alert me if inventory for any product falls below 10 units..."
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Rule Examples</h4>
                                        <ul className="text-sm text-blue-700 space-y-2 list-disc pl-4">
                                            <li>Alert me if Cost Per Acquisition (CPA) is greater than $50.</li>
                                            <li>Alert me if the number of 1-star reviews in the last 7 days is &gt; 3.</li>
                                            <li>Trigger if MRR decreases week-over-week.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Analysis */}
                        {currentStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                    <BrainCircuit className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold mb-3">Setup AI Analysis</h2>
                                <p className="text-slate-500 mb-8 max-w-lg">
                                    When the rule is triggered, the AI will deeply analyze the dataset. Give it instructions on what to report.
                                </p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Analysis Prompt</label>
                                        <textarea
                                            value={formData.analysisPrompt}
                                            onChange={e => setFormData({ ...formData, analysisPrompt: e.target.value })}
                                            rows={8}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all outline-none resize-none leading-relaxed"
                                            placeholder="e.g. Analyze the dataset, explain why the change occurred..."
                                        />
                                    </div>

                                    <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-4">
                                        <span className="font-semibold block mb-1">How it works:</span>
                                        The AI uses Claude 3.5 Sonnet for deep analysis. It will receive the raw dataset, the condition that triggered, and this prompt to generate your alert report.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Action */}
                        {currentStep === 3 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold mb-3">Action & Schedule</h2>
                                <p className="text-slate-500 mb-8 max-w-lg">
                                    How should you be notified, and how often should the watcher run?
                                </p>

                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-sm font-semibold mb-3">Action to take</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setFormData({ ...formData, actionType: 'email' })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.actionType === 'email' ? 'border-[#635BFF] bg-[#635BFF]/5 ring-4 ring-[#635BFF]/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                <div className="font-semibold text-sm text-slate-800">Email Me</div>
                                                <div className="text-xs text-slate-500 mt-1">Send full report to inbox</div>
                                            </button>
                                            <button
                                                onClick={() => setFormData({ ...formData, actionType: 'dashboard' })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.actionType === 'dashboard' ? 'border-[#635BFF] bg-[#635BFF]/5 ring-4 ring-[#635BFF]/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                <div className="font-semibold text-sm text-slate-800">Dashboard Only</div>
                                                <div className="text-xs text-slate-500 mt-1">Log it silently</div>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-3">Polling Schedule</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['hourly', 'daily', 'weekly'].map(sch => (
                                                <button
                                                    key={sch}
                                                    onClick={() => setFormData({ ...formData, schedule: sch })}
                                                    className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all capitalize ${formData.schedule === sch ? 'border-[#635BFF] bg-[#635BFF]/5 text-[#635BFF]' : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'}`}
                                                >
                                                    {sch}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Nav */}
            <footer className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between sticky bottom-0 z-10">
                <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${currentStep === 0 ? 'text-transparent pointer-events-none' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    Back
                </button>
                <div className="flex items-center gap-2">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-[#635BFF]' : 'bg-slate-200'}`}></div>
                    ))}
                </div>
                <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-[#635BFF] hover:bg-[#524be3] text-white px-6 py-2.5 rounded-xl font-medium shadow-antigravity-md hover:shadow-antigravity-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : currentStep === STEPS.length - 1 ? 'Finish & Activate' : 'Continue'}
                    {!isSubmitting && currentStep < STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}
                </button>
            </footer>
        </div>
    );
}
