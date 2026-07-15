# A-02 / A-03 / A-04 / A-05 / A-06 — Onboarding (Sign Up / OTP / Sign In / Forgot Password / Social Login)

> **Screen IDs**: A-02 (Sign Up), A-03 (OTP), A-04 (Sign In), A-05 (Forgot Password), A-06 (Social Login).
> **Status**: ✅ All five built, tested, and wired in.
> **Data**: New `users.ts` with 1 seeded QA user, `Session` token format, `MOCK_OTP_CODE`.
> **Plumbing**: AppContext extended with `users`, `session`, `authError` + 8 mutators.
> **Tests**: 50 new tests across 6 view test files.

---

## Why this session

Group A was the last remaining chunk of Phase 1 ("Group A — Onboarding").
Before this session:
- Every buyer-side flow assumed the user was already signed in.
- `Settings > Log Out` was a `disabled` placeholder.
- The top bar had no avatar / no auth hint.
- There was no way to demonstrate login at all without touching `localStorage` by hand.

After this session, the full sign-up → home → settings → log-out →
sign-in loop is testable end-to-end. Five screen IDs complete, plus
`AuthSheet` (quick-action bottom sheet from the top bar when signed
out) and the deeper Settings auth affordance.

---

## Architecture

### Data layer (`src/data/users.ts`)

Phase-1 mock auth. Three primitives:

```ts
export interface User {
  id: string;
  nameEn: string;
  nameAr: string;
  email: string;
  phone: string;        // Stored plaintext in Phase 1
  password: string;     // Stored plaintext in Phase 1 — Phase 3 must hash
  createdAt: string;
}

export interface Session {
  userId: string;
  email: string;
  token: string;        // `${userId}.${base36-ts}.${rand}` — Phase 1 cosmetic
  createdAt: string;
}

export const MOCK_OTP_CODE = "000000";  // universal code for Phase 1 demo
```

**Phase-2 swap points** (called out in the source):
1. Replace `users` localStorage with a real registration API.
2. Hash passwords — never store plaintext.
3. Sign tokens with a real JWT from the auth server.
4. Replace `sendOtp` with a real SMS / email challenge.

### AppContext extensions

Three new persistent slices + one ephemeral slice:

| State | Storage key | Mutators |
|-------|-------------|----------|
| `users: User[]` | `mooday_users` | `signUp`, `resetPassword`, `updateCurrentUserName` |
| `session: Session \| null` | `mooday_session` | `signIn`, `signOut` |
| `pendingOtp` (reserved) | `mooday_pending_otp` | (Phase 2) |
| `authError: AuthErrorCode \| null` | (ephemeral) | reset by every mutator |

`currentUser: { email, name } | null` is derived from `session + users`
via `useMemo` and exposed for the header avatar + Settings auth
affordance.

### Navigation extensions (`src/types/navigation.ts`)

Five new `ViewState` literals:

```ts
| "signup" | "otp" | "signin" | "forgot-password" | "social-login"
```

Plus 10 handlers in `useAppNavigation`:

```ts
openSignUp / closeSignUp
openOtp    / closeOtp         // back -> signin
openSignIn / closeSignIn
openForgotPassword / closeForgotPassword
openSocialLogin / closeSocialLogin
```

---

## A-02 — `SignUpView`

Form with 6 fields:
- **Full name** (required)
- **Email** (autoComplete=email)
- **Phone** (optional)
- **Password** (autoComplete=new-password, ≥8 chars)
- **Confirm password** (must match)
- **Terms & Privacy** checkbox (required)

Submit flow → `signUp()` → on success the mutator auto-creates the
session and the view calls `onSuccess()` (AppContent navigates to
home). On failure, the error code is mapped to a bilingual message
via `AUTH_ERROR_MESSAGE_EN/AR`.

Validation short-circuits before the mutator runs:
- empty name → "Please enter your name."
- password ≠ confirm → "Passwords don't match."
- terms not accepted → "Please accept the terms to continue."

### Edge cases / Phase 2 hooks

- `User.phone` is allowed to be `""` (optional at sign-up time).
- `signUp` validates email format via `isValidEmail` *before* checking
  for duplicates; the `user_exists` error fires only on duplicates of
  well-formed emails.
- After `signUp` the user is auto-signed in. There's no separate OTP
  step on the sign-up flow in Phase 1 (mock). Phase 2 will route the
  sign-up through A-03 first.

---

## A-03 — `OtpView`

Six independent numeric inputs with auto-advance focus, backspace nav,
arrow-key nav, and full-paste support. Auto-focuses the first cell on
mount.

`verifyOtp(email, code)` is a strict-equality check against
`MOCK_OTP_CODE`. The universal code is **deliberately** rendered in
the helper text so QA can copy-paste it — Phase 2 will replace that
helper with "we sent it to <email>".

