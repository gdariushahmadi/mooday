import type React from "react";
import { useCallback } from "react";
import type { Product } from "@/context/AppContext";
import type { TabId, ViewState } from "@/types/navigation";
import type { OpenReportOpts, Awaitable } from "./types";


export function useSellerNav(
  setCurrentView: React.Dispatch<React.SetStateAction<ViewState>>,
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>,
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>,
  setActiveChatThreadId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveSellerId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveOrderId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveReportTargetId: React.Dispatch<React.SetStateAction<string | null>>,
) {
  const openSeller = useCallback(
    (sellerId: string) => {
      setSelectedProduct(null);
      setActiveChatThreadId(null);
      setActiveSellerId(sellerId);
      setCurrentView("seller");
    },
    [setSelectedProduct, setActiveChatThreadId, setActiveSellerId, setCurrentView],
  );

  const closeSeller = useCallback(() => {
    setActiveSellerId(null);
    setCurrentView("home");
    setActiveTab("home");
  }, [setActiveSellerId, setCurrentView, setActiveTab]);

  const openReport = useCallback(
    (opts?: OpenReportOpts) => {
      setSelectedProduct(null);
      setActiveChatThreadId(null);
      if (opts?.orderId) setActiveOrderId(opts.orderId);
      setActiveReportTargetId(opts?.targetId ?? null);
      setCurrentView("report");
    },
    [
      setSelectedProduct,
      setActiveChatThreadId,
      setActiveOrderId,
      setActiveReportTargetId,
      setCurrentView,
    ],
  );

  const closeReport = useCallback(() => {
    setActiveReportTargetId(null);
    setActiveOrderId((orderId) => {
      if (orderId) {
        setCurrentView("order");
      } else {
        setActiveSellerId((sellerId) => {
          setCurrentView(sellerId ? "seller" : "home");
          if (!sellerId) setActiveTab("home");
          return sellerId;
        });
      }
      return orderId;
    });
  }, [setActiveReportTargetId, setActiveOrderId, setActiveSellerId, setCurrentView, setActiveTab]);

  return {
    openSeller,
    closeSeller,
    openReport,
    closeReport,
  };
}