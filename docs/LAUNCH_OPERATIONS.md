# Launch Operations

Use this before and during customer rollout.

## Monitoring Checks

- Webhook health: watch Kapso deliveries for non-200 responses, especially 401 invalid signature and 500 runtime errors.
- Kapso sends: review order audit logs where `message_sent` is false.
- Receipt storage: review orders where `receipt_storage_status = failed`.
- Stuck unpaid: review confirmed unpaid requests older than 48 hours.
- Setup incomplete: review customer WhatsApp connections with missing phone number ID, catalogue, payment instructions, or fulfillment rules.
- Edge functions: check Supabase logs for `kapso-webhook`, `kapso-setup`, `parse-sales-photo`, and scheduled functions after every deploy.

## Support Workflow

- Setup fails: confirm `KAPSO_API_KEY`, webhook URL, webhook secret, phone number ID, and selected connection mode.
- Webhook returns 401: rotate or re-enter `KAPSO_WEBHOOK_SECRET`, then resend a Kapso test event.
- Receipt missing: ask the customer to resend the screenshot with the request reference.
- AI reply is wrong: update catalogue, payment instructions, fulfillment rules, and escalation instructions; then retest with the same message.
- Payment dispute/refund: staff handles manually. Hoursback should only log the request and notes.
- Customer message not sent: check order audit logs for `message_sent = false`, then contact the customer manually.

## Billing Boundaries

- Free: starter workflows, basic capture/testing, and limited AI usage.
- Pro: customer-facing WhatsApp, receipt workflows, photo scanner, recurring summaries, PDFs/email delivery, and expanded AI usage.

## Exports

- Sales Log exports CSV from `/data-log`.
- Customer Requests exports CSV from `/orders`.
- Reports can be downloaded from the reports area when generated.

## Analytics Milestones

Track:

- `signup`
- `whatsapp_setup_link_created`
- `whatsapp_connection_saved`
- `whatsapp_customer_settings_saved`
- `customer_launch_checklist_clicked`
- `first_webhook_received`
- `customer_order_verified`
- `customer_orders_exported`

