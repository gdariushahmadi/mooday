/**
 * Seed the former Phase 1 showcase into real Supabase rows.
 *
 * This is an operational script, not a mock-data fallback. It reads the
 * existing TypeScript catalogue and seller definitions, creates isolated
 * showcase Auth users when needed, and writes real approved listings plus
 * public image metadata. It is safe to run again: user emails, profile
 * handles, listing ids, and image positions are deterministic.
 *
 * Required environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional environment:
 *   MOODAY_DEMO_EMAIL_DOMAIN  (default: mooday.dev)
 *   MOODAY_DEMO_EMAIL_PREFIX  (default: showcase)
 *   MOODAY_DEMO_PASSWORD      (used only when creating a new showcase user)
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     MOODAY_DEMO_SEED_CONFIRM=YES npm run seed:demo
 *
 * Use --dry-run to parse the catalogue and report the rows without writing.
 */

import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

function env(name) {
  const value = process.env[name]?.trim();
  return value || null;
}

const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
  throw new Error(
    "Seeding requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

function unwrap(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    current.kind === ts.SyntaxKind.SatisfiesExpression
  ) {
    current = current.expression;
  }
  return current;
}

function propertyKey(node) {
  const name = node.name;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return null;
}

function propertyAccessPath(node) {
  const current = unwrap(node);
  if (ts.isIdentifier(current)) return [current.text];
  if (ts.isPropertyAccessExpression(current)) {
    const parent = propertyAccessPath(current.expression);
    return parent ? [...parent, current.name.text] : null;
  }
  return null;
}

function evaluate(node) {
  const current = unwrap(node);
  if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
    return current.text;
  }
  if (ts.isNumericLiteral(current)) return Number(current.text);
  if (current.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (current.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(current)) {
    return current.elements.map(evaluate);
  }
  if (ts.isCallExpression(current)) {
    if (
      ts.isIdentifier(current.expression) &&
      current.expression.text === "img"
    ) {
      const value = evaluate(current.arguments[0]);
      return `/products/${value}`;
    }
    throw new Error(`Unsupported call in seed source: ${current.getText()}`);
  }
  if (ts.isObjectLiteralExpression(current)) {
    return Object.fromEntries(
      current.properties.flatMap((property) => {
        if (!ts.isPropertyAssignment(property)) return [];
        const key = propertyKey(property);
        return key ? [[key, evaluate(property.initializer)]] : [];
      }),
    );
  }
  throw new Error(`Unsupported seed value: ${current.getText()}`);
}

