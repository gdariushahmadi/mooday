import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202607150006_phase_3_orders.sql"),
  "utf8",
).toLowerCase();

describe("Phase 3 orders migration", () => {
  it("creates orders and order_items with snapshot columns", () => {
    expect(sql).toContain("create table public.orders");
    expect(sql).toContain("create table public.order_items");
    expect(sql).toContain("shipping_address jsonb not null");
    expect(sql).toContain("title_en_at_purchase text not null");
    expect(sql).toContain("image_url_at_purchase text not null");
    expect(sql).toContain("price_minor_at_purchase bigint not null");
  });

  it("enforces the AED currency and a non-negative minor-unit total", () => {
    expect(sql).toContain("check (currency = 'aed')");
    expect(sql).toContain("items_subtotal_minor >= 0");
    expect(sql).toContain("shipping_fee_minor >= 0");
    expect(sql).toContain("total_minor >= 0");
  });

  it("allows both buyer and seller to read; buyer-only to insert", () => {
    expect(sql).toContain("orders_select_participants");
    expect(sql).toContain("orders_insert_as_buyer");
    expect(sql).toContain("(select auth.uid()) = buyer_id");
  });

  it("binds order items visibility to the parent order participants", () => {
    expect(sql).toContain("order_items_select_participants");
    expect(sql).toContain("order_items_insert_as_buyer");
    expect(sql).toContain("orders.buyer_id = (select auth.uid())");
  });

  it("defines the state-machine trigger with explicit role checks", () => {
    expect(sql).toContain("enforce_order_status_transition");
    expect(sql).toContain("security invoker");
    expect(sql).toContain("'only the seller may ship an order'");
    expect(sql).toContain("'only the buyer may cancel an order'");
    expect(sql).toContain("'only the buyer or seller may confirm delivery'");
    expect(sql).toContain("'only the buyer may request a return'");
    expect(sql).toContain("illegal order status transition");
  });

  it("uses ON DELETE SET NULL on the listing reference so history survives", () => {
    expect(sql).toContain(
      "listing_id uuid references public.listings(id) on delete set null",
    );
  });
});
