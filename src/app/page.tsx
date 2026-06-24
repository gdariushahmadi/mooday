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

export default function Home() {
  const { language, setLanguage, cart, createChatThread, listings } = useApp();
  const isAr = language === "ar";
  // When `?mobile=1` is in the URL, the app re-renders at a fixed mobile
  // width (no extra wrapper, no visual frame) so it can be embedded cleanly
  // inside iframes. See useForcedMobile for details.
  useForcedMobile();

  // App Navigation States
  const [activeTab, setActiveTab] = useState<"home" | "search" | "sell" | "activity" | "profile">("home");
  const [currentView, setCurrentView] = useState<ViewState>("home");

  // Overlay Views States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [activeChatThreadId, setActiveChatThreadId] = useState<string | null>(null);

  // Deep-link via URL query params (used by showcase iframes).
  // Example: /?mobile=1&view=search   /?mobile=1&product=handbag-tan
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
      const found = listings.find((p) => p.id === productId);
      if (found) setSelectedProduct(found);
    }
    const checkoutId = params.get("checkout");
    if (checkoutId) {
      const found = listings.find((p) => p.id === checkoutId);
      if (found) {
        setCheckoutProduct(found);
        setCurrentView("checkout");
      }
    }
    const chatId = params.get("chat");
    if (chatId) setActiveChatThreadId(chatId);
  }, [listings]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView("settings"); // Set dummy view state so details overlay triggers correctly
  };

  const handleNavigateToCart = () => {
    setSelectedProduct(null);
    setCurrentView("bag");
  };

  const handleStartChat = (product: Product) => {
    const threadId = createChatThread(product);
    setActiveChatThreadId(threadId);
  };

  const handleCheckoutProduct = (product: Product) => {
    setCheckoutProduct(product);
    setCurrentView("checkout");
  };

  const handleTabChange = (tab: "home" | "search" | "sell" | "activity" | "profile") => {
    setSelectedProduct(null);
    setActiveTab(tab);
    
    // Map tabs to views
    if (tab === "home") setCurrentView("home");
    else if (tab === "search") setCurrentView("search");
    else if (tab === "sell") setCurrentView("sell");
    else if (tab === "activity") setCurrentView("activity");
    else if (tab === "profile") setCurrentView("profile");
  };

  return (
    <div className="min-h-dvh flex flex-col pb-24 md:pb-0 bg-background text-on-background antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      
      {/* Top App Bar (Only visible when no overlays are active) */}
      {!selectedProduct && !activeChatThreadId && currentView !== "checkout" && currentView !== "bag" && (
        <header className="w-full sticky top-0 z-50 bg-surface/85 backdrop-blur-md border-b border-surface-container-high flex items-center justify-between px-margin-mobile py-md">
          {/* Menu / Settings */}
          <button
            onClick={() => setCurrentView("settings")}
            className="text-primary active:scale-95 transition-transform p-2 rounded-full flex items-center justify-center hover:bg-surface-container-low"
            aria-label="Menu Settings"
          >
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </button>

          {/* Title Logo */}
          <h1
            onClick={() => handleTabChange("home")}
            className="font-serif text-display-lg-mobile text-primary italic cursor-pointer tracking-widest hover:opacity-85 select-none"
          >
            Mooday
          </h1>

          {/* Shopping Bag Button & Count Badge */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentView("bag")}
              className="text-primary active:scale-95 transition-transform p-2 rounded-full flex items-center justify-center hover:bg-surface-container-low relative"
              aria-label="Shopping Bag"
            >
              <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4.5 h-4.5 bg-primary text-on-primary text-[10px] font-bold rounded-full flex items-center justify-center font-sans">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>
      )}

      {/* Main Content View Switcher */}
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-lg mt-md flex-grow flex flex-col">
        {selectedProduct ? (
          <ProductDetailsView
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onNavigateToCart={handleNavigateToCart}
            onStartChat={handleStartChat}
            onCheckoutProduct={handleCheckoutProduct}
          />
        ) : activeChatThreadId ? (
          <ChatOverlay
            threadId={activeChatThreadId}
            onBack={() => setActiveChatThreadId(null)}
            onCheckout={() => {
              const thread = createChatThread(selectedProduct || listings[0]); // fallback
              setActiveChatThreadId(null);
              // Find the associated product to checkout
              const associatedProduct = selectedProduct;
              if (associatedProduct) {
                handleCheckoutProduct(associatedProduct);
              } else {
                setCurrentView("bag");
              }
            }}
          />
        ) : currentView === "home" ? (
          <DiscoverFeedView
            onSelectProduct={handleSelectProduct}
            onNavigate={(view) => handleTabChange(view as any)}
          />
        ) : currentView === "search" ? (
          <SearchFiltersView
            onSelectProduct={handleSelectProduct}
            onBack={() => handleTabChange("home")}
          />
        ) : currentView === "sell" ? (
          <SellItemView
            onBack={() => handleTabChange("home")}
            onSuccess={() => handleTabChange("home")}
          />
        ) : currentView === "activity" ? (
          <ActivityView
            onBack={() => handleTabChange("home")}
            onNavigateToChats={() => {
              setCurrentView("profile");
              setActiveTab("profile");
              // Note: the UserProfileView has a Chats tab that will show the active chats
            }}
          />
        ) : currentView === "profile" ? (
          <UserProfileView
            onSelectProduct={handleSelectProduct}
            onOpenChat={(id) => setActiveChatThreadId(id)}
          />
        ) : currentView === "bag" ? (
          <ShoppingBagView
            onBack={() => handleTabChange("home")}
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
              handleTabChange("home");
            }}
          />
        ) : currentView === "settings" ? (
          <SettingsView onBack={() => handleTabChange("home")} />
        ) : (
          <DiscoverFeedView
            onSelectProduct={handleSelectProduct}
            onNavigate={(view) => handleTabChange(view as any)}
          />
        )}
      </main>

      {/* Bottom Nav Bar (Only visible when no full-page overlays are active) */}
      {!selectedProduct && !activeChatThreadId && currentView !== "checkout" && (
        <nav className="fixed bottom-0 w-full z-40 pb-safe border-t border-surface-container-high bg-surface/95 backdrop-blur-md flex justify-around items-center h-20 px-gutter shadow-lg">
          <button
            onClick={() => handleTabChange("home")}
            className={`flex flex-col items-center justify-center px-4 py-1 active:scale-95 transition-transform ${
              activeTab === "home" ? "text-primary font-bold" : "text-on-surface-variant opacity-60"
            }`}
          >
            <span
              className="material-symbols-outlined text-[26px] no-mirror"
              style={{ fontVariationSettings: `'FILL' ${activeTab === "home" ? 1 : 0}` }}
            >
              home
            </span>
            <span className="text-[10px] uppercase tracking-widest mt-1">
              {isAr ? "الرئيسية" : "Home"}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("search")}
            className={`flex flex-col items-center justify-center px-4 py-1 active:scale-95 transition-transform ${
              activeTab === "search" ? "text-primary font-bold" : "text-on-surface-variant opacity-60"
            }`}
          >
            <span
              className="material-symbols-outlined text-[26px] no-mirror"
              style={{ fontVariationSettings: `'FILL' ${activeTab === "search" ? 1 : 0}` }}
            >
              search
            </span>
            <span className="text-[10px] uppercase tracking-widest mt-1">
              {isAr ? "بحث" : "Search"}
            </span>
          </button>

          {/* Elevated Sell Button */}
          <button
            onClick={() => handleTabChange("sell")}
            className="flex flex-col items-center justify-center -mt-8 active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-xl btn-tactile border-4 border-surface">
              <span className="material-symbols-outlined text-[30px] no-mirror">add</span>
            </div>
            <span className="text-[10px] uppercase tracking-widest mt-1 text-primary font-bold">
              {isAr ? "بيع" : "Sell"}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("activity")}
            className={`flex flex-col items-center justify-center px-4 py-1 active:scale-95 transition-transform ${
              activeTab === "activity" ? "text-primary font-bold" : "text-on-surface-variant opacity-60"
            }`}
          >
            <span
              className="material-symbols-outlined text-[26px] no-mirror"
              style={{ fontVariationSettings: `'FILL' ${activeTab === "activity" ? 1 : 0}` }}
            >
              favorite
            </span>
            <span className="text-[10px] uppercase tracking-widest mt-1">
              {isAr ? "النشاط" : "Activity"}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("profile")}
            className={`flex flex-col items-center justify-center px-4 py-1 active:scale-95 transition-transform ${
              activeTab === "profile" ? "text-primary font-bold" : "text-on-surface-variant opacity-60"
            }`}
          >
            <span
              className="material-symbols-outlined text-[26px] no-mirror"
              style={{ fontVariationSettings: `'FILL' ${activeTab === "profile" ? 1 : 0}` }}
            >
              person
            </span>
            <span className="text-[10px] uppercase tracking-widest mt-1">
              {isAr ? "الخزنة" : "Vault"}
            </span>
          </button>
        </nav>
      )}
    </div>
  );
}
