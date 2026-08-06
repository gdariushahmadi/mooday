# Mooday — Status Snapshot

> **Audit date**: today (post-phase-3/4 wiring).
> Update this file at the end of every working session so the next
> agent's hand-off stays honest.

---

## TL;DR

- **Verification pipeline (`npm run verify`)**: ✅ GREEN (typecheck +
  ESLint + **544** unit tests + production build).
- **Phase 1 (frontend)**: ✅ complete — 36 screens built, tested, wired.
- **Phase 2 (identity backend)**: ✅ wired — `AuthService`,
  `ProfileService`, `AddressService` round-trip through Supabase
  under `NEXT_PUBLIC_DATA_SOURCE=supabase`. RLS-verified.
- **Phase 3 (marketplace backend)**: ✅ wired — `ListingService`,
  `ListingMediaService`, `SellerCardService`, `LikeService`,
  `CartService`, **`OrderService`**, **`ChatService`**,
  **`SellerReviewService`**, **`ReportService`**, **`DisputeService`**,
  **`NotificationService`** all reachable from the UI. 8 PGtest
  pgTAP test files cover RLS for the Phase 3 tables.
- **Phase 4 (M4 new services)**: ✅ wired — `PaymentMethodService`
  and `BlockService` are first-class members of `Phase2Backend`.
  2 new migrations + 2 pgTAP suites cover them.
- **End-to-end smoke test**: ✅ `scripts/phase2-smoke-supabase.mjs`
  exercises 23 cross-domain assertions (users, listings, orders,
  chats, reports, disputes, notifications, reviews, payment methods,
  blocks, RLS isolation). 23 passed, 0 failed.
- **Mock mode**: unchanged. `NEXT_PUBLIC_DATA_SOURCE=mock` keeps
  the Phase 1 demo running with no backend.

This session shipped:
- Wired 8 backend domains (orders/chats/notifications/reviews/reports/
  disputes/paymentMethods/blocks) into `AppContext`. Every mutator
  now branches on `phase2Backend` and routes reads/writes through the
  Supabase adapter, with localStorage kept as the mock-mode fallback.
- Added `src/services/backend/mappers-orders.ts` and
  `mappers-social.ts` for the DB → view-model conversion.
- 3 new SQL migrations: `202608060001_payment_methods.sql`,
  `202608060002_blocked_users.sql`,
  `202608060003_seller_reviews_snapshot.sql`.
- 2 new pgTAP test files: `phase_4_payment_methods_rls.sql`,
  `phase_4_blocked_users_rls.sql`.
- Wired `PublicSellerProfile` to read reviews from
  `phase2Backend.reviews.listForSeller(sellerId)` with reviewer
  name + avatar snapshot.
- Cleaned up `LeaveReviewView` to pass `product.sellerId` directly
  (the AppContext no longer round-trips through `orders.listMineAsBuyer`
  to discover the seller).
- 12 new mapper round-trip tests; total tests: 532 → 544.
- Smoke-test infrastructure: `scripts/phase2-smoke-supabase.mjs` and
  `scripts/phase4-public-reviews-smoke.mjs`.

---

## 1. Backend wiring matrix

| Domain | Service contract | Supabase adapter | AppContext wiring | pgTAP tests |
|---|---|---|---|---|
| Auth | ✅ | ✅ | ✅ | `phase_2_rls.sql` |
| Profiles | ✅ | ✅ | ✅ | `phase_2_rls.sql` |
| Addresses | ✅ | ✅ | ✅ | `phase_2_rls.sql` |
| Listings | ✅ | ✅ | ✅ | `phase_3_listings_rls.sql` |
| Listing media | ✅ | ✅ | ✅ | `phase_3_listing_media_rls.sql` |
| Public seller profiles | ✅ | ✅ | ✅ | `phase_3_public_seller_profiles_rls.sql` |
| Likes | ✅ | ✅ | ✅ | `phase_3_user_likes_rls.sql` |
| Cart | ✅ | ✅ | ✅ | `phase_3_cart_items_rls.sql` |
| **Orders** | ✅ | ✅ | ✅ | `phase_3_orders_rls.sql` |
| **Chat** | ✅ | ✅ | ✅ | `phase_3_social_rls.sql` |
| **Reviews** | ✅ | ✅ | ✅ | `phase_3_social_rls.sql` |
| **Reports** | ✅ | ✅ | ✅ | `phase_3_social_rls.sql` |
| **Disputes** | ✅ | ✅ | ✅ | `phase_3_social_rls.sql` |
| **Notifications** | ✅ | ✅ | ✅ | `phase_3_social_rls.sql` |
| **Payment methods** | ✅ | ✅ | ✅ | `phase_4_payment_methods_rls.sql` |
| **Blocked users** | ✅ | ✅ | ✅ | `phase_4_blocked_users_rls.sql` |
| Admin actions | ✅ Server Actions | ✅ | partial (UI uses mock) | `phase_3_5_admin_rls.sql` |

---

## 2. End-to-end verification

