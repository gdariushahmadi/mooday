import { describe, expect, it } from "vitest";
import { isOwnListing } from "@/lib/ownership";
import type { Product } from "@/context/AppContext";

const BASE: Product = {
  id: "p1",
  titleEn: "Bag",
  titleAr: "حقيبة",
  price: 100,
  originalPrice: 200,
  conditionEn: "Good",
  conditionAr: "جيدة",
  sellerNameEn: "Sarah",
  sellerNameAr: "سارة",
  sellerAvatar: "/sellers/sarah.jpg",
  sellerTypeEn: "Verified",
  sellerTypeAr: "موثق",
  saves: 1,
  image: "/products/p1.jpg",
  images: ["/products/p1.jpg"],
  descriptionEn: ".",
  descriptionAr: ".",
  category: "Bags",
};

describe("isOwnListing", () => {
  it("treats custom-* ids as owned when sellerId is unset", () => {
    expect(
      isOwnListing({ ...BASE, id: "custom-123" }, null),
    ).toBe(true);
    expect(isOwnListing(BASE, null)).toBe(false);
  });

  it("matches sellerId when present", () => {
    expect(
      isOwnListing({ ...BASE, sellerId: "u1" }, "u1"),
    ).toBe(true);
    expect(
      isOwnListing({ ...BASE, sellerId: "u1" }, "u2"),
    ).toBe(false);
  });
});
