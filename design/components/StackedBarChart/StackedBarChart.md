---
category: Charts
---
# StackedBarChart

Stacked bars: grouped series such as the vulnerability aging chart (TrendsDeep) and any bar widget with a `colorBy` split in stacked mode.

**Provide:** `labels` (x categories), `series` (`[{label, values, severity?, color?}]`, bottom to top), optional `height`, `label`, `selected` (x category), `onSelect`. Clicking a column selects its category.

- Stack order follows the legend order. Severity stacks put Critical at the bottom. Aging stacks run 0–30 days at the bottom to 180+ at the top, on the `heat-2…5` ramp (older = stronger).
- A 1px gap separates segments; only the top segment is rounded.
