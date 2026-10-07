---
category: Governance
---
# SlaProjectionTable

The C.H.I. (Critical / High / Important) SLA projection table on the SLA & RACI view.

**Provide:** `rows` (`[{severity, active, breached, atRisk, avgDays}]`); a negative `avgDays` means the average finding is already past due.

- Breached counts are in `status-danger`, at-risk (≤ 7 days left) in `status-warn`, and zeros stay `ink`. Numbers are mono and right-aligned.
- Always list Critical → Info. Show Info only if it has active findings.
