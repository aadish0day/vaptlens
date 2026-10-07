# Spec coverage

How each part of the product spec and the feature breakdown maps to this system. Build new screens from these pieces before inventing new ones.

## Ingestion (spec §2)

| Spec | Use |
|---|---|
| Drop a CSV, parse with PapaParse | `FileDropzone` (idle, drag, parsing, error) |
| `detectTool` (≥ 2 header matches) | `ScannerBadge` showing `matched/total` |
| Column Mapper, 12 canonical fields, fuzzy guess | `Modal` + `ColumnMapRow` per field; saved presets as `FilterChip`-style pills |
| Data-quality issues (skipped rows) | `Banner tone="warn"` |
| Severity normalisation ("crit", "moderate", "none", Qualys 1–5, CVSS fallback) | No UI of its own: every finding shows the normalised level via `SeverityBadge`. `FindingDetail` may show the scanner's raw value in `mono-sm` `ink-muted` beside it |
| Nuclei flattened JSONL-to-CSV | Same `FileDropzone` flow; the hint names Nuclei |

## Slicing & cross-filtering (spec §3)

| Spec | Use |
|---|---|
| Free-text search | `Input` |
| Quick toggles: KEV, Ransomware, 0-Day, EOL, > 6 months | `Toggle` with icon and count |
| Severity / Tool / Host / Port lists | `Checkbox` lists, `MultiSelect` for long ones |
| Date presets | `SegmentedControl` |
| Filter Chips bar | `FilterChip` (severity chips carry the severity edge) + ghost "Clear all" |
| Single-select cross-filter from any chart | `chart-selected` outline + `opacity-dimmed` on every chart component |

## Template Gallery (breakdown, Tab 1)

Each template is a `TemplateCard` whose thumbnail matches its chart.

| Template | Component |
|---|---|
| Severity Distribution | `DonutChart` (severity) |
| SLA Compliance | `SlaTrend`, or `KpiCard tone="ok"` |
| Vulnerability Lifecycle | `StackedBarChart` (New / Open / Fixed) |
| Top 10 Hosts | `RiskMeter` ×10, or `BarChart` |
| Recurring Findings | `BarChart` (distinct scan batches per finding) |
| Port Distribution | `BarChart` (`chart-*`) |
| CVSS Histogram | `BarChart` with CVSS buckets, 4% gap |
| Tool Comparison | `StackedBarChart` (tool × severity) |
| Trend Over Time | `LineChart`, locked below 2 dated scans |
| Severity Heatmap | `Heatmap` |
| Risk Posture Radar | `RadarChart` |
| Treemap | `Treemap` |
| Scatter | `ScatterChart` |
| OWASP Compliance | `Treemap` or `BarChart` by `owaspCategory` |
| Aging Buckets | `StackedBarChart` on `heat-2…5` |
| Subnet Density | `Heatmap` pattern on the `heat-*` ramp (subnet × month) |

## Risk & threat intel (spec §4)

| Spec | Use |
|---|---|
| Five severities | `sev-*` tokens, `SeverityBadge`, `SeverityMarker` shapes |
| Exploitable, KEV, Zero-day, Ransomware, EOL, SLA breached | `ThreatTag`, `threat-*` tokens |
| Finding risk score (max ≈ 194) | Mono number; `BreachList` shows it in `sev-critical` |
| Host risk score | `RiskMeter`, `AssetRow` score column |

## Views (spec §5)

