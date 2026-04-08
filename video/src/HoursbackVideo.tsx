import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';
import { TASKS, type Task, type Message } from './data/tasks';

// ─── Canvas ────────────────────────────────────────────────────────────────
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;

// ─── App brand colors ──────────────────────────────────────────────────────
const A = {
  bg: '#F8F9FA', dark: '#202124', blue: '#4285F4', white: '#ffffff',
  border: 'rgba(32,33,36,0.1)', muted: 'rgba(32,33,36,0.5)',
  slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0',
  slate400: '#94a3b8', slate500: '#64748b',
  green50: '#f0fdf4', green200: '#bbf7d0', green600: '#16a34a', green900: '#14532d',
  amber50: '#fffbeb', amber200: '#fde68a', amber800: '#92400e',
  purple50: '#faf5ff', purple200: '#e9d5ff', purple700: '#7e22ce',
  blue50: '#eff6ff', blue200: '#bfdbfe', blue700: '#1d4ed8',
};

// ─── Telegram colors ───────────────────────────────────────────────────────
const TG = {
  bg: '#17212B', header: '#242F3D',
  sent: '#2B5278', recv: '#182533',
  btn: '#1e3148', btnSel: '#2B5278',
  text: '#ffffff', sub: '#8696A0', time: '#8696A0', online: '#4dcd5a',
};

// ─── Timing ────────────────────────────────────────────────────────────────
const INTRO_F = 70;
const SETUP_F = 480;
const TASK_TITLE_F = 80;
const T_CHAT_F = [560, 520, 560]; // per-task chat frames
const T_F = T_CHAT_F.map(c => TASK_TITLE_F + c); // [640, 600, 640]
const OUTRO_F = 100;

export const TOTAL_FRAMES = INTRO_F + SETUP_F + T_F[0] + T_F[1] + T_F[2] + OUTRO_F;
// 70 + 480 + 640 + 600 + 640 + 100 = 2530

