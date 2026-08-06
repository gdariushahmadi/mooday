/**
 * Image upload integration smoke test.
 *
 * Drives the real upload path: a seller creates a listing, uploads
 * an image to the `listing-media` bucket under the `{userId}/{listingId}/`
 * folder, then verifies the file is readable via a signed URL.
 *
 * Cross-user RLS for storage is verified separately by the pgTAP suite
 * (see `supabase/tests/phase_3_listing_media_rls.sql`).
 */
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";

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
const sellerEmail = `upload-${suffix}@mooday.test`;
const pw = "Mooday-Upload-42!";

const { data: sellerUser } = await admin.auth.admin.createUser({
  email: sellerEmail, password: pw, email_confirm: true,
});
const sellerId = sellerUser.user.id;

// Tiny 1x1 PNG.
const tmpPath = join(tmpdir(), `upload-test-${suffix}.png`);
await fs.writeFile(tmpPath, Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x00, 0x00, 0x00, 0x00, 0x3a, 0x7e, 0x9b,
  0x55, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]));

// Create the listing.
const { data: listing } = await admin.from("listings").insert({
  seller_id: sellerId,
  title_en: "Upload Test", title_ar: "اختبار الرفع",
  description_en: "", description_ar: "",
  price_minor: 10000, currency: "AED",
  condition_en: "New", condition_ar: "جديد",
  category: "Bags", mode: "resell", status: "active", is_authentic: true,
}).select("*").single();
check("listing created", !!listing);

// Upload via the seller session.
const sellerClient = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: sellerSession } = await sellerClient.auth.signInWithPassword({
  email: sellerEmail, password: pw,
});
check("seller session established", !!sellerSession?.session?.access_token);

const storagePath = `${sellerId}/${listing.id}/hero.png`;
const fileBytes = await fs.readFile(tmpPath);
const { error: uploadErr } = await sellerClient.storage
  .from("listing-media")
  .upload(storagePath, fileBytes, {
    contentType: "image/png",
    upsert: false,
  });
check("upload succeeds", !uploadErr, uploadErr?.message);

// Seller lists the folder.
const { data: files } = await sellerClient.storage
  .from("listing-media")
  .list(`${sellerId}/${listing.id}`);
check("seller sees own file", files?.some((f) => f.name === "hero.png"));

// Seller gets a signed URL for own file.
const { data: signed, error: signedErr } = await sellerClient.storage
  .from("listing-media")
  .createSignedUrl(storagePath, 60);
check("seller gets signed URL", !signedErr && !!signed?.signedUrl, signedErr?.message);

// Fetch the signed URL to confirm bytes actually serve.
if (signed?.signedUrl) {
  const response = await fetch(signed.signedUrl);
  check(
    "signed URL serves image bytes",
    response.ok && response.headers.get("content-type") === "image/png",
    `status=${response.status}`,
  );
}

// A second user trying to upload into the seller's folder is blocked.
const buyerEmail = `upload-buyer-${suffix}@mooday.test`;
await admin.auth.admin.createUser({
  email: buyerEmail, password: pw, email_confirm: true,
});
const buyerClient = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
});
await buyerClient.auth.signInWithPassword({
  email: buyerEmail, password: pw,
});
const { error: crossErr } = await buyerClient.storage
  .from("listing-media")
  .upload(`${sellerId}/${listing.id}/intruder.png`, fileBytes, {
    contentType: "image/png",
  });
check("cross-user upload blocked by RLS", !!crossErr, crossErr?.message);

// Cleanup.
await sellerClient.storage.from("listing-media").remove([storagePath]);
await admin.from("listings").delete().eq("id", listing.id);
await fs.unlink(tmpPath);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
