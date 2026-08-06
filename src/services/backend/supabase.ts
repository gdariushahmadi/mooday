import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import type { Address } from "@/data/addresses";
import type { AuthErrorCode } from "@/data/users";
import {
  LISTING_MEDIA_ALLOWED_MIME,
  LISTING_MEDIA_MAX_BYTES,
} from "./contracts";
import type {
  AddressService,
  AuthResult,
  AuthenticatedUser,
  AuthService,
  CartItemRecord,
  CartService,
  ChatMessageRecord,
  ChatMessageType,
  ChatService,
  ChatThreadRecord,
  CreateOrderInput,
  DisputeRecord,
  DisputeService,
  DisputeStatus,
  DisputeTimelineEvent,
  LikeService,
  NotificationKind,
  NotificationRecord,
  NotificationService,
  OtpPurpose,
  OrderItemRecord,
  OrderItemSnapshot,
  OrderRecord,
  OrderService,
  OrderStatus,
  OrderWithItems,
  Phase2Backend,
  CreateListingInput,
  ListingRecord,
  ListingService,
  ProfileRecord,
  ProfileService,
  ReportReason,
  ReportRecord,
  ReportService,
  ReportStatus,
  ReportTarget,
  SellerCardRecord,
  SellerCardService,
  SellerCardUpsertInput,
  SellerReviewRecord,
  SellerReviewService,
  ListingImageRecord,
  ListingImageUpload,
  ListingMediaMime,
  ListingMediaService,
  PaymentMethodRecord,
  PaymentMethodService,
  BlockedUserRecord,
  BlockService,
} from "./contracts";
import type { BackendConfig } from "./config";

function toUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email ?? "",
    name:
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name) ||
      user.email?.split("@")[0] ||
      "Mooday user",
  };
}

export function mapSupabaseAuthError(message: string): AuthErrorCode {
  const value = message.toLowerCase();
  if (value.includes("already") || value.includes("registered")) {
    return "user_exists";
  }
  if (
    value.includes("password") &&
    (value.includes("short") || value.includes("weak"))
  ) {
    return "weak_password";
  }
  if (value.includes("email") && value.includes("invalid")) {
    return "invalid_email";
  }
  if (value.includes("rate") || value.includes("too many")) {
    return "rate_limited";
  }
  if (
    value.includes("token") ||
    value.includes("otp") ||
    value.includes("expired")
  ) {
    return "invalid_otp";
  }
  if (value.includes("network") || value.includes("fetch")) {
    return "network_error";
  }
  // Do not reveal whether the account exists.
  return "invalid_credentials";
}

function failure(message: string): AuthResult<never> {
  return { ok: false, error: mapSupabaseAuthError(message) };
}

