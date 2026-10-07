---
category: Governance
---
# TeamPicker

Assigns a finding to one of the five teams with a RACI role, in the finding drawer and bulk-assign dialog.

**Provide:** optional `team`, `role` (`R` | `A` | `C` | `I`, default `R`), `onChange(team, role)`, `readOnly` (Security Auditor).

- Teams keep fixed colors everywhere (legends, the RACI matrix): Server Team `chart-1`, DevOps / Cloud `chart-2`, Database DBAs `chart-3`, SecOps `chart-4`, Application Dev `chart-5`.
- Each change writes an `ASSIGN` audit entry. In read-only mode, the controls say why.
