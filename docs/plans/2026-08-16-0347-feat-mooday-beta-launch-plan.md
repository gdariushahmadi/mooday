---
title: Mooday Beta Launch - Plan
date: 2026-08-16
type: feat
topic: mooday-beta-launch
artifact_contract: ce-unified-plan/v1
 artifact_readiness: implementation-ready
product_contract_source: ce-brainstorm
execution: code
---

# Mooday Beta Launch - Plan

## Goal Capsule

- **Objective:** Ship Mooday's 40-screen marketplace (everything except Rent) to closed beta in UAE with no mock data, before Phase 4 (Rent) starts. Solo dev, 6+ months, deployment to the existing cPanel host.
- **Product authority:** This plan owns the production delivery of Mooday's marketplace (Onboarding, Discovery, Buying, Resell, Social, Profile, Trust & Safety). Phase 4 (Rent) is downstream and not active scope.
- **Open blockers:** Image storage CDN choice, monitoring tool selection, backup strategy confirmation (defaults noted in Outstanding Questions).

## Product Contract

### Summary

Mooday, an Arabic + English marketplace, ships to closed beta in UAE with real Supabase backend, Stripe test mode payments, real-time chat, and basic admin. All 40 screens work end-to-end with no mock data. Built by a solo dev over 6+ months using the critical path first delivery order.

### Key Decisions

- **Auth is email + password via Supabase Auth built-in.** (session-settled: user-directed — chosen over Phone OTP: simpler for solo dev.) Governs R3, R4.
- **Payments run on Stripe in test mode.** No real money moves; no seller KYC needed. Governs R5, R6.
- **Real-time chat uses Supabase Realtime.** (session-settled: user-directed — chosen over polling: modern UX.) Governs R7.
- **Search uses PostgreSQL FTS.** Built into Supabase, free, sufficient for beta volume. Governs R9.
- **Notifications are in-app + email.** (session-settled: user-directed — chosen over Push: balance of UX and complexity.) Governs R8.
- **Admin is basic.** Moderation + user management only. Governs R11, R12.
- **Disputes and refunds are manual.** Admin handles via Supabase Studio initially; no automated rules. Governs R12.
- **Delivery order is critical path first.** Auth + listings + buy + review before social + profile + admin, then trust & safety, then deploy. Governs R1, R2.
- **UI is Arabic + English only.** (session-settled: user-directed — chosen over Persian + Arabic: matches product and audience.) Governs R1.
- **Currency is AED only.** Single-currency beta for the UAE market. Governs R6.
- **Marketplace model is open C2C without KYC.** Anyone can sell; no identity verification. Governs R10, R11.
- **No rent mode in this plan.** Phase 4 is its own downstream plan. Governs R16.

### Requirements

**Scope and audience**

- R1. The plan delivers Mooday's 40-screen marketplace (Onboarding, Discovery, Buying, Resell, Social, Profile, Trust & Safety) in Arabic + English with no mock data, deployed to closed beta in UAE, before Phase 4 (Rent) starts.
- R2. The work covers a solo developer over 6+ months using the critical path first delivery order.

**Authentication and identity**

- R3. Users authenticate with email + password via Supabase Auth built-in, with email verification and password reset.
- R4. The product authority for authentication lives entirely with Supabase Auth; no custom auth UI is built.

**Payments and currency**

- R5. Payments use Stripe in test mode; cards work end-to-end but no real money moves.
- R6. All prices display in AED only; no multi-currency conversion.

**Real-time and notifications**

- R7. Direct buyer-seller chat uses Supabase Realtime for live messaging.
- R8. Order, message, and review events trigger both in-app notifications (badge + dropdown) and email notifications.

**Search and discovery**

- R9. Listing search uses PostgreSQL full-text search via Supabase; covers Arabic + English text.

**Trust & safety and admin**

- R10. Users can block, report, and review other users. Reviews are public and immutable once posted. Sellers can list without identity verification.
- R11. Admin can moderate listings, reviews, and users through a basic admin UI (moderation + user management only).
- R12. Disputes and refunds are handled manually by admin; no automated dispute resolution.

**Data and operations**

