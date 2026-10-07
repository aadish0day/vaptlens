---
category: Workflow
---
# QuadrantTile

One cell of the Prioritization Matrix 2×2 (risk × effort). Four tiles in a 2-column grid make the matrix.

**Provide:** `kind` (`quickwins` | `strategic` | `mundane` | `deferrable`), `count`, optional `selected`, `onClick` (filters the triage sidebar).

- Layout: Quick Wins top-left, Strategic top-right, Mundane bottom-left, Deferrable bottom-right. Risk runs up, effort runs right.
- Top rules: Quick Wins `status-ok`, Strategic `status-warn`, Mundane `chart-2`, Deferrable `sev-info`. Selected = `lens-soft` ground and `lens` border.
