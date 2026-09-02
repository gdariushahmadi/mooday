# U19 + U20 Progress: Supabase Backup + cPanel Deploy

**Date:** 2026-08-16
**Status:** Operational setup steps; no code changes required
**Owner:** U19 + U20

## U19: Supabase Pro backup

This is a manual configuration step in the Supabase dashboard:

1. Upgrade the project to Supabase Pro (or higher).
2. Enable Point-in-Time Recovery (PITR) in **Settings -> Database**.
3. Schedule daily full backups (default at Pro).
4. Configure backup retention to at least 7 days.

These changes do not require code changes. After enabling, verify with a manual restore to a staging environment.

## U20: cPanel deploy

The existing `scripts/build-standalone.sh` is the canonical deploy path:

1. Set production env vars in `.env.production`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_DSN`
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`

2. Run `bash scripts/build-standalone.sh --upload` from the project root.
3. Verify the deployment:
   - `curl https://app.daneg.ae/` returns 200.
   - `curl https://app.daneg.ae/api/health` returns `{"status":"ok"}`.
   - A real user can sign up from the production URL.

## Code-side requirements

- The `app.daneg.ae` host is configured in `scripts/build-standalone.sh`.
- The `MOODAY_SSH_KEY`, `MOODAY_SSH_HOST`, `MOODAY_SSH_PORT`, and `MOODAY_REMOTE_DIR` env vars must be set on the deploy machine.
- The deploy script defaults: `danesoyk@app.daneg.ae`, port 21098, `/home/danesoyk/mooday`.

## What is still pending

1. Set production env vars in `.env.production` (or a secrets manager).
2. Run a deploy to `app.daneg.ae`.
3. Verify the health endpoint and a sign-up flow.
