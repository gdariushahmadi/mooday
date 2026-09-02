---
title: DANEG Luxury Resale Rebrand - Plan
date: 2026-08-17
type: feat
topic: daneg-luxury-resale-rebrand
artifact_contract: ce-unified-plan/v1
 artifact_readiness: implementation-ready
product_contract_source: client-directive
execution: code
---

# DANEG Luxury Resale Rebrand - Plan

## Goal Capsule

- **Objective:** Reposition the existing Mooday codebase as **DANEG** - a curated luxury resale platform for pre-loved designer fashion (Bags, Shoes, Clothing, Watches, Jewellery, Accessories) in like-new or excellent condition, with mandatory authenticity verification on premium brands, gender-inclusive copy, and a less intrusive install prompt. Solo dev, single delivery branch off the current `codex/phase-4-mock-mode-cleanup` branch.
- **Product authority:** This plan owns the front-end product contract: brand identity, taxonomy, listing data model, copy, and trust surfaces. It does **not** own the production backend delivery (already covered by `2026-08-16-0347-feat-mooday-beta-launch-plan.md`); backend wiring continues under that plan. New `Product` fields introduced here are added to the shared `Product` interface so the backend migration is a stub pending that plan's migrations.
- **Open blockers:** none blocking planning. Decisions deferred to ce-work: exact brand shortlist (Chanel/Dior/Hermes/Louis Vuitton/Celine/Gucci/Bottega Veneta/Prada/Chloe), and which photo library swaps ship in this plan vs. follow up.

## Product Contract

### Summary

DANEG is a curated, English + Arabic, peer-to-peer marketplace for pre-loved luxury designer fashion. Every listing must fall into one of six categories (Designer Bags, Designer Shoes, Designer Clothing, Watches, Jewellery, Accessories) and meet one of three condition tiers (New with Tags, Like New, Excellent Condition). Each listing carries the brand, original purchase date, number of times worn, original retail price, current sale price, and an authenticity badge tier. Trust surfaces (Verified Seller, Authenticity, Secure Payment) are the most prominent UI elements on every listing and on the landing page. Tone is gender-inclusive; the word "second-hand" is banned in user-facing copy in favour of "Pre-loved Luxury" / "Luxury Resale". The install prompt is a compact corner chip, not a centred modal-shaped banner.

### Key Decisions

- **KPD1. Brand identity is DANEG, not Mooday.** (client-directed) The deployment host `app.daneg.ae` already names DANEG; the visual identity, copy, and PWA manifest catch up. Mooday is not "deprecated" - it is renamed; the codebase wordmark, brand colour system, hero ghost word, and PWA name flip to DANEG. Governs R1, R2.
- **KPD2. Banned phrase: "second-hand".** (client-directed) All user-facing English copy replaces it with "pre-loved" or "luxury resale". Arabic copy uses "أزياء فاخرة محبوبة" or "إعادة بيع فاخر" - never "مستعملة" alone. A copy-review guard test fails the suite if the phrase slips back. Governs R3, R4.
- **KPD3. Conditions are restricted to three tiers.** (client-directed) `New with Tags / Like New / Excellent Condition`. The legacy `Gently Used` tier is removed from `CONDITIONS` and the search/filter UI; legacy mock data is re-bucketed into the three new tiers. No "Fair" or "Used" tier exists. Governs R5, R6.
- **KPD4. Listing data model gains `brandEn`, `brandAr`, `purchaseDate`, `usageCount`, `authenticityTier`.** (client-directed) Required fields on every new listing. `brandEn` and `brandAr` are first-class; `category` no longer implies brand. `purchaseDate` is an ISO date; `usageCount` is an integer. `authenticityTier` is `"verified" | "in_review" | "self_declared"`. Governs R7-R10.
- **KPD5. Authenticity is required for premium brands.** (client-directed) A `PREMIUM_BRANDS` set (initial: Chanel, Dior, Hermes, Louis Vuitton, Celine, Gucci, Bottega Veneta, Prada, Loewe, Chloe) forces `authenticityTier` to `"verified"` before publish. Other brands may use `"self_declared"`. The UI shows the tier as a badge: "Verified by DANEG" / "In review" / "Self-declared". Governs R8, R10.
- **KPD6. Categories collapse to six luxury lanes.** (client-directed) `Designer Bags / Designer Shoes / Designer Clothing / Watches / Jewellery / Accessories`. Dresses is folded into Designer Clothing; the legacy `Dresses` bucket is removed. Sub-category heuristic in `sub-categories.ts` is rewritten to use the new top-level categories. Governs R11, R12.
- **KPD7. Brand search is a first-class surface.** (client-directed) A new `BrandChips` row above the search results lets the user tap a brand name to filter. The search input supports brand-name tokens. The Discover feed gains a "Designers" tab that pivots on brand. Governs R13, R14.
- **KPD8. Gender copy is inclusive.** (client-directed) All "for women" copy is rewritten to be gender-neutral ("designer fashion", "pre-loved style", "your wardrobe"). The word "Women" in the brand tagline and footer is removed. Arabic copy uses gender-neutral formulations. Governs R15, R16.
- **KPD9. Trust surfaces get the loudest treatment.** (client-directed) Three trust chips (Verified Seller, Authenticity, Secure Payment) sit in a permanent band above the fold on every listing and are the second CTA cluster on the landing page after the primary hero CTA. The hero carries a trust sub-line. Governs R17, R18.
- **KPD10. Install prompt is a compact corner chip.** (client-directed) The current centred, 94vw-wide floating dialog is replaced by a `bottom-4 end-4` chip (max 240px wide, single row) that does not jump to 4-second delay and stays out of the safe area. Same 7-day dismissal cooldown. Landing prompt matches. Governs R19.

### Requirements

**Brand and identity**

- R1. The wordmark, PWA name, PWA short_name, manifest description, browser title, and meta description all show "DANEG" (English) and "دانِج" (Arabic) in place of "Mooday" / "موداي".
- R2. The landing page hero, footer, install prompt, manifest, and any "Mooday seller" attribution in mock data are re-branded to DANEG.

**Copy and tone**

- R3. No user-facing English string contains the phrase "second-hand" (case-insensitive, hyphen or space). The Arabic equivalent "مستعملة" / "مستعمل" is banned in marketing copy (allowed in a `descriptionEn`/`descriptionAr` listing body if a seller types it).
- R4. The brand tagline uses "Pre-loved Luxury" or "Luxury Resale" verbatim, in both English and Arabic.

