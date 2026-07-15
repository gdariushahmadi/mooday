"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import {
  type DisputeReason,
  DISPUTE_REASONS_EN,
  DISPUTE_REASONS_AR,
} from "@/data/disputes";

interface ReturnRequestViewProps {
  order: Order;
  onBack: () => void;
  /** Called after a successful submit. */
  onSubmitted?: () => void;
}

interface ReturnCopy {
  title: string;
  back: string;
  intro: string;
  productLine: string;
  reasonHeading: string;
  bodyHeading: string;
  bodyPh: string;
  photoHelp: string;
  submit: string;
  escrowHint: string;
  cancel: string;
  successTitle: string;
  successBody: string;
  backToOrder: string;
  required: string;
  openedFor: string;
}

const COPY: Record<"en" | "ar", ReturnCopy> = {
  en: {
    title: "Return / Refund",
    back: "Back",
    intro:
      "Tell us why. Funds stay in escrow until the seller accepts the return or our team resolves it within 48 hours.",
    productLine: "Return for:",
    reasonHeading: "Reason",
    bodyHeading: "Details",
    bodyPh: "What was wrong with the item?",
    photoHelp: "Photos of the issue help us approve refunds faster.",
    submit: "Submit return request",
    escrowHint:
      "Your money stays protected — the seller is paid only after we confirm the return.",
    cancel: "Cancel",
    successTitle: "Return request submitted",
    successBody:
      "The seller has 48 hours to respond. We'll email you with next steps.",
    backToOrder: "Back to order",
    required: "Please choose a reason and add a short description.",
    openedFor: "Opened for:",
  },
  ar: {
    title: "إرجاع / استرداد",
    back: "رجوع",
    intro:
      "أخبرنا بسبب الإرجاع. يبقى المال في الضمان حتى يقبل البائع الإرجاع أو يحل فريقنا خلال ٤٨ ساعة.",
    productLine: "إرجاع:",
    reasonHeading: "السبب",
    bodyHeading: "التفاصيل",
    bodyPh: "ما المشكلة في المنتج؟",
    photoHelp: "صور المشكلة تساعدنا في الموافقة على الاسترداد بسرعة.",
    submit: "إرسال طلب الإرجاع",
    escrowHint:
      "أموالك محمية — لن يحصل البائع على المبلغ إلا بعد تأكيد الإرجاع.",
    cancel: "إلغاء",
    successTitle: "تم إرسال طلب الإرجاع",
    successBody:
      "لدى البائع ٤٨ ساعة للرد. سنرسل لك بريداً بالخطوات التالية.",
    backToOrder: "العودة للطلب",
    required: "يرجى اختيار سبب ووصف قصير.",
    openedFor: "مفتوح لـ:",
  },
};

/**
 * H-41 — Return / Refund request.
 *
 * Reachable from a delivered order's details screen. The user picks a
 * reason and explains the issue; a submit opens a new dispute on the
 * order, transitions its status to "returned", and flips the seller's
 * payout back to "pending". For Phase 1 only the dispute is opened (no
 * actual fund reversal yet).
 */
export const ReturnRequestView: React.FC<ReturnRequestViewProps> = ({
  order,
  onBack,
  onSubmitted,
}) => {
  const { language, openDispute, updateOrderStatus } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const first = order.lineItems[0];
  const productLabel = first
    ? isAr
      ? first.product.titleAr
      : first.product.titleEn
    : "";

  const [reason, setReason] = useState<DisputeReason>("not_as_described");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const handleAddPhoto = () => {
    if (photos.length >= 3) return;
    const sample =
      first?.product.image ?? "/products/placeholder.jpg";
    setPhotos([...photos, sample]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setFormError(t.required);
      return;
    }
    setFormError("");
    // Open the dispute (H-44), then flip the order status to "returned".
    openDispute({
      orderId: order.id,
      reason,
      body: body.trim(),
      photos,
    });
    updateOrderStatus(order.id, "returned");
    setSubmitted(true);
    onSubmitted?.();
  };

  if (submitted) {
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
          {t.successBody}
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

      <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex items-center gap-md">
        {first && (
          <img
            alt={productLabel}
            src={first.product.image}
            className="w-14 h-14 rounded object-cover border border-outline-variant flex-shrink-0"
          />
        )}
        <div className="flex-grow min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-outline font-bold">
            {t.productLine}
          </div>
          <p className="font-serif text-label-md text-on-surface line-clamp-1">
            {productLabel}
          </p>
          <div className="text-[10px] text-outline">#{order.id}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-md font-sans">
        {formError && <p role="alert" className="rounded-lg bg-error-container p-sm text-error font-bold">{formError}</p>}
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex flex-col gap-sm">
          <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold">
            {t.reasonHeading}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
            {(Object.keys(DISPUTE_REASONS_EN) as DisputeReason[]).map((r) => (
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
                {isAr ? DISPUTE_REASONS_AR[r] : DISPUTE_REASONS_EN[r]}
              </button>
            ))}
          </div>
        </section>

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
          <p className="text-[10px] text-on-surface-variant mt-1">{t.photoHelp}</p>
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
                  aria-label="Remove"
                  className="absolute top-1 end-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center"
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

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-md text-label-sm text-on-surface">
          <strong className="text-primary">{t.escrowHint}</strong>
        </div>

        <button
          type="submit"
          className="btn-primary py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform"
        >
          {t.submit}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider self-center active:scale-95 transition-transform"
        >
          {t.cancel}
        </button>
      </form>
    </div>
  );
};
