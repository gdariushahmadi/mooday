# Mooday — User Scenarios & Coverage Matrix

> **Audience**: anyone picking up the codebase (Phase-2 hand-off, QA, the sponsor).
> **Goal**: enumerate every realistic flow a buyer / seller / account-holder can do today,
> then mark exactly which screen, mutator, and seed-data file backs each step.
>
> **Built state at time of writing**: Phase 1 front-end complete per `docs/STATUS.md`. 36/36
> screens, 402 tests passing, `npm run verify` green. Mock data lives in `src/data/*.ts`.

---

## Personas

| Persona | Role | Path through the app |
|---------|------|----------------------|
| **Layla M.** (seeded user) | Power user — both buys and sells | She has 1 user record (`data/users.ts`), and acts as the buyer across most order fixtures. Anyone selling to Layla in `data/orders.ts` is one of the sellers in `data/sellers.ts`. |
| **Buyer-only** (no account) | Browse window-shopper, becomes buyer | Visits the welcome screen, signs up via email/social, then shops. |
| **Seller-only** | Lists a wardrobe, no purchase yet | Logs in → sells through the sell flow first → may buy later. |
| **Random visitor** | Cold launch, hasn't decided | Stops at the welcome screen / drops into the app without signing up. |

All of the above are simulated by the same app — there is one set of components, no
auth-gating after mock sign-in, and mock data is shared.

---

## 1. Cold-launch & Account creation

### 1.1 First-time visitor, just browsing

1. App opens → cold-launch screen `WelcomeView` (A-01).
2. Picks language (EN / AR); `dir` flips immediately to `rtl`.
3. Taps "Enter Mooday" → `useWelcomeGuard` marks `welcome_seen` so the screen never
   shows again for this browser.
4. Lands on **Discover feed** (`DiscoverFeedView`, B-06) — For You / Trending /
   Designers / New In tabs.

### 1.2 Visitor wants to buy without creating an account first

1. Visitor taps any **heart** icon to save a product → `toggleLike` fires (no
   account needed; likes are localStorage-bound to the device).
2. Visitor opens the cart (header bag icon) and hits "Checkout".
3. CheckoutFlow (C-13/C-14/C-15) walks them through address + payment.
4. At payment, "Place order" requires either a saved card or Apple Pay — both
   mock. They can place the order as a guest; the receipt shows.

**Coverage**:

| Step | Screen | Mutator | Doc |
|------|--------|---------|-----|
| Cold launch | `WelcomeView.tsx` | `useWelcomeGuard.markSeen` | `docs/welcome-screen.md` |
| Discover landing | `DiscoverFeedView.tsx` | `toggleLike` | `docs/discover-tabs.md` |
| Guest checkout | `CheckoutFlowView.tsx` | `recordOrder`, `clearCart` | `docs/checkout-flow.md` |

### 1.3 Sign up via email

1. From welcome, header `person` icon → `AuthSheet` opens.
2. "Create account" → `SignUpView` (A-02).
3. Form: name + email + phone + password + confirm + terms.
4. Submit → `signUp()` mutator. Auto-signs-in; navigates home.
5. Header chip flips from `person` to initial-avatar (`L` for Layla).

**Pre-seeded login for QA**: `layla@mooday.app` / `mooday123`.

### 1.4 Sign up via Google / Apple (mocked)

`SocialLoginView` (A-06) — both buttons call `signUp` with a mocked provider
email then `signIn`. Phase 2 will swap for real OIDC.

### 1.5 Sign in

`SignInView` (A-04) — email + password + remember-me. "Forgot password?" routes
to `ForgotPasswordView` (A-05), 3 steps: email → OTP → new password.

OTP mock code: **`000000`** for any email.

---

## 2. Discover & buy (buyer-side)

### 2.1 Browse the discovery feed

`DiscoverFeedView` (B-06) — tabs + category chips + product grid.

