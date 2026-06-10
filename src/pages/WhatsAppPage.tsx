import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, Copy, ExternalLink, Loader2, Lock, MessageCircle, Trash2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MobileNav } from '../components/MobileNav';
import { track } from '../lib/analytics';
import { ProUpgradeButton } from '../components/ProUpgradeButton';

interface KapsoConnection {
  id: string;
  status: string;
  connection_type?: 'internal' | 'customer';
  setup_link_url: string | null;
  setup_link_expires_at: string | null;
  phone_number_id: string | null;
  phone_number: string | null;
  display_name: string | null;
  customer_menu: string | null;
  payment_instructions: string | null;
  owner_notification_number: string | null;
  business_type: string | null;
  operating_hours: string | null;
  fulfillment_rules: string | null;
  escalation_instructions: string | null;
  last_webhook_at: string | null;
  webhook_secret_set: boolean;
  kapso_webhook_id?: string | null;
  kapso_webhook_url?: string | null;
  kapso_webhook_registered_at?: string | null;
  kapso_webhook_error?: string | null;
}

interface KapsoStatus {
  connected: boolean;
  api_configured: boolean;
  webhook_secret_configured: boolean;
  connection: KapsoConnection | null;
  connections?: KapsoConnection[];
}

const internalCapabilities = [
  {
    title: 'Log sales',
    body: 'Staff can send plain sales updates and Hoursback structures them into the Sales Log.',
    example: 'Sold 3 gowns and 2 fittings. Transfer ₦42,000',
  },
  {
    title: 'Log expenses and notes',
    body: 'Operational updates can become expense or note entries without opening the dashboard.',
    example: 'Spent ₦7,500 on delivery fuel',
  },
  {
    title: 'Ask for today’s summary',
    body: 'Owners can ask for sales, expenses, entry count, top item, and closeout status.',
    example: 'How much did we sell today?',
  },
  {
    title: 'Get profit and loss',
    body: 'Owners can get revenue, expenses, estimated profit, and closeout variance from WhatsApp.',
    example: 'Profit and loss',
  },
  {
    title: 'Generate full reports',
    body: 'Managers can turn connected Sheets, Sales Log, manual entries, and verified customer orders into a saved report from WhatsApp.',
    example: 'Send this week’s P&L report to my email',
  },
  {
    title: 'Get a 5-liner',
    body: 'Owners can request a compact five-line snapshot for quick decisions.',
    example: 'Send me a 5-liner',
  },
  {
    title: 'Run end-of-day closeout',
    body: 'Staff can submit cash, POS, transfer, and expenses totals so Hoursback compares collected cash against logged sales.',
    example: 'Closeout: cash 39000, POS 12000, transfer 34000, expenses 7500',
  },
  {
    title: 'Request reports and workflows',
    body: 'Owners can ask for recurring summaries such as weekly profit and loss by WhatsApp, email, or PDF.',
    example: 'Send weekly profit and loss as PDF to my email and WhatsApp',
  },
  {
    title: 'Route customer work separately',
    body: 'Keep staff operations on the internal number and customer orders, bookings, and service requests on the customer-facing number.',
    example: 'Use customer mode for catalogue questions, requests, receipts, and payment verification',
  },
];

const customerCapabilities = [
  {
    title: 'Answer catalogue and service questions',
    body: 'Customers can ask for the catalogue, price list, services, or whether an item is available.',
    example: 'Do you have size 42 black sandals?',
  },
  {
    title: 'Take orders and requests',
    body: 'Hoursback captures items or services, quantities, pickup, delivery, appointment, or job details.',
    example: 'I want 2 black sandals delivered to Lekki',
  },
  {
    title: 'Request payment proof',
    body: 'The assistant sends saved payment instructions and asks the customer to send a receipt screenshot.',
    example: 'Customer sends transfer screenshot',
  },
  {
    title: 'Store receipts for review',
    body: 'Receipt images are saved to Hoursback so the owner can confirm payment in Orders.',
    example: 'Customer sends transfer screenshot',
  },
];

