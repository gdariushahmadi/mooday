/**
 * Premium brand list and helpers.
 *
 * Listings for these brands are required to be `authenticityTier:
 * "verified"` before they can be published. Other brands may list
 * with `"self_declared"`. The list is exported as the single source
 * of truth and used by:
 *
 * - the sell/edit form (gates publish on the verified tier)
 * - the brand chip row on Discover and Search
 * - the trust surface (badge copy on product details)
 * - the seed-attributes backfill (defaults premium brands to verified)
 *
 * Adding/removing a brand requires a code change until the admin
 * tooling (deferred) lands.
 */

export const PREMIUM_BRANDS: ReadonlyArray<string> = [
  "Chanel",
  "Dior",
  "Hermes",
  "Louis Vuitton",
  "Celine",
  "Gucci",
  "Bottega Veneta",
  "Prada",
  "Loewe",
  "Chloe",
] as const;

export const PREMIUM_BRANDS_AR: ReadonlyArray<string> = [
  "شانيل",
  "ديور",
  "هيرميس",
  "لويس فويتون",
  "سيلين",
  "غوتشي",
  "بوتيغا فينيتا",
  "برادا",
  "لوي",
  "كلوي",
] as const;

function normalise(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Returns true when the brand name (case-insensitive, whitespace-
 * insensitive) is in the premium list. Used to gate publish and to
 * pick the default authenticity tier.
 */
export function isPremiumBrand(name: string): boolean {
  const needle = normalise(name);
  return PREMIUM_BRANDS.some((b) => normalise(b) === needle);
}

/**
 * Returns the Arabic label for a premium brand, or the input
 * unchanged when the brand is not in the list.
 */
export function brandArFor(brandEn: string): string | undefined {
  const idx = PREMIUM_BRANDS.findIndex(
    (b) => normalise(b) === normalise(brandEn),
  );
  return idx >= 0 ? PREMIUM_BRANDS_AR[idx] : undefined;
}
