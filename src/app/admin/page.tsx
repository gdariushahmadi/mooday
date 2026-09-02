"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocalStorageState } from "@/lib/hooks";
import {
  adminWhoAmI,
  adminDashboardStats,
  adminListPendingListings,
  adminListOrders,
  adminListDisputes,
  adminListReports,
  adminListUsers,
  adminListAuditLog,
  adminListCategories,
  adminApproveListing,
  adminRejectListing,
  adminFeatureListing,
  adminUpdateListingStatus,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminSuspendUser,
  adminUnsuspendUser,
  adminResolveDispute,
  adminTriageReport,
  adminBroadcastNotification,
  type AdminAuthReason,
  type AdminDashboardStats,
  type AdminListingSummary,
  type AdminOrderSummary,
  type AdminDisputeSummary,
  type AdminReportSummary,
  type AdminProfileSummary,
  type AdminAuditLogEntry,
  type AdminCategorySummary,
  type ListingStatus,
} from "@/services/admin/actions";
import { getPhase2Backend } from "@/services/backend";
import { type AdminTab } from "@/components/admin/AdminTypes";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminListingsTab } from "@/components/admin/AdminListingsTab";
import { AdminCategoriesTab } from "@/components/admin/AdminCategoriesTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminDisputesTab } from "@/components/admin/AdminDisputesTab";
import { AdminReportsTab } from "@/components/admin/AdminReportsTab";
import { AdminBroadcastTab } from "@/components/admin/AdminBroadcastTab";
import { AdminAuditLogTab } from "@/components/admin/AdminAuditLogTab";
import { AdminLoginCard } from "@/components/admin/AdminLoginCard";
import { AffiliateTab } from "@/components/admin/affiliate/AffiliateTab";
import {
  MOCK_ADMIN_EMAIL,
  MOCK_ADMIN_PASSWORD,
  MOCK_ADMIN_SESSION_KEY,
  mockAdminApproveListing,
  mockAdminBroadcastNotification,
  mockAdminDashboardStats,
  mockAdminFeatureListing,
  mockAdminListAuditLog,
  mockAdminListCategories,
  mockAdminListDisputes,
  mockAdminListOrders,
  mockAdminListPendingListings,
  mockAdminListReports,
  mockAdminListUsers,
  mockAdminRejectListing,
  mockAdminResolveDispute,
  mockAdminSuspendUser,
  mockAdminTriageReport,
  mockAdminUnsuspendUser,
  mockAdminUpdateListingStatus,
  mockAdminCreateCategory,
  mockAdminUpdateCategory,
  mockAdminDeleteCategory,
  verifyMockAdminCredentials,
} from "@/services/admin/mockAdminService";

const COPY = {
  en: {
    verifying: "Verifying your admin access...",
    loading: "Loading Admin Dashboard...",
    deniedTitle: "Admin access required",
    signedOut: "You are not signed in. Sign in with an admin account to continue.",
    notAdmin: "This account does not have admin privileges.",
    suspended: "This admin account has been suspended.",
    misconfigured:
      "The admin backend is not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.",
    mockMode: "Use the demo sign-in below to open the sample admin panel.",
    loginFailed: "The email or password is not correct.",
    signOutFailed: "Sign out did not complete. Try again.",
    goToApp: "Go to DANEG",
    retry: "Retry",
    loadFailedTitle: "Failed to load admin panel data",
    actionFailed: "That action did not complete. Nothing was changed.",
  },
  ar: {
    verifying: "جاري التحقق من صلاحيات المشرف...",
    loading: "جاري تحميل بيانات لوحة التحكم...",
    deniedTitle: "مطلوب صلاحية مشرف",
    signedOut: "لم تقم بتسجيل الدخول. سجّل الدخول بحساب مشرف للمتابعة.",
    notAdmin: "هذا الحساب لا يملك صلاحيات المشرف.",
    suspended: "تم تعليق حساب المشرف هذا.",
    misconfigured:
      "لم يتم إعداد خادم لوحة التحكم. تحقق من NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY على الخادم.",
    mockMode: "استخدم تسجيل الدخول التجريبي أدناه لفتح لوحة البيانات النموذجية.",
    loginFailed: "البريد الإلكتروني أو كلمة المرور غير صحيحين.",
    signOutFailed: "لم يكتمل تسجيل الخروج. حاول مرة أخرى.",
    goToApp: "الذهاب إلى DANEG",
    retry: "إعادة المحاولة",
    loadFailedTitle: "حدث خطأ أثناء تحميل البيانات",
    actionFailed: "لم تكتمل العملية. لم يتم تغيير أي شيء.",
  },
} as const;

