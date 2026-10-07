---
category: Charts
---
# RadarChart

Radar (Risk Posture Radar template): compares batches or teams across 5–8 axes.

**Provide:** `axes` (labels), `series` (`[{label, values, color?, dashed?}]`), optional `max` (default 10), `label`.

- The polygon fill is 0.18 opacity with a 2px stroke, over `chart-grid` rings at 25/50/75/100%.
- At most 3 series. Use it for posture overviews, not exact reading: pair it with a table.