| View | Components |
|---|---|
| 5.1 Dashboard | `WidgetCard` grid; pinned `BreachList` + `ExposureBars`; `KpiCard`, `SlaBreachCard`; `TemplateCard` gallery in a `Modal`; Widget Builder = `Modal` (960px) with `SegmentedControl` / `MultiSelect` controls and a live chart preview |
| 5.2 Asset Inventory | `AssetRow`, `TierBadge`, `RiskMeter` leaderboard (top 8), `ExposureRegistry`, host `Drawer` (`?host=`) |
| 5.3 SLA & RACI | `SlaProjectionTable` (C.H.I.), `SlaTrend`, `RaciMatrix`, `TeamPicker`, "Dispatch tickets" primary `Button`, `StackedBarChart` (aging), `LineChart` (threat trajectories) |
| 5.4 Prioritization Matrix | `QuadrantTile` ×4, `EffortMeter` in the triage list |
| 5.5 Remediation Board | `PipelineStepper`, `KanbanCard` columns (To Do, In Progress, In Review, Remediated), audit `Drawer` of `AuditLogRow` |
| 5.6 Network Map | `TopologyMap` + node `Drawer` |
| 5.7 Re-Test Verification | `RiskDelta`, `DiffBadge`, `Tabs` (Fixed / New / Persistent), `VulnTable`, Export CSV via `DropdownMenu` |
| 5.8 Executive Report | `ReportHeader` (slate / navy / crimson), report sections reuse the charts and tables on white paper |

## Chart engines (spec §6)

| Spec widget | Component |
|---|---|
| BarChartWidget | `BarChart`; `StackedBarChart` for stacked mode |
| DonutChartWidget | `DonutChart` |
| AreaChartWidget | `LineChart area` |
| LineChartWidget | `LineChart` |
| RadarChartWidget | `RadarChart` |
| TreemapWidget | `Treemap` |
| HeatmapWidget | `Heatmap` |
| ScatterChartWidget | `ScatterChart` |
| HistogramWidget | `BarChart` with CVSS buckets, 4% gap |
| KpiCardWidget | `KpiCard` |
| SlaBreachKpiWidget | `SlaBreachCard` |
| HostRiskWidget | `RiskMeter` ×5 in a `WidgetCard` |
| TopCriticalBreachWidget / BreachBreakdownWidget | `BreachList` / `ExposureBars` |

## Table, snippets, RBAC, state (spec §7–10)

| Spec | Use |
|---|---|
| VulnTable, sorting, Group noise, expandable details | `VulnTable` + `FindingDetail`, "Nx merged" badge |
| Team & RACI selector, Raise ticket ("Raise Jira/GitHub Ticket" in the breakdown) | `TeamPicker`, `Button icon="ticket"`. The label stays "Raise ticket"; name the tracker in the tooltip once one is connected |
| Remediation patch box | `CodeSnippet` (platform tabs) |
| Remediate All (RBAC-gated) | `Button variant="danger"` with `restricted` for Auditors |
| Role hierarchy, 2FA | `RoleSwitcher` |
| RestrictedButton (`aria-disabled` + tooltip) | `Button restricted` |
| Audit log (ASSIGN / TICKET / PATCH) | `AuditLogRow` |
| Export PNG / PDF / CSV | `DropdownMenu` + `Toast` on completion |
| `vaptlens-theme` | Now takes `dark`, `light`, `cvd` or `hc` |

## Open points in the spec

- **Date preset "30 Weeks"** (§3.3): very likely "30 Days". This system uses "30 days" in `SegmentedControl`, so confirm before coding.
- **Report sections** (§5.8): says "9 structured audit sections" but lists 10. `ReportHeader` supports any count, but the spec needs one number.
- **Theme key** (§10.2): lists only `light` / `dark`. It now needs `cvd` and `hc` too.
- **§12 Project File Tree** is in the table of contents but has no content yet.
- **Template count** (breakdown, Tab 1): says 17 templates but names 16. One is missing from the list.
- **Security Auditor wording** (breakdown §6): "all mutating buttons disabled". In this system they are `aria-disabled` with a reason tooltip (`Button restricted`), never natively disabled, which matches the RestrictedButton rule in the same section.
- **Nuclei** (breakdown §1.1): the input is flattened JSONL-to-CSV. Decide whether raw `.jsonl` should also be accepted by the drop zone.