type Gate =
  | { status: "checking" }
  | { status: "granted"; adminEmail: string; mode: "demo" | "live" }
  | { status: "denied"; reason: AdminAuthReason | "mock-mode"; message: string };

/**
 * Fetch the caller's Supabase access token.
 *
 * The browser client keeps its session in localStorage, so the token has
 * to travel to the Server Actions as an explicit argument. We re-read it
 * before every call rather than caching it: `getAccessToken` refreshes an
 * expired session, so a long-lived admin tab keeps working.
 */
async function currentAccessToken(): Promise<string | null> {
  const backend = getPhase2Backend();
  if (!backend) return null;
  return backend.auth.getAccessToken();
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [demoPreview] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("demo") === "1";
  });
  const [gate, setGate] = useState<Gate>({ status: "checking" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoAuthenticated, setDemoAuthenticated] =
    useLocalStorageState<boolean>(MOCK_ADMIN_SESSION_KEY, false);
  const [authRevision, setAuthRevision] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [pendingListings, setPendingListings] = useState<AdminListingSummary[]>([]);
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [disputes, setDisputes] = useState<AdminDisputeSummary[]>([]);
  const [reports, setReports] = useState<AdminReportSummary[]>([]);
  const [users, setUsers] = useState<AdminProfileSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [categories, setCategories] = useState<AdminCategorySummary[]>([]);

  const t = COPY[lang];
  const isAr = lang === "ar";

  const clearData = useCallback(() => {
    setStats(null);
    setPendingListings([]);
    setOrders([]);
    setDisputes([]);
    setReports([]);
    setUsers([]);
    setAuditLogs([]);
    setCategories([]);
  }, []);

  const loadData = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const [s, l, o, d, r, u, a, c] = await Promise.all([
        adminDashboardStats(token),
        adminListPendingListings(token),
        adminListOrders(token),
        adminListDisputes(token),
        adminListReports(token),
        adminListUsers(token),
        adminListAuditLog(token),
        adminListCategories(token),
      ]);
      setStats(s);
      setPendingListings(l);
      setOrders(o);
      setDisputes(d);
      setReports(r);
      setUsers(u);
      setAuditLogs(a);
      setCategories(c);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load admin dashboard data",
      );
      clearData();
    } finally {
      setLoading(false);
    }
  }, [clearData]);

  const loadDemoData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, l, o, d, r, u, a, c] = await Promise.all([
        mockAdminDashboardStats(),
        mockAdminListPendingListings(),
        mockAdminListOrders(),
        mockAdminListDisputes(),
        mockAdminListReports(),
        mockAdminListUsers(),
        mockAdminListAuditLog(),
        mockAdminListCategories(),
      ]);
      setStats(s);
      setPendingListings(l);
      setOrders(o);
      setDisputes(d);
      setReports(r);
      setUsers(u);
      setAuditLogs(a);
      setCategories(c);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load demo dashboard data",
      );
      clearData();
    } finally {
      setLoading(false);
    }
  }, [clearData]);

  /**
   * Verify admin access first, then load. The panel shell is never
   * rendered for a caller the server has not confirmed as an admin —
   * and the Server Actions re-verify on every call regardless, so the
   * gate is a UX affordance rather than the security boundary.
   */
  const verifyAndLoad = useCallback(async () => {
    setGate({ status: "checking" });
    setError(null);

    let backend: ReturnType<typeof getPhase2Backend>;
    try {
      // The demo credentials also work on the normal admin URL. Once they
      // are accepted, keep this tab on mock data until the operator signs out.
      backend = demoPreview || demoAuthenticated ? null : getPhase2Backend();
    } catch (err: unknown) {
      setGate({
        status: "denied",
        reason: "misconfigured",
        message: err instanceof Error ? err.message : "",
      });
      setLoading(false);
      clearData();
      return;
    }

    if (!backend) {
      if (!demoAuthenticated) {
        setGate({
          status: "denied",
          reason: "mock-mode",
          message: "",
        });
        setLoading(false);
        clearData();
        return;
      }
      setGate({
        status: "granted",
        adminEmail: MOCK_ADMIN_EMAIL,
        mode: "demo",
      });
      await loadDemoData();
      return;
    }

    const token = await backend.auth.getAccessToken();
    if (!token) {
      setGate({
        status: "denied",
        reason: "signed-out",
        message: "",
      });
      setLoading(false);
      clearData();
      return;
    }
    const identity = await adminWhoAmI(token);
    if (!identity.ok) {
      setGate({
        status: "denied",
        reason: identity.reason,
        message: identity.message,
      });
      setLoading(false);
      clearData();
      return;
    }
    setGate({ status: "granted", adminEmail: identity.email, mode: "live" });
    await loadData(token);
  }, [clearData, demoAuthenticated, demoPreview, loadData, loadDemoData]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    void verifyAndLoad();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [demoAuthenticated, demoPreview, authRevision, verifyAndLoad]);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setLoginLoading(true);
      setLoginError(null);
      try {
        if (verifyMockAdminCredentials(email, password)) {
          setDemoAuthenticated(true);
          return;
        }

        if (demoPreview) {
          setLoginError(t.loginFailed);
          return;
        }

        const backend = getPhase2Backend();
        if (!backend) {
          setLoginError(t.loginFailed);
          return;
        }
        const result = await backend.auth.signIn({ email, password });
        if (!result.ok) {
          setLoginError(t.loginFailed);
          return;
        }
        setAuthRevision((value) => value + 1);
      } catch {
        setLoginError(t.loginFailed);
      } finally {
        setLoginLoading(false);
      }
    },
    [demoPreview, setDemoAuthenticated, t.loginFailed],
  );

  const handleSignOut = useCallback(async () => {
    setLoginError(null);
    try {
      const backend =
        demoPreview || demoAuthenticated ? null : getPhase2Backend();
      if (!backend) {
        setDemoAuthenticated(false);
      } else {
        await backend.auth.signOut();
        setAuthRevision((value) => value + 1);
      }
    } catch {
      setLoginError(t.signOutFailed);
    }
  }, [demoAuthenticated, demoPreview, setDemoAuthenticated, t.signOutFailed]);

  /**
   * Run one mutating action with a fresh token, then refresh the
   * dashboard. If the token has gone stale the whole gate re-runs, which
   * bounces the operator to the sign-in notice instead of leaving a
   * half-updated screen.
   */
  const runAction = useCallback(
    async (
      liveFn: (token: string) => Promise<void>,
      demoFn: () => Promise<void>,
    ) => {
      let backend: ReturnType<typeof getPhase2Backend>;
      try {
        backend = demoPreview || demoAuthenticated ? null : getPhase2Backend();
      } catch {
        setError(t.actionFailed);
        return;
      }
      if (!backend) {
        if (!demoAuthenticated) {
          await verifyAndLoad();
          return;
        }
        try {
          await demoFn();
          await loadDemoData();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : t.actionFailed);
        }
        return;
      }
      const token = await currentAccessToken();
      if (!token) {
        await verifyAndLoad();
        return;
      }
      try {
        await liveFn(token);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t.actionFailed);
        return;
      }
      await loadData(token);
    },
    [
      demoAuthenticated,
      demoPreview,
      loadData,
      loadDemoData,
      t.actionFailed,
      verifyAndLoad,
    ],
  );

  const handleApproveListing = (listingId: string) =>
    runAction(
      (token) => adminApproveListing(token, listingId),
      () => mockAdminApproveListing(listingId),
    );

  const handleRejectListing = (listingId: string, reason: string) =>
    runAction(
      (token) => adminRejectListing(token, listingId, reason),
      () => mockAdminRejectListing(listingId, reason),
    );

  const handleFeatureListing = (
    listingId: string,
    sortOrder: number,
    noteEn: string,
    noteAr: string,
  ) =>
    runAction(
      (token) =>
        adminFeatureListing(token, listingId, sortOrder, noteEn, noteAr),
      () => mockAdminFeatureListing(listingId, sortOrder, noteEn, noteAr),
    );

  const handleChangeListingStatus = (listingId: string, status: ListingStatus) =>
    runAction(
      (token) => adminUpdateListingStatus(token, listingId, status),
      () => mockAdminUpdateListingStatus(listingId, status),
    );

  const handleCreateCategory = (input: {
    slug: string;
    nameEn: string;
    nameAr: string;
    sortOrder: number;
  }) =>
    runAction(
      (token) => adminCreateCategory(token, input),
      () => mockAdminCreateCategory(input),
    );

  const handleUpdateCategory = (
    categoryId: string,
    input: {
      nameEn: string;
      nameAr: string;
      sortOrder: number;
      isActive: boolean;
    },
  ) =>
    runAction(
      (token) => adminUpdateCategory(token, categoryId, input),
      () => mockAdminUpdateCategory(categoryId, input),
    );

  const handleDeleteCategory = (categoryId: string) =>
    runAction(
      (token) => adminDeleteCategory(token, categoryId),
      () => mockAdminDeleteCategory(categoryId),
    );

  const handleSuspendUser = (userId: string, reason: string) =>
    runAction(
      (token) => adminSuspendUser(token, userId, reason),
      () => mockAdminSuspendUser(userId, reason),
    );

  const handleUnsuspendUser = (userId: string) =>
    runAction(
      (token) => adminUnsuspendUser(token, userId),
      () => mockAdminUnsuspendUser(userId),
    );

  const handleResolveDispute = (
    disputeId: string,
    status: "resolved" | "rejected",
    noteEn: string,
    noteAr: string,
  ) =>
    runAction(
      (token) =>
        adminResolveDispute(token, disputeId, status, noteEn, noteAr),
      () => mockAdminResolveDispute(disputeId, status, noteEn, noteAr),
    );

  const handleTriageReport = (
    reportId: string,
    status: "investigating" | "resolved" | "dismissed",
    note?: string,
  ) =>
    runAction(
      (token) => adminTriageReport(token, reportId, status, note),
      () => mockAdminTriageReport(reportId, status, note),
    );

  const handleBroadcast = (input: {
    kind: "system" | "order" | "price_drop";
    titleEn: string;
    titleAr: string;
    bodyEn: string;
    bodyAr: string;
    expiresAt?: string;
  }) =>
    runAction(
      (token) => adminBroadcastNotification(token, input),
      () => mockAdminBroadcastNotification(input),
    );

  const toggleLang = () => {
    const nextLang = lang === "en" ? "ar" : "en";
    setLang(nextLang);
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = nextLang;
  };

  const shellClass = `min-h-screen bg-background text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed antialiased ${
    isAr ? "font-arabic" : ""
  }`;

  if (gate.status === "checking") {
    return (
      <div
        className={`${shellClass} flex items-center justify-center`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[40px] text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-sm font-medium text-on-surface-variant">
            {t.verifying}
          </p>
        </div>
      </div>
    );
  }

  if (gate.status === "denied") {
    if (gate.reason === "mock-mode" || gate.reason === "signed-out") {
      return (
        <div
          className={
            shellClass + " flex items-center justify-center px-4 py-8 sm:px-6"
          }
          dir={isAr ? "rtl" : "ltr"}
        >
          <AdminLoginCard
            lang={lang}
            mode={gate.reason === "mock-mode" ? "demo" : "live"}
            demoEmail={MOCK_ADMIN_EMAIL}
            demoPassword={MOCK_ADMIN_PASSWORD}
            error={loginError}
            isSubmitting={loginLoading}
            onSubmit={handleLogin}
            onToggleLang={toggleLang}
          />
        </div>
      );
    }

    const reasonCopy =
      gate.reason === "not-admin"
          ? t.notAdmin
          : gate.reason === "suspended"
            ? t.suspended
            : gate.reason === "misconfigured"
              ? t.misconfigured
            : gate.reason === "mock-mode"
              ? t.mockMode
              : t.signedOut;

    return (
      <div
        className={`${shellClass} flex items-center justify-center px-6`}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div
          role="alert"
          className="w-full max-w-md rounded-2xl border border-error/20 bg-error/5 p-8 text-center space-y-4"
        >
          <span className="material-symbols-outlined text-[40px] text-error">
            lock
          </span>
          <h1 className="text-lg font-bold text-on-surface">{t.deniedTitle}</h1>
          <p className="text-sm text-on-surface-variant">{reasonCopy}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <a
              href="/app"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary/90"
            >
              {t.goToApp}
            </a>
            <button
              type="button"
              onClick={() => void verifyAndLoad()}
              className="rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low"
            >
              {t.retry}
            </button>
            <button
              type="button"
              onClick={toggleLang}
              className="rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low"
            >
              {isAr ? "English" : "العربية"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${shellClass} flex`} dir={isAr ? "rtl" : "ltr"}>
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
          adminEmail={gate.adminEmail}
          mode={gate.mode}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <span className="material-symbols-outlined text-[40px] text-primary animate-spin">
                progress_activity
              </span>
              <p className="text-sm font-medium text-on-surface-variant">
                {t.loading}
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-error/20 bg-error/10 p-6 text-center space-y-3">
              <span className="material-symbols-outlined text-[36px] text-error">
                error
              </span>
              <h3 className="font-bold text-error">{t.loadFailedTitle}</h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void verifyAndLoad()}
                className="rounded-xl bg-error px-4 py-2 text-xs font-bold text-on-error hover:bg-error/90"
              >
                {t.retry}
              </button>
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
                  onChangeStatus={handleChangeListingStatus}
                  lang={lang}
                />
              )}

              {activeTab === "categories" && (
                <AdminCategoriesTab
                  categories={categories}
                  onCreate={handleCreateCategory}
                  onUpdate={handleUpdateCategory}
                  onDelete={handleDeleteCategory}
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
                <AffiliateTab mode={gate.mode} lang={lang} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
