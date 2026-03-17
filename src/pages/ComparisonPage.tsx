import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Minus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { MobileNav } from '../components/MobileNav';

type ComparisonKey = 'zapier' | 'make' | 'manual';

interface ComparisonConfig {
  competitor: string;
  tagline: string;
  heroHeadline: string;
  heroSub: string;
  features: { label: string; hoursback: boolean | 'partial'; them: boolean | 'partial' }[];
  hoursbackWhen: string[];
  themWhen: string[];
  verdict: string;
}

const configs: Record<ComparisonKey, ComparisonConfig> = {
  zapier: {
    competitor: 'Zapier',
    tagline: 'Zapier connects apps. Hoursback explains what the data means.',
    heroHeadline: 'Hoursback vs Zapier',
    heroSub: 'Both automate work. Only one tells you what it means.',
    features: [
      { label: 'No-code setup', hoursback: true, them: true },
      { label: 'Connects to Google Sheets', hoursback: true, them: true },
      { label: 'Scheduled automation', hoursback: true, them: true },
      { label: 'AI-generated summaries & insights', hoursback: true, them: false },
      { label: 'Plain-English explanations of changes', hoursback: true, them: false },
      { label: 'Pre-built business monitoring workflows', hoursback: true, them: 'partial' },
      { label: 'Complex multi-app automation chains', hoursback: false, them: true },
      { label: 'Webhook / API triggers', hoursback: true, them: true },
      { label: 'Email report delivery', hoursback: true, them: 'partial' },
      { label: 'Anomaly detection in data', hoursback: true, them: false },
      { label: 'Free tier available', hoursback: true, them: true },
      { label: 'Price for advanced automations', hoursback: '$20/mo', them: '$49–$69/mo' } as any,
    ],
    hoursbackWhen: [
      'You want AI to analyse your data and explain what changed',
      'You need recurring business reports without writing logic',
      'You track metrics in Google Sheets and want insights automatically',
      'You want a finished summary in your inbox, not raw data moved around',
    ],
    themWhen: [
      'You need to connect 5+ apps in a complex pipeline',
      'You want to trigger specific actions in third-party tools (e.g. update CRM row)',
      "You're building internal ops workflows across many systems",
    ],
    verdict: 'Zapier is a pipe. Hoursback is an analyst. Use Zapier to move data. Use Hoursback to understand it.',
  },

  make: {
    competitor: 'Make',
    tagline: 'Make builds workflows. Hoursback writes the summary.',
    heroHeadline: 'Hoursback vs Make',
    heroSub: 'Make is for builders. Hoursback is for operators.',
    features: [
      { label: 'Visual workflow builder', hoursback: false, them: true },
      { label: 'No-code deployment', hoursback: true, them: 'partial' },
      { label: 'Scheduled runs', hoursback: true, them: true },
      { label: 'AI insight generation', hoursback: true, them: false },
      { label: 'Pre-built business workflows', hoursback: true, them: 'partial' },
      { label: 'Email report delivery', hoursback: true, them: 'partial' },
      { label: 'Setup time for basic monitoring', hoursback: '< 5 minutes', them: '30–60 minutes' } as any,
      { label: 'Plain-English anomaly alerts', hoursback: true, them: false },
      { label: 'Complex conditional branching', hoursback: false, them: true },
      { label: 'Learning curve', hoursback: 'Low', them: 'High' } as any,
      { label: 'Free tier', hoursback: true, them: true },
    ],
    hoursbackWhen: [
      'You want business monitoring without learning a new tool',
      'You need AI to read and interpret your data, not just move it',
      'You want to be live in under 5 minutes',
      "You're a non-technical operator or founder",
    ],
    themWhen: [
      'You need highly customised automation logic with many branches',
      'You want full control over every step of a multi-system pipeline',
      'You have a developer on your team to maintain the flows',
    ],
    verdict: 'Make is a powerful tool for builders. Hoursback is for people who want results without building.',
  },

  manual: {
    competitor: 'Manual reporting',
    tagline: 'Calculate the real cost of doing it yourself.',
    heroHeadline: 'Hoursback vs Doing it manually',
    heroSub: "Manual reporting isn't free — it just feels that way.",
    features: [
      { label: 'Setup time', hoursback: '< 5 minutes', them: '0 minutes (already doing it)' } as any,
      { label: 'Weekly time cost', hoursback: '0 minutes', them: '3–8 hours' } as any,
      { label: 'Consistency', hoursback: true, them: false },
      { label: 'Scales with team size', hoursback: true, them: false },
      { label: 'Runs while you sleep', hoursback: true, them: false },
      { label: 'Never misses a week', hoursback: true, them: false },
      { label: 'Catches anomalies automatically', hoursback: true, them: false },
      { label: 'Zero marginal cost per extra report', hoursback: true, them: false },
      { label: 'Requires hiring someone', hoursback: false, them: 'partial' },
      { label: 'Monthly cost (team of 2, $50/hr rate)', hoursback: '$20', them: '$2,580+' } as any,
    ],
    hoursbackWhen: [
      'You repeat the same report task every week or month',
      'Your team spends more than 1 hour/week on manual data review',
      'You want consistency without depending on a person',
      'You need insights on a schedule without thinking about it',
    ],
    themWhen: [
      'The report is one-off and will never recur',
      "The analysis requires human judgment that can't be templated",
      'You genuinely enjoy the process of pulling and formatting data',
    ],
    verdict: 'Manual reporting costs more than it appears. Every hour spent on a repeatable task is an hour not spent on growth.',
  },
};

