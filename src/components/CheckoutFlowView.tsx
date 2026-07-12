"use client";

import React, { useState, useMemo } from "react";
import { useApp, type Product, type CartItem } from "@/context/AppContext";
import { formatAEDLabel } from "@/lib/format";
import type { Address } from "@/data/addresses";
import type { PaymentMethod } from "@/data/paymentMethods";

interface CheckoutFlowViewProps {
  /** Direct-checkout product, or null when checking out the bag. */
  checkoutProduct?: Product | null;
  onBack: () => void;
  onSuccess: () => void;
}

// ---------- Bilingual copy ----------

interface CheckoutCopy {
  pageTitle: string;
  stepAddress: string;
  stepPayment: string;
  savedAddresses: string;
  useDifferent: string;
  newAddressTitle: string;
  addNewAddress: string;
  fullName: string;
  fullNamePh: string;
  phone: string;
  phonePh: string;
  city: string;
  street: string;
  streetPh: string;
  districtLabel: string;
  districtPh: string;
  notesLabel: string;
  notesPh: string;
  proceedToPayment: string;
  errorRequired: string;
  savedCards: string;
  addNewCard: string;
  newCardTitle: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  applePayLabel: string;
  applePayBody: string;
  codLabel: string;
  codBody: string;
  secureCheckoutAed: (n: number) => string;
  processing: string;
  orderReview: string;
  qty: (n: number) => string;
  subtotal: string;
  shipping: string;
  shippingFree: string;
  total: string;
  defaultBadge: string;
  backToHome: string;
  orderPlaced: string;
  escrowBody: string;
}

