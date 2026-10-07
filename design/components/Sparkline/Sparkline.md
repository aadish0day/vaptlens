---
category: Charts
---
# Sparkline

A tiny inline trend for table cells, KPI subtitles and the host leaderboard.

**Provide:** `values` (numbers, oldest first), optional `tone` (`lens` | `ok` | `danger` | `muted`), `width` (96), `height` (24), `label`.

- No axes or labels. The end dot marks the latest value. Put the actual number beside it.
- Tone reflects meaning: falling findings are `ok`, rising Critical counts are `danger`.
