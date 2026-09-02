# DANEG delivery status

Status date: 2026-08-31.

## Release target

The target is a public Demo/Beta. This release is not a real payment release.

- `CHECKOUT_MODE=demo`
- `PAYMENTS_ENABLED=false`
- One listing per checkout, quantity `1`
- Demo receipts are stored in the browser under an account-independent key
- Demo receipts never enter `public.orders`
- No card number or CVV input exists in the public checkout
- `app.daneg.ae` is the canonical and only public domain

## Code status

Implemented in the repository:

- Separate `DemoOrder` and `recordDemoOrder` contract.
- Demo checkout with explicit no-charge text and no payment form.
- Payouts and saved payment methods show a Demo-disabled state.
- Single-listing cart rule in mock and Supabase modes.
- Server-only future payment route and disabled Stripe webhook route.
- Atomic `create_single_listing_order` RPC for the future real-order path.
- Separate payment status values: `pending`, `succeeded`, `failed`, `refunded`.
- Listing visibility requires `status = 'active'` and non-null `approved_at`.
- Saved items use account-scoped `saved_items` with owner RLS.
- Trust fields, order financial fields, offer fields, reviews, disputes, block
  checks, suspension checks, and public input limits have database controls.
- Dedicated loading, error, not-found, health, canonical, and bilingual RTL
  paths are present.
- CSP is enforced in application code. `unsafe-eval` is not used by the app.

## Local verification

Run these commands from the repository root:

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

Latest local result on 2026-08-31:

- `npm run typecheck` passed.
- `npm run lint` passed with zero errors and zero warnings.
- `npm run test:ci` passed: 82 files, 639 tests.
- `npm run build` passed with Next.js 16.2.9.
- `git diff --check` passed.
- The database suite could not start because local Postgres was not
  available.
- The Playwright suite could not launch because Chromium was not installed.

Database tests require local Docker/Supabase. Browser tests require an
installed Playwright browser and a running target URL.

## Infrastructure gates

The production domain wiring was updated and verified on 2026-08-31:

- `app.daneg.ae` resolves to the target VPS with a valid TLS certificate.
- Nginx sends application pages and `/auth/callback` to Next.js.
- Nginx sends `/auth/v1/*`, `/rest/v1/*`, and `/storage/v1/*` to Kong.
- Supabase Auth uses `app.daneg.ae` as its site URL and callback domain.
- Production flags are `CHECKOUT_MODE=demo` and `PAYMENTS_ENABLED=false`.

These remaining gates need a staging or production operator and are not
confirmed by repository tests:

- Apply the new migration in an isolated staging database.
- Run all pgTAP tests and a real two-session reservation test.
- Configure SMTP and Google OAuth, then test sign-up, OTP, recovery, and OAuth.
- Confirm production and staging use different databases and secret files.
- Enable Sentry release tracking, uptime alerts, backups, and a restore drill.
- Replace legal entity placeholders and obtain UAE legal review.

The current public deployment was updated on 2026-08-31. The home page,
`/app`, and `/auth/callback` returned `200`. `/api/health` returned `200` with
Supabase reachable. `/auth/v1/settings` and `/rest/v1/` reached Kong and
returned the expected unauthenticated `401`. The live response has an
enforced CSP with a nonce, no `unsafe-eval`, and `connect-src` points to
`app.daneg.ae`; the sitemap contains only `app.daneg.ae` URLs.

The database RLS, pgTAP, browser, SMTP, OAuth, monitoring, backup/restore,
and legal gates still need their own evidence before final acceptance.

## Known repository condition

The worktree contained pre-existing generated files and unrelated changes at
the start of this task. No destructive reset was used. Build artifacts under
`.deploy/.next` must be removed from Git tracking in a controlled cleanup
commit after the owner reviews the existing index changes.
