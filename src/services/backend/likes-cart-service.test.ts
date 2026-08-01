import { describe, expect, it, vi } from "vitest";
import type { Phase2Backend } from "./contracts";

interface StorageStub {
  upload: ReturnType<typeof vi.fn>;
  createSignedUrl: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}

interface LikeRow {
  user_id: string;
  listing_id: string;
  created_at: string;
}

interface CartRow {
  id: string;
  user_id: string;
  listing_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
}

interface ClientStub {
  auth: { getUser: ReturnType<typeof vi.fn> };
  storage: { from: (bucket: string) => StorageStub };
  from: (table: string) => unknown;
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: unknown }>;
  __likeRows: LikeRow[];
  __cartRows: CartRow[];
}

const USER_ID = "user-1";

async function buildBackend(client: ClientStub): Promise<Phase2Backend> {
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
    supabaseServiceRoleKey: null,
    siteUrl: "http://localhost:3000",
  });
}

interface FilterRecorder {
  filters: { col: string; val: unknown }[];
}

function rowsMatch<T>(
  rows: T[],
  filters: { col: string; val: unknown }[],
): T[] {
  return rows.filter((row) =>
    filters.every((f) => {
      const value = (row as Record<string, unknown>)[f.col];
      if (Array.isArray(f.val)) {
        return (f.val as unknown[]).includes(value);
      }
      return value === f.val;
    }),
  );
}

/**
 * Build a chainable that records `.eq` filters and supports:
 *  - `.order` (terminal)
 *  - `.maybeSingle` / `.single` (terminal)
 *  - `.then` (so `await chain` works)
 */
function makeSelectChain(
  recorder: FilterRecorder,
  project: () => {
    data: unknown;
    error: unknown;
    count?: number | null;
  },
) {
  const thenable = {
    eq(this: unknown, col: string, val: unknown) {
      recorder.filters.push({ col, val });
      return thenable;
    },
    in(this: unknown, col: string, vals: unknown[]) {
      recorder.filters.push({ col, val: vals });
      return thenable;
    },
    async order() {
      return project();
    },
    async maybeSingle() {
      const r = project();
      const data = Array.isArray(r.data) ? (r.data[0] ?? null) : r.data;
      return { ...r, data };
    },
    async single() {
      const r = project();
      const data = Array.isArray(r.data) ? (r.data[0] ?? null) : r.data;
      return { ...r, data };
    },
    then<T>(resolve: (r: ReturnType<typeof project>) => T) {
      return Promise.resolve(project()).then(resolve);
    },
  };
  return thenable;
}

function makeClient(overrides: Partial<ClientStub> = {}): ClientStub {
  const storage: StorageStub = {
    upload: vi.fn(),
    createSignedUrl: vi.fn(),
    remove: vi.fn(),
  };
  const likeRows: LikeRow[] = [];
  const cartRows: CartRow[] = [];

  const fromFn = (table: string): unknown => {
    if (table === "user_listing_likes") {
      const recorder: FilterRecorder = { filters: [] };
      return {
        select: () => {
          const project = () => ({
            data: rowsMatch(likeRows, recorder.filters).map((r) => ({
              listing_id: r.listing_id,
              created_at: r.created_at,
            })),
            error: null,
            count: rowsMatch(likeRows, recorder.filters).length,
          });
          return makeSelectChain(recorder, project);
        },
        upsert: (
          row: { user_id: string; listing_id: string },
          opts?: { ignoreDuplicates?: boolean },
        ) => {
          const exists = likeRows.some(
            (r) => r.user_id === row.user_id && r.listing_id === row.listing_id,
          );
          if (!exists || !opts?.ignoreDuplicates) {
            likeRows.push({
              ...row,
              created_at: new Date().toISOString(),
            });
          }
          const chain = {
            select: () => chain,
            maybeSingle: () => Promise.resolve({ data: row, error: null }),
            single: () => Promise.resolve({ data: row, error: null }),
            then: <T>(resolve: (r: { data: unknown; error: null }) => T) =>
              Promise.resolve({ data: row, error: null }).then(resolve),
          };
          return chain;
        },
        insert: (row: { user_id: string; listing_id: string }) => {
          likeRows.push({
            ...row,
            created_at: new Date().toISOString(),
          });
          return Promise.resolve({ data: row, error: null });
        },
        delete: () => {
          const state: { filters: { col: string; val: unknown }[] } = {
            filters: [],
          };
          const apply = () => {
            for (let i = likeRows.length - 1; i >= 0; i -= 1) {
              const r = likeRows[i];
              const matched = state.filters.every(
                (f) => r[f.col as keyof LikeRow] === f.val,
              );
              if (matched) likeRows.splice(i, 1);
            }
          };
          const eqThenable = {
            eq(this: unknown, col: string, val: unknown) {
              state.filters.push({ col, val });
              return eqThenable;
            },
            then<T>(resolve: (r: { data: null; error: null }) => T) {
              apply();
              return Promise.resolve({
                data: null,
                error: null,
              }).then(resolve);
            },
          };
          return eqThenable;
        },
      };
    }
    if (table === "cart_items") {
      const recorder: FilterRecorder = { filters: [] };
      return {
        select: () => {
          const project = () => ({
            data: rowsMatch(cartRows, recorder.filters).map((r) => ({
              listing_id: r.listing_id,
              quantity: r.quantity,
              added_at: r.added_at,
              updated_at: r.updated_at,
            })),
            error: null,
            count: rowsMatch(cartRows, recorder.filters).length,
          });
          return makeSelectChain(recorder, project);
        },
        upsert: (row: {
          user_id: string;
          listing_id: string;
          quantity: number;
        }) => {
          const idx = cartRows.findIndex(
            (r) => r.user_id === row.user_id && r.listing_id === row.listing_id,
          );
          if (idx >= 0) {
            cartRows[idx] = {
              ...cartRows[idx],
              quantity: row.quantity,
              updated_at: new Date().toISOString(),
            };
          } else {
            cartRows.push({
              id: `ci-${cartRows.length + 1}`,
              ...row,
              added_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
          const chain = {
            select: () => chain,
            single: () => Promise.resolve({ data: row, error: null }),
            maybeSingle: () => Promise.resolve({ data: row, error: null }),
            then: <T>(resolve: (r: { data: unknown; error: null }) => T) =>
              Promise.resolve({ data: row, error: null }).then(resolve),
          };
          return chain;
        },
        delete: () => {
          const state: { filters: { col: string; val: unknown }[] } = {
            filters: [],
          };
          const apply = () => {
            for (let i = cartRows.length - 1; i >= 0; i -= 1) {
              const r = cartRows[i];
              const matched = state.filters.every(
                (f) => r[f.col as keyof CartRow] === f.val,
              );
              if (matched) cartRows.splice(i, 1);
            }
          };
          const eqThenable = {
            eq(this: unknown, col: string, val: unknown) {
              state.filters.push({ col, val });
              return eqThenable;
            },
            then<T>(resolve: (r: { data: null; error: null }) => T) {
              apply();
              return Promise.resolve({
                data: null,
                error: null,
              }).then(resolve);
            },
          };
          return eqThenable;
        },
      };
    }
    throw new Error(`unexpected table ${table}`);
  };

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: USER_ID } },
        error: null,
      })),
    },
    storage: { from: () => storage },
    from: fromFn,
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
      if (fn === "cart_items_increment") {
        const listingId = String(args["target_listing_id"]);
        const delta = Number(args["delta"] ?? 1);
        if (delta <= 0) return { error: null };
        const idx = cartRows.findIndex(
          (r) => r.user_id === USER_ID && r.listing_id === listingId,
        );
        if (idx >= 0) {
          cartRows[idx] = {
            ...cartRows[idx],
            quantity: Math.min(99, cartRows[idx].quantity + delta),
            updated_at: new Date().toISOString(),
          };
        } else {
          cartRows.push({
            id: `ci-${cartRows.length + 1}`,
            user_id: USER_ID,
            listing_id: listingId,
            quantity: Math.min(99, delta),
            added_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        return { error: null };
      }
      return { error: null };
    }),
    __likeRows: likeRows,
    __cartRows: cartRows,
    ...overrides,
  };
}

