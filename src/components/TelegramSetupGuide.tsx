import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, ExternalLink, Copy, CheckCircle, Send } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (token: string) => Promise<void>;
  isConnecting: boolean;
  connectedBotUsername?: string;
  managerToken?: string;
  staffToken?: string;
}

const STEPS = [
  {
    id: 'intro',
    title: 'Your team is getting a private business bot',
    emoji: '🤖',
  },
  {
    id: 'open_botfather',
    title: 'Open BotFather on Telegram',
    emoji: '📱',
  },
  {
    id: 'create_bot',
    title: 'Create your bot',
    emoji: '⚙️',
  },
  {
    id: 'copy_token',
    title: 'Copy your bot token',
    emoji: '🔑',
  },
  {
    id: 'connect',
    title: 'Paste your token here',
    emoji: '✅',
  },
  {
    id: 'live',
    title: 'Your bot is live — share with your team',
    emoji: '🚀',
  },
];

const BOT_COMMANDS = [
  { command: '/reconcile', emoji: '💰', desc: 'Daily cash log and variance check' },
  { command: '/handover', emoji: '📋', desc: 'End-of-shift log in seconds' },
  { command: '/sop', emoji: '✅', desc: 'SOP compliance check before any task' },
  { command: '/audit', emoji: '🔍', desc: 'Guided inventory count' },
  { command: '/restock', emoji: '📦', desc: 'Drafts supplier reorder messages' },
  { command: '/assign', emoji: '👥', desc: 'Assign tasks with owner and deadline' },
  { command: '/escalate', emoji: '🚨', desc: 'Routes urgent issues to right person' },
  { command: '/sopupdate', emoji: '📢', desc: 'Broadcast procedure changes to team' },
];

// Simulated chat bubble components
function BotBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">B</div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-slate-800 max-w-xs shadow-sm">
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="bg-blue-500 rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white max-w-xs">
        {text}
      </div>
    </div>
  );
}

function ChatMockup({ messages }: { messages: { type: 'bot' | 'user'; text: string }[] }) {
  return (
    <div className="bg-slate-100 rounded-2xl p-4 space-y-3 my-4">
      {messages.map((m, i) =>
        m.type === 'bot'
          ? <BotBubble key={i} text={m.text} />
          : <UserBubble key={i} text={m.text} />
      )}
    </div>
  );
}

