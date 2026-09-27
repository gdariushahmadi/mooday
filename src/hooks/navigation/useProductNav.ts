import type React from "react";
import { useCallback } from "react";
import type { Product } from "@/context/AppContext";
import type { TabId, ViewState } from "@/types/navigation";
import type { OpenReportOpts, Awaitable } from "./types";


export function useProductNav(
  setCurrentView: React.Dispatch<React.SetStateAction<ViewState>>,
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>,
  setCheckoutProduct: React.Dispatch<React.SetStateAction<Product | null>>,
  setActiveChatThreadId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveSellerId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveCategory: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveOrderId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveListingId: React.Dispatch<React.SetStateAction<string | null>>,
  listings: Product[],
  changeTab: (tab: TabId) => void,
  goHome: () => void,
) {
  const selectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, [setSelectedProduct]);

  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
  }, [setSelectedProduct]);

  const navigateToCart = useCallback(() => {
    setSelectedProduct(null);
    setCurrentView("bag");
  }, [setSelectedProduct, setCurrentView]);

  const openSellPicker = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(null);
    setCurrentView("sell");
  }, [
    setSelectedProduct,
    setActiveChatThreadId,
    setActiveSellerId,
    setActiveCategory,
    setActiveOrderId,
    setActiveListingId,
    setCurrentView,
  ]);

  const closeSellPicker = useCallback(() => {
    changeTab("home");
  }, [changeTab]);

  const openEditListing = useCallback(
    (productId: string) => {
      setSelectedProduct(null);
      setActiveChatThreadId(null);
      setActiveSellerId(null);
      setActiveCategory(null);
      setActiveOrderId(null);
      setActiveListingId(productId);
      setCurrentView("edit-listing");
    },
    [
      setSelectedProduct,
      setActiveChatThreadId,
      setActiveSellerId,
      setActiveCategory,
      setActiveOrderId,
      setActiveListingId,
      setCurrentView,
    ],
  );

  const closeEditListing = useCallback(() => {
    setActiveListingId(null);
    setCurrentView("closet");
  }, [setActiveListingId, setCurrentView]);

  const checkoutProductDirect = useCallback(
    (product: Product) => {
      setCheckoutProduct(product);
      setCurrentView("checkout");
    },
    [setCheckoutProduct, setCurrentView],
  );

  const checkoutFromActiveChat = useCallback(() => {
    setActiveChatThreadId((threadId) => {
      if (!threadId) return null;
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
  }, [listings, setActiveChatThreadId, setCheckoutProduct, setCurrentView]);

  const checkoutBack = useCallback(() => {
    setCheckoutProduct((product) => {
      setCurrentView(product ? "home" : "bag");
      return null;
    });
  }, [setCheckoutProduct, setCurrentView]);

  const checkoutSuccess = useCallback(() => {
    setCheckoutProduct(null);
    goHome();
  }, [setCheckoutProduct, goHome]);

  return {
    selectProduct,
    closeProduct,
    navigateToCart,
    openSellPicker,
    closeSellPicker,
    openEditListing,
    closeEditListing,
    checkoutProductDirect,
    checkoutFromActiveChat,
    checkoutBack,
    checkoutSuccess,
  };
}