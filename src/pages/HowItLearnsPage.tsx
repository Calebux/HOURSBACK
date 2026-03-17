import { motion } from 'framer-motion';
import { ArrowRight, Lock, Sparkles, TrendingUp, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

const weeks = [
  {
    week: 'Week 1',
    label: 'First report',
    proRequired: false,
    description: 'Your first report covers everything. All metrics, all sections, all data points included.',
    reportTitle: 'Weekly Business Report — Week 1',
    content: [
      { section: 'Revenue', value: '₦1,240,000', note: 'Total revenue this week' },
      { section: 'Expenses', value: '₦640,000', note: 'All categories included' },
      { section: 'Gross margin', value: '48.4%', note: 'vs last week: no data yet' },
      { section: 'Top product', value: 'Product A', note: 'by revenue' },
      { section: 'Slow movers', value: 'Products D, F, G', note: 'low volume' },
      { section: 'Refunds', value: '₦18,000', note: '3 transactions' },
      { section: 'New customers', value: '14', note: 'total new this week' },
      { section: 'Returning', value: '37', note: 'returning customers' },
    ],
    badge: { color: '#4285F4', label: 'Full coverage' },
  },
  {
    week: 'Week 2',
    label: 'Patterns emerge',
    proRequired: false,
    description: 'The AI starts comparing. It notices what changed since last week and highlights movement.',
    reportTitle: 'Weekly Business Report — Week 2',
    content: [
      { section: 'Revenue', value: '₦1,380,000', note: '▲ +11.3% vs last week', highlight: true },
      { section: 'Expenses', value: '₦620,000', note: '▼ -3.1% vs last week', highlight: true },
      { section: 'Gross margin', value: '55.1%', note: '▲ Up 6.7 points — strong week', highlight: true },
      { section: 'Top product', value: 'Product A', note: 'Consistent — 2nd week running' },
      { section: 'Slow movers', value: 'Product G', note: 'Still low — consider review' },
      { section: 'Refunds', value: '₦9,000', note: '▼ Down 50% — improving' },
      { section: 'New customers', value: '19', note: '▲ +35% growth in new customers' },
      { section: 'Returning', value: '41', note: 'Stable' },
    ],
    badge: { color: '#10B981', label: 'Trend tracking' },
  },
  {
    week: 'Week 4',
    label: 'Personalised focus',
    proRequired: true,
    description: 'The AI notices which sections you act on. It starts prioritising what matters to you and minimising the noise.',
    reportTitle: 'Weekly Business Report — Week 4',
    content: [
      { section: 'Revenue & Margin', value: '₦1,510,000 · 57.2%', note: 'Your key metrics — highlighted first', highlight: true },
      { section: 'New customers', value: '23', note: '▲ 3-week growth streak', highlight: true },
      { section: '⚠ Flag: Product G', value: '4th consecutive low week', note: 'AI flagging for your review', highlight: true },
      { section: 'Expenses', value: '₦649,000', note: 'Stable — no action needed' },
      { section: 'Refunds', value: '₦7,200', note: 'Low — no action needed' },
    ],
    badge: { color: '#7c3aed', label: 'Pro: Prioritised' },
  },
  {
    week: 'Week 8',
    label: 'Predictive insights',
    proRequired: true,
    description: 'Based on 8 weeks of data, the AI starts making forward-looking observations.',
    reportTitle: 'Weekly Business Report — Week 8',
    content: [
      { section: '🔮 Prediction', value: 'Revenue likely flat next week', note: 'Based on 4-week plateau pattern — consider promotion', highlight: true },
      { section: '📈 Trend alert', value: 'New customer acquisition declining', note: 'Down 3 weeks straight — review acquisition channel', highlight: true },
      { section: '✅ Strong', value: 'Gross margin above 55% for 6 weeks', note: 'Pricing strategy is working — maintain' },
      { section: '⚠ Watch', value: 'Product G still underperforming', note: 'Week 8 — recommend discontinuing or repricing' },
      { section: 'Revenue', value: '₦1,490,000', note: 'Stable week' },
    ],
    badge: { color: '#EF4444', label: 'Pro: Predictive' },
  },
];

export default function HowItLearnsPage() {
  return (
    <div className="min-h-screen bg-brand-light text-brand-dark">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-brand-dark/10 bg-white">
        <Link to="/"><img src="/logo.svg" alt="Hoursback" className="h-8 w-auto" /></Link>
        <Link to="/workflows/new">
          <button className="px-4 py-2 bg-brand-dark text-white rounded-full text-sm font-medium hover:bg-brand-dark/80 transition-colors">
            Get started free
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-white border-b border-brand-dark/10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto px-6 max-w-3xl">
          <div className="w-16 h-16 bg-brand-dark rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest mb-4">How Hoursback learns</p>
          <h1 className="text-4xl md:text-5xl font-semibold mb-5 leading-tight">
            Reports that get smarter<br />
            <span style={{ color: '#4285F4' }}>every single week.</span>
          </h1>
          <p className="text-lg text-brand-dark/60 max-w-xl mx-auto leading-relaxed">
            Your first report covers everything. By week 8, the AI knows what matters to you — and predicts what comes next.
          </p>
        </motion.div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Timeline connector */}
          <div className="relative">
            <div className="hidden md:block absolute left-[calc(50%-1px)] top-0 bottom-0 w-0.5 bg-brand-dark/10" />

            <div className="space-y-16">
              {weeks.map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={`relative grid md:grid-cols-2 gap-8 items-start ${i % 2 === 1 ? 'md:[direction:rtl]' : ''}`}
                >
                  {/* Center dot */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-6 w-4 h-4 rounded-full border-2 border-brand-dark bg-white z-10" />

                  {/* Text side */}
                  <div className={`${i % 2 === 1 ? 'md:[direction:ltr] md:text-right' : ''}`}>
                    <div className={`flex items-center gap-2 mb-2 ${i % 2 === 1 ? 'md:justify-end' : ''}`}>
                      <span className="text-xs font-bold text-brand-dark/30 uppercase tracking-widest">{w.week}</span>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                        style={{ backgroundColor: `${w.badge.color}15`, color: w.badge.color }}
                      >
                        {w.proRequired && <Lock className="w-3 h-3" />}
                        {!w.proRequired && <Sparkles className="w-3 h-3" />}
                        {w.badge.label}
                        {w.proRequired && <span className="ml-1 bg-white/40 px-1 rounded text-[9px] font-bold">PRO</span>}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{w.label}</h3>
                    <p className="text-brand-dark/60 leading-relaxed">{w.description}</p>
                  </div>

                  {/* Report mockup */}
                  <div className={`${i % 2 === 1 ? 'md:[direction:ltr]' : ''}`}>
                    <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${w.proRequired ? 'border-purple-200' : 'border-brand-dark/10'}`}>
                      {/* Email header mockup */}
                      <div className={`px-4 py-3 border-b flex items-center justify-between ${w.proRequired ? 'bg-purple-50 border-purple-100' : 'bg-brand-light border-brand-dark/10'}`}>
                        <div>
                          <p className="text-xs font-semibold text-brand-dark">{w.reportTitle}</p>
                          <p className="text-[10px] text-brand-dark/40">From: reports@hoursback.io</p>
                        </div>
                        {w.proRequired && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Pro
                          </span>
                        )}
                      </div>

                      {/* Report rows */}
                      <div className="p-3 space-y-1.5">
                        {w.content.map((row, j) => (
                          <div
                            key={j}
                            className={`flex items-start justify-between gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${row.highlight ? 'bg-brand-blue/5 border border-brand-blue/15' : 'bg-brand-light/50'}`}
                          >
                            <span className="text-brand-dark/50 shrink-0">{row.section}</span>
                            <div className="text-right">
                              <p className={`font-semibold ${row.highlight ? 'text-brand-dark' : 'text-brand-dark/70'}`}>{row.value}</p>
                              <p className="text-brand-dark/40 text-[10px]">{row.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pro callout */}
      <section className="py-16 bg-brand-dark text-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-brand-blue" />
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Weeks 4–8 require Pro</p>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold mb-3">
                The real intelligence kicks in after week 4.
              </h2>
              <p className="text-white/60 leading-relaxed">
                The first two weeks are free for everyone. Upgrade to Pro to unlock personalised prioritisation, anomaly detection, and forward-looking predictions based on your historical patterns.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Link to="/workflows/new">
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="px-7 py-3.5 bg-white text-brand-dark rounded-full font-semibold flex items-center gap-2 group whitespace-nowrap"
                >
                  Start free — upgrade when ready
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <p className="text-center text-xs text-white/30">No credit card required for free tier</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-brand-dark/10 bg-brand-light">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-dark/40">
          <span>© 2026 Hoursback. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-brand-dark transition-colors">Privacy</Link>
            <Link to="/trust" className="hover:text-brand-dark transition-colors">Trust & Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
