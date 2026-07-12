/**
 * Saved shipping addresses. Local-first mock data.
 *
 * In production these come from the user's profile on the server. For
 * Phase 1 we ship a seed of 3 addresses (Home, Work, Other) so the
 * Checkout (C-13) and Edit Addresses (G-35) screens have something real
 * to render without the user having to add one first.
 *
 * The `id` is stable so we can compare / persist / re-key. The
 * `isDefault` flag marks the address surfaced as the default in
 * checkout.
 */

export interface Address {
  id: string;
  /** "Home" | "Work" | "Other" — used as a quick-pick label. */
  labelEn: "Home" | "Work" | "Other";
  labelAr: "المنزل" | "العمل" | "أخرى";
  /** Recipient full name (matches the buyer's profile). */
  fullNameEn: string;
  fullNameAr: string;
  /** E.164-style phone, no real validation. */
  phone: string;
  /** City, e.g. "Dubai". */
  cityEn: string;
  cityAr: string;
  /** District / area, optional. */
  districtEn?: string;
  districtAr?: string;
  /** Street + building + apartment. */
  streetEn: string;
  streetAr: string;
  /** Optional delivery notes, e.g. "Behind the spinneys". */
  notesEn?: string;
  notesAr?: string;
  /** Whether to use as the default at checkout. */
  isDefault: boolean;
}

export const DEFAULT_ADDRESSES: Address[] = [
  {
    id: "addr-home",
    labelEn: "Home",
    labelAr: "المنزل",
    fullNameEn: "Layla Mansour",
    fullNameAr: "ليلى منصور",
    phone: "+971 50 123 4567",
    cityEn: "Dubai",
    cityAr: "دبي",
    districtEn: "Jumeirah",
    districtAr: "جميرا",
    streetEn: "Villa 24, Al Wasl Road",
    streetAr: "فيلا 24، شارع الوصل",
    notesEn: "Behind the Spinneys, gate 3.",
    notesAr: "خلف سبينيس، البوابة 3.",
    isDefault: true,
  },
  {
    id: "addr-work",
    labelEn: "Work",
    labelAr: "العمل",
    fullNameEn: "Layla Mansour",
    fullNameAr: "ليلى منصور",
    phone: "+971 4 555 1234",
    cityEn: "Dubai",
    cityAr: "دبي",
    districtEn: "DIFC",
    districtAr: "مركز دبي المالي العالمي",
    streetEn: "Gate Avenue, Level 9, Office 9B",
    streetAr: "جيت أفينيو، الطابق 9، مكتب 9B",
    notesEn: "Reception desk, please call on arrival.",
    notesAr: "الاستقبال، يرجى الاتصال عند الوصول.",
    isDefault: false,
  },
  {
    id: "addr-other",
    labelEn: "Other",
    labelAr: "أخرى",
    fullNameEn: "Layla Mansour",
    fullNameAr: "ليلى منصور",
    phone: "+971 50 123 4567",
    cityEn: "Abu Dhabi",
    cityAr: "أبوظبي",
    districtEn: "Saadiyat Island",
    districtAr: "جزيرة السعديات",
    streetEn: "Mamsha Al Saadiyat, Building 4, Apt 1201",
    streetAr: "ممشى السعديات، مبنى 4، شقة 1201",
    notesEn: undefined,
    notesAr: undefined,
    isDefault: false,
  },
];

/** Convenience helper: pick the default address (or the first one). */
export function pickDefaultAddress(addresses: Address[]): Address | null {
  if (addresses.length === 0) return null;
  return addresses.find((a) => a.isDefault) ?? addresses[0];
}