- R13. All user-facing data flows from Supabase; no mock-mode branching remains in the codebase (`authMode` is always `"supabase"`).
- R14. Image storage uses Supabase Storage; no external CDN by default.
- R15. The application deploys to the existing cPanel host (`app.daneg.ae`) via the existing `scripts/build-standalone.sh` deployment flow.

**Out of scope (explicit)**

- R16. The plan does not include Rent mode (Phase 4), seller KYC, multi-currency, push notifications, or the Persian language.

### Acceptance Examples

- AE1. Closed beta user signs up with email + password, receives verification email, verifies, logs in, browses Arabic listings, posts a listing, completes a Stripe test-mode purchase, sends a real-time message to the seller, and leaves a review. Covers R1, R3, R5, R7, R8, R9, R10, R13.
- AE2. Admin flags a listing for review, removes it, and the listing disappears from public search within 30 seconds. Covers R11, R12.
- AE3. A blocked user cannot view the blocker's listings, send messages, or leave reviews. Covers R10.
- AE4. A non-AED price never appears anywhere in the UI; a user searching in Arabic or English finds the same listing. Covers R6, R9.

### Key Flows

- F1. Sign up to first purchase
  - **Trigger:** New user opens the app for the first time.
  - **Steps:** Email signup → verification email → login → browse → list (optional) → buy via Stripe test card → message seller in real-time → leave review.
  - **Outcome:** New user has completed a full marketplace lifecycle once.
- F2. Admin moderation
  - **Trigger:** User reports a listing, or admin sees flagged content.
  - **Steps:** Admin sees flag → reviews → removes or approves → user is notified.
  - **Outcome:** Marketplace content stays moderated.
- F3. Real-time chat
  - **Trigger:** Buyer or seller opens a conversation from a listing or order.
  - **Steps:** Open chat → subscribe to channel → send message → receive reply in real-time → close.
  - **Outcome:** Buyer and seller communicate without page refresh.

### Scope Boundaries

**Outside this product's identity**

- Rent mode (Phase 4): a separate downstream plan. The current data model (`Product.type`) supports adding Rent later without rework.
- Seller KYC: not needed for beta; sellers can list without identity verification.
- Multi-currency: single currency (AED) only.
- Push notifications: deferred to post-beta; in-app + email cover beta.
- Persian language: not in the UI; the data model uses `label_ar` + `label_en`.

**Deferred for later**

- Image storage CDN: Supabase Storage is the default; add CDN if beta traffic justifies it.
- AI-powered support: not in beta.
- Advanced analytics: basic admin only.
- Auto-refund or auto-dispute: manual admin flow for beta.

### Dependencies / Assumptions

- 14 Supabase migrations are already in place; the work is wiring UI to backend and removing the mock layers.
- Supabase Storage is configured; existing migrations cover the data model.
- Supabase Auth built-in is sufficient for email verification + password reset.
- The cPanel deployment at `app.daneg.ae` works as the production target.
- Existing `scripts/build-standalone.sh` is the canonical deploy path.
- Internet payment processing in UAE allows Stripe test mode without additional licensing.

### Outstanding Questions

- **Resolved at confirmation:** Image storage has no external CDN (Supabase Storage only) — recorded as an explicit decision. Monitoring uses Sentry. Backup uses Supabase Pro point-in-time recovery. (Defaults confirmed by the user at synthesis confirmation.)
- **Deferred to Planning:** deployment hardening depth, observability setup, exact Phase 4 cutoff date, exact subset of "admin basic" features that ship in v1.

### How This Work Fits Together

<!-- ce-section: work-relationships -->

This plan owns the production delivery of Mooday's 40-screen marketplace with no mock data. The surrounding work breaks down as:

- **Depends on:** existing 14 Supabase migrations, cPanel deployment script, existing UI codebase.
- **Enables:** closed beta launch; downstream Phase 4 (Rent) plan.
- **Shares:** data model and admin layer with the future Phase 4 (Rent) plan.
- **Can proceed independently of:** Phase 4 (Rent) feature work.
- **Still to decide:** Phase 4 cutoff date; admin feature subset.

### Sources / Research

