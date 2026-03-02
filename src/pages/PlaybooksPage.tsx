import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Search,
  Filter,
  Clock,
  Zap,
  ChevronDown,
  X,
  Grid3X3,
  List,
  ArrowRight,
  Bookmark,
  BarChart3,
  ChevronLeft,
  Sparkles,
  LayoutDashboard,
  Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryColor, claudeCrashCoursePlaybooks, type Playbook } from '../data/playbooks';
import { fetchPlaybooks } from '../lib/api';
import type { OnboardingData } from '../components/OnboardingModal';

const PROFESSION_CATEGORIES: Record<string, string[]> = {
  entrepreneur: ['Marketing', 'Business Development', 'Operations', 'Finance'],
  freelancer: ['Marketing', 'Sales Ops', 'Operations'],
  marketing: ['Marketing', 'Business Development'],
  finance: ['Finance', 'Business Development'],
  sales: ['Sales Ops', 'Business Development'],
  creator: ['Marketing'],
  fitness: ['Fitness & Wellness'],
  student: ['Operations'],
  developer: ['Operations', 'Product'],
  other: [],
};

const GOAL_CATEGORIES: Record<string, string[]> = {
  automate: [],
  bookkeeping: ['Finance'],
  marketing_content: ['Marketing'],
  sales_bd: ['Sales Ops', 'Business Development'],
  learn_ai: [],
  fitness_health: ['Fitness & Wellness'],
  coding: ['Product'],
  productivity: ['Operations'],
};

function getOnboardingScore(p: Playbook, onboarding: OnboardingData): number {
  const profCats = PROFESSION_CATEGORIES[onboarding.profession] ?? [];
  const goalCats = onboarding.goals.flatMap(g => GOAL_CATEGORIES[g] ?? []);
  let score = 0;
  if (profCats.includes(p.category)) score += 2;
  if (goalCats.includes(p.category)) score += 1;
  if (onboarding.goals.includes('automate') && p.agentAutomation) score += 1;
  return score;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }
  }
};