- **For You / Trending / Designers / New In**: 4 carousels per tab, each with
  6–10 hard-coded products (`data/products.ts` + `data/products-batch2.ts`,
  ~50+ listings).
- **Category chips**: tap → opens `CategoryLandingView` (B-10) for that category.

### 2.2 Filtered search

`SearchFiltersView` (B-07) — 6 filters + sort + debounced query. URL-synced via
`?view=search&q=...`. Filters:
category · subcategory · size · condition · price range · color · sort.

Empty state and "no results yet" both rendered.

### 2.3 Category landing

`CategoryLandingView` (B-10) — hero + sub-category chips + sort + grid.
Returns to home on back.

### 2.4 Inspect a product

`ProductDetailsView` (B-09) — breadcrumb, image carousel, zoom, full
description, condition, sizes, shipping accordion, **Report** menu.

CTAs:
- **Add to Bag** → `addToCart` (cart is shared across products)
- **Buy Now** → `checkoutProductDirect` (skips bag; goes to checkout with one item)
- **Message seller** → `startChat` (creates a thread if none exists; opens `ChatOverlay`)
- **Love** → `toggleLike`

### 2.5 Buy multiple items over time

`ShoppingBagView` (C-12) — qty stepper, remove, sold-by grouping (read-only hint).

**Save for later** moves a product out of the active bag into a persistent local list and can restore it to the bag after reload.

### 2.6 Checkout (C-13 / C-14 / C-15)

`CheckoutFlowView` (1245 lines) — 3-step single component:
1. **Address** — saved-address picker / new-address inline form.
2. **Payment** — saved-card picker / new-card form / Apple Pay / Cash on Delivery.
3. **Confirmation** — order placed timeline (mock pre-baked).

On success → `recordOrder(order)` → `clearCart()` → timeline screen.

Order timeline rendered from `data/orders.ts` pre-baked seeds.

### 2.7 View purchases + tracking

- **My Purchases** (`MyPurchasesView`, C-16) — list of all `useApp().orders`,
  filterable by status. Empty state.
- **Order Details** (`OrderDetailsView`, C-17) — full timeline + courier card +
  total + "Contact seller" + "Mark received" + "Leave a review" + "Report" +
  "Request return" + "Open dispute" + "View my disputes".

### 2.8 Leave a review

`LeaveReviewView` (H-39, write path) — 1–5 star picker + headline + body + up to
3 photo stubs. Submit → `addMyReview()` (persists in `mooday_my_reviews`).

Review shows up in:
- **`MyReviewsView`** (H-39, list)
- **`PublicSellerProfile`** (B-11) of the reviewed seller (read-only display).

### 2.9 Report a listing or a seller

`ReportView` (H-40) — reason picker + free-text body + photo stubs. Submit →
generates `caseNumber = MOODAY-10001+`. Visible in **`DisputesListView`** /
**`DisputeView`** as a related case.

### 2.10 Request a return / refund

`ReturnRequestView` (H-41) — reason + body. Submit → `openDispute()` on the same
order. Returns the user to **`OrderDetailsView`**.

### 2.11 Open a dispute against an order

`DisputeView` (H-44, detail) — pre-baked timeline + a "Chat with support" CTA
that opens the locally functional Help & Support hub.

`DisputesListView` (H-44, list) — all open + closed disputes, filtered by
reports + returns + standalone cases.

### 2.12 Block a seller

`BlockedUsersView` (H-43) — list of blocked users + unblock-with-confirm.
Block is triggered from **`PublicSellerProfile`** (B-11) → `blockUser()` mutator.
Once blocked, their listings don't appear in Discover/Search filters.

---

## 3. Discover & engage (social)

### 3.1 Activity feed

`ActivityView` (F-27) — today/earlier split, mark-all-read, deep-links to source
(chat thread, listing, notification type).

### 3.2 Chats list

`ChatsListView` (F-28) — search, pinned threads, composite avatars. Tap → opens
`ChatOverlay` (F-29) thread.

