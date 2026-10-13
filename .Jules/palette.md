## YYYY-MM-DD - Screen reader unread state
**Learning:** Screen reader users rely heavily on `aria-label`s to understand the state of an item. Adding a visual indicator (like a dot) is insufficient without updating the element's accessible name.
**Action:** When adding visual indicators like "unread" dots, ensure the corresponding interactive element's `aria-label` or `aria-description` includes the status text (e.g. "Unread: Title").
