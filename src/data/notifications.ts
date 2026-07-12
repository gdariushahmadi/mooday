/**
 * Mock notifications/activity events for F-27 (Activity feed) and
 * F-31 (Notifications Centre). Local-first, no backend.
 *
 * For Phase 1 we ship ~22 events covering all six event types the
 * showcase calls out: chat, offer, follow, price-drop, like, item-saved.
 * Each event has an `isUnread` flag so the bell icon can show a count
 * and the activity feed can highlight new events.
 *
 * Phase 3 will replace these with real per-user notifications.
 */

import { defaultProducts, SEED_VERSION } from "./products";

export type NotificationType =
  | "chat"
  | "offer"
  | "follow"
  | "price_drop"
  | "like"
  | "item_saved"
  | "system";

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  "chat",
  "offer",
  "follow",
  "price_drop",
  "like",
  "item_saved",
  "system",
] as const;

/** Localised type labels for the filter chips on F-31. */
export const NOTIFICATION_TYPE_LABEL_EN: Record<NotificationType, string> = {
  chat: "Chats",
  offer: "Offers",
  follow: "Follows",
  price_drop: "Price drops",
  like: "Likes",
  item_saved: "Saved",
  system: "System",
};

export const NOTIFICATION_TYPE_LABEL_AR: Record<NotificationType, string> = {
  chat: "المحادثات",
  offer: "العروض",
  follow: "المتابعات",
  price_drop: "تخفيضات",
  like: "الإعجابات",
  item_saved: "المحفوظات",
  system: "النظام",
};

/** Material Symbols icon name per type (rendered in the badge). */
export const NOTIFICATION_ICON: Record<NotificationType, string> = {
  chat: "chat",
  offer: "local_offer",
  follow: "person_add",
  price_drop: "trending_down",
  like: "favorite",
  item_saved: "bookmark",
  system: "campaign",
};

export interface AppNotification {
  id: string;
  type: NotificationType;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  /** ISO date string. */
  date: string;
  isUnread: boolean;
  /** Deep-link target. Optional. */
  target?: {
    /** e.g. "chat:thread-id" or "product:product-id" or "seller:seller-id". */
    kind: "chat" | "product" | "seller" | "listing";
    id: string;
  };
  /** Related product thumbnail (if any). */
  productImage?: string;
}

// ---------- Helpers ----------

function isoMinsAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

let _seq = 1;
function id(): string {
  return `notif-${String(_seq++).padStart(3, "0")}`;
}

function productImageAt(idx: number): string | undefined {
  return defaultProducts[idx % defaultProducts.length]?.image;
}

// ---------- Seed data ----------

