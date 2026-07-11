"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { useForcedMobile } from "@/hooks/useForcedMobile";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { AppContent } from "@/components/AppContent";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function Home() {
  const { language, cart } = useApp();
  const isAr = language === "ar";
  // When `?mobile=1` is in the URL, the app re-renders at a fixed mobile
  // width (no extra wrapper, no visual frame) so it can be embedded cleanly
  // inside iframes. See useForcedMobile for details.
  useForcedMobile();

  const nav = useAppNavigation();
  const {
    activeTab,
    currentView,
    selectedProduct,
    activeChatThreadId,
    changeTab,
    setView,
  } = nav;

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Hide chrome (header + bottom nav) when a full-page overlay is active.
  const showHeader =
    !selectedProduct &&
    !activeChatThreadId &&
    currentView !== "checkout" &&
    currentView !== "bag";
  const showBottomNav =
    !selectedProduct && !activeChatThreadId && currentView !== "checkout";

  return (
    <div className="min-h-dvh flex flex-col pb-24 md:pb-0 bg-background text-on-background antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Skip to main content — visible on keyboard focus only */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        {isAr ? "تخطي إلى المحتوى" : "Skip to content"}
      </a>

      {/* Top App Bar */}
      {showHeader && (
        <header className="w-full sticky top-0 z-50 bg-surface/85 backdrop-blur-md border-b border-surface-container-high flex items-center justify-between px-margin-mobile py-md">
          {/* Menu / Settings */}
          <button
            onClick={() => setView("settings")}
            className="text-primary active:scale-95 transition-transform p-2 rounded-full flex items-center justify-center hover:bg-surface-container-low"
            aria-label={isAr ? "الإعدادات" : "Settings"}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              aria-hidden="true"
            >
              settings
            </span>
          </button>

          {/* Title Logo */}
          <h1
            onClick={() => changeTab("home")}
            className="font-serif text-display-lg-mobile text-primary italic cursor-pointer tracking-widest hover:opacity-85 select-none"
          >
            Mooday
          </h1>

          {/* Shopping Bag Button & Count Badge */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView("bag")}
              className="text-primary active:scale-95 transition-transform p-2 rounded-full flex items-center justify-center hover:bg-surface-container-low relative"
              aria-label={isAr ? "حقيبة التسوق" : "Shopping Bag"}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                aria-hidden="true"
              >
                shopping_bag
              </span>
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
      <main
        id="main-content"
        className="w-full max-w-container-max mx-auto px-margin-mobile md:px-lg mt-md flex-grow flex flex-col"
      >
        <AppContent nav={nav} />
      </main>

      {/* Bottom Nav Bar */}
      {showBottomNav && (
        <nav className="fixed bottom-0 w-full z-40 pb-safe border-t border-surface-container-high bg-surface/95 backdrop-blur-md flex justify-around items-center h-20 px-gutter shadow-lg">
          <BottomNavButton
            tab="home"
            activeTab={activeTab}
            onClick={() => changeTab("home")}
            icon="home"
            label={isAr ? "الرئيسية" : "Home"}
          />
          <BottomNavButton
            tab="search"
            activeTab={activeTab}
            onClick={() => changeTab("search")}
            icon="search"
            label={isAr ? "بحث" : "Search"}
          />

          {/* Elevated Sell Button */}
          <button
            onClick={() => changeTab("sell")}
            className="flex flex-col items-center justify-center -mt-8 active:scale-95 transition-transform"
            aria-label={isAr ? "بيع" : "Sell"}
          >
            <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-xl btn-tactile border-4 border-surface">
              <span
                className="material-symbols-outlined text-[30px] no-mirror"
                aria-hidden="true"
              >
                add
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest mt-1 text-primary font-bold">
              {isAr ? "بيع" : "Sell"}
            </span>
          </button>

          <BottomNavButton
            tab="activity"
            activeTab={activeTab}
            onClick={() => changeTab("activity")}
            icon="favorite"
            label={isAr ? "النشاط" : "Activity"}
          />
          <BottomNavButton
            tab="profile"
            activeTab={activeTab}
            onClick={() => changeTab("profile")}
            icon="person"
            label={isAr ? "الخزنة" : "Vault"}
          />
        </nav>
      )}

      <InstallPrompt />
    </div>
  );
}

interface BottomNavButtonProps {
  tab: "home" | "search" | "sell" | "activity" | "profile";
  activeTab: "home" | "search" | "sell" | "activity" | "profile";
  onClick: () => void;
  icon: string;
  label: string;
}

const BottomNavButton: React.FC<BottomNavButtonProps> = ({
  tab,
  activeTab,
  onClick,
  icon,
  label,
}) => {
  const isActive = activeTab === tab;
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={`flex flex-col items-center justify-center px-4 py-1 active:scale-95 transition-transform ${
        isActive
          ? "text-primary font-bold"
          : "text-on-surface-variant opacity-60"
      }`}
    >
      <span
        className="material-symbols-outlined text-[26px] no-mirror"
        aria-hidden="true"
        style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
      >
        {icon}
      </span>
      <span className="text-[10px] uppercase tracking-widest mt-1">
        {label}
      </span>
    </button>
  );
};
