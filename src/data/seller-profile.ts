import { SELLERS, SELLER_META, type SellerProfile, type SellerMeta } from "./sellers";

/**
 * The full public-facing seller profile: basic info + metadata.
 * Use this type for the public profile (B-11) and anywhere a seller
 * needs to be displayed with their bio, stats, and style tags.
 */
export type FullSellerProfile = SellerProfile & SellerMeta;

/**
 * Returns the full public profile for a seller key (e.g. "sarah").
 * Returns null for unknown ids so callers can render a 404 state.
 */
export function getSellerProfile(key: string): FullSellerProfile | null {
  const base = SELLERS[key];
  const meta = SELLER_META[key];
  if (!base || !meta) return null;
  return { ...base, ...meta };
}
