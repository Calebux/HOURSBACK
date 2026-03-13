import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Zap, Wrench, ArrowRight, Bot } from 'lucide-react';
import { getCategoryColor, type Playbook, allPlaybooks } from '../data/playbooks';
import { fetchPlaybookBySlug } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';

export default function WorkflowDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<Playbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      if (slug) setWorkflow(await fetchPlaybookBySlug(slug));
      setIsLoading(false);
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!authLoading && !user) setAuthModalOpen(true);
  }, [authLoading, user]);

  const related = useMemo(() => {
    if (!workflow) return [];
    return allPlaybooks
      .filter(p => p.category === workflow.category && p.id !== workflow.id)
      .slice(0, 3);
  }, [workflow]);

  const handleDeploy = () => {
    if (!user) { setAuthModalOpen(true); return; }
    navigate(`/workflows/new?id=${workflow?.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-dark/20 border-t-brand-dark rounded-full animate-spin" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-brand-dark/60">Workflow not found.</p>
        <Link to="/playbooks" className="text-brand-blue hover:underline text-sm">Back to catalog</Link>
      </div>
    );
  }

  const categoryColor = getCategoryColor(workflow.category);

  return (
    <div className="min-h-screen bg-slate-50 text-brand-dark">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultView="signup" />

      {/* Nav */}
      <nav className="bg-white border-b border-brand-dark/10 px-6 py-4 flex items-center gap-4">
        <Link to="/playbooks" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm text-brand-dark/50">Workflow Catalog</span>
      </nav>

      <div className="container mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
            style={{ backgroundColor: `${categoryColor}18`, color: categoryColor }}
          >
            {workflow.category}
          </span>
          <h1 className="text-4xl font-bold mb-3">{workflow.title}</h1>
          <p className="text-xl text-brand-dark/60">{workflow.subtitle}</p>

          <div className="flex items-center gap-6 mt-6 text-sm text-brand-dark/60">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Saves ~{workflow.timeSaved} min/week
            </span>
            <span className="flex items-center gap-1.5">
              <Bot className="w-4 h-4" />
              Runs automatically
            </span>
            {workflow.isPro && (
              <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                <Zap className="w-4 h-4" />
                Pro
              </span>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4 mb-10">
          {/* Expected Output */}
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-6">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              What you'll receive
            </h2>
            <p className="text-brand-dark/70">{workflow.expectedOutcome}</p>
          </div>

          {/* Tools */}
          {workflow.tools.length > 0 && (
            <div className="bg-white rounded-2xl border border-brand-dark/10 p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-500" />
                Integrations used
              </h2>
              <div className="flex flex-wrap gap-2">
                {workflow.tools.map(tool => (
                  <span key={tool} className="text-sm px-3 py-1 bg-slate-100 text-brand-dark/70 rounded-full">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Deploy CTA */}
        <div className="bg-brand-dark rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Deploy this workflow</h2>
          <p className="text-white/60 mb-6 text-sm">
            Set your trigger, connect your data source, and it runs automatically.
          </p>
          <button
            onClick={handleDeploy}
            className="bg-white text-brand-dark font-semibold px-8 py-3 rounded-full hover:bg-slate-100 transition-colors inline-flex items-center gap-2"
          >
            Deploy now <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="font-semibold mb-4 text-brand-dark/60 text-sm uppercase tracking-wide">
              More in {workflow.category}
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(p => (
                <Link
                  key={p.id}
                  to={`/playbooks/${p.slug}`}
                  className="bg-white border border-brand-dark/10 rounded-xl p-4 hover:border-brand-dark/20 hover:shadow-sm transition-all group"
                >
                  <p className="font-semibold text-sm group-hover:text-brand-blue transition-colors">{p.title}</p>
                  <p className="text-xs text-brand-dark/50 mt-1 line-clamp-2">{p.subtitle}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
