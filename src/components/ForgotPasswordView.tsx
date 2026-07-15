"use client";

/**
 * Forgot Password — A-05.
 *
 * 3-step flow inside a single component:
 *   1) enter email  →  2) enter OTP  →  3) new password
 * Phase 1 mock: any email + `000000` passes the OTP step. The
 * "new password" step in Phase 1 does not re-hash the seeded user
 * (kept plaintext) — Phase 2 fixes the auth backend.
 *
 * On finish, the view navigates to the sign-in screen.
 */

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { MOCK_OTP_CODE } from "@/data/users";

type Step = 1 | 2 | 3;

interface ForgotPasswordViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

const COPY = {
  en: {
    title1: "Reset your password",
    sub1: "We'll send a code to the email on your account.",
    emailLabel: "Email",
    next1: "Send code",
    title2: "Enter the code",
    sub2: "Use",
    sub2Suffix: "in the Phase 1 preview, or the code we just sent.",
    emailSentTo: "Code sent to",
    resend: "Resend",
    verify: "Verify",
    title3: "Choose a new password",
    sub3: "Your new password must be at least 8 characters.",
    newPassword: "New password",
    confirm: "Confirm password",
    submit: "Reset password",
    mismatch: "Passwords don't match.",
    tooShort: "Password must be at least 8 characters.",
    success: "Password reset!",
    back: "Back",
    backToSignIn: "Back to sign in",
    codePlaceholder: "6-digit code",
  },
  ar: {
    title1: "إعادة تعيين كلمة المرور",
    sub1: "سنرسل رمزاً إلى البريد المسجل في حسابك.",
    emailLabel: "البريد الإلكتروني",
    next1: "إرسال الرمز",
    title2: "أدخلي الرمز",
    sub2: "استخدمي",
    sub2Suffix: "في معاينة المرحلة الأولى، أو الرمز الذي أرسلناه للتو.",
    emailSentTo: "أرسلنا الرمز إلى",
    resend: "إعادة إرسال",
    verify: "تحقق",
    title3: "اختاري كلمة مرور جديدة",
    sub3: "يجب ألا تقل كلمة المرور الجديدة عن ٨ أحرف.",
    newPassword: "كلمة المرور الجديدة",
    confirm: "تأكيد كلمة المرور",
    submit: "تعيين كلمة المرور",
    mismatch: "كلمتا المرور غير متطابقتين.",
    tooShort: "يجب أن تكون ٨ أحرف على الأقل.",
    success: "تمت إعادة التعيين!",
    back: "رجوع",
    backToSignIn: "العودة لتسجيل الدخول",
    codePlaceholder: "رمز من ٦ أرقام",
  },
} as const;

