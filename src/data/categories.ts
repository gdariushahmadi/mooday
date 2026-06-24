export const CATEGORIES = [
  "All",
  "Dresses",
  "Shoes",
  "Bags",
  "Accessories",
  "Clothing",
] as const;

export const CATEGORIES_AR: Record<string, string> = {
  All: "الكل",
  Dresses: "فساتين",
  Shoes: "أحذية",
  Bags: "حقائب",
  Accessories: "إكسسوارات",
  Clothing: "ملابس",
};

export const SELL_CATEGORIES = CATEGORIES.filter((c) => c !== "All");

export const CONDITIONS = [
  "All",
  "New with Tags",
  "Excellent Condition",
  "Gently Used",
] as const;

export const CONDITIONS_AR: Record<string, string> = {
  All: "الكل",
  "New with Tags": "جديد بالملصقات",
  "Excellent Condition": "حالة ممتازة",
  "Gently Used": "مستعمل خفيف",
};
