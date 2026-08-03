# Hoursback

Hoursback is a React/Vite app backed by Supabase Auth, Database, Storage, and
Edge Functions. It supports AI workflow automation, channel-neutral business
capture, WhatsApp operations through the Hoursback gateway, reports, and paid
Pro access.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in the local values in `.env.local`.

4. Start the app:

   ```bash
   npm run dev
   ```

## Required Environment Variables

Frontend variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FLUTTERWAVE_PUBLIC_KEY`

Server/Edge Function secrets are configured in Supabase, not in frontend env:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `FIRECRAWL_API_KEY`
- `APIFY_API_KEY`
- `TINYFISH_API_KEY`
- `FLUTTERWAVE_SECRET_KEY`
- `FLUTTERWAVE_WEBHOOK_HASH`
- `KAPSO_API_KEY`
- `KAPSO_WEBHOOK_SECRET`
- `WHATSAPP_PROVIDER`
- `WABA_GATEWAY_API_KEY`
- `WABA_GATEWAY_WEBHOOK_SECRET`

Never commit `.env`, `.env.local`, service role keys, OAuth client secrets, or
provider tokens.

`FLUTTERWAVE_WEBHOOK_HASH` must exactly match the secret configured in the
Flutterwave dashboard under Settings → Webhooks. The payment webhook fails
closed when either Flutterwave secret is missing, verifies the webhook
signature, and re-fetches the transaction from Flutterwave before activating
Pro access.

## Auth Configuration

Supabase Auth should use PKCE redirects.

Recommended production settings:

```text
Site URL:
https://www.hoursback.xyz

Redirect URLs:
https://www.hoursback.xyz/auth/callback
https://hoursback.xyz/auth/callback
http://127.0.0.1:5173/auth/callback
```

The frontend callback route is `/auth/callback`. It exchanges the temporary
OAuth `code` for a Supabase session and then redirects to the requested app
route.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run smoke:prod
```

`npm run smoke:prod` checks the production HTML and a few core routes for
deployment regressions.

## Quarantine

Legacy admin/debug scripts live in `quarantine/admin-debug-scripts`. They are
kept for historical context only. Do not run them against production without a
fresh review.

Telegram code remains in the repository for historical context and migration
reference, but the active customer/staff chat channel is WhatsApp through the
Hoursback gateway.

## WhatsApp Gateway

The production WhatsApp path uses the Hoursback gateway at
`https://waba.hoursback.xyz`. The gateway hosts Meta Embedded Signup, sends
messages through the connected WhatsApp Business number, and forwards signed
webhook events to the provider adapter in Supabase.

Required Supabase secrets:

```text
WHATSAPP_PROVIDER=waba_gateway
WABA_GATEWAY_API_KEY
WABA_GATEWAY_WEBHOOK_SECRET
ANTHROPIC_API_KEY
```

Set up a workspace at `/whatsapp`; Hoursback opens the gateway's Meta Embedded
Signup flow and registers the workspace callback automatically. Internal
WhatsApp sales updates are stored in the existing Sales Log. Customer-facing
WhatsApp orders, bookings, service requests, receipts, and payment verification
are Pro features.

Production webhook safety:

- Set `WABA_GATEWAY_WEBHOOK_SECRET` to the same HMAC secret used by the gateway.
- Unsigned webhooks are rejected by default.

Kapso remains available as a legacy provider. When intentionally using it, set
`WHATSAPP_PROVIDER=kapso`, `KAPSO_API_KEY`, and `KAPSO_WEBHOOK_SECRET`.

## Backup and Export

Owners can export account data from `/account`. The export includes workflows,
data sources, Sales Log rows, customer requests, WhatsApp records, closeouts,
audit logs, and analytics milestones as JSON. Receipt files stay in private
Supabase Storage; the export includes receipt metadata and storage paths.

## Support

Use `support@hoursback.xyz` for setup failures, data export/deletion requests,
receipt issues, webhook secret problems, or AI reply review.
