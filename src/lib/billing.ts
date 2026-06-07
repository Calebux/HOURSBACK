export const BILLING_LIMITS = {
  free: {
    label: 'Free',
    workflows: 'Up to 3 active workflows',
    whatsapp: '1 internal WhatsApp number for setup/testing',
    customerRequests: 'Internal testing only; customer-facing WhatsApp requires Pro',
    salesLog: 'Manual and WhatsApp sales log',
    scanner: 'Not included',
    summaries: 'Basic in-app summaries and manual report viewing',
    aiUsage: 'Starter fair-use quota for setup, testing, and internal summaries',
    support: 'Email support',
  },
  pro: {
    label: 'Pro',
    workflows: 'All automations and scheduled workflows',
    whatsapp: 'Internal and customer-facing WhatsApp channels',
    customerRequests: 'Orders, bookings, receipts, payment review, and owner handoff',
    salesLog: 'Manual, WhatsApp, spreadsheet, and photo-scan sales log',
    scanner: 'Sales book/photo scanner included',
    summaries: 'WhatsApp summaries, reports, PDFs, and email delivery',
    aiUsage: 'Expanded fair-use quota for AI replies, reports, and WhatsApp operations',
    support: 'Priority email support',
  },
} as const;
