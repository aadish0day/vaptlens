---
category: Status
---
# DiffBadge

Re-test classification badges for the scan A vs scan B differential.

**Provide:** `kind` (`fixed` | `new` | `persistent` | `reopened` | `unverified` | `accepted`), optional `count`, `label`.

- Verified fixed = `status-ok` + check, New risk = `status-danger` + zap, Persistent = `status-warn` + clock. Always with the word.
- Reopened = `status-danger` with a 1px danger ring + flame: the issue was fixed in an earlier scan and came back (a regression).
- Not re-tested (`unverified`) = muted + lock: the re-test didn't scan that host, so the result is unknown. Never show these as fixed.
- Risk accepted (`accepted`) = muted + shield: an approved exception with an expiry date.
- Pair the summary with the net risk delta, set as a signed percentage in `kpi` ("−38%" in `status-ok`, "+12%" in `status-danger`).