export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  // Chat — recent, unread
  {
    id: id(),
    type: "chat",
    titleEn: "New message from Sarah's Vintage",
    titleAr: "رسالة جديدة من عتيق سارة",
    bodyEn: "Yes, it's still available — happy to share more photos.",
    bodyAr: "نعم، لا تزال متوفرة — يسعدني مشاركة المزيد من الصور.",
    date: isoMinsAgo(8),
    isUnread: true,
    target: { kind: "chat", id: "chat-handbag-tan" },
    productImage: productImageAt(0),
  },
  // Offer — recent, unread
  {
    id: id(),
    type: "offer",
    titleEn: "Offer received: AED 1,000 on Gold Kaftan",
    titleAr: "عرض جديد: 1000 درهم على قفطان ذهبي",
    bodyEn: "Layla M. sent an offer for your Gold Silk Kaftan. Tap to respond.",
    bodyAr: "أرسلت ليلى م. عرضاً على قفطانك الذهبي. اضغطي للرد.",
    date: isoMinsAgo(22),
    isUnread: true,
    target: { kind: "chat", id: "chat-handbag-tan" },
    productImage: productImageAt(2),
  },
  // Price drop — unread
  {
    id: id(),
    type: "price_drop",
    titleEn: "Price dropped on your saved item",
    titleAr: "انخفاض سعر منتج محفوظ",
    bodyEn:
      "Hana Luxe reduced the Gold Silk Kaftan from AED 2,400 to AED 1,200.",
    bodyAr: "خفضت هنا لوكس قفطان الحرير الذهبي من 2400 إلى 1200 درهم.",
    date: isoMinsAgo(45),
    isUnread: true,
    target: { kind: "product", id: "gold-kaftan" },
    productImage: productImageAt(2),
  },
  // Like — unread
  {
    id: id(),
    type: "like",
    titleEn: "3 people saved your Emerald Abaya",
    titleAr: "3 أشخاص حفظوا عباءتك الزمردية",
    bodyEn: "Your Emerald Evening Abaya is getting attention this week.",
    bodyAr: "عباءة السهرة الزمردية تحظى باهتمام هذا الأسبوع.",
    date: isoMinsAgo(60),
    isUnread: true,
    target: { kind: "listing", id: "emerald-evening-abaya" },
    productImage: productImageAt(1),
  },
  // Follow — unread
  {
    id: id(),
    type: "follow",
    titleEn: "New follower",
    titleAr: "متابع جديد",
    bodyEn: "Layla M. started following your closet.",
    bodyAr: "بدأت ليلى م. بمتابعة خزانتك.",
    date: isoMinsAgo(90),
    isUnread: true,
    target: { kind: "seller", id: "sarah" },
  },
  // Offer accepted
  {
    id: id(),
    type: "offer",
    titleEn: "Offer accepted!",
    titleAr: "تم قبول عرضك!",
    bodyEn: "Hana Luxe accepted your offer for Classic Stiletto Heels.",
    bodyAr: "قبلت هنا لوكس عرضك للكعب الكلاسيكي.",
    date: isoMinsAgo(180),
    isUnread: false,
    target: { kind: "chat", id: "chat-handbag-tan" },
    productImage: productImageAt(4),
  },
  // Chat — older, read
  {
    id: id(),
    type: "chat",
    titleEn: "New message from Amira Style",
    titleAr: "رسالة جديدة من أميرة ستايل",
    bodyEn: "Sure, I can ship tomorrow morning before noon.",
    bodyAr: "بالتأكيد، يمكنني الشحن صباح الغد قبل الظهر.",
    date: isoMinsAgo(360),
    isUnread: false,
    target: { kind: "chat", id: "chat-handbag-tan" },
  },
  // Saved — read
  {
    id: id(),
    type: "item_saved",
    titleEn: "Item saved",
    titleAr: "تم حفظ منتج",
    bodyEn: "Tariq saved your listed Linen Midi Dress.",
    bodyAr: "حفظ طارق فستانك الكتان ميدي المعروض.",
    date: isoMinsAgo(720),
    isUnread: false,
    target: { kind: "listing", id: "midi-dress" },
    productImage: productImageAt(3),
  },
  // Like — read
  {
    id: id(),
    type: "like",
    titleEn: "5 new likes",
    titleAr: "5 إعجابات جديدة",
    bodyEn: "Your listings have 5 new likes this week.",
    bodyAr: "لمنتجاتك 5 إعجابات جديدة هذا الأسبوع.",
    date: isoMinsAgo(1440),
    isUnread: false,
  },
  // Follow — read
  {
    id: id(),
    type: "follow",
    titleEn: "2 new followers",
    titleAr: "متابعان جديدان",
    bodyEn: "Amira Style and Tariq started following you.",
    bodyAr: "بدأت أميرة ستايل وطارق بمتابعتك.",
    date: isoMinsAgo(2160),
    isUnread: false,
  },
  // System
  {
    id: id(),
    type: "system",
    titleEn: "Welcome to Mooday Phase 1",
    titleAr: "أهلاً بك في مودي Phase 1",
    bodyEn:
      "Your buyer-side experience is now live. Listing your first item is just a tap away.",
    bodyAr:
      "تجربتك كـ مشتري أصبحت متاحة. إضافة أول منتج على بُعد نقرة واحدة.",
    date: isoMinsAgo(2880),
    isUnread: false,
  },
  // Price drop — read
  {
    id: id(),
    type: "price_drop",
    titleEn: "Price dropped",
    titleAr: "انخفاض السعر",
    bodyEn: "The Silver Heels you saved are now AED 600 (was AED 800).",
    bodyAr: "الكعب الفضي الذي حفظتِه أصبح 600 درهم (كان 800).",
    date: isoMinsAgo(4320),
    isUnread: false,
    target: { kind: "product", id: "red-sole-heels" },
    productImage: productImageAt(4),
  },
  // Offer — read
  {
    id: id(),
    type: "offer",
    titleEn: "Your offer expired",
    titleAr: "انتهت صلاحية عرضك",
    bodyEn: "Your AED 700 offer on the Woven Tote expired after 48 hours.",
    bodyAr: "انتهى عرضك بقيمة 700 درهم على الحقيبة المنسوجة بعد 48 ساعة.",
    date: isoMinsAgo(5760),
    isUnread: false,
    target: { kind: "product", id: "woven-tote" },
    productImage: productImageAt(7),
  },
  // Like — read
  {
    id: id(),
    type: "like",
    titleEn: "Like burst",
    titleAr: "موجة إعجابات",
    bodyEn: "10 people saved your Designer Sunglasses in the last hour.",
    bodyAr: "10 أشخاص حفظوا نظاراتك الشمسية في آخر ساعة.",
    date: isoMinsAgo(7200),
    isUnread: false,
    target: { kind: "listing", id: "designer-sunglasses" },
    productImage: productImageAt(10),
  },
  // Chat — read
  {
    id: id(),
    type: "chat",
    titleEn: "New message from Layla M.",
    titleAr: "رسالة جديدة من ليلى م.",
    bodyEn: "Hi! I'm interested in the bag — can we meet at DIFC?",
    bodyAr: "مرحباً! مهتمة بالحقيبة — هل يمكننا اللقاء في مركز دبي المالي؟",
    date: isoMinsAgo(8640),
    isUnread: false,
    target: { kind: "chat", id: "chat-handbag-tan" },
  },
  // Follow — read
  {
    id: id(),
    type: "follow",
    titleEn: "New follower",
    titleAr: "متابع جديد",
    bodyEn: "Maryam K. started following your closet.",
    bodyAr: "بدأت مريم ك. بمتابعة خزانتك.",
    date: isoMinsAgo(11520),
    isUnread: false,
  },
];

/** Count of unread notifications. */
export function unreadCount(
  notifications: AppNotification[],
): number {
  return notifications.reduce(
    (acc, n) => acc + (n.isUnread ? 1 : 0),
    0,
  );
}

/** Localised "x minutes ago" relative time. */
export function formatRelativeTime(iso: string, isAr: boolean): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (isAr) {
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return new Date(iso).toLocaleDateString("ar");
  }

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Reference SEED_VERSION to ensure data file is invalidated when seed changes.
export const NOTIFS_SEED_VERSION = SEED_VERSION;
