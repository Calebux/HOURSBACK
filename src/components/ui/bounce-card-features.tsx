import { motion } from "framer-motion";
import { Zap, Mail, Bot, Users } from "lucide-react";

export const BouncyCardsFeatures = () => {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-16 text-brand-dark">
      {/* Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end md:px-2">
        <h2 className="max-w-lg text-4xl font-bold md:text-5xl leading-tight">
          Everything you need to automate your business
          <span style={{ color: "#4285F4" }}> intelligence.</span>
        </h2>
        <p className="text-brand-dark/60 text-base max-w-xs md:text-right">
          Built for operators, not developers. Deploy once and let AI do the rest.
        </p>
      </div>

      {/* Row 1 */}
      <div className="mb-4 grid grid-cols-12 gap-4">
        {/* Card 1 — 15+ Workflows */}
        <BounceCard className="col-span-12 md:col-span-4" accentColor="#4285F4">
          <CardIcon icon={<Zap className="w-5 h-5 text-white" />} color="#4285F4" />
          <CardTitle>15+ Ready-to-Deploy Workflows</CardTitle>
          <div className="absolute bottom-0 left-4 right-4 top-36 translate-y-8 rounded-t-2xl bg-gradient-to-br from-[#4285F4] to-[#1a56db] p-5 transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Categories</p>
            <div className="flex flex-wrap gap-2">
              {["Finance", "Sales", "Marketing", "Operations", "Research", "Executive"].map((cat) => (
                <span key={cat} className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                  {cat}
                </span>
              ))}
            </div>
            <p className="text-white/80 text-xs mt-4 leading-relaxed">
              Pick one, connect your data, deploy in under 5 minutes.
            </p>
          </div>
        </BounceCard>

        {/* Card 2 — Email Delivery */}
        <BounceCard className="col-span-12 md:col-span-8" accentColor="#202124">
          <CardIcon icon={<Mail className="w-5 h-5 text-white" />} color="#202124" />
          <CardTitle>Insights Delivered to Your Inbox</CardTitle>
          <div className="absolute bottom-0 left-4 right-4 top-36 translate-y-8 rounded-t-2xl bg-[#202124] p-5 transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]">
            {/* Mock email */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#4285F4] flex items-center justify-center text-white text-[9px] font-bold shrink-0">H</div>
              <div>
                <p className="text-white text-xs font-semibold leading-none">Hoursback Autopilot</p>
                <p className="text-white/40 text-[10px]">autopilot@hoursback.xyz</p>
              </div>
            </div>
            <p className="text-white text-sm font-semibold mb-1">[Weekly CEO Briefing] Mar 17 Report</p>
            <div className="space-y-1.5">
              {[
                "Revenue up 12% vs last week — ₦4.2M",
                "2 invoices overdue: Acme Corp, Bello Ltd",
                "Competitor dropped pricing by 8% yesterday",
              ].map((line, i) => (
                <p key={i} className="text-white/60 text-xs flex items-start gap-1.5">
                  <span className="text-[#4285F4] shrink-0">✦</span> {line}
                </p>
              ))}
            </div>
            <p className="text-white/30 text-[10px] mt-3">No login required · Delivered every Monday 8:00 AM</p>
          </div>
        </BounceCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-12 gap-4">
        {/* Card 3 — Claude AI */}
        <BounceCard className="col-span-12 md:col-span-8" accentColor="#7c3aed">
          <CardIcon icon={<Bot className="w-5 h-5 text-white" />} color="#7c3aed" />
          <CardTitle>Powered by Claude AI</CardTitle>
          <div className="absolute bottom-0 left-4 right-4 top-36 translate-y-8 rounded-t-2xl bg-gradient-to-br from-[#7c3aed] to-[#4285F4] p-5 transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-2">AI Analysis</p>
            <p className="text-white text-sm font-semibold mb-2">## Executive Summary</p>
            <p className="text-white/80 text-xs leading-relaxed">
              Cash position improved by <span className="text-white font-semibold">₦1.8M</span> this week driven by the Zenith settlement. Three invoices remain at risk — recommend immediate follow-up with Acme Corp (₦650k, 47 days overdue).
            </p>
            <div className="mt-3 flex gap-2">
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">Real numbers only</span>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">No hallucinations</span>
            </div>
          </div>
        </BounceCard>

        {/* Card 4 — No Code */}
        <BounceCard className="col-span-12 md:col-span-4" accentColor="#DA7756">
          <CardIcon icon={<Users className="w-5 h-5 text-white" />} color="#DA7756" />
          <CardTitle>Zero Code Required</CardTitle>
          <div className="absolute bottom-0 left-4 right-4 top-36 translate-y-8 rounded-t-2xl bg-gradient-to-br from-[#DA7756] to-[#c05a38] p-5 transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]">
            <p className="text-white/80 text-xs font-semibold mb-3">Deploy in 3 steps:</p>
            <div className="space-y-2">
              {["Pick a workflow", "Paste your Sheet URL", "Set your schedule"].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-white text-xs">{step}</p>
                </div>
              ))}
            </div>
            <p className="text-white/60 text-[10px] mt-3">If you can write an email, you can do this.</p>
          </div>
        </BounceCard>
      </div>
    </section>
  );
};

const BounceCard = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
  accentColor?: string;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 0.95, rotate: "-1deg" }}
      className={`group relative min-h-[300px] cursor-pointer overflow-hidden rounded-3xl bg-[#F8F9FA] p-7 ${className}`}
    >
      {children}
    </motion.div>
  );
};

const CardIcon = ({ icon, color }: { icon: React.ReactNode; color: string }) => (
  <div
    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
    style={{ backgroundColor: color }}
  >
    {icon}
  </div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => {
  return (
    <h3 className="text-xl font-bold text-brand-dark leading-snug max-w-[80%]">{children}</h3>
  );
};
