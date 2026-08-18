# U7 Progress: Chat with Supabase Realtime

**Date:** 2026-08-16
**Status:** subscribeMessages method implemented; awaiting end-to-end verification
**Owner:** U7 (Wire Chat with Supabase Realtime)

## What is done

1. **`ChatService.subscribeMessages`** in contracts.ts:
   - Signature: `subscribeMessages(threadId, listener): () => void`.
   - Returns an unsubscribe function. The listener is called with a `ChatMessageRecord` whenever a row is inserted into `chat_messages` for the thread.

2. **`SupabaseChatService.subscribeMessages`** in supabase.ts:
   - Opens a Supabase Realtime channel `messages:<threadId>`.
   - Subscribes to `postgres_changes` INSERT events on `chat_messages` filtered by `thread_id`.
   - Maps the payload through `chatMessageFromRow`.
   - Returns a cleanup that calls `client.removeChannel(channel)`.

3. **Typecheck** passes.

## What is still pending

1. **RLS policy on chat_messages**: the plan calls for a policy that ensures only conversation participants can subscribe. Phase 3's migration should already include this; verify with `select * from pg_policies where tablename = 'chat_messages'`.

2. **UI integration**: the chat view (`ChatView`) needs to call `subscribeMessages` when opened and call the unsubscribe function when closed.

3. **End-to-end verification**: two browsers, two accounts, send messages; verify they appear without refresh.

## Next steps

1. Wire the chat view to use `subscribeMessages`.
2. Run a smoke test against the local Supabase.
3. Add TypingIndicator and presence (Phase 1 doesn't require these; defer to Phase 2).
