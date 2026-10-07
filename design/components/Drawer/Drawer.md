---
category: Overlays
---
# Drawer

Right-side sheet for host triage (deep-linked as `?host=<ip>`) and finding details.

**Provide:** `title` (host IP or finding name), `children`, optional `eyebrow` ("Host" / "Finding"), `mono` (set the title in mono for hosts), `meta` (badges under the title: tier, device type, threat tags), `footer`, `onClose`, `open`.

- Width `drawer-width` 480, full width below `bp-md`. `scrim` + `z-drawer`. Slides in over 180ms unless the user prefers reduced motion.
- Preserve the drawer's scroll position across tab switches.

## Keyboard and focus

- Esc closes it (calls `onClose`).
- Focus moves into the dialog on open, Tab and Shift+Tab stay inside it, and focus goes back to the element that opened it on close.
- The panel carries `role="dialog"`, `aria-modal="true"` and `aria-label` set to the title.
