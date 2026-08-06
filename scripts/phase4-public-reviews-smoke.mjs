/**
 * Phase 4 PublicSellerProfile smoke test.
 *
 * Verifies that the AppContext.addMyReview path produces a review whose
 * snapshot fields (reviewer name + avatar) are readable from a public
 * profile surface. We exercise the same insert shape the adapter uses
 * (with reviewer_name_en/ar/avatar) and then read it back as an
 * authenticated user \u2014 the policy `seller_reviews_select_all` permits
 * `anon` and `authenticated`, and the wire flow always runs with at
 * least a session.
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

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const sellerEmail = `phase4-seller-${suffix}@mooday.test`;
const buyerEmail = `phase4-buyer-${suffix}@mooday.test`;
const pw = "Mooday-Phase4-42!";

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

const sellerRes = await admin.auth.admin.createUser({
  email: sellerEmail, password: pw, email_confirm: true,
});
const sellerId = sellerRes.data.user.id;
check("seller created", !!sellerId);

const buyerRes = await admin.auth.admin.createUser({
  email: buyerEmail, password: pw, email_confirm: true,
});
const buyerId = buyerRes.data.user.id;
check("buyer created", !!buyerId);

// Same insert shape AppContext.addMyReview uses.
const { data: review, error: reviewErr } = await admin
  .from("seller_reviews")
  .insert({
    seller_id: sellerId,
    buyer_id: buyerId,
    order_id: null,
    rating: 5,
    body_en: "Excellent seller",
    body_ar: "\u0628\u0627\u0626\u0639 \u0645\u0645\u062a\u0627\u0632",
    tags: ["as_described"],
    reviewer_name_en: "Layla M.",
    reviewer_name_ar: "\u0644\u064a\u0644\u0627 \u0645.",
    reviewer_avatar: "/sellers/avatar.jpg",
  })
  .select("*")
  .single();
check("review with snapshot fields created", !reviewErr && !!review, reviewErr?.message);
check("reviewer_name_en snapshot", review?.reviewer_name_en === "Layla M.");
check("reviewer_name_ar snapshot", review?.reviewer_name_ar === "\u0644\u064a\u0644\u0627 \u0645.");
check("reviewer_avatar snapshot", review?.reviewer_avatar === "/sellers/avatar.jpg");

// A second signed-in user reads reviews via the publishable key +
// session JWT. This is the same code path PublicSellerProfile uses.
const readerClient = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const readerEmail = `phase4-reader-${suffix}@mooday.test`;
await admin.auth.admin.createUser({
  email: readerEmail, password: pw, email_confirm: true,
});
const { data: readerSession } = await readerClient.auth.signInWithPassword({
  email: readerEmail, password: pw,
});
check("reader session established", !!readerSession?.session?.access_token);

if (readerSession?.session?.access_token) {
  const { data: reviews, error: readErr } = await readerClient
    .from("seller_reviews")
    .select("id,seller_id,rating,body_en,reviewer_name_en,reviewer_avatar")
    .eq("seller_id", sellerId);
  check("reader reads seller reviews", !readErr && Array.isArray(reviews) && reviews.length === 1, readErr?.message);
  check(
    "reader sees reviewer name snapshot",
    reviews?.[0]?.reviewer_name_en === "Layla M.",
  );
  check(
    "reader sees reviewer avatar",
    reviews?.[0]?.reviewer_avatar === "/sellers/avatar.jpg",
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