export default function WhatsAppPage() {
  const { user, isPro } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<KapsoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('WhatsApp');
  const [customerMenu, setCustomerMenu] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [ownerNotificationNumber, setOwnerNotificationNumber] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [fulfillmentRules, setFulfillmentRules] = useState('');
  const [escalationInstructions, setEscalationInstructions] = useState('');
  const [connectionType, setConnectionType] = useState<'internal' | 'customer'>(searchParams.get('mode') === 'customer' ? 'customer' : 'internal');
  const [showAdvancedSetup, setShowAdvancedSetup] = useState(false);

  const webhookUrl = useMemo(() => {
    if (!user) return '';
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kapso-webhook?uid=${user.id}&mode=${connectionType}`;
  }, [user, connectionType]);

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
      const selected = (data?.connections || []).find((item: KapsoConnection) => item.connection_type === connectionType);
      setPhoneNumberId(selected?.phone_number_id || '');
      setPhoneNumber(selected?.phone_number || '');
      setDisplayName(selected?.display_name || (connectionType === 'customer' ? 'Customer Requests' : 'Internal Operations'));
      setCustomerMenu(selected?.customer_menu || '');
      setPaymentInstructions(selected?.payment_instructions || '');
      setOwnerNotificationNumber(selected?.owner_notification_number || '');
      setBusinessType(selected?.business_type || '');
      setOperatingHours(selected?.operating_hours || '');
      setFulfillmentRules(selected?.fulfillment_rules || '');
      setEscalationInstructions(selected?.escalation_instructions || '');
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
      body: {
        action: 'generate_setup_link',
        connection_type: connectionType,
        app_origin: window.location.origin,
      },
    });
    setSaving(false);

    if (error) {
      toast.error(error.message || 'Could not start WhatsApp setup');
      return;
    }
    mergeSavedConnection(data.connection);
    track('whatsapp_setup_link_created', { connection_type: connectionType });
    toast.success('WhatsApp setup started');
  };

  const mergeSavedConnection = (connection: KapsoConnection) => {
    setStatus((prev) => {
      const nextConnections = [
        ...(prev?.connections || []).filter((item) => item.connection_type !== connection.connection_type),
        connection,
      ];
      return {
        connected: nextConnections.some((item) => !!item.phone_number_id),
        api_configured: prev?.api_configured ?? false,
        webhook_secret_configured: prev?.webhook_secret_configured ?? false,
        connection: nextConnections.find((item) => item.connection_type === 'internal') || nextConnections[0] || null,
        connections: nextConnections,
      };
    });
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
        customer_menu: customerMenu.trim(),
        payment_instructions: paymentInstructions.trim(),
        owner_notification_number: ownerNotificationNumber.trim(),
        business_type: businessType.trim(),
        operating_hours: operatingHours.trim(),
        fulfillment_rules: fulfillmentRules.trim(),
        escalation_instructions: escalationInstructions.trim(),
      },
    });
    setSaving(false);

    if (error) {
      toast.error(error.message || 'Could not save WhatsApp connection');
      return;
    }
    mergeSavedConnection(data.connection);
    track('whatsapp_connection_saved', {
      connection_type: connectionType,
      has_customer_menu: !!customerMenu.trim(),
      has_payment_instructions: !!paymentInstructions.trim(),
      has_fulfillment_rules: !!fulfillmentRules.trim(),
    });
    toast.success('WhatsApp connection saved');
  };

  const retryRouting = async () => {
    if (!selectedConnection?.phone_number_id) {
      toast.error('Connect a WhatsApp number before registering routing');
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke('kapso-setup', {
      body: {
        action: 'register_webhook',
        connection_type: connectionType,
      },
    });
    setSaving(false);

    if (error) {
      toast.error(error.message || 'Could not register message routing');
      void loadStatus();
      return;
    }

    mergeSavedConnection(data.connection);
    track('whatsapp_webhook_registration_retried', { connection_type: connectionType });
    toast.success('Message routing is active');
  };

  const saveCustomerSettings = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('kapso-setup', {
      body: {
        action: 'customer_settings',
        customer_menu: customerMenu.trim(),
        payment_instructions: paymentInstructions.trim(),
        owner_notification_number: ownerNotificationNumber.trim(),
        business_type: businessType.trim(),
        operating_hours: operatingHours.trim(),
        fulfillment_rules: fulfillmentRules.trim(),
        escalation_instructions: escalationInstructions.trim(),
      },
    });
    setSaving(false);

    if (error) {
      toast.error(error.message || 'Could not save customer reply settings');
      return;
    }
    mergeSavedConnection(data.connection);
    track('whatsapp_customer_settings_saved', {
      has_customer_menu: !!customerMenu.trim(),
      has_payment_instructions: !!paymentInstructions.trim(),
      has_fulfillment_rules: !!fulfillmentRules.trim(),
      has_owner_notification_number: !!ownerNotificationNumber.trim(),
    });
    toast.success('Customer reply settings saved');
  };

  const disconnect = async () => {
    if (!confirm(`Disconnect ${connectionType === 'customer' ? 'customer requests' : 'internal operations'} WhatsApp from this workspace?`)) return;
    setSaving(true);
    const { error } = await supabase.functions.invoke('kapso-setup', {
      body: { action: 'disconnect', connection_type: connectionType },
    });
    setSaving(false);
    if (error) {
      toast.error(error.message || 'Could not disconnect WhatsApp');
    } else {
      const nextConnections = (status?.connections || []).filter((item) => item.connection_type !== connectionType);
      setStatus((prev) => ({
        connected: nextConnections.some((item) => !!item.phone_number_id),
        api_configured: prev?.api_configured ?? false,
        webhook_secret_configured: prev?.webhook_secret_configured ?? false,
        connection: nextConnections.find((item) => item.connection_type === 'internal') || nextConnections[0] || null,
        connections: nextConnections,
      }));
      setPhoneNumberId('');
      setPhoneNumber('');
      setCustomerMenu('');
      setPaymentInstructions('');
      setOwnerNotificationNumber('');
      setBusinessType('');
      setOperatingHours('');
      setFulfillmentRules('');
      setEscalationInstructions('');
      toast.success('WhatsApp disconnected');
    }
  };

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied');
  };

  const selectConnectionType = (type: 'internal' | 'customer') => {
    setConnectionType(type);
    setSearchParams({ mode: type });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const selectedConnection = status?.connections?.find((item) => item.connection_type === connectionType) || null;
  const customerModeLocked = connectionType === 'customer' && !isPro;
  const activeCapabilities = connectionType === 'internal' ? internalCapabilities : customerCapabilities;
  const webhookActive = !!selectedConnection?.kapso_webhook_registered_at || selectedConnection?.status === 'webhook_active';
  const customerReadyChecks = [
    {
      title: 'Customer number connected',
      done: !!selectedConnection?.phone_number_id,
      body: 'Your customer-facing WhatsApp number is connected to this workspace.',
    },
    {
      title: 'Message routing active',
      done: webhookActive,
      body: 'Hoursback can receive messages from this number automatically.',
    },
    {
      title: 'Catalogue or service list saved',
      done: !!customerMenu.trim(),
      body: 'Customers can ask what you sell, what services you offer, prices, and availability.',
    },
    {
      title: 'Payment instructions saved',
      done: !!paymentInstructions.trim(),
      body: 'Confirmed requests can receive bank/payment details and receipt instructions.',
    },
    {
      title: 'Fulfillment rules saved',
      done: !!fulfillmentRules.trim(),
      body: 'Pickup, delivery, service fees, cash-on-pickup, timelines, and handoff rules are clear.',
    },
    {
      title: 'Test message received',
      done: !!selectedConnection?.last_webhook_at,
      body: 'Send a menu question, request, paid message, and receipt from a real phone before launch.',
    },
  ];
  const customerReadyCount = customerReadyChecks.filter((item) => item.done).length;

  return (
    <div className="min-h-screen bg-brand-light pb-24">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/capture" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <h1 className="text-base font-semibold text-brand-dark">WhatsApp Capture</h1>
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
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-emerald-600 mb-3">WhatsApp connection</p>
              <h2 className="text-2xl font-bold text-brand-dark">Turn WhatsApp messages into Hoursback workflow inputs.</h2>
              <p className="mt-3 text-sm text-slate-500 max-w-2xl leading-relaxed">
                Staff can send sales updates in WhatsApp, customers can start order conversations, and owners can ask for daily summaries. Hoursback handles the message routing in the background.
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
            ['Text sales', '“Sold 3 gowns, 2 fittings. Transfer ₦42,000”'],
            ['Ask summaries', '“How much did we sell today?”'],
            ['Orders & requests', 'Capture order, booking, and service details.'],
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
            View customer requests
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
            ['customer', 'Customer requests', 'Product orders, bookings, service requests, missing-detail questions, and tracking.'],
          ].map(([type, title, body]) => {
            const saved = status?.connections?.find((item) => item.connection_type === type);
            const locked = type === 'customer' && !isPro;
            return (
              <button
                key={type}
                type="button"
                onClick={() => selectConnectionType(type as 'internal' | 'customer')}
                className={`text-left rounded-2xl border p-4 transition-colors ${
                  connectionType === type
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-brand-dark/10 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-semibold text-brand-dark">{title}</p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{body}</p>
                <p className="mt-3 text-xs font-medium text-slate-400">
                  {locked ? 'Pro required' : saved?.phone_number_id ? `Connected: ${saved.display_name || saved.phone_number || saved.phone_number_id}` : 'Not connected'}
                </p>
              </button>
            );
          })}
        </section>

        {customerModeLocked && (
          <section className="rounded-3xl border border-purple-100 bg-purple-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-purple-700">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-purple-950">Customer WhatsApp is Pro</h3>
                  <p className="mt-1 text-sm leading-relaxed text-purple-700">
                    Free users can test internal WhatsApp capture. Customer orders, bookings, AI replies, receipts, and payment verification require Pro.
                  </p>
                </div>
              </div>
              <ProUpgradeButton className="shrink-0 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700">
                Upgrade
              </ProUpgradeButton>
            </div>
          </section>
        )}

        <section className="bg-white rounded-3xl border border-brand-dark/10 p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-emerald-600 mb-2">
              {connectionType === 'internal' ? 'Internal capabilities' : 'Customer capabilities'}
            </p>
            <h3 className="text-lg font-semibold text-brand-dark">
              {connectionType === 'internal'
                ? 'What your team can do from WhatsApp'
                : 'What customers can do from WhatsApp'}
            </h3>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              {connectionType === 'internal'
                ? 'Use this number for owner and staff operations. It turns daily business messages into logs, summaries, closeouts, and workflow requests.'
                : 'Use this number for customer conversations. It handles catalogue questions, product orders, service requests, receipt collection, and owner review handoff.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {activeCapabilities.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-brand-dark">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.body}</p>
                <p className="mt-3 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-600 leading-relaxed">
                  {item.example}
                </p>
              </div>
            ))}
          </div>
        </section>

        {connectionType === 'customer' && (
          <section className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-emerald-600 mb-2">Go-live checklist</p>
                <h3 className="text-lg font-semibold text-brand-dark">Make customer WhatsApp safe to launch</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  Complete these before using the number publicly. They cover the common failure points: missing menu, missing payment details, missing fulfillment rules, and untested receipt flow.
                </p>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                {customerReadyCount}/{customerReadyChecks.length} ready
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {customerReadyChecks.map((item, index) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border p-4 ${
                    item.done ? 'border-emerald-100 bg-emerald-50/70' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className={`inline-flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold ${
                    item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 border border-slate-200'
                  }`}>
                    {item.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-brand-dark">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-brand-dark">Test messages to send from a phone you control</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  'Please send your catalogue or service list',
                  'Do you have [one item from your list]?',
                  'I want [item/service] delivered to [area] or pickup',
                  'Paid, I will send the receipt now',
                  'Send a receipt screenshot with the request reference',
                  'Cancel my request [reference]',
                  'Can I change the delivery address?',
                  'I need a refund',
                ].map((message) => (
                  <div key={message} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                    {message}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-white rounded-3xl border border-brand-dark/10 p-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-brand-dark">1. Connect {connectionType === 'customer' ? 'customer requests' : 'internal operations'} number</h3>
            <p className="mt-1 text-sm text-slate-500">
              Open the WhatsApp setup flow to connect a WhatsApp Business App number. You may need access to the Meta/Facebook account that manages that number, but you do not need to configure webhooks manually.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-950">Before you start</p>
            <p className="mt-1 text-xs leading-relaxed text-blue-700">
              Keep the business owner or admin nearby if the WhatsApp number is managed inside Meta Business. Hoursback will route messages after the number is connected.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={generateSetupLink}
              disabled={saving || !status?.api_configured || customerModeLocked}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Open WhatsApp setup
            </button>
            {!status?.api_configured && (
              <p className="text-xs text-amber-600 self-center">WhatsApp setup is not configured yet. Contact support.</p>
            )}
          </div>

          {selectedConnection?.setup_link_url && (
            <a
              href={selectedConnection.setup_link_url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Continue WhatsApp setup →
              {selectedConnection.setup_link_expires_at && (
                <span className="block mt-1 text-xs text-emerald-700/60">
                  Expires {new Date(selectedConnection.setup_link_expires_at).toLocaleString()}
                </span>
              )}
            </a>
          )}

          {selectedConnection?.phone_number_id && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700/70 mb-1">Number</p>
                <p className="text-sm font-semibold text-emerald-900">
                  {selectedConnection.phone_number || selectedConnection.phone_number_id}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700/70 mb-1">Routing</p>
                <p className="text-sm font-semibold text-emerald-900">
                  {webhookActive ? 'Active' : selectedConnection.kapso_webhook_error ? 'Needs support' : 'Pending'}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700/70 mb-1">Test message</p>
                <p className="text-sm font-semibold text-emerald-900">
                  {selectedConnection.last_webhook_at ? new Date(selectedConnection.last_webhook_at).toLocaleString() : 'Not received yet'}
                </p>
              </div>
            </div>
          )}

          {selectedConnection?.kapso_webhook_error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              Routing setup failed: {selectedConnection.kapso_webhook_error}. Use Advanced support below or retry setup.
            </div>
          )}

          {selectedConnection?.phone_number_id && !webhookActive && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-relaxed text-amber-800">
                This number is saved, but message routing is not active yet. Register routing before sending customers or staff to WhatsApp.
              </p>
              <button
                type="button"
                onClick={retryRouting}
                disabled={saving || customerModeLocked}
                className="shrink-0 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {saving ? 'Registering...' : 'Register routing'}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAdvancedSetup((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Wrench className="h-4 w-4" />
            {showAdvancedSetup ? 'Hide advanced support' : 'Advanced support'}
          </button>

          {showAdvancedSetup && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-brand-dark">Manual support setup</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Use this only when Hoursback support asks for a phone number ID or a setup callback does not include one.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
            <label className="sm:col-span-1">
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Display name</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder={connectionType === 'customer' ? 'Customer Requests' : 'Internal Operations'}
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
              <span className="block text-xs font-medium text-slate-500 mb-1.5">Phone number ID</span>
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
                disabled={saving || customerModeLocked}
                className="rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark/90 disabled:opacity-60"
              >
                Save connection
              </button>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Routing diagnostics</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                  These details are for Hoursback support. Normal users do not need to copy URLs, manage secrets, or create webhooks.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-3">
                <code className="text-xs text-slate-600 break-all flex-1">{webhookUrl}</code>
                <button onClick={copyWebhook} className="p-2 hover:bg-slate-50 rounded-lg transition-colors" title="Copy webhook URL">
                  <Copy className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <p className="text-xs text-slate-400 mb-1">Secret</p>
                  <p className="text-sm font-semibold text-brand-dark">
                    {status?.webhook_secret_configured ? 'Configured' : 'Not configured'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <p className="text-xs text-slate-400 mb-1">Routing</p>
                  <p className="text-sm font-semibold text-brand-dark">
                    {webhookActive ? 'Active' : selectedConnection?.kapso_webhook_error ? 'Failed' : 'Pending'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <p className="text-xs text-slate-400 mb-1">Last message</p>
                  <p className="text-sm font-semibold text-brand-dark">
                    {selectedConnection?.last_webhook_at ? new Date(selectedConnection.last_webhook_at).toLocaleString() : 'No messages yet'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {connectionType === 'customer' && (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <label>
                  <span className="block text-xs font-medium text-slate-500 mb-1.5">Business type</span>
                  <input
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    placeholder="e.g. Fashion retail, repair shop, salon, clinic, logistics"
                  />
                </label>
                <label>
                  <span className="block text-xs font-medium text-slate-500 mb-1.5">Operating hours</span>
                  <input
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    placeholder="e.g. Mon-Sat, 9am-6pm. Closed Sundays."
                  />
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label>
                  <span className="block text-xs font-medium text-slate-500 mb-1.5">Catalogue / service list / price list</span>
                  <textarea
                    value={customerMenu}
                    onChange={(e) => setCustomerMenu(e.target.value)}
                    rows={7}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    placeholder={'Black sandals - ₦18000\nHair styling - ₦12000\nPhone screen repair - ₦35000\nDelivery within Lekki - ₦2500'}
                  />
                </label>
                <label>
                  <span className="block text-xs font-medium text-slate-500 mb-1.5">Payment instructions</span>
                  <textarea
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    rows={7}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    placeholder={'Bank: GTBank\nAccount: 0123456789\nName: Your Business Name\nAfter transfer, send the receipt screenshot here.'}
                  />
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label>
                  <span className="block text-xs font-medium text-slate-500 mb-1.5">Fulfillment rules</span>
                  <textarea
                    value={fulfillmentRules}
                    onChange={(e) => setFulfillmentRules(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    placeholder={'Delivery within Lekki is ₦2500.\nPickup is available after payment.\nCash on pickup is allowed.\nRepairs take 24-48 hours after inspection.'}
                  />
                </label>
                <label>
                  <span className="block text-xs font-medium text-slate-500 mb-1.5">Escalation instructions</span>
                  <textarea
                    value={escalationInstructions}
                    onChange={(e) => setEscalationInstructions(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    placeholder={'If price is unclear, tell the customer staff will confirm.\nIf refund, complaint, discount, or urgent issue comes up, hand off to staff.'}
                  />
                </label>
              </div>
              <label className="block">
                <span className="block text-xs font-medium text-slate-500 mb-1.5">Owner notification WhatsApp number</span>
                <input
                  value={ownerNotificationNumber}
                  onChange={(e) => setOwnerNotificationNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  placeholder="+234..."
                />
              </label>
              <button
                onClick={saveCustomerSettings}
                disabled={saving || customerModeLocked}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
              >
                Save customer replies
              </button>
            </div>
          )}

        </section>

      </main>

      <MobileNav />
    </div>
  );
}
