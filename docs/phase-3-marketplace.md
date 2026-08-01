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

## Slice 2 — public seller-card projection

Delivered locally:

- `public_seller_profiles` table: owner-writable seller-card fields (display
  name EN+AR, handle, avatar URL, type EN+AR, bio EN+AR, city EN+AR, style
  tags EN+AR, `is_verified`, response rate / hours, joined-at). Lives
  separately from the private `profiles` table so the public projection can
  never leak the owner's full address book, language preference, or any
  future private setting.
- RLS: anon and authenticated get SELECT on every row; INSERT / UPDATE /
  DELETE are owner-only (`seller_id = auth.uid()`).
- Trigger `on_auth_user_created_public_profile` seeds a blank public card
  row whenever a new auth user signs up, mirroring the existing private
  `profiles` seeding trigger.
- `seller_card_view` aggregates each card with its active-listings count so
  anon callers never need to read the `listings` table directly. Drafts,
  reserved, sold, and archived listings do not contribute to the count.
- `SellerCardService` contract + Supabase adapter: `listVisible`,
  `getById`, `getByHandle`, `upsertMine`. `sellerId` is always derived
  from the verified Auth session; callers cannot supply or spoof it.
- 10 pgTAP checks (anon read, cross-user isolation, owner mutations,
  view aggregation, trigger seeding) plus 5 migration-shape checks.

UI wiring lands in slice 3. Today the Phase 1 components still source
seller info from `SELLERS` + `SELLER_META`; the projection exists so slice 3
can swap the read path behind the marketplace flag without rework.

## Slice 2b — listing media adapter

Delivered locally:

- `ListingMediaService` contract + Supabase adapter covering upload, list,
  bulk-list, per-image remove, and listing-level remove.
- Client-side validation gates the upload with the bucket's allow-list
  (`image/jpeg`, `image/png`, `image/webp`) and 10 MiB cap; storage RLS
  re-checks both on the server.
- Storage path format `{userId}/{listingId}/{uuid}.{ext}` matches the
  bucket's `storage.foldername(name)` policy shape.
- Read path resolves private storage paths through signed URLs
  (1-hour expiry) and passes mock seed image URLs verbatim, so Phase 1
  data keeps working unchanged.
- Per-image removal cascades to both the metadata row and the storage
  object when the path is private; public URLs are dropped from metadata
  only.
- `removeAllForListing` is invoked before `listings.remove` so a partial
  rollback leaves the listing visible (and retryable) instead of an
  orphaned storage file with no metadata row.
- Inserts roll back the storage object if the `listing_images` row fails,
  so a row-level constraint violation does not charge the user for a
  dangling upload.
- 10 unit tests cover mime / size / empty-body validation, auth
  requirements, path shape, metadata-insert rollback, and signed-URL
  resolution.

The UI photo-picker still uses Phase 1's round-robin of mock image paths;
real file uploads land in a future slice that swaps the picker UI. Until
then, `addListing` persists each form photo URL as a public passthrough
row in `listing_images` so the next refresh resolves it without a signed
URL hop.

## Slice 3 — remote listings wired into the UI

Delivered locally:

- `mappers.ts` converts `ListingRecord` + `SellerCardRecord` +
  `ListingImageRecord` into the Phase 1 `Product` view model in one
  pass; `mapProductToCreateInput` and `mapProductToUpdatePatch` reverse
  the path for write flows. Prices convert to integer AED fils (1 AED =
  100 fils).
- `AppContext` now exposes `marketplaceMode`; when `marketplaceMode ===
  'supabase'` (Phase 3 enabled) `listings`, `listingsLoading`,
  `listingsError`, and `refreshListings` are sourced from Supabase, while
  mock mode continues to read through the local-storage snapshot.
- `addListing` creates the listing remotely, persists photo URLs as
  `listing_images` rows, then refreshes the cache. `updateListing`
  patches the listing remotely and refreshes. `removeListing` removes
  storage + metadata + the listing in that order, and refreshes.
