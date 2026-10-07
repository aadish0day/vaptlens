---
category: Workflow
---
# AuditLogRow

One entry in the governance audit trail drawer.

**Provide:** `action` (`ASSIGN` | `TICKET` | `PATCH`), `detail` (one sentence naming the finding and change), `role` (the actor's role), `at` (ISO timestamp) and optional `time` (display form).

- Newest first, capped at 200 entries. Timestamps display in the user's local time as `YYYY-MM-DD HH:mm`, in mono.
