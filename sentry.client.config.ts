/**
 * Sentry client-side configuration.
 *
 * Loaded on the browser by Next.js. Reads DSN from `NEXT_PUBLIC_SENTRY_DSN`.
 * Source maps are uploaded at build time via the `sentry/nextjs` plugin.
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    debug: false,
  });
}
