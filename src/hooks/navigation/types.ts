"use client";

import type { Product } from "@/context/AppContext";
import { readUrlParam, VALID_VIEWS } from "@/types/navigation";

import type { TabId, ViewState } from "@/types/navigation";

export type CategorySort = "newest" | "price-asc" | "price-desc" | "saves";
export type Awaitable<T> = T | Promise<T>;

export const VALID_CATEGORY_SORTS: readonly CategorySort[] = [
  "newest",
  "price-asc",
  "price-desc",
  "saves",
] as const;

export type OpenReportOpts = {
  orderId?: string;
  targetId?: string;
};

export interface AppNavigation {
  /** Active bottom-nav tab (kept in sync with currentView for tab views). */
  activeTab: TabId;
  /** Currently rendered view. */
  currentView: ViewState;
  /** Product shown in the details overlay, or null. */
  selectedProduct: Product | null;
  /** Product for direct (Buy Now) checkout, or null (uses cart otherwise). */
  checkoutProduct: Product | null;
  /** Active chat thread id, or null. */
  activeChatThreadId: string | null;
  /** Active public seller profile id, or null. */
  activeSellerId: string | null;
  /** Active category landing category name, or null. */
  activeCategory: string | null;
  /** Sub-category filter on the category landing, or null (= "All"). */
  activeSubCategory: string | null;
  /** Sort order on the category landing. */
  activeCategorySort: CategorySort;
  /** Active single order id (for C-17 Order Tracking). */
  activeOrderId: string | null;
  /** Active listing being edited (D-21 Edit Listing). */
  activeListingId: string | null;
  /** Listing/seller id being reported (H-40), or null. */
  activeReportTargetId: string | null;
  /** All listings, exposed so deep components (e.g. PublicSellerProfile) can filter. */
  listings: Product[];

  // Mutators
  selectProduct: (product: Product) => void;
  closeProduct: () => void;
  navigateToCart: () => void;
  startChat: (product: Product) => void;
  startChatWithSeller: (sellerId: string) => void;
  closeChat: () => void;
  openChat: (threadId: string) => void;
  openSeller: (sellerId: string) => void;
  closeSeller: () => void;
  openCategory: (category: string) => void;
  closeCategory: () => void;
  setSubCategory: (sub: string | null) => void;
  setCategorySort: (sort: CategorySort) => void;
  openOrder: (orderId: string) => void;
  closeOrder: () => void;
  openSellPicker: () => void;
  closeSellPicker: () => void;
  openCloset: () => void;
  closeCloset: () => void;
  openEditListing: (productId: string) => void;
  closeEditListing: () => void;
  openSales: () => void;
  closeSales: () => void;
  openNotifications: () => void;
  closeNotifications: () => void;
  openChats: () => void;
  closeChats: () => void;
  openEditProfile: () => void;
  closeEditProfile: () => void;
  openAddresses: () => void;
  closeAddresses: () => void;
  openPaymentMethods: () => void;
  closePaymentMethods: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  openLeaveReview: (orderId?: string) => void;
  closeLeaveReview: () => void;
  openMyReviews: () => void;
  closeMyReviews: () => void;
  openReport: (opts?: OpenReportOpts) => void;
  closeReport: () => void;
  openReturnRequest: (orderId?: string) => void;
  closeReturnRequest: () => void;
  openPayouts: () => void;
  closePayouts: () => void;
  openBlockedUsers: () => void;
  closeBlockedUsers: () => void;
  openSecuritySetup: () => void;
  closeSecuritySetup: () => void;
  openDispute: (orderId?: string) => void;
  closeDispute: () => void;
  openDisputesList: () => void;
  closeDisputesList: () => void;
  openSignUp: () => void;
  closeSignUp: () => void;
  openOtp: () => void;
  closeOtp: () => void;
  openSignIn: () => void;
  closeSignIn: () => void;
  openForgotPassword: () => void;
  closeForgotPassword: () => void;
  openSocialLogin: () => void;
  closeSocialLogin: () => void;
  checkoutProductDirect: (product: Product) => void;
  checkoutFromActiveChat: () => void;
  checkoutBack: () => void;
  checkoutSuccess: () => void;
  changeTab: (tab: TabId) => void;
  setView: (view: ViewState) => void;
  goHome: () => void;
}

function resolveInitialView(): ViewState {
  const checkoutId = readUrlParam("checkout");
  if (checkoutId) return "checkout";
  const v = readUrlParam("view") as ViewState | null;
  if (v && VALID_VIEWS.includes(v)) return v;
  // Deep-link params without ?view= — same pattern as seller.
  if (readUrlParam("seller")) return "seller";
  if (readUrlParam("category")) return "category";
  if (readUrlParam("product")) return "home";
  // Search intent via ?q= (or bare search query) without ?view=.
  if (readUrlParam("q")) return "search";
  return "home";
}

/**
 * Central navigation state for the app shell.
 *
 * Handles deep-link initialization from URL params (read once in lazy
 * useState initializers — no useEffect, no setState-in-effect lint error),
 * overlay state (product details, chat), and the mapping between the
 * bottom-nav tabs and the view state.
 */