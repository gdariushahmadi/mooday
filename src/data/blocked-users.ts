/**
 * Blocked users dataset (H-43).
 *
 * Phase 1 ships 2 blocked users with explicit names + reasons. The
 * CRUD lives on `AppContext` (`blockUser`, `unblockUser`, `setBlockedUsers`).
 */

export interface BlockedUser {
  id: string;
  /** Display name in the chat-thread / profile style (EN). */
  nameEn: string;
  nameAr: string;
  /** Avatar URL. */
  avatar: string;
  /** Optional reason the user picked when blocking. */
  reasonEn?: string;
  reasonAr?: string;
  date: string;
}

function isoDaysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

export const DEFAULT_BLOCKED_USERS: BlockedUser[] = [
  {
    id: "blk-1",
    nameEn: "Tariq R.",
    nameAr: "طارق ر.",
    avatar: "/sellers/sarah.jpg",
    reasonEn: "Spam messages",
    reasonAr: "رسائل مزعجة",
    date: isoDaysAgo(7),
  },
  {
    id: "blk-2",
    nameEn: "Maryam K.",
    nameAr: "مريم ك.",
    avatar: "/sellers/layla.jpg",
    reasonEn: "Inappropriate listings",
    reasonAr: "عروض غير لائقة",
    date: isoDaysAgo(21),
  },
];
