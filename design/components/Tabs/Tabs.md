---
category: Navigation
---
# Tabs

Content tabs inside a view or drawer: host drawer sections, Re-test result groups, Report sections.

**Provide:** `tabs` (`[{label, count?}]`), `value` + `onChange` (or `defaultValue`).

- Use `NavTabs` for the 8 top-level views and `SegmentedControl` for filters. These are for switching the content of one panel.
- Counts use a mono pill that turns `lens-soft` on the active tab.
