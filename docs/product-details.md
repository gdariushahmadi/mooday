# Product Details Depth — B-09 Implementation

## Goal
Upgrade the existing `ProductDetailsView` from a basic gallery +
price + seller card to a full product page matching the showcase
specification. Add: sub-category breadcrumb, gallery zoom, shipping
info section, size selector (when applicable), and a "report" entry
point (the modal itself lands in H-41).

## Behavior

### Gallery
- Thumbnail strip below the main image (already exists).
- **Tap the main image to open a full-bleed zoom modal** with the
  same image, swipeable via left/right arrows on desktop and tap on
  mobile. Closes on Esc / backdrop tap.
- Each thumbnail is keyboard reachable; Enter opens the zoom.

### Breadcrumb
- Above the title: `Home › Bags › Handbags`. The middle segment is
  the top-level category, the last is a derived sub-category. Tapping
  a segment is a no-op for now (Phase 2 wires it to the category
  landing page B-10).

### Shipping & returns
- A collapsible section below the description:
  - "Ships within 24h from Dubai, UAE"
  - "Free shipping on orders over AED 1,000"
  - "Returns accepted within 7 days of delivery"
- Collapsed by default; chevron indicates expand state.

### Size selector
- Only shown when the product has a `size` that is not `"OS"`.
- A pill row showing the product's size, locked (read-only, since
  the listing is one size). Copy: "Size: S".

### Report entry point
- A "…" overflow menu button in the top-right of the page (next to the
  back button's row). Opens a small menu: "Report this listing" →
  calls a `onReportListing(productId)` prop. The actual modal ships
  in H-41; for now we just expose the trigger so it doesn't read as
  dead UI.

### Authentic badge
- Already exists when `isAuthentic` is true. Keep as-is.

## Test coverage
- Breadcrumb renders with sub-category derived from title.
- Gallery zoom opens on main image tap.
- Gallery zoom closes on Esc.
- Thumbnails switch the main image.
- Shipping section expands and collapses.
- Size row hidden when size is "OS" or absent.
- Size row visible for sized items.
- Report menu opens and shows the report action.

## Definition of done
- All visual elements above render and behave correctly.
- Keyboard accessible.
- Bilingual (EN + AR).
- `npm run verify` green.
