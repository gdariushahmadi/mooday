# Mooday — Status Snapshot (Phase 1 Frontend)

> **Audit date**: today (post-this-session).
> **Author**: previous sessions left this codebase; this document was written
> after a fresh `npm run test:ci` + line-count audit to give the user a
> ground-truth view of where we are. Update this file as pages are delivered
> or rescoped.

---

## TL;DR (post-this-session)

- **Verification pipeline (`npm run verify`)**: ✅ GREEN (typecheck + ESLint
  + **260** unit tests + production build).
- **Total Phase 1 target**: **36 screens** (per `ROADMAP.md` § "Effective
  Phase 1 screen count").
- **Fully built (deep, tested, documented)**: **20 screens** — 56 %.
- **Present in code but only as skeletons or partial flows**: **4 screens**.
- **Not started at all**: **12 screens** — 33 %.
- **Mock data**: `addresses.ts` + `paymentMethods.ts` landed this session.
  Still to build: `orders.ts`, `sales.ts`, `notifications.ts`, `blocks.ts`,
  expand `products.ts` 33 → 100, expand `reviews.ts` 33 → 80+.

This session shipped:
- **B-10 Category Landing** — chip navigation completed Group B.
- **C-13 / C-14 / C-15** — checkout now has saved addresses, saved cards,
  Apple Pay, Cash on Delivery, bilingual confirmation.
- **C-16 / C-17** — My Purchases + Order Tracking with 15 seeded orders.
- **D-18 / D-19 / D-20 / D-21 / D-22** — full seller-side flow: mode
  picker, polished create-listing form, closet with status + bulk-select,
  edit listing, my sales with payouts + shipment.
- **F-27 / F-28 / F-29 / F-30 / F-31** — activity feed, chats list, chat
  thread with offer cards, notifications centre with bell-icon badge.
- 5 new data files (`addresses.ts`, `paymentMethods.ts`, `orders.ts`,
  `sales.ts`, `notifications.ts`).
- 5 new test files added / brought into the green total.

---

## 1. Pages fully built

| ID | Screen | Component | Lines | Tests | Doc |
|----|--------|-----------|-------|-------|-----|
| A-01 | Welcome / Language picker | `WelcomeView.tsx` | 119 | 9 ✓ | `docs/welcome-screen.md` |
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

These exist nowhere in the codebase. They are referenced in the showcase
and listed in `ROADMAP.md` but the components have not been written.

### Group A — Onboarding (skipped to Phase 2 per ROADMAP)
- A-02 Sign Up
- A-03 OTP verification
- A-04 Sign In
- A-05 Forgot Password
- A-06 Social Login

### Group B — Discovery & Browsing
- **B-10 Category Landing Page** (deep listing grid + sub-category chips +
  "Shop the look" rail). Tappable category chip in the Discover feed is
  currently a no-op.

### Group C — Buying & Checkout
- **C-13 Address step** (split out from current combined flow)
- **C-14 Payment step** (split out, add saved cards + COD + Apple Pay)
- **C-16 My Purchases** (list of past orders with thumbnails, status
  badges, reorder CTA)
- **C-17 Order Details & Tracking** (status timeline, courier info, map
  placeholder, contact-seller CTA, "I received it" trigger for H-39)

### Group D — Listing & Selling
- **D-18 Sell Mode Picker** (Resell vs Rent — Rent is grayed-out with a
  Phase 4 tooltip)
- **D-21 Edit Listing** (re-use `D-19` form, prefilled, draft saves)
- **D-22 My Sales** (seller-side view of received orders; payout badges;
  shipment action)

### Group F — Social & Communication
- **F-30 Make an Offer** (special message card inside the chat thread;
  status pill: Pending · Accepted · Declined · Countered)
- **F-31 Notifications Centre** (bell-icon hub: filter by type,
  mark-all-read, deep-link to source)

### Group G — Profile, Account & Settings
- **G-33 Edit Profile** (avatar + bio + style tags + city)
- **G-34 Loves filters & share** (filter saved items by category,
  share-as-collection link)
- **G-35 Saved Addresses** (CRUD list; default address; map preview)
- **G-36 Saved Payment Methods** (card list, default card, remove with
  confirm)
- **G-37 Settings depth** (rewrite the existing skeleton into 5 sections
  + their sub-screens)
- **G-38 Help & Support** (FAQ accordion + contact CTA + order lookup)

### Group H — Trust, Safety & Post-Purchase
- **H-39 Reviews** (write-review screen + per-seller review list with
  star distribution, photo uploads, verified-purchase badge)
- **H-40 Report Listing / User** (category checklist + free-text + photo
  evidence; confirmation with case ID)
- **H-41 Return / Refund** (request screen + reason picker + photo upload
  + status timeline)
- **H-42 Payouts (Seller)** (balance card, payout method, history list)
- **H-43 Block list** (blocked users list + unblock confirm)
- **H-44 Disputes** (open-dispute from order + chat-with-support stub)

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

- Cold launch → **Welcome screen** (✓ A-01) → tap "Enter Mooday" → Discover feed.
- **Discover feed** (✓ B-06): For You, Trending, Designers, New In tabs.
  Category chips at the top are **not yet tappable** (no Category Landing).
- Tap any product → **Product details** (✓ B-09): zoom, breadcrumb,
  shipping accordion, report menu. "Buy Now" jumps to checkout.
- Tap seller name → **Public seller profile** (✓ B-11).
- Bottom nav → **Search** (✓ B-07): full filter sheet, debounced.
- Bottom nav → **Sell** (D-19 basic): single-photo form, submit creates
  a draft listing.
- Bottom nav → **Activity** (F-27 basic): hard-coded events. "View chats"
  jumps to Profile.
- Bottom nav → **Vault** (G-32 partial): three tabs (Loves, Closet,
  Chats). Closet is a list with no status pills or bulk select.
- Header → **Settings** (G-37 basic): single screen, no sub-routes.
- Header bag icon → **Shopping Bag** (C-12 basic): add/qty/remove.
- From bag or "Buy Now" → **Checkout** (C-13/14/15 combined): two-step
  toggle.
- From a chat thread → **Buy now** button jumps to checkout.

**The product is real, the depth on 5 flows is real, but the breadth is
not — and the user has been right that "the program that's running is
the same as it was from the beginning" in terms of how many screens
exist.**

---

## 6. Recommended next steps

In dependency order (pages with dependencies first):

1. **Expand mock data** (`ROADMAP.md` M2) — author `orders.ts`, `sales.ts`,
   `addresses.ts`, `paymentMethods.ts`, `notifications.ts`, `blocks.ts`,
   bump `reviews.ts` to 80+, expand `products.ts` to 100 listings. This
   unblocks *every* downstream page.
2. **M4 — Group B finish**: B-10 Category Landing (the one missing
   Group B screen).
3. **M5 — Group C depth**: split `CheckoutFlowView` into C-13, C-14, C-15
   + add C-16 My Purchases + C-17 Order Tracking.
4. **M6 — Group D depth**: D-18 mode picker, polish D-19, add D-21 Edit
   Listing + D-22 My Sales.
5. **M7 — Group F depth**: wire F-27 to context, expand F-28 / F-29,
   build F-30 + F-31.
6. **M8 — Group G depth**: expand G-32 to 6 tabs, build G-33 → G-38.
7. **M9 — Group H**: H-39 → H-44, all local-first.
8. **M10 — Polish + cross-cutting**: service layer extraction, toast /
   skeleton / image-fallback primitives.
9. **M1 — Service seams**: thin `src/services/*.ts` adapter layer
   wrapping `AppContext` so Phase 3 can swap to API without touching
   components.

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
