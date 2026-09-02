import { createClient } from "@supabase/supabase-js";
import { getBackendConfig } from "@/services/backend/config";
import { CATEGORIES_AR, SELL_CATEGORIES } from "@/data/categories";

export interface CategoryOption {
  slug: string;
  nameEn: string;
  nameAr: string;
}

const FALLBACK_CATEGORIES: CategoryOption[] = SELL_CATEGORIES.map((c) => ({
  slug: c.toLowerCase(),
  nameEn: c,
  nameAr: CATEGORIES_AR[c] ?? c,
}));

let cachedClient: ReturnType<typeof createClient> | null = null;

function getPublicClient() {
  if (cachedClient) return cachedClient;
  const config = getBackendConfig();
  if (
    config.marketplaceMode !== "supabase" ||
    !config.supabaseUrl ||
    !config.supabasePublishableKey
  ) {
    return null;
  }
  cachedClient = createClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cachedClient;
}

/**
 * Active categories for the sell/browse flow, sourced from the
 * admin-managed `categories` table. Falls back to the static CATEGORIES
 * list (src/data/categories.ts) in mock mode or if the fetch fails, so
 * the sell form and filters never render empty.
 */
export async function fetchActiveCategories(): Promise<CategoryOption[]> {
  const client = getPublicClient();
  if (!client) return FALLBACK_CATEGORIES;
  try {
    const { data, error } = await client
      .from("categories")
      .select("slug, name_en, name_ar")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return FALLBACK_CATEGORIES;
    return (
      data as { slug: string; name_en: string; name_ar: string }[]
    ).map((row) => ({
      slug: String(row.slug),
      nameEn: String(row.name_en),
      nameAr: String(row.name_ar),
    }));
  } catch {
    return FALLBACK_CATEGORIES;
  }
}
