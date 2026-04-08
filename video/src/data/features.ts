import type { Message } from '../shared';

// ─── Feature accent colors ─────────────────────────────────────────────────
export const ACCENTS = {
  reconcile: '#f59e0b',
  handover:  '#4285F4',
  audit:     '#8b5cf6',
  sop:       '#10b981',
  assign:    '#f43f5e',
  escalate:  '#ef4444',
  restock:   '#06b6d4',
};

// ─── Full chats (Format 5 — The Reply) ────────────────────────────────────
export type FeatureChat = {
  id: string;
  command: string;
  label: string;
  sublabel: string;
  accent: string;
  messages: Message[];
};

export const FULL_CHATS: FeatureChat[] = [
  {
    id: 'reconcile',
    command: '/reconcile',
    label: 'Cash Reconciliation',
    sublabel: 'Variance caught. Manager notified. No calls.',
    accent: ACCENTS.reconcile,
    messages: [
      { from: 'user', text: '/reconcile' },
      { from: 'bot', text: 'Cash reconciliation started.\n\nPulling from "Mama\'s Kitchen — Daily Register"...' },
      { from: 'bot', text: 'March 27 summary:\n\nOpening float: ₦45,000\nSales (51 txns): ₦312,500\nExpenses: ₦28,000\nExpected closing: ₦329,500\n\nYour actual closing balance?' },
      { from: 'user', text: '₦329,000' },
      { from: 'bot', text: '✓ Reconciliation complete — March 27\n\nVariance: –₦500\nReport saved & emailed.\nManager notified.' },
    ],
  },
  {
    id: 'handover',
    command: '/handover',
    label: 'Shift Handover',
    sublabel: 'Full log in 30 seconds. Nothing missed.',
    accent: ACCENTS.handover,
    messages: [
      { from: 'user', text: '/handover' },
      { from: 'bot', text: 'Shift handover started.\n\nName and role?' },
      { from: 'user', text: 'Amaka — Floor Supervisor' },
      { from: 'bot', text: 'Issues or incidents to flag?' },
      { from: 'user', text: 'AC in section B is faulty. Tech arrives tomorrow 10 AM.' },
      { from: 'bot', text: '✓ Handover logged — March 27\n\nStaff: Amaka (Floor Supervisor)\nCash handover: ₦87,500\nIncident: AC unit section B — tech tmrw 10AM\n\nManager notified. Report saved.' },
    ],
  },
  {
    id: 'audit',
    command: '/audit',
    label: 'Inventory Audit',
    sublabel: 'Variances caught, restock alerts sent automatically.',
    accent: ACCENTS.audit,
    messages: [
      { from: 'user', text: '/audit beverages' },
      { from: 'bot', text: 'Connected: "Hoursback Demo — Inventory Master"\n\nBeverages section · 3 items\n\nCoca-Cola 500ml (expected: 60)\nHow many do you count?' },
      { from: 'user', text: '47' },
      { from: 'bot', text: '⚠️ –13 vs expected\n\nMalta Guinness 330ml (expected: 30)\nHow many?' },
      { from: 'user', text: '19' },
      { from: 'bot', text: '✓ Audit complete — March 27\n\nCoca-Cola 500ml    47  ⚠️ restock\nMalta Guinness     19  ⚠️ restock\nHollandia Yoghurt  21  ✓ ok\n\nRestock alerts sent to supplier.' },
    ],
  },
  {
    id: 'sop',
    command: '/sop',
    label: 'SOP Compliance',
    sublabel: 'Every checklist. Logged with timestamp.',
    accent: ACCENTS.sop,
    messages: [
      { from: 'user', text: '/sop opening' },
      { from: 'bot', text: 'Opening checklist — March 27:\n\n☐ Cash float confirmed?\n☐ Fridge temps logged?\n☐ Staff attendance signed?\n☐ Front-of-house clean?' },
      { from: 'user', text: 'All done ✓' },
      { from: 'bot', text: '✓ Opening compliance logged\n\nTimestamp: 8:03 AM\nAll 4 checks passed\nReport saved.' },
    ],
  },
];

// ─── Quick chats (Format 1 — Problem Hook demos) ───────────────────────────
export type QuickChat = {
  command: string;
  label: string;
  accent: string;
  iconName: 'cash' | 'clipboard' | 'search' | 'settings' | 'zap';
  messages: Message[];
};

export const QUICK_CHATS: QuickChat[] = [
  {
    command: '/reconcile',
    label: 'Cash Reconciliation',
    accent: ACCENTS.reconcile,
    iconName: 'cash',
    messages: [
      { from: 'user', text: '/reconcile' },
      { from: 'bot', text: 'Pulling March 27 data...\n\nExpected closing: ₦329,500\nActual closing?' },
      { from: 'user', text: '₦329,000' },
      { from: 'bot', text: '✓ Done. Variance: –₦500\nReport saved. Manager notified.' },
    ],
  },
  {
    command: '/handover',
    label: 'Shift Handover',
    accent: ACCENTS.handover,
    iconName: 'clipboard',
    messages: [
      { from: 'user', text: '/handover — Amaka, Floor Sup.' },
      { from: 'bot', text: 'Incidents to flag?' },
      { from: 'user', text: 'AC fault, section B. Tech arrives 10 AM.' },
      { from: 'bot', text: '✓ Handover logged. Cash: ₦87,500\nManager notified.' },
    ],
  },
  {
    command: '/audit',
    label: 'Inventory Audit',
    accent: ACCENTS.audit,
    iconName: 'search',
    messages: [
      { from: 'user', text: '/audit beverages' },
      { from: 'bot', text: 'Coca-Cola 500ml — expected 60\nYour count?' },
      { from: 'user', text: '47' },
      { from: 'bot', text: '⚠️ –13. Restock alert sent to supplier.' },
    ],
  },
  {
    command: '/assign',
    label: 'Task Assignment',
    accent: ACCENTS.assign,
    iconName: 'zap',
    messages: [
      { from: 'user', text: '/assign "Restock beverages" Emeka by 4 PM' },
      { from: 'bot', text: '✓ Assigned to @Emeka\nDeadline: 4:00 PM\nEmeka notified.' },
      { from: 'user', text: '/assign status' },
      { from: 'bot', text: '⏳ Emeka — Restock (due 4 PM)\n✓ Chioma — Table setup (done)' },
    ],
  },
];

