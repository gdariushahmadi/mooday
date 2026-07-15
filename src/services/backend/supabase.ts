import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Address } from "@/data/addresses";
import type { AuthErrorCode } from "@/data/users";
import type {
  AddressService,
  AuthResult,
  AuthenticatedUser,
  AuthService,
  OtpPurpose,
  Phase2Backend,
  CreateListingInput,
  ListingRecord,
  ListingService,
  ProfileRecord,
  ProfileService,
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
  if (value.includes("password") && (value.includes("short") || value.includes("weak"))) {
    return "weak_password";
  }
  if (value.includes("email") && value.includes("invalid")) {
    return "invalid_email";
  }
  if (value.includes("rate") || value.includes("too many")) {
    return "rate_limited";
  }
  if (value.includes("token") || value.includes("otp") || value.includes("expired")) {
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

  async sendOtp(
    email: string,
    purpose: OtpPurpose,
  ): Promise<AuthResult<null>> {
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
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    return error ? failure(error.message) : { ok: true, value: null };
  }

  async signInWithOAuth(
    provider: "google" | "apple",
  ): Promise<AuthResult<null>> {
    const { error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${this.siteUrl}/auth/callback?next=/`,
        queryParams: provider === "google" ? { access_type: "offline" } : undefined,
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
    const { data, error } = await this.client.from("profiles").select("*").single();
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
    const { error } = await this.client.from("profiles").update({
      ...(patch.fullNameEn !== undefined && { full_name_en: patch.fullNameEn }),
      ...(patch.fullNameAr !== undefined && { full_name_ar: patch.fullNameAr }),
      ...(patch.handle !== undefined && { handle: patch.handle || null }),
      ...(patch.avatar !== undefined && { avatar_url: patch.avatar || null }),
      ...(patch.bioEn !== undefined && { bio_en: patch.bioEn }),
      ...(patch.bioAr !== undefined && { bio_ar: patch.bioAr }),
      ...(patch.locationEn !== undefined && { location_en: patch.locationEn }),
      ...(patch.locationAr !== undefined && { location_ar: patch.locationAr }),
      ...(patch.styleTagsEn !== undefined && { style_tags_en: patch.styleTagsEn }),
      ...(patch.styleTagsAr !== undefined && { style_tags_ar: patch.styleTagsAr }),
    }).not("id", "is", null);
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
    const { data: authData, error: authError } = await this.client.auth.getUser();
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

  async update(
    id: string,
    patch: Partial<Omit<Address, "id">>,
  ): Promise<void> {
    const current = await this.client.from("addresses").select("*").eq("id", id).single();
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
      row.original_price_minor === null ? null : Number(row.original_price_minor),
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
    const { data: authData, error: authError } = await this.client.auth.getUser();
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

  async create(input: CreateListingInput): Promise<ListingRecord> {
    const { data: authData, error: authError } = await this.client.auth.getUser();
    if (authError || !authData.user) {
      throw authError ?? new Error("Authentication required");
    }
    const { data, error } = await this.client
      .from("listings")
      .insert({ ...listingToRow(input), seller_id: authData.user.id })
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

let backend: Phase2Backend | null = null;

export function createSupabaseBackend(config: BackendConfig): Phase2Backend {
  if (backend) return backend;
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw new Error("Supabase configuration is incomplete.");
  }
  const client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true },
  });
  backend = {
    auth: new SupabaseAuthService(client, config.siteUrl),
    profiles: new SupabaseProfileService(client),
    addresses: new SupabaseAddressService(client),
    listings: new SupabaseListingService(client),
  };
  return backend;
}
