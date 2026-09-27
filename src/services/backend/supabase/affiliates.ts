import { type SupabaseClient } from "@supabase/supabase-js";
import type { AffiliateClickService, AffiliateLinkService, AffiliateReportRange, AffiliateReportSummary } from "../contracts";
import { toAffiliateLinkRecord, toPartnerRecord, type AffiliateLinkRow, type PartnerRow } from "../mappers-affiliate";

export class SupabaseAffiliateLinkService implements AffiliateLinkService {
    constructor(private readonly client: SupabaseClient) {
    }

    async listPartners() {
        const { data, error } = await this.client
                  .from("partners")
                  .select("*")
                  .eq("is_active", true)
                  .order("display_order", { ascending: true });
        if (error) throw error;
        return (data ?? []).map((row) => toPartnerRecord(row as PartnerRow));
    }

    async listLinksForListing(listingId: string) {
        const { data, error } = await this.client
                  .from("affiliate_links")
                  .select("*")
                  .eq("listing_id", listingId)
                  .eq("is_active", true)
                  .order("display_order", { ascending: true });
        if (error) throw error;
        return (data ?? []).map((row) => toAffiliateLinkRecord(row as AffiliateLinkRow));
    }

    async createPartner(input: {
        code: string;
        name: string;
        logoUrl?: string;
        baseUrlTemplate?: string;
        displayOrder?: number;
        isActive?: boolean;
        }) {
        const { data, error } = await this.client
                  .from("partners")
                  .insert({
                    code: input.code,
                    name: input.name,
                    logo_url: input.logoUrl ?? null,
                    base_url_template: input.baseUrlTemplate ?? null,
                    display_order: input.displayOrder ?? 0,
                    is_active: input.isActive ?? true,
                  })
                  .select("*")
                  .single();
        if (error) throw error;
        return toPartnerRecord(data as PartnerRow);
    }

    async updatePartner(code: string, patch: Partial<{
          name: string;
          logoUrl: string | null;
          baseUrlTemplate: string | null;
          displayOrder: number;
          isActive: boolean;
        }>) {
        const update: Record<string, unknown> = {};
        if (patch.name !== undefined) update.name = patch.name;
        if (patch.logoUrl !== undefined) update.logo_url = patch.logoUrl;
        if (patch.baseUrlTemplate !== undefined)
        update.base_url_template = patch.baseUrlTemplate;
        if (patch.displayOrder !== undefined) update.display_order = patch.displayOrder;
        if (patch.isActive !== undefined) update.is_active = patch.isActive;
        if (Object.keys(update).length === 0) return;
        const { error } = await this.client
                  .from("partners")
                  .update(update)
                  .eq("code", code);
        if (error) throw error;
    }

    async deletePartner(code: string) {
        const { error } = await this.client.from("partners").delete().eq("code", code);
        if (error) throw error;
    }

    async createLink(input: {
        listingId: string;
        partnerCode: string;
        affiliateUrl: string;
        displayOrder?: number;
        }) {
        const { data, error } = await this.client
                  .from("affiliate_links")
                  .insert({
                    listing_id: input.listingId,
                    partner_code: input.partnerCode,
                    affiliate_url: input.affiliateUrl,
                    display_order: input.displayOrder ?? 0,
                    is_active: true,
                  })
                  .select("*")
                  .single();
        if (error) throw error;
        return toAffiliateLinkRecord(data as AffiliateLinkRow);
    }

    async updateLink(id: string, patch: Partial<{
          affiliateUrl: string;
          displayOrder: number;
          isActive: boolean;
        }>) {
        const update: Record<string, unknown> = {};
        if (patch.affiliateUrl !== undefined) update.affiliate_url = patch.affiliateUrl;
        if (patch.displayOrder !== undefined) update.display_order = patch.displayOrder;
        if (patch.isActive !== undefined) update.is_active = patch.isActive;
        if (Object.keys(update).length === 0) return;
        const { error } = await this.client
                  .from("affiliate_links")
                  .update(update)
                  .eq("id", id);
        if (error) throw error;
    }

    async removeLink(id: string) {
        const { error } = await this.client
                  .from("affiliate_links")
                  .delete()
                  .eq("id", id);
        if (error) throw error;
    }
}

export class SupabaseAffiliateClickService implements AffiliateClickService {
    constructor(private readonly client: SupabaseClient) {
    }

    async recordClick(input: {
        shortId: string;
        listingId: string;
        partnerCode: string;
        userId: string | null;
        anonId: string | null;
        userAgent: string | null;
        referer: string | null;
        }) {
        const { error } = await this.client.from("affiliate_clicks").insert({
                  short_id: input.shortId,
                  listing_id: input.listingId,
                  partner_code: input.partnerCode,
                  user_id: input.userId,
                  anon_id: input.anonId,
                  user_agent: input.userAgent,
                  referer: input.referer,
                });
        if (error) throw error;
    }

    async aggregateForReports(range: AffiliateReportRange): Promise<AffiliateReportSummary> {
        const { data, error } = await this.client
                  .from("affiliate_clicks")
                  .select("partner_code, listing_id")
                  .gte("clicked_at", range.fromIso)
                  .lte("clicked_at", range.toIso);
        if (error) throw error;
        const rows = data ?? [];
        const byPartnerMap = new Map<string, number>();
        const byListingMap = new Map<string, number>();
        for (const r of rows) {
          const row = r as { partner_code: string; listing_id: string };
          byPartnerMap.set(row.partner_code, (byPartnerMap.get(row.partner_code) ?? 0) + 1);
          byListingMap.set(row.listing_id, (byListingMap.get(row.listing_id) ?? 0) + 1);
        }

        return {
          byPartner: Array.from(byPartnerMap.entries())
            .map(([partnerCode, clicks]) => ({ partnerCode, clicks }))
            .sort((a, b) => b.clicks - a.clicks),
          byListing: Array.from(byListingMap.entries())
            .map(([listingId, clicks]) => ({ listingId, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10),
          totalClicks: rows.length,
        };
    }
}
