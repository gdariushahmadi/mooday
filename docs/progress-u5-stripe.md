# U5 Progress: Stripe Checkout Integration

**Date:** 2026-08-16
**Status:** SDK installed; createPaymentIntent + webhook route added; awaiting end-to-end verification
**Owner:** U5 (Wire CheckoutService with Stripe test mode)

## What is done

1. **Stripe SDK installed** via `npm install stripe --save`.

2. **`OrderService.createPaymentIntent`** in contracts.ts:
   - Signature: `createPaymentIntent(orderId): Promise<{ clientSecret, paymentIntentId }>`.
   - Loads the Stripe SDK via dynamic import so the dependency is optional at build time.
   - Throws a clear error if the SDK or `STRIPE_SECRET_KEY` is missing.
   - Reads the order via `getById` and creates a PaymentIntent with `amount = order.totalMinor`, `currency = order.currency`, and `metadata.order_id` so the webhook can find the order.

3. **`SupabaseOrderService.createPaymentIntent`** in supabase.ts implements the contract.

4. **Webhook route** at `src/app/api/stripe/webhook/route.ts`:
   - Reads the raw body and verifies the signature with `STRIPE_WEBHOOK_SECRET`.
   - On `payment_intent.succeeded`: marks the order `paid` using the service-role Supabase client.
   - On `payment_intent.payment_failed`: marks the order `payment_failed`.
   - Other events are acknowledged but ignored.

5. **Typecheck** passes.

## What is still pending

1. **CheckoutFlowView wiring**: the view needs to call `createPaymentIntent` and use Stripe Elements to confirm payment. The current view is mock-driven.

2. **Stripe Elements**: install `@stripe/stripe-js` and `@stripe/react-stripe-js`. The Elements UI does not exist yet.

3. **Stripe publishable key**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must be set in `.env.local` for the client-side Stripe.js.

4. **Webhook signing secret**: `STRIPE_WEBHOOK_SECRET` must be set in `.env.local` for the webhook route.

5. **Order state machine**: confirm the `orders` table has a `paid` status and the RLS policies allow the service-role to update it.

## Next steps

1. Install `@stripe/stripe-js` and `@stripe/react-stripe-js`.
2. Wire CheckoutFlowView to use Stripe Elements.
3. Run a smoke test using Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. Verify the order moves to `paid` after a successful test payment.