- `docs/ROADMAP.md` — Phase 1 scope and Phase 4 roadmap.
- `docs/phase-2-backend.md` — Supabase schema details.
- `docs/phase-3-marketplace.md` — Listings, social, cart, orders.
- `docs/group-h-trust.md` — Trust & Safety flow reference.
- `scripts/build-standalone.sh` — cPanel deployment flow.
- `supabase/migrations/` — 14 migrations covering identity through notifications.
- `src/context/AppContext.tsx` — `authMode: "mock" | "supabase"` switch to flip.
- `supabase/migrations/202608060001_payment_methods.sql` — payment table shape (Visa/MC/Amex/Apple Pay).
- `supabase/migrations/202608060004_notification_fanout.sql` — notification channels.
- `app.daneg.ae` — current production host.
## Planning Contract

**Product Contract preservation:** unchanged from requirements-only. The WHAT (R-IDs, A-IDs, F-IDs, AE-IDs) is preserved verbatim. This section adds the HOW.

### High-Level Technical Design

The project follows a service-interface pattern that already exists: `src/services/backend/contracts.ts` defines service interfaces (`AuthService`, `ProfileService`, `AddressService`, `ListingService`, etc.), and `src/services/backend/supabase.ts` implements them against Supabase. The UI consumes services through `src/context/AppContext.tsx`, which currently flips between a mock-mode store and a real-backend store via the `authMode: "mock" | "supabase"` switch.

**Architecture:**

- UI: Next.js 16 (App Router), React 19, Tailwind 4. Pages under `src/app/`, components under `src/components/`. Bilingual UI uses `src/lib/i18n.ts` (Arabic + English; no Persian).
- Service layer: `src/services/backend/contracts.ts` (interfaces) + `src/services/backend/supabase.ts` (Supabase implementation). Mappers under `src/services/backend/mappers*.ts` convert between DB rows and domain objects.
- Backend: Supabase (Postgres + Auth + Storage + Realtime). Schema lives in `supabase/migrations/`. RLS policies enforce row-level access.
- Payment: Stripe test mode. Webhook handler lives in a Next.js API route; the publishable key is the only client-side secret.
- Real-time: Supabase Realtime channels for chat, notifications, and order updates.
- Search: PostgreSQL full-text search via Supabase RPCs under `src/services/backend/`.
- Deploy: Next.js standalone build via `scripts/build-standalone.sh`, tarballed into `mooday-deploy.tar.gz`, uploaded to cPanel at `app.daneg.ae`.

**Mock-to-real migration strategy:**

The codebase already has a `phase2Backend` toggle that selects Supabase over the in-memory store. The work is to ensure every UI surface reads from the real store, then to remove the mock branches. The toggle stays in place during Phase 1-3 as a safety net; Phase 4 removes it after a stable beta.

### Key Technical Decisions

- **KTD1. Service-first architecture.** All UI binds to service interfaces in `contracts.ts`. The Supabase implementation lives behind a single import boundary so swapping providers is a one-line change. (Governs U1, U18.)
- **KTD2. Mock-then-real per feature.** Each feature wires its UI to the real Supabase store while the global `phase2Backend` flag still allows fallback. Per-feature toggles reduce blast radius. (Governs U2-U17.)
- **KTD3. Real-time via Supabase Realtime channels.** Chat uses `messages:<conversation_id>` channel subscriptions. Notifications use a single `notifications:<user_id>` channel. No polling. (Governs U7, U10.)
- **KTD4. Stripe webhook in a Next.js API route.** Webhook signature is verified with `stripe.webhooks.constructEvent`. The route delegates to the same `OrderService` used by the UI. (Governs U5.)
- **KTD5. Search uses Supabase RPCs.** A `search_listings(query text, filters jsonb)` RPC returns ranked results. Indexes on `ts_vector(title_en, title_ar, description_en, description_ar)`. (Governs U3.)
- **KTD6. Image uploads go through Supabase Storage.** Client uploads via `supabase.storage.from('listings').upload(...)`. The `fix_storage_foldername` migration enforces the folder shape. URLs are returned as public CDN URLs. (Governs U4.)
- **KTD7. Email lives in Supabase Auth.** Verification, password reset, and notification emails use Supabase's built-in templates; templates are configured in the Supabase dashboard. No external SMTP. (Governs U2.)
- **KTD8. Critical path first delivery.** Auth + Listings + Buy + Review before Social + Profile + Admin, then Trust & Safety, then Deploy. Each Phase 1 step is independently demoable. (Governs U2-U7.)
- **KTD9. Defer Phase 4 (Rent) feature work.** The `Product.type` field already supports `rent`; the rent screens are not in this delivery. (Governs U16.)
- **KTD10. Deploy via the existing cPanel script.** `scripts/build-standalone.sh --upload` builds the Next.js standalone bundle and uploads to `app.daneg.ae`. CI is local/manual; no GitHub Actions deploy. (Governs U20.)