const SEQ_START = {
  setup: INTRO_F,
  task0: INTRO_F + SETUP_F,
  task1: INTRO_F + SETUP_F + T_F[0],
  task2: INTRO_F + SETUP_F + T_F[0] + T_F[1],
  outro: INTRO_F + SETUP_F + T_F[0] + T_F[1] + T_F[2],
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function fi(frame: number, s: number, d = 20) {
  return interpolate(frame, [s, s + d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}
function fo(frame: number, s: number, d = 20) {
  return interpolate(frame, [s, s + d], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
}
function frange(frame: number, is: number, id: number, os: number, od: number) {
  return Math.min(fi(frame, is, id), fo(frame, os, od));
}

// ─── Logo SVG (exact match to /public/logo.svg) ────────────────────────────
const Logo: React.FC<{ width?: number; light?: boolean }> = ({ width = 220, light = false }) => {
  const textFill = light ? '#ffffff' : '#202124';
  const handFill = light ? '#ffffff' : '#202124';
  const h = width * 42 / 182;
  return (
    <svg width={width} height={h} viewBox="0 0 182 42" fill="none">
      <path d="M 21,8 A 13,13 0 1,0 34,21" stroke="#4285F4" strokeWidth="3.6" strokeLinecap="round" />
      <line x1="21" y1="21" x2="14.5" y2="17.2" stroke={handFill} strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="21" x2="29.7" y2="16" stroke={handFill} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="21" cy="21" r="2" fill="#4285F4" />
      <text x="49" y="27" fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" fontWeight="600" fontSize="20" fill={textFill} letterSpacing="-0.3">hoursback</text>
    </svg>
  );
};

// ─── Icons (Lucide-compatible SVG paths, matching the app's icon set) ──────
type IconName = 'send' | 'checkCircle' | 'database' | 'copy' | 'chevronRight'
  | 'chevronLeft' | 'x' | 'settings' | 'shield' | 'link' | 'unlink'
  | 'cash' | 'clipboard' | 'search' | 'check' | 'alertCircle';

const PATHS: Record<IconName, React.ReactNode> = {
  send: <><polyline points="22 2 11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
  checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  chevronRight: <polyline points="9 18 15 12 9 6" />,
  chevronLeft: <polyline points="15 18 9 12 15 6" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  unlink: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /><line x1="2" y1="2" x2="22" y2="22" /></>,
  cash: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></>,
  clipboard: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="14" y2="17" /></>,
  search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  alertCircle: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
};

const Icon: React.FC<{ name: IconName; size?: number; color?: string; strokeWidth?: number }> = ({
  name, size = 24, color = 'currentColor', strokeWidth = 2,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {PATHS[name]}
  </svg>
);

// ─── Phone Frame ───────────────────────────────────────────────────────────
const PhoneFrame: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = A.bg }) => (
  <div style={{
    position: 'absolute', left: 140, top: 120,
    width: 800, height: 1680,
    borderRadius: 54, background: '#111',
    padding: 14,
    boxShadow: '0 60px 160px rgba(0,0,0,0.75), inset 0 0 0 1.5px rgba(255,255,255,0.1)',
  }}>
    {/* Screen */}
    <div style={{ width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: bg, position: 'relative' }}>
      {/* Dynamic island */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 130, height: 36, background: '#000', borderRadius: 20, zIndex: 200 }} />
      {/* Status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, display: 'flex', alignItems: 'flex-end', paddingBottom: 10, paddingLeft: 28, paddingRight: 28, zIndex: 100 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: bg === TG.header ? TG.text : A.dark, fontFamily: 'system-ui' }}>9:41</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          {/* Signal bars */}
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
            {[8, 12, 16, 20].map((h, i) => (
              <div key={i} style={{ width: 4, height: h, background: bg === TG.header ? TG.sub : A.dark, borderRadius: 2 }} />
            ))}
          </div>
          {/* Wifi */}
          <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
            <path d="M1 6c3-3 6.5-5 11-5s8 2 11 5" stroke={bg === TG.header ? TG.sub : A.dark} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M4 10c2-2 4.5-3.5 8-3.5s6 1.5 8 3.5" stroke={bg === TG.header ? TG.sub : A.dark} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M7 14c1.5-1.5 3-2 5-2s3.5.5 5 2" stroke={bg === TG.header ? TG.sub : A.dark} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1.5" fill={bg === TG.header ? TG.sub : A.dark} />
          </svg>
          {/* Battery */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 32, height: 16, border: `2px solid ${bg === TG.header ? TG.sub : A.dark}`, borderRadius: 5, padding: 2 }}>
              <div style={{ width: '78%', height: '100%', background: bg === TG.header ? TG.sub : A.dark, borderRadius: 2 }} />
            </div>
            <div style={{ width: 3, height: 8, background: bg === TG.header ? TG.sub : A.dark, borderRadius: '0 2px 2px 0', marginLeft: 1 }} />
          </div>
        </div>
      </div>
      {/* Screen content */}
      <div style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0 }}>
        {children}
      </div>
    </div>
  </div>
);

// ─── Intro ─────────────────────────────────────────────────────────────────
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const t1 = fi(frame, 20, 22);
  const t2 = fi(frame, 36, 22);
  const line = fi(frame, 28, 18);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #1a2744 0%, #0f172a 70%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow */}
      <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: `radial-gradient(circle, ${A.blue}18 0%, transparent 70%)`, top: '30%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      {/* Logo */}
      <div style={{ transform: `scale(${s})`, marginBottom: 36 }}>
        <Logo width={340} light />
      </div>
      {/* Divider */}
      <div style={{ width: interpolate(line, [0, 1], [0, 280]), height: 2, background: `linear-gradient(90deg, transparent, ${A.blue}, transparent)`, marginBottom: 32, opacity: line }} />
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 38, fontWeight: 700, color: A.white, textAlign: 'center', opacity: t1, margin: '0 80px 14px', letterSpacing: '-0.5px', lineHeight: 1.3 }}>
        AI workflows for your team on Telegram
      </p>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 28, color: TG.sub, textAlign: 'center', opacity: t2, margin: '0 100px', lineHeight: 1.5 }}>
        No app download. No training. Just type a command.
      </p>
    </AbsoluteFill>
  );
};

// ─── App Setup Scene ───────────────────────────────────────────────────────
// Recreates the exact Hoursback Settings page + TelegramSetupGuide flow

