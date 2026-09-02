---
kind: external_dependency
name: Sentry for error tracking and source maps
slug: sentry
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

### Sentry
- Role: Error and performance monitoring for the Next.js app; initialized conditionally on the presence of `NEXT_PUBLIC_SENTRY_DSN`.
- Configuration: client DSN read from `NEXT_PUBLIC_SENTRY_DSN`; build-time upload uses `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` passed through `withSentryConfig` in `next.config.ts`; traces sampled at 0.1, replays disabled except on-error.
- Deployment: source map upload is disabled during builds (`sourcemaps.disable: true`) per the current config; CI or release pipeline must supply the auth token to enable uploads.
- Secret handling: DSN is a public-facing key; org/project/auth tokens must remain server-only.