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
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let supabaseOk = false;
  let supabaseLatencyMs: number | null = null;
  if (url && key) {
    try {
      const pingStart = Date.now();
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .limit(1);
      supabaseLatencyMs = Date.now() - pingStart;
      supabaseOk = !error;
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
