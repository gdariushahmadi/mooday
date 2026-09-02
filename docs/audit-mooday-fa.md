# گزارش ممیزی جامع پروژه Mooday

> **تاریخ ممیزی:** ۲۰ اوت ۲۰۲۶
> **مسیر کدبیس:** `/Users/macbook/projects/mooday`
> **منبع:** ادغام یافته‌های ۲۵ فایل اصلی شامل `ROADMAP.md`، `STATUS.md`، `plans/IMPLEMENTATION.md`، `plans/2026-08-16-...-beta-launch-plan.md`، `user-scenarios.md`، `phase-2-backend.md`، `phase-3-marketplace.md`، `DEPLOY.md`، `EXTERNAL_SETUP_TODO.md`، `app-lock.md`، `next.config.ts`، `AppContext.tsx`، `contracts.ts`، `config.ts`، `index.ts`، `page.tsx` (marketing, app shell, admin)، `layout.tsx`.

---

## نکته مقدماتی مهم

سند برنامه راه‌اندازی بتا (Beta Launch Plan) در بند **R16** به‌صراحت اعلام می‌کند که زبان فارسی از رابط کاربری برنامه حذف شده است و مدل داده فقط `label_ar` + `label_en` دارد. این گزارش به‌عنوان **مستند داخلی ممیزی** به زبان فارسی تهیه شده و این موضوع خود یکی از یافته‌های مهم ممیزی است. هیچ تغییری در کدبیس پیشنهاد نمی‌شود که زبان فارسی را به رابط کاربری اضافه کند.

---

## ۱. نمای کلی سیستم (System Overview)

### ۱.۱ معماری کلی

Mooday یک پلتفرم بازار آنلاین دو زبانه (عربی + انگلیسی) برای کاربران امارات متحده عربی است که در فاز بتای بسته عرضه می‌شود. معماری آن از الگوی **Service-First** پیروی می‌کند به‌طوری که رابط‌های سرویس در `src/services/backend/contracts.ts` (۷۱۷ خط، ۱۸ سرویس) تعریف شده‌اند و دو پیاده‌سازی موازی دارند: Mock (برای حالت نمایشی) و Supabase (برای حالت واقعی). انتخاب بین این دو از طریق فلگ `phase2Backend` در `src/services/backend/config.ts` انجام می‌شود.

```
┌─────────────────────────────────────────────────────┐
│ Frontend (Next.js 16.2.9 App Router + React 19.2.4)│
│  └─ Tailwind CSS v4 + i18n (EN/AR) + PWA            │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│ AppContext (2,717 خط) + 94+ کامپوننت UI              │
│  └─ استفاده از useSyncExternalStore + localStorage  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│ Service Layer (contracts.ts + supabase.ts)          │
│  AuthService, ProfileService, AddressService,       │
│  ListingService, ListingMediaService, SellerCard…   │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│ Backend (Supabase)                                  │
│  ├─ PostgreSQL + 22 میگریشن + 11 تست pgTAP          │
│  ├─ Auth (Email + Password + OAuth)                  │
│  ├─ Storage (Buckets: listing-media, avatars)        │
│  └─ Realtime (Chat + Notifications)                  │
└─────────────────────────────────────────────────────┘
```

### ۱.۲ پشته فنی (Tech Stack)

| لایه | فناوری | نسخه |
|------|---------|------|
| Frontend Framework | Next.js (App Router) | 16.2.9 |
| UI Library | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) | — |
| Payment | Stripe (test mode) | — |
| Error Monitoring | Sentry (@sentry/nextjs) | — |
| Testing | Vitest | ۵۴۴ تست |
| E2E Testing | Playwright | — |
| RLS Testing | pgTAP | ۱۱ فایل |
| Linting | ESLint | ۰ خطا، ۷۶ هشدار |
| TypeScript | Strict | نوع‌دهی کامل |

### ۱.۳ ویژگی‌های اصلی

پروژه ۴۰ صفحه از ۸ گروه اصلی را پوشش می‌دهد (به‌جز Rent که به فاز ۵ موکول شده):

