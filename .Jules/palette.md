## 2024-11-02 - Accessible Unread Notification State
**Learning:** Relying solely on visual cues (like an unread dot) for state indicators misses conveying that state to screen reader users.
**Action:** When adding visual state indicators (like an 'unread' dot) to interactive elements, ensure the corresponding element's aria-label or aria-description is updated to include the status text (e.g., 'Unread: Title') to provide proper context.
