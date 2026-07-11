/**
 * Navigation types shared between the main app shell and the preview shell.
 */

/** Bottom-nav tab identifiers. */
export type TabId = "home" | "search" | "sell" | "activity" | "profile";

/** All possible view states the app can render. */
export type ViewState =
  | "home"
  | "search"
  | "sell"
  | "activity"
  | "profile"
  | "bag"
  | "checkout"
  | "settings"
  | "loves";

/** Views that can be deep-linked via ?view=. */
export const VALID_VIEWS: readonly ViewState[] = [
  "home",
  "search",
  "sell",
  "activity",
  "profile",
  "bag",
  "checkout",
  "settings",
  "loves",
] as const;

/**
 * Read a URL query parameter on the client only.
 * Returns `null` during SSR so it can be used in lazy useState initializers
 * without causing hydration mismatches.
 */
export function readUrlParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

/** Map a deep-link view param to the matching bottom-nav tab. */
export function tabFromView(view: string | null): TabId {
  if (
    view === "search" ||
    view === "sell" ||
    view === "activity" ||
    view === "profile"
  ) {
    return view;
  }
  return "home";
}

/** Map a tab to its corresponding view. */
export function viewFromTab(tab: TabId): ViewState {
  return tab;
}
