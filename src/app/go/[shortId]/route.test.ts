import { describe, expect, it, vi, beforeEach } from "vitest";

const supabaseInsertMock = vi.fn();
const supabaseSelectMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: supabaseSelectMock,
      insert: supabaseInsertMock,
    }),
  }),
}));

describe("GET /go/[shortId]", () => {
  beforeEach(() => {
    supabaseInsertMock.mockReset();
    supabaseSelectMock.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  });

  it("returns 404 for an invalid shortId format", async () => {
    const { GET } = await import("./route");
    const req = new Request("http://localhost/go/!!!");
    const ctx = { params: Promise.resolve({ shortId: "!!!" }) };
    const response = await GET(req as never, ctx);
    expect(response.status).toBe(404);
  });

  it("uses dynamic export for runtime and dynamic", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(
      "src/app/go/[shortId]/route.ts",
      "utf8",
    );
    expect(source).toContain('export const runtime = "nodejs"');
    expect(source).toContain('export const dynamic = "force-dynamic"');
  });

  it("returns 404 when no link matches the shortId", async () => {
    supabaseSelectMock.mockReturnValue({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
      }),
    });
    const { GET } = await import("./route");
    const req = new Request("http://localhost/go/abc12345");
    const ctx = { params: Promise.resolve({ shortId: "abc12345" }) };
    const response = await GET(req as never, ctx);
    expect(response.status).toBe(404);
  });

  it("302s to the partner URL when the link is active", async () => {
    supabaseSelectMock.mockReturnValue({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({
            data: {
              id: "link-1",
              listing_id: "listing-1",
              partner_code: "amazon-ae",
              affiliate_url: "https://www.amazon.ae/dp/B0XYZ",
              is_active: true,
            },
            error: null,
          }),
      }),
    });
    supabaseInsertMock.mockReturnValue(
      Promise.resolve({ error: null }),
    );
    const { GET } = await import("./route");
    const req = new Request("http://localhost/go/abc12345");
    const ctx = { params: Promise.resolve({ shortId: "abc12345" }) };
    const response = await GET(req as never, ctx);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://www.amazon.ae/dp/B0XYZ",
    );
    expect(response.headers.get("set-cookie")).toContain("m_aff_anon=");
    expect(supabaseInsertMock).toHaveBeenCalledTimes(1);
  });
});
