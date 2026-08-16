import { describe, expect, it } from "vitest";

describe("GET /api/health", () => {
  it("returns 503 when Supabase env is missing", async () => {
    const { GET } = await import("./route");
    const original = { ...process.env };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe("degraded");
    expect(body.supabase.reachable).toBe(false);
    expect(body.timestamp).toBeDefined();
    Object.assign(process.env, original);
  });

  it("returns a JSON body with elapsedMs and uptime", async () => {
    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();
    expect(typeof body.elapsedMs).toBe("number");
    expect(typeof body.uptime).toBe("number");
  });
});
