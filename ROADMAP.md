# Mooday — Phase 1 Plan: Complete User-Facing Product

> **This document is the authoritative source of truth for Phase 1. Update it as scope changes.**

## Sponsor Brief (verbatim)

> The employer **does not** need a live demo for stakeholders. Phase 1's
> purpose is for **us** to build a **complete, polished, user-facing
> product** — independent of backend, server communication, or
> infrastructure concerns — so that when the backend lands, the UI
> contracts are already signed off and the only work left is replacing
> the mock layer with real API calls.
>
> **First, let's build a complete and precise product from the user's
> perspective.**

In short: **build the full app, end-to-end, on the frontend**. Mock
everything that needs to be mocked, but make it feel real. No half-built
flows, no "coming soon" placeholders where a real screen is expected.

---

## Scope of Phase 1

Phase 1 delivers **all 44 screens** documented in the showcase
(`public/showcase/index.html` § Page Inventory), grouped into eight
sections:

| # | Group | Screens | Status |
|---|-------|---------|--------|
| A | Onboarding & Authentication | 5 (01–05) | **Out of scope** for v0.1; the showcase flags these as pre-auth. Phase 1 starts from the post-auth experience. A "first-launch only" cold-start Welcome screen is **in scope** as a one-time splash, but full sign-up / OTP / sign-in flows belong to Phase 2. |
| B | Discovery & Browsing | 6 (06–11) | Partially built (3 of 6) |
| C | Buying & Checkout | 6 (12–17) | Partially built (3 of 6) |
| D | Listing & Selling (Resell) | 5 (18–22) | Partially built (1 of 5) |
| E | Rent Mode | 4 (23–26) | **Not started** — but explicitly listed as Phase 4 in the original showcase roadmap |
| F | Social & Communication | 5 (27–31) | Partially built (2 of 5) |
| G | Profile, Account & Settings | 7 (32–38) | Partially built (1 of 7) |
| H | Trust, Safety & Post-Purchase | 6 (39–44) | **Not started** |

> **Phase 4 (Rent) is out of scope for Phase 1.** The showcase roadmap
> itself lists Rent as a separate phase. The Rent group (E) is documented
> here for reference but is **not delivered** in this phase. The
> architecture must not, however, prevent Rent from being added later.

### Scope adjustments vs the original showcase

To keep Phase 1 scoped and shippable while still hitting "complete
user-facing product" intent, we make the following changes relative to
the showcase:

- **Group A (auth) → Phase 2.** The first-launch Welcome/Splash screen
  and the language picker live in Phase 1; the rest of the auth flows
  (Sign Up, OTP, Sign In, Forgot Password, Social Login) ship with
  Phase 2. Reason: these screens require a backend to be meaningful,
  and the sponsor explicitly excluded backend work from Phase 1.
- **Group E (Rent) → Phase 4.** Per the showcase's own roadmap. The
  `Product.type` field and the relevant data model pieces must be
  added now so Rent can be slotted in later without rework.
- **Group H (Trust & Safety) is fully in scope for Phase 1.** These
  screens (Reviews, Report, Return/Refund, Payouts, Block) are
  **local-first** by nature: a user can write a review, file a report,
  or block another user entirely without a server. They're perfect for
  the "complete product from the user's perspective" mandate.

### Effective Phase 1 screen count

| Source | Count |
|--------|-------|
| Group A — Welcome / Language picker only | 1 |
| Group B — Discovery & Browsing | 6 |
| Group C — Buying & Checkout | 6 |
| Group D — Listing & Selling (Resell) | 5 |
| Group F — Social & Communication | 5 |
| Group G — Profile, Account & Settings | 7 |
| Group H — Trust, Safety & Post-Purchase | 6 |
| **Total to deliver** | **36** |

---

## Mock-Data Strategy

The whole product must feel populated and real. A Discover feed with 20
items is acceptable for a prototype; it is **not** acceptable for a
"complete user-facing product." We treat the mock layer as production
data that happens to live in JSON files and localStorage.

### Data files to author (under `src/data/`)