- **Group A (Onboarding):** Welcome، Sign Up، OTP، Sign In، Forgot Password، Social Login
- **Group B (Discover):** Discover Feed، Search Filters، Category Landing، Product Details، Public Seller Profile
- **Group C (Product):** Shopping Bag، Checkout Flow (۳ مرحله)، My Purchases، Order Details
- **Group D (Selling):** Sell Mode Picker، Sell Item، My Closet، Edit Listing، My Sales
- **Group F (Social):** Activity Feed، Chats List، Chat Overlay، Notifications Centre
- **Group G (Profile):** User Profile، Edit Profile، Saved Addresses، Saved Payment Methods، Settings، Help & Support
- **Group H (Trust & Safety):** Leave Review، My Reviews، Report، Return Request، Dispute، Blocked Users، Payouts (read-only)
- **Admin Dashboard:** Moderation + User Management (با داده‌های mock)

### ۱.۴ مفروضات فنی کلیدی (Key Technical Assumptions)

1. **زبان:** فقط عربی و انگلیسی. فارسی به‌صراحت از UI حذف شده (R16).
2. **ارز:** فقط درهم امارات (AED). هیچ تبدیل ارزی وجود ندارد.
3. **احراز هویت:** ایمیل + رمز عبور از طریق Supabase Auth؛ تأیید ایمیل و بازیابی رمز داخلی.
4. **پرداخت:** Stripe در حالت تست. هیچ پول واقعی جابه‌جا نمی‌شود. KYC فروشنده نیاز نیست.
5. **چت real-time:** Supabase Realtime Channels.
6. **جستجو:** PostgreSQL Full-Text Search (tsvector + `search_listings` RPC).
7. **اعلان‌ها:** In-app + Email (هیچ Push Notification پیاده‌سازی نشده).
8. **استقرار:** cPanel/Passenger در `app.daneg.ae` با پورت 21098 از طریق `scripts/build-standalone.sh`.
9. **مدل بازار:** C2C باز بدون KYC.
10. **حل اختلافات:** دستی توسط ادمین (هیچ اتوماسیونی برای dispute وجود ندارد).

### ۱.۵ مسیرهای ثبت‌شده (Registered Routes)

هشت مسیر در اپلیکیشن ثبت شده‌اند: `/` (marketing)، `/admin` (پنل ادمین)، `/api/health` (Health Check)، `/api/stripe/webhook` (WebHook Stripe)، `/app` (اپلیکیشن اصلی)، `/auth/callback` (OAuth Callback)، `/preview` (پیش‌نمایش)، `/sitemap.xml`.

---

## ۲. نقشه راه پیاده‌سازی (Implementation Roadmap)

### ۲.۱ فازهای توسعه

#### فاز ۱: Frontend (تکمیل‌شده)
- توسعه ۳۶ صفحه با داده‌های mock
- پیاده‌سازی i18n برای عربی و انگلیسی با `src/lib/i18n.ts`
- استایل RTL/LTR پویا
- ۱۲ گروه کامپوننت UI
- `npm run verify` سبز در پایان فاز

#### فاز ۲: Identity Backend (تکمیل‌شده)
- اتصال Supabase Auth
- پیاده‌سازی OTP و Email Verification
- OAuth با Google (mock در مرحله اول)
- پیاده‌سازی Session Management
- RLS برای جداول users، profiles، addresses

#### فاز ۳: Marketplace Backend (تکمیل‌شده)
هفت slice اصلی که در `docs/phase-3-marketplace.md` مستند شده‌اند:
1. **Listings** (CRUD کامل با FTS)
2. **Seller Card** (پروفایل عمومی)
3. **Listing Media** (آپلود و مدیریت تصویر)
4. **Likes** (لایک idempotent)
5. **Cart** (سبد خرید identifier-only)
6. **Orders** (سفارش + Stripe Payment Intent)
7. **Chat** (real-time + Offer Messages)

#### فاز ۴: M4 Services (تکمیل‌شده)
- PaymentMethodService (مدیریت روش‌های پرداخت با رمزنگاری PBKDF2)
- BlockService (بلاک کاربران)
- ۲ مایگریشن جدید + ۲ تست pgTAP
- ۴ trigger پایگاه داده برای fan-out اعلان‌ها