### Sequencing Rationale

The critical path first order is driven by the dependency chain: Auth then Listings then Buy then Review then Chat. Each step is the smallest end-to-end slice that proves the next layer works. Social, Profile, and Admin parallelize on the working critical path. Trust & Safety is deferred because it has no upstream blocker and can be added without breaking the user journey. Deploy follows the betas; deploy before betas would deploy untested code.

## Implementation Units

### Phase 1: Critical Path (months 1-2)

### U1. Stabilize the phase2Backend toggle
- **Goal:** Make the existing `phase2Backend` flag in `src/context/AppContext.tsx` the single switch between mock and real stores; remove dead branches.
- **Requirements:** R13.
- **Dependencies:** None.
- **Files:** `src/context/AppContext.tsx`, `src/services/backend/config.ts`, `src/services/backend/index.ts`.
- **Approach:** Audit every `authMode === "mock"` branch. For each, decide: leave alone (still needed), replace with real service, or remove. After audit, document the remaining mock branches in a code comment with the phase number that completes them.
- **Test scenarios:**
  - When `phase2Backend=false`, the app boots and shows mock data.
  - When `phase2Backend=true`, the app boots and the AuthService returns `null` for unauthenticated users.
  - Each remaining mock branch has a `// TODO(phase-N):` comment referencing the U-ID that completes it.
- **Verification:** `npm run typecheck && npm run lint && npm run test:ci` passes.

### U2. Wire AuthService to all UI surfaces
- **Goal:** Email + password sign-up, sign-in, password reset, and email verification work end-to-end against Supabase Auth.
- **Requirements:** R3, R4.
- **Dependencies:** U1.
- **Files:** `src/components/SignUpView.tsx`, `src/components/SignInView.tsx`, `src/components/ForgotPasswordView.tsx`, `src/components/OtpView.tsx`, `src/context/AppContext.tsx`, `src/services/backend/supabase.ts`.
- **Approach:** Replace the mock OTP constant with a real Supabase OTP call. The existing `AuthService` interface already exposes the right methods; the Supabase implementation already exists. Wire UI callers to the real service. Remove the `MOCK_OTP_CODE` export.
- **Test scenarios:**
  - User signs up with a fresh email; receives a verification email; clicks the link; lands signed in. (Covers AE1 part 1.)
  - User signs in with valid email/password; lands on the home screen.
  - User signs in with wrong password; sees an error.
  - User requests a password reset; receives an email; clicks the link; sets a new password; signs in.
- **Verification:** The four flows above pass in a browser pointed at `http://localhost:3000` with Supabase running locally.

### U3. Wire ListingService to Discovery and Search
- **Goal:** Home, Browse, Category, Search, and Product Details pages show real listings from Supabase.
- **Requirements:** R9, R13.
- **Dependencies:** U1.
- **Files:** `src/components/CategoryLandingView.tsx`, `src/components/DiscoverTabsView.tsx`, `src/components/SearchFiltersView.tsx`, `src/components/ProductDetailsView.tsx`, `src/services/backend/supabase.ts`, `src/services/backend/contracts.ts`, `src/services/backend/mappers.ts`.
- **Approach:** Implement the `search_listings(query text, filters jsonb)` RPC. Add a `tsvector` index on the listing title/description columns. Wire each view to call `ListingService.search()` instead of the mock store. Cover AE4 (Arabic and English queries return the same listings).
- **Test scenarios:**
  - Searching Arabic for dress returns Arabic dress listings.
  - Searching English returns the same listings.
  - Filtering by price range and category narrows results.
  - An empty query returns recent listings.
  - Covers AE4.
