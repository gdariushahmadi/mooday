"use client";

import { useState } from "react";
import type { AdminProfileSummary } from "@/services/admin/actions";

interface AdminUsersTabProps {
  users: AdminProfileSummary[];
  onSuspend: (userId: string, reason: string) => Promise<void>;
  onUnsuspend: (userId: string) => Promise<void>;
  lang: "en" | "ar";
}

export function AdminUsersTab({
  users,
  onSuspend,
  onUnsuspend,
  lang,
}: AdminUsersTabProps) {
  const isAr = lang === "ar";

  const [search, setSearch] = useState("");
  const [suspendingUser, setSuspendingUser] = useState<AdminProfileSummary | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.fullNameEn.toLowerCase().includes(q) ||
      u.fullNameAr.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.handle && u.handle.toLowerCase().includes(q))
    );
  });

  const submitSuspend = async () => {
    if (!suspendingUser || !suspendReason.trim()) return;
    try {
      setProcessingId(suspendingUser.id);
      await onSuspend(suspendingUser.id, suspendReason.trim());
      setSuspendingUser(null);
      setSuspendReason("");
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnsuspend = async (id: string) => {
    try {
      setProcessingId(id);
      await onUnsuspend(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">
            {isAr ? "إدارة حسابات المستخدمين" : "User Account Management"}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {isAr
              ? "متابعة حسابات البائعين والمشترين، الصلاحيات، وتعليق الحسابات المخالفة"
              : "Search profiles, manage permissions, and enforce account suspensions"}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-on-surface-variant rtl:right-3 rtl:left-auto">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={isAr ? "البحث عن المستخدمين" : "Search users"}
            placeholder={isAr ? "بحث بالاسم، البريد، الهاشتاق..." : "Search name, email, @handle..."}
            className="w-full rounded-xl border border-surface-container-high bg-surface px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-surface-container-high bg-surface shadow-sm">
        <table className="w-full text-left text-sm text-on-surface rtl:text-right">
          <thead className="bg-surface-container-low text-xs uppercase font-semibold text-on-surface-variant border-b border-surface-container-high">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "المستخدم" : "User"}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </th>
              <th scope="col" className="px-5 py-3.5">
                {isAr ? "الدور" : "Role"}
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-xs text-on-surface-variant">
                  {isAr ? "لا توجد نتائج مطابقة" : "No users matched your search criteria."}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-container-low/50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
                        {(isAr ? user.fullNameAr : user.fullNameEn).slice(0, 1) || "U"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">
                          {isAr ? user.fullNameAr : user.fullNameEn}
                        </span>
                        {user.handle && (
                          <span className="text-xs text-on-surface-variant font-mono">
                            {user.handle}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-xs font-mono text-on-surface-variant">
                    {user.email}
                  </td>

                  <td className="px-5 py-4">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-600">
                        <span className="material-symbols-outlined text-[14px]">shield</span>
                        {isAr ? "مشرف (Admin)" : "Admin Staff"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                        {isAr ? "عضو" : "Member"}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {user.isSuspended ? (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 w-fit">
                          <span className="material-symbols-outlined text-[14px]">block</span>
                          {isAr ? "موقوف" : "Suspended"}
                        </span>
                        {user.suspendedReason && (
                          <span className="mt-1 text-[11px] text-on-surface-variant truncate max-w-xs">
                            {user.suspendedReason}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        {isAr ? "نشط" : "Active"}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right rtl:text-left">
                    {user.isSuspended ? (
                      <button
                        type="button"
                        disabled={processingId === user.id}
                        onClick={() => handleUnsuspend(user.id)}
                        className="rounded-lg border border-surface-container-high bg-surface px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50"
                      >
                        {isAr ? "إلغاء الإيقاف" : "Unsuspend Account"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={processingId === user.id || user.isAdmin}
                        onClick={() => setSuspendingUser(user)}
                        className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition disabled:opacity-40"
                      >
                        {isAr ? "إيقاف الحساب" : "Suspend"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Suspend Modal */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-surface-container-high space-y-4">
            <h3 className="text-lg font-bold text-on-surface">
              {isAr ? "تعليق حساب المستخدم" : "Suspend User Account"}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {isAr
                ? `سيتم إيقاف حساب (${suspendingUser.fullNameEn}). يُرجى كتابة السبب:`
                : `Specify the reason for suspending (${suspendingUser.fullNameEn}):`}
            </p>

            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder={
                isAr
                  ? "مثال: انتهاك شروط البيع، إدراج سلع مقلدة، سلوك غير لائق..."
                  : "e.g. Terms violation, counterfeit items, suspicious activity..."
              }
              className="w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={!suspendReason.trim()}
                onClick={submitSuspend}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isAr ? "تأكيد الإيقاف" : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
