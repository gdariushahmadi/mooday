# DANEG public Demo/Beta

DANEG is a bilingual English/Arabic marketplace demo for pre-loved fashion.
This release is a public Demo/Beta.

## Release boundary

- Checkout mode is `demo`.
- A checkout has one listing and quantity `1`.
- A Demo order is a browser-only receipt with a `demo-...` id.
- The Demo does not request, process, or store card numbers or CVV values.
- Demo checkout does not insert rows into `public.orders`.
- Real payments, Stripe, seller payout, multi-product checkout, and rentals
  are future work.
- `https://app.daneg.ae` is the canonical and only public site.

## Run locally

Requirements: Node.js `20.9` or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to a local environment file. Keep all secret values out
of variables that start with `NEXT_PUBLIC_`.

## Verification

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

The database test suite needs a running local Supabase stack:

```bash
npm run supabase:start
npm run test:phase2:db
```

The browser suite also needs a local or staging URL and installed Playwright
browsers:

```bash
npm run test:phase2:e2e
```

## Important environment flags

```text
CHECKOUT_MODE=demo
PAYMENTS_ENABLED=false
CANONICAL_SITE_URL=https://app.daneg.ae
```

The public client uses `NEXT_PUBLIC_CHECKOUT_MODE=demo` and
`NEXT_PUBLIC_PAYMENTS_ENABLED=false`. Payment routes stay feature-gated on
the server.

## Main paths

- `/` — landing page
- `/app` — marketplace application
- `/api/health` — Next.js, Supabase REST, and Supabase Auth health check
- `/auth/callback` — OAuth callback page
- `/sitemap.xml` — canonical sitemap
- `/legal/terms`, `/legal/privacy`, `/legal/refunds` — bilingual legal pages

## Deployment

Read [docs/DEPLOY.md](docs/DEPLOY.md) for the single-domain Nginx and VPS setup.
Read [docs/VPS_OPS.md](docs/VPS_OPS.md) for the on-call runbook.
Read [docs/EXTERNAL_SETUP_TODO.md](docs/EXTERNAL_SETUP_TODO.md) for human
release gates.

## Current status

The repository contains the public Demo implementation and the future
payment/order security boundary. Do not mark the release as production-ready
until the staging database, migrations, RLS tests, DNS/TLS, Auth, SMTP,
monitoring, backups, and browser tests pass in the target environments.
