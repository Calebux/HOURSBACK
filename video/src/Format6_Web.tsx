import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, interpolate, spring } from 'remotion';
import { fi, fo, frange, sp, Logo } from './shared';

// ─── Timing ────────────────────────────────────────────────────────────────
const INTRO_F   = 60;
const S1_F      = 290;  // Dashboard
const S2_F      = 290;  // Choose workflow (Step 1)
const S3_F      = 300;  // Configure (Step 2-3 + deploy)
const S4_F      = 160;  // Deploy success
const S5_F      = 370;  // Email output
const CTA_F     = 200;
const OVL       = 30;   // crossfade overlap

export const FORMAT6_TOTAL_FRAMES =
  INTRO_F + S1_F + S2_F + S3_F + S4_F + S5_F + CTA_F;
// 60+290+290+300+160+370+200 = 1670 ≈ 55.7s

// ─── Brand colors (exact from tailwind.config.js) ──────────────────────────
const B = {
  dark:   '#202124',
  light:  '#F8F9FA',
  blue:   '#4285F4',
  red:    '#EA4335',
  yellow: '#FBBC04',
  gray:   '#E8EAED',
  // extended
  coral:  '#DA7756',   // active nav
  border: '#E2E8F0',
  muted:  '#64748b',
  // category colors
  finance:    '#4285F4',
  sales:      '#10b981',
  ops:        '#f59e0b',
  hr:         '#8b5cf6',
  marketing:  '#ef4444',
  exec:       '#0ea5e9',
};
const E  = { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' }; // emerald
const Am = { bg: '#fffbeb', border: '#fde68a', text: '#92400e' }; // amber

// ─── ZoomLens ──────────────────────────────────────────────────────────────
const ZoomLens: React.FC<{
  frame: number; fps: number;
  zIn: number; zOut: number;
  scale?: number; oX?: string; oY?: string;
  children: React.ReactNode;
}> = ({ frame, fps, zIn, zOut, scale = 1.7, oX = '50%', oY = '40%', children }) => {
  const sIn  = interpolate(spring({ frame: frame - zIn,  fps, config: { damping: 24, stiffness: 80 } }), [0, 1], [1, scale]);
  const sOut = interpolate(spring({ frame: frame - zOut, fps, config: { damping: 24, stiffness: 80 } }), [0, 1], [scale, 1]);
  const s = frame < zIn ? 1 : frame < zOut ? sIn : sOut;
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, transform: `scale(${s})`, transformOrigin: `${oX} ${oY}` }}>
      {children}
    </div>
  );
};

// ─── TapRipple ─────────────────────────────────────────────────────────────
const Tap: React.FC<{ frame: number; at: number; x: string; y: string; color?: string }> = ({
  frame, at, x, y, color = 'rgba(66,133,244,0.45)',
}) => {
  const e = frame - at;
  if (e < 0 || e > 48) return null;
  const sz = interpolate(e, [0, 42], [16, 110], { extrapolateRight: 'clamp' });
  const op = interpolate(e, [0, 5, 42], [0, 0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', width: sz, height: sz, borderRadius: '50%', background: color, opacity: op, zIndex: 500, pointerEvents: 'none' }} />;
};

// ─── Hoursback nav (exact app style) ──────────────────────────────────────
const AppNav: React.FC<{ active: 'Workflows' | 'Browse' | 'Reports' }> = ({ active }) => (
  <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', height: 60, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${B.gray}`, flexShrink: 0 }}>
    <Logo width={138} />
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {(['Browse', 'Workflows', 'Reports'] as const).map(tab => (
        <div key={tab} style={{ padding: '6px 12px', borderRadius: 8, background: tab === active ? `${B.coral}14` : 'transparent', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 15, fontWeight: tab === active ? 700 : 500, color: tab === active ? B.coral : B.muted, fontFamily: 'system-ui' }}>{tab}</span>
        </div>
      ))}
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: B.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 6 }}>
        <span style={{ fontSize: 13, color: '#fff', fontWeight: 700, fontFamily: 'system-ui' }}>AO</span>
      </div>
    </div>
  </div>
);

