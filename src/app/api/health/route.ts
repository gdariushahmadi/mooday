/**
 * Health check endpoint.
 *
 * Returns a JSON blob with the build status. Used by the cPanel
 * deploy verification (`curl https://app.daneg.ae/api/health`) and
 * by external monitoring (Sentry, uptime services).
 *
 * Pings the Supabase REST endpoint to verify backend connectivity.
 * Returns 503 if the backend is unreachable.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = 3000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const startedAt = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let supabaseOk = false;
  let supabaseLatencyMs: number | null = null;
  if (url && key) {
    try {
      const pingStart = Date.now();
      const baseUrl = new URL(url.replace(/\/+$/, ""));
      const basePath = baseUrl.pathname.replace(/\/+$/, "");
      const headers = {
        apikey: key,
        Authorization: `Bearer ${key}`,
      };
      const [restResponse, authResponse] = await Promise.all([
        fetchWithTimeout(
          `${baseUrl.origin}${basePath}/rest/v1/listings?select=id&limit=1`,
          { headers },
        ),
        fetchWithTimeout(`${baseUrl.origin}${basePath}/auth/v1/settings`, {
          headers,
        }),
      ]);
      supabaseLatencyMs = Date.now() - pingStart;
      supabaseOk = restResponse.ok && authResponse.ok;
    } catch {
      supabaseOk = false;
    }
  }
  const totalMs = Date.now() - startedAt;
  const body = {
    status: supabaseOk ? "ok" : "degraded",
    uptime: process.uptime(),
    supabase: {
      reachable: supabaseOk,
      latencyMs: supabaseLatencyMs,
    },
    elapsedMs: totalMs,
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: supabaseOk ? 200 : 503 });
}