class SupabaseAuthService implements AuthService {
  constructor(
    private readonly client: SupabaseClient,
    private readonly siteUrl: string,
  ) {}

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) return null;
    return toUser(data.user);
  }

  subscribe(listener: (user: AuthenticatedUser | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      listener(session?.user ? toUser(session.user) : null);
    });
    return () => data.subscription.unsubscribe();
  }

  async signUp(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthResult<AuthenticatedUser>> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.name, phone: input.phone } },
    });
    if (error) return failure(error.message);
    if (!data.user) return failure("Invalid credentials");
    return {
      ok: true,
      value: toUser(data.user),
      needsVerification: !data.session,
    };
  }

  async signIn(input: {
    email: string;
    password: string;
  }): Promise<AuthResult<AuthenticatedUser>> {
    const { data, error } = await this.client.auth.signInWithPassword(input);
    if (error) return failure(error.message);
    return { ok: true, value: toUser(data.user) };
  }

  async signOut(): Promise<AuthResult<null>> {
    const { error } = await this.client.auth.signOut({ scope: "local" });
    return error ? failure(error.message) : { ok: true, value: null };
  }

  async sendOtp(email: string, purpose: OtpPurpose): Promise<AuthResult<null>> {
    const result =
      purpose === "recovery"
        ? await this.client.auth.resetPasswordForEmail(email, {
            redirectTo: `${this.siteUrl}/auth/callback?next=/`,
          })
        : await this.client.auth.resend({ type: "signup", email });
    return result.error
      ? failure(result.error.message)
      : { ok: true, value: null };
  }

  async verifyOtp(
    email: string,
    token: string,
    purpose: OtpPurpose,
  ): Promise<AuthResult<AuthenticatedUser>> {
    const { data, error } = await this.client.auth.verifyOtp({
      email,
      token,
      type: purpose === "recovery" ? "recovery" : "signup",
    });
    if (error) return failure(error.message);
    if (!data.user) return failure("Invalid OTP");
    return { ok: true, value: toUser(data.user) };
  }

  async resetPassword(newPassword: string): Promise<AuthResult<null>> {
    const { error } = await this.client.auth.updateUser({
      password: newPassword,
    });
    return error ? failure(error.message) : { ok: true, value: null };
  }

  async signInWithOAuth(
    provider: "google" | "apple",
  ): Promise<AuthResult<null>> {
    const { error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${this.siteUrl}/auth/callback?next=/`,
        queryParams:
          provider === "google" ? { access_type: "offline" } : undefined,
      },
    });
    return error ? failure(error.message) : { ok: true, value: null };
  }

  async completeOAuth(code: string): Promise<AuthResult<AuthenticatedUser>> {
    const { data, error } = await this.client.auth.exchangeCodeForSession(code);
    if (error) return failure(error.message);
    return { ok: true, value: toUser(data.user) };
  }

  async updateName(name: string): Promise<AuthResult<null>> {
    const { error } = await this.client.auth.updateUser({
      data: { full_name: name },
    });
    return error ? failure(error.message) : { ok: true, value: null };
  }
}

class SupabaseProfileService implements ProfileService {
  constructor(private readonly client: SupabaseClient) {}

  async getMine(): Promise<ProfileRecord | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .single();
    if (error) return null;
    return {
      fullNameEn: data.full_name_en,
      fullNameAr: data.full_name_ar,
      handle: data.handle ?? "",
      avatar: data.avatar_url ?? "",
      bioEn: data.bio_en ?? "",
      bioAr: data.bio_ar ?? "",
      locationEn: data.location_en ?? "",
      locationAr: data.location_ar ?? "",
      styleTagsEn: data.style_tags_en ?? [],
      styleTagsAr: data.style_tags_ar ?? [],
    };
  }

  async updateMine(patch: Partial<ProfileRecord>): Promise<void> {
    const { error } = await this.client
      .from("profiles")
      .update({
        ...(patch.fullNameEn !== undefined && {
          full_name_en: patch.fullNameEn,
        }),
        ...(patch.fullNameAr !== undefined && {
          full_name_ar: patch.fullNameAr,
        }),
        ...(patch.handle !== undefined && { handle: patch.handle || null }),
        ...(patch.avatar !== undefined && { avatar_url: patch.avatar || null }),
        ...(patch.bioEn !== undefined && { bio_en: patch.bioEn }),
        ...(patch.bioAr !== undefined && { bio_ar: patch.bioAr }),
        ...(patch.locationEn !== undefined && {
          location_en: patch.locationEn,
        }),
        ...(patch.locationAr !== undefined && {
          location_ar: patch.locationAr,
        }),
        ...(patch.styleTagsEn !== undefined && {
          style_tags_en: patch.styleTagsEn,
        }),
        ...(patch.styleTagsAr !== undefined && {
          style_tags_ar: patch.styleTagsAr,
        }),
      })
      .not("id", "is", null);
    if (error) throw error;
  }
}

function addressFromRow(row: Record<string, unknown>): Address {
  return {
    id: String(row.id),
    labelEn: row.label_en as Address["labelEn"],
    labelAr: row.label_ar as Address["labelAr"],
    fullNameEn: String(row.full_name_en),
    fullNameAr: String(row.full_name_ar),
    phone: String(row.phone),
    cityEn: String(row.city_en),
    cityAr: String(row.city_ar),
    districtEn: row.district_en ? String(row.district_en) : undefined,
    districtAr: row.district_ar ? String(row.district_ar) : undefined,
    streetEn: String(row.street_en),
    streetAr: String(row.street_ar),
    notesEn: row.notes_en ? String(row.notes_en) : undefined,
    notesAr: row.notes_ar ? String(row.notes_ar) : undefined,
    isDefault: Boolean(row.is_default),
  };
}

function addressToRow(address: Omit<Address, "id">) {
  return {
    label_en: address.labelEn,
    label_ar: address.labelAr,
    full_name_en: address.fullNameEn,
    full_name_ar: address.fullNameAr,
    phone: address.phone,
    city_en: address.cityEn,
    city_ar: address.cityAr,
    district_en: address.districtEn ?? null,
    district_ar: address.districtAr ?? null,
    street_en: address.streetEn,
    street_ar: address.streetAr,
    notes_en: address.notesEn ?? null,
    notes_ar: address.notesAr ?? null,
    is_default: address.isDefault,
  };
}

class SupabaseAddressService implements AddressService {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<Address[]> {
    const { data, error } = await this.client
      .from("addresses")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(addressFromRow);
  }

  async create(address: Omit<Address, "id">): Promise<Address> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("addresses")
      .insert({
        ...addressToRow({ ...address, isDefault: false }),
        user_id: authData.user.id,
      })
      .select("*")
      .single();
    if (error) throw error;
    if (address.isDefault) await this.setDefault(String(data.id));
    const created = addressFromRow(data);
    return address.isDefault ? { ...created, isDefault: true } : created;
  }

  async update(id: string, patch: Partial<Omit<Address, "id">>): Promise<void> {
    const current = await this.client
      .from("addresses")
      .select("*")
      .eq("id", id)
      .single();
    if (current.error) throw current.error;
    const wantsDefault = patch.isDefault === true;
    const merged = {
      ...addressFromRow(current.data),
      ...patch,
      ...(wantsDefault && { isDefault: false }),
    };
    const { error } = await this.client
      .from("addresses")
      .update(addressToRow(merged))
      .eq("id", id);
    if (error) throw error;
    if (wantsDefault) await this.setDefault(id);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("addresses").delete().eq("id", id);
    if (error) throw error;
  }

  async setDefault(id: string): Promise<void> {
    const { error } = await this.client.rpc("set_default_address", {
      target_address_id: id,
    });
    if (error) throw error;
  }
}

function listingFromRow(row: Record<string, unknown>): ListingRecord {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    titleEn: String(row.title_en),
    titleAr: String(row.title_ar),
    descriptionEn: String(row.description_en),
    descriptionAr: String(row.description_ar),
    priceMinor: Number(row.price_minor),
    originalPriceMinor:
      row.original_price_minor === null
        ? null
        : Number(row.original_price_minor),
    currency: "AED",
    conditionEn: String(row.condition_en),
    conditionAr: String(row.condition_ar),
    category: String(row.category),
    size: row.size === null ? null : String(row.size),
    colorEn: row.color_en === null ? null : String(row.color_en),
    colorAr: row.color_ar === null ? null : String(row.color_ar),
    mode: row.mode as ListingRecord["mode"],
    status: row.status as ListingRecord["status"],
    isAuthentic: Boolean(row.is_authentic),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function listingToRow(input: Partial<CreateListingInput>) {
  return {
    ...(input.titleEn !== undefined && { title_en: input.titleEn }),
    ...(input.titleAr !== undefined && { title_ar: input.titleAr }),
    ...(input.descriptionEn !== undefined && {
      description_en: input.descriptionEn,
    }),
    ...(input.descriptionAr !== undefined && {
      description_ar: input.descriptionAr,
    }),
    ...(input.priceMinor !== undefined && { price_minor: input.priceMinor }),
    ...(input.originalPriceMinor !== undefined && {
      original_price_minor: input.originalPriceMinor,
    }),
    ...(input.currency !== undefined && { currency: input.currency }),
    ...(input.conditionEn !== undefined && { condition_en: input.conditionEn }),
    ...(input.conditionAr !== undefined && { condition_ar: input.conditionAr }),
    ...(input.category !== undefined && { category: input.category }),
    ...(input.size !== undefined && { size: input.size }),
    ...(input.colorEn !== undefined && { color_en: input.colorEn }),
    ...(input.colorAr !== undefined && { color_ar: input.colorAr }),
    ...(input.mode !== undefined && { mode: input.mode }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.isAuthentic !== undefined && { is_authentic: input.isAuthentic }),
  };
}

class SupabaseListingService implements ListingService {
  constructor(private readonly client: SupabaseClient) {}

  async listVisible(): Promise<ListingRecord[]> {
    const { data, error } = await this.client
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(listingFromRow);
  }

  async listMine(): Promise<ListingRecord[]> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("listings")
      .select("*")
      .eq("seller_id", authData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(listingFromRow);
  }

  async listByIds(ids: string[]): Promise<ListingRecord[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.client
      .from("listings")
      .select("*")
      .in("id", ids)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(listingFromRow);
  }

  async create(input: CreateListingInput): Promise<ListingRecord> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("listings")
      .insert({
        ...listingToRow(input),
        seller_id: authData.user.id,
        // Until an admin UI ships, auto-approve so new listings are
        // publicly visible. The moderation queue can still re-review later.
        approved_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw error;
    return listingFromRow(data);
  }

  async update(id: string, patch: Partial<CreateListingInput>): Promise<void> {
    const { error } = await this.client
      .from("listings")
      .update(listingToRow(patch))
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from("listings")
      .delete()
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw error;
  }
}

// ---------- listing media (Phase 3, slice 2b) ----------

/**
 * Heuristic: storage paths used by Phase 1 mock data are absolute URLs
 * (`/products/foo.jpg`) or `https://...`. Real uploads live in the private
 * `listing-media` bucket and use the `{userId}/{listingId}/{file}` shape.
 */
function isPublicImageUrl(storagePath: string): boolean {
  return storagePath.startsWith("/") || /^https?:\/\//i.test(storagePath);
}

const MIME_TO_EXTENSION: Record<ListingMediaMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Cryptographic random UUID. Uses Web Crypto when available (browser,
 * Node ≥ 19), falls back to a timestamp+random slug for older runtimes.
 * Used only for storage path uniqueness; uniqueness is also enforced by
 * the `storage_path` UNIQUE constraint on `listing_images`.
 */
function randomStorageId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function listingImageFromRow(
  row: Record<string, unknown>,
  url: string,
  signedUrlExpiresAt?: number,
): ListingImageRecord {
  return {
    id: String(row.id),
    listingId: String(row.listing_id),
    storagePath: String(row.storage_path),
    url,
    ...(signedUrlExpiresAt !== undefined && { signedUrlExpiresAt }),
    sortOrder: Number(row.sort_order ?? 0),
    altEn: String(row.alt_en ?? ""),
    altAr: String(row.alt_ar ?? ""),
    createdAt: String(row.created_at),
  };
}

class SupabaseListingMediaService implements ListingMediaService {
  constructor(private readonly client: SupabaseClient) {}

  private async requireAuthUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) {
      throw error ?? new Error("Authentication required");
    }
    return data.user.id;
  }

  /**
   * Resolve a `storage_path` into a usable browser URL. Public URLs (mock
   * seed data) pass through unchanged; bucket paths go through the signed
   * URL flow because the bucket is private.
   */
  private async resolveUrl(storagePath: string): Promise<{
    url: string;
    expiresAt?: number;
  }> {
    if (isPublicImageUrl(storagePath)) {
      return { url: storagePath };
    }
    const expiresIn = 60 * 60; // 1 hour
    const { data, error } = await this.client.storage
      .from("listing-media")
      .createSignedUrl(storagePath, expiresIn);
    if (error || !data?.signedUrl) {
      throw (
        error ?? new Error(`Unable to resolve signed URL for ${storagePath}`)
      );
    }
    return {
      url: data.signedUrl,
      expiresAt: Date.now() + expiresIn * 1000,
    };
  }

  async upload(
    listingId: string,
    file: ListingImageUpload,
    sortOrder: number,
  ): Promise<ListingImageRecord> {
    if (!LISTING_MEDIA_ALLOWED_MIME.includes(file.mimeType)) {
      throw new Error(
        `Unsupported image type ${file.mimeType}. Allowed: ${LISTING_MEDIA_ALLOWED_MIME.join(", ")}`,
      );
    }
    if (file.sizeBytes <= 0) {
      throw new Error("Image is empty.");
    }
    if (file.sizeBytes > LISTING_MEDIA_MAX_BYTES) {
      throw new Error(
        `Image exceeds the ${LISTING_MEDIA_MAX_BYTES} byte limit.`,
      );
    }
    const userId = await this.requireAuthUserId();
    const extension = MIME_TO_EXTENSION[file.mimeType];
    const storagePath = `${userId}/${listingId}/${randomStorageId()}.${extension}`;

    const { error: uploadError } = await this.client.storage
      .from("listing-media")
      .upload(storagePath, file.body, {
        contentType: file.mimeType,
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data, error } = await this.client
      .from("listing_images")
      .insert({
        listing_id: listingId,
        storage_path: storagePath,
        sort_order: sortOrder,
        alt_en: file.altEn ?? "",
        alt_ar: file.altAr ?? "",
      })
      .select("*")
      .single();
    if (error) {
      // Best-effort rollback: drop the orphaned storage object so the
      // user doesn't pay for a file with no metadata row.
      await this.client.storage.from("listing-media").remove([storagePath]);
      throw error;
    }

    const resolved = await this.resolveUrl(storagePath);
    return listingImageFromRow(data, resolved.url, resolved.expiresAt);
  }

  async listForListing(listingId: string): Promise<ListingImageRecord[]> {
    const { data, error } = await this.client
      .from("listing_images")
      .select("*")
      .eq("listing_id", listingId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return Promise.all(
      (data ?? []).map(async (row) => {
        const resolved = await this.resolveUrl(String(row.storage_path));
        return listingImageFromRow(row, resolved.url, resolved.expiresAt);
      }),
    );
  }

  async listForListings(
    listingIds: string[],
  ): Promise<Record<string, ListingImageRecord[]>> {
    if (listingIds.length === 0) return {};
    const { data, error } = await this.client
      .from("listing_images")
      .select("*")
      .in("listing_id", listingIds)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const grouped: Record<string, ListingImageRecord[]> = {};
    for (const id of listingIds) grouped[id] = [];
    // Resolve URLs in parallel; the bucket lives behind Supabase so the
    // round-trip cost is the dominant factor at scale.
    const resolved = await Promise.all(
      (data ?? []).map(async (row) => {
        const r = await this.resolveUrl(String(row.storage_path));
        return listingImageFromRow(row, r.url, r.expiresAt);
      }),
    );
    for (const record of resolved) {
      const bucket = grouped[record.listingId];
      if (bucket) bucket.push(record);
    }
    return grouped;
  }

  async remove(imageId: string): Promise<void> {
    const { data: row, error: loadError } = await this.client
      .from("listing_images")
      .select("storage_path")
      .eq("id", imageId)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!row) return;
    const { error: deleteError } = await this.client
      .from("listing_images")
      .delete()
      .eq("id", imageId);
    if (deleteError) throw deleteError;
    if (!isPublicImageUrl(String(row.storage_path))) {
      const { error: storageError } = await this.client.storage
        .from("listing-media")
        .remove([String(row.storage_path)]);
      if (storageError) throw storageError;
    }
  }

  async removeAllForListing(listingId: string): Promise<void> {
    const { data, error } = await this.client
      .from("listing_images")
      .select("id, storage_path")
      .eq("listing_id", listingId);
    if (error) throw error;
    const rows = (data ?? []) as Array<{
      id: string;
      storage_path: string;
    }>;
    if (rows.length === 0) return;

    const { error: deleteError } = await this.client
      .from("listing_images")
      .delete()
      .eq("listing_id", listingId);
    if (deleteError) throw deleteError;

    const storagePaths = rows
      .map((r) => r.storage_path)
      .filter((p) => !isPublicImageUrl(p));
    if (storagePaths.length > 0) {
      const { error: storageError } = await this.client.storage
        .from("listing-media")
        .remove(storagePaths);
      if (storageError) throw storageError;
    }
  }
}

function sellerCardFromRow(row: Record<string, unknown>): SellerCardRecord {
  return {
    sellerId: String(row.seller_id),
    displayNameEn: String(row.display_name_en ?? ""),
    displayNameAr: String(row.display_name_ar ?? ""),
    handle: row.handle == null ? null : String(row.handle),
    avatarUrl: row.avatar_url == null ? null : String(row.avatar_url),
    typeEn: String(row.type_en ?? ""),
    typeAr: String(row.type_ar ?? ""),
    bioEn: String(row.bio_en ?? ""),
    bioAr: String(row.bio_ar ?? ""),
    cityEn: String(row.city_en ?? ""),
    cityAr: String(row.city_ar ?? ""),
    styleTagsEn: Array.isArray(row.style_tags_en)
      ? row.style_tags_en.map(String)
      : [],
    styleTagsAr: Array.isArray(row.style_tags_ar)
      ? row.style_tags_ar.map(String)
      : [],
    isVerified: Boolean(row.is_verified),
    responseRate: row.response_rate == null ? null : Number(row.response_rate),
    responseTimeHours:
      row.response_time_hours == null ? null : Number(row.response_time_hours),
    joinedAt: String(row.joined_at),
    updatedAt: String(row.updated_at),
    listingsCount: Number(row.listings_count ?? 0),
  };
}

function sellerCardToRow(patch: SellerCardUpsertInput) {
  return {
    ...(patch.displayNameEn !== undefined && {
      display_name_en: patch.displayNameEn,
    }),
    ...(patch.displayNameAr !== undefined && {
      display_name_ar: patch.displayNameAr,
    }),
    ...(patch.handle !== undefined && { handle: patch.handle || null }),
    ...(patch.avatarUrl !== undefined && {
      avatar_url: patch.avatarUrl || null,
    }),
    ...(patch.typeEn !== undefined && { type_en: patch.typeEn }),
    ...(patch.typeAr !== undefined && { type_ar: patch.typeAr }),
    ...(patch.bioEn !== undefined && { bio_en: patch.bioEn }),
    ...(patch.bioAr !== undefined && { bio_ar: patch.bioAr }),
    ...(patch.cityEn !== undefined && { city_en: patch.cityEn }),
    ...(patch.cityAr !== undefined && { city_ar: patch.cityAr }),
    ...(patch.styleTagsEn !== undefined && {
      style_tags_en: patch.styleTagsEn,
    }),
    ...(patch.styleTagsAr !== undefined && {
      style_tags_ar: patch.styleTagsAr,
    }),
    ...(patch.isVerified !== undefined && { is_verified: patch.isVerified }),
    ...(patch.responseRate !== undefined && {
      response_rate: patch.responseRate,
    }),
    ...(patch.responseTimeHours !== undefined && {
      response_time_hours: patch.responseTimeHours,
    }),
  };
}

class SupabaseSellerCardService implements SellerCardService {
  constructor(private readonly client: SupabaseClient) {}

  async listVisible(): Promise<SellerCardRecord[]> {
    const { data, error } = await this.client
      .from("seller_card_view")
      .select("*")
      .order("listings_count", { ascending: false })
      .order("joined_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(sellerCardFromRow);
  }

  async getById(sellerId: string): Promise<SellerCardRecord | null> {
    const { data, error } = await this.client
      .from("seller_card_view")
      .select("*")
      .eq("seller_id", sellerId)
      .maybeSingle();
    if (error) throw error;
    return data ? sellerCardFromRow(data) : null;
  }

  async getByHandle(handle: string): Promise<SellerCardRecord | null> {
    const { data, error } = await this.client
      .from("seller_card_view")
      .select("*")
      .eq("handle", handle)
      .maybeSingle();
    if (error) throw error;
    return data ? sellerCardFromRow(data) : null;
  }

  async upsertMine(patch: SellerCardUpsertInput): Promise<void> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { error } = await this.client
      .from("public_seller_profiles")
      .upsert({
        ...sellerCardToRow(patch),
        seller_id: authData.user.id,
      })
      .eq("seller_id", authData.user.id)
      .select("seller_id")
      .single();
    if (error) throw error;
  }
}

// ---------- user likes + cart (Phase 3, slice 4) ----------

class SupabaseLikeService implements LikeService {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<string[]> {
    const { data, error } = await this.client
      .from("user_listing_likes")
      .select("listing_id")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => String(row.listing_id));
  }

  async like(listingId: string): Promise<void> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    // INSERT … ON CONFLICT DO NOTHING is the canonical idempotent "like".
    const { error } = await this.client
      .from("user_listing_likes")
      .upsert(
        { user_id: authData.user.id, listing_id: listingId },
        { onConflict: "user_id,listing_id", ignoreDuplicates: true },
      )
      .select("listing_id")
      .maybeSingle();
    if (error) throw error;
  }

  async unlike(listingId: string): Promise<void> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { error } = await this.client
      .from("user_listing_likes")
      .delete()
      .eq("user_id", authData.user.id)
      .eq("listing_id", listingId);
    if (error) throw error;
  }

  async toggle(listingId: string): Promise<{ liked: boolean }> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { count: existingCount, error: lookupError } = await this.client
      .from("user_listing_likes")
      .select("listing_id", { count: "exact", head: true })
      .eq("user_id", authData.user.id)
      .eq("listing_id", listingId);
    if (lookupError) throw lookupError;
    if ((existingCount ?? 0) > 0) {
      const { error } = await this.client
        .from("user_listing_likes")
        .delete()
        .eq("user_id", authData.user.id)
        .eq("listing_id", listingId);
      if (error) throw error;
      return { liked: false };
    }
    const { error } = await this.client
      .from("user_listing_likes")
      .insert({ user_id: authData.user.id, listing_id: listingId });
    if (error) throw error;
    return { liked: true };
  }
}

