# U17 Progress: Polish (i18n, error boundaries, accessibility)

**Date:** 2026-08-16
**Status:** i18n verified (Arabic + English only); error boundaries and accessibility still pending
**Owner:** U17 (Polish)

## i18n

The codebase uses an inline `COPY.en` / `COPY.ar` pattern in each component. There is no i18n library. A repository-wide scan for Persian characters (U+0600-U+06FF) returns zero matches in `src/`. The product uses Arabic + English only, as required.

## What is still pending

1. **Error boundaries**: each major view should be wrapped in an error boundary that catches render errors and shows a friendly fallback.
2. **Loading states**: every async operation should show a loading indicator.
3. **Empty states**: empty search results, empty cart, etc., should show contextual empty-state messages.
4. **Keyboard navigation**: tab order, focus rings, ARIA labels.
5. **Visual regression**: screenshottesting in the Playwright suite.

## Effort to complete

These are polish tasks that require careful manual review. They are best done iteratively as the integration tests surface gaps.
