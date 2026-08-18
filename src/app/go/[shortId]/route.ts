/**
 * Outbound affiliate redirect.
 *
 * Looks up an `affiliate_links` row by its public `short_id`,
 * inserts a row into `affiliate_clicks` (anonymous-safe), and
 * 302-redirects to the partner URL. Reads/writes use the service-
 * role Supabase client because the redirect must work for logged-
 * out visitors and the `affiliate_clicks` SELECT policy is admin-
 * only (so the user-side client cannot insert). This is the second
 * of three sanctioned service-role uses; the third is the Stripe
 * webhook signature verification.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANON_COOKIE = "m_aff_anon";
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

interface AffiliateLinkLookup {
  id: string;
  listing_id: string;
  partner_code: string;
  affiliate_url: string;
  is_active: boolean;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Affiliate redirect requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeUuid(input: string | undefined): string | null {
  if (!input) return null;
  if (!/^[0-9a-fA-F-]{8,64}$/.test(input)) return null;
  return input;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await ctx.params;
  if (!shortId || !/^[A-Za-z0-9]{4,16}$/.test(shortId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Read or generate the anon id cookie.
  let anonId: string | null = null;
  try {
    anonId = req.cookies.get(ANON_COOKIE)?.value ?? null;
  } catch {
    // Some test harnesses construct a plain Request; treat cookies
    // as absent rather than throwing.
    anonId = null;
  }
  const setCookie = !anonId;
  if (!anonId || !safeUuid(anonId)) {
    try {
      anonId = crypto.randomUUID();
    } catch {
      anonId = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    }
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.redirect(new URL("/app", req.url), 302);
  }

  const { data: link, error: lookupErr } = await supabase
    .from("affiliate_links")
    .select("id, listing_id, partner_code, affiliate_url, is_active")
    .eq("short_id", shortId)
    .maybeSingle<AffiliateLinkLookup>();

  if (lookupErr) {
    Sentry.captureException(lookupErr);
    return new NextResponse("Lookup failed", { status: 502 });
  }
  if (!link || !link.is_active) {
    return new NextResponse("Not found", { status: 404 });
  }

  const userAgent = req.headers.get("user-agent");
  const referer = req.headers.get("referer");

  const { error: insertErr } = await supabase.from("affiliate_clicks").insert({
    short_id: shortId,
    listing_id: link.listing_id,
    partner_code: link.partner_code,
    user_id: null,
    anon_id: anonId,
    user_agent: userAgent,
    referer: referer,
  });

  if (insertErr) {
    // Click tracking must never trap the visitor. Log and proceed.
    Sentry.captureException(insertErr);
  }

  const response = NextResponse.redirect(link.affiliate_url, 302);
  if (setCookie) {
    response.cookies.set({
      name: ANON_COOKIE,
      value: anonId,
      maxAge: ANON_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  }
  return response;
}
