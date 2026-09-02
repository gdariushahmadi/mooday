---
kind: build_system
name: Next.js Standalone Build, Supabase Local Dev, and CI Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.ts
    - scripts/build-standalone.sh
    - .github/workflows/ci.yml
    - playwright.config.ts
    - vitest.config.mts
    - supabase/config.toml
    - .deploy/server.js
    - .deploy/package.json
---

## Build System Overview

This repository is a Next.js 16 application (React 19) built with TypeScript, Tailwind CSS v4, and Sentry. The build pipeline produces a **standalone** server bundle intended for deployment on cPanel/Passenger, with an optional SSH upload step. A local Supabase CLI instance provides the database for integration and E2E tests.

## Core Tools & Frameworks

- **Framework**: Next.js 16.2.9 with `output: "standalone"` in `next.config.ts`, producing `.next/standalone/server.js` plus a minimal runtime manifest.
- **Language**: TypeScript 5 (`tsconfig.json`), type-checked via `tsc --noEmit` (`npm run typecheck`).
- **Linting**: ESLint 9 with `eslint-config-next` (`npm run lint`).
- **Unit testing**: Vitest 4 with jsdom environment, React plugin, and `vitest.setup.ts`; tests live alongside source as `*.test.{ts,tsx}` under `src/`.
- **E2E testing**: Playwright 1.61 targeting Chromium; `playwright.config.ts` boots the dev server on `127.0.0.1:3100` per test run.
- **Local DB**: Supabase CLI v2.109.1 (`supabase start`) with migrations under `supabase/migrations/` and RLS tests under `supabase/tests/`.
- **Sentry**: `@sentry/nextjs` v10 integrated via `withSentryConfig(nextConfig, ...)` in `next.config.ts`; sourcemaps disabled in production builds.
- **Node engine**: pinned to `>=20.9.0` in `package.json` engines; CI runs on Node 22.

## Key Files

- `package.json` — all scripts: `dev`, `build`, `start`, `start:standalone`, `deploy:cpanel`, `seed:demo`, `lint`, `test`, `test:ci`, `typecheck`, `verify`, `supabase:start|stop`, `test:phase2:*`.
- `next.config.ts` — standalone output, Turbopack root pinning, security headers (CSP report-only, HSTS in prod), PWA asset caching rules, Sentry config.
- `scripts/build-standalone.sh` — builds Next.js, stages `.next/standalone/server.js`, `package.json`, `public/`, `.next/static/` into `.deploy/`, tars to `mooday-deploy.tar.gz`, optionally uploads via SSH to cPanel.
- `.github/workflows/ci.yml` — two jobs: `verify` (lint + typecheck + unit tests + build) and `phase-2-integration` (local Supabase, migration + RLS smoke, auth smoke, E2E signup/OTP).
- `playwright.config.ts` — single Chromium project, `forbidOnly` in CI, retries=2 in CI, webServer boots `npm run dev -- --hostname 127.0.0.1 --port ${PLAYWRIGHT_PORT}`.
- `vitest.config.mts` — jsdom env at `https://localhost:3000`, globals enabled, timeout 15s, includes `src/**/*.{test,spec}.{ts,tsx}`.
- `supabase/config.toml` — local Supabase project config, email templates from `supabase/templates/`.
- `.deploy/` — staged standalone bundle (server.js, package.json, public/, .next/) produced by the build script.

## Architecture & Conventions

### Build Output
The app is built with `next build` (production mode). With `output: "standalone"`, Next.js emits a self-contained server that requires only Node.js and the files copied into `.deploy/`. Static assets are kept at `.next/static/` next to the standalone output because the standalone server refuses to serve them otherwise.

### Environment Strategy
- Production env vars are injected inline when invoking `next build` inside `scripts/build-standalone.sh` (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_DATA_SOURCE`, `NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE`). These override any `.env.local` values.
- CI exposes local Supabase URLs via `npx supabase status -o env` and writes them to `$GITHUB_ENV` before running tests.
- Sentry credentials (`SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`) are read from process env during build.

### Deployment
There is no Dockerfile or container image. Deployment targets cPanel/Passenger:
1. Run `npm run deploy:cpanel` (alias for `bash scripts/build-standalone.sh`).
2. Without flags: builds and stages `.deploy/` and packs `mooday-deploy.tar.gz` locally.
3. With `--upload`: SCPs the tarball to `MOODAY_SSH_HOST` (default `danesoyk@app.daneg.ae:21098`) over `MOODAY_SSH_KEY`, extracts it into `MOODAY_REMOTE_DIR` (default `/home/danesoyk/mooday`), and touches `tmp/restart.txt` to signal Passenger to restart.

### Testing Pipeline
- Unit tests: `npm run test:ci` (Vitest, non-watch mode).
- DB + RLS tests: `npm run test:phase2:db` runs `supabase test db` against the local Supabase instance.
- Auth smoke: `npm run test:phase2:smoke` hits the running local Supabase API.
- E2E: `npm run test:phase2:e2e` launches Playwright against `http://127.0.0.1:3100` (started by Playwright's webServer config).
- Full phase-2 gate: `npm run test:phase2` chains all of the above.
- Pre-push quality gate: `npm run verify` runs typecheck → lint → unit tests → build.

### CI Flow (GitHub Actions)
Two parallel jobs run on push/PR to `main` and `develop`:
- `verify`: checkout → setup Node 22 → `npm ci` → typecheck → lint → unit tests → production build.
- `phase-2-integration`: checkout → setup Node 22 → `npm ci` → `supabase:start` → export env → RLS/db tests → auth smoke → build → install Chromium → Playwright E2E → `supabase:stop`.

## Conventions & Constraints

- **Standalone-only deployment**: The build always uses Next.js standalone output; the cPanel deploy script explicitly copies only the artifacts required by the standalone server.
- **No global Makefile**: All orchestration lives in `package.json` scripts and shell helpers under `scripts/`.
- **Supabase version pinning**: The Supabase CLI is invoked as `npx supabase@2.109.1` everywhere to keep local and CI behavior identical.
- **PWA assets**: Service worker (`/sw.js`) is served with `no-cache, no-store, must-revalidate`; `manifest.json` gets `max-age=3600`; icons get `max-age=86400, must-revalidate` — enforced via Next.js `headers()`.
- **Security headers**: CSP is set as report-only; HSTS is added only in `NODE_ENV === "production"`; X-Frame-Options, Referrer-Policy, and Permissions-Policy are applied site-wide.
- **Turbopack isolation**: `turbopack.root = __dirname` pins the workspace root so Turbopack ignores lockfiles from parent directories in monorepo checkouts.
- **Test discovery**: Vitest includes every file matching `src/**/*.{test,spec}.{ts,tsx}`; Playwright discovers `tests/e2e/*.spec.ts`.
- **CI strictness**: Playwright sets `forbidOnly: Boolean(process.env.CI)` so accidentally leaving `test.only` blocks CI.