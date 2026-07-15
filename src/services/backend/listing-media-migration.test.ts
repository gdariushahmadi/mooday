import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202607150003_phase_3_listing_media.sql"),
  "utf8",
).toLowerCase();

describe("Phase 3 listing media migration", () => {
  it("creates a private, size-limited image bucket", () => {
    expect(sql).toContain("'listing-media'");
    expect(sql).toContain("false");
    expect(sql).toContain("10485760");
    expect(sql).toContain("image/webp");
  });

  it("binds upload paths and mutations to the listing owner", () => {
    expect(sql).toContain("listing_media_insert_own");
    expect(sql).toContain("(storage.foldername(name))[1]");
    expect(sql).toContain("listings.seller_id = (select auth.uid())");
  });

  it("allows reads only through visible parent listings", () => {
    expect(sql).toContain("listing_media_select_visible");
    expect(sql).toContain("listings.status = 'active'");
  });
});
