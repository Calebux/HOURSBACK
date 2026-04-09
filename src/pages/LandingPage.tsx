import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Menu, X, Lightbulb,
  Clock, Zap, Mail, Bot, CalendarClock,
  BarChart3, Users, PauseCircle, Sparkles
} from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { pricingPlans } from '../data/playbooks';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { updateProfile } from '../lib/api';
import { toast } from 'sonner';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openSignup = () => { setAuthView('signup'); setAuthModalOpen(true); };
  const openSignin = () => { setAuthView('signin'); setAuthModalOpen(true); };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] overflow-x-hidden font-sans [&_h1]:font-display [&_h2]:font-display [&_h3]:font-display">

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md border-b border-black/8 shadow-sm' : 'bg-white'
      }`}>
        <div className="container mx-auto px-6 h-[64px] flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Hoursback" className="h-[32px] w-auto" />
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 text-sm text-[#202124]/70">
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#202124] transition-colors">How it works</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#202124] transition-colors">Pricing</button>
            <button onClick={() => document.getElementById('workflows')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#202124] transition-colors">Workflows</button>
            <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#202124] transition-colors">FAQ</button>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button onClick={() => navigate('/workflows')} className="hidden sm:block text-sm text-[#202124]/70 hover:text-[#202124] transition-colors">Dashboard</button>
                <button onClick={() => signOut()} className="hidden sm:block text-sm text-[#202124]/70 hover:text-[#202124] transition-colors">Sign out</button>
              </>
            ) : (
              <>
                <button onClick={openSignin} className="hidden sm:block text-sm text-[#202124]/70 hover:text-[#202124] transition-colors">Sign in</button>
                <button onClick={openSignup} className="hidden sm:block px-4 py-2 bg-[#202124] text-white rounded-full text-sm font-medium hover:bg-[#202124]/85 transition-colors">
                  Get started free
                </button>
              </>
            )}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-white border-t border-black/8">
            <div className="px-6 py-4 space-y-4 text-sm">
              <button onClick={() => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block text-[#202124]/70">How it works</button>
              <button onClick={() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block text-[#202124]/70">Pricing</button>
              <button onClick={() => { document.getElementById('workflows')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block text-[#202124]/70">Workflows</button>
              {user
                ? <button onClick={() => { navigate('/workflows'); setMobileMenuOpen(false); }} className="block text-[#202124]/70">Dashboard</button>
                : <button onClick={() => { openSignup(); setMobileMenuOpen(false); }} className="w-full py-2 bg-[#202124] text-white rounded-full font-medium">Get started</button>
              }
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── Hero ── */}
      <HeroSection onGetStarted={user ? () => navigate('/workflows/new') : openSignup} />

      {/* ── Logo Marquee ── */}
      <LogoMarquee />

      {/* ── About Bento ── */}
      <AboutBento />

      {/* ── How It Works ── */}
      <HowItWorksSection />

      {/* ── Sample Reports ── */}
      <SampleReportsSection />

      {/* ── Telegram Strip ── */}
      <TelegramStrip />

      {/* ── Who Is It For ── */}
      <WhoIsItForSection />

      {/* ── Autopilot ── */}
      <AutopilotSection />

      {/* ── Pricing ── */}
      <PricingSection onAuthRequired={openSignup} />

      {/* ── Testimonials ── */}
      <TestimonialsSection />

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── CTA Banner ── */}
      <CTABanner onGetStarted={user ? () => navigate('/workflows/new') : openSignup} />

      {/* ── Footer ── */}
      <Footer />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultView={authView} />
    </div>
  );
}

/* ─────────────────────────────── HERO ─────────────────────────────── */

const heroCards = [
  {
    dark: true,
    tag: 'Executive',
    title: 'CEO Briefing',
    meta: 'Delivered · 08:00 AM',
    badge: '✓ Done',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    bars: [60, 45, 80, 55, 90],
  },
  {
    dark: false,
    tag: 'Finance',
    title: '5-Line Profit Check',
    meta: 'Revenue ↑ 12% this week',
    badge: 'New',
    badgeColor: 'bg-[#4285F4]/10 text-[#4285F4]',
    bars: [35, 55, 45, 70, 60],
  },
  {
    dark: true,
    tag: 'Sales',
    title: 'Pipeline Health',
    meta: '4 deals at risk',
    badge: '⚠ Alert',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    bars: [80, 65, 50, 40, 30],
  },
  {
    dark: false,
    tag: 'Marketing',
    title: 'Competitor Intel',
    meta: '2 changes detected',
    badge: 'Running',
    badgeColor: 'bg-blue-100 text-blue-600',
    bars: [40, 60, 80, 55, 70],
  },
  {
    dark: true,
    tag: 'Operations',
    title: 'Supplier Tracker',
    meta: 'Price hike: Vendor A +15%',
    badge: '⚠ Alert',
    badgeColor: 'bg-red-500/20 text-red-300',
    bars: [50, 70, 45, 85, 60],
  },
  {
    dark: false,
    tag: 'Finance',
    title: 'AR Aging Monitor',
    meta: '3 invoices overdue 30d+',
    badge: 'Queued',
    badgeColor: 'bg-slate-100 text-slate-500',
    bars: [65, 40, 75, 50, 85],
  },
  {
    dark: true,
    tag: 'Research',
    title: 'Industry Digest',
    meta: '7 articles curated',
    badge: '✓ Done',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    bars: [55, 70, 60, 80, 45],
  },
  {
    dark: false,
    tag: 'Operations',
    title: 'Telegram Reconcile',
    meta: 'Variance: ₦0 · Balanced',
    badge: '✓ Done',
    badgeColor: 'bg-emerald-100 text-emerald-600',
    bars: [90, 75, 85, 70, 95],
  },
];


// Cards displayed in the hero fan — pick 5 representative ones
const fanCards = [heroCards[0], heroCards[2], heroCards[4], heroCards[1], heroCards[7]];
const fanTransforms = [
  'rotate(-12deg) translateY(40px) translateX(-20px) scale(0.88)',
  'rotate(-5deg) translateY(16px) translateX(-8px) scale(0.94)',
  'rotate(0deg) translateY(0px) translateX(0px) scale(1)',
  'rotate(5deg) translateY(16px) translateX(8px) scale(0.94)',
  'rotate(12deg) translateY(40px) translateX(20px) scale(0.88)',
];

function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative flex flex-col overflow-hidden pt-16" style={{ minHeight: '100vh' }}>
      {/* Sky background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-sky.jpg"
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-[#F8F9FA]" />
      </div>

      {/* Text block */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center container mx-auto px-6 pt-20 pb-0">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] max-w-3xl mx-auto"
          style={{ textShadow: '0 2px 32px rgba(0,0,0,0.35)' }}
        >
          Get hours back every week.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 text-base md:text-lg text-white/85 max-w-lg mx-auto leading-relaxed"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
        >
          Deploy AI workflows that monitor your business automatically — and deliver clear insights to your inbox.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 border-2 border-white/80 text-white rounded-full text-sm font-semibold hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            View demo
          </button>
          <button
            onClick={onGetStarted}
            className="px-6 py-3 bg-[#202124] text-white rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-[#202124]/85 transition-all group"
          >
            Get started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex items-center gap-2"
        >
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => <span key={i} className="text-[#FBBC04]">★</span>)}
          </div>
          <span className="text-white/75 text-xs font-medium" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>Loved by early customers ★★★★★</span>
        </motion.div>
      </div>

      {/* ── Fan of cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex items-end justify-center gap-0 pb-0 mt-10"
        style={{ perspective: '1200px' }}
      >
        {fanCards.map((card, i) => (
          <div
            key={i}
            className={`shrink-0 w-[180px] md:w-[210px] rounded-2xl p-4 border shadow-xl ${
              card.dark ? 'bg-[#202124] border-white/10' : 'bg-white border-black/10'
            }`}
            style={{ transform: fanTransforms[i], transformOrigin: 'bottom center', zIndex: i === 2 ? 10 : 5 - Math.abs(i - 2) }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                card.dark ? 'bg-white/10 text-white/50' : 'bg-[#F8F9FA] text-[#202124]/50'
              }`}>{card.tag}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${card.badgeColor}`}>{card.badge}</span>
            </div>
            <p className={`text-sm font-bold leading-snug mb-1 ${card.dark ? 'text-white' : 'text-[#202124]'}`}>{card.title}</p>
            <p className={`text-[11px] mb-3 ${card.dark ? 'text-white/40' : 'text-[#202124]/45'}`}>{card.meta}</p>
            <div className="flex items-end gap-0.5 h-8">
              {card.bars.map((h, j) => (
                <div key={j} className={`flex-1 rounded-sm ${card.dark ? 'bg-[#4285F4]/40' : 'bg-[#4285F4]/20'}`} style={{ height: `${h * 0.32}px` }} />
              ))}
            </div>
            <p className={`text-[10px] mt-2 ${card.dark ? 'text-white/25' : 'text-[#202124]/30'}`}>AI · Automated</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────── LOGO MARQUEE ─────────────────────────────── */
function LogoMarquee() {
  const logos = [
    { name: 'Google Sheets', dot: '#34A853' },
    { name: 'Claude AI', dot: '#D97706' },
    { name: 'OpenAI', dot: '#202124' },
    { name: 'Telegram', dot: '#0088cc' },
    { name: 'Excel', dot: '#217346' },
    { name: 'Notion', dot: '#202124' },
    { name: 'Gmail', dot: '#EA4335' },
    { name: 'WhatsApp', dot: '#25D366' },
    { name: 'Slack', dot: '#4A154B' },
    { name: 'Zapier', dot: '#FF4A00' },
  ];

  return (
    <div className="bg-white border-y border-black/8 py-5 overflow-hidden">
      <div className="flex gap-10 w-max animate-marquee">
        {[...logos, ...logos, ...logos].map((logo, i) => (
          <span key={i} className="text-sm font-medium text-[#202124]/40 shrink-0 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: logo.dot }} />
            {logo.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────── ABOUT BENTO ─────────────────────────────── */
function AboutBento() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#202124]/40 mb-4">+ About us</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#202124] leading-[1.1] max-w-3xl mx-auto">
            Business automation built for people who actually{' '}
            <span className="inline-flex items-center gap-1">
              <span className="bg-[#4285F4] text-white text-3xl md:text-4xl font-bold px-2 py-0 rounded-lg leading-tight">run</span>
            </span>{' '}
            businesses.
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-auto md:h-[380px]">
          {/* Card 1: Dark — photo + stat */}
          <div className="bg-[#202124] rounded-3xl p-6 flex flex-col justify-between row-span-1 md:row-span-1 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#4285F4]/20 rounded-full blur-2xl" />
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Workflows deployed</p>
            <div>
              <p className="text-6xl font-bold text-white leading-none">500+</p>
              <p className="text-white/50 text-sm mt-2">Running automatically, 24/7, without you touching them.</p>
            </div>
          </div>

          {/* Card 2: White — testimonial */}
          <div className="bg-[#F8F9FA] border border-black/8 rounded-3xl p-6 flex flex-col justify-between col-span-1 md:col-span-1">
            <div>
              <p className="text-xs font-semibold text-[#202124]/40 uppercase tracking-widest mb-2">Email delivery rate</p>
              <p className="text-5xl font-bold text-[#202124]">98%</p>
            </div>
            <div>
              <div className="flex -space-x-2 mb-3">
                {['#4285F4', '#DA7756', '#7c3aed'].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-bold" style={{ backgroundColor: c }}>
                    {['AO', 'TB', 'CN'][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#202124]/60 leading-relaxed">"The supplier monitor caught a 15% price hike the week it went live."</p>
            </div>
          </div>

          {/* Card 3: Yellow — big number */}
          <div className="bg-[#FBBC04] rounded-3xl p-6 flex flex-col justify-between col-span-2 md:col-span-1">
            <p className="text-[#202124]/60 text-xs font-semibold uppercase tracking-widest">Hours saved</p>
            <div>
              <p className="text-6xl font-bold text-[#202124] leading-none">1,000+</p>
              <p className="text-[#202124]/70 text-sm mt-2">Hours reclaimed by our users — no code required.</p>
            </div>
          </div>

          {/* Card 4: stat strip */}
          <div className="col-span-2 md:col-span-2 bg-[#F8F9FA] border border-black/8 rounded-3xl p-6 flex items-center justify-around gap-4">
            {[
              { value: '15+', label: 'Free templates' },
              { value: '5 min', label: 'Avg. setup time' },
              { value: '100%', label: 'No-code required' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-[#202124]">{s.value}</p>
                <p className="text-xs text-[#202124]/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Card 5: small dark */}
          <div className="hidden md:flex bg-[#202124] rounded-3xl p-6 flex-col justify-center">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Free plan</p>
            <p className="text-3xl font-bold text-white">Always</p>
            <p className="text-white/50 text-xs mt-1">No credit card needed</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── HOW IT WORKS ─────────────────────────────── */
function HowItWorksSection() {
  const [howActive, setHowActive] = useState(0);

  const howItWorksSteps = [
    {
      num: '01',
      title: 'Connect a data source',
      desc: 'Paste a Google Sheets URL, a website link, or connect via webhook. No API keys or technical setup — takes 30 seconds.',
      preview: (
        <div className="bg-white rounded-2xl border border-black/10 p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#202124]/40 uppercase tracking-widest mb-3">Data source</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['Google Sheets', 'Website URL', 'Webhook'].map((s, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${i === 0 ? 'bg-[#202124] text-white border-transparent' : 'border-black/15 text-[#202124]/50'}`}>{s}</span>
            ))}
          </div>
          <div className="bg-[#F8F9FA] rounded-xl p-3 flex items-center gap-2 mb-3">
            <div className="w-4 h-4 rounded bg-[#34A853] shrink-0" />
            <span className="text-sm text-[#202124]/60 font-mono truncate">docs.google.com/spreadsheets/d/1BxiMVs0X...</span>
          </div>
          <button className="w-full py-2.5 bg-[#4285F4] text-white rounded-xl text-sm font-semibold">Connect →</button>
        </div>
      ),
    },
    {
      num: '02',
      title: 'Pick a workflow template',
      desc: 'Choose from 15+ ready-made templates — finance, sales, competitor tracking, operations, and more. Or write your own prompt.',
      preview: (
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Weekly P&L', tag: 'Finance', bg: 'bg-[#4285F4]/8' },
            { name: 'Competitor Monitor', tag: 'Marketing', bg: 'bg-[#FBBC04]/10' },
            { name: 'Sales Pipeline', tag: 'Sales', bg: 'bg-emerald-50' },
            { name: 'Cash Reconcile', tag: 'Operations', bg: 'bg-purple-50' },
          ].map((w, i) => (
            <div key={i} className={`${w.bg} rounded-2xl p-4 border border-black/8 cursor-pointer hover:shadow-sm transition-shadow`}>
              <span className="text-[10px] font-semibold text-[#202124]/40 uppercase tracking-wider">{w.tag}</span>
              <p className="text-sm font-bold text-[#202124] mt-1">{w.name}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      num: '03',
      title: 'Set your schedule',
      desc: 'Choose daily, weekly, or monthly. Pick the time you want the report. The AI runs automatically — you never trigger it manually.',
      preview: (
        <div className="bg-white rounded-2xl border border-black/10 p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#202124]/40 uppercase tracking-widest mb-4">Delivery schedule</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['Daily', 'Weekly', 'Monthly'].map((s, i) => (
              <div key={i} className={`py-2 rounded-xl text-sm font-semibold text-center ${i === 1 ? 'bg-[#202124] text-white' : 'bg-[#F8F9FA] text-[#202124]/50'}`}>{s}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className={`py-1.5 rounded-lg text-xs font-semibold text-center ${i === 0 ? 'bg-[#4285F4] text-white' : 'bg-[#F8F9FA] text-[#202124]/35'}`}>{d}</div>
            ))}
          </div>
          <div className="flex items-center justify-between bg-[#F8F9FA] rounded-xl px-4 py-3">
            <span className="text-sm text-[#202124]/50">Send at</span>
            <span className="text-sm font-bold text-[#202124]">7:00 AM</span>
          </div>
        </div>
      ),
    },
    {
      num: '04',
      title: 'Receive insights in your inbox',
      desc: 'A clear, plain-English summary lands in your email every time the workflow runs. No dashboard to open, no data to decode.',
      preview: (
        <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-black/8 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-xs font-bold shrink-0">HB</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#202124]">Hoursback <span className="text-[#202124]/35 font-normal">· hoursback.xyz</span></p>
              <p className="text-[10px] text-[#202124]/40 truncate">Your Weekly Finance Report is ready</p>
            </div>
            <span className="ml-auto text-[10px] text-[#202124]/30 shrink-0">7:04 AM</span>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm font-bold text-[#202124]">Revenue this week: ₦284,000 <span className="text-emerald-600 text-xs font-semibold">+12%</span></p>
            <div className="space-y-2">
              {['2 transactions flagged for review', 'Top expense: Salaries — ₦145,000', '1 duplicate payment detected'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#202124]/60">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? 'bg-amber-400' : i === 2 ? 'bg-red-400' : 'bg-[#202124]/15'}`} />
                  {item}
                </div>
              ))}
            </div>
            <div className="bg-[#4285F4]/8 rounded-xl p-3 border-l-2 border-[#4285F4]">
              <p className="text-xs text-[#202124]/65 italic leading-relaxed">"At current burn rate, you have 3.2 months runway. Review the flagged vendor payment before closing your books."</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#F8F9FA]">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#202124]/40 mb-4">+ How it works</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#202124] leading-[1.1] max-w-2xl mx-auto">
            From data source to inbox in four steps
          </h2>
          <p className="mt-4 text-base text-[#202124]/60 max-w-xl mx-auto">No engineers, no dashboards, no maintenance — clear results on a schedule you choose.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: clickable steps */}
          <div className="space-y-2">
            {howItWorksSteps.map((step, i) => (
              <button
                key={i}
                onMouseEnter={() => setHowActive(i)}
                className={`w-full text-left rounded-2xl p-5 transition-all border ${
                  howActive === i ? 'bg-white border-black/10 shadow-sm' : 'border-transparent hover:bg-white/70'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`text-sm font-bold shrink-0 mt-0.5 tabular-nums ${howActive === i ? 'text-[#4285F4]' : 'text-[#202124]/25'}`}>{step.num}</span>
                  <div>
                    <p className={`font-bold text-sm mb-1 ${howActive === i ? 'text-[#202124]' : 'text-[#202124]/45'}`}>{step.title}</p>
                    {howActive === i && <p className="text-xs text-[#202124]/60 leading-relaxed">{step.desc}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: animated preview */}
          <div className="sticky top-28">
            <motion.div key={howActive} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
              {howItWorksSteps[howActive].preview}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── SAMPLE REPORTS ─────────────────────────────── */
function SampleReportsSection() {
  const [active, setActive] = useState(0);

  const reports = [
    {
      tab: 'Finance',
      subject: 'Your Weekly Finance Report',
      sent: 'Monday · 7:04 AM',
      preview: 'Revenue up 12%. 2 flagged transactions.',
      metrics: [
        { label: 'Revenue', value: '₦284,000', change: '+12%', up: true },
        { label: 'Expenses', value: '₦201,400', change: '+3%', up: false },
        { label: 'Net', value: '₦82,600', change: '+28%', up: true },
      ],
      flags: [
        { text: 'Unknown vendor — ₦45,000 (Oct 14)', color: 'bg-amber-400' },
        { text: 'Duplicate payment detected — ₦12,000', color: 'bg-red-400' },
      ],
      insight: '"At current burn rate, you have 3.2 months runway. Resolve the flagged vendor payment before end of week to close your books accurately."',
    },
    {
      tab: 'Operations',
      subject: 'Daily Reconciliation Complete',
      sent: 'Today · 8:12 AM',
      preview: '24 transactions processed. ₦0 variance.',
      metrics: [
        { label: 'Transactions', value: '24', change: 'All matched', up: true },
        { label: 'Variance', value: '₦0', change: 'Balanced ✓', up: true },
        { label: 'Handovers', value: '3', change: 'Logged', up: true },
      ],
      flags: [
        { text: 'Emeka opened shift — ₦45,000 float, 11 transactions', color: 'bg-emerald-400' },
        { text: 'Taiwo closed evening — balanced, no discrepancies', color: 'bg-emerald-400' },
      ],
      insight: '"No anomalies detected today. Cash position matches the opening balance. Business is running cleanly."',
    },
    {
      tab: 'Competitor',
      subject: 'Competitor Alert — Action Needed',
      sent: 'Today · 9:30 AM',
      preview: 'Competitor dropped prices 8% on your category.',
      metrics: [
        { label: 'Price changes', value: '3', change: 'This week', up: false },
        { label: 'Your gap', value: '−8%', change: 'Below market', up: false },
        { label: 'New listings', value: '2', change: 'Detected', up: false },
      ],
      flags: [
        { text: '"Hair Dryer Pro" dropped ₦18,500 → ₦17,000 on Jumia', color: 'bg-amber-400' },
        { text: 'New product: "Portable Blender X2" listed at ₦12,800', color: 'bg-blue-400' },
      ],
      insight: '"Jumia is undercutting on your top 2 SKUs. Consider matching the ₦17,000 price or emphasising free delivery to maintain conversion."',
    },
    {
      tab: 'Sales',
      subject: 'Sales Pipeline — 3 Deals at Risk',
      sent: 'Monday · 8:00 AM',
      preview: 'Pipeline ₦4.2M. 3 deals stalled 14+ days.',
      metrics: [
        { label: 'Pipeline', value: '₦4.2M', change: '12 active', up: true },
        { label: 'At risk', value: '3', change: '14+ days stale', up: false },
        { label: 'Win rate', value: '34%', change: 'This month', up: true },
      ],
      flags: [
        { text: 'Bolaji Enterprises — ₦850,000 · Last contact: 18 days ago', color: 'bg-red-400' },
        { text: 'Chukwu & Sons — ₦400,000 · Proposal sent, no response', color: 'bg-amber-400' },
      ],
      insight: '"Your highest-risk deal is Bolaji Enterprises. A follow-up call this week could recover ₦850,000 from your stalled pipeline."',
    },
  ];

  const r = reports[active];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#202124]/40 mb-4">+ Sample reports</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#202124] leading-[1.1] max-w-3xl mx-auto">
            See exactly what lands in your inbox
          </h2>
          <p className="mt-4 text-base text-[#202124]/60 max-w-xl mx-auto">
            Every workflow sends a plain-English email like this. Click a category to preview what you'd receive.
          </p>
        </div>

        <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start">
          {/* Left: tab list */}
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
            {reports.map((rep, i) => (
              <button
                key={i}
                onMouseEnter={() => setActive(i)}
                className={`shrink-0 md:w-full text-left rounded-2xl px-5 py-4 transition-all border ${
                  active === i ? 'bg-[#202124] text-white border-transparent' : 'bg-[#F8F9FA] border-transparent hover:bg-[#EBEBEB] text-[#202124]'
                }`}
              >
                <p className={`text-sm font-bold ${active === i ? 'text-white' : 'text-[#202124]'}`}>{rep.tab}</p>
                <p className={`text-xs mt-0.5 hidden md:block ${active === i ? 'text-white/45' : 'text-[#202124]/40'}`}>{rep.preview}</p>
              </button>
            ))}
          </div>

          {/* Right: email mock */}
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
            className="bg-white border border-black/10 rounded-3xl overflow-hidden shadow-lg"
          >
            {/* Email header */}
            <div className="px-6 py-4 border-b border-black/8 bg-[#F8F9FA]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-xs font-bold shrink-0">HB</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#202124]">Hoursback <span className="text-[#202124]/35 font-normal text-xs">· hoursback.xyz</span></p>
                    <span className="text-xs text-[#202124]/30 shrink-0">{r.sent}</span>
                  </div>
                  <p className="text-xs text-[#202124]/40">to: you@yourbusiness.com</p>
                </div>
              </div>
              <p className="text-base font-bold text-[#202124] mt-3">{r.subject}</p>
            </div>

            {/* Email body */}
            <div className="p-6 space-y-5">
              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-3">
                {r.metrics.map((m, i) => (
                  <div key={i} className="bg-[#F8F9FA] rounded-xl p-3">
                    <p className="text-[10px] text-[#202124]/40 uppercase tracking-wide mb-1">{m.label}</p>
                    <p className="text-sm font-bold text-[#202124]">{m.value}</p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${m.up ? 'text-emerald-600' : 'text-red-500'}`}>{m.change}</p>
                  </div>
                ))}
              </div>

              {/* Flags */}
              <div>
                <p className="text-[10px] font-semibold text-[#202124]/35 uppercase tracking-widest mb-2">Items to review</p>
                <div className="space-y-2">
                  {r.flags.map((flag, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[#F8F9FA] rounded-xl px-4 py-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${flag.color}`} />
                      <span className="text-xs text-[#202124]/65">{flag.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI insight */}
              <div className="bg-[#4285F4]/8 rounded-xl p-4 border-l-2 border-[#4285F4]">
                <p className="text-[10px] font-semibold text-[#4285F4] uppercase tracking-widest mb-1.5">AI Insight</p>
                <p className="text-xs text-[#202124]/65 leading-relaxed italic">{r.insight}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── TELEGRAM STRIP ─────────────────────────────── */
function TelegramStrip() {
  const commands = [
    { cmd: '/reconcile', desc: 'Daily cash count' },
    { cmd: '/assign',    desc: 'Task to a staff member' },
    { cmd: '/handover',  desc: 'End-of-shift log' },
    { cmd: '/restock',   desc: 'Draft a supplier order' },
    { cmd: '/escalate',  desc: 'Route an issue urgently' },
    { cmd: '/audit',     desc: 'Step-by-step stock count' },
  ];

  return (
    <section className="py-16 bg-white border-y border-black/8">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">

          {/* Left: headline */}
          <div className="shrink-0 lg:max-w-[300px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#0088cc] flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#0088cc]">Also on Telegram</p>
            </div>
            <h3 className="text-2xl font-bold text-[#202124] leading-snug">
              Your team types a command.<br />The bot handles the rest.
            </h3>
            <p className="mt-3 text-sm text-[#202124]/55 leading-relaxed">
              Staff use your Telegram bot directly from their phones — no logins, no dashboards, no training needed.
            </p>
          </div>

          {/* Right: command chips */}
          <div className="flex flex-wrap gap-2 flex-1">
            {commands.map((c) => (
              <div key={c.cmd} className="flex items-center gap-2.5 bg-[#F8F9FA] border border-black/8 rounded-xl px-3.5 py-2.5">
                <span className="font-mono text-sm font-bold text-[#0088cc]">{c.cmd}</span>
                <span className="text-xs text-[#202124]/40 hidden sm:block">— {c.desc}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 bg-[#F8F9FA] border border-dashed border-black/15 rounded-xl px-3.5 py-2.5">
              <span className="text-xs text-[#202124]/30 italic">+ more</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── PRICING CARD ─────────────────────────────── */
function PricingPlanCard({ plan, isAnnual, onAuthRequired }: { plan: any; isAnnual: boolean; onAuthRequired?: () => void }) {
  const { user } = useAuth();
  const isPro = localStorage.getItem('has_pro_access') === 'true';
  const [txRef] = useState(() => `hb_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`);

  const amountNGN = isAnnual ? (plan.annualPrice || 0) * 12 : (plan.monthlyPrice || 0);

  const config = useMemo(() => ({
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: txRef,
    amount: amountNGN,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: { email: user?.email || '', phone_number: '', name: user?.user_metadata?.name || '' },
    meta: { user_id: user?.id || '' },
    customizations: {
      title: 'Hoursback Pro',
      description: `Upgrade to ${plan.name} Plan`,
      logo: 'https://i.ibb.co/L5hY5M0/logo.png',
    },
  }), [amountNGN, user?.email, user?.id, user?.user_metadata?.name, plan.name, txRef]);

  const handleFlutterPayment = useFlutterwave(config);

  const handlePayment = () => {
    if (!user) { if (onAuthRequired) onAuthRequired(); return; }
    try {
      handleFlutterPayment({
        callback: async (response) => {
          if (response.status === 'successful' || response.status === 'completed') {
            closePaymentModal();
            toast.success('Payment successful! Welcome to Pro.');
            localStorage.setItem('has_pro_access', 'true');
            if (user?.id) {
              try { await updateProfile(user.id, { subscription_status: 'pro' }); }
              catch (err) { console.error('Failed to update profile', err); }
            }
            window.location.href = '/workflows';
          } else {
            toast.error('Payment failed or was incomplete. Please try again.');
            closePaymentModal();
          }
        },
        onClose: () => {},
      });
    } catch (err) { console.error('Error calling handleFlutterPayment:', err); }
  };

  return (
    <div className={`relative rounded-3xl p-8 border flex flex-col ${
      plan.popular
        ? 'bg-[#202124] text-white border-transparent'
        : 'bg-white text-[#202124] border-black/10'
    }`}>
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-[#4285F4] text-white text-[11px] font-semibold px-4 py-1 rounded-full">Most popular</span>
        </div>
      )}

      {/* Plan label */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${plan.popular ? 'bg-[#FBBC04]' : 'bg-[#F8F9FA]'}`}>
          <span className="text-[10px]">✦</span>
        </div>
        <p className={`text-xs font-semibold uppercase tracking-widest ${plan.popular ? 'text-white/50' : 'text-[#202124]/50'}`}>
          {plan.name} plan
        </p>
      </div>

      {/* Price */}
      <div className="mb-2">
        <span className="text-4xl font-bold">
          {plan.price
            ? plan.price
            : plan.monthlyPrice === 0
              ? 'Free'
              : `₦${(isAnnual ? plan.annualPrice : plan.monthlyPrice).toLocaleString('en-NG')}`}
        </span>
        {!plan.price && plan.monthlyPrice !== 0 && (
          <span className={`text-sm ml-1 ${plan.popular ? 'text-white/50' : 'text-[#202124]/50'}`}>/month</span>
        )}
      </div>
      {!plan.price && plan.monthlyPrice !== 0 && isAnnual && (
        <p className={`text-xs mb-1 -mt-1 ${plan.popular ? 'text-white/40' : 'text-[#202124]/40'}`}>
          ₦{(plan.annualPrice * 12).toLocaleString('en-NG')} billed annually
        </p>
      )}
      <p className={`text-sm mb-8 min-h-[40px] ${plan.popular ? 'text-white/60' : 'text-[#202124]/60'}`}>{plan.description}</p>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f: string, j: number) => (
          <li key={j} className="flex items-start gap-3 text-sm">
            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-[#4285F4]' : 'text-[#4285F4]'}`} />
            <span className={plan.popular ? 'text-white/80' : 'text-[#202124]/80'}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => {
          if (plan.name === 'Custom') { window.location.href = 'mailto:petersoncaleb275@gmail.com?subject=Custom%20Plan%20Inquiry'; }
          else if (plan.name === 'Pro') { if (!isPro) handlePayment(); }
          else { window.location.href = '/workflows'; }
        }}
        disabled={plan.name === 'Pro' && isPro}
        className={`w-full py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all group ${
          plan.name === 'Pro' && isPro
            ? 'bg-[#202124] text-white cursor-default'
            : plan.popular
              ? 'bg-white text-[#202124] hover:bg-white/90'
              : 'bg-[#202124] text-white hover:bg-[#202124]/85'
        }`}
      >
        {plan.name === 'Pro' && isPro ? (
          <><Lightbulb className="w-4 h-4 text-green-400" /><span>Pro Active</span></>
        ) : plan.name === 'Custom' ? (
          <span>Contact us →</span>
        ) : (
          <span>{plan.cta} <ArrowRight className="inline w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" /></span>
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────────── PRICING SECTION ─────────────────────────────── */
function PricingSection({ onAuthRequired }: { onAuthRequired?: () => void }) {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-[#F8F9FA]">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#202124]/40 mb-4">+ Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#202124] leading-[1.1] max-w-3xl mx-auto">
            Flexible plans built for every stage of growth
          </h2>
          <p className="mt-4 text-base text-[#202124]/60 max-w-lg mx-auto">Start free, upgrade when you're ready. Cancel anytime.</p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-[#202124]' : 'text-[#202124]/40'}`}>Monthly</span>
            <button onClick={() => setIsAnnual(!isAnnual)} className="w-12 h-7 bg-[#202124] rounded-full p-1 relative transition-colors">
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-2 ${isAnnual ? 'text-[#202124]' : 'text-[#202124]/40'}`}>
              Annually <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pricingPlans.map((plan, i) => (
            <PricingPlanCard key={i} plan={plan} isAnnual={isAnnual} onAuthRequired={onAuthRequired} />
          ))}
        </div>

        {/* ── Feature comparison table ── */}
        <div className="mt-16">
          <h3 className="text-center text-lg font-semibold text-[#202124] mb-8">Everything that's included — side by side</h3>
          <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_100px] border-b border-black/8">
              <div className="px-6 py-4 text-sm font-semibold text-[#202124]/50">Feature</div>
              <div className="px-4 py-4 text-center text-sm font-semibold text-[#202124]">Free</div>
              <div className="px-4 py-4 text-center text-sm font-bold text-[#202124] bg-[#202124]/[0.03]">Pro</div>
            </div>

            {[
              { label: 'Active workflows', free: '1', pro: 'Unlimited' },
              { label: 'AI report credits / month', free: '5', pro: 'Unlimited' },
              { label: 'Email delivery', free: true, pro: true },
              { label: 'Telegram bot commands', free: false, pro: true },
              { label: 'Scheduled auto-runs', free: false, pro: true },
              { label: 'Custom data sources', free: false, pro: true },
              { label: 'Upload files (CSV, PDF, images)', free: false, pro: true },
              { label: 'Competitor & supplier monitoring', free: false, pro: true },
              { label: 'Multi-step workflows', free: false, pro: true },
              { label: 'Priority email support', free: false, pro: true },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-[1fr_100px_100px] border-b border-black/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-[#F8F9FA]/60'}`}>
                <div className="px-6 py-3.5 text-sm text-[#202124]/80">{row.label}</div>
                <div className="px-4 py-3.5 text-center">
                  {typeof row.free === 'boolean' ? (
                    row.free
                      ? <span className="text-emerald-600 font-bold">✓</span>
                      : <span className="text-[#202124]/20 text-lg leading-none">—</span>
                  ) : (
                    <span className="text-sm font-medium text-[#202124]/70">{row.free}</span>
                  )}
                </div>
                <div className="px-4 py-3.5 text-center bg-[#202124]/[0.03]">
                  {typeof row.pro === 'boolean' ? (
                    row.pro
                      ? <span className="text-emerald-600 font-bold">✓</span>
                      : <span className="text-[#202124]/20 text-lg leading-none">—</span>
                  ) : (
                    <span className="text-sm font-semibold text-[#202124]">{row.pro}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── TESTIMONIALS ─────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [
    { quote: "I used to spend 3–4 hours every Monday pulling reports manually. Now Hoursback does it while I sleep.", name: "Adaeze O.", role: "E-commerce Founder", avatar: "AO", color: "#4285F4" },
    { quote: "The supplier monitor caught a 15% price hike the same week it went live. Saved me more than a year of the subscription.", name: "Tunde B.", role: "Operations Manager", avatar: "TB", color: "#DA7756" },
    { quote: "My team uses the Telegram bot for daily cash reconciliation. Results emailed to me every morning without any manual work.", name: "Emeka F.", role: "Retail Business Owner", avatar: "EF", color: "#059669" },
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#202124]/40 mb-4">+ Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#202124] leading-[1.1]">What they say about us</h2>
          <p className="text-[#202124]/60 text-sm mt-3 max-w-md mx-auto">Real results from real business owners — no code required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-3xl overflow-hidden bg-[#F8F9FA] border border-black/8"
            >
              <div className="p-6 flex flex-col justify-between min-h-[280px]">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs mb-auto" style={{ backgroundColor: t.color }}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-[#202124]/15 text-5xl font-serif leading-none mb-2">"</p>
                  <p className="text-[#202124]/75 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                  <div className="pt-4 border-t border-black/8">
                    <p className="text-[#202124] font-semibold text-sm">— {t.name}</p>
                    <p className="text-[#202124]/45 text-xs">{t.role}</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#059669"/><path d="M3 5l1.5 1.5L7 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Verified customer
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── WORKFLOWS ─────────────────────────────── */
/* ─────────────────────────────── FAQ ─────────────────────────────── */
function FAQSection() {
  const faqs = [
    { q: "Do I need to know how to code?", a: "No. If you can fill in a form, you can deploy a workflow. Pick a template, connect your data source, set your schedule — live in under 5 minutes." },
    { q: "What does Hoursback actually monitor?", a: "Google Sheets, websites, CRM data, financial spreadsheets, competitor pages, and any data you connect via webhook. The AI detects what changed and sends you a clear summary by email." },
    { q: "How often does the AI run?", a: "You choose — daily, weekly, or monthly. Once deployed, the workflow runs on that schedule automatically. The report just arrives in your inbox." },
    { q: "What kinds of workflows are available?", a: "Finance metrics, sales pipelines, competitor websites, spreadsheet data, industry news, supplier prices, and more. 15+ ready-made workflows across multiple categories." },
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#202124]/40 mb-4">+ FAQ</p>
          <h2 className="text-4xl font-bold tracking-tight text-[#202124]">Frequently asked questions</h2>
        </div>
        <div className="space-y-0 border border-black/10 rounded-3xl overflow-hidden">
          {faqs.map((faq, i) => (
            <div key={i} className={`p-7 ${i < faqs.length - 1 ? 'border-b border-black/8' : ''}`}>
              <h3 className="font-bold text-[#202124] mb-2">{faq.q}</h3>
              <p className="text-[#202124]/65 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── CTA BANNER ─────────────────────────────── */
function CTABanner({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative overflow-hidden mx-4 md:mx-8 mb-8 rounded-3xl min-h-[340px] flex items-center">
      <img src="/mural.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[#202124]/65" />

      <div className="relative z-10 container mx-auto px-10 py-16">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex -space-x-2">
            {['#4285F4', '#DA7756', '#7c3aed'].map((c, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-bold" style={{ backgroundColor: c }}>
                {['AO', 'TB', 'CN'][i]}
              </div>
            ))}
          </div>
          <span className="text-white/70 text-sm">Trusted by 500+ users</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white max-w-xl leading-[1.1] mb-4">
          We combine human insight with artificial intelligence
        </h2>
        <p className="text-white/65 max-w-lg leading-relaxed mb-8 text-sm">
          Our platform bridges strategic thinking and AI to help businesses streamline processes, improve decision-making, and create intelligent digital experiences.
        </p>

        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FBBC04] text-[#202124] rounded-full font-bold text-sm hover:bg-[#FBBC04]/90 transition-colors"
        >
          Get started <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

/* ─────────────────────────────── FOOTER ─────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#202124] text-white">
      <div className="container mx-auto px-6 pt-14 pb-8">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <img src="/logo.svg" alt="Hoursback" className="h-[28px] w-auto mb-4 brightness-0 invert" />
            <p className="text-white/45 text-sm leading-relaxed">
              AI workflows that monitor your business and deliver clear insights to your inbox — automatically, on a schedule you choose.
            </p>
            <div className="mt-6">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/15 rounded-full text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
                />
                <button className="px-4 py-2 bg-white text-[#202124] rounded-full text-xs font-bold hover:bg-white/90 transition-colors flex items-center gap-1">
                  Submit <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">How it works</button></li>
              <li><Link to="/workflows/new" className="hover:text-white transition-colors">Browse workflows</Link></li>
              <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Pricing</button></li>
              <li><Link to="/quiz" className="hover:text-white transition-colors">Workflow quiz</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><Link to="/trust" className="hover:text-white transition-colors">Trust &amp; Security</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><a href="mailto:petersoncaleb275@gmail.com" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><Link to="/vs-zapier" className="hover:text-white transition-colors">vs Zapier</Link></li>
              <li><Link to="/vs-make" className="hover:text-white transition-colors">vs Make</Link></li>
              <li><Link to="/case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-white/35 text-sm">
          <p>© 2026 Hoursback. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────── PLAYBOOK PREVIEW ─────────────────────────────── */
function WhoIsItForSection() {
  const audience = [
    { icon: <BarChart3 className="w-5 h-5 text-[#4285F4]" />, title: 'Founders tracking metrics in spreadsheets', desc: 'Stop manually pulling numbers. Get automated weekly reports straight from your Google Sheets.' },
    { icon: <Users className="w-5 h-5 text-[#4285F4]" />, title: 'Small teams without data analysts', desc: "You don't need to hire an analyst. Hoursback monitors and summarises everything for you." },
    { icon: <CalendarClock className="w-5 h-5 text-[#4285F4]" />, title: 'Operators running weekly reports', desc: 'Replace the copy-paste grind with a workflow that runs, analyses, and emails — automatically.' },
    { icon: <Zap className="w-5 h-5 text-[#4285F4]" />, title: 'Non-technical teams that want automation', desc: 'If you can fill in a form, you can deploy a workflow. Zero code, zero setup headaches.' },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#202124]/40 mb-4">+ Built for</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#202124] leading-[1.1] max-w-3xl mx-auto">
            Made for the people who actually run businesses
          </h2>
          <p className="mt-4 text-base text-[#202124]/60 max-w-xl mx-auto">
            Hoursback doesn't just automate tasks — it watches your systems and explains what changed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {audience.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex gap-4 bg-[#F8F9FA] rounded-3xl p-6 border border-black/8"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#4285F4]/10 flex items-center justify-center shrink-0">{a.icon}</div>
              <div>
                <p className="font-bold text-[#202124] text-sm leading-snug mb-1">{a.title}</p>
                <p className="text-[#202124]/55 text-xs leading-relaxed">{a.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom highlight strip */}
        <div className="bg-[#202124] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-white font-medium text-base max-w-lg leading-relaxed">
            Your business stays monitored, you stay informed — without logging in, opening a spreadsheet, or writing a single line of code.
          </p>
          <div className="flex gap-6 shrink-0 text-center">
            {[{ v: 'No code', s: 'required' }, { v: '5 min', s: 'to deploy' }, { v: '24/7', s: 'monitoring' }].map((s, i) => (
              <div key={i}>
                <p className="text-2xl font-bold text-white">{s.v}</p>
                <p className="text-white/45 text-xs mt-0.5">{s.s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── AUTOPILOT ─────────────────────────────── */
function AutopilotSection() {
  const features = [
    { icon: <CalendarClock className="w-5 h-5" />, title: 'Set it up once, it runs itself', desc: 'Tell it how often to run — daily, weekly or monthly. After that, you never have to think about it again.' },
    { icon: <Bot className="w-5 h-5" />, title: 'AI completes the whole task, not just part of it', desc: 'The AI follows every single step in the workflow and gives you a finished, usable result. Not notes or suggestions. A completed task.' },
    { icon: <Mail className="w-5 h-5" />, title: 'Results land in your inbox every time', desc: 'Every time your agent runs, the finished report lands in your email. Open it, read it, use it. That is all.' },
    { icon: <PauseCircle className="w-5 h-5" />, title: 'You are always in control', desc: 'Need to change something? Update the settings, pause the agent, or switch it off whenever you like. It takes 10 seconds.' },
  ];

  const mockRuns = [
    { name: 'Weekly Bookkeeping', status: 'Delivered', time: '08:00 AM', color: 'bg-emerald-400' },
    { name: 'Monthly P&L Snapshot', status: 'Running', time: '07:45 AM', color: 'bg-blue-400' },
    { name: 'Invoice Follow-ups', status: 'Queued', time: '09:00 AM', color: 'bg-amber-400' },
  ];

  return (
    <section className="py-32 bg-[#202124] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-semibold mb-6 leading-tight max-w-3xl mx-auto">
            Set it up once.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Get insights forever.</span>
          </h2>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed font-normal">
            Deploy a workflow today and it runs every week without you touching it. Your business stays monitored while you focus on what actually matters.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
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
                <motion.button className="px-6 py-3 bg-white text-[#202124] rounded-full font-medium flex items-center gap-2 text-sm group hover:bg-white/90 transition-all" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Deploy your first workflow
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-2xl scale-95 pointer-events-none" />
            <div className="relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2"><Bot className="w-4 h-4 text-indigo-400" /><span className="text-sm font-medium text-white/80">Autopilot Dashboard</span></div>
                <span className="text-xs text-white/40">Today, 08:12 AM</span>
              </div>
              <div className="p-4 space-y-3">
                {mockRuns.map((run, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 hover:bg-white/8 border border-white/8 rounded-2xl px-5 py-4 transition-all group">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${run.color} ${run.status === 'Running' ? 'animate-pulse' : ''}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{run.name}</p>
                        <p className="text-xs text-white/40">{run.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${run.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-300' : run.status === 'Running' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'}`}>{run.status}</span>
                  </div>
                ))}
              </div>
              <div className="mx-4 mb-4 bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-indigo-400/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3"><Mail className="w-4 h-4 text-indigo-300" /><span className="text-xs font-medium text-indigo-200">Delivered to your inbox</span></div>
                <p className="text-xs text-white/50 leading-relaxed"><span className="text-white/80 font-medium">Weekly Bookkeeping Report · </span>14 transactions categorized, 2 flagged for review. Net expenses this week: ₦47,200. View full report →</p>
              </div>
              <div className="border-t border-white/10 px-6 py-4 grid grid-cols-3 gap-4 text-center">
                {[{ label: 'Agents active', value: '3' }, { label: 'Runs this month', value: '24' }, { label: 'Hours saved', value: '18 hrs' }].map((s, i) => (
                  <div key={i}><p className="text-lg font-bold text-white">{s.value}</p><p className="text-xs text-white/40">{s.label}</p></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
