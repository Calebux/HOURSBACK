import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

export interface OnboardingData {
  profession: string;
  goals: string[];
  completedAt: string;
}

interface OnboardingModalProps {
  userId: string;
  onComplete: (data: OnboardingData) => void;
  onDismiss: () => void;
}

const PROFESSIONS = [
  { id: 'entrepreneur', label: 'Entrepreneur / Founder', emoji: '🚀' },
  { id: 'freelancer', label: 'Freelancer / Consultant', emoji: '💼' },
  { id: 'marketing', label: 'Marketing / Growth', emoji: '📣' },
  { id: 'finance', label: 'Finance / Accounting', emoji: '📊' },
  { id: 'sales', label: 'Sales / Business Dev', emoji: '🤝' },
  { id: 'creator', label: 'Content Creator', emoji: '🎬' },
  { id: 'fitness', label: 'Fitness / Health', emoji: '💪' },
  { id: 'student', label: 'Student', emoji: '🎓' },
  { id: 'developer', label: 'Developer / Engineer', emoji: '⚙️' },
  { id: 'other', label: 'Something else', emoji: '✨' },
];

const GOALS = [
  { id: 'automate', label: 'Automate my workflows', emoji: '🤖' },
  { id: 'bookkeeping', label: 'Manage my finances & books', emoji: '📒' },
  { id: 'marketing_content', label: 'Create marketing content', emoji: '✍️' },
  { id: 'sales_bd', label: 'Grow sales & find clients', emoji: '📈' },
  { id: 'learn_ai', label: 'Learn to use AI better', emoji: '🧠' },
  { id: 'fitness_health', label: 'Plan meals & fitness', emoji: '🥗' },
  { id: 'coding', label: 'Code faster with AI', emoji: '💻' },
  { id: 'productivity', label: 'Boost my productivity', emoji: '⚡' },
];

export function OnboardingModal({ userId, onComplete, onDismiss }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [profession, setProfession] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  const toggleGoal = (id: string) => {
    setGoals(prev =>
      prev.includes(id)
        ? prev.filter(g => g !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  };

  const handleFinish = () => {
    const data: OnboardingData = {
      profession,
      goals,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(`hb_onboarding_${userId}`, JSON.stringify(data));
    // Notify any mounted page (e.g. PlaybooksPage) that onboarding data is now available
    window.dispatchEvent(new CustomEvent('hb:onboarding-complete'));
    onComplete(data);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-brand-dark/50 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="relative w-full max-w-lg bg-brand-light rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-brand-dark px-6 pt-6 pb-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/50 text-xs font-medium tracking-widest uppercase">
              Step {step} of 2
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
              initial={{ width: '50%' }}
              animate={{ width: step === 1 ? '50%' : '100%' }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1-header"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-white mb-1">
                  What do you do?
                </h2>
                <p className="text-white/50 text-sm">
                  We'll put the most useful playbooks at the top for you.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="step2-header"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-white mb-1">
                  What are you here to do?
                </h2>
                <p className="text-white/50 text-sm">
                  Pick up to 3 goals — we'll highlight the right playbooks.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1-body"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-2"
              >
                {PROFESSIONS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setProfession(p.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border text-left transition-all ${
                      profession === p.id
                        ? 'bg-brand-dark text-white border-brand-dark shadow-antigravity-sm'
                        : 'bg-white border-brand-dark/10 text-brand-dark hover:border-brand-dark/30 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg leading-none shrink-0">{p.emoji}</span>
                    <span className="text-sm font-medium leading-tight">{p.label}</span>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="step2-body"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 gap-2"
              >
                {GOALS.map(g => {
                  const selected = goals.includes(g.id);
                  const maxReached = goals.length >= 3 && !selected;
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      disabled={maxReached}
                      className={`flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border text-left transition-all ${
                        selected
                          ? 'bg-brand-dark text-white border-brand-dark shadow-antigravity-sm'
                          : maxReached
                            ? 'bg-white border-brand-dark/5 text-brand-dark/30 cursor-not-allowed'
                            : 'bg-white border-brand-dark/10 text-brand-dark hover:border-brand-dark/30 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg leading-none shrink-0">{g.emoji}</span>
                      <span className="text-sm font-medium leading-tight flex-1">{g.label}</span>
                      {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            {step === 2 ? (
              <button
                onClick={() => setStep(1)}
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

            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                disabled={!profession}
                className="px-5 py-2.5 bg-brand-dark text-white rounded-full text-sm font-medium shadow-antigravity-sm hover:bg-brand-dark/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={goals.length === 0}
                className="px-5 py-2.5 bg-brand-dark text-white rounded-full text-sm font-medium shadow-antigravity-sm hover:bg-brand-dark/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Personalise my library
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
