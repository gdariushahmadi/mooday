"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp, type CartItem, type Product } from "@/context/AppContext";
import { formatAEDLabel } from "@/lib/format";
import { PHONE_PLACEHOLDER } from "@/lib/constants";
import { AppImage } from "@/components/AppImage";
import type { Address } from "@/data/addresses";

interface CheckoutFlowViewProps {
  /** Direct-checkout product, or null when checking out the bag. */
  checkoutProduct?: Product | null;
  onBack: () => void;
  onSuccess: () => void;
}

interface CheckoutCopy {
  pageTitle: string;
  stepAddress: string;
  stepDemo: string;
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
  continueToDemo: string;
  errorRequired: string;
  saveError: string;
  demoTitle: string;
  demoNotice: string;
  demoNoCharge: string;
  placeDemoOrder: string;
  savingDemo: string;
  orderReview: string;
  subtotal: string;
  shipping: string;
  shippingFree: string;
  total: string;
  defaultBadge: string;
  backToHome: string;
  orderPlaced: string;
  demoOrderId: string;
  demoOrderBody: string;
  emptyTitle: string;
  emptyBody: string;
  emptyBack: string;
}

const COPY: Record<"en" | "ar", CheckoutCopy> = {
  en: {
    pageTitle: "Demo checkout",
    stepAddress: "Shipping",
    stepDemo: "Demo order",
    savedAddresses: "Saved addresses",
    useDifferent: "Use a different address",
    newAddressTitle: "New delivery address",
    addNewAddress: "+ Add a new address",
    fullName: "Full name",
    fullNamePh: "Enter your full name",
    phone: "Phone number",
    phonePh: PHONE_PLACEHOLDER,
    city: "City",
    street: "Street, building, apartment",
    streetPh: "e.g. Villa 24, Al Wasl Road",
    districtLabel: "District / area",
    districtPh: "e.g. Jumeirah",
    notesLabel: "Delivery notes (optional)",
    notesPh: "Landmark, gate, etc.",
    continueToDemo: "Continue to demo order",
    errorRequired: "Please complete the required fields.",
    saveError: "We could not save this demo order. Your bag is unchanged.",
    demoTitle: "Public demo order",
    demoNotice:
      "This is a demo order. No payment is taken, and no card or CVV data is requested or stored.",
    demoNoCharge: "Nothing will be charged.",
    placeDemoOrder: "Save demo order",
    savingDemo: "Saving demo order...",
    orderReview: "Order review",
    subtotal: "Subtotal",
    shipping: "Shipping",
    shippingFree: "FREE",
    total: "Demo total",
    defaultBadge: "Default",
    backToHome: "Back to home",
    orderPlaced: "Demo order saved",
    demoOrderId: "Demo order ID",
    demoOrderBody:
      "This receipt is stored only in this browser. It is not a real purchase, payment, shipment, escrow record, or seller payout.",
    emptyTitle: "Your bag is empty",
    emptyBody: "Add something you love before checking out.",
    emptyBack: "Back to shopping",
  },
  ar: {
    pageTitle: "إتمام الطلب التجريبي",
    stepAddress: "العنوان",
    stepDemo: "طلب تجريبي",
    savedAddresses: "العناوين المحفوظة",
    useDifferent: "استخدام عنوان آخر",
    newAddressTitle: "عنوان توصيل جديد",
    addNewAddress: "+ إضافة عنوان جديد",
    fullName: "الاسم الكامل",
    fullNamePh: "أدخل اسمك الكامل",
    phone: "رقم الهاتف",
    phonePh: PHONE_PLACEHOLDER,
    city: "الإمارة",
    street: "الشارع، المبنى، الشقة",
    streetPh: "مثال: فيلا 24، شارع الوصل",
    districtLabel: "المنطقة",
    districtPh: "مثال: جميرا",
    notesLabel: "ملاحظات التوصيل (اختياري)",
    notesPh: "معلم قريب، البوابة...",
    continueToDemo: "متابعة إلى الطلب التجريبي",
    errorRequired: "يرجى إكمال الحقول المطلوبة.",
    saveError: "تعذر حفظ الطلب التجريبي. لم يتم تغيير الحقيبة.",
    demoTitle: "طلب عام تجريبي",
    demoNotice:
      "هذا طلب تجريبي. لا يتم خصم أي مبلغ، ولا نطلب أو نحفظ بيانات البطاقة أو CVV.",
    demoNoCharge: "لن يتم خصم أي مبلغ.",
    placeDemoOrder: "حفظ الطلب التجريبي",
    savingDemo: "جارٍ حفظ الطلب التجريبي...",
    orderReview: "مراجعة الطلب",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن",
    shippingFree: "مجاني",
    total: "الإجمالي التجريبي",
    defaultBadge: "افتراضي",
    backToHome: "العودة للرئيسية",
    orderPlaced: "تم حفظ الطلب التجريبي",
    demoOrderId: "معرّف الطلب التجريبي",
    demoOrderBody:
      "تم حفظ هذا الإيصال في هذا المتصفح فقط. إنه ليس شراءً أو دفعاً أو شحناً أو ضماناً أو تحويل أرباح حقيقياً.",
    emptyTitle: "حقيبتك فارغة",
    emptyBody: "أضيفي شيئاً تحبينه قبل إتمام الطلب.",
    emptyBack: "العودة للتسوق",
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

export const CheckoutFlowView: React.FC<CheckoutFlowViewProps> = ({
  checkoutProduct,
  onBack,
  onSuccess,
}) => {
  const {
    language,
    cart,
    clearCart,
    addresses,
    addAddress,
    setDefaultAddress,
    recordDemoOrder,
  } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    () => addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? null,
  );
  const [selectedAddressOverride, setSelectedAddressOverride] =
    useState<Address | null>(null);
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [demoOrderId, setDemoOrderId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const initialAddressResolved = useRef(false);

  // Addresses arrive asynchronously in Supabase mode. Resolve the initial
  // saved/default address when that first list becomes available, while
  // preserving any address choice made by the user.
  useEffect(() => {
    if (addresses.length === 0 || selectedAddressOverride || initialAddressResolved.current) return;
    initialAddressResolved.current = true;
    if (selectedAddressId && addresses.some((address) => address.id === selectedAddressId)) {
      return;
    }
    const nextAddressId = addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? null;
    queueMicrotask(() => {
      setSelectedAddressId(nextAddressId);
      setShowNewAddressForm(false);
    });
  }, [addresses, selectedAddressId, selectedAddressOverride]);

  // The public beta has one listing per order and quantity is always one.
  const items: CartItem[] = checkoutProduct
    ? [{ product: checkoutProduct, quantity: 1 }]
    : cart.slice(0, 1).map((item) => ({ ...item, quantity: 1 }));
  const product = items[0]?.product ?? null;
  const subtotal = product?.price ?? 0;
  const shipping = subtotal > 1000 || subtotal === 0 ? 0 : 25;
  const total = subtotal + shipping;

  const draftAddress: Address = useMemo(
    () => ({
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
      isDefault: useNewAsDefault,
    }),
    [newCity, newDistrict, newFullName, newNotes, newPhone, newStreet, useNewAsDefault],
  );

  const selectedAddress = useMemo(() => {
    if (selectedAddressOverride) return selectedAddressOverride;
    if (selectedAddressId) {
      return addresses.find((address) => address.id === selectedAddressId) ?? null;
    }
    return showNewAddressForm ? draftAddress : null;
  }, [addresses, draftAddress, selectedAddressId, selectedAddressOverride, showNewAddressForm]);

  const handleAddressSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (showNewAddressForm) {
      if (!newFullName.trim() || !newPhone.trim() || !newStreet.trim()) {
        setFormError(t.errorRequired);
        return;
      }
      try {
        const addressInput = Object.fromEntries(
          Object.entries(draftAddress).filter(([key]) => key !== "id"),
        ) as Omit<Address, "id">;
        const created = await addAddress(addressInput);
        const saved = created && "id" in created ? created : draftAddress;
        if (useNewAsDefault && saved.id !== "__new__") {
          await setDefaultAddress(saved.id);
        }
        setSelectedAddressOverride(saved);
        setSelectedAddressId(saved.id);
        setShowNewAddressForm(false);
      } catch {
        setFormError(t.saveError);
        return;
      }
    } else if (!selectedAddressId || !selectedAddress) {
      setFormError(t.errorRequired);
      return;
    }
    setFormError("");
    setStep(2);
  };

  const handleDemoSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product || !selectedAddress || !recordDemoOrder) {
      setFormError(t.errorRequired);
      return;
    }
    setFormError("");
    setIsProcessing(true);
    try {
      const id = await recordDemoOrder({
        product,
        address: selectedAddress,
        subtotal,
        shipping,
        total,
      });
      if (!checkoutProduct) await clearCart();
      setDemoOrderId(id);
      setIsDone(true);
    } catch {
      setFormError(t.saveError);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isDone) {
    return <CheckoutConfirmation demoOrderId={demoOrderId} total={total} isAr={isAr} onHome={onSuccess} t={t} />;
  }

  if (items.length === 0) {
    return (
      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10">
        <CheckoutHeader isAr={isAr} onBack={onBack} step={1} t={t} />
        <div data-testid="checkout-empty" className="flex flex-col items-center justify-center gap-md py-16 text-center px-md">
          <span className="material-symbols-outlined text-[64px] text-outline no-mirror" aria-hidden="true">shopping_bag</span>
          <h2 className="font-serif text-headline-sm text-on-surface">{t.emptyTitle}</h2>
          <p className="text-body-md text-on-surface-variant max-w-sm">{t.emptyBody}</p>
          <button type="button" onClick={onBack} className="btn-primary mt-sm px-lg py-3 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-lg btn-tactile">{t.emptyBack}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10">
      <CheckoutHeader isAr={isAr} onBack={() => (step === 2 ? setStep(1) : onBack())} step={step} t={t} />
      {formError && <p role="alert" className="rounded-lg bg-error-container px-md py-sm text-label-sm font-bold text-on-error-container">{formError}</p>}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg mt-md">
        <div className="md:col-span-7 bg-surface-container-lowest border border-surface-container-high rounded-xl p-lg shadow-sm">
          {step === 1 ? (
            <CheckoutAddressStep
              t={t}
              isAr={isAr}
              addresses={addresses}
              selectedId={selectedAddressId}
              onSelect={(id) => {
                setSelectedAddressOverride(null);
                setSelectedAddressId(id);
                setShowNewAddressForm(false);
              }}
              showNewForm={showNewAddressForm}
              onShowNewForm={() => {
                setSelectedAddressOverride(null);
                setShowNewAddressForm(true);
                setSelectedAddressId(null);
              }}
              onUseSaved={() => {
                setSelectedAddressOverride(null);
                setShowNewAddressForm(false);
                if (!selectedAddressId && addresses[0]) setSelectedAddressId(addresses[0].id);
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
            <CheckoutDemoStep t={t} isAr={isAr} total={total} isProcessing={isProcessing} onSubmit={handleDemoSubmit} onBack={() => setStep(1)} />
          )}
        </div>
        <div className="md:col-span-5 flex flex-col gap-md">
          <CheckoutOrderReview t={t} isAr={isAr} items={items} subtotal={subtotal} shipping={shipping} total={total} />
          {selectedAddress && step === 2 && <AddressSummary address={selectedAddress} isAr={isAr} />}
        </div>
      </div>
    </div>
  );
};

const CheckoutHeader: React.FC<{ isAr: boolean; onBack: () => void; step: 1 | 2; t: CheckoutCopy }> = ({ isAr, onBack, step, t }) => (
  <>
    <div className="app-page-header flex items-center justify-between border-b border-outline-variant pb-4">
      <button type="button" onClick={onBack} aria-label={isAr ? "رجوع" : "Back"} className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95">
        <span className="material-symbols-outlined no-mirror" aria-hidden="true">arrow_back</span>
      </button>
      <h1 className="font-serif text-headline-sm text-primary tracking-widest uppercase flex-grow text-center">{t.pageTitle}</h1>
      <div className="w-10" aria-hidden="true" />
    </div>
    <div className="flex items-center justify-center gap-gutter my-2 font-sans" aria-label={isAr ? "خطوات الطلب" : "Order steps"}>
      <StepPill number={1} active={step >= 1} label={t.stepAddress} />
      <div className="w-12 h-[2px] bg-outline-variant" />
      <StepPill number={2} active={step === 2} label={t.stepDemo} />
    </div>
  </>
);

const StepPill: React.FC<{ number: number; active: boolean; label: string }> = ({ number, active, label }) => (
  <div className="flex items-center gap-sm">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-sm font-bold ${active ? "bg-primary text-on-primary" : "bg-surface-container-high text-outline"}`}>{number}</div>
    <span className={`text-label-sm uppercase tracking-wider ${active ? "text-primary font-bold" : "text-outline"}`}>{label}</span>
  </div>
);

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
  setNewFullName: (value: string) => void;
  newPhone: string;
  setNewPhone: (value: string) => void;
  newCity: string;
  setNewCity: (value: string) => void;
  newDistrict: string;
  setNewDistrict: (value: string) => void;
  newStreet: string;
  setNewStreet: (value: string) => void;
  newNotes: string;
  setNewNotes: (value: string) => void;
  useNewAsDefault: boolean;
  setUseNewAsDefault: (value: boolean) => void;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
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
}) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-md font-sans">
    <h2 className="font-serif text-headline-sm text-on-surface mb-2 border-b border-surface-container-high pb-2">{t.savedAddresses}</h2>
    {!showNewForm && addresses.map((address) => {
      const checked = selectedId === address.id;
      return (
        <label key={address.id} className={`block border-2 rounded-xl p-md cursor-pointer transition-all ${checked ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/40"}`}>
          <div className="flex items-start gap-md">
            <input type="radio" name="address" className="mt-1 accent-primary" checked={checked} onChange={() => onSelect(address.id)} aria-label={`${address.labelEn} — ${address.streetEn}`} />
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <span className="font-bold text-label-md text-on-surface uppercase tracking-wider">{isAr ? address.labelAr : address.labelEn}</span>
                {address.isDefault && <span className="text-[10px] uppercase tracking-wider bg-primary text-on-primary px-2 py-0.5 rounded-full font-bold">{t.defaultBadge}</span>}
              </div>
              <div className="text-label-sm text-on-surface mt-1">{isAr ? address.fullNameAr : address.fullNameEn} · {address.phone}</div>
              <div className="text-label-sm text-on-surface-variant mt-0.5">
                {isAr ? address.streetAr : address.streetEn}
                {address.districtEn && <>{", "}{isAr ? address.districtAr : address.districtEn}</>}
                {" · "}{isAr ? address.cityAr : address.cityEn}
              </div>
            </div>
          </div>
        </label>
      );
    })}
    {!showNewForm ? (
      <div className="flex gap-sm flex-wrap">
        <button type="button" onClick={onShowNewForm} className="text-label-sm text-primary font-bold underline active:scale-95 transition-transform">{t.addNewAddress}</button>
        {selectedId && addresses.length > 1 && <button type="button" onClick={onUseSaved} className="text-label-sm text-on-surface-variant font-bold active:scale-95 transition-transform">{t.useDifferent}</button>}
      </div>
    ) : (
      <div className="flex flex-col gap-md border-t border-outline-variant pt-md">
        <h3 className="font-serif text-label-md text-primary uppercase tracking-wider font-bold">{t.newAddressTitle}</h3>
        <Field label={t.fullName} input={<input type="text" required placeholder={t.fullNamePh} value={newFullName} onChange={(event) => setNewFullName(event.target.value)} />} />
        <Field label={t.phone} input={<input type="tel" required placeholder={t.phonePh} value={newPhone} onChange={(event) => setNewPhone(event.target.value)} />} />
        <div className="grid grid-cols-2 gap-md">
          <Field label={t.city} input={<select value={newCity} onChange={(event) => setNewCity(event.target.value)}>{CITIES_EN.map((city, index) => <option key={city} value={city}>{isAr ? CITIES_AR[index] : city}</option>)}</select>} />
          <Field label={t.districtLabel} input={<input type="text" placeholder={t.districtPh} value={newDistrict} onChange={(event) => setNewDistrict(event.target.value)} />} />
        </div>
        <Field label={t.street} input={<textarea required rows={2} placeholder={t.streetPh} value={newStreet} onChange={(event) => setNewStreet(event.target.value)} />} />
        <Field label={t.notesLabel} input={<input type="text" placeholder={t.notesPh} value={newNotes} onChange={(event) => setNewNotes(event.target.value)} />} />
        <label className="flex items-center gap-sm cursor-pointer">
          <input type="checkbox" checked={useNewAsDefault} onChange={(event) => setUseNewAsDefault(event.target.checked)} className="accent-primary w-4 h-4" />
          <span className="text-label-sm text-on-surface-variant">{isAr ? "اجعل هذا العنوان افتراضياً" : "Make this my default"}</span>
        </label>
      </div>
    )}
    <button type="submit" className="btn-primary py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md btn-tactile text-center active:scale-95 transition-transform mt-4">{t.continueToDemo}</button>
  </form>
);

