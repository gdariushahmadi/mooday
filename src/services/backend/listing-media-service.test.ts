import { describe, expect, it, vi } from "vitest";
import {
  LISTING_MEDIA_ALLOWED_MIME,
  LISTING_MEDIA_MAX_BYTES,
  type ListingImageUpload,
  type Phase2Backend,
} from "./contracts";

// We avoid wiring a real Supabase client here. Instead, we exercise the
// adapter through a hand-built stub that mirrors the subset of the Supabase
// surface the service uses. This keeps the test hermetic — no network, no
// bucket, no auth round-trip.

interface StorageStub {
  upload: ReturnType<typeof vi.fn>;
  createSignedUrl: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}

interface ClientStub {
  auth: { getUser: ReturnType<typeof vi.fn> };
  storage: { from: (bucket: string) => StorageStub };
  from: (table: string) => unknown;
}

async function buildBackend(client: ClientStub): Promise<Phase2Backend> {
  // Swap the Supabase constructor for our stub before importing the
  // adapter module. Vitest's dynamic import + vi.doMock keeps the adapter
  // logic intact while replacing only the I/O surface.
  vi.resetModules();
  vi.doMock("@supabase/supabase-js", () => ({
    createClient: () => client,
  }));
  const { createSupabaseBackend } = await import("./supabase");
  return createSupabaseBackend({
    mode: "supabase",
    marketplaceMode: "supabase",
    supabaseUrl: "https://example.supabase.co",
    supabasePublishableKey: "test-key",
    supabaseServiceRoleKey: "test-service-role-key",
    siteUrl: "http://localhost:3000",
  });
}

function makeClient(overrides: Partial<ClientStub> = {}): ClientStub {
  const storage: StorageStub = {
    upload: vi.fn(async () => ({ data: { path: "ok" }, error: null })),
    createSignedUrl: vi.fn(async () => ({
      data: { signedUrl: "https://signed.example/image" },
      error: null,
    })),
    remove: vi.fn(async () => ({ data: [], error: null })),
  };
  const insertedRows: Record<string, unknown>[] = [];
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "user-1" } },
        error: null,
      })),
    },
    storage: { from: () => storage },
    from: (table) => {
      if (table === "listing_images") {
        return {
          insert: (row: unknown) => ({
            select: () => ({
              single: async () => {
                const stored = Array.isArray(row) ? row[0] : row;
                insertedRows.push(stored as Record<string, unknown>);
                return {
                  data: {
                    id: "img-1",
                    listing_id: (stored as Record<string, unknown>).listing_id,
                    storage_path: (stored as Record<string, unknown>)
                      .storage_path,
                    sort_order: (stored as Record<string, unknown>).sort_order,
                    alt_en: (stored as Record<string, unknown>).alt_en ?? "",
                    alt_ar: (stored as Record<string, unknown>).alt_ar ?? "",
                    created_at: "2026-07-18T00:00:00.000Z",
                  },
                  error: null,
                };
              },
            }),
          }),
          select: () => ({
            eq: () => {
              const promise = Promise.resolve({
                data: insertedRows.slice(),
                error: null,
              });
              (promise as unknown as { order: unknown }).order = () => promise;
              (promise as unknown as { in: unknown }).in = () => promise;
              return promise as never;
            },
          }),
          delete: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    ...overrides,
  };
}

const validUpload = (
  overrides: Partial<ListingImageUpload> = {},
): ListingImageUpload => ({
  filename: "photo.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 1024,
  body: new Blob([new Uint8Array([0xff, 0xd8, 0xff])]),
  ...overrides,
});

describe("Listing media constants", () => {
  it("locks the allowed MIME types to the bucket's allow-list", () => {
    expect([...LISTING_MEDIA_ALLOWED_MIME]).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
  });

  it("matches the bucket's 10 MiB file size limit", () => {
    expect(LISTING_MEDIA_MAX_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe("SupabaseListingMediaService", () => {
  it("rejects unsupported mime types before touching storage", async () => {
    const backend = await buildBackend(makeClient());
    await expect(
      backend.media.upload(
        "listing-1",
        // Cast required because TS won't let us put an invalid mime into
        // the typed upload shape — that's exactly what we're testing.
        validUpload({ mimeType: "image/gif" as never }),
        0,
      ),
    ).rejects.toThrow(/Unsupported image type/);
  });

  it("rejects empty bodies", async () => {
    const backend = await buildBackend(makeClient());
    await expect(
      backend.media.upload("listing-1", validUpload({ sizeBytes: 0 }), 0),
    ).rejects.toThrow(/empty/);
  });

  it("rejects uploads larger than the bucket size limit", async () => {
    const backend = await buildBackend(makeClient());
    await expect(
      backend.media.upload(
        "listing-1",
        validUpload({ sizeBytes: LISTING_MEDIA_MAX_BYTES + 1 }),
        0,
      ),
    ).rejects.toThrow(/exceeds/);
  });

  it("requires an authenticated session", async () => {
    const backend = await buildBackend(
      makeClient({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: null },
            error: null,
          })),
        },
      }),
    );
    await expect(
      backend.media.upload("listing-1", validUpload(), 0),
    ).rejects.toThrow(/Authentication required/);
  });

  it("surfaces auth errors verbatim", async () => {
    const backend = await buildBackend(
      makeClient({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: null },
            error: new Error("not signed in"),
          })),
        },
      }),
    );
    await expect(
      backend.media.upload("listing-1", validUpload(), 0),
    ).rejects.toThrow("not signed in");
  });

  it("uploads under the {userId}/{listingId}/{file} path shape", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    await backend.media.upload("listing-1", validUpload(), 0);
    const call = (
      client.storage.from("listing-media").upload as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    const path = call[0] as string;
    expect(path.startsWith("user-1/listing-1/")).toBe(true);
    expect(path.endsWith(".jpg")).toBe(true);
  });

  it("rolls back the storage object when metadata insert fails", async () => {
    const client = makeClient({
      from: (table) => {
        if (table !== "listing_images") {
          throw new Error(`unexpected table ${table}`);
        }
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: null,
                error: new Error("row-level constraint"),
              }),
            }),
          }),
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null }) as never,
          }),
          delete: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        } as never;
      },
    });
    const backend = await buildBackend(client);
    await expect(
      backend.media.upload("listing-1", validUpload(), 0),
    ).rejects.toThrow(/row-level constraint/);
    expect(client.storage.from("listing-media").remove).toHaveBeenCalledTimes(
      1,
    );
  });

  it("resolves signed URLs for private storage paths", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    const record = await backend.media.upload("listing-1", validUpload(), 0);
    expect(record.url).toBe("https://signed.example/image");
    expect(record.signedUrlExpiresAt).toBeGreaterThan(Date.now() - 5000);
  });
});
