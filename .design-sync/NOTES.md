# design-sync notes — VAPTLens

- Shape: package (no Storybook). Entry is `.design-sync/entry.ts`: it re-exports `src/ui/index` and imports `src/styles/{fonts,tokens,ui}.css`, so the bundle CSS carries the tokens and fonts. No `dist/` build is needed; run the converter with `--node-modules ./node_modules`.
- Render check / capture browser: the playwright-pinned chromium is NOT in `~/.cache/ms-playwright` on this machine. Use the system browser: prefix validate/capture/resync with `DS_CHROMIUM_PATH=/usr/bin/chromium`.
- Preview source material: every component has a hand-made usage example at `design/components/<Name>/preview.html`. Port those into `.design-sync/previews/<Name>.tsx` (JSX, inline token styles); treat them as composition data only.
- The DS ships no `body` font rule (the app's `app.css` sets it). Any glue text in a preview needs `fontFamily: 'var(--font-sans)'`, or it renders serif.
- There is no `--surface` token. Use `--surface-100/200/300`.
- `SeverityBadge solid` sets `is-solid`, but no CSS rule exists for it (renders identically). Not previewed.
- Overlays (`Modal`, `Drawer`) are `position: fixed`. Previews wrap them in a sized frame with `transform: translateZ(0)` (same trick as `design/components/Modal/preview.html`), plus `cfg.overrides.Modal = single`.
- **Component discovery comes from `design/components/index.d.ts`** (package.json `types`), not from `src/ui/index.ts`. Components exported from source but not declared there are invisible to the converter. The 28 "extended" components (2026-10-06) are pinned via `cfg.componentSrcMap`; add new ones there too, or declare them in index.d.ts.
- Extended components are untyped in source (`props` is `any`), so their API comes from `cfg.dtsPropsFor` and their docs/groups from `.design-sync/docs/<Name>.md` via `cfg.docsMap`. When their props change in source, update both. The generator used is ad hoc; edit config/docs directly.
- `src/styles/ui-extra.css` (extended component styles) is imported by `src/main.tsx`, not by the components, so `.design-sync/entry.ts` imports it explicitly. Any new stylesheet the app imports must be added there too, or those components ship unstyled.
- `ui-extra.css` field/label classes (`.vl-field-hint`, `.vl-field-error`, `.vl-qb-*`, `.vl-pop-title`, `.vl-progress-desc`) don't set a font. Previews for the extended components wrap each story in `const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' }`.
- Popover is shown open via its controlled `open` prop; card is `single`.
- Tooltip opens only on hover/focus. The preview uses `autoFocus` on the trigger, and since only one element can hold focus, the card is `single` with `primaryStory: Top`.

## Preview scope (sync 2026-10-06, second run: +28 extended components, all authored)
- Extended, authored + graded good (28): Accordion, ActivityTimeline, Avatar, AvatarGroup, Breadcrumbs, CalendarHeatmap, CopyButton, CountBadge, DateRangePicker, DiffView, FunnelChart, Gauge, JsonViewer, Kbd, KeyValueList, Pagination, Popover, ProgressBar, QueryBuilder, RadioGroup, Select, Slider, Spinner, StatusIndicator, TagInput, Textarea, TruncatedText, Wizard.
- Core, authored + graded good (25): Banner, BarChart, Button, DonutChart, EmptyState, FilterChip, Icon, Input, KpiCard, LineChart, Modal, RadarChart, ScannerBadge, SeverityBadge, SeverityMarker, Skeleton, SlaPill, Sparkline, Tabs, ThreatTag, TierBadge, Toast, Tooltip, VulnTable, WidgetCard.
- Floor/default-prop cards (38). Weak auto renders worth authoring next: Treemap, StackedBarChart (empty), AssetRow ("Tier [object Object]"), TopologyMap, SlaTrend (0%), ScatterChart. Placeholder cards: Heatmap, TemplateCard, Checkbox, Toggle, Drawer, PipelineStepper.

## Known render warns
- none outstanding (Icon `[GRID_OVERFLOW]` resolved with `cardMode: column`).

## Re-sync risks
- `cfg.dtsPropsFor` / `.design-sync/docs/*.md` for the extended components are hand-written from source on 2026-10-06. They silently go stale when those components' props change.
- Conventions header lists 8 `data-vt` themes; the build also has `enterprise` and `paper` (proposed addition, not applied).
- Conventions header (`conventions.md`) names tokens, icon names and `data-vt` themes. Re-validate them if `src/styles/tokens.css` / `src/ui/icons.ts` change.
- Preview data is copied from `design/components/*/preview.html`. If component props change, the previews and those examples can drift together.
- Render verification depends on the system chromium version, not a pinned playwright build.
