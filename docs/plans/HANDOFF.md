# Mooday Beta Launch — Session Handoff

This is the durable handoff for the next session. It summarizes what
is code-complete, what is verified, and what remains operational.

## Verified DoD (8 of 11)

- [x] All Phase2Backend services wired through `AppContext`.
- [x] UI is Arabic + English; no Persian text (verified by search).
- [x] All prices in AED.
- [x] `npm run typecheck` passes.
- [x] `npm run lint` passes (0 errors, 75 warnings — all pre-existing).
- [x] `npm run test:ci` passes (72 test files, 617 tests).
- [x] `npm run build` succeeds; all 8 routes registered:
  - `/`, `/admin`, `/api/health`, `/api/stripe/webhook`, `/app`,
    `/auth/callback`, `/preview`, `/sitemap.xml`.
- [x] Stripe SDK dynamic-import bug fixed in webhook route and
  `OrderService.createPaymentIntent` (would have thrown at runtime).
- [x] Stripe hardcoded API version removed; SDK default used.

## Operational DoD (requires running infrastructure)

- [ ] `npx supabase db push` to apply new migrations.
- [ ] `npm run test:phase2:u3u8` against a running local Supabase.
- [ ] `npm run test:phase2:smoke` (auth flow).
- [ ] `npm run test:phase2:e2e` (Playwright).
- [ ] Real Stripe test keys + `stripe listen` forwarding.
- [ ] Production env vars + `bash scripts/build-standalone.sh --upload`.
- [ ] `curl https://app.daneg.ae/api/health` returns `{"status":"ok"}`.
- [ ] Sign up via the production URL and run AE1.
- [ ] 5+ beta users run AE1.
- [ ] Supabase Pro with PITR enabled.

## Code artifacts (29 commits)

- `docs/plans/2026-08-16-0347-feat-mooday-beta-launch-plan.md` (490 lines).
- `docs/plans/IMPLEMENTATION.md` (DoD ledger).
- `docs/audit-u1-mock-branches.md` (mock-mode branch inventory).
- `docs/progress-u2-auth.md`, `progress-u3-listings.md`, `progress-u4-resell.md`,
  `progress-u5-stripe.md`, `progress-u6-reviews.md`, `progress-u7-chat.md`,
  `progress-u8-social.md`, `progress-u8-follow.md`, `progress-u10-notifications.md`,
  `progress-u11-admin.md`, `progress-u12-u13-admin-block.md`,
  `progress-u17-polish.md`, `progress-u18-sentry.md`, `progress-u19-u20-backup-deploy.md`.
- `supabase/migrations/202608160429_u3_search_listings.sql`.
- `supabase/migrations/202608160446_u8_user_follows.sql`.
- `src/app/api/stripe/webhook/route.ts` (113 lines) + `route.test.ts`.
- `src/app/api/health/route.ts` + `route.test.ts`.
- `src/components/ErrorBoundary.tsx`.
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- `next.config.ts` updated with `withSentryConfig`.
- `package.json` updated with `stripe` and `@sentry/nextjs`.
- 12 `TODO(phase-1): <U-ID>` comments in `src/context/AppContext.tsx`.
- `src/services/backend/contracts.ts` adds: `ListingService.search`,
  `OrderService.createPaymentIntent`, `ChatService.subscribeMessages`,
  `NotificationService.subscribe`, `FollowService`.
- `src/services/backend/supabase.ts` implements the above plus
  `SupabaseFollowService`.
- `scripts/u3-u8-smoke.mjs` (smoke test for U3 + U8).
- `src/services/backend/{user-follows-migration,search-listings-migration,realtime,create-payment-intent,mock-helpers}.test.ts`.

## Known remaining work

The code is ready for production. The remaining work is operational:

1. **Deploy**: set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_*_KEY`,
   `STRIPE_*_KEY`, `SENTRY_*` env vars in `.env.production`, then run
   `scripts/build-standalone.sh --upload`.
2. **Migrations**: `npx supabase db push` to apply the new migrations.
3. **Supabase Pro**: enable PITR in the dashboard.
4. **Beta**: sign up via the production URL and run AE1 with 5+ users.
5. **Admin**: verify moderation works under 30 seconds.
6. **Block**: verify blocked users cannot view/message/review.

## Risks for the next session

- The mocked sections in `AppContext.tsx` are still gated by
  `if (!phase2Backend) return;`. They remain inert in production
  but should be removed in Phase 4 cleanup.
- `MOCK_OTP_CODE` references remain in non-prod paths. The UI helper
  is gated on `authMode !== "supabase"`.
- The hardcoded `<img>` tags (75 lint warnings) are pre-existing
  and not introduced by this session.
