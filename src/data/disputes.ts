/**
 * Disputes dataset (H-44). Each dispute is opened by the buyer from an
 * order details screen and tracks through "open" → "investigating" →
 * "resolved" with a timeline of status events.
 *
 * Phase 1 ships 0 disputes (Phase 3 requires real support integration).
 * We still export the type + helper so the views compile and tests can
 * simulate the empty state.
 */

export type DisputeReason =
  | "not_received"
  | "wrong_item"
  | "damaged"
  | "not_as_described"
  | "counterfeit"
  | "other";

export type DisputeStatus = "open" | "investigating" | "resolved";

export const DISPUTE_REASONS_EN: Record<DisputeReason, string> = {
  not_received: "Item not received",
  wrong_item: "Wrong item shipped",
  damaged: "Item damaged in transit",
  not_as_described: "Item not as described",
  counterfeit: "Suspected counterfeit",
  other: "Other",
};

export const DISPUTE_REASONS_AR: Record<DisputeReason, string> = {
  not_received: "لم أستلم المنتج",
  wrong_item: "تم شحن منتج خاطئ",
  damaged: "منتج تالف عند الاستلام",
  not_as_described: "المنتج لا يطابق الوصف",
  counterfeit: "يشتبه بأنه مقلد",
  other: "أخرى",
};

export interface DisputeTimelineEvent {
  status: DisputeStatus;
  date: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  reason: DisputeReason;
  body: string;
  photos: string[];
  status: DisputeStatus;
  date: string;
  timeline: DisputeTimelineEvent[];
}

export const DEFAULT_DISPUTES: Dispute[] = [];
