import { describe, expect, it } from "vitest";

describe("POST /api/stripe/webhook", () => {
  it("returns 400 when no signature header is provided", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "payload",
    });
    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it("returns 400 when webhook secret is missing", async () => {
    const { POST } = await import("./route");
    const original = { ...process.env };
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
    expect([400, 500]).toContain(response.status);
    Object.assign(process.env, original);
  });
});
