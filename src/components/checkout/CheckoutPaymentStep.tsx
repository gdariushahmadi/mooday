import React from "react";
import type { PaymentMethod } from "@/data/paymentMethods";
import type { CheckoutCopy, PaymentChoice } from "./types";

interface PaymentStepProps {
  t: CheckoutCopy;
  isAr: boolean;
  paymentMethods: PaymentMethod[];
  selectedCardId: string | null;
  onSelectCard: (id: string | null) => void;
  paymentChoice: PaymentChoice;
  onSelectChoice: (c: PaymentChoice) => void;
  newCardNumber: string;
  setNewCardNumber: (v: string) => void;
  newCardHolder: string;
  setNewCardHolder: (v: string) => void;
  newExpiry: string;
  setNewExpiry: (v: string) => void;
  newCvv: string;
  setNewCvv: (v: string) => void;
  isProcessing: boolean;
  total: number;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const CheckoutPaymentStep: React.FC<PaymentStepProps> = ({
  t,
  isAr,
  paymentMethods,
  selectedCardId,
  onSelectCard,
  paymentChoice,
  onSelectChoice,
  newCardNumber,
  setNewCardNumber,
  newCardHolder,
  setNewCardHolder,
  newExpiry,
  setNewExpiry,
  newCvv,
  setNewCvv,
  isProcessing,
  total,
  onSubmit,
  onBack,
}) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-md font-sans">
    <h2 className="font-serif text-headline-sm text-on-surface mb-2 border-b border-surface-container-high pb-2">
      {isAr ? "طريقة الدفع" : "Payment method"}
    </h2>

    <div
      className="bg-primary/5 border border-primary/10 p-md rounded-lg text-body-md text-on-primary-fixed-variant"
      role="note"
    >
      <strong className="block text-label-md text-primary">
        {isAr ? "ضمان مودي الآمن:" : "Mooday Safe Escrow Policy:"}
      </strong>
      <p className="text-[13px] mt-1 leading-normal opacity-90">
        {t.escrowBody}
      </p>
    </div>

    {/* Top-level choice radios: card / apple / cod */}
    <div
      className="grid grid-cols-3 gap-sm"
      role="radiogroup"
      aria-label={isAr ? "طريقة الدفع" : "Payment method"}
    >
      <PaymentOptionTile
        label={isAr ? "بطاقة" : "Card"}
        icon="credit_card"
        active={paymentChoice === "saved-card" || paymentChoice === "new-card"}
        onClick={() => {
          onSelectChoice(selectedCardId ? "saved-card" : "new-card");
        }}
        isAr={isAr}
      />
      <PaymentOptionTile
        label={t.applePayLabel}
        icon="touch_id"
        active={paymentChoice === "apple"}
        onClick={() => onSelectChoice("apple")}
        isAr={isAr}
      />
      <PaymentOptionTile
        label={isAr ? "الدفع عند الاستلام" : "Cash"}
        icon="payments"
        active={paymentChoice === "cod"}
        onClick={() => onSelectChoice("cod")}
        isAr={isAr}
        disabled={total > 5000}
      />
    </div>

    {total > 5000 && (
      <p role="note" className="text-label-sm font-bold text-error">
        {t.codUnavailable}
      </p>
    )}

