"use client";

import { useCallback, useState } from "react";
import { useApp, type Product } from "@/context/AppContext";
import {
  type TabId,
  type ViewState,
  VALID_VIEWS,
  readUrlParam,
  tabFromView,
  viewFromTab,
} from "@/types/navigation";
import { CATEGORIES } from "@/data/categories";

export type CategorySort = "newest" | "price-asc" | "price-desc" | "saves";

export const VALID_CATEGORY_SORTS: readonly CategorySort[] = [
  "newest",
  "price-asc",
  "price-desc",
  "saves",
] as const;

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
  /** All listings, exposed so deep components (e.g. PublicSellerProfile) can filter. */
  listings: Product[];

  // Mutators
  selectProduct: (product: Product) => void;
  closeProduct: () => void;
  navigateToCart: () => void;
  startChat: (product: Product) => void;
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
  checkoutProductDirect: (product: Product) => void;
  checkoutFromActiveChat: () => void;
  checkoutBack: () => void;
  checkoutSuccess: () => void;
  changeTab: (tab: TabId) => void;
  setView: (view: ViewState) => void;
  goHome: () => void;
}

/**
 * Central navigation state for the app shell.
 *
 * Handles deep-link initialization from URL params (read once in lazy
 * useState initializers — no useEffect, no setState-in-effect lint error),
 * overlay state (product details, chat), and the mapping between the
 * bottom-nav tabs and the view state.
 */
