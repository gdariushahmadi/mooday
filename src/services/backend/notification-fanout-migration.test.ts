import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Comments are stripped so the assertions below look at executable SQL
// only — the migration header quotes the very kinds it removes.
function loadSql(file: string): string {
  return readFileSync(resolve("supabase/migrations", file), "utf8")
    .replace(/--[^\n]*/g, "")
    .toLowerCase();
}

const social = loadSql("202607150007_phase_3_social.sql");
const fixup = loadSql("202609100001_fix_notification_fanout_kinds.sql");

function allowedValues(source: string, pattern: RegExp): string[] {
  const match = source.match(pattern);
  if (!match) throw new Error(`constraint not found for ${pattern}`);
  return match[1].split(",").map((value) => value.trim().replace(/'/g, ""));
}

// `kind in ('chat', 'offer', …)` — anchored to a line start so the
// `target_kind in (…)` constraint does not match.
const ALLOWED_KINDS = allowedValues(social, /\n\s*kind in \(([^)]+)\)/);
const ALLOWED_TARGET_KINDS = allowedValues(
  social,
  /target_kind in \(([^)]+)\)/,
);

// Each fan-out insert ends with `) values (<recipient>, '<kind>', …`.
function insertedKinds(source: string): string[] {
  return [...source.matchAll(/\)\s*values\s*\(\s*[\w.]+,\s*'([a-z_]+)'/g)].map(
    (match) => match[1],
  );
}

// …and closes with `'<target_kind>', <target_id>)`.
function insertedTargetKinds(source: string): string[] {
  return [...source.matchAll(/'([a-z_]+)',\s*[\w.]+\s*\)/g)].map(
    (match) => match[1],
  );
}

describe("notification fan-out kind fixup migration", () => {
  it("only writes kinds the notifications check constraint allows", () => {
    const kinds = insertedKinds(fixup);
    expect(kinds.length).toBeGreaterThan(0);
    for (const kind of kinds) {
      expect(ALLOWED_KINDS).toContain(kind);
    }
    expect(kinds).not.toContain("social");
  });

  it("only writes target kinds the check constraint allows", () => {
    const targetKinds = insertedTargetKinds(fixup);
    expect(targetKinds.length).toBeGreaterThan(0);
    for (const targetKind of targetKinds) {
      expect(ALLOWED_TARGET_KINDS).toContain(targetKind);
    }
  });

  it("attaches the like fan-out to the real likes table", () => {
    expect(fixup).toContain(
      "drop trigger if exists listing_like_fanout on public.user_listing_likes",
    );
    expect(fixup).toContain("after insert on public.user_listing_likes");
    expect(fixup).not.toContain("after insert on public.user_likes");
  });

  it("reads the follow recipient from followee_id", () => {
    expect(fixup).toContain("new.followee_id");
    expect(fixup).not.toContain("new.following_id");
    expect(fixup).not.toContain("new.follower_handle");
  });

  it("reads the dispute seller from orders", () => {
    expect(fixup).toContain("select o.seller_id, o.buyer_id into v_seller");
  });

  it("replaces the blanket target uniqueness with a scoped index", () => {
    expect(fixup).toContain(
      "drop constraint if exists notifications_target_unique",
    );
    expect(fixup).toContain("create unique index if not exists");
    expect(fixup).toContain(
      "where target_kind = 'none' and target_id is not null",
    );
  });

  it("keeps fan-out failures from rolling back the user action", () => {
    const handlers = fixup.match(/exception when others then/g) ?? [];
    expect(handlers.length).toBe(5);
  });
});

describe("original fan-out migration", () => {
  const original = loadSql("202608200002_extend_notification_fanout.sql");

  it("no longer creates a trigger on a table that does not exist", () => {
    expect(original).toContain("to_regclass('public.user_likes')");
  });
});