describe("SupabaseLikeService", () => {
  it("lists liked listing ids in descending created order", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    await backend.likes.like("listing-a");
    await backend.likes.like("listing-b");
    const list = await backend.likes.listMine();
    expect(list).toEqual(["listing-a", "listing-b"]);
  });

  it("like() is idempotent under repeated calls", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    await backend.likes.like("listing-a");
    await backend.likes.like("listing-a");
    expect(client.__likeRows.length).toBe(1);
  });

  it("unlike() is a no-op on an absent row", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    await expect(backend.likes.unlike("never-liked")).resolves.toBeUndefined();
  });

  it("toggle() flips the state and returns the new state", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    const first = await backend.likes.toggle("listing-a");
    expect(first.liked).toBe(true);
    expect(client.__likeRows.length).toBe(1);
    const second = await backend.likes.toggle("listing-a");
    expect(second.liked).toBe(false);
    expect(client.__likeRows.length).toBe(0);
  });

  it("requires an authenticated session", async () => {
    const client = makeClient({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
    });
    const backend = await buildBackend(client);
    await expect(backend.likes.like("listing-a")).rejects.toThrow(
      /Authentication required/,
    );
    await expect(backend.likes.toggle("listing-a")).rejects.toThrow(
      /Authentication required/,
    );
  });
});

describe("SupabaseCartService", () => {
  it("add() routes through cart_items_increment RPC", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    await backend.cart.add("listing-a", 1);
    expect(client.rpc).toHaveBeenCalledWith("cart_items_increment", {
      target_listing_id: "listing-a",
      delta: 1,
    });
  });

  it("add(0) is a no-op (no RPC call, no remote write)", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    await backend.cart.add("listing-a", 0);
    expect(client.rpc).not.toHaveBeenCalled();
    expect(client.__cartRows.length).toBe(0);
  });

  it("setQuantity(0) falls back to remove() and writes no row", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    await expect(
      backend.cart.setQuantity("listing-a", 0),
    ).resolves.toBeUndefined();
    expect(client.rpc).not.toHaveBeenCalled();
    expect(client.__cartRows.length).toBe(0);
  });

  it("setQuantity > 0 upserts the line", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    await backend.cart.setQuantity("listing-a", 3);
    expect(client.__cartRows.length).toBe(1);
    expect(client.__cartRows[0].quantity).toBe(3);
    await backend.cart.setQuantity("listing-a", 5);
    expect(client.__cartRows[0].quantity).toBe(5);
  });

  it("clear() removes every cart row for the current user", async () => {
    const client = makeClient();
    const backend = await buildBackend(client);
    await backend.cart.add("listing-a", 1);
    await backend.cart.add("listing-b", 1);
    expect(client.__cartRows.length).toBe(2);
    await backend.cart.clear();
    expect(client.__cartRows.length).toBe(0);
  });

  it("requires an authenticated session", async () => {
    const client = makeClient({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
    });
    const backend = await buildBackend(client);
    await expect(backend.cart.add("listing-a", 1)).rejects.toThrow(
      /Authentication required/,
    );
    await expect(backend.cart.clear()).rejects.toThrow(
      /Authentication required/,
    );
  });
});
