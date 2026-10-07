---
category: Charts
---
# Heatmap

Host × severity density grid (the Severity Heatmap template).

**Provide:** `rows` (`[{host, values: [critical, high, medium, low, info]}]`), optional `selected` (host) and `onSelect`. Host labels are buttons; the other rows dim when one is selected.

- Cell = severity color at opacity `opacity-heat-min` + 0.74 × (value ÷ max), with the count in mono on top. Empty cells stay `surface-200`.
- Column headers carry the shape marker and the word. Click a row to cross-filter by host.
- For non-severity density (subnet × month, aging buckets) use the `heat-0…5` sequential ramp instead.
