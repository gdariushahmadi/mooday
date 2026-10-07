## 2026-10-07 - Interactive Loading Feedback in Auth Forms
**Learning:** Relying solely on text changes (e.g., 'Submit' to 'Submitting...') or disabled states for asynchronous submit buttons in authentication flows lacks sufficient visual prominence, leaving users uncertain about the background process.
**Action:** Apply a consistent visual loading pattern using an animated `progress_activity` icon coupled with flexbox centering (`flex items-center justify-center gap-2`) for all primary submit buttons across auth forms (SignIn, SignUp, OTP) to provide unambiguous, delightful feedback.
