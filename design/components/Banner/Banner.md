---
category: Feedback
---
# Banner

An inline, persistent message at the top of a view or inside a card.

**Provide:** `tone` (`info` | `privacy` | `warn` | `danger`), `title`, optional `children` (one sentence), `action` (one small Button), `onClose`.

- `privacy` is the zero-trust notice shown on first load. It is dismissible, and never alarming.
- Use `warn` for data-quality issues (e.g. "12 rows had no host and were skipped") and `danger` only when results are wrong or incomplete.
- Show one banner at a time; use `Toast` for transient confirmations.
