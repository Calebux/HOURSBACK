export type Message = {
  from: 'user' | 'bot';
  text: string;
  /** inline keyboard shown below a bot message */
  keyboard?: { options: string[]; selected: number };
};

export type Task = {
  command: string;
  label: string;
  sublabel: string;
  accent: string;
  icon: 'cash' | 'clipboard' | 'search';
  chatFrames: number;
  messages: Message[];
};

export const TASKS: Task[] = [
  // ── Task 1: /reconcile ─────────────────────────────────────────────────
  {
    command: '/reconcile',
    label: 'Daily Cash Reconciliation',
    sublabel: 'Logs floats, sales and expenses — variance calculated automatically',
    accent: '#f59e0b',
    icon: 'cash',
    chatFrames: 560,
    messages: [
      { from: 'user', text: '/reconcile' },
      {
        from: 'bot',
        text: 'Cash reconciliation started.\n\nWould you like to pull data from your registered sheet, or enter figures here on Telegram?',
        keyboard: { options: ['Use official sheet', 'Enter manually'], selected: 0 },
      },
      { from: 'user', text: 'Use official sheet' },
      {
        from: 'bot',
        text: 'Connected: "Mama\'s Kitchen — Daily Cash Register"\n\n47 transactions found on March 26, 2026.\n\nWhat date would you like to reconcile?',
      },
      { from: 'user', text: 'Today, March 26' },
      {
        from: 'bot',
        text: 'Reconciling March 26...\n\nOpening float: ₦45,000\nSales (47 transactions): ₦312,500\nExpenses logged: ₦28,000\nExpected closing: ₦329,500\n\nPlease confirm your actual closing balance:',
      },
      { from: 'user', text: '₦329,000' },
      {
        from: 'bot',
        text: 'Reconciliation Complete — March 26, 2026\n\nOpening float     ₦45,000\nSales                  ₦312,500\nExpenses            ₦28,000\nExpected             ₦329,500\nActual                  ₦329,000\n\nVariance: –₦500\n\nReport saved and sent to your email.',
      },
    ],
  },

  // ── Task 2: /handover ──────────────────────────────────────────────────
  {
    command: '/handover',
    label: 'End-of-Shift Handover',
    sublabel: 'Structured handover log submitted in under 30 seconds',
    accent: '#4285F4',
    icon: 'clipboard',
    chatFrames: 520,
    messages: [
      { from: 'user', text: '/handover' },
      {
        from: 'bot',
        text: 'Shift handover started.\n\nWould you like to pull shift data from your registered sheet, or log everything here?',
        keyboard: { options: ['Use official sheet', 'Enter manually'], selected: 1 },
      },
      { from: 'user', text: 'Enter manually' },
      { from: 'bot', text: 'What is your name and role?' },
      { from: 'user', text: 'Amaka — Floor Supervisor' },
      { from: 'bot', text: 'What time did your shift start?' },
      { from: 'user', text: '8:00 AM' },
      { from: 'bot', text: 'Any issues or incidents to flag for the next shift?' },
      {
        from: 'user',
        text: 'AC unit in section B is making noise. Technician called — arrives tomorrow 10 AM.',
      },
      { from: 'bot', text: 'Any pending tasks for the next shift?' },
      {
        from: 'user',
        text: 'Table 7 reserved at 7 PM. Generator fuel needs top-up before 6 PM.',
      },
      { from: 'bot', text: 'Cash handover amount?' },
      { from: 'user', text: '₦87,500' },
      {
        from: 'bot',
        text: 'Handover Complete — March 26, 2026\n\nStaff: Amaka (Floor Supervisor)\nShift: 8:00 AM – 3:45 PM\nCash handover: ₦87,500\n\nIncidents:\n• AC unit section B — tech tomorrow 10 AM\n\nPending:\n• Table 7 reserved at 7 PM\n• Generator fuel top-up before 6 PM\n\nReport saved. Manager notified.',
      },
    ],
  },

  // ── Task 3: /audit ─────────────────────────────────────────────────────
  {
    command: '/audit',
    label: 'Inventory Audit',
    sublabel: 'Guided stock count with automatic variance against your sheet',
    accent: '#8b5cf6',
    icon: 'search',
    chatFrames: 560,
    messages: [
      { from: 'user', text: '/audit' },
      {
        from: 'bot',
        text: 'Inventory audit started.\n\nWould you like to compare against your registered inventory sheet, or enter expected quantities here?',
        keyboard: { options: ['Use official sheet', 'Enter manually'], selected: 0 },
      },
      { from: 'user', text: 'Use official sheet' },
      {
        from: 'bot',
        text: 'Connected: "Hoursback Demo — Inventory Master"\n\nLast audit: March 20, 2026\nCategories: Beverages, Dry Goods, Cleaning\n\nWhich section are you auditing today?',
      },
      { from: 'user', text: 'Beverages' },
      {
        from: 'bot',
        text: 'Starting beverages audit — reading quantities from your sheet.\n\nCoca-Cola 500ml\nExpected: 60  |  Last count: 54\n\nHow many do you count now?',
      },
      { from: 'user', text: '47' },
      {
        from: 'bot',
        text: 'Recorded: 47 (–13 vs expected)\n\nMalta Guinness 330ml\nExpected: 30  |  Last count: 28\n\nHow many do you count now?',
      },
      { from: 'user', text: '19' },
      {
        from: 'bot',
        text: 'Recorded: 19 (–11 vs expected)\n\nHollandia Yoghurt 500ml\nExpected: 24  |  Last count: 22\n\nHow many do you count now?',
      },
      { from: 'user', text: '21' },
      {
        from: 'bot',
        text: 'Beverages Audit Complete — March 26, 2026\n\nCoca-Cola 500ml        47  — restock needed\nMalta Guinness 330ml  19  — restock needed\nHollandia Yoghurt        21  — acceptable\n\nRestock alerts sent.\nFull report saved to your inventory sheet.',
      },
    ],
  },
];
