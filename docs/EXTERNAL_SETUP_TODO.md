# Mooday — external setup backlog

This file is the single checklist for work that cannot be completed only from
the repository. Do these items in a staging environment first. Never paste a
service-role key, database password, SMTP password, or OAuth client secret into
a `NEXT_PUBLIC_*` variable or commit it to Git.

## 1. Hosted Supabase staging

- [ ] Create a dedicated Supabase **staging** project in the UAE/nearest
  available region and record the project reference in the team password
  manager.
- [ ] Link the repository to staging with the Supabase CLI.
- [ ] Review all pending migrations, take a staging backup, then apply
  identity through admin migrations in order:
  `202607150001_phase_2_identity.sql`,
  `202607150002_phase_3_listings.sql`,
  `202607150003_phase_3_listing_media.sql`,
  `202607150004_phase_3_public_seller_profiles.sql`,
  `202607150005_phase_3_user_likes_and_cart.sql`,
  `202607150006_phase_3_orders.sql`,
  `202607150007_phase_3_social.sql`,
  `202607150008_phase_3_5_admin.sql`,
  `202608060001_payment_methods.sql`,
  `202608060002_blocked_users.sql`,
  `202608060003_seller_reviews_snapshot.sql`,
  `202608060004_notification_fanout.sql`,
  `202608060005_seed_admin.sql`,
  `202608060006_fix_storage_foldername.sql`.
- [ ] Confirm that `profiles`, `addresses`, `set_default_address`, triggers,
  grants, and all RLS policies exist.
- [ ] Confirm that `listings` and `listing_images` exist and that anonymous
  access returns **active + approved** listings only (`approved_at IS NOT NULL`).
- [ ] Confirm likes (`user_likes`), cart (`cart_items`), orders, and social
  tables (chats / notifications / reports / disputes) exist with RLS.
- [ ] Confirm that the private `listing-media` bucket has a 10 MB limit,
  JPEG/PNG/WebP allow-list, and the expected Storage RLS policies.
- [ ] Run the database/RLS tests against an isolated staging test database
  (`supabase/tests/phase_2_*.sql` and `phase_3_*.sql`).
- [ ] Copy `supabase/templates/confirmation.html` and `recovery.html` into the
  matching Supabase Auth email templates. Keep `{{ .Token }}` intact so the UI
  receives a six-digit code rather than a confirmation link.
- [ ] Set the Auth Site URL to the staging web URL.
- [ ] Allow only the required callback URLs, including
  `https://<staging-domain>/auth/callback` and the final production callback.

## 2. Transactional email / SMTP

- [ ] Choose and create the production email provider account.
- [ ] Verify the sending domain and publish its SPF, DKIM, and DMARC records.
- [ ] Configure the provider SMTP credentials in Supabase Auth secrets.
- [ ] Set a branded sender name/address and a monitored reply-to/support
  address.
- [ ] Test sign-up confirmation, resend, password recovery, expiry, spam
  placement, Arabic rendering, and delivery failure handling.
- [ ] Configure bounce/complaint monitoring and provider rate alerts.

## 3. Google and Apple sign-in

- [ ] Create separate Google OAuth credentials for staging and production.
- [ ] Add the exact Supabase callback URL and Mooday web origins in Google
  Cloud, then store the client secret in Supabase.
- [ ] Configure the Apple developer App ID, Services ID, key, team ID, and
  verified return URL; store the private key only in the secret manager.
- [ ] Enable both providers in Supabase and test new-user, returning-user,
  cancelled-consent, duplicate-email, and callback-error paths.
- [ ] Review the consent-screen/app-verification requirements before launch.

## 4. Web staging and production environments

- [ ] Create the staging and production web projects/deployments.
- [ ] Set these values separately in each environment:
  `NEXT_PUBLIC_DATA_SOURCE=supabase`,
  `NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE=supabase` (optional; listings/likes/cart),
  `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`.
  Server-only: `SUPABASE_SERVICE_ROLE_KEY` for admin actions.
- [ ] Confirm that preview deployments do not accidentally use the production
  database.
- [ ] Configure the custom domains, TLS, redirects, and DNS records.
- [ ] Protect staging from public indexing and unauthorized access.
- [ ] Run `npm run test:phase2`, the browser Auth journey, and a manual mobile
  smoke test against staging before promoting the release.

## 5. Production security controls

- [ ] Choose and configure CAPTCHA/bot protection for sign-up, sign-in,
  resend, and recovery flows.
- [ ] Tune Supabase Auth email/OTP rate limits using staging traffic results.
- [ ] Review Auth session duration, refresh-token rotation, password policy,
  leaked-password protection, and MFA roadmap.
- [ ] Verify that all private tables have RLS enabled and re-run the owner
  isolation checks after every migration.
- [ ] Review CSP violation reports, remove required violations, then move the
  policy from report-only to enforced mode.
- [ ] Resolve or formally accept the two moderate transitive PostCSS/Next.js
  audit findings when a non-breaking upstream fix is available. Do not use the
  current forced audit fix because it downgrades Next.js.

## 6. Monitoring, support, and launch readiness

- [ ] Connect error monitoring for browser errors and Auth callback failures;
  ensure logs redact tokens, email codes, and personal data.
- [ ] Add uptime checks for the web app, Supabase Auth, and the callback route.
- [ ] Create alerts for elevated sign-in failures, OTP delivery delays,
  database errors, and provider quota/rate-limit exhaustion.
- [ ] Define data retention/deletion, account deletion, privacy-request, backup,
  and restore procedures with the product/legal owners.
- [ ] Prepare a customer-support runbook for missing OTPs, locked accounts,
  provider-login conflicts, and recovery failures.
- [ ] Perform a staging restore drill and document the production rollback:
  disable the Supabase feature flag/deploy mock only for an emergency preview;
  do not roll back the additive identity migration destructively.

## Completion evidence

For every checked item, add the date, owner, environment, and a link to the
ticket or screenshot in the team tracker. No credentials should be copied into
this file.
