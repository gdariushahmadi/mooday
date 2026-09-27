import { type SupabaseClient } from "@supabase/supabase-js";
import type { LikeService } from "../contracts";

export class SupabaseLikeService implements LikeService {
    constructor(private readonly client: SupabaseClient) {
    }

    async listMine(): Promise<string[]> {
        const { data, error } = await this.client
                  .from("user_listing_likes")
                  .select("listing_id")
                  .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []).map((row) => String(row.listing_id));
    }

    async like(listingId: string): Promise<void> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

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
        const { data: authData, error: authError } = await this.client.auth.getUser();
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
        const { data: authData, error: authError } = await this.client.auth.getUser();
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
