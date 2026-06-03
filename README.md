# Hoursback

Hoursback is a React/Vite app backed by Supabase Auth, Database, Storage, and
Edge Functions. It supports AI workflow automation, Telegram workflows,
reports, and paid Pro access.

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
- `KAPSO_API_KEY`
- `KAPSO_WEBHOOK_SECRET`

Never commit `.env`, `.env.local`, service role keys, OAuth client secrets, or
provider tokens.

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

## WhatsApp/Kapso

The WhatsApp feature uses Kapso as the transport layer.

Required Supabase secrets:

```text
KAPSO_API_KEY
KAPSO_WEBHOOK_SECRET
ANTHROPIC_API_KEY
```

Set up a workspace at `/whatsapp`, then register the displayed webhook URL in
Kapso for `whatsapp.message.received` events. Inbound WhatsApp sales updates are
stored in the existing Sales Log.
