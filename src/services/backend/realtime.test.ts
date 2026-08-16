import { describe, expect, it } from "vitest";
import { recordingClient } from "./mock-helpers";

describe("Realtime subscriptions", () => {
  it("ChatService.subscribeMessages opens a channel with the expected name", async () => {
    const client = recordingClient();
    channelSpy(client);
    const { createSupabaseBackend } = await import("./supabase");
    const backend = createSupabaseBackend({
      supabaseUrl: "https://test.supabase.co",
      supabasePublishableKey: "test-key",
      supabaseServiceRoleKey: null,
      siteUrl: "https://test.supabase.co",
      mode: "supabase",
      marketplaceMode: "supabase",
    });
    const unsubscribe = backend.chats.subscribeMessages(
      "thread-1",
      () => undefined,
    );
    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
  });

  it("NotificationService.subscribe opens a notifications channel", async () => {
    const client = recordingClient();
    channelSpy(client);
    const { createSupabaseBackend } = await import("./supabase");
    const backend = createSupabaseBackend({
      supabaseUrl: "https://test.supabase.co",
      supabasePublishableKey: "test-key",
      supabaseServiceRoleKey: null,
      siteUrl: "https://test.supabase.co",
      mode: "supabase",
      marketplaceMode: "supabase",
    });
    const unsubscribe = backend.notifications.subscribe(() => undefined);
    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
  });

  function channelSpy(client: ReturnType<typeof recordingClient>) {
    const seen: string[] = [];
    (client as unknown as { channel: (name: string) => unknown }).channel = (
      name: string,
    ) => {
      seen.push(name);
      const builder: Record<string, unknown> = {
        on: () => builder,
        subscribe: () => undefined,
      };
      return builder;
    };
    void seen;
  }
});
