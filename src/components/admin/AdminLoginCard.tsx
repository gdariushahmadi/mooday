"use client";

import React, { useState } from "react";

interface AdminLoginCardProps {
  lang: "en" | "ar";
  mode: "demo" | "live";
  demoEmail?: string;
  demoPassword?: string;
  error?: string | null;
  isSubmitting?: boolean;
  onSubmit: (email: string, password: string) => void | Promise<void>;
  onToggleLang: () => void;
}

const COPY = {
  en: {
    title: "Admin sign in",
    subtitle: "Use an admin account to review listings, orders, users, and reports.",
    demoMode: "Demo access",
    liveMode: "Live access",
    demoIntro:
      "This demo uses sample data. The controls are safe to test and do not send real money.",
    demoCredentials: "Demo credentials",
    email: "Email",
    password: "Password",
    signIn: "Open admin panel",
    signingIn: "Checking access...",
    demoHint: "Enter the demo credentials above to continue.",
    invalid: "The email or password is not correct.",
    liveHint:
      "Use a Supabase admin account, or use the demo credentials above to open sample data.",
    demoAvailable: "Demo access is also available here",
    demoPreview: "Open the demo panel",
    language: "العربية",
  },
  ar: {
    title: "تسجيل دخول المشرف",
    subtitle: "استخدم حساب مشرف لمراجعة الإعلانات والطلبات والمستخدمين والبلاغات.",
    demoMode: "دخول تجريبي",
    liveMode: "دخول مباشر",
    demoIntro:
      "هذه النسخة تستخدم بيانات نموذجية. يمكنك تجربة الخيارات بأمان ولا يتم تحويل أموال حقيقية.",
    demoCredentials: "بيانات الدخول التجريبية",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signIn: "فتح لوحة الإدارة",
    signingIn: "جاري التحقق...",
    demoHint: "أدخل بيانات الدخول التجريبية أعلاه للمتابعة.",
    invalid: "البريد الإلكتروني أو كلمة المرور غير صحيحين.",
    liveHint:
      "استخدم حساب المشرف في Supabase، أو استخدم بيانات الدخول التجريبية لفتح البيانات النموذجية.",
    demoAvailable: "الدخول التجريبي متاح هنا أيضاً",
    demoPreview: "فتح لوحة العرض التجريبية",
    language: "English",
  },
} as const;

export function AdminLoginCard({
  lang,
  mode,
  demoEmail,
  demoPassword,
  error,
  isSubmitting = false,
  onSubmit,
  onToggleLang,
}: AdminLoginCardProps) {
  const isAr = lang === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const [email, setEmail] = useState(demoEmail ?? "");
  const [password, setPassword] = useState(demoPassword ?? "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit(email, password);
  };

  return (
    <div
      className="w-full max-w-lg rounded-2xl border border-surface-container-high bg-surface p-6 shadow-lg sm:p-8"
      data-testid="admin-login-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined" aria-hidden="true">
              admin_panel_settings
            </span>
            <span className="text-sm font-bold tracking-[0.16em]">DANEG</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            {t.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {t.subtitle}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          {mode === "demo" ? t.demoMode : t.liveMode}
        </span>
      </div>

      {mode === "demo" && (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs leading-5 text-on-surface-variant">{t.demoIntro}</p>
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {t.demoCredentials}
            </p>
            <div className="mt-2 grid gap-1 text-sm text-on-surface sm:grid-cols-2">
              <span>{demoEmail}</span>
              <span className="font-mono">{demoPassword}</span>
            </div>
          </div>
        </div>
      )}

      {mode === "live" && (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-bold text-primary">{t.demoAvailable}</p>
          <div className="mt-2 grid gap-1 text-sm text-on-surface sm:grid-cols-2">
            <span>{demoEmail}</span>
            <span className="font-mono">{demoPassword}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-on-surface">
            {t.email}
          </span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-on-surface">
            {t.password}
          </span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        {error && (
          <p
            className="rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-xs font-medium leading-5 text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && (
            <span
              className="material-symbols-outlined animate-spin text-[18px]"
              aria-hidden="true"
            >
              progress_activity
            </span>
          )}
          {isSubmitting ? t.signingIn : t.signIn}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-on-surface-variant">
        {mode === "live" ? t.liveHint : t.demoHint}
      </p>

      {mode === "live" && (
        <a
          href="/admin?demo=1"
          className="mx-auto mt-3 block w-fit text-xs font-bold text-primary hover:underline"
        >
          {t.demoPreview}
        </a>
      )}

      <button
        type="button"
        onClick={onToggleLang}
        className="mx-auto mt-4 block text-xs font-bold text-primary hover:underline"
      >
        {t.language}
      </button>
    </div>
  );
}
