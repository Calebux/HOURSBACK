import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, MessageCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function firstParam(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = params.get(name);
    if (value?.trim()) return value.trim();
  }
  return '';
}

function fuzzyParam(params: URLSearchParams, requiredWords: string[], blockedWords: string[] = []) {
  for (const [key, value] of params.entries()) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const hasRequired = requiredWords.every((word) => normalizedKey.includes(word));
    const hasBlocked = blockedWords.some((word) => normalizedKey.includes(word));
    if (hasRequired && !hasBlocked && value?.trim()) return value.trim();
  }
  return '';
}

export default function WhatsAppCallbackPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Finishing WhatsApp setup...');

  const connectionType = useMemo(() => (
    params.get('mode') === 'customer' ? 'customer' : 'internal'
  ), [params]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      localStorage.setItem('hoursback_pending_whatsapp_callback', `${window.location.pathname}${window.location.search}`);
      setState('error');
      setMessage('Sign in to Hoursback to finish connecting this WhatsApp number. Your setup details are still in this return link.');
      return;
    }

    const status = params.get('status');
    if (status === 'failed' || params.get('error')) {
      setState('error');
      setMessage(params.get('error_description') || params.get('error') || 'Hoursback could not connect this WhatsApp number.');
      return;
    }

    const phoneNumberId = firstParam(params, [
      'phone_number_id',
      'phoneNumberId',
      'whatsapp_phone_number_id',
      'waba_phone_number_id',
      'phone_number[id]',
      'phone_numbers[0][id]',
      'phone_number.id',
      'phoneNumber.id',
    ]) || fuzzyParam(params, ['phone', 'id'], ['setup', 'customer', 'business']);
    const phoneNumber = firstParam(params, [
      'phone_number',
      'phoneNumber',
      'display_phone_number',
      'phone_number[number]',
      'phone_numbers[0][display_phone_number]',
      'phone_number.display_phone_number',
    ]) || fuzzyParam(params, ['phone', 'number'], ['id', 'setup']);
    const displayName = firstParam(params, [
      'display_name',
      'displayName',
      'verified_name',
      'business_name',
      'phone_number[verified_name]',
      'phone_numbers[0][verified_name]',
    ]) || fuzzyParam(params, ['verified', 'name']);
    const setupLinkId = firstParam(params, [
      'setup_link_id',
      'setupLinkId',
      'setup_link[id]',
      'setup_link.id',
    ]) || fuzzyParam(params, ['setup', 'id']);

    if (!phoneNumberId) {
      setState('error');
      setMessage('WhatsApp setup returned to Hoursback, but no phone number ID was included. Open WhatsApp setup and use Advanced support to save the phone number ID, or retry setup.');
      return;
    }

    let cancelled = false;

    async function finishSetup() {
      setState('loading');
      setMessage('Connecting the number and registering message routing...');
      const { error } = await supabase.functions.invoke('kapso-setup', {
        body: {
          action: 'finalize_setup',
          connection_type: connectionType,
          phone_number_id: phoneNumberId,
          phone_number: phoneNumber,
          display_name: displayName,
          setup_link_id: setupLinkId,
        },
      });

      if (cancelled) return;
      if (error) {
        setState('error');
        setMessage(error.message || 'WhatsApp connected, but Hoursback could not register message routing.');
        return;
      }

      setState('success');
      setMessage('WhatsApp is connected. Send a test message from a phone you control to confirm Hoursback receives it.');
      window.setTimeout(() => {
        if (!cancelled) navigate(`/whatsapp?mode=${connectionType}&connected=1`);
      }, 1800);
    }

    void finishSetup();
    return () => {
      cancelled = true;
    };
  }, [connectionType, isLoading, navigate, params, user]);

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-brand-dark/10 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          {state === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
          {state === 'success' && <CheckCircle2 className="h-6 w-6" />}
          {state === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
        </div>
        <div className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
          <MessageCircle className="h-4 w-4" />
          WhatsApp setup
        </div>
        <h1 className="text-xl font-bold text-brand-dark">
          {state === 'success' ? 'Number connected' : state === 'error' ? 'Setup needs attention' : 'Finishing setup'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">{message}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {!user && !isLoading && (
            <Link
              to="/"
              className="inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Sign in
            </Link>
          )}
          <Link
            to={`/whatsapp?mode=${connectionType}`}
            className="inline-flex rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark/90"
          >
            Back to WhatsApp setup
          </Link>
        </div>
      </div>
    </div>
  );
}
