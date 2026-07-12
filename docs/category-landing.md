# B-10 — Category Landing Page

> **Screen ID**: B-10 (the one Group B screen still missing).
> **Status**: ✅ Built and tested.
> **Goal**: Give a category (e.g. "Bags") its own deep, sub-category aware
> landing so that a tap on a chip in the Discover feed opens a richer view
> than the inline filter strip.

---

## Why this page exists

The Discover feed has a category chip strip that filters the feed inline.
That works for quick scanning, but it's a 1-line filter, not a *landing*
page. Real shoppers expect to:

1. Open a category in its own context (back arrow, large title).
2. See a curated banner / tagline.
3. Pick a **sub-category** (e.g. under "Bags": Handbags · Clutches ·
   Backpacks · Crossbody · Bucket Bags) and see only those.
4. Sort (Newest, Price ↑, Price ↓, Most Loved).
5. See the count of results and an empty state when nothing matches.

This is the standard e-commerce category-experience and B-10 fills that
gap. It is fully local-first (no Phase 3 dependencies).

---

## User-visible behavior

### Layout (top → bottom on mobile)
1. **Header bar** — back arrow (returns to Discover feed) · category
   title centered · search icon (could open B-07 with the category
   pre-applied, but for now just tap → search view with the chip set).
2. **Hero banner** — full-width container, gradient + category name +
   short tagline, AR-localised. No external image asset (CSS-only so
   we don't need a new public asset).
3. **Sub-category chips** — horizontally scrollable pills. "All" is the
   default. Tapping a chip filters the grid below.
4. **Sort + count strip** — left: result count (e.g. "32 items"), right:
   sort dropdown with 4 options.
5. **Product grid** — 2-col on mobile. Each card uses the existing
   `ClickableCard` + `ProductCard` pattern (re-use for consistency with
   Discover feed / Search).
6. **Empty state** — when no products match the sub-category, show a
   centred illustration + "Nothing here yet" + "Browse all Bags" CTA.

### Bilingual parity
- All copy in a `COPY = { en, ar }` const (per established convention).
- Sub-category names come from `sub-categories.ts` which already has
  EN + AR variants per keyword.
- Page title uses `CATEGORIES_AR[category]` for AR, EN for English.

### Deep-link URL
`?view=category&category=Bags&sub=Handbags&sort=newest`

- `view=category` → routes to this view.
- `category=` → required, must be one of the `CATEGORIES` entries
  (excluding "All"). Unknown values fall back to the first valid
  category.
- `sub=` → optional, matched case-insensitively against the subcategory
  labels. Unknown values fall back to "All".
- `sort=` → optional, one of `newest | price-asc | price-desc | saves`.
  Unknown values fall back to `newest`.

The page is shareable and survives full reloads.

---

## Components & data model

### New: `src/components/CategoryLandingView.tsx`
Single component, ~250–300 lines, bilingual `COPY` const, lazy URL
initialisation for `category`, `sub`, `sort`. Re-uses:

- `ClickableCard` for keyboard-accessible product tiles
- `formatAEDLabel` for price strings
- `deriveSubCategory()` from `src/data/sub-categories.ts` for mapping
- `CATEGORIES` / `CATEGORIES_AR` from `src/data/categories.ts`

### Navigation wiring
- `src/types/navigation.ts` — extend `ViewState` with `"category"`; add
  to `VALID_VIEWS`.
- `src/hooks/useAppNavigation.ts` — add `activeCategory: string | null`,
  `subCategory: string | null`, `categorySort`, `openCategory(cat)`,
  `closeCategory()`, `setSubCategory(sub)`, `setCategorySort(sort)`.
  All read from URL on first mount via lazy `useState` initializers
  (no `useEffect`, no React 19 setState-in-effect lint hit).
- `src/components/AppContent.tsx` — new `case "category"` branch →
  `<CategoryLandingView>`.
- `src/components/DiscoverFeedView.tsx` — the chip `onClick` now calls
  a new `onSelectCategory(cat)` prop instead of `setSelectedCategory`.
  Inline filtering on Discover is preserved (chip = filter) AND the
  user can also tap a new "View all [Category] →" button to open B-10.

### Data
- **No new data files**. Re-uses existing `listings` from `AppContext`.
- `deriveSubCategory(category, titleEn, language)` already exists and
  is used by `ProductDetailsView`. Same call here.

---

## Test coverage

`src/components/CategoryLandingView.test.tsx` (~16 tests):

1. Renders the page title in EN.
2. Renders the page title in AR.
3. Renders the back button with `aria-label`.
4. Renders the sub-category chips for "Bags" (Handbags · Clutches ·
   Backpacks · Crossbody · Bucket Bags).
5. Tapping a sub-category chip filters the grid to that sub-category
   only.
6. "All" chip restores the full grid.
7. Sort dropdown reflects URL value on first render.
8. Changing sort updates the URL (`pushState`).
9. Result count reflects the filtered + sorted set.
10. Empty state shows when no products match the sub-category.
11. ESC / back arrow returns to Discover (calls `onBack`).
12. Clicking a product tile calls `onSelectProduct`.
13. Reading `?category=invalid` falls back to the first valid category.
14. Reading `?sub=unknown` falls back to "All".
15. Reading `?sort=garbage` falls back to `newest`.
16. RTL — page sets `dir="rtl"` on root and uses AR copy.

(These are acceptance criteria. Tests are written to lock each in.)

---

## Out of scope (deferred)

- "Shop the look" rail under the hero (mentioned in the showcase) —
  deferred to a future iteration since it requires curated collections
  in the data model.
- Search icon in the header — currently a no-op for this screen. Will
  later wire to `setView("search")` with `?category=` preserved.
- Pagination — the dataset is small (33 items) and mock, so a single
  scrolling grid is fine. Phase 3 will add pagination when listings
  become real.
- Save-the-category-for-later (Favourite Categories) — deferred.

---

## Acceptance criteria (Phase 1 "done")

- ✅ Tapping a chip on the Discover feed opens B-10 for that category.
- ✅ B-10 is deep-linkable via `?view=category&category=...`.
- ✅ Sub-category chips filter the grid live.
- ✅ Sort persists in the URL.
- ✅ All copy localised EN + AR (no inline ternaries).
- ✅ Keyboard-accessible cards (`ClickableCard`).
- ✅ RTL: page-level `dir="rtl"`, symmetric icons marked `.no-mirror`.
- ✅ `npm run verify` (typecheck + lint + tests + build) passes green
  with the new test file included.
- ✅ Page doc lives at `docs/category-landing.md`.
