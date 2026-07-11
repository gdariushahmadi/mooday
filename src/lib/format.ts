/**
 * Format a number as an AED price string with thousands separators.
 *
 * Example: 1250 -> "1,250"
 */
export function formatAED(value: number): string {
  return new Intl.NumberFormat("en-AE", {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as a full AED currency label.
 *
 * Example: 1250 -> "AED 1,250"
 */
export function formatAEDLabel(value: number): string {
  return `AED ${formatAED(value)}`;
}
