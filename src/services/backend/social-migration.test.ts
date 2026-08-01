import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202607150007_phase_3_social.sql"),
  "utf8",
).toLowerCase();

describe("Phase 3 social layer migration", () => {
  it("creates all five domain tables", () => {
    expect(sql).toContain("create table public.chat_threads");
    expect(sql).toContain("create table public.chat_messages");
    expect(sql).toContain("create table public.seller_reviews");
    expect(sql).toContain("create table public.reports");
    expect(sql).toContain("create table public.disputes");
    expect(sql).toContain("create table public.notifications");
  });

  it("snapshots the listing identity into the chat thread header", () => {
    expect(sql).toContain("listing_title_en text not null default ''");
    expect(sql).toContain("listing_title_ar text not null default ''");
    expect(sql).toContain("listing_image_url text not null default ''");
    expect(sql).toContain("price_minor_at_creation bigint");
  });

  it("enforces one chat thread per (buyer, seller, listing)", () => {
    expect(sql).toContain("unique (buyer_id, seller_id, listing_id)");
  });

  it("restricts offer messages to pending/accepted/declined", () => {
    expect(sql).toContain(
      "offer_status is null or offer_status in ('pending', 'accepted', 'declined')",
    );
  });

  it("binds review inserts to a real owned order", () => {
    expect(sql).toContain("seller_reviews_insert_as_buyer");
    expect(sql).toContain("orders.buyer_id = (select auth.uid())");
  });

  it("restricts one review per (buyer, order) to prevent spam", () => {
    expect(sql).toContain("unique (buyer_id, order_id)");
  });

  it("makes reviews public while keeping reports private", () => {
    expect(sql).toContain("seller_reviews_select_all");
    expect(sql).toContain("reports_select_own");
  });

  it("binds disputes to either participant of the order", () => {
    expect(sql).toContain("disputes_select_participants");
    expect(sql).toContain("disputes_insert_as_buyer");
    expect(sql).toContain("orders.buyer_id = (select auth.uid())");
    expect(sql).toContain("orders.seller_id = (select auth.uid())");
  });

  it("allows notification writes only for the recipient id", () => {
    expect(sql).toContain("notifications_select_own");
    expect(sql).toContain("notifications_insert_as_recipient");
    expect(sql).toContain("(select auth.uid()) = recipient_id");
  });

  it("stores dispute timelines as jsonb so additions are append-only", () => {
    expect(sql).toContain("timeline jsonb not null default '[]'");
  });
});
