---
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
title: Phase 4 Mock-Mode Cleanup
date: 2026-08-16
---

## Goal Capsule

Remove the inert mock-mode surface from the running codebase so R13 ("`authMode` is always `supabase`") becomes a structural invariant rather than a guarded one. The mock-mode branches, the universal OTP code, and the demo-mode helper text have been dead in production since Phase 2 wired up; they exist only because the Phase 1 fallback wiring was never deleted. R13 is now complete on the backend (every `Phase2Backend` service wire is in `AppContext`), so the cleanup is safe to remove atomically. The executor must run `npm run verify` after the change and the build must pass before this plan is complete.

Authority hierarchy: this plan is downstream of `docs/plans/2026-08-16-0347-feat-mooday-beta-launch-plan.md` (R13) and the HANDOFF comment in `docs/plans/HANDOFF.md` ("per the plan, removing them is Phase 4 cleanup"). It does not change product behavior; it deletes code paths the running app no longer enters.

Stop conditions: (a) `npm run verify` is green on the implementation branch; (b) every `MOCK_OTP_CODE`, `MOCK_TP_DISPLAY`, and `TODO(phase-1)` reference in `src/` is gone or replaced with a non-mock equivalent; (c) `src/components/PublicSellerProfile.tsx:113` `if (!phase2Backend) return;` is left untouched (it is a separate concern flagged in the audit but not in scope for this unit).

## Product Contract

### Requirements

- P1. After this change, `src/context/AppContext.tsx` contains no `if (!phase2Backend) return*;` early-return guards and no `TODO(phase-1)` comments. The `authMode` derivation keeps shape but the demo-mode branches (verifyOtp, sendOtp, signInWithOAuth) are unconditional. Covers R13.
- P2. After this change, `MOCK_OTP_CODE` is no longer exported from `src/data/users.ts` and no longer referenced from any source file. Covers R13.
- P3. After this change, `OtpView` and `ForgotPasswordView` no longer render a "universal code" hint in any code path. The `authMode !== "supabase"` gate in `OtpView.tsx:172` is removed because the gated branch is the only consumer of the mock display. Covers R13.
- P4. Existing tests in `OtpView.test.tsx` and `ForgotPasswordView.test.tsx` keep their behavioral coverage (back navigation, OTP code submission, password validation, language switching) but no longer assert on the mock-code display. Implementer replaces `MOCK_OTP_CODE` with a fixed test code (e.g. `"123456"`) where the previous test relied on the universal match. Covers R13.
- P5. `npm run verify` (typecheck + lint + `test:ci` + build) passes on the implementation branch. Covers R13.
- P6. The `signInWithOAuth` and `signInWithPassword` mock-mode branches at `src/context/AppContext.tsx:1810-1825` and `1886-1894` are removed (the `if (!phase2Backend) return false;` guard and the demo-mode `return code === MOCK_OTP_CODE` / `return MOCK_OTP_CODE`). `verifyOtp` becomes a Promise-only function. Covers R13.

### Out of scope

- The `src/components/PublicSellerProfile.tsx:113` `if (!phase2Backend) return;` guard is a separate concern (legacy listings fetch with no Phase 2 backend fallback) and is documented in the audit but not addressed here.
- The `STORAGE_KEYS.pendingOtp` and `STORAGE_KEYS.users` localStorage migrations in `AppContext.tsx:665-685` are kept — they are the one-way security migration called out in the same memo and remain correct under Phase 2.
- The nine "Phase 1 mock" prose comments elsewhere in `AppContext.tsx` (lines 102, 179, 239, 245, 644, 736, 788, 883, 1104, 1729, 1953) are NOT in scope. They are prose-only and do not gate behavior.
- The `process.env.MOCK_OTP_CODE` env var is removed only because the constant is removed; no other env var is touched.

### Acceptance Examples

- AE1. `npm run test:ci` reports the same number of `passes` (or higher) as the HANDOFF baseline (617 tests, 72 files). Specifically: `OtpView.test.tsx` and `ForgotPasswordView.test.tsx` still pass after the mock-code references are removed.
- AE2. `rg -n 'MOCK_OTP_CODE|MOCK_TP_DISPLAY|TODO\(phase-1\)|phase2Backend\) return' src/` returns no matches (the `PublicSellerProfile.tsx:113` line is the only intentional survivor and is excluded by the rg pattern).
- AE3. `npm run build` produces the same 8 routes (`/`, `/admin`, `/api/health`, `/api/stripe/webhook`, `/app`, `/auth/callback`, `/preview`, `/sitemap.xml`) per the HANDOFF.

## Planning Contract

### Key Technical Decisions