// ─── Wizard nav (back arrow + step indicator) ─────────────────────────────
const WizardNav: React.FC<{ step: 1 | 2 | 3; title: string }> = ({ step, title }) => (
  <div style={{ background: '#fff', height: 60, display: 'flex', alignItems: 'center', padding: '0 18px', borderBottom: `1px solid ${B.gray}`, flexShrink: 0, gap: 14 }}>
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: B.light, border: `1px solid ${B.gray}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 18, color: B.muted }}>‹</span>
    </div>
    <span style={{ fontFamily: 'system-ui', fontSize: 18, fontWeight: 700, color: B.dark, flex: 1 }}>{title}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[1, 2, 3].map(n => (
        <React.Fragment key={n}>
          {n > 1 && <div style={{ width: 22, height: 2, background: n <= step ? B.blue : B.gray, borderRadius: 2 }} />}
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: n < step ? B.blue : n === step ? B.blue : B.gray, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, color: n <= step ? '#fff' : B.muted }}>
              {n < step ? '✓' : n}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  </div>
);

// ─── Workflow card (dashboard style) ──────────────────────────────────────
const WorkflowCard: React.FC<{
  name: string; category: string; categoryColor: string;
  schedule: string; lastRan: string; successRate: number;
  op: number;
}> = ({ name, category, categoryColor, schedule, lastRan, successRate, op }) => (
  <div style={{ opacity: op, background: '#fff', borderRadius: 14, border: `1.5px solid ${B.border}`, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#10b981', flexShrink: 0, boxShadow: '0 0 0 3px #d1fae5' }} />
        <span style={{ fontFamily: 'system-ui', fontSize: 16, fontWeight: 700, color: B.dark }}>{name}</span>
      </div>
      <div style={{ padding: '3px 8px', borderRadius: 6, background: `${categoryColor}14`, border: `1px solid ${categoryColor}33` }}>
        <span style={{ fontFamily: 'system-ui', fontSize: 11, fontWeight: 600, color: categoryColor }}>{category}</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: B.muted }}>🕐</span>
      <span style={{ fontFamily: 'system-ui', fontSize: 13, color: B.muted }}>{schedule} · Last ran {lastRan}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: '#059669', background: '#f0fdf4', padding: '3px 8px', borderRadius: 20 }}>{successRate}% success</span>
      <div style={{ background: '#10b981', borderRadius: 8, padding: '6px 14px' }}>
        <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 700, color: '#fff' }}>▶ Run now</span>
      </div>
    </div>
  </div>
);

// ─── Scene 1: Workflows Dashboard ─────────────────────────────────────────
const DashboardScene: React.FC<{ isLast: boolean }> = ({ isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneSlide = sp(frame, fps, 20, 100);
  const slideY = interpolate(phoneSlide, [0, 1], [100, 0]);
  const phoneOp = fi(frame, 0, 18);
  const fadeOut = isLast ? 1 : fo(frame, S1_F - 32, 28);
  const r = (s: number) => fi(frame, s, 14);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 36%, ${B.blue}18 0%, #0a0f1e 65%)`, opacity: fadeOut }}>
      <div style={{ position: 'absolute', top: 52, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 100, opacity: frange(frame, 5, 16, S1_F - 44, 22) }}>
        <div style={{ background: `${B.blue}22`, border: `1.5px solid ${B.blue}60`, borderRadius: 40, padding: '10px 38px' }}>
          <span style={{ fontFamily: 'system-ui', fontSize: 26, fontWeight: 700, color: B.blue }}>Your Workflows Dashboard</span>
        </div>
      </div>
      <div style={{ transform: `translateY(${slideY}px)`, opacity: phoneOp }}>
        <div style={{ position: 'absolute', left: 140, top: 120, width: 800, height: 1680, borderRadius: 54, background: '#111', padding: 14, boxShadow: '0 60px 160px rgba(0,0,0,0.75), inset 0 0 0 1.5px rgba(255,255,255,0.1)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: B.light, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 130, height: 36, background: '#000', borderRadius: 20, zIndex: 200 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, display: 'flex', alignItems: 'flex-end', paddingBottom: 10, paddingLeft: 28, paddingRight: 28, zIndex: 100 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: B.dark, fontFamily: 'system-ui' }}>9:41</span>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>{[8, 12, 16, 20].map((h, i) => <div key={i} style={{ width: 4, height: h, background: B.dark, borderRadius: 2 }} />)}</div>
                <div style={{ width: 30, height: 15, border: `2px solid ${B.dark}`, borderRadius: 4, padding: 2 }}><div style={{ width: '78%', height: '100%', background: B.dark, borderRadius: 2 }} /></div>
              </div>
            </div>
            <div style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
              <ZoomLens frame={frame} fps={fps} zIn={110} zOut={220} scale={1.6} oY="26%">
                <div style={{ background: B.light, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <AppNav active="Workflows" />

                  <div style={{ flex: 1, padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
                    {/* Page header */}
                    <div style={{ opacity: r(8), display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontFamily: 'system-ui', fontSize: 22, fontWeight: 800, color: B.dark, margin: '0 0 2px' }}>My Workflows</p>
                        <p style={{ fontFamily: 'system-ui', fontSize: 13, color: B.muted, margin: 0 }}>Automated AI agents running on your schedule.</p>
                      </div>
                      <div style={{ background: B.dark, borderRadius: 10, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 15, color: '#fff' }}>+</span>
                        <span style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 700, color: '#fff' }}>Create Workflow</span>
                      </div>
                    </div>

                    {/* Stats bar */}
                    <div style={{ opacity: r(18), background: '#fff', borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${B.border}`, display: 'flex', gap: 0 }}>
                      {[
                        { icon: '◉', label: 'Active Workflows', value: '2', color: '#10b981' },
                        { icon: '▶', label: 'Total Runs', value: '47', color: B.blue },
                        { icon: '↗', label: 'Success Rate', value: '94%', color: '#8b5cf6' },
                      ].map((s, i) => (
                        <div key={s.label} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? `1px solid ${B.border}` : 'none' }}>
                          <p style={{ fontFamily: 'system-ui', fontSize: 22, fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                          <p style={{ fontFamily: 'system-ui', fontSize: 11, color: B.muted, margin: 0 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Workflow cards */}
                    <WorkflowCard name="Daily Cash Reconciliation" category="Finance" categoryColor={B.finance} schedule="Daily 6:00 PM" lastRan="2h ago" successRate={97} op={r(28)} />
                    <WorkflowCard name="Weekly CEO Briefing" category="Executive" categoryColor={B.exec} schedule="Weekly Mon 7:00 AM" lastRan="1d ago" successRate={92} op={r(38)} />

                    {/* Recent runs sidebar inline */}
                    <div style={{ opacity: r(48), background: '#fff', borderRadius: 14, border: `1.5px solid ${B.border}`, padding: '12px 14px' }}>
                      <p style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 700, color: B.dark, margin: '0 0 8px' }}>Recent Runs</p>
                      {[
                        { name: 'Daily Cash Reconciliation', time: '2h ago', ok: true },
                        { name: 'Weekly CEO Briefing', time: '1d ago', ok: true },
                        { name: 'Daily Cash Reconciliation', time: '1d ago', ok: true },
                      ].map((run, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: i > 0 ? `1px solid ${B.border}` : 'none' }}>
                          <span style={{ fontSize: 14, color: run.ok ? '#10b981' : '#ef4444' }}>{run.ok ? '✓' : '✗'}</span>
                          <span style={{ fontFamily: 'system-ui', fontSize: 13, color: B.dark, flex: 1 }}>{run.name}</span>
                          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: B.muted }}>{run.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Tap frame={frame} at={148} x="78%" y="24%" color="rgba(32,33,36,0.35)" />
              </ZoomLens>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Step 1 — Choose Workflow ────────────────────────────────────
const ChooseWorkflowScene: React.FC<{ isLast: boolean }> = ({ isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideY = interpolate(sp(frame, fps, 20, 100), [0, 1], [100, 0]);
  const phoneOp = fi(frame, 0, 18);
  const fadeOut = isLast ? 1 : fo(frame, S2_F - 32, 28);
  const r = (s: number) => fi(frame, s, 13);

  const wfCards = [
    { name: 'Daily Cash Reconciliation Bot', desc: 'Staff type /reconcile — the bot calculates variance and logs it.', time: '~40 min/day', cat: 'Finance', col: B.finance, selected: true },
    { name: 'Cash Flow Weekly', desc: 'Weekly cash position with trends and runway analysis.', time: '~30 min/wk', cat: 'Finance', col: B.finance, selected: false },
    { name: 'Weekly CEO Briefing', desc: 'Plain-English executive summary from your Google Sheets.', time: '~2 hrs/wk', cat: 'Executive', col: B.exec, selected: false },
    { name: 'Shift Handover Bot', desc: 'Staff type /handover — structured logs every shift.', time: '~20 min/day', cat: 'HR', col: B.hr, selected: false },
  ];

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 36%, ${B.yellow}18 0%, #0a0f1e 65%)`, opacity: fadeOut }}>
      <div style={{ position: 'absolute', top: 52, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 100, opacity: frange(frame, 5, 16, S2_F - 44, 22) }}>
        <div style={{ background: `${B.yellow}30`, border: `1.5px solid ${B.yellow}80`, borderRadius: 40, padding: '10px 38px' }}>
          <span style={{ fontFamily: 'system-ui', fontSize: 26, fontWeight: 700, color: '#92400e' }}>Step 1 — Choose a Workflow</span>
        </div>
      </div>
      <div style={{ transform: `translateY(${slideY}px)`, opacity: phoneOp }}>
        <div style={{ position: 'absolute', left: 140, top: 120, width: 800, height: 1680, borderRadius: 54, background: '#111', padding: 14, boxShadow: '0 60px 160px rgba(0,0,0,0.75), inset 0 0 0 1.5px rgba(255,255,255,0.1)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: B.light, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 130, height: 36, background: '#000', borderRadius: 20, zIndex: 200 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, display: 'flex', alignItems: 'flex-end', paddingBottom: 10, paddingLeft: 28, paddingRight: 28, zIndex: 100 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: B.dark, fontFamily: 'system-ui' }}>9:42</span>
            </div>
            <div style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
              <ZoomLens frame={frame} fps={fps} zIn={105} zOut={215} scale={1.65} oY="23%">
                <div style={{ background: B.light, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <WizardNav step={1} title="Choose a workflow" />

                  <div style={{ flex: 1, padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
                    {/* Category filters */}
                    <div style={{ opacity: r(8), display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { label: 'All', active: true },
                        { label: 'Finance', active: false },
                        { label: 'Operations', active: false },
                        { label: 'HR', active: false },
                        { label: 'Sales', active: false },
                      ].map(f => (
                        <div key={f.label} style={{ padding: '5px 12px', borderRadius: 20, background: f.active ? B.dark : '#fff', border: `1.5px solid ${f.active ? B.dark : B.border}` }}>
                          <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: f.active ? 700 : 400, color: f.active ? '#fff' : B.muted }}>{f.label}</span>
                        </div>
                      ))}
                    </div>

                    <p style={{ fontFamily: 'system-ui', fontSize: 13, color: B.muted, margin: 0, opacity: r(14) }}>Click any workflow to configure and deploy it.</p>

                    {/* Workflow grid */}
                    {wfCards.map((wf, i) => (
                      <div key={wf.name} style={{
                        opacity: fi(frame, 18 + i * 10, 12),
                        background: wf.selected ? '#eff6ff' : '#fff',
                        borderRadius: 14, overflow: 'hidden',
                        border: `2px solid ${wf.selected ? B.blue : B.border}`,
                        boxShadow: wf.selected ? `0 0 0 3px ${B.blue}20` : '0 1px 3px rgba(0,0,0,0.04)',
                      }}>
                        <div style={{ height: 3, background: wf.col }} />
                        <div style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <div style={{ padding: '2px 7px', borderRadius: 4, background: `${wf.col}18` }}>
                                <span style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 600, color: wf.col }}>{wf.cat}</span>
                              </div>
                              {wf.selected && (
                                <div style={{ padding: '2px 7px', borderRadius: 4, background: '#eff6ff', border: `1px solid ${B.blue}44` }}>
                                  <span style={{ fontFamily: 'system-ui', fontSize: 10, fontWeight: 700, color: B.blue }}>Selected ✓</span>
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: 16, color: wf.selected ? B.blue : B.muted }}>›</span>
                          </div>
                          <p style={{ fontFamily: 'system-ui', fontSize: 15, fontWeight: 700, color: wf.selected ? B.blue : B.dark, margin: '0 0 4px' }}>{wf.name}</p>
                          <p style={{ fontFamily: 'system-ui', fontSize: 12, color: B.muted, margin: '0 0 6px', lineHeight: 1.4 }}>{wf.desc}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 11, color: B.muted }}>🕐</span>
                            <span style={{ fontFamily: 'system-ui', fontSize: 12, color: B.muted }}>Saves {wf.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Tap frame={frame} at={145} x="50%" y="22%" color={`${B.blue}55`} />
              </ZoomLens>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Configure + Deploy ──────────────────────────────────────────
const ConfigureScene: React.FC<{ isLast: boolean }> = ({ isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideY = interpolate(sp(frame, fps, 20, 100), [0, 1], [100, 0]);
  const phoneOp = fi(frame, 0, 18);
  const fadeOut = isLast ? 1 : fo(frame, S3_F - 32, 28);
  const r = (s: number) => fi(frame, s, 13);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 36%, #10b98118 0%, #0a0f1e 65%)`, opacity: fadeOut }}>
      <div style={{ position: 'absolute', top: 52, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 100, opacity: frange(frame, 5, 16, S3_F - 44, 22) }}>
        <div style={{ background: '#10b98122', border: '1.5px solid #10b98160', borderRadius: 40, padding: '10px 38px' }}>
          <span style={{ fontFamily: 'system-ui', fontSize: 26, fontWeight: 700, color: '#065f46' }}>Step 2 — Configure & Deploy</span>
        </div>
      </div>
      <div style={{ transform: `translateY(${slideY}px)`, opacity: phoneOp }}>
        <div style={{ position: 'absolute', left: 140, top: 120, width: 800, height: 1680, borderRadius: 54, background: '#111', padding: 14, boxShadow: '0 60px 160px rgba(0,0,0,0.75), inset 0 0 0 1.5px rgba(255,255,255,0.1)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: B.light, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 130, height: 36, background: '#000', borderRadius: 20, zIndex: 200 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, display: 'flex', alignItems: 'flex-end', paddingBottom: 10, paddingLeft: 28, paddingRight: 28, zIndex: 100 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: B.dark, fontFamily: 'system-ui' }}>9:43</span>
            </div>
            <div style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
              <ZoomLens frame={frame} fps={fps} zIn={105} zOut={220} scale={1.55} oY="48%">
                <div style={{ background: B.light, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <WizardNav step={2} title="Configure trigger" />

                  <div style={{ flex: 1, padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
                    <div style={{ opacity: r(8) }}>
                      <p style={{ fontFamily: 'system-ui', fontSize: 18, fontWeight: 800, color: B.dark, margin: '0 0 2px' }}>Configure trigger</p>
                      <p style={{ fontFamily: 'system-ui', fontSize: 13, color: B.muted, margin: 0 }}>Daily Cash Reconciliation Bot</p>
                    </div>

                    {/* Trigger type */}
                    <div style={{ opacity: r(16), background: '#fff', borderRadius: 14, border: `1.5px solid ${B.border}`, padding: '14px 14px' }}>
                      <p style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, color: B.dark, margin: '0 0 10px' }}>Trigger type</p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {[
                          { label: 'Scheduled', desc: 'Runs on a timer', selected: true },
                          { label: 'Webhook', desc: 'External trigger', selected: false },
                        ].map(opt => (
                          <div key={opt.label} style={{ flex: 1, border: `2px solid ${opt.selected ? B.blue : B.border}`, borderRadius: 12, padding: '10px 12px', background: opt.selected ? '#eff6ff' : '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${opt.selected ? B.blue : B.border}`, background: opt.selected ? B.blue : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {opt.selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                              </div>
                              <span style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 700, color: opt.selected ? B.blue : B.dark }}>{opt.label}</span>
                            </div>
                            <p style={{ fontFamily: 'system-ui', fontSize: 11, color: B.muted, margin: '0 0 0 24px' }}>{opt.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Schedule config */}
                    <div style={{ opacity: r(26), background: '#fff', borderRadius: 14, border: `1.5px solid ${B.border}`, padding: '14px 14px' }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: B.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Frequency</p>
                          <div style={{ border: `1.5px solid ${B.border}`, borderRadius: 10, padding: '10px 12px', background: B.light, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'system-ui', fontSize: 15, color: B.dark }}>Daily</span>
                            <span style={{ fontSize: 12, color: B.muted }}>▾</span>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: B.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</p>
                          <div style={{ border: `2px solid ${B.blue}`, borderRadius: 10, padding: '10px 12px', background: '#eff6ff' }}>
                            <span style={{ fontFamily: 'system-ui', fontSize: 15, color: B.blue, fontWeight: 700 }}>18:00</span>
                          </div>
                        </div>
                      </div>
                      <p style={{ fontFamily: 'system-ui', fontSize: 11, color: B.muted, margin: '8px 0 0' }}>Your local timezone · Lagos (WAT)</p>
                    </div>

                    {/* Email + data source */}
                    <div style={{ opacity: r(36), background: '#fff', borderRadius: 14, border: `1.5px solid ${B.border}`, padding: '14px 14px' }}>
                      <p style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: B.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notify email</p>
                      <div style={{ border: `2px solid ${B.blue}`, borderRadius: 10, padding: '10px 12px', background: '#eff6ff', marginBottom: 10 }}>
                        <span style={{ fontFamily: 'system-ui', fontSize: 14, color: B.dark }}>owner@lacafe.ng</span>
                      </div>
                      <p style={{ fontFamily: 'system-ui', fontSize: 11, color: B.muted, margin: 0 }}>Workflow results will be emailed here.</p>
                    </div>

                    {/* Deploy summary */}
                    <div style={{ opacity: r(48), background: '#f8fafc', borderRadius: 14, border: `1.5px solid ${B.border}`, padding: '12px 14px' }}>
                      <p style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, color: B.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deployment Summary</p>
                      {[
                        ['Workflow', 'Daily Cash Reconciliation Bot'],
                        ['Schedule', 'Daily at 6:00 PM WAT'],
                        ['Email', 'owner@lacafe.ng'],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: k !== 'Workflow' ? `1px solid ${B.border}` : 'none' }}>
                          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: B.muted }}>{k}</span>
                          <span style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 600, color: B.dark }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Deploy button */}
                    <div style={{ opacity: r(58), background: B.blue, borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${B.blue}44` }}>
                      <span style={{ fontFamily: 'system-ui', fontSize: 18, fontWeight: 800, color: '#fff' }}>🚀  Deploy Workflow</span>
                    </div>
                  </div>
                </div>
                <Tap frame={frame} at={150} x="50%" y="87%" color={`${B.blue}55`} />
              </ZoomLens>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Deploy Success ───────────────────────────────────────────────
const DeploySuccessScene: React.FC<{ isLast: boolean }> = ({ isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideY = interpolate(sp(frame, fps, 20, 100), [0, 1], [100, 0]);
  const phoneOp = fi(frame, 0, 18);
  const fadeOut = isLast ? 1 : fo(frame, S4_F - 32, 28);

  const checkScale = sp(frame - 10, fps, 12, 80);
  const t1 = fi(frame, 30, 18);
  const t2 = fi(frame, 46, 18);
  const t3 = fi(frame, 62, 18);
  const btn = fi(frame, 80, 18);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 36%, #10b98120 0%, #0a0f1e 65%)`, opacity: fadeOut }}>
      <div style={{ transform: `translateY(${slideY}px)`, opacity: phoneOp }}>
        <div style={{ position: 'absolute', left: 140, top: 120, width: 800, height: 1680, borderRadius: 54, background: '#111', padding: 14, boxShadow: '0 60px 160px rgba(0,0,0,0.75), inset 0 0 0 1.5px rgba(255,255,255,0.1)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: B.light, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 130, height: 36, background: '#000', borderRadius: 20, zIndex: 200 }} />
            <div style={{ padding: '0 60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ transform: `scale(${checkScale})`, width: 100, height: 100, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 0 0 16px #d1fae5' }}>
                <span style={{ fontSize: 50, color: '#fff' }}>✓</span>
              </div>
              <p style={{ fontFamily: 'system-ui', fontSize: 38, fontWeight: 900, color: B.dark, margin: '0 0 12px', letterSpacing: '-0.5px', opacity: t1 }}>Workflow deployed!</p>
              <p style={{ fontFamily: 'system-ui', fontSize: 22, color: B.muted, margin: '0 0 8px', lineHeight: 1.4, opacity: t2 }}>Daily Cash Reconciliation Bot</p>
              <div style={{ opacity: t3, background: E.bg, border: `1.5px solid ${E.border}`, borderRadius: 14, padding: '12px 24px', marginBottom: 40 }}>
                <p style={{ fontFamily: 'system-ui', fontSize: 17, color: E.text, margin: 0 }}>🕕 First run: today at 6:00 PM</p>
                <p style={{ fontFamily: 'system-ui', fontSize: 15, color: E.text, margin: '4px 0 0', opacity: 0.8 }}>Results sent to owner@lacafe.ng</p>
              </div>
              <div style={{ opacity: btn, background: B.dark, borderRadius: 14, padding: '16px 48px' }}>
                <span style={{ fontFamily: 'system-ui', fontSize: 20, fontWeight: 700, color: '#fff' }}>View in Dashboard →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Email Output ────────────────────────────────────────────────
const EmailOutputScene: React.FC<{ isLast: boolean }> = ({ isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideY = interpolate(sp(frame, fps, 20, 100), [0, 1], [100, 0]);
  const phoneOp = fi(frame, 0, 18);
  const fadeOut = isLast ? 1 : fo(frame, S5_F - 32, 28);
  const r = (s: number) => fi(frame, s, 14);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 36%, ${B.blue}18 0%, #0a0f1e 65%)`, opacity: fadeOut }}>
      <div style={{ position: 'absolute', top: 52, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 100, opacity: frange(frame, 5, 16, S5_F - 44, 22) }}>
        <div style={{ background: `${B.blue}22`, border: `1.5px solid ${B.blue}60`, borderRadius: 40, padding: '10px 38px' }}>
          <span style={{ fontFamily: 'system-ui', fontSize: 26, fontWeight: 700, color: B.blue }}>The Output — Your Inbox</span>
        </div>
      </div>
      <div style={{ transform: `translateY(${slideY}px)`, opacity: phoneOp }}>
        <div style={{ position: 'absolute', left: 140, top: 120, width: 800, height: 1680, borderRadius: 54, background: '#111', padding: 14, boxShadow: '0 60px 160px rgba(0,0,0,0.75), inset 0 0 0 1.5px rgba(255,255,255,0.1)' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: '#f6f8fc', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 130, height: 36, background: '#000', borderRadius: 20, zIndex: 200 }} />
            {/* Gmail-style status bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, display: 'flex', alignItems: 'flex-end', paddingBottom: 10, paddingLeft: 28, paddingRight: 28, zIndex: 100 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: B.dark, fontFamily: 'system-ui' }}>6:00</span>
            </div>
            <div style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, overflow: 'hidden', background: '#f6f8fc' }}>
              <ZoomLens frame={frame} fps={fps} zIn={100} zOut={250} scale={1.65} oY="68%">
                {/* Gmail-style email view */}
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Gmail-ish top bar */}
                  <div style={{ opacity: r(8), background: '#fff', padding: '10px 14px', borderBottom: `1px solid ${B.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 18, color: B.muted }}>‹</span>
                    <span style={{ fontFamily: 'system-ui', fontSize: 16, fontWeight: 700, color: B.dark, flex: 1 }}>Daily Cash Reconciliation</span>
                    <span style={{ fontSize: 14, color: B.muted }}>⋯</span>
                  </div>

                  {/* Email meta */}
                  <div style={{ opacity: r(14), background: '#fff', padding: '12px 14px 10px', borderBottom: `1px solid ${B.border}`, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: B.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>HB</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontFamily: 'system-ui', fontSize: 15, fontWeight: 700, color: B.dark }}>Hoursback</span>
                          <span style={{ fontFamily: 'system-ui', fontSize: 12, color: B.muted }}>6:00 PM</span>
                        </div>
                        <p style={{ fontFamily: 'system-ui', fontSize: 12, color: B.muted, margin: '1px 0 0' }}>reports@hoursback.xyz → owner@lacafe.ng</p>
                      </div>
                    </div>
                  </div>

                  {/* Email body */}
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Email header dark band */}
                    <div style={{ opacity: r(20), background: B.dark, padding: '18px 16px 14px', flexShrink: 0 }}>
                      <Logo width={130} light />
                      <p style={{ fontFamily: 'system-ui', fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '6px 0 0' }}>Daily Cash Reconciliation Bot · Feb 28, 2026</p>
                    </div>

                    {/* Status badge */}
                    <div style={{ opacity: r(28), background: '#fff', padding: '14px 16px', flexShrink: 0 }}>
                      <div style={{ background: E.bg, border: `2px solid ${E.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 18, color: '#fff' }}>✓</span>
                        </div>
                        <div>
                          <p style={{ fontFamily: 'system-ui', fontSize: 16, fontWeight: 800, color: E.text, margin: 0 }}>No variance. All balanced.</p>
                          <p style={{ fontFamily: 'system-ui', fontSize: 13, color: E.text, margin: '2px 0 0', opacity: 0.75 }}>Submitted by Ada Okafor · 5:58 PM</p>
                        </div>
                      </div>
                    </div>

                    {/* Report table */}
                    <div style={{ opacity: r(36), background: '#fff', padding: '0 16px 14px', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: 700, color: B.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lekki Phase 1 Branch</p>
                      <div style={{ border: `1px solid ${B.border}`, borderRadius: 10, overflow: 'hidden' }}>
                        {[
                          { label: 'Opening Float', value: '₦50,000', bold: false, s: 38 },
                          { label: 'Cash Sales', value: '₦310,000', bold: false, s: 44, green: true },
                          { label: 'Transfer Sales', value: '₦537,500', bold: false, s: 50, blue: true },
                          { label: 'Petty Cash Out', value: '−₦12,000', bold: false, s: 56, red: true },
                          { label: 'Closing Balance', value: '₦348,000', bold: true, s: 62 },
                          { label: 'Expected Balance', value: '₦348,000', bold: true, s: 68 },
                        ].map((row, i) => (
                          <div key={row.label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '9px 12px',
                            background: i % 2 === 0 ? '#fff' : '#f8fafc',
                            borderTop: i > 0 ? `1px solid ${B.border}` : 'none',
                            opacity: fi(frame, row.s, 10),
                          }}>
                            <span style={{ fontFamily: 'system-ui', fontSize: 13, color: row.bold ? B.dark : B.muted, fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                            <span style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: row.bold ? 800 : 600, color: row.green ? '#10b981' : row.blue ? B.blue : row.red ? '#ef4444' : B.dark }}>{row.value}</span>
                          </div>
                        ))}
                        {/* Variance row — highlighted */}
                        <div style={{
                          opacity: fi(frame, 74, 12),
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 12px',
                          background: '#f0fdf4',
                          borderTop: `2px solid ${E.border}`,
                        }}>
                          <span style={{ fontFamily: 'system-ui', fontSize: 15, fontWeight: 800, color: E.text }}>✓ Variance</span>
                          <span style={{ fontFamily: 'system-ui', fontSize: 18, fontWeight: 900, color: '#10b981' }}>₦0</span>
                        </div>
                      </div>
                    </div>

                    {/* Why this matters callout */}
                    <div style={{ opacity: r(82), background: '#fff', padding: '0 16px 14px', flexShrink: 0 }}>
                      <div style={{ background: '#eff6ff', border: `1px solid ${B.blue}33`, borderRadius: 10, padding: '10px 12px' }}>
                        <p style={{ fontFamily: 'system-ui', fontSize: 12, fontWeight: 700, color: B.blue, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Why this matters</p>
                        <p style={{ fontFamily: 'system-ui', fontSize: 13, color: '#1e40af', margin: 0, lineHeight: 1.4 }}>No cash discrepancies detected. Lekki branch closed cleanly. No follow-up required.</p>
                      </div>
                    </div>

                    {/* CTA buttons */}
                    <div style={{ opacity: r(90), background: '#fff', padding: '0 16px 16px', display: 'flex', gap: 10, flexShrink: 0 }}>
                      <div style={{ flex: 1, background: B.dark, borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 700, color: '#fff' }}>View Full Report →</span>
                      </div>
                      <div style={{ background: B.light, border: `1.5px solid ${B.border}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'system-ui', fontSize: 14, fontWeight: 600, color: B.muted }}>PDF ↓</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Tap frame={frame} at={150} x="90%" y="67%" color={`${E.text}44`} />
              </ZoomLens>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Intro ─────────────────────────────────────────────────────────────────
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = sp(frame, fps, 16, 110);
  const t1 = fi(frame, 14, 20);
  const t2 = fi(frame, 28, 20);
  const fadeOut = fo(frame, INTRO_F - 22, 20);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #1a2744 0%, #080d17 70%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: fadeOut }}>
      <div style={{ transform: `scale(${logoS})`, marginBottom: 44 }}>
        <Logo width={340} light />
      </div>
      <p style={{ fontFamily: 'system-ui', fontSize: 50, fontWeight: 900, color: '#fff', opacity: t1, margin: '0 0 16px', letterSpacing: '-1px', textAlign: 'center' }}>From setup to inbox.</p>
      <p style={{ fontFamily: 'system-ui', fontSize: 29, color: '#8696A0', opacity: t2, margin: 0, textAlign: 'center', lineHeight: 1.5, padding: '0 80px' }}>Watch a workflow deploy and deliver its first report.</p>
    </AbsoluteFill>
  );
};

// ─── CTA ───────────────────────────────────────────────────────────────────
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = sp(frame, fps, 16, 110);
  const t1 = fi(frame, 16, 22);
  const btn = fi(frame, 34, 22);
  const url = fi(frame, 55, 18);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, #1a2744 0%, #080d17 70%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ transform: `scale(${logoS})`, marginBottom: 44 }}><Logo width={360} light /></div>
      <p style={{ fontFamily: 'system-ui', fontSize: 36, color: '#8696A0', opacity: t1, margin: '0 80px 50px', textAlign: 'center', lineHeight: 1.5 }}>
        Pick a workflow. Set your schedule.{'\n'}Get the report in your inbox.
      </p>
      <div style={{ opacity: btn, background: B.blue, borderRadius: 60, padding: '26px 100px', boxShadow: `0 0 80px ${B.blue}44` }}>
        <span style={{ fontFamily: 'system-ui', fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>Try it free →</span>
      </div>
      <p style={{ fontFamily: 'system-ui', fontSize: 30, color: B.blue, marginTop: 32, opacity: url, letterSpacing: '0.5px' }}>hoursback.xyz</p>
    </AbsoluteFill>
  );
};

// ─── Main composition ──────────────────────────────────────────────────────
const S1_START = INTRO_F;
const S2_START = S1_START + S1_F;
const S3_START = S2_START + S2_F;
const S4_START = S3_START + S3_F;
const S5_START = S4_START + S4_F;
const CTA_START = S5_START + S5_F;

export const Format6Web: React.FC = () => (
  <AbsoluteFill style={{ background: '#080d17' }}>
    <Sequence from={0} durationInFrames={INTRO_F + 20}><IntroScene /></Sequence>
    <Sequence from={S1_START} durationInFrames={S1_F + OVL}><DashboardScene isLast={false} /></Sequence>
    <Sequence from={S2_START} durationInFrames={S2_F + OVL}><ChooseWorkflowScene isLast={false} /></Sequence>
    <Sequence from={S3_START} durationInFrames={S3_F + OVL}><ConfigureScene isLast={false} /></Sequence>
    <Sequence from={S4_START} durationInFrames={S4_F + OVL}><DeploySuccessScene isLast={false} /></Sequence>
    <Sequence from={S5_START} durationInFrames={S5_F}><EmailOutputScene isLast={true} /></Sequence>
    <Sequence from={CTA_START} durationInFrames={CTA_F}><CTAScene /></Sequence>
  </AbsoluteFill>
);
