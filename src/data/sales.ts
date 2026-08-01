/**
 * Mock "sales" data — seller-side of an order. Local-first.
 *
 * For Phase 1 every sale is paired with an Order from `src/data/orders.ts`,
 * with the seller being the entity that fulfils it. Payouts are pre-baked
 * across three states:
 *
 *  - `pending`     — money is in escrow, not yet released
 *  - `available`   — buyer received the item; funds are releasable
 *  - `paid_out`    — payout has been issued to the seller's bank
 *
 * Each sale also has a shipment status that mirrors the order:
 *  - `awaiting_pickup` → `in_transit` → `delivered`.
 *
 * Phase 3 will replace these seeds with real per-seller queries.
 */

import type { Order } from "./orders";
import type { Product } from "@/context/AppContext";
import { isOwnListing } from "@/lib/ownership";

export type ShipmentStatus = "awaiting_pickup" | "in_transit" | "delivered";
export type PayoutStatus = "pending" | "available" | "paid_out";

export const SHIPMENT_STATUSES: readonly ShipmentStatus[] = [
  "awaiting_pickup",
  "in_transit",
  "delivered",
] as const;

export const PAYOUT_STATUSES: readonly PayoutStatus[] = [
  "pending",
  "available",
  "paid_out",
] as const;

/** Per-status localisation. */
export const SHIPMENT_LABEL_EN: Record<ShipmentStatus, string> = {
  awaiting_pickup: "Awaiting pickup",
  in_transit: "In transit",
  delivered: "Delivered",
};

export const SHIPMENT_LABEL_AR: Record<ShipmentStatus, string> = {
  awaiting_pickup: "بانتظار الاستلام",
  in_transit: "في الطريق",
  delivered: "تم التسليم",
};

export const PAYOUT_LABEL_EN: Record<PayoutStatus, string> = {
  pending: "Pending",
  available: "Available",
  paid_out: "Paid out",
};

export const PAYOUT_LABEL_AR: Record<PayoutStatus, string> = {
  pending: "قيد الانتظار",
  available: "متاح",
  paid_out: "تم التحويل",
};

export interface Sale {
  /** id === related Order.id (1:1). */
  id: string;
  /** Buyer display name (snapshot). */
  buyerNameEn: string;
  buyerNameAr: string;
  /** The buyer’s masked payment last-4 (for the payouts summary). */
  buyerPaymentLast4: string;
  buyerPaymentBrandEn: "Visa" | "Mastercard" | "Amex" | "Apple Pay" | "Cash";
  buyerPaymentBrandAr: "فيزا" | "ماستركارد" | "أمريكان إكسبريس" | "آبل باي" | "نقداً";
  /** Snapshot of the line item(s) being sold (mirrors Order.lineItems). */
  orderId: string;
  lineItems: Order["lineItems"];
  subtotal: number;
  /** Mooday’s commission (10 % for Phase 1). */
  commission: number;
  /** Subtotal − commission. */
  payoutAmount: number;
  shipment: ShipmentStatus;
  payout: PayoutStatus;
  /** Days the funds stay in escrow before becoming available (e.g. 3). */
  holdDays: number;
  /** Buyer’s city (snapshot). */
  shipToCityEn: string;
  shipToCityAr: string;
  /** ISO date when the payout was released to the seller. */
  paidOutAt?: string;
}

export interface DeriveSalesOpts {
  /** Exact EN seller display name (e.g. userProfile.fullNameEn). */
  sellerNameEn?: string;
  /** One or more seller display names (EN/AR) to match against line items. */
  sellerNames?: string[];
  /** Listing ids owned by the current seller. */
  ownedListingIds?: string[];
  /** Auth user id — used with `isOwnListing` when products have sellerId. */
  currentUserId?: string | null;
}

// ---------- Helpers ----------

function commission(subtotal: number): number {
  return Math.round(subtotal * 0.1);
}

