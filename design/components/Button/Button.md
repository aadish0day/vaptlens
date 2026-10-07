---
category: Actions
---
# Button

Buttons for actions; `restricted` renders the RBAC-gated state instead of HTML `disabled`.

**Provide:** `children` (label, sentence case, verb first: "Export PDF", "Raise ticket"), `variant` (`primary` | `secondary` | `ghost` | `danger`), `size` (`sm` | `md` | `lg`), optional `icon` (a bundled icon name), `onClick`. For role gating pass `restricted` and `restrictedReason`.

- One `primary` per view region (Upload scan, Dispatch tickets). Everything else `secondary`; toolbar and card-header actions `ghost` at `sm`.
- `danger` only for destructive or bulk-irreversible actions ("Remediate all").
- **Restricted:** sets `aria-disabled="true"`, swallows clicks and shows a tooltip with the reason, e.g. "Security Auditors have read-only access." Never use native `disabled` for permission gating, since it suppresses the tooltip.
- Focus: 2px `focus-ring` outline, 2px offset.
