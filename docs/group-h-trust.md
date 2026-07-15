# H-39 / H-40 / H-41 / H-42 / H-43 / H-44 — Trust, Safety & Post-Purchase

> **Screen IDs**: H-39 (Reviews), H-40 (Report), H-41 (Return/Refund),
> H-42 (Payouts), H-43 (Block list), H-44 (Disputes).
> **Status**: ✅ All six built, tested, and wired in.
> **Data**: New `my-reviews.ts`, `blocked-users.ts`, `reports.ts`,
> `disputes.ts`. AppContext extended with 4 new collections + CRUD.

---

## Why this session

Group H is the trust & post-purchase fabric. Before this session:
- Delivered orders had no review path.
- The Settings > Privacy > Blocked users was a dead placeholder.
- There was no Report flow (no listing / user moderation entry).
- No Return / Refund request.
- No dedicated seller-side Payouts hub.
- No Disputes list.

This session builds all six pages, wires them into the existing
order-details and settings entry points, and lays the data layer for
Phase 3 (real support integration + payouts).

---

## H-39 — Reviews (write + list)

Two views share the data:

### `LeaveReviewView` (write path)

Reachable from a delivered order's "Leave a review" CTA (C-17). The
order context drives the seller + product + verified-purchase flag.
The user picks a 1–5 star rating (radio group with star buttons), a
headline, a body, and up to 3 stub photos. On submit, calls
`addMyReview()` which persists into localStorage (`mooday_my_reviews`).

### `MyReviewsView` (list path)

Shows every review the user has authored, with the original order's
product (resolved from `useApp().orders`), star display, and the
verified-purchase badge.

### Data

```ts
export interface MyReview {
  id: string;
  orderId: string;
  sellerKey: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  photos: string[];
  date: string;          // ISO
  isVerifiedPurchase: boolean;
}
```

5 seed reviews delivered with the app (`DEFAULT_MY_REVIEWS`).

---

## H-40 — Report Listing / User

`ReportView` is reachable from:
- C-17 order details → `Report` button (order context passed as `target`).
- product detail (Phase 3) → target = the product.
- chat thread menu (Phase 3) → target = the seller.

A single screen handles both with a 2-option "kind" toggle:

### Flow

1. Choose target kind: **This listing** or **This seller**.
2. Pick a reason from the 6-tile grid (counterfeit, inappropriate,
   spam, wrong category, stolen, other).
3. Write a body.
4. Optionally add up to 3 photos.
5. Submit → `submitReport(input)` returns a generated `MOODAY-XXXXX`
   case number and shows a success screen.

### Data

```ts
export interface ReportRecord {
  id: string;
  caseNumber: string;            // "MOODAY-00001"
  kind: "listing" | "user";
  targetId: string;
  targetLabelEn: string;
  targetLabelAr: string;
  reason: ReportReason;
  body: string;
  photos: string[];
  status: "open" | "investigating" | "resolved";
  date: string;
}
```

1 seed report shipped (`DEFAULT_REPORTS`).

---

## H-41 — Return / Refund

`ReturnRequestView` is reachable from a delivered/returned order's
"Return / Refund" CTA (C-17). Flow:

1. Pick a reason from the 6-tile grid (not_received, wrong_item,
   damaged, not_as_described, counterfeit, other).
2. Write a body.
3. Optionally add up to 3 photos.
4. Submit → calls **both** `openDispute()` AND
   `updateOrderStatus(orderId, "returned")`. The order flips to
   "returned" status and a new dispute row appears in `disputes`.
5. Success screen with "Back to order".

### Escrow trust note

A banner surfaces the escrow protection guarantee:
> "Your money stays protected — the seller is paid only after we
> confirm the return."

---

## H-42 — Payouts

`PayoutsView` (sister to D-22 My Sales) is reachable from Settings >
Account > Payouts. Three sections:

1. **Available balance card** — gradient hero summing pending + available
   + lifetime paid-out across all sales.
2. **Method card** — default payout method (ENBD **** 8842 mock) +
   "Cash out now" CTA + "Manage payout methods" link.
3. **History list** — every sale row with payout pill (Pending /
   Available / Paid out) + shipment status + paid-out date.

### Reused

- `deriveSalesFromOrders(orders)` (D-22) — same source of truth.
- `shipmentLabel(status, isAr)` + `payoutLabel(status, isAr)` from
  `src/data/sales.ts`.

---

## H-43 — Blocked Users

`BlockedUsersView` is reachable from Settings > Privacy & Safety >
Blocked users (was a placeholder). Two actions per row:

- **Unblock** opens a confirmation modal (Cancel / Unblock). Phase 3
  can swap this for a soft-unblock with re-add-in-N-days affordance.

### Seeded data

2 blocked users with EN/AR names + reasons (`DEFAULT_BLOCKED_USERS`).

---

## H-44 — Disputes

Two views:

### `DisputeView` (detail)

Shows a single dispute's status hero + the order context + the
timeline (rendered from `dispute.timeline[]`). CTAs:
- **Chat with support** — Phase 3 wires real support inbox.
- **Back to order**.

