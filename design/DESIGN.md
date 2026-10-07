VAPTLens is a zero-trust, client-side vulnerability analytics workbench. The interface is a SOC command console: near-black surfaces, a left rail, a live status strip, mono panel headers, and one amber signal colour kept to the chrome. Inside the data, selection is monochrome, so severity is the only colour you see. Dark is the default theme; light is for daytime and printed reports; `cvd` and `hc` are the accessible themes.

## Principles

- **Severity owns color.** `sev-critical` … `sev-info` are used only for severity. Any other categorical dimension (tool, team, subnet, scan batch) takes `chart-1` … `chart-6`.
- **Signal is chrome, lens is selection.** `signal` (amber) marks the console itself: logo, live LED, active rail item, primary button, focus ring. It never appears inside charts, tables or badges. `lens` (near-white on dark, near-black on light) marks what's selected or clickable in the data.
- **Density with air.** A 4px grid, 13px table text (`body-sm`), 36px rows (`row-height`). Cards separate with `space-3` gutters and a `border` hairline, not heavy shadows.
- **Numbers are the content.** KPIs in `kpi`; IDs, IPs, ports and CVEs in `mono`. Use tabular figures wherever numbers stack.
- **Never color alone.** Every severity carries its word or its shape marker (◆ Critical, ▲ High, ● Medium, ▼ Low, ○ Info). Every SLA, diff and threat state carries a word and an icon.
- **Private by design.** Copy and UI never imply upload or cloud processing. Say "in your browser", "stays on this machine".

## Content & voice

- Plain, precise, operator-to-operator. Write "you" for the user; the product never says "I" or "we".
- Sentence case for titles, buttons and tabs ("Findings by severity", "Raise ticket"). Uppercase only in the `label` eyebrow style.
- Lead buttons with verbs: "Upload scan", "Export PDF", "Dispatch tickets", "Remediate all".
- Keep the security vocabulary exact: CISA KEV, Zero-day, EOL, CVSS, SLA Breached, Crown Jewel, Quick Wins, Verified fixed. Keep IDs verbatim: `CVE-2021-41773`, `SEC-0142`, `10.100.1.25:445/tcp`.
- Empty states are one factual line: "No findings match the current filters." No illustrations, no emoji.
- Restricted-action tooltips name the role and the reason: "Security Auditors have read-only access."
- Errors say what broke and where: "Couldn't parse row 88: unbalanced quote in Description."

## Themes

- Set `data-theme` on `<html>`: `dark` (default), `light`, `cvd` (colour-blind safe), `hc` (high contrast), or one of the thirteen palette themes below. Persist the choice as `vaptlens-theme`.
- **Palette themes** inherit every token from a base (`dark` or `light`) and restyle only the neutrals, the chrome `signal`, the heat ramp and a few chart colours. The severity ramp stays the base's, so risk reads the same everywhere:
  - `midnight` (dark): deep navy grounds, periwinkle signal `#8fb0ff`.
  - `matrix` (dark): phosphor-green on near-black, signal `#39e08f`.
  - `neon` (dark): violet-black, lime signal `#bbf351`, cyan `chart-1`.
  - `teal` (dark): fintech slate `#0f171e`, deep-teal signal `#2ec4b6`.
  - `paper` (light): warm ivory `#f4efe4`, ink-red signal `#a3321c`.
  - `enterprise` (light): cool blue-grey `#eef2f7`, royal-blue signal `#1d4ed8`.
  - `dramatic` (dark): zinc black `#09090b`, violet signal `#a78bfa`.
  - `graphite` (dark): neutral graphite `#111111`, ocean-blue signal `#3fa7e8`.
  - `arcade` (dark): indigo night `#0c0a24`, arcade-yellow signal `#ffda14`.
  - `terracotta` (light): warm sand `#f6efe6`, fired-clay signal `#a9532b`.
  - `stitch` (light): bone `#edeade`, pine signal `#0b5c55`.
  - `material` (light): lavender tonal surfaces `#f7f2fa`, violet signal `#6442d6`.
  - `vintage` (light): desktop-era silver `#c3c3c3`, navy `lens` `#000080`, teal signal `#006666`.
