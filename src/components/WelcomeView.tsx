"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";

interface WelcomeViewProps {
  onEnter: () => void;
}

const COPY = {
  en: {
    tagline: "Resell & rent pre-loved fashion",
    sub: "A peer-to-peer marketplace for women in the UAE to give their wardrobe a second life.",
    enter: "Enter Mooday",
    skip: "Skip",
  },
  ar: {
    tagline: "بيعي و أجيلي ملابسك المستعملة",
    sub: "سوق نظير لنظير للنساء في الإمارات، لمنح خزانة ملابسك حياة ثانية.",
    enter: "ادخلي مودي",
    skip: "تخطي",
  },
} as const;

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onEnter }) => {
  const { language, setLanguage } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  // Track the language the user is *selecting* on this screen.
  // The global `language` from context is also used (the document dir
  // flips immediately), but we keep a local state so the pill's
  // aria-pressed stays in sync even before context propagates.
  const [picked, setPicked] = useState<"en" | "ar">(isAr ? "ar" : "en");

  const pick = (lang: "en" | "ar") => {
    setPicked(lang);
    setLanguage(lang);
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
      className="min-h-dvh flex flex-col items-center justify-center bg-background text-on-background px-margin-mobile py-xl gap-xl font-sans"
    >
      {/* Brand mark — matches the InstallPrompt badge for visual identity */}
      <div
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-on-primary-fixed-variant via-primary to-[#3a0e2f] flex items-center justify-center text-primary-fixed font-serif italic text-5xl leading-none shadow-xl"
        aria-hidden="true"
      >
        M
      </div>

      {/* Wordmark */}
      <h1 className="font-serif italic text-display-lg text-primary tracking-wide select-none">
        Mooday
      </h1>

      {/* Tagline + sub */}
      <div className="text-center max-w-[360px] flex flex-col gap-sm">
        <p className="font-serif text-headline-sm text-on-surface leading-tight">
          {t.tagline}
        </p>
        <p className="text-body-md text-on-surface-variant leading-relaxed">
          {t.sub}
        </p>
      </div>

      {/* Language picker */}
      <div
        className="flex gap-sm"
        role="radiogroup"
        aria-label={isAr ? "اختاري اللغة" : "Choose your language"}
      >
        <button
          onClick={() => pick("en")}
          aria-pressed={picked === "en"}
          aria-label="English"
          className={`px-6 py-2 rounded-full text-label-md uppercase tracking-wider font-bold border transition-all ${
            picked === "en"
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
          }`}
        >
          English
        </button>
        <button
          onClick={() => pick("ar")}
          aria-pressed={picked === "ar"}
          aria-label="العربية"
          className={`px-6 py-2 rounded-full text-label-md font-bold border transition-all ${
            picked === "ar"
              ? "bg-primary text-on-primary border-primary"
              : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
          }`}
        >
          عربي
        </button>
      </div>

      {/* CTA */}
      <button
        onClick={onEnter}
        className="btn-primary w-full max-w-[360px] py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile text-center active:scale-[0.98] transition-transform"
      >
        {t.enter}
      </button>

      {/* Skip link — for users who want to enter with the current global language without changing it */}
      <button
        onClick={onEnter}
        className="text-label-sm text-on-surface-variant underline underline-offset-4 hover:text-on-surface transition-colors"
      >
        {t.skip}
      </button>
    </div>
  );
};
