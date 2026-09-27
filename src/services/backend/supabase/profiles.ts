import { type SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRecord, ProfileService } from "../contracts";

export class SupabaseProfileService implements ProfileService {
    constructor(private readonly client: SupabaseClient) {
    }

    async getMine(): Promise<ProfileRecord | null> {
        const { data, error } = await this.client
                  .from("profiles")
                  .select("*")
                  .single();
        if (error) return null;
        return {
          fullNameEn: data.full_name_en,
          fullNameAr: data.full_name_ar,
          handle: data.handle ?? "",
          avatar: data.avatar_url ?? "",
          bioEn: data.bio_en ?? "",
          bioAr: data.bio_ar ?? "",
          locationEn: data.location_en ?? "",
          locationAr: data.location_ar ?? "",
          styleTagsEn: data.style_tags_en ?? [],
          styleTagsAr: data.style_tags_ar ?? [],
        };
    }

    async updateMine(patch: Partial<ProfileRecord>): Promise<void> {
        const { data: authData, error: authError } = await this.client.auth.getUser();
        if (authError || !authData?.user?.id) {
          throw authError ?? new Error("Not signed in");
        }

        const { error } = await this.client
                  .from("profiles")
                  .update({
                    ...(patch.fullNameEn !== undefined && {
                      full_name_en: patch.fullNameEn,
                    }),
                    ...(patch.fullNameAr !== undefined && {
                      full_name_ar: patch.fullNameAr,
                    }),
                    ...(patch.handle !== undefined && { handle: patch.handle || null }),
                    ...(patch.avatar !== undefined && { avatar_url: patch.avatar || null }),
                    ...(patch.bioEn !== undefined && { bio_en: patch.bioEn }),
                    ...(patch.bioAr !== undefined && { bio_ar: patch.bioAr }),
                    ...(patch.locationEn !== undefined && {
                      location_en: patch.locationEn,
                    }),
                    ...(patch.locationAr !== undefined && {
                      location_ar: patch.locationAr,
                    }),
                    ...(patch.styleTagsEn !== undefined && {
                      style_tags_en: patch.styleTagsEn,
                    }),
                    ...(patch.styleTagsAr !== undefined && {
                      style_tags_ar: patch.styleTagsAr,
                    }),
                  })
                  .eq("id", authData.user.id);
        if (error) throw error;
    }
}
