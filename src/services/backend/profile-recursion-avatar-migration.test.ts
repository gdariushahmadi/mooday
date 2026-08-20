import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    "supabase/migrations/202608190001_fix_profile_recursion_and_avatar_storage.sql",
  ),
  "utf8",
).toLowerCase();

describe("Profile recursion + avatar storage migration", () => {
  it("introduces a security definer is_admin helper", () => {
    expect(sql).toContain(
      "create or replace function public.is_admin(check_uid uuid)",
    );
    expect(sql).toContain("security definer");
    expect(sql).toContain("revoke all on function public.is_admin(uuid)");
    expect(sql).toContain(
      "grant execute on function public.is_admin(uuid) to authenticated",
    );
  });

  it("rewrites the recursive UPDATE policy to use the helper", () => {
    expect(sql).toContain(
      'drop policy if exists "profiles_update_own_or_admin" on public.profiles',
    );
    expect(sql).toContain(
      "create policy \"profiles_update_own_or_admin\" on public.profiles",
    );
    // The old inline subquery is gone; the new branch uses the helper.
    expect(sql).toContain("or public.is_admin(auth.uid())");
  });

  it("creates a public avatars bucket with a 2 MB cap", () => {
    expect(sql).toContain("'avatars'");
    expect(sql).toContain("2097152");
    expect(sql).toContain("array['image/jpeg', 'image/png', 'image/webp']");
  });

  it("restricts avatar writes to the owner folder", () => {
    expect(sql).toContain("avatars_insert_own");
    expect(sql).toContain("avatars_update_own");
    expect(sql).toContain("avatars_delete_own");
    expect(sql).toContain("split_part(name, '/', 1) = (select auth.uid())::text");
  });
});
