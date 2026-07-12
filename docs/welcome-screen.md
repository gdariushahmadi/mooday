# Welcome Screen — A-01 Implementation

## Goal
First-launch cold-start screen for Mooday. Bilingual EN+AR language
picker, brand mark, tagline, and a single CTA that drops the user
into the main app and marks the welcome as seen.

## Behavior
- Shown on cold launch only — skipped on every subsequent visit.
- `hasSeenWelcome` localStorage key is the source of truth.
- `language` is read/written via the existing `useApp()` context.
- Works correctly when reached via `/?welcome=force` (deep link used
  for the showcase and for the Settings "Show welcome again" action).

## Components

### 1. `WelcomeView` component (`src/components/WelcomeView.tsx`)
A full-page screen (no header, no bottom nav — it IS the whole app
during cold launch). Accepts `onEnter: () => void` as its only prop.

Layout, top to bottom:
- Brand mark (gradient box with italic "M"), identical to the badge in
  `InstallPrompt` so the visual identity matches.
- Wordmark: "Mooday" in `font-serif italic text-primary`.
- Tagline: "Resell & rent pre-loved fashion" / "بيعي و أجيلي ملابسك المستعملة".
- Sub-tagline: one-line explainer of what the app does.
- Language picker: two pill buttons (EN / عربي) styled like the
  `DiscoverFeedView` category chips. EN is the default selected.
- CTA: a single full-width `btn-primary` that says "Enter Mooday" /
  "ادخل مودي".
- A "Skip" link below the CTA that calls `onEnter` without changing
  the language (in case the user wants the default EN experience).

### 2. `useWelcomeGuard` hook (`src/hooks/useWelcomeGuard.ts`)
Encapsulates the "should I show the welcome screen?" decision.

```ts
function useWelcomeGuard(): {
  ready: boolean;        // false during SSR / before hydration
  shouldShow: boolean;   // true only on cold launch
  markSeen: () => void;  // called when user enters the app
  reset: () => void;     // called by Settings to show welcome again
};
```

Returns `ready: false` until hydration, so the SSR HTML and the first
client render both render `<Home />` — avoiding hydration mismatch.
After hydration, if `hasSeenWelcome` is not set, switches to
`<WelcomeView />`.

### 3. Route integration
- `src/app/page.tsx` calls `useWelcomeGuard()`. While `ready` is false
  or `shouldShow` is true, render `<WelcomeView onEnter={markSeen} />`.
  Otherwise render the existing home shell with the bottom nav.
- `/?welcome=force` sets `hasSeenWelcome` to false and re-renders
  welcome. Useful for the showcase iframes and for the Settings
  "show welcome again" action.

### 4. Test coverage
- `src/components/WelcomeView.test.tsx`:
  - Renders brand mark, tagline, language picker, CTA.
  - Clicking EN/AR pill updates the visual selection.
  - Clicking "Enter Mooday" calls `onEnter`.
  - Skip link calls `onEnter`.
  - `aria-pressed` reflects the selected language.
  - CTA and language pills are keyboard reachable.
- `src/hooks/useWelcomeGuard.test.ts`:
  - Returns `shouldShow: false` when `hasSeenWelcome` is set.
  - Returns `shouldShow: true` on a clean localStorage.
  - `markSeen()` sets `hasSeenWelcome` and `shouldShow` becomes false.
  - `reset()` clears `hasSeenWelcome` and `shouldShow` becomes true.

## Definition of done
- Component renders without console errors.
- All four acceptance scenarios pass.
- 100% of new code has unit tests.
- `npm run verify` green.
- Bilingual strings live in a const object, not inline ternaries.
- `ClickableCard` / `role="button"` / `tabIndex` pattern used for any
  clickable element that is not a native `<button>` or `<a>`.
- Works in both LTR and RTL (the layout flips naturally).
