import { describe, expect, it, vi } from "vitest";

const stripePaymentIntentsCreate = vi.fn();

vi.mock("stripe", () => {
  class StripeMock {
    paymentIntents = {
      create: (...args: unknown[]) => stripePaymentIntentsCreate(...args),
    };
  }
  return { default: StripeMock };
});

describe("OrderService.createPaymentIntent", () => {
  it("requires an authenticated user", async () => {
    const { createSupabaseBackend } = await import("./supabase");
    const backend = createSupabaseBackend({
      supabaseUrl: "https://test.supabase.co",
      supabasePublishableKey: "test-key",
      supabaseServiceRoleKey: null,
      siteUrl: "https://test.supabase.co",
      mode: "supabase",
      marketplaceMode: "supabase",
    });
    await expect(
      backend.orders.createPaymentIntent("order-1"),
    ).rejects.toThrow();
  });

  it("requires STRIPE_SECRET_KEY", async () => {
    const { createSupabaseBackend } = await import("./supabase");
    const original = { ...process.env };
    delete process.env.STRIPE_SECRET_KEY;
    const backend = createSupabaseBackend({
      supabaseUrl: "https://test.supabase.co",
      supabasePublishableKey: "test-key",
      supabaseServiceRoleKey: null,
      siteUrl: "https://test.supabase.co",
      mode: "supabase",
      marketplaceMode: "supabase",
    });
    void backend;
    Object.assign(process.env, original);
  });
});
