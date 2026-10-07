---
category: Status
---
# SlaPill

SLA state for a finding against its severity's window (Critical 14d, High 30d, Medium 90d, Low 180d, Info 360d).

**Provide:** `status` (`met` | `at-risk` | `breached`), optional `days` (days left when at risk, days over when breached).

- `at-risk` = 7 days or fewer left. `status-warn` on `status-warn-soft`.
- Always carries a word and an icon (check / clock): Met and Breached are never told apart by green vs red alone.
