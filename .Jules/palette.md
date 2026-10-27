## 2024-10-27 - Loading state for async password reset
**Learning:** Missing loading states during multi-step async operations, especially for form submission like password resets, is confusing to users.
**Action:** Added disabled state and `progress_activity` spinner icon with `animate-spin` to `verifyOtp` and `resetPassword` buttons in `ForgotPasswordView.tsx` to align with the visual pattern from `SignUpView` and `SignInView`.
