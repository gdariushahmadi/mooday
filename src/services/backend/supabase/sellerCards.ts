import { type SupabaseClient } from "@supabase/supabase-js";
import type { SellerCardRecord, SellerCardService, SellerCardUpsertInput } from "../contracts";

export class SupabaseSellerCardService implements SellerCardService {
    constructor(private readonly client: SupabaseClient) {
    }

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
        const { data: authData, error: authError } = await this.client.auth.getUser();
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

export function sellerCardFromRow(row: Record<string, unknown>): SellerCardRecord {
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

export function sellerCardToRow(patch: SellerCardUpsertInput) {
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
