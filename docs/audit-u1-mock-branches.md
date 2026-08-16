# U1 Audit: Mock-Mode Branches in AppContext

**Date:** 2026-08-16
**Status:** in-progress
**Owner:** U1 (Stabilize the phase2Backend toggle)

## Goal

Make the existing `phase2Backend` flag in `src/context/AppContext.tsx` the single switch between mock and real stores; remove dead branches; document the remaining ones with `TODO(phase-N):` comments referencing the U-ID that completes them.

## Source of truth

`src/context/AppContext.tsx` derives `authMode` from `phase2Backend`:

```
const phase2Backend = useMemo(() => getPhase2Backend(), []);
const authMode: "mock" | "supabase" = phase2Backend ? "supabase" : "mock";
```

`getPhase2Backend()` reads `process.env.NEXT_PUBLIC_DATA_SOURCE` and returns the Supabase service handle when set to `supabase`. The `marketplaceMode` toggle is separate and controls listings/social/etc.

## Inventory of mock-mode branches

12 conditional exits gated by `phase2Backend` or `phase2Backend`-bearing expressions. These are the early-return guards that keep mock mode running.

### Early-return guards

- L581: marketplaceMode + phase2Backend flag for remote vs mock listings queries.
- L657: setAuthReady based on phase2Backend. Auth is "ready" instantly in mock mode.
- L661: early return before phase2Backend.signIn call.
- L699: early return before HydrateUser.
- L742: early return before remote listings fetch.
- L800: early return before remote listings load.
- L1109: early return before chat thread fetch.
- L1154: early return before chat message send.
- L1164: early return before notifications fetch.
- L1186: early return before social follow.
- L1196: early return before social like.
- L1889: early return false in remote-mock fallback path.

### Comments calling out mock-mode behavior

- L102: Phase 1 mock data leaves this undefined.
- L179: Force a re-fetch of remote listings (no-op in mock mode).
- L239: Group A auth (Phase 1 mock).
- L245: Raw Phase 2 backend handle (null in mock mode).
- L644: Auth state (Phase 1 mock).
- L736: remote backend. No-op in mock mode.
- L788: Phase 1 Product shape. In mock mode this is a no-op.
- L883: private bucket; Phase 1 mock URLs persist as passthrough.
- L1104: mock mode. Threads are sorted most-recent first.
- L1729: Group A auth mutators (Phase 1 mock).
- L1953: mock-mode fallback uses the seller display.

## Mapping to implementation units

Each guard is a candidate for removal once the dependent U-ID ships. The mapping:

- L581: replaced by U3 (Listings read).
- L657 / L661: replaced by U2 (AuthService).
- L699: replaced by U2 (AuthService).
- L742: replaced by U3 (Listings read).
- L800: replaced by U3 (Listings read).
- L1109: replaced by U7 (Chat Realtime).
- L1154: replaced by U7 (Chat Realtime).
- L1164: replaced by U10 (NotificationService).
- L1186: replaced by U8 (SocialService).
- L1196: replaced by U8 (SocialService).
- L1889: cleanup in this unit (U1).

## Plan

1. Run `npm run typecheck && npm run lint && npm run test:ci` against the current code. Baseline: passes per `npm run typecheck`.
2. Add `TODO(phase-N): <U-ID>` comments to each guard that depends on a future unit. The comment helps the implementer know which unit completes the branch.
3. After all dependent U-IDs ship, remove the guards and the `authMode` branch entirely.

## Status

- Inventory of mock-mode branches documented (done).
- Comments to be added to each branch.
- L1889 (the remote-mock fallback) to be analyzed and either removed or kept.
