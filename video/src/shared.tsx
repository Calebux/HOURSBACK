import React from 'react';
import { interpolate, spring } from 'remotion';

export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;

// ─── Brand colors ──────────────────────────────────────────────────────────
export const A = {
  bg: '#F8F9FA', dark: '#202124', blue: '#4285F4', white: '#ffffff',
  border: 'rgba(32,33,36,0.1)', muted: 'rgba(32,33,36,0.5)',
  slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0',
  slate400: '#94a3b8', slate500: '#64748b',
  green50: '#f0fdf4', green200: '#bbf7d0', green600: '#16a34a', green900: '#14532d',
};

export const TG = {
  bg: '#17212B', header: '#242F3D',
  sent: '#2B5278', recv: '#182533',
  btn: '#1e3148', btnSel: '#2B5278',
  text: '#ffffff', sub: '#8696A0', time: '#8696A0', online: '#4dcd5a',
};

// WhatsApp "before" theme
export const WA = {
  bg: '#EFEAE2', header: '#128C7E',
  out: '#D9FDD3', inc: '#FFFFFF',
  text: '#111B21', sub: '#667781',
  time: '#667781', red: '#DC3545',
};

// ─── Helpers ───────────────────────────────────────────────────────────────
export function fi(frame: number, s: number, d = 20): number {
  return interpolate(frame, [s, s + d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}
export function fo(frame: number, s: number, d = 20): number {
  return interpolate(frame, [s, s + d], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}
export function frange(frame: number, is: number, id: number, os: number, od: number): number {
  return Math.min(fi(frame, is, id), fo(frame, os, od));
}
export function sp(frame: number, fps: number, damping = 16, stiffness = 120): number {
  return spring({ frame, fps, config: { damping, stiffness } });
}

// ─── Logo ──────────────────────────────────────────────────────────────────
export const Logo: React.FC<{ width?: number; light?: boolean }> = ({ width = 220, light = false }) => {
  const fill = light ? '#ffffff' : '#202124';
  const h = width * 42 / 182;
  return (
    <svg width={width} height={h} viewBox="0 0 182 42" fill="none">
      <path d="M 21,8 A 13,13 0 1,0 34,21" stroke="#4285F4" strokeWidth="3.6" strokeLinecap="round" />
      <line x1="21" y1="21" x2="14.5" y2="17.2" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="21" x2="29.7" y2="16" stroke={fill} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="21" cy="21" r="2" fill="#4285F4" />
      <text x="49" y="27" fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" fontWeight="600" fontSize="20" fill={fill} letterSpacing="-0.3">hoursback</text>
    </svg>
  );
};

// ─── Icons ─────────────────────────────────────────────────────────────────
export type IconName = 'send' | 'checkCircle' | 'database' | 'copy' | 'chevronRight'
  | 'x' | 'settings' | 'cash' | 'clipboard' | 'search' | 'check' | 'alertCircle'
  | 'phone' | 'mic' | 'trendingUp' | 'clock' | 'users' | 'alertTriangle' | 'package' | 'zap';

const PATHS: Record<IconName, React.ReactNode> = {
  send: <><polyline points="22 2 11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
  checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  chevronRight: <polyline points="9 18 15 12 9 6" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></>,
  cash: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></>,
  clipboard: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></>,
  search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  alertCircle: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
  phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8a16 16 0 0 0 6.09 6.09l.86-.87a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></>,
  mic: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></>,
  trendingUp: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  alertTriangle: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  package: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>,
};

export const Icon: React.FC<{ name: IconName; size?: number; color?: string; strokeWidth?: number }> = ({
  name, size = 24, color = 'currentColor', strokeWidth = 2,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {PATHS[name]}
  </svg>
);

// ─── Phone Frame ───────────────────────────────────────────────────────────
export const PhoneFrame: React.FC<{ children: React.ReactNode; bg?: string; scale?: number }> = ({
  children, bg = A.bg, scale = 1,
}) => {
  const dark = bg === TG.bg || bg === TG.header || bg === '#0f172a';
  const fg = dark ? TG.sub : A.dark;
  return (
    <div style={{
      position: 'absolute',
      left: 140 + (800 * (1 - scale)) / 2,
      top: 120 + (1680 * (1 - scale)) / 2,
      width: 800 * scale, height: 1680 * scale,
      borderRadius: 54 * scale, background: '#111',
      padding: 14 * scale,
      boxShadow: '0 60px 160px rgba(0,0,0,0.75), inset 0 0 0 1.5px rgba(255,255,255,0.1)',
    }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 42 * scale, overflow: 'hidden', background: bg, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 12 * scale, left: '50%', transform: 'translateX(-50%)', width: 130 * scale, height: 36 * scale, background: '#000', borderRadius: 20 * scale, zIndex: 200 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56 * scale, display: 'flex', alignItems: 'flex-end', paddingBottom: 10 * scale, paddingLeft: 28 * scale, paddingRight: 28 * scale, zIndex: 100 }}>
          <span style={{ fontSize: 24 * scale, fontWeight: 700, color: fg, fontFamily: 'system-ui' }}>9:41</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 9 * scale, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 3 * scale, alignItems: 'flex-end' }}>
              {[8, 12, 16, 20].map((h, i) => (
                <div key={i} style={{ width: 4 * scale, height: h * scale, background: fg, borderRadius: 2 * scale }} />
              ))}
            </div>
            <div style={{ width: 32 * scale, height: 16 * scale, border: `2px solid ${fg}`, borderRadius: 5 * scale, padding: 2 * scale }}>
              <div style={{ width: '78%', height: '100%', background: fg, borderRadius: 2 * scale }} />
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 56 * scale, left: 0, right: 0, bottom: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Message types ─────────────────────────────────────────────────────────
export type Message = {
  from: 'user' | 'bot';
  text: string;
  keyboard?: { options: string[]; selected: number };
  isVoiceNote?: boolean;
  isMissedCall?: boolean;
  sender?: string; // for group chats
};

// ─── TG Bubble ─────────────────────────────────────────────────────────────
export const TGBubble: React.FC<{
  msg: Message;
  chatFrame: number;
  revealAt: number;
  accent?: string;
  fps: number;
  keyboardSelectFrame?: number;
  fontSize?: number;
}> = ({ msg, chatFrame, revealAt, accent = A.blue, fps, keyboardSelectFrame = 9999, fontSize = 23 }) => {
  const isUser = msg.from === 'user';
  const s = sp(chatFrame - revealAt, fps, 18, 140);
  const op = interpolate(chatFrame - revealAt, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tx = interpolate(s, [0, 1], [isUser ? 50 : -50, 0]);
  const lines = msg.text.split('\n');

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 8, paddingLeft: isUser ? 80 : 0, paddingRight: isUser ? 0 : 60, opacity: op, transform: `translateX(${tx}px)` }}>
      {!isUser && (
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0, alignSelf: 'flex-end' }}>
          <svg width="22" height="10" viewBox="0 0 182 42" fill="none">
            <path d="M 21,8 A 13,13 0 1,0 34,21" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            <circle cx="21" cy="21" r="2.5" fill="#fff" />
          </svg>
        </div>
      )}
      <div style={{ maxWidth: '78%' }}>
        <div style={{
          background: isUser ? TG.sent : TG.recv,
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          padding: '12px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {lines.map((line, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '4px 0 0', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize, color: TG.text, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
              {line || '\u00A0'}
            </p>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, gap: 3 }}>
            <span style={{ fontSize: 16, color: TG.time }}>15:42</span>
            {isUser && <Icon name="check" size={16} color={TG.sub} />}
          </div>
        </div>
        {msg.keyboard && (
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {msg.keyboard.options.map((opt, idx) => {
              const chosen = msg.keyboard!.selected === idx;
              const activated = chatFrame >= keyboardSelectFrame;
              return (
                <div key={idx} style={{
                  flex: 1, background: chosen && activated ? TG.btnSel : TG.btn,
                  borderRadius: 12, padding: '11px 8px', textAlign: 'center',
                  opacity: !chosen && activated ? 0.5 : 1,
                  border: chosen && activated ? `1px solid ${TG.sub}55` : '1px solid transparent',
                }}>
                  <span style={{ fontSize: 19, color: TG.text, fontFamily: 'system-ui,-apple-system,sans-serif' }}>{opt}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TG Chat header ────────────────────────────────────────────────────────
export const TGHeader: React.FC<{ label: string; command: string; accent: string; iconName?: IconName }> = ({
  label, command, accent, iconName = 'zap',
}) => (
  <div style={{ background: TG.header, padding: '0 22px 14px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.4)', flexShrink: 0 }}>
    <div style={{ width: 58, height: 58, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name={iconName} size={28} color="#fff" strokeWidth={1.8} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ margin: 0, fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 28, fontWeight: 700, color: TG.text }}>Hoursback Bot</p>
      <p style={{ margin: '2px 0 0', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 20, color: TG.online, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: TG.online, display: 'inline-block' }} />
        online
      </p>
    </div>
    <div style={{ background: `${accent}22`, border: `1px solid ${accent}55`, borderRadius: 12, padding: '8px 18px' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: accent }}>{command}</span>
    </div>
  </div>
);

// ─── WA Bubble (before panel) ──────────────────────────────────────────────
export const WABubble: React.FC<{
  msg: Message;
  chatFrame: number;
  revealAt: number;
  fps: number;
}> = ({ msg, chatFrame, revealAt, fps }) => {
  const isOut = msg.from === 'user';
  const op = interpolate(chatFrame - revealAt, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ty = interpolate(sp(chatFrame - revealAt, fps, 20, 130), [0, 1], [20, 0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOut ? 'flex-end' : 'flex-start', marginBottom: 6, paddingLeft: isOut ? 40 : 0, paddingRight: isOut ? 0 : 30, opacity: op, transform: `translateY(${ty}px)` }}>
      {msg.sender && !isOut && (
        <span style={{ fontSize: 17, fontWeight: 700, color: '#0070ba', marginLeft: 14, marginBottom: 2, fontFamily: 'system-ui,-apple-system,sans-serif' }}>{msg.sender}</span>
      )}
      <div style={{
        background: isOut ? WA.out : WA.inc,
        borderRadius: isOut ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        padding: msg.isVoiceNote ? '10px 14px' : '8px 12px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        maxWidth: '85%',
      }}>
        {msg.isMissedCall ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="phone" size={18} color={WA.red} />
            <span style={{ fontSize: 19, color: WA.red, fontFamily: 'system-ui,-apple-system,sans-serif', fontWeight: 600 }}>Missed call (×5)</span>
          </div>
        ) : msg.isVoiceNote ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="mic" size={20} color="#25D366" />
            <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.15)', borderRadius: 4 }}>
              <div style={{ width: '60%', height: '100%', background: '#25D366', borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 17, color: WA.sub }}>0:23</span>
          </div>
        ) : (
          msg.text.split('\n').map((line, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : '3px 0 0', fontSize: 19, color: WA.text, fontFamily: 'system-ui,-apple-system,sans-serif', lineHeight: 1.4 }}>
              {line}
            </p>
          ))
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
          <span style={{ fontSize: 15, color: WA.sub }}>15:42</span>
        </div>
      </div>
    </div>
  );
};
