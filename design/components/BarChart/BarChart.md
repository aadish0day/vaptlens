---
category: Charts
---
# BarChart

Reference bar chart showing how every bar-type widget is styled (bar, histogram, stacked). The app renders with Recharts using the same tokens and rules.

**Provide:** `data` (`[{label, value, severity?, color?}]`), optional `height`, `legend`, `label` (accessible name), `selected`, `onSelect`.

- Gridlines `chart-grid`, tick text `chart-axis` at 11px, bar corner radius 3px, bar width ≤ 48px, category gap about 36% (4% for histograms).
- Severity series use `sev-*` in Critical → Info order; any other dimension uses `chart-1…6` in order.
- Cross-filter: pass `selected` and `onSelect(label | null)`. The clicked bar gets a 2px `chart-selected` outline and the others drop to `opacity-dimmed`. Click again to clear. Bars are keyboard-focusable (Tab, Enter).
- Rotate labels −35° only when there are more than 8 categories; long labels are truncated with an ellipsis and the full text goes in the tooltip.
