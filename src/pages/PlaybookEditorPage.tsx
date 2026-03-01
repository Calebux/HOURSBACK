import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, Plus, Trash2, MessageSquare, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, fetchPlaybookById } from '../lib/api';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface StepData {
    title: string;
    instruction: string;
    promptTemplate: string;
    expectedOutput: string;
    tips: string;
    tools: string[];
}

export default function PlaybookEditorPage() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State - Base Details
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [slug, setSlug] = useState('');
    const [category, setCategory] = useState('');
    const [difficulty, setDifficulty] = useState('Beginner');
    const [timeToComplete, setTimeToComplete] = useState(15);
    const [timeSaved, setTimeSaved] = useState(60);
    const [isPro, setIsPro] = useState(false);

    // Dynamic Arrays
    const [tools, setTools] = useState<string[]>(['']);
    const [beforeYouStart, setBeforeYouStart] = useState<string[]>(['']);
    const [expectedOutcome, setExpectedOutcome] = useState('');

    // Step Builder State
    const [steps, setSteps] = useState<StepData[]>([{
        title: '',
        instruction: '',
        promptTemplate: '',
        expectedOutput: '',
        tips: '',
        tools: ['']
    }]);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate('/');
            return;
        }

        const checkAdminAndLoad = async () => {
            try {
                let profile = await getProfile(user.id, user.email || '');

                // Set admin status based strictly on DB profile
                setIsAdmin(!!profile?.is_admin);

                if (profile?.is_admin && id) {
                    const playbook = await fetchPlaybookById(id);
                    if (playbook) {
                        setTitle(playbook.title);
                        setSubtitle(playbook.subtitle);
                        setSlug(playbook.slug);
                        setCategory(playbook.category);
                        setDifficulty(playbook.difficulty);
                        setTimeToComplete(playbook.timeToComplete);
                        setTimeSaved(playbook.timeSaved);
                        setIsPro(playbook.isPro);
                        setTools(playbook.tools.length > 0 ? playbook.tools : ['']);
                        setBeforeYouStart(playbook.beforeYouStart.length > 0 ? playbook.beforeYouStart : ['']);
                        setExpectedOutcome(playbook.expectedOutcome);

                        if (playbook.steps && playbook.steps.length > 0) {
                            setSteps(playbook.steps.map(s => ({
                                title: s.title,
                                instruction: s.instruction,
                                promptTemplate: s.promptTemplate || '',
                                expectedOutput: s.expectedOutput || '',
                                tips: s.tips || '',
                                tools: s.tools && s.tools.length > 0 ? s.tools : ['']
                            })));
                        }
                    }
                }
            } catch (err) {
                console.error('Auth error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        checkAdminAndLoad();
    }, [user, navigate, id, authLoading]);

    // Array Helpers
    const handleArrayChange = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, array: string[]) => {
        const newArray = [...array];
        newArray[index] = value;
        setter(newArray);
    };
    const addArrayRow = (setter: React.Dispatch<React.SetStateAction<string[]>>) => setter(prev => [...prev, '']);
    const removeArrayRow = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => setter(prev => prev.filter((_, i) => i !== index));

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Clean Data
            const cleanTools = tools.filter(t => t.trim() !== '');
            const cleanBeforeStart = beforeYouStart.filter(b => b.trim() !== '');

            if (!title || !slug || !category || !expectedOutcome) {
                throw new Error("Please fill in all core fields (Title, Slug, Category, Outcome)");
            }

            // 2. Upsert Base Playbook
            const pbPayload = {
                title,
                subtitle,
                slug,
                category,
                difficulty,
                time_to_complete: timeToComplete,
                time_saved: timeSaved,
                is_pro: isPro,
                tools: cleanTools,
                before_you_start: cleanBeforeStart,
                expected_outcome: expectedOutcome,
            };

            let pbId = id;

            if (id) {
                const { error: pbError } = await supabase
                    .from('playbooks')
                    .update(pbPayload)
                    .eq('id', id);
                if (pbError) throw pbError;
            } else {
                const { data: pbData, error: pbError } = await supabase
                    .from('playbooks')
                    .insert({
                        ...pbPayload,
                        is_new: true,
                        rating: 5.0,
                        completion_count: 0
                    })
                    .select('id')
                    .single();
                if (pbError) throw pbError;
                if (!pbData?.id) throw new Error("Failed to create playbook record");
                pbId = pbData.id;
            }

            // 3. Upsert Steps (Delete old ones and insert new to handle ordering easily)
            if (pbId) {
                if (id) {
                    await supabase.from('playbook_steps').delete().eq('playbook_id', id);
                }

                if (steps.length > 0) {
                    const stepsToInsert = steps.map((s, index) => {
                        const cleanStepTools = (s.tools || []).filter(t => t.trim() !== '');
                        return {
                            playbook_id: pbId,
                            step_number: index + 1,
                            title: s.title,
                            instruction: s.instruction,
                            prompt_template: s.promptTemplate || null,
                            expected_output: s.expectedOutput || null,
                            tips: s.tips || null,
                            tools: cleanStepTools.length > 0 ? cleanStepTools : null
                        };
                    });

                    const { error: stepsError } = await supabase
                        .from('playbook_steps')
                        .insert(stepsToInsert);

                    if (stepsError) throw stepsError;
                }
            }

            toast.success('Playbook and steps saved successfully!');
            navigate('/admin');

        } catch (err: any) {
            toast.error(`Error saving playbook: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !isAdmin) return null;

    return (
        <div className="min-h-screen bg-brand-light text-brand-dark pb-24">
            {/* Navigation */}
            <nav className="border-b border-brand-dark/10 bg-white sticky top-0 z-50 p-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{id ? 'Edit Playbook' : 'Create New Playbook'}</h1>
                            <p className="text-xs text-brand-dark/60">Drafting mode</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 rounded-full hover:bg-brand-dark/90 transition-colors shadow-antigravity-xs text-sm font-medium disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Playbook</>}
                    </button>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-8 max-w-4xl space-y-8">
                {/* Core Metadata Section */}
                <section className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-antigravity-xs space-y-6">
                    <h2 className="text-xl font-bold border-b border-slate-100 pb-4">Core Information</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-brand-dark/80 mb-1">Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none" placeholder="e.g. Inbound Lead Scraper" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-dark/80 mb-1">URL Slug</label>
                            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none" placeholder="e.g. inbound-lead-scraper" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-brand-dark/80 mb-1">Subtitle</label>
                            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none" placeholder="Brief description of the value prop" />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-brand-dark/80 mb-1">Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none">
                                <option value="">Select Category...</option>
                                <option value="Sales">Sales</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Operations">Operations</option>
                                <option value="Finance">Finance</option>
                                <option value="Legal">Legal</option>
                                <option value="Product">Product</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-dark/80 mb-1">Difficulty</label>
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none">
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer p-2 border border-slate-200 rounded-xl w-full hover:bg-slate-50">
                                <input type="checkbox" checked={isPro} onChange={(e) => setIsPro(e.target.checked)} className="w-5 h-5 accent-[#635BFF] rounded cursor-pointer" />
                                <span className="text-sm font-medium text-brand-dark/80">Pro / Paid Tier</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 pt-2">
                        <div>
                            <label className="block text-sm font-medium text-brand-dark/80 mb-1 flex justify-between">
                                <span>Time to Complete (mins)</span>
                                <span className="text-brand-dark/40">{timeToComplete}m</span>
                            </label>
                            <input type="range" min="1" max="120" value={timeToComplete} onChange={(e) => setTimeToComplete(Number(e.target.value))} className="w-full accent-[#635BFF]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-dark/80 mb-1 flex justify-between">
                                <span>Time Saved (mins/week)</span>
                                <span className="text-green-500 font-medium">{timeSaved}m</span>
                            </label>
                            <input type="range" min="10" max="600" step="10" value={timeSaved} onChange={(e) => setTimeSaved(Number(e.target.value))} className="w-full accent-green-500" />
                        </div>
                    </div>
                </section>

                {/* Dynamic Lists Section */}
                <section className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-antigravity-xs space-y-8">
                    <h2 className="text-xl font-bold border-b border-slate-100 pb-4">Requirements & Outcomes</h2>

                    {/* Tools Builder */}
                    <div>
                        <label className="block text-sm font-medium text-brand-dark/80 mb-2">Required Tools</label>
                        <div className="space-y-3 mb-3">
                            {tools.map((tool, i) => (
                                <div key={i} className="flex gap-2">
                                    <input type="text" value={tool} onChange={(e) => handleArrayChange(i, e.target.value, setTools, tools)} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none" placeholder="e.g. Make.com, ChatGPT" />
                                    <button onClick={() => removeArrayRow(i, setTools)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => addArrayRow(setTools)} className="text-sm text-[#635BFF] font-medium hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> Add Tool</button>
                    </div>

                    {/* Before You Start Builder */}
                    <div>
                        <label className="block text-sm font-medium text-brand-dark/80 mb-2">Before You Start (Prerequisites)</label>
                        <div className="space-y-3 mb-3">
                            {beforeYouStart.map((item, i) => (
                                <div key={i} className="flex gap-2">
                                    <input type="text" value={item} onChange={(e) => handleArrayChange(i, e.target.value, setBeforeYouStart, beforeYouStart)} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none" placeholder="e.g. An active Zapier account" />
                                    <button onClick={() => removeArrayRow(i, setBeforeYouStart)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => addArrayRow(setBeforeYouStart)} className="text-sm text-[#635BFF] font-medium hover:underline flex items-center gap-1"><Plus className="w-4 h-4" /> Add Prerequisite</button>
                    </div>

                    {/* Outcome Textarea */}
                    <div>
                        <label className="block text-sm font-medium text-brand-dark/80 mb-2">Expected Outcome</label>
                        <textarea
                            value={expectedOutcome}
                            onChange={(e) => setExpectedOutcome(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none resize-none"
                            placeholder="Describe exactly what the user will achieve once this playbook is completed..."
                        />
                    </div>
                </section>

                {/* Step Builder Section */}
                <section className="bg-white rounded-3xl p-8 border border-brand-dark/10 shadow-antigravity-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h2 className="text-xl font-bold">Step Builder</h2>
                        <button
                            onClick={() => setSteps(prev => [...prev, { title: '', instruction: '', promptTemplate: '', expectedOutput: '', tips: '', tools: [''] }])}
                            className="bg-brand-dark/5 hover:bg-brand-dark/10 text-brand-dark px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Step
                        </button>
                    </div>

                    <div className="space-y-8">
                        {steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
                                <div className="absolute -left-3 -top-3 w-8 h-8 bg-brand-dark text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                                    {stepIndex + 1}
                                </div>

                                {steps.length > 1 && (
                                    <button
                                        onClick={() => setSteps(prev => prev.filter((_, i) => i !== stepIndex))}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}

                                <div className="space-y-5 mt-2 max-w-2xl">
                                    <div>
                                        <label className="block text-sm font-medium text-brand-dark/80 mb-1">Step Title</label>
                                        <input
                                            type="text"
                                            value={step.title}
                                            onChange={(e) => {
                                                const newSteps = [...steps];
                                                newSteps[stepIndex].title = e.target.value;
                                                setSteps(newSteps);
                                            }}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none"
                                            placeholder="e.g. Scrape the Local Competitor"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-brand-dark/80 mb-1 flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-slate-400" /> Core Instruction</label>
                                        <textarea
                                            value={step.instruction}
                                            onChange={(e) => {
                                                const newSteps = [...steps];
                                                newSteps[stepIndex].instruction = e.target.value;
                                                setSteps(newSteps);
                                            }}
                                            rows={2}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none resize-none"
                                            placeholder="Explain exactly what the user needs to do in this step..."
                                        />
                                    </div>

                                    <div className="bg-[#635BFF]/5 border border-[#635BFF]/20 rounded-2xl p-5">
                                        <label className="block text-sm font-medium text-[#635BFF] mb-1 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Prompt Template (Optional)</label>
                                        <p className="text-xs text-[#635BFF]/70 mb-3">Use [brackets] around variables to automatically generate input fields for the user.</p>
                                        <textarea
                                            value={step.promptTemplate}
                                            onChange={(e) => {
                                                const newSteps = [...steps];
                                                newSteps[stepIndex].promptTemplate = e.target.value;
                                                setSteps(newSteps);
                                            }}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-white border border-[#635BFF]/20 rounded-xl focus:border-[#635BFF] focus:outline-none resize-none font-mono text-sm leading-relaxed"
                                            placeholder="e.g. Write a cold email to [Target Company] about [Product Name]."
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-brand-dark/80 mb-1 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Expected Output (Optional)</label>
                                            <textarea
                                                value={step.expectedOutput}
                                                onChange={(e) => {
                                                    const newSteps = [...steps];
                                                    newSteps[stepIndex].expectedOutput = e.target.value;
                                                    setSteps(newSteps);
                                                }}
                                                rows={2}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-brand-dark/80 mb-1">Pro Tip (Optional)</label>
                                            <textarea
                                                value={step.tips}
                                                onChange={(e) => {
                                                    const newSteps = [...steps];
                                                    newSteps[stepIndex].tips = e.target.value;
                                                    setSteps(newSteps);
                                                }}
                                                rows={2}
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-[#635BFF] focus:outline-none resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-brand-dark/80 mb-2">Tools Used in this Step</label>
                                        <div className="space-y-2 mb-2">
                                            {step.tools.map((tool, toolIndex) => (
                                                <div key={toolIndex} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={tool}
                                                        onChange={(e) => {
                                                            const newSteps = [...steps];
                                                            newSteps[stepIndex].tools[toolIndex] = e.target.value;
                                                            setSteps(newSteps);
                                                        }}
                                                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-[#635BFF] focus:outline-none text-sm"
                                                        placeholder="e.g. Zapier"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newSteps = [...steps];
                                                            newSteps[stepIndex].tools = step.tools.filter((_, i) => i !== toolIndex);
                                                            setSteps(newSteps);
                                                        }}
                                                        className="text-slate-400 hover:text-red-500 p-1.5 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newSteps = [...steps];
                                                newSteps[stepIndex].tools.push('');
                                                setSteps(newSteps);
                                            }}
                                            className="text-xs text-[#635BFF] font-medium hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add Tool
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}
