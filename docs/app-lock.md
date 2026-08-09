# G-39 / G-40 — App Lock (Auto-lock + Biometric / PIN unlock)

> **Screen IDs**: G-39 (Security section in Settings + SecuritySetupView),
> G-40 (LockScreen overlay).
> **Status**: ✅ Built, tested, wired into the shell.
> **Data**: client-only — PIN hash + WebAuthn credential id live in
> `localStorage`. No server round-trip.

---

## Why this slice

Group G previously had Account, Preferences, Privacy & Safety, and
About sections in Settings. There was no way to keep the app private
once the device was unlocked — anyone could pick up a signed-in
phone and browse the Vault, chats, and orders. This slice adds an
opt-in **auto-lock** that hides the UI after a few minutes of
inactivity and asks for either a platform biometric (Touch ID, Face
ID, fingerprint, Windows Hello) or a PIN before showing anything
again.

## Threat model

This is **casual-device-snooping** protection, not a hardened
authenticated session:

- Server-side auth still happens through the existing Phase 2 backend.
- The lock screen never moves money; it just hides the UI until a
  local factor succeeds.
- PIN hashing uses PBKDF2-SHA-256 / 120k iterations with a per-user
  random 16-byte salt. The cleartext PIN never touches storage.
- WebAuthn uses platform authenticators with `userVerification:
  "required"` — the private key never leaves the device TPM / Secure
  Enclave.
- `unlock` does not mutate any server state.

## UX

Settings now has a fifth section, **Security**, with one row that
opens `SecuritySetupView`. That view exposes:

1. **Master toggle** — "Auto-lock when inactive".
2. **Lock timeout** — 1 / 5 / 15 / 30 / 60 minutes. Default 5.
3. **Biometric** — Face ID / Touch ID / fingerprint / Windows Hello.
   Hidden when the platform does not advertise a built-in
   authenticator.
4. **PIN** — 4–8 digit numeric fallback. Always available, even on
   devices without biometric.
5. **Lock now** — force-locks the current session so the user can
   test the unlock flow.

When the timer expires the shell renders `<LockScreen />` over
everything (z-200, full-screen). The screen shows:

- The Mooday wordmark.
- A biometric button when available (auto-prompts on mount when
  biometric is the only factor, so the user only taps once).
- A PIN input + Unlock button as fallback.
- A "Forgot PIN? Sign out and reset it." hint.
- An inline error chip for failed attempts.

## Wiring

- `src/lib/security.ts` — PIN hashing + WebAuthn wrappers.
- `src/hooks/useIdleLock.ts` — pointer / keyboard / touch / wheel /
  click activity tracker with `performance.now()`-based ticking.
- `src/components/LockScreen.tsx` — overlay UI.
- `src/components/SecuritySetupView.tsx` — settings sub-page.
- `src/context/AppContext.tsx` — lock state, action callbacks,
  auto-lock on sign-in.
- `src/app/app/page.tsx` — mounts `<LockScreen />` when `isLocked`,
  wires `useIdleLock` + `lockNow`.
- `src/types/navigation.ts` — adds `security-setup` to `ViewState` +
  `VALID_VIEWS`.

## i18n

Both English and Arabic copy live in the components themselves.
Settings section heading is **Security** / **الأمان**; the row label
is **App lock** / **قفل برنامه**. The lock screen headline is
**Mooday is locked** / **مودي مقفله**.

## Test coverage

- `security.test.ts` — 3 tests (hash/verify, salt uniqueness,
  preset list).
- `useIdleLock.test.ts` — 4 tests (expiry, reset, disabled flag,
  activity events).
- `LockScreen.test.tsx` — 5 tests (renders, biometric visibility,
  PIN unlock, Arabic copy).
- `SecuritySetupView.test.tsx` — 6 tests (master toggle, gated
  sub-controls, PIN match/mismatch, lock-now visibility + action).
- `SettingsView.test.tsx` — 3 new tests (Security section renders,
  App lock row navigates, Arabic heading).
- `navigation.test.ts` — updated `VALID_VIEWS` assertion.

**+21 new tests**, total now **565** (was 544).

`npm run verify` is GREEN:

- ✅ typecheck (0 errors)
- ✅ tests (565 passing)
- ✅ production build

## Out of scope (deferred)

- **Cross-device lock state** — we never push "this device is locked"
  to the backend. A thief who steals a logged-in device gets the
  current session; sign-out elsewhere is a separate flow.
- **Auto-lock on tab switch / minimize** — the timer keeps ticking
  in the background, which is the safer default, but a future
  enhancement could pause on `visibilitychange === "hidden"`.
- **Per-account lock** — the lock is per-device, not per-account.
  Signing out clears it.
