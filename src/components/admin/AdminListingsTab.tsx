"use client";

import { useState } from "react";
import type { AdminListingSummary } from "@/services/admin/actions";

interface AdminListingsTabProps {
  listings: AdminListingSummary[];
  onApprove: (listingId: string) => Promise<void>;
  onReject: (listingId: string, reason: string) => Promise<void>;
  onFeature: (
    listingId: string,
    sortOrder: number,
    noteEn: string,
    noteAr: string
  ) => Promise<void>;
  lang: "en" | "ar";
}

export function AdminListingsTab({
  listings,
  onApprove,
  onReject,
  onFeature,
  lang,
}: AdminListingsTabProps) {
  const isAr = lang === "ar";

  const [rejectingListing, setRejectingListing] = useState<AdminListingSummary | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [featuringListing, setFeaturingListing] = useState<AdminListingSummary | null>(null);
  const [sortOrder, setSortOrder] = useState(1);
  const [featureNoteEn, setFeatureNoteEn] = useState("");
  const [featureNoteAr, setFeatureNoteAr] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await onApprove(id);
    } finally {
      setProcessingId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectingListing || !rejectReason.trim()) return;
    try {
      setProcessingId(rejectingListing.id);
      await onReject(rejectingListing.id, rejectReason.trim());
      setRejectingListing(null);
      setRejectReason("");
    } finally {
      setProcessingId(null);
    }
  };

  const submitFeature = async () => {
    if (!featuringListing) return;
    try {
      setProcessingId(featuringListing.id);
      await onFeature(
        featuringListing.id,
        sortOrder,
        featureNoteEn.trim(),
        featureNoteAr.trim()
      );
      setFeaturingListing(null);
      setFeatureNoteEn("");
      setFeatureNoteAr("");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">
            {isAr ? "مراجعة المنتجات والأسرَّة المعلقة" : "Pending Listings Queue"}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {isAr
              ? "مراجعة المنتجات المدرجة حديثاً وتدقيق الأصالة قبل إظهارها في السوق"
              : "Verify newly created product listings before they appear in public search"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface w-fit">
          <span className="material-symbols-outlined text-[16px]">inventory_2</span>
          {listings.length} {isAr ? "منتجات تنتظر المراجعة" : "items pending"}
        </span>
      </div>

      {/* List */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-container-high py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
            task_alt
          </span>
          <h3 className="font-semibold text-on-surface">
            {isAr ? "جميع المنتجات مراجعة بالكامل" : "All listings reviewed"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {isAr
              ? "لا توجد آگهی‌های معلق في انتظار موافقة المشرف حالياً"
              : "There are no pending listings awaiting admin verification."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {listings.map((item) => (
            <div
              key={item.id}
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-surface-container-high bg-surface p-5 transition-shadow hover:shadow-sm"
            >
              {/* Info */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {item.category}
                  </span>
                  {item.reportCount > 0 && (
                    <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600">
                      {item.reportCount} {isAr ? "بلاغات" : "reports"}
                    </span>
                  )}
                  <time className="text-xs text-on-surface-variant">
                    {new Date(item.createdAt).toLocaleDateString(isAr ? "ar-AE" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>

                <h3 className="text-base font-bold text-on-surface">
                  {isAr ? item.titleAr : item.titleEn}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                  <span>
                    {isAr ? "البائع:" : "Seller:"}{" "}
                    <strong className="text-on-surface">{isAr ? item.sellerNameAr : item.sellerNameEn}</strong> ({item.sellerEmail})
                  </span>
                  <span>•</span>
                  <span>
                    {isAr ? "السعر:" : "Price:"}{" "}
                    <strong className="text-primary text-sm font-extrabold">
                      {(item.priceMinor / 100).toLocaleString("en-US")} AED
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-surface-container-low">
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => handleApprove(item.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {isAr ? "قبول وتأكيد" : "Approve Listing"}
                </button>

                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => setFeaturingListing(item)}
                  className="flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">star</span>
                  {isAr ? "تمييز" : "Feature"}
                </button>

                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => setRejectingListing(item)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  {isAr ? "رفض" : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-surface-container-high space-y-4">
            <h3 className="text-lg font-bold text-on-surface">
              {isAr ? "رفض آگهی" : "Reject Listing"}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {isAr
                ? "سبب عدم القبول (سيتم حفظه في لاگ التفتيش وإخطار البائع):"
                : "Please specify the rejection reason to send to the seller:"}
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={
                isAr
                  ? "مثال: عدم وضوح صور الأصالة، تفاصيل غير متطابقة..."
                  : "e.g. Inconsistent authenticity proof, poor image quality..."
              }
              className="w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingListing(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={submitReject}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isAr ? "تأكيد الرفض" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {featuringListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-surface-container-high space-y-4">
            <h3 className="text-lg font-bold text-on-surface">
              {isAr ? "إضافة إلى القائمة المميزة" : "Feature Listing"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "ترتيب الظهور (Sort Order)" : "Sort Order"}
                </label>
                <input
                  type="number"
                  min={1}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "ملاحظة التميز (English)" : "Featured Note (English)"}
                </label>
                <input
                  type="text"
                  value={featureNoteEn}
                  onChange={(e) => setFeatureNoteEn(e.target.value)}
                  placeholder="e.g. Editor's Pick — Exceptional Condition"
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "ملاحظة التميز (عربي)" : "Featured Note (Arabic)"}
                </label>
                <input
                  type="text"
                  value={featureNoteAr}
                  onChange={(e) => setFeatureNoteAr(e.target.value)}
                  placeholder="مثال: اختيار المحرر — بحالة ممتازة نادرة"
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFeaturingListing(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={submitFeature}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary/90"
              >
                {isAr ? "حفظ التميز" : "Set Featured"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
