"use client";

import React, { useState } from "react";
import type { AdminDisputeSummary } from "@/services/admin/actions";

interface AdminDisputesTabProps {
  disputes: AdminDisputeSummary[];
  onResolve: (
    disputeId: string,
    status: "resolved" | "rejected",
    noteEn: string,
    noteAr: string
  ) => Promise<void>;
  lang: "en" | "ar";
}

export function AdminDisputesTab({
  disputes,
  onResolve,
  lang,
}: AdminDisputesTabProps) {
  const isAr = lang === "ar";

  const [selectedDispute, setSelectedDispute] = useState<AdminDisputeSummary | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<"resolved" | "rejected">("resolved");
  const [noteEn, setNoteEn] = useState("");
  const [noteAr, setNoteAr] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const submitResolution = async () => {
    if (!selectedDispute) return;
    try {
      setProcessingId(selectedDispute.id);
      await onResolve(selectedDispute.id, resolutionStatus, noteEn.trim(), noteAr.trim());
      setSelectedDispute(null);
      setNoteEn("");
      setNoteAr("");
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
            {isAr ? "إدارة النزاعات والمطالبات" : "Order Disputes & Claims"}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {isAr
              ? "مراجعة شكاوى طلبات الشراء، الاسترجاع، وقرارات التحكيم بین المشتری والبائع"
              : "Review buyer claims, product return disputes, and render arbitration decisions"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 w-fit">
          <span className="material-symbols-outlined text-[16px]">gavel</span>
          {disputes.length} {isAr ? "نزاعات نشطة" : "active disputes"}
        </span>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-container-high py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
            verified_user
          </span>
          <h3 className="font-semibold text-on-surface">
            {isAr ? "لا توجد نزاعات مفتوحة" : "No open disputes"}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {isAr
              ? "جميع طلبات الشراء والنزاعات تم تسويتها بنجاح"
              : "All customer disputes have been resolved."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="rounded-2xl border border-surface-container-high bg-surface p-5 space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-container-low pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {dispute.orderId}
                  </span>
                  <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600">
                    {dispute.reason}
                  </span>
                </div>

                <time className="text-xs text-on-surface-variant">
                  {new Date(dispute.createdAt).toLocaleDateString(isAr ? "ar-AE" : "en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-on-surface-variant">
                  {isAr ? "المشتري صاحب النزاع:" : "Buyer Email:"}{" "}
                  <strong className="text-on-surface">{dispute.buyerEmail}</strong>
                </p>
                <div className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface italic">
                  "{dispute.body}"
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {dispute.status === "open" ? (
                  <button
                    type="button"
                    disabled={processingId === dispute.id}
                    onClick={() => setSelectedDispute(dispute)}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">gavel</span>
                    {isAr ? "اصدار القرار" : "Resolve Dispute"}
                  </button>
                ) : (
                  <span className="rounded-lg bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant uppercase">
                    {dispute.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Dialog */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-xl border border-surface-container-high space-y-4">
            <h3 className="text-lg font-bold text-on-surface">
              {isAr ? "قرار تحكيم النزاع" : "Dispute Arbitration Decision"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  {isAr ? "النتيجة" : "Decision outcome"}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setResolutionStatus("resolved")}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold border transition ${
                      resolutionStatus === "resolved"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-surface border-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {isAr ? "قبول النزاع (إعادة المبلغ)" : "Resolve & Refund Buyer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionStatus("rejected")}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold border transition ${
                      resolutionStatus === "rejected"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-surface border-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {isAr ? "رفض النزاع (تحرير للبائع)" : "Reject Dispute Claims"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "سبب وملاحظة القرار (English)" : "Resolution Note (English)"}
                </label>
                <textarea
                  rows={2}
                  value={noteEn}
                  onChange={(e) => setNoteEn(e.target.value)}
                  placeholder="e.g. Return approved due to undisclosed leather damage."
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "سبب وملاحظة القرار (عربي)" : "Resolution Note (Arabic)"}
                </label>
                <textarea
                  rows={2}
                  value={noteAr}
                  onChange={(e) => setNoteAr(e.target.value)}
                  placeholder="مثال: تم قبول الإرجاع بسبب تلف الجلد غير المذكور في الوصف."
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={submitResolution}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary/90"
              >
                {isAr ? "حفظ وتوثيق القرار" : "Submit Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
