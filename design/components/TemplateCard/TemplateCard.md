---
category: Dashboard
---
# TemplateCard

A tile in the Template Gallery (17 security templates) that adds a pre-configured widget to the canvas.

**Provide:** `title`, `description` (what it answers), `chart` (`bar` | `donut` | `line` | `heatmap`, for the thumbnail), optional `chartLabel`, `locked` + `lockReason`, `onAdd`.

- Locked templates (Trend Over Time with fewer than 2 dated scan batches) are `aria-disabled` with a lock icon and a tooltip giving the reason. They are never hidden.
- The gallery is a 3-column grid in a `Modal`, or 2 columns below `bp-md`.
