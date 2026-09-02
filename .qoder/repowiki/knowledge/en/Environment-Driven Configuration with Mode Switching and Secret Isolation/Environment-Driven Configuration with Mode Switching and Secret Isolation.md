---
kind: configuration_system
name: Environment-Driven Configuration with Mode Switching and Secret Isolation
category: configuration_system
scope:
    - '**'
source_files:
    - .env.example
    - src/services/backend/config.ts
    - src/services/backend/index.ts
    - next.config.ts
    - sentry.client.config.ts
    - sentry.edge.config.ts
    - sentry.server.config.ts
    - supabase/config.toml
    - src/app/api/health/route.ts
    - src/app/sitemap.ts
---

## Overview

The application uses a flat, environment-variable-driven configuration system built on Next.js `process.env`. There is no centralized config file format (no YAML/JSON/TOML app config); instead, behavior is toggled via `NEXT_PUBLIC_*` and server-only env vars. A single typed accessor — `getBackendConfig()` in `src/services/backend/config.ts` — centralizes loading, validation, and defaulting for the runtime backend mode.

## Key Files

- `.env.example` — documents every required env var and explicitly forbids putting secrets into `NEXT_PUBLIC_*` variables.
- `src/services/backend/config.ts` — the canonical configuration loader; defines `BackendConfig` shape, resolves `mode` / `marketplaceMode`, validates required Supabase credentials when supabase mode is selected, and exposes `siteUrl`.
- `src/services/backend/index.ts` — re-exports `getBackendConfig` and wires it into every backend client factory (`createSupabaseBackend`, mock factories).
- `next.config.ts` — reads `NEXT_PUBLIC_SUPABASE_URL` to build a dynamic Content Security Policy origin allowlist and passes Sentry build-time env vars (`SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`) to `withSentryConfig`.
- `sentry.client.config.ts`, `sentry.edge.config.ts`, `sentry.server.config.ts` — per-bundle Sentry init files that read DSN from either `NEXT_PUBLIC_SENTRY_DSN` (client/edge) or `SENTRY_DSN` (server only).
- `supabase/config.toml` — local Supabase project config (project id, auth redirect URLs, email templates); used by `supabase dev` / CLI, not at runtime.
- `src/app/api/health/route.ts`, `src/app/sitemap.ts`, `src/services/admin/actions.ts` — direct consumers of `process.env.NEXT_PUBLIC_*` values outside the central config.

## Architecture & Conventions

### Single source of truth for backend mode
`getBackendConfig()` is the only place that interprets `NEXT_PUBLIC_DATA_SOURCE` and `NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE`. It coerces any value other than the literal string `"supabase"` into `"mock"`, so the default is always the in-memory mock. The same function also resolves `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with a fallback to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Layered validation at load time
When supabase mode is requested, `getBackendConfig()` throws if `NEXT_PUBLIC_SUPABASE_URL` or the publishable key are missing, and throws if `NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE=supabase` is set while `NEXT_PUBLIC_DATA_SOURCE` is not supabase. This enforces a dependency ordering between the two data-source flags at startup rather than at each call site.

### Strict separation of public vs server-only secrets
- Client-facing config lives under `NEXT_PUBLIC_*` and is bundled into the browser bundle.
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`) are never prefixed with `NEXT_PUBLIC_`; the comment in `config.ts` and the `.env.example` header both explicitly forbid this.
- Admin Server Actions read `SUPABASE_SERVICE_ROLE_KEY` directly from `process.env` at module-load time so it stays in the server bundle and cannot leak to the client.

### Per-bundle Sentry initialization
Sentry is initialized three times via separate entry files consumed by Next.js: `sentry.client.config.ts` (browser), `sentry.edge.config.ts` (Edge runtime), and `sentry.server.config.ts` (Node server). Each reads its own DSN variable, keeping client and server telemetry isolated.

### Build-time vs runtime config
`next.config.ts` reads `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` at build time to configure the Sentry Next.js plugin (uploading sourcemaps, setting `widenClientFileUpload`). Runtime-only headers and CSP are derived from `NEXT_PUBLIC_SUPABASE_URL` during Next.js server startup.

### Supabase local project config
`supabase/config.toml` declares the linked project id, enables API + Auth, lists allowed redirect URLs (including `http://localhost:3000/auth/callback`), and points email templates to `supabase/templates/*.html`. This is consumed by the Supabase CLI, not by the running Next.js app.

## Conventions & Constraints

1. **Data source selection**: Set `NEXT_PUBLIC_DATA_SOURCE=supabase` to enable real Supabase; otherwise everything falls back to the in-memory mock. The marketplace layer can be independently enabled via `NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE=supabase`, but only after the base data source is supabase.
2. **Secret isolation rule**: Never put `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, SMTP secrets, or OAuth client secrets into a `NEXT_PUBLIC_*` variable. Enforced by documentation in `.env.example` and enforced at runtime because the service-role key is read only from server-side `process.env.SUPABASE_SERVICE_ROLE_KEY`.
3. **Missing required env fails fast**: If supabase mode is selected without `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `getBackendConfig()` throws immediately, preventing silent fallback to broken state.
4. **Default site URL**: `NEXT_PUBLIC_SITE_URL` defaults to `http://localhost:3000` when unset; used by sitemap generation and returned in the backend config.
5. **CSP derivation**: `next.config.ts` parses `NEXT_PUBLIC_SUPABASE_URL` and whitelists its origin plus the matching WebSocket host in `connect-src`; malformed URLs are silently ignored (caught in a try/catch).
6. **Sentry opt-in**: Sentry is only initialized when the corresponding DSN env var is present; absence of the env var disables telemetry for that bundle.
7. **Local Supabase project identity**: `supabase/config.toml` pins `project_id = "mooday"`; all Supabase CLI commands operate against this linked project.