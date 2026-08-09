# Real showcase catalog

The old Phase 1 showcase lived in local mock data. The deployed marketplace
does not fall back to that data: it reads `listings`, `listing_images`, and
`seller_card_view` from Supabase.

To populate a real showcase catalog, run the idempotent importer once against
the intended Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<server-only-key>" \
MOODAY_DEMO_SEED_CONFIRM=YES \
npm run seed:demo
```

The importer creates isolated, confirmed showcase seller accounts, copies the
existing product and seller content into real rows, marks listings active and
approved, and stores the existing `/products/*` assets as public image
references. It is safe to rerun; it refuses to take over an unrelated account
or reassign an existing listing.

Use `npm run seed:demo -- --dry-run` to validate the catalogue without writing
anything. Keep the service-role key server-side and never place it in a
`NEXT_PUBLIC_*` variable.
