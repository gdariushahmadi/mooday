# DANEG public Demo/Beta handoff

Date: 2026-08-31.

## What this handoff contains

This repository implements the public Demo boundary. It does not enable real
payments or seller payouts.

## Completed code areas

- Demo checkout saves one browser-only `DemoOrder`.
- Checkout does not receive or store card number, expiry, or CVV data.
- The Demo checkout does not call the real order table.
- Cart additions are limited to one listing and quantity `1`.
- Payouts and saved payment methods are visibly disabled in Demo mode.
- Future order creation uses `create_single_listing_order` and reads listing
  price and address ownership inside the database transaction.
- Direct authenticated inserts into `orders` and `order_items` are revoked.
- Payment state is separate from delivery state.
- Stripe intent creation is server-side and feature-gated.
- Webhook signatures, duplicate event ids, amount, currency, and database
  errors are checked before an order update.
- Public listing, image, seller-count, saved-item, search, chat, review,
  dispute, report, block, affiliate, and suspension boundaries are covered by
  the delivery migration.
- Network failures preserve the cart and show an error.
- Return success appears only after dispute creation and order transition.
- Arabic `lang` and `dir` are selected before the first document render.
- Loading, error, not-found, health, canonical, sitemap, and CSP paths exist.

## Files for review

- `src/components/CheckoutFlowView.tsx`
- `src/context/AppContext.tsx`
- `src/lib/feature-flags.ts`
- `src/services/backend/contracts.ts`
- `src/services/backend/supabase.ts`
- `supabase/migrations/202608310002_delivery_integrity.sql`
- `supabase/tests/phase_3_orders_rls.sql`
- `src/services/backend/delivery-integrity-migration.test.ts`

## Required operator checks

1. Apply migrations to an isolated staging database.
2. Run pgTAP tests and a real concurrent two-session order test.
3. Domain, TLS, Next.js/Kong routes, and the `app.daneg.ae` Auth callback are
   verified in the live deployment.
4. Confirm SMTP and Google OAuth, then test sign-up, OTP, recovery, and OAuth.
5. Confirm staging never uses the production database.
6. Run desktop and mobile Playwright tests in English and Arabic.
7. Enable Sentry release tracking, uptime alerts, backups, and restore drill.
8. Replace legal placeholders and approve the legal copy.

## Evidence limits

The local Supabase database was not running during this task, so live database
and pgTAP results are not claimed. `npm run test:phase2:db` failed because
local Postgres was not available. Chromium was not available for Playwright;
the five browser tests could not launch. The public URL was redeployed after
the domain switch and is reachable, but database, browser, SMTP, OAuth,
monitoring, backup/restore, and legal gates still need independent evidence.

Latest local code evidence: typecheck passed, lint passed with zero warnings,
full unit test passed with 82 files and 639 tests, production build passed,
and `git diff --check` passed.

The latest public probe after redeployment returned `200` for
`app.daneg.ae/`, `/app`, and `/auth/callback`. `/api/health` returned `200`
with Supabase reachable. The response used enforced nonce CSP without
`unsafe-eval`; the sitemap used only `app.daneg.ae` URLs. The protected
`/auth/v1/settings` and `/rest/v1/` routes reached Kong and returned `401`, as
expected without a session. These are deployment checks, not database or
browser acceptance results.

The worktree was already dirty. No reset or destructive cleanup was used.
