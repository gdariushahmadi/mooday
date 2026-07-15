"use client";

/**
 * Sign Up — A-02.
 *
 * Phase 1 mock auth flow. Collects full name + email + phone + password +
 * confirm + terms-accept, then calls `signUp` from `AppContext`.
 * On success the mutator auto-signs-in and the view navigates home.
 *
 * Phase 2 swaps `signUp` for a real API; UI stays the same.
 */

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { AUTH_ERROR_MESSAGE_EN, AUTH_ERROR_MESSAGE_AR } from "@/data/users";

interface SignUpViewProps {
  onBack: () => void;
  /** Navigate to the OTP screen (used by A-06 social login skip flow). */
  onOtp: () => void;
  /** Navigate to sign-in (when user already has an account). */
  onSignIn: () => void;
  /** Navigate home on success. */
  onSuccess: () => void;
}

const COPY = {
  en: {
    title: "Create your Mooday",
    sub: "Join the UAE's women-led resale & rental community.",
    fullName: "Full name",
    fullNamePlaceholder: "Layla Mansour",
    email: "Email",
    emailPlaceholder: "you@example.com",
    phone: "Phone (optional)",
    phonePlaceholder: "+971 50 123 4567",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    confirm: "Confirm password",
    submit: "Create account",
    submitting: "Creating…",
    back: "Back",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    termsPrefix: "I agree to Mooday's",
    termsLink: "Terms",
    privacyLink: "Privacy Policy",
    nameRequired: "Please enter your name.",
    termsRequired: "Please accept the terms to continue.",
    passwordsMismatch: "Passwords don't match.",
  },
  ar: {
    title: "أنشئي حسابك في مودي",
    sub: "انضمي لمجتمع النساء في الإمارات لبيع وإعادة تأجير الملابس.",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "ليلى منصور",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    phone: "الهاتف (اختياري)",
    phonePlaceholder: "+971 50 123 4567",
    password: "كلمة المرور",
    passwordPlaceholder: "٨ أحرف على الأقل",
    confirm: "تأكيد كلمة المرور",
    submit: "إنشاء الحساب",
    submitting: "جارٍ الإنشاء…",
    back: "رجوع",
    haveAccount: "لديكِ حساب بالفعل؟",
    signIn: "تسجيل الدخول",
    termsPrefix: "أوافق على",
    termsLink: "شروط",
    privacyLink: "سياسة الخصوصية",
    nameRequired: "يرجى إدخال اسمك.",
    termsRequired: "يرجى الموافقة على الشروط للمتابعة.",
    passwordsMismatch: "كلمتا المرور غير متطابقتين.",
  },
} as const;

export const SignUpView: React.FC<SignUpViewProps> = ({
  onBack,
  onOtp,
  onSignIn,
  onSuccess,
}) => {
  const { language, signUp, authError, authMode } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const errorMessage = authError
    ? isAr
      ? AUTH_ERROR_MESSAGE_AR[authError]
      : AUTH_ERROR_MESSAGE_EN[authError]
    : localError;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!name.trim()) {
      setLocalError(t.nameRequired);
      return;
    }
    if (password !== confirm) {
      setLocalError(t.passwordsMismatch);
      return;
    }
    if (!terms) {
      setLocalError(t.termsRequired);
      return;
    }
    setSubmitting(true);
    try {
      const id = await Promise.resolve(
        signUp({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      );
      if (id) {
        if (authMode === "supabase") onOtp();
        else onSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
      data-testid="sign-up"
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
        <Field
          label={t.fullName}
          type="text"
          autoComplete="name"
          value={name}
          onChange={setName}
          placeholder={t.fullNamePlaceholder}
        />
        <Field
          label={t.email}
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder={t.emailPlaceholder}
          inputMode="email"
        />
        <Field
          label={t.phone}
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={setPhone}
          placeholder={t.phonePlaceholder}
        />
        <Field
          label={t.password}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          placeholder={t.passwordPlaceholder}
        />
        <Field
          label={t.confirm}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          placeholder={
            isAr ? "أعيدي إدخال كلمة المرور" : "Re-enter your password"
          }
        />

        <label className="flex items-start gap-sm text-body-sm text-on-surface-variant cursor-pointer select-none">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1 w-5 h-5 accent-primary"
            aria-label={isAr ? "الموافقة على الشروط" : "Accept terms"}
          />
          <span>
            {t.termsPrefix}{" "}
            <span className="text-primary font-bold underline underline-offset-2">
              {t.termsLink}
            </span>{" "}
            &{" "}
            <span className="text-primary font-bold underline underline-offset-2">
              {t.privacyLink}
            </span>
            .
          </span>
        </label>

        {errorMessage && (
          <div
            role="alert"
            data-testid="auth-error"
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

      <p className="text-center text-body-sm text-on-surface-variant mt-md">
        {t.haveAccount}{" "}
        <button
          type="button"
          onClick={onSignIn}
          className="text-primary font-bold underline underline-offset-2 hover:opacity-80"
        >
          {t.signIn}
        </button>
      </p>
    </div>
  );
};

interface FieldProps {
  label: string;
  type: "text" | "email" | "password" | "tel";
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "email" | "tel" | "text";
}

const Field: React.FC<FieldProps> = ({
  label,
  type,
  autoComplete,
  value,
  onChange,
  placeholder,
  inputMode,
}) => (
  <label className="flex flex-col gap-xs">
    <span className="text-label-sm uppercase tracking-wider text-primary font-bold">
      {label}
    </span>
    <input
      type={type}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="w-full bg-surface border border-outline-variant rounded-lg px-md py-3 text-body-md text-on-surface outline-none focus:border-primary transition-colors"
    />
  </label>
);
