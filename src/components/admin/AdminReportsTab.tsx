"use client";

import React, { useState } from "react";
import type { AdminReportSummary } from "@/services/admin/actions";

interface AdminReportsTabProps {
  reports: AdminReportSummary[];
  onTriage: (
    reportId: string,
    status: "investigating" | "resolved" | "dismissed",
    note?: string
  ) => Promise<void>;
  lang: "en" | "ar";
}

export function AdminReportsTab({
  reports,
  onTriage,
  lang,
}: AdminReportsTabProps) {
  const isAr = lang === "ar";

  const [selectedReport, setSelectedReport] = useState<AdminReportSummary | null>(null);
  const [triageStatus, setTriageStatus] = useState<"investigating" | "resolved" | "dismissed">(
    "investigating"
  );
  const [triageNote, setTriageNote] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const submitTriage = async () => {
    if (!selectedReport) return;
    try {
      setProcessingId(selectedReport.id);
      await onTriage(selectedReport.id, triageStatus, triageNote.trim());
      setSelectedReport(null);
      setTriageNote("");
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
            {isAr ? "بلاغات وتقارير المخالفات" : "User & Content Reports"}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {isAr
              ? "متابعة بلاغات المستخدمين حول الإعلانات المشبوهة أو الحسابات المخالفة"
              : "Review reports submitted by users regarding items or conduct"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 w-fit">
          <span className="material-symbols-outlined text-[16px]">flag</span>
          {reports.length} {isAr ? "بلاغات نشطة" : "active reports"}
        </span>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto rounded-2xl border border-surface-container-high bg-surface shadow-sm">
        <table className="w-full text-left text-sm text-on-surface rtl:text-right">
          <thead className="bg-surface-container-low text-xs uppercase font-semibold text-on-surface-variant border-b border-surface-container-high">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "رقم القضية" : "Case #"}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "الهدف" : "Target"}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "السبب" : "Reason"}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "المُبلِّغ" : "Reporter"}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "الحالة" : "Status"}
              </th>
              <th scope="col" className="px-5 py-3.5 text-right rtl:text-left">
                {isAr ? "الإجراءات" : "Actions"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-xs text-on-surface-variant">
                  {isAr ? "لا توجد بلاغات نشطة حالياً" : "No active reports requiring triage."}
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-surface-container-low/50 transition">
                  <td className="px-5 py-4 font-mono text-xs font-bold text-primary">
                    {report.caseNumber}
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-0.5 text-xs font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-[14px]">
                        {report.target === "listing" ? "inventory_2" : "person"}
                      </span>
                      {report.target}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs font-semibold text-on-surface">
                    {report.reason}
                  </td>

                  <td className="px-5 py-4 text-xs font-mono text-on-surface-variant">
                    {report.reporterEmail}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                        report.status === "open"
                          ? "bg-rose-500/10 text-rose-600"
                          : report.status === "investigating"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-emerald-500/10 text-emerald-600"
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right rtl:text-left">
                    <button
                      type="button"
                      disabled={processingId === report.id}
                      onClick={() => {
                        setSelectedReport(report);
                        setTriageStatus(
                          report.status === "open"
                            ? "investigating"
                            : (report.status as "investigating" | "resolved" | "dismissed")
                        );
                      }}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition disabled:opacity-50"
                    >
                      {isAr ? "معالجة البلاغ" : "Triage Report"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Triage Dialog */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-surface-container-high space-y-4">
            <h3 className="text-lg font-bold text-on-surface">
              {isAr ? "معالجة البلاغ" : "Triage Report"} ({selectedReport.caseNumber})
            </h3>
            <p className="text-xs text-on-surface-variant">
              {selectedReport.body}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  {isAr ? "تحديث حالة البلاغ" : "Update Status"}
                </label>
                <select
                  value={triageStatus}
                  onChange={(e) => setTriageStatus(e.target.value as "investigating" | "resolved" | "dismissed")}
                  className="w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                >
                  <option value="investigating">
                    {isAr ? "قيد التحقيق (Investigating)" : "Investigating"}
                  </option>
                  <option value="resolved">
                    {isAr ? "تم الحل والإجراء (Resolved)" : "Resolved"}
                  </option>
                  <option value="dismissed">
                    {isAr ? "مرفوض / غير مبرر (Dismissed)" : "Dismissed"}
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "ملاحظة تفتيش داخلية" : "Internal Moderator Note"}
                </label>
                <textarea
                  rows={2}
                  value={triageNote}
                  onChange={(e) => setTriageNote(e.target.value)}
                  placeholder={
                    isAr
                      ? "مثال: تم التواصل مع البائع وحذف المنتج المقلد..."
                      : "e.g. Seller verified, product removed."
                  }
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={submitTriage}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary/90"
              >
                {isAr ? "حفظ التحديث" : "Save Triage"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
