"use client";

import React, { useState, useEffect } from "react";
import { useApp, Product } from "@/context/AppContext";
import { useForcedMobile } from "@/hooks/useForcedMobile";
import { DiscoverFeedView } from "@/components/DiscoverFeedView";
import { ProductDetailsView } from "@/components/ProductDetailsView";
import { ShoppingBagView } from "@/components/ShoppingBagView";
import { CheckoutFlowView } from "@/components/CheckoutFlowView";
import { UserProfileView } from "@/components/UserProfileView";
import { ActivityView } from "@/components/ActivityView";
import { SearchFiltersView } from "@/components/SearchFiltersView";
import { SettingsView } from "@/components/SettingsView";
import { SellItemView } from "@/components/SellItemView";
import { ChatOverlay } from "@/components/ChatOverlay";

type ViewState = "home" | "search" | "sell" | "activity" | "profile" | "bag" | "checkout" | "settings" | "loves";

/**
 * Deep-link preview page.
 * Accepts query params so a specific view can be loaded via URL:
 *   /preview?view=search
 *   /preview?product=handbag-tan
 *   /preview?checkout=handbag-tan
 *   /preview?chat=chat-handbag-tan
 *
 * Designed to be used in iframes for marketing, stakeholder demos,
 * and embedding previews inside external documentation.
 */
export default function PreviewPage() {
  const { listings } = useApp();
  // Force the app to render at a fixed mobile width when `?mobile=1` is set.
  useForcedMobile();

  const [activeTab, setActiveTab] = useState<"home" | "search" | "sell" | "activity" | "profile">("home");
  const [currentView, setCurrentView] = useState<ViewState>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [activeChatThreadId, setActiveChatThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view") as ViewState | null;
    if (v && ["home", "search", "sell", "activity", "profile", "bag", "checkout", "settings", "loves"].includes(v)) {
      setCurrentView(v);
      if (v === "search") setActiveTab("search");
      else if (v === "sell") setActiveTab("sell");
      else if (v === "activity") setActiveTab("activity");
      else if (v === "profile") setActiveTab("profile");
      else setActiveTab("home");
    }
    const productId = params.get("product");
    if (productId) {
      const found = listings.find(p => p.id === productId);
      if (found) setSelectedProduct(found);
    }
    const checkoutId = params.get("checkout");
    if (checkoutId) {
      const found = listings.find(p => p.id === checkoutId);
      if (found) {
        setCheckoutProduct(found);
        setCurrentView("checkout");
      }
    }
    const chatId = params.get("chat");
    if (chatId) setActiveChatThreadId(chatId);
  }, [listings]);

  return (
    <div className="min-h-dvh flex flex-col bg-background text-on-background antialiased">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-lg mt-md flex-grow flex flex-col">
        {selectedProduct ? (
          <ProductDetailsView
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onNavigateToCart={() => {
              setSelectedProduct(null);
              setCurrentView("bag");
            }}
            onStartChat={(p) => setActiveChatThreadId(`chat-${p.id}`)}
            onCheckoutProduct={(p) => {
              setCheckoutProduct(p);
              setCurrentView("checkout");
            }}
          />
        ) : activeChatThreadId ? (
          <ChatOverlay
            threadId={activeChatThreadId}
            onBack={() => setActiveChatThreadId(null)}
            onCheckout={() => {
              if (selectedProduct) {
                setActiveChatThreadId(null);
                setCheckoutProduct(selectedProduct);
                setCurrentView("checkout");
              } else {
                setActiveChatThreadId(null);
                setCurrentView("bag");
              }
            }}
          />
        ) : currentView === "home" ? (
          <DiscoverFeedView
            onSelectProduct={(p) => setSelectedProduct(p)}
            onNavigate={(view) => {
              const v = view as ViewState;
              setCurrentView(v);
            }}
          />
        ) : currentView === "search" ? (
          <SearchFiltersView
            onSelectProduct={(p) => setSelectedProduct(p)}
            onBack={() => {
              setCurrentView("home");
              setActiveTab("home");
            }}
          />
        ) : currentView === "sell" ? (
          <SellItemView
            onBack={() => {
              setCurrentView("home");
              setActiveTab("home");
            }}
            onSuccess={() => {
              setCurrentView("home");
              setActiveTab("home");
            }}
          />
        ) : currentView === "activity" ? (
          <ActivityView
            onBack={() => {
              setCurrentView("home");
              setActiveTab("home");
            }}
            onNavigateToChats={() => {
              setCurrentView("profile");
              setActiveTab("profile");
            }}
          />
        ) : currentView === "profile" ? (
          <UserProfileView
            onSelectProduct={(p) => setSelectedProduct(p)}
            onOpenChat={(id) => setActiveChatThreadId(id)}
          />
        ) : currentView === "bag" ? (
          <ShoppingBagView
            onBack={() => {
              setCurrentView("home");
              setActiveTab("home");
            }}
            onCheckout={() => setCurrentView("checkout")}
          />
        ) : currentView === "checkout" ? (
          <CheckoutFlowView
            checkoutProduct={checkoutProduct}
            onBack={() => {
              setCheckoutProduct(null);
              setCurrentView(checkoutProduct ? "home" : "bag");
            }}
            onSuccess={() => {
              setCheckoutProduct(null);
              setCurrentView("home");
              setActiveTab("home");
            }}
          />
        ) : currentView === "settings" ? (
          <SettingsView
            onBack={() => {
              setCurrentView("home");
              setActiveTab("home");
            }}
          />
        ) : (
          <DiscoverFeedView
            onSelectProduct={(p) => setSelectedProduct(p)}
            onNavigate={(view) => setCurrentView(view as ViewState)}
          />
        )}
      </main>
    </div>
  );
}
