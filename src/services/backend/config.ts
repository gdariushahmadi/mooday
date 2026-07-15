export type DataSourceMode = "mock" | "supabase";

export interface BackendConfig {
  mode: DataSourceMode;
  marketplaceMode: DataSourceMode;
  supabaseUrl: string | null;
  supabasePublishableKey: string | null;
  siteUrl: string;
}

/**
 * Browser-safe Phase 2 configuration. Only Supabase's publishable key is
 * allowed here; service-role and database credentials must remain server-only.
 */
export function getBackendConfig(): BackendConfig {
  const requestedMode = process.env.NEXT_PUBLIC_DATA_SOURCE;
  const mode: DataSourceMode =
    requestedMode === "supabase" ? "supabase" : "mock";
  const marketplaceMode: DataSourceMode =
    process.env.NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE === "supabase"
      ? "supabase"
      : "mock";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    null;

  if (mode === "supabase" && (!supabaseUrl || !supabasePublishableKey)) {
    throw new Error(
      "NEXT_PUBLIC_DATA_SOURCE=supabase requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  if (marketplaceMode === "supabase" && mode !== "supabase") {
    throw new Error(
      "NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE=supabase requires NEXT_PUBLIC_DATA_SOURCE=supabase.",
    );
  }

  return {
    mode,
    marketplaceMode,
    supabaseUrl,
    supabasePublishableKey,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  };
}