### 3.3 Chat thread (F-29 / F-30)

`ChatOverlay.tsx` — text composer + auto-seller-reply (rule-based on lower-cased
text). Includes the **Make-an-Offer card** (F-30) inline: a special message with
status pill (Pending · Accepted · Declined · Countered).

Tap "Buy now" from the chat → `checkoutProductDirect` from the active product.

### 3.4 Notifications centre

`NotificationsCentreView` (F-31) — bell-icon hub, 7 type filters, mark-all-read.
Opens source on tap.

### 3.5 Public seller profile

`PublicSellerProfile.tsx` (B-11) — bio, stats, listings grid, reviews list, "Block"
action, "Message" CTA.

---

## 4. List & sell (seller-side)

### 4.1 First-time seller picks a mode

`SellModePickerView` (D-18) — Resell vs Rent. Rent is grayed with a Phase-4 tooltip.

### 4.2 Create a resell listing

`SellItemView` → `listing/ListingForm.tsx` (D-19) — multi-photo, brand lookup,
size/color pickers, condition dropdown, discount %, draft autosave, "Submit".

Submit → `addListing()` appends to `mooday_listings` in localStorage. The new
listing shows up on the Discover feed and inside the seller's **My Closet**.

### 4.3 Manage the closet (D-20)

`MyClosetView.tsx` — status pills (Active · Sold · Draft · Reserved), bulk
select, edit/delete actions.

- **Edit** → `EditListingView` (D-21) pre-fills the form, `updateListing()`.
- **Delete** → `removeListing()` with confirmation.
- **Bulk** select-all + bulk delete.

### 4.4 My sales (D-22)

`MySalesView.tsx` — paid-out + available + pending balance cards, shipment
actions per status, in-transit/deli vered filters, payout history.

Tapping a sale opens `OrderDetailsView` — same component as the buyer-side;
shows the **seller** lens (ship → mark delivered).

### 4.5 Payouts hub (H-42)

`PayoutsView.tsx` — available/pending/paid balances, payout method display,
history list. Payouts are derived from `data/sales.ts` and `data/orders.ts`.

**Known Phase-2 gap**: there is no "Add payout method" CTA — adding a new bank
or wallet needs a real provider.

---

## 5. Profile, account & settings

### 5.1 Open the vault

`UserProfileView.tsx` (G-32) — 3 tabs (Loves · Closet · Chats). From each the
user jumps to:
- **Edit Profile** (G-33)
- **Saved Addresses** (G-35)
- **Saved Payment Methods** (G-36)
- **Settings** (G-37)
- **Help & Support** (G-38)

### 5.2 Edit profile

`EditProfileView.tsx` (G-33) — avatar + bio + style tags + city (Bilingual EN+AR).

### 5.3 Loves filter + share (G-34)

Likes inside `UserProfileView` → filter by category · share-as-collection
generates a copyable deep-link.

### 5.4 Saved addresses

`SavedAddressesView.tsx` (G-35) — CRUD (add / edit / remove) + set-default +
delete-confirmation.

### 5.5 Saved payment methods

`SavedPaymentMethodsView.tsx` (G-36) — CRUD + brand detection (Visa/Mastercard/Amex/ApplePay).

### 5.6 Settings (G-37)

Five sections, 14 items total:
1. **Account** — Edit profile · Addresses · Payment methods · Payouts
2. **Preferences** — Language picker · Push notifications · Dark mode
3. **Privacy & Safety** — Blocked users · Safe Escrow policy link
4. **About** — Clear cache · Help & support · Version

The Log Out button at the bottom is now functional (Phase-1 finalised):
- If signed in (`currentUser != null`) → reads "Log Out" → `signOut()` → home.
- If signed out → reads "Sign in" → routes to A-04.

### 5.7 Help & support (G-38)

`HelpSupportView.tsx` — FAQ accordion + order lookup + contact channels.

