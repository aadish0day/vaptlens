---
category: Charts
---
# ScatterChart

CVSS scatter: CVSS 0–10 on x against a category on y (host, tool, OWASP category), one shape-coded point per finding.

**Provide:** `categories` (y rows), `points` (`[{category, cvss, severity, name}]`), optional `label`, `selected` (category), `onSelect`. Clicking a point selects its category.

- Points use `SeverityMarker` shapes, so they read in every theme. Dashed guides at 4.0, 7.0 and 9.0 mark the severity bands.
- Points in the same row jitter vertically by ±5px so duplicates stay visible. Click a point to cross-filter.
