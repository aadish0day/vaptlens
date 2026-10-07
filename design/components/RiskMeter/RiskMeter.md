---
category: Data display
---
# RiskMeter

A host row with its weighted risk score and a meter bar, for the Host Risk leaderboard and HostRiskWidget.

**Provide:** `host` (IP or FQDN, set in `mono`), `score` (integer host risk score), `max` (the leaderboard's top score or a fixed ceiling), optional `criticals` (count).

- Bar color bands by share of `max`: ≥75% `sev-critical`, ≥50% `sev-high`, ≥25% `sev-medium`, else `sev-low`. The number is always shown, so color isn't the only cue.
- Track `surface-300`, 6px, `radius-full`.
- List 5 (widget) or 8 (leaderboard) rows, sorted by score, `space-3` apart.
