---
category: Overlays
---
# Modal

Centered dialog for the Column Mapper, the Widget Builder and confirmations.

**Provide:** `title`, `children`, optional `subtitle`, `footer` (right-aligned Buttons: secondary "Cancel" then one primary), `onClose`, `width` (default `modal-width` 640; the Widget Builder uses 960), `open`.

- `scrim` backdrop, `z-modal`, `radius-lg`, `shadow-overlay`. Closes on Esc and a scrim click.
- Full-screen below `bp-md`.
- Column Mapper: one row per canonical field (host, severity, cvss, name, url, cve, port, protocol, description, solution, pluginId, scanDate), each a `ColumnMapRow` with a native select of the file's headers. Saved presets go above the rows as pills (apply, or × to delete); "Save as preset" stores the current mapping under the tool name.

## Keyboard and focus

- Esc closes it (calls `onClose`).
- Focus moves into the dialog on open, Tab and Shift+Tab stay inside it, and focus goes back to the element that opened it on close.
- The panel carries `role="dialog"`, `aria-modal="true"` and `aria-label` set to the title.
