# DANEG external release gates

This checklist contains work that needs a staging or production operator.
Complete it in staging first. Never commit a service-role key, database
password, SMTP password, OAuth secret, or Stripe secret.

## 1. Staging database

- [ ] Create a staging Supabase project or isolated self-hosted database.
- [ ] Confirm staging and production use different database URLs and secret
      files.
- [ ] Apply all migrations in order.
- [ ] Review and apply
      `supabase/migrations/202608310002_delivery_integrity.sql`.
- [ ] Confirm listings use `approved_at = null` until moderation approval.
- [ ] Confirm public listing, image, storage, seller-count, and search reads
      return active approved listings only.
- [ ] Confirm direct client inserts into `orders` and `order_items` fail.
- [ ] Confirm the atomic single-listing RPC reads the database price, checks
      address ownership, blocks self-purchase, locks the listing, stores
      snapshots, and creates quantity `1`.
- [ ] Run all pgTAP tests against the isolated staging database.
- [ ] Run a real two-session concurrent reservation test.
- [ ] Test block, suspension, trust-field, offer, review, dispute, report,
      affiliate, and owner-isolation rules.
- [ ] Test backup and restore before production promotion.

## 2. Auth and email

- [x] Set the Auth Site URL for the environment.
- [x] Allow only the required callback URL:
      `https://app.daneg.ae/auth/callback`, and the staging callback.
- [ ] Configure SMTP with a verified sending domain.
- [ ] Publish SPF, DKIM, and DMARC records.
- [ ] Test sign-up, OTP, resend, recovery, expiry, Arabic rendering, spam
      placement, and failure handling.
- [ ] Configure Google OAuth with separate staging and production credentials.
- [ ] Test new user, returning user, cancelled consent, duplicate email, and
      callback error paths.

## 3. DNS, TLS, and routing

- [x] Point `app.daneg.ae` to the target host.
- [x] Issue and test the TLS certificate for `app.daneg.ae`.
- [x] Connect `app.daneg.ae` to the Nginx Next.js upstream.
- [x] Send `/`, `/app`, `/api/*`, and `/auth/callback` to Next.js.
- [x] Send `/auth/v1/*`, `/rest/v1/*`, and `/storage/v1/*` to Kong.
- [x] Confirm `app.daneg.ae` is used for canonical, sitemap, and generated
      links.
- [ ] Confirm staging is not indexed by search engines.

## 4. Public Demo controls

- [x] Set `CHECKOUT_MODE=demo` and `PAYMENTS_ENABLED=false` in production.
- [ ] Confirm no public page requests card number, expiry, CVV, Apple Pay, or
      cash-on-delivery data.
- [ ] Confirm a Demo receipt has a `demo-...` id and remains in the browser
      after refresh.
- [ ] Confirm no Demo checkout request reaches `public.orders`.
- [ ] Confirm Payouts and saved payment methods show the Demo-disabled state.
- [ ] Confirm Demo copy and legal pages do not claim real escrow, refunds, or
      seller payouts.

Stripe and real payout are a separate future release. Do not configure them
as part of this Demo acceptance gate.

## 5. Monitoring and operations

- [ ] Configure Sentry browser/server releases with the deployed commit id.
- [ ] Add uptime checks for `/`, `/app`, `/api/health`, Auth, and the OAuth
      callback on `app.daneg.ae`.
- [ ] Add alerts for health failures, Auth failures, database errors, and
      quota/rate-limit events.
- [ ] Enable database and storage backups with documented retention.
- [ ] Complete and record a restore drill.
- [ ] Confirm logs redact tokens, OTP codes, card data, and personal data.
- [ ] Prepare support steps for missing OTP, recovery, blocked accounts, and
      callback failure.

## 6. Legal and support

- [ ] Replace every `PLACEHOLDER` in `src/app/legal/content.ts` with the real
      registered entity, office address, and trade licence number.
- [ ] Confirm support and privacy email addresses are monitored.
- [ ] Have a UAE-qualified lawyer review Terms, Privacy, and the Demo return
      boundary in English and Arabic.
- [ ] Have a native Arabic speaker check that both language versions match.
- [ ] Set the effective date after legal approval.

## Evidence

For each completed item, record the date, owner, environment, and a link to
the log, test result, or screenshot in the team tracker. Do not put secrets in
this file.