- KTD1. The `verifyOtp` callback signature changes from `boolean | Promise<boolean>` to `Promise<boolean>` only. The mock-mode branch returned a synchronous boolean; the real backend returns a Promise. Callers that consumed the boolean (none in `src/`; the only consumer is through `OtpView` and `ForgotPasswordView` form submit handlers, both already `async`) work as-is. The signature change is safe and is the natural consequence of removing the demo branch.
- KTD2. The test replacement code is the constant string `"123456"`. It must be six digits to match the `<input>` length validation in `OtpView.tsx` and `ForgotPasswordView.tsx`. The test stub for `verifyOtp` returns `true` (or a resolved `{ ok: true, value: mockUser }`) regardless of the input, so the literal value does not need to be auth-correct.
- KTD3. `MOCK_OTP_CODE` is removed from `src/data/users.ts` along with its `process.env` lookup. The env var is rare enough that no other consumer exists; the AUDIT does not flag it. The `gap-check` test at `src/services/backend/gap-check.ts` (if any) does not reference it.
- KTD4. The `MOCK_TP_DISPLAY` constant in `OtpView.tsx` is removed alongside the `authMode !== "supabase"` gate. The gate becomes `null` and the parent `<p>` retains its `t.sub` text only.

### High-Level Design

The change is mechanical deletion plus test rewrites. There is no new design surface. The signature of `verifyOtp` tightens (no longer `(boolean | Promise<boolean>)`); the signatures of `sendOtp` and `signInWithOAuth` are unchanged in the post-cleanup form because their real-backend branches already return Promise/boolean as expected.

### Assumptions

- The Phase 2 backend is the only `authMode` value in production. The `NEXT_PUBLIC_DATA_SOURCE` env var is not set to `mock` on any deployment target. The HANDOFF lists this as the production invariant.
- The `phase2Backend` flag is non-null in every deployment target. The flag is derived from `getPhase2Backend()` which returns `null` only when `NEXT_PUBLIC_DATA_SOURCE === "mock"` — that never happens in production. The clean-up prunes the defensive branches without losing runtime behavior.
- No external code path imports `MOCK_OTP_CODE` outside `src/`. The repo-local search returned zero non-`src/` consumers.

### Implementation Constraints

- Do not change the public `AppContext` API surface beyond the `verifyOtp` signature tightening.
- Do not delete the `authMode` derivation — the `AppContext` exposes it as a public field used by `OtpView` until this change. After the cleanup, `authMode` is derived but no longer branched on. Leave it for now (out of scope; can be removed in a follow-up).
- Do not touch `src/components/PublicSellerProfile.tsx:113` (out of scope).

### Sequencing

Single linear sweep:

1. U1 (AppContext.tsx): remove 12 guards + 3 demo branches + `MOCK_OTP_CODE` import.
2. U2 (src/data/users.ts): remove `MOCK_OTP_CODE` export.
3. U3 (OtpView.tsx): remove `MOCK_OTP_CODE` import, `MOCK_TP_DISPLAY`, and the `authMode !== "supabase"` gate.
4. U4 (ForgotPasswordView.tsx): remove `MOCK_OTP_CODE` import and the mock-code display.
5. U5 (test updates): update `OtpView.test.tsx` and `ForgotPasswordView.test.tsx` to drop the mock-code display assertion and use a 6-digit constant.
6. U6 (verify): run `npm run verify` and confirm green.

### Research

- `docs/audit-u1-mock-branches.md` is the exhaustive inventory of mock-mode branches. The audit lists 12 early-return guards and 11 prose comments. The early-return guards are this plan's scope; the prose comments are not.
- `docs/plans/2026-08-16-0347-feat-mooday-beta-launch-plan.md` R13 governs the removal ("no mock-mode branching remains in the codebase").
- `docs/plans/HANDOFF.md` flags the same cleanup as "Phase 4 cleanup" and "deferred to U17 polish" (the polish never happened and was rolled into Phase 4).
- The audit was authored under the assumption that removals happen unit-by-unit. This plan collapses them into one atomic change because the dependent U-IDs (U2, U3, U7, U8, U10) have all shipped per the HANDOFF.

## Implementation Units

### U1. Remove mock-mode branches in AppContext.tsx

