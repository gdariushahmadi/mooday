# Phase 2 — Identity backend foundation

Phase 2 replaces the demo identity boundary with Supabase-managed
PostgreSQL and Auth while keeping the rest of the Phase 1 marketplace data
local until Phase 3.

## Delivered scope

- Explicit `mock | supabase` data-source flag with fail-fast validation.
- Replaceable auth, profile, and address service contracts.
- Email/password registration and sign-in, email confirmation OTP, password
  recovery, Google OAuth, Apple OAuth, session restoration, and sign-out.
- PostgreSQL migration for private profiles and shipping addresses.
- Owner-only Row Level Security policies and an atomic default-address RPC.
- One-way removal of the legacy plaintext `mooday_users` and cosmetic
  `mooday_session` keys when Supabase mode starts.
- Service Worker bypass for API, Auth, and authenticated requests.
- Browser-level Playwright coverage for registration and the emailed OTP.
- Server-first profile/address mutations so a failed request cannot leave the
  UI showing data that was never saved.

Supabase owns `auth.users` and `auth.sessions`. Mooday intentionally does not
duplicate passwords, tokens, or sessions in the public schema.

## Local setup

1. Install the Supabase CLI or use `npx supabase`.
2. Install the Chromium runtime used by the browser journey:

   ```bash
   npx playwright install chromium
   ```

3. Start the local stack and apply the migration:

   ```bash
   npm run supabase:start
   npx supabase db reset
   npm run test:phase2
   ```

4. Copy `.env.example` to `.env.local` and set:

   ```dotenv
   NEXT_PUBLIC_DATA_SOURCE=supabase
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable key>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

5. Add `/auth/callback` to the redirect allow-list. Google and Apple also
   require provider credentials in the Supabase dashboard.

6. For a hosted Supabase project, copy the contents of
   `supabase/templates/confirmation.html` and `recovery.html` into the Auth
   Email Templates dashboard. Mooday's UI verifies `{{ .Token }}` as a
   six-digit OTP; the default confirmation-link template is not compatible
   with this screen.

Only the public/publishable key belongs in browser configuration. Never expose
the service-role key, database URL, SMTP password, or OAuth client secret via a
`NEXT_PUBLIC_*` variable.

## Rollout

The default remains `mock` for existing Phase 1 previews. Enable `supabase` in
development, then staging, run the complete verification suite, and only then
enable it in production. Supabase mode never falls back to mock accounts after
a network or provider error.

Rollback is configuration-only: restore `NEXT_PUBLIC_DATA_SOURCE=mock` and
redeploy. Database migrations are additive and should remain in place during a
frontend rollback.

## Verification checklist

- Registration → email confirmation → restored session after reload.
- Sign-in failures return a generic credentials error.
- Recovery OTP must be verified before password update.
- OAuth callback accepts only local relative `next` destinations.
- User A cannot select, insert, update, or delete User B's addresses/profile.
- Anonymous users cannot access private tables.
- A user has at most one default address.
- Auth/API responses never enter Service Worker Cache Storage.

### Local verification record — 2026-07-15

- Supabase CLI `2.109.1` started successfully.
- The database was recreated from empty with `supabase db reset` and the
  identity migration applied successfully.
- `supabase test db` passed all 10 RLS isolation tests for authenticated User
  A, authenticated User B, ownership spoofing, default-address RPC, and anon.
- The frontend regression suite passed all 437 tests after the database fix.
- The live local Auth smoke test passed registration, six-digit email OTP,
  profile trigger, owner-scoped address creation, sign-out/sign-in, recovery
  OTP, password update, and sign-in with the recovered password.
- The Playwright browser test passed the real sign-up form, Mailpit OTP
  delivery, six-cell code entry, verification, and authenticated navigation.
- Next runtime returned `200` for `/` and `/auth/callback` with the configured
  CSP report-only and other security headers.
- CI now starts an isolated local Supabase stack, applies migrations, runs RLS,
  live Auth smoke tests, and the browser-level OTP journey, builds in Supabase
  mode, and always tears the stack down without requiring repository secrets.

Phase 3 will move listings, carts, orders, offers, chat, notifications, reviews,
and disputes behind the backend boundary and add queues/realtime processing.
