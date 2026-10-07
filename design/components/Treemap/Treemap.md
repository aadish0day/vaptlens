---
category: Charts
---
# Treemap

Treemap: proportional cells for hierarchical counts (findings by host, OWASP category or subnet).

**Provide:** `data` (`[{label, value, severity?, color?}]`), optional `height`, `label`, `selected`, `onSelect`.

- Cells are squarified with 8px corners and a 3px gutter. Labels (in `canvas` color, name plus value) show only on cells wider than 70px and taller than 34px; the rest rely on the hover title.
- Fill with `sev-*` for a severity dimension, otherwise `chart-1…6`. Click cross-filters like bars.

- Cross-filter: pass `selected` (the active label) and `onSelect(label | null)`. The clicked mark gets a 2px `chart-selected` outline, the rest drop to `opacity-dimmed`, and clicking it again clears. Marks are buttons, so Tab + Enter works too. Without `onSelect` the chart keeps its own selection.
