import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202607150002_phase_3_listings.sql"),
  "utf8",
).toLowerCase();

describe("Phase 3 listings migration", () => {
  it("creates constrained listings and ordered image metadata", () => {
    expect(sql).toContain("create table public.listings");
    expect(sql).toContain("create table public.listing_images");
    expect(sql).toContain("price_minor >= 0");
    expect(sql).toContain("unique (listing_id, sort_order)");
  });

  it("allows public active reads while keeping writes owner-scoped", () => {
    expect(sql).toContain("status = 'active' or (select auth.uid()) = seller_id");
    expect(sql).toContain("with check ((select auth.uid()) = seller_id)");
    expect(sql).toContain("listings_delete_own");
  });

  it("authorizes image changes through the parent listing owner", () => {
    expect(sql).toContain("listing_images_insert_own");
    expect(sql).toContain("listings.seller_id = (select auth.uid())");
  });
});