### 5.8 Trust & safety

- **Blocked users** (H-43) — list + unblock-with-confirm.
- **Report** (H-40) — listing/user.
- **Disputes** (H-44) — list + detail with chat-with-support CTA.

---

## 6. Cross-cutting scenarios (multi-feature)

### 6.1 End-to-end: signup → buy → review

1. Cold launch → `WelcomeView`.
2. `AuthSheet` → "Create account" → `SignUpView` → submit (success).
3. Header chip = initial avatar. Land on Discover.
4. Heart several items in `DiscoverFeedView`.
5. Tap a saved item → `ProductDetailsView` → "Add to bag" → `addToCart`.
6. Bag → `ShoppingBagView` → "Checkout" → `CheckoutFlowView` 3 steps → success.
7. `recordOrder` fires → cart cleared → order placed timeline rendered.
8. `MyPurchasesView` (from header person → settings → my purchases) → tap
   order → `OrderDetailsView`.
9. Mark received → status flips to `delivered`.
10. "Leave a review" → `LeaveReviewView` → submit → `MyReviewsView` shows it.

### 6.2 End-to-end: list → sell → ship → payout

1. Sign in (Layla).
2. Tap **Sell** tab → `SellModePickerView` → "Resell".
3. `SellItemView` form → fill → submit → `addListing()`. New item on Discover.
4. Another buyer buys it. New entry in `MySalesView`.
5. Tap sale → `OrderDetailsView` seller-lens → "Mark shipped" (picks `Aramex`,
   generates tracking number).
6. After buyer marks received, payout becomes *available*; seller taps
   **Payouts** → `PayoutsView` → see balance → (Phase 2: actually disburse).

### 6.3 End-to-end: complain → resolve

1. Buyer receives wrong item. `OrderDetailsView` → "Request return" → fills
   `ReturnRequestView` → submit → `openDispute()` on the order.
2. `DisputeView` opens with pre-baked timeline including the return request.
3. Seller sees the dispute in their **`DisputesListView`** (entry-point from
   settings or order details).
4. **Phase 3 placeholder** for chat-with-support modal.

### 6.4 Phishing-resistant UX

- Every form has `autoComplete` wired (`email`, `current-password`,
  `new-password`, `name`, `tel`).
- All passwords are **`type="password"`** so screen-recording tools blur
  them by default.
- Tab order is keyboard-friendly; every CTA is a `<button>`, not a styled
  `<div>`.

---

## 7. Coverage matrix

> ✅ = full coverage. 🟡 = partial. ❌ = missing. The numbers in the rightmost
> column are real line counts at HEAD; verify the doc after a big refactor.

### 7.1 Buyer flows