- **Goal:** Delete the 12 `TODO(phase-1)` early-return guards and the 3 demo-mode fallbacks in `verifyOtp`, `sendOtp`, and `signInWithOAuth`. Drop the `MOCK_OTP_CODE` import.
- **Files:** `src/context/AppContext.tsx`
- **Approach:**
  - Remove the `MOCK_OTP_CODE` import from line 33.
  - For each of the 12 guards at lines 661, 699, 742, 800, 1109, 1154, 1164, 1186, 1196, 1889 (representative), remove the `if (!phase2Backend ...) return;` line and the trailing `// TODO(phase-1): ...` comment. Trust the typed `phase2Backend` parameter, which is always non-null in production.
  - In `verifyOtp` (line ~1858): remove the `if (phase2Backend) { ... }` guard and the trailing `return code === MOCK_OTP_CODE;` demo branch. The body becomes the single Promise branch. Signature tightens to `Promise<boolean>`.
  - In `sendOtp` (line ~1877): remove the `if (phase2Backend) { ... }` guard and the trailing `return MOCK_OTP_CODE;` demo branch. The body becomes the single Promise branch.
  - In `signInWithOAuth` (line ~1886): remove the `if (!phase2Backend) return false;` guard. The body becomes the single OAuth call.
  - In `signIn` (line ~1810): remove the `if (phase2Backend) { ... }` guard and the demo-mode `users.find(...)` block. The body becomes the single Promise branch. The `users`, `setUsers`, `setSession`, `generateSessionToken`, `verifyPin`, `hashPin` imports can stay (they are still used elsewhere in the file) — verify with `rg` after the edit.
- **Test Scenarios:**
  - `npm run verify` must pass.
  - `rg -n 'TODO\(phase-1\)' src/context/AppContext.tsx` returns no matches.
  - `rg -n 'MOCK_OTP_CODE' src/context/AppContext.tsx` returns no matches.
- **Verification:** `npm run typecheck` (the `verifyOtp` signature change is the only mismatch risk; callers must already be `async`).

### U2. Remove MOCK_OTP_CODE export from src/data/users.ts

- **Goal:** Delete the `MOCK_OTP_CODE` constant and its `process.env.MOCK_OTP_CODE` fallback.
- **Files:** `src/data/users.ts`
- **Approach:** Remove the `MOCK_OTP_CODE` export at line 45 and the preceding comment block. The file's auth-shape exports (`User`, `DEFAULT_USERS`, `generateSessionToken`, `Session`) remain — they are still used by the Phase 1 mock-mode stores that `AppContext` initializes even after the cleanup.
- **Test Scenarios:**
  - `rg -n 'MOCK_OTP_CODE' src/ tests/` returns no matches.
  - `npm run typecheck` passes.
- **Verification:** `npm run typecheck`.

### U3. Remove MOCK_TP_DISPLAY and mock-code gate in OtpView.tsx

- **Goal:** Drop the universal-code hint from the OTP entry screen.
- **Files:** `src/components/OtpView.tsx`
- **Approach:**
  - Remove `import { MOCK_OTP_CODE } from "@/data/users";` at line 15.
  - At line 172, replace the `{authMode !== "supabase" && (<>...</>)}` block with `null` (or remove the conditional entirely and inline the survivors). The parent `<p>` keeps `t.sub` only.
  - Remove the `const MOCK_TP_DISPLAY = MOCK_OTP_CODE;` line at line 258.
- **Test Scenarios:**
  - `rg -n 'MOCK_OTP_CODE|MOCK_TP_DISPLAY|authMode' src/components/OtpView.tsx` returns no matches.
  - `npm run typecheck` passes.
- **Verification:** `npm run typecheck`.

### U4. Remove MOCK_OTP_CODE display in ForgotPasswordView.tsx

- **Goal:** Drop the universal-code hint from the password-reset OTP step.
- **Files:** `src/components/ForgotPasswordView.tsx`
- **Approach:**
  - Remove `import { MOCK_OTP_CODE } from "@/data/users";` at line 17.
  - Remove the inline `<span>{MOCK_OTP_CODE}</span>` block at line 240. The surrounding `{t.sub2} {" "} {t.sub2Suffix}` text remains but the middle span is deleted.
- **Test Scenarios:**
  - `rg -n 'MOCK_OTP_CODE' src/components/ForgotPasswordView.tsx` returns no matches.
  - `npm run typecheck` passes.
- **Verification:** `npm run typecheck`.

### U5. Update OtpView and ForgotPasswordView tests

