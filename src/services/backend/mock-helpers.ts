/**
 * Build a hydrated fake Supabase client that records the chain of
 * calls so tests can assert behavior. The shape is the minimum
 * surface exercised by Phase2Backend service.
 */
export interface Recorder<T> {
  call(name: string, value: T): void;
  chain: Array<{ name: string; value: T }>;
}

export function recorder<T>(): Recorder<T> {
  const chain: Array<{ name: string; value: T }> = [];
  return {
    call(name: string, value: T) {
      chain.push({ name, value });
    },
    chain,
  };
}

export function recordingClient() {
  return {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { id: "user-1" } },
          error: null,
        }),
    },
    from: () => {
      const builder: Record<string, unknown> = {
        select: () => builder,
        insert: () => builder,
        upsert: () => builder,
        delete: () => builder,
        update: () => builder,
        eq: () => builder,
        order: () => builder,
        maybeSingle: () => Promise.resolve({ data: null }),
      };
      return builder;
    },
    channel: () => ({
      on: () => ({ subscribe: () => undefined }),
      subscribe: () => undefined,
    }),
    removeChannel: () => Promise.resolve(),
  };
}
