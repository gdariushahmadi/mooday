"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Order } from "@/data/orders";
import { AppImage } from "@/components/AppImage";
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
  policyHint: string;
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
      "This is a Demo request. It is saved only in this browser; no refund or payment is created.",
    productLine: "Return for:",
    reasonHeading: "Reason",
    bodyHeading: "Details",
    bodyPh: "What was wrong with the item?",
    photoHelp: "Select up to 3 real photos of the issue. The product image is not used as evidence.",
    submit: "Submit return request",
    policyHint:
      "We review return requests under the published return policy.",
    cancel: "Cancel",
    successTitle: "Return request submitted",
    successBody:
      "The Demo request was saved in this browser. No refund or seller payout was created.",
    backToOrder: "Back to order",
    required: "Please choose a reason and add a short description.",
    openedFor: "Opened for:",
  },
  ar: {
    title: "إرجاع / استرداد",
    back: "رجوع",
    intro:
      "هذا طلب تجريبي. يُحفظ في هذا المتصفح فقط، ولا يتم إنشاء دفع أو استرداد.",
    productLine: "إرجاع:",
    reasonHeading: "السبب",
    bodyHeading: "التفاصيل",
    bodyPh: "ما المشكلة في المنتج؟",
    photoHelp: "اختاري حتى ٣ صور حقيقية للمشكلة. لا تُستخدم صورة المنتج كدليل.",
    submit: "إرسال طلب الإرجاع",
    policyHint:
      "نراجع طلبات الإرجاع وفق سياسة الإرجاع المنشورة.",
    cancel: "إلغاء",
    successTitle: "تم إرسال طلب الإرجاع",
    successBody:
      "تم حفظ الطلب التجريبي في هذا المتصفح. لم يتم إنشاء استرداد أو تحويل للبائع.",
    backToOrder: "العودة للطلب",
    required: "يرجى اختيار سبب ووصف قصير.",
    openedFor: "مفتوح لـ:",
  },
};

/**
 * H-41 — Return / Refund request.
 *
 * Reachable from a delivered order's details screen. The user picks a
 * reason and explains the issue; a submit opens a new local dispute on the
 * demo order and transitions its sample status to "returned". No payment,
 * refund, or seller payout is created.
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const valid = selected.filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024,
    );
    const remaining = Math.max(0, 3 - photos.length);
    if (valid.length === 0 && selected.length > 0) {
      setFormError(isAr ? "اختاري صوراً صالحة بحجم أقل من ٥ ميغابايت." : "Select valid image files under 5 MB.");
    } else {
      setFormError("");
    }
    setPhotos((previous) => [
      ...previous,
      ...valid.slice(0, remaining).map((file) => URL.createObjectURL(file)),
    ]);
    event.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setFormError(t.required);
      return;
    }
    setFormError("");
    setIsSubmitting(true);
    try {
      // Open the dispute (H-44), then flip the order status to "returned".
      await openDispute({
        orderId: order.id,
        reason,
        body: body.trim(),
        photos,
      });
      await updateOrderStatus(order.id, "returned");
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setFormError(isAr ? "تعذر إرسال طلب الإرجاع. حاولي مرة أخرى." : "We could not submit the return request. Try again.");
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="app-page-header flex items-center justify-between border-b border-outline-variant pb-4">
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
          <AppImage
            alt={productLabel}
            src={first.product.image}
            width={56}
            height={56}
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
          <input
            id="return-photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={handlePhotoChange}
            aria-label={isAr ? "إضافة صورة" : "Add photo"}
          />
          <div className="flex gap-sm flex-wrap">
            {photos.map((p, i) => (
              <div
                key={i}
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-container-high"
              >
                <AppImage
                  alt=""
                  src={p}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
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
              <label
                htmlFor="return-photos"
                role="button"
                aria-label={isAr ? "إضافة صورة" : "Add photo"}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center text-outline hover:border-primary hover:text-primary cursor-pointer"
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  aria-hidden="true"
                >
                  add_a_photo
                </span>
              </label>
            )}
          </div>
        </section>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-md text-label-sm text-on-surface">
          <strong className="text-primary">{t.policyHint}</strong>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="btn-primary py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform"
        >
          {isSubmitting ? (isAr ? "جارٍ الإرسال..." : "Submitting...") : t.submit}
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
