"use server";

/**
 * Admin service contracts (Phase 3.5).
 *
 * Everything here is server-only. The Server Actions in this file run
 * with the Supabase service-role key and therefore bypass RLS. The
 * browser calls these actions via Next.js RPC; the action itself
 * re-checks that the caller's session is an admin before doing any
 * write.
 *
 * Why server-only?
 *  - The service-role key must never reach the browser bundle.
 *  - Admin actions should be atomic and audit-logged; we cannot trust
 *    a client to do the right thing.
 *
 * Why re-check the role?
 *  - The publishable-key session is the only identity signal we have
 *    in the action context. We do NOT trust `actor_id` parameters from
 *    the client; we always derive it from the verified session.
 */
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------- types ----------

export interface AdminProfileSummary {
  id: string;
  email: string;
  fullNameEn: string;
  fullNameAr: string;
  handle: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  isSuspended: boolean;
  suspendedReason: string | null;
  suspendedAt: string | null;
  createdAt: string;
}

export interface AdminListingSummary {
  id: string;
  sellerId: string;
  sellerNameEn: string;
  sellerNameAr: string;
  sellerEmail: string;
  titleEn: string;
  titleAr: string;
  priceMinor: number;
  status: string;
  category: string;
  approvedAt: string | null;
  createdAt: string;
  reportCount: number;
}

export interface AdminOrderSummary {
  id: string;
  buyerId: string;
  buyerEmail: string;
  sellerId: string;
  sellerEmail: string;
  status: string;
  totalMinor: number;
  createdAt: string;
  itemTitlesEn: string[];
}

export interface AdminDisputeSummary {
  id: string;
  orderId: string;
  buyerId: string;
  buyerEmail: string;
  reason: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReportSummary {
  id: string;
  caseNumber: string;
  reporterEmail: string;
  target: "listing" | "user";
  targetId: string;
  reason: string;
  body: string;
  status: string;
  createdAt: string;
}

export interface AdminAuditLogEntry {
  id: number;
  actorEmail: string | null;
  action: string;
  targetKind: string;
  targetId: string;
  diff: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
}

export interface AdminDashboardStats {
  pendingListings: number;
  openDisputes: number;
  openReports: number;
  suspendedUsers: number;
  ordersToday: number;
  totalUsers: number;
  totalListings: number;
}

// ---------- helpers ----------

class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

let cachedAdminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new AdminAuthError(
      "Admin operations require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  cachedAdminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAdminClient;
}

async function getAuthenticatedAdmin(): Promise<{
  client: SupabaseClient;
  adminId: string;
  adminEmail: string;
}> {
  const client = getAdminClient();
  // Re-derive the caller identity from the access_token cookie that the
  // browser-publishable client wrote during sign-in. The service-role
  // client itself does not have a session; we manually verify the user's
  // JWT to extract their user id, then check `is_admin` against the
  // profiles table.
  const cookieStore = await cookies();
  const projectRef = (() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return null;
    try {
      return new URL(url).host.split(".")[0];
    } catch {
      return null;
    }
  })();
  const token =
    cookieStore.get("sb-access-token")?.value ||
    (projectRef
      ? cookieStore.get(`sb-${projectRef}-auth-token`)?.value
      : undefined);
  if (!token) {
    throw new AdminAuthError("Not signed in.");
  }
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    throw new AdminAuthError("Session is invalid.");
  }
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("is_admin, is_suspended")
    .eq("id", data.user.id)
    .single();
  if (profileError) {
    throw new AdminAuthError("Unable to load admin profile.");
  }
  if (!profile?.is_admin) {
    throw new AdminAuthError("Your account does not have admin privileges.");
  }
  if (profile.is_suspended) {
    throw new AdminAuthError("Your admin account has been suspended.");
  }
  return {
    client,
    adminId: data.user.id,
    adminEmail: data.user.email ?? "",
  };
}

async function writeAudit(
  client: SupabaseClient,
  actorId: string,
  action: string,
  targetKind: string,
  targetId: string,
  diff?: Record<string, unknown>,
  note?: string,
): Promise<void> {
  const { error } = await client.from("audit_log").insert({
    actor_id: actorId,
    action,
    target_kind: targetKind,
    target_id: targetId,
    diff: diff ?? null,
    note: note ?? null,
  });
  if (error) {
    // Audit failures must never silently pass — without a log entry we
    // cannot reconstruct what happened, so we surface the error to the
    // caller as a hard failure.
    throw new Error(`Audit write failed: ${error.message}`);
  }
}

