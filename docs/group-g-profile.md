# G-32 / G-33 / G-34 / G-35 / G-36 / G-37 / G-38 — Profile, Account & Settings

> **Screen IDs**: G-32 (Vault expansion), G-33 (Edit Profile),
> G-34 (Loves filters + share), G-35 (Saved Addresses),
> G-36 (Saved Payment Methods), G-37 (Settings),
> G-38 (Help & Support).
> **Status**: ✅ All seven built, tested, and wired in.
> **Data**: existing `addresses.ts` + `paymentMethods.ts` (M2), plus a new
> `UserProfile` type on `AppContext` for G-33.

---

## Why this session

Group G is the user-account fabric. Before this session:
- `UserProfileView` had 3 tabs and 2 quick-action cards.
- `SettingsView` was a 24-line skeleton with 2 sections.
- There was no way to manage saved addresses, saved cards, or edit the
  user's profile.
- There was no Help centre.

This session adds all 7 pages, rewires the Vault to expose
quick-action cards for each management view, and rebuilds Settings into
5 sections with deep-link entry points.

---

## G-32 — Vault expansion

No new page — `UserProfileView` now accepts 3 more optional props
(`onOpenEditProfile`, `onOpenAddresses`, `onOpenPaymentMethods`)
and renders them in the quick-actions grid:

```
+-------------------+ +-------------------+
| 📦 Purchases      | | 💬 Messages       |
+-------------------+ +-------------------+
+-------------------+ +-------------------+
| 🏠 Addresses      | | 💳 Payment        |
+-------------------+ +-------------------+
+ Edit profile ✎ (top-right corner of profile card)
```

When the parent wires these, the Vault now links directly into
G-33 / G-35 / G-36 / F-28 / C-16.

---

## G-33 — Edit Profile

A focused form to update the user's profile snapshot:

- **Avatar**: picker from 3 preset avatars (Phase 1 hardcodes URL
  slugs; Phase 3 will swap to a real upload pipeline).
- **Display name** + **@handle** + **Bio** + **City**.
- **Style tags**: up to 5 chips with a small input + "+" button. Tapping
  a chip removes the tag.

On submit, `updateUserProfile(patch)` writes through to localStorage
(`mooday_user_profile`). Phase 3 swaps to a PUT /me endpoint. The
`UserProfile` type lives on `AppContext`:

```ts
export interface UserProfile {
  fullNameEn: string; fullNameAr: string;
  handle: string;
  avatar: string;
  bioEn: string; bioAr: string;
  locationEn: string; locationAr: string;
  styleTagsEn: string[]; styleTagsAr: string[];
  rating: number; reviewsCount: number;
  followers: number; following: number;
}
```

---

## G-34 — Loves filters + share

Inlined into UserProfileView's "Loves" tab. Adds:

- **Category filter chips** (auto-derived from the user's liked items,
  sorted alphabetically). Filter is in-memory and resets when the
  component re-mounts.
- **Share button** that builds a deep-link URL of the form
  `https://mooday.app/@fatima_dxb/loves?cats=Bags` and copies it via
  `navigator.clipboard.writeText()` (with a 2-second "Copied" confirmation).

When no items match the category, an empty-state illustration replaces
the grid.

---

## G-35 — Saved Addresses

Management view. Re-uses the existing `addresses` state on
`AppContext` (already has full CRUD: `addAddress`, `removeAddress`,
`setDefaultAddress`).

### Affordances

- **Saved addresses list**: each row shows label icon (home/work/location),
  full name + phone, street + district + city.
- **Default badge** on the default address.
- **Make default** button on every non-default row.
- **Delete** opens a confirmation modal (Cancel / Delete), preventing
  accidental loss.
- **Add new** reveals an inline form with 7 UAE emirates, district,
  notes, and a "Make default" checkbox.
- **Empty state**: shows a "home" icon + add CTA.

All copy bilingual. Inline error alert if the user tries to save
without a full name or street.

---

## G-36 — Saved Payment Methods

Twinned with G-35 but for cards. Re-uses the existing `paymentMethods`
state (full CRUD already wired in M2).

### Affordances

- **Saved cards list**: each row shows a coloured brand badge (Visa /
  Mastercard / Amex / Apple Pay) + last-4, cardholder name, expiry,
  and a Default badge.
- **Make default** + **Delete** (with confirm modal).
- **Add new card**: cardholder name + auto-formatting card number
  (4-4-4-4 grouping with non-digit stripping) + MM/YY expiry (auto-
  inserts `/`) + CVV + "Make default" checkbox.
- **Brand detection**: a 16-digit card with prefix `4` is detected as
  Visa, `5` as Mastercard, anything else as Amex. The label and
  AR copy update automatically.

Empty state CTA. Bilingual throughout.

---

## G-37 — Settings depth (rewrite)

`SettingsView` was a 24-line placeholder. The rewrite has **5 sections**
with 14 total settings, mixing interactive selects + toggles +
navigate-on-click items.