| File | Contents | Approx. records |
|------|----------|------------------|
| `products.ts` (existing) | All listings | **100** items across all 6 categories, distributed across all 12+ sellers, mixed EN/AR, mixed condition, mixed isAuthentic, varied `saves` (10–1200) |
| `sellers.ts` (existing) | Seller profiles | **15** sellers (12 existing + 3 new) with distinct avatars, types, locations |
| `categories.ts` (existing) | Top-level + sub-categories | 6 top-level × 3–6 sub-categories each |
| `orders.ts` (new) | Buyer's purchase history | **15** orders across various statuses (Processing · Shipped · Delivered · Returned), with realistic dates and item mixes |
| `sales.ts` (new) | Seller-side orders received | **20** orders, with payout states (Pending · Available · Paid Out) |
| `reviews.ts` (new) | Public reviews per seller | **80+** reviews, 1–5 stars, varied text, verified-purchase flags |
| `addresses.ts` (new) | Saved addresses per user | **3** addresses (Home, Work, Other) |
| `paymentMethods.ts` (new) | Saved cards | **2** cards (Visa + Mastercard, last-4 + brand + expiry, no real PAN) |
| `notifications.ts` (new) | Activity feed events | **20+** events (chat, offer, follow, price-drop, like, item-saved) with mixed `isUnread` and realistic timestamps |
| `chats.ts` (default seed) | Initial chat thread for hand-off | 1 default thread, expanded to **3** demo threads |
| `blocks.ts` (new) | Blocked users list | **2** blocked users, demonstrating the unblock flow |

### Persistence

Every piece of state that would live on a server in production lives in
localStorage under namespaced keys:

```
mooday_lang
mooday_likes
mooday_cart
mooday_chats
mooday_listings
mooday_seed_version
mooday_orders
mooday_sales
mooday_reviews
mooday_addresses
mooday_payment_methods
mooday_notifications
mooday_blocks
mooday_unlocked_badges
mooday_user_profile
```

The `useLocalStorageState` hook (already in `src/lib/hooks.ts`) is
extended per-key as needed. A small `safeJson` utility (already inlined
in `useLocalStorageState`) handles parse errors and corrupted state.

### API Contract Seams (for Phase 3 handoff)

Every localStorage-backed value is read through a thin **service layer**
under `src/services/`. The service layer is the **only** place that
touches localStorage for app data. Components never read localStorage
directly.

```
src/services/
  listings.ts        // getListings, addListing, updateListing, deleteListing
  cart.ts            // getCart, addToCart, updateQuantity, removeFromCart, clearCart
  likes.ts           // getLikes, toggleLike
  chats.ts           // getThreads, createThread, sendMessage
  orders.ts          // getOrders, getOrderById
  sales.ts           // getSales, markShipped, markPaidOut
  reviews.ts         // getReviewsForSeller, addReview
  addresses.ts       // getAddresses, addAddress, updateAddress, deleteAddress, setDefault
  paymentMethods.ts  // getPaymentMethods, add, remove, setDefault
  notifications.ts   // getNotifications, markAsRead, markAllAsRead
  blocks.ts          // getBlockedUserIds, block, unblock
  userProfile.ts     // getProfile, updateProfile
  auth.ts            // getCurrentUser (mock for now, real in Phase 2)
```

Each service exports an **interface** that Phase 3 implements against
the real API. The localStorage-backed implementation is the v0.1
default. Components depend on the interface, not the implementation.

> **Critical:** No component in `src/components/` or `src/app/` may call
> `localStorage` directly. Enforced by an ESLint rule (see Tooling
> section).

---

## Gap Inventory (what Phase 1 must build)

Grouped by source-of-truth (showcase section). Each gap is a screen or
a fragment of a screen that does not yet exist or does not match the
showcase's depth. Numbers in parentheses reference the showcase item ID.

### Group A — Onboarding (partial)
- **A-01. Splash & Welcome** — first-launch cold-start screen with brand mark, tagline, EN/AR language picker, two CTAs ("Sign up" / "I already have an account"). The "Sign up" CTA is a no-op placeholder (Phase 2). The language picker sets the global language and is the actual entry point.
- (A-02 through A-05 deferred to Phase 2.)

