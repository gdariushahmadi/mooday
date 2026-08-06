import type {
  AdminProfileSummary,
  AdminListingSummary,
  AdminOrderSummary,
  AdminDisputeSummary,
  AdminReportSummary,
  AdminAuditLogEntry,
  AdminDashboardStats,
} from "./actions";

// In-memory mock databases for offline/demo mode
const mockUsers: AdminProfileSummary[] = [
  {
    id: "usr-1",
    email: "sarah.m@example.com",
    fullNameEn: "Sarah Mansoor",
    fullNameAr: "سارة منصور",
    handle: "@sarah_m",
    avatarUrl: "/avatars/seller-1.jpg",
    isAdmin: true,
    isSuspended: false,
    suspendedReason: null,
    suspendedAt: null,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "usr-2",
    email: "tariq.k@example.com",
    fullNameEn: "Tariq Khalil",
    fullNameAr: "طارق خليل",
    handle: "@tariq_styles",
    avatarUrl: "/avatars/seller-2.jpg",
    isAdmin: false,
    isSuspended: false,
    suspendedReason: null,
    suspendedAt: null,
    createdAt: "2024-02-10T14:30:00Z",
  },
  {
    id: "usr-3",
    email: "leila.h@example.com",
    fullNameEn: "Leila Hassan",
    fullNameAr: "ليلى حسن",
    handle: "@leilacloset",
    avatarUrl: "/avatars/seller-3.jpg",
    isAdmin: false,
    isSuspended: true,
    suspendedReason: "Multiple counterfeit listing reports",
    suspendedAt: "2024-06-01T09:00:00Z",
    createdAt: "2024-03-05T12:15:00Z",
  },
  {
    id: "usr-4",
    email: "nasser.a@example.com",
    fullNameEn: "Nasser Al-Subaie",
    fullNameAr: "ناصر السبيعي",
    handle: "@nasser_luxury",
    avatarUrl: null,
    isAdmin: false,
    isSuspended: false,
    suspendedReason: null,
    suspendedAt: null,
    createdAt: "2024-04-20T16:45:00Z",
  },
];

let mockPendingListings: AdminListingSummary[] = [
  {
    id: "lst-pending-1",
    sellerId: "usr-2",
    sellerNameEn: "Tariq Khalil",
    sellerNameAr: "طارق خليل",
    sellerEmail: "tariq.k@example.com",
    titleEn: "Vintage Rolex Submariner Date (1998)",
    titleAr: "ساعة رولكس سوبمارينر كلاسيكية (1998)",
    priceMinor: 4850000, // 48,500 AED
    status: "active",
    category: "Watches",
    approvedAt: null,
    createdAt: "2026-07-20T14:00:00Z",
    reportCount: 0,
  },
  {
    id: "lst-pending-2",
    sellerId: "usr-4",
    sellerNameEn: "Nasser Al-Subaie",
    sellerNameAr: "ناصر السبيعي",
    sellerEmail: "nasser.a@example.com",
    titleEn: "Chanel Classic Flap Bag Medium Caviar Gold Hardware",
    titleAr: "حقيبة شانييل كلاسيك فلاب متوسطة بجلد كافيار وقطع ذهبية",
    priceMinor: 3400000, // 34,000 AED
    status: "active",
    category: "Bags",
    approvedAt: null,
    createdAt: "2026-07-21T09:30:00Z",
    reportCount: 1,
  },
  {
    id: "lst-pending-3",
    sellerId: "usr-2",
    sellerNameEn: "Tariq Khalil",
    sellerNameAr: "طارق خليل",
    sellerEmail: "tariq.k@example.com",
    titleEn: "Hermès Birkin 30 Gold Epsom Leather",
    titleAr: "حقيبة هيرميس بيركين 30 جلد إبسوم ذهبي",
    priceMinor: 6200000, // 62,000 AED
    status: "active",
    category: "Bags",
    approvedAt: null,
    createdAt: "2026-07-21T11:15:00Z",
    reportCount: 0,
  },
];

