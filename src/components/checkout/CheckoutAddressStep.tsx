import React from "react";
import type { Address } from "@/data/addresses";
import type { CheckoutCopy } from "./types";
import { CITIES_EN, CITIES_AR } from "./constants";

interface AddressStepProps {
  t: CheckoutCopy;
  isAr: boolean;
  addresses: Address[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showNewForm: boolean;
  onShowNewForm: () => void;
  onUseSaved: () => void;
  newFullName: string;
  setNewFullName: (v: string) => void;
  newPhone: string;
  setNewPhone: (v: string) => void;
  newCity: string;
  setNewCity: (v: string) => void;
  newDistrict: string;
  setNewDistrict: (v: string) => void;
  newStreet: string;
  setNewStreet: (v: string) => void;
  newNotes: string;
  setNewNotes: (v: string) => void;
  useNewAsDefault: boolean;
  setUseNewAsDefault: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CheckoutAddressStep: React.FC<AddressStepProps> = ({
  t,
  isAr,
  addresses,
  selectedId,
  onSelect,
  showNewForm,
  onShowNewForm,
  onUseSaved,
  newFullName,
  setNewFullName,
  newPhone,
  setNewPhone,
  newCity,
  setNewCity,
  newDistrict,
  setNewDistrict,
  newStreet,
  setNewStreet,
  newNotes,
  setNewNotes,
  useNewAsDefault,
  setUseNewAsDefault,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-md font-sans">
      <h2 className="font-serif text-headline-sm text-on-surface mb-2 border-b border-surface-container-high pb-2">
        {t.savedAddresses}
      </h2>

      {!showNewForm &&
        addresses.map((a) => {
          const checked = selectedId === a.id;
          return (
            <label
              key={a.id}
              className={`block border-2 rounded-xl p-md cursor-pointer transition-all active:scale-[0.99] ${
                checked
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-md">
                <input
                  type="radio"
                  name="address"
                  className="mt-1 accent-primary"
                  checked={checked}
                  onChange={() => onSelect(a.id)}
                  aria-label={`${a.labelEn} — ${a.streetEn}`}
                />
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-label-md text-on-surface uppercase tracking-wider">
                      {isAr ? a.labelAr : a.labelEn}
                    </span>
                    {a.isDefault && (
                      <span className="text-[10px] uppercase tracking-wider bg-primary text-on-primary px-2 py-0.5 rounded-full font-bold">
                        {t.defaultBadge}
                      </span>
                    )}
                  </div>
                  <div className="text-label-sm text-on-surface mt-1">
                    {isAr ? a.fullNameAr : a.fullNameEn} · {a.phone}
                  </div>
                  <div className="text-label-sm text-on-surface-variant mt-0.5">
                    {isAr ? a.streetAr : a.streetEn}
                    {a.districtEn && (
                      <>
                        {", "}
                        {isAr ? a.districtAr : a.districtEn}
                      </>
                    )}
                    {" · "}
                    {isAr ? a.cityAr : a.cityEn}
                  </div>
                </div>
              </div>
            </label>
          );
        })}

      {!showNewForm ? (
        <div className="flex gap-sm flex-wrap">
          <button
            type="button"
            onClick={onShowNewForm}
            className="text-label-sm text-primary font-bold underline active:scale-95 transition-transform"
          >
            {t.addNewAddress}
          </button>
          {selectedId && addresses.length > 1 && (
            <button
              type="button"
              onClick={onUseSaved}
              className="text-label-sm text-on-surface-variant font-bold active:scale-95 transition-transform"
            >
              {t.useDifferent}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-md border-t border-outline-variant pt-md">
          <h3 className="font-serif text-label-md text-primary uppercase tracking-wider font-bold">
            {t.newAddressTitle}
          </h3>

          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {t.fullName}
            </label>
            <input
              type="text"
              required
              placeholder={t.fullNamePh}
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {t.phone}
            </label>
            <input
              type="tel"
              required
              placeholder={t.phonePh}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {t.city}
              </label>
              <select
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                {CITIES_EN.map((city, i) => (
                  <option key={city} value={city}>
                    {isAr ? CITIES_AR[i] : city}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {t.districtLabel}
              </label>
              <input
                type="text"
                placeholder={t.districtPh}
                value={newDistrict}
                onChange={(e) => setNewDistrict(e.target.value)}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {t.street}
            </label>
            <textarea
              required
              rows={2}
              placeholder={t.streetPh}
              value={newStreet}
              onChange={(e) => setNewStreet(e.target.value)}
              className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {t.notesLabel}
            </label>
            <input
              type="text"
              placeholder={t.notesPh}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <label className="flex items-center gap-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useNewAsDefault}
              onChange={(e) => setUseNewAsDefault(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <span className="text-label-sm text-on-surface-variant">
              {isAr ? "اجعله العنوان الافتراضي" : "Make this my default"}
            </span>
          </label>
        </div>
      )}

      <button
        type="submit"
        className="btn-primary py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md btn-tactile text-center active:scale-95 transition-transform mt-4"
      >
        {t.proceedToPayment}
      </button>
    </form>
  );
};
