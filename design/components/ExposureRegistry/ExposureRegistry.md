---
category: Data display
---
# ExposureRegistry

The Asset Inventory's catalog of EOL technologies and Zero-day exposures.

**Provide:** `items` (`[{kind: 'eol' | 'zeroday', name, detail?, hosts, criticals}]`).

- One row per technology or CVE: the tag, name, the version or CVE detail in mono, affected host count, and critical count.
- Sort Zero-day first, then by affected hosts. Clicking a row filters to those hosts (the app wires this).
