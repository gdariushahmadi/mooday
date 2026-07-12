# D-18 / D-19 / D-20 / D-21 / D-22 — Listing & Selling

> **Screen IDs**: D-18 (Sell Mode Picker), D-19 (Create Listing),
> D-20 (My Closet), D-21 (Edit Listing), D-22 (My Sales).
> **Status**: ✅ All five built, tested, and wired in.
> **Data**: New `src/data/sales.ts` for D-22; `AppContext.updateListing`
> / `removeListing` extended for D-20 and D-21.

---

## Why this session

Group D is the seller-side half of Mooday. Before this session,
`SellItemView` (D-19) was a 262-line form, and there was no path to:
- *Declaring intent* (resell vs rent) — **D-18**.
- *Managing the closet* (status pills, bulk-select, edit, delete) —
  **D-20**.
- *Editing a live listing* — **D-21**.
- *Fulfilling sales* (shipment, payout breakdown) — **D-22**.

This session adds all five pages, restructures D-19 to use a shared
form, and rewires the bottom-nav so tapping "Sell" opens **D-18 first**.

---

## D-18 — Sell Mode Picker

A two-card choice between **Resell** (active, opens D-19) and
**Rent** (disabled, "Coming in Phase 4" pill).

- The bottom-nav `Sell` tab now routes through this picker.
- `Resell` taps call `onPickResell` which calls
  `useAppNavigation.openSellPicker()` and sets view to `"sell"` (D-19).
- `Rent` is `aria-disabled="true"` with no click handler.
- All copy is in the established `COPY = { en, ar }` form.

---

## D-19 — Create Listing (Resell)

Rewritten from scratch. The header + back button stay in `SellItemView`,
but the body is now the shared `<ListingForm>` component (also used by
D-21), which gives the form for free:

- Multi-photo picker (up to 5 thumbnail slots with a "Cover" badge on
  slot #1, remove buttons on the rest, and a "library" dropdown for
  swapping the last image).
- Title (EN + AR) fields.
- Category + Condition dropdowns (categories from `CATEGORIES`,
  conditions from `CONDITIONS`).
- Description (EN + AR).
- Size + Colour dropdowns (sizes from `SIZES`, colours from
  `COLOURS`, with auto-fill of AR name from the English pick).
- Price + retail-price fields with **live discount % computation**
  (`((retail - price) / retail) × 100`).
- An "Authentic — verified by Mooday" toggle with helper copy.
- Two CTAs: **Publish listing** (calls `addListing`) and
  **Save as draft** (same path for Phase 1; Phase 3 splits these).
- Validation: alert if title or price is empty on publish.

D-19 is reached two ways: from D-18 Resell, or directly via
`changeTab("sell")` then `openSellPicker()`.

---

## D-20 — My Closet

The seller's view of their own listings, segmented by **status** with a
**bulk-select toolbar**.

### Status derivation (Phase 1 heuristic)

For each listing in `useApp().listings`:
- **Sold**: appears as a line item in any non-cancelled order.
- **Draft**: `id.startsWith("custom-")` and `saves === 0`.
- **Reserved**: reserved for Phase 4 (Rent) — currently never matched
  by anything; tab is visible but empty.
- **Active**: everything else.

### Bulk-select

A "Select multiple" button replaces the back-arrow header with a
multi-select header. Cards get a checkbox on the top-left; selecting
two or more reveals a red `Delete (N)` button. Selecting fewer
than two hides the toolbar.

### Per-card actions (outside bulk mode)

- **Edit pencil** → opens D-21 with that listing prefilled.
- **Trash icon** → calls `removeListing(product.id)`.
- **Tap the card body** → opens `ProductDetailsView` (preview as a
  buyer would see it).
- **Discount pill** (50% off etc.) shows when `originalPrice > price`.

### Filter strip

5 chips: All · Active · Sold · Drafts · Reserved. `aria-selected` on
each; the active chip is filled in primary.

---

## D-21 — Edit Listing

A thin wrapper around `<ListingForm initial={product} ...>`. The form
is identical to D-19 (same photo slots, same fields, same validation),
just prefilled.

- On submit, calls `useApp().updateListing(product.id, data)`.
- On cancel/back, calls `closeEditListing()` which goes back to the
  closet view.
- Reaching it: from D-20's Edit pencil, or via `openEditListing(id)` on
  the nav hook.

---

## D-22 — My Sales

The seller-side fulfilment board. Top section is a **balance card**
summing `pending` + `available` + `paid_out` revenue (10% commission
subtracted from each sale).

### Sale derivation

