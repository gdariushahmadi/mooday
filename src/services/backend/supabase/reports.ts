import { type SupabaseClient } from "@supabase/supabase-js";
import type { ReportReason, ReportRecord, ReportService, ReportStatus, ReportTarget } from "../contracts";

export class SupabaseReportService implements ReportService {
    constructor(private readonly client: SupabaseClient) {
    }

    async listMine(): Promise<ReportRecord[]> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

        const { data, error } = await this.client
                  .from("reports")
                  .select("*")
                  .eq("reporter_id", authData.user.id)
                  .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []).map(reportFromRow);
    }

    async create(input: {
        target: ReportTarget;
        targetId: string;
        reason: ReportReason;
        body: string;
        }): Promise<ReportRecord> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

        const caseNumber = `CASE-${Date.now().toString(36).toUpperCase()}`;
        const { data, error } = await this.client
                  .from("reports")
                  .insert({
                    case_number: caseNumber,
                    reporter_id: authData.user.id,
                    target: input.target,
                    target_id: input.targetId,
                    reason: input.reason,
                    body: input.body,
                  })
                  .select("*")
                  .single();
        if (error) throw error;
        return reportFromRow(data);
    }
}

export function reportFromRow(row: Record<string, unknown>): ReportRecord {
    return {
    id: String(row.id),
    caseNumber: String(row.case_number),
    reporterId: String(row.reporter_id),
    target: row.target as ReportTarget,
    targetId: String(row.target_id),
    reason: row.reason as ReportReason,
    body: String(row.body ?? ""),
    status: row.status as ReportStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    };
}
