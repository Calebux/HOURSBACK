export const BILLING_LIMITS = {
  free: {
    label: 'Free',
    workflows: 'Up to 3 active workflows',
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
