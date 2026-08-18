---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-brainstorm
execution: code
title: Outbound Affiliate Monetization
date: 2026-08-18
---

# Outbound Affiliate Monetization - Plan

## Goal Capsule

Add a publisher-side affiliate monetization feature so the marketplace
owner can embed outbound affiliate links (Amazon Associates, Noon
Affiliates, future partners) into mooday, track click-throughs, and
earn commission from the partner programs when mooday users buy on
those external sites.

The first user-visible surface is an "Also buy new at" card on each
listing detail page when an admin has attached an affiliate link to
that listing. Clicks go through a server-side `/go/[shortId]` route
that logs the click and 302-redirects to the partner URL. Admin can
manage partners and per-listing links from a new admin tab, and view
click reporting.

Authority hierarchy: this plan does not change any existing Phase 1-4
behavior. It adds three tables, two services, one server route, one
admin tab, and one detail-page component. It does not touch payment
flow, order attribution, seller payouts, or any existing RLS policy.

Stop conditions: (a) `npm run verify` is green on the implementation
branch; (b) admin can create a partner, attach a link to a listing,
and view click counts; (c) a logged-out visitor clicking the
"Also buy new" card lands on the partner URL within 1 RTT and a row
appears in `affiliate_clicks`.

## Product Contract

### Requirements

- R1. Admin can create a `partner` row with `code`, `name`,
  `logoUrl`, `baseUrlTemplate` (nullable), `isActive`, `displayOrder`.
  `code` is unique and stable. Covers PR1.
- R2. Admin can attach an `affiliate_link` row to any listing
  referencing a partner, with a fully-formed `affiliateUrl`.
  The link has a short URL-safe `shortId` (8 chars, base62) used
  in `/go/[shortId]`. Covers PR1.
- R3. Server route `GET /go/[shortId]` looks up the link, inserts a
  row into `affiliate_clicks`, and 302-redirects to the resolved
  partner URL. Lookup miss returns 404. Covers PR2.
- R4. The redirect route records `partnerCode`, `listingId`,
  `userId` (nullable, derived from Supabase session cookie when
  present), `anonId` (read-or-create from `m_aff_anon` first-party
  cookie, 1-year lifetime), `userAgent`, `referer`, `clickedAt`.
  Covers PR2 + PR3.
- R5. The detail page renders an "Also buy new" card below the
  price block IFF the listing has at least one active
  `affiliate_link`. Card lists each partner with its logo and a CTA
  that opens the partner URL in a new tab via the `/go/[shortId]`
  redirect. Card is hidden entirely when no link exists. Covers PR4.
- R6. Admin gets a new "Affiliate Links" tab in `/admin` with
  three sub-views: Partners (CRUD), Links (CRUD with listing
  picker), Reports (clicks per partner / per listing for last 30d).
  Covers PR5.
- R7. All new tables have RLS: `partners` and `affiliate_links`
  are world-readable (`select` for `anon` + `authenticated`);
  `insert`/`update`/`delete` for `authenticated` is gated by an
  `is_admin()` SQL function (Phase 3.5 admin boundary) so the table
  is admin-only for writes. `affiliate_clicks` allows `insert` for
  `anon` + `authenticated` (the redirect needs to log even when
  logged out) but `select` is restricted to admins. Covers PR6.
- R8. No service-role Supabase key is required for any user-facing
  flow; all writes use the authenticated user's JWT and pass through
  RLS. The reporting view uses the authenticated admin client.
  The single server-side service-role use is the `/go/[shortId]`
  redirect handler (see KTD3); this is documented and audited.
  Covers PR6.
- R9. Reports aggregate `affiliate_clicks` over the last 30 days,
  grouped by partner and by listing. CTR is deferred (see KTD5).
  Covers PR5.
- R10. Mock mode (`NEXT_PUBLIC_DATA_SOURCE=mock`) renders the
  detail-page card using mock partner/link data and the redirect
  route short-circuits to the partner URL without a DB write.
  Phase 1 mock-mode discipline: never break the demo path.

### Out of scope

- External partner APIs (Amazon Product Advertising API, Noon
  Affiliate API, auto-fetch of product metadata) - manual admin
  entry only for v1. KTD1.
- Per-product price syncing - admin enters the new-product price
  text manually if they want it shown; auto-pull is v2.
- Conversion / sale tracking on partner side - mooday only logs
  click-throughs. Commission calculation lives in the partner program
  (Amazon Associates dashboard, etc.).
- Affiliate disclosure / FTC / UAE NMC compliance copy - owner
  adds disclosure text to listings manually if needed; not built
  into the card UI.
- Coupon / promo code affixing - links only; no promo code
  display in v1.
