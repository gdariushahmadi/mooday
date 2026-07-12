# C-16 / C-17 — My Purchases + Order Details

> **Screen IDs**: C-16 (My Purchases), C-17 (Order Tracking).
> **Status**: ✅ Built, tested, wired into the Vault profile.
> **Data**: New `src/data/orders.ts` — 15 seeded orders across the five
> canonical statuses.

---

## Why these pages exist

The Vault profile previously had no path to a buyer's purchase history.
After the C-13/14/15 checkout rework shipped, completing an order
should put that order in a list the buyer can revisit to track
shipments, see the courier, mark an item as received, and (later)
leave a review.

C-16 is the **list view**: all the buyer's orders, filterable by status
bucket. C-17 is the **detail view**: a single order's full tracking
timeline, courier info, items, and CTAs.

Both pages are fully local-first (mock data + localStorage via
`AppContext.orders`). When Phase 3 lands, the data source swaps to real
endpoints without any UI changes.

---

## C-16 — My Purchases

### User-visible behavior

- **Filter strip**: 4 horizontal chips — All · Active · Completed ·
  Cancelled. Defaults to "All".
- **Order list**: vertical list of order cards, newest first.
- **Empty state**: when the user has zero orders, shows a centred
  illustration + "Nothing here yet" + "Browse the feed" CTA.
- **Order card** shows:
  - thumbnail of the first line item (+ N more items if applicable)
  - status badge (Processing · Shipped · Delivered · Returned · Cancelled)
  - order date in the active language
  - product title (first item)
  - total in AED
- **Tapping a card** opens C-17 (Order Tracking).
- **"Contact seller"** on delivered orders is present but no-op for
  Phase 1 (will wire to chat in a later phase).

### Bilingual parity

- All status labels are AR-localised ("Processing" → "قيد المعالجة", etc.).
- "Order date" formatting uses `formatOrderDate(iso, isAr)` which
  produces "Jan 5, 2026" / "٥ يناير ٢٠٢٦".
- Root `<div dir={isAr ? "rtl" : "ltr"}>` per convention.

### Accessibility

- The filter strip is a real `role="tablist"` with `role="tab"` chips
  carrying `aria-selected`.
- Each order card is a `<ClickableCard as="article">` with
  keyboard activation (Enter / Space) and an `aria-label` that
  combines status + product + date for screen-reader users.
- "Contact seller" and "Leave a review" buttons inside delivered cards
  use `e.stopPropagation()` so tapping them doesn't also open the
  tracking screen.

### Wiring

- `src/types/navigation.ts` — `"purchases"` added to `ViewState` and
  `VALID_VIEWS`.
- `src/hooks/useAppNavigation.ts` — `openOrder(id)` and `closeOrder()`.
- `src/components/UserProfileView.tsx` — a new "My purchases" quick-action
  button sits above the existing tab strip on the Vault profile,
  showing the order count and navigating to C-16.

---

## C-17 — Order Tracking & Details

### User-visible behavior

- **Header**: order id (e.g. "ord-1000"), a left-aligned Back button that
  returns to C-16.
- **Status hero**: large icon + status name + the date the order was
  placed.
- **Courier card**: courier name + tracking number (mock — no real link).
- **Tracking timeline**: vertically-listed timeline events from
  `order.timeline`, rendered with a left-rail step indicator. The most
  recent event is "current" (filled circle), earlier events are
  "passed" (empty circle with connector line).
- **Items list**: each line item rendered as a clickable card showing
  the thumbnail, condition pill, qty, and line-total in AED.
- **Shipping + Payment cards**: 2-column summary showing the saved
  shipping city + street and the masked payment method
  ("Visa •••• 4242").
- **Order summary**: subtotal, shipping (or "FREE" in EN / "مجاني" in
  AR), and grand total.
- **CTA strip**: 
  - For `status === "shipped"`: **"I received it"** button — calls
    `onMarkReceived(order.id)` which flips the order to `delivered`.
  - For all statuses: **"Contact seller"** button — opens a chat
    thread with the first line item's seller.

### Status transition wiring

`onMarkReceived(id)` is wired to `AppContext.updateOrderStatus(id, "delivered")`
in `AppContent.tsx`. The updater appends a fresh timeline entry with
"Delivered — escrow released to seller" / equivalent AR copy. Phase 3
will replace this with a real API call.

### Accessibility

- Each timeline row is a real `<li>` with a `<ol>` parent for proper
  semantic ordering.
- Courier + tracking numbers use `font-mono` + `break-all` so wide
  monospace identifiers wrap rather than overflow.
- The status hero icon has `aria-hidden="true"` since its meaning is
  conveyed by the adjacent status text.

---

## Data model

`src/data/orders.ts` — new file. 15 mock orders covering all 5 statuses:

| Status | Count | Notes |
|--------|-------|-------|
| Processing | 2 | payment secured, awaiting courier pickup |
| Shipped | 4 | courier has it, in transit |
| Delivered | 7 | escrow released to seller |
| Returned | 1 | refund processed |
| Cancelled | 1 | buyer cancelled |

Exports:
- `OrderStatus` union, `ORDER_STATUSES`, `ORDER_STATUS_LABEL_EN`,
  `ORDER_STATUS_LABEL_AR`, `ORDER_STATUS_TONE`
- `OrderLineItem`, `OrderTimelineEvent`, `Order`
- `DEFAULT_ORDERS` (15 entries — each seeded with realistic dates,
  addresses, payment methods, courier refs)
- Helpers: `findOrder(orders, id)`, `statusLabel(status, isAr)`,
  `formatOrderDate(iso, isAr)`

---

## Test coverage

`src/components/MyPurchasesView.test.tsx` — 13 tests:
- title + back button + filter strip rendering
- filter changes scope the list (Active / Completed / Cancelled)
- status badge labels per order
- click handler calls `onOpenOrder(order.id)`
- empty state when no orders
- Arabic parity: title, status labels, dir="rtl"
- 4 filter chips visible

`src/components/OrderDetailsView.test.tsx` — 16 tests:
- order id + status + courier + tracking number rendered
- tracking timeline + line item + summary + CTAs
- "I received it" only appears for shipped orders
- both CTAs call their props (onMarkReceived / onContactSeller)
- back button works
- Arabic parity: status label, timeline copy, courier name, dir="rtl"

---

## Out of scope (deferred to later phases)

- Pagination (15 orders fits in a single scrolling list; Phase 3 will
  add pagination when real orders arrive).
- Search inside the purchase history.
- "Filter by date range" dropdown.
- "Write a review" CTA — that connects to **H-39 Reviews**, still to
  be built.

---

## Acceptance criteria (Phase 1 "done")

- ✅ C-16 — list with 15 seeded orders + filter chips + empty state
- ✅ C-16 — bilingual copy for every label
- ✅ C-16 — quick-action entry on the Vault profile
- ✅ C-17 — full order detail: status · courier · tracking · items ·
  shipping · payment · summary
- ✅ C-17 — "I received it" CTA flips shipped → delivered
- ✅ C-17 — "Contact seller" opens a chat thread
- ✅ C-17 — bilingual copy + AR-aware date formatting
- ✅ No new top-level dependencies
- ✅ `npm run verify` green across the board
