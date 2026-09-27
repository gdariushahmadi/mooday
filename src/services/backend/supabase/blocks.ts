import { type SupabaseClient } from "@supabase/supabase-js";
import type { BlockedUserRecord, BlockService } from "../contracts";

export class SupabaseBlockService implements BlockService {
    constructor(private readonly client: SupabaseClient) {
    }

    async listMine(): Promise<BlockedUserRecord[]> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
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

    async block(input: {
          blockedId: string;
          blockedNameEn: string;
          blockedNameAr: string;
          blockedAvatar: string;
          reasonEn?: string;
          reasonAr?: string;
        }): Promise<BlockedUserRecord> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
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

export function blockedUserFromRow(row: Record<string, unknown>): BlockedUserRecord {
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