`sendOtp()` is wired (Phase 1 returns the universal code; Phase 2 will
dispatch a real challenge). The "Didn't get it? Resend" link calls it
unconditionally.

---

## A-04 — `SignInView`

Standard email + password + remember-me + sign-in CTA. Adds two
social-login shortcut buttons (Google + Apple) that route to A-06.

**Pre-seeded QA login** (for fast feedback):
- email: `layla@mooday.app`
- password: `mooday123`

Submit calls `signIn({ email, password })`. On `false` the form
stays put and shows the bilingual error from context.

---

## A-05 — `ForgotPasswordView`

A single component with **3 internal steps** (`step ∈ 1 | 2 | 3`):

1. **Email** — collect address, call `sendOtp`, advance.
2. **OTP** — six-digit code; on success, advance.
3. **New password + confirm** — validate ≥8 + match, call
   `resetPassword(email, newPassword)`, then `onSuccess` (back to
   sign-in).

The "Back to sign in" link is always reachable from the bottom of
the page so users can bail at any step.

### Note on `resetPassword`

Added a dedicated mutator (instead of exposing `setUsers` raw). It
returns `boolean` so the view can show a meaningful error if the
email turns out to not be registered — currently always `true`
because the mock stores any email entered at sign-up.

---

## A-06 — `SocialLoginView`

Two large branded tiles (Google + Apple). Each tap calls:

```ts
signUp({ name: "Google User", email: "user.google@mooday.app",
         phone: "", password: "social-1234" });
signIn({ email: "user.google@mooday.app", password: "social-1234" });
```

The mock password isn't checked by `signIn` here — it just needs
*some* key to match. Phase 2 swaps `signUp({ email })` for a real
OIDC roundtrip.

A "Use email instead" link routes back to A-04.

---

## `AuthSheet` (bonus)

A bottom sheet from the top bar (when signed out). `data-testid="header-auth"` on the chip in the header. Reachable via the
person icon, three quick CTAs (Create account / Sign in / Continue with
Google or Apple), and a "Not now" dismiss.

---

## Header / Settings wiring

- **Header**: a person / initial-avatar chip now sits between the
  logo and the bell. Tap when signed out → opens `AuthSheet`. Tap
  when signed in → navigates to `settings`.
- **Settings** (G-37): the placeholder "Log Out" button is gone.
  When `currentUser` is present, the action reads **Log Out** and
  fires `onSignOut()` (which calls the context `signOut()` then
  navigates home). When signed out, it reads **Sign in** and
  routes to A-04.
- **Welcome**: accepts optional `onSignIn` / `onSignUp` props; when
  provided, two extra CTAs ("Create account" / "Sign in") are
  rendered below the language picker.

---

## Test coverage

| File | Tests | Focus |
|------|-------|-------|
| `SignUpView.test.tsx` | 9 | form rendering, validation (name + match + terms), submit path, AR copy, auth-error display |
| `OtpView.test.tsx` | 7 | title + AR, email display, back, universal code path, bad-code path, resend |
| `SignInView.test.tsx` | 10 | title + AR, back, onSignUp / onForgotPassword / onSocialLogin, submit path, wrong-password, error display |
| `ForgotPasswordView.test.tsx` | 9 | step navigation, sendOtp on step transition, verifyOtp happy/sad path, password length, mismatch, full flow |
| `SocialLoginView.test.tsx` | 7 | title + AR, back, email link, Google + Apple sign-up-and-in flow, signIn failure |
| `AuthSheet.test.tsx` | 8 | open/closed rendering, AR copy, every CTA |
| `SettingsView.test.tsx` | 5 | signed-out shows Sign in, signed-in shows Log out, both buttons fire the right callback, AR copy |

Total new tests: **55**. The full pipeline went from 347 → **402** (43
test files).

---

## Out of scope (Phase 2/3)

- **Password hashing**. Plaintext in localStorage today. Phase 3
  security ticket.
- **Real OTP delivery**. SMS / email provider + rate limit + retry
  counting.
- **Google / Apple OIDC**. Real token verification, not a mock email.
- **Session refresh / expiry**. Tokens are immortal in Phase 1.
- **Email verification on sign-up**. New users are auto-signed in
  without verification.
- **Two-factor authentication**. Out of scope for the showcase.

---

## Acceptance criteria

- [x] Five new `ViewState`s in `navigation.ts`, fully wired in
      `AppContent.tsx`.
- [x] Five new views (+ `AuthSheet`) implemented, with bilingual
      copy and RTL handling.
- [x] `signUp` auto-signs-in; `signIn` sets session; `signOut`
      clears session; `resetPassword` updates the user record.
- [x] Settings shows the right CTA based on `currentUser`.
- [x] Header shows an initial-avatar when signed in, a person icon
      otherwise.
- [x] WelcomeView exposes `onSignIn` / `onSignUp` entry points.
- [x] `npm run verify` green: typecheck + ESLint + 402 tests +
      production build.
