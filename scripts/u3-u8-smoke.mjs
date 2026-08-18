/**
 * Phase 1, slices U3 + U8: smoke tests for the new RPCs and tables.
 *
 *   - search_listings(query text, filters jsonb) returns ranked rows.
 *   - search_listings with an Arabic query returns the same listings as
 *     the English query (covers AE4).
 *   - user_follows table allows self-managed insert/delete.
 *
 * Run after `npx supabase start` and `npx supabase db reset` (which
 * applies all migrations including the new search_listings and
 * user_follows).
 *
 *   node scripts/u3-u8-smoke.mjs
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

function assert(condition, message) {
  if (!condition) throw new Error(`assert failed: ${message}`);
}

async function main() {
  // ---------- search_listings RPC ----------
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sellerEmail = `smoke-search-seller-${suffix}@example.test`;
  const sellerPassword = "Mooday-smoke-42!";

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: sellerEmail,
      password: sellerPassword,
      email_confirm: true,
    });
  if (createError) throw createError;
  const sellerId = created.user?.id;
  if (!sellerId) throw new Error("Failed to create seller.");
  console.log("seller:", sellerId);

  // Insert one listing with an Arabic + English title.
  const { data: listing, error: listingError } = await admin
    .from("listings")
    .insert({
      seller_id: sellerId,
      title_en: "Vintage floral dress",
      title_ar: "فستان زهري قديم",
      description_en: "A beautiful vintage floral dress from the 70s.",
      description_ar: "فستان زهري جميل من السبعينيات.",
      price_minor: 25000,
      currency: "AED",
      condition_en: "Used - Excellent",
      condition_ar: "مستعمل - ممتاز",
      category: "dresses",
      size: "M",
      color_en: "Floral",
      color_ar: "زهري",
      mode: "resell",
      status: "active",
      is_authentic: true,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (listingError) throw listingError;
  console.log("listing:", listing.id);

  // Arabic query — should match the listing.
  const { data: arabicResults, error: arabicError } = await admin.rpc(
    "search_listings",
    { query: "فستان", filters: { status: "active" } },
  );
  if (arabicError) throw arabicError;
  assert(
    Array.isArray(arabicResults) && arabicResults.length >= 1,
    "Arabic query should return at least one listing.",
  );
  const arabicIds = arabicResults.map((r) => String(r.id));
  assert(
    arabicIds.includes(listing.id),
    `Arabic query should include the inserted listing. Got: ${arabicIds.join(",")}`,
  );

  // English query — should match the same listing.
  const { data: englishResults, error: englishError } = await admin.rpc(
    "search_listings",
    { query: "dress", filters: { status: "active" } },
  );
  if (englishError) throw englishError;
  const englishIds = englishResults.map((r) => String(r.id));
  assert(
    englishIds.includes(listing.id),
    `English query should include the inserted listing. Got: ${englishIds.join(",")}`,
  );
  console.log("search_listings: both queries returned the listing.");

  // Empty query — should return recent listings.
  const { data: emptyResults, error: emptyError } = await admin.rpc(
    "search_listings",
    { query: "", filters: { status: "active", limit: 5 } },
  );
  if (emptyError) throw emptyError;
  assert(
    Array.isArray(emptyResults),
    "Empty query should return an array.",
  );
  console.log(`search_listings(''): returned ${emptyResults.length} rows.`);

  // Cleanup the listing.
  await admin.from("listings").delete().eq("id", listing.id);

  // ---------- user_follows table ----------
  // Create a second user to follow.
  const buyerEmail = `smoke-follow-buyer-${suffix}@example.test`;
  const { data: buyer, error: buyerError } = await admin.auth.admin.createUser({
    email: buyerEmail,
    password: sellerPassword,
    email_confirm: true,
  });
  if (buyerError) throw buyerError;
  const buyerId = buyer.user?.id;
  if (!buyerId) throw new Error("Failed to create buyer.");

  // Insert a follow row as the buyer using the buyer client (RLS check).
  const buyerClient = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await buyerClient.auth.signInWithPassword({
    email: buyerEmail,
    password: sellerPassword,
  });
  if (signInError) throw signInError;

  const { error: followError } = await buyerClient
    .from("user_follows")
    .insert({ follower_id: buyerId, followee_id: sellerId });
  if (followError) throw followError;
  console.log("user_follows: insert as follower succeeded.");

  // Self-follow should fail.
  const { error: selfFollowError } = await buyerClient
    .from("user_follows")
    .insert({ follower_id: buyerId, followee_id: buyerId });
  assert(
    !!selfFollowError,
    "Self-follow should violate the user_follows_no_self_follow CHECK constraint.",
  );
  console.log("user_follows: self-follow rejected with error:", selfFollowError.message);

  // Buyer can read the follow.
  const { data: followRows, error: readError } = await buyerClient
    .from("user_follows")
    .select("follower_id, followee_id")
    .eq("follower_id", buyerId);
  if (readError) throw readError;
  assert(
    followRows.length === 1 && followRows[0].followee_id === sellerId,
    "Buyer should see their own follow row.",
  );

  // Buyer can delete the follow.
  const { error: deleteError } = await buyerClient
    .from("user_follows")
    .delete()
    .eq("follower_id", buyerId)
    .eq("followee_id", sellerId);
  if (deleteError) throw deleteError;
  console.log("user_follows: delete as follower succeeded.");

  // Cleanup users.
  await admin.auth.admin.deleteUser(sellerId);
  await admin.auth.admin.deleteUser(buyerId);

  console.log("OK: u3-u8 smoke passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
