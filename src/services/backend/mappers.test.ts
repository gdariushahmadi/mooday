import { describe, expect, it } from "vitest";
import type { Product } from "@/context/AppContext";
import type {
  CreateListingInput,
  ListingImageRecord,
  ListingRecord,
  SellerCardRecord,
} from "./contracts";
import {
  hydrateProductsFromRemote,
  isPublicImageUrl,
  mapProductToCreateInput,
  mapProductToUpdatePatch,
} from "./mappers";

function listingFixture(overrides: Partial<ListingRecord> = {}): ListingRecord {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    sellerId: "22222222-2222-4222-8222-222222222222",
    titleEn: "Linen blazer",
    titleAr: "بليزر كتان",
    descriptionEn: "Excellent condition.",
    descriptionAr: "حالة ممتازة.",
    priceMinor: 12000,
    originalPriceMinor: 18000,
    currency: "AED",
    conditionEn: "Like new",
    conditionAr: "كالجديد",
    category: "Outerwear",
    size: "M",
    colorEn: "Camel",
    colorAr: "جملي",
    mode: "resell",
    status: "active",
    isAuthentic: true,
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
    ...overrides,
  };
}

function sellerCardFixture(
  overrides: Partial<SellerCardRecord> = {},
): SellerCardRecord {
  return {
    sellerId: "22222222-2222-4222-8222-222222222222",
    displayNameEn: "Layla's Closet",
    displayNameAr: "خزانة ليلى",
    handle: "layla",
    avatarUrl: "https://cdn.example/layla.jpg",
    typeEn: "Verified Closet",
    typeAr: "خزانة معتمدة",
    bioEn: "",
    bioAr: "",
    cityEn: "Dubai",
    cityAr: "دبي",
    styleTagsEn: ["Minimal"],
    styleTagsAr: ["بسيط"],
    isVerified: true,
    responseRate: 0.95,
    responseTimeHours: 2,
    joinedAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    listingsCount: 7,
    ...overrides,
  };
}

function imageFixture(
  overrides: Partial<ListingImageRecord> = {},
): ListingImageRecord {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    listingId: "11111111-1111-4111-8111-111111111111",
    storagePath: "public/foo.jpg",
    url: "https://cdn.example/foo.jpg",
    sortOrder: 0,
    altEn: "",
    altAr: "",
    createdAt: "2026-07-18T00:00:00.000Z",
    ...overrides,
  };
}

