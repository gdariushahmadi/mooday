## 2025-02-14 - Add loading spinners to auth submit buttons
**Learning:** Adding a visual indicator like an animated spinner inside standard text buttons provides stronger feedback during async forms submissions, especially for users who might miss text changes.
**Action:** When creating new async form submissions, default to using `<span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>` alongside a descriptive label inside disabled flex row buttons.
