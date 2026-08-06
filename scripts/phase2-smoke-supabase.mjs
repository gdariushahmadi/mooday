/**
 * Phase 2/3/4 E2E smoke test.
 *
 * Drives the wired flows against a running local Supabase:
 *   - Creates seller + buyer users via the admin API
 *   - Inserts a listing as the seller (via service-role)
 *   - Creates a buyer-side order that references that listing
 *   - Adds a chat thread + text message + offer message
 *   - Submits a report and opens a dispute
 *   - Adds a payment method and a block
 *   - Verifies RLS isolation: the buyer cannot see the seller's
 *     payment_methods or blocked_users, only their own.
 *
 * Run after `npx supabase start` + the standard migration set.
 */
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publishable || !serviceRole) {
  throw new Error(
    "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY.",
  );
}
if (!new URL(url).hostname.match(/^(127\.0\.0\.1|localhost)$/)) {
  throw new Error("Smoke test refuses to run against non-local URLs.");
}

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

async function main() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const sellerEmail = `phase2-seller-${suffix}@mooday.test`;
  const buyerEmail = `phase2-buyer-${suffix}@mooday.test`;
  const pw = "Mooday-Smoke-42!";

  console.log("Creating users...");
  const { data: sellerCreated, error: sellerErr } =
    await admin.auth.admin.createUser({
      email: sellerEmail,
      password: pw,
      email_confirm: true,
    });
  check("seller user created", !sellerErr && !!sellerCreated?.user?.id,
    sellerErr?.message);
  const sellerId = sellerCreated.user.id;

  const { data: buyerCreated, error: buyerErr } =
    await admin.auth.admin.createUser({
      email: buyerEmail,
      password: pw,
      email_confirm: true,
    });
  check("buyer user created", !buyerErr && !!buyerCreated?.user?.id,
    buyerErr?.message);
  const buyerId = buyerCreated.user.id;

  // ---------- listings ----------
  console.log("\nlistings slice:");
  const { data: listing, error: listingErr } = await admin
    .from("listings")
    .insert({
      seller_id: sellerId,
      title_en: "Smoke Test Bag",
      title_ar: "حقيبة اختبار",
      description_en: "Test",
      description_ar: "اختبار",
      price_minor: 10000,
      currency: "AED",
      condition_en: "New",
      condition_ar: "جديد",
      category: "Bags",
      mode: "resell",
      status: "active",
      is_authentic: true,
    })
    .select("*")
    .single();
  check("listing created", !listingErr && !!listing?.id, listingErr?.message);
  const listingId = listing?.id;

  // ---------- orders ----------
  console.log("\norders slice:");
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      status: "paid",
      shipping_address: {
        cityEn: "Dubai",
        cityAr: "\u062f\u0628\u064a",
        streetEn: "1 St",
        streetAr: "\u0634\u0627\u0631\u0639 ١",
        fullNameEn: "Buyer",
        fullNameAr: "\u0627\u0644\u0645\u0634\u062a\u0631\u064a",
      },
      items_subtotal_minor: 10000,
      shipping_fee_minor: 500,
      total_minor: 10500,
      payment_method: "card",
      payment_brand_en: "Visa",
      payment_brand_ar: "\u0641\u064a\u0632\u0627",
      payment_last4: "4242",
    })
    .select("*")
    .single();
  check("order created", !orderErr && !!order?.id, orderErr?.message);

  if (order?.id && listingId) {
    const { error: itemErr } = await admin.from("order_items").insert({
      order_id: order.id,
      listing_id: listingId,
      title_en_at_purchase: "Smoke Test Bag",
      title_ar_at_purchase: "\u062d\u0642\u064a\u0628\u0629 \u0627\u062e\u062a\u0628\u0627\u0631",
      image_url_at_purchase: "/products/test.jpg",
      price_minor_at_purchase: 10000,
      quantity: 1,
    });
    check("order item created", !itemErr, itemErr?.message);
  }

  // ---------- chat + offer ----------
  console.log("\nchat slice:");
  const { data: thread, error: threadErr } = await admin
    .from("chat_threads")
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId,
      listing_title_en: "Smoke Test Bag",
      listing_title_ar: "\u062d\u0642\u064a\u0628\u0629 \u0627\u062e\u062a\u0628\u0627\u0631",
      listing_image_url: "/products/test.jpg",
      price_minor_at_creation: 10000,
    })
    .select("*")
    .single();
  check("chat thread created", !threadErr && !!thread?.id, threadErr?.message);

  if (thread?.id) {
    const { error: msgErr } = await admin.from("chat_messages").insert({
      thread_id: thread.id,
      sender_id: buyerId,
      type: "text",
      body: "Is this authentic?",
    });
    check("text message inserted", !msgErr, msgErr?.message);

    const { error: offerErr } = await admin.from("chat_messages").insert({
      thread_id: thread.id,
      sender_id: buyerId,
      type: "offer",
      body: "OFFER:80",
      offer_minor: 8000,
      offer_status: "pending",
    });
    check("offer message inserted", !offerErr, offerErr?.message);
  }

  // ---------- reports ----------
  console.log("\nreports slice:");
  const { data: report, error: reportErr } = await admin.from("reports").insert({
    case_number: `MOODAY-SMOKE-${suffix}`,
    reporter_id: buyerId,
    target: "listing",
    target_id: listingId,
    reason: "spam",
    body: "Smoke test report",
  }).select("*").single();
  check("report created with case number", !reportErr && report?.case_number?.startsWith("MOODAY-SMOKE-"), reportErr?.message);

  // ---------- disputes ----------
  console.log("\ndisputes slice:");
  if (order?.id) {
    const { data: dispute, error: disputeErr } = await admin.from("disputes").insert({
      order_id: order.id,
      buyer_id: buyerId,
      reason: "not_as_described",
      body: "Smoke test dispute",
      timeline: [
        {
          status: "open",
          note_en: "Dispute opened",
          note_ar: "\u062a\u0645 \u0641\u062a\u062d \u0627\u0644\u0646\u0632\u0627\u0639",
          at: new Date().toISOString(),
        },
      ],
    }).select("*").single();
    check("dispute created", !disputeErr && !!dispute?.id, disputeErr?.message);
  }

  // ---------- notifications ----------
  console.log("\nnotifications slice:");
  const { error: notifErr } = await admin.from("notifications").insert({
    recipient_id: buyerId,
    kind: "chat",
    title_en: "New message",
    title_ar: "\u0631\u0633\u0627\u0644\u0629 \u062c\u062f\u064a\u062f\u0629",
    body_en: "Hi",
    body_ar: "\u0645\u0631\u062d\u0628\u0627",
    target_kind: "chat",
    target_id: thread?.id ?? null,
  });
  check("notification created", !notifErr, notifErr?.message);

  // ---------- reviews ----------
  console.log("\nreviews slice:");
  if (order?.id) {
    const { error: reviewErr } = await admin.from("seller_reviews").insert({
      seller_id: sellerId,
      buyer_id: buyerId,
      order_id: order.id,
      rating: 5,
      body_en: "Great!",
      body_ar: "\u0631\u0627\u0626\u0639!",
      tags: ["as_described", "fast_shipping"],
    });
    check("seller review created", !reviewErr, reviewErr?.message);
  }

  // ---------- payment methods ----------
  console.log("\npayment methods slice:");
  const { error: pmErr } = await admin.from("payment_methods").insert({
    owner_id: buyerId,
    label_en: "Personal Visa",
    label_ar: "\u0641\u064a\u0632\u0627 \u0634\u062e\u0635\u064a\u0629",
    brand_en: "Visa",
    brand_ar: "\u0641\u064a\u0632\u0627",
    last4: "4242",
    holder_en: "Buyer",
    holder_ar: "\u0627\u0644\u0645\u0634\u062a\u0631\u064a",
    expiry: "11/27",
    is_default: true,
  });
  check("payment method created", !pmErr, pmErr?.message);

  // ---------- blocked users ----------
  console.log("\nblocked users slice:");
  const { error: blockErr } = await admin.from("blocked_users").insert({
    blocker_id: buyerId,
    blocked_id: sellerId,
    blocked_name_en: "Spammy Seller",
    blocked_name_ar: "\u0628\u0627\u0626\u0639 \u0645\u062a\u0644\u0627\u063a\u064a",
    blocked_avatar: "/sellers/placeholder.svg",
    reason_en: "Spam",
    reason_ar: "\u0631\u0633\u0627\u0626\u0644 \u0645\u062a\u0644\u0627\u063a\u064a\u0629",
  });
  check("blocked user inserted", !blockErr, blockErr?.message);

  // ---------- RLS isolation (via the buyer's session JWT) ----------
  console.log("\nRLS isolation:");
  const buyerClient = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: buyerSession, error: signInErr } =
    await buyerClient.auth.signInWithPassword({
      email: buyerEmail,
      password: pw,
    });
  check("buyer session established", !signInErr && !!buyerSession?.session?.access_token,
    signInErr?.message);

  if (buyerSession?.session?.access_token) {
    const headers = {
      Authorization: `Bearer ${buyerSession.session.access_token}`,
      apikey: publishable,
    };
    // Buyer can see their own payment methods
    const pmRes = await fetch(
      `${url}/rest/v1/payment_methods?select=id,owner_id`,
      { headers },
    );
    const pmBody = await pmRes.json();
    check(
      "buyer reads own payment_methods",
      pmRes.ok && Array.isArray(pmBody) && pmBody.length === 1,
      JSON.stringify(pmBody).slice(0, 200),
    );
    // Buyer cannot read seller's payment methods (none exist) but
    // we also assert that no row whose owner_id is sellerId leaks.
    const leaksSellerPm = pmBody.some((r) => r.owner_id === sellerId);
    check("buyer cannot read seller's payment_methods", !leaksSellerPm);

    // Buyer can read their own blocked_users
    const blockRes = await fetch(
      `${url}/rest/v1/blocked_users?select=id,blocker_id,blocked_id`,
      { headers },
    );
    const blockBody = await blockRes.json();
    check(
      "buyer reads own blocked_users",
      blockRes.ok && Array.isArray(blockBody) && blockBody.length === 1,
      JSON.stringify(blockBody).slice(0, 200),
    );
    // No leaked row where blocker_id is anyone else
    const leaksBlock = blockBody.some((r) => r.blocker_id !== buyerId);
    check("buyer cannot read others' blocked_users", !leaksBlock);

    // Buyer can read their own orders (1)
    const orderRes = await fetch(
      `${url}/rest/v1/orders?select=id,buyer_id,seller_id`,
      { headers },
    );
    const orderBody = await orderRes.json();
    check(
      "buyer reads own orders",
      orderRes.ok && Array.isArray(orderBody) && orderBody.length === 1,
    );
    const leaksOrder = orderBody.some((r) => r.buyer_id !== buyerId);
    check("buyer cannot read other buyers' orders", !leaksOrder);

    // Buyer can read their own chat thread
    const threadRes = await fetch(
      `${url}/rest/v1/chat_threads?select=id,buyer_id,seller_id`,
      { headers },
    );
    const threadBody = await threadRes.json();
    check(
      "buyer reads own chat thread",
      threadRes.ok && Array.isArray(threadBody) && threadBody.length === 1,
    );

    // Buyer can read their own notifications
    const notifRes = await fetch(
      `${url}/rest/v1/notifications?select=id,recipient_id`,
      { headers },
    );
    const notifBody = await notifRes.json();
    check(
      "buyer reads own notifications",
      notifRes.ok && Array.isArray(notifBody) && notifBody.length === 1,
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
