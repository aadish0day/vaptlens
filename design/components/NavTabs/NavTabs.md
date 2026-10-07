---
category: Navigation
---
# NavTabs

The top navigation between the eight views: Dashboard, Asset Inventory, SLA & RACI, Prioritization Matrix, Remediation Board, Network Map, Re-Test Verification, Executive Report.

**Provide:** optional `tabs` (defaults to the eight views, in that order), `active`, `onChange`.

- The active tab is `ink` at weight 600 with a 2px `lens` underline; the rest are `ink-muted`.
- Sits in a `nav-height` bar on `surface-100`, `Logo` to its left; scrolls horizontally below 768px rather than wrapping.
- Keep the view order; don't rename views per screen.
