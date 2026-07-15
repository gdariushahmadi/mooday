"use client";

/**
 * OTP verification — A-03.
 *
 * Phase 1 mock: the universal code "000000" verifies any email. The
 * actual delivery is wired via `useApp().sendOtp()` which is a no-op
 * that always returns the universal code.
 *
 * Phase 2 swaps for a real SMS / email challenge.
 */

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { MOCK_OTP_CODE } from "@/data/users";

interface OtpViewProps {
  /** Pre-filled email (carried over from the sign-up form, optional). */
  email?: string;
  onBack: () => void;
  onSuccess: () => void;
}

const COPY = {
  en: {
    title: "Enter the code",
    sub: "We've sent a 6-digit code. Use",
    hintSuffix: "to sign in instantly.",
    codeLabel: "6-digit code",
    submit: "Verify",
    submitting: "Verifying…",
    resend: "Didn't get it? Resend",
    back: "Back",
    helperBadCode: "That code didn't match. Try again.",
    helperSentTo: "We sent it to",
  },
  ar: {
    title: "أدخلي الرمز",
    sub: "أرسلنا رمزاً من ٦ أرقام. استخدمي",
    hintSuffix: "لتسجيل الدخول فوراً.",
    codeLabel: "الرمز المكوّن من ٦ أرقام",
    submit: "تحقق",
    submitting: "جارٍ التحقق…",
    resend: "لم يصلك؟ إعادة الإرسال",
    back: "رجوع",
    helperBadCode: "الرمز غير مطابق. حاولي مجدداً.",
    helperSentTo: "أرسلناه إلى",
  },
} as const;

const CODE_LENGTH = 6;

export const OtpView: React.FC<OtpViewProps> = ({
  email: initialEmail = "",
  onBack,
  onSuccess,
}) => {
  const {
    language,
    verifyOtp,
    sendOtp,
    authMode,
    pendingAuthEmail,
  } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [email] = useState(initialEmail || pendingAuthEmail || "");
  const [digits, setDigits] = useState<string[]>(
    new Array(CODE_LENGTH).fill(""),
  );
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first cell on mount.
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const setCell = (idx: number, value: string) => {
    const next = [...digits];
    next[idx] = value.replace(/\D/g, "").slice(-1);
    setDigits(next);
    if (value && idx < CODE_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowRight" && idx < CODE_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length === CODE_LENGTH) {
      e.preventDefault();
      const arr = pasted.split("");
      setDigits(arr);
      inputsRef.current[CODE_LENGTH - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setSubmitted(true);
    setVerificationFailed(false);
    const code = digits.join("");
    if (code.length !== CODE_LENGTH) return;
    setSubmitting(true);
    try {
      const ok = await Promise.resolve(verifyOtp(email, code));
      if (ok) onSuccess();
      else setVerificationFailed(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    await Promise.resolve(sendOtp(email));
  };

  const isComplete = digits.every((d) => d.length === 1);
  const showError = touched && submitted && !isComplete;
  const showBadCode = submitted && isComplete && verificationFailed;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      lang={isAr ? "ar" : "en"}
      data-testid="otp-verify"
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

      <div className="text-center px-md flex flex-col gap-xs">
        <p className="text-body-md text-on-surface-variant">
          {t.sub}
          {authMode !== "supabase" && (
            <>
              {" "}
              <span className="font-mono font-bold text-primary">
                {MOCK_TP_DISPLAY}
              </span>{" "}
              {t.hintSuffix}
            </>
          )}
        </p>
        {email && (
          <p className="text-label-sm text-on-surface">
            {t.helperSentTo} <span className="font-bold">{email}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md mt-sm">
        <span className="text-label-sm uppercase tracking-wider text-primary font-bold text-center">
          {t.codeLabel}
        </span>
        <div
          className="flex justify-center gap-sm"
          dir="ltr"
          role="group"
          aria-label={t.codeLabel}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setCell(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={() => setTouched(true)}
              aria-label={`${t.codeLabel} ${i + 1}`}
              className="w-12 h-14 sm:w-14 sm:h-16 bg-surface border border-outline-variant rounded-xl text-center text-headline-sm font-mono font-bold text-on-surface outline-none focus:border-primary transition-colors"
            />
          ))}
        </div>

        {showError && (
          <p
            role="alert"
            className="text-label-sm text-error text-center font-bold"
          >
            {isAr ? "أدخلي ٦ أرقام" : "Enter all 6 digits."}
          </p>
        )}
        {showBadCode && (
          <p
            role="alert"
            className="text-label-sm text-error text-center font-bold"
          >
            {t.helperBadCode}
          </p>
        )}

        <button
          type="submit"
          disabled={!isComplete || submitting}
          className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile text-center active:scale-[0.98] transition-transform mt-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        className="text-label-sm text-primary font-bold underline underline-offset-4 hover:opacity-80 self-center"
      >
        {t.resend}
      </button>
    </div>
  );
};

// Make the universal code visible to QA + reviewers in the helper text.
// Phase 2 will replace this helper with a real "check your inbox" message.
const MOCK_TP_DISPLAY = MOCK_OTP_CODE;
