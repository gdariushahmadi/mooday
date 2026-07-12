import type { Product } from "@/context/AppContext";
import { COLOURS } from "./attributes";

/**
 * Backfills `size`, `colorEn`, `colorAr`, and `mode` onto seed
 * products that were authored before those fields existed. The
 * heuristics are intentionally simple: we look for colour keywords
 * in the English title and assign a size based on the category.
 *
 * Products that already carry these fields are left untouched.
 *
 * Phase 3 will replace this with real data from the database.
 */

// Rotating size pools per category. Accessories get "OS" (one size).
const SIZE_POOL: Record<string, string[]> = {
  Dresses: ["XS", "S", "M", "L", "XL"],
  Clothing: ["XS", "S", "M", "L", "XL"],
  Shoes: ["S", "M", "L"], // Small/Medium/Large for UAE shoe sizing mock
  Bags: ["OS"],
  Accessories: ["OS"],
};

export function backfillAttributes(products: Product[]): Product[] {
  return products.map((p, idx) => {
    if (p.size && p.colorEn && p.mode) return p;

    // Detect colour from the English title.
    const titleLower = p.titleEn.toLowerCase();
    const matchedColour = COLOURS.find((c) =>
      titleLower.includes(c.key.toLowerCase()),
    );

    // Pick a size deterministically from the category's pool, seeded
    // by the product index so the same product always gets the same
    // size across reloads.
    const pool = SIZE_POOL[p.category] ?? SIZE_POOL.Accessories;
    const size = p.size ?? pool[idx % pool.length];

    const colorEn = p.colorEn ?? matchedColour?.key ?? "Beige";
    const colorAr =
      p.colorAr ??
      COLOURS.find((c) => c.key === colorEn)?.ar ??
      "بيج";

    return {
      ...p,
      size,
      colorEn,
      colorAr,
      mode: p.mode ?? "resell",
    };
  });
}