- Multi-publisher / external affiliate onboarding - single
  publisher (the owner) for v1. Schema is extensible; UI is owner-only.
- A/B testing of CTA copy or card placement - owner can iterate
  by editing the component if needed.

### Acceptance Examples

- AE1. Admin visits `/admin` -> "Affiliate Links" tab -> creates
  partner `amazon-ae` with name "Amazon UAE" and logo URL.
  Partner appears in the partners list.
- AE2. Admin attaches `affiliate_links` row to listing `L1` with
  partner `amazon-ae` and `affiliateUrl =
  https://www.amazon.ae/dp/B0XYZ12345?tag=mooday-21`. The row's
  `shortId` is auto-generated as 8-char base62.
- AE3. A logged-out visitor opens `/app/listings/L1` and sees an
  "Also buy new at Amazon UAE" card under the price. Clicking it
  navigates to `https://mooday.ae/go/{shortId}` -> 302 to Amazon ->
  one row in `affiliate_clicks` with `userId = null`, `anonId = <uuid>`,
  `partnerCode = 'amazon-ae'`, `listingId = L1`. The `m_aff_anon`
  cookie is set on the response.
- AE4. The same visitor clicks the card on a second listing
  within the session. Both clicks share the same `anonId`. A third
  click after the cookie expires (or in a different browser) gets
  a new `anonId`.
- AE5. A logged-in admin can also click the card. The click row
  carries `userId = <admin uuid>` AND `anonId` (cookie-backed) so
  both authenticated and anonymous attribution survive in the same row.
- AE6. Admin opens Reports sub-view. Shows: total clicks per
  partner for the last 30 days; top-10 listings by clicks.
  Numbers match the raw `affiliate_clicks` table.
- AE7. A non-admin authenticated user attempting to insert a
  partner row directly via Supabase receives an RLS denial. Audit:
  pgTAP test `phase_5_partners_rls.sql` covers the four roles.
- AE8. With `NEXT_PUBLIC_DATA_SOURCE=mock`, the detail page shows
  mock partner cards; the `/go/[shortId]` route returns a 302 to the
  mock partner URL without writing to any DB.

### Key Decisions (Product)

- KD1. (session-settled: user-directed - chosen over multi-affiliate
  platform with public onboarding: scope to a single publisher, the
  owner, for v1) Direction = outbound affiliate / publisher
  monetization. Mooday acts as the publisher for external partner
  programs; mooday does not run its own attribution against mooday
  orders.
- KD2. (session-settled: user-directed - chosen over dedicated
  Deals tab: highest user-intent moment is listing detail)
  Placement = "Also buy new at" card on listing detail. Defers deals
  tab and search-fallback to v2.
- KD3. (session-settled: user-directed - chosen over API
  integration: MVP scope, manual admin entry covers the use case)
  Link entry = manual admin via the admin tab. No partner-side
  product API integration in v1.
- KD4. (session-settled: user-approved - recommended default;
  user did not push back) Partner scope = Amazon + Noon for v1, with
  a generic `partners` registry so additional partners are
  data-only additions (no schema or code change).
- KD5. Click attribution lives in mooday-side log only. Commission
  calculation is the partner program's responsibility. Reporting
  shows clicks and top partners by clicks; it does not show
  attributed revenue.

## Planning Contract

### Key Technical Decisions

- KTD1. New tables: `partners`, `affiliate_links`,
  `affiliate_clicks`. The first two are world-readable; writes are
  gated by an `is_admin()` SQL function (existing Phase 3.5 admin
  boundary). `affiliate_clicks` allows `insert` from anon +
  authenticated (the redirect must work for logged-out users) but
  `select` is admin-only.
- KTD2. `affiliate_links.short_id` is an 8-character base62
  column generated server-side by a default expression on insert
  (`substr(regexp_replace(encode(gen_random_bytes(7), 'base64'),
  '[^A-Za-z0-9]', '', 'g'), 1, 8)`). A unique index on `short_id`
  enforces uniqueness. The application layer wraps the insert in a
  retry-on-collision loop (rare). SQL-side UNIQUE handles the final
  guardrail.
- KTD3. The `/go/[shortId]` route is implemented as a Next.js
  route handler at `src/app/go/[shortId]/route.ts` with
  `runtime = 'nodejs'` (so it can read cookies and write to
  Supabase) and `dynamic = 'force-dynamic'`. The handler:
  (1) reads `m_aff_anon` cookie or generates a UUIDv4 and sets it
  with `Max-Age=31536000; Path=/; SameSite=Lax`;
  (2) resolves `shortId` -> `affiliate_links` row via Supabase
  service-role client (the redirect is server-side and not
  authenticated; this is one of the few legitimate service-role
  uses and is logged in the audit);
  (3) inserts an `affiliate_clicks` row via the service-role client;
  (4) returns `NextResponse.redirect(targetUrl, 302)`.
  The service-role use is documented in `docs/affiliate-security.md`
  as one of three sanctioned uses: webhook signature verification,
  this click logger, and any future server-side cron.
