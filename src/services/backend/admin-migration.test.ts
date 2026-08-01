import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202607150008_phase_3_5_admin.sql"),
  "utf8",
).toLowerCase();

describe("Phase 3.5 admin migration", () => {
  it("adds moderation columns to profiles", () => {
    expect(sql).toContain("is_admin boolean not null default false");
    expect(sql).toContain("is_suspended boolean not null default false");
    expect(sql).toContain("suspended_reason text");
    expect(sql).toContain("suspended_at timestamptz");
  });

  it("introduces an approval column on listings without dropping data", () => {
    expect(sql).toContain("add column if not exists approved_at timestamptz");
    expect(sql).toContain("set approved_at = timezone('utc', now())");
  });

  it("tightens public listings visibility to require approval", () => {
    expect(sql).toContain('drop policy if exists "listings_select_visible"');
    expect(sql).toContain("status = 'active' and approved_at is not null");
  });

  it("lets admins update any profile row", () => {
    expect(sql).toContain("p.id = (select auth.uid()) and p.is_admin");
  });

  it("creates an admin-only audit log", () => {
    expect(sql).toContain("create table public.audit_log");
    expect(sql).toContain("audit_log_select_admin");
    expect(sql).toContain("audit_log_insert_admin");
    expect(sql).toContain("p.is_admin");
  });

  it("constrains audit_log target_kind to a closed enum", () => {
    expect(sql).toContain(
      "target_kind in ('listing', 'user', 'order', 'dispute', 'report', 'review', 'notification')",
    );
  });

  it("creates a public-read featured_listings table", () => {
    expect(sql).toContain("create table public.featured_listings");
    expect(sql).toContain("featured_listings_select_all");
    expect(sql).toContain("featured_listings_write_admin");
  });

  it("creates broadcast_notifications visible to everyone", () => {
    expect(sql).toContain("create table public.broadcast_notifications");
    expect(sql).toContain("broadcast_notifications_select_all");
    expect(sql).toContain("broadcast_notifications_write_admin");
  });
});
