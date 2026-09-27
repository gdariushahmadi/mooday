import { type SupabaseClient } from "@supabase/supabase-js";
import type { SellerReviewRecord, SellerReviewService } from "../contracts";

export class SupabaseSellerReviewService implements SellerReviewService {
    constructor(private readonly client: SupabaseClient) {
    }

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
        const { data: authData, error: authError } = await this.client.auth.getUser();
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

    async create(input: Omit<SellerReviewRecord, "id" | "buyerId" | "createdAt">): Promise<SellerReviewRecord> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
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

export function reviewFromRow(row: Record<string, unknown>): SellerReviewRecord {
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
