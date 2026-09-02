# DANEG Brand Assets

Organized logo files copied from `~/Downloads/logo-Daneg-01- to-09/`.
All variants say **DANEG** - if the wordmark should change,
ask the designer for a revised SVG before swapping these into the app.

## Naming convention

`daneg-{layout}-{color-combo}.{ext}`

- **layout**: `horizontal` (mark + wordmark side by side) or `vertical` (mark stacked above wordmark)
- **color-combo**: describes the mark color plus wordmark color

## Full lockups (mark + wordmark)

These are the marketing-ready combos. Pick by background and contrast need.

| File | Layout | Mark | Wordmark | Use on |
| --- | --- | --- | --- | --- |
| `daneg-horizontal-orange-cream.{svg,png,pdf}` | horizontal | orange 3D hex | soft cream | light backgrounds |
| `daneg-horizontal-orange-green.{svg,png,pdf}` | horizontal | orange 3D hex | dark green | light backgrounds, brand-primary |
| `daneg-horizontal-mono-black.{svg,png,pdf}` | horizontal | solid black | solid black | print, single-color |
| `daneg-horizontal-mono-white.{svg,png,pdf}` | horizontal | solid white | solid white | dark or photo backgrounds |
| `daneg-vertical-orange-cream.{svg,png,pdf}` | vertical | orange 3D hex | soft cream | light backgrounds, stacked uses |
| `daneg-vertical-orange-green.{svg,png,pdf}` | vertical | orange 3D hex | dark green | light backgrounds, stacked uses |
| `daneg-vertical-silver-cream.{svg,png,pdf}` | vertical | silver 3D hex | soft cream | subtle / luxury contexts |
| `daneg-vertical-mono-black.{svg,png,pdf}` | vertical | solid black | solid black | print, single-color |
| `daneg-vertical-mono-white.{svg,png,pdf}` | vertical | solid white | solid white | dark or photo backgrounds |

`svg` is for web / inline use. `png` is for previews. `pdf` is for print.

## Mark only (icon source)

3D hexagon without the wordmark. Use when the mark must stand alone
(favicon, app icon, social avatar, watermark).

- `daneg-mark-orange.svg` / `.png` - primary brand mark, orange 3D
- `daneg-mark-orange-green.svg` - orange mark with green outline
- `daneg-mark-silver.svg` / `.png` - silver / metallic variant
- `daneg-mark-black.svg` / `.png` - solid black, print-safe
- `daneg-mark-white.svg` / `.png` - solid white, for dark backgrounds

The SVGs are cropped versions of the vertical lockup SVGs (viewBox adjusted
to drop the wordmark). The PNGs are raster crops of the same region.

## App / favicon icons (already sized)

Generated from `daneg-mark-orange.png` so they drop into the existing
PWA / manifest paths without extra tooling.

| File | Size | Notes |
| --- | --- | --- |
| `icon-favicon-16.png` | 16x16 | browser tab |
| `icon-favicon-32.png` | 32x32 | browser tab (HiDPI) |
| `icon-apple-touch.png` | 180x180 | iOS home screen |
| `icon-badge-72.png` | 72x72 | macOS dock badge |
| `icon-192.png` | 192x192 | PWA icon |
| `icon-512.png` | 512x512 | PWA splash |
| `icon-maskable-192.png` | 192x192 | PWA maskable (40% safe zone) |
| `icon-maskable-512.png` | 512x512 | PWA maskable (40% safe zone) |

## Wiring into the app (when ready)

The current DANEG app still points at the legacy purple `M` icons in
`public/icons/`, `public/favicon.ico`, `public/favicon.png`, and
`src/app/layout.tsx`. To swap in the new mark:

1. Copy the eight `icon-*.png` files into `public/icons/`,
   overwriting the existing `favicon-16x16.png`, `favicon-32x32.png`,
   `icon-192x192.png`, `icon-512x512.png`, `apple-touch-icon.png`,
   `badge-72x72.png`, `icon-maskable-192x192.png`,
   `icon-maskable-512x512.png`.
2. Replace `public/favicon.ico` and `public/favicon.png` with the
   orange mark (ICO can be generated from `icon-favicon-32.png`).
3. Update `theme_color` in `public/manifest.json` and
   `src/app/layout.tsx` to match the chosen lockup
   (suggested `#F9A11B` for the orange mark, or `#124939` to pair
   with the green wordmark).
4. If you want the **wordmark** in the UI too (not just the mark),
   reference `daneg-vertical-orange-green.svg` from the relevant
   header component.