- KTD4. The "Also buy new" card is a new component
  `AffiliatePartnersCard` mounted in `ProductDetailsView` (the
  detail-page component) below the price block, gated on
  `links.length > 0`. Card calls
  `phase2Backend.affiliateLinks.listLinksForListing(listingId)` on
  mount. Card renders one button per partner; each button is an
  `<a target="_blank" rel="noopener noreferrer nofollow"
 href="/go/{shortId}">` - the `nofollow` is a SEO signal that mooday
  does not endorse the partner; the new tab keeps the user in
  mooday for follow-up actions.
- KTD5. CTR denominator: mooday does not currently track per-listing
  view counts in a queryable form. For v1, the reports view shows
  clicks per partner and clicks per listing without CTR, and CTR
  is flagged as a known gap to be added once a per-listing view
  counter lands. Reporting does not surface CTR as a column at all
  in v1.
- KTD6. Two new services: `AffiliateLinkService` and
  `AffiliateClickService`. Both follow the existing
  `contracts.ts` -> `mappers-affiliate.ts` -> `supabase.ts` pattern
  used by Phase 3/4 services. Both have mock implementations in
  `mock-helpers.ts` so the Phase 1 demo keeps working.
  `AffiliateClickService` exposes only `recordClick(input)` (used by
  the server route) and `aggregateForReports(range)` (used by the
  admin reporting view). It does not expose a public `list`.
- KTD7. Admin tab is mounted via a new entry in `AdminTabs`
  (`Affiliate`). It is reachable from the admin sidebar alongside
  the existing eight tabs (Overview, Listings, Orders, Users,
  Disputes, Reports, Broadcast, Audit Log). It is not scoped by
  `NEXT_PUBLIC_DATA_SOURCE=mock` because admin is Supabase-only in
  production.
- KTD8. Cookie consent: the `m_aff_anon` cookie is a first-party
  analytics cookie. We document its purpose in the privacy notice
  (out of scope to update the privacy notice itself in this plan,
  but the cookie is flagged in the implementation as
  "analytics-adjacent"). GDPR / UAE PDPL compliance is the owner's
  responsibility; the technical surface stays minimal (single UUID,
  no PII).
- KTD9. Anon ID rotation: cookie is set for 1 year; the route
  reads it on every click and falls back to "no anon id" if the
  cookie is missing or malformed. No rotation strategy beyond expiry
  is needed for v1 - the dataset is anonymous by construction.

### High-Level Design

```
+-------------------------------------------+
|                Admin (/admin)             |
|  +----------+ +----------+ +-----------+  |
|  | Partners | |  Links   | |  Reports  |  |
|  | (CRUD)   | | (CRUD    | | (clicks / |  |
|  |          | |  per     | |  partner/ |  |
|  |          | |  listing)| |  listing, |  |
|  |          | |          | |  last 30d)|  |
|  +----------+ +----------+ +-----------+  |
+-------------------+-----------------------+
                    | writes
                    v
            +----------------------+
            | partners /           |
            | affiliate_links      |
            | (RLS: admin writes)  |
            +----------------------+

+-------------------------------------------+
|       Listing Detail (ProductDetailsView) |
|                                           |
|  Title / photos / price / condition       |
|  ----------------------------------       |
|  +-------------------------------------+  |
|  | "Also buy new at"                   |  |
|  | [Logo] Amazon UAE -> /go/{shortId}  |  |
|  | [Logo] Noon UAE   -> /go/{shortId}  |  |
|  +-------------------------------------+  |
|  Description / seller / reviews           |
+-------------------+-----------------------+
                    | user click
                    v
            +----------------------+
            | /go/[shortId]        |
            | (Node route handler) |
            |  1. read/set cookie  |
            |  2. resolve shortId  |
            |  3. INSERT click row |
            |  4. 302 -> partner   |
            +----------------------+
                    |
                    v
            +----------------------+
            |  affiliate_clicks    |
            |  (RLS: admin SELECT, |
            |   anon+auth INSERT)  |
            +----------------------+
```

### Assumptions

- The existing `is_admin()` SQL function (introduced in Phase 3.5 for
  admin RLS) is reusable. Verified by inspection of
  `phase_3_5_admin_rls.sql`.