// ---------- read actions ----------

export async function adminDashboardStats(): Promise<AdminDashboardStats> {
  const { client } = await getAuthenticatedAdmin();
  const [
    pendingListings,
    openDisputes,
    openReports,
    suspendedUsers,
    ordersToday,
    totalUsers,
    totalListings,
  ] = await Promise.all([
    client
      .from("listings")
      .select("id", { count: "exact", head: true })
      .is("approved_at", null),
    client
      .from("disputes")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "under_review"]),
    client
      .from("reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "investigating"]),
    client
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_suspended", true),
    client
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ),
    client.from("profiles").select("id", { count: "exact", head: true }),
    client.from("listings").select("id", { count: "exact", head: true }),
  ]);

  const errors = [
    pendingListings.error,
    openDisputes.error,
    openReports.error,
    suspendedUsers.error,
    ordersToday.error,
    totalUsers.error,
    totalListings.error,
  ].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? "Failed to load dashboard stats.");
  }

  return {
    pendingListings: pendingListings.count ?? 0,
    openDisputes: openDisputes.count ?? 0,
    openReports: openReports.count ?? 0,
    suspendedUsers: suspendedUsers.count ?? 0,
    ordersToday: ordersToday.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
    totalListings: totalListings.count ?? 0,
  };
}

export async function adminListPendingListings(): Promise<
  AdminListingSummary[]
> {
  const { client } = await getAuthenticatedAdmin();
  const { data, error } = await client
    .from("listings")
    .select(
      `id, seller_id, title_en, title_ar, price_minor, status, category,
       approved_at, created_at,
       seller:seller_id ( full_name_en, full_name_ar ),
       reports:reports ( id )`,
    )
    .is("approved_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  // Fetch seller emails separately so we don't grant admin permission
  // to read auth.users directly via RLS.
  const sellerIds = Array.from(
    new Set((data ?? []).map((row) => String(row.seller_id))),
  );
  const emails = await fetchUserEmails(client, sellerIds);

  return (data ?? []).map((row) => {
    const seller = row.seller as {
      full_name_en?: string;
      full_name_ar?: string;
    } | null;
    return {
      id: String(row.id),
      sellerId: String(row.seller_id),
      sellerNameEn: seller?.full_name_en ?? "",
      sellerNameAr: seller?.full_name_ar ?? "",
      sellerEmail: emails.get(String(row.seller_id)) ?? "",
      titleEn: String(row.title_en ?? ""),
      titleAr: String(row.title_ar ?? ""),
      priceMinor: Number(row.price_minor ?? 0),
      status: String(row.status),
      category: String(row.category ?? ""),
      approvedAt: row.approved_at ? String(row.approved_at) : null,
      createdAt: String(row.created_at),
      reportCount: Array.isArray(row.reports) ? row.reports.length : 0,
    };
  });
}

export async function adminListOrders(): Promise<AdminOrderSummary[]> {
  const { client } = await getAuthenticatedAdmin();
  const { data, error } = await client
    .from("orders")
    .select(
      `id, buyer_id, seller_id, status, total_minor, created_at,
       items:order_items ( title_en_at_purchase )`,
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  const userIds = Array.from(
    new Set(
      (data ?? []).flatMap((row) => [
        String(row.buyer_id),
        String(row.seller_id),
      ]),
    ),
  );
  const emails = await fetchUserEmails(client, userIds);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    buyerId: String(row.buyer_id),
    buyerEmail: emails.get(String(row.buyer_id)) ?? "",
    sellerId: String(row.seller_id),
    sellerEmail: emails.get(String(row.seller_id)) ?? "",
    status: String(row.status),
    totalMinor: Number(row.total_minor ?? 0),
    createdAt: String(row.created_at),
    itemTitlesEn: Array.isArray(row.items)
      ? row.items.map((i: { title_en_at_purchase?: string }) =>
          String(i.title_en_at_purchase ?? ""),
        )
      : [],
  }));
}

