"use client";

import { AppNavigation, CategorySort, VALID_CATEGORY_SORTS } from "./types";


import { useCallback, useEffect, useState } from "react";
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

import { useProductNav } from "./useProductNav";
import { useAuthNav } from "./useAuthNav";
import { useOrderNav } from "./useOrderNav";
import { useProfileNav } from "./useProfileNav";
import { useChatNav } from "./useChatNav";
import { useSellerNav } from "./useSellerNav";

type Awaitable<T> = T | Promise<T>;




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
export function useAppNavigation(): AppNavigation {

  const { createChatThread, listings, currentUserId } = useApp();

  const [activeTab, setActiveTab] = useState<TabId>(() =>
    tabFromView(readUrlParam("view") ?? resolveInitialView()),
  );
  const [currentView, setCurrentView] = useState<ViewState>(resolveInitialView);
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
  const [activeReportTargetId, setActiveReportTargetId] = useState<
    string | null
  >(null);


  // Re-resolve deep-linked product/checkout once async/remote listings load.
  useEffect(() => {
    if (listings.length === 0) return;
    const productId = readUrlParam("product");
    if (productId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProduct((prev) => {
        if (prev) return prev;
        return listings.find((p) => p.id === productId) ?? null;
      });
    }
    const checkoutId = readUrlParam("checkout");
    if (checkoutId) {
      setCheckoutProduct((prev) => {
        if (prev) return prev;
        return listings.find((p) => p.id === checkoutId) ?? null;
      });
    }
  }, [listings]);

  const changeTab = useCallback((tab: TabId) => {
    setSelectedProduct(null);
    setActiveSellerId(null);
    setActiveTab(tab);
    setCurrentView(viewFromTab(tab));
  }, []);

  const goHome = useCallback(() => {
    changeTab("home");
  }, [changeTab]);

  const setView = useCallback((view: ViewState) => {
    setCurrentView(view);
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

  const productNav = useProductNav(
    setCurrentView,
    setSelectedProduct,
    setCheckoutProduct,
    setActiveChatThreadId,
    setActiveSellerId,
    setActiveCategory,
    setActiveOrderId,
    setActiveListingId,
    listings,
    changeTab,
    goHome,
  );

  const authNav = useAuthNav(setCurrentView);
  const orderNav = useOrderNav(
    setCurrentView,
    setActiveTab,
    setSelectedProduct,
    setActiveChatThreadId,
    setActiveSellerId,
    setActiveCategory,
    setActiveOrderId,
  );
  const profileNav = useProfileNav(
    setCurrentView,
    setActiveTab,
    setSelectedProduct,
    setActiveChatThreadId,
    setActiveSellerId,
    setActiveCategory,
    setActiveOrderId,
    setActiveListingId,
  );
  const chatNav = useChatNav(
    setCurrentView,
    setActiveTab,
    setSelectedProduct,
    setActiveChatThreadId,
    createChatThread,
    currentUserId,
    listings,
  );
  const sellerNav = useSellerNav(
    setCurrentView,
    setActiveTab,
    setSelectedProduct,
    setActiveChatThreadId,
    setActiveSellerId,
    setActiveOrderId,
    setActiveReportTargetId,
  );

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
    activeReportTargetId,
    listings,
    openCategory,
    closeCategory,
    setSubCategory,
    setCategorySort,
    changeTab,
    setView,
    goHome,
    ...productNav,
    ...authNav,
    ...orderNav,
    ...profileNav,
    ...chatNav,
    ...sellerNav,
  };
}
