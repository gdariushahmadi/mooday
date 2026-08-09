"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useForcedMobile } from "@/hooks/useForcedMobile";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useWelcomeGuard } from "@/hooks/useWelcomeGuard";
import { useIdleLock } from "@/hooks/useIdleLock";
import { AppContent } from "@/components/AppContent";
import { WelcomeView } from "@/components/WelcomeView";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AuthSheet } from "@/components/AuthSheet";
import { LockScreen } from "@/components/LockScreen";
import { readUrlParam } from "@/types/navigation";

/** Views that are the app's primary destinations and use shared shell chrome. */
const PRIMARY_SHELL_VIEWS = new Set([
  "home",
  "search",
  "activity",
  "profile",
]);

/** True when the URL carries an intentional deep-link destination. */
function hasIntentionalDeepLink(): boolean {
  return Boolean(
    readUrlParam("view") ||
      readUrlParam("product") ||
      readUrlParam("checkout") ||
      readUrlParam("seller") ||
      readUrlParam("category") ||
      readUrlParam("q") ||
      readUrlParam("order") ||
      readUrlParam("chat"),
  );
}

export default function Home() {
  const {
    language,
    cart,
    currentUser,
    isLocked,
    lockEnabled,
    hasPin,
    hasBiometric,
    lockTimeoutMs,
    lockNow,
  } = useApp();
  const isAr = language === "ar";
  // When `?mobile=1` is in the URL, the app re-renders at a fixed mobile
  // width (no extra wrapper, no visual frame) so it can be embedded cleanly
  // inside iframes. See useForcedMobile for details.
  useForcedMobile();

  const nav = useAppNavigation();
  const welcome = useWelcomeGuard();
  // Auto-lock timer: only ticks when the feature is on AND we have at
  // least one unlock factor registered. We deliberately keep the rest
  // of the shell mounted so any pending user interaction is preserved
  // under the overlay.
  const idle = useIdleLock({
    timeoutMs: lockTimeoutMs ?? 5 * 60_000,
    enabled: Boolean(
      lockEnabled && currentUser && (hasPin || hasBiometric) && !isLocked,
    ),
  });

  useEffect(() => {
    if (idle.expired) {
      lockNow?.();
    }
  }, [idle.expired, lockNow]);

  const {
    activeTab,
    currentView,
    selectedProduct,
    activeChatThreadId,
    changeTab,
    setView,
    openSignIn,
    openSignUp,
    openSocialLogin,
  } = nav;
  const [authSheetOpen, setAuthSheetOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cold-launch welcome screen takes over the whole app until the user
  // confirms. Skip when the URL already expresses a deep-link intent.
  const skipWelcomeForDeepLink = hasIntentionalDeepLink();
  if (welcome.shouldShow && !skipWelcomeForDeepLink) {
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

  // Keep shared chrome on the primary destinations only. Detail screens and
  // task flows own their page header and should not compete with this shell.
  const showChrome =
    !selectedProduct &&
    !activeChatThreadId &&
    PRIMARY_SHELL_VIEWS.has(currentView);
  const showHeader = showChrome;
  const showBottomNav = showChrome;

  return (
    <div
      className={`app-shell-surface min-h-dvh flex flex-col bg-background text-on-background antialiased selection:bg-primary-fixed selection:text-on-primary-fixed ${
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
          className="app-shell-header sticky top-0 z-50 grid w-full grid-cols-[88px_minmax(0,1fr)_88px] items-center border-b border-surface-container-high bg-surface/90 px-margin-mobile pb-md backdrop-blur-md"
        >
          <div className="flex items-center gap-0">
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
            {/* Account — AuthSheet when guest, Settings when signed in */}
            <button
              type="button"
              onClick={() => {
                if (currentUser) setView("settings");
                else setAuthSheetOpen(true);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low active:scale-95"
              aria-label={
                currentUser
                  ? isAr
                    ? "الحساب"
                    : "Account"
                  : isAr
                    ? "تسجيل الدخول"
                    : "Sign in"
              }
              data-testid="header-account"
            >
              {currentUser ? (
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-on-primary"
                  aria-hidden="true"
                >
                  {(currentUser.name || currentUser.email || "?").charAt(0).toUpperCase()}
                </span>
              ) : (
                <span
                  className="material-symbols-outlined text-[24px]"
                  aria-hidden="true"
                >
                  person
                </span>
              )}
            </button>
          </div>

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

          <div className="flex items-center justify-end gap-0">
            <button
              type="button"
              onClick={() => setView("notifications")}
              className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low active:scale-95"
              aria-label={isAr ? "الإشعارات" : "Notifications"}
              data-testid="header-notifications"
            >
              <span
                className="material-symbols-outlined text-[24px]"
                aria-hidden="true"
              >
                notifications
              </span>
            </button>
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
          </div>
        </header>
      )}

      <AuthSheet
        open={authSheetOpen}
        onClose={() => setAuthSheetOpen(false)}
        onSignIn={() => {
          setAuthSheetOpen(false);
          openSignIn();
        }}
        onSignUp={() => {
          setAuthSheetOpen(false);
          openSignUp();
        }}
        onSocial={() => {
          setAuthSheetOpen(false);
          openSocialLogin();
        }}
      />

      {/* Main Content View Switcher */}
      <main
        id="main-content"
        className={[
          "w-full max-w-container-max mx-auto px-margin-mobile md:px-lg",
          showChrome ? "mt-md" : "mt-0",
          "flex-grow flex flex-col",
        ].join(" ")}
      >
        <AppContent nav={nav} />
      </main>

      {/* Bottom Nav Bar */}
      {showBottomNav && (
        <nav
          data-testid="bottom-navigation"
          aria-label={isAr ? "التنقل الرئيسي" : "Primary navigation"}
          className="app-bottom-nav fixed bottom-0 z-40 grid grid-cols-5 items-center border-t border-surface-container-high bg-surface/95 px-sm shadow-lg backdrop-blur-md"
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

      {isLocked && <LockScreen />}
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