export default function PlaybooksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [savedPlaybooks, setSavedPlaybooks] = useState<Set<string>>(new Set());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const { user, signOut } = useAuth();

  const headerRef = useRef<HTMLElement>(null);
  const isInView = useInView(headerRef, { once: true });

  // Load onboarding data when user is available
  useEffect(() => {
    if (!user) return;
    const readOnboarding = () => {
      const raw = localStorage.getItem(`hb_onboarding_${user.id}`);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as OnboardingData;
        if (parsed.profession && parsed.goals?.length) {
          setOnboarding(parsed);
        }
      } catch {
        // ignore malformed data
      }
    };
    readOnboarding();
    // Also refresh immediately if the modal is completed while this page is open
    window.addEventListener('hb:onboarding-complete', readOnboarding);
    return () => window.removeEventListener('hb:onboarding-complete', readOnboarding);
  }, [user]);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem('savedPlaybooks');
    if (saved) {
      setSavedPlaybooks(new Set(JSON.parse(saved)));
    }

    const loadData = async () => {
      try {
        const data = await fetchPlaybooks();
        setPlaybooks(data);
      } catch (err) {
        console.error("Failed to load playbooks:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);



  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  const filteredPlaybooks = useMemo(() => {
    const base = playbooks.filter(playbook => {
      if (playbook.category === 'Claude Crash Course') return false;

      const matchesSearch =
        playbook.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        playbook.subtitle.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        playbook.tools.some(t => t.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'All' || playbook.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || playbook.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });

    // When no filters active and onboarding is set, sort by preference score
    if (onboarding && selectedCategory === 'All' && !debouncedSearchQuery) {
      return [...base].sort((a, b) => {
        const diff = getOnboardingScore(b, onboarding) - getOnboardingScore(a, onboarding);
        return diff !== 0 ? diff : b.completionCount - a.completionCount;
      });
    }

    return base;
  }, [playbooks, debouncedSearchQuery, selectedCategory, selectedDifficulty, onboarding]);

  const toggleSave = (id: string, _title: string) => {
    setSavedPlaybooks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('savedPlaybooks', JSON.stringify([...next]));
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedDifficulty('All');
    setSearchQuery('');
  };

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedDifficulty !== 'All' ? 1 : 0);

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark overflow-x-hidden">
      {/* Navigation */}
      <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-brand-dark text-white text-white rounded-full shadow-antigravity-md hover:shadow-antigravity-lg transition-all flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-brand-dark" />
            </div>
            <span className="text-lg sm:text-xl font-semibold hidden sm:block">Hoursback</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
            <button
              onClick={() => setShowWhatsNew(true)}
              className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#DA7756]/10 to-[#DA7756]/5 border border-[#DA7756]/20 text-[#DA7756] rounded-full text-xs sm:text-sm font-medium hover:from-[#DA7756]/15 hover:to-[#DA7756]/10 transition-all whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">What's New</span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#DA7756] rounded-full animate-pulse shrink-0" />
            </button>
            {user ? (
              <>
                <Link
                  to="/workspace"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm text-brand-dark/80 hover:text-brand-dark hover:bg-slate-100 rounded-full transition-all whitespace-nowrap"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">My Progress</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-xs sm:text-sm text-brand-dark/80 hover:text-brand-dark transition-colors whitespace-nowrap px-1"
                >
                  <span className="sm:hidden">Out</span>
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setAuthView('signin'); setAuthModalOpen(true); }}
                  className="text-xs sm:text-sm text-brand-dark/80 hover:text-brand-dark transition-colors whitespace-nowrap px-1"
                >
                  <span className="sm:hidden">Sign in</span>
                  <span className="hidden sm:inline">Sign in</span>
                </button>
                <button
                  onClick={() => { setAuthView('signup'); setAuthModalOpen(true); }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-dark text-white rounded-full shadow-antigravity-md hover:shadow-antigravity-lg transition-all text-xs sm:text-sm font-medium hover:bg-[#7C3AED] whitespace-nowrap"
                >
                  Get Pro
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-16 pb-8" ref={headerRef}>
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Link to="/" className="text-brand-dark/70 hover:text-brand-dark flex items-center gap-1 text-sm">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold mb-4">Playbooks</h1>
            <p className="text-xl text-brand-dark/70 max-w-2xl">
              Step-by-step guides to automate your work with AI.
              {isLoading ? ' Loading...' : ` ${filteredPlaybooks.length} playbooks available.`}
            </p>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            className="mt-10 flex flex-row items-center gap-2 md:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search playbooks, tools, or outcomes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 md:pl-12 pr-4 h-[46px] bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-full focus:outline-none focus:border-[#635BFF] transition-colors text-brand-dark placeholder:text-slate-400 text-sm md:text-base text-ellipsis whitespace-nowrap overflow-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-dark p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 h-[46px] shrink-0 rounded-full border transition-colors ${showFilters || activeFiltersCount > 0
                ? "bg-brand-dark text-white border-[#635BFF]"
                : "bg-white shadow-antigravity-md border-brand-dark/10 text-brand-dark/80 hover:bg-slate-50"
                }`}
            >
              <Filter className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View Toggle */}
            <div className="flex items-center shrink-0 bg-white shadow-antigravity-md border border-brand-dark/10 rounded-full p-1 h-[46px]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? "bg-slate-100 text-brand-dark" : "text-slate-400 hover:text-brand-dark"
                  }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? "bg-slate-100 text-brand-dark" : "text-slate-400 hover:text-brand-dark"
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Expandable Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2 flex flex-wrap gap-4">
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="appearance-none bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-full px-4 py-2 pr-10 text-sm focus:outline-none focus:border-[#635BFF] cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      <option value="Business Development">Business Development</option>
                      <option value="Sales Ops">Sales Ops</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="Investment Banking">Investment Banking</option>
                      <option value="Equity Research">Equity Research</option>
                      <option value="Private Equity">Private Equity</option>
                      <option value="Wealth Management">Wealth Management</option>
                      <option value="Operations">Operations</option>
                      <option value="HR">HR</option>
                      <option value="Product">Product</option>
                      <option value="Legal">Legal</option>
                      <option value="Fitness & Wellness">Fitness &amp; Wellness</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="appearance-none bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-full px-4 py-2 pr-10 text-sm focus:outline-none focus:border-[#635BFF] cursor-pointer"
                    >
                      <option value="All">All Levels</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>


                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm text-brand-dark/70 hover:text-brand-dark flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear all
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Summary */}
          <div className="mt-6 flex items-center justify-between text-sm text-brand-dark/70">
            <span>Showing {filteredPlaybooks.length} playbooks</span>
          </div>
        </div>
      </section>

      {/* Playbooks Grid/List */}
      <section className="pb-20">
        <div className="container mx-auto px-6">
          {filteredPlaybooks.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-white shadow-antigravity-md border border-brand-dark/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No playbooks found</h3>
              <p className="text-brand-dark/70">Try adjusting your filters or search query</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-brand-blue hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              {/* Claude Crash Course Banner */}
              {selectedCategory === 'All' && debouncedSearchQuery === '' && (
                <Link to="/crash-course">
                  <div className="mb-8 bg-gradient-to-r from-[#DA7756]/5 to-[#DA7756]/10 border border-[#DA7756]/20 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4 hover:shadow-antigravity-md transition-all cursor-pointer group">
                    <div className="w-12 h-12 rounded-2xl bg-[#DA7756] flex items-center justify-center shrink-0 shadow-antigravity-sm">
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.003 2C7.376 2 2 7.376 2 14.003S7.376 26 14.003 26 26 20.627 26 14.003 20.63 2 14.003 2Zm5.09 16.22c-.28.63-.95.91-1.59.64l-3.5-1.56-2.22 2.13c-.5.48-1.29.47-1.77-.03a1.25 1.25 0 0 1-.03-1.77l2.14-2.05-1.74-3.9c-.27-.63.02-1.36.65-1.64.63-.27 1.36.02 1.64.65l1.3 2.93 2.08-1.99a1.25 1.25 0 0 1 1.77.03c.48.5.47 1.29-.03 1.77l-2.2 2.11 2.88 1.28c.63.28.91.96.62 1.41Z" fill="white" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-[#DA7756] uppercase tracking-widest">Free Course</span>
                        <span className="px-2 py-0.5 bg-[#DA7756]/10 text-[#DA7756] text-xs font-medium rounded-full">{claudeCrashCoursePlaybooks.length} Lessons • {(claudeCrashCoursePlaybooks.reduce((s, p) => s + p.timeToComplete, 0) / 60).toFixed(1)} Hours</span>
                      </div>
                      <h3 className="font-semibold text-lg text-brand-dark leading-tight">Claude Crash Course</h3>
                      <p className="text-brand-dark/60 text-sm mt-1">
                        Go from zero to fluent with Claude. Hands-on, prompt-based lessons covering conversation, prompt engineering, file analysis, projects, artifacts, and research mode.
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#DA7756] text-white text-sm font-medium rounded-full shadow-antigravity-xs group-hover:bg-[#C26645] transition-colors whitespace-nowrap">
                      Start Course <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              )}

              <motion.div
                className={
                  viewMode === 'grid'
                    ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
                }
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {filteredPlaybooks.map((playbook) => (
                    <PlaybookCard
                      key={playbook.id}
                      playbook={playbook}
                      viewMode={viewMode}
                      isSaved={savedPlaybooks.has(playbook.id)}
                      onToggleSave={() => toggleSave(playbook.id, playbook.title)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="border-t border-brand-dark/10 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">Can't find what you need?</h2>
          <p className="text-brand-dark/70 mb-6">Request a custom playbook for your specific workflow</p>
          <button className="px-6 py-3 bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-full hover:bg-slate-50 transition-colors">
            Request Playbook
          </button>
        </div>
      </section>

      {/* What's New Sidebar */}
      <AnimatePresence>
        {showWhatsNew && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-brand-dark/30 backdrop-blur-sm z-[60]"
              onClick={() => setShowWhatsNew(false)}
            />
            {/* Panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-brand-light border-l border-brand-dark/10 shadow-2xl z-[70] overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#DA7756]" />
                    <h2 className="text-lg font-semibold">What's New</h2>
                  </div>
                  <button
                    onClick={() => setShowWhatsNew(false)}
                    className="p-2 rounded-full hover:bg-brand-dark/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Claude Cowork Announcement */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-brand-dark/10 shadow-antigravity-sm overflow-hidden hover:shadow-antigravity-md transition-all cursor-pointer group"
                    onClick={() => { setSelectedCategory('Investment Banking'); setShowWhatsNew(false); }}
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-[#DA7756] flex items-center justify-center">
                          <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.003 2C7.376 2 2 7.376 2 14.003S7.376 26 14.003 26 26 20.627 26 14.003 20.63 2 14.003 2Zm5.09 16.22c-.28.63-.95.91-1.59.64l-3.5-1.56-2.22 2.13c-.5.48-1.29.47-1.77-.03a1.25 1.25 0 0 1-.03-1.77l2.14-2.05-1.74-3.9c-.27-.63.02-1.36.65-1.64.63-.27 1.36.02 1.64.65l1.3 2.93 2.08-1.99a1.25 1.25 0 0 1 1.77.03c.48.5.47 1.29-.03 1.77l-2.2 2.11 2.88 1.28c.63.28.91.96.62 1.41Z" fill="white" />
                          </svg>
                        </div>
                        <span className="px-2 py-0.5 bg-[#DA7756]/10 text-[#DA7756] text-xs font-semibold rounded-full">Claude Cowork</span>
                        <span className="text-xs text-brand-dark/40">Feb 2026</span>
                      </div>
                      <h3 className="font-semibold text-brand-dark mb-1.5 group-hover:text-[#DA7756] transition-colors">New Claude Cowork Integrations</h3>
                      <p className="text-brand-dark/60 text-sm leading-relaxed">
                        Claude integrates directly with Apollo, Clay, Outreach, FactSet, S&P Global and more. Playbooks marked ✦ Cowork are optimised for Claude's enterprise tools.
                      </p>
                      <div className="flex items-center gap-1 mt-3 text-xs text-[#DA7756] font-medium">
                        View Finance Playbooks <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Perplexity Announcement (placeholder for future content) */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-brand-dark/10 shadow-antigravity-sm overflow-hidden hover:shadow-antigravity-md transition-all cursor-pointer group"
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-[#22B8CD] flex items-center justify-center">
                          <Search className="w-4 h-4 text-white" />
                        </div>
                        <span className="px-2 py-0.5 bg-[#22B8CD]/10 text-[#22B8CD] text-xs font-semibold rounded-full">Perplexity</span>
                        <span className="text-xs text-brand-dark/40">Coming Soon</span>
                      </div>
                      <h3 className="font-semibold text-brand-dark mb-1.5 group-hover:text-[#22B8CD] transition-colors">Perplexity Research Playbooks</h3>
                      <p className="text-brand-dark/60 text-sm leading-relaxed">
                        Deep research workflows powered by Perplexity's latest updates. Stay tuned for new playbooks.
                      </p>
                      <div className="flex items-center gap-1 mt-3 text-xs text-[#22B8CD] font-medium">
                        Coming Soon <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultView={authView}
      />
    </div>
  );
}

const PlaybookCard = memo(function PlaybookCard({
  playbook,
  viewMode,
  isSaved,
  onToggleSave
}: {
  playbook: Playbook;
  viewMode: 'grid' | 'list';
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const color = getCategoryColor(playbook.category);

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        variants={itemVariants}
        className="group flex items-center gap-6 p-4 bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-3xl hover:bg-slate-50 transition-all cursor-pointer"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <span className="text-lg font-bold" style={{ color }}>{playbook.timeToComplete}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg group-hover:text-brand-blue transition-colors">
              {playbook.title}
            </h3>
            {playbook.isNew && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">New</span>
            )}
            {playbook.isPro && (
              <span className="px-2 py-0.5 bg-brand-dark text-white/20 text-brand-blue text-xs rounded-full">Pro</span>
            )}
            {playbook.coworkCompatible && (
              <span className="px-2 py-0.5 bg-[#DA7756]/10 text-[#DA7756] text-xs rounded-full font-medium">✦ Cowork</span>
            )}
            {playbook.agentAutomation && (
              <span className="px-2 py-0.5 bg-[#DA7756]/10 text-[#DA7756] text-xs rounded-full font-medium flex items-center gap-1">
                <Bot className="w-3 h-3" />
                Agent
              </span>
            )}
          </div>
          <p className="text-brand-dark/70 text-sm truncate">{playbook.subtitle}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span style={{ color }}>{playbook.category}</span>
            <span>•</span>
            <span>{playbook.difficulty}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Saves {playbook.timeSaved} min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
            className={`p-2 rounded-full transition-colors ${isSaved ? "text-brand-blue bg-brand-dark text-white/10" : "text-slate-400 hover:text-brand-dark"
              }`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved && "fill-current"}`} />
          </button>
          <Link to={`/playbooks/${playbook.slug}`}>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-full hover:bg-brand-dark/90 transition-colors text-sm font-medium shadow-antigravity-xs">
              Start
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className="group relative bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all"
    >
      <Link to={`/playbooks/${playbook.slug}`}>
        <div className="p-6 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {playbook.category}
              </span>
              {playbook.isNew && (
                <span className="px-2 py-1 bg-green-500/20 text-green-600 text-xs font-medium rounded-full">New</span>
              )}
              {playbook.isPro && (
                <span className="px-2 py-1 bg-brand-dark text-white text-xs font-medium rounded-full">Pro</span>
              )}
              {playbook.coworkCompatible && (
                <span className="px-2 py-1 bg-[#DA7756]/10 text-[#DA7756] text-xs font-medium rounded-full">✦ Cowork</span>
              )}
              {playbook.agentAutomation && (
                <span className="px-2 py-1 bg-[#DA7756]/10 text-[#DA7756] text-xs font-medium rounded-full flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  Agent
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {playbook.timeToComplete} min
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-2 group-hover:text-brand-blue transition-colors line-clamp-2">
            {playbook.title}
          </h3>
          <p className="text-brand-dark/70 text-sm mb-4 line-clamp-2">{playbook.subtitle}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {playbook.tools.map((tool) => (
              <span key={tool} className="text-xs text-slate-400 bg-white shadow-antigravity-md border border-brand-dark/10 px-2 py-1 rounded">
                {tool}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-brand-dark/10">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {playbook.completionCount.toLocaleString()} uses
              </span>
              <span className="flex items-center gap-1 text-brand-blue">
                <Zap className="w-3 h-3" />
                Saves {playbook.timeSaved}m
              </span>
            </div>

            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
              className={`p-2 rounded-full transition-colors ${isSaved ? "text-brand-blue bg-brand-dark text-white/10" : "text-slate-400 hover:text-brand-dark opacity-0 group-hover:opacity-100"
                }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved && "fill-current"}`} />
            </button>
          </div>
        </div>
      </Link>

      <div className="absolute inset-0 bg-gradient-to-t from-[#635BFF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
});
