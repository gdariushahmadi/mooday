# U6 Progress: ReviewService

**Date:** 2026-08-16
**Status:** largely wired; awaiting end-to-end verification
**Owner:** U6 (Wire ReviewService to product details and seller profile)

## What is already done

1. **`SellerReviewService`** in `src/services/backend/contracts.ts:470` defines the interface:
   - `listForSeller(sellerId)`
   - `listMine()`
   - `create(input)` (no update or delete by design)

2. **`SupabaseSellerReviewService`** in `src/services/backend/supabase.ts:1568` implements the interface against the `seller_reviews` table.

3. **DB-level immutability**: The `phase_3_social` migration grants only `select, insert` on `seller_reviews` to authenticated users. No `update` or `delete` permission, so reviews are immutable at the DB level once posted.

4. **AppContext wiring**: `src/context/AppContext.tsx:1963` creates reviews via `phase2Backend.reviews.create` when `phase2Backend` is set. The mock branch below writes to the local mock store.

5. **UI components**: `LeaveReviewView`, `MyReviewsView`, `NotificationsCentreView` use the AppContext.

## What is still pending

1. End-to-end test against a local Supabase:
   - Buyer purchases a listing, marks delivered, then leaves a review.
   - Review appears on the seller's profile within 1 second.
   - Reviewer cannot edit or delete the review (no UI button).

2. Aggregation on the product details page: the plan calls for the product page to aggregate the seller's average rating. This composition is not yet implemented.

3. Public reviewer identity: the plan called for "public and immutable once posted." The current implementation snapshots the reviewer's name and avatar at creation time, which is correct.

## Next steps

1. Run a smoke test against the local Supabase.
2. Build the rating aggregation on the product page.
