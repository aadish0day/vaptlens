---
category: Data display
---
# RiskDelta

Net risk delta between baseline scan A and re-test scan B on the Re-Test Verification view.

**Provide:** `pct` (signed integer, (ΣCVSS B − ΣCVSS A) ÷ ΣCVSS A × 100), optional `baseline` / `retest` (batch labels), `before` / `after` (ΣCVSS), `label`.

- A negative value is good: `status-ok`, a trend-down icon and "Risk reduced". A positive value is `status-danger` with "Risk increased". Uses a true minus sign (−).
- Pair it with the three `DiffBadge` counts.
