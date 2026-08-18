# U8 Progress: SocialService (Follow, Like, Share)

**Date:** 2026-08-16
**Status:** like partially wired; follow/share not yet implemented
**Owner:** U8 (Wire SocialService)

## What is done

1. **LikeService** in `src/services/backend/contracts.ts:244` exposes:
   - `listLikedIds()`: returns listing ids the current user has liked.
   - `like(listingId)`, `unlike(listingId)`, `toggle(listingId)`.
   - Implementation in `src/services/backend/supabase.ts` (search for `SupabaseLikeService`).

2. **Notifications** for likes are wired via the `notification_fanout` migration.

3. **AppContext** routes to `phase2Backend.likes` when `phase2Backend` is set (the `if (!phase2Backend) return` guards at L1186 and L1196).

## What is still pending

1. **Follow service**: there is no `user_follows` table and no `SocialService` interface. The plan calls for follow/unfollow. The schema and contract need to be added.

2. **Share**: the plan calls for "share copies a permalink". This is a client-side feature using `navigator.share` or a clipboard copy. No backend change required.

3. **UI integration**: the like button in `ProductDetailsView` and the follow button in `UserProfileView` need to be wired to the real services.

## Effort to complete

- Add `user_follows` migration (follower_id, followee_id, created_at, unique constraint).
- Add `FollowService` interface and `SupabaseFollowService` implementation.
- Wire `UserProfileView` to call `follow()` and `unfollow()`.
- The like button is already wired.

## Next steps

1. Create the `user_follows` migration.
2. Add the `FollowService` interface and implementation.
3. Wire the UI.
