/**
 * Mappers for the order domain. Bridges the Phase 3 `OrderWithItems` /
 * `OrderItemRecord` (storage shape) and the Phase 1 `Order` /
 * `OrderLineItem` (view-model shape).
 */
import type {
  Order as ViewOrder,
  OrderLineItem,
  OrderStatus as ViewStatus,
  OrderTimelineEvent,
} from "@/data/orders";
import type { Product } from "@/context/AppContext";
import type {
  OrderWithItems,
  OrderRecord,
  OrderItemRecord,
  CreateOrderInput,
} from "./contracts";
import type { ListingRecord } from "./contracts";

const AED_MINOR_PER_MAJOR = 100;

type DbStatus = OrderRecord["status"];

function dbStatusToView(status: DbStatus): ViewStatus {
  if (status === "paid") return "processing";
  return status;
}

interface StatusDescriptor {
  status: ViewStatus;
  descriptionEn: string;
  descriptionAr: string;
}

const STATUS_DESCRIPTORS: Record<ViewStatus, StatusDescriptor> = {
  processing: {
    status: "processing",
    descriptionEn: "Order placed, payment secured in Mooday escrow.",
    descriptionAr: "تم تسجيل الطلب وتأمين المبلغ في حساب مودي.",
  },
  shipped: {
    status: "shipped",
    descriptionEn: "Picked up by courier, in transit to your address.",
    descriptionAr: "تم استلام الشحنة من البائع، في الطريق إليك.",
  },
  delivered: {
    status: "delivered",
    descriptionEn: "Delivered. You have 24 hours to confirm or open a return.",
    descriptionAr: "تم التسليم. لديك ٢٤ ساعة للتأكيد أو طلب إرجاع.",
  },
  returned: {
    status: "returned",
    descriptionEn: "Return requested. Refund pending parcel receipt.",
    descriptionAr: "تم طلب الإرجاع. الاسترداد بعد استلام الشحنة.",
  },
  cancelled: {
    status: "cancelled",
    descriptionEn: "Order cancelled.",
    descriptionAr: "تم إلغاء الطلب.",
  },
};

function buildTimeline(record: OrderRecord): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = [];
  const currentView = dbStatusToView(record.status);

  events.push({
    status: "processing",
    date: record.createdAt,
    descriptionEn: STATUS_DESCRIPTORS.processing.descriptionEn,
    descriptionAr: STATUS_DESCRIPTORS.processing.descriptionAr,
  });

  if (
    currentView === "shipped" ||
    currentView === "delivered" ||
    currentView === "returned"
  ) {
    events.push({
      status: "shipped",
      date: record.updatedAt,
      descriptionEn: STATUS_DESCRIPTORS.shipped.descriptionEn,
      descriptionAr: STATUS_DESCRIPTORS.shipped.descriptionAr,
    });
  }
  if (currentView === "delivered" || currentView === "returned") {
    events.push({
      status: "delivered",
      date: record.updatedAt,
      descriptionEn: STATUS_DESCRIPTORS.delivered.descriptionEn,
      descriptionAr: STATUS_DESCRIPTORS.delivered.descriptionAr,
    });
  }
  if (currentView === "returned") {
    events.push({
      status: "returned",
      date: record.updatedAt,
      descriptionEn: STATUS_DESCRIPTORS.returned.descriptionEn,
      descriptionAr: STATUS_DESCRIPTORS.returned.descriptionAr,
    });
  }
  if (currentView === "cancelled") {
    return [
      {
        status: "cancelled",
        date: record.updatedAt,
        descriptionEn: STATUS_DESCRIPTORS.cancelled.descriptionEn,
        descriptionAr: STATUS_DESCRIPTORS.cancelled.descriptionAr,
      },
    ];
  }
  return events;
}

export interface HydrateOrderProductInput {
  listing: ListingRecord | null;
  item: OrderItemRecord;
  fallbackSellerNameEn?: string;
  fallbackSellerNameAr?: string;
}

export function hydrateOrderProduct(
  input: HydrateOrderProductInput,
): Product {
  const { listing, item } = input;
  const price = item.priceMinorAtPurchase / AED_MINOR_PER_MAJOR;
  const originalPrice =
    listing && listing.originalPriceMinor !== null
      ? listing.originalPriceMinor / AED_MINOR_PER_MAJOR
      : price;
  return {
    id: listing?.id ?? item.listingId ?? item.id,
    titleEn: listing?.titleEn ?? item.titleEnAtPurchase,
    titleAr: listing?.titleAr ?? item.titleArAtPurchase,
    price,
    originalPrice,
    conditionEn: listing?.conditionEn ?? "Pre-loved",
    conditionAr: listing?.conditionAr ?? "مستعمل بحالة جيدة",
    sellerNameEn:
      input.fallbackSellerNameEn ?? (listing ? "Mooday seller" : "Seller"),
    sellerNameAr:
      input.fallbackSellerNameAr ?? (listing ? "بائع مودي" : "البائع"),
    sellerAvatar: "/sellers/placeholder.svg",
    sellerTypeEn: "Verified Closet",
    sellerTypeAr: "خزانة معتمدة",
    saves: 0,
    image: item.imageUrlAtPurchase || "/products/placeholder.svg",
    images: item.imageUrlAtPurchase ? [item.imageUrlAtPurchase] : [],
    descriptionEn: listing?.descriptionEn ?? "",
    descriptionAr: listing?.descriptionAr ?? "",
    category: listing?.category ?? "Other",
    isAuthentic: listing?.isAuthentic ?? true,
    size: listing?.size ?? undefined,
    colorEn: listing?.colorEn ?? undefined,
    colorAr: listing?.colorAr ?? undefined,
    mode: listing?.mode ?? "resell",
    sellerId: listing?.sellerId,
  };
}