// ─── Before/After pairs (Format 2 — Split Screen) ─────────────────────────
export type SplitFeature = {
  label: string;
  accent: string;
  before: Message[];
  after: Message[];
};

export const SPLIT_FEATURES: SplitFeature[] = [
  {
    label: 'Cash Reconciliation',
    accent: ACCENTS.reconcile,
    before: [
      { from: 'bot', text: 'does anyone know the closing balance??', sender: 'Chioma' },
      { from: 'user', text: 'I think 329,500?', sender: 'Emeka' },
      { from: 'bot', text: 'no wait I counted 329,000', sender: 'Chioma' },
      { from: 'bot', isVoiceNote: true, text: '', sender: 'Emeka' },
      { from: 'user', isMissedCall: true, text: '', sender: 'Manager' },
      { from: 'bot', text: 'sorry sorry calling now 😩', sender: 'Chioma' },
    ],
    after: [
      { from: 'user', text: '/reconcile' },
      { from: 'bot', text: 'Expected: ₦329,500\nActual closing?' },
      { from: 'user', text: '₦329,000' },
      { from: 'bot', text: '✓ Variance –₦500. Done.\nReport saved. Manager notified.' },
    ],
  },
  {
    label: 'Shift Handover',
    accent: ACCENTS.handover,
    before: [
      { from: 'user', text: 'leaving now sorry no time', sender: 'Amaka' },
      { from: 'bot', text: 'what happened today??', sender: 'Manager' },
      { from: 'user', text: 'AC broken in section B', sender: 'Amaka' },
      { from: 'bot', text: 'what else? how much cash?', sender: 'Manager' },
      { from: 'user', text: '87,500 I think', sender: 'Amaka' },
      { from: 'bot', text: 'you THINK?? 😤', sender: 'Manager' },
    ],
    after: [
      { from: 'user', text: '/handover' },
      { from: 'bot', text: 'Incidents?' },
      { from: 'user', text: 'AC section B — tech tomorrow 10 AM' },
      { from: 'bot', text: '✓ Logged. Cash: ₦87,500\nManager notified.' },
    ],
  },
  {
    label: 'Inventory Audit',
    accent: ACCENTS.audit,
    before: [
      { from: 'user', text: 'I counted 47 cokes on paper', sender: 'Staff' },
      { from: 'bot', text: 'the sheet says 60', sender: 'Manager' },
      { from: 'user', text: 'oh wait maybe 43? let me recheck', sender: 'Staff' },
      { from: 'bot', text: 'we might have shrinkage 😩', sender: 'Manager' },
      { from: 'user', text: "I'll count again tmrw", sender: 'Staff' },
    ],
    after: [
      { from: 'user', text: '/audit beverages' },
      { from: 'bot', text: 'Coca-Cola 500ml (expected 60)?' },
      { from: 'user', text: '47' },
      { from: 'bot', text: '⚠️ –13. Restock alert sent.\nAudit report saved.' },
    ],
  },
  {
    label: 'Supplier Restock',
    accent: ACCENTS.restock,
    before: [
      { from: 'bot', text: "who's calling the supplier?", sender: 'Manager' },
      { from: 'user', text: 'me? I thought Emeka was', sender: 'Chioma' },
      { from: 'bot', text: 'supplier not picking up', sender: 'Emeka' },
      { from: 'user', text: "we'll run out by evening 😩", sender: 'Manager' },
      { from: 'bot', text: 'should I WhatsApp them?', sender: 'Chioma' },
    ],
    after: [
      { from: 'user', text: '/restock Coca-Cola 60 units' },
      { from: 'bot', text: 'Order sent to Fanta Beverages.\n60× Coca-Cola 500ml' },
      { from: 'bot', text: '✓ Confirmed. Delivery: tomorrow.\nTracking sent to your email.' },
    ],
  },
];

// ─── Stats (Format 3 — Stat Shock) ────────────────────────────────────────
export type Stat = {
  number: string;
  unit: string;
  pain: string;
  solution: string;
  command: string;
  accent: string;
};

export const STATS: Stat[] = [
  {
    number: '6+',
    unit: 'hours/week',
    pain: 'spent on manual cash reconciliation by the average SMB owner',
    solution: 'Hoursback does it in under 30 seconds',
    command: '/reconcile',
    accent: ACCENTS.reconcile,
  },
  {
    number: '67%',
    unit: 'of shift handovers',
    pain: 'miss critical information — leading to costly errors the next shift',
    solution: 'Hoursback logs everything. Every time.',
    command: '/handover',
    accent: ACCENTS.handover,
  },
  {
    number: '14×',
    unit: 'per week',
    pain: 'the average Nigerian restaurant owner is called after hours by staff',
    solution: 'Hoursback answers every question. Zero calls.',
    command: '/sop  /audit  /assign',
    accent: ACCENTS.sop,
  },
];