- **Verification:** Manual search in both languages.

### U4. Wire ListingService to Resell and Sell flows
- **Goal:** Sell wizard, photo picker, and listing management pages write to Supabase.
- **Requirements:** R1, R13.
- **Dependencies:** U1, U2.
- **Files:** `src/components/SellItemView.tsx`, `src/components/listing/ListingPhotoPicker.tsx`, `src/components/MyClosetView.tsx`, `src/services/backend/supabase.ts`.
- **Approach:** Photo picker uploads to Supabase Storage via `supabase.storage.from('listings').upload(...)`. Save listing calls `ListingService.create()` with the public CDN URLs. My Closet lists the user's listings with status (draft/active/sold).
- **Test scenarios:**
  - User uploads 3 photos; sees previews; saves the listing; lands on My Closet with the new listing.
  - User edits a listing; changes price; saves; the listing shows the new price in Search.
  - User archives a listing; the listing disappears from Search but stays in My Closet with archived status.
- **Verification:** A listing created in the sell flow is searchable in U3's search.

### U5. Wire CheckoutService with Stripe test mode
- **Goal:** Checkout (cart, address, payment, confirmation) uses Stripe test mode end-to-end.
- **Requirements:** R5, R6.
- **Dependencies:** U1, U4.
- **Files:** `src/components/CheckoutFlowView.tsx`, `src/app/api/stripe/webhook/route.ts` (new), `src/services/backend/supabase.ts`, `src/services/backend/mappers-orders.ts`.
- **Approach:** The Stripe publishable key is read from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. The webhook route uses `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`. Order state transitions to `paid` on `payment_intent.succeeded`. Price is converted from minor units to AED display. Covers AE1 parts 2-3.
- **Test scenarios:**
  - User adds a listing to cart; checks out; uses Stripe test card; sees the confirmation page.
  - Webhook receives `payment_intent.succeeded`; order status moves to `paid`; user sees the order in My Purchases.
  - User uses a declined test card; sees a payment error.
  - Covers AE1.
- **Verification:** `npm run test:phase2:smoke` and `npm run test:phase2:e2e` pass.

### U6. Wire ReviewService to product details and seller profile
- **Goal:** Leaving a review writes to Supabase; reviews are public and immutable.
- **Requirements:** R10.
- **Dependencies:** U5.
- **Files:** `src/components/ProductDetailsView.tsx`, `src/components/UserProfileView.tsx`, `src/services/backend/supabase.ts`.
- **Approach:** After a successful purchase, the buyer sees a "Leave review" CTA on the order detail page. ReviewService.create() writes to `seller_reviews`. Once posted, the review is read-only (no edit UI). The product details page aggregates the seller's average rating.
- **Test scenarios:**
  - Buyer leaves a 5-star review with text; the review appears on the seller's profile within 1 second.
  - Buyer cannot edit or delete the review after posting.
  - Seller cannot post a review of themselves.
- **Verification:** Two test accounts; full review lifecycle.

### U7. Wire Chat with Supabase Realtime
- **Goal:** Direct buyer-seller chat uses Supabase Realtime; messages appear without refresh.
- **Requirements:** R7.
- **Dependencies:** U1, U4.
- **Files:** `src/components/ChatView.tsx`, `src/services/backend/supabase.ts`, `supabase/migrations/<new>_chat_realtime_rls.sql` (new).
- **Approach:** The chat view subscribes to a `messages:<conversation_id>` Supabase Realtime channel. New messages are inserted via `ChatService.send()`; the subscription callback updates the local message list. An RLS policy ensures only conversation participants can subscribe. Covers F3.
- **Test scenarios:**
  - User A opens a chat with User B; sends a message; User B sees the message within 1 second without refresh.
  - User A closes the chat and reopens; the message history is loaded.
  - A user not in the conversation cannot subscribe.
- **Verification:** Two browsers, two accounts.

### Phase 2: Social + Profile + Admin (months 3-4)