function sourceFor(relativePath) {
  const filePath = resolve(ROOT, relativePath);
  return ts.createSourceFile(
    filePath,
    readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function findInitializer(source, variableName) {
  let result = null;
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName
    ) {
      result = unwrap(node.initializer);
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!result) throw new Error(`Could not find ${variableName} in seed source.`);
  return result;
}

function readObject(relativePath, variableName) {
  const initializer = findInitializer(sourceFor(relativePath), variableName);
  if (!ts.isObjectLiteralExpression(initializer)) {
    throw new Error(`${variableName} must be an object literal.`);
  }
  return Object.fromEntries(
    initializer.properties.flatMap((property) => {
      if (!ts.isPropertyAssignment(property)) return [];
      const key = propertyKey(property);
      return key ? [[key, evaluate(property.initializer)]] : [];
    }),
  );
}

function readProducts() {
  const products = [];
  for (const [relativePath, variableName] of [
    ["src/data/products.ts", "baseProducts"],
    ["src/data/products-batch2.ts", "batch2Products"],
  ]) {
    const initializer = findInitializer(sourceFor(relativePath), variableName);
    if (!ts.isArrayLiteralExpression(initializer)) {
      throw new Error(`${variableName} must be an array literal.`);
    }
    for (const element of initializer.elements) {
      const object = unwrap(element);
      if (!ts.isObjectLiteralExpression(object)) {
        throw new Error(`Unexpected product entry in ${relativePath}.`);
      }
      const fields = Object.fromEntries(
        object.properties.flatMap((property) => {
          if (!ts.isPropertyAssignment(property)) return [];
          const key = propertyKey(property);
          return key ? [[key, property.initializer]] : [];
        }),
      );
      const sellerPath = propertyAccessPath(fields.sellerNameEn);
      if (!sellerPath || sellerPath[0] !== "SELLERS" || !sellerPath[1]) {
        throw new Error(`Could not resolve seller for ${fields.id.getText()}.`);
      }
      products.push({
        id: evaluate(fields.id),
        titleEn: evaluate(fields.titleEn),
        titleAr: evaluate(fields.titleAr),
        price: evaluate(fields.price),
        originalPrice: fields.originalPrice
          ? evaluate(fields.originalPrice)
          : evaluate(fields.price),
        conditionEn: evaluate(fields.conditionEn),
        conditionAr: evaluate(fields.conditionAr),
        descriptionEn: evaluate(fields.descriptionEn),
        descriptionAr: evaluate(fields.descriptionAr),
        category: evaluate(fields.category),
        images: evaluate(fields.images),
        isAuthentic: fields.isAuthentic ? evaluate(fields.isAuthentic) : false,
        sellerSlug: sellerPath[1],
      });
    }
  }
  return products;
}

const SELLERS = readObject("src/data/sellers.ts", "SELLERS");
const SELLER_META = readObject("src/data/seller-meta.ts", "SELLER_META");
const RAW_PRODUCTS = readProducts();

const COLOURS = [
  ["Black", "أسود"],
  ["White", "أبيض"],
  ["Beige", "بيج"],
  ["Tan", "بني فاتح"],
  ["Brown", "بني"],
  ["Navy", "كحلي"],
  ["Red", "أحمر"],
  ["Pink", "وردي"],
  ["Gold", "ذهبي"],
  ["Green", "أخضر"],
  ["Blue", "أزرق"],
  ["Silver", "فضي"],
];
const SIZE_POOL = {
  Dresses: ["XS", "S", "M", "L", "XL"],
  Clothing: ["XS", "S", "M", "L", "XL"],
  Shoes: ["S", "M", "L"],
  Bags: ["OS"],
  Accessories: ["OS"],
};

function addDerivedAttributes(product, index) {
  const colour =
    COLOURS.find(([key]) => product.titleEn.toLowerCase().includes(key.toLowerCase())) ??
    ["Beige", "بيج"];
  const pool = SIZE_POOL[product.category] ?? SIZE_POOL.Accessories;
  return {
    ...product,
    size: pool[index % pool.length],
    colorEn: colour[0],
    colorAr: colour[1],
  };
}

function deterministicUuid(seed) {
  const bytes = createHash("sha1").update(seed).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function seedProfile(slug, seller, meta, userId) {
  return {
    seller_id: userId,
    display_name_en: seller.nameEn,
    display_name_ar: seller.nameAr,
    handle: `@${slug}_showcase`,
    avatar_url: seller.avatar,
    type_en: seller.typeEn,
    type_ar: seller.typeAr,
    bio_en: meta.bioEn,
    bio_ar: meta.bioAr,
    city_en: meta.cityEn,
    city_ar: meta.cityAr,
    style_tags_en: meta.styleTagsEn,
    style_tags_ar: meta.styleTagsAr,
    is_verified: meta.isVerified,
    response_rate: meta.responseRate,
    response_time_hours: meta.responseTimeHours,
    joined_at: meta.joinedAt,
  };
}

function makeListing(product, sellerId, index) {
  // Fixed dates keep the showcase order stable across reruns. Batch 2 is
  // naturally newer because it appears later in the source catalogue.
  const createdAt = new Date(
    Date.parse("2026-07-01T12:00:00.000Z") + index * 86_400_000,
  ).toISOString();
  return {
    id: deterministicUuid(`mooday-showcase-listing:${product.id}`),
    seller_id: sellerId,
    title_en: product.titleEn,
    title_ar: product.titleAr,
    description_en: product.descriptionEn,
    description_ar: product.descriptionAr,
    price_minor: Math.round(product.price * 100),
    original_price_minor: Math.round(product.originalPrice * 100),
    currency: "AED",
    condition_en: product.conditionEn,
    condition_ar: product.conditionAr,
    category: product.category,
    size: product.size,
    color_en: product.colorEn,
    color_ar: product.colorAr,
    mode: "resell",
    status: "active",
    is_authentic: product.isAuthentic,
    published_at: createdAt,
    approved_at: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function makeImages(product, listingId) {
  return product.images.map((storagePath, sortOrder) => ({
    id: deterministicUuid(
      `mooday-showcase-image:${product.id}:${sortOrder}`,
    ),
    listing_id: listingId,
    storage_path: storagePath,
    sort_order: sortOrder,
    alt_en: product.titleEn,
    alt_ar: product.titleAr,
  }));
}

async function ensureShowcaseUsers(admin, slugs) {
  const domain = env("MOODAY_DEMO_EMAIL_DOMAIN") ?? "mooday.dev";
  const prefix = env("MOODAY_DEMO_EMAIL_PREFIX") ?? "showcase";
  const password = env("MOODAY_DEMO_PASSWORD") ?? randomBytes(24).toString("base64url");
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  const usersByEmail = new Map(
    (data.users ?? []).map((user) => [user.email?.toLowerCase(), user]),
  );
  const ids = new Map();
  for (const slug of slugs) {
    const email = `${prefix}-${slug}@${domain}`.toLowerCase();
    let user = usersByEmail.get(email);
    if (user && user.user_metadata?.mooday_showcase !== true) {
      throw new Error(
        `Refusing to reuse existing non-showcase account ${email}.`,
      );
    }
    if (!user) {
      const seller = SELLERS[slug];
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: seller.nameEn,
          mooday_showcase: true,
        },
      });
      if (created.error) throw created.error;
      user = created.data.user;
      usersByEmail.set(email, user);
    }
    ids.set(slug, user.id);
  }
  return ids;
}

async function main() {
  const products = RAW_PRODUCTS.map(addDerivedAttributes);
  const slugs = Object.keys(SELLERS).filter((slug) => SELLER_META[slug]);
  const missingSeller = products.find((product) => !SELLERS[product.sellerSlug]);
  if (missingSeller) throw new Error(`Missing seller ${missingSeller.sellerSlug}.`);
  if (slugs.length === 0 || products.length === 0) {
    throw new Error("The showcase catalogue is empty.");
  }

  console.log(
    `${dryRun ? "Would seed" : "Seeding"} ${products.length} listings across ${slugs.length} sellers.`,
  );
  if (dryRun) return;
  if (env("MOODAY_DEMO_SEED_CONFIRM") !== "YES") {
    throw new Error(
      "Set MOODAY_DEMO_SEED_CONFIRM=YES to write showcase data.",
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const sellerIds = await ensureShowcaseUsers(admin, slugs);
  const profiles = slugs.map((slug) =>
    seedProfile(slug, SELLERS[slug], SELLER_META[slug], sellerIds.get(slug)),
  );
  const listings = products.map((product, index) =>
    makeListing(product, sellerIds.get(product.sellerSlug), index),
  );
  const images = listings.flatMap((listing, index) =>
    makeImages(products[index], listing.id),
  );

  const { error: profileError } = await admin
    .from("public_seller_profiles")
    .upsert(profiles, { onConflict: "seller_id" });
  if (profileError) throw profileError;

  const { data: existing, error: existingError } = await admin
    .from("listings")
    .select("id,seller_id")
    .in("id", listings.map((listing) => listing.id));
  if (existingError) throw existingError;
  for (const row of existing ?? []) {
    const desired = listings.find((listing) => listing.id === row.id);
    if (desired && desired.seller_id !== row.seller_id) {
      throw new Error(`Refusing to reassign existing listing ${row.id}.`);
    }
  }

  const { error: listingError } = await admin
    .from("listings")
    .upsert(listings, { onConflict: "id" });
  if (listingError) throw listingError;

  const { error: imageError } = await admin
    .from("listing_images")
    .upsert(images, { onConflict: "listing_id,sort_order" });
  if (imageError) throw imageError;

  console.log(
    `Seeded ${listings.length} real listings, ${images.length} public image references, and ${profiles.length} seller cards.`,
  );
}

await main();