#### فاز ۵: Rent (خارج از محدوده)
- به‌طور صریح از برنامه بتا حذف شده (R16)
- داده‌ها برای اضافه‌کردن بعدی آماده هستند (`mode: "resell" | "rent"`)

### ۲.۲ جریان‌های منطق اصلی (Key Flows)

#### F1: ثبت‌نام تا اولین خرید (Sign Up to First Purchase)
```
Email → Verification → Login → Browse → [Optional: List] →
Stripe Test Card → Buy → Real-time Chat → Leave Review
```
**پوشش:** R1، R3، R5، R7، R8، R9، R10، R13

#### F2: مدیریت محتوا (Admin Moderation)
```
User Report → Admin Sees Flag → Reviews → Removes/Approves → User Notified
```
**پوشش:** R11، R12

#### F3: چت Real-Time
```
Open Chat → Subscribe to Channel → Send Message → Receive Reply → Close
```
**پوشش:** R7

### ۲.۳ وضعیت DoD (Definition of Done)

از ۱۱ مورد DoD در `plans/IMPLEMENTATION.md`:

| # | مورد | وضعیت |
|---|------|-------|
| 1 | اتصال ۴۰ صفحه به Supabase واقعی | ✅ |
| 2 | Sentry wired | ✅ |
| 3 | PITR knowledge | ✅ |
| 4 | پیکربندی app.daneg.ae | ✅ |
| 5 | `npm run verify` سبز | ✅ |
| 6 | UI فقط EN/AR | ✅ |
| 7 | قیمت‌ها فقط AED | ✅ |
| 8 | **AE1 end-to-end روی production** | ⚠️ نیازمند زیرساخت |
| 9 | **Moderation ادمین در ۳۰ ثانیه** | ⚠️ نیازمند زیرساخت |
| 10 | **بلاک کاربر** | ⚠️ نیازمند زیرساخت |
| 11 | **۵ کاربر بتا اجرای AE1** | ⚠️ نیازمند عملیات |

نسبت تکمیل: **۸/۱۱ (۷۳٪)** — ۳ مورد عملیاتی باقی‌مانده نیازمند راه‌اندازی production نیستند.

### ۲.۴ وضعیت تست و اعتبارسنجی

- **TypeScript:** ✅ بدون خطا
- **ESLint:** ✅ ۰ خطا، ۷۶ هشدار (عمدتاً `<img>` hardcoded)
- **Unit Tests:** ✅ ۵۴۴ تست عبور
- **Smoke Tests:** ✅ ۵۵/۵۵ در ۵ اسکریپت
- **pgTAP:** ✅ پوشش RLS برای تمام جداول اصلی
- **Production Build:** ✅ موفق

---

## ۳. شکاف‌ها و نقص‌های بحرانی (Critical Gaps & Defects)

این بخش به ترتیب اولویت برای تحویل نهایی فهرست شده‌اند.

### ۳.۱ اقدامات عملیاتی باقی‌مانده (P0 — بلاک‌کننده تحویل)

این سه مورد تنها مواردی هستند که واقعاً مانع تحویل نهایی به کارفرما هستند و در `IMPLEMENTATION.md` و `EXTERNAL_SETUP_TODO.md` مستند شده‌اند:

