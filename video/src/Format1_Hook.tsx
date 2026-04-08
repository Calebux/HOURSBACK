import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, interpolate } from 'remotion';
import { A, TG, fi, fo, frange, sp, Logo, PhoneFrame, TGBubble, TGHeader, Icon } from './shared';
import { QUICK_CHATS, type QuickChat } from './data/features';

export const VIDEO_FPS = 30;

// ─── Timing ────────────────────────────────────────────────────────────────
const HOOK_F  = 320;  // Text hook scene
const DEMO_F  = 280;  // Per-feature phone demo
const WRAP_F  = 200;  // Summary text
const CTA_F   = 180;  // Logo + URL

export const FORMAT1_TOTAL_FRAMES = HOOK_F + QUICK_CHATS.length * DEMO_F + WRAP_F + CTA_F;
// 320 + 4×280 + 200 + 180 = 1820

// ─── Text hook ─────────────────────────────────────────────────────────────
const TextLine: React.FC<{ text: string; enter: number; color?: string; size?: number; weight?: number; italic?: boolean }> = ({
  text, enter, color = '#fff', size = 78, weight = 900, italic = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sp(frame - enter, fps, 18, 130);
  const op = fi(frame, enter, 14);
  const ty = interpolate(s, [0, 1], [40, 0]);
  return (
    <p style={{
      fontFamily: 'system-ui,-apple-system,sans-serif',
      fontSize: size, fontWeight: weight, color,
      margin: 0, lineHeight: 1.2, letterSpacing: '-1.5px',
      textAlign: 'center',
      opacity: op, transform: `translateY(${ty}px)`,
      fontStyle: italic ? 'italic' : 'normal',
    }}>{text}</p>
  );
};

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = fo(frame, 290, 30);

  return (
    <AbsoluteFill style={{
      background: '#080d17',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 18, opacity: fadeOut,
    }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 65%)', top: '40%', left: '50%', transform: 'translate(-50%,-50%)' }} />

      <TextLine text="It's 11 PM." enter={5} />
      <TextLine text="Your phone rings." enter={35} color={TG.sub} size={68} weight={700} />
      <TextLine text="It's your cashier." enter={65} color={TG.sub} size={68} weight={700} />

      {/* Dramatic pause, then: */}
      <div style={{ height: 10 }} />
      <TextLine text="Again." enter={100} color="#f59e0b" size={110} weight={900} />

      <div style={{ height: 24 }} />

      {/* Pain detail */}
      <div style={{ opacity: fi(frame, 145, 20), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 40, fontWeight: 600, color: TG.sub, margin: 0, textAlign: 'center', letterSpacing: '-0.5px' }}>
          "₦500 variance. We can't close out."
        </p>
        <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 28, color: 'rgba(255,255,255,0.35)', margin: 0, textAlign: 'center' }}>
          — every cashier, everywhere, every night
        </p>
      </div>

      <div style={{ height: 20 }} />

      {/* Bridge */}
      <div style={{ opacity: fi(frame, 200, 22), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 60, height: 3, background: A.blue, borderRadius: 4, marginBottom: 8 }} />
        <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 50, fontWeight: 900, color: A.white, margin: 0, textAlign: 'center', letterSpacing: '-1px', lineHeight: 1.2 }}>
          What if they never{'\n'}had to call?
        </p>
        <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 30, color: A.blue, margin: 0, fontWeight: 700 }}>
          Meet Hoursback.
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ─── Feature phone demo ────────────────────────────────────────────────────
const PhoneDemo: React.FC<{ chat: QuickChat; isLast: boolean }> = ({ chat, isLast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const TITLE_F = 55; // title card frames before chat
  const chatFrame = frame - TITLE_F;
  const msgCount = chat.messages.length;
  const spacing = Math.floor((DEMO_F - TITLE_F - 40) / (msgCount - 1));
  const delay = (i: number) => 10 + spacing * i;

  const phoneSlide = sp(frame, fps, 20, 100);
  const phoneY = interpolate(phoneSlide, [0, 1], [120, 0]);
  const phoneOp = fi(frame, 0, 20);
  const fadeOut = isLast ? 1 : fo(frame, DEMO_F - 35, 30);

  // Caption
  const captionOp = frange(frame, TITLE_F + 5, 15, DEMO_F - 35, 25);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 40%, ${chat.accent}12 0%, #080d17 60%)`,
      opacity: fadeOut,
    }}>
      {/* Feature badge */}
      <div style={{
        position: 'absolute', top: 60, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', zIndex: 100,
        opacity: frange(frame, 5, 15, TITLE_F - 10, 15),
      }}>
        <div style={{ background: `${chat.accent}18`, border: `2px solid ${chat.accent}55`, borderRadius: 50, padding: '14px 40px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 800, color: chat.accent }}>{chat.command}</span>
          <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 26, color: TG.sub }}>—</span>
          <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 28, fontWeight: 700, color: A.white }}>{chat.label}</span>
        </div>
      </div>

      {/* Phone */}
      <div style={{ transform: `translateY(${phoneY}px)`, opacity: phoneOp }}>
        <PhoneFrame bg={frame >= TITLE_F ? TG.bg : `${chat.accent}11`}>
          {frame < TITLE_F ? (
            /* Mini title card inside phone */
            <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: `linear-gradient(160deg, #0d1b2a, #080d17)` }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: `${chat.accent}22`, border: `2.5px solid ${chat.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={chat.iconName} size={46} color={chat.accent} strokeWidth={1.5} />
              </div>
              <p style={{ fontFamily: 'monospace', fontSize: 40, fontWeight: 800, color: chat.accent, margin: 0 }}>{chat.command}</p>
              <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 28, fontWeight: 700, color: A.white, margin: 0, textAlign: 'center', padding: '0 40px', lineHeight: 1.3 }}>{chat.label}</p>
            </AbsoluteFill>
          ) : (
            <AbsoluteFill style={{ background: TG.bg, display: 'flex', flexDirection: 'column' }}>
              <TGHeader label={chat.label} command={chat.command} accent={chat.accent} iconName={chat.iconName} />
              <div style={{ flex: 1, padding: '14px 14px 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {chat.messages.map((msg, i) => (
                  <TGBubble
                    key={i} msg={msg} chatFrame={chatFrame} revealAt={delay(i)}
                    accent={chat.accent} fps={fps} fontSize={22}
                  />
                ))}
              </div>
              <div style={{ background: TG.header, padding: '12px 16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, background: TG.recv, borderRadius: 30, padding: '12px 20px', fontSize: 22, color: TG.sub, fontFamily: 'system-ui' }}>Message...</div>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: chat.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="send" size={22} color="#fff" />
                </div>
              </div>
            </AbsoluteFill>
          )}
        </PhoneFrame>
      </div>

      {/* Bottom caption */}
      {frame >= TITLE_F && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(8,13,23,0.95) 0%, transparent 100%)',
          padding: '70px 60px 50px', opacity: captionOp,
          fontFamily: 'system-ui,-apple-system,sans-serif',
        }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: A.white, margin: '0 0 8px' }}>{chat.label}</p>
          <p style={{ fontSize: 26, color: TG.sub, margin: 0, lineHeight: 1.4 }}>One command. Done in seconds. No phone calls.</p>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Wrap scene ─────────────────────────────────────────────────────────────
const WrapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const FEATURES = [
    { icon: 'cash' as const, label: '/reconcile', color: '#f59e0b' },
    { icon: 'clipboard' as const, label: '/handover', color: '#4285F4' },
    { icon: 'search' as const, label: '/audit', color: '#8b5cf6' },
    { icon: 'zap' as const, label: '/assign', color: '#f43f5e' },
    { icon: 'settings' as const, label: '/sop', color: '#10b981' },
    { icon: 'send' as const, label: '/escalate', color: '#ef4444' },
    { icon: 'clock' as const, label: '/restock', color: '#06b6d4' },
    { icon: 'database' as const, label: '/handover', color: '#a855f7' },
  ];

  const t1 = fi(frame, 10, 22);
  const t2 = fi(frame, 28, 22);
  const gridOp = fi(frame, 44, 25);
  const fadeOut = fo(frame, WRAP_F - 30, 28);

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(ellipse at 50% 38%, #1a2744 0%, #080d17 65%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut,
    }}>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 54, fontWeight: 900, color: A.white, opacity: t1, margin: '0 0 10px', letterSpacing: '-1px', textAlign: 'center' }}>
        8 workflows.
      </p>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 42, fontWeight: 700, color: TG.sub, opacity: t2, margin: '0 0 50px', textAlign: 'center' }}>
        Zero late-night phone calls.
      </p>

      <div style={{ opacity: gridOp, display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center', padding: '0 60px', maxWidth: 900 }}>
        {FEATURES.map((f) => (
          <div key={f.label + f.color} style={{
            background: `${f.color}14`, border: `1.5px solid ${f.color}44`,
            borderRadius: 20, padding: '14px 28px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Icon name={f.icon} size={26} color={f.color} strokeWidth={1.8} />
            <span style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 700, color: f.color }}>{f.label}</span>
          </div>
        ))}
      </div>
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
        Set up in 3 minutes. Your team types a command.{'\n'}You sleep through the night.
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
const DEMO_START = HOOK_F;
const WRAP_START = DEMO_START + QUICK_CHATS.length * DEMO_F;
const CTA_START  = WRAP_START + WRAP_F;

export const Format1Hook: React.FC = () => (
  <AbsoluteFill style={{ background: '#080d17' }}>
    <Sequence from={0} durationInFrames={HOOK_F}>
      <HookScene />
    </Sequence>

    {QUICK_CHATS.map((chat, i) => (
      <Sequence key={chat.command} from={DEMO_START + i * DEMO_F} durationInFrames={DEMO_F + (i < QUICK_CHATS.length - 1 ? 30 : 0)}>
        <PhoneDemo chat={chat} isLast={i === QUICK_CHATS.length - 1} />
      </Sequence>
    ))}

    <Sequence from={WRAP_START} durationInFrames={WRAP_F + 30}>
      <WrapScene />
    </Sequence>

    <Sequence from={CTA_START} durationInFrames={CTA_F}>
      <CTAScene />
    </Sequence>
  </AbsoluteFill>
);
