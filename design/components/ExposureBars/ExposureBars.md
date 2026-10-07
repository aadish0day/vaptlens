---
category: Data display
---
# ExposureBars

Threat exposure meters (BreachBreakdownWidget): how much of the active estate each threat class touches.

**Provide:** `items` (`[{kind, value}]` with kind `kev` | `zeroday` | `ransomware` | `exploitable` | `breached` | `eol`), `total` (active findings).

- Each row has an icon, a word and `value / total`. The bar uses the threat's own token (`threat-kev`, `threat-zeroday`…).
- Clicking a row applies the matching quick-filter `Toggle`.