### U8. Wire SocialService (follow, like, share)
- **Goal:** Follow, like, and share features write to Supabase and update in real time.
- **Requirements:** R1, R13.
- **Dependencies:** U1, U3.
- **Files:** `src/components/UserProfileView.tsx`, `src/components/ProductDetailsView.tsx`, `src/services/backend/supabase.ts`, `src/services/backend/mappers-social.ts`.
- **Approach:** `SocialService.follow()` writes to `user_follows`. The `like` button toggles via `SocialService.toggleLike()`. Share copies a permalink. The `phase_3_social` migration already provides the schema.
- **Test scenarios:**
  - User A follows User B; User B's follower count increments on their profile.
  - User A likes a listing; User A's like count on that listing increments.
  - User A unlikes; the count decrements.
- **Verification:** Manual.

### U9. Wire ProfileService to all profile pages
- **Goal:** Profile, Edit Profile, Settings, and Address pages write to Supabase.
- **Requirements:** R1, R13.
- **Dependencies:** U2.
- **Files:** `src/components/UserProfileView.tsx`, `src/components/SettingsView.tsx`, `src/components/AddressBookView.tsx`, `src/services/backend/supabase.ts`.
- **Approach:** ProfileService.getMine() returns the user's profile. Edit Profile calls ProfileService.updateMine(). AddressBookView uses AddressService. Saved payment methods use PaymentMethodsService.
- **Test scenarios:**
  - User edits their name; the new name appears in the top bar.
  - User adds a new address; the address appears in the checkout address picker.
  - User saves a payment method; the card appears in the checkout payment picker.
- **Verification:** Manual.

### U10. Wire NotificationService (in-app + email)
- **Goal:** In-app notifications and email notifications fire on the right events.
- **Requirements:** R8.
- **Dependencies:** U1, U5.
- **Files:** `src/components/NotificationsView.tsx`, `src/services/backend/supabase.ts`, `app/admin/page.tsx`.
- **Approach:** The `notification_fanout` migration already defines triggers on `orders`, `chat_messages`, and `seller_reviews`. The frontend reads notifications via `NotificationService.list()` and subscribes to a `notifications:<user_id>` channel. The unread badge in the top bar updates in real time. Email templates are configured in Supabase Auth dashboard.
- **Test scenarios:**
  - Seller receives an in-app notification when their listing is liked.
  - Buyer receives an email when the seller messages them.
  - Admin sends a notification; all users see it in their in-app dropdown within 1 second.
- **Verification:** Manual; check Supabase mailbox for emails.

### U11. Build Admin Moderation UI
- **Goal:** Admin can flag, approve, and remove listings and reviews.
- **Requirements:** R11.
- **Dependencies:** U1, U5, U6.
- **Files:** `src/app/admin/page.tsx`, `src/components/admin/AdminPanel.tsx`, `src/components/admin/AdminTopbar.tsx`, `src/services/backend/supabase.ts`.
- **Approach:** The `phase_3_5_admin` migration already defines admin RLS and views. The admin app at `/admin` lists flagged listings and reviews. Admin clicks approve or remove; the action writes to `audit_log`. Removed content disappears from search within 30 seconds. Covers AE2.
- **Test scenarios:**
  - Admin sees a flagged listing; clicks remove; the listing disappears from Search within 30 seconds.
  - Admin approves a flagged listing; the flag clears.
  - Admin cannot moderate without the admin role.
- **Verification:** Manual.

### U12. Build Admin User Management UI
- **Goal:** Admin can view, warn, and suspend users.
- **Requirements:** R11.
- **Dependencies:** U11.
- **Files:** `src/app/admin/users/page.tsx` (new), `src/components/admin/UserManagementList.tsx` (new), `src/services/backend/supabase.ts`.
- **Approach:** Admin sees a searchable list of users with their listings, orders, and reports. Admin can warn (sends a notification) or suspend (sets `users.suspended_at`). The `admin_get_user_emails` migration provides the email lookup.
- **Test scenarios:**
  - Admin searches for a user; sees their listings and orders.
  - Admin warns a user; user receives an in-app notification.
  - Admin suspends a user; suspended user cannot list new items.
