import { motion } from 'framer-motion';
import { Clock, ArrowRight, CheckCircle2, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MobileNav } from '../components/MobileNav';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const studies = [
  {
    color: '#4285F4',
    category: 'Finance',
    icon: <BarChart3 className="w-5 h-5" />,
    name: 'Adaeze O.',
    role: 'E-commerce Founder',
    company: 'Fashion retail brand, Lagos',
    setupTime: '4 minutes',
    workflow: 'Weekly Business Report',
    before: {
      summary: 'Every Monday, Adaeze spent 3–4 hours manually pulling sales numbers from her spreadsheet, calculating margins, and writing a summary for her co-founder.',
      pains: [
        '3–4 hours every Monday on manual report preparation',
        'Reports were inconsistent — different formats each week',
        'Missed anomalies because numbers were reviewed too quickly',
        'One week she skipped it entirely due to a supplier crisis',
      ],
    },
    after: {
      summary: 'She connected her Google Sheet to the Weekly Business Report workflow. Every Monday at 8am, a formatted summary lands in her inbox with revenue, expenses, margin trends, and flagged anomalies.',
      gains: [
        '3.5 hours saved every Monday',
        'Consistent, professional report every week without fail',
        'AI flagged a 12% margin drop she would have missed manually',
        "Co-founder gets CC'd automatically — no more forwarding emails",
      ],
    },
    metrics: [
      { value: '3.5 hrs', label: 'Saved per week' },
      { value: '₦182k', label: 'Monthly value recovered' },
      { value: '1 insight', label: 'Caught margin drop worth ₦340k' },
    ],
    quote: "I used to spend every Monday morning pulling reports manually. Now Hoursback does it while I sleep and my inbox has everything I need by 8am. I didn't realise how much stress that was until it stopped.",
    setupSteps: [
      'Shared her Google Sheet link',
      'Set delivery email and schedule (Weekly, Monday 8am)',
      'Sent a test run to confirm format',
      'Live in under 5 minutes',
    ],
  },
  {
    color: '#DA7756',
    category: 'Operations',
    icon: <TrendingUp className="w-5 h-5" />,
    name: 'Tunde B.',
    role: 'Operations Manager',
    company: 'Manufacturing distributor, Abuja',
    setupTime: '3 minutes',
    workflow: 'Supplier Price Tracker',
    before: {
      summary: "Tunde managed relationships with 6 key suppliers. He'd check each supplier's website manually every couple of weeks to catch price changes — but often missed them until invoices arrived.",
      pains: [
        '2+ hours per week manually checking supplier websites',
        'Missed a 15% price hike for 6 weeks — eroded margins significantly',
        'No alert system; relied on memory and periodic manual checks',
        'Team had no visibility into supplier pricing changes',
      ],
    },
    after: {
      summary: 'The Supplier Price Tracker workflow monitors his six core supplier pages twice a week. The moment a price or product listing changes, Tunde gets a clear email with exactly what changed.',
      gains: [
        '2 hours per week freed from manual website checks',
        'Caught a price hike the same week it went live',
        'Renegotiated the contract before it hit invoices',
        'Shared the report with his MD — visibility across the team',
      ],
    },
    metrics: [
      { value: '2 hrs', label: 'Saved per week' },
      { value: '1 day', label: 'Time to catch next price hike' },
      { value: '₦620k', label: 'Saved by renegotiating early' },
    ],
    quote: "The competitor price monitor alone is worth it. I caught a supplier price hike before it hit my margins and renegotiated the same week. That one alert paid for years of the subscription.",
    setupSteps: [
      'Pasted the URLs of 6 supplier websites',
      'Set monitoring frequency to twice a week',
      "Added his email and his MD's email",
      'First alert arrived within 48 hours',
    ],
  },
  {
    color: '#7c3aed',
    category: 'Research',
    icon: <Users className="w-5 h-5" />,
    name: 'Chiamaka N.',
    role: 'Content Creator & Brand Strategist',
    company: 'Independent creator, 42k YouTube subscribers',
    setupTime: '5 minutes',
    workflow: 'YouTube Trend Tracker',
    before: {
      summary: 'Chiamaka was spending 4–5 hours each week manually browsing YouTube, TikTok, and Twitter to find trending topics in her niche before planning her next video.',
      pains: [
        '4–5 hours per week on manual trend research',
        'Often pitched videos on topics that had already peaked',
        'Research was unstructured — no way to track patterns over time',
        'Competitors were moving faster on trending topics',
      ],
    },
    after: {
      summary: "The YouTube Trend Tracker runs every Monday and delivers a curated brief of what's trending in her niche, including view velocity, engagement signals, and AI commentary on why the trend is growing.",
      gains: [
        '4 hours of research time reclaimed every week',
        'Published a trend video within 3 days of the trend appearing',
        'Video hit 28k views — her second highest ever',
        'Now plans content calendar 2 weeks ahead instead of reacting',
      ],
    },
    metrics: [
      { value: '4 hrs', label: 'Saved per week' },
      { value: '28k views', label: 'On first trend-informed video' },
      { value: '2 weeks', label: 'Content planned ahead vs reactive' },
    ],
    quote: "As a content creator, the YouTube Trend Tracker changed my strategy completely. I know what to make before the wave hits. I went from chasing trends to riding them.",
    setupSteps: [
      'Entered her niche keywords and channel focus',
      'Set weekly delivery (Sunday evening for Monday planning)',
      'Customised the report to include competitor channel signals',
      'First report included 3 viable video ideas',
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-brand-light text-brand-dark pb-16 md:pb-0">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-brand-dark/10 bg-white">
        <Link to="/"><img src="/logo.svg" alt="Hoursback" className="h-8 w-auto" /></Link>
        <Link to="/workflows/new">
          <button className="px-4 py-2 bg-brand-dark text-white rounded-full text-sm font-medium hover:bg-brand-dark/80 transition-colors">
            Deploy a workflow
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-white border-b border-brand-dark/10 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="container mx-auto px-6 max-w-3xl">
          <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest mb-4">Case Studies</p>
          <h1 className="text-4xl md:text-5xl font-semibold mb-5 leading-tight">
            Real people. Real hours saved.<br />
            <span style={{ color: '#4285F4' }}>Real results.</span>
          </h1>
          <p className="text-lg text-brand-dark/60 max-w-xl mx-auto">
            Three business owners who replaced a manual weekly task with an automated workflow.
          </p>
        </motion.div>
      </section>

      {/* Studies */}
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl space-y-20">
          {studies.map((study, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: study.color }}>
                  {study.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${study.color}15`, color: study.color }}>{study.category}</span>
                    <span className="text-xs text-brand-dark/40">Workflow: {study.workflow}</span>
                  </div>
                  <h2 className="text-xl font-bold">{study.name}</h2>
                  <p className="text-sm text-brand-dark/60">{study.role} · {study.company}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
                {study.metrics.map((m, j) => (
                  <div key={j} className="bg-white rounded-2xl border border-brand-dark/10 p-3 sm:p-5 text-center">
                    <p className="text-base sm:text-2xl font-bold mb-1 leading-tight" style={{ color: study.color }}>{m.value}</p>
                    <p className="text-xs text-brand-dark/50">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Before / After */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-3">Before</p>
                  <p className="text-sm text-brand-dark/70 leading-relaxed mb-4">{study.before.summary}</p>
                  <ul className="space-y-2">
                    {study.before.pains.map((p, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-brand-dark/70">
                        <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-[10px] font-bold shrink-0 mt-0.5">✕</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">After</p>
                  <p className="text-sm text-brand-dark/70 leading-relaxed mb-4">{study.after.summary}</p>
                  <ul className="space-y-2">
                    {study.after.gains.map((g, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-brand-dark/70">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="bg-white border-l-4 rounded-r-2xl p-6 mb-6 italic text-brand-dark/80 leading-relaxed" style={{ borderLeftColor: study.color }}>
                "{study.quote}"
                <footer className="mt-3 not-italic text-sm font-semibold text-brand-dark/60">{study.name} · {study.role}</footer>
              </blockquote>

              {/* Setup */}
              <div className="bg-brand-dark text-white rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-white/40" />
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Setup — {study.setupTime} total</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {study.setupSteps.map((step, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {i < studies.length - 1 && <div className="mt-20 border-t border-brand-dark/10" />}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white border-t border-brand-dark/10 text-center">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-3xl font-semibold mb-4">Ready to write your own case study?</h2>
          <p className="text-brand-dark/60 mb-8">Deploy a workflow today. Most users see results in the first week.</p>
          <Link to="/workflows/new">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-brand-dark text-white rounded-full font-semibold flex items-center gap-2 mx-auto group"
            >
              Deploy a workflow free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          <p className="text-sm text-brand-dark/40 mt-3">No credit card required. Live in under 5 minutes.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-brand-dark/10 bg-brand-light">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-dark/40">
          <span>© 2026 Hoursback. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-brand-dark transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-brand-dark transition-colors">Terms</Link>
            <Link to="/trust" className="hover:text-brand-dark transition-colors">Trust</Link>
          </div>
        </div>
      </footer>
      <MobileNav />
    </div>
  );
}
