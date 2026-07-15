# Phase 3 — marketplace backend

Phase 3 moves marketplace state from per-browser storage to shared Supabase
data. Delivery is incremental and feature-flagged so the complete Phase 1 demo
remains usable while each domain is migrated.

## Rollout flags

- `NEXT_PUBLIC_DATA_SOURCE=supabase` enables the Phase 2 identity boundary.
- `NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE=supabase` opts into Phase 3 marketplace
  services and is rejected unless real identity is also enabled.
- The marketplace flag defaults to `mock`; a production build freezes this
  public value at build time and therefore requires a rebuild to change it.

Rollback for the marketplace UI is a configuration change back to `mock`.
Additive database migrations remain in place.

## Slice 1 — listings foundation

Delivered locally:

- `listings` with UUID ownership, integer AED minor units, bilingual content,
  draft/active/reserved/sold/archived lifecycle, mode, attributes, timestamps,
  validation constraints, and feed/owner indexes.
- `listing_images` stores ordered metadata and storage paths separately from
  listing records. The actual private upload bucket is a later external/storage
  slice.
- Anonymous and authenticated users can read active listings. A seller can
  additionally read their own non-public listings.
- Insert, update, delete, and image-metadata changes are owner-only under RLS.
- The browser adapter derives `seller_id` from the verified Auth user; callers
  cannot provide or spoof it.
- Update/delete report a not-found/unauthorized failure instead of silently
  presenting an unsaved UI state.
- 11 live pgTAP checks cover public visibility, private drafts, spoofing,
  owner mutations, cross-seller isolation, and image visibility.

The existing screens still use local demo listings because public seller
profiles and the image upload pipeline must be available before a remote
listing can be rendered with feature parity.

## Next slices

1. Define the public seller-card projection without exposing private profiles.
2. Add the media adapter for validated upload, signed URL creation, metadata
   persistence, and orphan cleanup. The private `listing-media` bucket and its
   owner/visibility RLS policies are now delivered locally.
3. Map remote listing/image/seller records into the current `Product` view
   model and enable create/edit/delete behind the marketplace flag.
4. Move likes and cart to user-scoped tables with idempotent mutations.
5. Add orders, inventory reservation, payment state, and immutable price
   snapshots.
6. Add offers/chat/realtime, notifications, reviews, reports, returns, and
   disputes as separate bounded slices.

Every slice must include a fresh-database migration run, RLS isolation tests,
adapter tests, UI error handling, a rollback note, and staging evidence before
its flag is enabled.
