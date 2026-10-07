# VAPTLens Motion & Animation Audit

> **Scope**: Audit of motion and micro-interaction coverage across the VAPTLens component library (`src/ui/`) and application views (`src/app/`), evaluated against the reference implementations in [interior.dev](file:///tmp/interior/components/interior) (`/tmp/interior/components/interior/`).

---

## 1. Executive Summary

| Category                                  | Count   | Percentage | Status                                                                                 |
| :---------------------------------------- | :------ | :--------- | :------------------------------------------------------------------------------------- |
| **Total `src/ui/` Components**            | **120** | 100%       | Full library surface                                                                   |
| **Components WITH Motion / Animation**    | **28**  | **23.3%**  | Equipped with tuned spring physics, zero-jitter space reservations, or motion surfaces |
| **Components WITHOUT Motion / Animation** | **92**  | **76.7%**  | Broken down by priority below                                                          |
| **Interior.dev Reference Set**            | **54**  | —          | **24 ported/integrated**, **16 high-value candidates**, **14 N/A**                     |

---

## 2. Components WITH Motion / Animation (28)

These components utilize the shared motion vocabulary in [`src/ui/motion.ts`](file:///home/aadish/Documents/Github/vaptlens/src/ui/motion.ts) (`SURFACE`, `GLIDE`, `POP`, `HEIGHT`, `LEAVE`, `useReduced`):

| Component            | File Link                                                                                           | Motion Technique & Reference                                                                                  |
| :------------------- | :-------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Accordion**        | [`Accordion.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Accordion.tsx)               | `HEIGHT` spring open from 0 with internal padding clip (`accordion.tsx`)                                      |
| **Alert**            | [`Alert.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Alert.tsx)                       | Smooth height collapse & fade on dismiss (`collapsible-banner.tsx`)                                           |
| **Button**           | [`Button.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Button.tsx)                     | Zero-jitter loading state: reserves text dimensions while crossfading spinner (`loading-button.tsx`)          |
| **ContextMenu**      | [`ContextMenu.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ContextMenu.tsx)           | Anchored `SURFACE` spring popover with keyboard highlight glide (`context-menu.tsx`)                          |
| **CopyButton**       | [`CopyButton.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/CopyButton.tsx)             | `POP` checkmark morph and auto-revert timeout (`copy-button.tsx`)                                             |
| **Drawer**           | [`Drawer.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Drawer.tsx)                     | Right-edge sliding `SURFACE` spring with backdrop scrim fade (`drawer.tsx`)                                   |
| **DropdownMenu**     | [`DropdownMenu.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/DropdownMenu.tsx)         | Non-bouncing `SURFACE` spring entrance via `MenuSurface` (`dropdown.tsx`)                                     |
| **FieldMessage**     | [`FieldMessage.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/FieldMessage.tsx)         | Height/opacity reveal for validation errors (`inline-validation.tsx`)                                         |
| **HoldToConfirm**    | [`HoldToConfirm.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/HoldToConfirm.tsx)       | Step-fill hold progress, rollback on cancel, pointer drift tolerance, haptic feedback (`hold-to-confirm.tsx`) |
| **KpiCard**          | [`KpiCard.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/KpiCard.tsx)                   | Color flash on data update, rolling animated digits via `ValueRoll` (`value-flash.tsx`)                       |
| **MenuSurface**      | [`MenuSurface.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/MenuSurface.tsx)           | Shared surface animation foundation for popovers, menus, context menus                                        |
| **Modal**            | [`Modal.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Modal.tsx)                       | `SURFACE` spring scale/translate, pointer-down outside guard (`modal.tsx`)                                    |
| **NavTabs**          | [`NavTabs.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/NavTabs.tsx)                   | Gliding active indicator line (`GLIDE` spring via `layoutId`) across navigation items                         |
| **Pagination**       | [`Pagination.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Pagination.tsx)             | Gliding active thumb pill behind current page number (`pagination.tsx`)                                       |
| **PasswordInput**    | [`PasswordInput.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/PasswordInput.tsx)       | Smoothly expanding/contracting strength bars (`password-strength.tsx`)                                        |
| **PipelineStepper**  | [`PipelineStepper.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/PipelineStepper.tsx)   | Rolling digit counts (`ValueRoll`) as items traverse pipeline stages (`task-steps.tsx`)                       |
| **Popover**          | [`Popover.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Popover.tsx)                   | Spring entrance/exit via `MenuSurface` (`popover.tsx`)                                                        |
| **ProgressBar**      | [`ProgressBar.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ProgressBar.tsx)           | Spring-interpolated fill bar with smooth progress transitions (`progress-bar.tsx`)                            |
| **SearchInput**      | [`SearchInput.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SearchInput.tsx)           | `POP` spring entrance/exit for the clear button (`expanding-search.tsx`)                                      |
| **SegmentedControl** | [`SegmentedControl.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SegmentedControl.tsx) | Gliding thumb pill (`GLIDE` spring via `layoutId`) + arrow key navigation (`segmented-control.tsx`)           |
| **Skeleton**         | [`Skeleton.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Skeleton.tsx)                 | Crossfade swap from skeleton placeholder to loaded content (`skeleton-swap.tsx`)                              |
| **Tabs**             | [`Tabs.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Tabs.tsx)                         | Gliding underline indicator (`GLIDE` spring via `layoutId`) + WAI-ARIA keys (`tabs.tsx`)                      |
| **TagInput**         | [`TagInput.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/TagInput.tsx)                 | `POP` chip entrance/exit, armed delete on backspace, duplicate tag flash (`tag-input.tsx`)                    |
| **Toast**            | [`Toast.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Toast.tsx)                       | Vertical spring entrance (`y: 12 → 0`) and swift `LEAVE` exit                                                 |
| **Tooltip**          | [`Tooltip.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Tooltip.tsx)                   | Shared tooltip group provider with instant switching (`tooltip-group.tsx`)                                    |
| **TreeView**         | [`TreeView.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/TreeView.tsx)                 | 90° rotating `POP` spring caret, smooth height expansion for branches (`tree-view.tsx`)                       |
| **TruncatedText**    | [`TruncatedText.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/TruncatedText.tsx)       | Spring height reveal for "Show more" expand/collapse (`show-more.tsx`)                                        |
| **VulnTable**        | [`VulnTable.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/VulnTable.tsx)               | Column sort header indicators, row entry layout transitions (`sortable-table.tsx`)                            |

---

## 3. Components WITHOUT Motion / Animation (92)

### Group A: High-Priority Interactive Candidates (16 components)

_These components have interactive states (toggles, transitions, popups, steps) that would benefit directly from interior.dev motion patterns._

| Component                | File Link                                                                                               | Recommended Motion / Interior Pattern                                                                   |
| :----------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------ |
| **Banner**               | [`Banner.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Banner.tsx)                         | Add collapsible height animation on dismiss (port from `Alert.tsx` / `collapsible-banner.tsx`)          |
| **Wizard**               | [`Wizard.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Wizard.tsx)                         | Directional sliding step transitions (`custom={direction}`, `x: dir * 20 → 0`, from `wizard-steps.tsx`) |
| **Slider**               | [`Slider.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Slider.tsx)                         | Detent magnetic pull snap, spring thumb movement, haptic vibration (`slider-detents.tsx`)               |
| **Avatar / AvatarGroup** | [`Avatar.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Avatar.tsx)                         | Stacked avatars entering/leaving with scale/spring (`presence-avatars.tsx`)                             |
| **NotificationCenter**   | [`NotificationCenter.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/NotificationCenter.tsx) | Notification item entrance/dismiss slide transitions (`live-activity.tsx`)                              |
| **FileUploadList**       | [`FileUploadList.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/FileUploadList.tsx)         | Smooth progress fill springs and file removal exit animations                                           |
| **InlineEdit**           | [`InlineEdit.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/InlineEdit.tsx)                 | Read-to-input spring transition, save checkmark pop animation                                           |
| **BottomSheet**          | [`BottomSheet.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/BottomSheet.tsx)               | Upward spring entrance (`y: "100%" → 0`) with drag-to-dismiss gesture                                   |
| **Combobox**             | [`Combobox.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Combobox.tsx)                     | Mount suggestion dropdown inside `MenuSurface` with gliding active row                                  |
| **Select**               | [`Select.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Select.tsx)                         | Mount options menu inside `MenuSurface` with smooth chevron rotation                                    |
| **MultiSelect**          | [`MultiSelect.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/MultiSelect.tsx)               | Selected chips enter with `POP` spring (like `TagInput`), popup uses `MenuSurface`                      |
| **DatePicker**           | [`DatePicker.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/DatePicker.tsx)                 | Month-to-month directional slide transition                                                             |
| **DateRangePicker**      | [`DateRangePicker.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/DateRangePicker.tsx)       | Preset pill gliding indicator + calendar popup entrance                                                 |
| **CountBadge**           | [`CountBadge.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/CountBadge.tsx)                 | Number increment spring pop scale (`new-items-pill.tsx`)                                                |
| **Toggle**               | [`Toggle.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Toggle.tsx)                         | Spring thumb glide on switch toggle instead of static CSS transform                                     |
| **Checkbox**             | [`Checkbox.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Checkbox.tsx)                     | SVG checkmark path draw spring on toggle                                                                |

---

### Group B: Data Visualizations & Charts (18 components)

_Analytical dashboards rendered with static SVG or CSS tokens. Generally static by design for instant responsiveness, but could adopt initial draw springs or hover micro-interactions._

| Component           | File Link                                                                                         | Current Implementation            |
| :------------------ | :------------------------------------------------------------------------------------------------ | :-------------------------------- |
| **BarChart**        | [`BarChart.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/BarChart.tsx)               | Static SVG bars                   |
| **LineChart**       | [`LineChart.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/LineChart.tsx)             | Static SVG paths                  |
| **StackedBarChart** | [`StackedBarChart.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/StackedBarChart.tsx) | Static SVG stacked segments       |
| **DonutChart**      | [`DonutChart.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/DonutChart.tsx)           | Static SVG circumference strokes  |
| **ScatterChart**    | [`ScatterChart.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ScatterChart.tsx)       | Static SVG coordinate points      |
| **RadarChart**      | [`RadarChart.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/RadarChart.tsx)           | Static SVG polygon                |
| **FunnelChart**     | [`FunnelChart.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/FunnelChart.tsx)         | Static SVG trapezoids             |
| **Treemap**         | [`Treemap.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Treemap.tsx)                 | Static nested rects               |
| **Heatmap**         | [`Heatmap.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Heatmap.tsx)                 | Static grid cells                 |
| **CalendarHeatmap** | [`CalendarHeatmap.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/CalendarHeatmap.tsx) | Static day cells                  |
| **BulletChart**     | [`BulletChart.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/BulletChart.tsx)         | Static target bars                |
| **Gauge**           | [`Gauge.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Gauge.tsx)                     | Static arc gauge                  |
| **RiskMeter**       | [`RiskMeter.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/RiskMeter.tsx)             | Static score dial                 |
| **EffortMeter**     | [`EffortMeter.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/EffortMeter.tsx)         | Static segment bar                |
| **EpssMeter**       | [`EpssMeter.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/EpssMeter.tsx)             | Static percentile gauge           |
| **ExposureBars**    | [`ExposureBars.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ExposureBars.tsx)       | Static horizontal bar comparisons |
| **SeverityBar**     | [`SeverityBar.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SeverityBar.tsx)         | Static severity breakdown bar     |
| **Sparkline**       | [`Sparkline.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Sparkline.tsx)             | Static inline SVG polyline        |

---

### Group C: Domain Rows, Cards & Static Data Displays (29 components)

_Dense vulnerability management domain rows, records, and badges. Intentionally kept lightweight and static._

| Component              | File Link                                                                                               | Purpose                                  |
| :--------------------- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------- |
| **AssetRow**           | [`AssetRow.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/AssetRow.tsx)                     | Asset inventory table row                |
| **AuditLogRow**        | [`AuditLogRow.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/AuditLogRow.tsx)               | Immutable audit log item                 |
| **BreachList**         | [`BreachList.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/BreachList.tsx)                 | Overdue SLA list                         |
| **ColumnMapRow**       | [`ColumnMapRow.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ColumnMapRow.tsx)             | CSV column mapping row                   |
| **CveLink**            | [`CveLink.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/CveLink.tsx)                       | CVE link with KEV tag                    |
| **CvssVector**         | [`CvssVector.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/CvssVector.tsx)                 | CVSS vector metric parser display        |
| **DiffBadge**          | [`DiffBadge.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/DiffBadge.tsx)                   | Scan diff indicator (+/-)                |
| **DiffView**           | [`DiffView.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/DiffView.tsx)                     | Text line diff viewer                    |
| **ExposureRegistry**   | [`ExposureRegistry.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ExposureRegistry.tsx)     | Exposure record summary                  |
| **FindingDetail**      | [`FindingDetail.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/FindingDetail.tsx)           | Static finding detail view               |
| **JsonViewer**         | [`JsonViewer.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/JsonViewer.tsx)                 | Formatted JSON tree                      |
| **KanbanCard**         | [`KanbanCard.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/KanbanCard.tsx)                 | Remediation kanban board card            |
| **KeyValueList**       | [`KeyValueList.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/KeyValueList.tsx)             | Key-value attribute list                 |
| **QuadrantTile**       | [`QuadrantTile.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/QuadrantTile.tsx)             | SSVC matrix quadrant cell                |
| **RaciMatrix**         | [`RaciMatrix.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/RaciMatrix.tsx)                 | Responsibility assignment grid           |
| **RiskDelta**          | [`RiskDelta.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/RiskDelta.tsx)                   | Delta calculation badge                  |
| **ScannerBadge**       | [`ScannerBadge.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ScannerBadge.tsx)             | Scanner vendor badge (Nessus, Burp, ZAP) |
| **SeverityBadge**      | [`SeverityBadge.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SeverityBadge.tsx)           | Critical / High / Medium / Low badge     |
| **SeverityMarker**     | [`SeverityMarker.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SeverityMarker.tsx)         | Compact severity dot marker              |
| **SlaBreachCard**      | [`SlaBreachCard.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SlaBreachCard.tsx)           | Overdue breach incident card             |
| **SlaCountdown**       | [`SlaCountdown.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SlaCountdown.tsx)             | SLA days remaining counter               |
| **SlaPill**            | [`SlaPill.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SlaPill.tsx)                       | SLA status pill                          |
| **SlaProjectionTable** | [`SlaProjectionTable.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SlaProjectionTable.tsx) | SLA timeline projection table            |
| **SlaTrend**           | [`SlaTrend.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SlaTrend.tsx)                     | MTTR trend summary                       |
| **TemplateCard**       | [`TemplateCard.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/TemplateCard.tsx)             | Report template card                     |
| **ThreatTag**          | [`ThreatTag.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ThreatTag.tsx)                   | CISA KEV / OWASP threat tag              |
| **TierBadge**          | [`TierBadge.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/TierBadge.tsx)                   | Asset tier badge                         |
| **TopologyMap**        | [`TopologyMap.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/TopologyMap.tsx)               | Network topology canvas/svg              |
| **WidgetCard**         | [`WidgetCard.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/WidgetCard.tsx)                 | Dashboard widget frame                   |

---

### Group D: Primitives, Typography & Layout Containers (29 components)

_Foundational building blocks, basic inputs, and layout wrappers._

| Component            | File Link                                                                                           | Purpose                                     |
| :------------------- | :-------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| **ActivityTimeline** | [`ActivityTimeline.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ActivityTimeline.tsx) | Activity log list                           |
| **Breadcrumbs**      | [`Breadcrumbs.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Breadcrumbs.tsx)           | Hierarchical navigation trail               |
| **ButtonGroup**      | [`ButtonGroup.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ButtonGroup.tsx)           | Segmented button cluster                    |
| **ChartLegend**      | [`ChartLegend.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ChartLegend.tsx)           | Color legend for charts                     |
| **CodeSnippet**      | [`CodeSnippet.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/CodeSnippet.tsx)           | Preformatted code block with copy trigger   |
| **Divider**          | [`Divider.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Divider.tsx)                   | Horizontal rule divider                     |
| **EmptyState**       | [`EmptyState.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/EmptyState.tsx)             | Empty data placeholder view                 |
| **ExternalLink**     | [`ExternalLink.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ExternalLink.tsx)         | Safe `rel="noreferrer"` link                |
| **FileDropzone**     | [`FileDropzone.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/FileDropzone.tsx)         | Drag-and-drop file upload target            |
| **FilterChip**       | [`FilterChip.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/FilterChip.tsx)             | Removable filter pill                       |
| **Icon**             | [`Icon.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Icon.tsx)                         | Feather/Lucide SVG icon renderer            |
| **IconButton**       | [`IconButton.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/IconButton.tsx)             | Square icon-only action button              |
| **Illustration**     | [`Illustration.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Illustration.tsx)         | Thematic SVG vector illustrations           |
| **Input**            | [`Input.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Input.tsx)                       | Standard text input field                   |
| **Kbd**              | [`Kbd.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Kbd.tsx)                           | Keyboard shortcut keycaps                   |
| **Logo**             | [`Logo.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Logo.tsx)                         | VAPTLens wordmark & logo mark               |
| **NumberInput**      | [`NumberInput.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/NumberInput.tsx)           | Numeric stepper input                       |
| **QueryBuilder**     | [`QueryBuilder.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/QueryBuilder.tsx)         | Visual filter expression builder            |
| **RadioGroup**       | [`RadioGroup.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/RadioGroup.tsx)             | Native radio inputs                         |
| **ReportHeader**     | [`ReportHeader.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ReportHeader.tsx)         | Document header metadata                    |
| **ResizablePanels**  | [`ResizablePanels.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/ResizablePanels.tsx)   | Split screen drag handle                    |
| **RoleSwitcher**     | [`RoleSwitcher.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/RoleSwitcher.tsx)         | User role selector (Admin / Lead / Auditor) |
| **Spinner**          | [`Spinner.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Spinner.tsx)                   | CSS rotating spinner                        |
| **SplitButton**      | [`SplitButton.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/SplitButton.tsx)           | Primary action + dropdown chevron           |
| **StateView**        | [`StateView.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/StateView.tsx)               | Error / 404 / empty state wrapper           |
| **StatusIndicator**  | [`StatusIndicator.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/StatusIndicator.tsx)   | Colored status dot with label               |
| **TeamPicker**       | [`TeamPicker.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/TeamPicker.tsx)             | Ownership selector                          |
| **Textarea**         | [`Textarea.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/Textarea.tsx)                 | Multiline text input                        |
| **VirtualList**      | [`VirtualList.tsx`](file:///home/aadish/Documents/Github/vaptlens/src/ui/VirtualList.tsx)           | Windowed scroll container (5,000+ items)    |

---

## 4. Next Implementation Roadmap

To continue bringing the interior.dev standard to VAPTLens, the top recommended components to enhance next are:

1. **`Banner.tsx`**: Add collapsible height dismiss (mirroring `Alert.tsx`).
2. **`Wizard.tsx`**: Add directional slide step transitions (`wizard-steps.tsx`).
3. **`Slider.tsx`**: Add smooth spring thumb positioning and detent snap ticks (`slider-detents.tsx`).
4. **`AvatarGroup`**: Add `AnimatePresence` stack entrance (`presence-avatars.tsx`).
5. **`Toggle.tsx`**: Upgrade CSS translateX to physical spring glide thumb.
