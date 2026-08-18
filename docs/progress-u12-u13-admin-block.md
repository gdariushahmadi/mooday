# U12 + U13 Progress: Admin User Management + Block/Report

**Date:** 2026-08-16
**Status:** BlockService and ReportService implemented; admin user-management UI built
**Owner:** U12 + U13

## What is done

### U12: Admin User Management
- The admin app at `src/app/admin/page.tsx` has a `users` tab. The `adminListUsers`, `adminSuspendUser`, `adminUnsuspendUser` actions are wired.
- The `admin_get_user_emails` migration (202608060007) provides the email lookup.

### U13: Block, Report, BlockList
- **BlockService** in contracts.ts: listMine, block, unblock.
- **ReportService** in contracts.ts: listMine, create.
- **SupabaseBlockService** and **SupabaseReportService** are implemented.
- The `blocked_users` migration (202608060002) defines the table with RLS for self-management.
- The `phase_3_social` migration defines the `reports` table with RLS.
- The `BlockedUsersView` and `ReportView` UI components exist.

## What is still pending

1. End-to-end test for block:
   - User A blocks User B; User B cannot see User A's listings.
   - User A unblocks User B; User B can see User A's listings again.

2. End-to-end test for report:
   - User A reports User B's listing; admin sees the report in U11.

3. Block enforcement:
   - The RLS policies on `listings`, `chat_messages`, etc. need to filter out blocked users.
   - Verify that the existing policies include block checks.

## Effort to complete

The remaining work is verifying existing RLS policies filter blocked users from:
- Listings visibility (the `listings_select_visible` policy).
- Chat thread creation (the `chat_threads_insert` policy).
- Reviews (the `seller_reviews_insert` policy).

If the RLS policies don't filter blocks, add a check to each.
