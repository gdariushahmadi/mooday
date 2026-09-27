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
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";

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
        <AppHeader
          isAr={isAr}
          currentUser={currentUser}
          cartCount={cartCount}
          setView={setView}
          changeTab={changeTab}
          setAuthSheetOpen={setAuthSheetOpen}
        />
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
        <BottomNav
          isAr={isAr}
          activeTab={activeTab}
          changeTab={changeTab}
        />
      )}

      <InstallPrompt />

      {isLocked && <LockScreen />}
    </div>
  );
}
