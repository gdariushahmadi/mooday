/**
 * Banned phrases for the DANEG rebrand.
 *
 * The DANEG brand is "pre-loved luxury" - not "second-hand". Any
 * appearance of the banned phrases in user-facing English copy, or the
 * Arabic equivalents in marketing copy, fails the copy-guard test in
 * `tests/copyGuard.test.ts`.
 *
 * The list is intentionally small and explicit. Adding a phrase here
 * adds it to the scan; remove only when the phrase has been purged
 * from every reachable surface.
 */

export const BANNED_PHRASES_EN: ReadonlyArray<string> = [
  "second-hand",
  "secondhand",
  "second hand",
];

export const BANNED_PHRASES_AR: ReadonlyArray<string> = [
  // Feminine-only "women" - banned in marketing copy per the brand brief.
  // Keep this list aligned with the documented decision in KPD8 / R16.
  "نساء",
  "للسيدات",
  "مستعملة",
  "مستعمل",
];

/**
 * Directories or files where banned phrases are allowed to appear
 * without failing the guard (test fixtures, third-party mocks, etc.).
 * Paths are matched against absolute paths ending with one of these
 * substrings.
 */
export const BANNED_PHRASE_EXEMPT_PATHS: ReadonlyArray<string> = [
  "/.git/",
  "/node_modules/",
  "/.next/",
  "/.deploy/",
  "/coverage/",
  "/test-results/",
  "/playwright-report/",
  "/scripts/",
  "/tests/",
  ".test.",
  "/__snapshots__/",
  "/src/lib/banned-phrases.ts",
  "/src/components/listing/ListingForm.tsx",
  "/src/components/listing/BrandAutocomplete.tsx",
];

/** True when a file path is exempt from the banned-phrase scan. */
export function isExemptPath(absolutePath: string): boolean {
  return BANNED_PHRASE_EXEMPT_PATHS.some((segment) =>
    absolutePath.includes(segment),
  );
}