- **Verification:** Manual.

### Phase 3: Trust & Safety + Polish (months 5-6)

### U13. Wire Block, Report, and BlockList
- **Goal:** Users can block, report, and view their block list.
- **Requirements:** R10.
- **Dependencies:** U8.
- **Files:** `src/components/BlockedUsersView.tsx`, `src/components/ReportView.tsx`, `src/services/backend/supabase.ts`, `src/services/backend/mappers-social.ts`.
- **Approach:** `SocialService.block(userId)` writes to `blocked_users`. Blocked users cannot message, view listings, or leave reviews. The BlockedUsersView lists current blocks. ReportView sends a report to `reports` with `target_type` and `reason`. Covers AE3.
- **Test scenarios:**
  - User A blocks User B; User B cannot see User A's listings.
  - User A reports User B's listing; admin sees the report in U11.
  - User A unblocks User B; User B can see User A's listings again.
- **Verification:** Two browsers, two accounts.

### U14. Wire Refund and Dispute (manual admin flow)
- **Goal:** Buyer can request a refund; admin handles via Supabase Studio.
- **Requirements:** R12.
- **Dependencies:** U5, U11.
- **Files:** `src/components/OrderDetailsView.tsx`, `src/components/DisputesListView.tsx`, `src/services/backend/supabase.ts`.
- **Approach:** Buyer clicks "Request refund" on an order; the order status moves to `disputed`. Admin sees the disputed order in `DisputesListView`. Admin marks the order `refunded` or `resolved` via Supabase Studio (no UI for the resolution action; documented in the admin runbook).
- **Test scenarios:**
  - Buyer requests a refund within 7 days of purchase; order moves to `disputed`.
  - Admin sees the disputed order in the DisputesListView.
  - Admin marks the order `refunded` via Supabase Studio; buyer sees the refund status.
- **Verification:** Manual.

### U15. Wire PaymentMethods (saved cards)
- **Goal:** Buyer can save a card; the saved card appears in checkout.
- **Requirements:** R5.
- **Dependencies:** U5.
- **Files:** `src/components/PaymentMethodsView.tsx`, `src/services/backend/supabase.ts`.
- **Approach:** The `payment_methods` migration already defines the table. PaymentMethodsService uses Stripe Setup Intents to tokenize the card; only metadata (brand, last4, expiry) is stored in Supabase. The actual card lives with Stripe.
- **Test scenarios:**
  - Buyer saves a test card; the card appears in PaymentMethodsView with brand and last4.
  - Buyer uses the saved card in checkout; payment succeeds.
- **Verification:** Manual.

### U16. Wire Addresses
- **Goal:** Buyer can manage addresses; addresses used in checkout.
- **Requirements:** R1.
- **Dependencies:** U1.
- **Files:** `src/components/AddressBookView.tsx`, `src/services/backend/supabase.ts`.
- **Approach:** The `phase_3_user_likes_and_cart` migration already includes addresses. AddressService exposes `listMine`, `create`, `update`, `remove`, `setDefault`. The checkout flow uses the default address.
- **Test scenarios:**
  - User adds a new address; the address appears in checkout.
  - User sets a default address; the default is selected automatically.
- **Verification:** Manual.

### U17. Polish: error boundaries, RTL, accessibility
- **Goal:** Production-quality UX. No layout shifts, no broken RTL, no accessibility regressions.
- **Requirements:** R1.
- **Dependencies:** U1-U16.
- **Files:** all `src/components/*.tsx`, `src/app/globals.css`, `src/lib/i18n.ts`.
- **Approach:** Audit every screen for: (a) RTL correctness (Arabic mirrors correctly), (b) error boundaries around async operations, (c) loading states, (d) empty states, (e) keyboard navigation. Replace any remaining hard-coded Persian strings with the i18n catalog.
- **Test scenarios:**
  - Every page renders in Arabic without Persian text.
  - Every async operation has a loading state.
  - Every error has a user-friendly message.
- **Verification:** Manual; grep for Persian-only strings returns zero.

### Phase 4: Deploy + Monitor (months 7-8)

