---
category: Data display
---
# VulnTable

The vulnerability data grid: sortable columns, the "Group noise" merged badge, threat tags inline, and an expandable detail row.

**Provide:** `rows` (`{id, severity, name, host, cvss, lifecycle, tool, merged?, tags?, description?, cves?, team?, ticket?, sla?, snippet?, readOnly?}`), optional `density` (`compact` | `comfortable`), `renderDetail(row)` (replace the default `FindingDetail`), `defaultExpanded` (a row id), `onClearFilters`, `limit` (show the first N rows after sorting; ties break on `row.risk`).

**Multi-select (optional):** pass `selectable`, `selected` (array of row ids) and `onSelectChange(ids)`. A checkbox column appears; the header box selects or clears every row shown (indeterminate when some are). Selected rows use `signal-soft`. Clicking a checkbox never expands the row. Shift-click selects or clears the whole range since the last box clicked.

**Columns and sort (optional):** `extraCols` adds user-chosen columns between Status and Tool (`{key, label, num?, mono?, muted?, w?}`; a cell shows `row[key + "Txt"]` when present, else `row[key]`; numeric columns sort high-first with blanks last). Pass `sort` (`{key, dir}`) with `onSortChange(next)` to control sorting so the app can remember it.

- Default sort is severity (Critical first); click a header to sort, and click again to reverse. `aria-sort` is set.
- Hosts, CVSS and IDs are in `mono`; CVSS right-aligned with one decimal.
- `merged > 1` shows the "Nx merged" badge when Group noise is on.
- The detail row holds the description, NVD-linked CVEs, a remediation `CodeSnippet`, owner, ticket and SLA. Raise ticket is `restricted` for the Security Auditor role.
- Row height follows density: `row-height-compact` 28, `row-height` 36, `row-height-comfortable` 40. The header is sticky.

## Lifecycle values

`lifecycle` renders as coloured text: New (`lens`), Open (`ink`), Reopened (`status-danger`, semibold), Not re-scanned (`status-warn`), Fixed (`status-ok`), Accepted and False positive (`ink-subtle`). Any other value falls back to `ink`.