- The existing admin tab scaffold (`AdminSidebar` + `AdminTopbar`)
  accepts a new tab without structural changes. Verified by reading
  `AdminTabs` in `src/components/admin/AdminTypes.ts`.
- `ProductDetailsView` is the listing-detail page; the price block
  sits between the media carousel and the description. Verified by
  reading `src/components/ProductDetailsView.tsx` end-to-end.
- `npm run test:phase2:smoke` does not need a new assertion for the
  affiliate flow; that smoke test covers cross-domain auth/listing/
  order assertions only. The new flow is covered by a dedicated
  Playwright test (U8).
- `NEXT_PUBLIC_DATA_SOURCE=mock` is the only mode that exercises the
  mock path. Owner runs Supabase-only in production; the mock is a
  Phase 1 demo affordance that must keep working.

### Implementation Constraints

- Do not change any existing service contract outside of the two new
  services. No edits to `AuthService`, `ListingService`,
  `OrderService`, etc.
- Do not add new dependencies. `nanoid`-style IDs are generated
  in-SQL via `gen_random_bytes`. UUIDs use the existing
  `crypto.randomUUID()` in the route handler.
- Do not touch payment / Stripe / webhook code.
- The `/go/[shortId]` route is one of three sanctioned server-side
  uses of the service-role key (others: Stripe webhook signature
  verification, future cron). Any other service-role use is out of
  scope and must be flagged in code review.
- The "Also buy new" card must not show for listings that have no
  affiliate links - a placeholder card with no partner is worse
  than no card.

### Sequencing

Linear, with the data layer first:

1. U1 - migrations + RLS + pgTAP (data foundation; everything
   downstream depends on it).
2. U2 - service contracts + types in `contracts.ts`.
3. U3 - mappers + Supabase adapter + mock implementations.
4. U4 - AppContext wiring (`Phase2Backend` exposes the two new
   services).
5. U5 - `/go/[shortId]` route handler + route test.
6. U6 - `AffiliatePartnersCard` component + integration into
   `ProductDetailsView` + component test.
7. U7 - Admin `AffiliateTab` + three sub-views + service tests.
8. U8 - verify + Playwright e2e + phase-5 smoke.

### Research

- Existing pattern for "world-readable, admin-writable" tables:
  `phase_3_listings_rls.sql` (anyone reads, owner writes) -
  analogous shape but the inverse (`anyone reads, admin writes`).
  The pattern is `is_admin()` from Phase 3.5 reused as the write
  predicate.
- Existing pattern for server-side route handlers reading cookies:
  `src/app/api/stripe/webhook/route.ts` reads raw headers via
  `headers()` and writes a Supabase row via the service-role client.
  The new `/go/[shortId]` route mirrors this pattern but with
  `NextResponse.redirect` instead of `NextResponse.json`.
- Existing pattern for first-party cookies: `STORAGE_KEYS.pendingOtp`
  in `AppContext.tsx` writes `localStorage`; the `/go/[shortId]`
  route writes analytics cookies via the response `Set-Cookie`
  header. No prior pattern; new pattern.
- `docs/STATUS.md` lists Phase 4 as the current wired state. The
  affiliate feature is the first slice of "Phase 5: monetization
  beyond orders" (no Phase 5 doc exists yet; this plan is the
  de-facto Phase 5 U1).

## Implementation Units

### U1. Schema, RLS, and pgTAP for partners / affiliate_links / affiliate_clicks

- Goal: Three new tables, indexes, RLS policies, and pgTAP tests
  that match the existing `phase_*_<table>_rls.sql` shape.
- Files:
  - `supabase/migrations/202608180001_partners.sql`
  - `supabase/migrations/202608180002_affiliate_links.sql`
  - `supabase/migrations/202608180003_affiliate_clicks.sql`
  - `supabase/tests/phase_5_partners_rls.sql`
  - `supabase/tests/phase_5_affiliate_links_rls.sql`
  - `supabase/tests/phase_5_affiliate_clicks_rls.sql`
