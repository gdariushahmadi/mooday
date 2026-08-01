import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202607150004_phase_3_public_seller_profiles.sql"),
  "utf8",
).toLowerCase();

describe("Phase 3 public seller profiles migration", () => {
  it("creates a dedicated public card table that is isolated from profiles", () => {
    expect(sql).toContain("create table public.public_seller_profiles");
    expect(sql).toContain("seller_id uuid primary key references auth.users(id) on delete cascade");
    // The private profiles table stays the source of truth for owner-only data.
    expect(sql).not.toContain("alter table public.profiles");
  });

  it("exposes curated public fields without leaking private profile columns", () => {
    const publicColumns = [
      "display_name_en",
      "display_name_ar",
      "avatar_url",
      "bio_en",
      "bio_ar",
      "city_en",
      "city_ar",
      "style_tags_en",
      "style_tags_ar",
      "is_verified",
      "response_rate",
      "response_time_hours",
    ];
    for (const col of publicColumns) {
      expect(sql).toContain(col);
    }
    // The private profiles schema carries full address book and language
    // preference. The public projection must not reuse that table directly.
    expect(sql).not.toMatch(/create table[^;]+preferred_language/);
  });

  it("grants anon read access but keeps writes owner-scoped", () => {
    expect(sql).toContain("grant select on table public.public_seller_profiles to anon");
    expect(sql).toContain("grant select, insert, update, delete");
    expect(sql).toContain("on table public.public_seller_profiles to authenticated");
    expect(sql).toContain("public_seller_profiles_select_all");
    expect(sql).toContain("public_seller_profiles_insert_own");
    expect(sql).toContain("with check ((select auth.uid()) = seller_id)");
    expect(sql).toContain("public_seller_profiles_delete_own");
  });

  it("seeds a public card automatically when a new auth user signs up", () => {
    expect(sql).toContain("public.seed_public_seller_profile()");
    expect(sql).toContain("security definer");
    expect(sql).toContain("on conflict (seller_id) do nothing");
    expect(sql).toContain("on_auth_user_created_public_profile");
    // SECURITY DEFINER triggers run with elevated privileges; only the
    // signed-in-safe `set_updated_at` machinery should be reused, never a
    // full search_path. The seed function must pin its search_path.
    expect(sql).toContain("set search_path = ''");
  });

  it("defines a read-only view that aggregates active listings only", () => {
    expect(sql).toContain("create or replace view public.seller_card_view");
    expect(sql).toContain("where listings.status = 'active'");
    expect(sql).toContain("coalesce(lc.listings_count, 0)::integer as listings_count");
    expect(sql).toContain("grant select on public.seller_card_view to anon, authenticated");
  });
});
