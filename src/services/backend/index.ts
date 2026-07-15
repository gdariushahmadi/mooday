import { getBackendConfig } from "./config";
import type { Phase2Backend } from "./contracts";
import { createSupabaseBackend } from "./supabase";

/** Returns null only in explicitly selected mock/demo mode. */
export function getPhase2Backend(): Phase2Backend | null {
  const config = getBackendConfig();
  return config.mode === "supabase" ? createSupabaseBackend(config) : null;
}

export type {
  AuthenticatedUser,
  AuthResult,
  OtpPurpose,
  Phase2Backend,
} from "./contracts";
