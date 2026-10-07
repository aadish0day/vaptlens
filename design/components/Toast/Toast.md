---
category: Feedback
---
# Toast

Transient confirmation for exports, bulk actions and parse errors, stacked bottom-right at `z-toast`.

**Provide:** `title`, optional `message`, `tone` (`ok` | `danger` | `info`), `onClose`.

- Auto-dismiss `ok` and `info` after 5s; `danger` stays until closed and uses `role="alert"`.
- Examples: "PDF exported", "212 findings imported from Nessus", "Couldn't parse row 88: unbalanced quote".
