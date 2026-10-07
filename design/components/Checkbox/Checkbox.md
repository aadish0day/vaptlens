---
category: Filtering
---
# Checkbox

Checkbox for the slicer panel's multi-select lists (Severity, Tool, Host, Port) and table row selection.

**Provide:** `label`, `checked` + `onChange` (or `defaultChecked`), optional `indeterminate` (a "select all" with some rows selected), `severity` (adds the shape marker), `count` (the facet count, right-aligned mono), `disabled`.

- Box 16px, `border-strong` outline; checked = `lens` fill with an `on-lens` check.
- Facet counts reflect the other active filters, so a value with 0 count stays visible but muted.
