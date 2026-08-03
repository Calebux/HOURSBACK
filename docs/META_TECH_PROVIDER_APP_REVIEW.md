# Meta Tech Provider App Review — Hoursback

Use this as the working checklist for Hoursback's final Meta review. It assumes
the existing production gateway at `https://waba.hoursback.xyz`; it does not
replace or bypass that gateway.

Last reviewed: 3 August 2026

## The one alignment check to do first

The Meta app submitted for review must be the same app used by the live gateway
Embedded Signup screen.

- Live Embedded Signup App ID: `1002865159061022`
- Live configuration ID: `1443500710869264`
- Signup origin: `https://waba.hoursback.xyz`
- Product origin: `https://www.hoursback.xyz`

In Meta App Dashboard, confirm that App ID `1002865159061022` is the app whose
permissions and Tech Provider approval are being reviewed, and that
configuration `1443500710869264` belongs to it. Stop and correct the alignment
before submission if a different app is under review. Approval on another app
will not approve the app customers actually authorize in the gateway.

## Current production journey

1. A signed-in user opens `/whatsapp` in Hoursback.
2. Hoursback calls the authenticated `kapso-setup` Edge Function.
3. The function creates a workspace-scoped gateway link at
   `waba.hoursback.xyz/connect`.
4. The gateway shows an Hoursback-branded “Connect WhatsApp” page and opens
   Meta Embedded Signup.
5. Meta returns an authorization code plus WABA and phone-number details to the
   gateway.
6. The gateway completes onboarding and redirects to Hoursback's
   `/whatsapp/callback` route.
7. Hoursback saves the phone number with provider `waba_gateway` and marks its
   signed callback active.
8. Incoming events are HMAC-verified by `waba-gateway-webhook`, deduplicated,
   acknowledged quickly, and routed into the shared WhatsApp workflow engine.
9. Replies and owner-triggered customer updates are sent back through the
   gateway using the connected phone-number ID.

## Permissions to submit

Request only the permissions shown as required for this app's actual Meta
configuration.

### `whatsapp_business_management`

Suggested explanation:

> Hoursback is a business operations platform that onboards a customer's own
> WhatsApp Business Account and phone number through Meta Embedded Signup. We
> use this permission only to complete the customer's authorized onboarding,
> identify the selected WABA and phone number, and enable the app to operate the
> connected WhatsApp channel. The customer initiates and completes the Meta
> authorization flow themselves.

Evidence to show: the full Embedded Signup journey from Hoursback, selection of
the customer's business assets, successful return to Hoursback, and the
connected number displayed in the workspace.

### `whatsapp_business_messaging`

Suggested explanation:

> Hoursback uses this permission to receive messages sent to a business's
> connected WhatsApp number and to send operational replies on that business's
> behalf. Examples include catalogue answers, order-detail questions, payment
> receipt acknowledgements, staff sales-log confirmations, and owner-triggered
> order-status updates. Messages are scoped to the WABA and phone number the
> business authorized through Embedded Signup.

Evidence to show: a real inbound WhatsApp message arriving in Hoursback, the
resulting reply arriving in the WhatsApp client, and an owner action in
Hoursback sending an order-status message to that same test customer.

### `business_management`

Request this only if the Embedded Signup configuration or Meta's review task
explicitly requires it for accessing the customer's authorized business
portfolio assets.

Suggested explanation when required:

> During Meta Embedded Signup, Hoursback uses this permission only to let the
> authorizing business administrator select and share the business assets
> needed for their WhatsApp Business connection. Hoursback does not use it to
> manage unrelated assets, advertising, Pages, or businesses that the user did
> not select.

## Reviewer account and test assets

Prepare these before recording or submitting:

- A dedicated Hoursback reviewer login that does not require MFA from a team
  member and contains no real customer data.
- Pro access on that reviewer account so Customer Requests mode is not blocked.
- A Meta test business administrator that can complete the Embedded Signup
  flow for the review WABA and number.
- One WhatsApp Business test number to connect.
- A second phone with WhatsApp to act as the customer.
- A small fictional catalogue, payment instructions, and fulfillment rules in
  the reviewer workspace.
- A clean Orders view so the reviewer can see the test request appear.

Put credentials and exact test steps in Meta's reviewer-instructions field,
not in this repository or the screencast.

## Screencast script

Record one uninterrupted end-to-end video with the browser URL visible. Keep
the Meta popup and the test customer's WhatsApp client visible when relevant.

1. Open `https://www.hoursback.xyz`, identify Hoursback and sign in with the
   reviewer account.
2. Open WhatsApp Capture and select **Customer requests**.
3. Click **Open WhatsApp setup**. Show the Hoursback gateway page, click
   **Connect WhatsApp**, and complete Meta Embedded Signup.