- **Goal:** Drop the mock-code display assertions and replace `MOCK_OTP_CODE` with a constant 6-digit code in tests.
- **Files:** `src/components/OtpView.test.tsx`, `src/components/ForgotPasswordView.test.tsx`
- **Approach:**
  - In both test files, replace `import { MOCK_OTP_CODE } from "@/data/users";` with a literal `const TEST_OTP_CODE = "123456";` at the top of the file.
  - In `OtpView.test.tsx`:
    - Remove the `// Universal mock code is shown in the helper hint.` assertion at line 129 (the helper text no longer shows the code).
    - Replace `MOCK_OTP_CODE` references at lines 129, 154, 156 with `TEST_OTP_CODE`.
  - In `ForgotPasswordView.test.tsx`:
    - Replace `MOCK_OTP_CODE` references at lines 154, 156, 160, 167, 182, 197 with `TEST_OTP_CODE`.
    - The `sendOtp: vi.fn(() => MOCK_OTP_CODE)` stub at line 154 stays as a string return but the literal becomes `TEST_OTP_CODE`. The stub signature for `sendOtp` is `Promise<string | null>`; a synchronous `return` is wrapped by `vi.fn` and the form code reads it synchronously.
  - The stub for `verifyOtp` is `vi.fn(() => true)` or `vi.fn(async () => true)` — confirm by reading the form code. If the form awaits `verifyOtp`, the stub must be `async`; otherwise sync works.
- **Test Scenarios:**
  - `npm run test:ci -- src/components/OtpView.test.tsx src/components/ForgotPasswordView.test.tsx` passes.
  - `rg -n 'MOCK_OTP_CODE' src/components/` returns no matches.
- **Verification:** `npm run test:ci`.

### U6. Final verification

- **Goal:** Confirm the full pipeline is green.
- **Files:** (none)
- **Approach:** Run `npm run verify` and confirm zero errors. The HANDOFF reports the baseline as 8/11 verified green; the same suite is the success criterion.
- **Test Scenarios:**
  - `npm run verify` exits 0.
  - `npm run build` produces a build with the same 8 routes as the HANDOFF lists.
- **Verification:** `npm run verify`.

## Verification Contract

- `npm run typecheck` — TypeScript strict, no errors.
- `npm run lint` — ESLint, no new errors (the existing 75 warnings stay; they are pre-existing `<img>` lint warnings).
- `npm run test:ci` — Vitest run mode, 617+ tests pass (the test count may drop by 1–2 if a test assertion was removed; net is non-negative).
- `npm run build` — Next.js production build, 8 routes registered.
- `rg -n 'MOCK_OTP_CODE|MOCK_TP_DISPLAY|TODO\(phase-1\)' src/` returns no matches.
- `rg -n 'if \(!phase2Backend\) return' src/context/AppContext.tsx` returns no matches (the `PublicSellerProfile.tsx:113` survivor is intentionally outside the rg scope).

The optional `npm run test:phase2:*` commands require a running local Supabase and are not part of this unit's verification. The HANDOFF lists them under operational DoD.

## Definition of Done

- All 6 implementation units are complete.
- `npm run verify` is green.
- `MOCK_OTP_CODE`, `MOCK_TP_DISPLAY`, and the `TODO(phase-1)` comments are gone from `src/`.
- The 12 `if (!phase2Backend ...) return*;` guards in `AppContext.tsx` are removed.
- The 3 demo-mode branches in `verifyOtp`, `sendOtp`, `signInWithOAuth` are removed.
- No tests regress. Behavioral coverage in `OtpView.test.tsx` and `ForgotPasswordView.test.tsx` is preserved.
- The `AppContext` public API surface is unchanged except for the `verifyOtp` signature tightening to `Promise<boolean>`.

## Appendix

### Per-unit removal map

| Unit | Lines/files touched | Net deletions |
|------|---------------------|---------------|
| U1 | AppContext.tsx ~14 spots | ~14 lines guards + 8 lines demo branches + 1 line import + ~70 lines removed (the demo-mode auth fallback in `signIn` is the biggest single block) |
| U2 | src/data/users.ts | 1 line |
| U3 | OtpView.tsx | ~10 lines (gate + import + constant) |
| U4 | ForgotPasswordView.tsx | ~3 lines |
| U5 | 2 test files | ~3 lines net (drop the mock-code display assertion, add the `TEST_OTP_CODE` constant) |
| U6 | (none) | 0 |

### Open questions

None. The plan is fully block-free.

### Sources

- `docs/plans/2026-08-16-0347-feat-mooday-beta-launch-plan.md` R13.
- `docs/plans/HANDOFF.md` Known remaining work + Risks for the next session.
- `docs/audit-u1-mock-branches.md` exhaustive branch inventory.
- `src/context/AppContext.tsx` lines 661, 699, 742, 800, 1109, 1154, 1164, 1186, 1196, 1810, 1858, 1877, 1886 (current line numbers as of 2026-08-16).
- `src/components/OtpView.tsx` lines 15, 172, 258.
- `src/components/ForgotPasswordView.tsx` lines 17, 240.
- `src/components/OtpView.test.tsx` lines 6, 129, 154, 156.
- `src/components/ForgotPasswordView.test.tsx` lines 6, 154, 156, 160, 167, 182, 197.
- `src/data/users.ts` line 45.