    {/* Saved cards list (visible when "Card" chosen) */}
    {(paymentChoice === "saved-card" || paymentChoice === "new-card") && (
      <>
        {paymentChoice === "saved-card" && (
          <div className="flex flex-col gap-sm">
            <h3 className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {t.savedCards}
            </h3>
            {paymentMethods.map((m) => {
              const checked = selectedCardId === m.id;
              return (
                <label
                  key={m.id}
                  className={`flex items-center gap-md border-2 rounded-xl p-md cursor-pointer transition-all ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="card"
                    className="accent-primary"
                    checked={checked}
                    onChange={() => onSelectCard(m.id)}
                    aria-label={`${m.brandEn} ending in ${m.last4}`}
                  />
                  <div className="flex items-center gap-sm flex-grow">
                    <span
                      className="material-symbols-outlined text-[28px] text-primary"
                      aria-hidden="true"
                    >
                      credit_card
                    </span>
                    <div>
                      <div className="text-label-md font-bold text-on-surface">
                        {isAr ? m.brandAr : m.brandEn} •••• {m.last4}
                      </div>
                      <div className="text-label-sm text-on-surface-variant">
                        {isAr ? m.holderAr : m.holderEn} · {m.expiry}
                        {m.isDefault && (
                          <span className="ms-2 text-[10px] uppercase tracking-wider bg-primary text-on-primary px-2 py-0.5 rounded-full font-bold">
                            {t.defaultBadge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
            <button
              type="button"
              onClick={() => {
                onSelectChoice("new-card");
                onSelectCard(null);
              }}
              className="text-label-sm text-primary font-bold underline self-start active:scale-95 transition-transform"
            >
              {t.addNewCard}
            </button>
          </div>
        )}

        {paymentChoice === "new-card" && (
          <div className="flex flex-col gap-md border-t border-outline-variant pt-md">
            <h3 className="font-serif text-label-md text-primary uppercase tracking-wider font-bold">
              {t.newCardTitle}
            </h3>
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {t.cardHolder}
              </label>
              <input
                type="text"
                required
                value={newCardHolder}
                onChange={(e) => setNewCardHolder(e.target.value)}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                {t.cardNumber}
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4000 1234 5678 9010"
                value={newCardNumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                  const formatted = digits
                    .replace(/(\d{4})(?=\d)/g, "$1 ")
                    .trim();
                  setNewCardNumber(formatted);
                }}
                className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  {t.expiry}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  value={newExpiry}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 4);
                    if (digits.length <= 2) {
                      setNewExpiry(digits);
                    } else {
                      setNewExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
                    }
                  }}
                  className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  {t.cvv}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="***"
                  value={newCvv}
                  onChange={(e) =>
                    setNewCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectChoice("saved-card")}
              className="text-label-sm text-on-surface-variant font-bold self-start active:scale-95 transition-transform"
            >
              {isAr ? "← استخدام بطاقة محفوظة" : "← Use a saved card"}
            </button>
          </div>
        )}
      </>
    )}

    {paymentChoice === "apple" && (
      <div className="bg-surface-container-low p-lg border border-outline-variant rounded-xl flex flex-col items-center justify-center gap-md my-4">
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-semibold text-lg">
          Pay
        </div>
        <span className="text-label-md font-bold text-on-surface text-center">
          {t.applePayBody}
        </span>
      </div>
    )}

    {paymentChoice === "cod" && (
      <div className="bg-surface-container-low p-lg border border-outline-variant rounded-xl flex items-center gap-md">
        <span
          className="material-symbols-outlined text-[36px] text-primary no-mirror"
          aria-hidden="true"
        >
          local_shipping
        </span>
        <div>
          <div className="font-bold text-label-md text-on-surface">
            {t.codLabel}
          </div>
          <div className="text-label-sm text-on-surface-variant">
            {t.codBody}
          </div>
        </div>
      </div>
    )}

    <button
      type="submit"
      aria-busy={isProcessing}
      disabled={isProcessing}
      className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md btn-tactile text-center flex items-center justify-center gap-sm active:scale-95 transition-transform mt-4 disabled:opacity-50"
    >
      {isProcessing ? (
        <>
          <span
            className="material-symbols-outlined animate-spin text-[20px]"
            aria-hidden="true"
          >
            progress_activity
          </span>
          {t.processing}
        </>
      ) : (
        t.secureCheckoutAed(total)
      )}
    </button>

    <button
      type="button"
      onClick={onBack}
      className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider self-center active:scale-95 transition-transform"
    >
      {isAr ? "← العودة للعنوان" : "← Back to address"}
    </button>
  </form>
);

export const PaymentOptionTile: React.FC<{
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  isAr: boolean;
  disabled?: boolean;
}> = ({ label, icon, active, onClick, isAr, disabled = false }) => (
  <button
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    disabled={disabled}
    className={`border-2 py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all ${
      active
        ? "border-primary bg-primary/5 text-primary"
        : "border-outline-variant text-outline"
    } ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
  >
    <span
      className="material-symbols-outlined text-[26px] no-mirror"
      aria-hidden="true"
    >
      {icon}
    </span>
    <span className="text-label-sm font-bold">{label}</span>
    {isAr && <span className="sr-only">{label}</span>}
  </button>
);
