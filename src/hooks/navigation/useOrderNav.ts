import type React from "react";
import { useCallback } from "react";
import type { Product } from "@/context/AppContext";
import type { TabId, ViewState } from "@/types/navigation";
import type { OpenReportOpts, Awaitable } from "./types";


export function useOrderNav(
  setCurrentView: React.Dispatch<React.SetStateAction<ViewState>>,
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>,
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>,
  setActiveChatThreadId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveSellerId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveCategory: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveOrderId: React.Dispatch<React.SetStateAction<string | null>>,
) {
  const openOrder = useCallback(
    (orderId: string) => {
      setSelectedProduct(null);
      setActiveChatThreadId(null);
      setActiveSellerId(null);
      setActiveCategory(null);
      setActiveOrderId(orderId);
      setCurrentView("order");
    },
    [
      setSelectedProduct,
      setActiveChatThreadId,
      setActiveSellerId,
      setActiveCategory,
      setActiveOrderId,
      setCurrentView,
    ],
  );

  const closeOrder = useCallback(() => {
    setActiveOrderId(null);
    setCurrentView("purchases");
    setActiveTab("profile");
  }, [setActiveOrderId, setCurrentView, setActiveTab]);

  const openLeaveReview = useCallback(
    (orderId?: string) => {
      if (orderId) setActiveOrderId(orderId);
      setSelectedProduct(null);
      setCurrentView("leave-review");
    },
    [setActiveOrderId, setSelectedProduct, setCurrentView],
  );

  const closeLeaveReview = useCallback(() => {
    setCurrentView("order");
  }, [setCurrentView]);

  const openReturnRequest = useCallback(
    (orderId?: string) => {
      if (orderId) setActiveOrderId(orderId);
      setSelectedProduct(null);
      setCurrentView("return-request");
    },
    [setActiveOrderId, setSelectedProduct, setCurrentView],
  );

  const closeReturnRequest = useCallback(() => {
    setCurrentView("order");
  }, [setCurrentView]);

  const openDispute = useCallback(
    (orderId?: string) => {
      if (orderId) setActiveOrderId(orderId);
      setSelectedProduct(null);
      setCurrentView("dispute");
    },
    [setActiveOrderId, setSelectedProduct, setCurrentView],
  );

  const closeDispute = useCallback(() => {
    setCurrentView("order");
  }, [setCurrentView]);

  return {
    openOrder,
    closeOrder,
    openLeaveReview,
    closeLeaveReview,
    openReturnRequest,
    closeReturnRequest,
    openDispute,
    closeDispute,
  };
}