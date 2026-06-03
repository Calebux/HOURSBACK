# Security Runbook

## Secret Rotation

Rotate any secret that appears in chat, logs, terminal output, screenshots, or
git history. This includes OAuth client secrets even if the file was ignored by
git.

After rotating a secret:

1. Update the provider dashboard.
2. Update Supabase project secrets or Vercel environment variables.
3. Redeploy affected functions/apps.
4. Revoke active sessions if auth tokens may have been exposed.
5. Record the rotation date and reason in your private operations notes.

## Google OAuth

If a Google OAuth client secret is exposed:

1. Open Google Cloud Console.
2. Go to APIs & Services -> Credentials.
3. Select the OAuth client used by Supabase Auth.
4. Rotate or recreate the client secret.
5. Update the Google provider settings in Supabase Auth.
6. Test sign-in from `https://www.hoursback.xyz`.

## Supabase Auth

Production Auth settings should include:

```text
Site URL:
https://www.hoursback.xyz

Redirect URLs:
https://www.hoursback.xyz/auth/callback
https://hoursback.xyz/auth/callback
http://127.0.0.1:5173/auth/callback
```

Use PKCE for OAuth. Do not use implicit flow URLs that expose `access_token`,
`refresh_token`, or provider tokens in browser URLs.

## Production Smoke Test

Run:

```bash
npm run smoke:prod
```

This checks that production routes serve the SPA, that nested routes load
root-relative assets, and that token fragments are not present in HTML.

## Kapso Webhooks

Kapso webhooks must use a secret key and include `X-Webhook-Signature`.

Production setup:

1. Set `KAPSO_API_KEY` in Supabase Edge Function secrets.
2. Set `KAPSO_WEBHOOK_SECRET` in Supabase Edge Function secrets.
3. Register the `/functions/v1/kapso-webhook?uid=<user_id>` URL in Kapso.
4. Subscribe to `whatsapp.message.received`.
5. Send a test WhatsApp message and confirm it appears in the Sales Log.
