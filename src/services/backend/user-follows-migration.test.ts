import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202608160446_u8_user_follows.sql"),
  "utf8",
).toLowerCase();

describe("U8 user_follows migration", () => {
  it("creates the user_follows table with composite primary key", () => {
    expect(sql).toContain("create table public.user_follows");
    expect(sql).toContain("follower_id uuid not null references auth.users(id)");
    expect(sql).toContain("followee_id uuid not null references auth.users(id)");
    expect(sql).toContain("primary key (follower_id, followee_id)");
  });

  it("prevents self-follows", () => {
    expect(sql).toContain(
      "constraint user_follows_no_self_follow check (follower_id <> followee_id)",
    );
  });

  it("creates indexes for follower and followee lookup", () => {
    expect(sql).toContain("create index user_follows_followee_idx");
    expect(sql).toContain("create index user_follows_follower_idx");
  });

  it("enables RLS and grants select to anyone", () => {
    expect(sql).toContain("alter table public.user_follows enable row level security");
    expect(sql).toContain("grant select on table public.user_follows to anon, authenticated");
    expect(sql).toContain("grant insert, delete on table public.user_follows to authenticated");
  });

  it("defines self-managed RLS policies", () => {
    expect(sql).toContain("create policy \"user_follows_select_all\"");
    expect(sql).toContain("create policy \"user_follows_insert_own\"");
    expect(sql).toContain("create policy \"user_follows_delete_own\"");
  });
});
