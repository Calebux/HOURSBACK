# WhatsApp Customer Flow Edge Cases

Run this matrix before opening the customer-facing number to real customers.

## Required Setup

- Customer WhatsApp connection has a phone number ID.
- Catalogue or service list is saved.
- Payment instructions are saved.
- Fulfillment rules are saved, including pickup, delivery/service fees, cash-on-pickup policy, timing, and escalation rules.
- The Hoursback gateway is forwarding `whatsapp.message.received` events to the workspace callback.
- Supabase and the gateway have the same current `WABA_GATEWAY_WEBHOOK_SECRET`.

## Customer Message Tests

| Case | Customer sends | Expected behavior |
| --- | --- | --- |
| Menu request | `Please send your catalogue` | Replies with saved catalogue/service list. |
| Availability | `Do you have black sandals size 42?` | Confirms only if listed; otherwise says staff will confirm or shows current list. |
| Missing fulfillment details | `I want 1 screen repair` | Saves request as needs details and asks for pickup, delivery, appointment, or job details. |
| Pickup | `Pickup` after an open request | Confirms pickup and gives payment or cash-on-pickup instructions depending on rules. |
| Delivery fee | `Deliver to Lekki` | Applies matching delivery/service fee from saved rules when available. |
| Paid, no receipt | `I have paid` | Asks for receipt screenshot/proof and does not ask customer to type figures. |
| Receipt with one unpaid request | Sends receipt image | Marks request `receipt_sent`, stores receipt, and tells customer staff will verify. |
| Receipt with multiple unpaid requests | Sends receipt image without reference | Asks for request reference before matching receipt. |
| Receipt for cash pickup | Sends receipt image for cash-on-pickup request | Notes image but keeps cash pickup flow; does not require transfer proof. |
| Non-payment image | Sends style/reference/damage photo | Routes to staff review, not payment receipt. |
| Cancel ambiguous | `Cancel my order` with multiple active requests | Asks for request reference before cancelling. |
| Cancel with reference | `Cancel A1B2C3D4` | Cancels only that request. |
| Edit after confirmation | `Change delivery address to ...` | Saves owner review request; does not silently mutate confirmed order. |
| Refund | `I need a refund` | Routes to staff review. Refunds are not automated. |
| Webhook signature | Invalid signature | Returns 401 and does not process message. |
| Duplicate webhook | Same message resent quickly | Does not create duplicate customer order. |
| Receipt storage failure | Receipt cannot be saved | Owner cannot mark paid; customer is asked to resend or staff reviews manually. |

## Automated Guard Check

Run:

```sh
npm run check:whatsapp-edge
```

This is a source-level regression check. It does not replace sandbox/production end-to-end testing, but it catches accidental removal of the main safety branches.
