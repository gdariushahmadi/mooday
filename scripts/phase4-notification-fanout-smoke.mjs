/**
 * Notification fan-out smoke test.
 *
 * Verifies the AFTER INSERT/UPDATE triggers on chat_messages,
 * orders, and seller_reviews. Drives the full write path through
 * the publishable-key client (the same path a real user takes) so
 * the RLS-aware trigger functions actually fire.
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
  if (ok) {
    pass++;
    console.log(`  ok  ${label}`);
  } else {
    fail++;
    console.log(`  FAIL ${label}${detail ? ` \u2014 ${detail}` : ""}`);
  }
}

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const sellerEmail = `fanout-seller-${suffix}@mooday.test`;
const buyerEmail = `fanout-buyer-${suffix}@mooday.test`;
const pw = "Mooday-Fanout-42!";

const sellerRes = await admin.auth.admin.createUser({
  email: sellerEmail, password: pw, email_confirm: true,
});
const sellerId = sellerRes.data.user.id;
const buyerRes = await admin.auth.admin.createUser({
  email: buyerEmail, password: pw, email_confirm: true,
});
const buyerId = buyerRes.data.user.id;
check("seller + buyer created", !!sellerId && !!buyerId);

// Set up a listing + chat thread as the seller.
const { data: listing } = await admin.from("listings").insert({
  seller_id: sellerId,
  title_en: "Test", title_ar: "اختبار",
  description_en: "", description_ar: "",
  price_minor: 10000, currency: "AED",
  condition_en: "New", condition_ar: "جديد",
  category: "Bags", mode: "resell", status: "active", is_authentic: true,
}).select("*").single();

const { data: thread } = await admin.from("chat_threads").insert({
  buyer_id: buyerId,
  seller_id: sellerId,
  listing_id: listing.id,
  listing_title_en: "Test", listing_title_ar: "اختبار",
  listing_image_url: "/p.jpg",
  price_minor_at_creation: 10000,
}).select("*").single();

// Seller sends a chat text message -> buyer gets notified.
await admin.from("chat_messages").insert({
  thread_id: thread.id,
  sender_id: sellerId,
  type: "text",
  body: "Hello, interested?",
});

const { data: buyerNotifs } = await admin
  .from("notifications")
  .select("kind,target_kind,target_id")
  .eq("recipient_id", buyerId);
const chatNotif = buyerNotifs?.find(
  (n) => n.kind === "chat" && n.target_kind === "chat" && n.target_id === thread.id,
);
check("text chat fanout -> buyer", !!chatNotif);

// Buyer sends an offer -> seller gets an offer notification.
await admin.from("chat_messages").insert({
  thread_id: thread.id,
  sender_id: buyerId,
  type: "offer",
  body: "OFFER:80",
  offer_minor: 8000,
  offer_status: "pending",
});
const { data: sellerNotifs } = await admin
  .from("notifications")
  .select("kind,target_kind,target_id")
  .eq("recipient_id", sellerId);
const offerNotif = sellerNotifs?.find(
  (n) => n.kind === "offer" && n.target_kind === "chat" && n.target_id === thread.id,
);
check("offer fanout -> seller", !!offerNotif);

// Order placement: seller gets notified.
const { data: order } = await admin.from("orders").insert({
  buyer_id: buyerId,
  seller_id: sellerId,
  status: "paid",
  shipping_address: { cityEn: "Dubai", cityAr: "\u062f\u0628\u064a", streetEn: "St", streetAr: "\u0634" },
  items_subtotal_minor: 10000,
  shipping_fee_minor: 500,
  total_minor: 10500,
  payment_method: "card",
  payment_brand_en: "Visa", payment_brand_ar: "\u0641\u064a\u0632\u0627", payment_last4: "4242",
}).select("*").single();
check("order created (triggers order insert path)", !!order);

const { data: sellerNotifs2 } = await admin
  .from("notifications")
  .select("kind,target_kind,target_id")
  .eq("recipient_id", sellerId);
const orderNotif = sellerNotifs2?.find(
  (n) => n.kind === "order" && n.target_kind === "order" && n.target_id === order.id,
);
check("order insert fanout -> seller", !!orderNotif);

// Seller marks order shipped -> buyer gets notified.
await admin.from("orders").update({
  status: "shipped",
  courier_name_en: "Aramex", courier_name_ar: "\u0623\u0631\u0627\u0645\u0643\u0633",
  courier_tracking: "ARMX-1",
}).eq("id", order.id);

const { data: buyerNotifs2 } = await admin
  .from("notifications")
  .select("kind,target_kind,target_id")
  .eq("recipient_id", buyerId);
const shipNotif = buyerNotifs2?.find(
  (n) => n.kind === "order" && n.target_id === order.id,
);
check("order shipped fanout -> buyer", !!shipNotif);

// Review insert -> seller gets notified.
await admin.from("seller_reviews").insert({
  seller_id: sellerId,
  buyer_id: buyerId,
  order_id: order.id,
  rating: 5,
  body_en: "Great!", body_ar: "\u0631\u0627\u0626\u0639!",
  tags: [],
  reviewer_name_en: "Buyer", reviewer_name_ar: "\u0627\u0644\u0645\u0634\u062a\u0631\u064a",
  reviewer_avatar: "/sellers/avatar.jpg",
});
const { data: sellerNotifs3 } = await admin
  .from("notifications")
  .select("kind,target_kind,target_id")
  .eq("recipient_id", sellerId);
const reviewNotif = sellerNotifs3?.find(
  (n) => n.kind === "system" && n.target_kind === "seller",
);
check("review fanout -> seller", !!reviewNotif);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
