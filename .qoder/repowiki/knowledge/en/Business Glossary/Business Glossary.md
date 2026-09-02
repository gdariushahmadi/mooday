---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Daneg
- Definition：Rebranded product name replacing Mooday; Arabic form is دانق (with ق). All user-facing English and Arabic copy, PWA manifest, service worker cache key, and localStorage namespace were migrated from mooday/Mooday/مودی to daneg/DANEG/دانق.
- Aliases：Mooday、مودی、مودي

### Phase 1
- Definition：The frontend-only delivery scope defined in ROADMAP.md: all 44 showcase screens built as a complete, polished, user-facing product backed by deterministic mock data and localStorage, independent of any backend, database, or real authentication/payment integrations.

### Phase 2
- Definition：Backend phase introducing real authentication (sign up, OTP, sign in, forgot password, social login), Supabase-backed persistence, and email templates; replaces the mock auth layer while keeping the same UI contracts.

### Phase 3
- Definition：Marketplace phase where the existing `src/services/` interfaces are implemented against the real Supabase API, swapping out localStorage/mock mutators behind the same contracts.

### Phase 4
- Definition：Rent Mode feature set (rent listings, daily rate, deposit, duration limits); explicitly out of scope for Phase 1 but reserved in the data model via a `mode: 'resell' | 'rent'` field and optional `rentConfig` slot.

### Phase 5
- Definition：Payments phase integrating Stripe for payment capture, escrow settlement, refunds and seller disbursement; not started in Phase 1.

### Vault
- Definition：User profile hub tab group (Closet · Loves · Chats · Purchases · Sales · Rentals) that aggregates a user's own listings, saved items, chats, orders, sales and rental history; expanded from 3 tabs to 6 tabs per the roadmap.

### Resell
- Definition：Listing mode where a seller lists an item outright for sale (as opposed to Rent Mode); default value of `Product.mode` and the enabled tile in the Sell mode picker.

### Rent Mode
- Definition：Planned listing mode for renting items out with daily rate, deposit and duration constraints; disabled in Phase 1 but modeled in the data schema to avoid rework later.

### Mock-Data Strategy
- Definition：Design principle that every piece of state which would live on a server in production lives in localStorage under namespaced keys, loaded from hand-edited seed files in `src/data/`, so the app feels populated and real without a backend.

### Service Layer
- Definition：Thin abstraction under `src/services/` that components depend on instead of calling localStorage directly; each domain exports an interface that can be swapped between localStorage-backed and Supabase-backed implementations.

### SEED_VERSION
- Definition：Version marker stored in localStorage (`mooday_seed_version` / `daneg_seed_version`) that triggers re-seeding of demo data on first load after a migration bumps it, preserving user data while refreshing seed content.

### Showcase
- Definition：Self-contained HTML gallery at `public/showcase/index.html` that embeds the running app via deep links (`?view=`, `?product=`) to capture screenshots and verify screen reachability across mobile viewports.

### PWA install prompt cooldown
- Definition：Shared localStorage key (`mooday.installPrompt.dismissedAt` → `daneg.installPrompt.dismissedAt`) used by both the shell and landing to coordinate the PWA install prompt dismissal cooldown across contexts.

### cPanel / Passenger deployment
- Definition：Alternative deployment target to Vercel using Next.js standalone output (`output: 'standalone'`) and the `build-standalone.sh` script, chosen because the host has small inode and memory budgets.
