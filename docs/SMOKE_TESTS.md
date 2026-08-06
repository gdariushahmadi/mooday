# Mooday — Smoke tests

This document covers the E2E smoke tests that drive the wired backend
against a live Supabase instance. Run them before any deploy.

## Setup

```bash
# 1. Start local Supabase (migrations applied automatically on `start`).
npx supabase start -x studio

# 2. Wait until "supabase_db_mooday" is healthy.
docker ps --filter "name=supabase_db_mooday" --format "{{.Names}}: {{.Status}}"

# 3. Capture the service-role key from the CLI output.
export SUPABASE_SERVICE_ROLE_KEY="$(npx supabase status -o env 2>/dev/null | grep SERVICE_ROLE_KEY | cut -d= -f2- | tr -d '"')"

# 4. Apply the migrations explicitly so the latest set is in place.
npx supabase db reset --no-seed
```

## Run all smoke tests

```bash
for f in scripts/phase2-smoke-supabase.mjs \
         scripts/phase4-public-reviews-smoke.mjs \
         scripts/phase4-notification-fanout-smoke.mjs \
         scripts/phase4-admin-actions-smoke.mjs \
         scripts/phase4-image-upload-smoke.mjs; do
  echo "=== $f ==="
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" node "$f"
done
```

## Individual smoke tests

### `phase2-smoke-supabase.mjs` — core wiring (23 assertions)

Creates a seller + buyer, drives a full listing → order → chat → offer →
report → dispute → notification → review → payment method → block flow,
and verifies RLS isolation for each domain.

### `phase4-public-reviews-smoke.mjs` — PublicSellerProfile reviews (10 assertions)

Verifies that `addMyReview` writes the reviewer name + avatar snapshot
columns and that the public profile surface reads them back.

### `phase4-notification-fanout-smoke.mjs` — DB triggers (7 assertions)

Inserts chat messages, orders, and reviews via the same path the AppContext
uses, then asserts that the OTHER party received a notification row.

### `phase4-admin-actions-smoke.mjs` — admin queries (8 assertions)

Promotes a user to admin and exercises the same queries the admin
Server Actions run (counts, listings, orders, reports, suspend user).

### `phase4-image-upload-smoke.mjs` — listing-media bucket (7 assertions)

Drives the real upload pipeline: create a listing as a seller, upload
a tiny PNG to the private bucket at `{userId}/{listingId}/{filename}`,
fetch a signed URL, and verify cross-user uploads are blocked.

## pgTAP test suite

```bash
npx supabase test db
```

11 files cover RLS isolation:

- `phase_2_rls.sql`
- `phase_3_5_admin_rls.sql`
- `phase_3_cart_items_rls.sql`
- `phase_3_listing_media_rls.sql`
- `phase_3_listings_rls.sql`
- `phase_3_orders_rls.sql`
- `phase_3_public_seller_profiles_rls.sql`
- `phase_3_social_rls.sql`
- `phase_3_user_likes_rls.sql`
- `phase_4_payment_methods_rls.sql`
- `phase_4_blocked_users_rls.sql`

## CI integration

Add the following to `.github/workflows/ci.yml` so PRs run the smoke
suite against an ephemeral Supabase instance:

```yaml
- name: Boot Supabase
  run: |
    npx supabase start -x studio
    npx supabase db reset --no-seed

- name: Apply service-role grants
  # The local Supabase image does not auto-grant service_role on
  # new tables; this is a no-op against hosted Supabase.
  run: |
    docker exec supabase_db_mooday \
      psql -U postgres -d postgres -c \
      "GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
       GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;"

- name: Run smoke tests
  env:
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  run: |
    for f in scripts/phase*-smoke*.mjs; do
      node "$f"
    done
```

## Troubleshooting

**`Object not found` on signed URL fetch.** Verify the listing is in
`status = 'active'` and that the path matches `{userId}/{listingId}/{file}`.

**`permission denied for table X`.** Local Supabase requires explicit
`GRANT` to `service_role` on each new table. Run:

```bash
docker exec supabase_db_mooday \
  psql -U postgres -d postgres -c \
  "GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;"
```