4. Show the redirect back to Hoursback and the connected number/routing state.
5. Save this fictional setup:
   - Catalogue: `Black sandals — NGN 18,000`
   - Payment: `Test bank transfer; staff verifies receipts manually`
   - Fulfillment: `Pickup or delivery; staff confirms delivery fee`
6. From the customer test phone, send `Please send your catalogue`.
7. Show Hoursback receiving the webhook and the catalogue reply arriving in
   the customer's WhatsApp client.
8. From the customer phone, send
   `I want one black sandal delivered to Lekki` and answer any missing-detail
   prompt.
9. Open **Customer Requests** in Hoursback and show the new request.
10. Use the owner action to confirm or update the request status and enable the
    customer notification. Show that outbound update arriving in WhatsApp.
11. Briefly open the public Privacy Policy and Data Deletion pages.

For each permission, attach the same complete video or a permission-specific
cut that still shows the feature from authorization through the visible result.
Do not submit a video that only shows Graph API calls or backend logs.

## Reviewer instructions — copy and customize

> 1. Visit https://www.hoursback.xyz and sign in with the reviewer credentials
> provided below. The account has Pro test access and fictional data only.
> 2. Open WhatsApp Capture, choose Customer requests, and click Open WhatsApp
> setup.
> 3. On the Hoursback connection page, click Connect WhatsApp and complete Meta
> Embedded Signup using the supplied test-business administrator.
> 4. After Meta returns to Hoursback, confirm that the test number shows
> Connected and Routing Active.
> 5. From the supplied customer test phone, send “Please send your catalogue”
> to the connected number. Hoursback receives the message by webhook and sends
> the saved catalogue back through WhatsApp.
> 6. Send “I want one black sandal delivered to Lekki.” Open Customer Requests
> in Hoursback to see the captured request. Use the owner status action with
> customer notification enabled, then observe the update in the WhatsApp
> client.
> 7. No advertising, Page management, contact-list upload, or access to
> unrelated business assets is performed.

Add the reviewer email/password, Meta test-business login arrangement, both
test numbers, and any one-time setup note immediately below those steps in the
Meta submission form.

## Meta dashboard checklist

- App ID matches `1002865159061022`.
- App is owned by the verified CALBRIDGE DIGITAL LABS LTD business portfolio.
- Business verification is complete and current.
- App name, icon, namespace, contact email, and business name are production
  values and match the public product/legal pages.
- App domain includes `hoursback.xyz`.
- Allowed JavaScript SDK domains include `waba.hoursback.xyz` because Embedded
  Signup is launched there.
- OAuth/Embedded Signup settings enforce HTTPS and use exact production
  origins; no wildcard redirect URIs.
- Configuration ID `1443500710869264` uses the intended WhatsApp Embedded
  Signup variation and belongs to the reviewed app.
- Privacy Policy URL: `https://www.hoursback.xyz/privacy`.
- Terms URL: `https://www.hoursback.xyz/terms`.
- Data Deletion URL: `https://www.hoursback.xyz/data-deletion`.
- Requested permissions match the descriptions and screencast exactly.
- Reviewer credentials work in a private/incognito browser session.
- The app-review submission is actually submitted, not left in draft.

## Technical pre-submission test

Run this against the production review workspace and record the result/date:

- `https://waba.hoursback.xyz/health` returns `{"ok":true}`.
- Gateway setup opens and Meta Embedded Signup loads without a console error.
- Callback returns to the Hoursback production domain with a phone-number ID.
- The connection row is `whatsapp_provider = waba_gateway`.
- The displayed diagnostic callback contains `waba-gateway-webhook`, not
  `kapso-webhook`.
- An invalid or missing gateway HMAC signature returns 401/500 and is not
  processed.
- A valid inbound text is acknowledged quickly and appears in Hoursback.
- Replaying the same message ID does not create a duplicate request.
- An automatic reply reaches the test customer's WhatsApp client.
- An owner-triggered order update reaches the test customer.
- `last_webhook_at` updates and the UI shows the test message received.
- Privacy, Terms, and Data Deletion pages return HTTP 200 without requiring a
  login.

## Known boundary to test separately

Text send/receive is the minimum review-critical journey. Receipt images are a
separate product-critical path: confirm that the gateway forwards a usable
signed media URL (not only a Meta media ID) and that Hoursback saves the file to
private receipt storage before demonstrating receipt verification. Do not claim
receipt storage in the review video until this test passes end to end.

## Deployment note

Repository fixes are not live merely because this checklist exists. Before the
review recording, deploy the relevant frontend and Supabase Edge Functions,
then repeat the production test above. Do not change the live Meta App ID,
configuration ID, gateway token, or webhook secret during the review window
unless a failed test requires it.
