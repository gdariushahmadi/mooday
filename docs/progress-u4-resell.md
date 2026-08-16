# U4 Progress: ListingService Resell + Sell Flows

**Date:** 2026-08-16
**Status:** largely wired; awaiting end-to-end verification
**Owner:** U4 (Wire ListingService to Resell and Sell flows)

## What is already done

1. **`SupabaseListingMediaService`** in `src/services/backend/supabase.ts:637` implements `ListingMediaService`:
   - `upload(listingId, file, sortOrder)`: writes to the `listing-media` bucket via `supabase.storage.from('listing-media').upload(...)`. Enforces the folder shape from the `fix_storage_foldername` migration.
   - `listForListing(listingId)`: returns image records with signed URLs.
   - `signedUrlMapForImages(storagePaths)`: batch signed URLs.

2. **`addListing` in `src/context/AppContext.tsx:871`** when `phase2Backend` is set:
   - Calls `phase2Backend.listings.create(...)` to create the listing row.
   - Loops over `product.images` and calls `phase2Backend.media.upload(...)` for each staged file.
   - Falls back to skipping non-public URLs (mock data passthrough).

3. **`SellItemView` in `src/components/SellItemView.tsx`** captures `stagedFilesRef` from the `onStagedFiles` callback and passes them to `addListing`.

4. **`ListingForm` in `src/components/listing/ListingForm.tsx`** exposes `onStagedFiles` for the parent to receive the actual `File` objects.

5. **Tests** at `src/services/backend/listing-media-service.test.ts` cover the upload flow.

## What is still pending

1. End-to-end test against a local Supabase:
   - User signs in, opens SellItemView, uploads 3 photos, fills the form, saves.
   - Listing appears in MyClosetView with the new status.
   - Photos have storage paths matching the bucket convention.

2. Public URL fallback: the addListing function has a fallback for non-public URLs (mock data). After mock data is cleaned up, this branch can be removed.

## Next steps

1. Run a smoke test against the local Supabase.
2. Verify MyClosetView shows the new listing.
3. Remove U1's TODO comments for the L742 and L800 guards (U3 mappings).
