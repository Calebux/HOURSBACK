import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Clock, Zap, Database, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Pause, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface Watcher {
  id: string;
  name: string;
  data_source_type: string;
  data_source_config: { url?: string };
  condition_prompt: string;
  ai_prompt: string;
  action_type: string;
  schedule: string;
  status: string;
  last_run: string | null;
  last_triggered_at: string | null;
  next_run: string | null;
  created_at: string;
}

interface WatcherLog {
  id: string;
  triggered: boolean;
  summary: string | null;
  analysis_text: string | null;
  error_message: string | null;
  created_at: string;
}

function fmt(iso: string | null) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function AnalysisBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const preview = text.slice(0, 200).replace(/#+\s/g, '').replace(/\*\*/g, '');
  return (
    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 text-left flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">View AI Analysis</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {!open && (
        <p className="px-4 pb-3 text-xs text-slate-500 line-clamp-2">{preview}…</p>
      )}
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-slate-200 pt-3">
          {text}
        </div>
      )}
    </div>
  );
}

export default function WatcherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [watcher, setWatcher] = useState<Watcher | null>(null);
  const [logs, setLogs] = useState<WatcherLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    async function load() {
      setIsLoading(true);
      const [watcherRes, logsRes] = await Promise.all([
        supabase.from('watchers').select('*').eq('id', id).eq('user_id', user!.id).single(),
        supabase.from('watcher_logs').select('*').eq('watcher_id', id)
          .order('created_at', { ascending: false }).limit(30),
      ]);

      if (watcherRes.error || !watcherRes.data) {
        setNotFound(true);
      } else {
        setWatcher(watcherRes.data);
        setLogs(logsRes.data || []);
      }
      setIsLoading(false);
    }
    load();
  }, [user, id]);

  const toggleStatus = async () => {
    if (!watcher) return;
    const newStatus = watcher.status === 'active' ? 'paused' : 'active';
    setIsToggling(true);
    const { error } = await supabase.from('watchers').update({ status: newStatus }).eq('id', watcher.id);
    setIsToggling(false);
    if (error) { toast.error('Failed to update status'); return; }
    setWatcher({ ...watcher, status: newStatus });
    toast.success(`Watcher ${newStatus}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#635BFF]" />
      </div>
    );
  }

  if (notFound || !watcher) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center text-center px-4">
        <div>
          <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Watcher not found</h2>
          <p className="text-brand-dark/60 mb-6">It may have been deleted or you don't have access.</p>
          <Link to="/watchers" className="text-[#635BFF] hover:underline text-sm font-medium">Back to Watchers</Link>
        </div>
      </div>
    );
  }

  const triggeredCount = logs.filter(l => l.triggered).length;

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark">
      {/* Nav */}
      <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Hoursback" className="h-[36px] w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/playbooks" className="text-sm text-brand-dark/70 hover:text-brand-dark transition-colors">Playbooks</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back + header */}
        <button
          onClick={() => navigate('/watchers')}
          className="flex items-center gap-1.5 text-sm text-brand-dark/60 hover:text-brand-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Watchers
        </button>

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                watcher.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${watcher.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {watcher.status === 'active' ? 'Active' : 'Paused'}
              </span>
              <span className="text-xs text-brand-dark/40 uppercase tracking-wider font-semibold">
                {watcher.data_source_type.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-3xl font-bold">{watcher.name}</h1>
          </div>
          <button
            onClick={toggleStatus}
            disabled={isToggling}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all disabled:opacity-50 ${
              watcher.status === 'active'
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {watcher.status === 'active'
              ? <><Pause className="w-4 h-4" /> Pause</>
              : <><Play className="w-4 h-4" /> Resume</>
            }
          </button>
        </div>

        {/* Config cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-brand-dark/10 rounded-2xl p-5 shadow-antigravity-md">
            <h3 className="text-xs font-bold text-brand-dark/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Monitoring Rule
            </h3>
            <p className="text-sm text-brand-dark leading-relaxed">{watcher.condition_prompt}</p>
          </div>

          <div className="bg-white border border-brand-dark/10 rounded-2xl p-5 shadow-antigravity-md">
            <h3 className="text-xs font-bold text-brand-dark/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Data Source
            </h3>
            <p className="text-xs text-brand-dark/50 mb-1 font-medium uppercase tracking-wider">{watcher.data_source_type.replace('_', ' ')}</p>
            {watcher.data_source_config?.url && (
              <p className="text-xs text-brand-dark/60 font-mono break-all">{watcher.data_source_config.url}</p>
            )}
          </div>

          <div className="bg-white border border-brand-dark/10 rounded-2xl p-5 shadow-antigravity-md">
            <h3 className="text-xs font-bold text-brand-dark/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Schedule
            </h3>
            <p className="text-sm font-semibold capitalize">{watcher.schedule}</p>
            <div className="mt-2 space-y-1 text-xs text-brand-dark/50">
              <div>Last run: <span className="font-medium text-brand-dark/70">{fmt(watcher.last_run)}</span></div>
              <div>Next run: <span className="font-medium text-brand-dark/70">{fmt(watcher.next_run)}</span></div>
            </div>
          </div>

          <div className="bg-white border border-brand-dark/10 rounded-2xl p-5 shadow-antigravity-md">
            <h3 className="text-xs font-bold text-brand-dark/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-brand-dark">{logs.length}</div>
                <div className="text-xs text-brand-dark/50 mt-0.5">Total runs</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-amber-600">{triggeredCount}</div>
                <div className="text-xs text-amber-600/70 mt-0.5">Triggered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert history */}
        <div>
          <h2 className="text-lg font-bold mb-4">Alert History</h2>

          {logs.length === 0 ? (
            <div className="bg-white border border-brand-dark/10 rounded-2xl p-10 text-center shadow-antigravity-md">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-brand-dark/50 text-sm">No runs yet. The watcher will execute on its next scheduled check.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div
                  key={log.id}
                  className={`bg-white border rounded-2xl p-5 shadow-antigravity-md ${
                    log.error_message
                      ? 'border-red-200'
                      : log.triggered
                      ? 'border-amber-200'
                      : 'border-brand-dark/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                      {log.error_message ? (
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      ) : log.triggered ? (
                        <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                      <span className={`text-sm font-semibold ${
                        log.error_message ? 'text-red-600'
                        : log.triggered ? 'text-amber-700'
                        : 'text-emerald-700'
                      }`}>
                        {log.error_message ? 'Error' : log.triggered ? 'Triggered' : 'No trigger'}
                      </span>
                    </div>
                    <span className="text-xs text-brand-dark/40 shrink-0">{fmt(log.created_at)}</span>
                  </div>

                  {log.error_message && (
                    <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 font-mono">{log.error_message}</p>
                  )}

                  {log.summary && !log.error_message && (
                    <p className="mt-2 text-sm text-brand-dark/70">{log.summary}</p>
                  )}

                  {log.analysis_text && (
                    <AnalysisBlock text={log.analysis_text} />
                  )}

                  {!log.triggered && !log.error_message && !log.analysis_text && (
                    <p className="mt-1 text-xs text-brand-dark/40 italic">Condition not met — no analysis generated.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
