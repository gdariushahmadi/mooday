import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202608160429_u3_search_listings.sql"),
  "utf8",
).toLowerCase();

describe("U3 search_listings RPC", () => {
  it("creates or replaces the search_listings function", () => {
    expect(sql).toContain(
      "create or replace function public.search_listings(",
    );
    expect(sql).toContain("query text");
    expect(sql).toContain("filters jsonb default '{}'::jsonb");
  });

  it("returns the full listing row plus a rank", () => {
    expect(sql).toContain("returns table");
    expect(sql).toContain("id uuid");
    expect(sql).toContain("rank real");
  });

  it("uses tsvector to match Arabic and English columns", () => {
    expect(sql).toContain("websearch_to_tsquery");
    expect(sql).toContain("to_tsvector");
    expect(sql).toContain("title_en");
    expect(sql).toContain("title_ar");
    expect(sql).toContain("description_en");
    expect(sql).toContain("description_ar");
  });

  it("ranks by ts_rank and orders by rank desc, then created_at desc", () => {
    expect(sql).toContain("ts_rank");
    expect(sql).toContain("order by");
  });

  it("filters by category, price range, and status", () => {
    expect(sql).toContain("v_category is null or l.category = v_category");
    expect(sql).toContain("v_price_min is null or l.price_minor >= v_price_min");
    expect(sql).toContain("v_price_max is null or l.price_minor <= v_price_max");
    expect(sql).toContain("l.status = v_status");
  });

  it("is granted to anon and authenticated", () => {
    expect(sql).toContain(
      "grant execute on function public.search_listings(text, jsonb) to anon, authenticated",
    );
  });

  it("is declared stable and security invoker", () => {
    expect(sql).toContain("language plpgsql");
    expect(sql).toContain("stable");
    expect(sql).toContain("security invoker");
  });
});
