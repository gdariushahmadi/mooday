/**
 * Sentry server-side configuration.
 *
 * Loaded on the Next.js server. Reads DSN from `SENTRY_DSN` (server-only).
 */

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    debug: false,
  });
}
