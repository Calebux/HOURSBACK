import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, interpolate } from 'remotion';
import { A, TG, WA, fi, fo, frange, sp, Logo, TGBubble, WABubble } from './shared';
import { SPLIT_FEATURES, type SplitFeature } from './data/features';

export const VIDEO_FPS = 30;

const TITLE_F = 70;
const SPLIT_F = 340; // per feature
const CTA_F   = 200;
export const FORMAT2_TOTAL_FRAMES = TITLE_F + SPLIT_FEATURES.length * SPLIT_F + CTA_F;
// 70 + 4×340 + 200 = 1630

// ─── Panel header ──────────────────────────────────────────────────────────
const PanelHeader: React.FC<{ label: string; color: string; bg: string; textColor: string }> = ({
  label, color, bg, textColor,
}) => (
  <div style={{
    background: bg, padding: '16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)', flexShrink: 0,
  }}>
    <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 26, fontWeight: 900, color: textColor, letterSpacing: '2px', textTransform: 'uppercase' }}>
      {label}
    </span>
  </div>
);

// ─── Split feature scene ────────────────────────────────────────────────────
const SplitScene: React.FC<{ feature: SplitFeature; isLast: boolean }> = ({ feature, isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Before: messages stagger at 55f each, starting at 20f
  const beforeDelay = (i: number) => 20 + i * 52;
  // After: messages appear faster, first one at 15f
  const afterDelay  = (i: number) => 15 + i * 68;

  const fadeOut = isLast ? 1 : fo(frame, SPLIT_F - 35, 30);

  // Feature label appears mid-scene
  const labelOp = frange(frame, 40, 20, SPLIT_F - 40, 25);

  return (
    <AbsoluteFill style={{ background: '#0a0f1e', opacity: fadeOut }}>
      {/* Feature label at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '28px 0',
        background: 'linear-gradient(to bottom, rgba(10,15,30,0.98), rgba(10,15,30,0.85) 70%, transparent)',
        opacity: labelOp,
      }}>
        <div style={{
          background: `${feature.accent}18`, border: `2px solid ${feature.accent}55`,
          borderRadius: 40, padding: '14px 48px',
        }}>
          <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 32, fontWeight: 800, color: feature.accent }}>
            {feature.label}
          </span>
        </div>
      </div>

      {/* Split divider */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 3, background: `linear-gradient(to bottom, transparent 5%, ${feature.accent}66 30%, ${feature.accent}66 70%, transparent 95%)`, zIndex: 100 }} />

      {/* ── LEFT panel: BEFORE ── */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 540, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Status bar */}
        <div style={{ background: WA.header, padding: '90px 20px 14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 22, fontWeight: 700, color: '#fff' }}>Team Chat</p>
              <p style={{ margin: 0, fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 17, color: 'rgba(255,255,255,0.7)' }}>{feature.before.length} participants</p>
            </div>
          </div>
        </div>

        {/* BEFORE label */}
        <div style={{ background: '#dc2626', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '2px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>✕ BEFORE</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, background: WA.bg, padding: '12px 12px 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {feature.before.map((msg, i) => (
            <WABubble
              key={i} msg={msg} chatFrame={frame}
              revealAt={beforeDelay(i)} fps={fps}
            />
          ))}
        </div>

        {/* WA input */}
        <div style={{ background: WA.bg, padding: '12px 14px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 30, padding: '12px 18px', fontSize: 20, color: WA.sub, fontFamily: 'system-ui' }}>
            Message
          </div>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: WA.header, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── RIGHT panel: AFTER ── */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 537, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: TG.bg }}>
        {/* TG header */}
        <div style={{ background: TG.header, padding: '90px 16px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: feature.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="10" viewBox="0 0 182 42" fill="none">
              <path d="M 21,8 A 13,13 0 1,0 34,21" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              <circle cx="21" cy="21" r="2.5" fill="#fff" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 22, fontWeight: 700, color: TG.text }}>Hoursback Bot</p>
            <p style={{ margin: '2px 0 0', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 17, color: TG.online }}>● online</p>
          </div>
        </div>

        {/* AFTER label */}
        <div style={{ background: A.green600, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '2px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>✓ WITH HOURSBACK</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '12px 10px 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {feature.after.map((msg, i) => (
            <TGBubble
              key={i} msg={msg} chatFrame={frame}
              revealAt={afterDelay(i)} accent={feature.accent}
              fps={fps} fontSize={20}
            />
          ))}
        </div>

        {/* TG input */}
        <div style={{ background: TG.header, padding: '12px 12px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, background: TG.recv, borderRadius: 30, padding: '12px 16px', fontSize: 20, color: TG.sub, fontFamily: 'system-ui' }}>Message...</div>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: feature.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 2 11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Title card ─────────────────────────────────────────────────────────────
const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = sp(frame, fps, 16, 110);
  const t1 = fi(frame, 14, 22);
  const t2 = fi(frame, 30, 22);
  const fadeOut = fo(frame, TITLE_F - 25, 22);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, #1a2744 0%, #080d17 70%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut,
    }}>
      <div style={{ transform: `scale(${logoS})`, marginBottom: 48 }}>
        <Logo width={340} light />
      </div>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 54, fontWeight: 900, color: A.white, opacity: t1, margin: '0 0 16px', letterSpacing: '-1px', textAlign: 'center' }}>
        Before vs After
      </p>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 32, color: TG.sub, opacity: t2, margin: 0, textAlign: 'center', lineHeight: 1.5, padding: '0 80px' }}>
        See what changes when your team gets a Hoursback bot
      </p>
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
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 42%, #1a2744 0%, #080d17 70%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ transform: `scale(${logoS})`, marginBottom: 44 }}>
        <Logo width={360} light />
      </div>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 36, color: TG.sub, opacity: t1, margin: '0 80px 50px', textAlign: 'center', lineHeight: 1.5 }}>
        Set up once. Works 24/7.{'\n'}No app download. No training.
      </p>
      <div style={{ opacity: btn, background: A.blue, borderRadius: 60, padding: '26px 100px', boxShadow: `0 0 80px ${A.blue}44` }}>
        <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 44, fontWeight: 900, color: A.white, letterSpacing: '-0.5px' }}>
          Try it free →
        </span>
      </div>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 30, color: A.blue, marginTop: 32, opacity: url, letterSpacing: '0.5px' }}>
        hoursback.xyz
      </p>
    </AbsoluteFill>
  );
};

// ─── Main composition ───────────────────────────────────────────────────────
const SPLITS_START = TITLE_F;
const CTA_START = SPLITS_START + SPLIT_FEATURES.length * SPLIT_F;

export const Format2Split: React.FC = () => (
  <AbsoluteFill style={{ background: '#080d17' }}>
    <Sequence from={0} durationInFrames={TITLE_F + 20}>
      <TitleCard />
    </Sequence>

    {SPLIT_FEATURES.map((feature, i) => (
      <Sequence key={feature.label} from={SPLITS_START + i * SPLIT_F} durationInFrames={SPLIT_F + (i < SPLIT_FEATURES.length - 1 ? 30 : 0)}>
        <SplitScene feature={feature} isLast={i === SPLIT_FEATURES.length - 1} />
      </Sequence>
    ))}

    <Sequence from={CTA_START} durationInFrames={CTA_F}>
      <CTAScene />
    </Sequence>
  </AbsoluteFill>
);
