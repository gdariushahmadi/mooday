---
kind: error_handling
name: 'Error Handling: React Error Boundary, Supabase Result Types, and Next.js Route JSON Responses with Sentry'
category: error_handling
scope:
    - '**'
source_files:
    - src/components/ErrorBoundary.tsx
    - src/app/layout.tsx
    - sentry.client.config.ts
    - sentry.server.config.ts
    - sentry.edge.config.ts
    - src/services/backend/supabase.ts
    - src/app/api/stripe/webhook/route.ts
    - src/app/api/health/route.ts
    - src/lib/imageStage.ts
    - src/lib/security.ts
    - src/lib/hooks.ts
---

## Overview

The codebase uses a layered error-handling strategy that combines a React `ErrorBoundary` for render-time failures, typed result objects (`AuthResult`) for client-side service calls, explicit `throw new Error(...)` for validation failures in services, structured `NextResponse.json({ error })` responses from Next.js API routes, and centralized error reporting to Sentry via three environment-specific config files.

## Client-side rendering errors

- **Global boundary**: `src/components/ErrorBoundary.tsx` is a class component wrapping the entire app tree (in `src/app/layout.tsx`). It implements `getDerivedStateFromError` + `componentDidCatch`, renders a styled fallback div with role `alert`, and reports to Sentry when `NEXT_PUBLIC_SENTRY_DSN` is set. The boundary accepts an optional `fallback` prop so callers can override the UI.
- **Sentry initialization**: Three entry points — `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` — each conditionally call `Sentry.init` based on their respective DSN env var (`NEXT_PUBLIC_SENTRY_DSN` vs `SENTRY_DSN`). Traces are sampled at 0.1; replay is disabled except `replaysOnErrorSampleRate: 1.0` on the client.

## Service-layer errors (backend client)

- **Typed result union**: `src/services/backend/supabase.ts` defines `AuthResult<T>` (imported from `contracts`) and returns `{ ok: true, value }` or `{ ok: false, error: AuthErrorCode }`. A local `failure(message)` helper maps raw Supabase auth messages through `mapSupabaseAuthError`, which normalizes provider errors into stable codes like `user_exists`, `weak_password`, `invalid_email`, `rate_limited`, `invalid_otp`, `network_error`, `invalid_credentials`. This lets UI components branch on user-friendly categories instead of parsing free-form strings.
- **Throwing for non-auth operations**: Data/mutation methods (e.g., `ProfileService.updateMine`, `AddressService.create`, `ListingMediaService.upload`) throw `Error` directly on Supabase errors or preconditions (unsupported MIME, empty file, size exceeds limit, missing auth). Some operations perform best-effort rollback before rethrowing — e.g., `uploadAvatar` deletes the orphaned storage object if the metadata row insert fails, and `ListingMediaService.upload` removes the uploaded blob if the `listing_images` insert fails.
- **Authentication guard**: A private `requireAuthUserId()` helper throws `new Error("Authentication required")` when no session is present, used by write paths that need a user context.

## API route errors

- **Stripe webhook** (`src/app/api/stripe/webhook/route.ts`): Every failure path returns `NextResponse.json({ error: "..." }, { status })` with explicit HTTP status codes — 400 for signature verification failures and missing metadata, 500 for missing secrets/SDK/config, 503 not used here but the pattern holds. Unknown event types are silently acknowledged with `{ received: true, ignored: event.type }`.
- **Health check** (`src/app/api/health/route.ts`): Returns `{ status: "ok" | "degraded", ... }` with 200 or 503 depending on whether a Supabase head query succeeds; transient network errors are caught and reported as degraded rather than thrown.

## Browser/local-storage safety

- `src/lib/hooks.ts` wraps all `localStorage` access in try/catch blocks to tolerate quota-exceeded and private-browsing modes, returning defaults instead of crashing. The `readMigratedStorage` helper also migrates old `mooday_*` keys to `daneg_*` while swallowing storage errors.
- `src/lib/security.ts` gracefully degrades WebCrypto/WebAuthn features: `hashPin`/`verifyPin` return `null`/`false` when `window.crypto.subtle` is unavailable; `verifyBiometric` catches `NotAllowedError` and treats it as a soft failure; `detectWebAuthnSupport` returns `{ available: false }` when the APIs are missing.

## Image staging errors

- `src/lib/imageStage.ts` defines a discriminated union `ImageStageError = { kind: "unsupported-type" } | { kind: "too-large" }` and attaches the `kind` property onto thrown `Error` instances using `Object.assign(...)`. Callers can switch on `err.kind` to show specific UI feedback (e.g., "Use JPG, PNG, or WEBP" vs "Image is too large. Max size is X MB").

## Conventions observed

| Area | Convention | Evidence |
|---|---|---|
| React render errors | Wrap app in `ErrorBoundary`; report to Sentry when DSN configured | `layout.tsx`, `ErrorBoundary.tsx` |
| Auth flows | Return `AuthResult` with normalized `AuthErrorCode` via `mapSupabaseAuthError` | `supabase.ts` lines 81–114 |
| Non-auth mutations | Throw `Error` with descriptive message; roll back side effects before rethrow | `uploadAvatar`, `ListingMediaService.upload` |
| API routes | Return `NextResponse.json({ error }, status)`; never let unhandled exceptions propagate | Stripe webhook, health route |
| Local storage | Always wrap in try/catch; fall back to defaults | `hooks.ts`, `security.ts` |
| File uploads | Validate MIME/size before upload; attach `kind` to thrown errors for UI branching | `imageStage.ts`, `supabase.ts` |
| Error reporting | Initialize Sentry per runtime (client/server/edge) gated by env var | `sentry.*.config.ts` |

No repository-wide custom error class hierarchy exists; errors are either plain `Error` instances, discriminated-error objects augmented onto `Error`, or typed result unions. There is no global middleware or Express-style error handler — Next.js App Router routes handle their own responses.