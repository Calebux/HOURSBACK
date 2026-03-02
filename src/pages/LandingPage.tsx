import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Zap,
  Shield,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Users,
  Lock,
  Menu,
  X,
  ArrowRight,
  Lightbulb,
  Bot,
  CalendarClock,
  Mail,
  Sparkles,
  PauseCircle
} from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { pricingPlans } from '../data/playbooks';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { updateProfile } from '../lib/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false); // New state for auth modal
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin'); // New state for auth view
  const { user, signOut } = useAuth(); // Using AuthContext

  const heroRef = useRef<HTMLElement>(null); // Changed type from HTMLDivElement to HTMLElement

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-noise bg-brand-light text-brand-dark overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-brand-light/80 backdrop-blur-md border-b border-brand-dark/10' : ''
          }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Hoursback Logo"
              className="h-[52px] w-auto bg-[#F8F9FA]"
            />
          </Link>

          {/* Absolutely centered so links stay in the true middle regardless of logo width */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 text-sm text-brand-dark/80">
            <Link to="/playbooks" className="hover:text-brand-dark transition-colors">Playbooks</Link>
            <a href="#pricing" className="hover:text-brand-dark transition-colors">Pricing</a>
            <a href="#features" className="hover:text-brand-dark transition-colors">Features</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/workspace" className="hidden sm:block text-sm text-brand-dark/80 hover:text-brand-dark transition-colors">
              My Workspace
            </Link>

            {user ? (
              <button
                onClick={() => signOut()}
                className="hidden sm:block text-sm text-brand-dark/80 hover:text-brand-dark transition-colors"
              >
                Sign out
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setAuthView('signin'); setAuthModalOpen(true); }}
                  className="hidden sm:block text-sm text-brand-dark/80 hover:text-brand-dark transition-colors cursor-pointer"
                >
                  Sign in
                </button>
                <motion.button
                  onClick={() => { setAuthView('signup'); setAuthModalOpen(true); }}
                  className="hidden sm:block px-4 py-2 bg-brand-dark text-white rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get started
                </motion.button>
              </>
            )}

            <button
              className="md:hidden p-2 text-brand-dark/80 hover:text-brand-dark"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-brand-light/95 backdrop-blur-md border-t border-brand-dark/10"
          >
            <div className="px-6 py-4 space-y-4">
              <Link to="/playbooks" className="block text-brand-dark/80 hover:text-brand-dark transition-colors" onClick={() => setMobileMenuOpen(false)}>Playbooks</Link>
              <Link to="/dashboard" className="block text-brand-dark/80 hover:text-brand-dark transition-colors" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <a href="#pricing" className="block text-brand-dark/80 hover:text-brand-dark transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#features" className="block text-brand-dark/80 hover:text-brand-dark transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <button className="block w-full" onClick={() => { setAuthView('signup'); setAuthModalOpen(true); setMobileMenuOpen(false); }}> {/* Modified for AuthModal */}
                <button className="w-full px-4 py-2 bg-brand-dark text-white rounded-full text-sm font-medium">
                  Get started
                </button>
              </button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[90vh] flex flex-col justify-center pt-32 pb-20 bg-white glass-grid-line-x"
      >
        {/* Stripe Mural Background (User Provided Image) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-b-[40px] opacity-40">
          <img src="/mural2.png" alt="Animated Hero Mural" className="w-full h-full object-cover animate-float-slow" />
        </div>

        <div className="container mx-auto px-6 relative z-10 w-full glass-grid-line-y text-center flex flex-col items-center">
          <motion.div
            className="w-full max-w-4xl flex flex-col items-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Headline Group */}
            <div className="flex flex-col items-center mb-10">

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-7xl font-semibold tracking-tight text-brand-dark leading-[1.05] w-full"
              >
                Turn hours of busy work into<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-purple-500">
                  executed minutes.
                </span>
              </motion.h1>
            </div>

            {/* Subheadline & CTA */}
            <div className="flex flex-col items-center gap-10">
              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-brand-dark/70 leading-relaxed font-medium max-w-2xl text-center"
              >
                Turn any business workflow into an AI agent that runs on a schedule, delivers results to your inbox, and never forgets. Bookkeeping, outreach and financial analysis. All on autopilot.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <Link to="/playbooks">
                    <motion.button
                      className="px-6 py-3 bg-brand-dark text-white rounded-full font-medium hover:bg-brand-dark/90 transition-all shadow-antigravity-sm flex items-center justify-center gap-2 text-base group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Start building
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </Link>
                ) : (
                  <motion.button
                    onClick={() => { setAuthView('signup'); setAuthModalOpen(true); }}
                    className="px-6 py-3 bg-brand-dark text-white rounded-full font-medium hover:bg-brand-dark/90 transition-all shadow-antigravity-sm flex items-center justify-center gap-2 text-base group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                )}

                <motion.button
                  onClick={() => window.location.href = 'mailto:petersoncaleb275@gmail.com?subject=Sales%20Inquiry'}
                  className="px-6 py-3 bg-transparent text-brand-dark rounded-full font-medium hover:bg-brand-dark/5 transition-all flex items-center justify-center gap-2 text-base group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Contact sales
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Floating UI Elements Removed per user request */}

      </section>

      <HowItWorksSection />
      <AutopilotSection />
      <PlaybookPreviewSection />
      <FeaturesSection />
      <PricingSection onAuthRequired={() => { setAuthView('signup'); setAuthModalOpen(true); }} />
      <FAQSection />
      <CTASection />
      <Footer />
      {/* AuthModal component */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultView={authView}
      />
    </div>
  );
}


