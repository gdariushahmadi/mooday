import type {
  AdminAuditLogEntry,
  AdminCategorySummary,
  AdminDashboardStats,
  AdminDisputeSummary,
  AdminListingSummary,
  AdminOrderSummary,
  AdminProfileSummary,
  AdminReportSummary,
  ListingStatus,
} from "./actions";

export const MOCK_ADMIN_EMAIL = "admin@daneg.ae";
export const MOCK_ADMIN_PASSWORD = "daneg123";
export const MOCK_ADMIN_SESSION_KEY = "daneg_admin_demo_session";

export function verifyMockAdminCredentials(
  email: string,
  password: string,
): boolean {
  return (
    email.trim().toLowerCase() === MOCK_ADMIN_EMAIL &&
    password === MOCK_ADMIN_PASSWORD
  );
}

const initialUsers: AdminProfileSummary[] = [
  {
    id: "usr-admin",
    email: MOCK_ADMIN_EMAIL,
    fullNameEn: "DANEG Admin",
    fullNameAr: "مشرف DANEG",
    handle: "@daneg_admin",
    avatarUrl: null,
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
    avatarUrl: null,
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
    avatarUrl: null,
    isAdmin: false,
    isSuspended: true,
    suspendedReason: "Multiple counterfeit listing reports",
    suspendedAt: "2026-06-01T09:00:00Z",
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

const initialListings: AdminListingSummary[] = [
  {
    id: "lst-pending-1",
    sellerId: "usr-2",
    sellerNameEn: "Tariq Khalil",
    sellerNameAr: "طارق خليل",
    sellerEmail: "tariq.k@example.com",
    titleEn: "Vintage Rolex Submariner Date (1998)",
    titleAr: "ساعة رولكس سوبمارينر كلاسيكية (1998)",
    priceMinor: 4_850_000,
    status: "active",
    category: "Watches",
    approvedAt: null,
    createdAt: "2026-08-20T14:00:00Z",
    reportCount: 0,
  },
  {
    id: "lst-pending-2",
    sellerId: "usr-4",
    sellerNameEn: "Nasser Al-Subaie",
    sellerNameAr: "ناصر السبيعي",
    sellerEmail: "nasser.a@example.com",
    titleEn: "Chanel Classic Flap Bag",
    titleAr: "حقيبة شانييل كلاسيك فلاب",
    priceMinor: 3_400_000,
    status: "active",
    category: "Bags",
    approvedAt: null,
    createdAt: "2026-08-21T09:30:00Z",
    reportCount: 1,
  },
  {
    id: "lst-pending-3",
    sellerId: "usr-2",
    sellerNameEn: "Tariq Khalil",
    sellerNameAr: "طارق خليل",
    sellerEmail: "tariq.k@example.com",
    titleEn: "Hermes Birkin 30 Gold Leather",
    titleAr: "حقيبة هيرمس بيركين 30 جلد ذهبي",
    priceMinor: 6_200_000,
    status: "active",
    category: "Bags",
    approvedAt: null,
    createdAt: "2026-08-21T11:15:00Z",
    reportCount: 0,
  },
];

const initialOrders: AdminOrderSummary[] = [
  {
    id: "ord-8801",
    buyerId: "usr-admin",
    buyerEmail: MOCK_ADMIN_EMAIL,
    sellerId: "usr-2",
    sellerEmail: "tariq.k@example.com",
    status: "delivered",
    totalMinor: 125_000,
    createdAt: "2026-08-10T11:00:00Z",
    itemTitlesEn: ["Vintage Classic Handbag in Tan Leather"],
  },
  {
    id: "ord-8802",
    buyerId: "usr-4",
    buyerEmail: "nasser.a@example.com",
    sellerId: "usr-3",
    sellerEmail: "leila.h@example.com",
    status: "processing",
    totalMinor: 350_000,
    createdAt: "2026-08-18T16:20:00Z",
    itemTitlesEn: ["Gucci GG Canvas Shoulder Bag"],
  },
];

const initialDisputes: AdminDisputeSummary[] = [
  {
    id: "disp-101",
    orderId: "ord-8802",
    buyerId: "usr-4",
    buyerEmail: "nasser.a@example.com",
    reason: "item_not_as_described",
    body: "The handbag strap shows wear not shown in the seller photos.",
    status: "open",
    createdAt: "2026-08-19T08:30:00Z",
    updatedAt: "2026-08-19T08:30:00Z",
  },
];

const initialReports: AdminReportSummary[] = [
  {
    id: "rep-501",
    caseNumber: "REP-2026-001",
    reporterEmail: MOCK_ADMIN_EMAIL,
    target: "listing",
    targetId: "lst-pending-2",
    reason: "suspected_counterfeit",
    body: "Stitching patterns may not match the advertised collection.",
    status: "open",
    createdAt: "2026-08-21T10:00:00Z",
  },
  {
    id: "rep-502",
    caseNumber: "REP-2026-002",
    reporterEmail: "tariq.k@example.com",
    target: "user",
    targetId: "usr-3",
    reason: "harassment",
    body: "User sent hostile private messages after a negotiation ended.",
    status: "investigating",
    createdAt: "2026-08-20T19:45:00Z",
  },
];

const initialAuditLogs: AdminAuditLogEntry[] = [
  {
    id: 1,
    actorEmail: MOCK_ADMIN_EMAIL,
    action: "listing.approve",
    targetKind: "listing",
    targetId: "lst-approved-100",
    diff: { approved_at: "2026-08-19T12:00:00Z" },
    note: "Verified authenticity certificate",
    createdAt: "2026-08-19T12:00:00Z",
  },
  {
    id: 2,
    actorEmail: MOCK_ADMIN_EMAIL,
    action: "user.suspend",
    targetKind: "user",
    targetId: "usr-3",
    diff: { is_suspended: true },
    note: "Multiple counterfeit listing reports",
    createdAt: "2026-08-19T14:30:00Z",
  },
];

const initialCategories: AdminCategorySummary[] = [
  {
    id: "cat-dresses",
    slug: "dresses",
    nameEn: "Dresses",
    nameAr: "فساتين",
    sortOrder: 1,
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "cat-shoes",
    slug: "shoes",
    nameEn: "Shoes",
    nameAr: "أحذية",
    sortOrder: 2,
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "cat-bags",
    slug: "bags",
    nameEn: "Bags",
    nameAr: "حقائب",
    sortOrder: 3,
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "cat-accessories",
    slug: "accessories",
    nameEn: "Accessories",
    nameAr: "إكسسوارات",
    sortOrder: 4,
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "cat-clothing",
    slug: "clothing",
    nameEn: "Clothing",
    nameAr: "ملابس",
    sortOrder: 5,
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
];

let mockUsers = structuredClone(initialUsers);
let mockPendingListings = structuredClone(initialListings);
let mockDisputes = structuredClone(initialDisputes);
let mockReports = structuredClone(initialReports);
let mockAuditLogs = structuredClone(initialAuditLogs);
let mockCategories = structuredClone(initialCategories);

function addAudit(
  action: string,
  targetKind: string,
  targetId: string,
  diff: Record<string, unknown> | null,
  note: string,
): void {
  mockAuditLogs.unshift({
    id: Date.now(),
    actorEmail: MOCK_ADMIN_EMAIL,
    action,
    targetKind,
    targetId,
    diff,
    note,
    createdAt: new Date().toISOString(),
  });
}

export async function mockAdminDashboardStats(): Promise<AdminDashboardStats> {
  return {
    totalUsers: mockUsers.length,
    totalListings: 142,
    pendingListings: mockPendingListings.length,
    openDisputes: mockDisputes.filter((item) => item.status === "open").length,
    openReports: mockReports.filter(
      (item) => item.status === "open" || item.status === "investigating",
    ).length,
    suspendedUsers: mockUsers.filter((item) => item.isSuspended).length,
    ordersToday: 8,
  };
}

export async function mockAdminListPendingListings(): Promise<
  AdminListingSummary[]
> {
  return structuredClone(mockPendingListings);
}

export async function mockAdminListOrders(): Promise<AdminOrderSummary[]> {
  return structuredClone(initialOrders);
}

export async function mockAdminListDisputes(): Promise<AdminDisputeSummary[]> {
  return structuredClone(mockDisputes);
}

export async function mockAdminListReports(): Promise<AdminReportSummary[]> {
  return structuredClone(mockReports);
}

export async function mockAdminListUsers(): Promise<AdminProfileSummary[]> {
  return structuredClone(mockUsers);
}

export async function mockAdminListAuditLog(
  targetKind?: string,
  targetId?: string,
): Promise<AdminAuditLogEntry[]> {
  const logs =
    targetKind && targetId
      ? mockAuditLogs.filter(
          (log) => log.targetKind === targetKind && log.targetId === targetId,
        )
      : mockAuditLogs;
  return structuredClone(logs);
}

export async function mockAdminListCategories(): Promise<
  AdminCategorySummary[]
> {
  return structuredClone(
    [...mockCategories].sort((a, b) => a.sortOrder - b.sortOrder),
  );
}

export async function mockAdminCreateCategory(input: {
  slug: string;
  nameEn: string;
  nameAr: string;
  sortOrder: number;
}): Promise<void> {
  const now = new Date().toISOString();
  const category: AdminCategorySummary = {
    id: `cat-${Date.now()}`,
    slug: input.slug,
    nameEn: input.nameEn,
    nameAr: input.nameAr,
    sortOrder: input.sortOrder,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  mockCategories = [...mockCategories, category];
  addAudit(
    "category.create",
    "category",
    category.id,
    { slug: input.slug, name_en: input.nameEn, name_ar: input.nameAr },
    "Created in demo mode",
  );
}

export async function mockAdminUpdateCategory(
  categoryId: string,
  input: {
    nameEn: string;
    nameAr: string;
    sortOrder: number;
    isActive: boolean;
  },
): Promise<void> {
  const category = mockCategories.find((item) => item.id === categoryId);
  if (category) {
    category.nameEn = input.nameEn;
    category.nameAr = input.nameAr;
    category.sortOrder = input.sortOrder;
    category.isActive = input.isActive;
    category.updatedAt = new Date().toISOString();
  }
  addAudit(
    "category.update",
    "category",
    categoryId,
    {
      name_en: input.nameEn,
      name_ar: input.nameAr,
      sort_order: input.sortOrder,
      is_active: input.isActive,
    },
    "Updated in demo mode",
  );
}

export async function mockAdminDeleteCategory(
  categoryId: string,
): Promise<void> {
  mockCategories = mockCategories.filter((item) => item.id !== categoryId);
  addAudit("category.delete", "category", categoryId, null, "Deleted in demo mode");
}

export async function mockAdminUpdateListingStatus(
  listingId: string,
  status: ListingStatus,
): Promise<void> {
  const listing = mockPendingListings.find((item) => item.id === listingId);
  if (listing) listing.status = status;
  addAudit(
    "listing.status",
    "listing",
    listingId,
    { status },
    "Status changed in demo mode",
  );
}

export async function mockAdminApproveListing(listingId: string): Promise<void> {
  mockPendingListings = mockPendingListings.filter((item) => item.id !== listingId);
  addAudit(
    "listing.approve",
    "listing",
    listingId,
    { approved_at: new Date().toISOString() },
    "Approved in demo mode",
  );
}

export async function mockAdminRejectListing(
  listingId: string,
  reason: string,
): Promise<void> {
  mockPendingListings = mockPendingListings.filter((item) => item.id !== listingId);
  addAudit("listing.reject", "listing", listingId, { status: "archived" }, reason);
}

export async function mockAdminFeatureListing(
  listingId: string,
  sortOrder: number,
  noteEn: string,
  noteAr: string,
): Promise<void> {
  addAudit(
    "listing.feature",
    "listing",
    listingId,
    { sort_order: sortOrder, note_en: noteEn, note_ar: noteAr },
    "Featured listing curator pick",
  );
}

export async function mockAdminUnfeatureListing(listingId: string): Promise<void> {
  addAudit(
    "listing.unfeature",
    "listing",
    listingId,
    null,
    "Removed from featured lane",
  );
}

export async function mockAdminSuspendUser(
  userId: string,
  reason: string,
): Promise<void> {
  const user = mockUsers.find((item) => item.id === userId);
  if (user) {
    user.isSuspended = true;
    user.suspendedReason = reason;
    user.suspendedAt = new Date().toISOString();
  }
  addAudit("user.suspend", "user", userId, { is_suspended: true, reason }, reason);
}

export async function mockAdminUnsuspendUser(userId: string): Promise<void> {
  const user = mockUsers.find((item) => item.id === userId);
  if (user) {
    user.isSuspended = false;
    user.suspendedReason = null;
    user.suspendedAt = null;
  }
  addAudit(
    "user.unsuspend",
    "user",
    userId,
    { is_suspended: false },
    "User unsuspended by admin",
  );
}

export async function mockAdminResolveDispute(
  disputeId: string,
  status: "resolved" | "rejected",
  noteEn: string,
  noteAr: string,
): Promise<void> {
  const dispute = mockDisputes.find((item) => item.id === disputeId);
  if (dispute) {
    dispute.status = status;
    dispute.updatedAt = new Date().toISOString();
  }
  addAudit(
    "dispute.resolve",
    "dispute",
    disputeId,
    { status, noteEn, noteAr },
    noteEn,
  );
}

export async function mockAdminTriageReport(
  reportId: string,
  status: "investigating" | "resolved" | "dismissed",
  note?: string,
): Promise<void> {
  const report = mockReports.find((item) => item.id === reportId);
  if (report) report.status = status;
  addAudit("report.triage", "report", reportId, { status }, note ?? "");
}

export async function mockAdminBroadcastNotification(input: {
  kind: "system" | "order" | "price_drop";
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  expiresAt?: string;
}): Promise<void> {
  addAudit(
    "notification.broadcast",
    "notification",
    "broadcast",
    { kind: input.kind, titleEn: input.titleEn },
    input.titleEn,
  );
}

export function resetMockAdminService(): void {
  mockUsers = structuredClone(initialUsers);
  mockPendingListings = structuredClone(initialListings);
  mockDisputes = structuredClone(initialDisputes);
  mockReports = structuredClone(initialReports);
  mockAuditLogs = structuredClone(initialAuditLogs);
  mockCategories = structuredClone(initialCategories);
}
