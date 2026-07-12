# Search & Filters — B-07 Implementation

## Goal
Upgrade the existing `SearchFiltersView` from 2 filters (category +
condition) to the **6 filters** specified in the showcase:
category, condition, **size, colour, price range, and listing mode**.
Plus a **Sort by** dropdown (Relevance, Newest, Price ↑↓).

## Behavior
- All filters are AND-combined.
- Search box is debounced 300ms.
- Filter state is reflected in the URL (`?q=`, `?cat=`, `?cond=`,
  `?size=`, `?color=`, `?min=`, `?max=`, `?mode=`, `?sort=`) so a
  search is shareable.
- "Clear all" button resets every filter.
- Result count updates live ("Found N items").
- Empty state when no results.

## Data model changes

### `Product` gains three optional fields
```ts
size?: string;       // "XS" | "S" | "M" | "L" | "XL" | "OS" (one size)
colorEn?: string;    // "Tan" | "Black" | "Navy" | ...
colorAr?: string;
mode?: "resell" | "rent";  // default "resell"; "rent" reserved for Phase 4
```

All three are optional so existing seed data doesn't break. The seed
migration assigns sensible defaults per category:
- Dresses, Clothing, Shoes → size from a realistic pool.
- All items → color from a realistic pool.
- All items → mode = "resell" (Rent is Phase 4).

## Filter definitions

| Filter | Type | UI |
|--------|------|----|
| Category | single-select | pill chips (existing) |
| Condition | single-select | pill chips (existing) |
| Size | multi-select | pill chips: XS S M L XL OS |
| Colour | single-select | pill chips with colour dots |
| Price range | min–max | dual number inputs + quick presets (Under 500, 500–1000, 1000+) |
| Listing mode | single-select | segmented control: All · Resell · Rent (Rent disabled) |

### Colour palette
A fixed palette of 8 colours, each with a hex swatch and EN/AR labels:
Black, White, Beige/Tan, Brown, Navy, Red, Pink, Gold.

## Sort options
- **Relevance** (default): keeps seed order.
- **Newest**: batch2/custom ids first, then by saves.
- **Price: Low to High**.
- **Price: High to Low**.

## Test coverage
- Renders all six filter sections.
- Each filter narrows the results correctly.
- Multi-select size works (toggle on/off).
- Sort dropdown changes the order.
- "Clear all" resets every filter.
- URL reflects filter state.
- Empty state shows when no results.
- Search debounce doesn't fire on every keystroke.

## Definition of done
- All six filters functional.
- Bilingual copy complete.
- Keyboard accessible.
- `npm run verify` green.
