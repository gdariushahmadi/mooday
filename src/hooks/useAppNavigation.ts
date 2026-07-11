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

  // Mutators
  selectProduct: (product: Product) => void;
  closeProduct: () => void;
  navigateToCart: () => void;
  startChat: (product: Product) => void;
  closeChat: () => void;
  openChat: (threadId: string) => void;
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
    return v && VALID_VIEWS.includes(v) ? v : "home";
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
    selectProduct,
    closeProduct,
    navigateToCart,
    startChat,
    closeChat,
    openChat,
    checkoutProductDirect,
    checkoutFromActiveChat,
    checkoutBack,
    checkoutSuccess,
    changeTab,
    setView,
    goHome,
  };
}
