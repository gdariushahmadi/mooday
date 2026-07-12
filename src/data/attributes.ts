/**
 * Size and colour dictionaries used by the Sell form, the Search
 * filters, and the seed-data post-processor that backfills these
 * fields onto existing listings.
 */

export const SIZES = ["XS", "S", "M", "L", "XL", "OS"] as const;
export type Size = (typeof SIZES)[number];

export const SIZES_AR: Record<Size, string> = {
  XS: "XS",
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  OS: "مقاس واحد",
};

export interface ColourOption {
  /** Internal key — matches `colorEn` on products. */
  key: string;
  en: string;
  ar: string;
  /** CSS colour for the swatch dot. */
  hex: string;
}

export const COLOURS: readonly ColourOption[] = [
  { key: "Black", en: "Black", ar: "أسود", hex: "#1b1c1b" },
  { key: "White", en: "White", ar: "أبيض", hex: "#f5f3f1" },
  { key: "Beige", en: "Beige", ar: "بيج", hex: "#d8c4b0" },
  { key: "Tan", en: "Tan", ar: "بني فاتح", hex: "#b08c6a" },
  { key: "Brown", en: "Brown", ar: "بني", hex: "#6b4a2f" },
  { key: "Navy", en: "Navy", ar: "كحلي", hex: "#1e2a44" },
  { key: "Red", en: "Red", ar: "أحمر", hex: "#a02020" },
  { key: "Pink", en: "Pink", ar: "وردي", hex: "#e8a4b8" },
  { key: "Gold", en: "Gold", ar: "ذهبي", hex: "#c9a44a" },
  { key: "Green", en: "Green", ar: "أخضر", hex: "#2f6b4a" },
  { key: "Blue", en: "Blue", ar: "أزرق", hex: "#3a5a8a" },
  { key: "Silver", en: "Silver", ar: "فضي", hex: "#b8b8c0" },
] as const;

/** Resolve a `colorEn` string to a colour option, if it exists. */
export function findColour(key: string | undefined): ColourOption | undefined {
  if (!key) return undefined;
  return COLOURS.find((c) => c.key.toLowerCase() === key.toLowerCase());
}
