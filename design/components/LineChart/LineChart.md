---
category: Charts
---
# LineChart

Line and area charts: the spec's LineChartWidget, AreaChartWidget and the TrendsDeep threat-trajectory chart.

**Provide:** `labels` (x categories, e.g. scan months), `series` (`[{label, values, severity?, color?, dashed?}]`), optional `area` (gradient fill, AreaChartWidget), `height`, `label`, `id` (unique when several area charts share a page).

- Curves are smoothed; points are 2.5px and grow to 4.5px under the dashed crosshair on hover. The legend shows the hovered (or latest) value.
- Threat trajectories use their own tokens: `threat-kev`, `threat-zeroday`, `threat-ransomware`, `sev-high` for Exploitable. Dash one series if two lines sit close together.
- Needs at least 2 dated scan batches, otherwise the template stays locked.
- A `null` value is a gap: the line breaks there and resumes at the next value. Use it to join an actual series to a dashed forecast series.
