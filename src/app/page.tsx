"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { useForcedMobile } from "@/hooks/useForcedMobile";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useWelcomeGuard } from "@/hooks/useWelcomeGuard";
import { AppContent } from "@/components/AppContent";
import { WelcomeView } from "@/components/WelcomeView";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function Home() {
  const { language, cart } = useApp();
  const isAr = language === "ar";
  // When `?mobile=1` is in the URL, the app re-renders at a fixed mobile
  // width (no extra wrapper, no visual frame) so it can be embedded cleanly
  // inside iframes. See useForcedMobile for details.
  useForcedMobile();

  const nav = useAppNavigation();
  const welcome = useWelcomeGuard();
  const {
    activeTab,
    currentView,
    selectedProduct,
    activeChatThreadId,
    changeTab,
    setView,
    openSignIn,
    openSignUp,
  } = nav;

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cold-launch welcome screen takes over the whole app until the user
  // confirms. After that, the normal shell renders.
  if (welcome.shouldShow) {
    return (
      <WelcomeView
        onEnter={welcome.markSeen}
        onSignIn={() => {
          welcome.markSeen();
          openSignIn();
        }}
        onSignUp={() => {
          welcome.markSeen();
          openSignUp();
        }}
      />
    );
  }

  // Hide chrome (header + bottom nav) when a full-page overlay is active.
  const showHeader =
    !selectedProduct &&
    !activeChatThreadId &&
    currentView !== "checkout" &&
    currentView !== "bag";
  const showBottomNav =
    !selectedProduct &&
    !activeChatThreadId &&
    currentView !== "checkout" &&
    currentView !== "bag";

  return (
    <div
      className={`min-h-dvh flex flex-col bg-background text-on-background antialiased selection:bg-primary-fixed selection:text-on-primary-fixed ${
        showBottomNav ? "app-shell-with-nav" : ""
      }`}
    >
      {/* Skip to main content — visible on keyboard focus only */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        {isAr ? "تخطي إلى المحتوى" : "Skip to content"}
      </a>

      {/* Top App Bar */}
      {showHeader && (
        <header
          data-testid="app-header"
          className="app-shell-header sticky top-0 z-50 grid w-full grid-cols-[44px_minmax(0,1fr)_44px] items-center border-b border-surface-container-high bg-surface/90 px-margin-mobile pb-md backdrop-blur-md"
        >
          {/* Menu / Settings */}
          <button
            type="button"
            onClick={() => setView("settings")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low active:scale-95"
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
          <h1 className="min-w-0 text-center font-serif text-display-lg-mobile italic tracking-widest text-primary">
            <button
              type="button"
              onClick={() => changeTab("home")}
              className="rounded-lg px-2 py-1 transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={isAr ? "العودة إلى الرئيسية" : "Go to Home"}
            >
              Mooday
            </button>
          </h1>

          {/* Shopping Bag */}
          <button
            type="button"
            onClick={() => setView("bag")}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low active:scale-95"
            aria-label={isAr ? "حقيبة التسوق" : "Shopping Bag"}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              aria-hidden="true"
            >
              shopping_bag
            </span>
            {cartCount > 0 && (
              <span className="absolute end-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-sans text-[10px] font-bold text-on-primary">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
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
        <nav
          data-testid="bottom-navigation"
          aria-label={isAr ? "التنقل الرئيسي" : "Primary navigation"}
          className="app-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t border-surface-container-high bg-surface/95 px-sm shadow-lg backdrop-blur-md"
        >
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
            type="button"
            onClick={() => changeTab("sell")}
            className="-mt-8 flex min-h-11 min-w-0 flex-col items-center justify-center transition-transform active:scale-95"
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
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-11 min-w-0 flex-col items-center justify-center px-1 py-1 transition-transform active:scale-95 ${
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
