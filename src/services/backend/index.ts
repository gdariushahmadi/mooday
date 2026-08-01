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

/** Phase 3 media adapter (slice 2b). Same flag as listings. */
export function getPhase3MediaService() {
  const config = getBackendConfig();
  if (config.marketplaceMode !== "supabase") return null;
  return createSupabaseBackend(config).media;
}

/** Phase 3 seller-card projection (slice 2). Same flag as listings. */
export function getPhase3SellerCardService() {
  const config = getBackendConfig();
  if (config.marketplaceMode !== "supabase") return null;
  return createSupabaseBackend(config).sellerCards;
}

/** Phase 3 user likes (slice 4). Same flag as listings. */
export function getPhase3LikeService() {
  const config = getBackendConfig();
  if (config.marketplaceMode !== "supabase") return null;
  return createSupabaseBackend(config).likes;
}

/** Phase 3 user cart (slice 4). Same flag as listings. */
export function getPhase3CartService() {
  const config = getBackendConfig();
  if (config.marketplaceMode !== "supabase") return null;
  return createSupabaseBackend(config).cart;
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
  ListingImageRecord,
  ListingImageUpload,
  ListingMediaMime,
  ListingMediaService,
  SellerCardRecord,
  SellerCardService,
  SellerCardUpsertInput,
  LikeService,
  CartItemRecord,
  CartService,
  OrderItemRecord,
  OrderItemSnapshot,
  OrderRecord,
  OrderService,
  OrderStatus,
  OrderWithItems,
  CreateOrderInput,
  ChatMessageRecord,
  ChatMessageType,
  ChatService,
  ChatThreadRecord,
  SellerReviewRecord,
  SellerReviewService,
  ReportReason,
  ReportRecord,
  ReportService,
  ReportStatus,
  ReportTarget,
  DisputeRecord,
  DisputeService,
  DisputeStatus,
  DisputeTimelineEvent,
  NotificationKind,
  NotificationRecord,
  NotificationService,
} from "./contracts";
export {
  LISTING_MEDIA_ALLOWED_MIME,
  LISTING_MEDIA_MAX_BYTES,
} from "./contracts";
export { getBackendConfig } from "./config";
