import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202608310002_delivery_integrity.sql"),
  "utf8",
).toLowerCase();

describe("public beta delivery-integrity migration", () => {
  it("keeps unapproved listings private and trust values server-controlled", () => {
    expect(sql).toContain("approved_at is not null");
    expect(sql).toContain("approved_at is null");
    expect(sql).toContain("seller trust fields are server controlled");
    expect(sql).toContain("listing approval is moderator controlled");
    expect(sql).not.toContain("current_user");
  });

  it("creates account-scoped saved items with owner RLS", () => {
    expect(sql).toContain("create table if not exists public.saved_items");
    expect(sql).toContain("primary key (user_id, listing_id)");
    expect(sql).toContain("saved_items_select_own");
    expect(sql).toContain("saved_items_insert_own");
    expect(sql).toContain("saved_items_delete_own");
    expect(sql).toContain("user_listing_likes_select_own");
    expect(sql).toContain("cart_items_select_own");
    expect(sql).toContain("public_seller_profiles_select_visible");
    expect(sql).toContain("not public.users_blocked((select auth.uid()), l.seller_id)");
  });

  it("keeps the public beta cart at one listing and quantity one", () => {
    expect(sql).toContain("cart_items_one_listing_per_user_idx");
    expect(sql).toContain("cart_items_quantity_one_check check (quantity = 1)");
    expect(sql).toContain("only one listing can be in the cart");
    expect(sql).toContain("the public beta cart accepts quantity one only");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("revoke insert, update on table public.cart_items from authenticated");
  });

  it("removes direct client order writes and defines payment state", () => {
    expect(sql).toContain("payment_status");
    expect(sql).toContain("payment_status in ('pending', 'succeeded', 'failed', 'refunded')");
    expect(sql).toContain("new.status = 'cancelled'");
    expect(sql).toContain("new.payment_status = case");
    expect(sql).toContain("revoke insert, update on table public.orders from authenticated");
    expect(sql).toContain("revoke insert on table public.order_items from authenticated");
    expect(sql).toContain("create table if not exists public.stripe_webhook_events");
  });

  it("uses one locked RPC for a one-listing order and snapshots the inputs", () => {
    expect(sql).toContain("create or replace function public.create_single_listing_order(");
    expect(sql).toContain("for update;");
    expect(sql).toContain("listing_row.price_minor");
    expect(sql).toContain("jsonb_build_object(");
    expect(sql).toContain("quantity\n  ) values (");
    expect(sql).toContain("'pending_payment'");
    expect(sql).toContain("set status = 'reserved'");
  });

  it("protects order transitions, financial columns, chats, offers, and reviews", () => {
    expect(sql).toContain("enforce_order_status_transition");
    expect(sql).toContain("protect_order_financial_fields");
    expect(sql).toContain("only the offer recipient may change offer status");
    expect(sql).toContain("listing and seller do not match");
    expect(sql).toContain("review does not match a delivered order");
    expect(sql).toContain("revoke update on table public.disputes from authenticated");
  });

  it("applies suspension, block, and rate-limit guards", () => {
    expect(sql).toContain("reject_suspended_write");
    expect(sql).toContain("users_blocked");
    expect(sql).toContain("report rate limit exceeded");
    expect(sql).toContain("affiliate click rate limit exceeded");
    expect(sql).toContain("anonymous clicks cannot set a user id");
  });

  it("defines block helpers before policies use them and protects chat messages", () => {
    const blockHelper = sql.indexOf("create or replace function public.users_blocked");
    const blockedListingPolicy = sql.indexOf("and not public.users_blocked((select auth.uid()), seller_id)");

    expect(blockHelper).toBeGreaterThanOrEqual(0);
    expect(blockedListingPolicy).toBeGreaterThan(blockHelper);
    expect(sql).toContain("chat_messages_select_participants");
    expect(sql).toContain("chat_messages_insert_as_participant");
  });
});
