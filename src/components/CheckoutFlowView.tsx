"use client";

import React, { useState, useMemo } from "react";
import { useApp, type Product, type CartItem } from "@/context/AppContext";
import { formatAEDLabel } from "@/lib/format";
import type { Address } from "@/data/addresses";
import type { PaymentMethod } from "@/data/paymentMethods";
import type { Order } from "@/data/orders";
import type { CheckoutCopy, PaymentChoice } from "./checkout/types";
import { COPY, CITIES_EN, CITIES_AR } from "./checkout/constants";
import { CheckoutAddressStep } from "./checkout/CheckoutAddressStep";
import { CheckoutPaymentStep } from "./checkout/CheckoutPaymentStep";
import { CheckoutOrderReview } from "./checkout/CheckoutOrderReview";
import { CheckoutConfirmation } from "./checkout/CheckoutConfirmation";

interface CheckoutFlowViewProps {
  /** Direct-checkout product, or null when checking out the bag. */
  checkoutProduct?: Product | null;
  onBack: () => void;
  onSuccess: () => void;
}


/**
 * Phase 1 in-app checkout. Local-first, no backend calls. The flow is
 * 1) Address → 2) Payment → 3) Confirmation, but all three steps live in
 * a single screen with internal state rather than three separate routes
 * (per the established pattern of single-shot flows). After Phase 3
 * lands, only the `handlePaymentSubmit` body changes.
 *
 * v0.2 additions over the original checkout:
 *   • Saved addresses — pick from Home/Work/Other or add a new one.
 *   • Saved cards — pick Visa/Mastercard or add a new one.
 *   • Cash on Delivery option.
 *   • Apple Pay one-tap option.
 *   • Bilingual copy via the established `COPY` const convention.
 */
