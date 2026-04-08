import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowRight, Building2, BarChart3, Target } from 'lucide-react';
import { updateProfile } from '../lib/api';

export interface BusinessProfile {
  businessName: string;
  industry: string;
  products: string;
  metrics: string[];
  competitors: string;
  challenge: string;
  currency: string;
  completedAt: string;
}

export type OnboardingData = BusinessProfile;

interface OnboardingModalProps {
  userId: string;
  onComplete: (data: OnboardingData) => void;
  onDismiss: () => void;
}

const INDUSTRIES = [
  'E-commerce / Retail', 'Finance / Accounting', 'Marketing / Agency',
  'SaaS / Software', 'Consulting / Services', 'Manufacturing / Distribution',
  'Content / Creator', 'Real Estate', 'Healthcare', 'Other',
];

const CURRENCIES = [
  { code: 'NGN', label: '₦ Nigerian Naira' },
  { code: 'USD', label: '$ US Dollar' },
  { code: 'GBP', label: '£ British Pound' },
  { code: 'EUR', label: '€ Euro' },
  { code: 'KES', label: 'KES Kenyan Shilling' },
  { code: 'GHS', label: 'GHS Ghanaian Cedi' },
  { code: 'ZAR', label: 'ZAR South African Rand' },
];

const METRICS = [
  'Revenue', 'Profit margin', 'Cash flow', 'Churn rate',
  'Lead count', 'Customer count', 'Website traffic', 'Conversion rate',
  'Expenses', 'Inventory levels', 'Social followers', 'Sales pipeline',
];

const STEP_HEADERS = [
  { icon: <Building2 className="w-5 h-5" />, title: 'Your business', sub: "Help the AI understand what you do so every report is relevant to you." },
  { icon: <BarChart3 className="w-5 h-5" />, title: 'What you track', sub: "The AI will always watch and explain these metrics in your reports." },
  { icon: <Target className="w-5 h-5" />, title: 'Give the AI context', sub: "This gets injected into every workflow run — takes 30 seconds." },
];

export function OnboardingModal({ userId, onComplete, onDismiss }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [products, setProducts] = useState('');
  const [metrics, setMetrics] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState('');
  const [challenge, setChallenge] = useState('');
  const [currency, setCurrency] = useState('NGN');

  const toggleMetric = (m: string) => {
    setMetrics(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : prev.length < 5 ? [...prev, m] : prev
    );
  };

  const handleFinish = async () => {
    const data: BusinessProfile = {
      businessName, industry, products, metrics,
      competitors, challenge, currency,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(`hb_profile_${userId}`, JSON.stringify(data));
    // Save to Supabase profile (business_profile column — JSONB)
    await updateProfile(userId, { business_profile: data });
    onComplete(data);
  };

  const canProceed1 = businessName.trim().length > 0 && industry.length > 0;
  const canProceed2 = metrics.length > 0 || products.trim().length > 0;
  const totalSteps = 3;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-brand-dark/50 backdrop-blur-sm"
        onClick={onDismiss}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="relative w-full max-w-lg bg-brand-light rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-brand-dark px-6 pt-6 pb-5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/50 text-xs font-medium tracking-widest uppercase">
              Step {step} of {totalSteps}
            </span>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-5">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`header-${step}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-1 text-white/60">
                {STEP_HEADERS[step - 1].icon}
                <span className="text-xs font-semibold uppercase tracking-widest">{STEP_HEADERS[step - 1].title}</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-1">
                {step === 1 ? "Tell the AI about your business" :
                 step === 2 ? "What metrics matter to you?" :
                 "One more thing..."}
              </h2>
              <p className="text-white/50 text-sm">{STEP_HEADERS[step - 1].sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">

            {/* Step 1: Business basics */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Business / brand name</label>
                  <input
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Adaeze Fashion Store"
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">Industry</label>
                  <div className="grid grid-cols-2 gap-2">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind}
                        onClick={() => setIndustry(ind)}
                        className={`px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition-all ${
                          industry === ind
                            ? 'bg-brand-dark text-white border-brand-dark'
                            : 'bg-white border-slate-200 text-brand-dark hover:border-brand-dark/30'
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: What they track */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Main products or services</label>
                  <input
                    value={products}
                    onChange={e => setProducts(e.target.value)}
                    placeholder="e.g. Women's fashion, accessories, custom orders"
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Key metrics to watch
                    <span className="text-slate-400 font-normal ml-1.5">(pick up to 5)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {METRICS.map(m => {
                      const selected = metrics.includes(m);
                      const maxed = metrics.length >= 5 && !selected;
                      return (
                        <button
                          key={m}
                          onClick={() => toggleMetric(m)}
                          disabled={maxed}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                            selected
                              ? 'bg-brand-dark text-white border-brand-dark'
                              : maxed
                                ? 'bg-white border-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-white border-slate-200 text-brand-dark hover:border-brand-dark/40'
                          }`}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Context */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Main competitors
                    <span className="text-slate-400 font-normal ml-1.5">(optional)</span>
                  </label>
                  <input
                    value={competitors}
                    onChange={e => setCompetitors(e.target.value)}
                    placeholder="e.g. Zara Nigeria, Fashion Nova, Aso-Ebi store"
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm"
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 mt-1">Separate with commas.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Biggest business challenge right now
                    <span className="text-slate-400 font-normal ml-1.5">(optional)</span>
                  </label>
                  <textarea
                    value={challenge}
                    onChange={e => setChallenge(e.target.value)}
                    placeholder="e.g. Margin pressure from FX rate, growing repeat customers, reducing refunds..."
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">Primary currency</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CURRENCIES.map(c => (
                      <button
                        key={c.code}
                        onClick={() => setCurrency(c.code)}
                        className={`px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition-all ${
                          currency === c.code
                            ? 'bg-brand-dark text-white border-brand-dark'
                            : 'bg-white border-slate-200 text-brand-dark hover:border-brand-dark/30'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-brand-dark rounded-2xl p-4 text-white text-xs leading-relaxed mt-2">
                  <p className="text-white/40 uppercase tracking-widest text-[10px] font-semibold mb-2">How the AI will see your business</p>
                  <p className="text-white/70">
                    <span className="text-white font-semibold">{businessName}</span> operates in{' '}
                    <span className="text-white font-semibold">{industry}</span>.
                    {products && <> Products/services: <span className="text-white">{products}</span>.</>}
                    {metrics.length > 0 && <> Tracks: <span className="text-white">{metrics.join(', ')}</span>.</>}
                    {competitors && <> Competitors: <span className="text-white">{competitors}</span>.</>}
                    {challenge && <> Current challenge: <span className="text-white">{challenge}</span>.</>}
                    {' '}Currency: <span className="text-white">{currency}</span>.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer actions */}
          <div className="mt-5 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
                className="text-sm text-brand-dark/50 hover:text-brand-dark transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                onClick={onDismiss}
                className="text-sm text-brand-dark/50 hover:text-brand-dark transition-colors"
              >
                Skip for now
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(s => (s + 1) as 2 | 3)}
                disabled={step === 1 ? !canProceed1 : !canProceed2}
                className="px-5 py-2.5 bg-brand-dark text-white rounded-full text-sm font-medium flex items-center gap-2 group shadow-antigravity-sm hover:bg-brand-dark/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2.5 bg-brand-blue text-white rounded-full text-sm font-medium flex items-center gap-2 group shadow-antigravity-sm hover:bg-blue-600 transition-all"
              >
                Set up my AI
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
