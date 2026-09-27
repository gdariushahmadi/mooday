import type React from "react";
import { useCallback } from "react";
import type { Product } from "@/context/AppContext";
import type { TabId, ViewState } from "@/types/navigation";
import type { OpenReportOpts, Awaitable } from "./types";


export function useProfileNav(
  setCurrentView: React.Dispatch<React.SetStateAction<ViewState>>,
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>,
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>,
  setActiveChatThreadId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveSellerId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveCategory: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveOrderId: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveListingId: React.Dispatch<React.SetStateAction<string | null>>,
) {
  const openCloset = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(null);
    setCurrentView("closet");
  }, [
    setSelectedProduct,
    setActiveChatThreadId,
    setActiveSellerId,
    setActiveCategory,
    setActiveOrderId,
    setActiveListingId,
    setCurrentView,
  ]);

  const closeCloset = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, [setCurrentView, setActiveTab]);

  const openSales = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(null);
    setCurrentView("sales");
  }, [
    setSelectedProduct,
    setActiveChatThreadId,
    setActiveSellerId,
    setActiveCategory,
    setActiveOrderId,
    setActiveListingId,
    setCurrentView,
  ]);

  const closeSales = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, [setCurrentView, setActiveTab]);

  const openNotifications = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveOrderId(null);
    setCurrentView("notifications");
  }, [setSelectedProduct, setActiveChatThreadId, setActiveOrderId, setCurrentView]);

  const closeNotifications = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, [setCurrentView, setActiveTab]);

  const openEditProfile = useCallback(() => {
    setCurrentView("edit-profile");
  }, [setCurrentView]);

  const closeEditProfile = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, [setCurrentView, setActiveTab]);

  const openAddresses = useCallback(() => {
    setCurrentView("addresses");
  }, [setCurrentView]);

  const closeAddresses = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, [setCurrentView, setActiveTab]);

  const openPaymentMethods = useCallback(() => {
    setCurrentView("payment-methods");
  }, [setCurrentView]);

  const closePaymentMethods = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, [setCurrentView, setActiveTab]);

  const openHelp = useCallback(() => {
    setCurrentView("help");
  }, [setCurrentView]);

  const closeHelp = useCallback(() => {
    setCurrentView("settings");
  }, [setCurrentView]);

  const openMyReviews = useCallback(() => {
    setCurrentView("my-reviews");
  }, [setCurrentView]);

  const closeMyReviews = useCallback(() => {
    setCurrentView("purchases");
  }, [setCurrentView]);

  const openPayouts = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setCurrentView("payouts");
  }, [setSelectedProduct, setActiveChatThreadId, setCurrentView]);

  const closePayouts = useCallback(() => {
    setCurrentView("home");
    setActiveTab("profile");
  }, [setCurrentView, setActiveTab]);

  const openBlockedUsers = useCallback(() => {
    setCurrentView("blocked-users");
  }, [setCurrentView]);

  const closeBlockedUsers = useCallback(() => {
    setCurrentView("settings");
  }, [setCurrentView]);

  const openSecuritySetup = useCallback(() => {
    setCurrentView("security-setup");
  }, [setCurrentView]);

  const closeSecuritySetup = useCallback(() => {
    setCurrentView("settings");
  }, [setCurrentView]);

  const openDisputesList = useCallback(() => {
    setCurrentView("disputes-list");
  }, [setCurrentView]);

  const closeDisputesList = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, [setCurrentView, setActiveTab]);

  return {
    openCloset,
    closeCloset,
    openSales,
    closeSales,
    openNotifications,
    closeNotifications,
    openEditProfile,
    closeEditProfile,
    openAddresses,
    closeAddresses,
    openPaymentMethods,
    closePaymentMethods,
    openHelp,
    closeHelp,
    openMyReviews,
    closeMyReviews,
    openPayouts,
    closePayouts,
    openBlockedUsers,
    closeBlockedUsers,
    openSecuritySetup,
    closeSecuritySetup,
    openDisputesList,
    closeDisputesList,
  };
}