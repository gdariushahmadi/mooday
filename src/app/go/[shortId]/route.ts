/**
 * Public outbound affiliate redirect.
 *
 * The browser never receives the partner URL from a public query string.
 * It receives a short, opaque path. The route records the click and then
 * redirects the visitor to the configured HTTPS destination.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import {
  getMockAffiliateLink,
  recordMockAffiliateClick,
} from "@/services/affiliate/mockAffiliateService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANON_COOKIE = "m_aff_anon";
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

interface AffiliateLinkLookup {
  listing_id: string;
  partner_code: string;
  affiliate_url: string;
  is_active: boolean;
}

function isSafeDestination(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Affiliate redirect requires the Supabase service-role configuration.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function validAnonId(value: string | undefined): string | null {
  if (!value || !/^[0-9a-fA-F-]{8,64}$/.test(value)) return null;
  return value;
}

function addAnonCookie(
  response: NextResponse,
  anonId: string,
  shouldSet: boolean,
): NextResponse {
  if (shouldSet) {
    response.cookies.set({
      name: ANON_COOKIE,
      value: anonId,
      maxAge: ANON_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await ctx.params;
  if (!shortId || !/^[A-Za-z0-9]{4,16}$/.test(shortId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const cookieValue = req.cookies.get(ANON_COOKIE)?.value;
  let anonId = validAnonId(cookieValue);
  const shouldSetCookie = !anonId;
  if (!anonId) {
    try {
      anonId = crypto.randomUUID();
    } catch {
      anonId = "anon-" + Date.now().toString(36);
    }
  }

  if (process.env.NEXT_PUBLIC_DATA_SOURCE !== "supabase") {
    const link = getMockAffiliateLink(shortId);
    if (!link || !isSafeDestination(link.affiliateUrl)) {
      return new NextResponse("Not found", { status: 404 });
    }
    recordMockAffiliateClick(shortId);
    return addAnonCookie(
      NextResponse.redirect(link.affiliateUrl, 302),
      anonId,
      shouldSetCookie,
    );
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.redirect(new URL("/app", req.url), 302);
  }

  const { data: link, error: lookupError } = await supabase
    .from("affiliate_links")
    .select("listing_id, partner_code, affiliate_url, is_active")
    .eq("short_id", shortId)
    .maybeSingle<AffiliateLinkLookup>();

  if (lookupError) {
    Sentry.captureException(lookupError);
    return new NextResponse("Lookup failed", { status: 502 });
  }
  if (
    !link ||
    !link.is_active ||
    !isSafeDestination(link.affiliate_url)
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { error: insertError } = await supabase
    .from("affiliate_clicks")
    .insert({
      short_id: shortId,
      listing_id: link.listing_id,
      partner_code: link.partner_code,
      user_id: null,
      anon_id: anonId,
      user_agent: req.headers.get("user-agent"),
      referer: req.headers.get("referer"),
    });
  if (insertError) {
    // Analytics must never stop the visitor from reaching the partner.
    Sentry.captureException(insertError);
  }

  return addAnonCookie(
    NextResponse.redirect(link.affiliate_url, 302),
    anonId,
    shouldSetCookie,
  );
}
