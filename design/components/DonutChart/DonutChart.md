---
category: Charts
---
# DonutChart

Reference donut: inner radius 58%, 2° slice gaps, total in the centre, legend with shape markers and values.

**Provide:** `data` (`[{label, value, severity?, color?}]`), optional `total` / `totalLabel` (defaults to the sum and "active"), `label`, `selected`, `onSelect`.

- At most 6 slices; group the rest into "Other" (`chart-6`). Slice order follows the legend order.
- Use it only for part-to-whole with ≤ 6 parts; otherwise use a bar chart.

- Cross-filter: pass `selected` (the active label) and `onSelect(label | null)`. The clicked mark gets a 2px `chart-selected` outline, the rest drop to `opacity-dimmed`, and clicking it again clears. Marks are buttons, so Tab + Enter works too. Without `onSelect` the chart keeps its own selection.