- All three mutators are now `Awaitable<void>`; existing callers
  (`SellItemView`, `EditListingView`, `MyClosetView`) keep working
  because they ignore the return value. A future fire-and-forget
  improvement awaits them before navigating away — currently out of
  scope to avoid touching mock-mode screenshots.
- 19 mapper tests cover price unit conversion (including float-precision
  rounding), seller-card fallbacks, image-ordering expectations,
  nullable field cleanup, and the `public|private` URL discriminator.

When the marketplace flag is off, the entire code path is dormant and
the Phase 1 localStorage story is unchanged.

## Slice 5 — orders + payment state + price snapshots

Delivered locally:

- `orders` table with `(buyer_id, seller_id, status)` triples, AED
  minor-unit totals, shipping-address snapshot (JSONB), and payment
  brand/last-4 snapshots so checkout history survives edits to the
  address book or payment-method list.
- `order_items` table with FK `ON DELETE SET NULL` to `listings` so a
  seller deleting a listing does not rewrite the audit trail. Title,
  image URL, and per-unit price are snapshotted at purchase time.
- Status machine enforced by a SECURITY INVOKER trigger:
  - `paid → shipped`: seller only.
  - `paid → cancelled`: buyer only.
  - `shipped → delivered`: either buyer or seller.
  - `shipped|delivered → returned`: buyer only.
  - Any other transition raises `P0001`.
- RLS: buyer OR seller can read; buyer-only insert; status updates go
  through the trigger which enforces role + edge.
- `OrderService` adapter: listMineAsBuyer / listMineAsSeller / getById
  (eager-loads items in one round-trip) / create (with atomic order
  + items insert, rollback if items fail) / markShipped /
  markDelivered / cancel / requestReturn.
- Payment capture remains mocked: the `paid` status is set on insert
  without a PSP webhook. Phase 5 will swap the create flow for a
  server-side confirm hook; the state machine already models every
  transition the real PSP needs.
- 6 migration-shape checks + 11 pgTAP checks cover cross-user
  isolation, role-gated transitions, illegal jumps, and the
  listing-delete cascade.

## Slice 6 — chat / offers / reviews / reports / disputes /
            notifications

Delivered locally:

- Five tables (`chat_threads`, `chat_messages`, `seller_reviews`,
  `reports`, `disputes`, `notifications`) with consistent shape:
  owner-scoped RLS, snapshot columns for editable upstream data,
  and idempotent inserts where possible.
- Chat threads are unique per `(buyer_id, seller_id, listing_id)` so
  the same buyer revisiting a listing reuses the existing thread
  instead of spawning duplicates.
- Chat messages support four types: `text`, `image`, `system`, and
  `offer`. Offers carry `offer_minor` + `offer_status` (pending →
  accepted|declined). Offer status flips are restricted by RLS so
  only the recipient may accept/decline.
- Seller reviews are public-readable; INSERT requires a real owned
  order with the seller so anonymous buyers cannot spam reviews.
  One review per `(buyer, order)` is enforced at the schema level.
- Reports are owner-scoped (the reporter sees only their own
  filings) and the case number is generated server-side to be
  sequential and unique.
- Disputes inherit visibility from the parent order (either buyer or
  seller can see them). Timeline events are JSONB append-only.
- Notifications are recipient-only with a per-recipient unread index.
  AppContext seeds an initial activity feed on first sign-in so the
  Phase 1 UX is preserved; future server triggers will fan out
  notifications from chat messages and order transitions.
- `ChatService`, `SellerReviewService`, `ReportService`,
  `DisputeService`, `NotificationService` adapters all live in
  `supabase.ts` and are mounted on `Phase2Backend`.
- 10 migration-shape checks + 14 pgTAP checks cover cross-user
  isolation, snapshot integrity, and idempotent upsert semantics.

Realtime subscriptions (Supabase Realtime on chat threads +
notifications) are intentionally deferred to Phase 6 — the schema and
API shapes are already compatible, only the client-side `channel()`
calls are missing.

