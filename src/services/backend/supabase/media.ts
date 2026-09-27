import { type SupabaseClient } from "@supabase/supabase-js";
import type { ListingImageRecord, ListingImageUpload, ListingMediaMime, ListingMediaService } from "../contracts";
import { LISTING_MEDIA_ALLOWED_MIME, LISTING_MEDIA_MAX_BYTES } from "../contracts";

export class SupabaseListingMediaService implements ListingMediaService {
    constructor(private readonly client: SupabaseClient) {
    }

    private async requireAuthUserId(): Promise<string> {
        const { data, error } = await this.client.auth.getUser();
        if (error || !data.user) {
          throw error ?? new Error("Authentication required");
        }

        return data.user.id;
    }

    /**
     * Resolve a `storage_path` into a usable browser URL. Public URLs (mock
     * seed data) pass through unchanged; bucket paths go through the signed
     * URL flow because the bucket is private.
     */
    private async resolveUrl(storagePath: string): Promise<{
        url: string;
        expiresAt?: number;
        }> {
        if (isPublicImageUrl(storagePath)) {
          return { url: storagePath };
        }

        const expiresIn = 60 * 60;
        const { data, error } = await this.client.storage
                  .from("listing-media")
                  .createSignedUrl(storagePath, expiresIn);
        if (error || !data?.signedUrl) {
          throw (
            error ?? new Error(`Unable to resolve signed URL for ${storagePath}`)
          );
        }

        return {
          url: data.signedUrl,
          expiresAt: Date.now() + expiresIn * 1000,
        };
    }

    async upload(listingId: string, file: ListingImageUpload, sortOrder: number): Promise<ListingImageRecord> {
        if (!LISTING_MEDIA_ALLOWED_MIME.includes(file.mimeType)) {
          throw new Error(
            `Unsupported image type ${file.mimeType}. Allowed: ${LISTING_MEDIA_ALLOWED_MIME.join(", ")}`,
          );
        }

        if (file.sizeBytes <= 0) {
          throw new Error("Image is empty.");
        }

        if (file.sizeBytes > LISTING_MEDIA_MAX_BYTES) {
          throw new Error(
            `Image exceeds the ${LISTING_MEDIA_MAX_BYTES} byte limit.`,
          );
        }

        const userId = await this.requireAuthUserId();
        const extension = MIME_TO_EXTENSION[file.mimeType];
        const storagePath = `${userId}/${listingId}/${randomStorageId()}.${extension}`;
        const { error: uploadError } = await this.client.storage
                  .from("listing-media")
                  .upload(storagePath, file.body, {
                    contentType: file.mimeType,
                    cacheControl: "3600",
                    upsert: false,
                  });
        if (uploadError) throw uploadError;
        const { data, error } = await this.client
                  .from("listing_images")
                  .insert({
                    listing_id: listingId,
                    storage_path: storagePath,
                    sort_order: sortOrder,
                    alt_en: file.altEn ?? "",
                    alt_ar: file.altAr ?? "",
                  })
                  .select("*")
                  .single();
        if (error) {
          // Best-effort rollback: drop the orphaned storage object so the
          // user doesn't pay for a file with no metadata row.
          await this.client.storage.from("listing-media").remove([storagePath]);
          throw error;
        }

        const resolved = await this.resolveUrl(storagePath);
        return listingImageFromRow(data, resolved.url, resolved.expiresAt);
    }

    async listForListing(listingId: string): Promise<ListingImageRecord[]> {
        const { data, error } = await this.client
                  .from("listing_images")
                  .select("*")
                  .eq("listing_id", listingId)
                  .order("sort_order", { ascending: true });
        if (error) throw error;
        return Promise.all(
          (data ?? []).map(async (row) => {
            const resolved = await this.resolveUrl(String(row.storage_path));
            return listingImageFromRow(row, resolved.url, resolved.expiresAt);
          }),
        );
    }

