---
kind: frontend_style
name: Tailwind 4 + CSS Design Tokens with Manual Dark Mode and RTL
category: frontend_style
scope:
    - '**'
source_files:
    - src/app/globals.css
    - postcss.config.mjs
    - src/app/layout.tsx
    - src/components/ThemeSync.tsx
    - src/components/landing/landing.module.css
    - next.config.ts
---

## System Overview

The Mooday/DANEG marketplace uses **Tailwind CSS v4** (via `@tailwindcss/postcss`) as its primary styling engine, layered over a single global stylesheet that defines design tokens, semantic color palettes, typography scales, and shared UI primitives. The app is built on Next.js App Router and targets mobile-first responsive layouts with full RTL support.

## Key Files

- `src/app/globals.css` — central token/theme file: Tailwind `@theme`, CSS custom properties for colors/spacing/typography, dark-mode palette override, shared component classes (`btn-primary`, `btn-secondary`, `app-shell-surface`, `app-page-header`, `app-bottom-nav`, `price-strikethrough`, `no-scrollbar`, `inline-scroll-cue`), and RTL font swaps.
- `postcss.config.mjs` — registers `@tailwindcss/postcss` as the only PostCSS plugin.
- `src/app/layout.tsx` — injects Google Fonts (`Hanken Grotesk`, `Bodoni Moda`, `Noto Sans Arabic`, `El Messiri`) via CSS variables (`--font-family-sans-en`, `--font-family-serif-en`, `--font-family-sans-ar`, `--font-family-serif-ar`), sets viewport `themeColor` for light/dark schemes, and loads Material Symbols Outlined.
- `src/components/ThemeSync.tsx` — persists manual theme preference under key `daneg-pref-dark` in localStorage and toggles the `dark` class on `<html>`; the `dark` variant is redefined in `globals.css` via `@custom-variant dark (&:where(.dark, .dark *))` so it follows the manual class rather than OS preference.
- `src/components/landing/landing.module.css` — scoped CSS Modules for the marketing landing page, using its own local design tokens (`--c-ink`, `--c-cream`, `--c-plum`, `--c-champagne`, `--c-blush`) and animations; intentionally isolated from the app shell.
- `next.config.ts` — security headers and CSP allow `https://fonts.googleapis.com` and `https://fonts.gstatic.com`; PWA service worker and manifest are served with explicit cache headers.

## Architecture & Conventions

### Design Tokens
All visual constants live in `globals.css` inside a Tailwind `@theme` block:
- **Colors**: Semantic tokens derived from a Stitch-inspired palette (`--color-primary`, `--color-background`, `--color-surface-*`, `--color-on-*`, `--color-outline-*`, `--color-error`, etc.) covering both light and dark modes.
- **Typography**: A Material-3–inspired scale (`--text-display-lg` through `--text-label-sm`) plus letter-spacing tokens (`--tracking-display`, `--tracking-headline`, `--tracking-label`). Font families are mapped to CSS variables set by `next/font`.
- **Spacing**: Tokenized spacing (`--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`, `--spacing-xxl`, `--spacing-gutter`, `--spacing-container-max: 1200px`, `--spacing-margin-mobile: 20px`).
- **Safe areas**: CSS variables for `safe-area-inset-top/bottom` and bottom nav height drive mobile notch handling.

### Dark Mode Strategy
Dark mode is **manual**, not system-driven: `ThemeSync` reads/writes `daneg-pref-dark` in localStorage and toggles the `dark` class on `<html>`. The `@custom-variant dark (&:where(.dark, .dark *))` declaration ensures all Tailwind utilities prefixed with `dark:` respond to this class. A complete parallel dark palette overrides every semantic color variable under `:root.dark`.

### Responsive Strategy
- Mobile-first layout with a fixed `max-width: var(--spacing-container-max)` (1200px) centered surface (`.app-shell-surface`, `.app-page-header`, `.app-bottom-nav`) so views look like a phone app even on desktop.
- Breakpoints used include `768px` (tablet) and `900px` (desktop grid changes); the landing page also uses `clamp()` fluid typography and media queries for short viewports (`max-height: 820px`).
- Bottom navigation has extra padding on mobile to account for safe area insets, removed at `min-width: 768px`.

### RTL Support
- `[dir="rtl"]` selectors swap font variables to Arabic fonts, mirror the scroll-cue mask direction, and flip Material Symbols icons via `transform: scaleX(-1)` (with a `.no-mirror` escape hatch).
- Landing page CSS modules use `inset-inline` logical properties and separate RTL keyframes/animations.

### Component Styling Conventions
- Components compose Tailwind utility classes directly in JSX `className` strings (e.g., `ActivityView.tsx` uses `text-label-sm`, `text-on-surface-variant`, `gap-sm`, `material-symbols-outlined`, `active:scale-95`).
- Shared reusable styles live in `globals.css` as named classes: `.btn-primary`, `.btn-secondary`, `.btn-tactile`, `.app-shell-with-nav`, `.app-shell-header`, `.app-bottom-nav`, `.price-strikethrough`, `.no-scrollbar`, `.inline-scroll-cue`.
- Focus outlines are standardized via a global rule applying `outline: 2px solid var(--color-primary)` with `outline-offset: 2px` to all interactive elements.
- The landing page opts into CSS Modules (`landing.module.css`) with fully scoped namespaced styles and its own local token set, keeping editorial animations and imagery isolated from the app shell.

### Typography
- English: `Hanken Grotesk` (sans) + `Bodoni Moda` (serif/display) loaded via `next/font/google` with `display: swap` and assigned to CSS variables consumed by Tailwind's `--font-sans` / `--font-serif`.
- Arabic: `Noto Sans Arabic` + `El Messiri` swapped in via `[dir="rtl"]` rules.
- Headings default to serif with tight tracking; labels default to uppercase with wide tracking.

## Constraints & Enforced Rules

- **No `tailwind.config.*` file exists** — configuration is entirely in `postcss.config.mjs` and the `@theme` block in `globals.css`; adding a config file would conflict with the current setup.
- **Dark mode must be driven by the `dark` class** on `<html>`, not `prefers-color-scheme`, because the app exposes a manual toggle persisted in localStorage.
- **CSP in `next.config.ts`** restricts `style-src` to `'self' 'unsafe-inline' https://fonts.googleapis.com` and `font-src` to `'self' https://fonts.gstatic.com data:`; external style sources outside these origins will break.
- **PWA assets** (`/sw.js`, `/manifest.json`, `/icons/*`) are served with explicit `Cache-Control` headers in `next.config.ts`; modifying their caching behavior requires updating those header rules.
- **Material Symbols Outlined** must be loaded from Google Fonts as declared in `layout.tsx`; components reference the icon font via the `.material-symbols-outlined` class defined in `globals.css`.