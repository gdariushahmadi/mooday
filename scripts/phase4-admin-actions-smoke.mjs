/**
 * Admin Server Actions smoke test.
 *
 * Promotes a freshly created user to admin via direct SQL, then calls
 * the admin Server Actions (via direct Supabase queries that
 * mirror the actions' SQL) to verify the data path works.
 *
 * We don't proxy through the Next.js runtime here (that needs a
 * running dev server); instead we exercise the same queries the
 * Server Actions run, which is what the smoke test for the other
 * domains does.
 */
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

const url = "http://127.0.0.1:54321";
const publishable = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const serviceRole = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let pass = 0;
let fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log(`  ok  ${label}`); }
  else { fail++; console.log(`  FAIL ${label}${detail ? " \u2014 " + detail : ""}`); }
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const adminEmail = `admin-${suffix}@mooday.test`;
const buyerEmail = `admin-buyer-${suffix}@mooday.test`;
const pw = "Mooday-Admin-42!";

// Seed admin user via service-role.
const { data: adminUser } = await admin.auth.admin.createUser({
  email: adminEmail, password: pw, email_confirm: true,
});
const adminId = adminUser.user.id;

// Promote to admin.
const { error: promoteErr } = await admin
  .from("profiles")
  .update({ is_admin: true })
  .eq("id", adminId);
check("admin promoted", !promoteErr, promoteErr?.message);

// Seed a buyer + order + listing for the dashboard.
const { data: buyerUser } = await admin.auth.admin.createUser({
  email: buyerEmail, password: pw, email_confirm: true,
});
const buyerId = buyerUser.user.id;

const { data: listing } = await admin.from("listings").insert({
  seller_id: adminId,
  title_en: "Admin Listing", title_ar: "قائمة الإدارة",
  description_en: "Test", description_ar: "اختبار",
  price_minor: 5000, currency: "AED",
  condition_en: "New", condition_ar: "جديد",
  category: "Bags", mode: "resell", status: "active", is_authentic: true,
}).select("*").single();

const { data: order } = await admin.from("orders").insert({
  buyer_id: buyerId,
  seller_id: adminId,
  status: "paid",
  shipping_address: { cityEn: "Dubai", cityAr: "\u062f\u0628\u064a", streetEn: "St", streetAr: "\u0634" },
  items_subtotal_minor: 5000,
  shipping_fee_minor: 500,
  total_minor: 5500,
  payment_method: "card",
  payment_brand_en: "Visa", payment_brand_ar: "\u0641\u064a\u0632\u0627", payment_last4: "4242",
}).select("*").single();

const { data: report } = await admin.from("reports").insert({
  case_number: `MOODAY-ADMIN-${suffix}`,
  reporter_id: buyerId,
  target: "listing",
  target_id: listing.id,
  reason: "spam",
  body: "test",
}).select("*").single();

// adminDashboardStats equivalent
const { count: totalUsers } = await admin
  .from("profiles")
  .select("id", { count: "exact", head: true });
check("admin counts profiles", typeof totalUsers === "number");

const { count: totalListings } = await admin
  .from("listings")
  .select("id", { count: "exact", head: true });
check("admin counts listings", typeof totalListings === "number");

const { count: ordersCount } = await admin
  .from("orders")
  .select("id", { count: "exact", head: true });
check("admin counts orders", typeof ordersCount === "number");

// adminListOrders
const { data: orders } = await admin
  .from("orders")
  .select("id, buyer_id, seller_id, status, total_minor, currency, created_at")
  .order("created_at", { ascending: false })
  .limit(50);
check("admin lists orders", Array.isArray(orders) && orders.length >= 1);

// adminListReports
const { data: reports } = await admin
  .from("reports")
  .select("id, case_number, reporter_id, target, target_id, reason, status, created_at, updated_at")
  .order("created_at", { ascending: false })
  .limit(50);
check("admin lists reports", Array.isArray(reports) && reports.length >= 1);

// adminSuspendUser
const { error: suspendErr } = await admin
  .from("profiles")
  .update({
    is_suspended: true,
    suspended_reason: "smoke test",
    suspended_at: new Date().toISOString(),
  })
  .eq("id", buyerId);
check("admin suspends user", !suspendErr, suspendErr?.message);

// Verify the suspended state.
const { data: suspendedProfile } = await admin
  .from("profiles")
  .select("is_suspended,suspended_reason")
  .eq("id", buyerId)
  .single();
check("suspension persisted", suspendedProfile?.is_suspended === true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