- Approach:
  - `partners`: `(code text PRIMARY KEY, name text NOT NULL,
    logo_url text, base_url_template text, is_active boolean NOT
    NULL DEFAULT true, display_order smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now())`. RLS: `select`
    for `anon` + `authenticated`; `insert`/`update`/`delete` for
    `authenticated` gated by `is_admin()`.
  - `affiliate_links`: `(id uuid PRIMARY KEY DEFAULT
    gen_random_uuid(), short_id text NOT NULL UNIQUE, listing_id
    uuid NOT NULL REFERENCES public.listings(id) ON DELETE
    CASCADE, partner_code text NOT NULL REFERENCES public.partners
    (code) ON DELETE RESTRICT, affiliate_url text NOT NULL,
    display_order smallint NOT NULL DEFAULT 0, is_active boolean
    NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT
    now())`. RLS: same shape as `partners`. Index on `listing_id`
    (detail-page query); `short_id` already unique.
  - `affiliate_clicks`: `(id uuid PRIMARY KEY DEFAULT
    gen_random_uuid(), short_id text NOT NULL, listing_id uuid NOT
    NULL, partner_code text NOT NULL, user_id uuid NULL REFERENCES
    auth.users(id) ON DELETE SET NULL, anon_id text NULL,
    user_agent text NULL, referer text NULL, clicked_at timestamptz
    NOT NULL DEFAULT now())`. RLS: `insert` for `anon` +
    `authenticated` (no user check; the redirect can run for
    logged-out visitors); `select` for `authenticated` gated by
    `is_admin()`.
  - `short_id` default: `substr(regexp_replace(encode
    (gen_random_bytes(7), 'base64'), '[^A-Za-z0-9]', '', 'g'), 1,
    8)`. Wrap the insert in a retry-on-collision loop in the
    application layer (not in SQL) so rare collisions retry
    cleanly. SQL-side UNIQUE handles the final guardrail.
  - pgTAP tests follow the existing pattern (`plan(8)` style, role
    setup with `set_config`, four-role matrix where relevant).
  - Tests must verify: (a) anon SELECT on `partners` works; (b)
    anon INSERT on `partners` fails; (c) auth non-admin INSERT on
    `partners` fails; (d) auth admin INSERT on `partners` works;
    (e) anon INSERT on `affiliate_clicks` works; (f) anon SELECT
    on `affiliate_clicks` fails; (g) auth admin SELECT on
    `affiliate_clicks` works; (h) `ON DELETE CASCADE` removes
    affiliate_links when listing is deleted.
- Test Scenarios:
  - `npm run test:phase2:db` is green with the new files.
  - `psql` smoke: admin creates a partner; non-admin attempts and
    fails; anon reads it.

### U2. Service contracts and types

- Goal: Add the two new interfaces, their input/output types, and
  fields on `Phase2Backend` so downstream code can type-check.
- Files:
  - `src/services/backend/contracts.ts` (append)
  - `src/services/backend/types.ts` if it exists, otherwise the new
    types live alongside the contracts (verified during execution).
- Approach:
  - Add types:
    ```ts
    export interface PartnerRecord {
      code: string;
      name: string;
      logoUrl: string | null;
      baseUrlTemplate: string | null;
      isActive: boolean;
      displayOrder: number;
      createdAt: string;
    }

    export interface AffiliateLinkRecord {
      id: string;
      shortId: string;
      listingId: string;
      partnerCode: string;
      affiliateUrl: string;
      displayOrder: number;
      isActive: boolean;
      createdAt: string;
    }

    export interface AffiliateClickRecord {
      id: string;
      shortId: string;
      listingId: string;
      partnerCode: string;
      userId: string | null;
      anonId: string | null;
      clickedAt: string;
    }
    ```
  - Add `AffiliateLinkService` (read methods + admin-only partner
    CRUD + link CRUD):
    ```ts
    export interface AffiliateLinkService {
      listPartners(): Promise<PartnerRecord[]>;
      listLinksForListing(listingId: string):
        Promise<AffiliateLinkRecord[]>;
      createPartner(input: {
        code: string;
        name: string;
        logoUrl?: string;
        baseUrlTemplate?: string;
        displayOrder?: number;
        isActive?: boolean;
      }): Promise<PartnerRecord>;
      updatePartner(
        code: string,
        patch: Partial<{
          name: string;
          logoUrl: string | null;
          baseUrlTemplate: string | null;
          displayOrder: number;
          isActive: boolean;
        }>,
      ): Promise<void>;
      deletePartner(code: string): Promise<void>;
      createLink(input: {
        listingId: string;
        partnerCode: string;
        affiliateUrl: string;
        displayOrder?: number;
      }): Promise<AffiliateLinkRecord>;
      updateLink(
        id: string,
        patch: Partial<{
          affiliateUrl: string;
          displayOrder: number;
          isActive: boolean;
        }>,
      ): Promise<void>;
      removeLink(id: string): Promise<void>;
    }
    ```
  - Add `AffiliateClickService`:
    ```ts
    export interface AffiliateClickService {
      recordClick(input: {
        shortId: string;
        listingId: string;
        partnerCode: string;
        userId: string | null;
        anonId: string | null;
        userAgent: string | null;
        referer: string | null;
      }): Promise<void>;
      aggregateForReports(range: {
        fromIso: string;
        toIso: string;
      }): Promise<{
        byPartner: { partnerCode: string; clicks: number }[];
        byListing: { listingId: string; clicks: number }[];
        totalClicks: number;
      }>;
    }
    ```
  - Add fields to `Phase2Backend`:
    ```ts
    export interface Phase2Backend {
      // ... existing
      affiliateLinks: AffiliateLinkService;
      affiliateClicks: AffiliateClickService;
    }
    ```