describe("hydrateProductsFromRemote", () => {
  it("converts minor-unit prices to major AED floats", () => {
    const [product] = hydrateProductsFromRemote({
      listings: [
        listingFixture({ priceMinor: 12345, originalPriceMinor: 20000 }),
      ],
      sellerCardsById: new Map(),
      imagesByListingId: new Map(),
    });
    expect(product.price).toBeCloseTo(123.45, 2);
    expect(product.originalPrice).toBeCloseTo(200, 2);
    expect(product.createdAt).toBe("2026-07-18T00:00:00.000Z");
  });

  it("falls back to priceMinor when originalPriceMinor is null", () => {
    const [product] = hydrateProductsFromRemote({
      listings: [
        listingFixture({ priceMinor: 5000, originalPriceMinor: null }),
      ],
      sellerCardsById: new Map(),
      imagesByListingId: new Map(),
    });
    expect(product.originalPrice).toBe(50);
    expect(product.price).toBe(50);
  });

  it("attaches the seller card fields and active-listing count", () => {
    const seller = sellerCardFixture({ listingsCount: 9 });
    const [product] = hydrateProductsFromRemote({
      listings: [listingFixture()],
      sellerCardsById: new Map([[seller.sellerId, seller]]),
      imagesByListingId: new Map(),
    });
    expect(product.sellerId).toBe(seller.sellerId);
    expect(product.sellerNameEn).toBe("Layla's Closet");
    expect(product.sellerNameAr).toBe("خزانة ليلى");
    expect(product.sellerAvatar).toBe("https://cdn.example/layla.jpg");
    expect(product.sellerTypeEn).toBe("Verified Closet");
    expect(product.sellerTypeAr).toBe("خزانة معتمدة");
    expect(product.saves).toBe(9);
  });

  it("produces empty seller fields when no card is present", () => {
    const [product] = hydrateProductsFromRemote({
      listings: [listingFixture()],
      sellerCardsById: new Map(),
      imagesByListingId: new Map(),
    });
    expect(product.sellerNameEn).toBe("");
    expect(product.sellerAvatar).toBe("");
    expect(product.sellerTypeEn).toBe("");
    expect(product.saves).toBe(0);
  });

  it("uses the placeholder image when a listing has no image metadata", () => {
    const [product] = hydrateProductsFromRemote({
      listings: [listingFixture()],
      sellerCardsById: new Map(),
      imagesByListingId: new Map(),
    });
    expect(product.image).toBe("/products/placeholder.svg");
    expect(product.images).toEqual(["/products/placeholder.svg"]);
  });

  it("picks the first image as the hero (the adapter pre-sorts by sort_order)", () => {
    const listingId = "11111111-1111-4111-8111-111111111111";
    const [product] = hydrateProductsFromRemote({
      listings: [listingFixture({ id: listingId })],
      sellerCardsById: new Map(),
      imagesByListingId: new Map([
        [
          listingId,
          [
            imageFixture({ url: "https://cdn.example/a.jpg", sortOrder: 0 }),
            imageFixture({ url: "https://cdn.example/b.jpg", sortOrder: 1 }),
          ],
        ],
      ]),
    });
    expect(product.image).toBe("https://cdn.example/a.jpg");
    expect(product.images).toEqual([
      "https://cdn.example/a.jpg",
      "https://cdn.example/b.jpg",
    ]);
  });

  it("drops null size/colour fields instead of passing them through as undefined", () => {
    const [product] = hydrateProductsFromRemote({
      listings: [listingFixture({ size: null, colorEn: null, colorAr: null })],
      sellerCardsById: new Map(),
      imagesByListingId: new Map(),
    });
    expect(product.size).toBeUndefined();
    expect(product.colorEn).toBeUndefined();
    expect(product.colorAr).toBeUndefined();
  });

  it("preserves listing mode and isAuthentic verbatim", () => {
    const [product] = hydrateProductsFromRemote({
      listings: [listingFixture({ mode: "rent", isAuthentic: false })],
      sellerCardsById: new Map(),
      imagesByListingId: new Map(),
    });
    expect(product.mode).toBe("rent");
    expect(product.isAuthentic).toBe(false);
  });
});

describe("mapProductToCreateInput", () => {
  const formPayload: Pick<
    Product,
    | "titleEn"
    | "titleAr"
    | "price"
    | "originalPrice"
    | "conditionEn"
    | "conditionAr"
    | "descriptionEn"
    | "descriptionAr"
    | "category"
    | "isAuthentic"
    | "mode"
  > & { size?: string; colorEn?: string; colorAr?: string } = {
    titleEn: "Velvet dress",
    titleAr: "فستان مخمل",
    price: 89.5,
    originalPrice: 150,
    conditionEn: "Good",
    conditionAr: "جيد",
    descriptionEn: "Worn twice.",
    descriptionAr: "تم ارتداؤه مرتين.",
    category: "Dresses",
    isAuthentic: false,
    mode: "resell",
    size: "S",
    colorEn: "Burgundy",
    colorAr: "خمري",
  };

  it("multiplies prices by 100 and rounds to integer minor units", () => {
    const result = mapProductToCreateInput(formPayload);
    expect(result.priceMinor).toBe(8950);
    expect(result.originalPriceMinor).toBe(15000);
    expect(result.currency).toBe("AED");
  });

  it("nulls originalPriceMinor when not greater than price", () => {
    const result = mapProductToCreateInput({
      ...formPayload,
      originalPrice: 50,
    });
    expect(result.originalPriceMinor).toBeNull();
  });

  it("defaults to active status and resell mode when not provided", () => {
    const result = mapProductToCreateInput({ ...formPayload, mode: undefined });
    expect(result.status).toBe("active");
    expect(result.mode).toBe("resell");
  });

  it("honours an explicit draft status", () => {
    const result = mapProductToCreateInput(formPayload, "draft");
    expect(result.status).toBe("draft");
  });

  it("nulls optional fields when they are missing", () => {
    const { size, colorEn, colorAr, ...rest } = formPayload;
    void size;
    void colorEn;
    void colorAr;
    const result = mapProductToCreateInput(rest);
    expect(result.size).toBeNull();
    expect(result.colorEn).toBeNull();
    expect(result.colorAr).toBeNull();
  });
});

