import type { Address } from "@/data/addresses";
import { type SupabaseClient } from "@supabase/supabase-js";
import type { AddressService } from "../contracts";

export class SupabaseAddressService implements AddressService {
    constructor(private readonly client: SupabaseClient) {
    }

    async listMine(): Promise<Address[]> {
        const { data, error } = await this.client
                  .from("addresses")
                  .select("*")
                  .order("created_at", { ascending: true });
        if (error) throw error;
        return (data ?? []).map(addressFromRow);
    }

    async create(address: Omit<Address, "id">): Promise<Address> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData.user) {
          throw authError ?? new Error("Authentication required");
        }

        const { data, error } = await this.client
                  .from("addresses")
                  .insert({
                    ...addressToRow({ ...address, isDefault: false }),
                    user_id: authData.user.id,
                  })
                  .select("*")
                  .single();
        if (error) throw error;
        if (address.isDefault) await this.setDefault(String(data.id));
        const created = addressFromRow(data);
        return address.isDefault ? { ...created, isDefault: true } : created;
    }

    async update(id: string, patch: Partial<Omit<Address, "id">>): Promise<void> {
        const current = await this.client
                  .from("addresses")
                  .select("*")
                  .eq("id", id)
                  .single();
        if (current.error) throw current.error;
        const wantsDefault = patch.isDefault === true;
        const merged = {
                  ...addressFromRow(current.data),
                  ...patch,
                  ...(wantsDefault && { isDefault: false }),
                };
        const { error } = await this.client
                  .from("addresses")
                  .update(addressToRow(merged))
                  .eq("id", id);
        if (error) throw error;
        if (wantsDefault) await this.setDefault(id);
    }

    async remove(id: string): Promise<void> {
        const { error } = await this.client.from("addresses").delete().eq("id", id);
        if (error) throw error;
    }

    async setDefault(id: string): Promise<void> {
        const { error } = await this.client.rpc("set_default_address", {
                  target_address_id: id,
                });
        if (error) throw error;
    }
}

export function addressFromRow(row: Record<string, unknown>): Address {
    return {
    id: String(row.id),
    labelEn: row.label_en as Address["labelEn"],
    labelAr: row.label_ar as Address["labelAr"],
    fullNameEn: String(row.full_name_en),
    fullNameAr: String(row.full_name_ar),
    phone: String(row.phone),
    cityEn: String(row.city_en),
    cityAr: String(row.city_ar),
    districtEn: row.district_en ? String(row.district_en) : undefined,
    districtAr: row.district_ar ? String(row.district_ar) : undefined,
    streetEn: String(row.street_en),
    streetAr: String(row.street_ar),
    notesEn: row.notes_en ? String(row.notes_en) : undefined,
    notesAr: row.notes_ar ? String(row.notes_ar) : undefined,
    isDefault: Boolean(row.is_default),
    };
}

export function addressToRow(address: Omit<Address, "id">) {
    return {
    label_en: address.labelEn,
    label_ar: address.labelAr,
    full_name_en: address.fullNameEn,
    full_name_ar: address.fullNameAr,
    phone: address.phone,
    city_en: address.cityEn,
    city_ar: address.cityAr,
    district_en: address.districtEn ?? null,
    district_ar: address.districtAr ?? null,
    street_en: address.streetEn,
    street_ar: address.streetAr,
    notes_en: address.notesEn ?? null,
    notes_ar: address.notesAr ?? null,
    is_default: address.isDefault,
    };
}
