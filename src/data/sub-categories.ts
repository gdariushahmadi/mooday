/**
 * Heuristic sub-category derivation. Maps a top-level category plus
 * keywords in the product title to a sub-category like "Handbags" or
 * "Heels". Used by the breadcrumb in `ProductDetailsView` and the
 * Category Landing Page (B-10) until Phase 3 ships a real taxonomy.
 *
 * Returns the sub-category localised to the active language. Falls
 * back to the top-level category if no sub-category matches.
 */

const SUB_CATEGORY_RULES: Record<
  string,
  { keywords: string[]; subEn: string; subAr: string }[]
> = {
  Bags: [
    { keywords: ["handbag", "tote", "shoulder"], subEn: "Handbags", subAr: "حقائب يد" },
    { keywords: ["clutch", "evening"], subEn: "Clutches", subAr: "كلاتش" },
    { keywords: ["backpack"], subEn: "Backpacks", subAr: "حقائب ظهر" },
    { keywords: ["crossbody"], subEn: "Crossbody", subAr: "كروسبودي" },
    { keywords: ["bucket"], subEn: "Bucket Bags", subAr: "حقائب دلو" },
  ],
  Shoes: [
    { keywords: ["heel", "stiletto", "pump"], subEn: "Heels", subAr: "كعب" },
    { keywords: ["sneaker"], subEn: "Sneakers", subAr: "أحذية رياضية" },
    { keywords: ["flat", "mule", "sandal"], subEn: "Flats", subAr: "حذاء مسطح" },
  ],
  Dresses: [
    { keywords: ["maxi", "gown", "mermaid"], subEn: "Maxi & Gowns", subAr: "ماكسي وفساتين طويلة" },
    { keywords: ["midi"], subEn: "Midi Dresses", subAr: "فساتين ميدي" },
    { keywords: ["kaftan", "abaya"], subEn: "Kaftans & Abayas", subAr: "قفطان وعباية" },
    { keywords: ["wedding", "bride"], subEn: "Wedding", subAr: "أعراس" },
  ],
  Accessories: [
    { keywords: ["watch"], subEn: "Watches", subAr: "ساعات" },
    { keywords: ["earring", "necklace", "bracelet", "ring"], subEn: "Jewellery", subAr: "مجوهرات" },
    { keywords: ["scarf", "hijab"], subEn: "Scarves & Hijabs", subAr: "أوشحة وحجابات" },
    { keywords: ["sunglass"], subEn: "Sunglasses", subAr: "نظارات شمسية" },
    { keywords: ["belt"], subEn: "Belts", subAr: "أحزمة" },
  ],
  Clothing: [
    { keywords: ["blazer", "jacket"], subEn: "Blazers & Jackets", subAr: "بليزر وجاكيت" },
    { keywords: ["blouse", "shirt"], subEn: "Tops", subAr: "بلوزات" },
    { keywords: ["trouser", "pants", "wide-leg"], subEn: "Trousers", subAr: "بنطلون" },
    { keywords: ["cardigan", "sweater", "knit"], subEn: "Knitwear", subAr: "تريكو" },
  ],
};

export function deriveSubCategory(
  category: string,
  titleEn: string,
  language: "en" | "ar",
): string {
  const rules = SUB_CATEGORY_RULES[category];
  if (!rules) return category;
  const titleLower = titleEn.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((k) => titleLower.includes(k))) {
      return language === "ar" ? rule.subAr : rule.subEn;
    }
  }
  return category;
}