describe("mapProductToUpdatePatch", () => {
  it("omits unspecified fields rather than writing undefined", () => {
    const patch = mapProductToUpdatePatch({ price: 99.99 });
    expect(Object.keys(patch)).toEqual(["priceMinor"]);
    expect(patch.priceMinor).toBe(9999);
  });

  it("clears nullable string fields when an empty string is supplied", () => {
    const patch = mapProductToUpdatePatch({
      size: "",
      colorEn: "",
      colorAr: "",
    });
    expect(patch.size).toBeNull();
    expect(patch.colorEn).toBeNull();
    expect(patch.colorAr).toBeNull();
  });

  it("nulls originalPriceMinor when the new price is no longer below original", () => {
    const patch = mapProductToUpdatePatch({ price: 200, originalPrice: 100 });
    expect(patch.priceMinor).toBe(20000);
    expect(patch.originalPriceMinor).toBeNull();
  });

  it("carries through every whitelisted field", () => {
    const patch: Partial<CreateListingInput> = mapProductToUpdatePatch({
      titleEn: "New",
      titleAr: "جديد",
      descriptionEn: "d",
      descriptionAr: "د",
      price: 10,
      originalPrice: 20,
      conditionEn: "Like new",
      conditionAr: "كالجديد",
      category: "Bags",
      size: "L",
      colorEn: "Black",
      colorAr: "أسود",
      mode: "rent",
      isAuthentic: true,
    });
    expect(Object.keys(patch).sort()).toEqual(
      [
        "titleEn",
        "titleAr",
        "descriptionEn",
        "descriptionAr",
        "priceMinor",
        "originalPriceMinor",
        "conditionEn",
        "conditionAr",
        "category",
        "size",
        "colorEn",
        "colorAr",
        "mode",
        "isAuthentic",
      ].sort(),
    );
  });
});

describe("isPublicImageUrl", () => {
  it("treats absolute and slash-prefixed paths as public URLs", () => {
    expect(isPublicImageUrl("/products/foo.jpg")).toBe(true);
    expect(isPublicImageUrl("https://cdn.example/foo.jpg")).toBe(true);
    expect(isPublicImageUrl("http://localhost:3000/foo.png")).toBe(true);
  });

  it("treats bucket-style paths as private (require signed URL)", () => {
    expect(isPublicImageUrl("user-1/listing-1/abc.jpg")).toBe(false);
    expect(isPublicImageUrl("some/relative/path")).toBe(false);
  });
});

import { mapOrderFromRemote, buildCreateOrderInput } from "./mappers-orders";
import { mapNotificationFromRemote, mapReportFromRemote, mapThreadFromRemote } from "./mappers-social";
import type { OrderRecord, OrderItemRecord, NotificationRecord, ReportRecord, ChatThreadRecord } from "./contracts";

