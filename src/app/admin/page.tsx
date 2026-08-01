"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  adminDashboardStats,
  adminListPendingListings,
  adminListOrders,
  adminListDisputes,
  adminListReports,
  adminListUsers,
  adminListAuditLog,
  adminApproveListing,
  adminRejectListing,
  adminFeatureListing,
  adminSuspendUser,
  adminUnsuspendUser,
  adminResolveDispute,
  adminTriageReport,
  adminBroadcastNotification,
  type AdminDashboardStats,
  type AdminListingSummary,
  type AdminOrderSummary,
  type AdminDisputeSummary,
  type AdminReportSummary,
  type AdminProfileSummary,
  type AdminAuditLogEntry,
} from "@/services/admin/actions";
import {
  mockAdminDashboardStats,
  mockAdminListPendingListings,
  mockAdminListOrders,
  mockAdminListDisputes,
  mockAdminListReports,
  mockAdminListUsers,
  mockAdminListAuditLog,
  mockAdminApproveListing,
  mockAdminRejectListing,
  mockAdminFeatureListing,
  mockAdminSuspendUser,
  mockAdminUnsuspendUser,
  mockAdminResolveDispute,
  mockAdminTriageReport,
  mockAdminBroadcastNotification,
} from "@/services/admin/mockAdminService";
import { AdminHeader, type AdminTab } from "@/components/admin/AdminHeader";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminListingsTab } from "@/components/admin/AdminListingsTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminDisputesTab } from "@/components/admin/AdminDisputesTab";
import { AdminReportsTab } from "@/components/admin/AdminReportsTab";
import { AdminBroadcastTab } from "@/components/admin/AdminBroadcastTab";
import { AdminAuditLogTab } from "@/components/admin/AdminAuditLogTab";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [pendingListings, setPendingListings] = useState<AdminListingSummary[]>([]);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [disputes, setDisputes] = useState<AdminDisputeSummary[]>([]);
  const [reports, setReports] = useState<AdminReportSummary[]>([]);
  const [users, setUsers] = useState<AdminProfileSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);

  const applyPayload = (payload: {
    stats: AdminDashboardStats;
    listings: AdminListingSummary[];
    orders: AdminOrderSummary[];
    disputes: AdminDisputeSummary[];
    reports: AdminReportSummary[];
    users: AdminProfileSummary[];
    audit: AdminAuditLogEntry[];
  }) => {
    setStats(payload.stats);
    setPendingListings(payload.listings);
    setOrders(payload.orders);
    setDisputes(payload.disputes);
    setReports(payload.reports);
    setUsers(payload.users);
    setAuditLogs(payload.audit);
  };

  const loadDemoData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ms, ml, mo, md, mr, mu, ma] = await Promise.all([
        mockAdminDashboardStats(),
        mockAdminListPendingListings(),
        mockAdminListOrders(),
        mockAdminListDisputes(),
        mockAdminListReports(),
        mockAdminListUsers(),
        mockAdminListAuditLog(),
      ]);
      applyPayload({
        stats: ms,
        listings: ml,
        orders: mo,
        disputes: md,
        reports: mr,
        users: mu,
        audit: ma,
      });
      setIsLiveMode(false);
      setIsDemoMode(true);
    } catch (mockErr: unknown) {
      const message =
        mockErr instanceof Error
          ? mockErr.message
          : "Failed to load demo admin data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLiveData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsDemoMode(false);
    try {
      const [s, l, o, d, r, u, a] = await Promise.all([
        adminDashboardStats(),
        adminListPendingListings(),
        adminListOrders(),
        adminListDisputes(),
        adminListReports(),
        adminListUsers(),
        adminListAuditLog(),
      ]);
      applyPayload({
        stats: s,
        listings: l,
        orders: o,
        disputes: d,
        reports: r,
        users: u,
        audit: a,
      });
      setIsLiveMode(true);
      setIsDemoMode(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load admin dashboard data";
      setError(message);
      setIsLiveMode(false);
      setStats(null);
      setPendingListings([]);
      setOrders([]);
      setDisputes([]);
      setReports([]);
      setUsers([]);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLiveData();
  }, [loadLiveData]);

  const handleApproveListing = async (listingId: string) => {
    if (isLiveMode) {
      await adminApproveListing(listingId);
    } else {
      await mockAdminApproveListing(listingId);
    }
    if (isDemoMode) await loadDemoData();
    else await loadLiveData();
  };

  const handleRejectListing = async (listingId: string, reason: string) => {
    if (isLiveMode) {
      await adminRejectListing(listingId, reason);
    } else {
      await mockAdminRejectListing(listingId, reason);
    }
    if (isDemoMode) await loadDemoData();
    else await loadLiveData();
  };

  const handleFeatureListing = async (
    listingId: string,
    sortOrder: number,
    noteEn: string,
    noteAr: string,
  ) => {
    if (isLiveMode) {
      await adminFeatureListing(listingId, sortOrder, noteEn, noteAr);
    } else {
      await mockAdminFeatureListing(listingId, sortOrder, noteEn, noteAr);
    }
    if (isDemoMode) await loadDemoData();
    else await loadLiveData();
  };

  const handleSuspendUser = async (userId: string, reason: string) => {
    if (isLiveMode) {
      await adminSuspendUser(userId, reason);
    } else {
      await mockAdminSuspendUser(userId, reason);
    }
    if (isDemoMode) await loadDemoData();
    else await loadLiveData();
  };

  const handleUnsuspendUser = async (userId: string) => {
    if (isLiveMode) {
      await adminUnsuspendUser(userId);
    } else {
      await mockAdminUnsuspendUser(userId);
    }
    if (isDemoMode) await loadDemoData();
    else await loadLiveData();
  };

  const handleResolveDispute = async (
    disputeId: string,
    status: "resolved" | "rejected",
    noteEn: string,
    noteAr: string,
  ) => {
    if (isLiveMode) {
      await adminResolveDispute(disputeId, status, noteEn, noteAr);
    } else {
      await mockAdminResolveDispute(disputeId, status, noteEn, noteAr);
    }
    if (isDemoMode) await loadDemoData();
    else await loadLiveData();
  };

  const handleTriageReport = async (
    reportId: string,
    status: "investigating" | "resolved" | "dismissed",
    note?: string,
  ) => {
    if (isLiveMode) {
      await adminTriageReport(reportId, status, note);
    } else {
      await mockAdminTriageReport(reportId, status, note);
    }
    if (isDemoMode) await loadDemoData();
    else await loadLiveData();
  };

  const handleBroadcast = async (input: {
    kind: "system" | "order" | "price_drop";
    titleEn: string;
    titleAr: string;
    bodyEn: string;
    bodyAr: string;
    expiresAt?: string;
  }) => {
    if (isLiveMode) {
      await adminBroadcastNotification(input);
    } else {
      await mockAdminBroadcastNotification(input);
    }
    if (isDemoMode) await loadDemoData();
    else await loadLiveData();
  };

  const toggleLang = () => {
    const nextLang = lang === "en" ? "ar" : "en";
    setLang(nextLang);
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = nextLang;
  };

  return (
    <div
      className={`min-h-screen bg-background text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed antialiased ${
        lang === "ar" ? "font-arabic" : ""
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <AdminHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lang={lang}
        onToggleLang={toggleLang}
        isLiveMode={isLiveMode}
        isDemoMode={isDemoMode}
        pendingListingsCount={pendingListings.length}
        openDisputesCount={disputes.filter((d) => d.status === "open").length}
        openReportsCount={reports.filter(
          (r) => r.status === "open" || r.status === "investigating",
        ).length}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {isDemoMode && !loading && !error && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"
          >
            {lang === "ar"
              ? "أنت تعرض بيانات تجريبية (Demo). هذه ليست بيانات الخادم الحقيقية."
              : "You are viewing demo / mock data. This is not live Supabase data."}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <span className="material-symbols-outlined text-[40px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-medium text-on-surface-variant">
              {lang === "ar"
                ? "جاري تحميل بيانات لوحة التحكم..."
                : "Loading Admin Dashboard..."}
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-error/20 bg-error/10 p-6 text-center space-y-3">
            <span className="material-symbols-outlined text-[36px] text-error">
              error
            </span>
            <h3 className="font-bold text-error">
              {lang === "ar"
                ? "حدث خطأ أثناء تحميل البيانات"
                : "Failed to load admin panel data"}
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              {error}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => void loadLiveData()}
                className="rounded-xl bg-error px-4 py-2 text-xs font-bold text-on-error hover:bg-error/90"
              >
                {lang === "ar" ? "إعادة المحاولة" : "Retry"}
              </button>
              <button
                type="button"
                onClick={() => void loadDemoData()}
                className="rounded-xl border border-primary px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5"
              >
                {lang === "ar" ? "تحميل بيانات تجريبية" : "Load demo data"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <AdminOverviewTab
                stats={stats}
                recentAuditLogs={auditLogs}
                onNavigateTab={setActiveTab}
                lang={lang}
              />
            )}

            {activeTab === "listings" && (
              <AdminListingsTab
                listings={pendingListings}
                onApprove={handleApproveListing}
                onReject={handleRejectListing}
                onFeature={handleFeatureListing}
                lang={lang}
              />
            )}

            {activeTab === "orders" && (
              <AdminOrdersTab orders={orders} lang={lang} />
            )}

            {activeTab === "users" && (
              <AdminUsersTab
                users={users}
                onSuspend={handleSuspendUser}
                onUnsuspend={handleUnsuspendUser}
                lang={lang}
              />
            )}

            {activeTab === "disputes" && (
              <AdminDisputesTab
                disputes={disputes}
                onResolve={handleResolveDispute}
                lang={lang}
              />
            )}

            {activeTab === "reports" && (
              <AdminReportsTab
                reports={reports}
                onTriage={handleTriageReport}
                lang={lang}
              />
            )}

            {activeTab === "broadcast" && (
              <AdminBroadcastTab onBroadcast={handleBroadcast} lang={lang} />
            )}

            {activeTab === "audit" && (
              <AdminAuditLogTab logs={auditLogs} lang={lang} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
