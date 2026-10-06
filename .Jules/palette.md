## 2024-05-18 - Auth form loading indicators
**Learning:** Using purely text changes (e.g. "Sign in" -> "Signing in...") for form submission loading states is not sufficient for UX, as it's not a strong visual indicator and can feel unresponsive. Adding an animating spinner combined with disabled state provides immediate, clear feedback.
**Action:** When creating form submission buttons, always include an animating visual indicator (like a spinning progress icon) alongside the disabled state, and use `flex` and `gap` to position it nicely with the text.