describe("mapOrderFromRemote", () => {
  const baseRecord: OrderRecord = {
    id: "ord-1",
    buyerId: "buyer-1",
    sellerId: "seller-1",
    status: "paid",
    shippingAddress: {
      cityEn: "Dubai",
      cityAr: "دبي",
      streetEn: "123 Main St",
      streetAr: "شارع ١٢٣",
      fullNameEn: "Layla",
      fullNameAr: "ليلى",
    },
    currency: "AED",
    itemsSubtotalMinor: 10000,
    shippingFeeMinor: 500,
    totalMinor: 10500,
    paymentMethod: "card",
    paymentBrandEn: "Visa",
    paymentBrandAr: "فيزا",
    paymentLast4: "4242",
    courierNameEn: null,
    courierNameAr: null,
    courierTracking: null,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  };

  const baseItem: OrderItemRecord = {
    id: "oi-1",
    orderId: "ord-1",
    listingId: "listing-1",
    titleEnAtPurchase: "Test Handbag",
    titleArAtPurchase: "حقيبة اختبار",
    imageUrlAtPurchase: "/products/test.jpg",
    priceMinorAtPurchase: 10000,
    quantity: 1,
    createdAt: "2024-01-15T10:00:00Z",
  };

  it("converts minor units to AED floats", () => {
    const order = mapOrderFromRemote({
      record: { ...baseRecord, items: [baseItem] },
      listingsById: new Map(),
    });
    expect(order.subtotal).toBe(100);
    expect(order.shipping).toBe(5);
    expect(order.total).toBe(105);
    expect(order.lineItems[0].priceAtPurchase).toBe(100);
  });

  it("maps 'paid' DB status to 'processing' view status", () => {
    const order = mapOrderFromRemote({
      record: { ...baseRecord, items: [baseItem] },
      listingsById: new Map(),
    });
    expect(order.status).toBe("processing");
  });

  it("preserves 'shipped' DB status as-is", () => {
    const order = mapOrderFromRemote({
      record: { ...baseRecord, status: "shipped", items: [baseItem] },
      listingsById: new Map(),
    });
    expect(order.status).toBe("shipped");
  });

  it("seeds timeline with the current status plus prior steps", () => {
    const order = mapOrderFromRemote({
      record: { ...baseRecord, status: "delivered", items: [baseItem] },
      listingsById: new Map(),
    });
    expect(order.timeline.map((e) => e.status)).toEqual([
      "processing",
      "shipped",
      "delivered",
    ]);
  });

  it("cancelled orders produce a single-event timeline", () => {
    const order = mapOrderFromRemote({
      record: { ...baseRecord, status: "cancelled", items: [baseItem] },
      listingsById: new Map(),
    });
    expect(order.timeline).toHaveLength(1);
    expect(order.timeline[0].status).toBe("cancelled");
  });
});

describe("buildCreateOrderInput", () => {
  it("rounds major-unit prices back to integer minor units", () => {
    const input = buildCreateOrderInput({
      order: {
        id: "ord-x",
        dateOrdered: "2024-01-15T10:00:00Z",
        status: "processing",
        lineItems: [
          {
            product: {
              id: "listing-1",
              titleEn: "Bag",
              titleAr: "حقيبة",
              price: 99.99,
              originalPrice: 99.99,
              conditionEn: "New",
              conditionAr: "جديد",
              sellerNameEn: "S",
              sellerNameAr: "S",
              sellerAvatar: "/s",
              sellerTypeEn: "Verified",
              sellerTypeAr: "معتمد",
              saves: 0,
              image: "/p.jpg",
              images: ["/p.jpg"],
              descriptionEn: "",
              descriptionAr: "",
              category: "Bags",
            },
            quantity: 1,
            priceAtPurchase: 99.99,
          },
        ],
        addressCityEn: "Dubai",
        addressCityAr: "دبي",
        addressStreetEn: "St",
        addressStreetAr: "شارع",
        paymentBrandEn: "Visa",
        paymentBrandAr: "فيزا",
        paymentLast4: "4242",
        subtotal: 99.99,
        shipping: 5,
        total: 104.99,
        courier: { nameEn: "Aramex", nameAr: "أرامكس", trackingNumber: "" },
        timeline: [],
      },
      sellerId: "seller-1",
    });
    expect(input.itemsSubtotalMinor).toBe(9999);
    expect(input.shippingFeeMinor).toBe(500);
    expect(input.totalMinor).toBe(10499);
    expect(input.items[0].priceMinorAtPurchase).toBe(9999);
  });

  it("maps Cash brand to 'cod' payment method", () => {
    const input = buildCreateOrderInput({
      order: {
        id: "ord-y",
        dateOrdered: "2024-01-15T10:00:00Z",
        status: "processing",
        lineItems: [],
        addressCityEn: "Dubai",
        addressCityAr: "دبي",
        addressStreetEn: "St",
        addressStreetAr: "شارع",
        paymentBrandEn: "Cash",
        paymentBrandAr: "نقداً",
        paymentLast4: "",
        subtotal: 0,
        shipping: 0,
        total: 0,
        courier: { nameEn: "", nameAr: "", trackingNumber: "" },
        timeline: [],
      },
      sellerId: "seller-1",
    });
    expect(input.paymentMethod).toBe("cod");
  });
});

