import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { updateProfile } from '../lib/api';
import { Bot, FileText, User, LogOut, Crown, CheckCircle2, Clock, RefreshCw, Building2, Pencil, X, Check } from 'lucide-react';
import { MobileNav } from '../components/MobileNav';
import { UserAvatar } from '../components/UserAvatar';
import { ProUpgradeButton } from '../components/ProUpgradeButton';
import { toast } from 'sonner';
import type { BusinessProfile } from '../components/OnboardingModal';

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
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [editingChallenge, setEditingChallenge] = useState(false);
  const [challengeDraft, setChallengeDraft] = useState('');

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
    // Load business profile from localStorage
    const stored = localStorage.getItem(`hb_profile_${user.id}`);
    if (stored) {
      try { setBusinessProfile(JSON.parse(stored)); } catch {}
    }
  }, [user, navigate]);

  const saveChallenge = async () => {
    if (!user || !businessProfile) return;
    const updated = { ...businessProfile, challenge: challengeDraft };
    localStorage.setItem(`hb_profile_${user.id}`, JSON.stringify(updated));
    await updateProfile(user.id, { business_profile: updated });
    setBusinessProfile(updated);
    setEditingChallenge(false);
    toast.success('Business profile updated');
  };

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
            <UserAvatar user={user} size="lg" />
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

        {/* Business Profile */}
        {businessProfile && businessProfile.businessName && (
          <div className="bg-white rounded-2xl border border-brand-dark/10 shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Business Profile</span>
              </div>
              <span className="text-xs text-slate-400">Used by AI in every workflow</span>
            </div>

            <div className="bg-brand-dark rounded-xl p-4 text-white text-xs leading-relaxed mb-4">
              <p className="text-white/40 uppercase tracking-widest text-[10px] font-semibold mb-2">AI context</p>
              <p className="text-white/70">
                <span className="text-white font-semibold">{businessProfile.businessName}</span> operates in{' '}
                <span className="text-white font-semibold">{businessProfile.industry}</span>.
                {businessProfile.products && <> Products/services: <span className="text-white">{businessProfile.products}</span>.</>}
                {businessProfile.metrics?.length > 0 && <> Tracks: <span className="text-white">{businessProfile.metrics.join(', ')}</span>.</>}
                {businessProfile.competitors && <> Competitors: <span className="text-white">{businessProfile.competitors}</span>.</>}
                {businessProfile.challenge && <> Current challenge: <span className="text-white">{businessProfile.challenge}</span>.</>}
                {' '}Currency: <span className="text-white">{businessProfile.currency}</span>.
              </p>
            </div>

            {/* Editable challenge field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Current challenge</label>
                {!editingChallenge && (
                  <button
                    onClick={() => { setChallengeDraft(businessProfile.challenge || ''); setEditingChallenge(true); }}
                    className="flex items-center gap-1 text-xs text-brand-blue hover:underline"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
              {editingChallenge ? (
                <div className="space-y-2">
                  <textarea
                    value={challengeDraft}
                    onChange={e => setChallengeDraft(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={saveChallenge} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-dark text-white rounded-full text-xs font-medium">
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditingChallenge(false)} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-500 rounded-full text-xs font-medium">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">{businessProfile.challenge || <span className="text-slate-400 italic">Not set</span>}</p>
              )}
            </div>
          </div>
        )}

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