export async function adminListDisputes(): Promise<AdminDisputeSummary[]> {
  const { client } = await getAuthenticatedAdmin();
  const { data, error } = await client
    .from("disputes")
    .select(
      "id, order_id, buyer_id, reason, body, status, created_at, updated_at",
    )
    .in("status", ["open", "under_review"])
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const buyerIds = Array.from(
    new Set((data ?? []).map((row) => String(row.buyer_id))),
  );
  const emails = await fetchUserEmails(client, buyerIds);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    orderId: String(row.order_id),
    buyerId: String(row.buyer_id),
    buyerEmail: emails.get(String(row.buyer_id)) ?? "",
    reason: String(row.reason ?? ""),
    body: String(row.body ?? ""),
    status: String(row.status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function adminListReports(): Promise<AdminReportSummary[]> {
  const { client } = await getAuthenticatedAdmin();
  const { data, error } = await client
    .from("reports")
    .select(
      "id, case_number, reporter_id, target, target_id, reason, body, status, created_at",
    )
    .in("status", ["open", "investigating"])
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const reporterIds = Array.from(
    new Set((data ?? []).map((row) => String(row.reporter_id))),
  );
  const emails = await fetchUserEmails(client, reporterIds);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    caseNumber: String(row.case_number),
    reporterEmail: emails.get(String(row.reporter_id)) ?? "",
    target: row.target as "listing" | "user",
    targetId: String(row.target_id),
    reason: String(row.reason),
    body: String(row.body ?? ""),
    status: String(row.status),
    createdAt: String(row.created_at),
  }));
}

export async function adminListUsers(): Promise<AdminProfileSummary[]> {
  const { client } = await getAuthenticatedAdmin();
  const { data, error } = await client
    .from("profiles")
    .select(
      "id, full_name_en, full_name_ar, handle, avatar_url, is_admin, is_suspended, suspended_reason, suspended_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((row) => String(row.id));
  const emails = await fetchUserEmails(client, ids);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    email: emails.get(String(row.id)) ?? "",
    fullNameEn: String(row.full_name_en ?? ""),
    fullNameAr: String(row.full_name_ar ?? ""),
    handle: row.handle == null ? null : String(row.handle),
    avatarUrl: row.avatar_url == null ? null : String(row.avatar_url),
    isAdmin: Boolean(row.is_admin),
    isSuspended: Boolean(row.is_suspended),
    suspendedReason:
      row.suspended_reason == null ? null : String(row.suspended_reason),
    suspendedAt: row.suspended_at == null ? null : String(row.suspended_at),
    createdAt: String(row.created_at),
  }));
}

export async function adminListAuditLog(
  targetKind?: string,
  targetId?: string,
): Promise<AdminAuditLogEntry[]> {
  const { client } = await getAuthenticatedAdmin();
  let query = client
    .from("audit_log")
    .select(
      "id, actor_id, action, target_kind, target_id, diff, note, created_at",
    );
  if (targetKind && targetId) {
    query = query.eq("target_kind", targetKind).eq("target_id", targetId);
  }
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const actorIds = Array.from(
    new Set(
      (data ?? [])
        .map((row) => (row.actor_id ? String(row.actor_id) : null))
        .filter((v): v is string => v !== null),
    ),
  );
  const emails = await fetchUserEmails(client, actorIds);
  return (data ?? []).map((row) => ({
    id: Number(row.id),
    actorEmail: row.actor_id
      ? (emails.get(String(row.actor_id)) ?? null)
      : null,
    action: String(row.action),
    targetKind: String(row.target_kind),
    targetId: String(row.target_id),
    diff: (row.diff as Record<string, unknown> | null) ?? null,
    note: row.note == null ? null : String(row.note),
    createdAt: String(row.created_at),
  }));
}

// ---------- write actions ----------

export async function adminApproveListing(listingId: string): Promise<void> {
  const { client, adminId } = await getAuthenticatedAdmin();
  const now = new Date().toISOString();
  const { error } = await client
    .from("listings")
    .update({ approved_at: now })
    .eq("id", listingId);
  if (error) throw new Error(error.message);
  await writeAudit(client, adminId, "listing.approve", "listing", listingId, {
    approved_at: now,
  });
}

export async function adminRejectListing(
  listingId: string,
  reason: string,
): Promise<void> {
  const { client, adminId } = await getAuthenticatedAdmin();
  const { error } = await client
    .from("listings")
    .update({ status: "archived" })
    .eq("id", listingId);
  if (error) throw new Error(error.message);
  await writeAudit(
    client,
    adminId,
    "listing.reject",
    "listing",
    listingId,
    { status: "archived" },
    reason,
  );
}

