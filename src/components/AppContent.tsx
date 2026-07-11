"use client";

import React from "react";
import type { AppNavigation } from "@/hooks/useAppNavigation";
import { DiscoverFeedView } from "./DiscoverFeedView";
import { ProductDetailsView } from "./ProductDetailsView";
import { ShoppingBagView } from "./ShoppingBagView";
import { CheckoutFlowView } from "./CheckoutFlowView";
import { UserProfileView } from "./UserProfileView";
import { ActivityView } from "./ActivityView";
import { SearchFiltersView } from "./SearchFiltersView";
import { SettingsView } from "./SettingsView";
import { SellItemView } from "./SellItemView";
import { ChatOverlay } from "./ChatOverlay";

interface AppContentProps {
  nav: AppNavigation;
}

/**
 * Renders the active view based on navigation state.
 *
 * This is the shared view-switching logic used by both the main app shell
 * (`/`) and the preview shell (`/preview`). The shell is responsible for
 * chrome (header, bottom nav, install prompt) and passes the navigation
 * state down to this component.
 */
export const AppContent: React.FC<AppContentProps> = ({ nav }) => {
  const {
    currentView,
    selectedProduct,
    checkoutProduct,
    activeChatThreadId,
    selectProduct,
    closeProduct,
    navigateToCart,
    startChat,
    closeChat,
    checkoutFromActiveChat,
    checkoutProductDirect,
    checkoutBack,
    checkoutSuccess,
    changeTab,
    goHome,
    setView,
    openChat,
  } = nav;

  if (selectedProduct) {
    return (
      <ProductDetailsView
        product={selectedProduct}
        onBack={closeProduct}
        onNavigateToCart={navigateToCart}
        onStartChat={startChat}
        onCheckoutProduct={checkoutProductDirect}
      />
    );
  }

  if (activeChatThreadId) {
    return (
      <ChatOverlay
        threadId={activeChatThreadId}
        onBack={closeChat}
        onCheckout={checkoutFromActiveChat}
      />
    );
  }

  switch (currentView) {
    case "home":
      return (
        <DiscoverFeedView
          onSelectProduct={selectProduct}
          onNavigate={changeTab}
        />
      );
    case "search":
      return (
        <SearchFiltersView onSelectProduct={selectProduct} onBack={goHome} />
      );
    case "sell":
      return <SellItemView onBack={goHome} onSuccess={goHome} />;
    case "activity":
      return (
        <ActivityView
          onBack={goHome}
          onNavigateToChats={() => {
            setView("profile");
            changeTab("profile");
          }}
        />
      );
    case "profile":
      return (
        <UserProfileView
          onSelectProduct={selectProduct}
          onOpenChat={openChat}
        />
      );
    case "bag":
      return (
        <ShoppingBagView
          onBack={goHome}
          onCheckout={() => setView("checkout")}
        />
      );
    case "checkout":
      return (
        <CheckoutFlowView
          checkoutProduct={checkoutProduct}
          onBack={checkoutBack}
          onSuccess={checkoutSuccess}
        />
      );
    case "settings":
      return <SettingsView onBack={goHome} />;
    default:
      return (
        <DiscoverFeedView
          onSelectProduct={selectProduct}
          onNavigate={changeTab}
        />
      );
  }
};
