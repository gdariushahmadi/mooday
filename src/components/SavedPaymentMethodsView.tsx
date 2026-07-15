"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { PaymentMethod } from "@/data/paymentMethods";
import { ClickableCard } from "./ClickableCard";

interface SavedPaymentMethodsViewProps {
  onBack: () => void;
}

interface MethodsCopy {
  title: string;
  back: string;
  addNew: string;
  emptyTitle: string;
  emptyBody: string;
  defaultBadge: string;
  makeDefault: string;
  delete: string;
  deleteConfirmTitle: string;
  deleteConfirmBody: (brand: string, last4: string) => string;
  cancel: string;
  remove: string;
  addTitle: string;
  save: string;
  cardholder: string;
  cardholderPh: string;
  cardNumber: string;
  expiry: string;
  expiryPh: string;
  cvv: string;
  defaultLabel: string;
  required: string;
  cancelAdd: string;
  brandLabel: (brand: string) => string;
}

const COPY: Record<"en" | "ar", MethodsCopy> = {
  en: {
    title: "Payment methods",
    back: "Back",
    addNew: "+ Add a new card",
    emptyTitle: "No saved cards",
    emptyBody: "Save cards to speed up checkout at C-13 and the Buy Item flow.",
    defaultBadge: "Default",
    makeDefault: "Make default",
    delete: "Delete",
    deleteConfirmTitle: "Delete this card?",
    deleteConfirmBody: (brand, last4) =>
      `${brand} ending in ${last4} will be removed from your saved cards.`,
    cancel: "Cancel",
    remove: "Delete",
    addTitle: "New card",
    save: "Save card",
    cardholder: "Cardholder name",
    cardholderPh: "Name on card",
    cardNumber: "Card number",
    expiry: "Expiry",
    expiryPh: "MM/YY",
    cvv: "CVV",
    defaultLabel: "Make this my default",
    required: "Please complete the required fields.",
    cancelAdd: "Cancel",
    brandLabel: (brand) => brand,
  },
  ar: {
    title: "طرق الدفع",
    back: "رجوع",
    addNew: "+ إضافة بطاقة",
    emptyTitle: "لا توجد بطاقات محفوظة",
    emptyBody: "احفظي البطاقات لتسريع عملية الشراء.",
    defaultBadge: "افتراضي",
    makeDefault: "اجعلها افتراضية",
    delete: "حذف",
    deleteConfirmTitle: "حذف هذه البطاقة؟",
    deleteConfirmBody: (brand, last4) =>
      `سيتم إزالة ${brand} المنتهية بـ ${last4} من بطاقاتك المحفوظة.`,
    cancel: "إلغاء",
    remove: "حذف",
    addTitle: "بطاقة جديدة",
    save: "حفظ البطاقة",
    cardholder: "الاسم على البطاقة",
    cardholderPh: "الاسم على البطاقة",
    cardNumber: "رقم البطاقة",
    expiry: "تاريخ الانتهاء",
    expiryPh: "MM/YY",
    cvv: "CVV",
    defaultLabel: "اجعلها البطاقة الافتراضية",
    required: "يرجى إكمال الحقول المطلوبة.",
    cancelAdd: "إلغاء",
    brandLabel: (brand) => brand,
  },
};

/**
 * G-36 — Saved Payment Methods.
 *
 * Management view: list cards with Default badge, "Make default" +
 * remove (with confirm modal). "Add a new card" reveals an inline form
 * with cardholder, auto-formatting card number, MM/YY expiry, CVV, and
 * a "Make default" checkbox. All copy bilingual. Empty state when no
 * cards exist.
 */
export const SavedPaymentMethodsView: React.FC<
  SavedPaymentMethodsViewProps
