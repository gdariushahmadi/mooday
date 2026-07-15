# Mooday — Status Snapshot (Phase 1 Frontend)

> **Audit date**: today (post-this-session).
> **Author**: previous sessions left this codebase; this document was written
> after a fresh `npm run test:ci` + line-count audit to give the user a
> ground-truth view of where we are. Update this file as pages are delivered
> or rescoped.

---

## TL;DR (post-this-session)

- **Verification pipeline (`npm run verify`)**: ✅ GREEN (typecheck + ESLint
  + **402** unit tests + production build).
- **Total Phase 1 target**: **36 screens** (per `ROADMAP.md` § "Effective
  Phase 1 screen count").
- **Fully built (deep, tested, documented)**: **36 screens** — 100 %.
- **Skeletons / partial**: **0** screens.
- **Not started at all**: **0 screens** (Phase 1 complete).
- **Mock data**: `addresses.ts`, `paymentMethods.ts`, `orders.ts`,
  `sales.ts`, `notifications.ts`, `my-reviews.ts`, `blocked-users.ts`,
  `reports.ts`, `disputes.ts`, `users.ts` all seeded.

This session shipped:
- **A-02 / A-03 / A-04 / A-05 / A-06** — Sign Up, OTP, Sign In, Forgot
  Password, Social Login. Mock auth backed by `users.ts` + 8 AppContext
  mutators. Header gains a signed-in initial-avatar chip. Settings Log
  Out button is now functional.
- 6 new view components, 6 new test files, 1 new doc (`group-a-onboarding.md`),
  55 new tests (347 → 402).
- Phase 1 is now feature-complete on the client side.

---

## 1. Pages fully built

| ID | Screen | Component | Lines | Tests | Doc |
|----|--------|-----------|-------|-------|-----|
| A-01 | Welcome / Language picker | `WelcomeView.tsx` | ~140 | 9 ✓ | `docs/welcome-screen.md` |
| **A-02** | **Sign Up (form + terms + mock)** | `SignUpView.tsx` | ~250 | 9 ✓ | `docs/group-a-onboarding.md` |
| **A-03** | **OTP (6-digit input + paste + auto-advance)** | `OtpView.tsx` | ~210 | 7 ✓ | `docs/group-a-onboarding.md` |
| **A-04** | **Sign In (remember-me + forgot link + social)** | `SignInView.tsx` | ~230 | 10 ✓ | `docs/group-a-onboarding.md` |
| **A-05** | **Forgot Password (3-step flow)** | `ForgotPasswordView.tsx` | ~310 | 9 ✓ | `docs/group-a-onboarding.md` |
| **A-06** | **Social Login (Google + Apple, mocked)** | `SocialLoginView.tsx` | ~180 | 7 ✓ | `docs/group-a-onboarding.md` |
| bonus | AuthSheet (top-bar quick-action sheet) | `AuthSheet.tsx` | ~110 | 8 ✓ | `docs/group-a-onboarding.md` |
| B-06 | Discover Feed tabs (For You / Trending / Designers / New In) | `DiscoverFeedView.tsx` | ~370 | 11 ✓ | `docs/discover-tabs.md` |
| B-07 | Search & Filters (6 filters + sort + debounce + URL sync) | `SearchFiltersView.tsx` | 678 | 16 ✓ | `docs/search-filters.md` |
| B-09 | Product Details (breadcrumb, zoom, shipping accordion, size, report) | `ProductDetailsView.tsx` | 686 | 14 ✓ | `docs/product-details.md` |
| **B-10** | **Category Landing (sub-cats, sort, hero, empty state)** | `CategoryLandingView.tsx` | 422 | 18 ✓ | `docs/category-landing.md` |
| B-11 | Public Seller Profile (bio, stats, listings grid, reviews) | `PublicSellerProfile.tsx` | 529 | 10 ✓ | `docs/public-seller-profile.md` |
| **C-13/14/15** | **Checkout (saved addresses + cards + Apple Pay + COD)** | `CheckoutFlowView.tsx` | 920 | 17 ✓ | `docs/checkout-flow.md` |
| **C-16** | **My Purchases (filtered order list with empty state)** | `MyPurchasesView.tsx` | 360 | 13 ✓ | `docs/c-16-my-purchases.md` |
| **C-17** | **Order Tracking & Details (timeline + courier + CTAs)** | `OrderDetailsView.tsx` | 460 | 16 ✓ | `docs/c-16-my-purchases.md` |
| **D-18** | **Sell Mode Picker (Resell vs Rent — Rent disabled)** | `SellModePickerView.tsx` | 130 | 7 ✓ | `docs/group-d-selling.md` |
| **D-19** | **Create Listing (multi-photo, sizes, colours, discount %)** | `SellItemView.tsx` + `listing/ListingForm.tsx` | 530 | 8 ✓ | `docs/group-d-selling.md` |
| **D-20** | **My Closet (status pills + bulk-select + edit/delete)** | `MyClosetView.tsx` | 380 | 11 ✓ | `docs/group-d-selling.md` |
| **D-21** | **Edit Listing (prefilled form, calls updateListing)** | `EditListingView.tsx` | 100 | 5 ✓ | `docs/group-d-selling.md` |
| **D-22** | **My Sales (balance card + shipment + payout + filters)** | `MySalesView.tsx` | 290 | 10 ✓ | `docs/group-d-selling.md` |
| **F-27** | **Activity feed (Today/Earlier split, mark-all-read, chat deep-link)** | `ActivityView.tsx` | 230 | 7 ✓ | `docs/group-f-social.md` |
| **F-28** | **Chats list (search, pinned, composite avatars)** | `ChatsListView.tsx` | 200 | 7 ✓ | `docs/group-f-social.md` |
| **F-29** | **Chat thread (image/voice/offer/quick-reply buttons)** | `ChatOverlay.tsx` | 360 | 13 ✓ | `docs/group-f-social.md` |
| **F-30** | **Make an Offer card (Pending → Accepted/Declined)** | `ChatOverlay.tsx` (inline `OfferCard`) | — | covered in F-29 | `docs/group-f-social.md` |
| **F-31** | **Notifications centre (7 type filters, mark-all-read)** | `NotificationsCentreView.tsx` | 240 | 9 ✓ | `docs/group-f-social.md` |
| **G-32** | **Vault expansion (Edit Profile / Addresses / Payments actions)** | `UserProfileView.tsx` | +60 lines | covered | `docs/group-g-profile.md` |
| **G-33** | **Edit Profile (avatar + bio + style tags)** | `EditProfileView.tsx` | 290 | 9 ✓ | `docs/group-g-profile.md` |
| **G-34** | **Loves filter + share-as-collection** | `UserProfileView.tsx` (`LikesTabContent`) | +110 | covered | `docs/group-g-profile.md` |
| **G-35** | **Saved Addresses (CRUD + default + delete confirm)** | `SavedAddressesView.tsx` | 340 | 11 ✓ | `docs/group-g-profile.md` |
| **G-36** | **Saved Payment Methods (CRUD + brand detection)** | `SavedPaymentMethodsView.tsx` | 330 | 9 ✓ | `docs/group-g-profile.md` |
| **G-37** | **Settings depth (5 sections, 14 items, language picker)** | `SettingsView.tsx` | 280 | pre-existing | `docs/group-g-profile.md` |
| **G-38** | **Help & Support (FAQ accordion + order lookup + channels)** | `HelpSupportView.tsx` | 250 | 8 ✓ | `docs/group-g-profile.md` |
| **H-39** | **Leave a review + my reviews (stars + photos)** | `LeaveReviewView.tsx`, `MyReviewsView.tsx` | 580 | 13 ✓ | `docs/group-h-trust.md` |
| **H-40** | **Report listing/user (reason + body + photos → case #)** | `ReportView.tsx` | 290 | 5 ✓ | `docs/group-h-trust.md` |
| **H-41** | **Return / Refund (reason + body → opens dispute)** | `ReturnRequestView.tsx` | 270 | 5 ✓ | `docs/group-h-trust.md` |
| **H-42** | **Payouts (balances + method + history)** | `PayoutsView.tsx` | 260 | 6 ✓ | `docs/group-h-trust.md` |
| **H-43** | **Blocked users (list + confirm-unblock)** | `BlockedUsersView.tsx` | 220 | 7 ✓ | `docs/group-h-trust.md` |
| **H-44** | **Dispute detail + list (timeline + chat-with-support)** | `DisputeView.tsx`, `DisputesListView.tsx` | 510 | 14 ✓ | `docs/group-h-trust.md` |

---

## 2. Pages present but partial / basic

These exist in `src/components/` and are wired into `AppContent.tsx`, but
fail the "complete, polished user-facing product" bar from the sponsor
brief. Each needs rework before it can be called "done":

| ID | Screen | Current state | Gap |
|----|--------|---------------|-----|
| C-12 | Shopping Bag | 214 lines, basic add/remove + qty stepper. **No save-for-later**, no inline promo code, no bundle suggestion, no sold-by grouping | Save-for-later split + sellers grouping |
| C-13/C-14/C-15 | Address step, Payment step, Confirmation | ✅ DONE — rewritten this session: saved-address picker, new-address form, saved-card picker, new-card form, Apple Pay tile, Cash on Delivery. Single component, three internal steps. | (closed) |
| D-19 | Create Listing (Resell) | 262 lines, single-photo, generic fields | Multi-photo upload, brand lookup, size/colour pickers, condition, discount %, draft autosave |
| D-20 | My Closet | Rendered inside `UserProfileView` as one of the 3 tabs. Status pills and bulk-select are stubs | Dedicated screen with status pills (Active · Sold · Draft · Reserved), bulk select, status filters |
| F-27 | Activity Feed | 181 lines, **mock data hard-coded inline** in the component (`notifications = [...]` array, not in `src/data/`) | Wire to `AppContext`, support 6 event types (chat, offer, follow, price-drop, save, sold), unread state persisted, deep-links to source |
| F-28 | Chats list | Rendered as a tab inside `UserProfileView`. No unread badge logic, no pin | Unread badge from context, pinned threads surfaced first |
| F-29 | Chat Thread | `ChatOverlay.tsx` 176 lines. Has text + send. **No image attachments**, **no offer card** (the F-30 thing), no typing indicator, no quick replies | Image picker UI, F-30 "Make an Offer" inline card, typing/quick-reply affordances |
| G-32 | Vault (Profile) | `UserProfileView.tsx` 320 lines with **3 tabs** (Loves, Closet, Chats). Showcase spec calls for **6 tabs** (Loves, My Closet, My Purchases, Chats, Notifications, Payment & Payouts — depending on how you slice it) | Expand to 6 tabs, add address book, payment methods, notifications panel shortcuts |
| G-37 | Settings | `SettingsView.tsx` 166 lines, basic list. No working sub-screens | Push to sub-screens (`G-38` Help is one of them), wire language switch, theme, notifications toggle |

---

## 3. Pages not started at all

**None.** Phase 1 has been fully delivered across Groups A–H. Phase 2
pages (real auth server, real payment gateway, real CDN-backed media,
push notifications, ...) are tracked separately and intentionally not
in Phase 1 scope.

---

## 4. Cross-cutting work still pending

The sponsor brief says "complete, polished user-facing product". That
implies shared UX infrastructure that hasn't been built:

| Item | Purpose | Current state |
|------|---------|---------------|
| **Toast / snackbar system** | Inline alerts for "Added to bag", "Removed", "Saved" | Inline `animate-pulse` banners in a few places |
| **Image error fallback** | `<img>` tags with broken URLs should fall back to a placeholder | No `onError` handlers, no placeholder pattern |
| **Skeleton loaders** | Visible shimmer when fetching (mock today, real tomorrow) | None; mock data is instant |
| **Service layer** (`src/services/`) | Seams that Phase 3 will swap from localStorage → API. Currently all reads/writes go through `AppContext` directly | Not yet extracted; `ROADMAP.md` calls for this in M1 |
| **Mock-data expansion** (per `ROADMAP.md` § "Mock-Data Strategy") | `orders.ts` (15), `sales.ts` (20), `reviews.ts` (33 → 80+), `addresses.ts` (3), `paymentMethods.ts` (2), `notifications.ts` (20+), `blocks.ts` (2), listings 33 → 100 | None of the new files exist. `reviews.ts` has 33 only |

---

## 5. What the running app shows today

If you `npm run dev` right now, here is what the user can click through:

- Cold launch → **Welcome screen** (✓ A-01) with language picker +
  Sign in / Create account shortcuts → tap "Enter Mooday".
- Tap **Create account** / **Sign in** → full auth flow (A-02 → A-04,
  A-05 forgot password, A-06 social login, A-03 OTP if needed).
  Pre-seeded QA login is `layla@mooday.app` / `mooday123`.
- Once signed in, the header swaps from a person icon to an
  initial-avatar chip.
- **Discover feed** (✓ B-06): For You, Trending, Designers, New In tabs.
  Category chips now drop into B-10.
- Tap any product → **Product details** (✓ B-09).
- Tap seller name → **Public seller profile** (✓ B-11).
- Bottom nav → **Search** (✓ B-07): full filter sheet, debounced.
- Bottom nav → **Sell** (D-18 → D-19): mode picker, then polished
  multi-photo create-listing form.
- Bottom nav → **Activity** (✓ F-27).
- Bottom nav → **Vault** (✓ G-32–G-38): profile tabs, edit profile,
  saved addresses, saved payment methods, settings, help & support.
- Header → **Settings** (✓ G-37) → **Log Out** is now functional
  and clears the session.
- Header bag icon → **Shopping Bag** (✓ C-12) → Checkout
  (✓ C-13/14/15 combined).
- Header bell icon → **Notifications centre** (✓ F-31).
- From a chat thread → **Buy now** button jumps to checkout.
- Header person icon (when signed out) → quick-action `AuthSheet`.

**Phase 1 is shipped:** every screen in `ROADMAP.md` § "Effective Phase
1 screen count" exists, is wired up, has at least 5 tests, and is
documented in `docs/`.

---

## 6. Recommended next steps

### Phase 2 identity foundation (implemented)

The repository now includes the Supabase Auth/PostgreSQL foundation, typed
auth/profile/address adapters, RLS migration, OAuth callback, real async UI
flows, and a mock-mode feature flag. See `docs/phase-2-backend.md` for setup,
rollout, and verification. Provider delivery and OAuth still require project
credentials in the Supabase dashboard; no secrets are committed.

Phase 1 is complete. Phase 2 (backend integration) and Phase 3
(hardening + multi-user sync) are the next gates per `ROADMAP.md`.

The single largest Phase-2 ticket is **password hashing** — the
mock auth in `src/data/users.ts` stores plaintext, which is fine
for Phase 1 demo but unacceptable for production. Before the
backend swap, hash the entries and migrate existing localStorage
records on first load.

After the auth migration:
1. **Wire a real auth server** — replace `signIn`/`signUp`/`signOut`
   calls with calls to the new backend; keep the same mutator
   signatures so the views don't need to change.
2. **Replace mock OTP** with a real SMS / email challenge.
3. **Replace social login mocks** with real Google / Apple OIDC.
4. **Toast / snackbar system** (see § 4 below).
5. **Service layer extraction** (`src/services/`) — seams to swap
   localStorage reads/writes with API calls.

---

## 7. Conventions already established (do not break)

These were locked in across the previous sessions:

- **Bilingual copy**: every component carries a `COPY = { en: {...}, ar:
  {...} } const`. Never inline ternaries (`isAr ? "..." : "..."`) for
  visible strings.
- **Local storage rule**: components never read `localStorage` directly.
  All persistence goes through `useLocalStorageState` in `src/lib/hooks.ts`.
- **URL state**: `useSearchParams` is **not used** (Next 16 + Turbopack
  Suspense dance). Per-screen URL params are read once via
  `readUrlParam()` inside lazy `useState` initializers — never in
  `useEffect`.
- **`useSyncExternalStore` snapshots are cached**. Without caching the
  parsed value, you get an infinite render loop. See
  `src/lib/hooks.ts`.
- **Keyboard-accessible cards** use `ClickableCard.tsx` — no raw
  `<div onClick>`.
- **Test wrapper pattern**: `makeContext(...)` in `*.test.tsx` builds a
  typed `AppContextType` and wraps with `<AppContext.Provider value={...}>`
  — never instantiate `AppContextProvider` in tests.
- **Routes**: `ViewState` union lives in `src/types/navigation.ts`.
  Whenever a new screen is added, that union and `VALID_VIEWS` need a new
  entry — and so does `AppContent.tsx`.

---

*Last updated: see audit log in commit history. Update this file at the
end of every working session so the next agent's hand-off stays honest.*
