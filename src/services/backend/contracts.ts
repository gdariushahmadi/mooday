import type { AuthErrorCode } from "@/data/users";
import type { Address } from "@/data/addresses";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export type AuthResult<T> =
  | { ok: true; value: T; needsVerification?: boolean }
  | { ok: false; error: AuthErrorCode };

export type OtpPurpose = "signup" | "recovery";

export interface AuthService {
  getCurrentUser(): Promise<AuthenticatedUser | null>;
  subscribe(listener: (user: AuthenticatedUser | null) => void): () => void;
  signUp(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthResult<AuthenticatedUser>>;
  signIn(input: {
    email: string;
    password: string;
  }): Promise<AuthResult<AuthenticatedUser>>;
  signOut(): Promise<AuthResult<null>>;
  sendOtp(email: string, purpose: OtpPurpose): Promise<AuthResult<null>>;
  verifyOtp(
    email: string,
    token: string,
    purpose: OtpPurpose,
  ): Promise<AuthResult<AuthenticatedUser>>;
  resetPassword(newPassword: string): Promise<AuthResult<null>>;
  signInWithOAuth(provider: "google"): Promise<AuthResult<null>>;
  completeOAuth(code: string): Promise<AuthResult<AuthenticatedUser>>;
  updateName(name: string): Promise<AuthResult<null>>;
}

export interface ProfileRecord {
  fullNameEn: string;
  fullNameAr: string;
  handle: string;
  avatar: string;
  bioEn: string;
  bioAr: string;
  locationEn: string;
  locationAr: string;
  styleTagsEn: string[];
  styleTagsAr: string[];
}

export interface ProfileService {
  getMine(): Promise<ProfileRecord | null>;
  updateMine(patch: Partial<ProfileRecord>): Promise<void>;
}

export interface AddressService {
  listMine(): Promise<Address[]>;
  create(address: Omit<Address, "id">): Promise<Address>;
  update(id: string, patch: Partial<Omit<Address, "id">>): Promise<void>;
  remove(id: string): Promise<void>;
  setDefault(id: string): Promise<void>;
}

export type ListingStatus =
  "draft" | "active" | "reserved" | "sold" | "archived";
export type ListingMode = "resell" | "rent";

export interface ListingRecord {
  id: string;
  sellerId: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  priceMinor: number;
  originalPriceMinor: number | null;
  currency: "AED";
  conditionEn: string;
  conditionAr: string;
  category: string;
  size: string | null;
  colorEn: string | null;
  colorAr: string | null;
  mode: ListingMode;
  status: ListingStatus;
  isAuthentic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateListingInput = Omit<
  ListingRecord,
  "id" | "sellerId" | "createdAt" | "updatedAt"
>;

export interface ListingService {
  listVisible(): Promise<ListingRecord[]>;
  listMine(): Promise<ListingRecord[]>;
  /** Full-text search across title_en, title_ar, description_en, description_ar.
   * Filters: { category?: string, price_min?: number, price_max?: number,
   *   status?: 'draft' | 'active' | 'reserved' | 'sold' | 'archived',
   *   limit?: number, offset?: number }.
   * Empty query returns recent listings (filters still apply). */
  search(
    query: string,
    filters?: {
      category?: string;
      priceMin?: number;
      priceMax?: number;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<ListingRecord[]>;
  /** Bulk lookup keyed by listingId. Unknown ids return records from the
   * `active` set only — drafts/archived/sold are filtered out so callers
   * stay safe to render without re-validating per row. */
  listByIds(ids: string[]): Promise<ListingRecord[]>;
  create(input: CreateListingInput): Promise<ListingRecord>;
  update(id: string, patch: Partial<CreateListingInput>): Promise<void>;
  remove(id: string): Promise<void>;
}

/**
 * A ready-to-render image attached to a listing.
 *
 * `url` is always a usable browser URL. For files uploaded to the private
 * `listing-media` bucket it is a short-lived signed URL (UI must refresh
 * before `signedUrlExpiresAt`). For absolute paths used by mock seed data
 * (`/products/foo.jpg`) it is the path verbatim — no signed-URL hop.
 */
export interface ListingImageRecord {
  id: string;
  listingId: string;
  storagePath: string;
  url: string;
  /** Epoch ms; only meaningful when `url` is a signed URL. */
  signedUrlExpiresAt?: number;
  sortOrder: number;
  altEn: string;
  altAr: string;
  createdAt: string;
}

export const LISTING_MEDIA_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type ListingMediaMime = (typeof LISTING_MEDIA_ALLOWED_MIME)[number];

/** Max upload size. Mirrors the `file_size_limit` on the `listing-media` bucket. */
export const LISTING_MEDIA_MAX_BYTES = 10 * 1024 * 1024;

export interface ListingImageUpload {
  /** Original filename without path. Used for mime inference only. */
  filename: string;
  mimeType: ListingMediaMime;
  sizeBytes: number;
  /** Browser-supplied blob. Never serialized across the network elsewhere. */
  body: Blob | ArrayBuffer;
  altEn?: string;
  altAr?: string;
}

export interface ListingMediaService {
  /**
   * Validate, upload, and persist one image. The storage path follows the
   * `{userId}/{listingId}/{uuid}.{ext}` shape required by the bucket's RLS
   * policies; `sellerId` is derived from the current Auth session.
   */
  upload(
    listingId: string,
    file: ListingImageUpload,
    sortOrder: number,
  ): Promise<ListingImageRecord>;
  listForListing(listingId: string): Promise<ListingImageRecord[]>;
  /** Bulk lookup keyed by listingId. Empty array for unknown ids. */
  listForListings(
    listingIds: string[],
  ): Promise<Record<string, ListingImageRecord[]>>;
  remove(imageId: string): Promise<void>;
  /** Remove all images for a listing (storage objects + metadata rows). */
  removeAllForListing(listingId: string): Promise<void>;
}

/**
 * Public seller card (Phase 3, slice 2).
 *
 * This is the projection shown on Product Details (B-09), the public
 * seller profile (B-11), and anywhere else a buyer sees the seller. It
 * is sourced from the `seller_card_view` Postgres view and intentionally
 * excludes every private `profiles` column (full address, language
 * preference, account-level settings).
 */
export interface SellerCardRecord {
  sellerId: string;
  displayNameEn: string;
  displayNameAr: string;
  handle: string | null;
  avatarUrl: string | null;
  typeEn: string;
  typeAr: string;
  bioEn: string;
  bioAr: string;
  cityEn: string;
  cityAr: string;
  styleTagsEn: string[];
  styleTagsAr: string[];
  isVerified: boolean;
  responseRate: number | null;
  responseTimeHours: number | null;
  joinedAt: string;
  updatedAt: string;
  /** Derived: number of `active` listings owned by this seller. */
  listingsCount: number;
}

/**
 * Owner-writable patch. `sellerId` is always derived from the current
 * Auth session; callers cannot supply or spoof it.
 */
export type SellerCardUpsertInput = Partial<
  Omit<
    SellerCardRecord,
    "sellerId" | "joinedAt" | "updatedAt" | "listingsCount"
  >
>;

export interface SellerCardService {
  /** All seller cards ordered by active-listings volume (heaviest first). */
  listVisible(): Promise<SellerCardRecord[]>;
  getById(sellerId: string): Promise<SellerCardRecord | null>;
  getByHandle(handle: string): Promise<SellerCardRecord | null>;
  /** Insert-or-update the current user's card. Idempotent per session. */
  upsertMine(patch: SellerCardUpsertInput): Promise<void>;
}

/**
 * User-scoped like membership (Phase 3, slice 4).
 *
 * The Phase 1 UI only needs `listingId`s and an idempotent toggle. The
 * remote backend enforces owner-scoped RLS; callers cannot like a listing
 * on another user's behalf.
 */
export interface LikeService {
  /** Listing ids the current user has liked. Stable order by created_at desc. */
  listMine(): Promise<string[]>;
  /** Idempotent: re-liking is a no-op. */
  like(listingId: string): Promise<void>;
  /** Idempotent: unliking an absent row is a no-op. */
  unlike(listingId: string): Promise<void>;
  /** Convenience: returns the resulting state in one round-trip. */
  toggle(listingId: string): Promise<{ liked: boolean }>;
}

/**
 * A single cart line as stored remotely. The UI rehydrates the related
 * `Product` from `listings` on read, so only identifiers and quantity
 * live here. Keeping the storage representation identifier-only avoids
 * the "stale price in cart" bug class that bites Phase 1 checkout flows.
 */
export interface CartItemRecord {
  listingId: string;
  quantity: number;
  addedAt: string;
  updatedAt: string;
}

export interface CartService {
  listMine(): Promise<CartItemRecord[]>;
  /**
   * Increment quantity atomically. Re-using the same `listingId` is
   * safe: the server merges on `(user_id, listing_id)` and clamps the
   * quantity to the schema-defined ceiling.
   */
  add(listingId: string, quantity?: number): Promise<void>;
  /**
   * Idempotent. Treats `quantity <= 0` as a delete so the UI can issue
   * a single call for both "set new quantity" and "remove line".
   */
  setQuantity(listingId: string, quantity: number): Promise<void>;
  remove(listingId: string): Promise<void>;
  clear(): Promise<void>;
}

// ---------- slice 5: orders ----------

export type OrderStatus =
  "paid" | "shipped" | "delivered" | "returned" | "cancelled";

export interface OrderItemRecord {
  id: string;
  orderId: string;
  listingId: string | null;
  titleEnAtPurchase: string;
  titleArAtPurchase: string;
  imageUrlAtPurchase: string;
  priceMinorAtPurchase: number;
  quantity: number;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  buyerId: string;
  sellerId: string;
  status: OrderStatus;
  shippingAddress: {
    cityEn: string;
    cityAr: string;
    streetEn: string;
    streetAr: string;
    [k: string]: unknown;
  };
  currency: "AED";
  itemsSubtotalMinor: number;
  shippingFeeMinor: number;
  totalMinor: number;
  paymentMethod: string | null;
  paymentBrandEn: string | null;
  paymentBrandAr: string | null;
  paymentLast4: string | null;
  courierNameEn: string | null;
  courierNameAr: string | null;
  courierTracking: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemSnapshot {
  listingId: string;
  titleEnAtPurchase: string;
  titleArAtPurchase: string;
  imageUrlAtPurchase: string;
  priceMinorAtPurchase: number;
  quantity: number;
}

export interface CreateOrderInput {
  sellerId: string;
  shippingAddress: OrderRecord["shippingAddress"];
  itemsSubtotalMinor: number;
  shippingFeeMinor: number;
  totalMinor: number;
  paymentMethod: string | null;
  paymentBrandEn: string | null;
  paymentBrandAr: string | null;
  paymentLast4: string | null;
  items: OrderItemSnapshot[];
}

export interface OrderWithItems extends OrderRecord {
  items: OrderItemRecord[];
}

export interface OrderService {
  /** Orders where the current user is the buyer, newest first. */
  listMineAsBuyer(): Promise<OrderWithItems[]>;
  /** Orders where the current user is the seller, newest first. */
  listMineAsSeller(): Promise<OrderWithItems[]>;
  getById(orderId: string): Promise<OrderWithItems | null>;
  create(input: CreateOrderInput): Promise<OrderRecord>;
  /** `markShipped` is seller-only; the state-machine trigger enforces it. */
  markShipped(
    orderId: string,
    courier: { nameEn: string; nameAr: string; tracking: string },
  ): Promise<void>;
  markDelivered(orderId: string): Promise<void>;
  cancel(orderId: string): Promise<void>;
  requestReturn(orderId: string): Promise<void>;
  /**
   * Create a Stripe PaymentIntent for the order. The client uses the
   * returned `clientSecret` to confirm payment via Stripe.js. The
   * webhook (`/api/stripe/webhook`) is the source of truth for moving
   * the order to `paid`; this method only initiates the payment.
   */
  createPaymentIntent(
    orderId: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string }>;
}

// ---------- slice 6: chat / offers / reviews / reports / disputes /
//                    notifications ----------

export interface ChatThreadRecord {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string | null;
  /** Listing title snapshot — survives listing edits/deletes. */
  listingTitleEn: string;
  listingTitleAr: string;
  listingImageUrl: string;
  priceMinorAtCreation: number;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ChatMessageType = "text" | "image" | "system" | "offer";

export interface ChatMessageRecord {
  id: string;
  threadId: string;
  senderId: string;
  type: ChatMessageType;
  body: string;
  imageUrl: string | null;
  /** Only meaningful for `type === 'offer'`. Minor units. */
  offerMinor: number | null;
  offerStatus: "pending" | "accepted" | "declined" | null;
  createdAt: string;
}

export interface ChatService {
  listMine(): Promise<ChatThreadRecord[]>;
  getThread(threadId: string): Promise<ChatThreadRecord | null>;
  /**
   * Create or return the existing thread for (buyer, seller, listing).
   * The unique constraint `(buyer_id, seller_id, listing_id)` enforces
   * idempotency.
   */
  upsertForListing(input: {
    sellerId: string;
    listingId: string;
    listingTitleEn: string;
    listingTitleAr: string;
    listingImageUrl: string;
    priceMinorAtCreation: number;
  }): Promise<ChatThreadRecord>;
  listMessages(threadId: string): Promise<ChatMessageRecord[]>;
  sendMessage(
    threadId: string,
    message: Pick<
      ChatMessageRecord,
      "type" | "body" | "imageUrl" | "offerMinor"
    >,
  ): Promise<ChatMessageRecord>;
  /** Accept/decline an offer message. No-op if the message is not an offer. */
  setOfferStatus(
    messageId: string,
    status: "accepted" | "declined",
  ): Promise<void>;
  /**
   * Subscribe to new messages on a thread via Supabase Realtime.
   * Returns an unsubscribe function. The listener is called with the
   * new ChatMessageRecord whenever a row is added to chat_messages for
   * this thread. RLS ensures only thread participants can subscribe.
   */
  subscribeMessages(
    threadId: string,
    listener: (message: ChatMessageRecord) => void,
  ): () => void;
}

export interface SellerReviewRecord {
  id: string;
  sellerId: string;
  buyerId: string;
  orderId: string | null;
  rating: number;
  bodyEn: string;
  bodyAr: string;
  /** Quick-tag keys: "as_described" | "fast_shipping" | "great_comms" | "loved_it". */
  tags: string[];
  imageUrl: string | null;
  /** Reviewer display-name snapshot. */
  reviewerNameEn: string;
  reviewerNameAr: string;
  reviewerAvatar: string;
  createdAt: string;
}

export interface SellerReviewService {
  listForSeller(sellerId: string): Promise<SellerReviewRecord[]>;
  listMine(): Promise<SellerReviewRecord[]>;
  create(
    input: Omit<SellerReviewRecord, "id" | "buyerId" | "createdAt">,
  ): Promise<SellerReviewRecord>;
}

export type ReportTarget = "listing" | "user";
export type ReportReason =
  "counterfeit" | "offensive" | "spam" | "mismatch" | "other";
export type ReportStatus = "open" | "investigating" | "resolved" | "dismissed";

export interface ReportRecord {
  id: string;
  caseNumber: string;
  reporterId: string;
  target: ReportTarget;
  targetId: string;
  reason: ReportReason;
  body: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReportService {
  listMine(): Promise<ReportRecord[]>;
  create(input: {
    target: ReportTarget;
    targetId: string;
    reason: ReportReason;
    body: string;
  }): Promise<ReportRecord>;
}

export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";

export interface DisputeTimelineEvent {
  status: DisputeStatus;
  noteEn: string;
  noteAr: string;
  at: string;
}

export interface DisputeRecord {
  id: string;
  orderId: string;
  buyerId: string;
  reason: string;
  body: string;
  status: DisputeStatus;
  timeline: DisputeTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface DisputeService {
  listMine(): Promise<DisputeRecord[]>;
  create(input: {
    orderId: string;
    reason: string;
    body: string;
  }): Promise<DisputeRecord>;
}

export type NotificationKind =
  | "chat"
  | "offer"
  | "follow"
  | "price_drop"
  | "like"
  | "sold"
  | "order"
  | "system";

export interface NotificationRecord {
  id: string;
  recipientId: string;
  kind: NotificationKind;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  /** Deep-link target the UI jumps to (`{ kind, id }`). */
  targetKind: "chat" | "product" | "seller" | "order" | "none";
  targetId: string | null;
  isUnread: boolean;
  createdAt: string;
}

export interface NotificationService {
  listMine(): Promise<NotificationRecord[]>;
  markRead(id: string): Promise<void>;

  markAllRead(): Promise<void>;
}

// ---------- M4: payment methods ----------

export interface PaymentMethodRecord {
  id: string;
  ownerId: string;
  labelEn: string;
  labelAr: string;
  brandEn: "Visa" | "Mastercard" | "Amex" | "Apple Pay";
  brandAr: "فيزا" | "ماستركارد" | "أمريكان إكسبريس" | "آبل باي";
  last4: string;
  holderEn: string;
  holderAr: string;
  /** "MM/YY" */
  expiry: string;
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentMethodService {
  listMine(): Promise<PaymentMethodRecord[]>;
  create(
    input: Omit<PaymentMethodRecord, "id" | "ownerId" | "createdAt">,
  ): Promise<PaymentMethodRecord>;
  update(
    id: string,
    patch: Partial<Omit<PaymentMethodRecord, "id" | "ownerId" | "createdAt">>,
  ): Promise<void>;
  remove(id: string): Promise<void>;
  setDefault(id: string): Promise<void>;
}

// ---------- M4: blocked users ----------

export interface BlockedUserRecord {
  id: string;
  blockerId: string;
  blockedId: string;
  blockedNameEn: string;
  blockedNameAr: string;
  blockedAvatar: string;
  reasonEn: string | null;
  reasonAr: string | null;
  createdAt: string;
}

export interface BlockService {
  listMine(): Promise<BlockedUserRecord[]>;
  block(input: {
    blockedId: string;
    blockedNameEn: string;
    blockedNameAr: string;
    blockedAvatar: string;
    reasonEn?: string;
    reasonAr?: string;
  }): Promise<BlockedUserRecord>;
  unblock(id: string): Promise<void>;
}

export interface Phase2Backend {
  auth: AuthService;
  profiles: ProfileService;
  addresses: AddressService;
  listings: ListingService;
  media: ListingMediaService;
  sellerCards: SellerCardService;
  likes: LikeService;
  cart: CartService;
  orders: OrderService;
  chats: ChatService;
  reviews: SellerReviewService;
  reports: ReportService;
  disputes: DisputeService;
  notifications: NotificationService;
  paymentMethods: PaymentMethodService;
  blocks: BlockService;
}
