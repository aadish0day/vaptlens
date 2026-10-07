---
category: Workflow
---
# KanbanCard

A finding card on the Remediation Board (To Do, In Progress, In Review, Remediated).

**Provide:** `severity`, `title` (finding name), `host` (with port: `10.100.2.12:3306`), optional `ticket` (`SEC-0142`), `tags` (ThreatTag kinds), `team` (owner team), `onBack` / `onForward` (omit one to disable that chevron at the board's ends).

- Cards sort Critical → Info, then by risk score, within a column.
- Moving a card writes a `PATCH` audit entry. For the Security Auditor role, pass no move handlers.
- Titles wrap to two lines at most; the host never wraps.