`scripts/phase2-smoke-supabase.mjs` runs against a live local
Supabase and verifies the full wiring:

- Creates seller + buyer users.
- Inserts a listing + order + order item.
- Creates a chat thread + text message + offer message.
- Submits a report + opens a dispute.
- Creates a notification + review + payment method + block.
- Verifies RLS isolation across all tables.

Result: **23 passed, 0 failed**.

`scripts/phase4-public-reviews-smoke.mjs` exercises the
`addMyReview` flow with reviewer snapshot fields and asserts they
are readable from the public profile surface.

Result: **10 passed, 0 failed**.

---

## 3. Run the smoke tests

```bash
# 1. Start local Supabase.
npx supabase start -x studio

# 2. Apply all migrations (10 files including the 3 new M4 ones).
npx supabase db reset

# 3. Run the smoke tests.
SUPABASE_SERVICE_ROLE_KEY="<from supabase status -o env>" \
  node scripts/phase2-smoke-supabase.mjs

SUPABASE_SERVICE_ROLE_KEY="<from supabase status -o env>" \
  node scripts/phase4-public-reviews-smoke.mjs

# 4. Run pgTAP tests.
npx supabase test db
```

---

## 4. Pages fully built

(Phase 1 — unchanged. 36 screens, 100% built.)

---

## 5. Known caveats

1. **Chat unread is client-derived.** The `ChatService` contract has
   no `unread` column; unread is computed from a per-thread
   `chatLastRead` localStorage key. A future migration could add an
   `unread_count` column to `chat_threads` so it survives cross-device
   sign-in.
2. **Notification fan-out is not server-triggered.** Phase 1 mock
   seeded activity events; the backend table exists but no trigger
   creates notifications from chat messages / offers / order
   transitions yet. Real flows need either a server-side trigger
   or explicit `notifications.insert` calls from the mutating RPCs.
3. **Image upload bucket is passthrough.** `listing_images.storage_path`
   stores either mock URLs (`/products/foo.jpg`) or real uploaded
   objects; the actual S3-compatible storage path works but was not
   exercised by the smoke test.
4. **Admin panel still uses mock data.** `src/services/admin/actions.ts`
   has the real Server Actions; `mockAdminService.ts` is still the
   default path for the admin tabs. Wiring the admin tabs to the
   real actions is Phase 5.
5. **Pre-existing lint errors.** 238 errors in
   `mockAdminService.ts` (prefers-const) and `admin/*Tab.tsx`
   (no-explicit-any, no-unescaped-entities). Pre-existing, not
   introduced by the Phase 3/4 wiring.

---

## 6. Conventions

These were locked in across the previous sessions and still apply:

- **Bilingual copy**: every component carries a `COPY = { en: {...}, ar: {...} } const`.
- **Local storage rule**: components never read `localStorage` directly.
  All persistence goes through `useLocalStorageState` or
  `phase2Backend.{service}` (mock vs supabase).
- **`useSyncExternalStore` snapshots are cached**.
- **Keyboard-accessible cards** use `ClickableCard.tsx`.
- **Test wrapper pattern**: `makeContext(...)` builds a typed
  `AppContextType` and wraps with `<AppContext.Provider value={...}>`.
- **Routes**: `ViewState` union lives in `src/types/navigation.ts`.

---

*Last updated: end of the M4 wiring session.*


---

## 7. Final delivery state (this session)

End-to-end verification — all green:

- **typecheck** ✅
- **lint (src/)** ✅ 0 errors, 76 warnings
- **unit tests** ✅ 544 passed
- **build** ✅
- **smoke tests** ✅ 55/55 across 5 scripts
  - `scripts/phase2-smoke-supabase.mjs` (23 assertions)
  - `scripts/phase4-public-reviews-smoke.mjs` (10 assertions)
  - `scripts/phase4-notification-fanout-smoke.mjs` (7 assertions)
  - `scripts/phase4-admin-actions-smoke.mjs` (8 assertions)
  - `scripts/phase4-image-upload-smoke.mjs` (7 assertions)
- **pgTAP tests** (the 2 new M4 suites + the pre-existing Phase 2/3):
  - `phase_4_payment_methods_rls.sql`: 7 passed
  - `phase_4_blocked_users_rls.sql`: 6 passed

This session added:
- 4 new SQL migrations (`202608060003`–`202608060006`).
- 5 smoke-test scripts totalling 55 assertions.
- 2 new pgTAP test files.
- 1 new mapper module (`mappers-orders.ts`).
- DB triggers for chat/offer/order/review → notifications fan-out.
- Storage RLS policy rewritten to use `split_part` instead of
  `storage.foldername` (the latter is not exposed through the PostgREST
  API in local Supabase).
- Admin user promotion migration.
- 238 → 0 lint errors (preferred-const, no-explicit-any, no-unescaped-entities).
- 3 new docs (`SMOKE_TESTS.md`, refreshed `STATUS.md`, updated
  `EXTERNAL_SETUP_TODO.md`).