function cartItemFromRow(row: Record<string, unknown>): CartItemRecord {
  return {
    listingId: String(row.listing_id),
    quantity: Number(row.quantity),
    addedAt: String(row.added_at),
    updatedAt: String(row.updated_at),
  };
}

class SupabaseCartService implements CartService {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<CartItemRecord[]> {
    const { data, error } = await this.client
      .from("cart_items")
      .select("listing_id, quantity, added_at, updated_at")
      .order("added_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(cartItemFromRow);
  }

  async add(listingId: string, quantity = 1): Promise<void> {
    if (quantity <= 0) return;
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    // Atomic increment via the SECURITY INVOKER RPC. SECURITY INVOKER means
    // RLS still enforces owner-scoped rows — the function can only ever
    // touch the current user's cart.
    const { error } = await this.client.rpc("cart_items_increment", {
      target_listing_id: listingId,
      delta: quantity,
    });
    if (error) throw error;
    void authData;
  }

  async setQuantity(listingId: string, quantity: number): Promise<void> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    if (quantity <= 0) {
      await this.remove(listingId);
      return;
    }
    const { error } = await this.client
      .from("cart_items")
      .upsert(
        {
          user_id: authData.user.id,
          listing_id: listingId,
          quantity,
        },
        { onConflict: "user_id,listing_id" },
      )
      .select("listing_id")
      .single();
    if (error) throw error;
  }

