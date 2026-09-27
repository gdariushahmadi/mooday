import { type SupabaseClient } from "@supabase/supabase-js";
import type { CreateListingInput, ListingRecord, ListingService } from "../contracts";

export class SupabaseListingService implements ListingService {
    constructor(private readonly client: SupabaseClient) {
    }

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

    async search(query: string, filters?: {
          category?: string;
          priceMin?: number;
          priceMax?: number;
          status?: string;
          limit?: number;
          offset?: number;
        }): Promise<ListingRecord[]> {
        const rpcArgs = {
                  category: filters?.category ?? null,
                  price_min: filters?.priceMin ?? null,
                  price_max: filters?.priceMax ?? null,
                  status: filters?.status ?? null,
                  limit_count: filters?.limit ?? null,
                  offset_count: filters?.offset ?? null,
                };
        const { data, error } = await this.client.rpc("search_listings", {
                  query,
                  filters: rpcArgs,
                });
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
        const { data: authData, error: authError } = await this.client.auth.getUser();
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

export function listingFromRow(row: Record<string, unknown>): ListingRecord {
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
    ...(row.brand_en !== null && row.brand_en !== undefined && {
      brandEn: String(row.brand_en),
    }),
    ...(row.brand_ar !== null && row.brand_ar !== undefined && {
      brandAr: String(row.brand_ar),
    }),
    ...(row.purchase_date !== null && row.purchase_date !== undefined && {
      purchaseDate: String(row.purchase_date),
    }),
    ...(row.usage_count !== null && row.usage_count !== undefined && {
      usageCount: Number(row.usage_count),
    }),
    ...(row.authenticity_tier !== null && row.authenticity_tier !== undefined && {
      authenticityTier: row.authenticity_tier as ListingRecord["authenticityTier"],
    }),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    };
}

export function listingToRow(input: Partial<CreateListingInput>) {
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
    ...(input.brandEn !== undefined && { brand_en: input.brandEn }),
    ...(input.brandAr !== undefined && { brand_ar: input.brandAr }),
    ...(input.purchaseDate !== undefined && { purchase_date: input.purchaseDate }),
    ...(input.usageCount !== undefined && { usage_count: input.usageCount }),
    ...(input.authenticityTier !== undefined && {
      authenticity_tier: input.authenticityTier,
    }),
    };
}
