import { createClient } from "@supabase/supabase-js";
import type { BackendConfig } from "../config";
import type { Phase2Backend } from "../contracts";
import { SupabaseAddressService } from "./addresses";
import { SupabaseAffiliateClickService, SupabaseAffiliateLinkService } from "./affiliates";
import { SupabaseAuthService } from "./auth";
import { SupabaseBlockService } from "./blocks";
import { SupabaseCartService } from "./cart";
import { SupabaseChatService } from "./chats";
import { SupabaseDisputeService } from "./disputes";
import { SupabaseFollowService } from "./follows";
import { SupabaseLikeService } from "./likes";
import { SupabaseListingService } from "./listings";
import { SupabaseListingMediaService } from "./media";
import { SupabaseNotificationService } from "./notifications";
import { SupabaseOrderService } from "./orders";
import { SupabasePaymentMethodService } from "./paymentMethods";
import { SupabaseProfileService } from "./profiles";
import { SupabaseReportService } from "./reports";
import { SupabaseSellerReviewService } from "./reviews";
import { SupabaseSellerCardService } from "./sellerCards";

let backend: Phase2Backend | null = null;

export function createSupabaseBackend(config: BackendConfig): Phase2Backend {
    if (backend) return backend;
    if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error("Supabase configuration is incomplete.");
    }

    const client = createClient(
            config.supabaseUrl,
            config.supabasePublishableKey,
            {
              auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true },
            },
          );
    backend = {
    auth: new SupabaseAuthService(client, config.siteUrl),
    profiles: new SupabaseProfileService(client),
    addresses: new SupabaseAddressService(client),
    listings: new SupabaseListingService(client),
    media: new SupabaseListingMediaService(client),
    sellerCards: new SupabaseSellerCardService(client),
    likes: new SupabaseLikeService(client),
    cart: new SupabaseCartService(client),
    follows: new SupabaseFollowService(client),
    orders: new SupabaseOrderService(client),
    chats: new SupabaseChatService(client),
    reviews: new SupabaseSellerReviewService(client),
    reports: new SupabaseReportService(client),
    disputes: new SupabaseDisputeService(client),
    notifications: new SupabaseNotificationService(client),
    paymentMethods: new SupabasePaymentMethodService(client),
    blocks: new SupabaseBlockService(client),
    affiliateLinks: new SupabaseAffiliateLinkService(client),
    affiliateClicks: new SupabaseAffiliateClickService(client),
    };
    return backend;
}

export { mapSupabaseAuthError } from "./auth";
