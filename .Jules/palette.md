## 2024-06-25 - Missing Labels in Inline Quick Actions
**Learning:** Inline quick-action forms (like the "Make Offer" mini-form appearing inside a chat view) often lack standard label associations (`<label for="...">`) because their purpose is visually implied by surrounding text (e.g., a "Make Offer" heading). This breaks the experience for screen reader users who focus directly on the input.
**Action:** When adding quick inline inputs or reviewing them, ensure they have an explicit `aria-label` providing full context if a visual label is not strictly tied to them with an `id`.
