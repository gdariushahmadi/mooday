"use client";

/**
 * Social Login — A-06.
 *
 * Phase 1 mock: tapping Google/Apple creates a derived user (email like
 * `layla@google.mooday`) if it doesn't exist, then auto-signs them in.
 *
 * Phase 2 swaps for real Google/Apple OIDC. UI stays the same.
 */

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";

interface SocialLoginViewProps {
  onBack: () => void;
  onSignIn: () => void;
  onSuccess: () => void;
}

const COPY = {
  en: {
    title: "One-tap sign in",
    sub: "Use the account you already use every day.",
    google: "Continue with Google",
    apple: "Continue with Apple",
    skipping: "Just signing you in…",
    back: "Back",
    noAccount: "Use email instead",
    providersNote:
      "Phase 1 preview — we won't ask your real Google or Apple password.",
  },
  ar: {
    title: "تسجيل دخول بنقرة واحدة",
    sub: "استخدمي الحساب الذي تستخدمينه يومياً.",
    google: "المتابعة عبر Google",
    apple: "المتابعة عبر Apple",
    skipping: "جارٍ تسجيل دخولك…",
    back: "رجوع",
    noAccount: "استخدام البريد بدلاً من ذلك",
    providersNote:
      "معاينة المرحلة الأولى — لن نطلب كلمة مرور حسابك الفعلية.",
  },
} as const;

export const SocialLoginView: React.FC<SocialLoginViewProps> = ({
  onBack,
  onSignIn,
  onSuccess,
}) => {
  const { language, signIn, signUp, signInWithOAuth, authMode } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);

  const handleProvider = async (provider: "google" | "apple") => {
    setBusy(provider);
    if (authMode === "supabase" && signInWithOAuth) {
      try {
        await signInWithOAuth(provider);
      } finally {
        setBusy(null);
      }
      return;
    }
    const email =
      provider === "google"
        ? "user.google@mooday.app"
        : "user.apple@mooday.app";
    const name = provider === "google" ? "Google User" : "Apple User";
    // Ensure the social user exists, then sign them in.
    const id = await Promise.resolve(signUp({
      name,
      email,
      phone: "",
      password: "social-1234", // any value; the password isn't checked here.
    }));
    void id;
    const ok = await Promise.resolve(
      signIn({ email, password: "social-1234" }),
    );
    setBusy(null);
    if (ok) onSuccess();
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
      data-testid="social-login"
      className="w-full max-w-[480px] mx-auto flex flex-col gap-lg pb-10 font-sans"
    >
      <header className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span
            className="material-symbols-outlined no-mirror"
            aria-hidden="true"
          >
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-headline-sm text-primary tracking-widest uppercase flex-grow text-center">
          {t.title}
        </h1>
        <div className="w-10" aria-hidden="true" />
      </header>

      <p className="text-body-md text-on-surface-variant text-center px-md -mt-md">
        {t.sub}
      </p>

      <div className="flex flex-col gap-md mt-sm">
        <button
          type="button"
          onClick={() => handleProvider("google")}
          disabled={busy !== null}
          className="flex items-center justify-center gap-md bg-white text-[#1f1f1f] border border-outline-variant rounded-xl py-4 px-md text-body-lg font-bold hover:bg-surface-container-lowest active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
        >
          <GoogleIcon />
          <span>{busy === "google" ? t.skipping : t.google}</span>
        </button>
        <button
          type="button"
          onClick={() => handleProvider("apple")}
          disabled={busy !== null}
          className="flex items-center justify-center gap-md bg-[#1f1f1f] text-white border border-[#1f1f1f] rounded-xl py-4 px-md text-body-lg font-bold hover:opacity-90 active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
        >
          <AppleIcon />
          <span>{busy === "apple" ? t.skipping : t.apple}</span>
        </button>
      </div>

      <p className="text-label-sm text-on-surface-variant text-center mt-md">
        {t.providersNote}
      </p>

      <button
        type="button"
        onClick={onSignIn}
        className="text-label-sm text-on-surface underline underline-offset-4 self-center hover:text-primary transition-colors"
      >
        {t.noAccount}
      </button>
    </div>
  );
};

const GoogleIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 48 48"
    aria-hidden="true"
    className="flex-shrink-0"
  >
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.5-6 7.7-11.3 7.7-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C33.5 6.2 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.3-3.5z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C33.5 6.2 29 4.5 24 4.5 16.3 4.5 9.7 8.7 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 43.5c5 0 9.5-1.8 13-4.7l-6-5c-2 1.4-4.5 2.2-7 2.2-5.3 0-9.7-3.2-11.3-7.7l-6.5 5C9.6 39.4 16.2 43.5 24 43.5z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6 5c4.1-3.7 6.5-9.2 6.5-14.6 0-1.2-.1-2.4-.3-3.5z"
    />
  </svg>
);

const AppleIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="flex-shrink-0"
  >
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);
