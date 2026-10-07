---
category: Status
---
# SeverityBadge

The five-level severity label used in every table, card and drawer.

**Provide:** `severity` (`critical` | `high` | `medium` | `low` | `info`), optional `count` (mono number after the label).

- Always shows the word, led by the severity's shape marker (◆ ▲ ● ▼ ○); the shape and tint are support, never the only cue (critical and high are close in lightness).
- Text `sev-*` on ground `sev-*-soft`, 4.5:1 in both themes.
- Order is fixed Critical → Info everywhere: legends, stacks, sort order, filters.
- Don't use severity colors for anything that isn't severity; use `chart-*` for other dimensions.
