import { type SupabaseClient } from "@supabase/supabase-js";
import type { PaymentMethodRecord, PaymentMethodService } from "../contracts";

export class SupabasePaymentMethodService implements PaymentMethodService {
    constructor(private readonly client: SupabaseClient) {
    }

    async listMine(): Promise<PaymentMethodRecord[]> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

        const { data, error } = await this.client
                  .from("payment_methods")
                  .select("*")
                  .eq("owner_id", authData.user.id)
                  .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []).map(paymentMethodFromRow);
    }

    async create(input: Omit<
          PaymentMethodRecord,
          "id" | "ownerId" | "createdAt"
        >): Promise<PaymentMethodRecord> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

        const { data, error } = await this.client
                  .from("payment_methods")
                  .insert({
                    owner_id: authData.user.id,
                    label_en: input.labelEn,
                    label_ar: input.labelAr,
                    brand_en: input.brandEn,
                    brand_ar: input.brandAr,
                    last4: input.last4,
                    holder_en: input.holderEn,
                    holder_ar: input.holderAr,
                    expiry: input.expiry,
                    is_default: input.isDefault,
                  })
                  .select("*")
                  .single();
        if (error) throw error;
        return paymentMethodFromRow(data);
    }

    async update(id: string, patch: Partial<
          Omit<
            PaymentMethodRecord,
            "id" | "ownerId" | "createdAt"
          >
        >): Promise<void> {
        const update: Record<string, unknown> = {};
        if (patch.labelEn !== undefined) update.label_en = patch.labelEn;
        if (patch.labelAr !== undefined) update.label_ar = patch.labelAr;
        if (patch.brandEn !== undefined) update.brand_en = patch.brandEn;
        if (patch.brandAr !== undefined) update.brand_ar = patch.brandAr;
        if (patch.last4 !== undefined) update.last4 = patch.last4;
        if (patch.holderEn !== undefined) update.holder_en = patch.holderEn;
        if (patch.holderAr !== undefined) update.holder_ar = patch.holderAr;
        if (patch.expiry !== undefined) update.expiry = patch.expiry;
        if (patch.isDefault !== undefined) update.is_default = patch.isDefault;
        const { error } = await this.client
                  .from("payment_methods")
                  .update(update)
                  .eq("id", id);
        if (error) throw error;
    }

    async remove(id: string): Promise<void> {
        const { error } = await this.client
                  .from("payment_methods")
                  .delete()
                  .eq("id", id);
        if (error) throw error;
    }

    async setDefault(id: string): Promise<void> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

        const { error: clearError } = await this.client
                  .from("payment_methods")
                  .update({ is_default: false })
                  .eq("owner_id", authData.user.id)
                  .neq("id", id);
        if (clearError) throw clearError;
        const { error } = await this.client
                  .from("payment_methods")
                  .update({ is_default: true })
                  .eq("id", id);
        if (error) throw error;
    }
}

export function paymentMethodFromRow(row: Record<string, unknown>): PaymentMethodRecord {
    return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    labelEn: String(row.label_en ?? ""),
    labelAr: String(row.label_ar ?? ""),
    brandEn: String(row.brand_en ?? "Visa") as PaymentMethodRecord["brandEn"],
    brandAr: String(row.brand_ar ?? "فيزا") as PaymentMethodRecord["brandAr"],
    last4: String(row.last4 ?? ""),
    holderEn: String(row.holder_en ?? ""),
    holderAr: String(row.holder_ar ?? ""),
    expiry: String(row.expiry ?? ""),
    isDefault: Boolean(row.is_default),
    createdAt: String(row.created_at),
    };
}