const Field: React.FC<{ label: string; input: React.ReactNode }> = ({ label, input }) => (
  <div className="flex flex-col gap-xs">
    <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{label}</label>
    {React.isValidElement(input) ? React.cloneElement(input as React.ReactElement<{ className?: string }>, { className: "p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" }) : input}
  </div>
);

const CheckoutDemoStep: React.FC<{ t: CheckoutCopy; isAr: boolean; total: number; isProcessing: boolean; onSubmit: (event: React.FormEvent) => void | Promise<void>; onBack: () => void }> = ({ t, isAr, total, isProcessing, onSubmit, onBack }) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-md font-sans">
    <h2 className="font-serif text-headline-sm text-on-surface mb-2 border-b border-surface-container-high pb-2">{t.demoTitle}</h2>
    <div className="bg-primary/5 border border-primary/20 p-md rounded-lg text-body-md text-on-primary-fixed-variant" role="note">
      <strong className="block text-label-md text-primary">{isAr ? "وضع تجريبي واضح" : "Clear demo mode"}</strong>
      <p className="text-[13px] mt-1 leading-normal">{t.demoNotice}</p>
      <p className="text-[13px] mt-2 font-bold">{t.demoNoCharge}</p>
    </div>
    <div className="rounded-xl bg-surface-container-low p-md text-label-sm text-on-surface-variant">{isAr ? "لن يتم طلب رقم بطاقة أو CVV." : "No card number or CVV is requested."}</div>
    <button type="submit" aria-busy={isProcessing} disabled={isProcessing} className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md btn-tactile flex items-center justify-center gap-sm mt-4 disabled:opacity-50">
      {isProcessing ? <><span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden="true">progress_activity</span>{t.savingDemo}</> : `${t.placeDemoOrder} · ${formatAEDLabel(total)}`}
    </button>
    <button type="button" onClick={onBack} className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider self-center active:scale-95 transition-transform">{isAr ? "← العودة للعنوان" : "← Back to address"}</button>
  </form>
);