### Group B — Discovery & Browsing
- **B-06. Discover Feed** — existing view. **Depth gap:** "tabbed lanes" (`For You · Trending · Designers · New In`) are missing; only `For You` exists. **Build:** add the three additional tabs as filter modes that re-sort the same dataset (no new data needed). Category chips are present.
- **B-07. Search & Filters** — existing view. **Depth gap:** showcase lists 6 filters (category, condition, **size, colour, price range, listing mode**). **Build:** add size, colour, price-range sliders, and a "Resell / Rent / Both" toggle. Add a real-time debounce to the search box (300 ms).
- **B-08. Search Results** — combined into the current `SearchFiltersView` (results live in the same screen). **No separate route needed**; just add the "Sort by" dropdown (Relevance, Newest, Price ↑↓) and the "Found N items" header that already exists.
- **B-09. Product Details** — existing view. **Depth gap:** missing shipping info block; missing sub-category breadcrumb; missing a tap-to-zoom on the gallery; missing the **"Shipping & returns"** collapsible section. **Build:** add these.
- **B-10. Category Landing Page** — **new screen**. Hero banner, sub-categories grid (Handbags · Clutches · Totes for "Bags", etc.), curated collection strip, featured sellers. Reached by tapping a category chip in the Discover feed.
- **B-11. Other User's Public Profile** — **new screen**. The current `UserProfileView` is the *own* profile; we need a read-only variant for *other* sellers, reachable from a product page (tap the seller card). Includes follow / message CTAs.

### Group C — Buying & Checkout
- **C-12. Shopping Bag (Cart)** — existing view. **Depth gap:** the showcase specifies a quantity stepper (✅ done), remove (✅ done), but also a "Save for later" action. **Build:** add the Save-for-later action (moves item to a saved-for-later list in localStorage without removing it from the bag).
- **C-13. Checkout — Address** — currently the first half of the combined `CheckoutFlowView`. **Build:** split into its own step component with a "Saved addresses" picker, "Add new" flow, and "Save as default" toggle.
- **C-14. Checkout — Payment** — currently the second half of `CheckoutFlowView`. **Build:** split into its own step with saved-card picker, "Add new card" inline form, **Cash on Delivery** option (disabled for orders > AED 5,000 — the showcase says so explicitly), and the free-shipping badge.
- **C-15. Order Confirmation** — existing view. **Acceptable as-is** with the success animation and tracking timeline; no build required.
- **C-16. My Purchases (Orders List)** — **new screen**. Lives in a new "Purchases" tab in the Vault. Each row: order ID, date, items thumbnail collage, total, status badge. Tap → opens order details.
- **C-17. Order Details & Tracking** — **new screen**. From a purchase row. Items, payment breakdown, shipping address, courier + tracking number, status timeline (Confirmed → Packed → Shipped → Out for delivery → Delivered), "Contact seller" and "Request return" actions.

### Group D — Listing & Selling (Resell)
- **D-18. Sell — Mode Picker** — **new screen**. The current `SellItemView` jumps straight into the form. **Build:** a two-tile picker: "Sell outright" (Resell) and "Rent out" (placeholder, disabled with "Coming in Phase 4" badge). Selecting Resell opens D-19. The picker is the new default landing for the Sell tab.
- **D-19. Create Listing — Resell** — existing `SellItemView` expanded. **Depth gaps:** up to **8 photos** (currently 1 via mock picker), brand field, size field, colour field, discount-% auto-calculation between asking and original price. **Build:** add a `photos` array state, photo-slot grid with reorder + remove, the missing fields, and a live "X% off retail" pill.
- **D-20. My Closet (Active Listings)** — **new screen**. Currently the "Closet" tab of `UserProfileView` shows the user's custom listings only. **Build:** replace with a proper tab that shows **all** listings the user owns (including demo seed listings attributed to the current user), with status pills (Active · Pending · Sold · Expired), bulk select, and per-item quick-edit.
- **D-21. Edit Listing** — **new screen**. Re-opens the D-19 form pre-filled.
- **D-22. My Sales (Orders Received)** — **new screen**. A new "Sales" tab in the Vault. Mirror of C-16 from the seller's perspective with payout states.

### Group E — Rent Mode
- **Out of scope for Phase 1.** The data model must carry a `mode: "resell" | "rent"` field (with default `"resell"`) and a `rentConfig?` slot (dailyRate, deposit, minDuration, maxDuration). UI does not render the Rent path beyond the disabled tile in D-18.

