import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const webhook = readFileSync(join(root, 'supabase/functions/kapso-webhook/index.ts'), 'utf8');
const ordersPage = readFileSync(join(root, 'src/pages/OrdersPage.tsx'), 'utf8');
const kapsoSetup = readFileSync(join(root, 'supabase/functions/kapso-setup/index.ts'), 'utf8');
const whatsappPage = readFileSync(join(root, 'src/pages/WhatsAppPage.tsx'), 'utf8');
const verifyDataSource = readFileSync(join(root, 'supabase/functions/verify-data-source/index.ts'), 'utf8');
const adminDashboard = readFileSync(join(root, 'src/pages/AdminDashboard.tsx'), 'utf8');
const observabilityMigration = readFileSync(join(root, 'supabase/migrations/20260607000000_launch_observability_admin.sql'), 'utf8');

const checks = [
  {
    name: 'Webhook signature verification rejects invalid signatures',
    source: webhook,
    patterns: ['verifySignature(rawBody', 'Invalid signature'],
  },
  {
    name: 'Production webhook fails closed without a configured secret',
    source: webhook,
    patterns: ['KAPSO_ALLOW_UNSIGNED_WEBHOOKS', 'Webhook signature secret is not configured'],
  },
  {
    name: 'Duplicate customer orders are detected before creating another order',
    source: webhook,
    patterns: ['findRecentDuplicateCustomerOrder', 'I already have this request'],
  },
  {
    name: 'Multiple unpaid requests require an order reference before matching receipt',
    source: webhook,
    patterns: ['ambiguousPaymentReferenceReply', 'more than one unpaid request', 'Example caption'],
  },
  {
    name: 'Customers are asked for receipt proof instead of typed payment figures',
    source: webhook,
    patterns: ['You do not need to type the amount', 'receipt or transfer screenshot'],
  },
  {
    name: 'Cash-on-pickup requests do not demand transfer receipt proof',
    source: webhook,
    patterns: ['findCashPickupOrderByText', 'cash on pickup', 'Please pay when collecting'],
  },
  {
    name: 'Non-payment media is not treated as a payment receipt',
    source: webhook,
    patterns: ['looksLikeNonPaymentMediaCaption', 'Image received. A staff member will review it'],
  },
  {
    name: 'Refunds are routed to staff review, not auto-handled',
    source: webhook,
    patterns: ['looksLikeRefundRequest', 'refund request', 'staff member will review'],
  },
  {
    name: 'Order cancellation needs a reference when more than one request is active',
    source: webhook,
    patterns: ['cancelCustomerOrderByText', 'more than one active request', 'Please cancel with the request reference'],
  },
  {
    name: 'Order edits after confirmation are saved for owner review',
    source: webhook,
    patterns: ['looksLikeOrderEditRequest', 'saveOwnerReviewRequest', 'staff member will confirm the updated details'],
  },
  {
    name: 'Receipt media storage failures block payment verification',
    source: `${ordersPage}\n${kapsoSetup}`,
    patterns: ['receipt_storage_path', 'Receipt file is not available', 'receipt_storage_status', 'Waiting for saved receipt'],
  },
  {
    name: 'Verified customer orders are synced into the Sales Log once',
    source: `${kapsoSetup}`,
    patterns: ['syncVerifiedOrderToSalesLog', 'source_order_id', 'whatsapp_customer_order', 'sales_log_synced'],
  },
  {
    name: 'Internal WhatsApp can generate saved reports from business records',
    source: webhook,
    patterns: ['generateWhatsAppBusinessReport', 'WhatsApp Reports', 'workflow_runs', 'Open Reports to download the PDF version'],
  },
  {
    name: 'Recurring report requests remain workflow drafts instead of one-off reports',
    source: webhook,
    patterns: ['looksLikeRecurringWorkflowRequest', 'return false', 'Workflow request saved as a draft'],
  },
  {
    name: 'WhatsApp reports include Sheet-imported rows by sale_date',
    source: webhook,
    patterns: ['sale_date.gte', '.or(`created_at.gte.', 'limit(5000)'],
  },
  {
    name: 'WhatsApp report ranges use the business timezone',
    source: webhook,
    patterns: ['parseReportRange(text, timeZone)', 'collectReportMetrics(supabase, connection.user_id, text, connection.business_timezone)', 'zonedStartOfDay'],
  },
  {
    name: 'Empty report periods do not create blank reports',
    source: webhook,
    patterns: ['I found no records for', 'Connect or refresh a Google Sheet', 'Send this month’s P&L report'],
  },
  {
    name: 'Customer WhatsApp setup exposes launch checklist and test prompts',
    source: whatsappPage,
    patterns: ['Go-live checklist', 'Test messages to send from a phone you control', 'Payment instructions saved'],
  },
  {
    name: 'Customer-mode workflow/report requests do not create internal workflow drafts',
    source: webhook,
    patterns: ['A staff member will help with that request.', 'customer mode cannot create internal workflow drafts'],
  },
  {
    name: 'Internal WhatsApp daily summaries include Sheet-imported rows by sale_date',
    source: webhook,
    patterns: ['select("entry_type, parsed_data, triggered_by, sale_date, created_at")', '.or(`created_at.gte.', 'entryDate(entry) >= start'],
  },
  {
    name: 'Data source verification blocks unsafe URLs and caps large imports',
    source: verifyDataSource,
    patterns: ['sanitizeUrl(url)', 'MAX_SOURCE_BYTES', 'MAX_LEDGER_IMPORT_ROWS', 'fetchWithTimeout'],
  },
  {
    name: 'Google Sheet verification preserves gid-specific tabs',
    source: verifyDataSource,
    patterns: ['googleSheetCsvUrl', 'gid=', 'export?format=csv&gid='],
  },
  {
    name: 'Webhook observability logs 401 and 500 failures',
    source: webhook,
    patterns: ['webhook_invalid_signature', 'webhook_missing_secret', 'webhook_function_error'],
  },
  {
    name: 'Report email failures are logged for admin monitoring',
    source: webhook,
    patterns: ['report_email_failed', 'WhatsApp report email failed'],
  },
  {
    name: 'Admin observability RPCs expose migration readiness and support queues',
    source: observabilityMigration,
    patterns: ['get_launch_observability', 'migration_readiness', 'get_launch_support_queues', 'is_current_user_admin'],
  },
  {
    name: 'Admin dashboard renders launch observability and billing limits',
    source: adminDashboard,
    patterns: ['Production migration readiness', 'Support Queues', 'Launch Limits', 'get_launch_observability', 'get_launch_support_queues'],
  },
];

const failures = [];

for (const check of checks) {
  const missing = check.patterns.filter((pattern) => !check.source.includes(pattern));
  if (missing.length) {
    failures.push({ name: check.name, missing });
  }
}

if (failures.length) {
  console.error('WhatsApp edge-case regression check failed:');
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
    console.error(`  Missing: ${failure.missing.join(', ')}`);
  }
  process.exit(1);
}

console.log(`WhatsApp edge-case regression check passed (${checks.length} checks).`);
