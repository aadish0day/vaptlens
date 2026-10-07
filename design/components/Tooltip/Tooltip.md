---
category: Overlays
---
# Tooltip

A hover/focus tooltip for icon buttons, truncated values and chart marks.

**Provide:** `children` (the trigger, which must be focusable), `content` (one short line), optional `side` (`top` default, or `bottom`).

- `tooltip-bg` ground, `ink` text, `shadow-overlay`, `z-tooltip`. One line, 240px max; never put actions inside.
- For permission-restricted actions use `Button restricted` instead, which builds this in.
