## 2024-10-10 - Form Submission Loading States

**Learning:** Relying solely on disabled state and changing button text for form submissions in auth flows lacks sufficient visual feedback.

**Action:** When implementing form submission loading states, combine a disabled state with an animating visual indicator (e.g., `progress_activity` icon with `animate-spin` class and `flex items-center justify-center gap-2`), rather than relying solely on changing button text.