const mockOrders: AdminOrderSummary[] = [
  {
    id: "ord-8801",
    buyerId: "usr-1",
    buyerEmail: "sarah.m@example.com",
    sellerId: "usr-2",
    sellerEmail: "tariq.k@example.com",
    status: "delivered",
    totalMinor: 125000,
    createdAt: "2026-07-10T11:00:00Z",
    itemTitlesEn: ["Vintage Classic Handbag in Tan Leather"],
  },
  {
    id: "ord-8802",
    buyerId: "usr-4",
    buyerEmail: "nasser.a@example.com",
    sellerId: "usr-3",
    sellerEmail: "leila.h@example.com",
    status: "processing",
    totalMinor: 350000,
    createdAt: "2026-07-18T16:20:00Z",
    itemTitlesEn: ["Gucci GG Canvas Shoulder Bag"],
  },
];

const mockDisputes: AdminDisputeSummary[] = [
  {
    id: "disp-101",
    orderId: "ord-8802",
    buyerId: "usr-4",
    buyerEmail: "nasser.a@example.com",
    reason: "item_not_as_described",
    body: "The handbag strap shows significant wear and scratches not shown in seller photos.",
    status: "open",
    createdAt: "2026-07-19T08:30:00Z",
    updatedAt: "2026-07-19T08:30:00Z",
  },
];

const mockReports: AdminReportSummary[] = [
  {
    id: "rep-501",
    caseNumber: "REP-2026-001",
    reporterEmail: "sarah.m@example.com",
    target: "listing",
    targetId: "lst-pending-2",
    reason: "suspected_counterfeit",
    body: "Stitching patterns look inconsistent with authentic Chanel Caviar series.",
    status: "open",
    createdAt: "2026-07-21T10:00:00Z",
  },
  {
    id: "rep-502",
    caseNumber: "REP-2026-002",
    reporterEmail: "tariq.k@example.com",
    target: "user",
    targetId: "usr-3",
    reason: "harassment",
    body: "User sent hostile private messages after price negotiation was declined.",
    status: "investigating",
    createdAt: "2026-07-20T19:45:00Z",
  },
];

const mockAuditLogs: AdminAuditLogEntry[] = [
  {
    id: 1,
    actorEmail: "sarah.m@example.com",
    action: "listing.approve",
    targetKind: "listing",
    targetId: "lst-approved-100",
    diff: { approved_at: "2026-07-19T12:00:00Z" },
    note: "Verified luxury authenticity certificate",
    createdAt: "2026-07-19T12:00:00Z",
  },
  {
    id: 2,
    actorEmail: "sarah.m@example.com",
    action: "user.suspend",
    targetKind: "user",
    targetId: "usr-3",
    diff: { is_suspended: true },
    note: "Multiple counterfeit listing reports",
    createdAt: "2026-07-19T14:30:00Z",
  },
];

export async function mockAdminDashboardStats(): Promise<AdminDashboardStats> {
  return {
    totalUsers: mockUsers.length,
    totalListings: 142,
    pendingListings: mockPendingListings.length,
    openDisputes: mockDisputes.filter((d) => d.status === "open").length,
    openReports: mockReports.filter((r) => r.status === "open" || r.status === "investigating").length,
    suspendedUsers: mockUsers.filter((u) => u.isSuspended).length,
    ordersToday: 8,
  };
}

export async function mockAdminListPendingListings(): Promise<AdminListingSummary[]> {
  return [...mockPendingListings];
}

export async function mockAdminListOrders(): Promise<AdminOrderSummary[]> {
  return [...mockOrders];
}

export async function mockAdminListDisputes(): Promise<AdminDisputeSummary[]> {
  return [...mockDisputes];
}

export async function mockAdminListReports(): Promise<AdminReportSummary[]> {
  return [...mockReports];
}

export async function mockAdminListUsers(): Promise<AdminProfileSummary[]> {
  return [...mockUsers];
}

export async function mockAdminListAuditLog(
  targetKind?: string,
  targetId?: string,
): Promise<AdminAuditLogEntry[]> {
  if (targetKind && targetId) {
    return mockAuditLogs.filter(
      (log) => log.targetKind === targetKind && log.targetId === targetId,
    );
  }
  return [...mockAuditLogs];
}

export async function mockAdminApproveListing(listingId: string): Promise<void> {
  mockPendingListings = mockPendingListings.filter((l) => l.id !== listingId);
  mockAuditLogs.unshift({
    id: mockAuditLogs.length + 1,
    actorEmail: "admin@mooday.ae",
    action: "listing.approve",
    targetKind: "listing",
    targetId: listingId,
    diff: { approved_at: new Date().toISOString() },
    note: "Approved in demo mode",
    createdAt: new Date().toISOString(),
  });
}

