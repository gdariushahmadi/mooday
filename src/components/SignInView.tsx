"use client";

/**
 * Sign In — A-04.
 *
 * Email + password + remember-me. On success the mutator auto-creates
 * a session and the view navigates home.
 *
 * Phase 1 mock; phase 2 swaps for a real auth API.
 *
 * Pre-seeded QA login: layla@mooday.app / mooday123
 */

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { AUTH_ERROR_MESSAGE_EN, AUTH_ERROR_MESSAGE_AR } from "@/data/users";

interface SignInViewProps {
  onBack: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
  onSocialLogin: () => void;
  onSuccess: () => void;
}

const COPY = {
  en: {
    title: "Welcome back",
    sub: "Sign in to your Mooday account.",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Your password",
    remember: "Remember me",
    submit: "Sign in",
    submitting: "Signing in…",
    back: "Back",
    forgot: "Forgot password?",
    noAccount: "New to Mooday?",
    createAccount: "Create an account",
    social: "Or continue with",
    google: "Google",
    apple: "Apple",
  },
  ar: {
    title: "مرحباً بعودتك",
    sub: "سجّلي دخولك إلى حسابك في مودي.",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    password: "كلمة المرور",
    passwordPlaceholder: "كلمة المرور",
    remember: "تذكّري",
    submit: "تسجيل الدخول",
    submitting: "جارٍ الدخول…",
    back: "رجوع",
    forgot: "نسيتِ كلمة المرور؟",
    noAccount: "جديدة على مودي؟",
    createAccount: "إنشاء حساب",
    social: "أو متابعة عبر",
    google: "Google",
    apple: "Apple",
  },
} as const;

export const SignInView: React.FC<SignInViewProps> = ({
  onBack,
  onSignUp,
  onForgotPassword,
  onSocialLogin,
  onSuccess,
}) => {
  const { language, signIn, authError } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const errorMessage = authError
    ? isAr
      ? AUTH_ERROR_MESSAGE_AR[authError]
      : AUTH_ERROR_MESSAGE_EN[authError]
    : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await Promise.resolve(
        signIn({ email: email.trim(), password }),
      );
      if (ok) onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
      data-testid="sign-in"
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

      <p className="text-body-md text-on-surface-variant -mt-md text-center px-md">
        {t.sub}
      </p>

      <form onSubmit={submit} className="flex flex-col gap-md mt-sm">
        <label className="flex flex-col gap-xs">
          <span className="text-label-sm uppercase tracking-wider text-primary font-bold">
            {t.email}
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            inputMode="email"
            required
            className="w-full bg-surface border border-outline-variant rounded-lg px-md py-3 text-body-md text-on-surface outline-none focus:border-primary transition-colors"
          />
        </label>
        <label className="flex flex-col gap-xs">
          <span className="text-label-sm uppercase tracking-wider text-primary font-bold">
            {t.password}
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder}
            required
            className="w-full bg-surface border border-outline-variant rounded-lg px-md py-3 text-body-md text-on-surface outline-none focus:border-primary transition-colors"
          />
        </label>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-sm text-body-sm text-on-surface cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-5 h-5 accent-primary"
              aria-label={t.remember}
            />
            <span>{t.remember}</span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-label-sm text-primary font-bold underline underline-offset-2 hover:opacity-80"
          >
            {t.forgot}
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="bg-error-container text-on-error-container border border-error/30 rounded-lg p-md text-body-sm font-bold"
          >
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile text-center active:scale-[0.98] transition-transform mt-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </form>

      {/* Social login entry point */}
      <div className="flex flex-col gap-sm mt-sm">
        <p className="text-label-sm uppercase tracking-wider text-on-surface-variant text-center">
          {t.social}
        </p>
        <div className="grid grid-cols-2 gap-sm">
          <button
            type="button"
            onClick={onSocialLogin}
            className="flex items-center justify-center gap-sm bg-surface-container-low hover:bg-surface-container-high border border-outline-variant rounded-xl py-3 text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              mail
            </span>
            {t.google}
          </button>
          <button
            type="button"
            onClick={onSocialLogin}
            className="flex items-center justify-center gap-sm bg-surface-container-low hover:bg-surface-container-high border border-outline-variant rounded-xl py-3 text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              ios
            </span>
            {t.apple}
          </button>
        </div>
      </div>

      <p className="text-center text-body-sm text-on-surface-variant mt-md">
        {t.noAccount}{" "}
        <button
          type="button"
          onClick={onSignUp}
          className="text-primary font-bold underline underline-offset-2 hover:opacity-80"
        >
          {t.createAccount}
        </button>
      </p>
    </div>
  );
};
