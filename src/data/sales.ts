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
  buyerPaymentBrandEn: "Visa" | "Mastercard" | "Amex" | "Apple Pay";
  buyerPaymentBrandAr: "فيزا" | "ماستركارد" | "أمريكان إكسبريس" | "آبل باي";
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

// ---------- Helpers ----------

function commission(subtotal: number): number {
  return Math.round(subtotal * 0.1);
}

/** Public export so callers (e.g. MySalesView) can compute payouts. */
export function payoutAmount(subtotal: number): number {
  return subtotal - commission(subtotal);
}

/**
 * Derive the Sale records from the buyer's Order list. Each order that
 * hasn't been cancelled produces one Sale; cancelled orders are excluded
 * because they reverse the whole flow.
 */
export function deriveSalesFromOrders(orders: Order[]): Sale[] {
  return orders
    .filter((o) => o.status !== "cancelled")
    .map((o): Sale => {
      const firstLine = o.lineItems[0];
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
      return {
        id: o.id,
        buyerNameEn: "Layla Mansour",
        buyerNameAr: "ليلى منصور",
        buyerPaymentLast4: o.paymentLast4,
        buyerPaymentBrandEn: o.paymentBrandEn,
        buyerPaymentBrandAr: o.paymentBrandAr,
        orderId: o.id,
        lineItems: o.lineItems,
        subtotal: o.subtotal,
        commission: commission(o.subtotal),
        payoutAmount: payoutAmount(o.subtotal),
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
        // `firstLine` is currently unused but kept so consumers can pull
        // seller-facing notes from the snapshot later.
        ...(firstLine ? {} : {}),
      };
    });
}

/** Localised labels for a sale. */
export function shipmentLabel(status: ShipmentStatus, isAr: boolean): string {
  return isAr ? SHIPMENT_LABEL_AR[status] : SHIPMENT_LABEL_EN[status];
}

export function payoutLabel(status: PayoutStatus, isAr: boolean): string {
  return isAr ? PAYOUT_LABEL_AR[status] : PAYOUT_LABEL_EN[status];
}
