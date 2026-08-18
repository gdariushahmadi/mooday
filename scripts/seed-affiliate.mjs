/**
 * Seed affiliate-monetization demo data into the configured Supabase.
 *
 * After running `npx supabase db push` (which applies the new partners /
 * affiliate_links / affiliate_clicks migrations), this script populates
 * the new tables so the deployed site shows:
 *   - the "Also buy new at" card on listing detail pages
 *   - a non-empty Reports sub-view in the admin Affiliate tab
 *
 * Required environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional environment:
 *   MOODAY_AFFILIATE_DEMO_DRY_RUN=1   print what would be inserted without writing
 *
 * Usage:
 *   npm run seed:affiliate           # idempotent: skips rows that already exist
 *   npm run seed:affiliate -- --reset   # wipe demo data and re-seed
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun =
  process.env.MOODAY_AFFILIATE_DEMO_DRY_RUN === "1" ||
  process.argv.includes("--dry-run");
const reset = process.argv.includes("--reset");

if (!url || !serviceRole) {
  throw new Error(
    "Seeding requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PARTNERS = [
  {
    code: "amazon-ae",
    name: "Amazon UAE",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/120px-Amazon_logo.svg.png",
    base_url_template: "https://www.amazon.ae/dp/{asin}?tag=mooday-21",
    display_order: 0,
  },
  {
    code: "noon-ae",
    name: "Noon UAE",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Noon_Logo.svg/120px-Noon_Logo.svg.png",
    base_url_template: "https://www.noon.com/uae-en/{slug}?ref=mooday",
    display_order: 10,
  },
];

// Listing-id → array of partner offers for that listing.
// We pull the first 12 approved listings from production and give each
// 1-2 partner links with realistic-looking ASINs.
const LINK_BLUEPRINT = [
  { amazonAsin: "B0BSHF7WHW", noonSlug: "Z4CD850E12A6F4B5942DE9DZ/noon-385-luxury-leather-tote" },
  { amazonAsin: "B0C5JHN9XJ", noonSlug: "Z54F12345E6A7B8C9D0E1F2G/noon-385-classic-quartz-watch" },
  { amazonAsin: "B0BXNQ7RJC", noonSlug: "Z15CFD3E1A2B3C4D5E6F7A8B/noon-749-designer-silk-scarf" },
  { amazonAsin: "B0CXL8VPK4", noonSlug: "Z3A1B2C3D4E5F6A7B8C9D0E1/noon-512-italian-leather-belt" },
  { amazonAsin: "B0BDQ4WXTR", noonSlug: "Z9F8E7D6C5B4A3B2C1D0E9F8/noon-208-designer-aviator" },
  { amazonAsin: "B0BVZ5NQ9M", noonSlug: "Z6E5F4D3C2B1A0B9C8D7E6F5/noon-913-handcrafted-derby" },
  { amazonAsin: "B0CR2J7XQK", noonSlug: "Z1B2C3D4E5F6A7B8C9D0E1F2/noon-447-cashmere-crewneck" },
  { amazonAsin: "B0BW7M2F4P", noonSlug: "Z7C6D5E4F3A2B1C0D9E8F7A6B/noon-228-japanese-quartz-movement" },
  { amazonAsin: "B0BMH3K9DL", noonSlug: "Z4E3F2A1B0C9D8E7F6A5B4C3/noon-665-french-perfume" },
  { amazonAsin: "B0CJ5N8WVH", noonSlug: "Z2A1B0C9D8E7F6A5B4C3D2E1/noon-309-merino-knit-sweater" },
  { amazonAsin: "B0BG2D7FQM", noonSlug: "Z8D7C6B5A4F3E2D1C0B9A8F7/noon-152-designer-bracelet" },
  { amazonAsin: "B0BP4K6RJW", noonSlug: "Z5F4E3D2C1B0A9F8E7D6C5B4/noon-841-tailored-blazer" },
];

function shortId(len = 8) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function fetchApprovedListings() {
  const { data, error } = await admin
    .from("listings")
    .select("id, status, approved_at, title_en")
    .eq("status", "active")
    .not("approved_at", "is", null)
    .order("approved_at", { ascending: false })
    .limit(12);
  if (error) throw error;
  return data ?? [];
}

async function seedPartners() {
  for (const partner of PARTNERS) {
    const { data: existing } = await admin
      .from("partners")
      .select("code")
      .eq("code", partner.code)
      .maybeSingle();
    if (existing) {
      console.log(`  partner ${partner.code} already exists, skipping insert`);
      continue;
    }
    if (dryRun) {
      console.log(`  would insert partner ${partner.code}`);
      continue;
    }
    const { error } = await admin.from("partners").insert({
      code: partner.code,
      name: partner.name,
      logo_url: partner.logo_url,
      base_url_template: partner.base_url_template,
      is_active: true,
      display_order: partner.display_order,
    });
    if (error) throw error;
    console.log(`  + partner ${partner.code}`);
  }
}

async function seedLinks(listings) {
  const { data: existing } = await admin
    .from("affiliate_links")
    .select("listing_id, partner_code");
  const existingSet = new Set(
    (existing ?? []).map((r) => `${r.listing_id}::${r.partner_code}`),
  );

  let inserted = 0;
  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const blueprint = LINK_BLUEPRINT[i % LINK_BLUEPRINT.length];
    const links = [
      {
        listing_id: listing.id,
        partner_code: "amazon-ae",
        affiliate_url: `https://www.amazon.ae/dp/${blueprint.amazonAsin}?tag=mooday-21`,
        display_order: 0,
      },
      {
        listing_id: listing.id,
        partner_code: "noon-ae",
        affiliate_url: `https://www.noon.com/uae-en/${blueprint.noonSlug}`,
        display_order: 10,
      },
    ];
    for (const link of links) {
      const key = `${link.listing_id}::${link.partner_code}`;
      if (existingSet.has(key)) continue;
      if (dryRun) {
        console.log(`  would insert ${link.partner_code} link for ${listing.id.slice(0, 8)}`);
        continue;
      }
      const { error } = await admin
        .from("affiliate_links")
        .insert({
          short_id: shortId(8),
          listing_id: link.listing_id,
          partner_code: link.partner_code,
          affiliate_url: link.affiliate_url,
          display_order: link.display_order,
          is_active: true,
        });
      if (error) {
        console.warn(
          `  ! ${link.partner_code} link for ${listing.id.slice(0, 8)} failed: ${error.message}`,
        );
      } else {
        inserted++;
      }
    }
  }
  console.log(`  ${inserted} affiliate link(s) inserted`);
}

async function seedClicks(listings) {
  const { count } = await admin
    .from("affiliate_clicks")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0 && !reset) {
    console.log(`  affiliate_clicks already has ${count} row(s), skipping`);
    return;
  }

  // Spread ~40 clicks over the last 30 days, distributed across listings
  // and partners. Mix of anon and (anonymous) — no user_id is set since
  // we don't know which prod users clicked.
  const userAgents = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36",
  ];
  const referers = [
    "https://www.google.ae/",
    "https://www.instagram.com/",
    "https://t.co/",
    null,
    null,
  ];

  let inserted = 0;
  for (const listing of listings) {
    const partner = Math.random() < 0.55 ? "amazon-ae" : "noon-ae";
    const linkCount = 3 + Math.floor(Math.random() * 4); // 3-6 clicks per listing
    for (let k = 0; k < linkCount; k++) {
      const ageMs = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
      const clickedAt = new Date(Date.now() - ageMs).toISOString();
      if (dryRun) {
        inserted++;
        continue;
      }
      const anonId = randomBytes(16).toString("hex");
      const { error } = await admin.from("affiliate_clicks").insert({
        short_id: shortId(8),
        listing_id: listing.id,
        partner_code: partner,
        user_id: null,
        anon_id: anonId,
        user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
        referer: referers[Math.floor(Math.random() * referers.length)],
        clicked_at: clickedAt,
      });
      if (!error) inserted++;
    }
  }
  console.log(`  ${inserted} click row(s) inserted`);
}

async function resetDemoData() {
  if (dryRun) {
    console.log("  would delete all demo data");
    return;
  }
  // Order matters: clicks first (no FK), then links, then partners.
  await admin.from("affiliate_clicks").delete().gte("clicked_at", "1970-01-01");
  await admin.from("affiliate_links").delete().gte("created_at", "1970-01-01");
  await admin.from("partners").delete().in(
    "code",
    PARTNERS.map((p) => p.code),
  );
  console.log("  demo data cleared");
}

async function main() {
  console.log("Affiliate seed starting...");
  if (reset && !dryRun) {
    console.log("  --reset flag: clearing existing demo data first");
    await resetDemoData();
  }

  console.log("[1/3] partners");
  await seedPartners();

  console.log("[2/3] affiliate_links");
  const listings = await fetchApprovedListings();
  console.log(`  ${listings.length} approved listing(s) eligible`);
  await seedLinks(listings);

  console.log("[3/3] affiliate_clicks");
  await seedClicks(listings);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
