import { CATEGORIES, CONDITIONS } from "@/data/categories";
import { SIZES, COLOURS, type Size } from "@/data/attributes";
import type { SortOption } from "./types";

export function readUrlFilters() {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const category = p.get("cat") ?? "All";
  const condition = p.get("cond") ?? "All";
  const color = p.get("color") ?? "";
  const mode = p.get("mode");
  const sort = p.get("sort");
  const validPrice = (value: string | null) =>
    value != null && /^\d+$/.test(value) ? value : "";
  return {
    q: p.get("q") ?? "",
    cat: CATEGORIES.includes(category as (typeof CATEGORIES)[number])
      ? category
      : "All",
    cond: CONDITIONS.includes(condition as (typeof CONDITIONS)[number])
      ? condition
      : "All",
    sizes: (p.get("size") ?? "")
      .split(",")
      .filter((size): size is Size => SIZES.includes(size as Size)),
    color: COLOURS.some((item) => item.key === color) ? color : "",
    min: validPrice(p.get("min")),
    max: validPrice(p.get("max")),
    mode: mode === "resell" ? ("resell" as const) : ("all" as const),
    sort: (["newest", "priceAsc", "priceDesc"] as const).includes(
      sort as "newest" | "priceAsc" | "priceDesc",
    )
      ? (sort as SortOption)
      : "relevance",
  };
}

export function syncUrl(filters: {
  q: string;
  cat: string;
  cond: string;
  sizes: Size[];
  color: string;
  min: string;
  max: string;
  mode: string;
  sort: string;
}) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const set = (key: string, val: string) => {
    if (val && val !== "All" && val !== "all" && val !== "relevance") {
      url.searchParams.set(key, val);
    } else {
      url.searchParams.delete(key);
    }
  };
  set("q", filters.q);
  set("cat", filters.cat);
  set("cond", filters.cond);
  set("size", filters.sizes.join(","));
  set("color", filters.color);
  set("min", filters.min);
  set("max", filters.max);
  set("mode", filters.mode);
  set("sort", filters.sort);
  window.history.replaceState(null, "", url.toString());
}
