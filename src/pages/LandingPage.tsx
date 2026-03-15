import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ContainerScroll } from '../components/ContainerScroll';
import {
  Clock,
  Zap,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Users,
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
import { Link, useNavigate } from 'react-router-dom';
import { pricingPlans } from '../data/playbooks';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { updateProfile } from '../lib/api';
import { toast } from 'sonner';

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

  const navigate = useNavigate();
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
              src="/logo.svg"
              alt="Hoursback Logo"
              className="h-[36px] w-auto"
            />
          </Link>

          {/* Absolutely centered so links stay in the true middle regardless of logo width */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 text-sm text-brand-dark/80">
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-brand-dark transition-colors cursor-pointer">How it works</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-brand-dark transition-colors cursor-pointer">Pricing</button>
            <button onClick={() => document.getElementById('example-workflows')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-brand-dark transition-colors cursor-pointer">Workflows</button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => { if (user) { navigate('/workflows'); } else { setAuthView('signup'); setAuthModalOpen(true); } }}
              className="hidden sm:block text-sm text-brand-dark/80 hover:text-brand-dark transition-colors cursor-pointer"
            >
              My Workflows
            </button>

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
                  className="hidden sm:block px-4 py-2 bg-brand-dark text-white rounded-full text-sm font-medium hover:bg-brand-dark/80 transition-colors"
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
              <button onClick={() => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block text-left text-brand-dark/80 hover:text-brand-dark transition-colors cursor-pointer">How it works</button>
              <button onClick={() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block text-left text-brand-dark/80 hover:text-brand-dark transition-colors cursor-pointer">Pricing</button>
              <button onClick={() => { document.getElementById('example-workflows')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block text-left text-brand-dark/80 hover:text-brand-dark transition-colors cursor-pointer">Workflows</button>
              {user ? (
                <button onClick={() => { navigate('/workflows'); setMobileMenuOpen(false); }} className="block text-left text-brand-dark/80 hover:text-brand-dark transition-colors cursor-pointer">My Workflows</button>
              ) : (
                <>
                  <button onClick={() => { setAuthView('signin'); setAuthModalOpen(true); setMobileMenuOpen(false); }} className="block text-left text-brand-dark/80 hover:text-brand-dark transition-colors cursor-pointer">Sign in</button>
                  <button onClick={() => { setAuthView('signup'); setAuthModalOpen(true); setMobileMenuOpen(false); }} className="w-full px-4 py-2 bg-brand-dark text-white rounded-full text-sm font-medium text-center">Get started</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative bg-white overflow-hidden">
        {/* Mural background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30">
          <img src="/mural2.png" alt="" className="w-full h-full object-cover animate-float-slow" />
        </div>

        {/* ── Static copy — always visible above the fold ── */}
        <motion.div
          className="relative z-10 pt-[212px] pb-6 flex flex-col items-center gap-4 text-center container mx-auto px-6"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-semibold tracking-tight text-brand-dark leading-[1.08] max-w-4xl"
          >
            Get hours back every week.{' '}
            <span style={{ color: '#4285F4' }}>
              Deploy AI workflows that monitor your business automatically.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-base md:text-lg text-brand-dark/70 leading-relaxed font-normal max-w-xl"
          >
            Deploy AI workflows that monitor your business data and send you clear insights automatically.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link to="/workflows/new">
                <motion.button
                  className="px-6 py-3 bg-brand-dark text-white rounded-full font-medium hover:bg-brand-dark/90 transition-all shadow-antigravity-sm flex items-center justify-center gap-2 text-base group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Deploy a Workflow
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
                Deploy a Workflow
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}
            <motion.button
              onClick={() => document.getElementById('example-workflows')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 border border-brand-dark/20 text-brand-dark rounded-full font-medium hover:bg-brand-dark/5 transition-all flex items-center justify-center gap-2 text-base group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              See Example Workflows
              <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </motion.button>
          </motion.div>

          <motion.p variants={fadeInUp} className="text-xs text-brand-dark/35 -mt-1">
            No setup headaches. Deploy in minutes.
          </motion.p>
        </motion.div>

        {/* ── Scroll-animated product card only ── */}
        <div className="relative z-10">
          <ContainerScroll className="!h-[38rem] md:!h-[50rem]" titleComponent={<></>}
          >
            {/* ── Product mockup inside the tilted card ── */}
            <div className="h-full w-full flex flex-col bg-brand-light rounded-xl overflow-hidden">
              {/* Mock nav bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-brand-dark/10 shrink-0">
                <img src="/logo.svg" alt="hoursback" className="h-5 w-auto" />
                <div className="flex gap-5 text-xs text-brand-dark/50">
                  <span className="text-brand-blue font-semibold">Playbooks</span>
                  <span>Workspace</span>
                  <span>Autopilot</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center text-[10px] text-white font-bold">C</div>
              </div>

              {/* Section label */}
              <div className="px-4 pt-3 pb-1 shrink-0">
                <p className="text-[10px] tracking-widest text-brand-dark/40 font-semibold uppercase">Your AI Playbooks</p>
              </div>

              {/* Playbook cards grid */}
              <div className="px-4 pb-4 grid grid-cols-3 gap-2.5 flex-1 overflow-hidden">
                {[
                  { title: 'Weekly CEO Briefing', desc: 'High-level synthesis of metrics across sales, finance, and operations.', outcome: 'Weekly executive summary', cat: 'Executive', time: 'Automated', steps: 3, badge: 'bg-blue-100 text-blue-700' },
                  { title: 'Sales Pipeline Health', desc: 'Alerts you to stalled deals and changes in probability.', outcome: 'At-risk pipeline alert', cat: 'Sales', time: 'Automated', steps: 4, badge: 'bg-green-100 text-green-700' },
                  { title: 'Competitor Intelligence', desc: 'Monitors competitor websites for pricing or feature changes.', outcome: 'Competitor movement alert', cat: 'Marketing', time: 'Automated', steps: 2, badge: 'bg-orange-100 text-orange-700' },
                  { title: 'AR Aging Monitor', desc: 'Notifies you when key clients go 30+ days overdue.', outcome: 'Late payment alert', cat: 'Finance', time: 'Automated', steps: 3, badge: 'bg-red-100 text-red-700' },
                  { title: 'Industry News Digest', desc: 'Curates top news from your specific niche and provides a summary.', outcome: 'Curated news briefing', cat: 'Research', time: 'Automated', steps: 3, badge: 'bg-purple-100 text-purple-700' },
                  { title: 'Supplier Price Tracker', desc: 'Monitors your core suppliers for unannounced price hikes.', outcome: 'Price hike alert', cat: 'Operations', time: 'Automated', steps: 2, badge: 'bg-yellow-100 text-yellow-700' },
                ].map((p, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-3 border border-brand-dark/8 flex flex-col gap-1 hover:border-brand-blue/40 hover:shadow-antigravity-sm transition-all"
                  >
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full w-fit ${p.badge}`}>{p.cat}</span>
                    <p className="text-[11px] font-semibold text-brand-dark leading-tight mt-0.5">{p.title}</p>
                    <p className="text-[9px] text-brand-dark/55 leading-snug">{p.desc}</p>
                    <div className="mt-1 px-1.5 py-1 bg-brand-light rounded-lg">
                      <p className="text-[8.5px] text-brand-dark/50 font-medium leading-snug">✦ {p.outcome}</p>
                    </div>
                    <p className="text-[9px] text-brand-dark/35 mt-auto pt-1">⏱ {p.time} · {p.steps} steps · Claude AI</p>
                  </div>
                ))}
              </div>

              {/* Bottom strip */}
              <div className="px-4 py-2 bg-white border-t border-brand-dark/10 flex items-center justify-between shrink-0">
                <span className="text-[10px] text-brand-dark/40">6 playbooks · AI Copilot on every step</span>
                <span className="text-[10px] text-brand-blue font-semibold">Explore all →</span>
              </div>
            </div>
          </ContainerScroll>
        </div>
      </section>

      <HowItWorksSection />
      <WhoIsItForSection />
      <WorkflowDiagramSection />
      <PlaybookPreviewSection />
      <AutopilotSection />
      <WhyHoursbackSection />
      <FeaturesSection />
      <SocialProofSection />
      <PricingSection onAuthRequired={() => { setAuthView('signup'); setAuthModalOpen(true); }} />
      <EnterpriseSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultView={authView}
      />
    </div>
  );
}

function EnterpriseSection() {
  const services = [
    {
      title: "Claude Migration workshop",
      price: "$2,500+",
      desc: "Stop playing LLMs on hard mode. We'll migrate your team from ChatGPT to Claude in one day, including memory imports and project setup.",
      features: ["On-site or remote workshop", "Team memory migration", "Initial Project structure setup"]
    },
    {
      title: "Custom Agent / SOP Mapping",
      price: "$5,000/mo",
      desc: "We interview your team, record your chaos, and turn your SOPs into autonomous Claude agents that run your business for you.",
      features: ["Workflow transcription", "Custom Skill creation", "Agentic process automation"]
    },
    {
      title: "Done-For-You Dashboard",
      price: "$10,000+",
      desc: "A custom interface that reacts to your business. We build the dashboards so you can manage your operations, not manually run them.",
      features: ["Custom React interfaces", "MCP integration builds", "End-to-end maintenance"]
    }
  ];

  return (
    <section id="enterprise" className="py-32 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-semibold mb-6 leading-tight max-w-4xl mx-auto">
            Scale your intelligence layer with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-purple-600">
              Done-For-You automation.
            </span>
          </h2>
          <p className="text-lg md:text-xl text-brand-dark/60 max-w-2xl mx-auto leading-relaxed">
            You don't need "AI consulting." You need autonomy. We build the systems that make your business run itself.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map((service, i) => (
            <div key={i} className="bg-gray-50 border border-gray-100 rounded-[32px] p-8 flex flex-col hover:shadow-antigravity-md transition-all group">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold mb-2">{service.title}</h3>
                <div className="text-brand-blue font-bold text-lg mb-4">{service.price}</div>
                <p className="text-brand-dark/70 text-sm leading-relaxed">{service.desc}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {service.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-brand-dark/80">
                    <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => window.location.href = `mailto:petersoncaleb275@gmail.com?subject=Inquiry:%20${encodeURIComponent(service.title)}`}
                className="w-full py-3 bg-brand-dark text-white rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group"
              >
                Inquire now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-20 p-10 bg-brand-dark rounded-[40px] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center md:text-left">
              <h3 className="text-3xl font-semibold mb-4">Migration as a Service (MaaS)</h3>
              <p className="text-white/60 text-lg">
                Still using personal ChatGPT accounts? Your team is playing LLMs on hard mode. We'll migrate your entire company context to Claude Projects and MCP in less than 48 hours.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = 'mailto:petersoncaleb275@gmail.com?subject=Migration%20Consulting'}
              className="px-8 py-4 bg-white text-brand-dark rounded-full font-bold text-lg shadow-xl"
            >
              Book 48h Migration
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}


function AutopilotSection() {
  const features = [
    {
      icon: <CalendarClock className="w-5 h-5" />,
      title: 'Set it up once, it runs itself',
      desc: 'Tell it how often to run — daily, weekly or monthly. After that, you never have to think about it again.'
    },
    {
      icon: <Bot className="w-5 h-5" />,
      title: 'AI completes the whole task, not just part of it',
      desc: 'The AI follows every single step in the playbook and gives you a finished, usable result. Not notes or suggestions. A completed task.'
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: 'Results land in your inbox every time',
      desc: 'Every time your agent runs, the finished report lands in your email. Open it, read it, use it. That is all.'
    },
    {
      icon: <PauseCircle className="w-5 h-5" />,
      title: 'You are always in control',
      desc: 'Need to change something? Update the settings, pause the agent, or switch it off whenever you like. It takes 10 seconds.'
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
          <h2 className="text-4xl md:text-6xl font-semibold mb-6 leading-tight max-w-3xl mx-auto">
            Set it up once.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Get insights forever.
            </span>
          </h2>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed font-normal">
            Deploy a workflow today and it runs every week without you touching it. Your business stays monitored while you focus on what actually matters.
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
              <Link to="/workflows/new">
                <motion.button
                  className="px-6 py-3 bg-white text-brand-dark rounded-full font-medium flex items-center gap-2 text-sm group hover:bg-white/90 transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Deploy your first workflow
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

function SocialProofSection() {
  const stats = [
    { value: '47+', label: 'Hours saved this week' },
    { value: '15+', label: 'Workflow templates' },
    { value: '500+', label: 'Workflows deployed' },
    { value: '98%', label: 'Email delivery rate' },
  ];

  const testimonials = [
    {
      quote: "I used to spend every Monday morning pulling reports manually. Now Hoursback does it while I sleep and my inbox has everything I need by 8am.",
      name: "Adaeze O.",
      role: "E-commerce Founder",
    },
    {
      quote: "The competitor price monitor alone is worth it. I caught a supplier price hike before it hit my margins and renegotiated the same week.",
      name: "Tunde B.",
      role: "Operations Manager",
    },
    {
      quote: "As a content creator, the YouTube Trend Tracker changed my strategy completely. I know what to make before the wave hits.",
      name: "Chiamaka N.",
      role: "Content Creator",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl font-bold text-brand-dark mb-1">{s.value}</p>
              <p className="text-sm text-brand-dark/50">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Users saved 47+ hours this week</h2>
          <p className="text-brand-dark/60">Real results from business owners who automated their repetitive work.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-brand-light rounded-3xl p-6 border border-brand-dark/10">
              <p className="text-brand-dark/80 leading-relaxed mb-6 text-sm">"{t.quote}"</p>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-brand-dark/50">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoIsItForSection() {
  const audience = [
    { icon: <BarChart3 className="w-5 h-5 text-brand-blue" />, title: 'Founders who track metrics in spreadsheets', desc: 'Stop manually pulling numbers. Get automated weekly reports from your Google Sheets.' },
    { icon: <Users className="w-5 h-5 text-brand-blue" />, title: 'Small teams without data analysts', desc: 'You don\'t need to hire an analyst. Hoursback does the monitoring and summarising for you.' },
    { icon: <CalendarClock className="w-5 h-5 text-brand-blue" />, title: 'Operators who run weekly reports', desc: 'Replace the copy-paste grind with a workflow that runs, analyzes, and emails — automatically.' },
    { icon: <Zap className="w-5 h-5 text-brand-blue" />, title: 'Non-technical teams that want automation', desc: 'If you can fill in a form, you can deploy a workflow. Zero code, zero setup headaches.' },
  ];

  return (
    <section className="py-24 bg-brand-light text-brand-dark">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Positioning line — prominent */}
        <div className="text-center mb-16">
          <p className="inline-block text-sm font-semibold text-brand-blue uppercase tracking-widest mb-4">What makes us different</p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 max-w-3xl mx-auto leading-tight">
            Hoursback doesn't just automate tasks —<br />
            <span style={{ color: '#4285F4' }}>it watches your systems and explains what changed.</span>
          </h2>
          <p className="text-brand-dark/60 max-w-xl mx-auto">Most tools run a job. Hoursback tells you why it matters.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Who it's for */}
          <div>
            <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest mb-6">Built for</p>
            <div className="space-y-4">
              {audience.map((a, i) => (
                <div key={i} className="flex gap-4 bg-white rounded-2xl p-5 border border-brand-dark/8 shadow-antigravity-sm">
                  <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">{a.icon}</div>
                  <div>
                    <p className="font-semibold text-sm leading-snug mb-1">{a.title}</p>
                    <p className="text-brand-dark/55 text-xs leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* No-code emphasis */}
          <div className="flex flex-col justify-center gap-6">
            <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest">Why teams choose Hoursback</p>
            {[
              { icon: '⚡', label: 'No coding required', sub: 'Deploy workflows with a simple form. No engineers needed.' },
              { icon: '⚡', label: 'Deploy in minutes', sub: 'Pick a workflow, connect your data, go live. Under 5 minutes.' },
              { icon: '⚡', label: 'Works with your existing tools', sub: 'Google Sheets, websites, spreadsheets — use what you already have.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <p className="font-semibold text-brand-dark">{item.label}</p>
                  <p className="text-sm text-brand-dark/55 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}

            <div className="mt-4 p-6 bg-brand-dark rounded-2xl text-white">
              <p className="text-sm font-semibold mb-1 text-white/60 uppercase tracking-wider text-xs">The result</p>
              <p className="text-white font-medium leading-relaxed">
                Your business stays monitored, you stay informed — without ever logging in, opening a spreadsheet, or writing a single line of code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowDiagramSection() {
  const steps = [
    { label: 'Connect Data', sub: 'Google Sheets, website, or text input', color: '#4285F4', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { label: 'Hoursback Detects Changes', sub: 'Monitors on your schedule — daily or weekly', color: '#8B5CF6', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    { label: 'AI Analyzes Data', sub: 'Claude reads, interprets, and extracts signals', color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    { label: 'Insight Sent to Inbox', sub: 'Clear summary email lands in your inbox', color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold mb-3">How the AI watches your business</h2>
          <p className="text-brand-dark/60">Four steps. Fully automatic. You only see the result.</p>
        </div>

        {/* Desktop: horizontal flow */}
        <div className="hidden md:flex items-center gap-0">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex-1 rounded-2xl p-5 border ${step.bg} ${step.border} text-center`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-3`} style={{ backgroundColor: step.color }}>
                  {i + 1}
                </div>
                <p className={`font-semibold text-sm ${step.text} mb-1`}>{step.label}</p>
                <p className="text-xs text-brand-dark/50 leading-snug">{step.sub}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="flex flex-col items-center px-2 shrink-0">
                  <div className="w-6 h-0.5 bg-brand-dark/20" />
                  <span className="text-brand-dark/30 text-xs mt-1">↓</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical flow */}
        <div className="md:hidden flex flex-col gap-0">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-full rounded-2xl p-5 border ${step.bg} ${step.border} flex items-start gap-4`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0`} style={{ backgroundColor: step.color }}>
                  {i + 1}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${step.text} mb-0.5`}>{step.label}</p>
                  <p className="text-xs text-brand-dark/50 leading-snug">{step.sub}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="text-brand-dark/30 text-xl py-1">↓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Connect your data",
      description: "Link your Google Sheets, website, or just type in what you want to track. No technical setup needed."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Deploy a workflow",
      description: "Pick from 15+ ready-made AI workflows. No code, no setup headaches. Live in under 5 minutes."
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Receive insights",
      description: "Your AI runs on schedule and sends clear summaries straight to your inbox — daily, weekly, or monthly."
    }
  ];

  return (
    <section id="how-it-works" className="py-32 bg-white text-brand-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">Automate the work you repeat every week</h2>
          <p className="text-xl text-brand-dark/60 max-w-2xl mx-auto font-normal">
            Three steps and your business runs on autopilot. No developers, no dashboards, no manual reports.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative p-8 rounded-3xl bg-gray-50 hover:bg-gray-100 transition-colors group">
              <div className="w-12 h-12 bg-brand-dark text-white rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>
              <div className="absolute top-8 right-8 text-6xl font-bold text-gray-200">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-brand-dark/70 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlaybookPreviewSection() {
  const workflows = [
    {
      category: "Finance",
      title: "Weekly Business Report",
      color: "#10B981",
      saved: "3 hours/week",
      bullets: [
        "Monitors your Google Sheets for key numbers",
        "Pulls revenue, expenses, and trends automatically",
        "Sends a weekly email with metrics, flags, and recommendations",
      ],
      result: "Clear weekly report every Monday morning"
    },
    {
      category: "Operations",
      title: "Website Change Monitor",
      color: "#635BFF",
      saved: "2 hours/week",
      bullets: [
        "Checks your website or competitor sites for changes",
        "Summarises exactly what's different since last check",
        "Alerts you immediately when something important shifts",
      ],
      result: "Instant alert when something changes"
    },
    {
      category: "Marketing",
      title: "Data Insight Generator",
      color: "#F59E0B",
      saved: "4 hours/week",
      bullets: [
        "Connects to any dataset you share",
        "Generates plain-English insights and key takeaways",
        "Delivers actionable summaries without touching spreadsheets",
      ],
      result: "Actionable insights without touching spreadsheets"
    }
  ];

  return (
    <section id="example-workflows" className="py-24 bg-white glass-grid-line-x relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-50 mix-blend-multiply pointer-events-none flex items-end justify-center overflow-hidden">
        <img src="/blue-lines.jpg" alt="" className="w-full object-cover object-bottom" />
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">Example Workflows</h2>
          <p className="text-xl text-brand-dark/70 max-w-2xl mx-auto font-normal">
            Deploy one of these today. Each workflow monitors your data and sends clear insights — automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {workflows.map((wf, i) => (
            <div
              key={i}
              className="group relative bg-white/60 backdrop-blur-xl shadow-antigravity-md border border-brand-dark/10 rounded-3xl p-6 hover:bg-slate-50 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(135deg, ${wf.color}18 0%, transparent 60%)` }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${wf.color}20`, color: wf.color }}
                  >
                    {wf.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Automated
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-4 group-hover:text-brand-blue transition-colors">
                  {wf.title}
                </h3>

                <ul className="space-y-2 mb-5">
                  {wf.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-brand-dark/70">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: wf.color }} />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-brand-dark/10">
                  <p className="text-xs font-medium text-brand-dark/50">
                    ✦ Result: <span className="text-brand-dark/80">{wf.result}</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-brand-dark/60">
                    <Zap className="w-3.5 h-3.5 text-brand-blue" />
                    Saves {wf.saved}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/workflows/new">
            <button className="text-brand-blue hover:text-brand-dark transition-colors flex items-center gap-2 mx-auto font-medium">
              Browse all 15+ workflows
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
      icon: <Zap className="w-6 h-6" />,
      title: "15+ ready-to-deploy workflows",
      description: "Finance, sales, marketing, operations — pick the workflows that match your business and deploy in minutes."
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Insights delivered by email",
      description: "No dashboards to log into. Results land in your inbox on your schedule — daily, weekly, or monthly."
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: "AI-powered analysis",
      description: "Powered by Claude AI to give you real insights, not just raw data dumps. Clear summaries you can act on."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Built for non-technical teams",
      description: "If you can write an email, you can deploy a workflow. Zero coding, no consultants, no setup headaches."
    }
  ];

  return (
    <section id="features" className="py-24 bg-brand-light text-brand-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-brand-dark mb-4">
            Everything you need to automate your business intelligence
          </h2>
          <p className="text-brand-dark/60 text-lg font-normal">
            Built for operators, not developers. Connect your data once and let AI do the rest.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <div key={i} className="flex gap-5 bg-white rounded-2xl p-6 border border-brand-dark/8 shadow-antigravity-sm">
              <div className="w-11 h-11 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-brand-dark/65 leading-relaxed text-sm font-normal">{feature.description}</p>
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
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: `hb_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    amount: amountNGN,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || '',
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
            toast.success("Payment successful! Welcome to Pro.");
            localStorage.setItem('has_pro_access', 'true');
            if (user?.id) {
              try {
                await updateProfile(user.id, { subscription_status: 'pro' });
              } catch (err) {
                console.error("Failed to update profile", err);
              }
            }
            window.location.href = '/workflows';
          } else {
            toast.error("Payment failed or was incomplete. Please try again.");
            closePaymentModal();
          }
        },
        onClose: () => {}
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
          if (plan.name === 'Custom') {
            window.location.href = 'mailto:petersoncaleb275@gmail.com?subject=Custom%20Plan%20Inquiry';
          } else if (plan.name === 'Pro') {
            if (!isPro) handlePayment();
          } else {
            window.location.href = '/workflows';
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
        ) : plan.name === 'Custom' ? (
          <span>Contact Us →</span>
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
          {pricingPlans.map((plan, i) => (
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
      q: "I have never used AI before. Can I still use this?",
      a: "Yes, absolutely. HoursBack is made for people who are completely new to AI. Every playbook tells you exactly what to type, word for word. You don't need to understand how AI works. You just follow the steps and get the result."
    },
    {
      q: "What is a playbook exactly?",
      a: "A playbook is a step-by-step guide that tells you exactly what to ask AI to get a business task done. Think of it like a recipe. You follow the instructions, the AI does the work, and you get a finished result at the end."
    },
    {
      q: "Do I need to pay for AI tools separately?",
      a: "Most playbooks work with Claude, which has a free tier you can start with. Some playbooks also work with ChatGPT. You don't need anything else. HoursBack gives you the prompts and the steps, you just need an AI account."
    },
    {
      q: "What kinds of tasks can I do with HoursBack?",
      a: "Right now you can use HoursBack for finance reports, sales outreach, marketing plans, competitor research, risk planning, loan preparation and more. New playbooks are added every week based on what users ask for."
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

function WhyHoursbackSection() {
  const painPoints = [
    "Manually pulling reports every Monday morning",
    "Checking competitor websites by hand",
    "Reviewing the same spreadsheets week after week",
    "Paying someone just to send you a weekly summary",
  ];
  const benefits = [
    "Save 2–5 hours every week",
    "Never miss a key business signal",
    "Get insights without hiring a data analyst",
    "Start in minutes, not months",
  ];

  return (
    <section className="py-24 bg-white text-brand-dark">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 leading-tight">
              Most business owners repeat the same tasks every week.
            </h2>
            <p className="text-brand-dark/60 mb-8 leading-relaxed">
              Manually pulling reports, checking websites, reviewing spreadsheets, tracking competitor updates. Hoursback automates all of it.
            </p>
            <ul className="space-y-3">
              {painPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-brand-dark/70 text-sm">
                  <span className="w-5 h-5 shrink-0 mt-0.5 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">✕</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-light rounded-3xl p-8 border border-brand-dark/10">
            <p className="text-sm font-semibold text-brand-dark/40 uppercase tracking-wider mb-6">With Hoursback</p>
            <ul className="space-y-4">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-brand-dark font-medium">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signup');

  return (
    <section className="py-32 bg-brand-light relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#635BFF]/10 to-transparent" />

      <div className="container mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-semibold mb-6">
          Start getting hours back today
        </h2>
        <p className="text-xl text-brand-dark/70 mb-10 max-w-2xl mx-auto font-normal">
          Deploy your first workflow free. No credit card required. Your business stays monitored while you focus on what actually matters.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <button
              onClick={() => navigate('/workflows/new')}
              className="px-8 py-4 bg-brand-dark text-white rounded-full shadow-antigravity-md hover:shadow-antigravity-lg font-medium text-lg hover:bg-gray-800 transition-all flex items-center gap-2 justify-center"
            >
              Deploy a Workflow
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => { setAuthView('signup'); setAuthModalOpen(true); }}
              className="px-8 py-4 bg-brand-dark text-white rounded-full shadow-antigravity-md hover:shadow-antigravity-lg font-medium text-lg hover:bg-gray-800 transition-all flex items-center gap-2 justify-center"
            >
              Deploy a Workflow
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white/60 backdrop-blur-xl shadow-antigravity-md border border-brand-dark/10 rounded-full font-medium text-lg hover:bg-slate-50 transition-colors"
          >
            See how it works
          </button>
        </div>

        <p className="text-slate-400 text-sm mt-6">
          Free forever plan available. No credit card required.
        </p>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultView={authView} />
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-brand-light border-t border-brand-dark/10 py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="mb-4">
              <img src="/logo.svg" alt="Hoursback" className="h-[30px] w-auto" />
            </div>
            <p className="text-slate-400 text-sm">
              Hoursback helps businesses automate repetitive workflows with AI so teams can focus on what actually matters.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-brand-dark/70">
              <li><Link to="/workflows/new" className="hover:text-brand-dark transition-colors">Browse Workflows</Link></li>
              <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-brand-dark transition-colors cursor-pointer">Pricing</button></li>
              <li><button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-brand-dark transition-colors cursor-pointer">How it works</button></li>
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
            © 2026 Hoursback. All rights reserved.
          </p>
          <div className="flex gap-6 text-brand-dark/70 text-sm flex-wrap justify-center">
            <Link to="/privacy" className="hover:text-brand-dark transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-brand-dark transition-colors">Terms of Service</Link>
            <a href="mailto:petersoncaleb275@gmail.com" className="hover:text-brand-dark transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
