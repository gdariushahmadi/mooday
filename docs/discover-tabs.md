# Discover Feed Tabs — B-06 Implementation

## Goal
Add three additional tabs to the existing Discover feed: **Trending**,
**Designers**, and **New In**. Each tab re-sorts or filters the same
underlying listing dataset — no new data needed. The existing
"For You" tab becomes the default landing.

## Behavior
- **For You** (existing): a curated mix in the current order, mirroring
  the current `DiscoverFeedView` output.
- **Trending**: listings with the highest `saves` count first, regardless
  of category. Mimics the showcase's "most-loved pieces right now" feel.
- **Designers**: listings grouped by seller name. Each seller's name
  appears as a section header; their listings are shown as a horizontal
  scroll row (or a small grid) underneath. Tapping a listing still
  opens the product page.
- **New In**: listings sorted by a synthetic "newest first" sort. Since
  our seed data doesn't carry a `createdAt` field, we use the
  `listing.id` as a stable proxy: ids starting with a `batch2-` prefix
  are newer than base-product ids. This is a Phase-1 mock; Phase 3
  will use a real `createdAt` timestamp.

## Distinct from "Featured" view mode
The current Discover has a **Featured / Compact view toggle** (in the
categories row). That's a layout switch — it doesn't change the data
ordering. The new tabs change the data ordering. Both coexist.

## Tab state
- Tab state lives in the `DiscoverFeedView` component (not in the
  navigation hook — it's a per-screen piece of UI state, not a route).
- The active tab is reflected in the URL via a `?tab=trending|designers|newin`
  query param. This makes the tabs shareable via URL, just like the
  existing `?view=` deep link.
- When the category chip is changed, the tab stays where it is — but the
  filtered list still respects the category. (Same as today.)

## Components

### 1. `DiscoverFeedView` changes
- A horizontal tab bar above the category chips. The bar shows four
  pills: "For You · Trending · Designers · New In" (EN) / "لكِ · الرائج · المصممون · وصل حديثاً" (AR).
- Active pill: `bg-primary text-on-primary border-primary font-bold`.
- Inactive: outlined, hovers to surface-container-high.
- Switching a tab is instant (no network call). Each tab has its own
  derived list:
  - `For You`: `listings` as-is.
  - `Trending`: `[...listings].sort((a, b) => b.saves - a.saves)`.
  - `Designers`: grouped by `sellerNameEn` into sections.
  - `New In`: `listings` sorted so that `batch2-` ids come first, then
    by `saves` desc as a tiebreaker.
- `useState` is replaced with a derived value from the URL:
  `searchParams.get("tab")`. This keeps tabs shareable.
- `aria-selected` on each tab, `role="tablist"` on the container.
- Keyboard: Left/Right arrows move between tabs.

### 2. URL wiring
- `useAppNavigation` does not need to change. Tabs are per-screen,
  not top-level navigation.
- `?tab=` is read with a lazy initializer in the tab state. If the
  param is invalid, default to "foryou".

## Test coverage

### `src/components/DiscoverFeedView.test.tsx` (new tests; existing
ones stay green)

- Renders the four tab labels in EN.
- Renders the four tab labels in AR.
- Default tab is "foryou" when no ?tab= is present.
- Clicking "Trending" re-sorts the list to put the highest-saves
  product first.
- Clicking "New In" re-orders the list so batch2 products come first.
- Clicking "Designers" shows seller names as section headers.
- `aria-selected` reflects the active tab.
- Tab buttons are keyboard reachable in tab order.
- Switching tab resets neither the category selection nor the
  view mode (Featured/Compact).

## Definition of done
- Component renders without console errors.
- All four tabs are reachable by mouse and keyboard.
- The active tab is reflected in the URL.
- Bilingual copy complete.
- Existing tests for Discover still pass.
- `npm run verify` green.