export function useAppNavigation(): AppNavigation {
  const { createChatThread, listings } = useApp();

  const [activeTab, setActiveTab] = useState<TabId>(() =>
    tabFromView(readUrlParam("view")),
  );
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const checkoutId = readUrlParam("checkout");
    if (checkoutId) return "checkout";
    const v = readUrlParam("view") as ViewState | null;
    if (v && VALID_VIEWS.includes(v)) return v;
    // If ?seller= is present without ?view, default to the seller view.
    if (readUrlParam("seller")) return "seller";
    return "home";
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    const productId = readUrlParam("product");
    if (!productId) return null;
    return listings.find((p) => p.id === productId) ?? null;
  });
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(() => {
    const checkoutId = readUrlParam("checkout");
    if (!checkoutId) return null;
    return listings.find((p) => p.id === checkoutId) ?? null;
  });
  const [activeChatThreadId, setActiveChatThreadId] = useState<string | null>(
    () => readUrlParam("chat"),
  );
  const [activeSellerId, setActiveSellerId] = useState<string | null>(() => {
    const id = readUrlParam("seller");
    return id ?? null;
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(() => {
    const c = readUrlParam("category");
    if (c && (CATEGORIES as readonly string[]).includes(c)) return c;
    return null;
  });
  const [activeSubCategory, setActiveSubCategoryState] = useState<
    string | null
  >(() => {
    const sub = readUrlParam("sub");
    return sub ?? null;
  });
  const [activeCategorySort, setActiveCategorySortState] =
    useState<CategorySort>(() => {
      const s = readUrlParam("sort");
      if (s && (VALID_CATEGORY_SORTS as readonly string[]).includes(s)) {
        return s as CategorySort;
      }
      return "newest";
    });
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() =>
    readUrlParam("order"),
  );
  const [activeListingId, setActiveListingId] = useState<string | null>(() =>
    readUrlParam("edit"),
  );

  const selectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const navigateToCart = useCallback(() => {
    setSelectedProduct(null);
    setCurrentView("bag");
  }, []);

  const startChat = useCallback(
    (product: Product) => {
      const threadId = createChatThread(product);
      setActiveChatThreadId(threadId);
    },
    [createChatThread],
  );

  const closeChat = useCallback(() => {
    setActiveChatThreadId(null);
  }, []);

  const openChat = useCallback((threadId: string) => {
    setActiveChatThreadId(threadId);
  }, []);

  const openSeller = useCallback((sellerId: string) => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(sellerId);
    setCurrentView("seller");
  }, []);

  const closeSeller = useCallback(() => {
    setActiveSellerId(null);
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const openCategory = useCallback((category: string) => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(category);
    setActiveSubCategoryState(null);
    setActiveCategorySortState("newest");
    setCurrentView("category");
  }, []);

  const closeCategory = useCallback(() => {
    setActiveCategory(null);
    setActiveSubCategoryState(null);
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const setSubCategory = useCallback((sub: string | null) => {
    setActiveSubCategoryState(sub);
  }, []);

  const setCategorySort = useCallback((sort: CategorySort) => {
    setActiveCategorySortState(sort);
  }, []);

  const openOrder = useCallback((orderId: string) => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(orderId);
    setCurrentView("order");
  }, []);

  const closeOrder = useCallback(() => {
    setActiveOrderId(null);
    setCurrentView("purchases");
    setActiveTab("profile");
  }, []);

  const openSellPicker = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(null);
    // Open the actual listing form (D-19). The mode picker (D-18) is
    // reached via the "sell" tab or via changeTab("sell").
    setCurrentView("sell");
  }, []);

  const closeSellPicker = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const openCloset = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(null);
    setCurrentView("closet");
  }, []);

  const closeCloset = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const openEditListing = useCallback((productId: string) => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(productId);
    setCurrentView("edit-listing");
  }, []);

  const closeEditListing = useCallback(() => {
    setActiveListingId(null);
    setCurrentView("closet");
  }, []);

  const openSales = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(null);
    setCurrentView("sales");
  }, []);

  const closeSales = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const openNotifications = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveOrderId(null);
    setCurrentView("notifications");
  }, []);

  const closeNotifications = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const openChats = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setCurrentView("chats");
  }, []);

  const closeChats = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, []);

  const checkoutProductDirect = useCallback((product: Product) => {
    setCheckoutProduct(product);
    setCurrentView("checkout");
  }, []);

  const checkoutFromActiveChat = useCallback(() => {
    setActiveChatThreadId((threadId) => {
      if (!threadId) return null;
      // Thread ids follow the format `chat-{productId}`.
      const productId = threadId.replace(/^chat-/, "");
      const product = listings.find((p) => p.id === productId);
      if (product) {
        setCheckoutProduct(product);
        setCurrentView("checkout");
      } else {
        setCurrentView("bag");
      }
      return null;
    });
  }, [listings]);

  const changeTab = useCallback((tab: TabId) => {
    setSelectedProduct(null);
    setActiveSellerId(null);
    setActiveTab(tab);
    setCurrentView(viewFromTab(tab));
  }, []);

  const setView = useCallback((view: ViewState) => {
    setCurrentView(view);
  }, []);

  const goHome = useCallback(() => {
    changeTab("home");
  }, [changeTab]);

  const checkoutBack = useCallback(() => {
    setCheckoutProduct((product) => {
      setCurrentView(product ? "home" : "bag");
      return null;
    });
  }, []);

  const checkoutSuccess = useCallback(() => {
    setCheckoutProduct(null);
    goHome();
  }, [goHome]);

  return {
    activeTab,
    currentView,
    selectedProduct,
    checkoutProduct,
    activeChatThreadId,
    activeSellerId,
    activeCategory,
    activeSubCategory,
    activeCategorySort,
    activeOrderId,
    activeListingId,
    listings,
    selectProduct,
    closeProduct,
    navigateToCart,
    startChat,
    closeChat,
    openChat,
    openSeller,
    closeSeller,
    openCategory,
    closeCategory,
    setSubCategory,
    setCategorySort,
    openOrder,
    closeOrder,
    openSellPicker,
    closeSellPicker,
    openCloset,
    closeCloset,
    openEditListing,
    closeEditListing,
    openSales,
    closeSales,
    openNotifications,
    closeNotifications,
    openChats,
    closeChats,
    checkoutProductDirect,
    checkoutFromActiveChat,
    checkoutBack,
    checkoutSuccess,
    changeTab,
    setView,
    goHome,
  };
}
