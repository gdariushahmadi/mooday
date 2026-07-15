import { afterEach, describe, expect, it } from "vitest";
import { getBackendConfig } from "./config";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("Phase 2 backend configuration", () => {
  it("defaults to explicit demo mode without making network calls", () => {
    delete process.env.NEXT_PUBLIC_DATA_SOURCE;
    delete process.env.NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(getBackendConfig().mode).toBe("mock");
    expect(getBackendConfig().marketplaceMode).toBe("mock");
  });

  it("does not allow marketplace writes without real identity", () => {
    process.env.NEXT_PUBLIC_DATA_SOURCE = "mock";
    process.env.NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE = "supabase";
    expect(() => getBackendConfig()).toThrow(/requires.*data_source/i);
  });

  it("fails fast when Supabase mode is missing public configuration", () => {
    process.env.NEXT_PUBLIC_DATA_SOURCE = "supabase";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(() => getBackendConfig()).toThrow(/requires/i);
  });

  it("accepts only browser-safe Supabase configuration", () => {
    process.env.NEXT_PUBLIC_DATA_SOURCE = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    const config = getBackendConfig();
    expect(config).toMatchObject({
      mode: "supabase",
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "publishable",
    });
  });
});
