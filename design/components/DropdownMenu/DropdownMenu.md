---
category: Actions
---
# DropdownMenu

A button that opens an action menu: Export (PNG / PDF / CSV), widget overflow menus, bulk actions.

**Provide:** `label`, `items` (`[{label, icon?, hint?, danger?, onSelect}]`, or `"-"` for a divider), optional `variant`, `size`, `icon`, `align` (`right` for right-edge triggers).

- Actions only. For choosing values, use `MultiSelect` or `SegmentedControl`.
- Put destructive items last, below a divider, with `danger`. Hints are short mono ("2x", ".csv").