| Scenario | Primary screens | Mutator(s) | Source files | Lines | Status |
|----------|-----------------|------------|--------------|-------|--------|
| Cold launch & first browse | A-01 Welcome | `markSeen` | `WelcomeView.tsx` | 157 | ✅ |
| Sign-up | A-02 Sign Up | `signUp` | `SignUpView.tsx` | 291 | ✅ |
| Sign-in | A-04 Sign In | `signIn` | `SignInView.tsx` | 236 | ✅ |
| OTP verify | A-03 OTP | `verifyOtp`, `sendOtp` | `OtpView.tsx` | 239 | ✅ |
| Forgot password | A-05 | `resetPassword`, `sendOtp`, `verifyOtp` | `ForgotPasswordView.tsx` | 345 | ✅ |
| Social login | A-06 | `signUp`+`signIn` (mock) | `SocialLoginView.tsx` | 181 | ✅ |
| Quick sign-in from header | `AuthSheet` | (delegates) | `AuthSheet.tsx` | 106 | ✅ |
| Browse tabs | B-06 | `toggleLike` | `DiscoverFeedView.tsx` | 602 | ✅ |
| Search + filters | B-07 | debounced | `SearchFiltersView.tsx` | 678 | ✅ |
| Category landing | B-10 | `openCategory` | `CategoryLandingView.tsx` | 458 | ✅ |
| Product details | B-09 | `addToCart`, `toggleLike`, `startChat`, `submitReport` | `ProductDetailsView.tsx` | 686 | ✅ |
| Public seller | B-11 | `blockUser` | `PublicSellerProfile.tsx` | 529 | ✅ |
| Shopping bag | C-12 | `addToCart`, `updateQuantity`, `removeFromCart`, `clearCart` | `ShoppingBagView.tsx` | 214 | ✅ (no save-for-later) |
| Checkout | C-13/14/15 | `recordOrder` | `CheckoutFlowView.tsx` | 1245 | ✅ |
| My Purchases | C-16 | (read) | `MyPurchasesView.tsx` | 327 | ✅ |
| Order Tracking | C-17 | `updateOrderStatus` | `OrderDetailsView.tsx` | 462 | ✅ |
| Leave a review | H-39 | `addMyReview` | `LeaveReviewView.tsx` | 325 | ✅ |
| My Reviews | H-39 | (read) | `MyReviewsView.tsx` | 186 | ✅ |
| Report listing/user | H-40 | `submitReport` | `ReportView.tsx` | 327 | ✅ |
| Request return | H-41 | `openDispute` | `ReturnRequestView.tsx` | 299 | ✅ |
| Open dispute | H-44 | `openDispute` | `DisputeView.tsx` | 302 | ✅ |
| My disputes | H-44 | (read) | `DisputesListView.tsx` | 181 | ✅ |
| Block seller | H-43 | `blockUser` | `BlockedUsersView.tsx` | 209 | ✅ |
| Notifications | F-31 | `markNotificationRead`, `markAllNotificationsRead` | `NotificationsCentreView.tsx` | 249 | ✅ |
| Activity feed | F-27 | (read) | `ActivityView.tsx` | 290 | ✅ |
| Chats list | F-28 | `openChat` | `ChatsListView.tsx` | 213 | ✅ |
| Chat thread | F-29/F-30 | `sendChatMessage` | `ChatOverlay.tsx` | 513 | ✅ |
| Edit profile | G-33 | `updateUserProfile` | `EditProfileView.tsx` | 360 | ✅ |
| Saved addresses | G-35 | `addAddress`, `updateAddress`, `removeAddress`, `setDefaultAddress` | `SavedAddressesView.tsx` | 528 | ✅ |
| Saved payment methods | G-36 | `addPaymentMethod`, `removePaymentMethod`, `setDefaultPaymentMethod` | `SavedPaymentMethodsView.tsx` | 463 | ✅ |
| Settings | G-37 | various | `SettingsView.tsx` | 377 | ✅ |
| Help & Support | G-38 | (read) | `HelpSupportView.tsx` | 311 | ✅ |
| Log Out | G-37 | `signOut` | `SettingsView.tsx` | (above) | ✅ |
| Sign-out + sign-in as another user | A-04 + G-37 | `signOut`, `signIn` | (above) | — | ✅ |

### 7.2 Seller flows

| Scenario | Primary screens | Mutator(s) | Source files | Lines | Status |
|----------|-----------------|------------|--------------|-------|--------|
| Pick listing mode | D-18 | (none; routing) | `SellModePickerView.tsx` | 175 | ✅ |
| Create resell listing | D-19 | `addListing` | `SellItemView.tsx` + `listing/ListingForm.tsx` | 89 + 524 | ✅ |
| Edit listing | D-21 | `updateListing` | `EditListingView.tsx` | 92 | ✅ |
| My Closet | D-20 | `removeListing`, `updateListing` | `MyClosetView.tsx` | 474 | ✅ |
| Receive an order | D-22 | (read) | `MySalesView.tsx` | 350 | ✅ |
| Ship an order | D-22 + C-17 | `updateOrderStatus` | `OrderDetailsView.tsx` | (above) | ✅ |
| Payouts hub | H-42 | (read; Phase-2 write) | `PayoutsView.tsx` | 261 | 🟡 (read-only) |

