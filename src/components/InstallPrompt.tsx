"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/hooks";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "mooday.installPrompt.dismissedAt";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

export function InstallPrompt() {
  const hydrated = useHydrated();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installedHint, setInstalledHint] = useState(false);

  // If the app is already installed (standalone mode), render nothing.
  const isCurrentlyInstalled = (hydrated && isStandalone()) || installed;
  const isCurrentlyIOS = hydrated && isIOS();

  useEffect(() => {
    if (!hydrated || isCurrentlyInstalled) return;

    // Respect the 7-day dismissal cooldown.
    const dismissedAt = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      // Wait a moment so the prompt doesn't pop on first paint.
      window.setTimeout(() => setVisible(true), 4000);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // On iOS, the only way to install is via the share sheet, so we surface
    // a small instruction banner after a short delay.
    if (isCurrentlyIOS) {
      window.setTimeout(() => setVisible(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [hydrated, isCurrentlyInstalled, isCurrentlyIOS]);

  const handleInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setVisible(false);
    } else if (isCurrentlyIOS) {
      setInstalledHint(true);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  };

  if (isCurrentlyInstalled || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Mooday"
      dir="ltr"
      className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] w-[min(94vw,420px)] rounded-2xl border border-surface-container-high bg-surface shadow-2xl p-4 flex items-center gap-3 backdrop-blur-md"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      <div className="w-12 h-12 rounded-xl shrink-0 bg-gradient-to-br from-[#673657] via-[#512443] to-[#3a0e2f] flex items-center justify-center text-[#ffd8ed] font-serif italic text-3xl leading-none">
        M
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-on-surface font-semibold text-sm">Install Mooday</p>
        <p className="text-on-surface-variant text-xs mt-0.5">
          {isCurrentlyIOS
            ? "Tap the share button, then “Add to Home Screen”."
            : "Add to your home screen for a faster, app-like experience."}
        </p>
        {installedHint && isCurrentlyIOS && (
          <p className="text-primary text-[11px] mt-1">
            Look for the share icon <span className="font-bold">⎋</span> at the
            bottom of Safari.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="bg-primary text-on-primary text-xs font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
        >
          {isCurrentlyIOS ? "How to" : "Install"}
        </button>
        <button
          onClick={handleDismiss}
          className="text-on-surface-variant text-[11px] px-3 py-1 rounded-full active:scale-95 transition-transform"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