    async listForListings(listingIds: string[]): Promise<Record<string, ListingImageRecord[]>> {
        if (listingIds.length === 0) return {};
        const { data, error } = await this.client
                  .from("listing_images")
                  .select("*")
                  .in("listing_id", listingIds)
                  .order("sort_order", { ascending: true });
        if (error) throw error;
        const grouped: Record<string, ListingImageRecord[]> = {};
        for (const id of listingIds) grouped[id] = [];
        const rows = data ?? [];
        const privatePaths = Array.from(new Set(
                  rows
                    .map((row) => String(row.storage_path))
                    .filter((path) => !isPublicImageUrl(path))
                ));
        const signedUrlMap = new Map<string, string>();
        const expiresIn = 60 * 60;
        let expiresAt: number | undefined;
        if (privatePaths.length > 0) {
          const { data: signedUrlsData, error: signedUrlsError } =
            await this.client.storage
              .from("listing-media")
              .createSignedUrls(privatePaths, expiresIn);

          if (signedUrlsError) {
            throw (
              signedUrlsError ??
              new Error(`Unable to resolve signed URLs for listings`)
            );
          }

          expiresAt = Date.now() + expiresIn * 1000;
          for (const item of signedUrlsData ?? []) {
            if (item.signedUrl && item.path) {
              signedUrlMap.set(item.path as string, item.signedUrl as string);
            }
          }
        }

        const resolved = rows.map((row) => {
                  const path = String(row.storage_path);
                  if (isPublicImageUrl(path)) {
                    return listingImageFromRow(row, path);
                  }
                  const url = signedUrlMap.get(path) ?? path;
                  return listingImageFromRow(row, url, expiresAt);
                });
        for (const record of resolved) {
          const bucket = grouped[record.listingId];
          if (bucket) bucket.push(record);
        }

        return grouped;
    }

    async remove(imageId: string): Promise<void> {
        const { data: row, error: loadError } = await this.client
                  .from("listing_images")
                  .select("storage_path")
                  .eq("id", imageId)
                  .maybeSingle();
        if (loadError) throw loadError;
        if (!row) return;
        const { error: deleteError } = await this.client
                  .from("listing_images")
                  .delete()
                  .eq("id", imageId);
        if (deleteError) throw deleteError;
        if (!isPublicImageUrl(String(row.storage_path))) {
          const { error: storageError } = await this.client.storage
            .from("listing-media")
            .remove([String(row.storage_path)]);
          if (storageError) throw storageError;
        }
    }

    async removeAllForListing(listingId: string): Promise<void> {
        const { data, error } = await this.client
                  .from("listing_images")
                  .select("id, storage_path")
                  .eq("listing_id", listingId);
        if (error) throw error;
        const rows = (data ?? []) as Array<{
                  id: string;
                  storage_path: string;
                }>;
        if (rows.length === 0) return;
        const { error: deleteError } = await this.client
                  .from("listing_images")
                  .delete()
                  .eq("listing_id", listingId);
        if (deleteError) throw deleteError;
        const storagePaths = rows
                  .map((r) => r.storage_path)
                  .filter((p) => !isPublicImageUrl(p));
        if (storagePaths.length > 0) {
          const { error: storageError } = await this.client.storage
            .from("listing-media")
            .remove(storagePaths);
          if (storageError) throw storageError;
        }
    }
}

/**
 * Heuristic: storage paths used by Phase 1 mock data are absolute URLs
 * (`/products/foo.jpg`) or `https://...`. Real uploads live in the private
 * `listing-media` bucket and use the `{userId}/{listingId}/{file}` shape.
 */
export function isPublicImageUrl(storagePath: string): boolean {
    return storagePath.startsWith("/") || /^https?:\/\//i.test(storagePath);
}

/**
 * Cryptographic random UUID. Uses Web Crypto when available (browser,
 * Node ≥ 19), falls back to a timestamp+random slug for older runtimes.
 * Used only for storage path uniqueness; uniqueness is also enforced by
 * the `storage_path` UNIQUE constraint on `listing_images`.
 */
export function randomStorageId(): string {
    return crypto.randomUUID();
}

export function listingImageFromRow(row: Record<string, unknown>, url: string, signedUrlExpiresAt?: number): ListingImageRecord {
    return {
    id: String(row.id),
    listingId: String(row.listing_id),
    storagePath: String(row.storage_path),
    url,
    ...(signedUrlExpiresAt !== undefined && { signedUrlExpiresAt }),
    sortOrder: Number(row.sort_order ?? 0),
    altEn: String(row.alt_en ?? ""),
    altAr: String(row.alt_ar ?? ""),
    createdAt: String(row.created_at),
    };
}

export const MIME_TO_EXTENSION: Record<ListingMediaMime, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
