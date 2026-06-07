# Launch Operations

Use this before and during customer rollout.

## Monitoring Checks

- Admin observability: open `/admin` and review Launch Health, Production migration readiness, and Support Queues.
- Webhook health: watch `webhook_invalid_signature`, `webhook_missing_secret`, and `webhook_function_error` in `app_analytics_events`.
- Kapso delivery health: still watch Kapso deliveries for non-200 responses, especially 401 invalid signature and 500 runtime errors.
- Kapso sends: review order audit logs where `message_sent` is false.
- Receipt storage: review orders where `receipt_storage_status = failed`.
- Stuck receipts: review confirmed requests in `receipt_sent` for more than 48 hours.
- Stuck unpaid: review confirmed unpaid non-cash-pickup requests older than 48 hours.
- Setup incomplete: review customer WhatsApp connections with missing phone number ID, catalogue, payment instructions, or fulfillment rules.
- Edge functions: check Supabase logs for `kapso-webhook`, `kapso-setup`, `parse-sales-photo`, and scheduled functions after every deploy.
- Webhook safety: production rejects unsigned webhooks unless `KAPSO_ALLOW_UNSIGNED_WEBHOOKS=true` is explicitly set for local testing.

## Production Migration Readiness

Confirm all of these are green in `/admin` before onboarding customers:

- `kapso-receipts` private storage bucket exists.
- `kapso_order_audit_logs` exists for owner action history and failed message sends.
- `app_analytics_events` exists for server-side milestones and observability events.
- `bot_entries.source_order_id` exists.
- `bot_entries_source_order_id_key` unique partial index exists so verified WhatsApp orders sync to Sales Log once.

The admin dashboard reads these via `get_launch_observability()`.

## Support Workflow

- Setup fails: confirm `KAPSO_API_KEY`, webhook URL, webhook secret, phone number ID, and selected connection mode.
- Webhook returns 401: rotate or re-enter `KAPSO_WEBHOOK_SECRET`, then resend a Kapso test event.
- Receipt missing: ask the customer to resend the screenshot with the request reference.
- AI reply is wrong: update catalogue, payment instructions, fulfillment rules, and escalation instructions; then retest with the same message.
- Payment dispute/refund: staff handles manually. Hoursback should only log the request and notes.
- Customer message not sent: check order audit logs for `message_sent = false`, then contact the customer manually.
- Recent AI handoff: review the customer conversation, update menu/rules if needed, then reply manually.
- Pro setup incomplete: contact the owner with the missing fields shown in `/admin`.

## Support Queues

`/admin` reads `get_launch_support_queues()` and shows:

- Broken webhook setup.
- Failed customer replies or report emails.
- Orders needing receipt resend.
- Pro users with incomplete customer WhatsApp setup.
- Recent AI handoffs.

## Billing Boundaries

- Free: up to 3 active workflows, internal WhatsApp setup/testing, manual Sales Log, starter AI usage, and basic in-app summaries.
- Pro: customer-facing WhatsApp, receipt workflows, spreadsheet/photo capture, recurring summaries, PDFs/email delivery, and expanded AI usage.
- Customer-facing WhatsApp is enforced server-side in `kapso-setup` and ignored by `kapso-webhook` for non-Pro accounts.
- Sheet import is capped for safety. Keep connected Sheets under 2MB and expect at most 5,000 ledger rows per import.
- Report/email/AI usage is fair-use and should be reviewed if a workspace creates abnormal volume.

## Exports

- Sales Log exports CSV from `/data-log`.
- Customer Requests exports CSV from `/orders`.
- Reports can be downloaded from the reports area when generated.
- Account exports JSON from `/account`, including workflows, data sources, Sales Log, customer requests, WhatsApp records, closeouts, audit logs, and analytics milestones.
- Receipt files remain in private Supabase Storage; exports include receipt metadata and storage paths.

## Analytics Milestones

Track:

- `signup`
- `whatsapp_setup_link_created`
- `whatsapp_connection_saved`
- `whatsapp_customer_settings_saved`
- `customer_launch_checklist_clicked`
- `first_webhook_received`
- `webhook_received`
- `customer_order_created`
- `receipt_received`
- `customer_order_verified`
- `sales_log_entry_created`
- `kapso_reply_failed`
- `report_email_failed`
- `webhook_invalid_signature`
- `webhook_missing_secret`
- `webhook_function_error`
- `customer_orders_exported`

Server-side milestone rows are stored in `app_analytics_events`.
