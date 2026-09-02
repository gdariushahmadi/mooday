import { describe, it, expect } from "vitest";
import {
  BRAND,
  BRAND_AR,
  BRAND_TAGLINE_EN,
  BRAND_TAGLINE_AR,
  BRAND_MONOGRAM,
  BRAND_PROTOCOL,
} from "./brand";

describe("brand constants", () => {
  it("exports DANEG as the English wordmark", () => {
    expect(BRAND).toBe("DANEG");
  });

  it("exports the Arabic wordmark", () => {
    expect(BRAND_AR).toBe("دانق");
  });

  it("exports the English tagline with luxury framing", () => {
    expect(BRAND_TAGLINE_EN).toContain("Pre-loved Luxury");
    expect(BRAND_TAGLINE_EN).not.toMatch(/second[- ]?hand/i);
  });

  it("exports the Arabic tagline", () => {
    expect(BRAND_TAGLINE_AR).toBeTruthy();
    expect(BRAND_TAGLINE_AR.length).toBeGreaterThan(0);
  });

  it("exports a single-letter monogram", () => {
    expect(BRAND_MONOGRAM).toBe("D");
  });

  it("exports the brand protocol handler name", () => {
    expect(BRAND_PROTOCOL).toBe("web+daneg");
  });
});