  async remove(listingId: string): Promise<void> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { error } = await this.client
      .from("cart_items")
      .delete()
      .eq("user_id", authData.user.id)
      .eq("listing_id", listingId);
    if (error) throw error;
  }

  async clear(): Promise<void> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { error } = await this.client
      .from("cart_items")
      .delete()
      .eq("user_id", authData.user.id);
    if (error) throw error;
  }
}

// ---------- orders (Phase 3, slice 5) ----------

function orderFromRow(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    sellerId: String(row.seller_id),
    status: row.status as OrderStatus,
    shippingAddress: (row.shipping_address ??
      {}) as OrderRecord["shippingAddress"],
    currency: "AED",
    itemsSubtotalMinor: Number(row.items_subtotal_minor),
    shippingFeeMinor: Number(row.shipping_fee_minor),
    totalMinor: Number(row.total_minor),
    paymentMethod:
      row.payment_method == null ? null : String(row.payment_method),
    paymentBrandEn:
      row.payment_brand_en == null ? null : String(row.payment_brand_en),
    paymentBrandAr:
      row.payment_brand_ar == null ? null : String(row.payment_brand_ar),
    paymentLast4: row.payment_last4 == null ? null : String(row.payment_last4),
    courierNameEn:
      row.courier_name_en == null ? null : String(row.courier_name_en),
    courierNameAr:
      row.courier_name_ar == null ? null : String(row.courier_name_ar),
    courierTracking:
      row.courier_tracking == null ? null : String(row.courier_tracking),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function orderItemFromRow(row: Record<string, unknown>): OrderItemRecord {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    listingId: row.listing_id == null ? null : String(row.listing_id),
    titleEnAtPurchase: String(row.title_en_at_purchase ?? ""),
    titleArAtPurchase: String(row.title_ar_at_purchase ?? ""),
    imageUrlAtPurchase: String(row.image_url_at_purchase ?? ""),
    priceMinorAtPurchase: Number(row.price_minor_at_purchase),
    quantity: Number(row.quantity),
    createdAt: String(row.created_at),
  };
}