const COPY: Record<"en" | "ar", CheckoutCopy> = {
  en: {
    pageTitle: "Checkout",
    stepAddress: "Shipping",
    stepPayment: "Payment",
    savedAddresses: "Saved addresses",
    useDifferent: "Use a different address",
    newAddressTitle: "New delivery address",
    addNewAddress: "+ Add a new address",
    fullName: "Full name",
    fullNamePh: "Enter your full name",
    phone: "Phone number",
    phonePh: "+971 5X XXX XXXX",
    city: "City",
    street: "Street, building, apartment",
    streetPh: "e.g. Villa 24, Al Wasl Road",
    districtLabel: "District / area",
    districtPh: "e.g. Jumeirah",
    notesLabel: "Delivery notes (optional)",
    notesPh: "Landmark, gate, etc.",
    proceedToPayment: "Continue to payment",
    errorRequired: "Please complete the required fields.",
    savedCards: "Saved cards",
    addNewCard: "+ Add a new card",
    newCardTitle: "New card",
    cardNumber: "Card number",
    cardHolder: "Cardholder name",
    expiry: "Expiry",
    cvv: "CVV",
    applePayLabel: "Apple Pay",
    applePayBody: "One-tap payment via Apple Pay.",
    codLabel: "Cash on Delivery",
    codBody: "Pay in cash when your order arrives.",
    secureCheckoutAed: (n) => `Secure checkout (AED ${n})`,
    processing: "Securing escrow payment...",
    orderReview: "Order review",
    qty: (n) => `Qty: ${n}`,
    subtotal: "Subtotal",
    shipping: "Shipping (Mooday Express)",
    shippingFree: "FREE",
    total: "Total",
    defaultBadge: "Default",
    backToHome: "Back to home",
    orderPlaced: "Order placed",
    escrowBody:
      "Your payment has been secured in Mooday's Escrow vault. Funds will only be released to the seller after you receive the item and confirm it matches the description.",
  },
  ar: {
    pageTitle: "إتمام الشراء",
    stepAddress: "العنوان",
    stepPayment: "الدفع",
    savedAddresses: "العناوين المحفوظة",
    useDifferent: "استخدام عنوان آخر",
    newAddressTitle: "عنوان جديد",
    addNewAddress: "+ إضافة عنوان",
    fullName: "الاسم الكامل",
    fullNamePh: "ادخل اسمك",
    phone: "رقم الهاتف",
    phonePh: "+971 5X XXX XXXX",
    city: "الإمارة",
    street: "الشارع، المبنى، الشقة",
    streetPh: "مثال: فيلا 24، شارع الوصل",
    districtLabel: "المنطقة",
    districtPh: "مثال: جميرا",
    notesLabel: "ملاحظات التوصيل (اختياري)",
    notesPh: "معلم قريب، البوابة...",
    proceedToPayment: "الذهاب للدفع",
    errorRequired: "يرجى إكمال الحقول المطلوبة.",
    savedCards: "البطاقات المحفوظة",
    addNewCard: "+ إضافة بطاقة",
    newCardTitle: "بطاقة جديدة",
    cardNumber: "رقم البطاقة",
    cardHolder: "الاسم على البطاقة",
    expiry: "تاريخ الانتهاء",
    cvv: "CVV",
    applePayLabel: "Apple Pay",
    applePayBody: "الدفع بنقرة واحدة عبر Apple Pay.",
    codLabel: "الدفع عند الاستلام",
    codBody: "ادفع نقداً عند استلام طلبك.",
    secureCheckoutAed: (n) => `إتمام الدفع (AED ${n})`,
    processing: "جاري تأمين المبلغ...",
    orderReview: "مراجعة الطلب",
    qty: (n) => `الكمية: ${n}`,
    subtotal: "المجموع الفرعي",
    shipping: "الشحن (مودي إكسبرس)",
    shippingFree: "مجاني",
    total: "الإجمالي",
    defaultBadge: "افتراضي",
    backToHome: "العودة للرئيسية",
    orderPlaced: "تم تسجيل الطلب",
    escrowBody:
      "تم تأمين المبلغ في حساب مودي. لن يتم تسليم المبلغ للبائع إلا بعد استلامك للطلب وتأكيد مطابقته للوصف.",
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
const CITIES_AR = [
  "دبي",
  "أبوظبي",
  "الشارقة",
  "عجمان",
  "رأس الخيمة",
  "الفجيرة",
  "أم القيوين",
];

type PaymentChoice = "saved-card" | "new-card" | "apple" | "cod";

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
  const { language, cart, clearCart, addresses, paymentMethods } = useApp();
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
        alert(t.errorRequired);
        return;
      }
    } else if (!selectedAddressId) {
      alert(t.errorRequired);
      return;
    }
    setStep(2);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentChoice === "new-card") {
      const digits = newCardNumber.replace(/\s/g, "");
      if (
        digits.length < 15 ||
        !/^\d{2}\/\d{2}$/.test(newExpiry) ||
        newCvv.length < 3 ||
        !newCardHolder
      ) {
        alert(t.errorRequired);
        return;
      }
    }
    if (paymentChoice === "saved-card" && !selectedCardId) {
      alert(t.errorRequired);
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
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

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
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

// ---------- Sub-components ----------

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

const CheckoutAddressStep: React.FC<AddressStepProps> = ({
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

const CheckoutPaymentStep: React.FC<PaymentStepProps> = ({
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
      />
    </div>

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

const PaymentOptionTile: React.FC<{
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  isAr: boolean;
}> = ({ label, icon, active, onClick, isAr }) => (
  <button
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    className={`border-2 py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all ${
      active
        ? "border-primary bg-primary/5 text-primary"
        : "border-outline-variant text-outline"
    }`}
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

const CheckoutOrderReview: React.FC<{
  t: CheckoutCopy;
  isAr: boolean;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}> = ({ t, isAr, items, subtotal, shipping, total }) => (
  <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex flex-col gap-md font-sans">
    <h3 className="font-serif text-headline-sm text-on-surface border-b border-surface-container-high pb-2">
      {t.orderReview}
    </h3>
    <div className="flex flex-col gap-sm max-h-[300px] overflow-y-auto no-scrollbar">
      {items.map((item) => (
        <div
          key={item.product.id}
          className="flex gap-sm border-b border-surface-container-high pb-sm last:border-b-0 last:pb-0"
        >
          <img
            alt={isAr ? item.product.titleAr : item.product.titleEn}
            src={item.product.image}
            className="w-12 h-12 rounded object-cover border border-outline-variant flex-shrink-0"
          />
          <div className="flex-grow">
            <h5 className="font-serif text-label-sm text-on-surface line-clamp-1">
              {isAr ? item.product.titleAr : item.product.titleEn}
            </h5>
            <span className="text-[11px] text-outline">
              {t.qty(item.quantity)}
            </span>
          </div>
          <span className="text-label-sm font-bold text-primary self-center">
            {formatAEDLabel(item.product.price * item.quantity)}
          </span>
        </div>
      ))}
    </div>
    <hr className="border-surface-container-high" />
    <div className="flex flex-col gap-xs text-[13px] text-on-surface-variant">
      <div className="flex justify-between">
        <span>{t.subtotal}:</span>
        <span>{formatAEDLabel(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>{t.shipping}:</span>
        <span>
          {shipping === 0 ? t.shippingFree : formatAEDLabel(shipping)}
        </span>
      </div>
    </div>
    <hr className="border-surface-container-high" />
    <div className="flex justify-between text-label-md font-bold text-primary">
      <span>{t.total}:</span>
      <span>{formatAEDLabel(total)}</span>
    </div>
  </div>
);

const CheckoutConfirmation: React.FC<{
  total: number;
  isAr: boolean;
  onHome: () => void;
  t: CheckoutCopy;
}> = ({ total, isAr, onHome, t }) => (
  <div className="w-full max-w-[600px] mx-auto bg-surface-container-lowest border border-surface-container-high rounded-xl p-xl flex flex-col items-center text-center gap-lg my-10 shadow-lg">
    <span
      className="material-symbols-outlined text-[72px] text-primary animate-bounce"
      aria-hidden="true"
    >
      check_circle
    </span>
    <div>
      <h2 className="font-serif text-headline-md text-primary mb-2">
        {t.orderPlaced}
      </h2>
      <p className="text-body-lg text-on-surface-variant font-sans">
        {t.escrowBody}
      </p>
    </div>
    <div className="w-full bg-surface-container-low p-lg rounded-xl flex flex-col gap-md text-left font-sans">
      <h4 className="text-label-md uppercase tracking-wider text-primary font-bold">
        {isAr ? "تتبع الشحنة (مودي إكسبرس)" : "Order Tracking (Mooday Express)"}
      </h4>
      <div className="flex flex-col gap-4 mt-2">
        <TimelineRow
          isAr={isAr}
          done
          titleEn="Payment secured & escrow activated"
          titleAr="تم الدفع وتفعيل الضمان"
          subtitleEn="Just now"
          subtitleAr="الآن"
        />
        <TimelineRow
          isAr={isAr}
          done={false}
          num={2}
          titleEn="Awaiting seller pickup"
          titleAr="بانتظار استلام البائع"
          subtitleEn="Estimated within 24 hours"
          subtitleAr="خلال 24 ساعة"
        />
        <TimelineRow
          isAr={isAr}
          done={false}
          num={3}
          titleEn="In-Transit via Aramex"
          titleAr="في الطريق عبر أرامكس"
          subtitleEn="Estimated 2-3 business days"
          subtitleAr="2-3 أيام عمل"
        />
      </div>
    </div>
    <button
      onClick={onHome}
      className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform"
    >
      {t.backToHome}
    </button>
  </div>
);

const TimelineRow: React.FC<{
  isAr: boolean;
  done?: boolean;
  num?: number;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
}> = ({ isAr, done, num, titleEn, titleAr, subtitleEn, subtitleAr }) => {
  return (
    <div className="flex gap-md items-start">
      <div className="flex flex-col items-center">
        {done ? (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[12px]">
            ✓
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-outline text-[12px]">
            {num}
          </div>
        )}
        <div
          className={`w-[2px] h-10 ${
            done ? "bg-primary/20" : "bg-surface-container-high"
          }`}
        />
      </div>
      <div>
        <p
          className={`text-label-md font-bold ${
            done ? "text-on-surface" : "text-on-surface-variant"
          }`}
        >
          {isAr ? titleAr : titleEn}
        </p>
        <p className="text-label-sm text-on-surface-variant">
          {isAr ? subtitleAr : subtitleEn}
        </p>
      </div>
    </div>
  );
};
