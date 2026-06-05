export const BILLING_LIMITS = {
  free: {
    label: 'Free',
    workflows: 'Selected starter automations',
    whatsapp: '1 internal WhatsApp number for setup/testing',
    customerRequests: 'Test customer requests only before launch',
    salesLog: 'Manual and WhatsApp sales log',
    scanner: 'Not included',
    summaries: 'Basic in-app summaries',
    aiUsage: 'Fair-use starter quota',
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
    aiUsage: 'Expanded fair-use quota for AI replies and reports',
    support: 'Priority email support',
  },
} as const;

