/**
 * User-submitted reviews (H-39). The existing `REVIEWS` dataset in
 * `./reviews.ts` holds seller-side aggregate reviews; this file owns
 * the buyer's per-order reviews they've written.
 *
 * Each `MyReview` corresponds to a delivered order (`Order.status ===
 * "delivered"`). Phase 3 will swap these seed entries for real
 * per-user queries.
 */

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface MyReview {
  id: string;
  orderId: string;
  sellerKey: string;
  rating: ReviewRating;
  title: string;
  body: string;
  photos: string[];
  date: string;
  isVerifiedPurchase: boolean;
}

/** Helper: 5 seed reviews authored by the current user. */
function isoDaysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

export const DEFAULT_MY_REVIEWS: MyReview[] = [
  {
    id: "myrev-0001",
    orderId: "ord-0003",
    sellerKey: "sarah",
    rating: 5,
    title: "Exactly as described",
    body: "Loved the kaftan — photos were accurate and shipping was on time.",
    photos: [],
    date: isoDaysAgo(8),
    isVerifiedPurchase: true,
  },
  {
    id: "myrev-0002",
    orderId: "ord-0005",
    sellerKey: "layla",
    rating: 4,
    title: "Great condition, fast reply",
    body: "Stilettos were in excellent shape. Communication could be a bit faster.",
    photos: [],
    date: isoDaysAgo(22),
    isVerifiedPurchase: true,
  },
  {
    id: "myrev-0003",
    orderId: "ord-0009",
    sellerKey: "amira",
    rating: 5,
    title: "Stunning piece",
    body: "The watch exceeded my expectations. Will buy from this seller again.",
    photos: [],
    date: isoDaysAgo(36),
    isVerifiedPurchase: true,
  },
  {
    id: "myrev-0004",
    orderId: "ord-0011",
    sellerKey: "hana",
    rating: 4,
    title: "Loved it",
    body: "The bracelet was even prettier in person. Smooth transaction overall.",
    photos: [],
    date: isoDaysAgo(40),
    isVerifiedPurchase: true,
  },
  {
    id: "myrev-0005",
    orderId: "ord-0015",
    sellerKey: "sarah",
    rating: 5,
    title: "Repeat buyer",
    body: "Always a pleasure to shop here. Items match the description.",
    photos: [],
    date: isoDaysAgo(50),
    isVerifiedPurchase: true,
  },
];
