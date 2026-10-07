---
category: Data display
---
# KpiCard

A single-metric card for the dashboard's KPI row and the Governance header.

**Provide:** `label` (uppercase eyebrow, via `label` style), `value` (preformatted string or number, tabular figures), optional `sub` (one line of context), `icon`, `tone` (`critical` | `ok` | `warn` colors the number), `active` (the filter ring when this card's filter is applied), `onClick` (makes it a toggle button with `aria-pressed`).

- 3–5 cards per row, equal widths, `space-5` gaps.
- Use `tone` only when the number itself is a verdict (breached count, compliance %); counts stay `ink`.
- The value never wraps; abbreviate above 99,999 (128.4k).
