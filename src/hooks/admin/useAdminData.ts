import { useState, useCallback, useEffect } from "react";
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
import { type AdminTab } from "@/components/admin/AdminTypes";

export function useAdminData() {
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
    setIsLiveMode(false);
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
    // Initial dashboard fetch. The state setter calls happen inside
    // an async function, so they don't synchronously commit during
    // render. The lint rule still flags the call site, hence the
    // explicit disable.
    /* eslint-disable react-hooks/set-state-in-effect */
    void loadLiveData();
    /* eslint-enable react-hooks/set-state-in-effect */
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

  return {
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
  };
}