const CODE_LENGTH = 6;

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onBack,
  onSuccess,
}) => {
  const { language, sendOtp, verifyOtp, resetPassword, authMode } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(
    new Array(CODE_LENGTH).fill(""),
  );
  const [codeError, setCodeError] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 2) codeRefs.current[0]?.focus();
  }, [step]);

  const setCell = (idx: number, value: string) => {
    const next = [...digits];
    next[idx] = value.replace(/\D/g, "").slice(-1);
    setDigits(next);
    setCodeError(false);
    if (value && idx < CODE_LENGTH - 1) codeRefs.current[idx + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length === CODE_LENGTH) {
      e.preventDefault();
      setDigits(pasted.split(""));
      setCodeError(false);
      codeRefs.current[CODE_LENGTH - 1]?.focus();
    }
  };

  // Send the OTP the first time step 2 mounts.
  useEffect(() => {
    if (step === 2 && email) {
      void (authMode === "supabase"
        ? sendOtp(email, "recovery")
        : sendOtp(email));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const submitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStep(2);
  };

  const submitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (
      await Promise.resolve(
        authMode === "supabase"
          ? verifyOtp(email, code, "recovery")
          : verifyOtp(email, code),
      )
    ) {
      setStep(3);
    } else {
      setCodeError(true);
    }
  };

  const submitStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (password.length < 8) {
      setPasswordError(t.tooShort);
      return;
    }
    if (password !== confirm) {
      setPasswordError(t.mismatch);
      return;
    }
    // Update the user record. The mock allows any email.
    const ok = await Promise.resolve(resetPassword(email, password));
    if (ok) onSuccess();
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
      data-testid="forgot-password"
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
          {step === 1 ? t.title1 : step === 2 ? t.title2 : t.title3}
        </h1>
        <div className="w-10" aria-hidden="true" />
      </header>

      {/* Step indicator */}
      <div className="flex justify-center gap-sm -mt-md" aria-hidden="true">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 w-10 rounded-full transition-colors ${
              step >= s ? "bg-primary" : "bg-outline-variant"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <p className="text-body-md text-on-surface-variant text-center px-md">
            {t.sub1}
          </p>
          <form onSubmit={submitStep1} className="flex flex-col gap-md mt-sm">
            <label className="flex flex-col gap-xs">
              <span className="text-label-sm uppercase tracking-wider text-primary font-bold">
                {t.emailLabel}
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-3 text-body-md text-on-surface outline-none focus:border-primary transition-colors"
              />
            </label>
            <button
              type="submit"
              className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile text-center active:scale-[0.98] transition-transform"
            >
              {t.next1}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-body-md text-on-surface-variant text-center px-md">
            {t.sub2}{" "}
            <span className="font-mono font-bold text-primary">
              {MOCK_OTP_CODE}
            </span>{" "}
            {t.sub2Suffix}
          </p>
          <p className="text-label-sm text-on-surface text-center">
            {t.emailSentTo} <span className="font-bold">{email}</span>
          </p>
          <form onSubmit={submitStep2} className="flex flex-col gap-md mt-sm">
            <div
              className="flex justify-center gap-sm"
              dir="ltr"
              role="group"
              aria-label={t.codePlaceholder}
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    codeRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setCell(i, e.target.value)}
                  onPaste={onPaste}
                  aria-label={`${t.codePlaceholder} ${i + 1}`}
                  className={`w-12 h-14 bg-surface border rounded-xl text-center text-headline-sm font-mono font-bold outline-none focus:border-primary transition-colors ${
                    codeError ? "border-error" : "border-outline-variant"
                  }`}
                />
              ))}
            </div>
            {codeError && (
              <p
                role="alert"
                className="text-label-sm text-error text-center font-bold"
              >
                {isAr ? "الرمز غير مطابق" : "Code didn't match."}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile text-center active:scale-[0.98] transition-transform"
            >
              {t.verify}
            </button>
            <button
              type="button"
              onClick={() =>
                void (authMode === "supabase"
                  ? sendOtp(email, "recovery")
                  : sendOtp(email))
              }
              className="text-label-sm text-primary font-bold underline underline-offset-4 hover:opacity-80 self-center"
            >
              {t.resend}
            </button>
          </form>
        </>
      )}

      {step === 3 && (
        <>
          <p className="text-body-md text-on-surface-variant text-center px-md">
            {t.sub3}
          </p>
          <form onSubmit={submitStep3} className="flex flex-col gap-md mt-sm">
            <label className="flex flex-col gap-xs">
              <span className="text-label-sm uppercase tracking-wider text-primary font-bold">
                {t.newPassword}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-3 text-body-md text-on-surface outline-none focus:border-primary transition-colors"
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label-sm uppercase tracking-wider text-primary font-bold">
                {t.confirm}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-3 text-body-md text-on-surface outline-none focus:border-primary transition-colors"
              />
            </label>
            {passwordError && (
              <div
                role="alert"
                className="bg-error-container text-on-error-container border border-error/30 rounded-lg p-md text-body-sm font-bold"
              >
                {passwordError}
              </div>
            )}
            <button
              type="submit"
              className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile text-center active:scale-[0.98] transition-transform"
            >
              {t.submit}
            </button>
          </form>
        </>
      )}

      <button
        type="button"
        onClick={onSuccess}
        className="text-label-sm text-on-surface-variant underline underline-offset-4 self-center hover:text-on-surface transition-colors"
      >
        {t.backToSignIn}
      </button>
    </div>
  );
};