export async function mockAdminRejectListing(
  listingId: string,
  reason: string,
): Promise<void> {
  mockPendingListings = mockPendingListings.filter((l) => l.id !== listingId);
  mockAuditLogs.unshift({
    id: mockAuditLogs.length + 1,
    actorEmail: "admin@mooday.ae",
    action: "listing.reject",
    targetKind: "listing",
    targetId: listingId,
    diff: { status: "archived" },
    note: reason,
    createdAt: new Date().toISOString(),
  });
}

export async function mockAdminFeatureListing(
  listingId: string,
  sortOrder: number,
  noteEn: string,
  noteAr: string,
): Promise<void> {
  mockAuditLogs.unshift({
    id: mockAuditLogs.length + 1,
    actorEmail: "admin@mooday.ae",
    action: "listing.feature",
    targetKind: "listing",
    targetId: listingId,
    diff: { sort_order: sortOrder, note_en: noteEn, note_ar: noteAr },
    note: "Featured listing curator pick",
    createdAt: new Date().toISOString(),
  });
}

export async function mockAdminUnfeatureListing(listingId: string): Promise<void> {
  mockAuditLogs.unshift({
    id: mockAuditLogs.length + 1,
    actorEmail: "admin@mooday.ae",
    action: "listing.unfeature",
    targetKind: "listing",
    targetId: listingId,
    diff: null,
    note: "Removed from featured lane",
    createdAt: new Date().toISOString(),
  });
}

export async function mockAdminSuspendUser(
  userId: string,
  reason: string,
): Promise<void> {
  const user = mockUsers.find((u) => u.id === userId);
  if (user) {
    user.isSuspended = true;
    user.suspendedReason = reason;
    user.suspendedAt = new Date().toISOString();
  }
  mockAuditLogs.unshift({
    id: mockAuditLogs.length + 1,
    actorEmail: "admin@mooday.ae",
    action: "user.suspend",
    targetKind: "user",
    targetId: userId,
    diff: { is_suspended: true, reason },
    note: reason,
    createdAt: new Date().toISOString(),
  });
}

export async function mockAdminUnsuspendUser(userId: string): Promise<void> {
  const user = mockUsers.find((u) => u.id === userId);
  if (user) {
    user.isSuspended = false;
    user.suspendedReason = null;
    user.suspendedAt = null;
  }
  mockAuditLogs.unshift({
    id: mockAuditLogs.length + 1,
    actorEmail: "admin@mooday.ae",
    action: "user.unsuspend",
    targetKind: "user",
    targetId: userId,
    diff: { is_suspended: false },
    note: "User unsuspended by admin",
    createdAt: new Date().toISOString(),
  });
}

export async function mockAdminResolveDispute(
  disputeId: string,
  status: "resolved" | "rejected",
  noteEn: string,
  noteAr: string,
): Promise<void> {
  const dispute = mockDisputes.find((d) => d.id === disputeId);
  if (dispute) {
    dispute.status = status;
    dispute.updatedAt = new Date().toISOString();
  }
  mockAuditLogs.unshift({
    id: mockAuditLogs.length + 1,
    actorEmail: "admin@mooday.ae",
    action: "dispute.resolve",
    targetKind: "dispute",
    targetId: disputeId,
    diff: { status, noteEn, noteAr },
    note: noteEn,
    createdAt: new Date().toISOString(),
  });
}

export async function mockAdminTriageReport(
  reportId: string,
  status: "investigating" | "resolved" | "dismissed",
  note?: string,
): Promise<void> {
  const report = mockReports.find((r) => r.id === reportId);
  if (report) {
    report.status = status;
  }
  mockAuditLogs.unshift({
    id: mockAuditLogs.length + 1,
    actorEmail: "admin@mooday.ae",
    action: "report.triage",
    targetKind: "report",
    targetId: reportId,
    diff: { status },
    note: note ?? "",
    createdAt: new Date().toISOString(),
  });
}

export async function mockAdminBroadcastNotification(input: {
  kind: "system" | "order" | "price_drop";
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  expiresAt?: string;
}): Promise<void> {
  mockAuditLogs.unshift({
    id: mockAuditLogs.length + 1,
    actorEmail: "admin@mooday.ae",
    action: "notification.broadcast",
    targetKind: "notification",
    targetId: "broadcast",
    diff: { kind: input.kind, titleEn: input.titleEn },
    note: input.titleEn,
    createdAt: new Date().toISOString(),
  });
}
