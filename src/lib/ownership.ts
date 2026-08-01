import type { Product } from "@/context/AppContext";

/**
 * Whether a listing belongs to the signed-in user.
 *
 * - Remote / Phase 3 listings set `sellerId` (auth user uuid) — match that.
 * - Phase 1 mock listings leave `sellerId` unset and use the `custom-`
 *   id prefix for items the current user created in-session.
 */
export function isOwnListing(
  product: Product,
  currentUserId: string | null | undefined,
): boolean {
  if (product.sellerId) {
    return Boolean(currentUserId) && product.sellerId === currentUserId;
  }
  return product.id.startsWith("custom-");
}
