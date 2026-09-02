# DANEG deployment

This document describes the VPS deployment for the public DANEG Demo/Beta.

## Release boundary

The deployed release must use these values:

```text
CHECKOUT_MODE=demo
PAYMENTS_ENABLED=false
NEXT_PUBLIC_CHECKOUT_MODE=demo
NEXT_PUBLIC_PAYMENTS_ENABLED=false
CANONICAL_SITE_URL=https://app.daneg.ae
NEXT_PUBLIC_CANONICAL_SITE_URL=https://app.daneg.ae
```

The public checkout stores a browser-only Demo receipt. It does not create a
row in `public.orders`. Do not add Stripe keys to a public client variable.

## Domain

Use one public domain for the application, Nginx virtual host, TLS certificate,
Next.js upstream, SEO, sitemap, and generated links:

- `https://app.daneg.ae`

Supabase Auth must allow this callback URL:

```text
https://app.daneg.ae/auth/callback
```

## Nginx route map

The Nginx configuration must send these paths to Next.js:

```text
/                 -> Next.js
/app              -> Next.js
/api/*            -> Next.js
/auth/callback    -> Next.js
```

It must send these paths to the Kong upstream:

```text
/auth/v1/*        -> Kong
/rest/v1/*        -> Kong
/storage/v1/*     -> Kong
```

Do not send `/auth/callback` to Kong. This is a Next.js page.
The checked-in Nginx template is `docs/nginx/app.daneg.ae.conf`.

## VPS services

The current target is Ubuntu 24.04 on the DANEG VPS. The expected services
are Nginx, Next.js standalone, Kong, Postgres, Supabase Auth, PostgREST, and
Storage. Keep staging on a separate database and separate secret file.

## Build and deploy

Requirements: Node.js `20.9` or newer and access to the deployment host.

From the repository root:

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run build
npm run deploy:vps -- --upload
```

The deployment script builds the standalone bundle, copies `public/` and the
required `.next/static/` files, copies the production environment file, and
restarts the service. The bundle must come from the commit that passed the
verification commands.

Never commit `.env.production`, service-role keys, database passwords, SMTP
passwords, OAuth client secrets, or Stripe secrets.

## Database release

Apply migrations to staging first. Review the SQL and run the full database
test suite before production:

```bash
npx supabase db push
npm run test:phase2:db
```

The delivery migration is:

```text
supabase/migrations/202608310002_delivery_integrity.sql
```

Confirm these properties in staging:

- public listings require active status and non-null `approved_at`;
- authenticated clients cannot insert orders or order items directly;
- the single-listing order RPC reads the database price and locks the listing;
- payment status is separate from shipment status;
- owner RLS, block checks, and suspension checks work for every affected table;
- duplicate webhook events do not update an order twice.

## Auth and email

Configure the Auth Site URL and the callback URL in Supabase. Configure
real SMTP before public sign-up. Test sign-up, OTP, recovery, expiry, failed
delivery, Arabic email rendering, and Google OAuth on both domains.

## Post-deploy checks

Run these checks against the public domain:

```bash
curl -sI https://app.daneg.ae/
curl -sI https://app.daneg.ae/app
curl -sI https://app.daneg.ae/auth/callback
curl -s https://app.daneg.ae/api/health
```

Expected results:

- home, app, and callback return a valid Next.js response;
- `/api/health` is `200` only when Next.js, Supabase REST, and Supabase Auth
  respond within the health timeout;
- `/rest/v1/*`, `/auth/v1/*`, and `/storage/v1/*` use the correct Kong route;
- the response contains an enforced CSP without `unsafe-eval`;
- the page has the correct Arabic `lang` and `dir` on the first HTML response.

## Backups and monitoring

Enable a scheduled database backup, storage backup, retention policy, and a
documented restore drill. Configure Sentry releases, an uptime check for the
public domain plus Auth, and alerts for health failures and database errors.

Do not call the release accepted until the restore drill and the staging RLS
tests have fresh evidence.
