/**
 * Mock "orders" data. Local-first, no backend.
 *
 * In production these are the buyer's purchase history records pulled
 * from the seller's fulfillment API. For Phase 1 we ship 15 hand-authored
 * orders distributed across the canonical statuses (Processing · Shipped ·
 * Delivered · Returned · Cancelled) so My Purchases (C-16), Order Tracking
 * (C-17), My Sales (D-22), and Reviews (H-39) all have real-looking
 * fixtures to render.
 *
 * Status timeline is pre-baked per order so the tracking screen can render
 * the progress steps without an async fetch.
 */

import type { Product } from "@/context/AppContext";

export type OrderStatus =
  "processing" | "shipped" | "delivered" | "returned" | "cancelled";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "processing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;

/** Per-status localisation for UI badges and headings. */
export const ORDER_STATUS_LABEL_EN: Record<OrderStatus, string> = {
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  returned: "Returned",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_LABEL_AR: Record<OrderStatus, string> = {
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  returned: "مرتجع",
  cancelled: "ملغي",
};

/** Lower-priority (passed) statuses are visually de-emphasised. */
export const ORDER_STATUS_TONE: Record<
  OrderStatus,
  "default" | "success" | "warning" | "error" | "info"
> = {
  processing: "info",
  shipped: "default",
  delivered: "success",
  returned: "warning",
  cancelled: "error",
};

export interface OrderLineItem {
  /** Snapshot of the Product at the time of order (in case the listing
   * is later edited, deleted, or sold). */
  product: Product;
  quantity: number;
  /** Price per unit at the time of purchase. May differ from the current
   * `product.price` if the seller adjusted it post-purchase. */
  priceAtPurchase: number;
}

export interface OrderTimelineEvent {
  /** The status that was reached at this step. */
  status: OrderStatus;
  /** ISO date string. */
  date: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface Order {
  id: string;
  /** ISO date string. */
  dateOrdered: string;
  status: OrderStatus;
  lineItems: OrderLineItem[];
  /** Snapshot of the shipping address used. */
  addressCityEn: string;
  addressCityAr: string;
  addressStreetEn: string;
  addressStreetAr: string;
  /** "Visa •••• 4242" — last-4 only, no PAN. */
  paymentBrandEn: "Visa" | "Mastercard" | "Amex" | "Apple Pay";
  paymentBrandAr: "فيزا" | "ماستركارد" | "أمريكان إكسبريس" | "آبل باي";
  paymentLast4: string;
  subtotal: number;
  shipping: number;
  total: number;
  courier: {
    nameEn: string;
    nameAr: string;
    trackingNumber: string;
  };
  /** Pre-baked timeline (the most recent entry is the current status). */
  timeline: OrderTimelineEvent[];
}

// ---------- Helpers used by the seed data ----------

let _seq = 1;
function makeId(): string {
  return `ord-${String(_seq++).padStart(4, "0")}`;
}

function makeLine(
  product: Product,
  quantity: number,
  priceAtPurchase: number,
): OrderLineItem {
  return { product, quantity, priceAtPurchase };
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

const PROCESSING_TIMELINE: OrderTimelineEvent[] = [
  {
    status: "processing",
    date: isoDaysAgo(1),
    descriptionEn: "Order placed, payment secured in Mooday escrow.",
    descriptionAr: "تم تسجيل الطلب وتأمين المبلغ في حساب مودي.",
  },
];

const SHIPPED_TIMELINE: OrderTimelineEvent[] = [
  {
    status: "processing",
    date: isoDaysAgo(4),
    descriptionEn: "Order placed, payment secured in Mooday escrow.",
    descriptionAr: "تم تسجيل الطلب وتأمين المبلغ في حساب مودي.",
  },
  {
    status: "shipped",
    date: isoDaysAgo(1),
    descriptionEn: "Picked up by Aramex, in transit to your address.",
    descriptionAr: "تم استلام الشحنة من البائع، في الطريق إليك.",
  },
];

const DELIVERED_TIMELINE: OrderTimelineEvent[] = [
  {
    status: "processing",
    date: isoDaysAgo(10),
    descriptionEn: "Order placed, payment secured in Mooday escrow.",
    descriptionAr: "تم تسجيل الطلب وتأمين المبلغ في حساب مودي.",
  },
  {
    status: "shipped",
    date: isoDaysAgo(7),
    descriptionEn: "Picked up by Aramex, in transit.",
    descriptionAr: "تم استلام الشحنة من البائع.",
  },
  {
    status: "delivered",
    date: isoDaysAgo(4),
    descriptionEn: "Delivered. You have 24 hours to confirm or open a return.",
    descriptionAr: "تم التسليم. لديك ٢٤ ساعة للتأكيد أو طلب إرجاع.",
  },
];

const RETURNED_TIMELINE: OrderTimelineEvent[] = [
  ...DELIVERED_TIMELINE,
  {
    status: "returned",
    date: isoDaysAgo(1),
    descriptionEn: "Return requested. Refund pending parcel receipt.",
    descriptionAr: "تم طلب الإرجاع. الاسترداد بعد استلام الشحنة.",
  },
];

// ---------- Seed orders ----------
// (line-items reference the products from `src/data/products.ts` and
// `products-batch2.ts`. Phase 3 will replace these seeds with real
// per-user queries.)

import { defaultProducts } from "./products";
import { batch2Products } from "./products-batch2";

function p(id: string): Product {
  const all: Product[] = [...defaultProducts, ...batch2Products];
  const found = all.find((x) => x.id === id);
  if (!found) {
    throw new Error(`Mock order references unknown product id: ${id}`);
  }
  return found;
}

export const DEFAULT_ORDERS: Order[] = [
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(1),
    status: "processing",
    lineItems: [makeLine(p("handbag-tan"), 1, 1250)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Villa 24, Al Wasl Road, Jumeirah",
    addressStreetAr: "فيلا 24، شارع الوصل، جميرا",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 1250,
    shipping: 0,
    total: 1250,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-9982147",
    },
    timeline: PROCESSING_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(2),
    status: "processing",
    lineItems: [makeLine(p("pearl-drop-earrings"), 1, 480)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Gate Avenue, DIFC, Level 9",
    addressStreetAr: "جيت أفينيو، مركز دبي المالي العالمي",
    paymentBrandEn: "Mastercard",
    paymentBrandAr: "ماستركارد",
    paymentLast4: "1881",
    subtotal: 480,
    shipping: 25,
    total: 505,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-7714501",
    },
    timeline: PROCESSING_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(4),
    status: "shipped",
    lineItems: [makeLine(p("midi-dress"), 1, 720)],
    addressCityEn: "Abu Dhabi",
    addressCityAr: "أبوظبي",
    addressStreetEn: "Mamsha Al Saadiyat, Building 4",
    addressStreetAr: "ممشى السعديات، مبنى 4",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 720,
    shipping: 25,
    total: 745,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-5532890",
    },
    timeline: SHIPPED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(4),
    status: "shipped",
    lineItems: [
      makeLine(p("red-sole-heels"), 1, 540),
      makeLine(p("silk-scarf"), 1, 180),
    ],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Villa 24, Al Wasl Road",
    addressStreetAr: "فيلا 24، شارع الوصل",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 720,
    shipping: 0,
    total: 720,
    courier: {
      nameEn: "Fetchr",
      nameAr: "فتشر",
      trackingNumber: "FCHR-4421998",
    },
    timeline: SHIPPED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(5),
    status: "shipped",
    lineItems: [makeLine(p("gold-kaftan"), 1, 1100)],
    addressCityEn: "Sharjah",
    addressCityAr: "الشارقة",
    addressStreetEn: "Al Majaz 3, Tower B, Apt 802",
    addressStreetAr: "المجاز 3، برج B، شقة 802",
    paymentBrandEn: "Mastercard",
    paymentBrandAr: "ماستركارد",
    paymentLast4: "1881",
    subtotal: 1100,
    shipping: 0,
    total: 1100,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-7788110",
    },
    timeline: SHIPPED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(7),
    status: "shipped",
    lineItems: [makeLine(p("handbag-tan"), 1, 1250)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Villa 24, Al Wasl Road",
    addressStreetAr: "فيلا 24، شارع الوصل",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 1250,
    shipping: 0,
    total: 1250,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-9955441",
    },
    timeline: SHIPPED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(10),
    status: "delivered",
    lineItems: [makeLine(p("linen-blazer"), 1, 380)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Gate Avenue, DIFC, Level 9",
    addressStreetAr: "جيت أفينيو، مركز دبي المالي العالمي",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 380,
    shipping: 25,
    total: 405,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-1100884",
    },
    timeline: DELIVERED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(12),
    status: "delivered",
    lineItems: [makeLine(p("floral-maxi-dress"), 1, 880)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Villa 24, Al Wasl Road",
    addressStreetAr: "فيلا 24، شارع الوصل",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 880,
    shipping: 0,
    total: 880,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-3377220",
    },
    timeline: DELIVERED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(14),
    status: "delivered",
    lineItems: [makeLine(p("rose-gold-watch"), 1, 1500)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Villa 24, Al Wasl Road",
    addressStreetAr: "فيلا 24، شارع الوصل",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 1500,
    shipping: 0,
    total: 1500,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-8844112",
    },
    timeline: DELIVERED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(16),
    status: "delivered",
    lineItems: [makeLine(p("white-leather-sneakers"), 1, 460)],
    addressCityEn: "Abu Dhabi",
    addressCityAr: "أبوظبي",
    addressStreetEn: "Mamsha Al Saadiyat, Building 4",
    addressStreetAr: "ممشى السعديات، مبنى 4",
    paymentBrandEn: "Mastercard",
    paymentBrandAr: "ماستركارد",
    paymentLast4: "1881",
    subtotal: 460,
    shipping: 25,
    total: 485,
    courier: {
      nameEn: "Fetchr",
      nameAr: "فتشر",
      trackingNumber: "FCHR-9988776",
    },
    timeline: DELIVERED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(20),
    status: "delivered",
    lineItems: [makeLine(p("gold-bracelet"), 1, 720)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Villa 24, Al Wasl Road",
    addressStreetAr: "فيلا 24، شارع الوصل",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 720,
    shipping: 0,
    total: 720,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-1029384",
    },
    timeline: DELIVERED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(22),
    status: "returned",
    lineItems: [makeLine(p("evening-clutch"), 1, 400)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Villa 24, Al Wasl Road",
    addressStreetAr: "فيلا 24، شارع الوصل",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 400,
    shipping: 25,
    total: 425,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-2200811",
    },
    timeline: RETURNED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(6),
    status: "cancelled",
    lineItems: [makeLine(p("silk-scarf"), 1, 180)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Gate Avenue, DIFC, Level 9",
    addressStreetAr: "جيت أفينيو، مركز دبي المالي العالمي",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 180,
    shipping: 25,
    total: 205,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-CANCELLED-1",
    },
    timeline: [
      {
        status: "processing",
        date: isoDaysAgo(6),
        descriptionEn: "Order placed.",
        descriptionAr: "تم تسجيل الطلب.",
      },
      {
        status: "cancelled",
        date: isoDaysAgo(5),
        descriptionEn: "Order cancelled by buyer — refund issued.",
        descriptionAr: "تم إلغاء الطلب من المشتري، وتم الاسترداد.",
      },
    ],
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(28),
    status: "delivered",
    lineItems: [makeLine(p("wide-leg-trousers"), 1, 340)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Villa 24, Al Wasl Road",
    addressStreetAr: "فيلا 24، شارع الوصل",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 340,
    shipping: 25,
    total: 365,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-4499881",
    },
    timeline: DELIVERED_TIMELINE,
  },
  {
    id: makeId(),
    dateOrdered: isoDaysAgo(35),
    status: "delivered",
    lineItems: [makeLine(p("woven-tote"), 1, 690)],
    addressCityEn: "Dubai",
    addressCityAr: "دبي",
    addressStreetEn: "Villa 24, Al Wasl Road",
    addressStreetAr: "فيلا 24، شارع الوصل",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    subtotal: 690,
    shipping: 25,
    total: 715,
    courier: {
      nameEn: "Aramex",
      nameAr: "أرامكس",
      trackingNumber: "ARMX-7722100",
    },
    timeline: DELIVERED_TIMELINE,
  },
];

/** Returns the order matching the given id, or null if not found. */
export function findOrder(orders: Order[], id: string): Order | null {
  return orders.find((o) => o.id === id) ?? null;
}

/**
 * Localised status for an order, based on the active language.
 */
export function statusLabel(status: OrderStatus, isAr: boolean): string {
  return isAr ? ORDER_STATUS_LABEL_AR[status] : ORDER_STATUS_LABEL_EN[status];
}

/** Format a date as "Jan 5, 2026" / "٥ يناير ٢٠٢٦" (lightweight, no
 * locale-aware relative time — keeps tests deterministic). */
export function formatOrderDate(iso: string, isAr: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (isAr) {
    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
