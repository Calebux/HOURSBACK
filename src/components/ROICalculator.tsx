import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ROICalculator() {
  const [hours, setHours] = useState(5);
  const [rate, setRate] = useState(50);
  const [teamSize, setTeamSize] = useState(1);

  const hoursPerMonth = hours * 4.3 * teamSize;
  const savedPerMonth = hoursPerMonth * rate;
  const proCost = 20;
  const netSavings = savedPerMonth - proCost;
  const annualSavings = netSavings * 12;

  return (
    <section className="py-24 bg-brand-light">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-brand-blue uppercase tracking-widest mb-3">ROI Calculator</p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">How much time are you leaving on the table?</h2>
          <p className="text-brand-dark/60 max-w-xl mx-auto">
            Adjust the numbers to match your situation. Most users are surprised by the result.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-brand-dark/10 shadow-antigravity-md overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Inputs */}
            <div className="p-5 sm:p-8 border-b md:border-b-0 md:border-r border-brand-dark/10">
              <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-widest mb-7">Your situation</p>

              <div className="space-y-8">
                {/* Hours slider */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-brand-dark">Hours on manual reporting per week</label>
                    <span className="text-xl font-bold text-brand-blue">{hours}h</span>
                  </div>
                  <input
                    type="range" min={1} max={20} value={hours}
                    onChange={e => setHours(Number(e.target.value))}
                    className="w-full accent-brand-blue h-2 rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-brand-dark/30 mt-1">
                    <span>1h</span><span>20h</span>
                  </div>
                </div>

                {/* Rate input */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-brand-dark">Your hourly rate (USD)</label>
                    <span className="text-xl font-bold text-brand-blue">${rate}</span>
                  </div>
                  <input
                    type="range" min={10} max={300} step={5} value={rate}
                    onChange={e => setRate(Number(e.target.value))}
                    className="w-full accent-brand-blue h-2 rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-brand-dark/30 mt-1">
                    <span>$10</span><span>$300</span>
                  </div>
                </div>

                {/* Team size */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-brand-dark">Team members doing this work</label>
                    <span className="text-xl font-bold text-brand-blue">{teamSize}</span>
                  </div>
                  <input
                    type="range" min={1} max={10} value={teamSize}
                    onChange={e => setTeamSize(Number(e.target.value))}
                    className="w-full accent-brand-blue h-2 rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-brand-dark/30 mt-1">
                    <span>Just me</span><span>10 people</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="p-5 sm:p-8 bg-brand-dark text-white flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-7">With Hoursback</p>

                <div className="space-y-5">
                  <div className="flex items-center justify-between py-4 border-b border-white/10">
                    <span className="text-white/60 text-sm">Hours saved / month</span>
                    <motion.span
                      key={hoursPerMonth}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl sm:text-2xl font-bold text-white"
                    >
                      {hoursPerMonth.toFixed(0)}h
                    </motion.span>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-white/10">
                    <span className="text-white/60 text-sm">Value recovered / month</span>
                    <motion.span
                      key={savedPerMonth}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xl sm:text-2xl font-bold text-white"
                    >
                      ${savedPerMonth.toLocaleString()}
                    </motion.span>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-white/10">
                    <span className="text-white/60 text-sm">Hoursback Pro cost</span>
                    <span className="text-sm font-medium text-white/50">−$20/mo</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-semibold text-white">Net savings / year</span>
                    <motion.span
                      key={annualSavings}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-2xl sm:text-3xl font-bold text-brand-blue"
                    >
                      ${annualSavings.toLocaleString()}
                    </motion.span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4 text-xs text-white/40">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    You spend {hours * teamSize}h/week at ${rate}/hr = ${(hours * teamSize * rate).toLocaleString()}/week wasted.
                    Hoursback Pro ($20/mo) turns that into ${netSavings.toLocaleString()}/mo in net savings.
                  </span>
                </div>
                <Link to="/workflows/new">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 bg-brand-blue text-white rounded-full font-semibold flex items-center justify-center gap-2 group text-sm hover:bg-brand-blue/90 transition-colors"
                  >
                    Start saving time — free to begin
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
