import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, interpolate } from 'remotion';
import { A, TG, fi, fo, sp, Logo, TGBubble } from './shared';
import { FULL_CHATS, type FeatureChat } from './data/features';

export const VIDEO_FPS = 30;

// Timing per chat: 380 frames (~12.7s)
const CHAT_F = 380;
const FADE_F = 30; // cross-fade between chats
const REVEAL_F = 280;
export const FORMAT5_TOTAL_FRAMES = FULL_CHATS.length * CHAT_F + REVEAL_F;
// 4 × 380 + 280 = 1800

// ─── Full-screen chat (no phone frame) ────────────────────────────────────
const ReplyChat: React.FC<{ chat: FeatureChat }> = ({ chat }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const msgCount = chat.messages.length;
  // Stagger: first msg at 30f, then every ~65f
  const delay = (i: number) => 30 + i * 65;
  const kbFrame = delay(1) + 20;

  const fadeOut = fo(frame, CHAT_F - FADE_F, FADE_F);

  return (
    <AbsoluteFill style={{ background: TG.bg, opacity: fadeOut }}>
      {/* Top bar — subtle hoursback label */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: `linear-gradient(to bottom, ${TG.bg}, transparent)`,
        zIndex: 50,
      }} />

      {/* Chat header */}
      <div style={{
        background: TG.header, padding: '70px 36px 20px',
        display: 'flex', alignItems: 'center', gap: 18,
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)', flexShrink: 0,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: chat.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="34" height="16" viewBox="0 0 182 42" fill="none">
            <path d="M 21,8 A 13,13 0 1,0 34,21" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            <circle cx="21" cy="21" r="2.5" fill="#fff" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 34, fontWeight: 700, color: TG.text }}>Hoursback Bot</p>
          <p style={{ margin: '4px 0 0', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 24, color: TG.online, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: TG.online, display: 'inline-block' }} />
            online
          </p>
        </div>
        {/* Command badge */}
        <div style={{ background: `${chat.accent}22`, border: `1.5px solid ${chat.accent}66`, borderRadius: 16, padding: '10px 24px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700, color: chat.accent }}>{chat.command}</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '20px 28px 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {chat.messages.map((msg, i) => (
          <TGBubble
            key={i}
            msg={msg}
            chatFrame={frame}
            revealAt={delay(i)}
            accent={chat.accent}
            fps={fps}
            keyboardSelectFrame={kbFrame}
            fontSize={26}
          />
        ))}
      </div>

      {/* Input bar */}
      <div style={{ background: TG.header, padding: '14px 20px 30px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <div style={{ flex: 1, background: TG.recv, borderRadius: 36, padding: '16px 24px', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 26, color: TG.sub }}>
          Message...
        </div>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: chat.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 2 11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </div>
      </div>

      {/* Feature label strip at bottom */}
      <div style={{
        position: 'absolute', bottom: 130, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        opacity: fi(frame, 60, 20) * fadeOut,
      }}>
        <div style={{
          background: `${chat.accent}18`, border: `1.5px solid ${chat.accent}44`,
          borderRadius: 30, padding: '10px 36px',
        }}>
          <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 24, fontWeight: 700, color: chat.accent }}>
            {chat.label}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Final reveal ───────────────────────────────────────────────────────────
const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = sp(frame, fps, 16, 110);
  const t1 = fi(frame, 22, 25);
  const t2 = fi(frame, 40, 25);
  const btn = fi(frame, 60, 22);
  const url = fi(frame, 80, 18);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, #1a2744 0%, #0a0f1e 70%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', background: `radial-gradient(circle, ${A.blue}12 0%, transparent 65%)`, top: '36%', left: '50%', transform: 'translate(-50%,-50%)' }} />

      <div style={{ transform: `scale(${logoS})`, marginBottom: 44 }}>
        <Logo width={380} light />
      </div>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 44, fontWeight: 800, color: A.white, textAlign: 'center', opacity: t1, margin: '0 60px 16px', letterSpacing: '-0.8px', lineHeight: 1.25 }}>
        Your team's AI on Telegram
      </p>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 30, color: TG.sub, textAlign: 'center', opacity: t2, margin: '0 80px 56px', lineHeight: 1.5 }}>
        Cash. Handovers. Audits. SOPs. Restock.{'\n'}All in one bot. No app needed.
      </p>
      <div style={{ opacity: btn, background: A.blue, borderRadius: 60, padding: '26px 100px', boxShadow: `0 0 80px ${A.blue}44` }}>
        <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 42, fontWeight: 900, color: A.white, letterSpacing: '-0.5px' }}>
          Try it free →
        </span>
      </div>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 30, color: A.blue, marginTop: 30, opacity: url, letterSpacing: '0.5px' }}>
        hoursback.xyz
      </p>
    </AbsoluteFill>
  );
};

// ─── Main composition ───────────────────────────────────────────────────────
export const Format5Reply: React.FC = () => (
  <AbsoluteFill style={{ background: TG.bg }}>
    {FULL_CHATS.map((chat, i) => (
      <Sequence key={chat.id} from={i * CHAT_F} durationInFrames={CHAT_F + FADE_F}>
        <ReplyChat chat={chat} />
      </Sequence>
    ))}
    <Sequence from={FULL_CHATS.length * CHAT_F} durationInFrames={REVEAL_F}>
      <Reveal />
    </Sequence>
  </AbsoluteFill>
);