class SupabaseOrderService implements OrderService {
  constructor(private readonly client: SupabaseClient) {}

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) {
      throw error ?? new Error("Authentication required");
    }
    return data.user.id;
  }

  private async withItems(
    rows: Record<string, unknown>[],
  ): Promise<OrderWithItems[]> {
    if (rows.length === 0) return [];
    const orderIds = rows.map((r) => String(r.id));
    const { data: itemRows, error } = await this.client
      .from("order_items")
      .select("*")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const itemsByOrder = new Map<string, OrderItemRecord[]>();
    for (const row of itemRows ?? []) {
      const item = orderItemFromRow(row);
      const bucket = itemsByOrder.get(item.orderId) ?? [];
      bucket.push(item);
      itemsByOrder.set(item.orderId, bucket);
    }
    return rows.map((row) => {
      const record = orderFromRow(row);
      return { ...record, items: itemsByOrder.get(record.id) ?? [] };
    });
  }

  async listMineAsBuyer(): Promise<OrderWithItems[]> {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return this.withItems((data ?? []) as Record<string, unknown>[]);
  }

  async listMineAsSeller(): Promise<OrderWithItems[]> {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return this.withItems((data ?? []) as Record<string, unknown>[]);
  }

  async getById(orderId: string): Promise<OrderWithItems | null> {
    await this.requireUserId();
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const [withItems] = await this.withItems([data as Record<string, unknown>]);
    return withItems;
  }

  async create(input: CreateOrderInput): Promise<OrderRecord> {
    const userId = await this.requireUserId();
    const { data: orderRow, error: orderError } = await this.client
      .from("orders")
      .insert({
        buyer_id: userId,
        seller_id: input.sellerId,
        shipping_address: input.shippingAddress,
        items_subtotal_minor: input.itemsSubtotalMinor,
        shipping_fee_minor: input.shippingFeeMinor,
        total_minor: input.totalMinor,
        payment_method: input.paymentMethod,
        payment_brand_en: input.paymentBrandEn,
        payment_brand_ar: input.paymentBrandAr,
        payment_last4: input.paymentLast4,
      })
      .select("*")
      .single();
    if (orderError) throw orderError;
    const order = orderFromRow(orderRow as Record<string, unknown>);

    const itemRows = input.items.map((item: OrderItemSnapshot) => ({
      order_id: order.id,
      listing_id: item.listingId,
      title_en_at_purchase: item.titleEnAtPurchase,
      title_ar_at_purchase: item.titleArAtPurchase,
      image_url_at_purchase: item.imageUrlAtPurchase,
      price_minor_at_purchase: item.priceMinorAtPurchase,
      quantity: item.quantity,
    }));
    if (itemRows.length > 0) {
      const { error: itemsError } = await this.client
        .from("order_items")
        .insert(itemRows);
      if (itemsError) {
        // Best-effort rollback of the order so a partial commit cannot
        // leave the buyer charged for items they did not order.
        await this.client.from("orders").delete().eq("id", order.id);
        throw itemsError;
      }
    }
    return order;
  }

  async markShipped(
    orderId: string,
    courier: { nameEn: string; nameAr: string; tracking: string },
  ): Promise<void> {
    const { error } = await this.client
      .from("orders")
      .update({
        status: "shipped",
        courier_name_en: courier.nameEn,
        courier_name_ar: courier.nameAr,
        courier_tracking: courier.tracking,
      })
      .eq("id", orderId);
    if (error) throw error;
  }

  async markDelivered(orderId: string): Promise<void> {
    const { error } = await this.client
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId);
    if (error) throw error;
  }

  async cancel(orderId: string): Promise<void> {
    const { error } = await this.client
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);
    if (error) throw error;
  }

  async requestReturn(orderId: string): Promise<void> {
    const { error } = await this.client
      .from("orders")
      .update({ status: "returned" })
      .eq("id", orderId);
    if (error) throw error;
  }
}

