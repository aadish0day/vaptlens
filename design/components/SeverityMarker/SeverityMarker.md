---
category: Status
---
# SeverityMarker

Shape markers for the five severities, used where the word doesn't fit: chart legends, heatmap headers, scatter points, sparkline ends.

**Provide:** `severity`, optional `size` (px, default 10), `label` (true when the marker stands alone and needs an accessible name).

- Shapes are fixed: ◆ Critical, ▲ High, ● Medium, ▼ Low, ○ Info. They carry the meaning in every theme, including `cvd`.
- Always use them in chart legends and scatter plots. In tables and cards, `SeverityBadge` (with the word) is still required.
