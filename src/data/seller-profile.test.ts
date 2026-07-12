import { describe, it, expect } from "vitest";
import { SELLERS } from "@/data/sellers";
import { SELLER_META } from "@/data/seller-meta";
import { getSellerProfile } from "@/data/seller-profile";

describe("getSellerProfile", () => {
  it("returns the merged profile for a known seller", () => {
    const p = getSellerProfile("sarah");
    expect(p).not.toBeNull();
    expect(p!.nameEn).toBe("Sarah's Vintage");
    expect(p!.nameAr).toBe("عتيق سارة");
    expect(p!.avatar).toBe("/sellers/sarah.jpg");
    expect(p!.typeEn).toBe("Verified Collector");
    expect(p!.joinedAt).toBe("2022-03-14");
    expect(p!.isVerified).toBe(true);
    expect(p!.cityEn).toBe("Dubai");
    expect(p!.styleTagsEn).toEqual(["Vintage", "Silk", "Heirloom"]);
    expect(p!.styleTagsAr).toEqual(["عتيق", "حرير", "تراث"]);
  });

  it("returns null for an unknown seller key", () => {
    expect(getSellerProfile("does-not-exist")).toBeNull();
  });

  it("every seller in SELLERS has a matching SELLER_META entry", () => {
    for (const key of Object.keys(SELLERS)) {
      expect(
        SELLER_META[key],
        `missing meta for seller "${key}"`,
      ).toBeDefined();
    }
  });
});
