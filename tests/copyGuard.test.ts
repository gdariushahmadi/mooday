import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import {
  BANNED_PHRASES_EN,
  BANNED_PHRASES_AR,
  isExemptPath,
} from "../src/lib/banned-phrases";

const PROJECT_ROOT = resolve(__dirname, "..");
const SCAN_ROOTS = ["src"];

interface BannedPhraseHit {
  file: string;
  line: number;
  column: number;
  phrase: string;
  match: string;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function findHits(file: string): BannedPhraseHit[] {
  const absolute = resolve(file);
  if (isExemptPath(absolute)) return [];
  const text = readFileSync(file, "utf8");
  const hits: BannedPhraseHit[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const phrase of BANNED_PHRASES_EN) {
      // Case-insensitive, hyphen-or-space insensitive for the canonical
      // banned phrase "second-hand".
      const re = new RegExp(phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
      const m = line.match(re);
      if (m && m.index !== undefined) {
        hits.push({
          file: relative(PROJECT_ROOT, file),
          line: i + 1,
          column: m.index + 1,
          phrase,
          match: m[0],
        });
      }
    }
    for (const phrase of BANNED_PHRASES_AR) {
      const idx = line.indexOf(phrase);
      if (idx >= 0) {
        hits.push({
          file: relative(PROJECT_ROOT, file),
          line: i + 1,
          column: idx + 1,
          phrase,
          match: phrase,
        });
      }
    }
  }
  return hits;
}

describe("copy guard (DANEG rebrand)", () => {
  it("does not include banned English phrases in any scanned source file", () => {
    const all: BannedPhraseHit[] = [];
    for (const root of SCAN_ROOTS) {
      for (const file of walk(join(PROJECT_ROOT, root))) {
        all.push(...findHits(file));
      }
    }
    if (all.length > 0) {
      const summary = all
        .map(
          (h) =>
            `  ${h.file}:${h.line}:${h.column} - banned phrase "${h.phrase}" (matched "${h.match}")`,
        )
        .join("\n");
      throw new Error(
        `Found ${all.length} banned phrase occurrence(s):\n${summary}`,
      );
    }
    expect(all).toEqual([]);
  });

  it("exports the expected banned English phrases", () => {
    expect(BANNED_PHRASES_EN).toContain("second-hand");
    expect(BANNED_PHRASES_EN).toContain("secondhand");
    expect(BANNED_PHRASES_EN).toContain("second hand");
  });

  it("exports the expected banned Arabic phrases", () => {
    expect(BANNED_PHRASES_AR).toContain("نساء");
    expect(BANNED_PHRASES_AR).toContain("للسيدات");
    expect(BANNED_PHRASES_AR).toContain("مستعملة");
    expect(BANNED_PHRASES_AR).toContain("مستعمل");
  });

  it("treats the banned-phrases module itself as exempt", () => {
    expect(isExemptPath(resolve(PROJECT_ROOT, "src/lib/banned-phrases.ts"))).toBe(true);
  });
});
