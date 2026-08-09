"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { LOCK_TIMEOUT_PRESETS_MS } from "@/lib/security";

type Stage = "idle" | "awaiting-confirm";

function formatTimeoutLabel(ms: number, isAr: boolean): string {
 if (ms >= 60 * 60_000) return isAr ? "ساعت" : "hour";
 const minutes = Math.round(ms / 60_000);
 return isAr ? `${minutes} دقیقه` : `${minutes} min`;
}

interface SecuritySetupViewProps {
 onBack: () => void;
}

/**
 * Manage the app-lock configuration: master toggle, timeout, biometric
 * registration, and PIN setup. Designed to be reached from Settings.
 */
export const SecuritySetupView: React.FC<SecuritySetupViewProps> = ({
 onBack,
}) => {
 const {
 language,
 lockEnabled,
 setLockEnabled,
 lockTimeoutMs,
 setLockTimeoutMs,
 hasPin,
 setupPin,
 clearPin,
 hasBiometric,
 biometricHasPlatformAuthenticator,
 biometricSupported,
 setupBiometric,
 clearBiometric,
 lockNow,
 currentUser,
 } = useApp();
 const isAr = language === "ar";

 const [stage, setStage] = useState<Stage>("idle");
 const [pinValue, setPinValue] = useState("");
 const [confirmValue, setConfirmValue] = useState("");
 const [status, setStatus] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [busy, setBusy] = useState(false);

 const copy = isAr
 ? {
 title: "امنیت و قفل برنامه",
 back: "برگشت",
 master: "فعال‌سازی قفل خودکار",
 masterHint: "بعد از چند دقیقه بی‌استفاده ماندن، برنامه قفل می‌شود",
 timeout: "زمان قفل شدن",
 biometric: "استفاده از بیومتریک",
 biometricHint: "اثر انگشت، چهره یا Windows Hello",
 biometricUnsupported: "این دستگاه از بیومتریک پشتیبانی نمی‌کند.",
 pin: "تنظیم رمز عبور (PIN)",
 pinChange: "تغییر PIN",
 pinRemove: "حذف PIN",
 pinLabel: "PIN جدید (۴ تا ۸ رقم)",
 confirmLabel: "تکرار PIN",
 save: "ذخیره",
 cancel: "انصراف",
 lockNow: "قفل فوری",
 statusSaved: "ذخیره شد",
 statusBiometricSaved: "بیومتریک فعال شد",
 statusRemoved: "حذف شد",
 errorMismatch: "PIN و تکرار آن یکسان نیستند",
 errorLength: "PIN باید بین ۴ تا ۸ رقم باشد",
 errorGeneric: "عملیات ناموفق بود. دوباره امتحان کن.",
 }
 : {
 title: "Security & App Lock",
 back: "Back",
 master: "Auto-lock when inactive",
 masterHint: "Lock the app after a period of inactivity",
 timeout: "Lock after",
 biometric: "Use biometric unlock",
 biometricHint: "Face ID, Touch ID, fingerprint, or Windows Hello",
 biometricUnsupported: "This device does not support biometric unlock.",
 pin: "Set PIN",
 pinChange: "Change PIN",
 pinRemove: "Remove PIN",
 pinLabel: "New PIN (4–8 digits)",
 confirmLabel: "Confirm PIN",
 save: "Save",
 cancel: "Cancel",
 lockNow: "Lock now",
 statusSaved: "Saved",
 statusBiometricSaved: "Biometric enabled",
 statusRemoved: "Removed",
 errorMismatch: "PINs do not match",
 errorLength: "PIN must be 4 to 8 digits",
 errorGeneric: "Operation failed. Please try again.",
 };

 // When auto-lock is off, hide the toast after a tick so we don't leave
 // stale success messages on screen during navigation.
 useEffect(() => {
 if (!status) return;
 const t = window.setTimeout(() => setStatus(null), 2_000);
 return () => window.clearTimeout(t);
 }, [status]);

 const handlePinSubmit = async () => {
 setError(null);
 if (pinValue.length < 4 || pinValue.length > 8) {
 setError(copy.errorLength);
 return;
 }
 if (pinValue !== confirmValue) {
 setError(copy.errorMismatch);
 return;
 }
 setBusy(true);
 try {
 const ok = await setupPin?.(pinValue);
 if (ok) {
 setStatus(copy.statusSaved);
 setPinValue("");
 setConfirmValue("");
 setStage("idle");
 } else {
 setError(copy.errorGeneric);
 }
 } finally {
 setBusy(false);
 }
 };

 const handleRemovePin = () => {
 clearPin?.();
 setStatus(copy.statusRemoved);
 };

 const handleEnableBiometric = async () => {
 setError(null);
 setBusy(true);
 try {
 const userName =
 (typeof currentUser?.name === "string" && currentUser.name) ||
 currentUser?.email ||
 "Mooday user";
 const ok = await setupBiometric?.(userName);
 if (ok) {
 setStatus(copy.statusBiometricSaved);
 } else {
 setError(copy.errorGeneric);
 }
 } finally {
 setBusy(false);
 }
 };

 const handleDisableBiometric = () => {
 clearBiometric?.();
 setStatus(copy.statusRemoved);
 };

 const biometricAvailable =
 biometricSupported && biometricHasPlatformAuthenticator;

 return (
 <div
 dir={isAr ? "rtl" : "ltr"}
 className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10"
 >
 <div className="app-page-header flex items-center justify-between border-b border-outline-variant pb-4">
 <button
 type="button"
 onClick={onBack}
 aria-label={copy.back}
 className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
 >
 <span className="material-symbols-outlined no-mirror" aria-hidden="true">
 arrow_back
 </span>
 </button>
 <h1 className="font-serif text-headline-sm text-primary tracking-widest uppercase flex-grow text-center">
 {copy.title}
 </h1>
 <div className="w-10" aria-hidden="true" />
 </div>

 <main className="flex flex-col gap-lg mt-md font-sans">
 {/* Master switch */}
 <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex items-center justify-between">
 <div className="min-w-0">
 <p className="text-body-lg font-bold text-on-surface">
 {copy.master}
 </p>
 <p className="text-label-sm text-on-surface-variant">
 {copy.masterHint}
 </p>
 </div>
 <button
 type="button"
 role="switch"
 aria-checked={Boolean(lockEnabled)}
 aria-label={copy.master}
 data-testid="lock-master-toggle"
 onClick={() => setLockEnabled?.(!lockEnabled)}
 className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
 lockEnabled ? "bg-primary" : "bg-surface-container-high"
 }`}
 >
 <span
 className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
 lockEnabled ? "end-1" : "start-1"
 }`}
 aria-hidden="true"
 />
 </button>
 </div>

 {/* Timeout */}
 {lockEnabled && (
 <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex flex-col gap-sm">
 <label
 htmlFor="lock-timeout-select"
 className="text-body-lg font-bold text-on-surface"
 >
 {copy.timeout}
 </label>
 <select
 id="lock-timeout-select"
 data-testid="lock-timeout-select"
 value={lockTimeoutMs ?? LOCK_TIMEOUT_PRESETS_MS[1]}
 onChange={(e) => setLockTimeoutMs?.(Number(e.target.value))}
 className="bg-surface border border-outline-variant rounded-lg p-sm text-body-md font-bold text-primary outline-none focus:border-primary"
 >
 {LOCK_TIMEOUT_PRESETS_MS.map((ms) => (
 <option key={ms} value={ms}>
 {formatTimeoutLabel(ms, isAr)}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* Biometric */}
 {lockEnabled && (
 <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex items-center justify-between gap-md">
 <div className="min-w-0">
 <p className="text-body-lg font-bold text-on-surface">
 {copy.biometric}
 </p>
 <p className="text-label-sm text-on-surface-variant">
 {biometricAvailable
 ? copy.biometricHint
 : copy.biometricUnsupported}
 </p>
 </div>
 {hasBiometric ? (
 <button
 type="button"
 onClick={handleDisableBiometric}
 data-testid="lock-biometric-disable"
 className="btn-secondary rounded-lg px-md py-sm text-label-md font-bold uppercase tracking-wider"
 >
 {copy.pinRemove}
 </button>
 ) : (
 <button
 type="button"
 onClick={handleEnableBiometric}
 disabled={!biometricAvailable || busy}
 data-testid="lock-biometric-enable"
 className="btn-primary rounded-lg px-md py-sm text-label-md font-bold uppercase tracking-wider"
 >
 {copy.save}
 </button>
 )}
 </div>
 )}

 {/* PIN */}
 {lockEnabled && (
 <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex flex-col gap-sm">
 <div className="flex items-center justify-between">
 <p className="text-body-lg font-bold text-on-surface">
 {hasPin ? copy.pinChange : copy.pin}
 </p>
 {hasPin && stage === "idle" && (
 <button
 type="button"
 onClick={handleRemovePin}
 data-testid="lock-pin-remove"
 className="text-label-sm font-bold uppercase tracking-wider text-error hover:underline"
 >
 {copy.pinRemove}
 </button>
 )}
 </div>
 {stage === "idle" ? (
 <button
 type="button"
 onClick={() => setStage("awaiting-confirm")}
 data-testid="lock-pin-set"
 className="btn-secondary rounded-lg px-md py-sm text-label-md font-bold uppercase tracking-wider self-start"
 >
 {hasPin ? copy.pinChange : copy.pin}
 </button>
 ) : (
 <div className="flex flex-col gap-sm">
 <label className="flex flex-col gap-xs">
 <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
 {copy.pinLabel}
 </span>
 <input
 type="password"
 inputMode="numeric"
 autoComplete="off"
 pattern="[0-9]*"
 value={pinValue}
 data-testid="lock-pin-new"
 onChange={(e) =>
 setPinValue(e.target.value.replace(/\D/g, "").slice(0, 8))
 }
 className="rounded-lg border border-outline-variant bg-surface px-md py-sm text-body-lg tracking-[0.4em] focus:border-primary focus:outline-none"
 />
 </label>
 <label className="flex flex-col gap-xs">
 <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
 {copy.confirmLabel}
 </span>
 <input
 type="password"
 inputMode="numeric"
 autoComplete="off"
 pattern="[0-9]*"
 value={confirmValue}
 data-testid="lock-pin-confirm"
 onChange={(e) =>
 setConfirmValue(e.target.value.replace(/\D/g, "").slice(0, 8))
 }
 className="rounded-lg border border-outline-variant bg-surface px-md py-sm text-body-lg tracking-[0.4em] focus:border-primary focus:outline-none"
 />
 </label>
 <div className="flex gap-sm mt-sm">
 <button
 type="button"
 onClick={handlePinSubmit}
 disabled={busy}
 data-testid="lock-pin-save"
 className="btn-primary rounded-lg px-md py-sm text-label-md font-bold uppercase tracking-wider"
 >
 {copy.save}
 </button>
 <button
 type="button"
 onClick={() => {
 setPinValue("");
 setConfirmValue("");
 setError(null);
 setStage("idle");
 }}
 className="btn-secondary rounded-lg px-md py-sm text-label-md font-bold uppercase tracking-wider"
 >
 {copy.cancel}
 </button>
 </div>
 </div>
 )}
 {error && (
 <p className="text-label-md text-error" role="alert">
 {error}
 </p>
 )}
 </div>
 )}

 {/* Lock now */}
 {lockEnabled && (hasPin || hasBiometric) && (
 <button
 type="button"
 onClick={() => lockNow?.()}
 data-testid="lock-now"
 className="btn-primary rounded-xl px-md py-md text-label-lg font-bold uppercase tracking-wider"
 >
 <span className="material-symbols-outlined no-mirror me-sm" aria-hidden="true">
 lock
 </span>
 {copy.lockNow}
 </button>
 )}

 {status && (
 <p
 role="status"
 className="text-label-md text-primary text-center font-bold"
 >
 {status}
 </p>
 )}
 </main>
 </div>
 );
};
