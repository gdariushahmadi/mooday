# P1-01 — App Shell Completion Record

Completed on 2026-07-14 against the Phase 1 alignment contract.

## Delivered

- Reduced the shared header to Settings, a geometrically centered Mooday wordmark, and Shopping Bag.
- Kept authentication reachable through Welcome and Settings.
- Kept Notifications reachable through Activity.
- Rebuilt the bottom navigation as a fixed five-column grid.
- Added top and bottom safe-area handling.
- Removed shared header and bottom navigation from Product, Chat, Bag, and Checkout states.
- Added a local Material Symbols fallback contract so icon ligature names cannot create horizontal overflow while the external font loads.
- Added focused shell tests for hierarchy, navigation wiring, full-page chrome, active-tab semantics, and Arabic labels.

## Visual evidence

- [English Home](./home-en.png)
- [Arabic Home](./home-ar.png)
- [English Bag](./bag-en.png)
- [Arabic Bag](./bag-ar.png)

## Measured acceptance results

| Check | Result |
|---|---|
| Reference viewport | `393 × 852` |
| English document width | `393px` |
| Arabic document width | `393px` |
| Wordmark offset from viewport centre | `0px` |
| Bag shared header | Hidden |
| Bag shared bottom navigation | Hidden |
| Arabic document direction | `rtl` |

Screen-specific Discover composition remains part of `P1-02`; this ticket only establishes the shared shell around it.