// ---------- chat (Phase 3, slice 6) ----------

function chatThreadFromRow(row: Record<string, unknown>): ChatThreadRecord {
  return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    sellerId: String(row.seller_id),
    listingId: row.listing_id == null ? null : String(row.listing_id),
    listingTitleEn: String(row.listing_title_en ?? ""),
    listingTitleAr: String(row.listing_title_ar ?? ""),
    listingImageUrl: String(row.listing_image_url ?? ""),
    priceMinorAtCreation: Number(row.price_minor_at_creation ?? 0),
    lastMessageBody:
      row.last_message_body == null ? null : String(row.last_message_body),
    lastMessageAt:
      row.last_message_at == null ? null : String(row.last_message_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function chatMessageFromRow(row: Record<string, unknown>): ChatMessageRecord {
  return {
    id: String(row.id),
    threadId: String(row.thread_id),
    senderId: String(row.sender_id),
    type: row.type as ChatMessageType,
    body: String(row.body ?? ""),
    imageUrl: row.image_url == null ? null : String(row.image_url),
    offerMinor: row.offer_minor == null ? null : Number(row.offer_minor),
    offerStatus:
      row.offer_status == null
        ? null
        : (row.offer_status as ChatMessageRecord["offerStatus"]),
    createdAt: String(row.created_at),
  };
}

class SupabaseChatService implements ChatService {
  constructor(private readonly client: SupabaseClient) {}

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) {
      throw error ?? new Error("Authentication required");
    }
    return data.user.id;
  }

  async listMine(): Promise<ChatThreadRecord[]> {
    const userId = await this.requireUserId();
    const { data, error } = await this.client
      .from("chat_threads")
      .select("*")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data ?? []).map(chatThreadFromRow);
  }

  async getThread(threadId: string): Promise<ChatThreadRecord | null> {
    await this.requireUserId();
    const { data, error } = await this.client
      .from("chat_threads")
      .select("*")
      .eq("id", threadId)
      .maybeSingle();
    if (error) throw error;
    return data ? chatThreadFromRow(data) : null;
  }

  async upsertForListing(input: {
    sellerId: string;
    listingId: string;
    listingTitleEn: string;
    listingTitleAr: string;
    listingImageUrl: string;
    priceMinorAtCreation: number;
  }): Promise<ChatThreadRecord> {
    const userId = await this.requireUserId();
    const { data: existing } = await this.client
      .from("chat_threads")
      .select("*")
      .eq("buyer_id", userId)
      .eq("seller_id", input.sellerId)
      .eq("listing_id", input.listingId)
      .maybeSingle();
    if (existing) return chatThreadFromRow(existing);

    const { data, error } = await this.client
      .from("chat_threads")
      .insert({
        buyer_id: userId,
        seller_id: input.sellerId,
        listing_id: input.listingId,
        listing_title_en: input.listingTitleEn,
        listing_title_ar: input.listingTitleAr,
        listing_image_url: input.listingImageUrl,
        price_minor_at_creation: input.priceMinorAtCreation,
      })
      .select("*")
      .single();
    if (error) throw error;
    return chatThreadFromRow(data);
  }

  async listMessages(threadId: string): Promise<ChatMessageRecord[]> {
    await this.requireUserId();
    const { data, error } = await this.client
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(chatMessageFromRow);
  }

  async sendMessage(
    threadId: string,
    message: Pick<
      ChatMessageRecord,
      "type" | "body" | "imageUrl" | "offerMinor"
    >,
  ): Promise<ChatMessageRecord> {
    const userId = await this.requireUserId();
    const payload = {
      thread_id: threadId,
      sender_id: userId,
      type: message.type,
      body: message.body,
      image_url: message.imageUrl ?? null,
      offer_minor: message.offerMinor ?? null,
      offer_status: message.type === "offer" ? "pending" : null,
    };
    const { data, error } = await this.client
      .from("chat_messages")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;

    await this.client
      .from("chat_threads")
      .update({
        last_message_body: message.body,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", threadId);

    return chatMessageFromRow(data);
  }

  async setOfferStatus(
    messageId: string,
    status: "accepted" | "declined",
  ): Promise<void> {
    const { error } = await this.client
      .from("chat_messages")
      .update({ offer_status: status })
      .eq("id", messageId)
      .eq("type", "offer")
      .eq("offer_status", "pending");
    if (error) throw error;
  }
}

// ---------- reviews ----------

function reviewFromRow(row: Record<string, unknown>): SellerReviewRecord {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    buyerId: String(row.buyer_id),
    orderId: row.order_id == null ? null : String(row.order_id),
    rating: Number(row.rating),
    bodyEn: String(row.body_en ?? ""),
    bodyAr: String(row.body_ar ?? ""),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    imageUrl: row.image_url == null ? null : String(row.image_url),
    reviewerNameEn: String(row.reviewer_name_en ?? ""),
    reviewerNameAr: String(row.reviewer_name_ar ?? ""),
    reviewerAvatar: String(row.reviewer_avatar ?? ""),
    createdAt: String(row.created_at),
  };
}

