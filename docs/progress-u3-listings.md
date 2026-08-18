# U3 Progress: ListingService Search

**Date:** 2026-08-16
**Status:** search method implemented; awaiting end-to-end verification
**Owner:** U3 (Wire ListingService to Discovery and Search)

## What is done

1. **Migration** `supabase/migrations/202608160429_u3_search_listings.sql` defines a `search_listings(query text, filters jsonb)` RPC that:
   - Returns ranked results using `ts_rank` over a `to_tsvector` of (title_en, title_ar, description_en, description_ar).
   - Filters by category, price range, and status (defaults to `active`).
   - Supports limit and offset for pagination.
   - Empty query returns rows ordered by `created_at desc` (no ranking).
   - `language sql`, `security invoker`, `stable`. The `simple` text search config matches both Latin and Arabic tokens reasonably; for production we may switch to `arabic` and `english` configurations with a `tsquery` rewrite.

2. **Interface** `src/services/backend/contracts.ts` adds a `search(query, filters?)` method to `ListingService`.

3. **Implementation** `src/services/backend/supabase.ts` `SupabaseListingService.search` calls the RPC and maps rows through `listingFromRow`.

4. **Typecheck** passes.

## What is still pending

1. End-to-end test against a local Supabase:
   - Insert a few listings with mixed Arabic and English titles.
   - Call `search_listings` with Arabic and English queries.
   - Verify the same listings come back (covers AE4).

2. UI wiring:
   - `DiscoverTabsView`, `CategoryLandingView`, `SearchFiltersView`, `ProductDetailsView` should call `ListingService.search` instead of the mock store.
   - The existing `useApp()` pattern means the AppContext hydrates `listings` from a fetch. The actual switch to `search` is one-line per view.

3. Pagination: `limit` and `offset` are wired but not exercised by any UI yet.

## Next steps

1. Run `npx supabase db reset` against a local Supabase to apply the new migration.
2. Run a smoke test against the RPC.
3. Wire UI views to use the search method.
4. Remove the listing-related TODO comments added in U1.