- Test Scenarios:
  - `npm run typecheck` is green; no other tests change at this
    step.

### U3. Supabase adapter, mappers, and mocks

- Goal: Concrete implementations of the two services for both
  Supabase and mock modes. Mappers convert DB rows to view models.
- Files:
  - `src/services/backend/mappers-affiliate.ts`
  - `src/services/backend/supabase.ts` (extend)
  - `src/services/backend/mock-helpers.ts` (extend)
  - `src/services/backend/affiliate-mappers.test.ts`
  - `src/services/backend/affiliate-mock.test.ts` (extend mock
    test or create if missing).
- Approach:
  - `mappers-affiliate.ts`: `toPartnerRecord(row)`,
    `toLinkRecord(row)`, `toClickRecord(row)`. Snake-case to
    camelCase for `logo_url` -> `logoUrl`, `display_order` ->
    `displayOrder`, `is_active` -> `isActive`, `created_at` ->
    `createdAt`, `partner_code` -> `partnerCode`, `listing_id` ->
    `listingId`, `affiliate_url` -> `affiliateUrl`, `short_id` ->
    `shortId`, `clicked_at` -> `clickedAt`, `user_id` -> `userId`,
    `anon_id` -> `anonId`. Round-trip tests.
  - `SupabaseAffiliateLinkService`:
    - `listPartners()` filters `is_active = true`, ordered by
      `display_order`.
    - `listLinksForListing(listingId)` filters
      `listing_id = listingId AND is_active = true`.
    - `createPartner` / `updatePartner` / `deletePartner` are
      straight CRUD; RLS enforces admin role.
    - `createLink` retries once on UNIQUE `short_id` collision.
    - `updateLink` / `removeLink` straightforward.
  - `SupabaseAffiliateClickService`:
    - `recordClick` calls `supabase.from('affiliate_clicks')
      .insert(...)`.
    - `aggregateForReports` issues two queries grouped by partner
      and by listing, filtered by `clicked_at` range.
  - Mocks in `mock-helpers.ts`:
    - Two seed partners (`amazon-ae`, `noon-ae`) and three seed
      links across two mock listings. Clicks are kept in a
      module-level array (reset on reload). `recordClick` pushes
      a row. `aggregateForReports` groups in-memory.
- Test Scenarios:
  - Mapper round-trip tests: 6 cases per type.
  - Mock service: `listPartners()` returns two seed partners;
    `recordClick` increases the in-memory count.
  - Supabase adapter: tested via the existing pgTAP suite (U1)
    rather than unit tests; we do not duplicate coverage.

### U4. AppContext wiring

- Goal: Expose the two new services on `Phase2Backend` so the UI
  can use them.
- Files:
  - `src/services/backend/supabase.ts` (extend `createPhase2Backend`)
  - `src/services/backend/mock-helpers.ts` (mock assembly)
  - `src/context/AppContext.tsx` (no signature changes; the new
    fields appear via the `Phase2Backend` type)
- Approach:
  - In `createPhase2Backend`:
    ```ts
    const affiliateLinks: AffiliateLinkService =
      new SupabaseAffiliateLinkService(supabase);
    const affiliateClicks: AffiliateClickService =
      new SupabaseAffiliateClickService(supabase);
    return { /* ...existing, */ affiliateLinks, affiliateClicks };
    ```
  - Mock assembly: same shape with `MockAffiliateLinkService` and
    `MockAffiliateClickService`.
  - No new `AppContext` methods needed; UI calls
    `phase2Backend.affiliateLinks.listLinksForListing(listingId)`
    directly.
- Test Scenarios:
  - `npm run typecheck` is green.
  - Existing AppContext tests keep passing (no signature change).

### U5. /go/[shortId] route handler

- Goal: Server route that logs the click and 302-redirects to the
  partner URL. Anonymous-safe via the `m_aff_anon` cookie.
- Files:
  - `src/app/go/[shortId]/route.ts`
  - `src/app/go/[shortId]/route.test.ts`