## Slice 7 — real photo picker

Delivered locally:

- New `<ListingPhotoPicker />` component replaces the round-robin
  mock grid in `ListingForm`. Validates mime against the bucket
  allow-list, rejects oversize uploads at 10 MiB, and pre-resizes
  images larger than 1600px on the long edge before staging.
- File selection is pure (no network calls on pick): the picker
  emits `blob:` URLs the form treats as ordinary image paths.
  `isPublicImageUrl` already passes those through, so neither the
  existing display logic nor the adapter had to change.
- ListingForm forwards staged `File[]` via an optional
  `onStagedFiles` callback. SellItemView and EditListingView keep a
  ref and pass it to `addListing(product, files)`.
- AppContext.addListing routes real files through
  `ListingMediaService.upload` (PNG/JPEG/WebP, 10 MiB cap) while
  library URLs keep the passthrough path. The match is by object
  URL so a single re-order in the picker still maps correctly.
- The mock-library dropdown stays available as a fallback for the
  jsdom test environment (real `<input type=file>` cannot be
  triggered there) and for demo seeding.
- 4 picker unit tests cover tile rendering, library-dropdown
  interaction, the 8-photo ceiling, and the UX floor of keeping
  at least one photo.


## Slice 4 — user-scoped likes + cart

Delivered locally:

- `user_listing_likes` table with `(user_id, listing_id)` primary key,
  owner-only RLS, and FK cascades so a removed listing drops its likes
  for free. `UPDATE` is revoked from authenticated so the schema
  enforces "insert-only" intent.
- `cart_items` table with `UNIQUE (user_id, listing_id)`, hard
  quantity window `1..99`, owner-only RLS, and FK cascade on listing
  removal.
- `cart_items_increment(target_listing_id, delta)` SECURITY INVOKER RPC
  issues the canonical atomic merge: `INSERT ... ON CONFLICT DO UPDATE
  SET quantity = least(99, quantity + delta)`. The invocation replaces
  the classic read-modify-write race condition two tabs always hit when
  they add the same product at the same time.
- `LikeService` and `CartService` contracts. `LikeService.like()` is
  idempotent via `INSERT … ON CONFLICT DO NOTHING`; `CartService.add()`
  routes through the RPC for the same reason.
- AppContext reads `likes` and `cart` from Supabase when the marketplace
  flag is on, fallback to localStorage in mock mode. Mutations are
  `Awaitable<void>`; existing Phase 1 components that ignored return
  values keep working unchanged.
- `CartItem` shape is preserved end-to-end: remote cart stores
  `(listing_id, quantity)` only and is rehydrated with the matching
  `Product` from `remoteListings` (and a fallback fetch for any cart
  line referencing a listing not in the current visible set).
- 11 adapter unit tests cover idempotency, double-eq chains, the public
  RPC surface, and the empty-cart sign-out clearing. 5 migration-shape
  checks verify constraints, RPC wiring, and RLS grants. 19 pgTAP
  checks (10 likes + 12 cart) cover cross-user isolation, idempotency,
  the quantity ceiling clamp, the schema-level reject on overflow, and
  the listing-delete cascade.

The mocked `Blob()` upload that ships today persists any in-form photo
URLs as public passthrough rows in `listing_images`; a real file
picker UI is still the next hardening item.

## Next slices

1. Orders, inventory reservation, payment state, immutable price
   snapshots. **(Slice 5 — delivered locally)**
2. Offers/chat/realtime, notifications, reviews, reports, returns, and
   disputes as separate bounded slices. **(Slice 6 — delivered locally,
   realtime subscriptions pending Phase 6)**
3. Replace the Phase 1 photo-picker UI with a real file upload that
   routes through `ListingMediaService.upload`. **(Slice 7 — delivered
   locally)**

Every slice must include a fresh-database migration run, RLS isolation tests,
adapter tests, UI error handling, a rollback note, and staging evidence before
its flag is enabled.