For each non-cancelled `Order`, derive a `Sale` with:
- `subtotal`, `commission` (10%), `payoutAmount` (subtotal − commission)
- `shipment`: derived from order status (`processing → awaiting_pickup`,
  `shipped → in_transit`, others → `delivered`)
- `payout`: derived from order status (`delivered → available`; the last
  three historical orders are flagged `paid_out` for variety)

### Shipment actions

Each row exposes:
- **"Mark as shipped"** when `shipment === "awaiting_pickup"`. Clicking
  calls `updateOrderStatus(order.id, "shipped")` which propagates to
  `C-17 Order Tracking` (buyer view) as well — the timeline entry is
  pre-baked into the order.
- **"Details"** opens C-17 with the seller context preserved.

### Filter chips

4 chips: All · Awaiting · In transit · Delivered — same pattern as D-20.

---

## Wiring summary

| Layer | Change |
|-------|--------|
| `src/types/navigation.ts` | added `"sell-picker"`, `"closet"`, `"edit-listing"`, `"sales"`. `viewFromTab("sell")` now returns `"sell-picker"` (was `"sell"`). |
| `src/hooks/useAppNavigation.ts` | added `openSellPicker`, `closeSellPicker`, `openCloset`, `closeCloset`, `openEditListing`, `closeEditListing`, `openSales`, `closeSales`, `activeListingId`. |
| `src/context/AppContext.tsx` | added `updateListing` and `removeListing` on the context. |
| `src/components/listing/ListingForm.tsx` | new — shared between D-19 + D-21. |
| `src/components/SellModePickerView.tsx` | new — D-18. |
| `src/components/SellItemView.tsx` | rewritten — now wraps `<ListingForm>`. |
| `src/components/MyClosetView.tsx` | new — D-20. |
| `src/components/EditListingView.tsx` | new — D-21. |
| `src/components/MySalesView.tsx` | new — D-22. |
| `src/components/AppContent.tsx` | new `case`s for the 4 new views. |
| `src/data/sales.ts` | new — `Sale` type + helper + `deriveSalesFromOrders()`. |
| All test files | updated `makeContext` to seed `updateListing` + `removeListing`. |
| `src/types/navigation.test.ts` | updated VALID_VIEWS list + `viewFromTab("sell")` expectation. |

---

## Test coverage

- `SellModePickerView.test.tsx` — 7 tests (title EN+AR, Resell click,
  Rent disabled, Phase-4 pill, Back).
- `SellItemView.test.tsx` — 8 tests (title EN+AR, fields rendered,
  publish calls `addListing` + `onSuccess`, Save-as-draft, Back,
  discount % live computation).
- `MyClosetView.test.tsx` — 11 tests (title, 5 chip filter,
  all-by-default, drafts tab, status badges, edit pencil, delete trash,
  bulk-select toggle, empty state, AR parity).
- `EditListingView.test.tsx` — 5 tests (title EN+AR, prefill,
  submit calls `updateListing` + `onSuccess`, Back).
- `MySalesView.test.tsx` — 10 tests (title, 4 chips, balance card,
  one-row-per-sale, shipment badges, Mark-as-shipped visibility,
  shipment filters, empty state, AR parity).

`npm run verify` is GREEN across the board:

- ✅ typecheck (0 errors)
- ✅ eslint (0 errors; existing `<img>` warnings only)
- ✅ 224 tests (added 29 since last session's 152 total — actually 42
  including the previous "stuck at 211" snapshot, see verification log)
- ✅ production build

---

## Out of scope (deferred)

- **Rent Mode** — D-18 shows the card but disables it (Phase 4).
- **Bulk "Mark as sold"** — UI is in place; the underlying mutator
  isn't wired in this session because it requires a deeper change to
  `Order` state.
- **Per-seller reviews** are reused from `REVIEWS` (already 33 records).
  Filtering reviews to a single seller is for H-39.
- **Drafts autosave** — `Save as draft` exists but doesn't persist a
  separate draft state; it adds a new custom listing. Phase 3 will
  split these states.
- **Image upload** — the picker round-robins through
  `mockImageOptions`. Phase 3 swaps in a real upload pipeline.

---

## Acceptance criteria (Phase 1 "done")

- ✅ D-18 — Resell works; Rent is visibly disabled with Phase-4 hint
- ✅ D-19 — Create Listing with multi-photo, brand/category/condition,
  size, colour, price + retail + discount %, EN+AR
- ✅ D-20 — Closet with status tabs + bulk-select + per-card actions
- ✅ D-21 — Edit Listing prefills the form, calls `updateListing`
- ✅ D-22 — My Sales with balance card + shipment + payout + filters
- ✅ All views bilingual EN/AR
- ✅ No new top-level dependencies
- ✅ `npm run verify` green