### 7.3 Trust & safety

| Scenario | Primary screens | Status |
|----------|-----------------|--------|
| Leave a review (write) | `LeaveReviewView` (H-39) | ✅ |
| See my reviews | `MyReviewsView` (H-39) | ✅ |
| Read reviews on seller profile | `PublicSellerProfile` (B-11) | ✅ |
| Report a listing | `ReportView` (H-40) | ✅ |
| Report a user | same, from public profile | ✅ |
| Request a return | `ReturnRequestView` (H-41) | ✅ |
| Open a dispute | `DisputeView` (H-44) | ✅ |
| List my disputes | `DisputesListView` (H-44) | ✅ |
| Block a user | `BlockedUsersView` (H-43) | ✅ |
| Contact support during a dispute | `DisputeView` → `HelpSupportView` | ✅ |

### 7.4 Data layer (mock-first)

| Domain | File | Lines | Notes |
|--------|------|-------|-------|
| Users | `users.ts` | 94 | 1 seeded user (Layla); `MOCK_OTP_CODE = "000000"` |
| Products | `products.ts` + `products-batch2.ts` | ~600 | ~33 listings (13 + 20) |
| Sellers | `sellers.ts`, `seller-profile.ts`, `seller-meta.ts` | n/a | Used by product cards |
| Categories | `categories.ts`, `sub-categories.ts` | n/a | Discover feed + landing |
| Orders | `orders.ts` | 582 | 15 seeded orders across 5 statuses (makeId × 16 = 16 declarations of which 1 helper) |
| Sales | `sales.ts` | 159 | Derived from `orders` via `deriveSalesFromOrders()` — no separate seed list |
| Reviews | `reviews.ts` | 528 | 36 seeded reviews across sellers |
| My reviews | `my-reviews.ts` | n/a | `DEFAULT_MY_REVIEWS` seed |
| Notifications | `notifications.ts` | n/a | 7 types × multiple seed events |
| Addresses | `addresses.ts` | 98 | 3 seeded addresses |
| Payment methods | `paymentMethods.ts` | 63 | 2 seeded methods + Apple Pay |
| Blocked users | `blocked-users.ts` | n/a | 2 seeded |
| Reports | `reports.ts` | n/a | Seeded for Disputes list |
| Disputes | `disputes.ts` | n/a | Seeded timelines |

### 7.5 Mock data coverage (per `ROADMAP.md` Mock-Data Strategy)

| Required | Built | Actual | File |
|----------|-------|--------|------|
| `products.ts` (≥ 100) | ❌ | ~33 | `products.ts`+`products-batch2.ts` |
| `reviews.ts` (≥ 80) | ❌ | 36 | `reviews.ts` |
| `orders.ts` (15) | ✅ | 15 | `orders.ts` |
| `sales.ts` (20) | ✅ (derived) | 15 | `sales.ts` (`deriveSalesFromOrders`) |
| `notifications.ts` (20+) | ✅ | 20+ | `notifications.ts` |
| `addresses.ts` (3) | ✅ | 3 | `addresses.ts` |
| `paymentMethods.ts` (2) | ✅ | 2 | `paymentMethods.ts` |
| `blocks.ts` (2) | ✅ | 2 | `blocked-users.ts` |

---

## 8. Honest gaps (Phase 2 / 3 only — and within Phase 1)

These are **explicitly out of Phase-1** scope per `ROADMAP.md`. Listing them
here so the sponsor knows the boundary precisely.

### 8.1 Out-of-Phase-1 (deferred to Phase 2 / 3)

1. **Real auth backend** — passwords stored plaintext in localStorage.
   *Migration target*: hash + JWT before any production deployment.