**Conditions and data model**

- R5. The condition selector exposes exactly three values: `New with Tags`, `Like New`, `Excellent Condition`. The legacy `Gently Used` value is removed from `CONDITIONS` and from every listing's `conditionEn`/`conditionAr`.
- R6. Search and filter UI shows only the three new conditions. Selecting "All" or any of the three is the only valid filter state.
- R7. `Product` gains `brandEn: string`, `brandAr: string`, `purchaseDate: string (ISO date)`, `usageCount: number`, `authenticityTier: "verified" | "in_review" | "self_declared"`. All five are required on new listings and optional-but-defaulted on legacy listings.
- R8. A new module `src/data/premium-brands.ts` exports `PREMIUM_BRANDS: string[]` and `isPremiumBrand(name)`. The Sell/Edit listing form requires `authenticityTier = "verified"` (or blocks publish) for any listing whose brand is in the set.

**Categories and search**

- R9. The category list is `Designer Bags / Designer Shoes / Designer Clothing / Watches / Jewellery / Accessories`. `Dresses` is removed; `Bags`/`Shoes`/`Clothing`/`Accessories` are renamed.
- R10. `CATEGORIES` and `CATEGORIES_AR` in `src/data/categories.ts` are replaced; `SELL_CATEGORIES` and the Discover feed priority list follow.
- R11. `src/data/sub-categories.ts` is rewritten so each new top-level category has 3-6 sub-category rules. `deriveSubCategory` returns a meaningful sub-category for every new listing.
- R12. The Search filters view exposes a new "Brand" filter section. The Discover feed's "Designers" tab uses a brand pivot.
- R13. A new `BrandChips` component renders a horizontal row of brand chips (Chanel, Dior, Hermes, Louis Vuitton, Celine, Gucci, Bottega Veneta, Prada, Loewe, Chloe by default; admin-editable later) above the search results. Tapping a chip filters by that brand.
- R14. The search input parses brand-name tokens so typing "Chanel bag" or "Hermes Birkin" filters by brand + keyword.

**Trust and inclusivity**

- R15. All user-facing English copy that says "for women" or "women in the UAE" is rewritten to be gender-neutral. The footer tagline, the hero subtitle, the meta description, and the lifestyle section copy are reviewed line by line.
- R16. Arabic copy is reviewed by the same rule: gender-marked marketing copy is removed or replaced with neutral phrasing.
- R17. A new `TrustBadges` component renders the three trust chips (Verified Seller, Authenticity, Secure Payment) with material icons. The component is placed:
  - on `ProductDetailsView` directly under the price block, full-width row, sticky on scroll past the price;
  - on the landing page, second CTA cluster after the primary hero CTA, with the same three chips;
  - on the Public Seller Profile header.
- R18. The hero on the landing page carries a one-line trust sub-headline beneath the primary CTA (e.g. "Every piece authenticated. Every seller verified. Every payment secured.").

**Install prompt**

- R19. The `InstallPrompt` and `LandingInstallPrompt` components render a compact chip (max width 240px, single row, anchored to `bottom-4 end-4`, smaller icon) instead of a centred wide banner. The 7-day dismissal cooldown and 4-second show delay remain.

**Out of scope (explicit)**

- R20. The plan does not move off the existing brand colour palette (`#512443` and friends) - that is a separate design system work item.
- R21. The plan does not wire the new `Product` fields to the Supabase schema - that lands under the beta-launch plan's data migration.
- R22. The plan does not add admin tooling to manage the brand list or the authenticity queue; the brand list is hard-coded in `premium-brands.ts` for now.
- R23. The plan does not change the photo library - existing product images stay; a follow-up swaps the lifestyle/category imagery for luxury-flavoured assets.

### Acceptance Examples

- AE1. A new visitor opens the landing page in English, sees "DANEG" in the hero, the three trust chips immediately under the primary CTA, and a "Pre-loved Luxury" tagline. The word "second-hand" does not appear anywhere. Selecting "Designer Bags" in the category mosaic lands them on a category page where every tile shows the brand name, original price, and an authenticity badge. Covers R1, R2, R3, R4, R10, R17, R18.
- AE2. The visitor taps the "Chanel" brand chip on the search page. The results filter to listings whose `brandEn` is "Chanel". Each result tile shows the condition (one of three values), the brand, the original price, and the "Verified by DANEG" authenticity badge. Covers R5, R6, R7, R13, R17.
- AE3. A seller starts a new listing for a Chanel bag. The form requires brand, purchase date, usage count, original price, and current price. Selecting Chanel forces the authenticity tier to "Verified by DANEG"; the "Publish" button is disabled until the verification state is confirmed (mock-state for now). Covers R4, R7, R8, R11.
- AE4. The same visitor opens the page in Arabic. The hero, footer, manifest, and listing all read "دانِج" / "دانِج للأزياء الفاخرة المستعملة بحب" without any English fallback. The Arabic copy does not contain "نساء" or "للسيدات" in marketing contexts. Covers R1, R15, R16.
- AE5. A user dismisses the install prompt; it does not return for 7 days. When shown, the prompt is a 240px-wide chip in the bottom-right corner, not a centred banner. Covers R19.

### Key Flows

- F1. Discover a luxury piece
  - **Trigger:** A visitor lands on the home or category page.
  - **Steps:** Brand chips render above results. The user taps "Hermes". Results filter to Hermes listings. Each result shows brand, condition, original price, current price, authenticity tier.
  - **Outcome:** The user finds a luxury designer piece without typing a search.
- F2. Sell a luxury piece
  - **Trigger:** A user opens the Sell flow.
  - **Steps:** The form shows new required fields (brand, purchase date, usage count, original price, current price, authenticity tier). The form blocks publish for premium brands unless the authenticity tier is "verified".
  - **Outcome:** The listing enters the marketplace with the correct metadata.
- F3. Verify trust on a listing
  - **Trigger:** A buyer views a product detail page.
  - **Steps:** Below the price, the three trust chips render. Tapping "Authenticity" expands a card explaining the verification tier for the brand.
  - **Outcome:** The buyer trusts the listing enough to start checkout.

### Scope Boundaries

**Outside this plan**

