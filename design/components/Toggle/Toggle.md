---
category: Filtering
---
# Toggle

Switch chips for the slicer's quick threat filters: CISA KEV, Ransomware, 0-Day, EOL, >6 months unpatched.

**Provide:** `label`, `checked` + `onChange` (or `defaultChecked`), optional `icon` (the threat icon) and `count`.

- `role="switch"`. On = `lens-soft` ground, `lens` track and border; the label stays `ink`.
- Keep the order KEV, Ransomware, 0-Day, EOL, >6 months. Each one adds a `FilterChip` when on.


**Disabled:** pass `disabled` (and a `title` explaining why, e.g. a read-only role). The switch dims and ignores clicks.
