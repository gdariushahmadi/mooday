import { describe, it, expect } from "vitest";
import { formatAED, formatAEDLabel } from "@/lib/format";

describe("formatAED", () => {
  it("formats a simple integer", () => {
    expect(formatAED(1250)).toBe("1,250");
  });

  it("formats large numbers with thousands separators", () => {
    expect(formatAED(1250000)).toBe("1,250,000");
  });

  it("handles zero", () => {
    expect(formatAED(0)).toBe("0");
  });

  it("truncates fractional digits", () => {
    expect(formatAED(1250.99)).toBe("1,251");
  });

  it("handles small numbers without separators", () => {
    expect(formatAED(25)).toBe("25");
  });
});

describe("formatAEDLabel", () => {
  it("prefixes the amount with AED", () => {
    expect(formatAEDLabel(1250)).toBe("AED 1,250");
  });

  it("works for zero", () => {
    expect(formatAEDLabel(0)).toBe("AED 0");
  });
});
