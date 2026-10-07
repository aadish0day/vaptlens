---
category: Governance
---
# SlaTrend

SLA compliance trajectory: the current percentage with monthly sparkbars.

**Provide:** `months` (`[{label, pct}]`, oldest first), optional `label`.

- Bands: `status-ok` at 80% or more (on target), `status-warn` for 50–79%, `status-danger` below 50%. The band word is shown next to the number, so color isn't the only cue.
- Up to 12 months; label with short month names ("Nov", "Feb").
