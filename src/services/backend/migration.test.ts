import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202607150001_phase_2_identity.sql"),
  "utf8",
).toLowerCase();

describe("Phase 2 identity migration", () => {
  it("enables RLS and owner-scoped policies in the creation migration", () => {
    expect(sql).toContain("alter table public.profiles enable row level security");
    expect(sql).toContain("alter table public.addresses enable row level security");
    expect(sql).toContain("with check ((select auth.uid()) = user_id)");
    expect(sql).toContain("using ((select auth.uid()) = user_id)");
  });

  it("enforces one default address and an authenticated atomic setter", () => {
    expect(sql).toContain("addresses_one_default_per_user_idx");
    expect(sql).toContain("where is_default");
    expect(sql).toContain("revoke all on function public.set_default_address(uuid) from public, anon");
  });

  it("leaves passwords and sessions in Supabase-managed auth schemas", () => {
    expect(sql).not.toMatch(/create table[^;]+password/);
    expect(sql).not.toMatch(/create table[^;]+sessions/);
    expect(sql).toContain("references auth.users(id)");
  });
});