### Group F — Social & Communication
- **F-27. Activity Feed** — existing `ActivityView`. **Critical depth gap:** the showcase says "tap to jump to source" — the 5 event types each have a different target. **Build:** wire each event type to the correct jump (chat → thread, offer → product, follow → user profile, price-drop → product, like → product). Also: replace the hardcoded `notifications` array with a real notifications service reading from `notifications.ts` seed + the user's actual state.
- **F-28. Chats List** — currently the "Chats" tab of `UserProfileView`. **Depth gap:** no unread count, no pinned chats. **Build:** add unread badge (derived from a `lastReadAt` field per thread) and a "pin" action (toggle + sort pinned first).
- **F-29. In-app Chat Thread** — existing `ChatOverlay`. **Depth gap:** the showcase says "image attachments, voice notes, quick replies". **Build:** at minimum, support **image attachments** (a "+" button that opens a mock picker, adds an image bubble, and a "voice note" placeholder with a disabled tooltip "Coming soon"). "Make offer" and "Buy / Rent now" are already shortcuts; keep them.
- **F-30. Make an Offer** — **new feature, lives inside F-29.** A special message card type with Accept / Decline / Counter buttons. Add a `OfferMessage` type alongside `ChatMessage`. Auto-reply logic expands to recognise "offer" intent.
- **F-31. Notifications Centre** — **new screen**, distinct from F-27 Activity. A bell icon in the top app bar opens this. Sections: Orders, Messages, Offers, Followers, Price drops, App updates. "Mark all as read" + per-row deep links.

### Group G — Profile, Account & Settings
- **G-32. The Vault (My Profile Hub)** — existing `UserProfileView`. **Depth gap:** showcase says 6 tabs (Closet · Loves · Chats · **Purchases · Sales · Rentals**); current has 3. **Build:** add Purchases (C-16), Sales (D-22), and a "Rentals" placeholder tab with an empty state. The status timeline in C-17 lives inside Purchases.
- **G-33. Edit Profile** — **new screen**. Form to update avatar, display name, handle, bio, location, style preferences (sizes, favourite categories).
- **G-34. My Loves (Saved Items)** — currently the "Loves" tab. **Depth gap:** showcase says filters (Available / Sold / Price dropped) and "Share my Loves" link. **Build:** add filter chips + a Share sheet (uses the Web Share API where available, falls back to clipboard copy).
- **G-35. Saved Addresses** — **new screen**. List, add, edit, set default, delete. Per-address label (Home / Work / Other). Reachable from both the checkout flow and the Settings screen.
- **G-36. Saved Payment Methods** — **new screen**. List of saved cards (last 4 + brand + expiry, no PAN). Add / remove / set default. Apple Pay toggle.
- **G-37. Settings & Account** — existing `SettingsView`. **Depth gap:** only 2 sections exist (Account, Security). **Build:** add Notifications (push toggles per event type), Legal (Privacy · T&C · Escrow Policy), About (Version · Log out). Each section's items are real navigations or modals — no dead chevrons.
- **G-38. Help & Support** — **new screen**. Searchable FAQ (top 20 Qs hardcoded), contact-us form (category, order ID, description, photo), "Live chat with Mooday support" (re-uses the chat thread UI with a dedicated `support` thread), links to Community Guidelines and Escrow Policy.