const AddressSummary: React.FC<{ address: Address; isAr: boolean }> = ({ address, isAr }) => (
  <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md text-body-sm font-sans">
    <div className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">{isAr ? "التوصيل إلى" : "Delivering to"}</div>
    <div className="font-bold text-on-surface">{isAr ? address.fullNameAr : address.fullNameEn}</div>
    <div className="text-on-surface-variant text-label-sm">{isAr ? address.streetAr : address.streetEn}{(address.districtEn ?? address.districtAr) && <>{", "}{isAr ? address.districtAr : address.districtEn}</>}</div>
    <div className="text-on-surface-variant text-label-sm">{isAr ? address.cityAr : address.cityEn} · {address.phone}</div>
  </div>
);

const CheckoutOrderReview: React.FC<{ t: CheckoutCopy; isAr: boolean; items: CartItem[]; subtotal: number; shipping: number; total: number }> = ({ t, isAr, items, subtotal, shipping, total }) => (
  <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex flex-col gap-md font-sans">
    <h3 className="font-serif text-headline-sm text-on-surface border-b border-surface-container-high pb-2">{t.orderReview}</h3>
    <div className="flex flex-col gap-sm">
      {items.slice(0, 1).map((item) => (
        <div key={item.product.id} className="flex gap-sm border-b border-surface-container-high pb-sm">
          <div className="relative w-12 h-12 rounded overflow-hidden border border-outline-variant flex-shrink-0"><AppImage fill sizes="48px" alt={isAr ? item.product.titleAr : item.product.titleEn} src={item.product.image} className="object-cover" /></div>
          <div className="flex-grow"><h5 className="font-serif text-label-sm text-on-surface line-clamp-2">{isAr ? item.product.titleAr : item.product.titleEn}</h5><span className="text-[11px] text-on-surface-variant">{isAr ? "الكمية: ١" : "Quantity: 1"}</span></div>
          <span className="text-label-sm font-bold text-primary self-center">{formatAEDLabel(item.product.price)}</span>
        </div>
      ))}
    </div>
    <div className="flex flex-col gap-xs text-[13px] text-on-surface-variant">
      <div className="flex justify-between"><span>{t.subtotal}:</span><span>{formatAEDLabel(subtotal)}</span></div>
      <div className="flex justify-between"><span>{t.shipping}:</span><span>{shipping === 0 ? t.shippingFree : formatAEDLabel(shipping)}</span></div>
    </div>
    <div className="flex justify-between text-label-md font-bold text-primary"><span>{t.total}:</span><span>{formatAEDLabel(total)}</span></div>
  </div>
);

