import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Bot, FileText, User, LogOut, Crown, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { MobileNav } from '../components/MobileNav';
import { ProUpgradeButton } from '../components/ProUpgradeButton';
import { toast } from 'sonner';

interface Profile {
  subscription_status: string;
  subscription_expires_at: string | null;
  created_at: string;
}

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} remaining`;
  const hours = Math.floor(diff / 3600000);
  return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
}

export default function AccountPage() {
  const { user, signOut, refreshPro } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    supabase
      .from('profiles')
      .select('subscription_status, subscription_expires_at, created_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
        setLoading(false);
      });
  }, [user, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPro();
    const { data } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_expires_at, created_at')
      .eq('id', user!.id)
      .single();
    if (data) setProfile(data);
    setRefreshing(false);
    toast.success('Subscription status refreshed');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark" />
      </div>
    );
  }

  const isProStatus = profile?.subscription_status === 'pro';
  const expiresAt = profile?.subscription_expires_at;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark pb-20 md:pb-0">
      {/* Nav */}
      <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Hoursback" className="h-[36px] w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/workflows" className="flex items-center gap-1.5 text-sm font-medium text-brand-dark/60 hover:text-brand-dark transition-colors px-3 py-1.5">
              <Bot className="w-4 h-4" /> Workflows
            </Link>
            <Link to="/reports" className="flex items-center gap-1.5 text-sm font-medium text-brand-dark/60 hover:text-brand-dark transition-colors px-3 py-1.5">
              <FileText className="w-4 h-4" /> Reports
            </Link>
            <Link to="/account" className="flex items-center gap-1.5 text-sm font-medium text-[#DA7756] bg-[#DA7756]/10 px-3 py-1.5 rounded-full">
              <User className="w-4 h-4" /> Account
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Account</h1>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-brand-dark/10 shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-brand-dark flex items-center justify-center text-white text-xl font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-lg leading-tight">{user?.email}</p>
              {memberSince && <p className="text-sm text-slate-400 mt-0.5">Member since {memberSince}</p>}
            </div>
          </div>

          {/* Subscription status */}
          <div className={`rounded-2xl p-4 flex items-center justify-between gap-4 ${isProStatus ? 'bg-purple-50 border border-purple-100' : 'bg-slate-50 border border-slate-200'}`}>
            <div className="flex items-center gap-3">
              {isProStatus
                ? <Crown className="w-5 h-5 text-purple-600 shrink-0" />
                : <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />}
              <div>
                <p className={`font-semibold ${isProStatus ? 'text-purple-900' : 'text-slate-700'}`}>
                  {isProStatus ? 'Pro Plan' : 'Free Plan'}
                </p>
                {isProStatus && expiresAt && (
                  <p className="text-xs text-purple-600 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeUntil(expiresAt)} · renews {new Date(expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                {!isProStatus && (
                  <p className="text-xs text-slate-500 mt-0.5">3 free workflows · upgrade to unlock all 15</p>
                )}
              </div>
            </div>
            {!isProStatus && (
              <ProUpgradeButton className="shrink-0 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1.5">
                Upgrade →
              </ProUpgradeButton>
            )}
          </div>

          {/* Refresh status */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Checking...' : 'Refresh subscription status'}
          </button>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-brand-dark/10 shadow-sm divide-y divide-slate-100 mb-4">
          <Link to="/workflows" className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <Bot className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium">My Workflows</span>
            </div>
            <span className="text-slate-300">›</span>
          </Link>
          <Link to="/reports" className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium">Reports</span>
            </div>
            <span className="text-slate-300">›</span>
          </Link>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      <MobileNav />
    </div>
  );
}
