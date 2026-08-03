export const FREE_ACTIVE_WORKFLOW_LIMIT = 3;

export const BILLING_LIMITS = {
  free: {
    label: 'Free',
    workflows: `Up to ${FREE_ACTIVE_WORKFLOW_LIMIT} active workflows`,
    whatsapp: '1 internal WhatsApp number, 300 captured messages/day',
    customerRequests: 'Internal testing only; customer-facing WhatsApp requires Pro',
    salesLog: 'Manual and WhatsApp sales log',
    scanner: 'Not included',
    summaries: 'Basic in-app summaries, 2 WhatsApp reports/hour',
    aiUsage: '80 AI-assisted WhatsApp parses/replies/day',
    support: 'Email support',
  },
  pro: {
    label: 'Pro',
    workflows: 'All automations and scheduled workflows',
    whatsapp: 'Internal and customer-facing WhatsApp channels, 10,000 captured messages/day',
    customerRequests: 'Orders, bookings, receipts, payment review, and owner handoff',
    salesLog: 'Manual, WhatsApp, spreadsheet, and photo-scan sales log',
    scanner: 'Sales book/photo scanner included',
    summaries: 'WhatsApp summaries, reports, PDFs, email delivery, 12 WhatsApp reports/hour',
    aiUsage: '1,500 AI-assisted WhatsApp replies/parses/day',
    support: 'Priority email support',
  },
} as const;

export const pricingPlans = [
  {
    name: 'Starter',
    description: 'For owners starting with business capture and automation',
    features: [
      `Up to ${FREE_ACTIVE_WORKFLOW_LIMIT} active workflows`,
      'Free workflow templates included',
      'Scheduled and webhook triggers',
      'Run history and basic reports',
    ],
    cta: 'Get Started Free',
    popular: false,
    monthlyPrice: 0,
    annualPrice: 0,
  },
  {
    name: 'Pro',
    description: 'For businesses that need customer WhatsApp, broader automation, and higher usage limits',
    features: [
      'Full workflow catalogue unlocked',
      'Unlimited active workflows and runs',
      'Customer-facing WhatsApp and receipt workflows',
      'Expanded AI usage and report delivery',
      'Priority email support',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
    monthlyPrice: 9900,
    annualPrice: 7900,
  },
  {
    name: 'Custom',
    price: 'Custom',
    description: 'Custom AI workflow setup for your organization',
    features: [
      'Everything in Pro',
      'Custom workflow development',
      'Dedicated account manager',
      'Private deployment and data handling',
    ],
    cta: 'Contact Us',
    popular: false,
    monthlyPrice: 0,
    annualPrice: 0,
  },
];