export interface MapOrderInput {
  record: OrderWithItems;
  listingsById: Map<string, ListingRecord>;
  fallbackSellerNames?: Record<string, { en: string; ar: string }>;
}

export function mapOrderFromRemote(input: MapOrderInput): ViewOrder {
  const { record, listingsById } = input;
  const current = dbStatusToView(record.status);
  const lineItems: OrderLineItem[] = record.items.map((item) => {
    const listing = item.listingId
      ? (listingsById.get(item.listingId) ?? null)
      : null;
    const fallbackNames =
      listing && input.fallbackSellerNames?.[listing.sellerId];
    const product = hydrateOrderProduct({
      listing,
      item,
      fallbackSellerNameEn: fallbackNames?.en,
      fallbackSellerNameAr: fallbackNames?.ar,
    });
    return {
      product,
      quantity: item.quantity,
      priceAtPurchase: item.priceMinorAtPurchase / AED_MINOR_PER_MAJOR,
    };
  });

  const address = record.shippingAddress as Record<string, unknown>;
  return {
    id: record.id,
    dateOrdered: record.createdAt,
    status: current,
    lineItems,
    addressCityEn: String(address.cityEn ?? ""),
    addressCityAr: String(address.cityAr ?? ""),
    addressStreetEn: String(address.streetEn ?? ""),
    addressStreetAr: String(address.streetAr ?? ""),
    addressFullNameEn:
      typeof address.fullNameEn === "string"
        ? (address.fullNameEn as string)
        : undefined,
    addressFullNameAr:
      typeof address.fullNameAr === "string"
        ? (address.fullNameAr as string)
        : undefined,
    paymentBrandEn: (record.paymentBrandEn ?? "Visa") as ViewOrder["paymentBrandEn"],
    paymentBrandAr: (record.paymentBrandAr ?? "فيزا") as ViewOrder["paymentBrandAr"],
    paymentLast4: record.paymentLast4 ?? "",
    subtotal: record.itemsSubtotalMinor / AED_MINOR_PER_MAJOR,
    shipping: record.shippingFeeMinor / AED_MINOR_PER_MAJOR,
    total: record.totalMinor / AED_MINOR_PER_MAJOR,
    courier: {
      nameEn: record.courierNameEn ?? "Aramex",
      nameAr: record.courierNameAr ?? "أرامكس",
      trackingNumber: record.courierTracking ?? "",
    },
    timeline: buildTimeline(record),
  };
}

export interface BuildCreateOrderInputArgs {
  order: ViewOrder;
  sellerId: string;
}

function paymentMethodString(brandEn: string): string {
  if (brandEn === "Apple Pay") return "apple_pay";
  if (brandEn === "Cash") return "cod";
  return "card";
}

export function buildCreateOrderInput(
  args: BuildCreateOrderInputArgs,
): CreateOrderInput {
  const { order, sellerId } = args;
  return {
    sellerId,
    shippingAddress: {
      cityEn: order.addressCityEn,
      cityAr: order.addressCityAr,
      streetEn: order.addressStreetEn,
      streetAr: order.addressStreetAr,
      fullNameEn: order.addressFullNameEn ?? null,
      fullNameAr: order.addressFullNameAr ?? null,
    },
    itemsSubtotalMinor: Math.round(order.subtotal * AED_MINOR_PER_MAJOR),
    shippingFeeMinor: Math.round(order.shipping * AED_MINOR_PER_MAJOR),
    totalMinor: Math.round(order.total * AED_MINOR_PER_MAJOR),
    paymentMethod: paymentMethodString(order.paymentBrandEn),
    paymentBrandEn: order.paymentBrandEn,
    paymentBrandAr: order.paymentBrandAr,
    paymentLast4: order.paymentLast4,
    items: order.lineItems.map((line) => ({
      listingId: line.product.id,
      titleEnAtPurchase: line.product.titleEn,
      titleArAtPurchase: line.product.titleAr,
      imageUrlAtPurchase: line.product.image,
      priceMinorAtPurchase: Math.round(
        line.priceAtPurchase * AED_MINOR_PER_MAJOR,
      ),
      quantity: line.quantity,
    })),
  };
}
