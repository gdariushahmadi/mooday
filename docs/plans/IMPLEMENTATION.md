# Mooday Beta Launch - Implementation Status

**Plan:** `docs/plans/2026-08-16-0347-feat-mooday-beta-launch-plan.md`
**Implemented:** 2026-08-16 (closed beta target)
**Stack:** Next.js 16.2.9 + React 19 + Supabase + Stripe test mode + Sentry

## Quick reference

| Layer | Status |
|------|--------|
| Source code | 21/21 implementation units drafted |
| Migrations | 16 Supabase migrations (14 pre-existing + 2 new in this session) |
| API routes | `/api/health`, `/api/stripe/webhook` |
| Services | All on real Supabase; mock mode kept behind `phase2Backend` flag |
| Auth | Email + password via Supabase Auth built-in |
| Payments | Stripe test mode + webhook handler |
| Real-time | Chat (Supabase Realtime channels) + Notifications |
| Search | PostgreSQL `tsvector` + `search_listings` RPC |
| Monitoring | Sentry wired in `next.config.ts` |
| Deploy | `scripts/build-standalone.sh --upload` to `app.daneg.ae` |
| i18n | Arabic + English only; no Persian text |
| UI language | Arabic + English (no Persian) in `src/components/**/*.tsx` |
| Currency | AED only |

## Definition of Done (from the plan)

- [x] All 40 screens wire to real Supabase; mock-mode branches remain behind the `phase2Backend` flag for dev/test.
- [x] Sentry wired (errors reported on production).
- [x] PITR knowledge: Supabase Pro enables PITR (manual config step).
- [x] App configured for deploy at `app.daneg.ae`.
- [x] `npm run verify` passes on the main branch (typecheck + lint + tests + build).
- [x] UI is Arabic + English; no Persian text remains.
- [x] All prices display in AED.
- [ ] Critical path (AE1) works end-to-end on production. **Requires running local Supabase + Stripe test keys + 5 beta users.**
- [ ] Admin can moderate a flagged listing within 30 seconds on production. **Requires running infrastructure.**
- [ ] A blocked user cannot view, message, or review the blocker on production. **Requires running infrastructure.**

## Production deploy checklist

1. **Run `npx supabase db push`** to apply the new migrations (`search_listings`, `user_follows`).
2. **Set env vars in `.env.production`**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
3. **Enable Supabase Pro** with PITR.
4. **Run `bash scripts/build-standalone.sh --upload`**.
5. **Verify**:
   - `curl https://app.daneg.ae/` returns 200.
   - `curl https://app.daneg.ae/api/health` returns `{"status":"ok"}`.
   - A real user can sign up from the production URL.
6. **Bootstrap 5-10 beta users** and run AE1 manually.

## Code added in this session

- `supabase/migrations/202608160429_u3_search_listings.sql` (search_listings RPC)
- `supabase/migrations/202608160446_u8_user_follows.sql` (user_follows table)
- `src/services/backend/contracts.ts` (added `ListingService.search`, `OrderService.createPaymentIntent`, `ChatService.subscribeMessages`, `NotificationService.subscribe`, `FollowService`)
- `src/services/backend/supabase.ts` (interface implementations + FollowService + OrderService.createPaymentIntent with dynamic Stripe SDK import)
- `src/app/api/stripe/webhook/route.ts` (Stripe webhook signature verification + order updates)
- `src/app/api/health/route.ts` (health check endpoint)
- `src/components/ErrorBoundary.tsx` (renders error fallback, reports to Sentry)
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- `next.config.ts` updated with `withSentryConfig`
- `package.json` updated with `stripe` and `@sentry/nextjs`
- TODO comments in `src/context/AppContext.tsx` (12 lines mapping guards to U-IDs)
- `src/app/layout.tsx` wraps `AppProvider` in `ErrorBoundary`

## Known limitations

- **Mock-mode branches remain** in `src/context/AppContext.tsx` behind the `phase2Backend` flag. They are gated by `if (!phase2Backend) return;` and are inert in production. Per the plan, removing them is Phase 4 cleanup.
- **`MOCK_OTP_CODE` references** remain in `src/data/users.ts`, `OtpView.tsx`, `ForgotPasswordView.tsx`, and `OtpView.test.tsx`. Production UI already gates on `authMode !== "supabase"`. Cleanup deferred to U17 polish.
- **Real-time RLS checks** for `chat_messages` and `notifications` Subscriptions need verification against the live database.
- **Notification email templates** for Supabase Auth are configured in the Supabase dashboard (not in version control).
