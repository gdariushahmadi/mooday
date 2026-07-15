"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Address } from "@/data/addresses";
import { ClickableCard } from "./ClickableCard";

interface SavedAddressesViewProps {
  onBack: () => void;
}

interface AddressesCopy {
  title: string;
  back: string;
  addNew: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
  defaultBadge: string;
  makeDefault: string;
  delete: string;
  deleteConfirmTitle: string;
  deleteConfirmBody: (label: string) => string;
  cancel: string;
  remove: string;
  addTitle: string;
  save: string;
  fullName: string;
  fullNamePh: string;
  phone: string;
  phonePh: string;
  city: string;
  districtLabel: string;
  districtPh: string;
  street: string;
  streetPh: string;
  notesLabel: string;
  notesPh: string;
  defaultLabel: string;
  required: string;
  cancelAdd: string;
  saveError: string;
}

const COPY: Record<"en" | "ar", AddressesCopy> = {
  en: {
    title: "Saved addresses",
    back: "Back",
    addNew: "+ Add a new address",
    emptyTitle: "No saved addresses",
    emptyBody:
      "Add your home, work, or any other address to speed up checkout.",
    emptyCta: "Add your first address",
    defaultBadge: "Default",
    makeDefault: "Make default",
    delete: "Delete",
    deleteConfirmTitle: "Delete this address?",
    deleteConfirmBody: (label) => `"${label}" will be removed from your saved addresses.`,
    cancel: "Cancel",
    remove: "Delete",
    addTitle: "New address",
    save: "Save address",
    fullName: "Full name",
    fullNamePh: "Enter your full name",
    phone: "Phone number",
    phonePh: "+971 5X XXX XXXX",
    city: "Emirate",
    districtLabel: "District / area",
    districtPh: "e.g. Jumeirah",
    street: "Street, building, apartment",
    streetPh: "e.g. Villa 24, Al Wasl Road",
    notesLabel: "Delivery notes (optional)",
    notesPh: "Landmark, gate, etc.",
    defaultLabel: "Make this my default",
    required: "Please complete the required fields.",
    cancelAdd: "Cancel",
    saveError: "We couldn't save that change. Please try again.",
  },
  ar: {
    title: "العناوين المحفوظة",
    back: "رجوع",
    addNew: "+ إضافة عنوان",
    emptyTitle: "لا توجد عناوين محفوظة",
    emptyBody:
      "أضيفي عنوان المنزل أو العمل أو أي عنوان لتسريع عملية الشراء.",
    emptyCta: "أضيفي عنوانك الأول",
    defaultBadge: "افتراضي",
    makeDefault: "اجعله افتراضي",
    delete: "حذف",
    deleteConfirmTitle: "حذف هذا العنوان؟",
    deleteConfirmBody: (label) =>
      `سيتم إزالة "${label}" من عناوينك المحفوظة.`,
    cancel: "إلغاء",
    remove: "حذف",
    addTitle: "عنوان جديد",
    save: "حفظ العنوان",
    fullName: "الاسم الكامل",
    fullNamePh: "ادخلي اسمك",
    phone: "رقم الهاتف",
    phonePh: "+971 5X XXX XXXX",
    city: "الإمارة",
    districtLabel: "المنطقة",
    districtPh: "مثال: جميرا",
    street: "الشارع، المبنى، الشقة",
    streetPh: "مثال: فيلا 24، شارع الوصل",
    notesLabel: "ملاحظات التوصيل (اختياري)",
    notesPh: "معلم، البوابة...",
    defaultLabel: "اجعله العنوان الافتراضي",
    required: "يرجى إكمال الحقول المطلوبة.",
    cancelAdd: "إلغاء",
    saveError: "تعذر حفظ التغيير. حاولي مجدداً.",
  },
};

const CITIES_EN = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
];
const CITIES_AR = ["دبي", "أبوظبي", "الشارقة", "عجمان", "رأس الخيمة", "الفجيرة", "أم القيوين"];

/**
 * G-35 — Saved Addresses.
 *
 * Management view: list all saved addresses with Default badge, "Make
 * default" action, and remove (with confirm modal). "Add a new address"
 * reveals an inline form with the 7 UAE emirates + district + notes.
 * All copy is bilingual EN/AR. Empty state when no addresses exist.
 */