function FeatureValue({ value }: { value: boolean | 'partial' | string }) {
  if (typeof value === 'string' && value !== 'partial') {
    return <span className="text-xs font-medium text-brand-dark">{value}</span>;
  }
  if (value === true) return <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />;
  if (value === false) return <XCircle className="w-5 h-5 text-red-400 mx-auto" />;
  return <Minus className="w-5 h-5 text-amber-400 mx-auto" />;
}

export default function ComparisonPage() {
  const { slug } = useParams<{ slug: string }>();
  const key = slug as ComparisonKey;
  const config = configs[key];

  if (!config) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center text-brand-dark">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
          <Link to="/" className="text-brand-blue hover:underline">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark pb-16 md:pb-0">
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
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-6 max-w-3xl"
        >
          <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest mb-4">Comparison</p>
          <h1 className="text-4xl md:text-5xl font-semibold mb-5 leading-tight">{config.heroHeadline}</h1>
          <p className="text-xl text-brand-dark/60 mb-4">{config.heroSub}</p>
          <p className="text-base text-brand-blue font-medium italic">"{config.tagline}"</p>
        </motion.div>
      </section>

      {/* Feature table */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <div className="overflow-x-auto rounded-3xl border border-brand-dark/10 shadow-sm">
          <div className="bg-white min-w-[480px]">
            {/* Table header */}
            <div className="grid grid-cols-3 border-b border-brand-dark/10 bg-brand-light rounded-t-3xl">
              <div className="p-5 text-xs font-semibold text-brand-dark/40 uppercase tracking-widest">Feature</div>
              <div className="p-5 text-center">
                <span className="text-sm font-bold text-brand-dark">Hoursback</span>
              </div>
              <div className="p-5 text-center">
                <span className="text-sm font-bold text-brand-dark/60">{config.competitor}</span>
              </div>
            </div>

            {config.features.map((f, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 border-b border-brand-dark/8 hover:bg-brand-light/50 transition-colors ${i === config.features.length - 1 ? 'border-b-0' : ''}`}
              >
                <div className="p-4 text-sm text-brand-dark/70 flex items-center">{f.label}</div>
                <div className="p-4 flex items-center justify-center">
                  <FeatureValue value={f.hoursback} />
                </div>
                <div className="p-4 flex items-center justify-center">
                  <FeatureValue value={f.them} />
                </div>
              </div>
            ))}
          </div>
          </div>

          <p className="text-xs text-brand-dark/30 text-center mt-3">
            <Minus className="w-3 h-3 inline mr-1" />= partial support &nbsp;
            <XCircle className="w-3 h-3 inline mr-1" />= not available &nbsp;
            <CheckCircle2 className="w-3 h-3 inline mr-1" />= fully supported
          </p>
        </div>
      </section>

      {/* When to choose */}
      <section className="py-16 bg-white border-y border-brand-dark/10">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-4">Choose Hoursback when</p>
              <ul className="space-y-3">
                {config.hoursbackWhen.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-brand-dark/80">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest mb-4">Choose {config.competitor} when</p>
              <ul className="space-y-3">
                {config.themWhen.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-brand-dark/60">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Verdict */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest mb-4">The verdict</p>
          <blockquote className="text-2xl md:text-3xl font-semibold leading-snug mb-10 text-brand-dark">
            "{config.verdict}"
          </blockquote>

          <Link to="/workflows/new">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-brand-dark text-white rounded-full font-semibold flex items-center gap-2 mx-auto group"
            >
              Try Hoursback free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          <p className="text-sm text-brand-dark/40 mt-3">No credit card required. Live in under 5 minutes.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-brand-dark/10 bg-white">
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
