import { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { launchCatalog, getCategoryColor } from '../data/playbooks';
import { toast } from 'sonner';
import posthog from 'posthog-js';
import { ArrowLeft, ChevronRight, Copy, CheckCheck, ExternalLink, Upload, FileSpreadsheet, Clock, Lock } from 'lucide-react';

interface WorkflowInput {
  label: string;
  placeholder: string;
  type: 'url' | 'text' | 'textarea';
}

const workflowDescriptions: Record<string, string> = {
  'wkflow-1': 'Every week, Hoursback reads your Google Sheets dashboard, synthesises sales, finance, and operations metrics, and delivers a plain-English executive briefing to your inbox — so you start the week with a full picture of business health without opening a single spreadsheet.',
  'wkflow-2': 'Connects to your CRM data and reviews every open deal each week. Flags stalled opportunities, tracks probability changes, and surfaces at-risk deals so your sales team can act before revenue slips through the cracks.',
  'wkflow-3': 'Scans your accounting data for invoices past 30, 60, or 90 days overdue. Delivers a prioritised list of late payments with suggested follow-up actions — so you never lose track of money owed to you.',
  'wkflow-4': 'Reads your P&L from QuickBooks, Xero, or Google Sheets and produces a narrative monthly summary — comparing revenue, expenses, and margins to the previous month in plain English, so you always know your financial position.',
  'wkflow-5': 'Watches your competitors\' websites for changes — pricing updates, new product launches, or messaging shifts. Sends a weekly digest of what changed and what it might mean for your business, so you\'re never caught off guard.',
  'wkflow-6': 'Monitors your suppliers\' pricing pages and alerts you the moment prices change — giving you time to renegotiate, find alternatives, or adjust your own pricing before it hits your margins.',
  'wkflow-7': 'Scans news, blogs, and publications in your industry every week and delivers a curated digest of the most important trends — so you\'re always informed without spending hours reading through noise.',
  'wkflow-8': 'Tracks mentions of your brand across news sites, forums, and social platforms. Sends a weekly digest of what people are saying — positive and negative — so you can respond quickly and protect your reputation.',
  'wkflow-9': 'Monitors regulatory bodies and news sources in your jurisdiction for rule changes, new guidelines, or enforcement updates — so you\'re never caught off-guard by compliance requirements that could affect your business.',
  'wkflow-10': 'Watches your supplier product pages for inventory changes, new arrivals, or discontinued items. Keeps you ahead of supply chain disruptions before they affect your stock levels and customer orders.',
  'wkflow-11': 'Tracks key customer companies for news events — funding rounds, leadership changes, expansions, or downturns — so your account managers can reach out at the right moment with the right message to expand the relationship.',
  'wkflow-14': 'Reads your income and expense data from Google Sheets and delivers a weekly cash flow summary — highlighting trends, upcoming cash gaps, and actionable recommendations to keep your business financially healthy.',
  'wkflow-15': 'Monitors your supplier catalog and product pages for stock availability changes. Alerts you when items are low, back in stock, or discontinued — so you can reorder proactively and avoid stockouts.',
  'wkflow-20': 'Scans YouTube and social platforms for trending topics, video formats, and keywords in your niche. Delivers a weekly digest of what\'s gaining traction so you can create content that rides the wave before it peaks.',
  'wkflow-21': 'Analyses your niche\'s trending topics, seasonal patterns, and audience interests, then generates a ready-to-use 7-day content calendar — complete with post ideas, hooks, and optimal formats for each platform.',
};

const dataSourceHelp: Record<string, string> = {
  'wkflow-1': 'Share your Google Sheet and set access to "Anyone with link can view".',
  'wkflow-4': 'Export your QuickBooks or Xero P&L to Google Sheets for best results.',
  'wkflow-5': 'One URL per line. Pages must be publicly accessible (no login required).',
  'wkflow-6': 'Add pricing or catalog pages from each supplier — one URL per line.',
  'wkflow-7': 'Be specific — "AI SaaS productivity tools" works better than "tech".',
  'wkflow-8': 'Include common abbreviations or alternate spellings of your brand name.',
  'wkflow-9': 'Include your industry and the regulatory body — e.g. "fintech, SEC, GDPR".',
  'wkflow-10': 'Add product listing pages, not just the homepage of each supplier.',
  'wkflow-11': 'Use exact company names as they appear on LinkedIn.',
  'wkflow-14': 'Set your Google Sheet to "Anyone with link can view" before pasting the URL.',
  'wkflow-15': 'Add the product listing or catalog pages — not the supplier homepage.',
  'wkflow-20': 'Use 2–3 specific keywords — "personal finance tips" works better than "money".',
  'wkflow-21': 'Be specific about your niche — "keto recipes for busy moms" beats "food".',
};

const workflowInputs: Record<string, WorkflowInput> = {
  'wkflow-1': { label: 'Dashboard or spreadsheet URL', placeholder: 'https://docs.google.com/spreadsheets/...', type: 'url' },
  'wkflow-2': { label: 'CRM or pipeline data URL', placeholder: 'Your Salesforce or HubSpot export URL', type: 'url' },
  'wkflow-3': { label: 'Accounting software export URL', placeholder: 'Your QuickBooks webhook or export URL', type: 'url' },
  'wkflow-4': { label: 'Financial data source URL', placeholder: 'Your QuickBooks, Xero, or spreadsheet URL', type: 'url' },
  'wkflow-5': { label: 'Competitor website URLs to monitor (one per line)', placeholder: 'https://competitor1.com\nhttps://competitor2.com', type: 'textarea' },
  'wkflow-6': { label: 'Pricing page URLs to monitor (one per line)', placeholder: 'https://supplier.com/pricing\nhttps://competitor.com/pricing', type: 'textarea' },
  'wkflow-7': { label: 'Industry or niche keywords', placeholder: 'e.g. SaaS, fintech, climate tech', type: 'text' },
  'wkflow-8': { label: 'Brand or company name to monitor', placeholder: 'e.g. Acme Corp', type: 'text' },
  'wkflow-9': { label: 'Industry and jurisdiction to watch', placeholder: 'e.g. fintech, United States — SEC', type: 'text' },
  'wkflow-10': { label: 'Supplier website URLs to monitor (one per line)', placeholder: 'https://supplier1.com/products\nhttps://supplier2.com/catalog', type: 'textarea' },
  'wkflow-11': { label: 'Customer company names to track (one per line)', placeholder: 'Acme Corp\nBeta Industries\nGamma LLC', type: 'textarea' },
  'wkflow-14': { label: 'Google Sheets URL (your income & expense data)', placeholder: 'https://docs.google.com/spreadsheets/d/...', type: 'url' },
  'wkflow-15': { label: 'Supplier product page URLs (one per line)', placeholder: 'https://supplier.com/products\nhttps://wholesale.com/catalog', type: 'textarea' },
  'wkflow-20': { label: 'Niche or topic keywords', placeholder: 'e.g. personal finance, home workouts, productivity tips', type: 'text' },
  'wkflow-21': { label: 'Your content niche or topic', placeholder: 'e.g. small business tips, travel on a budget, fitness for beginners', type: 'text' },
};

function detectSourceType(url: string): 'google_sheets' | 'website' | 'api' {
  if (!url) return 'api';
  if (url.includes('docs.google.com/spreadsheets')) return 'google_sheets';
  if (url.startsWith('http')) return 'website';
  return 'api';
}

function getDataSourceConfig(workflowId: string, dataSource: string): Record<string, any> {
  switch (workflowId) {
    case 'wkflow-7': return { type: 'news_search', query: dataSource };
    case 'wkflow-8': return { type: 'brand_monitor', query: dataSource };
    case 'wkflow-9': return { type: 'regulatory_monitor', query: dataSource };
    case 'wkflow-11': return { type: 'linkedin_monitor', query: dataSource };
    case 'wkflow-5':
    case 'wkflow-6':
    case 'wkflow-10':
      return { type: 'website_list', urls: dataSource.split('\n').map(u => u.trim()).filter(Boolean) };
    case 'wkflow-14': return { type: 'google_sheets', url: dataSource };
    case 'wkflow-15': return { type: 'website_list', urls: dataSource.split('\n').map(u => u.trim()).filter(Boolean) };
    case 'wkflow-20': return { type: 'youtube_trends', query: dataSource };
    case 'wkflow-21': return { type: 'brand_monitor', query: dataSource };
    default:
      return { type: detectSourceType(dataSource), url: dataSource };
  }
}

export default function WorkflowBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedId = searchParams.get('id') ?? '';
  const [step, setStep] = useState(preselectedId ? 2 : 1);
  const [selectedWorkflow, setSelectedWorkflow] = useState(preselectedId);
  const [triggerType, setTriggerType] = useState('schedule');
  const [schedule, setSchedule] = useState('weekly');
  const [runTime, setRunTime] = useState('08:00');
  const [runDay, setRunDay] = useState('monday');
  const [notifyEmail, setNotifyEmail] = useState(user?.email ?? '');
  const [dataSource, setDataSource] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedWebhookUrl, setDeployedWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const { isPro: hasPro } = useAuth();
  const [dataSourceMode, setDataSourceMode] = useState<'url' | 'excel'>('url');
  const [xlsxPath, setXlsxPath] = useState('');
  const [xlsxFileName, setXlsxFileName] = useState('');
  const [xlsxUploading, setXlsxUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const workflow = launchCatalog.find(p => p.id === selectedWorkflow);
  const inputConfig = workflow ? workflowInputs[workflow.id] : null;

  const handleXlsxUpload = async (file: File) => {
    if (!user) return;
    setXlsxUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('excel-uploads').upload(path, file);
      if (error) throw error;
      setXlsxPath(path);
      setXlsxFileName(file.name);
      toast.success('File uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setXlsxUploading(false);
    }
  };

  const handleDeploy = async () => {
    if (!user || !workflow) return;
    if (workflow.isPro && !hasPro) {
      toast.error('This workflow requires a Pro subscription.');
      return;
    }
    setIsDeploying(true);
    try {
      const trigger_config = triggerType === 'schedule'
        ? { type: 'schedule', schedule, time: runTime, ...(schedule === 'weekly' ? { day: runDay } : {}) }
        : { type: 'webhook' };

      const dsConfig = dataSourceMode === 'excel' && xlsxPath
        ? { type: 'excel_file', storage_path: xlsxPath }
        : getDataSourceConfig(selectedWorkflow, dataSource);

      const { data: newWorkflow, error } = await supabase
        .from('workflows')
        .insert({
          user_id: user.id,
          name: workflow.title,
          category: workflow.category,
          status: 'active',
          trigger_config,
          agent_config: {
            prompt: workflow.expectedOutcome,
            model: 'claude-sonnet-4-6',
            data_source: dataSourceMode === 'excel' ? xlsxFileName : dataSource,
          },
          action_config: { type: 'email', to: notifyEmail || user.email },
          data_source_config: dsConfig,
        })
        .select()
        .single();

      if (error) throw error;

      posthog.capture('workflow_deployed', {
        workflow_id: selectedWorkflow,
        workflow_name: workflow.title,
        category: workflow.category,
        trigger_type: triggerType,
        data_source_mode: dataSourceMode,
        is_pro: workflow.isPro,
      });

      if (triggerType === 'webhook' && newWorkflow) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        setDeployedWebhookUrl(`${supabaseUrl}/functions/v1/webhook-receiver?workflow_id=${newWorkflow.id}`);
        setStep(4);
      } else {
        toast.success('Workflow deployed!');
        navigate('/workflows');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to deploy workflow');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(deployedWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-slate-50 text-brand-dark flex flex-col">
      <nav className="bg-white border-b border-brand-dark/10 px-6 py-4 flex items-center gap-4">
        <Link to="/workflows" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="font-semibold text-lg flex items-center gap-2">
          <span>Deploy Workflow</span>
          {step < 4 && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-brand-dark/50">Step {step} of {totalSteps}</span>
            </>
          )}
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-6 py-12 flex-1">

        {/* Step 1: Choose workflow */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold mb-2">Choose a workflow</h1>
              <p className="text-slate-600">Click any workflow to configure and deploy it automatically.</p>
            </div>

            <div className="space-y-3">
              {launchCatalog.map(p => {
                const locked = p.isPro && !hasPro;
                const color = getCategoryColor(p.category);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedWorkflow(p.id);
                      if (!locked) setStep(2);
                    }}
                    className={`flex items-start gap-0 rounded-2xl border-2 overflow-hidden transition-all cursor-pointer ${
                      locked
                        ? 'border-slate-200 bg-slate-50/50 opacity-80 hover:opacity-100'
                        : 'border-slate-200 bg-white hover:border-brand-blue/50 hover:shadow-md'
                    }`}
                  >
                    {/* Color accent bar */}
                    <div className="w-1 self-stretch shrink-0" style={{ backgroundColor: locked ? '#CBD5E1' : color }} />

                    <div className="flex flex-1 items-start gap-4 p-5">
                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: `${locked ? '#64748B' : color}18`, color: locked ? '#64748B' : color }}
                          >
                            {p.category}
                          </span>
                          {p.isPro && (
                            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${locked ? 'bg-slate-100 text-slate-500' : 'bg-purple-100 text-purple-700'}`}>
                              {locked && <Lock className="w-3 h-3" />} Pro
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base mb-1">{p.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {workflowDescriptions[p.id] || p.subtitle}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          Saves ~{p.timeSaved} min/week
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="shrink-0 mt-1">
                        {locked
                          ? <Lock className="w-4 h-4 text-slate-300" />
                          : <ChevronRight className="w-5 h-5 text-slate-300" />
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upgrade prompt when Pro workflow selected without Pro access */}
            {selectedWorkflow && workflow?.isPro && !hasPro && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-purple-900 text-sm">This workflow requires Pro</p>
                  <p className="text-purple-700 text-xs mt-0.5">Upgrade to unlock all {launchCatalog.filter(p => p.isPro).length} Pro workflows.</p>
                </div>
                <a
                  href="/#pricing"
                  className="shrink-0 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Upgrade to Pro
                </a>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Trigger */}
        {step === 2 && workflow && (
          <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300 max-w-2xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold mb-2">Configure trigger</h1>
              <p className="text-slate-600">How should <span className="font-medium">{workflow.title}</span> be triggered?</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
              <div>
                <label className="block font-semibold mb-3">Trigger type</label>
                <div className="flex gap-4">
                  <label className={`flex-1 p-4 border rounded-xl cursor-pointer ${triggerType === 'schedule' ? 'border-brand-blue bg-blue-50/30 ring-1 ring-brand-blue' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="trigger" value="schedule" checked={triggerType === 'schedule'} onChange={() => setTriggerType('schedule')} className="hidden" />
                    <div className="font-semibold text-center mt-1">Scheduled</div>
                    <div className="text-xs text-center text-slate-500 mt-1">Runs automatically on a timer</div>
                  </label>
                  <label className={`flex-1 p-4 border rounded-xl cursor-pointer ${triggerType === 'webhook' ? 'border-brand-blue bg-blue-50/30 ring-1 ring-brand-blue' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="trigger" value="webhook" checked={triggerType === 'webhook'} onChange={() => setTriggerType('webhook')} className="hidden" />
                    <div className="font-semibold text-center mt-1">Webhook</div>
                    <div className="text-xs text-center text-slate-500 mt-1">Listens for external events</div>
                  </label>
                </div>
              </div>

              {triggerType === 'schedule' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block font-semibold mb-2">Frequency</label>
                    <select
                      value={schedule}
                      onChange={e => setSchedule(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  {schedule !== 'hourly' && (
                    <div className="grid grid-cols-2 gap-4">
                      {schedule === 'weekly' && (
                        <div>
                          <label className="block font-semibold mb-2">Day</label>
                          <select
                            value={runDay}
                            onChange={e => setRunDay(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                          >
                            {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => (
                              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className={schedule === 'weekly' ? '' : 'col-span-2'}>
                        <label className="block font-semibold mb-2">Time</label>
                        <input
                          type="time"
                          value={runTime}
                          onChange={e => setRunTime(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">Your local timezone</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {triggerType === 'webhook' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm">
                  A unique webhook URL will be generated after deployment. Use it to trigger this workflow from Zapier, Make, or any external service.
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-between border-t border-slate-200 items-center">
              <button onClick={() => setStep(1)} className="text-slate-500 hover:text-brand-dark px-4 py-2 font-medium">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-brand-dark text-white px-8 py-3 rounded-full font-medium hover:bg-brand-dark/90 transition-colors"
              >
                Connect Data Source
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Data source + notification */}
        {step === 3 && workflow && (
          <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300 max-w-2xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold mb-2">Connect your data</h1>
              <p className="text-slate-600">Tell the workflow what to watch and where to send results.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
              {inputConfig && (
                <div>
                  {/* xlsx mode toggle — shown for URL-type inputs */}
                  {(inputConfig.type === 'url' || inputConfig.type === 'text') && (
                    <div className="flex gap-1 mb-3 p-1 bg-slate-100 rounded-xl w-fit">
                      <button
                        onClick={() => setDataSourceMode('url')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dataSourceMode === 'url' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {inputConfig.type === 'url' ? 'Google Sheets / URL' : 'Keywords'}
                      </button>
                      <button
                        onClick={() => setDataSourceMode('excel')}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${dataSourceMode === 'excel' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Upload Excel / CSV
                      </button>
                    </div>
                  )}

                  {dataSourceMode === 'excel' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleXlsxUpload(f); }}
                      />
                      {xlsxPath ? (
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                          <FileSpreadsheet className="w-5 h-5 text-green-600 shrink-0" />
                          <span className="text-sm font-medium text-green-800 flex-1 truncate">{xlsxFileName}</span>
                          <button
                            onClick={() => { setXlsxPath(''); setXlsxFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="text-xs text-slate-400 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={xlsxUploading}
                          className="w-full p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-brand-blue/40 hover:bg-blue-50/20 transition-all flex flex-col items-center gap-2 text-slate-500 disabled:opacity-50"
                        >
                          <Upload className="w-6 h-6" />
                          <span className="text-sm font-medium">{xlsxUploading ? 'Uploading...' : 'Click to upload .xlsx, .xls, or .csv'}</span>
                          <span className="text-xs text-slate-400">Max 10MB</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold mb-2">{inputConfig.label}</label>
                      {inputConfig.type === 'textarea' ? (
                        <textarea
                          value={dataSource}
                          onChange={e => setDataSource(e.target.value)}
                          placeholder={inputConfig.placeholder}
                          rows={4}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none resize-none text-sm"
                        />
                      ) : (
                        <input
                          type={inputConfig.type}
                          value={dataSource}
                          onChange={e => setDataSource(e.target.value)}
                          placeholder={inputConfig.placeholder}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                        />
                      )}
                      {dataSourceHelp[selectedWorkflow] && (
                        <p className="text-xs text-slate-400 mt-1.5">{dataSourceHelp[selectedWorkflow]}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold mb-2">Notify email</label>
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Workflow results will be emailed here.</p>
              </div>
            </div>

            {/* Deployment summary */}
            {notifyEmail && workflow && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Deployment Summary</p>
                <div className="space-y-1.5 text-sm text-slate-700">
                  <p><span className="text-slate-400">Workflow:</span> <strong>{workflow.title}</strong></p>
                  <p>
                    <span className="text-slate-400">Schedule:</span>{' '}
                    {triggerType === 'webhook'
                      ? 'Webhook triggered'
                      : `${schedule.charAt(0).toUpperCase() + schedule.slice(1)}${schedule === 'weekly' ? ` on ${runDay.charAt(0).toUpperCase() + runDay.slice(1)}` : ''} at ${runTime}`}
                  </p>
                  <p><span className="text-slate-400">Results to:</span> {notifyEmail}</p>
                  {dataSourceMode === 'excel' && xlsxFileName && (
                    <p><span className="text-slate-400">Data file:</span> {xlsxFileName}</p>
                  )}
                  {dataSourceMode !== 'excel' && dataSource && (
                    <p><span className="text-slate-400">Data source:</span> {dataSource.length > 50 ? dataSource.slice(0, 50) + '…' : dataSource}</p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-between border-t border-slate-200 items-center">
              <button onClick={() => setStep(2)} className="text-slate-500 hover:text-brand-dark px-4 py-2 font-medium">
                Back
              </button>
              <button
                onClick={handleDeploy}
                disabled={isDeploying || !notifyEmail || (dataSourceMode === 'excel' && !xlsxPath)}
                className="bg-brand-blue text-white px-8 py-3 rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isDeploying ? 'Deploying...' : 'Deploy Workflow'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Webhook URL success screen */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCheck className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">Workflow deployed!</h1>
                <p className="text-slate-500">Your webhook is live. Send a POST request to this URL to trigger the workflow.</p>
              </div>

              <div className="text-left bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Your Webhook URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-slate-700 break-all font-mono leading-relaxed">
                    {deployedWebhookUrl}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-2 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Copy URL"
                  >
                    {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-left text-sm text-blue-800 space-y-1">
                <p className="font-semibold">How to use:</p>
                <p>Send a <code className="bg-blue-100 px-1 rounded">POST</code> request with your data as JSON. The AI agent will analyze the payload and email you the results.</p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <Link to="/workflows">
                  <button className="bg-brand-dark text-white px-6 py-2.5 rounded-full font-medium hover:bg-brand-dark/90 transition-colors flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View My Workflows
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