### U18. Configure Sentry
- **Goal:** Errors and exceptions are reported to Sentry.
- **Requirements:** R13.
- **Dependencies:** U17.
- **Files:** `src/lib/sentry.ts` (new), `next.config.ts`, `sentry.client.config.ts` (new), `sentry.server.config.ts` (new).
- **Approach:** Install `@sentry/nextjs`. Configure DSN from `SENTRY_DSN` env. Enable browser tracing and session replay. Source maps are uploaded on build.
- **Test scenarios:**
  - Throwing an error in a React component logs to Sentry.
  - An unhandled promise rejection logs to Sentry.
- **Verification:** A test error appears in the Sentry dashboard.

### U19. Configure Supabase Pro backup
- **Goal:** Database backups run automatically; point-in-time recovery is enabled.
- **Requirements:** R13.
- **Dependencies:** None.
- **Files:** `supabase/.branches/` (managed via Supabase Studio).
- **Approach:** Upgrade to Supabase Pro. Enable PITR (point-in-time recovery) in the Supabase dashboard. Schedule daily full backups.
- **Test scenarios:**
  - Database restores to a point 1 hour ago without data loss.
  - Backup retention is at least 7 days.
- **Verification:** Run a manual restore to a staging environment.

### U20. Deploy to cPanel
- **Goal:** The app is live at `app.daneg.ae`.
- **Requirements:** R15.
- **Dependencies:** U18, U19.
- **Files:** `scripts/build-standalone.sh`, `.env.production`.
- **Approach:** Run `bash scripts/build-standalone.sh --upload`. Verify the deployment via `curl https://app.daneg.ae/` and `curl https://app.daneg.ae/api/health`. The `.env.production` contains production secrets.
- **Test scenarios:**
  - `curl https://app.daneg.ae/` returns 200.
  - `curl https://app.daneg.ae/api/health` returns `{"status":"ok"}`.
  - A real user can sign up from the production URL.
- **Verification:** Manual.

### U21. Beta smoke test
- **Goal:** Beta users complete the full AE1 flow on production.
- **Requirements:** R1.
- **Dependencies:** U20.
- **Files:** `tests/e2e/beta-flow.spec.ts` (new).
- **Approach:** Run a Playwright E2E test against `https://app.daneg.ae` that drives AE1 (sign up, verify, list, buy, review). 5-10 beta users run the same flow manually.
- **Test scenarios:**
  - Fresh user signs up, verifies email, lists an item, buys from a test seller, messages in real time, leaves a review. Covers AE1.
  - Admin removes a flagged listing; the listing disappears from Search. Covers AE2.
  - Blocked user cannot view the blocker's listings. Covers AE3.
- **Verification:** Playwright E2E passes; 5+ beta users report no P0 issues.

## Verification Contract

### Unit and integration tests
- Run `npm run test:ci` for all Vitest unit tests.
- Run `npm run test:phase2:db` for Supabase migration tests.
- Run `npm run test:phase2:smoke` for the auth smoke test.
- Run `npm run test:phase2:e2e` for Playwright E2E.
- `npm run verify` runs typecheck + lint + test:ci + build; gates merging.

### Smoke tests
- Existing scripts in `scripts/phase*-smoke-*.mjs` and `scripts/phase4-*-smoke.mjs` exercise the full write path through the publishable key client. Run them against the local Supabase instance before each deploy.

### Beta user acceptance
- 5-10 closed beta users run AE1 manually.
- Track P0/P1 bugs in `docs/STATUS.md`.
- Beta acceptance: 0 P0 bugs and at most 2 P1 bugs open at sign-off.

## Definition of Done

- All 40 screens wire to real Supabase; no `authMode === "mock"` branches remain.
- Critical path (AE1) works end-to-end on production.
- Admin can moderate a flagged listing within 30 seconds.
- A blocked user cannot view, message, or review the blocker.
- All prices display in AED.
- UI is Arabic + English; no Persian text remains.
- Sentry reports errors from production.
- Supabase PITR is enabled with at least 7-day retention.
- App is live at `app.daneg.ae`.
- `npm run verify` passes on the main branch.
- 5+ beta users complete AE1 without P0 bugs.
