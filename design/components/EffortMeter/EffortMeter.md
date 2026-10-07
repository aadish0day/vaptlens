---
category: Workflow
---
# EffortMeter

A 1–10 remediation effort gauge for the Prioritization Matrix triage list.

**Provide:** `value` (1.0–10.0).

- Ten segments, with the value in mono and a word label. Below 6 is Low effort (`status-ok`); 6 and above is High effort (`status-warn`), matching the matrix split.
- Typical scores: config headers and registry tweaks ≈ 2–3; OS migration or re-architecture ≈ 7–8.