1. **اجرای `npx supabase db push`** در محیط staging میزبانی‌شده برای اعمال مایگریشن‌های `search_listings` و `user_follows`.
2. **تنظیم کلیدهای واقعی Stripe Test** در `.env.production` شامل `STRIPE_SECRET_KEY`، `STRIPE_WEBHOOK_SECRET`، `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. **اجرای `bash scripts/build-standalone.sh --upload`** و سپس بوت‌استرپ ۵ تا ۱۰ کاربر بتا برای اجرای دستی AE1.

علاوه بر این، تنظیمات زیر در `EXTERNAL_SETUP_TODO.md` فهرست شده‌اند:
- Supabase میزبانی‌شده staging
- ایمیل تراکنشی (transactional email)
- Google sign-in واقعی
- محیط‌های وب (web environments)
- PITR فعال

### ۳.۲ نقص‌های شناخته‌شده در کدبیس (P1 — باید پیش از بتا برطرف شود)

#### ۳.۲.۱ پنل ادمین هنوز Mock است
- `src/services/admin/actions.ts` Server Actions واقعی دارد، اما `mockAdminService.ts` مسیر پیش‌فرض تب‌های ادمین است.
- **تأثیر:** ادمین نمی‌تواند محتوای واقعی را moderation کند.
- **اولویت:** اتصال پنل ادمین به Backend واقعی پیش از بتا ضروری است.

#### ۳.۲.۲ تعداد پیام‌های خوانده‌نشده چت Client-Side محاسبه می‌شود
- `ChatService` ستون `unread` ندارد؛ unread از localStorage key `chatLastRead` محاسبه می‌شود.
- **تأثیر:** در حالت چند دستگاهی دقت ندارد.
- **راه‌حل:** افزودن ستون `unread_count` به `chat_threads` در یک مایگریشن آتی.

#### ۳.۲.۳ Notification Fan-Out کامل نیست
- جدول `notifications` وجود دارد، اما trigger‌ها فقط برای برخی رویدادها (chat، offer، order، review) ایجاد اعلان می‌کنند.
- **تأثیر:** ممکن است برخی رویدادها اعلان تولید نکنند.
- **راه‌حل:** بررسی پوشش کامل رویدادها در trigger‌های پایگاه داده.

#### ۳.۲.۴ آپلود تصویر Bucket Passthrough
- `listing_images.storage_path` می‌تواند URL mock یا شیء واقعی آپلود‌شده باشد.
- **تأثیر:** مسیر ذخیره‌سازی S3 کار می‌کند اما در smoke test اعتبارسنجی نشده است.
- **راه‌حل:** اجرای `phase4-image-upload-smoke.mjs` در production verification.

### ۳.۳ بدهی‌های فنی (P2 — بهبود قبل یا بعد از بتا)

#### ۳.۳.۱ کامنت‌های TODO باقی‌مانده
- ۱۲ کامنت `TODO(phase-1)` در `src/context/AppContext.tsx` با ارجاع به U-IDs وجود دارد.
- **توصیه:** تبدیل به issue در tracker یا مستندسازی در `STATUS.md`.

#### ۳.۳.۲ ارجاعات به `MOCK_OTP_CODE`
- هنوز در `src/data/users.ts`، `OtpView.tsx`، `ForgotPasswordView.tsx`، `OtpView.test.tsx` وجود دارد.
- **تأثیر:** در production توسط `authMode !== "supabase"` gate می‌شود، اما بهتر است حذف شوند.
- **اولویت:** پاکسازی (deferred to U17 polish).

#### ۳.۳.۳ هشدارهای Lint
- ۷۶ هشدار به دلیل تگ‌های `<img>` هاردکد شده (به جای `next/image`).
- **توصیه:** تبدیل تدریجی به `next/image` برای بهینه‌سازی SEO و Performance.

#### ۳.۳.۴ Fallback‌های اسکفولدینگ در AppContent
- ۴ مورد fallback دفاعی (leave-review، report، return-request، dispute) که در صورت نبود prop، view دیگری را render می‌کنند.
- **تأثیر:** پس از تکمیل حداقل‌های ROADMAP، این شاخه‌ها dead code می‌شوند.
- **اولویت:** حذف پس از تکمیل داده‌های seed.

#### ۳.۳.۵ `PublicSellerProfile` با sellerId ناشناس
- اگر `sellerId` به فروشنده‌ای اشاره کند که در `SELLERS` نیست، view به‌طور silent degrade می‌شود.
- **اولویت:** افزودن Error Boundary یا حالت "Not Found".

#### ۳.۳.۶ `createChatThread` با Heuristics حروف کوچک
- پاسخ خودکار فروشنده در `ChatOverlay.tsx` تابع deterministic متن خریدار است.
- **اولویت:** جایگزینی با سرویس intent-matching واقعی در فاز بعدی.

#### ۳.۳.۷ کپی `SocialLogin`
- ادعا می‌کند "رمز عبور واقعی Google را نمی‌پرسد" که متن placeholder است.
- **اولویت:** جایگزینی با جریان OIDC واقعی پیش از production.

### ۳.۴ داده‌های Seed ناکافی (P2 — بهبود تجربه)

جدول `Mock-Data Strategy` در `ROADMAP.md` نیازمندی‌های زیر را تعیین کرده، اما داده‌های واقعی کمتر هستند:

| دامنه | مورد نیاز | موجود | وضعیت |
|-------|-----------|-------|--------|
| products | ≥ ۱۰۰ | ~۳۳ | ❌ |
| reviews | ≥ ۸۰ | ۳۶ | ❌ |
| sellers | ۱۵ | متغیر | ⚠️ |
| orders | ۱۵ | ۱۵ | ✅ |
| sales | ۲۰ | ۱۵ (مشتق) | ✅ |
| notifications | ۲۰+ | ۲۰+ | ✅ |
| addresses | ۳ | ۳ | ✅ |
| paymentMethods | ۲ | ۲ | ✅ |
| blocks | ۲ | ۲ | ✅ |

**توصیه:** افزایش products به ۱۰۰ و reviews به ۸۰ پیش از راه‌اندازی بتا برای تجربه کاربری واقعی‌تر.

### ۳.۵ نکات امنیتی (P1 — پیش از production)

از بررسی `next.config.ts` و معماری سرویس:

1. **CSP Headers:** در `next.config.ts` تنظیم شده (شامل `frame-ancestors`، `script-src`، `connect-src`).
2. **RLS Policies:** ۱۱ فایل تست pgTAP پوشش می‌دهد:
   - `phase_2_rls.sql` (users, profiles, addresses)
   - `phase_3_listings_rls.sql`
   - `phase_3_listing_media_rls.sql`
   - `phase_3_public_seller_profiles_rls.sql`
   - `phase_3_user_likes_rls.sql`
   - `phase_3_cart_items_rls.sql`
   - `phase_3_orders_rls.sql`
   - `phase_3_social_rls.sql` (chat, reviews, reports, disputes, notifications)
   - `phase_4_payment_methods_rls.sql`
   - `phase_4_blocked_users_rls.sql`
   - `phase_3_5_admin_rls.sql`
3. **رمزنگذاری PIN:** PBKDF2 از طریق `src/lib/security.ts`.
4. **WebAuthn:** پشتیبانی از بیومتریک (سخت‌افزار امنیتی).
5. **Idle Lock:** قفل خودکار با timeout قابل تنظیم.
6. **App Lock (G-39/G-40):** مستند در `docs/app-lock.md`.

### ۳.۶ ریسک‌های Deployment (P1 — قبل از production)

از `docs/DEPLOY.md` و `EXTERNAL_SETUP_TODO.md`:

1. **cPanel/Passenger:** پیکربندی پورت 21098، Node.js 22.23.0، فایل `.htaccess` برای مسیریابی.
2. **Build Standalone:** `scripts/build-standalone.sh --upload` بسته `.next/standalone` را در `mooday-deploy.tar.gz` بسته‌بندی می‌کند.
3. **پیکربندی Environment:** ۱۰ متغیر محیطی در `.env.production` باید تنظیم شود.
4. **Health Check:** مسیر `/api/health` برای اعتبارسنجی production.
5. **Stripe Webhook:** مسیر `/api/stripe/webhook` با تأیید signature.

### ۳.۷ اعتبارسنجی‌های نهایی پیش از تحویل (Checklist)

```
[ ] 1. npx supabase db push با موفقیت اجرا شد
[ ] 2. متغیرهای محیطی production تنظیم شدند
[ ] 3. scripts/build-standalone.sh --upload اجرا شد
[ ] 4. curl https://app.daneg.ae/ → 200
[ ] 5. curl https://app.daneg.ae/api/health → {"status":"ok"}
[ ] 6. ثبت‌نام واقعی کاربر از URL production
[ ] 7. ۵ کاربر بتا بوت‌استرپ شدند
[ ] 8. AE1 به‌طور کامل اجرا شد
[ ] 9. ادمین moderation در ۳۰ ثانیه تست شد
[ ] 10. بلاک کاربر end-to-end تست شد
[ ] 11. Sentry خطاها را دریافت می‌کند
[ ] 12. PITR در Supabase Pro فعال شد
[ ] 13. ESLint: 0 خطا (موجود: 0)
[ ] 14. Unit Tests: همه سبز (موجود: 544 سبز)
[ ] 15. Smoke Tests: 55/55 (موجود: 55/55)
[ ] 16. README به‌روزرسانی شد
[ ] 17. Sentry DSN تنظیم شد
[ ] 18. مستندات تحویل (handoff docs) تکمیل شد
```

---

## ۴. نتیجه‌گیری و توصیه‌های نهایی

### ۴.۱ آمادگی کلی

پروژه Mooday در وضعیت نسبتاً پیشرفته‌ای قرار دارد. فازهای ۱ تا ۴ با موفقیت تکمیل شده‌اند و ۵۴۴ تست واحد، ۵۵ تست smoke، و ۱۱ تست pgTAP همگی سبز هستند. اعتبارسنجی نهایی (`npm run verify`) موفق است. کدبیس از نظر ساختاری سالم، از نظر امنیتی RLS-protected، و از نظر معماری Service-First است.

### ۴.۲ موارد بحرانی برای تحویل (Blockers)

سه مورد زیر به‌عنوان **blocker** برای تحویل نهایی شناسایی شده‌اند:

1. **زیرساخت Production:** Supabase staging، Stripe keys، Sentry DSN باید عملیاتی شوند.
2. **اتصال پنل ادمین:** از داده‌های mock به backend واقعی منتقل شود.
3. **تست E2E در Production:** ۵ کاربر واقعی باید AE1 را اجرا کنند.

### ۴.۳ توصیه‌های استراتژیک

1. **اولویت ۱ (پیش از بتا):** حل سه blocker بالا.
2. **اولویت ۲ (بهبود UX بتا):** افزایش products به ۱۰۰ و reviews به ۸۰.
3. **اولویت ۳ (پاکسازی):** حذف ۱۲ TODO و ارجاعات MOCK_OTP_CODE.
4. **اولویت ۴ (آینده):** حل Heuristics چت، بهبود unread tracking، push notifications احتمالی.

### ۴.۴ تنش‌های شناسایی‌شده

1. **زبان فارسی:** این گزارش به فارسی است زیرا کاربر درخواست کرده، اما زبان فارسی در UI برنامه مجاز نیست. این تنش باید در مستندات داخلی مدیریت شود.
2. **Mock-mode شاخه‌ها:** شاخه‌های mock هنوز در AppContext پشت فلگ `phase2Backend` باقی مانده‌اند. در production بی‌اثر هستند اما dead code محسوب می‌شوند.
3. **ادغام ادمین:** پنل ادمین هنوز کاملاً به backend متصل نیست و این یک شکاف معماری است.

---

## ۵. منابع (Sources)

- `ROADMAP.md` — برنامه فاز ۱، ۳۶ صفحه
- `docs/STATUS.md` — وضعیت پس از فاز ۴
- `docs/SMOKE_TESTS.md` — راهنمای تست‌های smoke
- `docs/DEPLOY.md` — راهنمای استقرار cPanel
- `docs/phase-2-backend.md` — Identity Backend
- `docs/phase-3-marketplace.md` — ۷ slice بازار
- `docs/plans/HANDOFF.md` — تحویل بتا
- `docs/plans/IMPLEMENTATION.md` — دفتر DoD
- `docs/plans/2026-08-16-0347-feat-mooday-beta-launch-plan.md` — طرح راه‌اندازی
- `docs/EXTERNAL_SETUP_TODO.md` — چک‌لیست عملیاتی
- `docs/app-lock.md` — G-39/G-40 App Lock
- `docs/user-scenarios.md` — سناریوهای کاربری و ماتریس پوشش
- `next.config.ts` — پیکربندی Next.js با Sentry و CSP
- `src/app/{page,layout,app/page,admin/page}.tsx` — shell pages
- `src/context/AppContext.tsx` — مرکز مدیریت state (۲,۷۱۷ خط)
- `src/services/backend/contracts.ts` — رابط‌های سرویس (۷۱۷ خط)
- `src/services/backend/config.ts` — انتخاب backend
- `src/services/backend/index.ts` — exports

---

*این گزارش بر اساس تحلیل ایستای کدبیس و مستندات موجود تهیه شده است. برای اعتبارسنجی نهایی، اجرای `npm run verify` و تمام ۵ اسکریپت smoke test در production توصیه می‌شود.*
