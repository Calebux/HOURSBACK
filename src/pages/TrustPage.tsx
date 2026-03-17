import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Trash2, Server, CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const sections = [
  {
    icon: <Lock className="w-6 h-6" />,
    color: '#4285F4',
    title: 'Encryption everywhere',
    subtitle: 'Your data is protected at every step',
    items: [
      'Data at rest encrypted with AES-256',
      'Data in transit protected by TLS 1.3',
      'API keys and secrets stored in encrypted vaults',
      'No plain-text storage of sensitive credentials',
    ],
  },
  {
    icon: <Eye className="w-6 h-6" />,
    color: '#10B981',
    title: 'Your data is never used to train AI',
    subtitle: 'What you share stays yours',
    items: [
      'Your workflow inputs and outputs are never used to train AI models',
      'Data is not shared with third parties for any purpose',
      "Each user's data is isolated and never cross-referenced",
      'AI processing happens on your data, not because of it',
    ],
  },
  {
    icon: <Shield className="w-6 h-6" />,
    color: '#7c3aed',
    title: 'You own your data, always',
    subtitle: 'Full control, zero lock-in',
    items: [
      'Export all your reports and workflow history at any time',
      'Delete your account and all associated data instantly',
      'No data retained after account deletion',
      'We do not claim ownership of any content you create',
    ],
  },
  {
    icon: <Server className="w-6 h-6" />,
    color: '#F59E0B',
    title: 'Enterprise-grade infrastructure',
    subtitle: 'Built on battle-tested cloud providers',
    items: [
      'Hosted on Supabase (backed by AWS) with 99.9% uptime SLA',
      'Database backups run automatically every 24 hours',
      'Role-based access controls limit internal data exposure',
      'Regular dependency audits to catch security vulnerabilities',
    ],
  },
  {
    icon: <Trash2 className="w-6 h-6" />,
    color: '#EF4444',
    title: 'Your right to be forgotten',
    subtitle: 'One click to disappear',
    items: [
      'Delete your account from Settings at any time',
      'All personal data, workflows, and reports are purged within 24 hours',
      'Email us at petersoncaleb275@gmail.com for immediate deletion',
      'We do not retain backups of deleted user data beyond 30 days',
    ],
  },
];

const roadmap = [
  { label: 'SOC 2 Type II audit', target: 'Q3 2026', status: 'in-progress' },
  { label: 'GDPR compliance documentation', target: 'Q2 2026', status: 'in-progress' },
  { label: 'Security bug bounty program', target: 'Q4 2026', status: 'planned' },
  { label: 'Two-factor authentication', target: 'Q2 2026', status: 'in-progress' },
];

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-brand-light text-brand-dark">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-brand-dark/10 bg-white">
        <Link to="/">
          <img src="/logo.svg" alt="Hoursback" className="h-8 w-auto" />
        </Link>
        <Link to="/workflows/new">
          <button className="px-4 py-2 bg-brand-dark text-white rounded-full text-sm font-medium hover:bg-brand-dark/80 transition-colors">
            Get started
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-white text-center border-b border-brand-dark/10">
        <motion.div
          initial="hidden" animate="visible" variants={fadeInUp}
          className="container mx-auto px-6 max-w-3xl"
        >
          <div className="w-16 h-16 bg-brand-dark rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold mb-5 leading-tight">
            Your data. Your control.<br />
            <span style={{ color: '#4285F4' }}>No surprises.</span>
          </h1>
          <p className="text-lg text-brand-dark/60 leading-relaxed max-w-xl mx-auto">
            We believe trust is earned through transparency, not promises. Here's exactly how we handle your data.
          </p>
        </motion.div>
      </section>

      {/* Core commitments */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest mb-3">Our commitments</p>
            <h2 className="text-3xl font-semibold">What we do (and don't do) with your data</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {sections.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-white rounded-3xl border border-brand-dark/10 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-dark leading-snug">{s.title}</h3>
                    <p className="text-xs text-brand-dark/50">{s.subtitle}</p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {s.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-brand-dark/70">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: s.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal access controls */}
      <section className="py-16 bg-white border-y border-brand-dark/10">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest mb-3">Internal access</p>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">Who can see your data</h2>
              <p className="text-brand-dark/60 leading-relaxed mb-6">
                Access to production data is restricted to a small number of engineers on a need-to-know basis. Every access event is logged and auditable. No team member can access your workflow data without a documented reason.
              </p>
              <ul className="space-y-3">
                {[
                  'Engineers access logs, not raw user data',
                  'Access requires a ticket and approval',
                  'All actions are audit-logged with timestamps',
                  'Zero standing access to production databases',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-brand-dark/70">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-blue" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-brand-dark rounded-3xl p-7 text-white">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-5">Quick reference</p>
              {[
                { q: 'Do you sell my data?', a: 'Never.' },
                { q: 'Do you use my data to train AI?', a: 'No.' },
                { q: 'Can I delete my account?', a: 'Yes, anytime from Settings.' },
                { q: 'Who hosts your infrastructure?', a: 'Supabase (AWS-backed).' },
                { q: 'Is my data encrypted?', a: 'Yes — AES-256 at rest, TLS 1.3 in transit.' },
              ].map((item, i) => (
                <div key={i} className={`py-3 ${i < 4 ? 'border-b border-white/10' : ''}`}>
                  <p className="text-xs text-white/50 mb-0.5">{item.q}</p>
                  <p className="text-sm font-semibold text-white">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest mb-3">Security roadmap</p>
            <h2 className="text-3xl font-semibold mb-3">Where we're going</h2>
            <p className="text-brand-dark/60">We're early-stage and transparent about it. Here's what's coming.</p>
          </div>
          <div className="space-y-3">
            {roadmap.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-2xl border border-brand-dark/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <ChevronRight className="w-4 h-4 text-brand-blue" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-brand-dark/40">{item.target}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.status === 'in-progress' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-slate-100 text-slate-500'}`}>
                    {item.status === 'in-progress' ? 'In progress' : 'Planned'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-dark text-white text-center">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-3xl font-semibold mb-4">Questions about data security?</h2>
          <p className="text-white/60 mb-8">We'll respond within 24 hours, every time.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:petersoncaleb275@gmail.com?subject=Security Question">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-7 py-3.5 bg-white text-brand-dark rounded-full font-semibold flex items-center gap-2 group">
                Contact us
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </a>
            <Link to="/workflows/new">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-7 py-3.5 bg-white/10 border border-white/20 text-white rounded-full font-semibold hover:bg-white/15 transition-colors">
                Deploy a workflow
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-brand-dark/10 bg-white">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-dark/40">
          <span>© 2026 Hoursback. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-brand-dark transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-brand-dark transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
