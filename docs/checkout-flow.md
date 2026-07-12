# C-13 / C-14 / C-15 — Checkout, polished

> **Screen IDs**: C-13 (Address), C-14 (Payment), C-15 (Confirmation).
> **Status**: ✅ Reimplemented and tested.
> **Single component, three steps**: `CheckoutFlowView` handles all three
> internal steps but exposes the full Address step (saved-address picker)
> and Payment step (saved-card picker, Apple Pay, Cash on Delivery) that
> the showcase calls out as separate.

---

## Why this rewrite

The original `CheckoutFlowView` (committed before this session) only had a
two-step form: enter an address manually, then enter a card manually. It
offered no way to **use a saved address**, **use a saved card**, or
**pay cash on delivery**. The Phase 1 spec (`ROADMAP.md` § M5) requires
all three.

This rewrite reuses the existing single-component layout but swaps the
two forms for richer flows that pull from the user's `addresses` and
`paymentMethods` context (seeded by `DEFAULT_ADDRESSES` /
`DEFAULT_PAYMENT_METHODS` in `src/data/`).

Phase 3 will replace the localStorage-backed state with real API calls,
but the JSX and form state here stay unchanged.

---

## C-13 — Address step (`CheckoutAddressStep` sub-component)

### User-visible behavior

1. Renders a list of saved addresses (from `useApp().addresses`) as cards.
2. Each card shows the address label (Home / Work / Other), the recipient
   name + phone, street + district + city, and a "Default" pill if it's
   the default.
3. Pre-selects the default address on mount.
4. **"Add a new address"** link toggles the new-address form (name,
   phone, city select with all 7 UAE emirates, district, street+building,
   notes, + a checkbox to make it the new default).
5. Tapping the back arrow goes to the previous view (Shopping Bag or
   Discover).
6. **"Continue to payment"** validates required fields and advances to
   C-14.

### Accessibility

- Each address card is a `<label>` containing a real `<input type="radio">`
  so screen readers announce it as a radio option, not just a card.
- The `aria-label` on each radio combines the label + street
  (e.g. `"Home — Villa 24, Al Wasl Road"`).
- The city `<select>` has labelled options for both EN and AR.

### Bilingual parity

- The form labels, placeholders, and city names are AR-localised.
- The "Default" badge text comes from `COPY.defaultBadge` (EN "Default" /
  AR "افتراضي").

---

## C-14 — Payment step (`CheckoutPaymentStep` sub-component)

### User-visible behavior

1. Renders an escrow-policy note at the top (Mooday Safe Escrow).
2. Shows **three top-level payment-method tiles**:
   - **Card** (default) — opens the saved-cards list or new-card form.
   - **Apple Pay** — opens the one-tap panel.
   - **Cash** — opens the Cash on Delivery panel.
3. **Saved cards** are listed from `useApp().paymentMethods`. Each shows
   the brand + last-4, cardholder name, expiry, and a "Default" pill.
   Selecting one and tapping "Secure checkout" processes the order.
4. **"Add a new card"** opens a card form (cardholder, number, MM/YY, CVV).
   Inputs use `inputMode="numeric"` and re-format the number with
   4-digit grouping as the user types. Same for MM/YY.
5. **Back to address** returns to C-13.

### Card-number UX details

- Strips non-digits, limits to 16 digits.
- Reformats with a space every 4 digits as the user types.
- Expiry input limits to 4 digits and auto-inserts the `/` after the
  first 2 digits.

### Cash on Delivery

- Shows a `local_shipping` icon, the COD label, and a short body.
- No card fields; "Secure checkout (AED ...)" proceeds straight through.

### Accessibility

- Payment tiles are real `<button role="radio">` so screen readers see
  them as a radio group. The surrounding `<div role="radiogroup">`
  carries an `aria-label` in the active language.
- Card radios have `aria-label="${brand} ending in ${last4}"`.
- Card-number input has `autoComplete="cc-number"`, expiry has
  `cc-exp`, CVV has `cc-csc`.

---

## C-15 — Confirmation (`CheckoutConfirmation` sub-component)

Unchanged in design — same success icon + escrow copy + 3-step timeline
(`Payment secured` ✓ → `Awaiting seller pickup` → `In-Transit via Aramex`).
Now strictly bilingual at every label.

---

## Wiring

| Layer | Change |
|-------|--------|
| `src/data/addresses.ts` | New — `Address` type + `DEFAULT_ADDRESSES` (3 entries). |
| `src/data/paymentMethods.ts` | New — `PaymentMethod` type + `DEFAULT_PAYMENT_METHODS` (2 entries). |
| `src/context/AppContext.tsx` | Added `addresses`, `addAddress`, `updateAddress`, `removeAddress`, `setDefaultAddress`, `paymentMethods`, `addPaymentMethod`, `removePaymentMethod`, `setDefaultPaymentMethod`. State persisted to localStorage under `mooday_addresses` and `mooday_payment_methods`. |
| `src/components/CheckoutFlowView.tsx` | Rewritten: now reads from context, exposes the new flows. Confirmation screen unchanged in UX. |
| `src/components/CheckoutFlowView.test.tsx` | New — 17 tests covering C-13, C-14, and C-15 behaviour and bilingual copy. |
| *All existing test files* | Updated `makeContext` to seed the new fields with empty arrays + `vi.fn()` stubs (so `AppContextType` is fully populated). |

No route/navigation changes — C-13/14/15 still share a single
`ViewState = "checkout"` and the parent (`AppContent`) renders
`CheckoutFlowView` once. Internal step state is owned by the component.

---

## Test coverage

`src/components/CheckoutFlowView.test.tsx` — 17 tests:

**C-13 (8 tests)**:
- heading + saved addresses + Default badge
- pre-selects default · switching radios
- "Add a new address" reveals the new-address form
- Arabic: opens the new-address form with AR labels
- "Continue to payment" advances to step 2

**C-14 (7 tests)**:
- saved cards visible + default-selected
- 4 payment options (Card · Apple Pay · Cash)
- selecting each non-card option reveals its panel
- "Add a new card" reveals the new-card form (placeholder queries
  because the form's labels are JSX siblings, not `htmlFor`-linked)
- Back to address returns

**C-15 (2 tests)**:
- "Order placed" screen after payment completes (waits up to 3s for the
  simulated processing timer)
- order timeline with "Payment secured" + "Order Tracking" headline

`npm run verify` is green across the board:
- ✅ typecheck (0 errors)
- ✅ eslint (0 errors; 25 warnings, all pre-existing `<img>` tags)
- ✅ 152 tests (added 17)
- ✅ production build

---

## Out of scope (deferred)

- Real card tokenisation (Phase 3 + the PSP integration).
- True 3D-Secure / SCA challenge.
- Apple Pay sandbox (we show the surface; a Phase 3 task will wire it).
- Editing saved addresses inline on this page — that screen is
  `G-35 Saved Addresses`, still to be built.
- Editing saved payment methods inline — that screen is `G-36 Saved
  Payment Methods`, still to be built.

---

## Acceptance criteria (Phase 1 "done")

- ✅ C-13 — pick a saved address by default; toggle to "Add new"
- ✅ C-13 — bilingual labels and city options
- ✅ C-14 — pick a saved card, Apple Pay, or Cash on Delivery
- ✅ C-14 — add a new card inline with auto-format + numeric keyboard
- ✅ C-15 — bilingual confirmation + timeline
- ✅ No new top-level dependencies
- ✅ All copy lives in a `COPY` const (per convention)
- ✅ `Address` and `PaymentMethod` types re-exported for tests
- ✅ `npm run verify` green
