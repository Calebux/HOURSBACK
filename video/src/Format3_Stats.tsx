import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { A, TG, fi, fo, frange, sp, Logo } from './shared';
import { STATS, type Stat } from './data/features';

export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;

const STAT_F = 270; // frames per stat
const CTA_F = 120;
export const FORMAT3_TOTAL_FRAMES = STATS.length * STAT_F + CTA_F;
// 3 × 270 + 120 = 930

// ─── Single stat card ──────────────────────────────────────────────────────
const StatCard: React.FC<{ stat: Stat }> = ({ stat }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phases within each stat
  // 0–40f:   number springs in
  // 40–90f:  pain text fades in
  // 90–160f: divider draws + solution fades in
  // 160–240f: hold
  // 240–270f: fade out

  const numScale = sp(frame, fps, 14, 100);
  const numOp    = fi(frame, 0, 15);
  const unitOp   = fi(frame, 18, 20);
  const painOp   = fi(frame, 40, 25);
  const lineW    = fi(frame, 90, 35); // divider grows
  const solOp    = fi(frame, 110, 25);
  const cmdOp    = fi(frame, 140, 20);
  const fadeOut  = fo(frame, 240, 30);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 38%, ${stat.accent}18 0%, #0a0f1e 65%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut,
    }}>
      {/* Glow circle */}
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        background: `radial-gradient(circle, ${stat.accent}14 0%, transparent 65%)`,
        top: '28%', left: '50%', transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />

      {/* Label */}
      <p style={{
        fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 26,
        fontWeight: 700, color: stat.accent, letterSpacing: '3px',
        textTransform: 'uppercase', marginBottom: 16, opacity: numOp,
      }}>The reality</p>

      {/* Giant number */}
      <div style={{ transform: `scale(${numScale})`, opacity: numOp, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'system-ui,-apple-system,sans-serif',
          fontSize: 220, fontWeight: 900, color: stat.accent,
          lineHeight: 1, letterSpacing: '-6px',
        }}>{stat.number}</span>
      </div>

      {/* Unit */}
      <p style={{
        fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 38, fontWeight: 700,
        color: A.white, opacity: unitOp, marginTop: -10, marginBottom: 20,
        letterSpacing: '-0.5px',
      }}>{stat.unit}</p>

      {/* Pain text */}
      <p style={{
        fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 30, color: TG.sub,
        textAlign: 'center', opacity: painOp, margin: '0 80px 50px', lineHeight: 1.5,
      }}>{stat.pain}</p>

      {/* Divider */}
      <div style={{
        width: `${lineW * 320}px`, height: 2, marginBottom: 44,
        background: `linear-gradient(90deg, transparent, ${stat.accent}, transparent)`,
        opacity: lineW,
      }} />

      {/* Solution */}
      <div style={{ opacity: solOp, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <p style={{
          fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 38, fontWeight: 800,
          color: A.white, textAlign: 'center', margin: '0 60px', letterSpacing: '-0.5px', lineHeight: 1.3,
        }}>{stat.solution}</p>
        <div style={{
          opacity: cmdOp, background: `${stat.accent}18`,
          border: `2px solid ${stat.accent}55`, borderRadius: 18,
          padding: '14px 40px',
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 34, fontWeight: 700, color: stat.accent }}>
            {stat.command}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── CTA ───────────────────────────────────────────────────────────────────
const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = sp(frame, fps, 16, 110);
  const t1 = fi(frame, 18, 22);
  const t2 = fi(frame, 34, 22);
  const btn = fi(frame, 50, 22);
  const url = fi(frame, 65, 18);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, #1a2744 0%, #0a0f1e 70%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ transform: `scale(${logoS})`, marginBottom: 40 }}>
        <Logo width={320} light />
      </div>
      <p style={{
        fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 42, fontWeight: 800,
        color: A.white, textAlign: 'center', opacity: t1, margin: '0 60px 14px',
        letterSpacing: '-0.8px', lineHeight: 1.25,
      }}>Your team's AI on Telegram</p>
      <p style={{
        fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 28, color: TG.sub,
        textAlign: 'center', opacity: t2, margin: '0 80px 50px', lineHeight: 1.5,
      }}>8 workflows. No app download. No training.</p>
      <div style={{
        opacity: btn, background: A.blue, borderRadius: 60,
        padding: '24px 90px', boxShadow: `0 0 80px ${A.blue}44`,
      }}>
        <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 40, fontWeight: 900, color: A.white, letterSpacing: '-0.5px' }}>
          Try it free →
        </span>
      </div>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 28, color: A.blue, marginTop: 30, opacity: url, letterSpacing: '0.5px' }}>
        hoursback.xyz
      </p>
    </AbsoluteFill>
  );
};

// ─── Main composition ───────────────────────────────────────────────────────
export const Format3Stats: React.FC = () => (
  <AbsoluteFill style={{ background: '#0a0f1e' }}>
    {STATS.map((stat, i) => (
      <Sequence key={stat.command} from={i * STAT_F} durationInFrames={STAT_F}>
        <StatCard stat={stat} />
      </Sequence>
    ))}
    <Sequence from={STATS.length * STAT_F} durationInFrames={CTA_F}>
      <CTA />
    </Sequence>
  </AbsoluteFill>
);
