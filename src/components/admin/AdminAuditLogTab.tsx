"use client";

import { useState } from "react";
import type { AdminAuditLogEntry } from "@/services/admin/actions";

interface AdminAuditLogTabProps {
  logs: AdminAuditLogEntry[];
  lang: "en" | "ar";
}

export function AdminAuditLogTab({ logs, lang }: AdminAuditLogTabProps) {
  const isAr = lang === "ar";
  const [filterKind, setFilterKind] = useState<string>("all");

  const kinds = ["all", "listing", "user", "order", "dispute", "report", "notification"];

  const filteredLogs = logs.filter((log) => {
    if (filterKind === "all") return true;
    return log.targetKind === filterKind;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">
            {isAr ? "سجل تفتيش العمليات" : "Admin Audit Log"}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {isAr
              ? "سجل غير قابل للتعديل يوثق جميع قرارات وتعديلات المشرفين والإدارة"
              : "Immutable audit trail of all administrative actions and moderation events"}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-1.5 bg-surface-container-low p-1.5 rounded-xl border border-surface-container-high w-fit">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilterKind(k)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                filterKind === k
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-2xl border border-surface-container-high bg-surface shadow-sm">
        <table className="w-full text-left text-sm text-on-surface rtl:text-right">
          <thead className="bg-surface-container-low text-xs uppercase font-semibold text-on-surface-variant border-b border-surface-container-high">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "المُنفِّذ" : "Actor"}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "الإجراء" : "Action"}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "الهدف" : "Target"}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "التفاصيل والملاحظات" : "Note & Diff"}
              </th>
              <th scope="col" className="px-5 py-3.5 text-right rtl:text-left">
                {isAr ? "الوقت" : "Timestamp"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-xs font-sans text-on-surface-variant">
                  {isAr ? "لا توجد سجلات تفتيش بهذا الفلتر" : "No audit entries match the current filter."}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container-low/50 transition">
                  <td className="px-5 py-4 font-sans font-medium text-on-surface">
                    {log.actorEmail ?? "System"}
                  </td>

                  <td className="px-5 py-4 font-bold text-primary">
                    {log.action}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded bg-surface-container-high px-2 py-0.5 text-[11px] text-on-surface font-semibold">
                      {log.targetKind}:{log.targetId}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-sans text-on-surface-variant max-w-sm">
                    {log.note && <div className="font-semibold text-on-surface mb-0.5">{log.note}</div>}
                    {log.diff && (
                      <pre className="text-[10px] font-mono bg-surface-container-low p-1.5 rounded border border-surface-container-high overflow-x-auto text-on-surface-variant">
                        {JSON.stringify(log.diff)}
                      </pre>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right rtl:text-left text-on-surface-variant">
                    {new Date(log.createdAt).toLocaleString(isAr ? "ar-AE" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