export const CheckoutFlowView: React.FC<CheckoutFlowViewProps> = ({
  checkoutProduct,
  onBack,
  onSuccess,
}) => {
  const { language, cart, clearCart, addresses, paymentMethods, recordOrder } =
    useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [step, setStep] = useState<1 | 2>(1);
  // Address step
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    () => addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null,
  );
  const [showNewAddressForm, setShowNewAddressForm] = useState(
    () => addresses.length === 0,
  );
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("+971 ");
  const [newCity, setNewCity] = useState(CITIES_EN[0]);
  const [newDistrict, setNewDistrict] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [useNewAsDefault, setUseNewAsDefault] = useState(true);

  // Payment step
  const [paymentChoice, setPaymentChoice] =
    useState<PaymentChoice>("saved-card");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    () =>
      paymentMethods.find((m) => m.isDefault)?.id ??
      paymentMethods[0]?.id ??
      null,
  );
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardHolder, setNewCardHolder] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [newCvv, setNewCvv] = useState("");

  // Confirmation
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [formError, setFormError] = useState("");

  // Items + totals
  const items: CartItem[] = checkoutProduct
    ? [{ product: checkoutProduct, quantity: 1 }]
    : cart;
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 25;
  const total = subtotal + shipping;

  // Resolve the selected address (and its fields, for the payment step review).
  const selectedAddress: Address | null = useMemo(() => {
    if (selectedAddressId) {
      return addresses.find((a) => a.id === selectedAddressId) ?? null;
    }
    if (showNewAddressForm) {
      return {
        id: "__new__",
        labelEn: "Home",
        labelAr: "المنزل",
        fullNameEn: newFullName,
        fullNameAr: newFullName,
        phone: newPhone,
        cityEn: newCity,
        cityAr: CITIES_AR[CITIES_EN.indexOf(newCity)] ?? newCity,
        streetEn: newStreet,
        streetAr: newStreet,
        districtEn: newDistrict || undefined,
        districtAr: newDistrict || undefined,
        notesEn: newNotes || undefined,
        notesAr: newNotes || undefined,
        isDefault: false,
      };
    }
    return null;
  }, [
    selectedAddressId,
    showNewAddressForm,
    addresses,
    newFullName,
    newPhone,
    newCity,
    newStreet,
    newDistrict,
    newNotes,
  ]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showNewAddressForm) {
      if (!newFullName || !newPhone || !newStreet) {
        setFormError(t.errorRequired);
        return;
      }
    } else if (!selectedAddressId) {
      setFormError(t.errorRequired);
      return;
    }
    setFormError("");
    setStep(2);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (paymentChoice === "new-card") {
      const digits = newCardNumber.replace(/\s/g, "");
      if (
        digits.length < 15 ||
        !/^\d{2}\/\d{2}$/.test(newExpiry) ||
        newCvv.length < 3 ||
        !newCardHolder
      ) {
        setFormError(t.errorRequired);
        return;
      }
    }
    if (paymentChoice === "saved-card" && !selectedCardId) {
      setFormError(t.errorRequired);
      return;
    }
    if (paymentChoice === "cod" && total > 5000) {
      setFormError(t.codUnavailable);
      return;
    }
    setFormError("");
    setIsProcessing(true);
    setTimeout(() => {
      const addr = selectedAddress;
      let paymentBrandEn: Order["paymentBrandEn"] = "Visa";
      let paymentBrandAr: Order["paymentBrandAr"] = "فيزا";
      let paymentLast4 = "0000";

      if (paymentChoice === "apple") {
        paymentBrandEn = "Apple Pay";
        paymentBrandAr = "آبل باي";
        paymentLast4 = "APPL";
      } else if (paymentChoice === "cod") {
        paymentBrandEn = "Cash";
        paymentBrandAr = "نقداً";
        paymentLast4 = "COD";
      } else if (paymentChoice === "saved-card" && selectedCardId) {
        const card = paymentMethods.find((m) => m.id === selectedCardId);
        if (card) {
          paymentBrandEn = card.brandEn as Order["paymentBrandEn"];
          paymentBrandAr = card.brandAr as Order["paymentBrandAr"];
          paymentLast4 = card.last4;
        }
      } else if (paymentChoice === "new-card") {
        const digits = newCardNumber.replace(/\s/g, "");
        paymentLast4 = digits.slice(-4) || "0000";
        if (digits.startsWith("34") || digits.startsWith("37")) {
          paymentBrandEn = "Amex";
          paymentBrandAr = "أمريكان إكسبريس";
        } else if (digits.startsWith("5")) {
          paymentBrandEn = "Mastercard";
          paymentBrandAr = "ماستركارد";
        } else {
          paymentBrandEn = "Visa";
          paymentBrandAr = "فيزا";
        }
      }

      const now = new Date().toISOString();
      const order: Order = {
        id: `ord-${Date.now()}`,
        dateOrdered: now,
        status: "processing",
        lineItems: items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          priceAtPurchase: item.product.price,
        })),
        addressCityEn: addr?.cityEn ?? "",
        addressCityAr: addr?.cityAr ?? "",
        addressStreetEn: addr?.streetEn ?? "",
        addressStreetAr: addr?.streetAr ?? "",
        addressFullNameEn: addr?.fullNameEn,
        addressFullNameAr: addr?.fullNameAr,
        paymentBrandEn,
        paymentBrandAr,
        paymentLast4,
        subtotal,
        shipping,
        total,
        courier: {
          nameEn: "Aramex",
          nameAr: "أرامكس",
          trackingNumber: `ARMX-${String(Date.now()).slice(-7)}`,
        },
        timeline: [
          {
            status: "processing",
            date: now,
            descriptionEn: "Order placed, payment secured in Mooday escrow.",
            descriptionAr: "تم تسجيل الطلب وتأمين المبلغ في حساب مودي.",
          },
        ],
      };
      recordOrder(order);
      setIsProcessing(false);
      setIsDone(true);
      if (!checkoutProduct) {
        clearCart();
      }
    }, 2000);
  };

  if (isDone) {
    return (
      <CheckoutConfirmation
        total={total}
        isAr={isAr}
        onHome={onSuccess}
        t={t}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10">
        <div className="app-page-header flex items-center justify-between border-b border-outline-variant pb-4">
          <button
            type="button"
            onClick={onBack}
            aria-label={isAr ? "رجوع" : "Back"}
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
            {t.pageTitle}
          </h1>
          <div className="w-10" aria-hidden="true" />
        </div>
        <div
          data-testid="checkout-empty"
          className="flex flex-col items-center justify-center gap-md py-16 text-center px-md"
        >
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            shopping_bag
          </span>
          <h2 className="font-serif text-headline-sm text-on-surface">
            {t.emptyTitle}
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-sm">
            {t.emptyBody}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="btn-primary mt-sm px-lg py-3 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile active:scale-[0.98] transition-transform"
          >
            {t.emptyBack}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header */}
      <div className="app-page-header flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          onClick={() => (step === 2 ? setStep(1) : onBack())}
          aria-label={isAr ? "رجوع" : "Back"}
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
          {t.pageTitle}
        </h1>
        <div className="w-10" aria-hidden="true" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-gutter my-2 font-sans">
        <div className="flex items-center gap-sm">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-bold ${
              step >= 1
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-outline"
            }`}
          >
            1
          </div>
          <span
            className={`text-label-sm uppercase tracking-wider ${step >= 1 ? "text-primary font-bold" : "text-outline"}`}
          >
            {t.stepAddress}
          </span>
        </div>
        <div className="w-12 h-[2px] bg-outline-variant" />
        <div className="flex items-center gap-sm">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-bold ${
              step === 2
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-outline"
            }`}
          >
            2
          </div>
          <span
            className={`text-label-sm uppercase tracking-wider ${step === 2 ? "text-primary font-bold" : "text-outline"}`}
          >
            {t.stepPayment}
          </span>
        </div>
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-lg bg-error-container px-md py-sm text-label-sm font-bold text-on-error-container"
        >
          {formError}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg mt-md">
        <div className="md:col-span-7 bg-surface-container-lowest border border-surface-container-high rounded-xl p-lg shadow-sm">
          {step === 1 ? (
            <CheckoutAddressStep
              t={t}
              isAr={isAr}
              addresses={addresses}
              selectedId={selectedAddressId}
              onSelect={(id) => {
                setSelectedAddressId(id);
                setShowNewAddressForm(false);
              }}
              showNewForm={showNewAddressForm}
              onShowNewForm={() => {
                setShowNewAddressForm(true);
                setSelectedAddressId(null);
              }}
              onUseSaved={() => {
                setShowNewAddressForm(false);
                if (!selectedAddressId && addresses[0]) {
                  setSelectedAddressId(addresses[0].id);
                }
              }}
              newFullName={newFullName}
              setNewFullName={setNewFullName}
              newPhone={newPhone}
              setNewPhone={setNewPhone}
              newCity={newCity}
              setNewCity={setNewCity}
              newDistrict={newDistrict}
              setNewDistrict={setNewDistrict}
              newStreet={newStreet}
              setNewStreet={setNewStreet}
              newNotes={newNotes}
              setNewNotes={setNewNotes}
              useNewAsDefault={useNewAsDefault}
              setUseNewAsDefault={setUseNewAsDefault}
              onSubmit={handleAddressSubmit}
            />
          ) : (
            <CheckoutPaymentStep
              t={t}
              isAr={isAr}
              paymentMethods={paymentMethods}
              selectedCardId={selectedCardId}
              onSelectCard={setSelectedCardId}
              paymentChoice={paymentChoice}
              onSelectChoice={setPaymentChoice}
              newCardNumber={newCardNumber}
              setNewCardNumber={setNewCardNumber}
              newCardHolder={newCardHolder}
              setNewCardHolder={setNewCardHolder}
              newExpiry={newExpiry}
              setNewExpiry={setNewExpiry}
              newCvv={newCvv}
              setNewCvv={setNewCvv}
              isProcessing={isProcessing}
              total={total}
              onSubmit={handlePaymentSubmit}
              onBack={() => setStep(1)}
            />
          )}
        </div>

        {/* Order review */}
        <div className="md:col-span-5 flex flex-col gap-md">
          <CheckoutOrderReview
            t={t}
            isAr={isAr}
            items={items}
            subtotal={subtotal}
            shipping={shipping}
            total={total}
          />
          {selectedAddress && step === 2 && (
            <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md text-body-sm font-sans">
              <div className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">
                {isAr ? "التوصيل إلى" : "Delivering to"}
              </div>
              <div className="font-bold text-on-surface">
                {isAr ? selectedAddress.fullNameAr : selectedAddress.fullNameEn}
              </div>
              <div className="text-on-surface-variant text-label-sm">
                {isAr ? selectedAddress.streetAr : selectedAddress.streetEn}
                {(selectedAddress.districtEn ?? selectedAddress.districtAr) && (
                  <>
                    {", "}
                    {isAr
                      ? selectedAddress.districtAr
                      : selectedAddress.districtEn}
                  </>
                )}
              </div>
              <div className="text-on-surface-variant text-label-sm">
                {isAr ? selectedAddress.cityAr : selectedAddress.cityEn} {" · "}{" "}
                {selectedAddress.phone}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

