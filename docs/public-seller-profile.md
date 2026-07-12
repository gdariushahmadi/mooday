# Public Seller Profile — B-11 Implementation

## Goal
A read-only public profile of another seller, reachable from a tap on
the seller card on a product page, from a chat header, or from a
search result. Shows the seller's avatar, bio, stats, ratings,
reviews, and their active listings. Lets the visitor follow the
seller or open a chat with them.

## Distinct from G-32 (The Vault)
The current `UserProfileView` is the **own** profile. It shows the
current user's own listings in the "Closet" tab and has no follow
CTA. B-11 is a different screen with different actions:

| | G-32 (own) | B-11 (other) |
|---|---|---|
| Header | "My Closet" (X listings) | Avatar + name + handle + Follow/Message CTAs |
| Stats | Listings, Followers, Following | Same, plus Rating + Reviews count + Response time |
| Tabs | Closet, Loves, Chats, Purchases, Sales, Rentals | Listings, Reviews (no Loves/Chats — private to the user) |
| Actions | Edit Profile, Settings | Follow/Unfollow, Message, Share, Report, Block |
| Reviews | Not shown | Full reviews list with rating filter |

We build B-11 as a new component (`PublicSellerProfile`) and keep
`UserProfileView` for the own profile. Phase 2 will add the Follow
action's persistence.

## Behavior
- Reachable via deep link `/?view=seller&seller=<id>` and from any
  product page's seller card.
- 404-like empty state if the seller id is unknown.
- Follow state: starts as "not following". Tapping Follow flips to
  "following" (locally only; Phase 2 persists server-side).
- Report and Block open modals (H-41 and H-44). For now we just
  wire the triggers; the modals themselves ship in M9.
- Review filter: chips for All / 5★ / 4★ / 3★ / 2★ / 1★.
- Reviews are seeded from the new `reviews.ts` mock data.

## Components

### 1. `PublicSellerProfile` (`src/components/PublicSellerProfile.tsx`)
Props:
```ts
interface PublicSellerProfileProps {
  sellerId: string;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenChat: (sellerId: string) => void;
}
```

Layout:
- Back button (top of page) with bilingual aria-label.
- Hero card: avatar, name (EN+AR), handle, bio (EN+AR), location,
  "Verified" badge, member-since year, response time, response rate.
- Stats row: 4 cells (Listings, Followers, Following, Rating).
  Rating is 4.9 + ⭐ + "(N reviews)".
- CTAs row: "Follow" (primary) + "Message" (secondary, opens chat).
  Below: "Share" + "Report" + "Block" (icon row, all wired).
- Tabs: "Listings (N)" | "Reviews (N)".
- Listings tab: grid of the seller's active listings, each tappable
  to the product page.
- Reviews tab: filter chips + list of reviews. Each review shows
  reviewer name, date, star rating, text, quick tags, verified-purchase
  badge. Empty state if filtered list is empty.

### 2. Mock data additions
- `src/data/reviews.ts` (new) — 80+ reviews distributed across all
  sellers. Each review: `id`, `sellerId`, `reviewerName`, `reviewerAvatar`,
  `rating` (1–5), `date` (ISO string), `textEn`, `textAr`, `quickTags`
  (array of the 4 showcase tags), `verifiedPurchase: boolean`,
  `orderId` (string, for the verified-purchase badge).
- Extend `Sellers` type with: `joinedAt`, `isVerified`, `responseRate`,
  `responseTimeHours`, `bioEn`, `bioAr`, `styleTags` (array of EN+AR
  tags), `coverImage` (optional, falls back to a gradient).

### 3. Service layer (M1 carry-over)
- `src/services/sellers.ts` — `getSellerById`, `getSellers`, `isFollowing`,
  `follow`, `unfollow`, `getReviewsForSeller`.
- `src/services/reviews.ts` — `getReviews`, `getReviewsForSeller`,
  `addReview` (stub for Phase 2).

### 4. Route integration
- Add `"seller"` to `ViewState` union.
- In `AppContent`, handle the `seller` case: read `?seller=<id>` from
  URL params (we already have the deep-link reading), render
  `<PublicSellerProfile>` with the resolved seller.
- `useAppNavigation` gets a new `openSeller(sellerId)` action.

### 5. Product-page wiring
- In `ProductDetailsView`, the seller card (currently a div with
  name and avatar) becomes a `ClickableCard` that calls a new
  `onOpenSeller` prop, which is wired to `openSeller`.
- The chat header in `ChatOverlay` gets a "View profile" link that
  opens the seller's public profile too.

## Test coverage

### `src/components/PublicSellerProfile.test.tsx`
- Renders seller avatar, name, handle, stats.
- Tabs are keyboard reachable and announce correct counts.
- Listings tab shows the seller's active listings.
- Reviews tab shows reviews with star ratings.
- Review filter chips narrow the list.
- Follow button toggles to "Following" on click.
- Message button calls `onOpenChat`.
- Back button calls `onBack`.
- 404 state for unknown seller.
- Bilingual: renders Arabic bio and CTA labels when language is ar.
- `aria-pressed` on Follow button reflects the current state.

### `src/services/sellers.test.ts`
- `getSellerById` returns the right seller.
- `getSellerById` returns null for unknown id.
- `isFollowing` defaults to false.
- `follow` flips `isFollowing` to true and persists to localStorage.
- `unfollow` flips it back to false.
- `getReviewsForSeller` returns only the matching seller's reviews.

### `src/data/reviews.test.ts`
- All reviews have a `sellerId` that points to a known seller.
- All reviews have bilingual text (en + ar).
- Rating distribution looks reasonable (not all 5★, not all 1★).

## Definition of done
- Component renders without console errors.
- All eight acceptance scenarios pass.
- 100% of new code has unit tests.
- `npm run verify` green.
- The seller card on a product page is now clickable and opens B-11.
- Bilingual copy complete.
- Accessible: `role="tab"`, `aria-selected`, keyboard nav between tabs.
- Works in both LTR and RTL.
