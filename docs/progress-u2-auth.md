# U2 Progress: AuthService Wire-up

**Date:** 2026-08-16
**Status:** largely wired; awaiting end-to-end verification
**Owner:** U2 (Wire AuthService to all UI surfaces)

## What is already done

1. **SupabaseAuthService** in `src/services/backend/supabase.ts:113` implements the full `AuthService` interface from `src/services/backend/contracts.ts`:
   - `getCurrentUser`
   - `subscribe`
   - `signUp` (with emailRedirectTo callback URL)
   - `signIn` (signInWithPassword)
   - `signOut`
   - `sendOtp` (recovery vs signup)
   - `verifyOtp`
   - `resetPassword`
   - `signInWithOAuth`
   - `completeOAuth`
   - `updateName`

2. **AppContext routing** in `src/context/AppContext.tsx`:
   - `signUp` (line 1730): routes to `phase2Backend.auth.signUp` when `phase2Backend` is set.
   - `signIn` (line 1768): routes to `phase2Backend.auth.signIn` when `phase2Backend` is set.
   - The mock branches below the early-return are still present but unreachable when `phase2Backend` is set.
   - `authMode` is derived from `phase2Backend` (line 473).

3. **UI components** already use `useApp` from AppContext:
   - `SignUpView` calls `signUp`.
   - `SignInView` calls `signIn`.
   - `ForgotPasswordView` calls `signIn` after `resetPassword`.
   - `OtpView` calls `verifyOtp` and shows a mock helper text only when `authMode !== "supabase"`.

4. **Smoke test** at `scripts/phase2-auth-smoke.mjs` exercises the full sign-up + verify + reset flow against a local Supabase with Mailpit.

## What is still pending

1. **End-to-end verification** against a running local Supabase:
   - `supabase start` and `npm run test:phase2:smoke` should both pass.
   - The four flows in U2's test scenarios (sign up, sign in, wrong password, password reset) should produce the expected outcomes.

2. **Cleanup of `MOCK_OTP_CODE` references**:
   - The constant is still defined in `src/data/users.ts:45` and used in:
     - `src/context/AppContext.tsx:33, 1864, 1882` (mock branches)
     - `src/components/OtpView.tsx:15, 258` (mock helper display)
     - `src/components/ForgotPasswordView.tsx:17, 240` (mock helper display)
     - `src/components/OtpView.test.tsx:6, 129, 154` (tests)
   - The UI helpers already gate on `authMode !== "supabase"`, so the constant is only used in mock mode.
   - Removing the export requires updating tests. Not blocking; safe to defer.

3. **OAuth callback** in `src/app/auth/callback/page.tsx` (mentioned in the SupabaseAuthService) — needs to be wired through `completeOAuth`.

## Next steps

1. Run `npm run test:phase2:smoke` against a local Supabase to verify the auth flows.
2. After all four sign-up/sign-in/reset flows pass, mark U2 as complete.
3. Defer MOCK_OTP_CODE cleanup to U17 (Polish) where mock-mode references are removed globally.

## Status

- SupabaseAuthService implementation: done.
- AppContext routing: done.
- UI components: done.
- End-to-end smoke: pending local Supabase run.
- MOCK_OTP_CODE cleanup: deferred to U17.
