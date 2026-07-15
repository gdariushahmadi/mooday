"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  type ReportTargetKind,
  type ReportReason,
  REPORT_REASONS_EN,
  REPORT_REASONS_AR,
} from "@/data/reports";

interface ReportViewProps {
  /** Order context (H-40 is reachable from order details). */
  orderId?: string;
  /** Target id we're reporting. Defaults to the first line item's id. */
  targetId?: string;
  onBack: () => void;
  /** Called after a successful submit with the produced case number. */
  onSubmitted?: (caseNumber: string) => void;
}

interface ReportCopy {
  title: string;
  back: string;
  intro: string;
  kindListing: string;
  kindUser: string;
  reasonHeading: string;
  bodyHeading: string;
  bodyPh: string;
  attachHelp: string;
  submit: string;
  successTitle: string;
  successBody: (n: string) => string;
  backToOrder: string;
  required: string;
}

const COPY: Record<"en" | "ar", ReportCopy> = {
  en: {
    title: "Report",
    back: "Back",
    intro:
      "Tell us what's wrong. Our moderation team reviews reports within 24 hours.",
    kindListing: "This listing",
    kindUser: "This seller",
    reasonHeading: "Reason",
    bodyHeading: "What happened",
    bodyPh: "Describe the issue in your own words.",
    attachHelp: "Up to 3 photos help us understand.",
    submit: "Submit report",
    successTitle: "Report submitted",
    successBody: (n) =>
      `Your case ID is ${n}. We'll review and update you via the Activity feed.`,
    backToOrder: "Back to order",
    required: "Please pick a reason and add a short description.",
  },
  ar: {
    title: "الإبلاغ",
    back: "رجوع",
    intro:
      "أخبرنا بما حدث. فريق الإشراف يراجع البلاغات خلال ٢٤ ساعة.",
    kindListing: "هذا المنتج",
    kindUser: "هذا البائع",
    reasonHeading: "السبب",
    bodyHeading: "ما حدث",
    bodyPh: "صف المشكلة بكلماتك.",
    attachHelp: "حتى ٣ صور تساعدنا على الفهم.",
    submit: "إرسال البلاغ",
    successTitle: "تم إرسال البلاغ",
    successBody: (n) =>
      `رقم القضية هو ${n}. سنراجع ونبلغك عبر صفحة التنبيهات.`,
    backToOrder: "العودة للطلب",
    required: "يرجى اختيار سبب ووصف قصير.",
  },
};

/**
 * H-40 — Report Listing / User.
 *
 * Reachable from a product detail (target a listing) or a chat thread
 * (target the other user). Phase 1 keeps the shape identical for both —
 * the `kind` toggle decides whether the case-number assignment carries
 * a "listing" or "user" tag.
 */