function AutopilotSection() {
  const features = [
    {
      icon: <CalendarClock className="w-5 h-5" />,
      title: 'Schedule once, runs forever',
      desc: 'Set any playbook to run daily, weekly, or monthly. The agent activates on schedule without you lifting a finger.'
    },
    {
      icon: <Bot className="w-5 h-5" />,
      title: 'AI does the full job',
      desc: 'The agent reads your configuration, executes every step, and produces a finished result — not a half-done draft.'
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: 'Results delivered to your inbox',
      desc: 'Every run lands in your email as a polished report. No dashboard to check, no tool to log into.'
    },
    {
      icon: <PauseCircle className="w-5 h-5" />,
      title: 'Pause, adjust, resume anytime',
      desc: 'Change the schedule, update the variables, or pause the agent at any time. Full control, zero friction.'
    }
  ];

  const mockRuns = [
    { name: 'Weekly Bookkeeping', status: 'Delivered', time: '08:00 AM', color: 'bg-emerald-400' },
    { name: 'Monthly P&L Snapshot', status: 'Running', time: '07:45 AM', color: 'bg-blue-400' },
    { name: 'Invoice Follow-ups', status: 'Queued', time: '09:00 AM', color: 'bg-amber-400' },
  ];

  return (
    <section className="py-32 bg-brand-dark text-white relative overflow-hidden">
      {/* Ambient glow accents */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Autopilot Agents
          </div>
          <h2 className="text-4xl md:text-6xl font-semibold mb-6 leading-tight max-w-3xl mx-auto">
            Set it once.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Your agent handles the rest.
            </span>
          </h2>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Schedule any playbook and your AI agent wakes up, does the full job, and drops the finished result in your inbox. Every day, while you sleep.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">

          {/* Left: Feature list */}
          <div className="space-y-8">
            {features.map((f, i) => (
              <div key={i} className="flex gap-5 group">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/30 group-hover:border-indigo-400/30 transition-all duration-300">
                  <span className="text-indigo-300">{f.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <Link to="/autopilot">
                <motion.button
                  className="px-6 py-3 bg-white text-brand-dark rounded-full font-medium flex items-center gap-2 text-sm group hover:bg-white/90 transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Set up your first agent
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Right: Mock agent dashboard card */}
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-2xl scale-95 pointer-events-none" />

            <div className="relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">

              {/* Card header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white/80">Autopilot Dashboard</span>
                </div>
                <span className="text-xs text-white/40">Today, 08:12 AM</span>
              </div>

              {/* Agent rows */}
              <div className="p-4 space-y-3">
                {mockRuns.map((run, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white/5 hover:bg-white/8 border border-white/8 rounded-2xl px-5 py-4 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${run.color} ${run.status === 'Running' ? 'animate-pulse' : ''}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{run.name}</p>
                        <p className="text-xs text-white/40">{run.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${run.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                      run.status === 'Running' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                      {run.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Email delivery preview */}
              <div className="mx-4 mb-4 bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-400/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-indigo-300" />
                  <span className="text-xs font-medium text-indigo-200">Delivered to your inbox</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  <span className="text-white/80 font-medium">Weekly Bookkeeping Report · </span>
                  14 transactions categorized, 2 flagged for review. Net expenses this week: ₦47,200. View full report →
                </p>
              </div>

              {/* Bottom stat strip */}
              <div className="border-t border-white/10 px-6 py-4 grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Agents active', value: '3' },
                  { label: 'Runs this month', value: '24' },
                  { label: 'Hours saved', value: '18 hrs' },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-lg font-bold text-white">{s.value}</p>
                    <p className="text-xs text-white/40">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Pick your pain point",
      description: "Choose from 50+ playbooks covering BD, finance, ops, and more. Each solves one specific business problem."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Follow the steps",
      description: "No guessing. Exact tools, exact prompts, exact clicks. Copy-paste ready instructions with screenshots."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Get results in minutes",
      description: "What used to take hours now takes 5-10 minutes. Track your time saved across your team."
    }
  ];

  return (
    <section className="py-32 bg-white text-brand-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">How it works</h2>
          <p className="text-xl text-brand-dark/80 max-w-2xl mx-auto">
            No courses to finish. No theory to learn. Just follow the playbook, get the outcome.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative p-8 rounded-3xl bg-gray-50 hover:bg-gray-100 transition-colors group">
              <div className="w-12 h-12 bg-brand-dark text-white rounded-3xl flex items-center justify-center text-brand-dark mb-6 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>
              <div className="absolute top-8 right-8 text-6xl font-bold text-gray-200">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-brand-dark/80 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlaybookPreviewSection() {
  const playbooks = [
    {
      category: "Business Development",
      title: "Account Research Brief",
      time: "5 min",
      saved: "40 min",
      difficulty: "Beginner",
      color: "#635BFF",
      preview: "Turn any company into a 1-page intelligence doc..."
    },
    {
      category: "Finance",
      title: "Expense Anomaly Detection",
      time: "10 min",
      saved: "2 hours",
      difficulty: "Intermediate",
      color: "#10B981",
      preview: "Find unusual spending patterns automatically..."
    },
    {
      category: "Operations",
      title: "Vendor Scorecard",
      time: "15 min",
      saved: "3 hours",
      difficulty: "Intermediate",
      color: "#F59E0B",
      preview: "Data-driven supplier evaluation in minutes..."
    }
  ];

  return (
    <section className="py-24 bg-white glass-grid-line-x relative overflow-hidden">
      {/* Blue lines background image */}
      <div className="absolute inset-0 z-0 opacity-50 mix-blend-multiply pointer-events-none flex items-end justify-center overflow-hidden">
        <img src="/blue-lines.jpg" alt="Abstract Lines" className="w-full object-cover object-bottom" />
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">Popular playbooks</h2>
          <p className="text-xl text-brand-dark/70 max-w-2xl mx-auto">
            Start with these proven workflows. New playbooks added weekly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {playbooks.map((playbook, i) => (
            <div
              key={i}
              className="group relative bg-white/60 backdrop-blur-xl shadow-antigravity-md border border-brand-dark/10 rounded-3xl p-6 hover:bg-slate-50 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${playbook.color}20 0%, transparent 50%)`,
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${playbook.color}20`, color: playbook.color }}
                  >
                    {playbook.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {playbook.time}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-2 group-hover:text-brand-blue transition-colors">
                  {playbook.title}
                </h3>

                <p className="text-brand-dark/70 text-sm mb-6 line-clamp-2">{playbook.preview}</p>

                <div className="flex items-center justify-between pt-4 border-t border-brand-dark/10">
                  <div className="flex items-center gap-2 text-sm text-brand-dark/70">
                    <Zap className="w-4 h-4 text-brand-blue" />
                    <span>Saves {playbook.saved}</span>
                  </div>
                  <span className="text-xs text-slate-400">{playbook.difficulty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/playbooks">
            <button className="text-brand-blue hover:text-brand-dark transition-colors flex items-center gap-2 mx-auto font-medium">
              Browse all 50+ playbooks
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <Lock className="w-6 h-6" />,
      title: "No code required",
      description: "Every playbook uses tools you already know: Excel, ChatGPT, Google Docs. If you can copy and paste, you can use this."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Built for teams",
      description: "Share playbooks across your team. Track who's using what. See collective time saved. Onboard new hires faster."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Always current",
      description: "AI tools change fast. We update playbooks when interfaces change. You're never stuck with outdated instructions."
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: "Autopilot agents",
      description: "Schedule any playbook to run automatically. Your AI agent executes every step and delivers a finished report to your inbox — no manual trigger needed."
    }
  ];

  return (
    <section id="features" className="py-32 bg-white text-brand-dark">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <div key={i} className="flex gap-6">
              <div className="w-12 h-12 bg-brand-dark text-white/10 rounded-3xl flex items-center justify-center text-brand-blue shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-brand-dark/80 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPlanCard({ plan, isAnnual, onAuthRequired }: { plan: any, isAnnual: boolean, onAuthRequired?: () => void }) {
  const { user } = useAuth();
  const isPro = localStorage.getItem('has_pro_access') === 'true';

  let amountRaw = isAnnual ? (plan.annualPrice || 0) * 12 : (plan.monthlyPrice || 0);
  const amountNGN = Math.floor(amountRaw * 1500); // Flutterwave amount in NGN directly

  const config = useMemo(() => ({
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
      user_id: user?.id || '',
    },
    customizations: {
      title: 'Hoursback Pro',
      description: `Upgrade to ${plan.name} Plan`,
      logo: 'https://i.ibb.co/L5hY5M0/logo.png', // Fallback remote logo URL
    },
  }), [amountNGN, user?.email, user?.id, user?.user_metadata?.name, plan.name]);

  const handleFlutterPayment = useFlutterwave(config);

  const handlePayment = () => {
    if (!user) {
      if (onAuthRequired) onAuthRequired();
      return;
    }

    try {
      handleFlutterPayment({
        callback: async (response) => {
          if (response.status === 'successful' || response.status === 'completed') {
            closePaymentModal();
            alert("Payment successful! Welcome to Pro.");
            localStorage.setItem('has_pro_access', 'true');
            if (user?.id) {
              try {
                await updateProfile(user.id, { subscription_status: 'pro' });
              } catch (err) {
                console.error("Failed to update profile", err);
              }
            }
            window.location.href = '/playbooks';
          } else {
            console.warn("Payment Fail/Incomplete:", response.status);
            alert("Payment failed or was incomplete. Please try again.");
            closePaymentModal();
          }
        },
        onClose: () => {
          console.log("Flutterwave modal closed");
        }
      });
    } catch (err) {
      console.error("CRITICAL: Error calling handleFlutterPayment:", err);
    }
  };

  return (
    <div
      className={`relative rounded-3xl p-8 ${plan.popular
        ? 'bg-brand-dark text-white shadow-antigravity-lg'
        : 'bg-white/60 backdrop-blur-xl shadow-antigravity-md border border-brand-dark/10 text-brand-dark'
        }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-white text-brand-blue text-xs font-semibold px-4 py-1 rounded-full shadow-sm">
            Most popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">
            {plan.price
              ? plan.price
              : plan.monthlyPrice === 0
                ? 'Free'
                : isAnnual
                  ? `$${plan.annualPrice}`
                  : `$${plan.monthlyPrice}`}
          </span>
          {!plan.price && plan.monthlyPrice !== 0 && (
            <span className={`text-sm ${plan.popular ? 'text-gray-300' : 'text-brand-dark/70'}`}>
              /month {isAnnual && <span className="text-xs opacity-70 block">billed annually</span>}
            </span>
          )}
        </div>
        <p className={`mt-2 text-sm h-10 ${plan.popular ? 'text-gray-300' : 'text-brand-dark/70'}`}>
          {plan.description}
        </p>
      </div>

      <ul className="space-y-4 mb-8">
        {plan.features.map((feature: string, j: number) => (
          <li key={j} className="flex items-start gap-3 text-sm">
            <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-brand-blue' : 'text-brand-blue'}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          if (plan.name === 'Enterprise' || plan.name === 'Custom Build') {
            window.location.href = 'mailto:petersoncaleb275@gmail.com?subject=Enterprise%20Inquiry';
          } else if (plan.name === 'Pro') {
            if (!isPro) handlePayment();
          } else {
            window.location.href = '#/playbooks';
          }
        }}
        disabled={plan.name === 'Pro' && isPro}
        className={`w-full py-3 rounded-full font-medium transition-all flex items-center justify-center gap-2 group ${plan.name === 'Pro' && isPro
          ? 'bg-brand-dark text-white cursor-default'
          : plan.popular
            ? 'bg-white text-brand-dark hover:bg-gray-100'
            : 'bg-white/60 backdrop-blur-md shadow-sm border border-brand-dark/10 hover:bg-white transition-all'
          }`}
      >
        {plan.name === 'Pro' && isPro ? (
          <>
            <Lightbulb className="w-5 h-5 text-green-400" />
            <span>Pro Active</span>
          </>
        ) : (
          <span>{plan.cta}</span>
        )}
      </button>
    </div>
  );
}

function PricingSection({ onAuthRequired }: { onAuthRequired?: () => void }) {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-32 bg-brand-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">Simple pricing</h2>
          <p className="text-xl text-brand-dark/70 max-w-2xl mx-auto mb-8">
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>

          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-brand-dark' : 'text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-8 bg-brand-dark rounded-full p-1 relative transition-colors shadow-antigravity-xs"
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? 'text-brand-dark' : 'text-slate-400'}`}>
              Annually <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Save 4%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.filter(p => p.name !== 'Enterprise').map((plan, i) => (
            <PricingPlanCard key={i} plan={plan} isAnnual={isAnnual} onAuthRequired={onAuthRequired} />
          ))}
        </div>
      </div>
    </section>
  );
}


function FAQSection() {
  const faqs = [
    {
      q: "Do I need to know how to code?",
      a: "No. Every playbook uses tools you already know: Excel, Google Docs, ChatGPT, and common business software. If you can copy and paste, you can complete any playbook."
    },
    {
      q: "How is this different from taking a course?",
      a: "Courses teach you about AI. We teach you to use AI for specific business outcomes. No theory, no homework. Follow the steps, get the result in 5-10 minutes."
    },
    {
      q: "What if the AI tool changes its interface?",
      a: "We monitor tool updates and refresh playbooks within 48 hours. Pro and Team subscribers get notified immediately when a playbook is updated."
    },
    {
      q: "Can I request a custom playbook?",
      a: "Team plans include custom playbook requests. Pro users can upvote playbook ideas in our community. We release 3-5 new playbooks weekly based on demand."
    }
  ];

  return (
    <section className="py-32 bg-white text-brand-dark">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-4xl font-semibold text-center mb-16">Frequently asked questions</h2>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
              <p className="text-brand-dark/80 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 bg-brand-light relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#635BFF]/10 to-transparent" />

      <div className="container mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-semibold mb-6">
          Ready to reclaim your time?
        </h2>
        <p className="text-xl text-brand-dark/70 mb-10 max-w-2xl mx-auto">
          Join 2,000+ professionals who've saved 10+ hours this month using AI playbooks.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/playbooks">
            <button className="px-8 py-4 bg-brand-dark text-white rounded-full shadow-antigravity-md hover:shadow-antigravity-lg font-medium text-lg hover:bg-gray-800 transition-all">
              Start free playbook
            </button>
          </Link>
          <button
            onClick={() => window.location.href = 'mailto:petersoncaleb275@gmail.com?subject=Sales%20Inquiry'}
            className="px-8 py-4 bg-white/60 backdrop-blur-xl shadow-antigravity-md border border-brand-dark/10 rounded-full font-medium text-lg hover:bg-slate-50 transition-colors"
          >
            Talk to sales
          </button>
        </div>

        <p className="text-slate-400 text-sm mt-6">
          Free forever plan available. No credit card required.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-brand-light border-t border-brand-dark/10 py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-dark text-white text-white rounded-full shadow-antigravity-md hover:shadow-antigravity-lg transition-all flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">Hoursback</span>
            </div>
            <p className="text-slate-400 text-sm">
              AI playbooks for business teams. No code, just results.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-brand-dark/70">
              <li><Link to="/playbooks" className="hover:text-brand-dark transition-colors">Playbooks</Link></li>
              <li><a href="#pricing" className="hover:text-brand-dark transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-brand-dark transition-colors">Enterprise</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-brand-dark/70">
              <li><a href="#" className="hover:text-brand-dark transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-brand-dark transition-colors">Guides</a></li>
              <li><a href="#" className="hover:text-brand-dark transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-brand-dark/70">
              <li><a href="#" className="hover:text-brand-dark transition-colors">About</a></li>
              <li><a href="#" className="hover:text-brand-dark transition-colors">Careers</a></li>
              <li><a href="mailto:petersoncaleb275@gmail.com?subject=Contact%20Inquiry" className="hover:text-brand-dark transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-brand-dark/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © 2024 Hoursback. All rights reserved.
          </p>
          <div className="flex gap-6 text-brand-dark/70">
            <a href="#" className="hover:text-brand-dark transition-colors">Twitter</a>
            <a href="#" className="hover:text-brand-dark transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-brand-dark transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