- **`cvd`** keeps the dark surfaces and remaps the risk hues to an Okabe–Ito-based set. Critical becomes magenta and sits clearly darker than High (1.8:1 between them). `status-ok` moves to blue, so Met/Breached is never green-vs-red.
- **`hc`** uses a black ground. Every text token is at least 7:1 on `canvas`, `surface-100` and `surface-200`, and `border` holds 3:1, so surfaces are set apart by lines, not shade.
- In every theme, text tokens hold at least 4.5:1 (7:1 in `hc`) on the grounds their notes name, and each `sev-*`/`status-*` color holds that on its own `-soft` ground.

## Color

- Grounds: `canvas` behind everything; `surface-100` for cards, tables, nav and drawers; `surface-200` for hover, table headers, inputs and drawer footers; `surface-300` for pressed and selected rows and skeletons. `tooltip-bg` for tooltips; `scrim` behind drawers and modals.
- Text: `ink` for primary, `ink-muted` for labels and axes, `ink-subtle` for timestamps and placeholders.
- Lines: `border` for hairlines (decorative); `border-strong` for input, checkbox and control outlines (3:1).
- Signal: `signal` fills primary buttons (text `on-signal`), marks the active rail item on `signal-soft`, lights the status LED and colours the logo. Focus rings use `focus-ring` (amber).
- Selection: `lens` for links, checked boxes, on-toggles, the selected chart mark and tab underlines; `lens-soft` grounds active chips, on-toggles, the selected quadrant and the current pipeline stage. Text on `lens` is `on-lens`.
- Severity: `sev-*` for markers, bars and heatmap cells, and as text on `sev-*-soft`. Order is always Critical → High → Medium → Low → Info. Low is cyan so it never reads as the brand blue.
- Status: `status-ok` (Met, Resolved, Verified fixed, ≥80% compliance), `status-warn` (at risk ≤ 7 days, 50–79%, Persistent), `status-danger` (Breached, New risk, <50%). Each has a `-soft` ground.
- Threat intel: `threat-kev` (critical hue, flame icon), `threat-ransomware` (high hue, skull icon), `threat-zeroday` (its own violet, zap icon).

## Charts

