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

Supabase owns `auth.users` and `auth.sessions`. Mooday intentionally does not
duplicate passwords, tokens, or sessions in the public schema.

## Local setup

1. Install the Supabase CLI or use `npx supabase`.
2. Start the local stack and apply the migration:

   ```bash
   npx supabase start
   npx supabase db reset
   npx supabase test db
   ```

3. Copy `.env.example` to `.env.local` and set:

   ```dotenv
   NEXT_PUBLIC_DATA_SOURCE=supabase
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable key>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Add `/auth/callback` to the redirect allow-list. Google and Apple also
   require provider credentials in the Supabase dashboard.

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

Phase 3 will move listings, carts, orders, offers, chat, notifications, reviews,
and disputes behind the backend boundary and add queues/realtime processing.
