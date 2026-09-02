import { describe, it, expect } from "vitest";
import {
  PREMIUM_BRANDS,
  PREMIUM_BRANDS_AR,
  isPremiumBrand,
  brandArFor,
} from "./premium-brands";

describe("premium brands", () => {
  it("exports the expected English list", () => {
    expect(PREMIUM_BRANDS).toContain("Chanel");
    expect(PREMIUM_BRANDS).toContain("Hermes");
    expect(PREMIUM_BRANDS).toContain("Louis Vuitton");
    expect(PREMIUM_BRANDS).toContain("Dior");
  });

  it("exports the Arabic list in the same order as the English list", () => {
    expect(PREMIUM_BRANDS_AR).toHaveLength(PREMIUM_BRANDS.length);
    expect(PREMIUM_BRANDS_AR[0]).toBe("شانيل");
    expect(PREMIUM_BRANDS_AR[1]).toBe("ديور");
  });

  it("isPremiumBrand matches case-insensitively", () => {
    expect(isPremiumBrand("Chanel")).toBe(true);
    expect(isPremiumBrand("chanel")).toBe(true);
    expect(isPremiumBrand("HERMES")).toBe(true);
    expect(isPremiumBrand("  Loewe  ")).toBe(true);
  });

  it("isPremiumBrand returns false for non-premium brands", () => {
    expect(isPremiumBrand("Uniqlo")).toBe(false);
    expect(isPremiumBrand("Zara")).toBe(false);
    expect(isPremiumBrand("")).toBe(false);
  });

  it("brandArFor returns the Arabic label for a premium brand", () => {
    expect(brandArFor("Chanel")).toBe("شانيل");
    expect(brandArFor("hermes")).toBe("هيرميس");
  });

  it("brandArFor returns undefined for an unknown brand", () => {
    expect(brandArFor("Uniqlo")).toBeUndefined();
  });
});
