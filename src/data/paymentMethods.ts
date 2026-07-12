/**
 * Saved payment methods. Local-first mock data.
 *
 * In production these come from the user's profile on the server and
 * tokenised through a PSP. For Phase 1 we ship 2 cards (Visa + Mastercard)
 * with last-4 + brand + expiry — no real PAN ever lives here.
 *
 * The `id` is stable. `isDefault` flags the card surfaced at checkout.
 */

export interface PaymentMethod {
  id: string;
  /** Display name, e.g. "Personal Visa". */
  labelEn: string;
  labelAr: string;
  /** Brand as it appears in the UI: Visa, Mastercard, Amex, Apple Pay, etc. */
  brandEn: "Visa" | "Mastercard" | "Amex" | "Apple Pay";
  brandAr: "فيزا" | "ماستركارد" | "أمريكان إكسبريس" | "آبل باي";
  /** Last 4 digits of the PAN (the only PAN fragment we store). */
  last4: string;
  /** Cardholder name. */
  holderEn: string;
  holderAr: string;
  /** MM/YY */
  expiry: string;
  /** Whether this is the default at checkout. */
  isDefault: boolean;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm-visa-priv",
    labelEn: "Personal Visa",
    labelAr: "فيزا شخصية",
    brandEn: "Visa",
    brandAr: "فيزا",
    last4: "4242",
    holderEn: "Layla Mansour",
    holderAr: "ليلى منصور",
    expiry: "11/27",
    isDefault: true,
  },
  {
    id: "pm-mc-biz",
    labelEn: "Mastercard",
    labelAr: "ماستركارد",
    brandEn: "Mastercard",
    brandAr: "ماستركارد",
    last4: "1881",
    holderEn: "Layla Mansour",
    holderAr: "ليلى منصور",
    expiry: "04/26",
    isDefault: false,
  },
];

/** Convenience: pick the default (or the first) card. */
export function pickDefaultPaymentMethod(
  methods: PaymentMethod[],
): PaymentMethod | null {
  if (methods.length === 0) return null;
  return methods.find((m) => m.isDefault) ?? methods[0];
}
