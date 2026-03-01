'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Clock,
  BookOpen,
  Play,
  Bookmark,
  BarChart3,
  Settings,
  LayoutDashboard,
  CheckCircle2,
  Trophy,
  Flame,
  Star,
  ArrowRight,
  ChevronRight,
  Target,
  Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getCategoryColor, type Playbook } from '../data/playbooks';
import { getSavedPlaybooks, getPlaybookProgress, toggleSavedPlaybook, getProfile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// --- XP & Skill Level System ---
const SKILL_LEVELS = [
  { level: 1, title: 'AI Curious', xpRequired: 0, color: '#94A3B8', emoji: '🌱' },
  { level: 2, title: 'Prompt Apprentice', xpRequired: 50, color: '#3B82F6', emoji: '' },
  { level: 3, title: 'AI Practitioner', xpRequired: 150, color: '#8B5CF6', emoji: '⚡' },
  { level: 4, title: 'Workflow Architect', xpRequired: 350, color: '#F59E0B', emoji: '🏗️' },
  { level: 5, title: 'AI Power User', xpRequired: 600, color: '#EF4444', emoji: '🔥' },
  { level: 6, title: 'Automation Master', xpRequired: 1000, color: '#10B981', emoji: '👑' },
];

function getSkillLevel(xp: number) {
  let current = SKILL_LEVELS[0];
  for (const level of SKILL_LEVELS) {
    if (xp >= level.xpRequired) current = level;
  }
  const nextLevel = SKILL_LEVELS.find(l => l.xpRequired > xp);
  const xpToNext = nextLevel ? nextLevel.xpRequired - xp : 0;
  const xpInLevel = nextLevel ? nextLevel.xpRequired - current.xpRequired : 1;
  const progressInLevel = nextLevel ? ((xp - current.xpRequired) / xpInLevel) * 100 : 100;
  return { ...current, xp, xpToNext, nextLevel, progressInLevel };
}

// --- Streak Calculation ---
function calculateStreak(lastAccessedDates: string[]): number {
  if (lastAccessedDates.length === 0) return 0;

  const uniqueDays = [...new Set(
    lastAccessedDates.map(d => new Date(d).toISOString().split('T')[0])
  )].sort().reverse();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

interface SavedPlaybook extends Playbook {
  savedAt: string;
  progress: number;
}

interface InProgressPlaybook extends Playbook {
  completedSteps: number[];
  totalSteps: number;
  lastAccessed: string;
  completedAt?: string | null;
}

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<'in-progress' | 'completed' | 'saved'>('in-progress');
  const [savedPlaybooks, setSavedPlaybooks] = useState<SavedPlaybook[]>([]);
  const [inProgress, setInProgress] = useState<InProgressPlaybook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const [totalXP, setTotalXP] = useState(0);
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [favoriteCategory, setFavoriteCategory] = useState('');
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      setIsLoading(true);

      try {
        const profile = await getProfile(user.id, user.email || '');
        setIsAdmin(!!profile?.is_admin);

        const saved = await getSavedPlaybooks(user.id);
        const mappedSaved: SavedPlaybook[] = saved.map(p => ({
          ...p,
          savedAt: new Date().toISOString(),
          progress: 0
        }));
        setSavedPlaybooks(mappedSaved);

        const progressRaw = await getPlaybookProgress(user.id);
        const progress: InProgressPlaybook[] = progressRaw
          .filter(p => p != null)
          .map(p => ({
            ...p,
            totalSteps: p!.steps?.length || 0,
          })) as InProgressPlaybook[];

        setInProgress(progress);

        // Calculate XP: 10 per completed step + 50 bonus per fully completed playbook
        let xp = 0;
        let timeSaved = 0;
        let completed = 0;
        const categoryCount: Record<string, number> = {};
        const accessDates: string[] = [];

        progress.forEach(p => {
          const stepsCompleted = Array.isArray(p.completedSteps) ? p.completedSteps.length : 0;
          xp += stepsCompleted * 10;

          if (p.completedAt) {
            xp += 50; // Completion bonus
            completed++;
          }

          const completionRate = p.totalSteps > 0 ? (stepsCompleted / p.totalSteps) : 0;
          timeSaved += Math.floor(p.timeSaved * completionRate);

          // Count categories
          categoryCount[p.category] = (categoryCount[p.category] || 0) + stepsCompleted;

          // Collect access dates for streak
          if (p.lastAccessed) accessDates.push(p.lastAccessed);
        });

        setTotalXP(xp);
        setTotalTimeSaved(timeSaved);
        setTotalCompleted(completed);
        setCurrentStreak(calculateStreak(accessDates));

        // Favorite category
        const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
        setFavoriteCategory(topCategory ? topCategory[0] : 'None yet');

      } catch (err) {
        console.error("Dashboard DB error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  const skillLevel = useMemo(() => getSkillLevel(totalXP), [totalXP]);

  const completedPlaybooks = useMemo(() =>
    inProgress.filter(p => !!p.completedAt),
    [inProgress]
  );

  const activePlaybooks = useMemo(() =>
    inProgress.filter(p => !p.completedAt),
    [inProgress]
  );

  const removeSaved = async (id: string) => {
    if (!user) return;
    const success = await toggleSavedPlaybook(user.id, id, true);
    if (success) {
      setSavedPlaybooks(prev => prev.filter(p => p.id !== id));
      toast.success('Removed from saved playbooks');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark">
      {/* Navigation */}
      <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-dark rounded-full shadow-antigravity-md flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">Hoursback</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand-dark hover:text-[#635BFF] transition-colors bg-brand-dark/5 px-3 py-1.5 rounded-full">
                <LayoutDashboard className="w-4 h-4" />
                Admin
              </Link>
            )}
            <Link to="/autopilot" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#DA7756] hover:text-brand-dark transition-colors bg-[#DA7756]/10 px-3 py-1.5 rounded-full">
              <Bot className="w-4 h-4" />
              Autopilot
            </Link>
            <Link to="/playbooks" className="text-sm text-brand-dark/80 hover:text-brand-dark transition-colors">
              Browse Playbooks
            </Link>
            <Link to="/settings" className="p-2 text-slate-400 hover:text-brand-dark transition-colors rounded-full hover:bg-slate-100">
              <Settings className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200">
              <span className="text-sm font-medium">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header with Skill Level */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Progress</h1>
          <p className="text-brand-dark/70">Track your AI learning journey and see how far you've come.</p>
        </div>

        {/* Skill Level Card */}
        <div className="bg-white shadow-antigravity-md border border-brand-dark/10 rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{skillLevel.emoji}</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: skillLevel.color }}>{skillLevel.title}</h2>
                <p className="text-sm text-brand-dark/60">Level {skillLevel.level} • {totalXP} XP total</p>
              </div>
            </div>
            {skillLevel.nextLevel && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-brand-dark/50">Next level</p>
                <p className="text-sm font-semibold">{skillLevel.nextLevel.emoji} {skillLevel.nextLevel.title}</p>
                <p className="text-xs text-brand-dark/40">{skillLevel.xpToNext} XP to go</p>
              </div>
            )}
          </div>

          {/* XP Progress Bar */}
          <div className="relative">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(skillLevel.progressInLevel, 100)}%`,
                  backgroundColor: skillLevel.color
                }}
              />
            </div>
            {/* Level Milestones */}
            <div className="flex justify-between mt-2">
              {SKILL_LEVELS.map(level => (
                <div
                  key={level.level}
                  className="flex flex-col items-center"
                  style={{ opacity: totalXP >= level.xpRequired ? 1 : 0.3 }}
                >
                  <span className="text-xs">{level.emoji}</span>
                  <span className="text-[10px] text-brand-dark/40 hidden md:block">{level.xpRequired}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Completed"
            value={totalCompleted.toString()}
            sublabel="playbooks"
            color="#635BFF"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Time Saved"
            value={`${totalTimeSaved}m`}
            sublabel="total"
            color="#10B981"
          />
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            label="Streak"
            value={`${currentStreak}d`}
            sublabel={currentStreak > 0 ? "keep it up!" : "start today"}
            color="#F59E0B"
          />
          <StatCard
            icon={<Star className="w-5 h-5" />}
            label="Favorite"
            value={favoriteCategory.length > 14 ? favoriteCategory.substring(0, 12) + '…' : favoriteCategory}
            sublabel="category"
            color="#EC4899"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-brand-dark/10 pb-4">
          {(['in-progress', 'completed', 'saved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab
                ? 'bg-brand-dark text-white'
                : 'text-brand-dark/70 hover:text-brand-dark hover:bg-white shadow-antigravity-md border border-brand-dark/10'
                }`}
            >
              {tab === 'in-progress' && <Play className="w-3.5 h-3.5" />}
              {tab === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {tab === 'saved' && <Bookmark className="w-3.5 h-3.5" />}
              {tab === 'in-progress' ? `In Progress (${activePlaybooks.length})` :
                tab === 'completed' ? `Completed (${completedPlaybooks.length})` :
                  `Saved (${savedPlaybooks.length})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'in-progress' && (
            <div className="space-y-8">
              {activePlaybooks.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="w-12 h-12" />}
                  title="No active playbooks"
                  description="Start a playbook to begin earning XP and tracking your progress."
                  action={{ label: 'Start Learning', href: '/playbooks' }}
                />
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activePlaybooks.map((playbook) => (
                    <ContinueCard key={playbook.id} playbook={playbook} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-8">
              {completedPlaybooks.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="w-12 h-12" />}
                  title="No completed playbooks yet"
                  description="Complete all steps in a playbook to see it here and earn bonus XP."
                  action={{ label: 'Browse Playbooks', href: '/playbooks' }}
                />
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedPlaybooks.map((playbook) => (
                    <CompletedCard key={playbook.id} playbook={playbook} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-8">
              {savedPlaybooks.length === 0 ? (
                <EmptyState
                  icon={<Bookmark className="w-12 h-12" />}
                  title="No saved playbooks"
                  description="Save playbooks to access them quickly from here."
                  action={{ label: 'Browse Playbooks', href: '/playbooks' }}
                />
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedPlaybooks.map((playbook) => (
                    <SavedCard key={playbook.id} playbook={playbook} onRemove={() => removeSaved(playbook.id)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sublabel, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div className="bg-white shadow-antigravity-md border border-brand-dark/10 rounded-3xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
        <span className="text-brand-dark/70 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-400">{sublabel}</div>
    </div>
  );
}

function ContinueCard({ playbook }: { playbook: InProgressPlaybook }) {
  const stepsCompleted = Array.isArray(playbook.completedSteps) ? playbook.completedSteps.length : 0;
  const progress = Math.round((stepsCompleted / playbook.totalSteps) * 100);
  const color = getCategoryColor(playbook.category);
  const xpEarned = stepsCompleted * 10;

  return (
    <Link to={`/playbooks/${playbook.slug}`}>
      <div className="bg-white shadow-antigravity-md border border-brand-dark/10 rounded-3xl p-5 hover:shadow-antigravity-lg transition-all group">
        <div className="flex items-start justify-between mb-3">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {playbook.category}
          </span>
          <div className="flex items-center gap-1 text-xs text-brand-dark/40">
            <Target className="w-3 h-3" />
            <span>{xpEarned} XP</span>
          </div>
        </div>
        <h3 className="font-semibold mb-2 group-hover:text-brand-blue transition-colors line-clamp-2">{playbook.title}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          <span>Step {Math.min(stepsCompleted + 1, playbook.totalSteps)} of {playbook.totalSteps}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {playbook.timeToComplete}m
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: color }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">{progress}% complete</span>
          <span className="text-xs font-medium text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Continue <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CompletedCard({ playbook }: { playbook: InProgressPlaybook }) {
  const color = getCategoryColor(playbook.category);
  const completedDate = playbook.completedAt ? new Date(playbook.completedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  }) : 'Unknown';
  const xpEarned = (playbook.totalSteps * 10) + 50;

  return (
    <Link to={`/playbooks/${playbook.slug}`}>
      <div className="bg-white shadow-antigravity-md border border-brand-dark/10 rounded-3xl p-5 hover:shadow-antigravity-lg transition-all group relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
        <div className="flex items-start justify-between mb-3">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {playbook.category}
          </span>
          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-xs font-medium">Done</span>
          </div>
        </div>
        <h3 className="font-semibold mb-2 group-hover:text-brand-blue transition-colors line-clamp-2">{playbook.title}</h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{completedDate}</span>
          <span className="flex items-center gap-1 text-amber-500 font-medium">
            <Trophy className="w-3 h-3" />
            {xpEarned} XP
          </span>
        </div>
      </div>
    </Link>
  );
}

function SavedCard({ playbook, onRemove }: { playbook: SavedPlaybook; onRemove: () => void }) {
  const color = getCategoryColor(playbook.category);

  return (
    <div className="bg-white shadow-antigravity-md border border-brand-dark/10 rounded-3xl p-5 hover:shadow-antigravity-lg transition-all group">
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {playbook.category}
        </span>
        <button
          onClick={onRemove}
          className="text-amber-400 hover:text-red-400 transition-colors"
        >
          <Bookmark className="w-4 h-4 fill-current" />
        </button>
      </div>
      <Link to={`/playbooks/${playbook.slug}`}>
        <h3 className="font-semibold mb-2 group-hover:text-brand-blue transition-colors line-clamp-2">{playbook.title}</h3>
      </Link>
      <p className="text-sm text-brand-dark/60 line-clamp-2 mb-3">{playbook.subtitle}</p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {playbook.timeToComplete}m
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Saves {playbook.timeSaved}m
        </span>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: { label: string; href: string };
}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-white shadow-antigravity-md border border-brand-dark/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-brand-dark/70 mb-6">{description}</p>
      <Link to={action.href}>
        <button className="px-6 py-3 bg-brand-dark text-white rounded-xl shadow-antigravity-md hover:shadow-antigravity-lg transition-all font-medium hover:bg-brand-dark/90 flex items-center gap-2 mx-auto">
          {action.label}
          <ArrowRight className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
}
