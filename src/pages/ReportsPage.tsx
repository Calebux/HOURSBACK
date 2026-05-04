import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Bot, CheckCircle2, XCircle, Clock, Filter, FileText, Download, ThumbsUp, ThumbsDown, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReportRenderer, computeConfidence, renderMarkdown, injectCallouts, parseReport, buildQuickChartUrl } from '../components/ReportRenderer';
import { MobileNav } from '../components/MobileNav';
import { UserAvatar } from '../components/UserAvatar';
import { toast } from 'sonner';
import posthog from 'posthog-js';

type Feedback = 'helpful' | 'not_helpful' | 'too_vague';

interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: 'success' | 'failed';
  generated_output: string;
  error_message: string | null;
  feedback: Feedback | null;
  created_at: string;
}

interface Workflow {
  id: string;
  name: string;
  category: string;
}

function getWorkflowDisplayName(workflow: Workflow | undefined): string {
  if (!workflow?.name) return 'Unknown Workflow';
  return workflow.name.replace(/^Hub:\s*/, '');
}

function getWorkflowCategoryLabel(category: string | undefined): string {
  if (!category) return '';
  return category === 'Hub Workflow' ? 'Workflow Bundle' : category;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    async function load() {
      try {
        const [{ data: wData }, { data: rData }] = await Promise.all([
          supabase.from('workflows').select('id, name, category').eq('user_id', user!.id),
          supabase.from('workflow_runs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100),
        ]);
        if (wData) setWorkflows(wData);
        if (rData) setRuns(rData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, navigate]);

  const filtered = filter === 'all' ? runs : runs.filter(r => r.workflow_id === filter);

  const submitFeedback = async (runId: string, value: Feedback) => {
    setSubmittingFeedback(runId);
    try {
      const { error } = await supabase
        .from('workflow_runs')
        .update({ feedback: value })
        .eq('id', runId);
      if (error) throw error;
      setRuns(prev => prev.map(r => r.id === runId ? { ...r, feedback: value } : r));
      posthog.capture('feedback_submitted', { run_id: runId, feedback: value });
      toast.success('Thanks for the feedback!');
    } catch {
      toast.error('Failed to save feedback');
    } finally {
      setSubmittingFeedback(null);
    }
  };

  const downloadPdf = (run: WorkflowRun, wf: Workflow | undefined) => {
    const wfName = wf ? getWorkflowDisplayName(wf) : 'Report';
    setDownloadingId(run.id);
    try {
      const runDate = new Date(run.created_at);
      const confidence = run.generated_output ? computeConfidence(run.generated_output) : null;

      // Build report body from output parts
      const parts = parseReport(run.generated_output || '');
      const bodyHtml = parts.map(part => {
        if (part.type === 'chart') {
          const url = buildQuickChartUrl(part.content);
          if (!url) return '';
          let title = '';
          try { title = JSON.parse(part.content).title || ''; } catch { /* ok */ }
          return `<div style="margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;page-break-inside:avoid;">
            ${title ? `<p style="font-size:12px;font-weight:600;color:#334155;padding:12px 16px 0;margin:0;">${title}</p>` : ''}
            <img src="${url}" alt="${title || 'Chart'}" style="width:100%;display:block;" />
          </div>`;
        }
        return `<div style="font-family:Arial,sans-serif;font-size:13px;color:#334155;line-height:1.75;">${renderMarkdown(injectCallouts(part.content))}</div>`;
      }).join('');

      const confBg    = confidence?.level === 'high' ? '#ecfdf5' : confidence?.level === 'medium' ? '#fffbeb' : '#f1f5f9';
      const confColor = confidence?.level === 'high' ? '#047857' : confidence?.level === 'medium' ? '#b45309' : '#64748b';
      const confBorder= confidence?.level === 'high' ? '#a7f3d0' : confidence?.level === 'medium' ? '#fde68a' : '#e2e8f0';
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const printWindow = window.open('', '_blank');
      if (!printWindow) { setDownloadingId(null); return; }

      printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(wfName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color: #111827; margin: 0 auto; padding: 32px 40px; background: white; max-width: 750px; }
    h1, h2, h3 { page-break-after: avoid; }
    table { page-break-inside: avoid; width: 100%; border-collapse: collapse; }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }
    img { max-width: 100% !important; page-break-inside: avoid; }
    div[style*="border-left"] { page-break-inside: avoid; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #e2e8f0;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
      <div>
        <h1 style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 4px;">${esc(wfName)}</h1>
        <p style="font-size:12px;color:rgba(26,26,46,0.5);margin:0;">${runDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · ${runDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        ${wf?.category ? `<span style="font-size:11px;padding:4px 10px;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:9999px;font-weight:500;">${esc(getWorkflowCategoryLabel(wf.category))}</span>` : ''}
        ${confidence ? `<span style="font-size:11px;padding:4px 10px;background:${confBg};color:${confColor};border:1px solid ${confBorder};border-radius:9999px;font-weight:500;">${confidence.score}% confidence</span>` : ''}
        <span style="font-size:11px;padding:4px 10px;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:9999px;font-weight:500;">Run complete</span>
      </div>
    </div>
  </div>
  ${bodyHtml}
</body>
</html>`);

      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 500);
      posthog.capture('report_downloaded', { run_id: run.id });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark">
      <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Hoursback" className="h-[36px] w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/workflows/new" className="hidden sm:flex text-sm font-medium text-brand-dark/60 hover:text-brand-dark transition-colors px-3 py-1.5">
              Browse
            </Link>
            <Link to="/workflows" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand-dark/60 hover:text-brand-dark transition-colors px-3 py-1.5">
              <Bot className="w-4 h-4" />
              Workflows
            </Link>
            <Link to="/reports" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#DA7756] bg-[#DA7756]/10 px-3 py-1.5 rounded-full">
              <FileText className="w-4 h-4" />
              Reports
            </Link>
            <Link to="/account" title="Account">
              <UserAvatar user={user} size="sm" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl pb-24 md:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Reports</h1>
            <p className="text-brand-dark/60">All AI-generated outputs from your workflows.</p>
          </div>
          {workflows.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="all">All workflows</option>
                {workflows.map(w => <option key={w.id} value={w.id}>{getWorkflowDisplayName(w)}</option>)}
              </select>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-brand-dark/10">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No reports yet</h3>
            <p className="text-brand-dark/60 mb-6">Reports appear here after your workflows run.</p>
            <Link to="/workflows">
              <button className="bg-brand-dark text-white px-5 py-2 rounded-full text-sm font-medium">
                Go to Workflows
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((run, idx) => {
              const wf = workflows.find(w => w.id === run.workflow_id);
              const isSuccess = run.status === 'success';
              const isExpanded = expandedId === run.id;
              const runDate = new Date(run.created_at);

              // Confidence scoring
              const confidence = isSuccess && run.generated_output
                ? computeConfidence(run.generated_output) : null;

              // Comparative baseline: find previous run for same workflow
              const prevRun = filtered.slice(idx + 1).find(r => r.workflow_id === run.workflow_id && r.status === 'success');
              const currentWords = run.generated_output ? run.generated_output.split(/\s+/).length : 0;
              const prevWords = prevRun?.generated_output ? prevRun.generated_output.split(/\s+/).length : 0;
              const wordDelta = prevRun ? currentWords - prevWords : null;
              const wordDeltaPct = prevWords > 0 && wordDelta !== null ? Math.round((wordDelta / prevWords) * 100) : null;

              return (
                <div key={run.id} className="bg-white rounded-2xl border border-brand-dark/10 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : run.id)}
                    className="w-full p-5 text-left hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 shrink-0 ${isSuccess ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">{getWorkflowDisplayName(wf)}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {wf && (
                              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200 font-medium">
                                {getWorkflowCategoryLabel(wf.category)}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-brand-dark/40">
                              <Clock className="w-3 h-3" />
                              {runDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {runDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {/* Confidence badge */}
                            {confidence && (
                              <span
                                title={confidence.reason}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                  confidence.level === 'high' ? 'bg-emerald-50 text-emerald-700' :
                                  confidence.level === 'medium' ? 'bg-amber-50 text-amber-700' :
                                  'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {confidence.level === 'high' ? <CheckCircle2 className="w-2.5 h-2.5" /> :
                                 confidence.level === 'medium' ? <Minus className="w-2.5 h-2.5" /> :
                                 <AlertCircle className="w-2.5 h-2.5" />}
                                {confidence.score}% confidence
                              </span>
                            )}

                            {/* Comparative baseline vs previous run */}
                            {wordDeltaPct !== null && Math.abs(wordDeltaPct) >= 10 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                wordDeltaPct > 0 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                              }`}>
                                {wordDeltaPct > 0
                                  ? <TrendingUp className="w-2.5 h-2.5" />
                                  : <TrendingDown className="w-2.5 h-2.5" />}
                                {wordDeltaPct > 0 ? '+' : ''}{wordDeltaPct}% vs prev
                              </span>
                            )}

                            {/* Feedback badge in header */}
                            {run.feedback && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                run.feedback === 'helpful' ? 'bg-emerald-50 text-emerald-600' :
                                run.feedback === 'not_helpful' ? 'bg-red-50 text-red-600' :
                                'bg-amber-50 text-amber-600'
                              }`}>
                                {run.feedback === 'helpful' ? 'Helpful' : run.feedback === 'not_helpful' ? 'Not helpful' : 'Too vague'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 mt-1">
                        {isExpanded ? 'Collapse' : 'Read report'}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 px-6 py-5">
                      {isSuccess && run.generated_output ? (
                        <>
                          <div className="bg-white p-2">
                            {/* Report header */}
                            <div className="mb-6 pb-5 border-b border-slate-100">
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                  <h2 className="text-xl font-bold text-brand-dark leading-tight">
                                    {wf ? getWorkflowDisplayName(wf) : 'Report'}
                                  </h2>
                                  <p className="text-sm text-brand-dark/50 mt-1">
                                    {runDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    {' · '}
                                    {runDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {wf?.category && (
                                    <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-medium border border-slate-200">
                                      {wf.category}
                                    </span>
                                  )}
                                  {confidence && (
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                                      confidence.level === 'high'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      confidence.level === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                      'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                      {confidence.score}% confidence
                                    </span>
                                  )}
                                  <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
                                    Run complete
                                  </span>
                                </div>
                              </div>
                            </div>
                            <ReportRenderer output={run.generated_output} />
                          </div>

                          {/* Feedback + Download row */}
                          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-medium">Was this report useful?</span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => submitFeedback(run.id, 'helpful')}
                                  disabled={!!submittingFeedback || run.feedback === 'helpful'}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                    run.feedback === 'helpful'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50'
                                  } disabled:opacity-50`}
                                >
                                  <ThumbsUp className="w-3 h-3" /> Helpful
                                </button>
                                <button
                                  onClick={() => submitFeedback(run.id, 'too_vague')}
                                  disabled={!!submittingFeedback || run.feedback === 'too_vague'}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                    run.feedback === 'too_vague'
                                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                                      : 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'
                                  } disabled:opacity-50`}
                                >
                                  <AlertCircle className="w-3 h-3" /> Too vague
                                </button>
                                <button
                                  onClick={() => submitFeedback(run.id, 'not_helpful')}
                                  disabled={!!submittingFeedback || run.feedback === 'not_helpful'}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                    run.feedback === 'not_helpful'
                                      ? 'bg-red-50 border-red-200 text-red-700'
                                      : 'border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50'
                                  } disabled:opacity-50`}
                                >
                                  <ThumbsDown className="w-3 h-3" /> Not helpful
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => downloadPdf(run, wf)}
                              disabled={downloadingId === run.id}
                              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50 shrink-0"
                            >
                              <Download className="w-4 h-4" />
                              {downloadingId === run.id ? 'Generating PDF...' : 'Download PDF'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-red-600 bg-red-50 rounded-xl p-4 border border-red-100">
                          <strong>Run failed:</strong> {run.error_message || 'Unknown error'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