class SupabaseSellerReviewService implements SellerReviewService {
  constructor(private readonly client: SupabaseClient) {}

  async listForSeller(sellerId: string): Promise<SellerReviewRecord[]> {
    const { data, error } = await this.client
      .from("seller_reviews")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(reviewFromRow);
  }

  async listMine(): Promise<SellerReviewRecord[]> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("seller_reviews")
      .select("*")
      .eq("buyer_id", authData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(reviewFromRow);
  }

  async create(
    input: Omit<SellerReviewRecord, "id" | "buyerId" | "createdAt">,
  ): Promise<SellerReviewRecord> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("seller_reviews")
      .insert({
        seller_id: input.sellerId,
        buyer_id: authData.user.id,
        order_id: input.orderId,
        rating: input.rating,
        body_en: input.bodyEn,
        body_ar: input.bodyAr,
        tags: input.tags,
        image_url: input.imageUrl,
        reviewer_name_en: input.reviewerNameEn,
        reviewer_name_ar: input.reviewerNameAr,
        reviewer_avatar: input.reviewerAvatar,
      })
      .select("*")
      .single();
    if (error) throw error;
    return reviewFromRow(data);
  }
}

// ---------- reports ----------

function reportFromRow(row: Record<string, unknown>): ReportRecord {
  return {
    id: String(row.id),
    caseNumber: String(row.case_number),
    reporterId: String(row.reporter_id),
    target: row.target as ReportTarget,
    targetId: String(row.target_id),
    reason: row.reason as ReportReason,
    body: String(row.body ?? ""),
    status: row.status as ReportStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

class SupabaseReportService implements ReportService {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<ReportRecord[]> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("reports")
      .select("*")
      .eq("reporter_id", authData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(reportFromRow);
  }

  async create(input: {
    target: ReportTarget;
    targetId: string;
    reason: ReportReason;
    body: string;
  }): Promise<ReportRecord> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const caseNumber = `CASE-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await this.client
      .from("reports")
      .insert({
        case_number: caseNumber,
        reporter_id: authData.user.id,
        target: input.target,
        target_id: input.targetId,
        reason: input.reason,
        body: input.body,
      })
      .select("*")
      .single();
    if (error) throw error;
    return reportFromRow(data);
  }
}

// ---------- disputes ----------

function disputeFromRow(row: Record<string, unknown>): DisputeRecord {
  const timelineRaw = Array.isArray(row.timeline) ? row.timeline : [];
  const timeline: DisputeTimelineEvent[] = timelineRaw.map(
    (entry: Record<string, unknown>) => ({
      status: entry.status as DisputeStatus,
      noteEn: String(entry.noteEn ?? entry.note_en ?? ""),
      noteAr: String(entry.noteAr ?? entry.note_ar ?? ""),
      at: String(entry.at ?? entry.created_at ?? ""),
    }),
  );
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    buyerId: String(row.buyer_id),
    reason: String(row.reason ?? ""),
    body: String(row.body ?? ""),
    status: row.status as DisputeStatus,
    timeline,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

class SupabaseDisputeService implements DisputeService {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<DisputeRecord[]> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("disputes")
      .select("*")
      .or(`buyer_id.eq.${authData.user.id}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(disputeFromRow);
  }

  async create(input: {
    orderId: string;
    reason: string;
    body: string;
  }): Promise<DisputeRecord> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const now = new Date().toISOString();
    const timeline: DisputeTimelineEvent[] = [
      {
        status: "open",
        noteEn: "Dispute opened by buyer.",
        noteAr: "تم فتح النزاع من قبل المشتري.",
        at: now,
      },
    ];
    const { data, error } = await this.client
      .from("disputes")
      .insert({
        order_id: input.orderId,
        buyer_id: authData.user.id,
        reason: input.reason,
        body: input.body,
        status: "open",
        timeline,
      })
      .select("*")
      .single();
    if (error) throw error;
    return disputeFromRow(data);
  }
}

// ---------- notifications ----------

function notificationFromRow(row: Record<string, unknown>): NotificationRecord {
  return {
    id: String(row.id),
    recipientId: String(row.recipient_id),
    kind: row.kind as NotificationKind,
    titleEn: String(row.title_en ?? ""),
    titleAr: String(row.title_ar ?? ""),
    bodyEn: String(row.body_en ?? ""),
    bodyAr: String(row.body_ar ?? ""),
    targetKind: (row.target_kind ?? "none") as NotificationRecord["targetKind"],
    targetId: row.target_id == null ? null : String(row.target_id),
    isUnread: Boolean(row.is_unread),
    createdAt: String(row.created_at),
  };
}