- Approach:
  - `export const runtime = 'nodejs';`
  - `export const dynamic = 'force-dynamic';`
  - Handler reads the `m_aff_anon` cookie or generates a UUIDv4
    and sets it via `Set-Cookie: m_aff_anon=<uuid>;
    Max-Age=31536000; Path=/; SameSite=Lax`. The cookie is not
    `HttpOnly` - it is a client-side analytics identifier, not
    auth.
  - Resolve `shortId` via service-role Supabase client:
    `supabase.from('affiliate_links').select('id, listing_id,
    partner_code, affiliate_url, is_active').eq('short_id',
    shortId).eq('is_active', true).single()`. If no row or
    `is_active = false`, return 404.
  - Resolve the user id by reading the Supabase auth cookie via
    `createServerClient` with the request cookies (existing
    pattern from `app/api/stripe/webhook/route.ts`); pass `null`
    if no session.
  - Insert the click via service-role client.
  - Return `NextResponse.redirect(row.affiliate_url, 302)` with
    the cookie set on the response.
  - Errors: log via Sentry (`Sentry.captureException`) and return
    302 to a mooday fallback URL (`/app`) so a failed insert
    never traps the user on a blank page.
- Test Scenarios:
  - GET with a valid shortId: response status 302, Location header
    is the partner URL, `Set-Cookie` header present.
  - GET with an invalid shortId: response status 404.
  - GET with `is_active = false` shortId: response status 404.
  - Click row inserted (mocked): row has correct `userId`,
    `anonId`, `shortId`, `listingId`, `partnerCode`.
  - Cookie rotation: missing cookie -> new UUID generated;
    existing cookie -> same UUID used.

### U6. AffiliatePartnersCard on listing detail

- Goal: "Also buy new at" card below the price block. Hidden when
  no links exist.
- Files:
  - `src/components/affiliate/AffiliatePartnersCard.tsx`
  - `src/components/affiliate/AffiliatePartnersCard.test.tsx`
  - `src/components/ProductDetailsView.tsx` (mount the card)
- Approach:
  - `AffiliatePartnersCard` takes `listingId: string` as a prop.
  - On mount, calls
    `usePhase2Backend().affiliateLinks.listLinksForListing
    (listingId)`. Renders nothing while loading and nothing when
    the result is empty (zero-height, no skeleton - the parent
    layout does not depend on its presence).
  - When non-empty, renders a card with one button per partner:
    ```tsx
    <a
      key={link.id}
      href={`/go/${link.shortId}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="..."
    >
      <img src={partner.logoUrl ?? ''} alt={partner.name} />
      <span>{partner.name}</span>
      <ExternalIcon />
    </a>
    ```
  - Partners list is fetched once at the page level via
    `listPartners()` and merged in-memory by `partnerCode`.
  - Mount in `ProductDetailsView` between the price block and the
    description. Pass `listingId`.
- Test Scenarios:
  - Renders nothing when links are empty.
  - Renders one button per partner when links exist.
  - Button `href` is `/go/{shortId}` (not the partner URL
    directly).
  - Button has `target="_blank"`, `rel="noopener noreferrer
    nofollow"`.
  - Card does not call `recordClick` directly - only the route
    does.

### U7. Admin Affiliate tab + three sub-views

- Goal: `/admin` gets an "Affiliate Links" tab with three
  sub-views: Partners (CRUD), Links (CRUD with listing picker),
  Reports.
- Files:
  - `src/components/admin/AdminTypes.ts` (add `affiliate` to
    `AdminTab`)
  - `src/components/admin/AdminSidebar.tsx` (add the tab entry)
  - `src/components/admin/affiliate/AdminPartnersView.tsx`
  - `src/components/admin/affiliate/AdminLinksView.tsx`
  - `src/components/admin/affiliate/AdminReportsView.tsx`
  - `src/components/admin/affiliate/AffiliateTab.tsx` (sub-router
    for the three sub-views)
  - `src/app/admin/page.tsx` (mount `AffiliateTab` when
    `activeTab === 'affiliate'`)
  - `src/components/admin/affiliate/AffiliateTab.test.tsx`
- Approach:
  - `AdminPartnersView`: table of partners with inline create form
    (`code`, `name`, `logoUrl`, `displayOrder`, `isActive`).
    Edit / delete per row. Calls
    `phase2Backend.affiliateLinks.listPartners()`,
    `createPartner(...)`, `updatePartner(...)`, `deletePartner(...)`.
    All writes go through the authenticated admin client; RLS
    gates on `is_admin()`.
  - `AdminLinksView`: picker for `listingId` (combobox over
    `useAppListings()`), then list of links with inline create
    form (`partnerCode`, `affiliateUrl`, `displayOrder`).
  - `AdminReportsView`: three sub-sections - "Clicks by partner"
    (last 30d), "Top listings by clicks" (last 30d, top 10),
    "Total clicks" (last 30d). No CTR column in v1 (see KTD5).
  - Sub-router: tabs inside the Affiliate tab use a separate
    `useState<'partners' | 'links' | 'reports'>('partners')` -
    does not conflict with the outer admin tab state.
