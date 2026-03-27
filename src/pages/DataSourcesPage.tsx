import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  ChevronLeft, Plus, Database, CheckCircle2, XCircle,
  Pencil, Trash2, RefreshCw, ExternalLink, Building2, User, X, Loader2
} from 'lucide-react';
import { MobileNav } from '../components/MobileNav';

// ── Types ────────────────────────────────────────────────────────────────────

interface DataSource {
  id: string;
  scope: 'workspace' | 'staff';
  staff_chat_id: number | null;
  staff_name: string | null;
  label: string;
  url: string;
  workflow_slot: string;
  verified: boolean;
  verified_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface StaffMember {
  chat_id: number;
  first_name: string;
  username: string | null;
  role: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const WORKFLOW_SLOTS = [
  { slot: 'reconcile:data',        emoji: '💰', workflow: 'Cash Reconciliation', name: 'Cash Log',              hint: 'Daily running log — opening balance, sales, expenses, closing balance' },
  { slot: 'handover:data',         emoji: '📋', workflow: 'Shift Handover',      name: 'Shift Log',             hint: 'Running shift log — completed tasks, in-progress, issues' },
  { slot: 'audit:system_records',  emoji: '🔍', workflow: 'Inventory Audit',     name: 'System Records',        hint: 'Stock quantities from your inventory system' },
  { slot: 'audit:physical_count',  emoji: '🔍', workflow: 'Inventory Audit',     name: 'Physical Count Sheet',  hint: 'Physical count data from your stock count' },
  { slot: 'restock:inventory',     emoji: '📦', workflow: 'Supplier Outreach',   name: 'Inventory Sheet',       hint: 'Current stock levels showing low-stock items' },
  { slot: 'restock:suppliers',     emoji: '📦', workflow: 'Supplier Outreach',   name: 'Supplier Contacts',     hint: 'Supplier names, contacts, items they supply' },
  { slot: 'sop:task_log',          emoji: '✅', workflow: 'SOP Compliance',      name: 'Task Completion Log',   hint: 'Completed tasks with staff names and timestamps' },
  { slot: 'sop:sop_checklist',     emoji: '✅', workflow: 'SOP Compliance',      name: 'SOP Checklist',         hint: 'Standard operating procedure steps' },
  { slot: 'escalate:contacts',     emoji: '🚨', workflow: 'Escalation Router',   name: 'Escalation Contacts',   hint: 'Tier 1 / 2 / 3 contacts with names and numbers' },
  { slot: 'assign:team_roster',    emoji: '👥', workflow: 'Task Assignment',     name: 'Team Roster',           hint: 'Team members with roles and responsibilities' },
];

function slotMeta(slot: string) {
  return WORKFLOW_SLOTS.find(s => s.slot === slot) ?? { emoji: '📄', workflow: slot, name: slot, hint: '' };
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

// ── Main component ───────────────────────────────────────────────────────────

export default function DataSourcesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DataSource | null>(null);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    load();
  }, [user, navigate]);

  async function load() {
    const [{ data: s }, { data: st }] = await Promise.all([
      supabase.from('data_sources').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('telegram_connections').select('chat_id, first_name, username, role').eq('user_id', user!.id),
    ]);
    if (s) setSources(s);
    if (st) setStaff(st as StaffMember[]);
    setLoading(false);
  }

