import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    ChevronLeft,
    Clock,
    Zap,
    ArrowRight,
    BookOpen,
    GraduationCap,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategoryColor } from '../data/playbooks';
import { claudeCrashCoursePlaybooks } from '../data/playbooks';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }
    }
};

export default function CrashCoursePage() {
    const headerRef = useRef<HTMLElement>(null);
    const isInView = useInView(headerRef, { once: true });
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('crashCourseCompleted');
        if (saved) setCompletedLessons(new Set(JSON.parse(saved)));
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            setAuthModalOpen(true);
        }
    }, [authLoading, user]);

    const playbooks = claudeCrashCoursePlaybooks;
    const totalMinutes = playbooks.reduce((sum, pb) => sum + pb.timeToComplete, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const completedCount = completedLessons.size;
    const progressPercent = Math.round((completedCount / playbooks.length) * 100);

    const difficultyIcon = (d: string) => {
        if (d === 'Beginner') return '🟢';
        if (d === 'Intermediate') return '🟡';
        return '🔴';
    };

    return (
        <div className="min-h-screen bg-brand-light text-brand-dark">
            {/* Navigation */}
            <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/playbooks" className="flex items-center gap-2 text-brand-dark/70 hover:text-brand-dark transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-sm">Back to Playbooks</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white shadow-antigravity-md border border-brand-dark/10 rounded-full">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#DA7756] transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="text-xs text-brand-dark/70">{completedCount}/{playbooks.length}</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-16 pb-12" ref={headerRef}>
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-[#DA7756] flex items-center justify-center shadow-antigravity-sm">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-[#DA7756] uppercase tracking-widest">Free Course</span>
                                <div className="flex items-center gap-2 text-xs text-brand-dark/50">
                                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {playbooks.length} lessons</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {totalHours} hours total</span>
                                </div>
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-semibold mb-4">
                            Claude Crash Course
                        </h1>
                        <p className="text-xl text-brand-dark/70 leading-relaxed">
                            Go from zero to fluent with Claude in {totalHours} hours. Every lesson is hands-on —
                            you'll get ready-to-copy prompts, real examples, and a concrete deliverable by the end of each one.
                        </p>

                        {/* Stats bar */}
                        <div className="flex flex-wrap items-center gap-6 mt-8 text-sm text-brand-dark/60">
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-[#DA7756]" />
                                100% prompt-based
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-[#DA7756]" />
                                No prerequisites
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-[#DA7756]" />
                                Free for all users
                            </span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Lessons Grid */}
            <section className="pb-20">
                <div className="container mx-auto px-6">
                    <motion.div
                        className="space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {playbooks.map((playbook, index) => {
                            const color = getCategoryColor(playbook.category);
                            const isCompleted = completedLessons.has(playbook.id);
                            return (
                                <motion.div
                                    key={playbook.id}
                                    variants={itemVariants}
                                    whileHover={{ x: 4 }}
                                >
                                    <Link to={`/playbooks/${playbook.slug}`}>
                                        <div className={`group relative bg-white shadow-antigravity-md border rounded-3xl overflow-hidden transition-all hover:shadow-antigravity-lg ${isCompleted ? 'border-green-500/30' : 'border-brand-dark/10'
                                            }`}>
                                            {/* Lesson number accent */}
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl"
                                                style={{ backgroundColor: color }}
                                            />

                                            <div className="p-6 pl-8 flex items-center gap-6">
                                                {/* Lesson number */}
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold ${isCompleted
                                                    ? 'bg-green-500/15 text-green-600'
                                                    : 'bg-[#DA7756]/10 text-[#DA7756]'
                                                    }`}>
                                                    {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : index + 1}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs text-brand-dark/40 uppercase tracking-wider font-semibold">
                                                            Lesson {index + 1}
                                                        </span>
                                                        <span className="text-xs text-brand-dark/30">
                                                            {difficultyIcon(playbook.difficulty)} {playbook.difficulty}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-semibold group-hover:text-[#DA7756] transition-colors line-clamp-1">
                                                        {playbook.title}
                                                    </h3>
                                                    <p className="text-brand-dark/60 text-sm mt-1 line-clamp-1">
                                                        {playbook.subtitle}
                                                    </p>

                                                    {/* Meta */}
                                                    <div className="flex items-center gap-4 mt-3 text-xs text-brand-dark/40">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {playbook.timeToComplete} min
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen className="w-3 h-3" />
                                                            {playbook.steps.length} steps
                                                        </span>
                                                        {playbook.timeSaved > 0 && (
                                                            <span className="flex items-center gap-1 text-[#DA7756]">
                                                                <Zap className="w-3 h-3" />
                                                                Saves {playbook.timeSaved} min
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <div className="shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-brand-dark/5 flex items-center justify-center group-hover:bg-[#DA7756] group-hover:text-white transition-all">
                                                        <ArrowRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-12 text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#DA7756]/10 text-[#DA7756] rounded-full text-sm font-medium">
                            <GraduationCap className="w-4 h-4" />
                            Complete all {playbooks.length} lessons to master Claude
                        </div>
                    </motion.div>
                </div>
            </section>

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => { setAuthModalOpen(false); navigate('/playbooks'); }}
                defaultView="signup"
            />
        </div>
    );
}