// Phase 1: Not-connected settings page (0–160f)
const Phase1: React.FC<{ frame: number }> = ({ frame }) => {
  const btnPulse = Math.abs(Math.sin(frame * 0.08)) * 0.12 + 0.88;
  const btnGlow = Math.abs(Math.sin(frame * 0.08));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: A.bg, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      {/* Nav */}
      <div style={{ background: A.white, borderBottom: `1px solid ${A.border}`, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Logo width={160} />
        <span style={{ fontSize: 22, color: A.muted }}>Sign out</span>
      </div>
      {/* Card */}
      <div style={{ flex: 1, padding: '28px 28px', overflowY: 'hidden' }}>
        <div style={{ background: A.white, borderRadius: 48, border: `1px solid ${A.border}`, padding: '40px 40px', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.05)' }}>
          {/* Heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <Icon name="settings" size={44} color={A.blue} />
            <span style={{ fontSize: 42, fontWeight: 600, color: A.dark }}>Account Settings</span>
          </div>
          <div style={{ height: 1, background: A.border, marginBottom: 32 }} />
          {/* Telegram section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <Icon name="send" size={36} color={A.slate400} />
              <span style={{ fontSize: 36, fontWeight: 600, color: A.dark }}>Telegram Bot</span>
            </div>
            <p style={{ fontSize: 24, color: A.muted, lineHeight: 1.5, marginBottom: 0 }}>
              Give your team a private Telegram bot they own — for cash reconciliation, shift handovers, escalations, and more. 24/7, no app needed.
            </p>
          </div>
          {/* Not connected state */}
          <div style={{ background: A.slate50, borderRadius: 36, padding: '40px 32px', textAlign: 'center' }}>
            {/* Bot icon */}
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: A.slate200, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={A.slate500} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" />
                <circle cx="8" cy="16" r="1" fill={A.slate500} stroke="none" /><circle cx="16" cy="16" r="1" fill={A.slate500} stroke="none" />
                <line x1="7" y1="11" x2="7" y2="11" />
              </svg>
            </div>
            <p style={{ fontSize: 30, fontWeight: 600, color: A.dark, marginBottom: 10 }}>No bot connected yet</p>
            <p style={{ fontSize: 22, color: A.muted, lineHeight: 1.5, marginBottom: 28 }}>
              Set up a private Telegram bot your team can message 24/7 — for reconciliations, handovers, escalations, and more.
            </p>
            {/* Set up button — pulsing */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 14, padding: '18px 44px',
              background: A.dark, color: A.white, borderRadius: 60,
              fontSize: 26, fontWeight: 600, transform: `scale(${btnPulse})`,
              boxShadow: `0 0 ${interpolate(btnGlow, [0, 1], [10, 40])}px rgba(66,133,244,${btnGlow * 0.6})`,
            }}>
              <Icon name="send" size={28} color={A.white} />
              Set up my Telegram bot
            </div>
            <p style={{ fontSize: 20, color: A.slate400, marginTop: 14 }}>Takes about 3 minutes · Step-by-step guide included</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Phase 2: TelegramSetupGuide modal — Step 4 "Paste your token" (160–300f)
const Phase2: React.FC<{ frame: number }> = ({ frame }) => {
  const { fps } = useVideoConfig();
  const relFrame = frame - 160;
  const modalSlide = spring({ frame: relFrame - 5, fps, config: { damping: 22, stiffness: 130 } });
  const modalY = interpolate(modalSlide, [0, 1], [600, 0]);

  const FULL_TOKEN = '7182394056:AAF_mS0kPzxX3vL9JqRe8nYhDc2tGW';
  const charCount = Math.floor(interpolate(relFrame, [35, 90], [0, FULL_TOKEN.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const displayToken = FULL_TOKEN.slice(0, charCount);

  const isConnecting = relFrame >= 110 && relFrame < 130;
  const isSuccess = relFrame >= 130;
  const progress = (5 / 6) * 100; // step 5 of 6

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Settings page blurred behind */}
      <div style={{ position: 'absolute', inset: 0, background: A.bg, opacity: 0.3 }} />
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)' }} />
      {/* Modal */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%',
        transform: `translateX(-50%) translateY(${modalY}px)`,
        width: 680, background: A.white,
        borderRadius: '48px 48px 0 0',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        fontFamily: 'system-ui,-apple-system,sans-serif',
      }}>
        {/* Handle */}
        <div style={{ width: 48, height: 6, background: A.slate200, borderRadius: 3, margin: '16px auto 0' }} />
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 36px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="send" size={32} color={A.blue} />
            <span style={{ fontSize: 24, fontWeight: 600, color: A.slate500 }}>Telegram Bot Setup</span>
          </div>
          <div style={{ padding: 8, borderRadius: '50%', background: A.slate100, display: 'flex' }}>
            <Icon name="x" size={24} color={A.slate500} />
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ padding: '0 36px 6px' }}>
          <div style={{ height: 6, background: A.slate100, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: A.blue, borderRadius: 6, transition: 'width 0.5s' }} />
          </div>
          <p style={{ fontSize: 20, color: A.slate400, marginTop: 6 }}>Step 5 of 6</p>
        </div>
        {/* Content — Step 4 */}
        <div style={{ padding: '16px 36px 32px' }}>
          {/* Title */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: A.blue50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="checkCircle" size={30} color={A.blue} />
            </div>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: A.dark, textAlign: 'center', marginBottom: 10 }}>
            Almost done — paste your token
          </h2>
          <p style={{ fontSize: 22, color: A.muted, textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
            Paste the token BotFather gave you below. We'll connect your bot automatically.
          </p>
          {/* Token input */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 22, fontWeight: 500, color: A.dark, marginBottom: 10 }}>Your bot token</p>
            <div style={{
              padding: '16px 20px', border: `2px solid ${isSuccess ? A.green600 : A.blue}`,
              borderRadius: 20, background: A.white, display: 'flex', alignItems: 'center',
              fontFamily: 'monospace', fontSize: 22, color: A.dark, minHeight: 60,
              boxShadow: `0 0 0 4px ${isSuccess ? A.green50 : A.blue50}`,
            }}>
              <span style={{ flex: 1, wordBreak: 'break-all' }}>{displayToken}{charCount < FULL_TOKEN.length ? <span style={{ opacity: Math.sin(relFrame * 0.3) > 0 ? 1 : 0, borderLeft: `2px solid ${A.dark}`, marginLeft: 1 }}>|</span> : null}</span>
              {isSuccess && <Icon name="checkCircle" size={28} color={A.green600} />}
            </div>
            <p style={{ fontSize: 18, color: A.slate400, marginTop: 8 }}>It looks like numbers, a colon, then letters and dashes</p>
          </div>
          {/* Connect button */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '18px 0', background: isSuccess ? A.green600 : A.blue,
            borderRadius: 20, fontSize: 26, fontWeight: 600, color: A.white,
          }}>
            {isConnecting ? (
              <>
                <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Connecting your bot...
              </>
            ) : isSuccess ? (
              <><Icon name="checkCircle" size={28} color={A.white} /> Bot connected!</>
            ) : (
              <><Icon name="send" size={28} color={A.white} /> Connect my bot</>
            )}
          </div>
          <p style={{ fontSize: 18, color: A.slate400, textAlign: 'center', marginTop: 10 }}>
            This takes about 5 seconds. Your token is stored securely.
          </p>
        </div>
      </div>
    </div>
  );
};

