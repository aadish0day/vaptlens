---
category: Governance
---
# SlaBreachCard

The SlaBreachKpiWidget: the total count of breached findings with a per-severity breakdown whose rows act as filter triggers.

**Provide:** `breakdown` (`{critical, high, medium, low, info}` breached counts), optional `total`, `onSelect(severity)`.

- The total is `status-danger`, or `status-ok` at zero. Each row shows the severity's SLA window (14 / 30 / 90 / 180 / 360 days) and count; rows with a count of zero are disabled.
