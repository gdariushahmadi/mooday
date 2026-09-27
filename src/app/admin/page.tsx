"use client";

import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminListingsTab } from "@/components/admin/AdminListingsTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminDisputesTab } from "@/components/admin/AdminDisputesTab";
import { AdminReportsTab } from "@/components/admin/AdminReportsTab";
import { AdminBroadcastTab } from "@/components/admin/AdminBroadcastTab";
import { AdminAuditLogTab } from "@/components/admin/AdminAuditLogTab";
import { AffiliateTab } from "@/components/admin/affiliate/AffiliateTab";
import { useAdminData } from "@/hooks/admin/useAdminData";

export default function AdminPage() {
  const {
    activeTab,
    setActiveTab,
    lang,
    isLiveMode,
    isDemoMode,
    loading,
    error,
    stats,
    pendingListings,
    orders,
    disputes,
    reports,
    users,
    auditLogs,
    loadDemoData,
    loadLiveData,
    handleApproveListing,
    handleRejectListing,
    handleFeatureListing,
    handleSuspendUser,
    handleUnsuspendUser,
    handleResolveDispute,
    handleTriageReport,
    handleBroadcast,
    toggleLang,
  } = useAdminData();

  return (
    <div
      className={`min-h-screen bg-background text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed antialiased flex ${
        lang === "ar" ? "font-arabic" : ""
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lang={lang}
        pendingListingsCount={pendingListings.length}
        openDisputesCount={disputes.filter((d) => d.status === "open").length}
        openReportsCount={reports.filter(
          (r) => r.status === "open" || r.status === "investigating",
        ).length}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
          lang={lang}
          onToggleLang={toggleLang}
          isLiveMode={isLiveMode}
          isDemoMode={isDemoMode}
        />

        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
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
            {activeTab === "affiliate" && (
              <AffiliateTab />
            )}
          </>
        )}
        </main>
      </div>
    </div>
  );
}
