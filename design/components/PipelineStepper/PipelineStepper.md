---
category: Workflow
---
# PipelineStepper

The 5-stage patch pipeline header on the Remediation Board: Unassigned → Assigned → In Progress → Pending Verification → Resolved.

**Provide:** `counts` (five numbers in stage order), optional `current` (index of the stage being filtered to).

- Each stage shows its count in 20px tabular figures. The filtered stage takes `lens` and `lens-soft`; Resolved always carries the `status-ok` top rule.
- Clicking a stage filters the board (the app wires `onClick` on the list items).
