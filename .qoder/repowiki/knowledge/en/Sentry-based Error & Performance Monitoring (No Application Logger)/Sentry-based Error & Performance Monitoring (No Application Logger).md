---
kind: logging_system
name: Sentry-based Error & Performance Monitoring (No Application Logger)
category: logging_system
scope:
    - '**'
source_files:
    - sentry.client.config.ts
    - sentry.server.config.ts
    - sentry.edge.config.ts
    - next.config.ts
    - src/services/backend/supabase.ts
---

## What system/approach is used

The repository does **not** implement an application-level logging framework. There is no structured logger, log levels, or log sink abstraction. The only observability/logging mechanism is **Sentry**, configured via `@sentry/nextjs` for client, server, and edge runtimes. All other console output in the codebase is a single `console.warn(...)` call used as a development-time diagnostic for misconfigured OAuth redirect URLs.

## Key files and packages

- `sentry.client.config.ts` — Initializes Sentry on the browser with `NEXT_PUBLIC_SENTRY_DSN`, sets `tracesSampleRate: 0.1`, disables session replays (`replaysSessionSampleRate: 0.0`) but enables replay-on-error (`replaysOnErrorSampleRate: 1.0`), and sets `debug: false`.
- `sentry.server.config.ts` — Initializes Sentry on the Next.js Node server with `SENTRY_DSN`, same trace rate and debug settings.
- `sentry.edge.config.ts` — Initializes Sentry for Edge runtime functions using `NEXT_PUBLIC_SENTRY_DSN`.
- `next.config.ts` — Wraps the Next.js config with `withSentryConfig(...)`, passing `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for build-time source map upload. The webpack option `treeshake.removeDebugLogging: true` strips `console.*` calls from production bundles.
- `src/services/backend/supabase.ts` — The only place that emits console output: `console.warn('[auth] OAuth callback URL is ...')` when the computed callback URL is not HTTPS or not localhost, intended to surface misconfiguration during development.

## Architecture and conventions

- **Environment-gated initialization**: Each Sentry config file checks its respective DSN env var before calling `Sentry.init()`. If the DSN is absent, Sentry is never initialized — there are no fallbacks or no-op loggers.
- **Per-runtime configs**: Separate files exist for client, server, and edge, matching Next.js's runtime model so each bundle only loads the appropriate Sentry instance.
- **Build-time integration**: `withSentryConfig` in `next.config.ts` handles source map uploads and uses `widenClientFileUpload: true` plus `sourcemaps.disable: true` at runtime (uploads happen at build time). Debug logging is stripped via webpack treeshaking.
- **Sampling strategy**: Uniform `tracesSampleRate: 0.1` across all runtimes; client additionally records error-only replays at 100% while disabling full-session replays.
- **No application logs**: Business logic, API routes, and services do not emit logs through any logger. Errors are surfaced to Sentry via the SDK's automatic instrumentation; there is no custom `captureMessage` / `captureException` usage found in the scanned code.

## Conventions and constraints

- **No structured logging library exists**: No imports of `pino`, `winston`, `bunyan`, `console-log-level`, or similar. The codebase relies entirely on Sentry for error/performance telemetry.
- **Console output is intentionally minimal**: The single `console.warn` is guarded by `typeof console !== "undefined" && typeof window !== "undefined"` and is scoped to development-like URLs (localhost or non-HTTPS) so it does not pollute production output. Production bundles strip `console.*` via `removeDebugLogging: true`.
- **DSN presence gates functionality**: Sentry is only active when the corresponding DSN environment variable is set; otherwise the app runs without any monitoring hooks.
- **Log level concept does not apply**: Because there is no logger abstraction, there are no log levels, structured fields, or sinks to configure beyond Sentry's sampling and debug flags.