  async function handleVerify(source: DataSource) {
    setVerifyingId(source.id);
    try {
      const res = await supabase.functions.invoke('verify-data-source', {
        body: { url: source.url, source_id: source.id },
      });
      if (res.data?.ok) {
        setSources(prev => prev.map(s => s.id === source.id
          ? { ...s, verified: true, verified_at: new Date().toISOString() }
          : s
        ));
        const msg = res.data.rowCount != null
          ? `Connected — ${res.data.rowCount} rows found`
          : 'Connected successfully';
        toast.success(msg);
      } else {
        toast.error(res.data?.error || 'Could not reach that URL');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await supabase.from('data_sources').delete().eq('id', id);
    setSources(prev => prev.filter(s => s.id !== id));
    setDeletingId(null);
    toast.success('Data source removed');
  }

  const workspaceSources = sources.filter(s => s.scope === 'workspace');
  const staffSources = sources.filter(s => s.scope === 'staff');

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/settings" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-blue" />
              <h1 className="text-base font-semibold text-brand-dark">Data Sources</h1>
            </div>
          </div>
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-dark text-white text-sm font-semibold rounded-xl hover:bg-brand-dark/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Source
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* Explainer */}
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-sky-900 mb-1">How this works</p>
          <p className="text-sm text-sky-800 leading-relaxed">
            Register your team's Google Sheets and documents once. When staff run Telegram commands like{' '}
            <span className="font-mono text-sky-700">/reconcile</span> or <span className="font-mono text-sky-700">/audit</span>,
            the bot fetches data from the right sheet automatically — no URL needed every time.
          </p>
          <p className="text-sm text-sky-700 mt-2">
            <strong>Workspace sources</strong> apply to everyone. <strong>Staff sources</strong> override workspace for that specific person — useful when each cashier has their own daily sheet.
          </p>
        </div>

        {/* Workspace sources */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Workspace Sources</h2>
            <span className="text-xs text-slate-400">({workspaceSources.length})</span>
          </div>

          {workspaceSources.length === 0 ? (
            <EmptySlate
              label="No workspace sources yet"
              sub="Add your business's shared sheets — inventory, SOP docs, escalation contacts."
              onAdd={() => { setEditing(null); setShowModal(true); }}
            />
          ) : (
            <div className="space-y-2">
              {workspaceSources.map(source => (
                <SourceCard
                  key={source.id}
                  source={source}
                  onVerify={handleVerify}
                  onEdit={s => { setEditing(s); setShowModal(true); }}
                  onDelete={handleDelete}
                  verifyingId={verifyingId}
                  deletingId={deletingId}
                />
              ))}
            </div>
          )}
        </section>

        {/* Staff sources */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Staff Sources</h2>
            <span className="text-xs text-slate-400">({staffSources.length})</span>
          </div>
          <p className="text-xs text-slate-400 -mt-1">
            Personal sheets that override workspace sources for a specific staff member.
            {staff.length === 0 && ' Connect your Telegram bot first to see your team here.'}
          </p>

          {staffSources.length === 0 ? (
            <EmptySlate
              label="No staff sources yet"
              sub={staff.length > 0 ? "Add personal sheets for staff who keep their own daily logs." : "Connect your Telegram bot first so staff can be linked here."}
              onAdd={staff.length > 0 ? () => { setEditing(null); setShowModal(true); } : undefined}
            />
          ) : (
            <div className="space-y-2">
              {staffSources.map(source => (
                <SourceCard
                  key={source.id}
                  source={source}
                  onVerify={handleVerify}
                  onEdit={s => { setEditing(s); setShowModal(true); }}
                  onDelete={handleDelete}
                  verifyingId={verifyingId}
                  deletingId={deletingId}
                />
              ))}
            </div>
          )}
        </section>

        {/* Workflow coverage overview */}
        {sources.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Coverage</h2>
            <div className="bg-white rounded-2xl border border-brand-dark/10 overflow-hidden">
              {WORKFLOW_SLOTS.map((ws, i) => {
                const covered = sources.filter(s => s.workflow_slot === ws.slot);
                const hasCoverage = covered.length > 0;
                return (
                  <div key={ws.slot} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{ws.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-brand-dark truncate">{ws.workflow}</p>
                        <p className="text-xs text-slate-400 truncate">{ws.name}</p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      {hasCoverage ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs text-emerald-600 font-medium">{covered.length} source{covered.length > 1 ? 's' : ''}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                          <span className="text-xs text-slate-400">Not set</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <MobileNav />

      {/* Add / Edit modal */}
      {showModal && (
        <SourceModal
          editing={editing}
          staff={staff}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={async () => { setShowModal(false); setEditing(null); await load(); }}
          userId={user!.id}
        />
      )}
    </div>
  );
}

// ── Source Card ───────────────────────────────────────────────────────────────

function SourceCard({ source, onVerify, onEdit, onDelete, verifyingId, deletingId }: {
  source: DataSource;
  onVerify: (s: DataSource) => void;
  onEdit: (s: DataSource) => void;
  onDelete: (id: string) => void;
  verifyingId: string | null;
  deletingId: string | null;
}) {
  const meta = slotMeta(source.workflow_slot);
  const isVerifying = verifyingId === source.id;
  const isDeleting = deletingId === source.id;

  const shortUrl = source.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/edit.*$/, '').substring(0, 50);

  return (
    <div className="bg-white rounded-2xl border border-brand-dark/10 p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-brand-dark">{source.label}</p>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border bg-slate-50 text-slate-500 border-slate-200">
              {meta.workflow} · {meta.name}
            </span>
            {source.scope === 'staff' && source.staff_name && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border bg-purple-50 text-purple-600 border-purple-200 flex items-center gap-1">
                <User className="w-2.5 h-2.5" /> {source.staff_name}
              </span>
            )}
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 mt-1 text-xs text-brand-blue hover:underline font-mono truncate"
          >
            {shortUrl}…
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {source.verified ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified {source.verified_at ? timeAgo(source.verified_at) : ''}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <XCircle className="w-3.5 h-3.5" />
                Not verified
              </span>
            )}
            {source.last_used_at && (
              <span className="text-xs text-slate-400">Used {timeAgo(source.last_used_at)}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <button
            onClick={() => onVerify(source)}
            disabled={isVerifying}
            title="Verify connection"
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onEdit(source)}
            title="Edit"
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-dark hover:bg-slate-100 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(source.id)}
            disabled={isDeleting}
            title="Delete"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptySlate({ label, sub, onAdd }: { label: string; sub: string; onAdd?: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
      <Database className="w-7 h-7 text-slate-200 mx-auto mb-2" />
      <p className="text-sm font-medium text-brand-dark/60 mb-0.5">{label}</p>
      <p className="text-xs text-slate-400 mb-3">{sub}</p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="text-sm font-semibold text-brand-blue hover:underline"
        >
          + Add source
        </button>
      )}
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

function SourceModal({ editing, staff, onClose, onSaved, userId }: {
  editing: DataSource | null;
  staff: StaffMember[];
  onClose: () => void;
  onSaved: () => void;
  userId: string;
}) {
  const [label, setLabel] = useState(editing?.label ?? '');
  const [url, setUrl] = useState(editing?.url ?? '');
  const [workflowSlot, setWorkflowSlot] = useState(editing?.workflow_slot ?? '');
  const [scope, setScope] = useState<'workspace' | 'staff'>(editing?.scope ?? 'workspace');
  const [staffChatId, setStaffChatId] = useState<string>(editing?.staff_chat_id?.toString() ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; preview?: string; rowCount?: number | null; error?: string } | null>(null);

  const selectedStaff = staff.find(s => s.chat_id.toString() === staffChatId);

  async function handleVerify() {
    if (!url) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const res = await supabase.functions.invoke('verify-data-source', { body: { url } });
      setVerifyResult(res.data ?? { ok: false, error: 'No response' });
    } catch {
      setVerifyResult({ ok: false, error: 'Verification failed' });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleSave() {
    if (!label.trim() || !url.trim() || !workflowSlot) {
      toast.error('Please fill in all fields');
      return;
    }
    if (scope === 'staff' && !staffChatId) {
      toast.error('Please select a staff member');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        user_id: userId,
        label: label.trim(),
        url: url.trim(),
        workflow_slot: workflowSlot,
        scope,
        staff_chat_id: scope === 'staff' ? Number(staffChatId) : null,
        staff_name: scope === 'staff' ? (selectedStaff?.first_name ?? null) : null,
        verified: verifyResult?.ok ?? editing?.verified ?? false,
        verified_at: verifyResult?.ok ? new Date().toISOString() : (editing?.verified_at ?? null),
      };

      if (editing) {
        const { error } = await supabase.from('data_sources').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Data source updated');
      } else {
        const { error } = await supabase.from('data_sources').insert(payload);
        if (error) throw error;
        toast.success('Data source added');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  const _meta = workflowSlot ? slotMeta(workflowSlot) : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-brand-dark">{editing ? 'Edit Data Source' : 'Add Data Source'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Label */}
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Name</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder='e.g. "Daily Cash Log" or "Inventory Master Sheet"'
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>

          {/* URL + Verify */}
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Google Sheets or Document URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setVerifyResult(null); }}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={!url || isVerifying}
                className="shrink-0 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-brand-dark hover:bg-slate-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Test
              </button>
            </div>
            {/* Verify result */}
            {verifyResult && (
              <div className={`mt-2 rounded-xl p-3 text-xs ${verifyResult.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                {verifyResult.ok ? (
                  <div className="text-emerald-700">
                    <span className="font-semibold flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                      {verifyResult.rowCount != null && ` — ${verifyResult.rowCount} data rows found`}
                    </span>
                    {verifyResult.preview && (
                      <pre className="font-mono text-emerald-600 whitespace-pre-wrap text-[11px] opacity-80 mt-1 line-clamp-3">{verifyResult.preview}</pre>
                    )}
                  </div>
                ) : (
                  <span className="text-red-700 flex items-start gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {verifyResult.error}
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-1.5">Sheet must be set to <em>"Anyone with the link can view"</em></p>
          </div>

          {/* Workflow slot */}
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">What is this sheet for?</label>
            <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {WORKFLOW_SLOTS.map(ws => (
                <label
                  key={ws.slot}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    workflowSlot === ws.slot
                      ? 'border-brand-blue bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="workflow_slot"
                    value={ws.slot}
                    checked={workflowSlot === ws.slot}
                    onChange={() => setWorkflowSlot(ws.slot)}
                    className="mt-0.5 accent-brand-blue"
                  />
                  <div>
                    <p className="text-sm font-medium text-brand-dark">
                      <span className="mr-1">{ws.emoji}</span>
                      {ws.workflow} — {ws.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{ws.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">Who is this for?</label>
            <div className="flex gap-2">
              <label className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                scope === 'workspace' ? 'border-brand-blue bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input type="radio" name="scope" checked={scope === 'workspace'} onChange={() => setScope('workspace')} className="accent-brand-blue" />
                <div>
                  <p className="text-sm font-medium text-brand-dark flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />All staff</p>
                  <p className="text-xs text-slate-400">Workspace default</p>
                </div>
              </label>
              <label className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                scope === 'staff' ? 'border-brand-blue bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input type="radio" name="scope" checked={scope === 'staff'} onChange={() => setScope('staff')} className="accent-brand-blue" />
                <div>
                  <p className="text-sm font-medium text-brand-dark flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Specific person</p>
                  <p className="text-xs text-slate-400">Overrides workspace</p>
                </div>
              </label>
            </div>

            {scope === 'staff' && (
              <div className="mt-2">
                {staff.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    No staff connected yet. Staff need to join via the Telegram bot invite link first.
                  </p>
                ) : (
                  <select
                    value={staffChatId}
                    onChange={e => setStaffChatId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                  >
                    <option value="">Select staff member…</option>
                    {staff.map(s => (
                      <option key={s.chat_id} value={s.chat_id.toString()}>
                        {s.first_name}{s.username ? ` (@${s.username})` : ''} — {s.role}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-brand-dark hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !label || !url || !workflowSlot || (scope === 'staff' && !staffChatId)}
            className="flex-2 flex-1 py-3 bg-brand-dark text-white rounded-2xl text-sm font-semibold hover:bg-brand-dark/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {editing ? 'Save changes' : 'Add data source'}
          </button>
        </div>
      </div>
    </div>
  );
}