### Group H — Trust, Safety & Post-Purchase
- **H-39. Leave a Review** — **new screen**. Shown as a CTA in the Order Details screen after a "Delivered" status. Star rating (1–5), text, 4 quick-tag chips (As described · Fast shipping · Great communication · Loved it), photos optional.
- **H-40. User Reviews (Public)** — **new screen**. Shown on a seller's public profile (B-11). Filter by rating. Verified-purchase badge. Reply option for the reviewed user.
- **H-41. Report an Item / User** — **new modal**. From a "…" menu on a product page or profile. Reason chips (Counterfeit · Offensive · Spam · Doesn't match description · Other), free-text, screenshot attach.
- **H-42. Request a Return / Refund** — **new screen**. From Order Details. Reason chips, description, photo proof. Triggers a local "dispute" record with a status timeline.
- **H-43. Payouts & Earnings (Seller)** — **new screen**. From the Vault's Sales tab. Available balance, pending balance, lifetime earnings, payout history, "Cash out" CTA (mock).
- **H-44. Block / Report User** — **new screen**. Privacy settings. Blocked-users list with unblock. The "Report user" flow is the same modal as H-41, opened from this list.

### Cross-cutting

- **A real toast/snackbar system** for action confirmations ("Listing published", "Item added to bag", "Report submitted"). Replaces the current `alert()` calls in `SellItemView` and the `setTimeout`-based banner in `ProductDetailsView`.
- **Image error fallback** — every `<img>` renders a styled placeholder on `onError`.
- **Loading skeletons** — every list view shows a skeleton grid on initial render (no real loading time, but the pattern is in place for Phase 3 when network latency exists).
- **Form draft persistence** — `SellItemView` (and any other multi-field form) saves a draft to localStorage on every change and restores on mount.

---

## Milestones

Each milestone ends with a clean commit, all tests green, the build
green, and a working `npm run dev`.

### M0 — Project setup & hygiene (already done)
Install vitest, configure CI, localStorage polyfill, CSP header,
`AGENTS.md`, `.env.example`. Already complete. (Touched up in the
Phase 1 work that led to this document.)

### M1 — Service layer skeleton
**Goal:** introduce the `src/services/` module with TypeScript interfaces
and a localStorage-backed implementation for every domain. All
components keep their current direct-context behavior; the services
are not yet wired in.

- Define the full service interface set under `src/services/`.
- Implement each with localStorage + seed fallback.
- Add an ESLint rule (`no-restricted-globals` for `localStorage` outside `src/services/` and `src/lib/hooks.ts`).
- Existing components continue to use the AppContext; no behaviour change.

**Done when:** `npm run lint` rejects any `localStorage` reference outside the allow-list, and the services folder compiles.

### M2 — Mock data expansion
**Goal:** populate `src/data/` so the app feels real. This is the
single biggest "feel" win in the phase.

- 100 products distributed across 6 categories × 12+ sellers.
- 15 orders, 20 sales, 80+ reviews, 3 addresses, 2 payment methods, 20+ notifications, 2 blocks, 1 user profile.
- All bilingual EN+AR. All with realistic dates, prices, and copy.
- Extend `Sellers` type to include `joinedAt`, `isVerified`, `responseRate`, `responseTimeHours`, `bio` (EN+AR), `styleTags` for the public profile.

**Done when:** the app shows realistic data on every screen; no `Lorem ipsum` remains.

### M3 — Group A: Splash & Welcome
- Build A-01 (cold-start welcome with language picker).
- First-launch detection via a `mooday_has_seen_welcome` key.
- Skip directly to Home for returning users.

**Done when:** clearing localStorage shows the welcome screen once, then Home on every subsequent visit.

### M4 — Group B: Discovery depth
- B-06 trending/designers/new-in tabs.
- B-07 extra filters (size, colour, price range, mode).
- B-08 sort dropdown.
- B-09 shipping info, sub-category breadcrumb, gallery zoom.
- B-10 category landing page.
- B-11 public seller profile.

**Done when:** all six screens are reachable and match the showcase depth.

### M5 — Group C: Checkout depth
- C-12 save-for-later.
- C-13 address step split.
- C-14 payment step split (with COD and saved cards).
- C-15 confirmed as-is.
- C-16 purchases list.
- C-17 order details + tracking.

**Done when:** a user can buy a product end-to-end and then find it in the Vault's Purchases tab with a status timeline.

### M6 — Group D: Sell depth
- D-18 mode picker (Rent tile disabled with "Coming in Phase 4").
- D-19 multi-photo, brand, size, colour, discount-% pill.
- D-20 closet with status pills + bulk select.
- D-21 edit listing.
- D-22 sales tab.

**Done when:** a user can list an item with up to 8 photos, see it in the closet with a status, edit it, and see sales when someone buys it.

### M7 — Group F: Social depth
- F-27 wire each event type to its source.
- F-28 unread count + pin.
- F-29 image attachments + voice note placeholder.
- F-30 make-an-offer inside chat.
- F-31 notifications centre (bell icon in top bar).

**Done when:** tapping a notification jumps to the right place, unread badges update, and an offer can be sent and accepted in chat.

### M8 — Group G: Account depth
- G-32 expand Vault to 6 tabs.
- G-33 edit profile.
- G-34 loves filters + share.
- G-35 saved addresses.
- G-36 saved payment methods.
- G-37 settings sections (Notifications, Legal, About).
- G-38 help & support.

**Done when:** every chevron in Settings leads somewhere real; the Vault has 6 working tabs.

### M9 — Group H: Trust & safety
- H-39 leave a review.
- H-40 public user reviews.
- H-41 report modal.
- H-42 return/refund request.
- H-43 payouts dashboard.
- H-44 block list.

**Done when:** a user can report, return, review, and block — all locally, all visible in the UI.

### M10 — Polish & cross-cutting
- Toast / snackbar system.
- Image error fallback.
- Skeleton loaders.
- Form draft persistence.
- Bilingual copy review (EN + AR) for every new string.
- Accessibility pass: focus trap for new modals, `aria-live` for toasts, role/aria-checked for new radio groups.
- Keyboard reachability audit.
- Color contrast audit against `bg-surface-container-low` for the new muted text.
- PWA update notification when the service worker changes.
- `next/image` migration (was deferred earlier; the data is now large enough that the migration is worth doing).

**Done when:** the `verify` script (`typecheck + lint + tests + build`) is green, the showcase's mobile frame renders the new screens correctly in both LTR and RTL, and no `alert()` or dead chevron remains in the codebase.

### M11 — Showcase sync
- Update `public/showcase/index.html` to embed the new screens (via `?view=` deep links) where the showcase's inv items reference them. Re-run the screenshot generator for the gallery.
- Re-check the Phase 1 claim ("The current build covers the full user journey end-to-end on the frontend") against the running app.

**Done when:** every showcase inv-item that should be live is live, and the gallery captures reflect the final UI.

---

## Tooling & Conventions

### Lint rules (added in M1)
- `no-restricted-globals`: forbid `localStorage` in `src/components/`, `src/app/`, and any test file outside the service layer.
- `no-restricted-syntax`: forbid `window.localStorage` direct reads the same way.
- Existing rules (`react-compiler` setState-in-effect, Tailwind class names, `<img>` vs `<Image />`) stay.

### Naming
- Routes: `/` (home app), `/welcome` (cold-start), `/admin` (Phase 2, scaffolded but auth-gated). The showcase's deep-link params (`?view=`, `?product=`, etc.) keep working.
- Service files: `src/services/<domain>.ts` exporting `<domain>Service` object with method-per-action.
- Mock data files: `src/data/<domain>.ts` exporting typed arrays. Hand-edited JSON, not generated (generation is Phase 3 territory).

### Bilingual copy
- All new strings live in a per-screen const object with `en` and `ar` keys. No `isAr ? "EN" : "AR"` inline. A small `t()` helper picks the active locale.
- Arabic copy is reviewed, not machine-translated. The seed data ships with hand-written AR text.

### Persistence
- All localStorage keys live in a single `src/services/storageKeys.ts` file. No magic strings.
- New keys bump `mooday_seed_version` so existing users re-seed on first load without losing their local data.

### Testing
- Service layer: 100% unit coverage. Every method, every edge case (empty list, corrupt JSON, quota errors).
- Components: smoke tests for the new screens (renders, key elements present, no console errors). Snapshot tests only for stable visuals.
- Flows: integration tests for the critical user journeys — list-an-item, buy-an-item, leave-a-review. These are the tests that must stay green.
- A11y: `axe-core` integration test on the rendered output of every screen.

### CI
- `npm run verify` runs `typecheck + lint + test:ci + build` on every PR. Already wired in `.github/workflows/ci.yml`.
- Lighthouse CI run on the main app and the showcase. Targets: Performance ≥ 80, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.

---

## Acceptance Criteria (Phase 1 "done")

The phase is complete when **all** of the following hold:

1. Every screen in the showcase's Page Inventory that is in Phase 1 scope exists in the running app, reachable, and matches the depth described in the showcase.
2. Tapping any notification, offer, follow event, or chat message opens the correct destination screen.
3. A user can complete the full buyer journey: discover → search → filter → product → save (love) → add to bag → checkout (address + payment) → order confirmation → find order in Vault → see tracking timeline → leave a review.
4. A user can complete the full seller journey: sell tab → mode picker → listing form (8 photos, brand, size, colour, bilingual title and description) → see in closet with status → edit listing → see sales when someone buys.
5. A user can complete the full social/trust journey: open a chat, send an image attachment, send an offer, accept the offer, leave a review, report a product, block a user, request a return, view payouts.
6. Bilingual (EN + AR) is complete and consistent across every new screen, modal, toast, and aria-label.
7. Keyboard navigation reaches every interactive element. No `<div onClick>` without a proper `ClickableCard` wrapper. No chevron without a destination.
8. No `alert()` calls remain in the app. Every action confirmation goes through the toast system.
9. `npm run verify` is green. Lighthouse scores meet the targets above.
10. `public/showcase/index.html` reflects the new state — every inventory item that is now live links to or embeds the live screen.

When all ten are met, Phase 1 ships.

---

## Out of scope (recorded for clarity)

- Real authentication (Group A items 02–05). Phase 2.
- Rent Mode (Group E). Phase 4 per the showcase roadmap.
- Backend, database, API, real-time chat. Phase 3.
- Payments, escrow ledger, real PSP. Phase 5.
- Native apps, push notifications. Phase 6.
- Real product photography (the showcase gallery uses the seed images).

These are tracked in the `ROADMAP.md` of the showcase (and above in
`/roadmap` of the original document). Phase 1 makes them possible; it
does not deliver them.