class SupabaseNotificationService implements NotificationService {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<NotificationRecord[]> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("notifications")
      .select("*")
      .eq("recipient_id", authData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(notificationFromRow);
  }

  async markRead(id: string): Promise<void> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { error } = await this.client
      .from("notifications")
      .update({ is_unread: false })
      .eq("id", id)
      .eq("recipient_id", authData.user.id);
    if (error) throw error;
  }

  async markAllRead(): Promise<void> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { error } = await this.client
      .from("notifications")
      .update({ is_unread: false })
      .eq("recipient_id", authData.user.id)
      .eq("is_unread", true);
    if (error) throw error;
  }
}

// ---------- payment methods (M4) ----------

function paymentMethodFromRow(
  row: Record<string, unknown>,
): PaymentMethodRecord {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    labelEn: String(row.label_en ?? ""),
    labelAr: String(row.label_ar ?? ""),
    brandEn: String(row.brand_en ?? "Visa") as PaymentMethodRecord["brandEn"],
    brandAr: String(row.brand_ar ?? "فيزا") as PaymentMethodRecord["brandAr"],
    last4: String(row.last4 ?? ""),
    holderEn: String(row.holder_en ?? ""),
    holderAr: String(row.holder_ar ?? ""),
    expiry: String(row.expiry ?? ""),
    isDefault: Boolean(row.is_default),
    createdAt: String(row.created_at),
  };
}

class SupabasePaymentMethodService implements PaymentMethodService {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<PaymentMethodRecord[]> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("payment_methods")
      .select("*")
      .eq("owner_id", authData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(paymentMethodFromRow);
  }

  async create(
    input: Omit<
      PaymentMethodRecord,
      "id" | "ownerId" | "createdAt"
    >,
  ): Promise<PaymentMethodRecord> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("payment_methods")
      .insert({
        owner_id: authData.user.id,
        label_en: input.labelEn,
        label_ar: input.labelAr,
        brand_en: input.brandEn,
        brand_ar: input.brandAr,
        last4: input.last4,
        holder_en: input.holderEn,
        holder_ar: input.holderAr,
        expiry: input.expiry,
        is_default: input.isDefault,
      })
      .select("*")
      .single();
    if (error) throw error;
    return paymentMethodFromRow(data);
  }

  async update(
    id: string,
    patch: Partial<
      Omit<
        PaymentMethodRecord,
        "id" | "ownerId" | "createdAt"
      >
    >,
  ): Promise<void> {
    const update: Record<string, unknown> = {};
    if (patch.labelEn !== undefined) update.label_en = patch.labelEn;
    if (patch.labelAr !== undefined) update.label_ar = patch.labelAr;
    if (patch.brandEn !== undefined) update.brand_en = patch.brandEn;
    if (patch.brandAr !== undefined) update.brand_ar = patch.brandAr;
    if (patch.last4 !== undefined) update.last4 = patch.last4;
    if (patch.holderEn !== undefined) update.holder_en = patch.holderEn;
    if (patch.holderAr !== undefined) update.holder_ar = patch.holderAr;
    if (patch.expiry !== undefined) update.expiry = patch.expiry;
    if (patch.isDefault !== undefined) update.is_default = patch.isDefault;
    const { error } = await this.client
      .from("payment_methods")
      .update(update)
      .eq("id", id);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from("payment_methods")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  async setDefault(id: string): Promise<void> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { error: clearError } = await this.client
      .from("payment_methods")
      .update({ is_default: false })
      .eq("owner_id", authData.user.id)
      .neq("id", id);
    if (clearError) throw clearError;
    const { error } = await this.client
      .from("payment_methods")
      .update({ is_default: true })
      .eq("id", id);
    if (error) throw error;
  }
}

// ---------- blocked users (M4) ----------

function blockedUserFromRow(
  row: Record<string, unknown>,
): BlockedUserRecord {
  return {
    id: String(row.id),
    blockerId: String(row.blocker_id),
    blockedId: String(row.blocked_id),
    blockedNameEn: String(row.blocked_name_en ?? ""),
    blockedNameAr: String(row.blocked_name_ar ?? ""),
    blockedAvatar: String(row.blocked_avatar ?? ""),
    reasonEn: row.reason_en == null ? null : String(row.reason_en),
    reasonAr: row.reason_ar == null ? null : String(row.reason_ar),
    createdAt: String(row.created_at),
  };
}

class SupabaseBlockService implements BlockService {
  constructor(private readonly client: SupabaseClient) {}

  async listMine(): Promise<BlockedUserRecord[]> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("blocked_users")
      .select("*")
      .eq("blocker_id", authData.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(blockedUserFromRow);
  }

  async block(
    input: {
      blockedId: string;
      blockedNameEn: string;
      blockedNameAr: string;
      blockedAvatar: string;
      reasonEn?: string;
      reasonAr?: string;
    },
  ): Promise<BlockedUserRecord> {
    const { data: authData, error: authError } =
      await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("blocked_users")
      .insert({
        blocker_id: authData.user.id,
        blocked_id: input.blockedId,
        blocked_name_en: input.blockedNameEn,
        blocked_name_ar: input.blockedNameAr,
        blocked_avatar: input.blockedAvatar,
        reason_en: input.reasonEn ?? null,
        reason_ar: input.reasonAr ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return blockedUserFromRow(data);
  }

  async unblock(id: string): Promise<void> {
    const { error } = await this.client
      .from("blocked_users")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

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
    orders: new SupabaseOrderService(client),
    chats: new SupabaseChatService(client),
    reviews: new SupabaseSellerReviewService(client),
    reports: new SupabaseReportService(client),
    disputes: new SupabaseDisputeService(client),
    notifications: new SupabaseNotificationService(client),
    paymentMethods: new SupabasePaymentMethodService(client),
    blocks: new SupabaseBlockService(client),
  };
  return backend;
}
