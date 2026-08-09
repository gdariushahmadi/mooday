"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useHydrated } from "@/lib/hooks";

/**
 * Full-screen overlay that hides the rest of the app while `isLocked`
 * is true. Two unlock paths are offered:
 *
 *  - **Biometric** (Touch ID / Face ID / fingerprint / Windows Hello) —
 *    one tap prompts the platform authenticator. Only shown when both
 *    `hasBiometric` and `biometricHasPlatformAuthenticator` are true.
 *  - **PIN** — a numeric keypad fallback that works on every device.
 *
 * The biometric prompt is triggered automatically the first time the
 * screen mounts when biometric is the configured primary, so users
 * don't have to tap twice. Subsequent unlocks always require an
 * explicit user gesture (button press).
 */
export const LockScreen: React.FC = () => {
  const {
    language,
    hasPin,
    hasBiometric,
    biometricHasPlatformAuthenticator,
    unlockWithPin,
    unlockWithBiometric,
  } = useApp();
  const hydrated = useHydrated();
  const isAr = language === "ar";

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoPromptedRef = useRef(false);

  const copy = isAr
    ? {
        headline: "مودي مقفله",
        sub: "برای ادامه، قفل رو باز کن",
        biometric: "باز کردن با اثر انگشت / چهره",
        pinPlaceholder: "رمز عبور",
        pinAction: "باز کردن",
        forgot: "فراموش کردم",
        errorGeneric: "رمز اشتباه است. دوباره امتحان کن.",
        errorBiometric: "اثر انگشت / چهره تایید نشد",
        unsupported: "این دستگاه از بیومتریک پشتیبانی نمی‌کند.",
      }
    : {
        headline: "Mooday is locked",
        sub: "Unlock to continue",
        biometric: "Unlock with Face ID / Touch ID / Fingerprint",
        pinPlaceholder: "Enter PIN",
        pinAction: "Unlock",
        forgot: "Forgot PIN? Sign out and reset it.",
        errorGeneric: "Incorrect PIN. Please try again.",
        errorBiometric: "Biometric check did not succeed.",
        unsupported: "This device does not support biometric unlock.",
      };

  const tryBiometric = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const ok = await unlockWithBiometric?.();
      if (!ok) setError(copy.errorBiometric);
    } finally {
      setBusy(false);
    }
  }, [busy, unlockWithBiometric, copy.errorBiometric]);

  const submitPin = useCallback(async () => {
    if (busy) return;
    if (pin.length < 4) {
      setError(copy.errorGeneric);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ok = await unlockWithPin?.(pin);
      if (!ok) {
        setError(copy.errorGeneric);
        setPin("");
      }
    } finally {
      setBusy(false);
    }
  }, [busy, pin, unlockWithPin, copy.errorGeneric]);

 // Auto-prompt biometric on first mount when the only unlock factor is
 // biometric. We deliberately do NOT auto-prompt when both PIN and
 // biometric are configured — give the user the choice. The setTimeout
 // defers the state updates out of the effect body so React 19's strict
 // effect lint rule is satisfied.
 useEffect(() => {
 if (!hydrated) return;
 if (autoPromptedRef.current) return;
 autoPromptedRef.current = true;
 if (hasBiometric && biometricHasPlatformAuthenticator && !hasPin) {
 const handle = window.setTimeout(() => {
 void tryBiometric();
 }, 0);
 return () => window.clearTimeout(handle);
 }
 return undefined;
 }, [
 hydrated,
 hasBiometric,
 biometricHasPlatformAuthenticator,
 hasPin,
 tryBiometric,
 ]);

  if (!hydrated) {
    // Render an empty overlay during SSR / first client paint to avoid
    // leaking the underlying app behind a flash of unlocked UI.
    return (
      <div
        role="presentation"
        aria-hidden="true"
        className="fixed inset-0 z-[200] bg-background"
      />
    );
  }

  const showBiometric = hasBiometric && biometricHasPlatformAuthenticator;
  const showPin = hasPin;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "قفل برنامه" : "App lock"}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background px-gutter py-xl"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-lg">
        <h1 className="font-serif text-display-lg-mobile italic tracking-widest text-primary">
          Mooday
        </h1>
        <p className="text-center text-body-md text-on-surface-variant">
          <span className="block text-title-md font-bold text-on-surface">
            {copy.headline}
          </span>
          <span className="mt-xs block">{copy.sub}</span>
        </p>

        {showBiometric && (
          <button
            type="button"
            onClick={tryBiometric}
            disabled={busy}
            data-testid="lock-biometric-button"
            className="btn-primary flex w-full items-center justify-center gap-sm rounded-xl px-lg py-md text-label-lg font-bold uppercase tracking-wider"
          >
            <span className="material-symbols-outlined no-mirror" aria-hidden="true">
              fingerprint
            </span>
            {copy.biometric}
          </button>
        )}

        {showPin && (
          <div className="flex w-full flex-col gap-sm">
            <label htmlFor="lock-pin-input" className="sr-only">
              {copy.pinPlaceholder}
            </label>
            <input
              id="lock-pin-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]*"
              disabled={busy}
              data-testid="lock-pin-input"
              value={pin}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, "").slice(0, 8);
                setPin(next);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitPin();
              }}
              placeholder={copy.pinPlaceholder}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "lock-pin-error" : undefined}
              className="w-full rounded-xl border border-outline-variant bg-surface px-md py-md text-center text-title-lg tracking-[0.5em] focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={submitPin}
              disabled={busy || pin.length < 4}
              data-testid="lock-pin-submit"
              className="btn-primary rounded-xl py-md text-label-lg font-bold uppercase tracking-wider"
            >
              {copy.pinAction}
            </button>
          </div>
        )}

        {error && (
          <p
            id="lock-pin-error"
            role="alert"
            className="text-label-md text-error text-center"
          >
            {error}
          </p>
        )}

        {!showBiometric && !showPin && (
          <p className="text-label-md text-error text-center">
            {copy.unsupported}
          </p>
        )}

        <p className="mt-md text-center text-label-sm text-on-surface-variant">
          {copy.forgot}
        </p>
      </div>
    </div>
  );
};
