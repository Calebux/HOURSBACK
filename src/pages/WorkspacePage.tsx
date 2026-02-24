'use client';

import { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  BookOpen,
  TrendingUp,
  Award,
  Play,
  Bookmark,
  BarChart3,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getCategoryColor, type Playbook } from '../data/playbooks';
import { getSavedPlaybooks, getPlaybookProgress, toggleSavedPlaybook } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface UserStats {
  totalPlaybooksCompleted: number;
  totalTimeSaved: number;
  currentStreak: number;
  favoriteCategory: string;
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
  const [activeTab, setActiveTab] = useState<'in-progress' | 'saved'>('in-progress');
  const [savedPlaybooks, setSavedPlaybooks] = useState<SavedPlaybook[]>([]);
  const [inProgress, setInProgress] = useState<InProgressPlaybook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const [stats, setStats] = useState<UserStats>({
    totalPlaybooksCompleted: 0,
    totalTimeSaved: 0,
    currentStreak: 0,
    favoriteCategory: 'Business Development'
  });

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      setIsLoading(true);

      try {
        // Fetch saved playbooks
        const saved = await getSavedPlaybooks(user.id);
        const mappedSaved: SavedPlaybook[] = saved.map(p => ({
          ...p,
          savedAt: new Date().toISOString(), // Optional: fetch actual savedAt
          progress: 0
        }));
        setSavedPlaybooks(mappedSaved);

        // Fetch in progress
        const progressRaw = await getPlaybookProgress(user.id);

        // Map progress data to Include completion logic
        const progress: InProgressPlaybook[] = progressRaw.map(p => {
          return {
            ...p,
            totalSteps: p.steps.length,
          }
        }) as InProgressPlaybook[];

        setInProgress(progress);

        // Calculate stats
        const completed = progress.filter(p => !!p.completedAt).length; // or completedSteps.length === totalSteps
        const timeSaved = progress.reduce((acc, p) => {
          const completionRate = p.totalSteps > 0 ? (p.completedSteps.length / p.totalSteps) : 0;
          return acc + Math.floor(p.timeSaved * completionRate);
        }, 0);

        setStats({
          totalPlaybooksCompleted: completed,
          totalTimeSaved: timeSaved,
          currentStreak: Math.floor(Math.random() * 14) + 1, // Mock streak for now
          favoriteCategory: 'Operations'
        });

      } catch (err) {
        console.error("Dashboard DB error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

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
            <div className="w-8 h-8 bg-brand-dark text-white text-white rounded-full shadow-antigravity-md hover:shadow-antigravity-lg transition-all flex items-center justify-center">
              <Zap className="w-5 h-5 text-brand-dark" />
            </div>
            <span className="text-xl font-semibold">Hoursback</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/playbooks" className="text-sm text-brand-dark/80 hover:text-brand-dark transition-colors">
              Browse Playbooks
            </Link>
            <Link to="/settings" className="p-2 text-slate-400 hover:text-brand-dark transition-colors rounded-full hover:bg-slate-100">
              <Settings className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200">
              <span className="text-sm font-medium">JD</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Workspace</h1>
          <p className="text-brand-dark/70">Pick up exactly where you left off and access your saved playbooks.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Completed"
            value={stats.totalPlaybooksCompleted.toString()}
            sublabel="playbooks"
            color="#635BFF"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Time Saved"
            value={`${stats.totalTimeSaved}m`}
            sublabel="this month"
            color="#10B981"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Streak"
            value={`${stats.currentStreak}d`}
            sublabel="current"
            color="#F59E0B"
          />
          <StatCard
            icon={<Award className="w-5 h-5" />}
            label="Favorite"
            value={stats.favoriteCategory}
            sublabel="category"
            color="#EC4899"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-brand-dark/10 pb-4">
          {(['in-progress', 'saved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab
                ? 'bg-brand-dark text-white'
                : 'text-brand-dark/70 hover:text-brand-dark hover:bg-white shadow-antigravity-md border border-brand-dark/10'
                }`}
            >
              {tab === 'in-progress' ? 'In Progress' : 'Saved'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'in-progress' && (
            <div className="space-y-8">
              {inProgress.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="w-12 h-12" />}
                  title="No active playbooks"
                  description="Start a playbook to see your progress here."
                  action={{ label: 'Start Learning', href: '/playbooks' }}
                />
              ) : (
                <section>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inProgress.map((playbook) => (
                      <ContinueCard key={playbook.id} playbook={playbook} />
                    ))}
                  </div>
                </section>
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
    <div className="bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-3xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
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

  return (
    <Link to={`/playbooks/${playbook.slug}`}>
      <div className="bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-3xl p-4 hover:bg-slate-50 transition-colors group">
        <div className="flex items-start justify-between mb-3">
          <span
            className="text-xs font-medium px-2 py-1 rounded"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {playbook.category}
          </span>
          <Play className="w-4 h-4 text-slate-400 group-hover:text-brand-blue transition-colors" />
        </div>
        <h3 className="font-semibold mb-2 group-hover:text-brand-blue transition-colors">{playbook.title}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          <span>Step {stepsCompleted + 1} of {playbook.totalSteps}</span>
        </div>
        <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-dark text-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-slate-400 mt-2">{progress}% complete</div>
      </div>
    </Link>
  );
}

function SavedCard({ playbook, onRemove }: { playbook: SavedPlaybook; onRemove: () => void }) {
  const color = getCategoryColor(playbook.category);

  return (
    <div className="bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-3xl p-4 hover:bg-slate-50 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <span
          className="text-xs font-medium px-2 py-1 rounded"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {playbook.category}
        </span>
        <button
          onClick={onRemove}
          className="text-slate-400 hover:text-red-400 transition-colors"
        >
          <Bookmark className="w-4 h-4 fill-current" />
        </button>
      </div>
      <Link to={`/playbooks/${playbook.slug}`}>
        <h3 className="font-semibold mb-2 group-hover:text-brand-blue transition-colors">{playbook.title}</h3>
      </Link>
      <p className="text-sm text-brand-dark/70 line-clamp-2 mb-3">{playbook.subtitle}</p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{playbook.timeToComplete} min</span>
        <span>Saves {playbook.timeSaved}m</span>
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
      <div className="w-16 h-16 bg-white shadow-antigravity-md border border-brand-dark/10 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-brand-dark/70 mb-6">{description}</p>
      <Link to={action.href}>
        <button className="px-6 py-3 bg-brand-dark text-white text-white rounded-full shadow-antigravity-md hover:shadow-antigravity-lg transition-all font-medium hover:bg-[#7C3AED] transition-colors">
          {action.label}
        </button>
      </Link>
    </div>
  );
}
