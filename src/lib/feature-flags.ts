export type CheckoutMode = "demo" | "stripe";

/** Public browser-safe release flags. The demo is the safe default. */
export function getCheckoutMode(): CheckoutMode {
  return process.env.NEXT_PUBLIC_CHECKOUT_MODE === "stripe" ? "stripe" : "demo";
}

export function isPaymentsEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true" &&
    getCheckoutMode() === "stripe"
  );
}

export const CANONICAL_SITE_URL =
  process.env.NEXT_PUBLIC_CANONICAL_SITE_URL?.trim() ||
  process.env.CANONICAL_SITE_URL?.trim() ||
  "https://app.daneg.ae";
