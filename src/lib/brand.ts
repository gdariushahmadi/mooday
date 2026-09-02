/**
 * Brand identity constants for DANEG.
 *
 * This is the single source of truth for the wordmark, PWA name,
 * taglines, and legal name. Every surface that types the brand
 * (landing page, install prompt, PWA manifest, browser title,
 * footer, wordmark badge) imports from here.
 *
 * Renamed from Mooday to DANEG in 2026-08. The constant names are
 * stable so call-sites do not need to change.
 */

export const BRAND = "DANEG";

export const BRAND_AR = "دانق";

export const BRAND_TAGLINE_EN = "Pre-loved Luxury. Authenticated.";

export const BRAND_TAGLINE_AR = "أزياء فاخرة محبوبة. معتمدة.";

/** Single-letter monogram used in tight spaces (install prompt badge,
 *  loading state, brand mark in compact contexts). */
export const BRAND_MONOGRAM = "D";

/** Domain used for the `web+daneg` protocol handler and share targets. */
export const BRAND_PROTOCOL = "web+daneg";
