---
category: Governance
---
# RaciMatrix

Team × RACI role matrix on the SLA & RACI view: how many active findings each team holds in each role.

**Provide:** `data` (`{ [team]: { R, A, C, I } }` counts).

- Cells shade on the `heat-1…5` ramp relative to the busiest cell; zeros show a muted dot. Counts are in mono.
- Clicking a cell cross-filters to that team and role (the app wires this).
