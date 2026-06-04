import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, ExternalLink, Loader2, MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MobileNav } from '../components/MobileNav';

interface KapsoConnection {
  id: string;
  status: string;
  connection_type?: 'internal' | 'customer';
  setup_link_url: string | null;
  setup_link_expires_at: string | null;
  phone_number_id: string | null;
  phone_number: string | null;
  display_name: string | null;
  last_webhook_at: string | null;
  webhook_secret_set: boolean;
}

interface KapsoStatus {
  connected: boolean;
  api_configured: boolean;
  webhook_secret_configured: boolean;
  connection: KapsoConnection | null;
  connections?: KapsoConnection[];
}

export default function WhatsAppPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<KapsoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('WhatsApp');
  const [connectionType, setConnectionType] = useState<'internal' | 'customer'>('internal');

  const webhookUrl = useMemo(() => {
    if (!user) return '';
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kapso-webhook?uid=${user.id}`;
  }, [user]);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('kapso-setup', {
      body: { action: 'status' },
    });
    if (error) {
      toast.error(error.message || 'Could not load WhatsApp status');
    } else {
      setStatus(data);
      const selected = (data?.connections || []).find((item: KapsoConnection) => item.connection_type === connectionType) || data?.connection;
      setPhoneNumberId(selected?.phone_number_id || '');
      setPhoneNumber(selected?.phone_number || '');
      setDisplayName(selected?.display_name || (connectionType === 'customer' ? 'Customer Orders' : 'Internal Operations'));
    }
    setLoading(false);
  }, [user, connectionType]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStatus();
  }, [user, navigate, loadStatus]);

  const generateSetupLink = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('kapso-setup', {
      body: { action: 'generate_setup_link' },
    });
    setSaving(false);

    if (error) {
      toast.error(error.message || 'Could not create setup link');
      return;
    }
    setStatus((prev) => ({
      connected: !!data.connection?.phone_number_id,
      api_configured: prev?.api_configured ?? true,
      webhook_secret_configured: prev?.webhook_secret_configured ?? false,
      connection: data.connection,
    }));
    toast.success('WhatsApp setup link created');
  };

  const saveManualConnection = async () => {
    if (!phoneNumberId.trim()) {
      toast.error('Phone number ID is required');
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke('kapso-setup', {
      body: {
        action: 'manual_connect',
        connection_type: connectionType,
        phone_number_id: phoneNumberId.trim(),
        phone_number: phoneNumber.trim(),
        display_name: displayName.trim() || 'WhatsApp',
      },
    });
    setSaving(false);

    if (error) {
      toast.error(error.message || 'Could not save WhatsApp connection');
      return;
    }
    setStatus((prev) => ({
      connected: true,
      api_configured: prev?.api_configured ?? false,
      webhook_secret_configured: prev?.webhook_secret_configured ?? false,
      connection: data.connection,
      connections: [
        ...(prev?.connections || []).filter((item) => item.connection_type !== data.connection?.connection_type),
        data.connection,
      ],
    }));
    toast.success('WhatsApp connection saved');
  };

  const disconnect = async () => {
    if (!confirm('Disconnect WhatsApp from this workspace?')) return;
    setSaving(true);
    const { error } = await supabase.functions.invoke('kapso-setup', {
      body: { action: 'disconnect' },
    });
    setSaving(false);
    if (error) {
      toast.error(error.message || 'Could not disconnect WhatsApp');
    } else {
      setStatus((prev) => ({
        connected: false,
        api_configured: prev?.api_configured ?? false,
        webhook_secret_configured: prev?.webhook_secret_configured ?? false,
        connection: null,
      }));
      setPhoneNumberId('');
      setPhoneNumber('');
      toast.success('WhatsApp disconnected');
    }
  };

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const connection = status?.connection;
  const selectedConnection = status?.connections?.find((item) => item.connection_type === connectionType) || connection;

  return (
    <div className="min-h-screen bg-brand-light pb-24">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/workflows" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <h1 className="text-base font-semibold text-brand-dark">WhatsApp Workflows</h1>
            </div>
          </div>
          {selectedConnection?.phone_number_id && (
            <button
              onClick={disconnect}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 border border-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              Disconnect
            </button>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-3xl border border-brand-dark/10 p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-emerald-600 mb-3">Kapso integration</p>
              <h2 className="text-2xl font-bold text-brand-dark">Turn WhatsApp messages into Hoursback workflow inputs.</h2>
              <p className="mt-3 text-sm text-slate-500 max-w-2xl leading-relaxed">
                Staff can send sales updates in WhatsApp, customers can start order conversations, and owners can ask for daily summaries. Inbound messages are routed through Kapso into the existing Sales Log.
              </p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
              selectedConnection?.phone_number_id
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {selectedConnection?.phone_number_id ? 'Connected' : 'Setup needed'}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {[
            ['Text sales', '“Sold 5 jollof, 3 chicken. Transfer ₦42,000”'],
            ['Ask summaries', '“How much did we sell today?”'],
            ['Customer orders', 'Capture order details and route next actions.'],
          ].map(([title, body]) => (
            <div key={title} className="bg-white rounded-2xl border border-brand-dark/10 p-4">
              <p className="text-sm font-semibold text-brand-dark">{title}</p>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/orders"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            <MessageCircle className="w-4 h-4" />
            View customer orders
          </Link>
          <Link
            to="/data-log"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            View sales log
          </Link>
        </div>

        <section className="grid md:grid-cols-2 gap-4">
          {[
            ['internal', 'Internal operations', 'Staff sales logs, closeout, owner summaries, and workflow requests.'],
            ['customer', 'Customer orders', 'Customer orders, missing-detail questions, and order tracking.'],
          ].map(([type, title, body]) => {
            const saved = status?.connections?.find((item) => item.connection_type === type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => setConnectionType(type as 'internal' | 'customer')}
                className={`text-left rounded-2xl border p-4 transition-colors ${
                  connectionType === type
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-brand-dark/10 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-semibold text-brand-dark">{title}</p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{body}</p>
                <p className="mt-3 text-xs font-medium text-slate-400">
                  {saved?.phone_number_id ? `Connected: ${saved.display_name || saved.phone_number || saved.phone_number_id}` : 'Not connected'}
                </p>
              </button>
            );
          })}
        </section>

        <section className="bg-white rounded-3xl border border-brand-dark/10 p-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-brand-dark">1. Connect {connectionType === 'customer' ? 'customer orders' : 'internal operations'} number</h3>
            <p className="mt-1 text-sm text-slate-500">
              Use Kapso setup if `KAPSO_API_KEY` is configured, or paste a Kapso WhatsApp Business Phone Number ID manually.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={generateSetupLink}
              disabled={saving || !status?.api_configured}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Generate Kapso setup link
            </button>
            {!status?.api_configured && (
              <p className="text-xs text-amber-600 self-center">KAPSO_API_KEY is not configured in Supabase secrets.</p>
            )}
          </div>

          {selectedConnection?.setup_link_url && (
            <a
              href={selectedConnection.setup_link_url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Open Kapso setup link →
              {selectedConnection.setup_link_expires_at && (
                <span className="block mt-1 text-xs text-emerald-700/60">
                  Expires {new Date(selectedConnection.setup_link_expires_at).toLocaleString()}
                </span>
              )}
            </a>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="sm:col-span-1">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Display name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder={connectionType === 'customer' ? 'Customer Orders' : 'Internal Operations'}
              />
            </label>
            <label className="sm:col-span-1">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Phone number</span>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="+234..."
              />
            </label>
            <label className="sm:col-span-1">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Kapso phone number ID</span>
              <input
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="1234567890"
              />
            </label>
          </div>

          <button
            onClick={saveManualConnection}
            disabled={saving}
            className="rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark/90 disabled:opacity-60"
          >
            Save connection
          </button>
        </section>

        <section className="bg-white rounded-3xl border border-brand-dark/10 p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-brand-dark">2. Register this webhook in Kapso</h3>
            <p className="mt-1 text-sm text-slate-500">
              Subscribe to `whatsapp.message.received`. Set the same secret in Supabase as `KAPSO_WEBHOOK_SECRET`.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-200 p-3">
            <code className="text-xs text-slate-600 break-all flex-1">{webhookUrl}</code>
            <button onClick={copyWebhook} className="p-2 hover:bg-white rounded-lg transition-colors" title="Copy webhook URL">
              <Copy className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-400 mb-1">Webhook secret</p>
              <p className="text-sm font-semibold text-brand-dark">
                {status?.webhook_secret_configured ? 'Configured' : 'Not configured'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-400 mb-1">Last webhook</p>
              <p className="text-sm font-semibold text-brand-dark">
                {selectedConnection?.last_webhook_at ? new Date(selectedConnection.last_webhook_at).toLocaleString() : 'No messages yet'}
              </p>
            </div>
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