/** Public export so callers (e.g. MySalesView) can compute payouts. */
export function payoutAmount(subtotal: number): number {
  return subtotal - commission(subtotal);
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Whether a product line belongs to the current seller under `opts`. */
function isSellerProduct(product: Product, opts: DeriveSalesOpts): boolean {
  const names = [
    ...(opts.sellerNames ?? []),
    ...(opts.sellerNameEn ? [opts.sellerNameEn] : []),
  ]
    .map(normalizeName)
    .filter(Boolean);

  if (names.length > 0) {
    const sellerEn = normalizeName(product.sellerNameEn);
    const sellerAr = normalizeName(product.sellerNameAr);
    for (const name of names) {
      if (sellerEn === name || sellerAr === name) return true;
      // First-token match: "Fatima AlMansoori" → "fatima" matches "Fatima's Edit".
      const token = name.split(/\s+/)[0] ?? "";
      if (
        token.length >= 3 &&
        (sellerEn.includes(token) || sellerAr.includes(token))
      ) {
        return true;
      }
    }
  }

  if (opts.ownedListingIds?.includes(product.id)) return true;

  if (opts.currentUserId != null) {
    return isOwnListing(product, opts.currentUserId);
  }

  return false;
}

/**
 * Derive the Sale records from the buyer's Order list. Each order that
 * hasn't been cancelled produces one Sale; cancelled orders are excluded
 * because they reverse the whole flow.
 *
 * When `opts` is provided, only line items belonging to the current seller
 * are kept — orders with no matching lines are dropped.
 */
export function deriveSalesFromOrders(
  orders: Order[],
  opts?: DeriveSalesOpts,
): Sale[] {
  const hasFilter = Boolean(
    opts &&
      (opts.sellerNameEn ||
        (opts.sellerNames && opts.sellerNames.length > 0) ||
        (opts.ownedListingIds && opts.ownedListingIds.length > 0) ||
        opts.currentUserId != null),
  );

  return orders
    .filter((o) => o.status !== "cancelled")
    .map((o): Sale | null => {
      const lineItems = hasFilter
        ? o.lineItems.filter((li) => isSellerProduct(li.product, opts!))
        : o.lineItems;
      if (lineItems.length === 0) return null;

      const subtotal = hasFilter
        ? lineItems.reduce(
            (sum, li) => sum + li.priceAtPurchase * li.quantity,
            0,
          )
        : o.subtotal;

      const shipment: ShipmentStatus =
        o.status === "shipped"
          ? "in_transit"
          : o.status === "delivered" || o.status === "returned"
            ? "delivered"
            : "awaiting_pickup";
      const payout: PayoutStatus =
        o.status === "delivered"
          ? o.id === "ord-0013" || o.id === "ord-0014" || o.id === "ord-0015"
            ? "paid_out"
            : "available"
          : "pending";

      const buyerNameEn =
        o.addressFullNameEn?.trim() || "Buyer";
      const buyerNameAr =
        o.addressFullNameAr?.trim() || "مشتري";

      return {
        id: o.id,
        buyerNameEn,
        buyerNameAr,
        buyerPaymentLast4: o.paymentLast4,
        buyerPaymentBrandEn: o.paymentBrandEn,
        buyerPaymentBrandAr: o.paymentBrandAr,
        orderId: o.id,
        lineItems,
        subtotal,
        commission: commission(subtotal),
        payoutAmount: payoutAmount(subtotal),
        shipment,
        payout,
        holdDays: 3,
        shipToCityEn: o.addressCityEn,
        shipToCityAr: o.addressCityAr,
        paidOutAt:
          payout === "paid_out"
            ? new Date(
                new Date(o.dateOrdered).getTime() + 8 * 86_400_000,
              ).toISOString()
            : undefined,
      };
    })
    .filter((s): s is Sale => s !== null);
}

/** Localised labels for a sale. */
export function shipmentLabel(status: ShipmentStatus, isAr: boolean): string {
  return isAr ? SHIPMENT_LABEL_AR[status] : SHIPMENT_LABEL_EN[status];
}

export function payoutLabel(status: PayoutStatus, isAr: boolean): string {
  return isAr ? PAYOUT_LABEL_AR[status] : PAYOUT_LABEL_EN[status];
}
