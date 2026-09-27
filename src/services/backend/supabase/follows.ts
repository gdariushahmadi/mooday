import { type SupabaseClient } from "@supabase/supabase-js";
import type { FollowService } from "../contracts";

export class SupabaseFollowService implements FollowService {
    constructor(private readonly client: SupabaseClient) {
    }

    async listFollowingIds(): Promise<string[]> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

        const { data, error } = await this.client
                  .from("user_follows")
                  .select("followee_id")
                  .eq("follower_id", authData.user.id)
                  .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []).map((row) => String(row.followee_id));
    }

    async listFollowerIds(userId: string): Promise<string[]> {
        const { data, error } = await this.client
                  .from("user_follows")
                  .select("follower_id")
                  .eq("followee_id", userId)
                  .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []).map((row) => String(row.follower_id));
    }

    async follow(userId: string): Promise<void> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

        if (userId === authData.user.id) {
          throw new Error("You cannot follow yourself.");
        }

        const { error } = await this.client
                  .from("user_follows")
                  .upsert(
                    { follower_id: authData.user.id, followee_id: userId },
                    { onConflict: "follower_id,followee_id", ignoreDuplicates: true },
                  );
        if (error) throw error;
    }

    async unfollow(userId: string): Promise<void> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

        const { error } = await this.client
                  .from("user_follows")
                  .delete()
                  .eq("follower_id", authData.user.id)
                  .eq("followee_id", userId);
        if (error) throw error;
    }

    async isFollowing(userId: string): Promise<boolean> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) return false;
        const { count, error } = await this.client
                  .from("user_follows")
                  .select("follower_id", { count: "exact", head: true })
                  .eq("follower_id", authData.user.id)
                  .eq("followee_id", userId);
        if (error) throw error;
        return (count ?? 0) > 0;
    }

    async toggle(userId: string): Promise<{ following: boolean }> {
        const following = await this.isFollowing(userId);
        if (following) {
          await this.unfollow(userId);
          return { following: false };
        }

        await this.follow(userId);
        return { following: true };
    }
}
