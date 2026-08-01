import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    "supabase/migrations/202607150005_phase_3_user_likes_and_cart.sql",
  ),
  "utf8",
).toLowerCase();

describe("Phase 3 user likes + cart migration", () => {
  it("creates one table per domain, scoped to auth users", () => {
    expect(sql).toContain("create table public.user_listing_likes");
    expect(sql).toContain("create table public.cart_items");
    expect(sql).toContain("primary key (user_id, listing_id)");
    expect(sql).toContain("unique (user_id, listing_id)");
  });

  it("constrains the cart quantity to the schema-defined 1..99 window", () => {
    expect(sql).toContain("quantity > 0 and quantity <= 99");
    expect(sql).toContain("cart_items_increment");
    expect(sql).toContain("least(\n      99,\n      public.cart_items.quantity + excluded.quantity");
  });

  it("revokes UPDATE from authenticated on the likes table (insert-only intent)", () => {
    expect(sql).toContain("revoke update on table public.user_listing_likes from authenticated");
  });

  it("locks writes to owner-only RLS policies and grants reads to authenticated", () => {
    expect(sql).toContain("alter table public.user_listing_likes enable row level security");
    expect(sql).toContain("alter table public.cart_items enable row level security");
    expect(sql).toContain("user_listing_likes_select_own");
    expect(sql).toContain("user_listing_likes_insert_own");
    expect(sql).toContain("user_listing_likes_delete_own");
    expect(sql).toContain("cart_items_select_own");
    expect(sql).toContain("cart_items_insert_own");
    expect(sql).toContain("cart_items_update_own");
    expect(sql).toContain("cart_items_delete_own");
    expect(sql).toContain("with check ((select auth.uid()) = user_id)");
    expect(sql).toContain("grant select, insert, update, delete");
  });

  it("exposes cart_items_increment as auth-only and RPC-safe", () => {
    expect(sql).toContain("create or replace function public.cart_items_increment(");
    expect(sql).toContain("security invoker");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("raise exception 'authentication required' using errcode = '42501'");
    expect(sql).toContain("revoke all on function public.cart_items_increment");
    expect(sql).toContain("grant execute on function public.cart_items_increment");
  });
});
