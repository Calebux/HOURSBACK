import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const DEFAULT_REDIRECT = '/workflows';

function getSafeRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }
  return value;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Finishing sign in...');

  useEffect(() => {
    let isMounted = true;

    const finishSignIn = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const next = getSafeRedirect(url.searchParams.get('next'));

      if (!code) {
        if (url.hash.includes('access_token') || url.hash.includes('refresh_token') || url.hash.includes('provider_token')) {
          window.history.replaceState(null, document.title, `${url.pathname}${url.search}`);
          await supabase.auth.signOut();
        }

        if (isMounted) {
          setMessage('Sign in link is invalid or expired.');
        }
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      window.history.replaceState(null, document.title, next);

      if (error) {
        if (isMounted) {
          setMessage(error.message);
        }
        return;
      }

      navigate(next, { replace: true });
    };

    finishSignIn();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-b-2 border-brand-dark" />
        <p className="text-brand-dark/70">{message}</p>
      </div>
    </div>
  );
}
