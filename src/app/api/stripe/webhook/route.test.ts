import { describe, expect, it } from "vitest";

describe("POST /api/stripe/webhook", () => {
  it("keeps the webhook disabled in Demo mode before reading payment data", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "payload",
    });
    const response = await POST(request as never);
    expect(response.status).toBe(503);
  });

  it("returns 400 when Stripe mode is enabled but the secret is missing", async () => {
    const { POST } = await import("./route");
    const original = { ...process.env };
    process.env.PAYMENTS_ENABLED = "true";
    process.env.NEXT_PUBLIC_CHECKOUT_MODE = "stripe";
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const request = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "payload",
      headers: { "stripe-signature": "t=1,v1=abc" },
    });
    const response = await POST(request as never);
    expect(response.status).toBe(400);
    Object.assign(process.env, original);
  });

  it("uses dynamic import for the Stripe SDK", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/app/api/stripe/webhook/route.ts", "utf8");
    expect(source).toContain('await import("stripe")');
    expect(source).toContain("constructEvent");
  });

  it("returns 400 when signature is invalid", async () => {
    const { POST } = await import("./route");
    const original = { ...process.env };
    process.env.PAYMENTS_ENABLED = "true";
    process.env.NEXT_PUBLIC_CHECKOUT_MODE = "stripe";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.STRIPE_SECRET_KEY = "sk_test";
    // The Stripe SDK will reject the bogus signature; the route
    // catches the throw and returns 400.
    const request = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "payload",
      headers: { "stripe-signature": "t=1,v1=abc" },
    });
    const response = await POST(request as never);
    expect(response.status).toBe(400);
    Object.assign(process.env, original);
  });
});