const CheckoutConfirmation: React.FC<{ demoOrderId: string | null; total: number; isAr: boolean; onHome: () => void; t: CheckoutCopy }> = ({ demoOrderId, total, isAr, onHome, t }) => (
  <div className="w-full max-w-[600px] mx-auto bg-surface-container-lowest border border-surface-container-high rounded-xl p-xl flex flex-col items-center text-center gap-lg my-10 shadow-lg">
    <span className="material-symbols-outlined text-[72px] text-primary" aria-hidden="true">check_circle</span>
    <div>
      <h2 className="font-serif text-headline-md text-primary mb-2">{t.orderPlaced}</h2>
      <p className="text-body-lg text-on-surface-variant font-sans">{t.demoOrderBody}</p>
    </div>
    <div className="w-full bg-surface-container-low p-lg rounded-xl flex flex-col gap-sm text-left font-sans" role="status">
      <div className="flex justify-between gap-md"><span className="text-label-sm text-on-surface-variant">{t.demoOrderId}</span><code className="text-label-sm font-bold text-primary break-all">{demoOrderId}</code></div>
      <div className="flex justify-between gap-md"><span className="text-label-sm text-on-surface-variant">{t.total}</span><span className="text-label-sm font-bold text-primary">{formatAEDLabel(total)}</span></div>
      <p className="text-label-sm text-on-surface-variant">{isAr ? "لا توجد عملية دفع أو شحن حقيقية." : "No real payment or shipment was created."}</p>
    </div>
    <button type="button" onClick={onHome} className="btn-primary w-full py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform">{t.backToHome}</button>
  </div>
);
