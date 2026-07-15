"use client";

/**
 * AuthSheet — quick-action sheet offered from the top bar when the user
 * is not signed in. Avoids forcing a full page navigation just to access
 * auth screens from anywhere in the app.
 */

import React from "react";
import { useApp } from "@/context/AppContext";

interface AuthSheetProps {
  open: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onSocial: () => void;
}

const COPY = {
  en: {
    title: "Save your closet across devices",
    body: "Sign in to access your wardrobe, conversations and active listings on any device.",
    signIn: "Sign in",
    create: "Create account",
    social: "Continue with Google or Apple",
    dismiss: "Not now",
  },
  ar: {
    title: "احفظي خزانتك على كل أجهزتك",
    body: "سجّلي دخولكِ للوصول إلى خزانتكِ ومحادثاتكِ وإعلاناتكِ النشطة على أي جهاز.",
    signIn: "تسجيل الدخول",
    create: "إنشاء حساب",
    social: "المتابعة عبر Google أو Apple",
    dismiss: "ليس الآن",
  },
} as const;

export const AuthSheet: React.FC<AuthSheetProps> = ({
  open,
  onClose,
  onSignIn,
  onSignUp,
  onSocial,
}) => {
  const { language } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "تسجيل الدخول" : "Sign in"}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        dir={isAr ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[480px] bg-surface rounded-t-3xl sm:rounded-3xl p-lg shadow-2xl flex flex-col gap-md"
      >
        <div className="flex flex-col gap-sm">
          <h2 className="font-serif text-headline-sm text-primary tracking-wide">
            {t.title}
          </h2>
          <p className="text-body-md text-on-surface-variant">{t.body}</p>
        </div>

        <button
          type="button"
          onClick={onSignUp}
          className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold btn-tactile active:scale-[0.98] transition-transform"
        >
          {t.create}
        </button>

        <button
          type="button"
          onClick={onSignIn}
          className="w-full py-3 rounded-xl border border-outline-variant bg-surface-container-low text-primary text-label-md uppercase tracking-widest font-bold hover:bg-surface-container-high active:scale-[0.98] transition-transform"
        >
          {t.signIn}
        </button>

        <button
          type="button"
          onClick={onSocial}
          className="w-full text-label-sm text-on-surface underline underline-offset-4 hover:text-primary transition-colors py-1"
        >
          {t.social}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="text-label-sm text-on-surface-variant hover:text-on-surface transition-colors py-1"
        >
          {t.dismiss}
        </button>
      </div>
    </div>
  );
};