2. **Real OTP / SMS / email** — currently `000000` for any email.
3. **Real Google / Apple OIDC** — currently mocked with hard-coded emails.
4. **Payment gateway** — Apple Pay + saved cards are placeholders, no
   transaction actually fires.
5. **Image hosting** — `/products/*.jpg` URLs only resolve if the static
   asset is served; no CDN, no broken-image fallback.
6. **Escrow / refunds** — order status flips are local-state-only. The
   "Mooday Safe Escrow" copy is meant as a UI placeholder.
7. **Seller-side payouts** — `PayoutsView` renders balances from
   `data/sales.ts`; no bank/wallet wiring, no disbursement flow.
8. **Push notifications** — read-only, no real subscription.
9. **Toast / snackbar system** — inline banners in a few places, not
   unified.
10. **Skeleton loaders** — mock data is instant; no shimmer.
11. **Image-error fallback** — no `onError` handlers yet.
12. **Real-time support chat** — the client routes dispute support to the functional Help hub; live-agent transport belongs to the backend phase.
14. **Service-layer abstraction** — `services/` folder not extracted;
    everything goes through `AppContext` directly. The seams Phase 3 needs
    would have to be introduced at that point.

### 8.2 Phase-1 gaps actually present today

These are real holes in what we shipped under "Phase 1":

1. **Mock data is thinner than `ROADMAP.md` demands** — the *Mock-Data
   Strategy* table in `ROADMAP.md` calls for `products.ts ≥ 100`,
   `reviews.ts ≥ 80`, `sellers.ts = 15`. Today we have **~33 products,
   36 reviews, and the seeded seller count is whatever ships in
   `sellers.ts`**. Bump `src/data/products.ts` with a third batch and
   expand `src/data/reviews.ts` to ~80 before the Phase-2 hand-off.
2. **AppContent defensive fallbacks leak scaffolding** — in 4 places
   (`leave-review`, `report`, `return-request`, `dispute`), when the
   expected prop is missing the view renders *another* view as a
   fallback (so the screen still renders). Once `ROADMAP.md` minimums are
   met these branches become dead code.
3. **PublicSellerProfile depends on `sellerId` only** — if the id points
   to a seller that isn't in `SELLERS`, the view degrades silently. A
   real Phase-2 must re-introduce fetching per-id.
4. **`createChatThread` lower-case heuristics** — the seller auto-reply
   in `ChatOverlay.tsx` is a deterministic function of the buyer text; a
   Phase-2 chat should hit a real "intent match" service.
5. **Auth screen 6 / "Use email instead"** — the social-login sheet
   claims "we won't ask your real Google password" which is fine for the
   preview, but Phase-2 needs the OIDC flow before any production call.

---

## 9. How to walk the app end-to-end in QA

Cold-start checklist for a fresh QA session:

1. `npm run dev --turbopack --port 3000` (or any free port).
2. Open `http://localhost:3000/`.
3. **Welcome** → pick "English".
4. Header person icon → `AuthSheet` → "Create account" → fill the form
   → terms accepted → submit. (You can also just click "Enter Mooday"
   then sign in as `layla@mooday.app / mooday123`.)
5. **Discover** → tap any product (or heart one).
6. **Bag** → checkout → fill address + any payment → "Place order". Order
   should appear under **My Purchases**.
7. **Settings → Log Out** → header goes back to person icon → sign in
   again with the same credentials.
8. **Sell** tab → Resell → fill the listing form → submit → it shows on
   the Discover feed.
9. **Vault → Closet** → tap your new listing → edit → save.
10. **Profile → Block a seller** → search tab → blocked profile is
    invisible.
11. **Help & Support** → expand a FAQ → "Contact support" shows the
    channel list (Phase-2 hooks).

Every path above can be repeated in RTL by switching the language picker
at any time — every component re-renders `dir="rtl"`.

---

*Last updated: end of Phase-1 / Group-A completion session.*