describe("mapNotificationFromRemote", () => {
  it("translates DB kinds to view kinds", () => {
    const record: NotificationRecord = {
      id: "n-1",
      recipientId: "user-1",
      kind: "chat",
      titleEn: "New chat",
      titleAr: "محادثة جديدة",
      bodyEn: "Hello",
      bodyAr: "مرحبا",
      targetKind: "chat",
      targetId: "thread-1",
      isUnread: true,
      createdAt: "2024-01-15T10:00:00Z",
    };
    const mapped = mapNotificationFromRemote(record);
    expect(mapped.type).toBe("chat");
    expect(mapped.target).toEqual({ kind: "chat", id: "thread-1" });
    expect(mapped.isUnread).toBe(true);
  });

  it("omits target when DB targetKind is 'none'", () => {
    const record: NotificationRecord = {
      id: "n-2",
      recipientId: "user-1",
      kind: "system",
      titleEn: "Update",
      titleAr: "تحديث",
      bodyEn: "",
      bodyAr: "",
      targetKind: "none",
      targetId: null,
      isUnread: false,
      createdAt: "2024-01-15T10:00:00Z",
    };
    const mapped = mapNotificationFromRemote(record);
    expect(mapped.target).toBeUndefined();
  });
});

describe("mapReportFromRemote", () => {
  it("maps DB reason 'offensive' to view reason 'inappropriate'", () => {
    const record: ReportRecord = {
      id: "r-1",
      caseNumber: "MOODAY-00001",
      reporterId: "user-1",
      target: "user",
      targetId: "user-2",
      reason: "offensive",
      body: "Bad content",
      status: "open",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    };
    const mapped = mapReportFromRemote(record);
    expect(mapped.reason).toBe("inappropriate");
    expect(mapped.caseNumber).toBe("MOODAY-00001");
  });

  it("coerces DB 'dismissed' status to view 'resolved'", () => {
    const record: ReportRecord = {
      id: "r-2",
      caseNumber: "MOODAY-00002",
      reporterId: "user-1",
      target: "listing",
      targetId: "l-1",
      reason: "spam",
      body: "",
      status: "dismissed",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    };
    const mapped = mapReportFromRemote(record);
    expect(mapped.status).toBe("resolved");
  });
});

describe("mapThreadFromRemote", () => {
  it("hydrates an empty message list and converts minor price to AED", () => {
    const record: ChatThreadRecord = {
      id: "thread-1",
      buyerId: "buyer-1",
      sellerId: "seller-1",
      listingId: "l-1",
      listingTitleEn: "Bag",
      listingTitleAr: "حقيبة",
      listingImageUrl: "/p.jpg",
      priceMinorAtCreation: 15000,
      lastMessageBody: "Hi",
      lastMessageAt: "2024-01-15T10:00:00Z",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    };
    const thread = mapThreadFromRemote(record, "buyer-1", []);
    expect(thread.productPrice).toBe(150);
    expect(thread.messages).toHaveLength(0);
  });
});