- Test Scenarios:
  - Empty state: each sub-view renders its empty state.
  - Create partner: form submit -> row appears in list (mock
    service).
  - Delete partner: confirmation modal -> row removed.
  - Reports: clicks aggregated by partner match raw click count.

### U8. Verify + Playwright e2e + Phase 5 smoke

- Goal: All gates green; one Playwright e2e exercises the
  click-through end-to-end.
- Files:
  - `tests/e2e/affiliate-click.spec.ts` (new)
  - `scripts/phase5-affiliate-smoke.mjs` (new)
- Approach:
  - Playwright spec: log in as test admin -> attach affiliate
    link -> log out -> visit listing detail -> click "Also buy
    new" -> assert navigation lands on the partner URL -> assert
    click count in admin Reports increased by 1. Mock the partner
    URL with a Next.js mock route (`/test-partner-target`) so the
    test does not actually hit Amazon.
  - Smoke: `scripts/phase5-affiliate-smoke.mjs` follows the
    `phase2-smoke-supabase.mjs` pattern. Inserts a partner, a
    link, three clicks (two anon, one auth). Reads back. Asserts
    RLS denials for the non-admin role. Adds ~6 assertions to
    the existing `phase2-smoke` total.
  - `npm run verify` (typecheck + lint + `test:ci` + build) is
    green.
  - `npm run test:phase2:db` is green (pgTAP).
- Test Scenarios:
  - All commands exit 0.
  - `affiliate_clicks` count for the test listing is 3 after
    smoke.
  - Non-admin role: pgTAP test for SELECT denial passes.

## Verification Contract

Run after the implementation branch is ready:

```bash
# unit + mapper + component + contract tests
npm run test:ci

# typecheck + lint + build
npm run typecheck
npm run lint
npm run build

# pgTAP against a running local Supabase
npm run test:phase2:db

# extended cross-domain smoke
node scripts/phase5-affiliate-smoke.mjs

# e2e click-through
npm run test:phase2:e2e -- tests/e2e/affiliate-click.spec.ts
```

All six must exit 0. The build must register `/go/[shortId]` as a
new route alongside the existing 8 (`/`, `/admin`, `/api/health`,
`/api/stripe/webhook`, `/app`, `/auth/callback`, `/preview`,
`/sitemap.xml`). The Playwright test must hit the local mock
partner URL, not amazon.ae.

## Definition of Done

Global DoD:

- [ ] All eight implementation units merged on the implementation
  branch.
- [ ] `npm run verify` is green on the implementation branch.
- [ ] `npm run test:phase2:db` is green on the implementation
  branch.
- [ ] Playwright `affiliate-click.spec.ts` passes.
- [ ] No service-role Supabase client is used outside the three
  sanctioned call sites (Stripe webhook, `/go/[shortId]`,
  future cron) - verified by `rg -n 'createClient.*service.role'`
  in `src/`.
- [ ] `docs/affiliate-security.md` exists and documents the
  service-role use.
- [ ] No `TODO(phase-1)` markers remain.

Per-unit DoD:

- U1: migrations apply cleanly; pgTAP tests pass; anon SELECT on
  `partners` works; non-admin INSERT on `partners` fails.
- U2: types compile; no other service signature changes.
- U3: mapper round-trips pass; mock service returns seed data.
- U4: `Phase2Backend` exposes `affiliateLinks` and
  `affiliateClicks`; existing AppContext tests still pass.
- U5: route 302s to partner URL; cookie set on response; click
  row inserted; 404 on missing or inactive shortId.
- U6: card renders below price; hidden when no links; button
  `href` is `/go/{shortId}` not the partner URL.
- U7: admin tab reachable from sidebar; three sub-views render
  empty states; create / delete work against mocks.
- U8: all six verification commands exit 0; new route registered
  in build output.

## Open Questions (deferred, non-blocking)

- OQ1. CTR denominator - depends on a per-listing view counter
  that does not exist yet. Add a `listing_view_events` table or
  a materialized view if/when needed. Not blocking v1.
- OQ2. Search-fallback shape ("no used match -> external
  options") - deferred per KD2. Open for v2.
- OQ3. Dedicated Deals tab with hand-curated content - deferred
  per KD2. Open for v2.
- OQ4. Disclosure copy (FTC, UAE NMC) - owner's responsibility.
  Not a code item; flag in owner-facing docs.
- OQ5. Auto-fetch from Amazon Product Advertising API - deferred
  per KD3. Open for v2 if partner programs approve access.