> = ({ onBack }) => {
  const {
    language,
    paymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
  } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [showForm, setShowForm] = useState(paymentMethods.length === 0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    holder: "",
    number: "",
    expiry: "",
    cvv: "",
    isDefault: true,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = form.number.replace(/\s/g, "");
    if (
      digits.length < 15 ||
      !/^\d{2}\/\d{2}$/.test(form.expiry) ||
      form.cvv.length < 3 ||
      !form.holder
    ) {
      setFormError(t.required);
      return;
    }
    setFormError("");
    const brandEn = digits.startsWith("4")
      ? "Visa"
      : digits.startsWith("5")
        ? "Mastercard"
        : "Amex";
    const brandAr =
      brandEn === "Visa" ? "فيزا" : brandEn === "Mastercard" ? "ماستركارد" : "أمريكان إكسبريس";
    addPaymentMethod({
      labelEn: `${brandEn} Personal`,
      labelAr: `${brandAr} شخصية`,
      brandEn,
      brandAr,
      last4: digits.slice(-4),
      holderEn: form.holder,
      holderAr: form.holder,
      expiry: form.expiry,
      isDefault: form.isDefault,
    });
    setForm({ holder: "", number: "", expiry: "", cvv: "", isDefault: true });
    setShowForm(false);
  };

  const confirmDeleteTarget = paymentMethods.find(
    (m) => m.id === confirmDeleteId,
  );

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-md pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between -mt-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="flex items-center gap-1 text-primary active:scale-95 transition-transform py-1 pe-2"
        >
          <span
            className="material-symbols-outlined text-[22px] no-mirror"
            aria-hidden="true"
          >
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-label-lg text-on-surface tracking-widest">
          {t.title}
        </h1>
        <div className="w-8 h-8" aria-hidden="true" />
      </div>

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="self-start text-label-sm text-primary font-bold uppercase tracking-wider active:scale-95 transition-transform"
        >
          {t.addNew}
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex flex-col gap-sm"
        >
          {formError && <p role="alert" className="rounded-lg bg-error-container p-sm text-error font-bold">{formError}</p>}
          <h2 className="font-serif text-headline-sm text-primary">{t.addTitle}</h2>

          <FormField
            label={t.cardholder}
            placeholder={t.cardholderPh}
            value={form.holder}
            onChange={(v) => setForm({ ...form, holder: v })}
          />
          <FormField
            label={t.cardNumber}
            placeholder="4000 1234 5678 9010"
            value={form.number}
            onChange={(v) => {
              const digits = v.replace(/\D/g, "").slice(0, 16);
              const formatted = digits
                .replace(/(\d{4})(?=\d)/g, "$1 ")
                .trim();
              setForm({ ...form, number: formatted });
            }}
          />
          <div className="grid grid-cols-2 gap-sm">
            <FormField
              label={t.expiry}
              placeholder={t.expiryPh}
              value={form.expiry}
              onChange={(v) => {
                const digits = v.replace(/\D/g, "").slice(0, 4);
                if (digits.length <= 2) {
                  setForm({ ...form, expiry: digits });
                } else {
                  setForm({
                    ...form,
                    expiry: `${digits.slice(0, 2)}/${digits.slice(2)}`,
                  });
                }
              }}
            />
            <FormField
              label={t.cvv}
              placeholder="***"
              value={form.cvv}
              onChange={(v) =>
                setForm({
                  ...form,
                  cvv: v.replace(/\D/g, "").slice(0, 4),
                })
              }
              type="password"
            />
          </div>
          <label className="flex items-center gap-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm({ ...form, isDefault: e.target.checked })
              }
              className="accent-primary w-4 h-4"
            />
            <span className="text-label-sm text-on-surface-variant">
              {t.defaultLabel}
            </span>
          </label>
          <div className="flex gap-sm mt-2">
            <button
              type="submit"
              className="btn-primary flex-1 py-3 rounded-xl text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
            >
              {t.save}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-xl border-2 border-outline-variant text-on-surface text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
            >
              {t.cancelAdd}
            </button>
          </div>
        </form>
      )}

      {paymentMethods.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            credit_card
          </span>
          <h2 className="font-serif text-headline-sm text-on-surface">
            {t.emptyTitle}
          </h2>
          <p className="text-label-sm text-on-surface-variant max-w-xs">
            {t.emptyBody}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {paymentMethods.map((m) => (
            <PaymentMethodRow
              key={m.id}
              method={m}
              isAr={isAr}
              t={t}
              onMakeDefault={() => setDefaultPaymentMethod(m.id)}
              onDelete={() => setConfirmDeleteId(m.id)}
            />
          ))}
        </div>
      )}

      {confirmDeleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-md"
        >
          <div className="bg-surface rounded-2xl p-lg max-w-sm w-full shadow-2xl flex flex-col gap-md">
            <h3 className="font-serif text-headline-sm text-on-surface">
              {t.deleteConfirmTitle}
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              {t.deleteConfirmBody(
                isAr
                  ? confirmDeleteTarget.brandAr
                  : confirmDeleteTarget.brandEn,
                confirmDeleteTarget.last4,
              )}
            </p>
            <div className="flex gap-sm">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 rounded-xl border-2 border-outline-variant text-on-surface text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  removePaymentMethod(confirmDeleteTarget.id);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 py-3 rounded-xl bg-error text-on-error text-label-sm uppercase tracking-widest font-bold active:scale-95 transition-transform"
              >
                {t.remove}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Sub-components ----------

const FormField: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}> = ({ label, placeholder, value, onChange, type = "text" }) => (
  <div className="flex flex-col gap-xs">
    <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
    />
  </div>
);

const PaymentMethodRow: React.FC<{
  method: PaymentMethod;
  isAr: boolean;
  t: MethodsCopy;
  onMakeDefault: () => void;
  onDelete: () => void;
}> = ({ method, isAr, t, onMakeDefault, onDelete }) => {
  const brandColor =
    method.brandEn === "Visa"
      ? "bg-blue-700"
      : method.brandEn === "Mastercard"
        ? "bg-red-600"
        : method.brandEn === "Amex"
          ? "bg-blue-500"
          : "bg-black";

  return (
    <ClickableCard
      as="article"
      onClick={onMakeDefault}
      ariaLabel={`${method.brandEn} ending in ${method.last4}`}
      className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex flex-col gap-sm hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <div
            className={`w-12 h-8 rounded ${brandColor} flex items-center justify-center text-white text-[10px] font-bold tracking-wider shadow-sm`}
          >
            {method.brandEn === "Visa"
              ? "VISA"
              : method.brandEn === "Mastercard"
                ? "MC"
                : method.brandEn === "Amex"
                  ? "AMEX"
                  : method.brandEn}
          </div>
          <div>
            <div className="font-serif text-label-md text-on-surface">
              {isAr ? method.brandAr : method.brandEn}{" "}
              <span className="text-outline">•••• {method.last4}</span>
            </div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              {isAr ? method.holderAr : method.holderEn} · {method.expiry}
            </div>
          </div>
        </div>
        {method.isDefault && (
          <span className="text-[10px] uppercase tracking-wider bg-primary text-on-primary px-2 py-0.5 rounded-full font-bold">
            {t.defaultBadge}
          </span>
        )}
      </div>
      <div className="flex gap-sm justify-end">
        {!method.isDefault && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMakeDefault();
            }}
            className="px-3 py-1.5 rounded-full border border-primary text-primary text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
          >
            {t.makeDefault}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-3 py-1.5 rounded-full border border-error text-error text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
        >
          {t.delete}
        </button>
      </div>
    </ClickableCard>
  );
};