- Backend wiring of new `Product` fields (covered by `2026-08-16-0347-feat-mooday-beta-launch-plan.md` U1-U20).
- Brand-aware PostgreSQL search (covered by that plan's KTD5).
- Rent mode (Phase 4).
- Seller KYC for premium-brand listings (deferred).
- Replacing the photo library with luxury-flavoured imagery.

**Deferred for later**

- Admin UI for managing the brand list and authentication queue.
- A real "Verified by DANEG" service tier with human review.
- Brand-aware personalised recommendations.

### Dependencies / Assumptions

- The product's Arabic + English bilingual copy system (`src/lib/i18n.ts`, the per-component `COPY` maps) is the canonical copy surface; this plan extends each map.
- The category heuristic in `src/data/sub-categories.ts` is local; rewriting it does not affect any other file outside the category landing flow.
- The `Product` interface in `src/context/AppContext.tsx` is the shared domain type; adding fields here is the source of truth for downstream mock-data updates and the future Supabase mapper.
- The install prompt localStorage key (`mooday.installPrompt.dismissedAt`) is shared between the app shell and the landing prompt; the key stays the same so the cooldown is honoured across both surfaces.
- The premium brand list is an opinionated initial set; it is hard-coded in `premium-brands.ts` and exported as a single source of truth.

### Outstanding Questions

- **Resolved at confirmation:** Brand shortlist (Chanel/Dior/Hermes/Louis Vuitton/Celine/Gucci/Bottega Veneta/Prada/Loewe/Chloe) - recorded as an explicit decision under KPD5.
- **Resolved at confirmation:** Trust chip copy (Verified Seller / Authenticity / Secure Payment) - confirmed by the client in the brief; recorded as an explicit decision under KPD9.
- **Resolved at confirmation:** The "Like New" condition replaces "Gently Used"; no fourth tier is added - confirmed by the client in the brief; recorded under KPD3.
- **Deferred to ce-work:** which lifestyle/category images swap out for luxury-flavoured assets in this delivery vs. follow up.

### How This Work Fits Together

<!-- ce-section: work-relationships -->

This plan owns the **front-end product contract** for the DANEG rebrand: brand identity, taxonomy, listing data model, copy, trust surfaces, and the install prompt. The surrounding work breaks down as:

- **Depends on:** the existing UI codebase under `src/`, the bilingual copy system, the existing `Product` type, the install-prompt localStorage key.
- **Enables:** the `2026-08-16-0347-feat-mooday-beta-launch-plan.md` plan can wire the new `Product` fields to the Supabase schema in its U1-U20 implementation; the brand list and tier concept is the source of truth.
- **Shares:** the `Product` type, the install-prompt localStorage key, the `COPY` map pattern with every other front-end view.
- **Can proceed independently of:** the beta-launch plan's backend wiring; this plan ships as a coherent front-end change with mock data.
- **Still to decide:** which images to swap in this delivery; whether to add a "Taschen" or "Vintage" sub-category.

### Sources / Research

- `docs/plans/2026-08-16-0347-feat-mooday-beta-launch-plan.md` - product context, data model, deployment target.
- `docs/ROADMAP.md` - Phase 1 scope.
- `src/components/landing/copy.ts` - bilingual copy system.
- `src/data/categories.ts` - existing category and condition taxonomy.
- `src/data/sub-categories.ts` - sub-category heuristic.
- `src/context/AppContext.tsx` - `Product` type, lines 71-105.
- `src/components/InstallPrompt.tsx` - existing install-prompt UI and cooldown key.
- `src/components/landing/LandingInstallPrompt.tsx` - landing-page install prompt.
- `src/components/ProductDetailsView.tsx` - price block, authenticity badge location, lines 320-340.
- `src/components/SearchFiltersView.tsx` - existing filter UI to extend with Brand section.
- `src/components/DiscoverFeedView.tsx` - existing feed tabs to extend with a Brand pivot.
- `src/components/listing/ListingForm.tsx` - existing sell form to extend with brand/usage/date/price fields.
- `public/manifest.json` - PWA manifest to rebrand.
- `public/sw.js` and `src/app/layout.tsx` - browser title and PWA registration.

## Planning Contract

**Product Contract preservation:** unchanged from requirements-only. The WHAT (R-IDs, A-IDs, F-IDs, AE-IDs) is preserved verbatim. This section adds the HOW.

### High-Level Technical Design

The codebase is a Next.js 16 (App Router) + React 19 + Tailwind 4 app. UI lives under `src/components/`, types in `src/context/AppContext.tsx`, data under `src/data/`, marketing under `src/components/landing/`. Bilingual copy is component-local `COPY` objects keyed by `"en" | "ar"` and the active language comes from `useApp().language`. The same pattern ships in `landing/copy.ts` for the marketing site. The install prompt is a fixed-position client component.

**Architecture for the rebrand:**

- **Identity layer:** a single `BRAND` constant module (`src/lib/brand.ts`) exports the wordmark, Arabic wordmark, and a `BRAND` object used by every surface (landing, install prompt, PWA manifest, `<title>`). The constant is the source of truth - the wordmark is never typed in two places.
- **Copy layer:** the existing `COPY` map pattern in each component extends with new keys (e.g. `preLoved`, `verifiedSeller`, `authenticity`, `securePayment`). Arabic parallel keys land in the same object. The landing page's `COPY` map in `src/components/landing/copy.ts` is updated to replace all "Mooday" / "موداي" / "second-hand" / "نساء" strings.
- **Data layer:** `Product` in `src/context/AppContext.tsx` gains the five new fields. `CATEGORIES`, `CONDITIONS`, and `CATEGORIES_AR` are replaced. `src/data/premium-brands.ts` is a new constant module. `src/data/sub-categories.ts` is rewritten with the new top-level categories.
- **Search layer:** `src/components/SearchFiltersView.tsx` gains a Brand section (chips) and a brand-name token parser in its `searchListings` helper. The Discover feed's `designers` tab pivots on `brandEn`.
- **Trust layer:** a new `src/components/TrustBadges.tsx` renders the three trust chips. It is mounted on `ProductDetailsView` under the price block, on the landing page hero, and on `PublicSellerProfile.tsx`.
- **Install prompt layer:** `src/components/InstallPrompt.tsx` and `src/components/landing/LandingInstallPrompt.tsx` shrink to a corner chip with the same cooldown and behaviour.

**Testing strategy:** the existing Vitest setup runs component tests; the plan adds:
- a `copyGuard.test.ts` that fails if banned phrases appear in `*.tsx` and `copy.ts`;
- a `premiumBrandGate.test.tsx` for the sell form's brand-gated publish logic;
- an extension to `ProductDetailsView.test.tsx` for the trust badges and the new `brandEn` rendering;
- an extension to `SearchFiltersView.test.tsx` for the brand chips.

### Key Technical Decisions

- **KTD1. Single `BRAND` constant module.** `src/lib/brand.ts` exports `BRAND` (English wordmark) and `BRAND_AR` (Arabic wordmark). Every component that types the wordmark imports from this module. (Governs U1, U19.)
- **KTD2. `Product` field additions are additive and defaulted.** New fields use `?:` for back-compat, with `backfillAttributes` in `src/data/seed-attributes.ts` filling them on legacy mock data. The shared `Product` type stays the source of truth; the Supabase mapper under `services/backend/mappers.ts` will mirror the shape later. (Governs U2, U3, U21.)
- **KTD3. `premium-brands.ts` is the single brand-policy module.** Exports `PREMIUM_BRANDS: string[]` and `isPremiumBrand(name: string): boolean`. The sell form, the brand chips, and the trust surface all read from it. (Governs U4, U8.)
- **KTD4. Brand search is a `brandEn` substring match.** Search filters narrow by `brandEn` exact match (chip) or substring (token). No fuzzy matching in v1. (Governs U9, U10.)
- **KTD5. Trust badges are a single component.** `TrustBadges` is the source of truth for the three chips' copy, icons, and layout. Marketing, listing, and seller profile each import it. (Governs U11, U12.)
- **KTD6. Install prompt keeps the same localStorage key.** The key stays `mooday.installPrompt.dismissedAt` so the cooldown state is shared across the app shell and landing prompt. The shape changes; the storage key does not. (Governs U13.)
- **KTD7. Copy-review guard test runs in `npm run test:ci`.** A Vitest unit scans `src/**/*.{ts,tsx}` and the landing `copy.ts` for banned phrases. CI fails if any are found. (Governs U14.)
- **KTD8. Categories and conditions are the only two product-taxonomy arrays.** `CATEGORIES` and `CONDITIONS` are removed-and-replaced; legacy types do not co-exist. (Governs U5, U6.)
- **KTD9. Sub-category heuristic is rewritten, not deprecated.** The existing `deriveSubCategory` continues to work but operates on the new six top-level categories. New keywords per category match the new copy. (Governs U7.)
- **KTD10. The rebrand ships as a single PR off the current branch.** No mid-stream renames; the changes are large but coherent. (Governs U22.)

### Sequencing Rationale

The order goes: identity first (so every other change uses the right wordmark), then data model (so screens that read `Product` can be updated against the new shape), then categories/conditions (so the new search/filter surfaces have the new taxonomy), then the trust badges (the highest-value UI element for the new brand), then the install prompt (the lowest-risk change). Each step is independently testable. The copy-review guard test (KTD7) lands early so the rest of the work cannot regress the banned-phrase rule.

## Implementation Units

### U1. Establish the brand constant module
- **Goal:** A single source of truth for the wordmark, PWA name, and brand metadata.
- **Requirements:** R1, R2.
- **Files:** `src/lib/brand.ts` (new).
- **Approach:** Export `BRAND = "DANEG"`, `BRAND_AR = "دانِج"`, `BRAND_TAGLINE_EN = "Pre-loved Luxury. Authenticated."`, `BRAND_TAGLINE_AR = "أزياء فاخرة محبوبة. معتمدة."`. Use ISO-compatible identifiers so a future `BRAND_LEGAL_NAME` can extend.
- **Test scenarios:** Module exports all four constants with the expected values. No other module redefines the wordmark.
- **Verification:** `npm run test:ci` passes the new `brand.test.ts`.

### U2. Add new fields to the `Product` type
- **Goal:** `Product` carries brand, purchase date, usage count, and authenticity tier.
- **Requirements:** R7.
- **Files:** `src/context/AppContext.tsx`, `src/data/seed-attributes.ts`.
- **Approach:** Extend the `Product` interface with `brandEn?: string`, `brandAr?: string`, `purchaseDate?: string`, `usageCount?: number`, `authenticityTier?: "verified" | "in_review" | "self_declared"`. Extend `backfillAttributes` in `seed-attributes.ts` to set sensible defaults on legacy mock data: brand inferred from the title (or a generic "Designer" for unbranded items), `purchaseDate` defaulted to 18 months ago, `usageCount` defaulted to 0, `authenticityTier` defaulted to `self_declared` (or `verified` for items already carrying `isAuthentic: true`).
- **Test scenarios:**
  - `Product` type accepts all five new fields.
  - `backfillAttributes` sets non-empty defaults on a legacy record missing the new fields.
  - A record with `isAuthentic: true` backfills to `authenticityTier: "verified"`.
- **Verification:** `npm run typecheck && npm run test:ci` passes the new `seed-attributes.test.ts` cases.

### U3. Backfill mock data with the new fields
- **Goal:** Every mock listing has brand, purchase date, usage count, and authenticity tier.
- **Requirements:** R7, R8.
- **Files:** `src/data/products.ts`, `src/data/products-batch2.ts`, `src/data/sellers.ts`.
- **Approach:** Run `backfillAttributes` over `SEED_VERSION` "4" to "5". Pick a plausible brand per listing (Chanel, Dior, Hermes, Louis Vuitton, Celine, Gucci, Bottega Veneta, Prada, Loewe, Chloe, or a generic designer name for the unbranded ones). Set `purchaseDate` between 6 and 36 months ago. Set `usageCount` between 0 and 8. Set `authenticityTier` to `"verified"` for items with `isAuthentic: true` and `"self_declared"` otherwise.
- **Test scenarios:**
  - Every listing in `products.ts` and `products-batch2.ts` has non-empty `brandEn` and `brandAr` after backfill.
  - Every premium-brand listing has `authenticityTier: "verified"`.
  - `purchaseDate` parses as a valid ISO date on every listing.
- **Verification:** Vitest snapshot in `data/products.test.ts` (new) confirms the count and shape.

### U4. Create the premium-brand module
- **Goal:** A single module exports the premium brand list and a helper.
- **Requirements:** R8.
- **Files:** `src/data/premium-brands.ts` (new), `src/data/premium-brands.test.ts` (new).
- **Approach:** Export `PREMIUM_BRANDS = ["Chanel", "Dior", "Hermes", "Louis Vuitton", "Celine", "Gucci", "Bottega Veneta", "Prada", "Loewe", "Chloe"]` and a parallel `PREMIUM_BRANDS_AR`. Export `isPremiumBrand(name: string): boolean` that normalises case and whitespace.
- **Test scenarios:**
  - `isPremiumBrand("chanel")` returns true; `isPremiumBrand("Uniqlo")` returns false.
  - The English and Arabic arrays have the same length.
- **Verification:** `npm run test:ci` passes the new test file.

### U5. Replace the conditions taxonomy
- **Goal:** Conditions are `New with Tags / Like New / Excellent Condition`.
- **Requirements:** R5, R6.
- **Files:** `src/data/categories.ts`, `src/data/products.ts`, `src/data/products-batch2.ts`.
- **Approach:** Replace `CONDITIONS` with the three new values. Add `CONDITIONS_AR` for them. Re-bucket every legacy `conditionEn: "Gently Used"` record to `conditionEn: "Like New"` in the seed data (or in `backfillAttributes`). Update the Search filter UI to render the three values.
- **Test scenarios:**
  - `CONDITIONS` has exactly three members.
  - `CONDITIONS_AR` has an entry for each.
  - No listing has `conditionEn: "Gently Used"`.
  - The search filter UI shows three radio options.
- **Verification:** `SearchFiltersView.test.tsx` shows the three options; `npm run typecheck` passes.

### U6. Replace the categories taxonomy
- **Goal:** Categories are `Designer Bags / Designer Shoes / Designer Clothing / Watches / Jewellery / Accessories`.
- **Requirements:** R9, R10.
- **Files:** `src/data/categories.ts`, `src/data/products.ts`, `src/data/products-batch2.ts`, `src/components/DiscoverFeedView.tsx`, `src/components/CategoryLandingView.tsx`, `src/components/landing/copy.ts`, `src/data/sub-categories.ts`.
- **Approach:** Replace `CATEGORIES` with the six new values. Replace `CATEGORIES_AR` with Arabic translations. Re-bucket every legacy listing with `category: "Dresses"` to `category: "Designer Clothing"`. Update the `CATEGORY_PRIORITY` array in `DiscoverFeedView.tsx` to use the new names. Update the landing page's category mosaic in `copy.ts`. Update `HERO_COPY_EN` and `HERO_COPY_AR` in `CategoryLandingView.tsx`.
- **Test scenarios:**
  - `CATEGORIES` has exactly six members.
  - No listing has `category: "Dresses"`.
  - The Discover feed's `CATEGORY_PRIORITY` lists the six new names.
  - The category mosaic in the landing page renders six tiles with the new names.
- **Verification:** `npm run test:ci` passes; the landing page renders without missing translations.

### U7. Rewrite the sub-category heuristic
- **Goal:** `deriveSubCategory` returns a meaningful sub-category for the six new top-level categories.
- **Requirements:** R11.
- **Files:** `src/data/sub-categories.ts`, `src/data/sub-categories.test.ts` (new).
- **Approach:** Replace `SUB_CATEGORY_RULES` with a new map keyed on the six new categories. Each category gets 3-6 keyword rules with English and Arabic labels. Examples: `Designer Bags` -> `Handbags / Totes / Clutches / Crossbody / Bucket / Backpacks`; `Watches` -> `Luxury Watches / Smart Watches`; `Jewellery` -> `Rings / Necklaces / Earrings / Bracelets`.
- **Test scenarios:** `deriveSubCategory("Designer Bags", "Tote bag with leather handles", "en")` returns "Totes". `deriveSubCategory("Watches", "Vintage Rolex Submariner", "en")` returns "Luxury Watches".
- **Verification:** New `sub-categories.test.ts` covers at least one case per top-level category.

### U8. Build the brand chips component
- **Goal:** A reusable chip row renders the premium brand list and triggers a filter callback.
- **Requirements:** R13.
- **Files:** `src/components/BrandChips.tsx` (new), `src/components/BrandChips.test.tsx` (new).
- **Approach:** Stateless client component. Props: `onSelect: (brand: string | null) => void`, `selected?: string | null`. Renders a horizontal scroll of pill buttons. The currently selected chip is filled; others are outlined. A "All brands" chip clears the filter. Bilingual labels via the same `COPY` map pattern.
- **Test scenarios:**
  - Renders one chip per `PREMIUM_BRANDS` entry.
  - Tapping a chip fires `onSelect` with the brand name.
  - Tapping the "All brands" chip fires `onSelect(null)`.
  - The selected chip carries the `aria-pressed="true"` attribute.
- **Verification:** `npm run test:ci` passes.

### U9. Add a brand filter to Search
- **Goal:** The Search view exposes the brand chips and filters results by brand.
- **Requirements:** R12, R13, R14.
- **Files:** `src/components/SearchFiltersView.tsx`, `src/components/SearchFiltersView.test.tsx`.
- **Approach:** Add `selectedBrand` to the URL state (key `brand`). Add the `BrandChips` component to the filters panel. In the filter results, narrow the listing set to those whose `brandEn` matches the selected brand. In the search input, parse brand tokens (first word in the query that matches a `PREMIUM_BRANDS` entry, case-insensitive) and use them as the brand filter. URL-sync the brand param.
- **Test scenarios:**
  - Selecting "Chanel" narrows results to Chanel listings.
  - Typing "Chanel bag" sets the brand filter and the keyword filter simultaneously.
  - Tapping "All brands" clears the filter; results re-expand.
  - The URL contains `?brand=Chanel` after selection.
- **Verification:** `SearchFiltersView.test.tsx` extends with the new cases.

### U10. Pivot the Discover "Designers" tab on brand
- **Goal:** The Discover feed's "Designers" tab is sorted/grouped by brand, with a brand chip row at the top.
- **Requirements:** R12, R13.
- **Files:** `src/components/DiscoverFeedView.tsx`, `src/components/DiscoverFeedView.test.tsx`.
- **Approach:** In the `designers` tab branch, group listings by `brandEn`. Show the `BrandChips` row above the grouped grid. Tapping a chip filters the grouped listings. The default state ("All brands") shows every listing grouped by brand.
- **Test scenarios:**
  - The Designers tab renders a brand chip row.
  - Tapping a brand chip narrows the grid to that brand.
  - An empty filter state shows a friendly empty message.
- **Verification:** `DiscoverFeedView.test.tsx` extends with the new cases.

### U11. Build the TrustBadges component
- **Goal:** A reusable component renders the three trust chips.
- **Requirements:** R17.
- **Files:** `src/components/TrustBadges.tsx` (new), `src/components/TrustBadges.test.tsx` (new).
- **Approach:** Three chips: "Verified Seller" (badge icon), "Authenticity" (verified_user icon), "Secure Payment" (lock icon). Each chip has a `label` and `aria-label`. The component accepts a `variant` prop: `inline` (small, in-line) or `block` (full row, larger). Bilingual labels via the `COPY` map.
- **Test scenarios:**
  - Renders three chips.
  - The `inline` variant uses the smaller font size; the `block` variant uses the larger.
  - The Arabic copy switches when `useApp().language === "ar"`.
- **Verification:** New test file passes.

### U12. Mount TrustBadges on the listing, landing, and seller profile
- **Goal:** The trust chips appear on every listing detail, the landing hero, and the public seller profile header.
- **Requirements:** R17, R18.
- **Files:** `src/components/ProductDetailsView.tsx`, `src/components/ProductDetailsView.test.tsx`, `src/components/landing/copy.ts`, `src/components/landing/Landing.tsx`, `src/components/PublicSellerProfile.tsx`, `src/components/PublicSellerProfile.test.tsx`.
- **Approach:** In `ProductDetailsView`, render `<TrustBadges variant="block" />` directly under the price block. On the landing page, render `<TrustBadges variant="inline" />` as the second CTA cluster, beneath the primary hero CTA. Add a hero sub-line "Every piece authenticated. Every seller verified. Every payment secured." On the public seller profile, render `<TrustBadges variant="inline" />` in the header.
- **Test scenarios:**
  - `ProductDetailsView` renders `TrustBadges` under the price block.
  - The landing page renders `TrustBadges` after the primary CTA.
  - The public seller profile renders `TrustBadges` in the header.
- **Verification:** Existing test files extend with the new assertions.

### U13. Shrink the install prompt to a corner chip
- **Goal:** The install prompt is a compact bottom-right chip, not a centred wide banner.
- **Requirements:** R19.
- **Files:** `src/components/InstallPrompt.tsx`, `src/components/landing/LandingInstallPrompt.tsx`, `src/components/InstallPrompt.test.tsx` (new), `src/components/landing/LandingInstallPrompt.test.tsx` (new).
- **Approach:** Replace the centred floating dialog with a fixed-position chip anchored `bottom-4 end-4`, max width 240px, single row with a small icon, brand mark, and "Install" button. Keep the 7-day localStorage cooldown. The dismissal button is a small "x" inside the chip. The landing prompt matches.
- **Test scenarios:**
  - The component renders with `class` containing `bottom-4 end-4` and a max-width class of 240px.
  - The dismissal button is visible alongside the install button.
  - The 7-day cooldown still applies.
- **Verification:** New test file passes; visual smoke test in the browser.

### U14. Add a copy-review guard test
- **Goal:** CI fails if any banned phrase appears in user-facing copy.
- **Requirements:** R3.
- **Files:** `tests/copyGuard.test.ts` (new), `src/lib/banned-phrases.ts` (new).
- **Approach:** Scan `src/**/*.{ts,tsx}` and `src/components/landing/copy.ts` for the English banned phrases (`second-hand`, `secondhand`, `second hand`) and the Arabic banned phrases (`مستعملة` in marketing contexts). Skip `*.test.tsx` and `*.test.ts`. The test lists each match with a file:line reference.
- **Test scenarios:**
  - Removing the phrase from a sample file produces a passing test; re-adding it produces a failing one.
  - The test gracefully handles files that import from a banned-phrase constant (skip those).
- **Verification:** `npm run test:ci` runs the new test.

### U15. Update the PWA manifest
- **Goal:** The manifest names DANEG, uses the new tagline, and shortens the description to be gender-neutral.
- **Requirements:** R1, R4, R15.
- **Files:** `public/manifest.json`.
- **Approach:** Replace `name`, `short_name`, `description`. Keep `id`, `start_url`, `theme_color`, `background_color`, icons. Replace any "Mooday" string in shortcuts' `name` / `description`. Replace `web+mooday` with `web+daneg` in protocol handlers.
- **Test scenarios:** The manifest parses; `name` contains "DANEG"; `description` does not contain "women" or "second-hand".
- **Verification:** `npm run build` succeeds and the manifest is reachable at `/manifest.json`.

### U16. Update the global layout and document title
- **Goal:** The browser title and meta description are DANEG; the wordmark in the layout is the new wordmark.
- **Requirements:** R1, R15.
- **Files:** `src/app/layout.tsx`, `src/components/WelcomeView.tsx`, `src/components/InstallPrompt.tsx`, `src/components/landing/Landing.tsx`, `src/components/landing/copy.ts`.
- **Approach:** Replace the hard-coded "Mooday" string in `layout.tsx` with `BRAND`. Update `metadata.title` and `metadata.description` to the DANEG tagline. Replace every "Mooday" / "موداي" / "M" in user-facing components with `BRAND` / `BRAND_AR` / `D`.
- **Test scenarios:**
  - The browser title contains "DANEG".
  - No rendered DOM node contains "Mooday" outside of the test fixtures.
  - The install prompt brand mark shows "D".
- **Verification:** `npm run test:ci` passes; visual smoke test.

### U17. Rewrite the marketing copy to remove gendered language
- **Goal:** All "for women" / "نساء" copy is removed or replaced.
- **Requirements:** R15, R16.
- **Files:** `src/components/landing/copy.ts`, `src/components/WelcomeView.tsx`, `src/components/landing/Landing.tsx`, `src/components/SignInView.tsx`, `src/components/SignUpView.tsx`.
- **Approach:** Line-by-line pass. English replacements: "for women" -> "" or "for the people who love them" / "for every collector" / "for the modern wardrobe". Arabic replacements: "للنساء" / "للسيدات" -> "" or "لكل من يعشق الفخامة". Update the `LandingInstallPrompt` copy. Update the `Landing` `metaTitle` / `metaDescription`.
- **Test scenarios:**
  - No "for women" string remains in `copy.ts`.
  - No "نساء" or "للسيدات" remains in Arabic copy.
  - The `WelcomeView` tagline is gender-neutral.
- **Verification:** The copy-guard test (U14) extends with a `نساء` check; manual review of the landing page.

### U18. Update the sell form for new required fields
- **Goal:** The sell form requires brand, purchase date, usage count, original price, current price, and an authenticity tier; premium brands gate publish on the verified tier.
- **Requirements:** R7, R8.
- **Files:** `src/components/listing/ListingForm.tsx`, `src/components/listing/ListingForm.test.tsx` (new), `src/components/listing/BrandAutocomplete.tsx` (new), `src/components/SellItemView.tsx`.
- **Approach:** Add new form fields. The brand field uses an autocomplete combobox that suggests premium brands first. The purchase date uses a native date input. The usage count uses a numeric stepper (0-50). The authenticity tier is a three-option radio: "Verified by DANEG" (only enabled for non-premium brands, and shown as the locked default for premium brands), "In review", "Self-declared". The "Publish" button is disabled for premium brands unless the tier is "verified" (mock-state: the user clicks a "Request verification" button to set the state). The form's `onSubmit` payload includes the new fields.
- **Test scenarios:**
  - The form blocks publish for a Chanel listing when the tier is "self-declared".
  - The form allows publish for a Chanel listing when the tier is "verified".
  - The form requires brand, purchase date, usage count, original price, and current price.
  - Selecting a brand from the autocomplete fills both `brandEn` and `brandAr`.
- **Verification:** New `ListingForm.test.tsx` and a smoke test of the sell flow.

### U19. Show the brand, usage count, and purchase date on product details
- **Goal:** The product detail page surfaces brand, usage count, purchase date, original price, and current price.
- **Requirements:** R7.
- **Files:** `src/components/ProductDetailsView.tsx`, `src/components/ProductDetailsView.test.tsx`.
- **Approach:** Add a "Provenance" section between the description and the seller card. The section renders the brand, "Worn N times", "Owned since <date>". The price block stays the same.
- **Test scenarios:**
  - The Provenance section renders when the listing has the new fields.
  - "Worn 0 times" renders when `usageCount` is 0.
  - The owned-since date formats as "Month YYYY".
- **Verification:** New test cases in `ProductDetailsView.test.tsx`.

### U20. Render the authenticity tier as a badge on the listing
- **Goal:** The product detail page shows the authenticity tier as a badge with explanatory text.
- **Requirements:** R8.
- **Files:** `src/components/ProductDetailsView.tsx`, `src/components/ProductDetailsView.test.tsx`.
- **Approach:** Replace the existing `product.isAuthentic` boolean badge with a tier-aware `AuthenticityBadge` component. The badge uses the brand colour for "verified", a muted tone for "in_review", and a subtle outline for "self_declared". Tapping the badge expands a card explaining the tier.
- **Test scenarios:**
  - A "verified" listing shows the brand-colour badge.
  - An "in_review" listing shows the muted badge.
  - A "self_declared" listing shows the outline badge.
  - Tapping the badge expands the explanation.
- **Verification:** New test cases in `ProductDetailsView.test.tsx`.

### U21. Update the Supabase mapper stub
- **Goal:** The shared `Product` type and the future Supabase mapper include the new fields.
- **Requirements:** R7.
- **Files:** `src/services/backend/mappers.ts`, `src/services/backend/mappers-orders.ts`.
- **Approach:** Update the `mapProductFromRemote` and `mapProductToRemote` helpers to include the new fields. Default them to `undefined` for backward compatibility. This is a stub; the actual Supabase schema lands under the beta-launch plan.
- **Test scenarios:**
  - `mapProductFromRemote` reads the new fields when present.
  - `mapProductToRemote` writes the new fields when present.
  - The mapper does not throw on legacy records without the new fields.
- **Verification:** New test cases in `mappers.test.ts`.

### U22. End-to-end smoke test
- **Goal:** The full rebrand is verified by an automated Playwright test.
- **Requirements:** R1-R19.
- **Files:** `tests/e2e/daneg-rebrand.spec.ts` (new).
- **Approach:** Playwright opens the landing page in English, asserts the wordmark is "DANEG", asserts the three trust chips are visible, asserts no "second-hand" string is present, clicks the "Chanel" brand chip, asserts the results filter. Then opens the product detail page, asserts the brand, condition, and authenticity badge render. Then opens the sell form, asserts the brand autocomplete and the new fields. Captures screenshots.
- **Test scenarios:**
  - Landing page renders DANEG wordmark, no banned phrases, three trust chips.
  - Brand chip filters results.
  - Product details show brand, condition, provenance, and authenticity badge.
  - Sell form requires the new fields.
  - Install prompt is the small chip variant.
- **Verification:** `npm run test:e2e` passes.

## Verification Contract

Each implementation unit above carries its own `Test scenarios` block. The cross-unit checks:

- **VC1. `npm run typecheck` passes.** All TypeScript types resolve; the new `Product` fields are present in the shared type and the mappers.
- **VC2. `npm run lint` passes.** No new lint warnings; banned-phrase file scan (U14) is a separate Vitest and is part of `npm run test:ci`.
- **VC3. `npm run test:ci` passes.** All existing tests + the new tests in U1-U14, U18-U21.
- **VC4. `npm run build` succeeds.** The production build completes; the new `manifest.json` is reachable at `/manifest.json`; the browser title contains "DANEG".
- **VC5. `npm run test:e2e` passes.** The Playwright smoke test (U22) covers the full user journey.
- **VC6. Visual smoke test.** Open the app in a browser; verify the landing page, the brand chips, the product details, and the install prompt match the spec.

## Risks and Open Questions

- **R-Risk-1: Image library does not match the luxury copy.** The existing product photos are mid-market; the new copy calls them "luxury". The client accepted that the photo library is out of scope for this plan (R23). The implementation keeps the photos as-is and the user can swap them later.
- **R-Risk-2: Backfilled brand names may not match the photos.** The seed data backfill may label a Hermes-shaped bag as "Chanel". Mitigation: the test in U3 asserts that every listing has a brand but does not assert photo-brand alignment; a follow-up data audit handles the mismatch.
- **R-Risk-3: Search filter UI change may regress existing users' saved filter URLs.** The new brand param is additive; old filter URLs without a brand param still work. Mitigation: the URL-sync helper is backward-compatible.
- **R-Risk-4: Premium-brand gate is a hard publish blocker.** A user listing a Chanel bag without verification cannot publish. The gate is intentional (KPD5) but a future iteration may soften it to a "Request verification" flow.
- **R-Risk-5: The brand shortlist is opinionated.** Adding/removing a brand requires a code change until the admin tooling (deferred) lands.
- **R-Question-1:** Which lifestyle/category images to swap in this delivery? Deferred to ce-work.
- **R-Question-2:** Should the brand gate apply to the resale-from-purchase flow (C-16 My Purchases) or only to the from-scratch sell flow? Default: only from-scratch; resell-from-purchase keeps the existing path.

## Definition of Done

All of the following are true:

- **DoD-1.** `src/lib/brand.ts` exists and exports `BRAND`, `BRAND_AR`, `BRAND_TAGLINE_EN`, `BRAND_TAGLINE_AR`.
- **DoD-2.** Every "Mooday" / "موداي" reference in the user-facing UI is replaced with `BRAND` / `BRAND_AR`. The PWA manifest, browser title, and meta description are DANEG.
- **DoD-3.** No user-facing English string contains "second-hand", "secondhand", or "second hand" in any case. No user-facing Arabic marketing string contains "نساء" or "للسيدات".
- **DoD-4.** `CATEGORIES` is `["All", "Designer Bags", "Designer Shoes", "Designer Clothing", "Watches", "Jewellery", "Accessories"]`. `CONDITIONS` is `["All", "New with Tags", "Like New", "Excellent Condition"]`. Both have parallel `CONDITIONS_AR` / `CATEGORIES_AR` entries.
- **DoD-5.** `Product` carries `brandEn`, `brandAr`, `purchaseDate`, `usageCount`, `authenticityTier`. Legacy mock data is backfilled. The sell form requires the new fields.
- **DoD-6.** The premium-brand list is in `src/data/premium-brands.ts` and used by the sell form, the brand chips, and the trust surface. A premium-brand listing cannot publish without the "verified" tier (mock state).
- **DoD-7.** The Discover feed's "Designers" tab and the Search view show a `BrandChips` row; tapping a chip filters the results. The search input parses brand tokens.
- **DoD-8.** A new `TrustBadges` component renders the three chips (Verified Seller, Authenticity, Secure Payment) and is mounted on the product detail page, the landing page hero, and the public seller profile header.
- **DoD-9.** The install prompt is a compact bottom-right chip (max 240px wide) anchored `bottom-4 end-4`. The 7-day localStorage cooldown still applies. The landing prompt matches.
- **DoD-10.** A copy-review guard test (U14) runs in `npm run test:ci` and fails on banned phrases. A Vitest test file for the new `Product` fields, the brand module, the sub-category heuristic, the brand chips, the trust badges, the install prompt, the listing form, and the mappers all pass.
- **DoD-11.** A Playwright end-to-end test (U22) covers the landing page, the brand chip flow, the product details, the sell form, and the install prompt.
- **DoD-12.** `npm run typecheck && npm run lint && npm run test:ci && npm run build && npm run test:e2e` all pass.

## Appendix: File Reference Index

- `src/lib/brand.ts` (new) - BRAND constant module.
- `src/lib/banned-phrases.ts` (new) - copy-review guard.
- `src/context/AppContext.tsx` - `Product` type extension.
- `src/data/categories.ts` - CATEGORIES, CONDITIONS, CONDITIONS_AR.
- `src/data/premium-brands.ts` (new) - premium brand list and helper.
- `src/data/seed-attributes.ts` - backfill for new fields.
- `src/data/products.ts`, `src/data/products-batch2.ts` - mock data backfill.
- `src/data/sub-categories.ts` - sub-category heuristic rewrite.
- `src/components/BrandChips.tsx` (new) - brand chip row.
- `src/components/TrustBadges.tsx` (new) - three trust chips.
- `src/components/AuthenticityBadge.tsx` (new) - tier-aware badge.
- `src/components/listing/BrandAutocomplete.tsx` (new) - brand combobox.
- `src/components/InstallPrompt.tsx`, `src/components/landing/LandingInstallPrompt.tsx` - chip variant.
- `src/components/ProductDetailsView.tsx` - TrustBadges, Provenance, AuthenticityBadge.
- `src/components/DiscoverFeedView.tsx` - Designers tab + BrandChips.
- `src/components/SearchFiltersView.tsx` - brand filter + token parsing.
- `src/components/CategoryLandingView.tsx` - HERO_COPY for new categories.
- `src/components/landing/copy.ts` - all bilingual copy.
- `src/components/landing/Landing.tsx` - wordmark, trust chips.
- `src/components/WelcomeView.tsx` - wordmark, tagline, gender-neutral copy.
- `src/components/listing/ListingForm.tsx` - new required fields, premium-brand gate.
- `src/components/SellItemView.tsx` - pass-through to ListingForm.
- `src/components/PublicSellerProfile.tsx` - TrustBadges in header.
- `src/components/SignInView.tsx`, `src/components/SignUpView.tsx` - gender-neutral copy.
- `src/services/backend/mappers.ts`, `src/services/backend/mappers-orders.ts` - mapper stubs.
- `public/manifest.json` - PWA manifest.
- `src/app/layout.tsx` - browser title and metadata.
- `tests/copyGuard.test.ts` (new) - copy-review guard.
- `tests/e2e/daneg-rebrand.spec.ts` (new) - end-to-end smoke.

## Appendix: Implementation Order

1. **U1, U15, U16** - Identity layer. Land the wordmark and manifest first so every other change uses the right string.
2. **U2, U3, U21** - Data model. Extend `Product` and backfill the mock data.
3. **U4, U5, U6, U7** - Taxonomy. Replace categories and conditions, rewrite sub-categories.
4. **U11, U12** - Trust surface. The highest-value UI element for the new brand.
5. **U8, U9, U10** - Search and discovery.
6. **U18, U19, U20** - Product details and sell form.
7. **U13** - Install prompt.
8. **U14, U17** - Copy-review guard and gender-neutral copy pass.
9. **U22** - End-to-end smoke.
