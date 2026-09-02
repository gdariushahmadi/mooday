---
kind: external_dependency
name: Supabase as Phase 2/3 backend and auth provider
slug: supabase
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
    - client_constraint
scope:
    - '**'
---

### Supabase
- Role: Backend-as-a-Service for Phase 2 (auth, OTP, email templates) and Phase 3+ marketplace data layer; the app currently ships in `mock` mode (`NEXT_PUBLIC_DATA_SOURCE=mock`) but is wired to swap to Supabase via environment flags.
- Auth: Supabase Auth with email sign-up, confirmation, recovery templates under `supabase/templates/`; site URL configured to `app.daneg.ae` with callback redirect at `/auth/callback`.
- Database: migrations live under `supabase/migrations/`; project id `mooday` in `supabase/config.toml`. The Next.js config dynamically whitelists the Supabase origin in the CSP `connect-src` directive.
- Secrets: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are client env vars; `SUPABASE_SERVICE_ROLE_KEY` is server-only (never promoted to `NEXT_PUBLIC_*`).
- Client SDK: `@supabase/supabase-js` v2 used from `src/services/backend/supabase.ts`.
- Local dev: `npm run supabase:start` boots a local Supabase instance (excluding studio, imgproxy, logflare, vector, supavisor).
- Verify exact API/params against official Supabase docs when wiring real endpoints.