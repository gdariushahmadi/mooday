"use client";

import React from "react";
import type { AppNavigation } from "@/hooks/useAppNavigation";
import { useApp } from "@/context/AppContext";
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
import { PublicSellerProfile } from "./PublicSellerProfile";
import { CategoryLandingView } from "./CategoryLandingView";
import { MyPurchasesView } from "./MyPurchasesView";
import { OrderDetailsView } from "./OrderDetailsView";
import { SellModePickerView } from "./SellModePickerView";
import { MyClosetView } from "./MyClosetView";
import { EditListingView } from "./EditListingView";
import { MySalesView } from "./MySalesView";
import { NotificationsCentreView } from "./NotificationsCentreView";
import { ChatsListView } from "./ChatsListView";

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
  const { orders, updateOrderStatus, createChatThread, listings } = useApp();
  const {
    currentView,
    selectedProduct,
    checkoutProduct,
    activeChatThreadId,
    activeSellerId,
    activeCategory,
    activeSubCategory,
    activeCategorySort,
    activeOrderId,
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
  } = nav;

  if (selectedProduct) {
    return (
      <ProductDetailsView
        product={selectedProduct}
        onBack={closeProduct}
        onNavigateToCart={navigateToCart}
        onStartChat={startChat}
        onCheckoutProduct={checkoutProductDirect}
        onOpenSeller={openSeller}
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
          onSelectCategory={openCategory}
        />
      );
    case "search":
      return (
        <SearchFiltersView onSelectProduct={selectProduct} onBack={goHome} />
      );
    case "sell":
      return <SellItemView onBack={goHome} onSuccess={goHome} />;
    case "sell-picker":
      return (
        <SellModePickerView onBack={goHome} onPickResell={openSellPicker} />
      );
    case "closet":
      return (
        <MyClosetView
          onBack={goHome}
          onEditListing={openEditListing}
          onCreateListing={openSellPicker}
          onSelectProduct={selectProduct}
        />
      );
    case "edit-listing": {
      const product = nav.activeListingId
        ? listings.find((p) => p.id === nav.activeListingId)
        : null;
      if (!product) {
        return (
          <MyClosetView
            onBack={goHome}
            onEditListing={openEditListing}
            onCreateListing={openSellPicker}
            onSelectProduct={selectProduct}
          />
        );
      }
      return (
        <EditListingView
          product={product}
          onBack={() => {
            closeEditListing();
          }}
          onSuccess={goHome}
        />
      );
    }
    case "sales":
      return (
        <MySalesView onBack={goHome} onOpenOrder={(id) => nav.openOrder(id)} />
      );
    case "notifications":
      return <NotificationsCentreView onBack={goHome} onOpenChat={openChat} />;
    case "chats":
      return (
        <ChatsListView
          onBack={() => {
            changeTab("profile");
          }}
          onOpenThread={openChat}
        />
      );
    case "activity":
      return (
        <ActivityView
          onBack={goHome}
          onOpenChat={openChat}
          onOpenNotifications={() => setView("notifications")}
        />
      );
    case "profile":
      return (
        <UserProfileView
          onSelectProduct={selectProduct}
          onOpenChat={openChat}
          onOpenPurchases={() => setView("purchases")}
          onOpenChats={() => setView("chats")}
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
    case "seller":
      if (!activeSellerId) {
        // Defensive: deep link with ?view=seller but no ?seller= id.
        return (
          <DiscoverFeedView
            onSelectProduct={selectProduct}
            onNavigate={changeTab}
            onSelectCategory={openCategory}
          />
        );
      }
      return (
        <PublicSellerProfile
          sellerId={activeSellerId}
          onBack={goHome}
          onSelectProduct={(p) => {
            closeSeller();
            selectProduct(p);
          }}
          onOpenChat={openChat}
          listings={nav.listings ?? []}
        />
      );
    case "category":
      if (!activeCategory) {
        // Defensive: deep link with ?view=category but no ?category= value.
        return (
          <DiscoverFeedView
            onSelectProduct={selectProduct}
            onNavigate={changeTab}
            onSelectCategory={openCategory}
          />
        );
      }
      return (
        <CategoryLandingView
          category={activeCategory}
          subCategory={activeSubCategory}
          sort={activeCategorySort}
          listings={nav.listings ?? []}
          onSubCategoryChange={setSubCategory}
          onSortChange={setCategorySort}
          onBack={closeCategory}
          onSelectProduct={selectProduct}
        />
      );
    case "purchases":
      return (
        <MyPurchasesView
          onBack={() => {
            changeTab("profile");
          }}
          onOpenOrder={openOrder}
        />
      );
    case "order": {
      const order = nav.activeOrderId
        ? (orders.find((o) => o.id === nav.activeOrderId) ?? null)
        : null;
      if (!order) {
        return (
          <MyPurchasesView
            onBack={() => {
              changeTab("profile");
            }}
            onOpenOrder={openOrder}
          />
        );
      }
      return (
        <OrderDetailsView
          order={order}
          onBack={closeOrder}
          onSelectProduct={selectProduct}
          onMarkReceived={(id) => {
            updateOrderStatus(id, "delivered");
          }}
          onContactSeller={(product) => {
            const threadId = createChatThread(product);
            openChat(threadId);
          }}
        />
      );
    }
    default:
      return (
        <DiscoverFeedView
          onSelectProduct={selectProduct}
          onNavigate={changeTab}
          onSelectCategory={openCategory}
        />
      );
  }
};
