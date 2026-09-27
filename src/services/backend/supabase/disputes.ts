import { type SupabaseClient } from "@supabase/supabase-js";
import type { DisputeRecord, DisputeService, DisputeStatus, DisputeTimelineEvent } from "../contracts";

export class SupabaseDisputeService implements DisputeService {
    constructor(private readonly client: SupabaseClient) {
    }

    async listMine(): Promise<DisputeRecord[]> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
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
        const { data: authData, error: authError } = await this.client.auth.getUser();
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

export function disputeFromRow(row: Record<string, unknown>): DisputeRecord {
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
