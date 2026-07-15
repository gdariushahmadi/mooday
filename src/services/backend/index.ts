import { getBackendConfig } from "./config";
import type { Phase2Backend } from "./contracts";
import { createSupabaseBackend } from "./supabase";

/** Returns null only in explicitly selected mock/demo mode. */
export function getPhase2Backend(): Phase2Backend | null {
  const config = getBackendConfig();
  return config.mode === "supabase" ? createSupabaseBackend(config) : null;
}

/** Phase 3 listings stay behind a separate rollout flag. */
export function getPhase3ListingService() {
  const config = getBackendConfig();
  if (config.marketplaceMode !== "supabase") return null;
  return createSupabaseBackend(config).listings;
}

export type {
  AuthenticatedUser,
  AuthResult,
  OtpPurpose,
  Phase2Backend,
  CreateListingInput,
  ListingRecord,
  ListingService,
  ListingStatus,
} from "./contracts";
