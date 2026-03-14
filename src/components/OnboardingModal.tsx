import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check,
  Rocket, Briefcase, Megaphone, BarChart3, Users, Film,
  Dumbbell, GraduationCap, Code2, Sparkles,
  Bot, BookOpen, Pencil, TrendingUp, Lightbulb, Heart, Terminal, Zap,
  type LucideIcon,
} from 'lucide-react';

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

interface OptionItem {
  id: string;
  label: string;
  Icon: LucideIcon;
}

const PROFESSIONS: OptionItem[] = [
  { id: 'entrepreneur', label: 'Entrepreneur / Founder', Icon: Rocket },
  { id: 'freelancer',   label: 'Freelancer / Consultant', Icon: Briefcase },
  { id: 'marketing',   label: 'Marketing / Growth',       Icon: Megaphone },
  { id: 'finance',     label: 'Finance / Accounting',     Icon: BarChart3 },
  { id: 'sales',       label: 'Sales / Business Dev',     Icon: Users },
  { id: 'creator',     label: 'Content Creator',          Icon: Film },
  { id: 'fitness',     label: 'Fitness / Health',         Icon: Dumbbell },
  { id: 'student',     label: 'Student',                  Icon: GraduationCap },
  { id: 'developer',   label: 'Developer / Engineer',     Icon: Code2 },
  { id: 'other',       label: 'Something else',           Icon: Sparkles },
];

const GOALS: OptionItem[] = [
  { id: 'automate',          label: 'Automate my workflows',      Icon: Bot },
  { id: 'bookkeeping',       label: 'Manage my finances & books', Icon: BookOpen },
  { id: 'marketing_content', label: 'Create marketing content',   Icon: Pencil },
  { id: 'sales_bd',          label: 'Grow sales & find clients',  Icon: TrendingUp },
  { id: 'learn_ai',          label: 'Learn to use AI better',     Icon: Lightbulb },
  { id: 'fitness_health',    label: 'Plan meals & fitness',       Icon: Heart },
  { id: 'coding',            label: 'Code faster with AI',        Icon: Terminal },
  { id: 'productivity',      label: 'Boost my productivity',      Icon: Zap },
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
        <div className="bg-brand-dark px-6 pt-6 pb-5 shrink-0">
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
                <h2 className="text-xl font-semibold text-white mb-1">What kind of business do you run?</h2>
                <p className="text-white/50 text-sm">We'll recommend the most useful workflows for you.</p>
              </motion.div>
            ) : (
              <motion.div
                key="step2-header"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-white mb-1">What do you want to automate?</h2>
                <p className="text-white/50 text-sm">Pick up to 3 goals — we'll suggest the right workflows.</p>
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
                {PROFESSIONS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setProfession(id)}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border text-left transition-all ${
                      profession === id
                        ? 'bg-brand-dark text-white border-brand-dark shadow-antigravity-sm'
                        : 'bg-white border-brand-dark/10 text-brand-dark hover:border-brand-dark/30 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className="w-[18px] h-[18px] shrink-0"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <span className="text-sm font-medium leading-tight">{label}</span>
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
                {GOALS.map(({ id, label, Icon }) => {
                  const selected = goals.includes(id);
                  const maxReached = goals.length >= 3 && !selected;
                  return (
                    <button
                      key={id}
                      onClick={() => toggleGoal(id)}
                      disabled={maxReached}
                      className={`flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border text-left transition-all ${
                        selected
                          ? 'bg-brand-dark text-white border-brand-dark shadow-antigravity-sm'
                          : maxReached
                            ? 'bg-white border-brand-dark/5 text-brand-dark/30 cursor-not-allowed'
                            : 'bg-white border-brand-dark/10 text-brand-dark hover:border-brand-dark/30 hover:bg-slate-50'
                      }`}
                    >
                      <Icon
                        className="w-[18px] h-[18px] shrink-0"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <span className="text-sm font-medium leading-tight flex-1">{label}</span>
                      {selected && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />}
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
                Set up my workflows
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