export async function adminFeatureListing(
  listingId: string,
  sortOrder: number,
  noteEn: string,
  noteAr: string,
): Promise<void> {
  const { client, adminId } = await getAuthenticatedAdmin();
  const { error } = await client.from("featured_listings").upsert(
    {
      listing_id: listingId,
      curator_id: adminId,
      sort_order: sortOrder,
      note_en: noteEn,
      note_ar: noteAr,
    },
    { onConflict: "listing_id" },
  );
  if (error) throw new Error(error.message);
  await writeAudit(client, adminId, "listing.feature", "listing", listingId, {
    sort_order: sortOrder,
  });
}

export async function adminUnfeatureListing(listingId: string): Promise<void> {
  const { client, adminId } = await getAuthenticatedAdmin();
  const { error } = await client
    .from("featured_listings")
    .delete()
    .eq("listing_id", listingId);
  if (error) throw new Error(error.message);
  await writeAudit(client, adminId, "listing.unfeature", "listing", listingId);
}

export async function adminSuspendUser(
  userId: string,
  reason: string,
): Promise<void> {
  const { client, adminId } = await getAuthenticatedAdmin();
  const now = new Date().toISOString();
  const { error } = await client
    .from("profiles")
    .update({
      is_suspended: true,
      suspended_reason: reason,
      suspended_at: now,
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  await writeAudit(client, adminId, "user.suspend", "user", userId, {
    is_suspended: true,
    reason,
  });
}

export async function adminUnsuspendUser(userId: string): Promise<void> {
  const { client, adminId } = await getAuthenticatedAdmin();
  const { error } = await client
    .from("profiles")
    .update({
      is_suspended: false,
      suspended_reason: null,
      suspended_at: null,
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  await writeAudit(client, adminId, "user.unsuspend", "user", userId, {
    is_suspended: false,
  });
}

export async function adminResolveDispute(
  disputeId: string,
  status: "resolved" | "rejected",
  noteEn: string,
  noteAr: string,
): Promise<void> {
  const { client, adminId } = await getAuthenticatedAdmin();
  const now = new Date().toISOString();
  // Read the existing timeline so we can append rather than overwrite.
  const { data: current, error: loadError } = await client
    .from("disputes")
    .select("timeline")
    .eq("id", disputeId)
    .single();
  if (loadError) throw new Error(loadError.message);
  const timeline: unknown[] = Array.isArray(current?.timeline)
    ? current.timeline
    : [];
  timeline.unshift({
    status,
    noteEn,
    noteAr,
    at: now,
  });
  const { error } = await client
    .from("disputes")
    .update({ status, timeline })
    .eq("id", disputeId);
  if (error) throw new Error(error.message);
  await writeAudit(client, adminId, "dispute.resolve", "dispute", disputeId, {
    status,
  });
}

export async function adminTriageReport(
  reportId: string,
  status: "investigating" | "resolved" | "dismissed",
  note?: string,
): Promise<void> {
  const { client, adminId } = await getAuthenticatedAdmin();
  const { error } = await client
    .from("reports")
    .update({ status })
    .eq("id", reportId);
  if (error) throw new Error(error.message);
  await writeAudit(
    client,
    adminId,
    "report.triage",
    "report",
    reportId,
    { status },
    note,
  );
}

export async function adminBroadcastNotification(input: {
  kind: "system" | "order" | "price_drop";
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  expiresAt?: string;
}): Promise<void> {
  const { client, adminId } = await getAuthenticatedAdmin();
  const { error } = await client.from("broadcast_notifications").insert({
    author_id: adminId,
    kind: input.kind,
    title_en: input.titleEn,
    title_ar: input.titleAr,
    body_en: input.bodyEn,
    body_ar: input.bodyAr,
    expires_at: input.expiresAt ?? null,
  });
  if (error) throw new Error(error.message);
  await writeAudit(
    client,
    adminId,
    "notification.broadcast",
    "notification",
    "broadcast",
    { kind: input.kind },
  );
}

// ---------- internal helpers ----------

async function fetchUserEmails(
  client: SupabaseClient,
  userIds: string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();

  const uniqueIds = Array.from(new Set(userIds));
  const { data, error } = await client.rpc("admin_get_user_emails", {
    user_ids: uniqueIds,
  });

  if (error) return new Map();

  const result = new Map<string, string>();
  for (const user of data ?? []) {
    result.set(user.id, user.email ?? "");
  }

  return result;
}
