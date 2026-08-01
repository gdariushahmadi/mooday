"use client";

// Bilingual PWA install prompt — used only on the marketing landing.
// The app shell has its own English-only InstallPrompt that lives in
// /app and shares the same 7-day dismissal cooldown via localStorage, so
// a visitor who dismisses once won't be pestered again across either
// context.

import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/hooks";
import type { Lang } from "./copy";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

// Shared with the app-shell InstallPrompt at @/components/InstallPrompt.
const STORAGE_KEY = "mooday.installPrompt.dismissedAt";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7;

const COPY = {
  en: {
    title: "Add Mooday to your home screen",
    body: "Faster access, no app store needed — install Mooday as a lightweight app.",
    install: "Install",
    howto: "How to",
    later: "Not now",
    iosHint:
      "Look for the share icon at the bottom of Safari, then choose “Add to Home Screen”.",
  },
  ar: {
    title: "أضيفي موداي لشاشتك الرئيسية",
    body: "وصول أسرع، بلا متجر تطبيقات — ثبّتي موداي كتطبيق خفيف.",
    install: "ثبتّي",
    howto: "كيف؟",
    later: "ليس الآن",
    iosHint:
      "ابحثي عن أيقونة المشاركة في أسفل Safari، ثم اختاري “إضافة إلى الشاشة الرئيسية”.",
  },
} as const;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
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

export function LandingInstallPrompt({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const isAr = lang === "ar";
  const hydrated = useHydrated();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const isCurrentlyInstalled =
    (hydrated && isStandalone()) || installed;
  const isCurrentlyIOS = hydrated && isIOS();

  useEffect(() => {
    if (!hydrated || isCurrentlyInstalled) return;

    const dismissedAt = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      window.setTimeout(() => setVisible(true), 4500);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    if (isCurrentlyIOS) {
      window.setTimeout(() => setVisible(true), 4500);
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
      setShowIosHint(true);
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
      aria-label={isAr ? "تثبيت موداي" : "Install Mooday"}
      dir="ltr"
      className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[60] w-[min(94vw,420px)] rounded-2xl border border-surface-container-high bg-surface shadow-2xl p-4 backdrop-blur-md"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center font-serif italic text-3xl leading-none"
          style={{
            background:
              "linear-gradient(135deg, #673657 0%, #512443 60%, #3a0e2f 100%)",
            color: "#ffd8ed",
          }}
          aria-hidden="true"
        >
          M
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-on-surface font-semibold text-sm">{t.title}</p>
          <p className="text-on-surface-variant text-xs mt-0.5">{t.body}</p>
          {showIosHint && isCurrentlyIOS && (
            <p className="text-primary text-[11px] mt-1">{t.iosHint}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="bg-primary text-on-primary text-xs font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            {isCurrentlyIOS ? t.howto : t.install}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-on-surface-variant text-[11px] px-3 py-1 rounded-full active:scale-95 transition-transform"
          >
            {t.later}
          </button>
        </div>
      </div>
    </div>
  );
}