export const ReportView: React.FC<ReportViewProps> = ({
  orderId,
  targetId,
  onBack,
  onSubmitted,
}) => {
  const { language, submitReport, orders, listings } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [kind, setKind] = useState<ReportTargetKind>("listing");
  const [reason, setReason] = useState<ReportReason>("other");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submittedCase, setSubmittedCase] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // Resolve a friendly label for the target so the submitter can
  // confirm what they're reporting.
  const targetLabel = (() => {
    if (kind === "listing") {
      const p =
        listings.find((l) => l.id === targetId) ||
        orders.find((o) => o.id === orderId)?.lineItems[0]?.product;
      if (!p) return isAr ? "منتج" : "Item";
      return isAr ? p.titleAr : p.titleEn;
    }
    const sellerName =
      orders.find((o) => o.id === orderId)?.lineItems[0]?.product
        .sellerNameEn ?? "Seller";
    return sellerName;
  })();

  const handleAddPhoto = () => {
    if (photos.length >= 3) return;
    const sample =
      listings.find((l) => l.id === targetId)?.image ??
      orders.find((o) => o.id === orderId)?.lineItems[0]?.product.image ??
      "/products/placeholder.jpg";
    setPhotos([...photos, sample]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setFormError(t.required);
      return;
    }
    setFormError("");
    const record = submitReport({
      kind,
      targetId: targetId ?? orderId ?? "unknown",
      targetLabelEn: kind === "listing" ? targetLabel : `Seller: ${targetLabel}`,
      targetLabelAr: kind === "listing" ? targetLabel : `البائع: ${targetLabel}`,
      reason,
      body: body.trim(),
      photos,
    });
    setSubmittedCase(record.caseNumber);
    onSubmitted?.(record.caseNumber);
  };

  if (submittedCase) {
    return (
      <div className="w-full max-w-[600px] mx-auto flex flex-col items-center text-center gap-md py-12">
        <span
          className="material-symbols-outlined text-[64px] text-emerald-600"
          aria-hidden="true"
        >
          check_circle
        </span>
        <h2 className="font-serif text-headline-md text-on-surface">
          {t.successTitle}
        </h2>
        <p className="text-label-sm text-on-surface-variant max-w-sm">
          {t.successBody(submittedCase)}
        </p>
        <p className="text-[10px] uppercase tracking-wider font-bold bg-surface-container-low px-3 py-1 rounded-full text-primary">
          {submittedCase}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="btn-primary px-6 py-3 rounded-xl text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform mt-md"
        >
          {t.backToOrder}
        </button>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-md pb-10"
    >
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined no-mirror" aria-hidden="true">
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-headline-sm text-primary tracking-widest uppercase flex-grow text-center">
          {t.title}
        </h1>
        <div className="w-10" aria-hidden="true" />
      </div>

      <p className="text-label-sm text-on-surface-variant">{t.intro}</p>

      {/* Target banner */}
      <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md text-label-sm text-on-surface">
        <span className="block text-[10px] uppercase tracking-wider text-outline font-bold">
          {kind === "listing" ? t.kindListing : t.kindUser}
        </span>
        <span className="font-bold text-on-surface line-clamp-1">
          {targetLabel}
        </span>
      </div>

      {/* Kind toggle */}
      <div
        role="radiogroup"
        aria-label={isAr ? "نوع البلاغ" : "What are you reporting"}
        className="flex gap-sm"
      >
        {(
          [
            ["listing", t.kindListing],
            ["user", t.kindUser],
          ] as [ReportTargetKind, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={`flex-1 py-2 px-3 rounded-full border text-label-sm font-bold uppercase tracking-wider transition-all ${
              kind === k
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface-container-lowest text-on-surface border-surface-container-high"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md font-sans">
        {formError && <p role="alert" className="rounded-lg bg-error-container p-sm text-error font-bold">{formError}</p>}
        {/* Reasons */}
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex flex-col gap-sm">
          <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold">
            {t.reasonHeading}
          </h2>
          <div
            role="radiogroup"
            aria-label={t.reasonHeading}
            className="grid grid-cols-1 sm:grid-cols-2 gap-sm"
          >
            {(Object.keys(REPORT_REASONS_EN) as ReportReason[]).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={reason === r}
                onClick={() => setReason(r)}
                className={`text-start px-3 py-2 rounded-lg border text-label-sm transition-all ${
                  reason === r
                    ? "bg-primary/5 border-primary font-bold"
                    : "bg-surface border-outline-variant"
                }`}
              >
                {isAr ? REPORT_REASONS_AR[r] : REPORT_REASONS_EN[r]}
              </button>
            ))}
          </div>
        </section>

        {/* Body */}
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex flex-col gap-sm">
          <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold">
            {t.bodyHeading}
          </h2>
          <textarea
            rows={5}
            placeholder={t.bodyPh}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
          />
          <p className="text-[10px] text-on-surface-variant mt-1">
            {t.attachHelp}
          </p>
          <div className="flex gap-sm flex-wrap">
            {photos.map((p, i) => (
              <div
                key={i}
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-container-high"
              >
                <img alt="" src={p} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  className="absolute top-1 end-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px]"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button
                type="button"
                onClick={handleAddPhoto}
                aria-label={isAr ? "إضافة صورة" : "Add photo"}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center text-outline hover:border-primary hover:text-primary"
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  aria-hidden="true"
                >
                  add_a_photo
                </span>
              </button>
            )}
          </div>
        </section>

        <button
          type="submit"
          className="btn-primary py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform"
        >
          {t.submit}
        </button>
      </form>
    </div>
  );
};
