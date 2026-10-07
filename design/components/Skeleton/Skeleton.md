---
category: Feedback
---
# Skeleton

Loading placeholders while a CSV parses or a widget recomputes.

**Provide:** `variant="rows"` with `rows` (table rows), or a single bar with `width` / `height`.

- `surface-300` blocks that pulse at 1.4s, and stay static under reduced motion.
- Show skeletons after 150ms of work; for shorter waits, show nothing.