// Phase 3: Connected state (300–480f)
const Phase3: React.FC<{ frame: number }> = ({ frame }) => {
  const rel = frame - 300;
  const f0 = fi(rel, 0, 18);
  const f1 = fi(rel, 12, 18);
  const f2 = fi(rel, 22, 18);
  const f3 = fi(rel, 32, 18);
  const f4 = fi(rel, 42, 18);

  const COMMANDS = [
    ['/reconcile', 'Daily cash reconciliation'],
    ['/handover', 'Shift handover log'],
    ['/sop', 'SOP compliance check'],
    ['/sopupdate', 'SOP update notifier'],
    ['/restock', 'Supplier outreach'],
    ['/audit', 'Inventory audit'],
    ['/assign', 'Task assignment'],
    ['/escalate', 'Escalation router'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: A.bg, fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}>
      {/* Nav */}
      <div style={{ background: A.white, borderBottom: `1px solid ${A.border}`, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Logo width={160} />
        <span style={{ fontSize: 22, color: A.muted }}>Sign out</span>
      </div>
      {/* Card */}
      <div style={{ flex: 1, padding: '20px 28px', overflowY: 'hidden' }}>
        <div style={{ background: A.white, borderRadius: 48, border: `1px solid ${A.border}`, padding: '32px 36px', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.05)' }}>
          {/* Heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <Icon name="settings" size={40} color={A.blue} />
            <span style={{ fontSize: 38, fontWeight: 600, color: A.dark }}>Account Settings</span>
          </div>
          <div style={{ height: 1, background: A.border, marginBottom: 24 }} />
          {/* Telegram section heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <Icon name="send" size={32} color={A.slate400} />
            <span style={{ fontSize: 32, fontWeight: 600, color: A.dark }}>Telegram Bot</span>
          </div>
          {/* Connected banner */}
          <div style={{ opacity: f0, display: 'flex', alignItems: 'center', gap: 14, background: A.green50, border: `1px solid ${A.green200}`, borderRadius: 24, padding: '18px 22px', marginBottom: 18 }}>
            <Icon name="checkCircle" size={32} color={A.green600} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 24, fontWeight: 600, color: A.green900, margin: 0 }}>HoursbackDemoBot connected</p>
              <p style={{ fontSize: 20, color: '#166534', margin: '4px 0 0' }}>@HoursbackDemoBot · Webhook active · 24/7</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 20, color: '#dc2626' }}>
              <Icon name="unlink" size={22} color="#dc2626" />
              Disconnect
            </div>
          </div>
          {/* Invite links */}
          <div style={{ opacity: f1, marginBottom: 14 }}>
            <p style={{ fontSize: 22, fontWeight: 500, color: A.muted, marginBottom: 10 }}>Invite links — share with your team</p>
            {/* Manager */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: A.purple700, background: A.purple50, border: `1px solid ${A.purple200}`, padding: '3px 12px', borderRadius: 20 }}>Manager</span>
                <span style={{ fontSize: 18, color: A.slate400 }}>Full access — assign to trusted leads</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, background: A.slate50, border: `1px solid ${A.slate200}`, borderRadius: 14, padding: '10px 14px', fontFamily: 'monospace', fontSize: 18, color: A.blue }}>
                  t.me/HoursbackDemoBot?start=mgr_a4x9k2
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: A.dark, borderRadius: 14, fontSize: 20, color: A.white }}>
                  <Icon name="copy" size={22} color={A.white} /> Copy
                </div>
              </div>
            </div>
            {/* Staff */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: A.blue700, background: A.blue50, border: `1px solid ${A.blue200}`, padding: '3px 12px', borderRadius: 20 }}>Staff</span>
                <span style={{ fontSize: 18, color: A.slate400 }}>Limited access — share with all team members</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, background: A.slate50, border: `1px solid ${A.slate200}`, borderRadius: 14, padding: '10px 14px', fontFamily: 'monospace', fontSize: 18, color: A.blue }}>
                  t.me/HoursbackDemoBot?start=stf_m7y3n5
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: A.dark, borderRadius: 14, fontSize: 20, color: A.white }}>
                  <Icon name="copy" size={22} color={A.white} /> Copy
                </div>
              </div>
            </div>
          </div>
          {/* Data sources link */}
          <div style={{ opacity: f2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: `${A.blue}0d`, border: `1px solid ${A.blue}33`, borderRadius: 22, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="database" size={28} color={A.blue} />
              <div>
                <p style={{ fontSize: 22, fontWeight: 600, color: A.dark, margin: 0 }}>Data Sources</p>
                <p style={{ fontSize: 18, color: A.muted, margin: 0 }}>Register sheets so staff skip manual entry</p>
              </div>
            </div>
            <Icon name="chevronRight" size={24} color={A.slate400} />
          </div>
          {/* Commands list */}
          <div style={{ opacity: f3, background: A.slate50, borderRadius: 22, padding: '18px 20px' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Available commands</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {COMMANDS.map(([cmd, desc]) => (
                <div key={cmd} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 19, color: A.blue, minWidth: 110, fontWeight: 600 }}>{cmd}</span>
                  <span style={{ fontSize: 17, color: A.muted }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// AppSetupScene orchestrator
const AppSetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#0f172a' }}>
      <PhoneFrame bg={A.bg}>
        {/* Phase 1: not connected (0–175f) */}
        <div style={{ position: 'absolute', inset: 0, opacity: frange(frame, 0, 10, 155, 20) }}>
          <Phase1 frame={frame} />
        </div>
        {/* Phase 2: token entry (155–315f) */}
        {frame >= 150 && frame < 315 && (
          <div style={{ position: 'absolute', inset: 0, opacity: frange(frame, 160, 12, 295, 18) }}>
            <Phase1 frame={0} />
            <Phase2 frame={frame} />
          </div>
        )}
        {/* Phase 3: connected (295–480f) */}
        {frame >= 290 && (
          <div style={{ position: 'absolute', inset: 0, opacity: fi(frame, 300, 20) }}>
            <Phase3 frame={frame} />
          </div>
        )}
      </PhoneFrame>

      {/* Caption strip at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, transparent 100%)',
        padding: '80px 60px 50px',
        fontFamily: 'system-ui,-apple-system,sans-serif',
      }}>
        <div style={{ opacity: frange(frame, 0, 15, 140, 20) }}>
          <p style={{ fontSize: 30, fontWeight: 700, color: A.white, margin: 0, letterSpacing: '-0.3px' }}>Step 1 — Connect your bot</p>
          <p style={{ fontSize: 24, color: TG.sub, margin: '6px 0 0', lineHeight: 1.4 }}>Go to Settings in Hoursback and click "Set up my Telegram bot"</p>
        </div>
        <div style={{ opacity: frange(frame, 160, 15, 290, 20) }}>
          <p style={{ fontSize: 30, fontWeight: 700, color: A.white, margin: 0 }}>Step 2 — Paste your BotFather token</p>
          <p style={{ fontSize: 24, color: TG.sub, margin: '6px 0 0', lineHeight: 1.4 }}>Create a bot on @BotFather and paste the token here</p>
        </div>
        <div style={{ opacity: fi(frame, 300, 15) }}>
          <p style={{ fontSize: 30, fontWeight: 700, color: A.white, margin: 0 }}>Step 3 — Share invite links</p>
          <p style={{ fontSize: 24, color: TG.sub, margin: '6px 0 0', lineHeight: 1.4 }}>Send the right link to managers and staff — they tap it once to activate</p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Task Title Card ────────────────────────────────────────────────────────
const TaskTitleCard: React.FC<{ task: Task; taskIndex: number }> = ({ task, taskIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const tf = fi(frame, 14, 22);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #0d1b2a 0%, #0f172a 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${task.accent}14 0%, transparent 70%)`, top: '32%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      <div style={{ transform: `scale(${s})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        {/* Task badge */}
        <div style={{ background: task.accent, color: '#000', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 20, fontWeight: 800, padding: '8px 28px', borderRadius: 40, letterSpacing: '2px', textTransform: 'uppercase' }}>
          Task {taskIndex + 1} of 3
        </div>
        {/* Icon circle */}
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: `${task.accent}22`, border: `3px solid ${task.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={task.icon} size={58} color={task.accent} strokeWidth={1.5} />
        </div>
        <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 54, fontWeight: 900, color: A.white, letterSpacing: '-1.5px', textAlign: 'center', padding: '0 60px', lineHeight: 1.15 }}>
          {task.label}
        </div>
      </div>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 28, color: TG.sub, textAlign: 'center', padding: '0 80px', lineHeight: 1.5, marginTop: 18, opacity: tf }}>
        {task.sublabel}
      </p>
      <div style={{ marginTop: 36, background: `${task.accent}18`, border: `2px solid ${task.accent}55`, borderRadius: 18, padding: '14px 40px', opacity: tf }}>
        <span style={{ fontFamily: 'monospace', fontSize: 38, fontWeight: 700, color: task.accent }}>{task.command}</span>
      </div>
    </AbsoluteFill>
  );
};

// ─── Telegram Chat Scene ────────────────────────────────────────────────────
// Single message bubble
const Bubble: React.FC<{
  msg: Message; chatFrame: number; revealAt: number; accent: string; fps: number;
  keyboardSelectFrame: number;
}> = ({ msg, chatFrame, revealAt, accent, fps, keyboardSelectFrame }) => {
  const isUser = msg.from === 'user';
  const s = spring({ frame: chatFrame - revealAt, fps, config: { damping: 18, stiffness: 140 } });
  const op = interpolate(chatFrame - revealAt, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tx = interpolate(s, [0, 1], [isUser ? 60 : -60, 0]);

  const lines = msg.text.split('\n');

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 8, paddingLeft: isUser ? 60 : 0, paddingRight: isUser ? 0 : 50, opacity: op, transform: `translateX(${tx}px)` }}>
      {/* Bot avatar */}
      {!isUser && (
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0, alignSelf: 'flex-end' }}>
          <svg width="22" height="22" viewBox="0 0 182 42" fill="none">
            <path d="M 21,8 A 13,13 0 1,0 34,21" stroke="#fff" strokeWidth="3.8" strokeLinecap="round" />
            <circle cx="21" cy="21" r="2.2" fill="#fff" />
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
            <p key={i} style={{ margin: i === 0 ? 0 : '5px 0 0', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 23, color: TG.text, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
              {line || '\u00A0'}
            </p>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 17, color: TG.time }}>15:42</span>
            {isUser && <Icon name="check" size={17} color={TG.sub} />}
          </div>
        </div>
        {/* Inline keyboard buttons */}
        {msg.keyboard && (
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {msg.keyboard.options.map((opt, idx) => {
              const chosen = msg.keyboard!.selected === idx;
              const activated = chatFrame >= keyboardSelectFrame;
              return (
                <div key={idx} style={{
                  flex: 1, background: chosen && activated ? TG.btnSel : TG.btn,
                  borderRadius: 12, padding: '11px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  border: chosen && activated ? `1px solid ${TG.sub}44` : '1px solid transparent',
                  opacity: chosen && activated ? 1 : (!chosen && activated ? 0.55 : 1),
                }}>
                  {chosen && activated && <Icon name="check" size={18} color={TG.online} />}
                  <span style={{ fontSize: 20, color: TG.text, fontFamily: 'system-ui,-apple-system,sans-serif', textAlign: 'center', lineHeight: 1.2 }}>{opt}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const TelegramChatScene: React.FC<{ task: Task }> = ({ task }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chatFrame = frame - TASK_TITLE_F; // chat starts after title card

  const msgCount = task.messages.length;
  const spacing = Math.floor((task.chatFrames - 40) / (msgCount - 1));
  const msgDelay = (i: number) => 5 + spacing * i;
  // Keyboard selection: 22 frames after the keyboard message (index 1) appears
  const keyboardSelectFrame = msgDelay(1) + 22;

  const visibleMessages = task.messages.filter((_, i) => chatFrame >= msgDelay(i) - 5);

  return (
    <AbsoluteFill style={{ background: TG.bg }}>
      {/* Header */}
      <div style={{ background: TG.header, padding: '0 22px 14px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.4)', flexShrink: 0 }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: task.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={task.icon} size={28} color="#fff" strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 28, fontWeight: 700, color: TG.text }}>Hoursback Bot</p>
          <p style={{ margin: '2px 0 0', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 20, color: TG.online, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: TG.online, display: 'inline-block' }} />
            online
          </p>
        </div>
        <div style={{ background: `${task.accent}22`, border: `1px solid ${task.accent}55`, borderRadius: 12, padding: '8px 18px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: task.accent }}>{task.command}</span>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, padding: '12px 14px 0', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', overflow: 'hidden', height: 'calc(100% - 82px - 76px)' }}>
        {visibleMessages.map((msg, i) => {
          const actualIdx = task.messages.indexOf(msg);
          return (
            <Bubble
              key={actualIdx}
              msg={msg}
              chatFrame={chatFrame}
              revealAt={msgDelay(actualIdx)}
              accent={task.accent}
              fps={fps}
              keyboardSelectFrame={keyboardSelectFrame}
            />
          );
        })}
      </div>

      {/* Input bar */}
      <div style={{ background: TG.header, padding: '12px 16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1, background: TG.recv, borderRadius: 30, padding: '14px 20px', fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 23, color: TG.sub }}>
          Message...
        </div>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: task.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" size={24} color="#fff" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Full task (title + chat) wrapped in phone frame
const TaskScene: React.FC<{ task: Task; taskIndex: number }> = ({ task, taskIndex }) => {
  const frame = useCurrentFrame();
  const inTitle = frame < TASK_TITLE_F;
  return (
    <AbsoluteFill style={{ background: '#0f172a' }}>
      <PhoneFrame bg={inTitle ? '#0f172a' : TG.bg}>
        {inTitle ? (
          <TaskTitleCard task={task} taskIndex={taskIndex} />
        ) : (
          <TelegramChatScene task={task} />
        )}
      </PhoneFrame>

      {/* Caption bottom — only during chat */}
      {!inTitle && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, transparent 100%)',
          padding: '60px 60px 44px',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          opacity: fi(frame - TASK_TITLE_F, 0, 15),
        }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: A.white, margin: 0 }}>
            {task.label}
          </p>
          <p style={{ fontSize: 22, color: TG.sub, margin: '6px 0 0', lineHeight: 1.4 }}>
            {task.sublabel}
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Outro ─────────────────────────────────────────────────────────────────
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 110 } });
  const t1 = fi(frame, 14, 22);
  const t2 = fi(frame, 28, 22);
  const pills = fi(frame, 44, 22);
  const cta = fi(frame, 58, 22);
  const url = fi(frame, 70, 18);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, #1a2744 0%, #0f172a 70%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', background: `radial-gradient(circle, ${A.blue}14 0%, transparent 70%)`, top: '36%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      {/* Logo */}
      <div style={{ transform: `scale(${s})`, marginBottom: 36 }}>
        <Logo width={360} light />
      </div>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 40, fontWeight: 700, color: A.white, textAlign: 'center', opacity: t1, margin: '0 60px 12px', letterSpacing: '-0.5px', lineHeight: 1.3 }}>
        Your business on autopilot
      </p>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 28, color: TG.sub, textAlign: 'center', opacity: t2, margin: '0 80px 44px', lineHeight: 1.5 }}>
        Set a schedule. Get insights in your inbox. No code needed.
      </p>
      {/* Command pills */}
      <div style={{ display: 'flex', gap: 14, opacity: pills, marginBottom: 28 }}>
        {TASKS.map(t => (
          <div key={t.command} style={{ background: `${t.accent}18`, border: `2px solid ${t.accent}55`, borderRadius: 16, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name={t.icon} size={22} color={t.accent} />
            <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: t.accent }}>{t.command}</span>
          </div>
        ))}
      </div>
      {/* CTA button */}
      <div style={{ background: A.blue, borderRadius: 60, padding: '22px 80px', opacity: cta, boxShadow: `0 0 60px ${A.blue}44` }}>
        <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 36, fontWeight: 800, color: A.white, letterSpacing: '-0.5px' }}>
          Try it free →
        </span>
      </div>
      <p style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontSize: 26, color: A.blue, marginTop: 28, opacity: url, letterSpacing: '0.4px' }}>
        hoursback.xyz
      </p>
    </AbsoluteFill>
  );
};

// ─── Main Composition ───────────────────────────────────────────────────────
export const HoursbackVideo: React.FC = () => (
  <AbsoluteFill style={{ background: '#0f172a' }}>
    <Sequence from={0} durationInFrames={INTRO_F}>
      <Intro />
    </Sequence>

    <Sequence from={SEQ_START.setup} durationInFrames={SETUP_F}>
      <AppSetupScene />
    </Sequence>

    <Sequence from={SEQ_START.task0} durationInFrames={T_F[0]}>
      <TaskScene task={TASKS[0]} taskIndex={0} />
    </Sequence>

    <Sequence from={SEQ_START.task1} durationInFrames={T_F[1]}>
      <TaskScene task={TASKS[1]} taskIndex={1} />
    </Sequence>

    <Sequence from={SEQ_START.task2} durationInFrames={T_F[2]}>
      <TaskScene task={TASKS[2]} taskIndex={2} />
    </Sequence>

    <Sequence from={SEQ_START.outro} durationInFrames={OUTRO_F}>
      <Outro />
    </Sequence>
  </AbsoluteFill>
);
