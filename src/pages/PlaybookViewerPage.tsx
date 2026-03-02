import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import {
  ChevronLeft,
  Clock,
  Zap,
  CheckCircle2,
  FileText,
  AlertCircle,
  Lightbulb,
  Copy,
  Check,
  Bookmark,
  Share2,
  ArrowRight,
  BarChart3,
  Users,
  Settings,
  Bot,
  Lock,
  LayoutDashboard,
  RotateCcw,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCategoryColor, type Playbook, mockPlaybooks, smbPlaybooks, coworkPlaybooks, coworkPluginPlaybooks, designerAIPlaybooks } from '../data/playbooks';
import { fetchPlaybookBySlug, checkIsSaved, toggleSavedPlaybook, getSinglePlaybookProgress, updatePlaybookProgress, getProfile, updateProfile } from '../lib/api';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { useAuth } from '../contexts/AuthContext';
import WebhookExecutor from '../components/WebhookExecutor';
import AgentCopilot from '../components/AgentCopilot';
import AutopilotModal from '../components/AutopilotModal';
import { toast } from 'sonner';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function PlaybookViewerPage() {
  const { slug } = useParams<{ slug: string }>();
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSaved, setIsSaved] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);
  const [isAutopilotModalOpen, setIsAutopilotModalOpen] = useState(false);
  const [isAgentGuideOpen, setIsAgentGuideOpen] = useState(false);

  // Auto-populate Next Up from same-category playbooks when relatedPlaybooks is empty
  const nextUpPlaybooks = useMemo(() => {
    if (!playbook) return [];
    if (playbook.relatedPlaybooks && playbook.relatedPlaybooks.length > 0) {
      return playbook.relatedPlaybooks;
    }
    // Find other playbooks in the same category
    const allPlaybooks = [...mockPlaybooks, ...smbPlaybooks, ...coworkPlaybooks, ...coworkPluginPlaybooks, ...designerAIPlaybooks];
    return allPlaybooks
      .filter(p => p.category === playbook.category && p.id !== playbook.id)
      .slice(0, 3)
      .map(p => ({ id: p.id, title: p.title, slug: p.slug }));
  }, [playbook]);

  const amountRaw = isAnnual ? 4.49 * 12 : 4.99;
  const amountNGN = Math.floor(amountRaw * 1500);

  const paymentConfig = useMemo(() => ({
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-d5505534622ae398b9500e9b6f82cb18-X',
    tx_ref: `hb_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    amount: amountNGN,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || 'test@example.com',
      phone_number: '',
      name: user?.user_metadata?.name || '',
    },
    meta: {
      user_id: user?.id || 'guest',
    },
    customizations: {
      title: 'Hoursback Pro Playbook',
      description: 'Unlock this Pro playbook instantly',
      logo: 'https://i.ibb.co/L5hY5M0/logo.png',
    },
  }), [amountNGN, user?.email, user?.id, user?.user_metadata?.name]);

  const handleFlutterPayment = useFlutterwave(paymentConfig);

  const handlePayment = () => {
    try {
      handleFlutterPayment({
        callback: async (response) => {
          console.log("Flutterwave Callback Response (PlaybookViewer):", response);
          if (response.status === 'successful' || response.status === 'completed') {
            closePaymentModal();
            toast.success("Payment successful! Welcome to Pro Playbooks.");
            setIsProUser(true);
            localStorage.setItem('has_pro_access', 'true');
            if (user) {
              try {
                await updateProfile(user.id, { subscription_status: 'pro' });
              } catch (err) {
                console.error("Failed to persist pro status to DB:", err);
              }
            }
          } else {
            console.warn("Payment Fail/Incomplete (PlaybookViewer):", response.status);
            toast.error("Payment failed or was incomplete. Please try again.");
            closePaymentModal();
          }
        },
        onClose: () => {
          console.log("Flutterwave modal closed (PlaybookViewer)");
          toast.info("Payment cancelled");
        }
      });
    } catch (err) {
      console.error("CRITICAL: Error calling handleFlutterPayment (PlaybookViewer):", err);
    }
  };

  useEffect(() => {
    const loadPlaybook = async () => {
      setIsLoading(true);
      if (slug) {
        const data = await fetchPlaybookBySlug(slug);
        setPlaybook(data);
      }
      setIsLoading(false);
    };
    loadPlaybook();
  }, [slug]);

  // Handle Agent Guide Modal
  useEffect(() => {
    if (playbook?.agentAutomation) {
      const guideKey = `agent_guide_seen_${playbook.slug}`;
      const hasSeenGuide = localStorage.getItem(guideKey);
      if (!hasSeenGuide) {
        setIsAgentGuideOpen(true);
        localStorage.setItem(guideKey, 'true');
      }
    }
  }, [playbook]);

  // Extract variables for the CURRENTLY active step to keep the sidebar compact
  const extractedVariables = useMemo(() => {
    const vars = new Set<string>();
    if (!playbook) return [];

    const step = playbook.steps[currentStep];
    if (step?.promptTemplate) {
      const matches = step.promptTemplate.match(/\[(.*?)\]/g);
      if (matches) {
        matches.forEach(m => vars.add(m.slice(1, -1)));
      }
    }

    return Array.from(vars);
  }, [playbook, currentStep]);

  const getInjectedPrompt = (template: string | undefined): string => {
    if (!template) return '';
    let injected = template;
    // Iterate over all globally filled variables to support stateful prompts across steps!
    Object.keys(variables).forEach(v => {
      if (variables[v] && variables[v].trim() !== '') {
        injected = injected.split(`[${v}]`).join(variables[v]);
      }
    });
    return injected;
  };

  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { scrollYProgress } = useScroll();

  // Load initial progress & saved state from DB
  useEffect(() => {
    const hasLocalProAccess = localStorage.getItem('has_pro_access') === 'true';
    if (hasLocalProAccess) {
      setIsProUser(true);
    }

    if (!playbook) return;

    // Check if saved
    checkIsSaved(user?.id || null, playbook.id).then(saved => setIsSaved(saved));

    // Load progress
    getSinglePlaybookProgress(user?.id || null, playbook.id).then(prog => {
      if (prog && prog.completed_steps) {
        const isFinished = prog.completed_steps.length >= playbook.steps.length && playbook.steps.length > 0;
        const isOutdated = prog.completed_steps.some((s: number) => s >= playbook.steps.length);

        if (isFinished || isOutdated) {
          // Playbook was either fully completed previously, or it was updated and their progress is now invalid.
          // Reset progress so they can reuse the new version, but the DB retains their 'completed_at' timestamp.
          setCompletedSteps(new Set());
          setCurrentStep(0);
          updatePlaybookProgress(user?.id || null, playbook.id, [], playbook.steps.length);
        } else {
          setCompletedSteps(new Set(prog.completed_steps));
        }
      }
    });

    // Check subscription status
    if (!hasLocalProAccess && user) {
      getProfile(user.id).then(profile => {
        if (profile) {
          const isPro = profile.subscription_status === 'pro';
          setIsProUser(isPro);
          if (isPro) localStorage.setItem('has_pro_access', 'true');
        }
      });
    }
  }, [playbook?.id, user?.id]);

  const handleToggleSave = async () => {
    if (!playbook) return;
    const success = await toggleSavedPlaybook(user?.id || null, playbook.id, isSaved);
    if (success) {
      setIsSaved(!isSaved);
    }
  };

  const handleRestartPlaybook = async () => {
    if (!playbook) return;
    if (window.confirm("Are you sure you want to restart this playbook? Your completed steps will be reset.")) {
      setCompletedSteps(new Set());
      setCurrentStep(0);
      setVariables({});
      await updatePlaybookProgress(user?.id || null, playbook.id, [], playbook.steps.length);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepComplete = async (stepIndex: number) => {
    if (!playbook) return;

    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepIndex);
    setCompletedSteps(newCompleted);

    // Persist to DB or localStorage
    await updatePlaybookProgress(user?.id || null, playbook.id, Array.from(newCompleted), playbook.steps.length);

    if (stepIndex < playbook.steps.length - 1) {
      setTimeout(() => {
        setCurrentStep(stepIndex + 1);
        stepRefs.current[stepIndex + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    } else {
      setShowCelebration(true);
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(prompt);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const handleShare = async () => {
    if (!playbook) return;
    if (!user) {
      toast.error("Please sign up or log in to share playbooks.");
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: playbook.title,
          text: playbook.subtitle,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error("Failed to share playbook");
      }
    }
  };
  // --- Render Loading / Not Found ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark"></div>
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center flex-col gap-4">
        <h2 className="text-2xl font-semibold text-brand-dark">Playbook not found</h2>
        <Link to="/playbooks" className="text-brand-blue hover:underline">Return to Library</Link>
      </div>
    );
  }

  const progress = (completedSteps.size / playbook.steps.length) * 100;
  const completionPercentage = Math.round(progress);
  const color = getCategoryColor(playbook.category);

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark font-sans overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-brand-dark text-white z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-brand-light/90 backdrop-blur-md border-b border-brand-dark/10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/playbooks">
                <button className="p-1.5 sm:p-2 hover:bg-white shadow-antigravity-md border border-brand-dark/10 rounded-full transition-colors">
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </Link>
              <div>
                <h1 className="font-semibold text-base sm:text-lg truncate max-w-[130px] sm:max-w-xs md:max-w-md">{playbook.title}</h1>
                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-brand-dark/70">
                  <span style={{ color }}>{playbook.category}</span>
                  <span>•</span>
                  <span>Step {currentStep + 1} of {playbook.steps.length}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Progress Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white shadow-antigravity-md border border-brand-dark/10 rounded-full">
                <div className="w-24 h-2 bg-slate-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-dark text-white transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs text-brand-dark/70">{completionPercentage}%</span>
              </div>

              <button
                onClick={handleToggleSave}
                className={`p-1.5 sm:p-2 rounded-full transition-colors ${isSaved ? 'text-brand-blue bg-brand-dark text-white' : 'hover:bg-white shadow-antigravity-md border border-brand-dark/10'}`}
              >
                <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${isSaved && 'fill-current'}`} />
              </button>

              <Link to="/workspace" className="p-1.5 sm:p-2 hover:bg-white shadow-antigravity-md border border-brand-dark/10 rounded-full transition-colors" title="My Progress">
                <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>

              <button
                onClick={handleShare}
                className="p-1.5 sm:p-2 hover:bg-white shadow-antigravity-md border border-brand-dark/10 rounded-full transition-colors"
                title="Share Playbook"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Step Navigation */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Overview Card */}
              <div className="bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-3xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-dark text-white/20 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-brand-dark/70">Time to complete</p>
                    <p className="font-semibold">{playbook.timeToComplete} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-brand-dark/70">You'll save</p>
                    <p className="font-semibold text-green-400">{playbook.timeSaved} minutes</p>
                  </div>
                </div>

                {completedSteps.size > 0 && (
                  <button
                    onClick={handleRestartPlaybook}
                    className="mt-6 w-full py-2 px-4 bg-brand-light border border-brand-dark/20 text-brand-dark text-sm rounded-xl font-medium hover:bg-white transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restart Playbook
                  </button>
                )}

                {/* Autopilot Button */}
                {playbook.agentAutomation && (
                  <button
                    onClick={() => setIsAutopilotModalOpen(true)}
                    className="mt-3 w-full py-2 px-4 bg-brand-dark text-white text-sm rounded-xl font-medium hover:bg-[#DA7756] transition-all flex items-center justify-center gap-2 shadow-antigravity-md"
                  >
                    <Bot className="w-4 h-4" />
                    Deploy Autopilot Agent
                  </button>
                )}
              </div>

              {/* Variable Configuration (Desktop Only) */}
              {extractedVariables.length > 0 && (
                <div className="hidden lg:block bg-white shadow-antigravity-md border border-brand-dark/10 rounded-3xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none" />
                  <h3 className="font-semibold mb-4 text-sm flex items-center gap-2 text-brand-dark">
                    <Settings className="w-4 h-4 text-brand-blue" />
                    Configure Prompt Variables
                  </h3>
                  <div className="space-y-4 relative z-10">
                    {extractedVariables.map(v => (
                      <div key={v}>
                        <label className="block text-xs font-medium text-brand-dark/70 mb-1.5">{v}</label>
                        <input
                          type="text"
                          placeholder={`Enter ${v.toLowerCase()}...`}
                          value={variables[v] || ''}
                          onChange={(e) => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-brand-light border border-brand-dark/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps List */}
              <div className="bg-white shadow-antigravity-md border border-brand-dark/10 border border-brand-dark/10 rounded-3xl p-4">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-brand-dark/70">Steps</h3>
                <div className="space-y-2">
                  {playbook.steps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => {
                        setCurrentStep(index);
                        stepRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-full text-left transition-all ${currentStep === index
                        ? 'bg-brand-dark shadow-antigravity-md border border-brand-dark/10'
                        : 'hover:bg-white shadow-antigravity-md border border-brand-dark/10'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${completedSteps.has(index)
                        ? 'bg-green-500 text-brand-dark'
                        : currentStep === index
                          ? 'bg-white text-brand-dark'
                          : 'bg-slate-50 text-brand-dark/70'
                        }`}>
                        {completedSteps.has(index) ? <CheckCircle2 className="w-4 h-4" /> : step.stepNumber}
                      </div>
                      <span className={`text-sm ${currentStep === index ? 'text-white font-medium' : 'text-brand-dark/70'}`}>
                        {step.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Before You Start */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-4">
                <h3 className="font-semibold mb-3 text-sm text-yellow-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Before You Start
                </h3>
                <ul className="space-y-2">
                  {playbook.beforeYouStart.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-yellow-900/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Header */}
              <motion.div variants={fadeInUp} className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="px-3 py-1 text-xs font-medium rounded-full"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {playbook.category}
                  </span>
                  <span className="px-3 py-1 bg-white shadow-antigravity-md border border-brand-dark/10 text-brand-dark/70 text-xs rounded-full">
                    {playbook.difficulty}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{playbook.title}</h1>
                <p className="text-base text-brand-dark/70 font-medium">{playbook.subtitle}</p>

                <div className="flex items-center gap-6 mt-6 text-sm text-brand-dark/70">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    {playbook.completionCount.toLocaleString()} completions
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {playbook.rating} rating
                  </span>
                </div>
              </motion.div>

              {/* Expected Outcome */}
              <motion.div
                variants={fadeInUp}
                className="bg-green-500/10 border border-green-500/20 rounded-3xl p-5 sm:p-6 mb-6"
              >
                <h3 className="font-semibold mb-2 text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  What You&apos;ll Have
                </h3>
                <p className="text-green-900/80 text-sm sm:text-base leading-relaxed break-words">{playbook.expectedOutcome}</p>
              </motion.div>

              {/* Steps or Pro Blur Paywall */}
              {playbook.isPro && !isProUser ? (
                <div className="relative mt-8">
                  {/* Blurred overlay CTA */}
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-16 rounded-3xl p-8 text-center" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255, 255, 255, 0.4)' }}>
                    <div className="w-16 h-16 bg-brand-dark text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-antigravity-lg mx-auto">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold text-brand-dark mb-4 drop-shadow-sm">Pro Playbook</h3>
                    <p className="text-brand-dark/80 mb-8 max-w-md font-medium text-lg drop-shadow-sm">
                      Upgrade to Pro to access this full playbook, premium prompt engineering, and 50+ other premium resources.
                    </p>
                    <button
                      onClick={handlePayment}
                      className="px-10 py-4 bg-[#635BFF] text-white rounded-full font-semibold text-lg shadow-antigravity-md hover:shadow-antigravity-lg hover:-translate-y-0.5 transition-all"
                    >
                      Unlock Pro Access
                    </button>
                  </div>

                  {/* Dummy visual steps for blur background */}
                  <div className="space-y-8 opacity-50 select-none pb-40 border-b-2 border-transparent">
                    {[1, 2].map((_, index) => (
                      <div key={index} className="p-8 rounded-3xl border bg-white shadow-antigravity-md border-brand-dark/10">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse" />
                          <div className="h-6 w-64 bg-slate-200 rounded animate-pulse" />
                        </div>
                        <div className="space-y-3 mb-8">
                          <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                          <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
                          <div className="h-4 w-4/6 bg-slate-100 rounded animate-pulse" />
                        </div>
                        <div className="h-32 w-full bg-slate-100 rounded-3xl animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div
                  className="space-y-8"
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                >

                  {/* Variable Configuration (Mobile Only) */}
                  {extractedVariables.length > 0 && (
                    <motion.div variants={fadeInUp} className="block lg:hidden bg-white shadow-antigravity-md border border-brand-dark/10 rounded-3xl p-5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none" />
                      <h3 className="font-semibold mb-4 text-sm flex items-center gap-2 text-brand-dark">
                        <Settings className="w-4 h-4 text-brand-blue" />
                        Configure Prompt Variables
                      </h3>
                      <div className="space-y-4 relative z-10">
                        {extractedVariables.map(v => (
                          <div key={v}>
                            <label className="block text-xs font-medium text-brand-dark/70 mb-1.5">{v}</label>
                            <input
                              type="text"
                              placeholder={`Enter ${v.toLowerCase()}...`}
                              value={variables[v] || ''}
                              onChange={(e) => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-brand-light border border-brand-dark/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {playbook.steps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      ref={el => { stepRefs.current[index] = el; }}
                      variants={fadeInUp}
                      className={`relative p-6 rounded-3xl border transition-all ${currentStep === index
                        ? 'bg-white shadow-antigravity-md border border-brand-dark/10 border-[#635BFF]/50'
                        : completedSteps.has(index)
                          ? 'bg-white/[0.02] border-brand-dark/10 opacity-60'
                          : 'bg-white/[0.02] border-brand-dark/10'
                        }`}
                    >
                      {/* Step Header */}
                      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 shrink-0 rounded-3xl flex items-center justify-center text-lg font-bold ${completedSteps.has(index)
                            ? 'bg-green-500 text-brand-dark'
                            : currentStep === index
                              ? 'bg-brand-dark text-white'
                              : 'bg-slate-50 text-brand-dark/70'
                            }`}>
                            {completedSteps.has(index) ? <CheckCircle2 className="w-6 h-6" /> : step.stepNumber}
                          </div>
                          <h2 className="text-lg sm:text-xl font-semibold leading-snug break-words min-w-0">{step.title}</h2>
                        </div>

                        {step.tools && (
                          <div className="flex flex-wrap gap-2 shrink-0">
                            {step.tools.map(tool => (
                              <span key={tool} className="px-2 py-1 bg-white shadow-antigravity-md border border-brand-dark/10 text-xs text-brand-dark/70 rounded whitespace-nowrap">
                                {tool}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Instruction */}
                      <p className="text-brand-dark/80 leading-relaxed mb-6 break-words">{step.instruction}</p>

                      {/* Prompt Template */}
                      {step.promptTemplate && (
                        <div className="mb-6">
                          <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-1 min-w-0">
                              <span className="text-sm font-semibold text-brand-dark flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-[#635BFF] shrink-0" />
                                Your Customized Prompt
                              </span>
                              <p className="text-xs text-brand-dark/60">
                                Copy this prompt and paste it into Claude.ai or ChatGPT. Fill in any variables first, then copy.
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopyPrompt(getInjectedPrompt(step.promptTemplate!))}
                              className="bg-brand-blue/10 px-3 py-2 rounded-full text-xs font-medium text-brand-blue hover:bg-brand-blue/20 flex items-center justify-center gap-1.5 transition-colors shrink-0 self-start sm:self-auto"
                            >
                              {copiedPrompt === getInjectedPrompt(step.promptTemplate!) ? (
                                <><Check className="w-3.5 h-3.5" /> Copied</>
                              ) : (
                                <><Copy className="w-3.5 h-3.5" /> Copy Prompt</>
                              )}
                            </button>
                          </div>
                          <div className="bg-brand-dark rounded-3xl overflow-hidden border border-brand-dark/10 relative group">
                            <pre className="p-4 sm:p-6 text-sm text-slate-300 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed">
                              {getInjectedPrompt(step.promptTemplate)}
                            </pre>
                          </div>
                          {(() => {
                            // Only show AI Copilot for steps with pure AI tools (no external dependencies) and not explicitly hidden
                            const aiOnlyTools = ['claude', 'chatgpt', 'perplexity', 'openai', 'gemini'];
                            const stepTools = step.tools || [];
                            const canSimulate = !step.hideCopilot && stepTools.length > 0 && stepTools.every(
                              (t: string) => aiOnlyTools.some(ai => t.toLowerCase().includes(ai))
                            );
                            return canSimulate ? (
                              <AgentCopilot prompt={getInjectedPrompt(step.promptTemplate)} tools={step.tools} />
                            ) : null;
                          })()}
                        </div>
                      )}

                      {/* Expected Output */}
                      {step.expectedOutput && (
                        <div className="mb-6 p-4 bg-white shadow-antigravity-md border border-brand-dark/10 rounded-2xl">
                          <p className="text-xs font-medium text-brand-dark/50 mb-1.5 uppercase tracking-wide">Expected result</p>
                          <p className="text-sm text-brand-dark/80 leading-relaxed break-words">{step.expectedOutput}</p>
                        </div>
                      )}

                      {/* Pro Tip */}
                      {step.tips && (
                        <div className="mb-6 flex gap-3 p-4 bg-brand-dark rounded-2xl border border-[#635BFF]/20">
                          <Lightbulb className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-white/80 leading-relaxed break-words">{step.tips}</p>
                        </div>
                      )}

                      {/* Complete Button */}
                      <button
                        onClick={() => handleStepComplete(index)}
                        disabled={completedSteps.has(index)}
                        className={`w-full py-3 rounded-full font-medium flex items-center justify-center gap-2 transition-all shadow-antigravity-xs ${completedSteps.has(index)
                          ? 'bg-green-500/20 text-green-700 cursor-default'
                          : 'bg-brand-dark text-white hover:bg-brand-dark/90'
                          }`}
                      >
                        {completedSteps.has(index) ? (
                          <><CheckCircle2 className="w-5 h-5" /> Step Completed</>
                        ) : (
                          <><CheckCircle2 className="w-5 h-5" /> Mark Step Complete</>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Agent Automation Alternative */}
              {playbook.agentAutomation && !(playbook.isPro && !isProUser) && (
                <motion.div variants={fadeInUp} className="mt-12 p-6 bg-white shadow-antigravity-md border border-brand-dark/10 rounded-3xl relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-brand-dark text-white rounded-xl shadow-antigravity-md flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-brand-dark">
                        Level Up: Automate with Agents
                      </h3>
                      <p className="text-brand-dark/70 text-sm mt-1">{playbook.agentAutomation.description}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-brand-dark/5">
                      <p className="text-xs uppercase tracking-wider font-semibold text-brand-dark/60 mb-3">Trigger</p>
                      <p className="text-sm font-medium text-brand-dark/80 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-brand-blue" />
                        {playbook.agentAutomation.trigger}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-brand-dark/5">
                      <p className="text-xs uppercase tracking-wider font-semibold text-brand-dark/60 mb-4">Agent Setup Guide</p>
                      <div className="space-y-6">
                        {playbook.agentAutomation.setupSteps.map((step, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-brand-dark text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-brand-dark text-sm mb-1">{step.title}</h4>
                              <p className="text-sm text-brand-dark/70 leading-relaxed">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-brand-dark/10 flex flex-wrap gap-2 items-center">
                      <p className="text-xs font-semibold text-brand-dark/60 mr-2">Suggested Stack:</p>
                      {playbook.agentAutomation.tools.map(tool => (
                        <span key={tool} className="px-3 py-1.5 bg-brand-dark/5 border border-brand-dark/10 text-brand-dark/80 text-xs font-medium rounded-full hover:bg-brand-dark/10 transition-colors cursor-pointer">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Webhook Executor (Renders only if config exists) */}
              {playbook.webhookConfig && !(playbook.isPro && !isProUser) && (
                <WebhookExecutor playbook={playbook} />
              )}

              {/* Troubleshooting */}
              {playbook.troubleshooting.length > 0 && (
                <motion.div variants={fadeInUp} className="mt-12">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-brand-dark/70" />
                    Troubleshooting
                  </h3>
                  <div className="space-y-3">
                    {playbook.troubleshooting.map((item, i) => (
                      <div key={i} className="bg-white shadow-antigravity-md border border-brand-dark/10 rounded-2xl p-6">
                        <p className="font-medium text-red-500 text-sm mb-1">Problem: {item.problem}</p>
                        <p className="text-brand-dark/70 text-sm">Solution: {item.solution}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Right Sidebar - Related & CTA */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Completion Card (shows when done) */}
              <AnimatePresence>
                {showCelebration && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white shadow-antigravity-lg border border-brand-dark/10 rounded-3xl p-6 text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-dark mb-1">Playbook Complete! 🎉</h3>
                    <p className="text-brand-dark/60 text-sm mb-5">
                      You just saved <span className="font-semibold text-emerald-600">{playbook.timeSaved} minutes</span> on this task.
                    </p>

                    {/* Star Rating */}
                    {!hasRated ? (
                      <div className="mb-5">
                        <p className="text-xs text-brand-dark/50 mb-2">How would you rate this playbook?</p>
                        <div className="flex items-center justify-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => { setUserRating(star); setHasRated(true); toast.success(`Thanks for rating! (${star}/5 stars)`); }}
                              className="p-0.5 transition-transform hover:scale-110"
                            >
                              <svg className={`w-7 h-7 transition-colors ${(hoverRating || userRating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-5 flex items-center justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} className={`w-5 h-5 ${userRating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <button
                        onClick={handleToggleSave}
                        className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${isSaved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-brand-dark text-white hover:bg-brand-dark/90'
                          }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved && 'fill-current'}`} />
                        {isSaved ? 'Saved to Stack' : 'Save to My Stack'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upgrade CTA (Restored to Right Sidebar) */}
              {!showCelebration && (
                <div className="bg-gradient-to-br from-white/10 to-white/5 border border-brand-dark/10 rounded-3xl p-4 shadow-antigravity-sm">
                  <h3 className="font-semibold mb-2 text-brand-dark">
                    {isProUser ? 'Pro Account Active' : 'Unlock 50+ Playbooks'}
                  </h3>
                  <p className="text-sm text-brand-dark/70 mb-4">
                    {isProUser
                      ? 'You have full access to all premium playbooks.'
                      : 'Get Pro access to all business playbooks and weekly new releases.'}
                  </p>

                  {!isProUser && (
                    <div className="flex items-center justify-between mb-4 bg-brand-dark/5 p-2 rounded-2xl border border-brand-dark/5">
                      <span className={`text-xs font-medium ${!isAnnual ? 'text-brand-dark' : 'text-slate-400'}`}>Monthly</span>
                      <button
                        onClick={() => setIsAnnual(!isAnnual)}
                        className="w-10 h-6 bg-brand-dark rounded-full p-1 relative transition-colors shadow-antigravity-xs mx-2"
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isAnnual ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                      <span className={`text-xs font-medium ${isAnnual ? 'text-brand-dark' : 'text-slate-400'}`}>Annually <span className="text-[10px] text-green-600 font-bold">-4%</span></span>
                    </div>
                  )}

                  <button
                    onClick={isProUser ? undefined : handlePayment}
                    disabled={isProUser}
                    className={`w-full py-2 rounded-full shadow-antigravity-md transition-all text-sm font-medium flex items-center justify-center gap-2 group ${isProUser
                      ? 'bg-brand-dark text-white cursor-default'
                      : 'bg-brand-dark text-white hover:shadow-antigravity-lg hover:bg-gray-800'
                      }`}
                  >
                    {isProUser ? (
                      <>
                        <Lightbulb className="w-4 h-4 text-green-400" />
                        <span>Pro Active</span>
                      </>
                    ) : (
                      <span>Upgrade to Pro ({isAnnual ? '$53.89/yr' : '$4.99/mo'})</span>
                    )}
                  </button>
                </div>
              )}

              {/* Related Playbooks / Next Up */}
              {nextUpPlaybooks.length > 0 && (
                <div className="bg-white shadow-antigravity-md border border-brand-dark/10 rounded-3xl p-4">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-brand-dark/70">
                    Next Up
                  </h3>
                  <div className="space-y-3">
                    {nextUpPlaybooks.map((related) => (
                      <Link key={related.id} to={`/playbooks/${related.slug}`}>
                        <div className="group p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
                          <p className="font-medium text-sm group-hover:text-brand-blue transition-colors">
                            {related.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                            <span>View playbook</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AutopilotModal
        isOpen={isAutopilotModalOpen}
        onClose={() => setIsAutopilotModalOpen(false)}
        playbook={playbook}
        variables={variables}
        userId={user?.id}
      />

      <AnimatePresence>
        {isAgentGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAgentGuideOpen(false)}
              className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-antigravity-lg overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button
                  onClick={() => setIsAgentGuideOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-brand-dark/40" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-brand-dark text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-antigravity-md">
                  <Bot className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold text-brand-dark mb-3">Autopilot Active</h2>
                <p className="text-brand-dark/60 mb-8 max-w-sm">
                  This playbook can be deployed as a 24/7 AI employee. You can still follow the steps manually, or let the agent handle it.
                </p>

                <div className="w-full space-y-4 mb-8">
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl text-left">
                    <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                    <p className="text-sm text-brand-dark/70 pt-1">Configure your prompt variables in the sidebar.</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl text-left">
                    <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                    <p className="text-sm text-brand-dark/70 pt-1">Click <strong>'Deploy Autopilot Agent'</strong> to set local news or daily schedules.</p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl text-left">
                    <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                    <p className="text-sm text-brand-dark/70 pt-1">Get generated reports delivered straight to your email.</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAgentGuideOpen(false)}
                  className="w-full py-4 bg-brand-dark text-white rounded-full font-semibold shadow-antigravity-md hover:bg-slate-800 transition-all"
                >
                  Got it, let's go
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
