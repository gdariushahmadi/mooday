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
  | "loves"
  | "seller"
  | "category"
  | "purchases"
  | "order"
  | "sell-picker"
  | "closet"
  | "edit-listing"
  | "sales"
  | "notifications"
  | "chats"
  | "edit-profile"
  | "addresses"
  | "payment-methods"
  | "help"
  | "leave-review"
  | "my-reviews"
  | "report"
  | "return-request"
  | "payouts"
  | "blocked-users"
  | "dispute"
  | "disputes-list"
  | "signup"
  | "otp"
  | "signin"
  | "forgot-password"
  | "social-login";

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
  "seller",
  "category",
  "purchases",
  "order",
  "sell-picker",
  "closet",
  "edit-listing",
  "sales",
  "notifications",
  "chats",
  "edit-profile",
  "addresses",
  "payment-methods",
  "help",
  "leave-review",
  "my-reviews",
  "report",
  "return-request",
  "payouts",
  "blocked-users",
  "dispute",
  "disputes-list",
  "signup",
  "otp",
  "signin",
  "forgot-password",
  "social-login",
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
  if (view === "search" || view === "activity" || view === "profile") {
    return view;
  }
  if (view === "sell") return "sell";
  return "home";
}

/** Map a tab to its corresponding view.
 *
 * Note: for the "sell" tab, we route through the mode picker (D-18) first.
 * The picker then calls `openSellPicker` to advance into D-19.
 */
export function viewFromTab(tab: TabId): ViewState {
  if (tab === "sell") return "sell-picker";
  return tab;
}