export function TelegramSetupGuide({ isOpen, onClose, onConnect, isConnecting, connectedBotUsername, managerToken, staffToken }: Props) {
  const [step, setStep] = useState(0);
  const [token, setToken] = useState('');
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'manager' | 'staff' | null>(null);

  if (!isOpen) return null;

  const copyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const copyInviteLink = (role: 'manager' | 'staff') => {
    const t = role === 'manager' ? managerToken : staffToken;
    const link = `https://t.me/${connectedBotUsername}?start=${t}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(role);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleConnect = async () => {
    try {
      await onConnect(token);
      setStep(5);
    } catch {
      // error toast shown by parent
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-sm text-slate-600">Telegram Bot Setup</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 shrink-0">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Step 0 — Intro */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-4xl text-center py-2">🤖</div>
              <h2 className="text-2xl font-bold text-center">Your team is getting a private business bot</h2>
              <p className="text-slate-600 text-center">
                In about 3 minutes, you'll create a Telegram bot that <strong>only your team can use</strong>.
              </p>

              <ChatMockup messages={[
                { type: 'user', text: '/reconcile' },
                { type: 'bot', text: '💰 Cash Reconciliation\n\nWhat was your opening balance today? (₦)' },
                { type: 'user', text: '85,000' },
                { type: 'bot', text: 'Got it. Total sales today? (₦)' },
              ]} />

              <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
                <p className="font-semibold text-blue-900 text-sm">What your team will be able to do:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  {[
                    '💰 Run cash reconciliation at end of day',
                    '📋 Log shift handovers in seconds',
                    '🚨 Trigger escalations instantly',
                    '📦 Check stock and send reorder drafts',
                    '👥 Assign tasks to the right person',
                  ].map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-slate-500 text-center">
                No technical knowledge needed. We'll walk you through every step.
              </p>
            </div>
          )}

          {/* Step 1 — Open BotFather */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-4xl text-center py-2">📱</div>
              <h2 className="text-2xl font-bold text-center">Open BotFather on Telegram</h2>
              <p className="text-slate-600">
                BotFather is Telegram's official tool for creating bots. Think of it like a <strong>"bot registration office"</strong> — it's completely safe and free.
              </p>

              <div className="bg-slate-100 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-700">What to do:</p>
                <ol className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-500 shrink-0">1.</span>
                    Open Telegram on your phone or computer
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-500 shrink-0">2.</span>
                    <span>In the search bar, type <strong>@BotFather</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-500 shrink-0">3.</span>
                    <span>Tap the one with a <strong>blue tick ✓</strong> (that's the official one)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-500 shrink-0">4.</span>
                    Tap <strong>Start</strong> at the bottom
                  </li>
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <strong>Important:</strong> Make sure it has a blue verified tick ✓ — there are fake ones. The real one is <strong>@BotFather</strong>.
              </div>

              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors text-sm"
              >
                Open @BotFather in Telegram <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Step 2 — Create bot */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-4xl text-center py-2">⚙️</div>
              <h2 className="text-2xl font-bold text-center">Create your bot</h2>
              <p className="text-slate-600">
                Now tell BotFather to create a new bot. It will ask you two simple questions.
              </p>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">First — send this message to BotFather:</p>
                <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-3">
                  <code className="flex-1 text-sm font-mono text-slate-800">/newbot</code>
                  <button
                    onClick={() => copyCommand('/newbot')}
                    className="text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {copiedCommand ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <ChatMockup messages={[
                { type: 'user', text: '/newbot' },
                { type: 'bot', text: 'Alright, a new bot. How are we going to call it? Please choose a name for your bot.' },
                { type: 'user', text: 'Acme Business Bot' },
                { type: 'bot', text: 'Good. Now let\'s choose a username for your bot. It must end in \'bot\'. For example: TetrisBot or tetris_bot.' },
                { type: 'user', text: 'AcmeBusinessBot' },
              ]} />

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm text-slate-600">
                <p><strong>Name</strong> — This is what your staff will see. Example: <em>"Acme Operations Bot"</em></p>
                <p><strong>Username</strong> — Must end in the word <em>bot</em>. Example: <em>"AcmeOpsBot"</em></p>
              </div>
            </div>
          )}

          {/* Step 3 — Copy token */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-4xl text-center py-2">🔑</div>
              <h2 className="text-2xl font-bold text-center">Copy your bot token</h2>
              <p className="text-slate-600">
                After you choose a username, BotFather will send you a long code. <strong>That's your token.</strong>
              </p>

              <ChatMockup messages={[
                { type: 'bot', text: 'Done! Congratulations on your new bot. You will find it at t.me/AcmeBusinessBot.\n\nUse this token to access the HTTP API:\n\n1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ\n\nKeep your token secure.' },
              ]} />

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-amber-900">How to copy it:</p>
                <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                  <li>Press and hold on the long code in BotFather</li>
                  <li>Tap <strong>Copy</strong></li>
                </ol>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
                🔒 <strong>Keep this private.</strong> Anyone with this code can control your bot. Don't share it on WhatsApp or email.
              </div>
            </div>
          )}

          {/* Step 4 — Paste token */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-4xl text-center py-2">✅</div>
              <h2 className="text-2xl font-bold text-center">Almost done — paste your token</h2>
              <p className="text-slate-600">
                Paste the token BotFather gave you below. We'll connect your bot automatically.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your bot token</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 font-mono text-sm"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1.5">It looks like numbers, a colon, then letters and dashes</p>
              </div>

              <button
                onClick={handleConnect}
                disabled={isConnecting || !token.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConnecting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting your bot...</>
                  : <><Send className="w-4 h-4" /> Connect my bot</>
                }
              </button>

              <p className="text-xs text-slate-500 text-center">
                This takes about 5 seconds. Your token is stored securely — we never share it.
              </p>
            </div>
          )}

          {/* Step 5 — Bot is live */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="text-4xl text-center py-2">🚀</div>
              <h2 className="text-2xl font-bold text-center">Your bot is live!</h2>

              {/* Success banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-sm text-emerald-800 font-medium text-center">
                ✅ Bot connected! Your team can now run AI workflows on Telegram
              </div>

              {/* Commands grid */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Commands your team can use:</p>
                <div className="grid grid-cols-2 gap-2">
                  {BOT_COMMANDS.map(({ command, emoji, desc }) => (
                    <div key={command} className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base leading-none">{emoji}</span>
                        <code className="text-xs font-mono font-semibold text-slate-800">{command}</code>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite your team */}
              {connectedBotUsername && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Invite your team:</p>
                  <div className="space-y-2">
                    {[
                      { role: 'manager' as const, label: 'Manager link', token: managerToken },
                      { role: 'staff' as const, label: 'Staff link', token: staffToken },
                    ].map(({ role, label, token: t }) => (
                      <div key={role} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">{label}</p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            t.me/{connectedBotUsername}?start={t}
                          </p>
                        </div>
                        <button
                          onClick={() => copyInviteLink(role)}
                          className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {copiedLink === role
                            ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
                            : <><Copy className="w-3.5 h-3.5" /> Copy</>
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Share the right link with each person — managers get extra commands</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step < 4 && (
          <div className="flex items-center justify-between px-6 pb-6 pt-2 shrink-0">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-0 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              {step === 0 ? "Let's start" : "Next step"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 5 footer — Done button only */}
        {step === 5 && (
          <div className="flex justify-end px-6 pb-6 pt-2 shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