export const SavedAddressesView: React.FC<SavedAddressesViewProps> = ({
  onBack,
}) => {
  const {
    language,
    addresses,
    addAddress,
    removeAddress,
    setDefaultAddress,
  } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [form, setForm] = useState({
    labelEn: "Home" as "Home" | "Work" | "Other",
    labelAr: "المنزل" as "المنزل" | "العمل" | "أخرى",
    fullName: "",
    phone: "+971 ",
    cityEn: "Dubai",
    district: "",
    street: "",
    notes: "",
    isDefault: true,
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.street) {
      setFormError(t.required);
      return;
    }
    setFormError("");
    try {
      await Promise.resolve(
        addAddress({
          labelEn: form.labelEn,
          labelAr: form.labelAr,
          fullNameEn: form.fullName,
          fullNameAr: form.fullName,
          phone: form.phone,
          cityEn: form.cityEn,
          cityAr: CITIES_AR[CITIES_EN.indexOf(form.cityEn)] ?? form.cityEn,
          streetEn: form.street,
          streetAr: form.street,
          districtEn: form.district || undefined,
          districtAr: form.district || undefined,
          notesEn: form.notes || undefined,
          notesAr: form.notes || undefined,
          isDefault: form.isDefault,
        }),
      );
    } catch {
      setFormError(t.saveError);
      return;
    }
    setForm({
      labelEn: "Home",
      labelAr: "المنزل",
      fullName: "",
      phone: "+971 ",
      cityEn: "Dubai",
      district: "",
      street: "",
      notes: "",
      isDefault: true,
    });
    setShowForm(false);
  };

  const handleMakeDefault = async (id: string) => {
    setMutationError("");
    try {
      await Promise.resolve(setDefaultAddress(id));
    } catch {
      setMutationError(t.saveError);
    }
  };

  const handleRemove = async (id: string) => {
    setMutationError("");
    try {
      await Promise.resolve(removeAddress(id));
      setConfirmDeleteId(null);
    } catch {
      setMutationError(t.saveError);
      setConfirmDeleteId(null);
    }
  };

  const confirmDeleteTarget = addresses.find((a) => a.id === confirmDeleteId);

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

      {/* Add new */}
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="self-start text-label-sm text-primary font-bold uppercase tracking-wider active:scale-95 transition-transform"
        >
          {t.addNew}
        </button>
      )}

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex flex-col gap-sm"
        >
          {formError && <p role="alert" className="rounded-lg bg-error-container p-sm text-error font-bold">{formError}</p>}
          <h2 className="font-serif text-headline-sm text-primary">
            {t.addTitle}
          </h2>
          {/* Label tabs */}
          <div
            role="tablist"
            aria-label={isAr ? "نوع العنوان" : "Address label"}
            className="flex gap-2"
          >
            {(
              [
                { en: "Home", ar: "المنزل" },
                { en: "Work", ar: "العمل" },
                { en: "Other", ar: "أخرى" },
              ] as { en: "Home" | "Work" | "Other"; ar: "المنزل" | "العمل" | "أخرى" }[]
            ).map((l) => (
              <button
                key={l.en}
                type="button"
                role="tab"
                aria-selected={form.labelEn === l.en}
                onClick={() => setForm({ ...form, labelEn: l.en, labelAr: l.ar })}
                className={`px-3 py-1.5 rounded-full text-label-sm border ${
                  form.labelEn === l.en
                    ? "bg-primary text-on-primary border-primary font-bold"
                    : "bg-surface border-surface-container-high text-on-surface"
                }`}
              >
                {isAr ? l.ar : l.en}
              </button>
            ))}
          </div>
          <Field
            label={t.fullName}
            placeholder={t.fullNamePh}
            value={form.fullName}
            onChange={(v) => setForm({ ...form, fullName: v })}
          />
          <Field
            label={t.phone}
            placeholder={t.phonePh}
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {t.city}
            </label>
            <select
              value={form.cityEn}
              onChange={(e) => setForm({ ...form, cityEn: e.target.value })}
              className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
            >
              {CITIES_EN.map((c, i) => (
                <option key={c} value={c}>
                  {isAr ? CITIES_AR[i] : c}
                </option>
              ))}
            </select>
          </div>
          <Field
            label={t.districtLabel}
            placeholder={t.districtPh}
            value={form.district}
            onChange={(v) => setForm({ ...form, district: v })}
          />
          <Field
            label={t.street}
            placeholder={t.streetPh}
            value={form.street}
            onChange={(v) => setForm({ ...form, street: v })}
          />
          <Field
            label={t.notesLabel}
            placeholder={t.notesPh}
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
          />
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

      {/* List */}
      {mutationError && (
        <p
          role="alert"
          className="rounded-lg bg-error-container p-sm font-bold text-error"
        >
          {mutationError}
        </p>
      )}
      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            home
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
          {addresses.map((a) => (
            <AddressRow
              key={a.id}
              address={a}
              isAr={isAr}
              t={t}
              onMakeDefault={() => void handleMakeDefault(a.id)}
              onDelete={() => setConfirmDeleteId(a.id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
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
                  ? confirmDeleteTarget.labelAr
                  : confirmDeleteTarget.labelEn,
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
                onClick={() => void handleRemove(confirmDeleteTarget.id)}
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

const Field: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, placeholder, value, onChange }) => (
  <div className="flex flex-col gap-xs">
    <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
      {label}
    </label>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
    />
  </div>
);

const AddressRow: React.FC<{
  address: Address;
  isAr: boolean;
  t: AddressesCopy;
  onMakeDefault: () => void;
  onDelete: () => void;
}> = ({ address, isAr, t, onMakeDefault, onDelete }) => {
  const label = isAr ? address.labelAr : address.labelEn;
  return (
    <ClickableCard
      as="article"
      onClick={onMakeDefault}
      ariaLabel={`${label} — ${isAr ? address.streetAr : address.streetEn}`}
      className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex flex-col gap-sm hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <span
            className={`material-symbols-outlined text-[20px] ${
              address.labelEn === "Home"
                ? "text-primary"
                : address.labelEn === "Work"
                  ? "text-blue-600"
                  : "text-on-surface-variant"
            } no-mirror`}
            aria-hidden="true"
          >
            {address.labelEn === "Home"
              ? "home"
              : address.labelEn === "Work"
                ? "work"
                : "location_on"}
          </span>
          <span className="font-serif text-label-md text-on-surface uppercase tracking-wider">
            {label}
          </span>
        </div>
        {address.isDefault && (
          <span className="text-[10px] uppercase tracking-wider bg-primary text-on-primary px-2 py-0.5 rounded-full font-bold">
            {t.defaultBadge}
          </span>
        )}
      </div>
      <p className="text-label-sm text-on-surface">
        {isAr ? address.fullNameAr : address.fullNameEn} · {address.phone}
      </p>
      <p className="text-label-sm text-on-surface-variant">
        {isAr ? address.streetAr : address.streetEn}
        {address.districtEn && (
          <>
            {", "}
            {isAr ? address.districtAr : address.districtEn}
          </>
        )}
        {" · "}
        {isAr ? address.cityAr : address.cityEn}
      </p>
      <div className="flex gap-sm justify-end">
        {!address.isDefault && (
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
