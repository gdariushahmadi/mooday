/**
 * Reports dataset (H-40). Stores the user's submitted reports against
 * listings or users. Each report gets an opaque case ID for future
 * follow-up.
 *
 * Phase 1 seeds 1 example report so the List-My-Reports screen has
 * something to show. Phase 3 will append to this list.
 */

export type ReportTargetKind = "listing" | "user";
export type ReportReason =
  | "counterfeit"
  | "inappropriate"
  | "spam"
  | "wrong_category"
  | "stolen"
  | "other";
export type ReportStatus = "open" | "investigating" | "resolved";

export const REPORT_REASONS_EN: Record<ReportReason, string> = {
  counterfeit: "Counterfeit or fake item",
  inappropriate: "Inappropriate content",
  spam: "Spam or scam",
  wrong_category: "Listed in wrong category",
  stolen: "Suspected stolen goods",
  other: "Other",
};

export const REPORT_REASONS_AR: Record<ReportReason, string> = {
  counterfeit: "منتج مقلد أو مزيف",
  inappropriate: "محتوى غير لائق",
  spam: "رسائل مزعجة أو احتيال",
  wrong_category: "مصنف في فئة خاطئة",
  stolen: "يشتبه بأنه مسروق",
  other: "أخرى",
};

export interface ReportRecord {
  id: string;
  /** Human-readable case number, shown in the confirmation. */
  caseNumber: string;
  kind: ReportTargetKind;
  /** Listing id or seller id (free-form string for Phase 1). */
  targetId: string;
  targetLabelEn: string;
  targetLabelAr: string;
  reason: ReportReason;
  body: string;
  photos: string[];
  status: ReportStatus;
  date: string;
}

let _seq = 1;
function makeCase(): string {
  return `MOODAY-${String(_seq++).padStart(5, "0")}`;
}

function isoDaysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

export const DEFAULT_REPORTS: ReportRecord[] = [
  {
    id: "rep-0001",
    caseNumber: makeCase(),
    kind: "listing",
    targetId: "sneakers-white",
    targetLabelEn: "White Leather Sneakers",
    targetLabelAr: "حذاء أبيض من الجلد",
    reason: "wrong_category",
    body:
      "The sneakers are listed under Bags but they're footwear. Please move.",
    photos: [],
    status: "resolved",
    date: isoDaysAgo(12),
  },
];
