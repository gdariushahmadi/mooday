# U10 Progress: NotificationService Real-time

**Date:** 2026-08-16
**Status:** NotificationService.subscribe added; awaiting UI integration
**Owner:** U10 (Wire NotificationService for in-app + email)

## What is done

1. **NotificationService** in contracts.ts exposes listMine, markRead, markAllRead, and the new subscribe method.
2. **SupabaseNotificationService.subscribe** opens a Supabase Realtime channel `notifications:user` and listens for INSERTs on the `notifications` table. Filters by `recipient_id` so only the current user's notifications are dispatched.
3. **Trigger fan-out**: The `notification_fanout` migration already creates triggers on `orders`, `chat_messages`, and `seller_reviews` that write to `notifications`.
4. **Email templates**: Supabase Auth built-in templates cover verification, password reset, and notification emails. No SMTP setup required.
5. **Typecheck** passes.

## What is still pending

1. UI integration: the notifications view should call `subscribe` when opened and unsubscribe when closed.
2. End-to-end test: trigger a like and verify the notification arrives in real time.
