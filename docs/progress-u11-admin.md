# U11 Progress: Admin Moderation UI

**Date:** 2026-08-16
**Status:** UI built; live/mock toggle present; awaiting end-to-end verification
**Owner:** U11 (Build Admin Moderation UI)

## What is done

1. **Admin app** at `src/app/admin/page.tsx` with 8 tabs: overview, listings, orders, users, disputes, reports, broadcast, audit-log.
2. **Live/mock toggle** via `isLiveMode` state. When true, calls `src/services/admin/actions.ts`; when false, calls `src/services/admin/mockAdminService.ts`.
3. **Admin actions** at `src/services/admin/actions.ts` use the service-role Supabase client to bypass RLS for moderation actions.
4. **Admin migrations** at `supabase/migrations/202607150008_phase_3_5_admin.sql` and `202608060005_seed_admin.sql` set up the admin role and seed an initial admin user.
5. **`admin_get_user_emails`** migration (202608060007) provides the lookup for admin users.

## What is still pending

1. End-to-end test:
   - Admin flags a listing; the listing disappears from search within 30 seconds.
   - Admin approves a flagged listing; the flag clears.
   - Admin role check: non-admin users cannot access `/admin`.

2. UI polish: the disabled state when an unauthenticated user navigates to `/admin`.

## Next steps

1. Run a smoke test against the local Supabase.
2. Verify the admin role RLS policy.
