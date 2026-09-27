import { type SupabaseClient } from "@supabase/supabase-js";
import type { CartItemRecord, CartService } from "../contracts";

export class SupabaseCartService implements CartService {
    constructor(private readonly client: SupabaseClient) {
    }

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
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

        const { error } = await this.client.rpc("cart_items_increment", {
                  target_listing_id: listingId,
                  delta: quantity,
                });
        if (error) throw error;
        void authData;
    }

    async setQuantity(listingId: string, quantity: number): Promise<void> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
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
        const { data: authData, error: authError } = await this.client.auth.getUser();
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
        const { data: authData, error: authError } = await this.client.auth.getUser();
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

export function cartItemFromRow(row: Record<string, unknown>): CartItemRecord {
    return {
    listingId: String(row.listing_id),
    quantity: Number(row.quantity),
    addedAt: String(row.added_at),
    updatedAt: String(row.updated_at),
    };
}
