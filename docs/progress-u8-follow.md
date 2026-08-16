# U8 Progress: Follow Service added

**Date:** 2026-08-16
**Status:** FollowService implemented end-to-end
**Owner:** U8 (SocialService)

## What is done

1. **Migration** `supabase/migrations/202608160446_u8_user_follows.sql` defines the `user_follows` table:
   - `follower_id`, `followee_id`, `created_at`.
   - Composite primary key.
   - `CHECK (follower_id <> followee_id)` prevents self-follows.
   - Indexes on `followee_id` and `follower_id` for fast lookups.
   - RLS: anyone can read; only the follower can insert/delete their own row.

2. **`FollowService`** interface in `contracts.ts`:
   - `listFollowingIds()`, `listFollowerIds(userId)`, `follow(userId)`, `unfollow(userId)`, `isFollowing(userId)`, `toggle(userId)`.

3. **`SupabaseFollowService`** implementation in `supabase.ts`:
   - `follow` is idempotent via `upsert ... onConflict: ignoreDuplicates`.
   - `unfollow` enforces authentication.
   - `toggle` returns the resulting state.

4. **`Phase2Backend.follows`** wired in the bundle.

5. **Typecheck** passes.

## What is still pending

1. End-to-end test: User A follows User B; User B's follower count increments.
2. UI integration: the follow button in `UserProfileView` should call `phase2Backend.follows.toggle`.