- Categorical series: `chart-1` … `chart-6` in order; group anything past six into "Other" in `chart-6`. Severity series use `sev-*` and the shape markers in legends.
- Scaffolding: gridlines `chart-grid` (horizontal only), tick text and legends `chart-axis` at 11–12px, no axis lines, no chart borders. Bars are ≤ 48px wide with 3px corners; the histogram gap is 4%.
- Sequential density (subnet × month, aging, anything that isn't severity): `heat-0` … `heat-5`. Severity heatmaps use the severity color at opacity `opacity-heat-min` + 0.74 × ratio, and cells above 55% switch their count to `canvas` color.
- Cross-filter: the clicked mark gets a 2px `chart-selected` outline and the rest drop to `opacity-dimmed`. Clicking again clears it.
- Tooltips: `tooltip-bg`, `shadow-overlay`, label in `caption`, values in `mono-sm`.
- Donuts: at most 6 slices, inner radius 58%, total in the center. For more than 6 parts, use bars.

## Type

- Three cuts of one superfamily. **IBM Plex Sans Condensed** (500–700) for display: view titles, KPI and threat-index numbers, drawer titles. **IBM Plex Sans** (variable) for all running UI text. **IBM Plex Mono** (400–600) for panel headers, labels, hosts, IDs and code.
- Scale: `kpi` 36/40 condensed · `title-lg` 28/32 condensed · `title` 18/24 condensed · `body` 14/22 · `body-sm` 13/20 (default) · `body-strong` 13/20 500 · `caption` 12/16 · `card-title` mono 11/16 +0.08em uppercase · `label` mono 10.5/14 +0.1em uppercase · `mono` 13/20 · `mono-sm` 12/16 · `code` 12.5/20.
- Numbers: tabular figures everywhere digits stack. Mono text turns on slashed zero (`"zero"`), so `10.100.0.10` never reads as O.
- Weights: 400 body, 500 emphasis, 600 headers and numbers. Never below 10.5px, and only the uppercase mono labels go that small.

## Space, shape, elevation

- A 4pt grid: `space-0` 0 · `space-0.5` 2 · `space-1` 4 · `space-1.5` 6 · `space-2` 8 · `space-2.5` 10 · `space-3` 12 · `space-4` 16 · `space-5` 20 · `space-6` 24 · `space-7` 28 · `space-8` 32 · `space-10` 40 · `space-12` 48 · `space-16` 64 · `space-20` 80. Half steps are for dense data UI only; layout gaps use whole steps.
- Rhythm: panel padding `space-5` (header and body share it, so content aligns under the title), panel gutter `space-4`, section gap `space-6`, view side padding `space-8` (`space-4` on phones).
- Radii nest (inner = outer − padding): `radius-overlay` (`radius-xl` 14) on modals, drawers and popovers; `radius-card` (`radius-lg` 10) on panels, tiles and table wrappers; `radius-control` (`radius-md` 6) on buttons, inputs, menu items and rail items; `radius-badge` (`radius-sm` 4) on badges, chips, checkboxes and kbd keys; `radius-xs` 2 on chart bars, progress fills and tiny marks; `radius-full` on pills, dots, meters and toggles. `radius-2xl` 20 is for large feature surfaces only. Never put a larger radius inside a smaller one.
- Elevation is five steps: `shadow-xs` (pressed, inset tracks) · `shadow-sm` (resting cards; alias `shadow-card`) · `shadow-md` (hover, dragged, scrolled sticky; alias `shadow-raised`) · `shadow-lg` (menus, popovers, toasts, tooltips; alias `shadow-popover`) · `shadow-xl` (drawers, modals; alias `shadow-overlay`). Dark themes pair a 1px top highlight with layered negative-spread drops; light themes use cool-tinted soft layers; `hc` swaps shadows for solid white outlines. `shadow-focus` is the soft halo on focused inputs; `ring-inset` and `ring-signal` draw hairlines without moving layout.
- Layers (z-index, spaced by 100 so local +1…+99 never crosses a layer): `z-grid` 1 · `z-raised` 2 · `z-sticky` 100 · `z-drag` 150 · `z-header` 200 · `z-dropdown` 300 · `z-drawer` 400 · `z-modal` 500 · `z-popover` 600 · `z-toast` 700 · `z-tooltip` 800 · `z-skip` 900. Never write a raw z-index above 9.
- Opacity: state layers `opacity-hover` 0.06 · `opacity-selected` 0.10 · `opacity-pressed` 0.14; content `opacity-dimmed` 0.4 · `opacity-disabled` 0.45 · `opacity-scrim` 0.55 · `opacity-muted` 0.72 · `opacity-strong` 0.88. Text never goes below 0.4.
- Press: buttons move down 1px and scale to 0.985 for `duration-instant`. Hover lifts and presses are switched off under reduced motion.

## Density & layout

- Rows: `row-height-compact` 28 · `row-height` 36 (default) · `row-height-comfortable` 44, switched by `data-density` on the table or canvas root; touch screens use comfortable automatically. Card padding follows: `space-3` / `space-4` / `space-5`.
- Controls: `control-xs` 24 · `control-sm` 28 · `control-md` 32 (default) · `control-lg` 40 · `control-xl` 48; every control reaches `touch-min` 44 on coarse pointers. Icons `icon-sm` 14 · `icon-md` 16 · `icon-lg` 20. Nav `nav-height` 48, rail `rail-width` 64 / `sidebar-width` 240. Drawer `drawer-width` 480 / `drawer-width-wide` 820. Modal `modal-width-sm` 420 · `modal-width` 640 · `modal-width-lg` 880. Content column `content-max` 1600; running text `measure` 68ch.
- Breakpoints: `bp-xs` 360 · `bp-sm` 480 · `bp-md` 768 · `bp-lg` 1024 · `bp-xl` 1280 · `bp-2xl` 1600. Mobile-first; down-only rules use `max-width: bp − 1px` (479, 767, 1023, 1279).
- Below `bp-md`: the dashboard grid stacks to one column in its saved order, the nav tabs scroll sideways, drawers and modals go full screen, the slicer panel opens as a sheet from a Filters button, and the table keeps Severity, Finding and Host while the other columns move into the expanded row.
- `bp-md`–`bp-lg`: two-column grids, rail as a scrolling top bar, slicer as an overlay sheet. `bp-lg`+: side rail, the slicer docks left at 280px. `bp-2xl`+: content stops at `content-max` with `space-10` side padding.

## Interaction & motion

- Focus: every focusable control shows a 2px solid `focus-ring` outline at 2px offset. It holds 5.5:1 or more on all surfaces in every theme.
- Hover lifts grounds one step (`surface-100` → `surface-200`); selection uses `lens` and `lens-soft`.
- Layout: a 232px left rail (views numbered 1–8, which are also keyboard shortcuts), a 40px status strip (LOCAL LED, scan count, active, breached, threat index, reference date), then the view. Below `bp-md` the rail becomes a scrolling top bar.
- Permission gating uses `aria-disabled` plus a tooltip (`Button restricted`), never native `disabled`. Native `disabled` (at `opacity-disabled`) is only for impossible actions, such as moving a card past the board's last column.
- Motion is functional only:
  - Tokens: `duration-instant` 80 · `duration-fast` 120 · `duration-base` 180 · `duration-slow` 280; `ease-standard` cubic-bezier(.2,0,0,1), `ease-out` cubic-bezier(.16,1,.3,1) for entering, `ease-in` for leaving.
  - `duration-fast` for color and opacity changes.
  - `duration-slow` + `ease-out` for a modal rising 8px or a drawer sliding 24px; menus and popovers pop in over `duration-base`; the scrim fades and blurs 2px.
  - 1.4s skeleton pulse and the Network Map's link-dash pulse.
  - No bounce and no parallax. Everything drops to instant under `prefers-reduced-motion`.
- Loading: show `Skeleton` after 150ms of work, nothing before. Toasts auto-dismiss after 5s, except errors.

## Iconography

- Lucide, 2px stroke, `currentColor`, at 16px (12px in tags and badges, 14px in small controls). The Icons group has the view and threat mapping.
- The logo is still a placeholder reticle (Logos group). The Logo options group holds four candidate marks to choose from.

## Reports

- The Executive Report prints on white. The cover band and section bars use `report-slate` (default), `report-navy` or `report-crimson`, with `on-report` text. Section titles are underlined in `report-rule`. The body uses the light theme's values whatever the app theme, and the severity ramp is unchanged.

## Components by view

- **Everywhere:** `NavTabs`, `Logo`, `Button`, `DropdownMenu` (Export), `RoleSwitcher`, `Tooltip`, `Toast`, `Banner`, `EmptyState`, `Skeleton`, `Tabs`.
- **Ingestion:** `FileDropzone`, `ScannerBadge`; unknown CSVs open the Column Mapper, a `Modal` of `ColumnMapRow`s.
- **Dashboard:** `WidgetCard`, `KpiCard`, `SlaBreachCard`, the chart engines (`BarChart`, `StackedBarChart`, `DonutChart`, `LineChart`, `RadarChart`, `Treemap`, `ScatterChart`, `Heatmap`, `Sparkline`), `RiskMeter`, `FilterChip`, and the pinned breach row of `BreachList` + `ExposureBars`. The slicer uses `Input`, `Toggle`, `Checkbox`, `MultiSelect` and `SegmentedControl`. The Template Gallery is a `Modal` of `TemplateCard`s.
- **Asset Inventory:** `AssetRow`, `TierBadge`, `RiskMeter`, `ExposureRegistry`, and a `Drawer` for host triage.
- **SLA & RACI:** `SlaProjectionTable`, `SlaTrend`, `SlaPill`, `StackedBarChart` (aging), `LineChart` (threat trajectories), `RaciMatrix`, `TeamPicker`, `KpiCard`, `AuditLogRow`.
- **Prioritization Matrix:** `QuadrantTile` ×4, `EffortMeter` in the triage list.
- **Remediation Board:** `PipelineStepper`, `KanbanCard`, and `AuditLogRow` in a `Drawer`.
- **Network Map:** `TopologyMap`, and a `Drawer` for node intelligence.
- **Re-Test Verification:** `RiskDelta`, `DiffBadge`, `Tabs`, `VulnTable`.
- **Findings:** `VulnTable` with `FindingDetail`, `TeamPicker`, `CodeSnippet`, `SeverityMarker`.
- **Executive Report:** `ReportHeader`.
- **Team colors:** Server Team `chart-1`, DevOps / Cloud `chart-2`, Database DBAs `chart-3`, SecOps `chart-4`, Application Dev `chart-5`. They are fixed everywhere.
- The full product spec, the feature breakdown, and a map of each item to these components follow as their own sections. For using the tokens in code, see the Tailwind section.
