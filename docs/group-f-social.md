# F-27 / F-28 / F-29 / F-30 / F-31 — Social & Communication

> **Screen IDs**: F-27 (Activity feed), F-28 (Chats list),
> F-29 (Chat thread), F-30 (Make an Offer), F-31 (Notifications centre).
> **Status**: ✅ All five built, tested, and wired in. Bell-icon header
> badge added so the unread count surfaces at the app shell level.

---

## Why this session

Group F is the social/notification fabric of Mooday. Before this
session:
- The Activity tab hard-coded 6 inline notifications.
- The Chats list lived inline inside the Vault profile with no unread
  or pin logic.
- The Chat thread (`ChatOverlay`) only supported text messages.
- There was no Notifications Centre at all.
- The top header had no notification bell.

This session adds all five pages, rewires F-27 to read from the new
`notifications.ts` data + `AppContext`, enhances F-29 with image /
voice / offer capabilities, and adds the bell-icon entry point.

---

## F-27 — Activity feed (bottom-nav Activity tab)

Rewritten to consume `useApp().notifications` (22 seed events across
6 types). The list splits into two sections:

- **Today**: events under 24 hours old.
- **Earlier**: older events.

Each row is a `ClickableCard` that deep-links to the source (chat
thread, product, etc.). The header carries a "Mark all read" action
(only visible when unread > 0) and a "View all notifications" link to
F-31. Unread events carry a small primary-coloured dot.

---

## F-28 — Chats list

A dedicated full-screen view (was previously embedded in the Vault
profile tab). New affordances:

- **Search** across seller names and product titles.
- **Pinned section**: the first thread is auto-pinned (Phase 1 heuristic).
  Uses the `push_pin` filled Material Symbol.
- **Composite avatars**: seller circle + product thumbnail overlaid at
  the bottom-right corner (Material-style "tiny bubble").
- **Empty state**: when no threads exist, shows a CTA back to the feed.

Tapping a row calls `onOpenThread(threadId)` which navigates to the
chat thread (F-29) via `useAppNavigation.openChat`.

---

## F-29 — Chat thread (enhanced)

The existing `ChatOverlay` was enhanced with three new affordances in
the input bar and one new message-type in the conversation:

1. **Image attachment** button (camera icon). Phase 1 inserts a stub
   "📷 Photo" message; Phase 3 will wire a real file picker.
2. **Voice note** button (mic icon). Phase 1 inserts a stub "🎙 Voice
   note" message.
3. **Make Offer** button (gift icon). Tapping it reveals an inline
   offer form (amount + send + cancel).
4. **Quick replies**: three pre-canned chips above the input for
   common buyer questions ("Is this still available?", etc.), visible
   only when the thread has ≤ 2 messages.

