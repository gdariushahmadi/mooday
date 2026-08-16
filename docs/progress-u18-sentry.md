# U18 Progress: Sentry Configuration

**Date:** 2026-08-16
**Status:** Sentry SDK installed; client/server/edge configs added
**Owner:** U18 (Configure Sentry)

## What is done

1. **`@sentry/nextjs`** installed via `npm install`.
2. **`sentry.client.config.ts`** initializes Sentry on the browser with `NEXT_PUBLIC_SENTRY_DSN`. Traces sampled at 10%, error replays at 100% of errored sessions.
3. **`sentry.server.config.ts`** initializes Sentry on the server with `SENTRY_DSN` (server-only).
4. **`sentry.edge.config.ts`** initializes Sentry on the edge runtime.
5. **Typecheck** passes.

## What is still pending

1. **next.config.ts update**: wrap the export with `withSentryConfig` to enable source map upload and build-time plugin.
2. **Test**: a thrown error should appear in the Sentry dashboard.
3. **Set env vars**: `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` in `.env.production`.

## Next steps

1. Update `next.config.ts` with `withSentryConfig`.
2. Add source map upload token.
3. Run an end-to-end error test.
