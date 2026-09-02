---
kind: external_dependency
name: Stripe for payment capture and escrow settlement
slug: stripe
category: external_dependency
category_hints:
    - vendor_identity
    - sdk_real_api
scope:
    - '**'
---

### Stripe
- Role: Payment Service Provider for checkout, escrow settlement, refunds and seller disbursement — explicitly deferred to Phase 5 in the roadmap but the `stripe` npm package and a `create-payment-intent` service test are already present, indicating the integration surface is reserved.
- Integration point: `src/services/backend/create-payment-intent.test.ts` exercises the payment intent creation flow; production requires Stripe secret keys injected via server-side env (not `NEXT_PUBLIC_*`).
- Client constraint: payments are gated behind `NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE` and `NEXT_PUBLIC_DATA_SOURCE`; until both are switched off mock, no real Stripe calls fire.
- Verify exact API/params against official Stripe docs when enabling Phase 5.