Reachable from a returned-order's "View dispute" CTA in C-17.

### `DisputesListView` (top-level)

Lists every dispute the user has opened. Empty state with a CTA back
when no disputes exist.

### Data

```ts
export interface Dispute {
  id: string;
  orderId: string;
  reason: DisputeReason;
  body: string;
  photos: string[];
  status: "open" | "investigating" | "resolved";
  date: string;
  timeline: DisputeTimelineEvent[];
}
```

Starts with `DEFAULT_DISPUTES = []` (empty — disputes are only created
via H-41's submit). Timeline is pre-seeded with one "open" event at
creation time.

---

## Wiring

| Layer | Change |
|-------|--------|
| `src/types/navigation.ts` | added 8 new ViewStates: `"leave-review"`, `"my-reviews"`, `"report"`, `"return-request"`, `"payouts"`, `"blocked-users"`, `"dispute"`, `"disputes-list"`. |
| `src/hooks/useAppNavigation.ts` | added 16 new navigation handlers (open/close pairs for each view). |
| `src/context/AppContext.tsx` | added `myReviews`, `addMyReview`, `blockedUsers`, `blockUser`, `unblockUser`, `reports`, `submitReport`, `disputes`, `openDispute` (with persisted localStorage keys). |
| `src/data/my-reviews.ts` | new — `MyReview` type + 5 seed records. |
| `src/data/blocked-users.ts` | new — `BlockedUser` type + 2 seed records. |
| `src/data/reports.ts` | new — `ReportRecord` type + reason dictionary + 1 seed. |
| `src/data/disputes.ts` | new — `Dispute` type + reason dictionary + timeline-event type. |
| `src/components/LeaveReviewView.tsx` | new. |
| `src/components/MyReviewsView.tsx` | new. |
| `src/components/ReportView.tsx` | new. |
| `src/components/ReturnRequestView.tsx` | new. |
| `src/components/PayoutsView.tsx` | new. |
| `src/components/BlockedUsersView.tsx` | new. |
| `src/components/DisputeView.tsx` | new. |
| `src/components/DisputesListView.tsx` | new. |
| `src/components/SettingsView.tsx` | added "Payouts" entry + wiring `onOpenBlockedUsers` on Blocked users. |
| `src/components/OrderDetailsView.tsx` | added 5 new CTAs: Leave Review (delivered), Return (delivered/returned), View Dispute (returned), Report (any), All Disputes. |
| `src/components/AppContent.tsx` | new `case`s for all 8 views; settings + order cases wire the new callbacks. |
| `src/types/navigation.test.ts` | updated VALID_VIEWS list. |
| All test `makeContext` helpers | added `myReviews/addMyReview`, `blockedUsers/blockUser/unblockUser`, `reports/submitReport`, `disputes/openDispute`. |

---

## Test coverage

- `LeaveReviewView.test.tsx` — 8 tests.
- `MyReviewsView.test.tsx` — 5 tests.
- `ReportView.test.tsx` — 5 tests.
- `ReturnRequestView.test.tsx` — 5 tests.
- `PayoutsView.test.tsx` — 6 tests.
- `BlockedUsersView.test.tsx` — 7 tests.
- `DisputeView.test.tsx` — 8 tests.
- `DisputesListView.test.tsx` — 6 tests.

**+50 new tests**, total now **347** (was 297).

`npm run verify` is GREEN across the board:

- ✅ typecheck (0 errors)
- ✅ eslint (0 errors; existing `<img>` warnings only)
- ✅ **347 tests passing**
- ✅ production build

---

## Out of scope (deferred)

- **Real support inbox** — currently a Phase 3 placeholder.
- **Real refund flow** — the order flips to "returned" but no actual
  money movement happens until Phase 3.
- **Photo upload** — all photo fields are stub URLs (`first.product.image`).
- **Payout method management** — "Manage payout methods" is a Phase 3
  placeholder.
- **Review photos from user upload** — same Phase 3 dependency.
- **Review replies** (seller can respond to a buyer's review) — Phase 3.
- **Dispute chat with seller** — currently all disputes route to
  support; Phase 3 will open a tri-party chat.

---

## Acceptance criteria (Phase 1 "done")

- ✅ H-39 — Leave a review from a delivered order; list of my reviews
- ✅ H-40 — Report listing or user with reason + body + photos → case #
- ✅ H-41 — Return request flow that opens a dispute + flips order status
- ✅ H-42 — Payouts hub with balances + method + history
- ✅ H-43 — Blocked users list with confirm-unblock
- ✅ H-44 — Dispute detail + list with timeline + chat-with-support CTA
- ✅ All views bilingual EN/AR
- ✅ No new top-level dependencies
- ✅ `npm run verify` green

**Phase 1 is now 33/36 screens complete (92%).** Group A (Onboarding,
5 screens: Sign Up / OTP / Sign In / Forgot Password / Social Login)
is the only remaining scope, and it's deliberately Phase-2 per
`ROADMAP.md` so this session's run stops here.
