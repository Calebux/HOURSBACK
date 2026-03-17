import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ChevronLeft, CheckCircle2, Clock, Zap,
  BarChart3, Search, PenLine, DollarSign,
  Sheet, Globe, Smartphone, HelpCircle,
  CalendarClock, Calendar, CalendarDays, Bell,
  User, Users, Building2, Building
} from 'lucide-react';
import { Link } from 'react-router-dom';

const questions = [
  {
    id: 'pain',
    question: "What's your biggest time waster right now?",
    options: [
      { value: 'reports', label: 'Pulling reports manually', Icon: BarChart3 },
      { value: 'competitors', label: 'Checking competitor websites', Icon: Search },
      { value: 'content', label: 'Content & trend research', Icon: PenLine },
      { value: 'finance', label: 'Reviewing financial data', Icon: DollarSign },
    ],
  },
  {
    id: 'data',
    question: 'Where does your data live?',
    options: [
      { value: 'sheets', label: 'Google Sheets / spreadsheets', Icon: Sheet },
      { value: 'websites', label: 'Websites or competitor pages', Icon: Globe },
      { value: 'social', label: 'Social media / YouTube', Icon: Smartphone },
      { value: 'notsure', label: "I'm not sure yet", Icon: HelpCircle },
    ],
  },
  {
    id: 'frequency',
    question: 'How often do you need updates?',
    options: [
      { value: 'daily', label: 'Daily', Icon: CalendarClock },
      { value: 'weekly', label: 'Weekly', Icon: Calendar },
      { value: 'monthly', label: 'Monthly', Icon: CalendarDays },
      { value: 'realtime', label: 'As soon as something changes', Icon: Bell },
    ],
  },
  {
    id: 'team',
    question: 'How big is your team?',
    options: [
      { value: 'solo', label: 'Just me', Icon: User },
      { value: 'small', label: '2–5 people', Icon: Users },
      { value: 'medium', label: '6–20 people', Icon: Building2 },
      { value: 'large', label: '20+', Icon: Building },
    ],
  },
];

type Answers = Record<string, string>;

const recommendations: { condition: (a: Answers) => boolean; title: string; category: string; color: string; desc: string; saved: string }[] = [
  {
    condition: a => a.pain === 'finance' || a.data === 'sheets',
    title: 'Weekly Business Report',
    category: 'Finance',
    color: '#10B981',
    desc: 'Monitors your Google Sheets, pulls revenue and expenses, and emails you a clear weekly summary with flags and recommendations.',
    saved: '3 hrs/week',
  },
  {
    condition: a => a.pain === 'competitors' || a.data === 'websites',
    title: 'Website Change Monitor',
    category: 'Operations',
    color: '#635BFF',
    desc: 'Watches competitor sites and your own pages for changes, then sends you a diff report so you never miss a price or feature update.',
    saved: '2 hrs/week',
  },
  {
    condition: a => a.pain === 'reports' && a.frequency === 'weekly',
    title: 'Data Insight Generator',
    category: 'Marketing',
    color: '#F59E0B',
    desc: 'Connects to any dataset you share and sends plain-English insights and key takeaways — no spreadsheet touching required.',
    saved: '4 hrs/week',
  },
  {
    condition: a => a.pain === 'content' || a.data === 'social',
    title: 'YouTube Trend Tracker',
    category: 'Research',
    color: '#EF4444',
    desc: 'Scans YouTube for trending topics in your niche and delivers a weekly brief on what content is gaining traction.',
    saved: '2 hrs/week',
  },
  {
    condition: a => a.frequency === 'daily' || a.team === 'medium' || a.team === 'large',
    title: 'Sales Pipeline Health',
    category: 'Sales',
    color: '#4285F4',
    desc: 'Monitors your pipeline data for stalled deals and probability shifts, alerting you before at-risk deals go cold.',
    saved: '5 hrs/week',
  },
];

function getRecommendations(answers: Answers) {
  const matched = recommendations.filter(r => r.condition(answers));
  // Always return at least 2, fall back to first two if nothing matches
  return matched.length >= 2 ? matched.slice(0, 3) : recommendations.slice(0, 2);
}

export default function QuizPage() {
  const [step, setStep] = useState<number>(0); // 0 = intro
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const currentQ = questions[step - 1];
  const totalSteps = questions.length;
  const progress = step > 0 ? (step / totalSteps) * 100 : 0;

  function handleAnswer(value: string) {
    const newAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(newAnswers);
    if (step === totalSteps) {
      setDone(true);
    } else {
      setStep(s => s + 1);
    }
  }

  const recs = getRecommendations(answers);

  return (
    <div className="min-h-screen bg-brand-light flex flex-col">
      {/* Nav */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-brand-dark/10 bg-white">
        <Link to="/">
          <img src="/logo.svg" alt="Hoursback" className="h-8 w-auto" />
        </Link>
        {step > 0 && !done && (
          <span className="text-sm text-brand-dark/40">{step} of {totalSteps}</span>
        )}
      </div>

      {/* Progress bar */}
      {step > 0 && !done && (
        <div className="h-1 bg-brand-dark/10">
          <motion.div
            className="h-full bg-brand-blue"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Intro */}
          {step === 0 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg w-full text-center"
            >
              <div className="w-16 h-16 bg-brand-blue rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold mb-4">Find your perfect workflow</h1>
              <p className="text-brand-dark/60 mb-8 leading-relaxed">
                Answer 4 quick questions and we'll recommend the AI workflows that will save you the most time.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep(1)}
                className="px-8 py-3.5 bg-brand-dark text-white rounded-full font-semibold flex items-center gap-2 mx-auto group"
              >
                Let's go
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}

          {/* Question */}
          {step > 0 && !done && (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl w-full"
            >
              {step > 1 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1 text-sm text-brand-dark/50 hover:text-brand-dark mb-6 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <h2 className="text-2xl md:text-3xl font-semibold mb-8">{currentQ.question}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options.map(opt => (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(opt.value)}
                    className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-brand-dark/10 hover:border-brand-blue hover:shadow-md transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0 group-hover:bg-brand-blue/20 transition-colors">
                      <opt.Icon className="w-4 h-4 text-brand-blue" />
                    </div>
                    <span className="font-medium text-brand-dark group-hover:text-brand-blue transition-colors">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {done && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl w-full"
            >
              <div className="text-center mb-10">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold mb-2">Your recommended workflows</h2>
                <p className="text-brand-dark/60">Based on your answers, these will save you the most time.</p>
              </div>

              <div className="space-y-4 mb-8">
                {recs.map((r, i) => (
                  <motion.div
                    key={r.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl border border-brand-dark/10 p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="w-2 self-stretch rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${r.color}18`, color: r.color }}>{r.category}</span>
                      </div>
                      <h3 className="font-bold text-brand-dark mb-1">{r.title}</h3>
                      <p className="text-sm text-brand-dark/60 leading-relaxed">{r.desc}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-brand-dark/40">
                        <Clock className="w-3 h-3" /> Saves ~{r.saved}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/workflows/new">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-7 py-3.5 bg-brand-dark text-white rounded-full font-semibold flex items-center gap-2 group"
                  >
                    Deploy a workflow now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                <button
                  onClick={() => { setStep(0); setAnswers({}); setDone(false); }}
                  className="px-7 py-3.5 border border-brand-dark/20 text-brand-dark rounded-full font-medium hover:bg-brand-dark/5 transition-colors"
                >
                  Retake quiz
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
