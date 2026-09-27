import { type SupabaseClient } from "@supabase/supabase-js";
import type { NotificationKind, NotificationRecord, NotificationService } from "../contracts";

export class SupabaseNotificationService implements NotificationService {
    constructor(private readonly client: SupabaseClient) {
    }

    async listMine(): Promise<NotificationRecord[]> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
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
        const { data: authData, error: authError } = await this.client.auth.getUser();
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
        const { data: authData, error: authError } = await this.client.auth.getUser();
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

    subscribe(listener: (notification: NotificationRecord) => void): () => void {
        let userId: string | null = null;
        void this.client.auth.getUser().then(({ data }) => {
          userId = data.user?.id ?? null;
        });
        const channel = this.client
                  .channel("notifications:user")
                  .on(
                    "postgres_changes",
                    {
                      event: "INSERT",
                      schema: "public",
                      table: "notifications",
                    },
                    (payload) => {
                      const row = payload.new as Record<string, unknown>;
                      if (userId && String(row.recipient_id) !== userId) return;
                      listener(notificationFromRow(row));
                    },
                  )
                  .subscribe();
        return () => {
          void this.client.removeChannel(channel);
        };
    }
}

export function notificationFromRow(row: Record<string, unknown>): NotificationRecord {
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
