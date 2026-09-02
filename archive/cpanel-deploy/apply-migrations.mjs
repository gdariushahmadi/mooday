/**
 * Apply new migrations to production Supabase via the management API.
 * Uses the service role key to bypass RLS.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Missing Supabase production configuration.");
}

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const migrationsDir = resolve("supabase/migrations");
const newMigrations = [
  "202608160429_u3_search_listings.sql",
  "202608160446_u8_user_follows.sql",
  "202608160503_svc_role_grants.sql",
];

async function runMigration(name) {
  const sql = readFileSync(resolve(migrationsDir, name), "utf8");
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/pg/query`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${name}: ${response.status} ${text}`);
  }
  return name;
}

async function main() {
  for (const m of newMigrations) {
    console.log(`Applying ${m}...`);
    try {
      await runMigration(m);
      console.log(`  ✓ ${m} applied`);
    } catch (err) {
      console.error(`  ✗ ${m} failed: ${err.message}`);
      throw err;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