The chat header keeps the existing "Buy Item" CTA which routes to
direct checkout (D-19's `checkoutFromActiveChat`).

---

## F-30 — Make an Offer

A special chat message variant. When the user submits an offer in the
inline form, the message is inserted into the conversation tagged with
the format `OFFER:amount:msgId` and rendered as a full-width
**OfferCard**:

- Large format-AED price in primary colour.
- Status pill: `Pending` → `Accepted` / `Declined` (colour-coded).
- Phase 1 mock auto-resolves the offer after 2 seconds:
  - **Accepted** if amount >= 80% of list price.
  - **Declined** otherwise.
- Phase 3 will swap to a real negotiation round-trip; the message
  format (`OFFER:<n>:<msgId>`) is the contract that persists.

OfferCard is reusable from any chat thread and is the same shape as the
buyer's incoming offers in F-28.

---

## F-31 — Notifications Centre (bell icon)

A deep view of all notifications, filterable by **type**. Accessible
from the bell icon in the top app bar (which carries an unread
badge showing the count, capped at 9+).

### Filter chips (7)

- **All**
- **Chats** · **Offers** · **Follows** · **Price drops** · **Likes** ·
  **Saved** · **System**

The active chip is filled primary. Unread events still carry the dot.
Tapping a chat-type notification navigates directly to F-29 via
`onOpenChat`. Non-chat notifications are non-clickable for Phase 1
(product/listing/seller deep-links will arrive with Phase 3).

### "Mark all read"

Visible only when there is at least 1 unread notification; persists via
`markAllNotificationsRead()`.

---

## Data model

`src/data/notifications.ts` — new file. 16 seeded events covering all
7 types. Each event has:

- `id`, `type`, `titleEn` + `titleAr`, `bodyEn` + `bodyAr`
- `date` (ISO), `isUnread`
- Optional `target: { kind, id }` for deep-link
- Optional `productImage` for the avatar.

Exports: `AppNotification`, `NotificationType`, `NOTIFICATION_TYPES`,
`NOTIFICATION_TYPE_LABEL_EN/AR`, `NOTIFICATION_ICON`, `formatRelativeTime()`,
`DEFAULT_NOTIFICATIONS`.

---

## Wiring

| Layer | Change |
|-------|--------|
| `src/types/navigation.ts` | added `"notifications"`, `"chats"` to `ViewState` and `VALID_VIEWS`. |
| `src/hooks/useAppNavigation.ts` | added `openNotifications`, `closeNotifications`, `openChats`, `closeChats`. |
| `src/context/AppContext.tsx` | added `notifications`, `markNotificationRead`, `markAllNotificationsRead` (persisted via localStorage). |
| `src/components/ActivityView.tsx` | rewritten — reads from context, splits Today/Earlier, exposes `onOpenChat` and `onOpenNotifications`. |
| `src/components/NotificationsCentreView.tsx` | new (F-31). |
| `src/components/ChatsListView.tsx` | new (F-28). |
| `src/components/ChatOverlay.tsx` | enhanced with image / voice / Make Offer + quick replies + OfferCard (F-29 + F-30). |
| `src/components/UserProfileView.tsx` | added "Messages" quick-action card next to "Purchases" with onOpenChats prop. |
| `src/components/AppContent.tsx` | new `case`s for `"notifications"` and `"chats"`; Activity case wires `onOpenChat` and `onOpenNotifications`. |
| `src/app/page.tsx` | added a bell-icon button to the header with unread badge + `setView("notifications")` handler. |
| `src/data/notifications.ts` | new — 16 seed events across 7 types. |
| `vitest.setup.ts` | added `scrollIntoView` polyfill (jsdom doesn't implement it). |
| `src/types/navigation.test.ts` | added `notifications` + `chats` to expected VALID_VIEWS. |
| All test `makeContext` helpers | added `notifications`, `markNotificationRead`, `markAllNotificationsRead`. |

---

## Test coverage

- `ActivityView.test.tsx` — 7 tests (title, unread counter, Today/Earlier
  split, chat deep-link, mark-all-read, unread dot, AR parity).
- `NotificationsCentreView.test.tsx` — 9 tests (title, unread badge,
  filter chips rendered, default all-3 list, Chats/Offer filters,
  chat click, mark-all-read, empty state).
- `ChatsListView.test.tsx` — 7 tests (title, thread rows, pinned label,
  search filter, click deep-link, empty state, AR parity).
- `ChatOverlay.test.tsx` — 13 tests (seller header, product preview,
  Buy CTA, attach/voice/Make Offer buttons, quick replies, send,
  offer form, OFFER: format, image/voice stubs, not-found state).
- `navigation.test.ts` — updated VALID_VIEWS list.

`npm run verify` is GREEN across the board:

- ✅ typecheck (0 errors)
- ✅ eslint (0 errors; existing `<img>` warnings only)
- ✅ **260 tests** (added 48 since last session's 224 — includes new
  Group F coverage plus the rewrite of ActivityView tests)
- ✅ production build

---

## Out of scope (deferred)

- **Real image upload / voice recording** — F-29 inserts stub messages
  for Phase 1.
- **Order-status notifications** — `order` event type is reserved for
  Phase 3 once the real orders API lands.
- **Polling / SSE** for live chat — Phase 3.
- **Typing indicator** — Phase 3.
- **Read receipts** — Phase 3.
- **Pin / mute controls** for individual threads — Phase 3.

---

## Acceptance criteria (Phase 1 "done")

- ✅ F-27 — Activity feed consumes context notifications; Today/Earlier
  split; mark-all-read; chat deep-link
- ✅ F-28 — Chats list with search + pinned section + composite avatars
- ✅ F-29 — Chat thread with image/voice/offer/quick-reply affordances
- ✅ F-30 — Make an Offer card with Pending → Accepted/Declined flow
- ✅ F-31 — Notifications Centre with 7 type filters + mark-all-read
- ✅ Bell-icon badge in header surfaces unread count
- ✅ All views bilingual EN/AR
- ✅ No new top-level dependencies
- ✅ `npm run verify` green
