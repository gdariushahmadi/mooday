/**
 * Mappers for chat, notifications, reviews, reports, and disputes.
 *
 * Each function is small and pure: DB row(s) → view model. The view
 * models are the Phase 1 shapes that already drive every screen, so
 * the swap is purely data-source.
 */
import type { ChatMessage, ChatThread } from "@/context/AppContext";
import type {
  ChatMessageRecord,
  ChatThreadRecord,
  NotificationRecord,
  SellerReviewRecord,
  ReportRecord,
  DisputeRecord,
  DisputeTimelineEvent,
} from "./contracts";
import type { AppNotification } from "@/data/notifications";
import type { MyReview } from "@/data/my-reviews";
import type { ReportRecord as ViewReport } from "@/data/reports";
import type { Dispute } from "@/data/disputes";

// ---------- chat ----------

export function mapThreadFromRemote(
  record: ChatThreadRecord,
  currentUserId: string,
  messages: ChatMessageRecord[],
): ChatThread {
  return {
    id: record.id,
    sellerName:
      record.sellerId === currentUserId
        ? "Buyer"
        : "Seller",
    sellerAvatar: "/sellers/placeholder.svg",
    productTitle: record.listingTitleEn,
    productImage: record.listingImageUrl,
    productPrice: record.priceMinorAtCreation / 100,
    lastMessage: record.lastMessageBody ?? "",
    lastMessageTime: record.lastMessageAt ?? record.createdAt,
    unread: 0, // computed by caller from lastReadAt map
    messages: messages.map((m) => mapMessageFromRemote(m, currentUserId)),
  };
}

export function mapMessageFromRemote(
  record: ChatMessageRecord,
  currentUserId: string,
): ChatMessage {
  return {
    id: record.id,
    sender: record.senderId === currentUserId ? "user" : "seller",
    text: record.body,
    time: new Date(record.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

// ---------- notifications ----------

const NOTIFICATION_KIND_TO_VIEW: Record<
  NotificationRecord["kind"],
  AppNotification["type"]
> = {
  chat: "chat",
  offer: "offer",
  follow: "follow",
  price_drop: "price_drop",
  like: "like",
  sold: "item_saved",
  order: "system",
  system: "system",
};

type ViewTargetKind = NonNullable<AppNotification["target"]>["kind"];
const TARGET_KIND_TO_VIEW: Record<
  NotificationRecord["targetKind"],
  ViewTargetKind | null
> = {
  chat: "chat",
  product: "product",
  seller: "seller",
  order: "listing",
  none: null,
};

export function mapNotificationFromRemote(
  record: NotificationRecord,
): AppNotification {
  const targetKind = TARGET_KIND_TO_VIEW[record.targetKind];
  const target =
    targetKind && record.targetId
      ? { kind: targetKind, id: record.targetId }
      : undefined;
  return {
    id: record.id,
    type: NOTIFICATION_KIND_TO_VIEW[record.kind],
    titleEn: record.titleEn,
    titleAr: record.titleAr,
    bodyEn: record.bodyEn,
    bodyAr: record.bodyAr,
    date: record.createdAt,
    isUnread: record.isUnread,
    target,
  };
}

// ---------- reviews ----------

export interface MapReviewInput {
  record: SellerReviewRecord;
  sellerNameEn: string;
  sellerNameAr: string;
  sellerAvatar: string;
  productTitleEn?: string;
  productTitleAr?: string;
  productImage?: string;
}

export function mapReviewFromRemote(input: MapReviewInput): MyReview {
  const { record } = input;
  return {
    id: record.id,
    orderId: record.orderId ?? "",
    sellerKey: record.sellerId,
    rating: Math.max(1, Math.min(5, record.rating)) as MyReview["rating"],
    title: record.bodyEn.slice(0, 60),
    body: record.bodyEn,
    photos: record.imageUrl ? [record.imageUrl] : [],
    date: record.createdAt,
    isVerifiedPurchase: record.orderId !== null,
  };
}

/**
 * Map a server SellerReviewRecord into the public Review shape used by
 * PublicSellerProfile. The reviewer's display name + avatar come from the
 * snapshot columns captured at submission time.
 */
export interface PublicReview {
  id: string;
  sellerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string;
  textEn: string;
  textAr: string;
  quickTags: string[];
  verifiedPurchase: boolean;
  orderId: string | null;
}

export function mapPublicReviewFromRemote(
  record: SellerReviewRecord,
): PublicReview {
  return {
    id: record.id,
    sellerId: record.sellerId,
    reviewerName: record.reviewerNameEn,
    reviewerAvatar: record.reviewerAvatar,
    rating: Math.max(1, Math.min(5, record.rating)) as PublicReview["rating"],
    date: record.createdAt,
    textEn: record.bodyEn,
    textAr: record.bodyAr,
    quickTags: record.tags,
    verifiedPurchase: record.orderId !== null,
    orderId: record.orderId,
  };
}

// ---------- reports ----------

export function mapReportFromRemote(record: ReportRecord): ViewReport {
  // DB reports use a tighter enum: counterfeit|offensive|spam|mismatch|other.
  // The view-model union is broader (adds inappropriate|stolen|wrong_category),
  // so we map with sensible fallbacks.
  const reason: ViewReport["reason"] =
    record.reason === "offensive" ? "inappropriate" :
    record.reason === "mismatch" ? "wrong_category" :
    (record.reason as ViewReport["reason"]);
  return {
    id: record.id,
    caseNumber: record.caseNumber,
    kind: record.target === "user" ? "user" : "listing",
    targetId: record.targetId,
    targetLabelEn: "",
    targetLabelAr: "",
    reason,
    body: record.body,
    photos: [],
    status: record.status === "dismissed" ? "resolved" : record.status,
    date: record.createdAt,
  };
}

// ---------- disputes ----------

export function mapDisputeFromRemote(record: DisputeRecord): Dispute {
  const timeline: Dispute["timeline"] = record.timeline.map((e) => ({
    status:
      e.status === "under_review"
        ? "investigating"
        : e.status === "rejected"
          ? "resolved"
          : e.status,
    date: e.at,
    descriptionEn: e.noteEn,
    descriptionAr: e.noteAr,
  }));
  return {
    id: record.id,
    orderId: record.orderId,
    reason: "other",
    body: record.body,
    photos: [],
    status:
      record.status === "under_review"
        ? "investigating"
        : record.status === "rejected"
          ? "resolved"
          : record.status,
    date: record.createdAt,
    timeline,
  };
}

export type { DisputeTimelineEvent };