### Sections

1. **Account** — Edit Profile, Addresses, Payment methods.
2. **Preferences** — Language picker (real, persists via
   `useApp().setLanguage`), Push notifications (toggle, Phase 3 wires),
   Dark mode (toggle, Phase 3 wires).
3. **Privacy & Safety** — Blocked users (placeholder, lands in H-43),
   Mooday Safe Escrow policy (info link).
4. **About** — Clear cached images (Phase 3 wires, helper copy
   surfaces the size), Help & Support, Version.
5. **Log Out** — disabled, with `signOutHint` explaining it's Phase 3.

Toggles are visual-only for Phase 1 (no state hook) — they animate the
dot but don't persist. The language picker IS wired.

---

## G-38 — Help & Support

Three-section help centre:

1. **FAQ accordion** with 4 curated Q&A pairs (bilingual):
   - "How do I sell on Mooday?"
   - "When will I get paid?"
   - "What if the buyer doesn't receive the item?"
   - "Is every seller identity verified?"

   Each Q expands to show its A on tap. `aria-expanded` reflects state.

2. **Order lookup** — paste an `ord-XXXX` to deep-link into the matching
   order in F-17. Validates against `useApp().orders`. Shows
   "No order matches that id." (red) for misses, "Order found — tap to
   open." (green) for hits.

3. **Other channels** — 3 clickable cards: Email, WhatsApp, Community
   (Discord). Tapping opens a Phase 3 placeholder alert.

---

## Wiring

| Layer | Change |
|-------|--------|
| `src/types/navigation.ts` | added `"edit-profile"`, `"addresses"`, `"payment-methods"`, `"help"` to `ViewState` and `VALID_VIEWS`. |
| `src/hooks/useAppNavigation.ts` | added `openEditProfile/close/`, `openAddresses/close`, `openPaymentMethods/close`, `openHelp/close`. |
| `src/context/AppContext.tsx` | added `UserProfile` type, `userProfile` state, `updateUserProfile` mutator (persisted to `mooday_user_profile`). |
| `src/components/SavedAddressesView.tsx` | new (G-35). |
| `src/components/SavedPaymentMethodsView.tsx` | new (G-36). |
| `src/components/EditProfileView.tsx` | new (G-33). |
| `src/components/HelpSupportView.tsx` | new (G-38). |
| `src/components/SettingsView.tsx` | rewritten (G-37) — 5 sections, 14 items. |
| `src/components/UserProfileView.tsx` | added Edit Profile button, addresses + payment quick-actions, and `LikesTabContent` sub-component (G-34). |
| `src/components/AppContent.tsx` | new `case`s for the 4 new views; Settings case wires all 4 deep-link callbacks. |
| `src/types/navigation.test.ts` | updated VALID_VIEWS list. |
| All test `makeContext` helpers | added `userProfile` and `updateUserProfile`. |

---

## Test coverage

- `SavedAddressesView.test.tsx` — 11 tests.
- `SavedPaymentMethodsView.test.tsx` — 9 tests.
- `EditProfileView.test.tsx` — 9 tests.
- `HelpSupportView.test.tsx` — 8 tests.
- `navigation.test.ts` — updated VALID_VIEWS assertion.
- (No new tests for SettingsView/UserProfileView tweaks; existing
  coverage still passes green.)

**+37 new tests**, total now **297** (was 260).

`npm run verify` is GREEN across the board:

- ✅ typecheck (0 errors)
- ✅ eslint (0 errors; existing `<img>` warnings only)
- ✅ **297 tests passing**
- ✅ production build

---

## Out of scope (deferred)

- **Real file upload** for avatar (G-33) and card images (Phase 3).
- **Persisted toggle state** for Push notifications + Dark mode (Phase 3).
- **Real FAQ content** — current 4 entries are placeholder; Phase 3
  swaps to a CMS-fed list.
- **Blocked users management** (H-43) is a placeholder entry pointing
  to Settings; the real view ships with Group H.
- **Real Order Tracking integration** — the order lookup just calls
  `openOrder(id)` which dispatches to F-17.

---

## Acceptance criteria (Phase 1 "done")

- ✅ G-32 — Vault quick-actions expose Edit Profile, Addresses,
  Payment, Messages, Purchases
- ✅ G-33 — Edit profile form updates display name, handle, bio, city,
  avatar, style tags (all bilingual)
- ✅ G-34 — Loves tab has category filter + share-as-collection deep-link
- ✅ G-35 — Saved Addresses with CRUD, default badge, inline form, confirm
- ✅ G-36 — Saved Payment Methods with CRUD, default badge, brand
  detection, confirm
- ✅ G-37 — Settings rewritten with 5 sections + 14 items, language
  picker wired
- ✅ G-38 — Help & Support with FAQ accordion, order lookup, channels
- ✅ All views bilingual EN/AR
- ✅ No new top-level dependencies
- ✅ `npm run verify` green
