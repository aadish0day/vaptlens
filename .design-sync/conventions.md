# VAPTLens: building with this library

VAPTLens is a dark-first analytics UI for vulnerability (VAPT) data: severities, threat tags, SLAs, hosts and charts. Every component is a plain React function component on `window.VAPTLens`. It needs no provider or context.

## Setup
- Load `styles.css`. It `@import`s `_ds_bundle.css`, which holds the design tokens, the IBM Plex fonts and every `vl-*` component class. Without it, components render as unstyled HTML.
- **No global body styles ship.** Set them on your root yourself, or any text outside a component falls back to the browser's serif font:
  `<div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink)', background: 'var(--canvas)', minHeight: '100vh' }}>`
- **Theme**: follows `prefers-color-scheme` by default. To force one, set `data-vt` on `<html>`: `dark`, `light`, `cvd`, `hc`, `midnight`, `matrix`, `neon` or `teal`. Every token re-themes, so never hard-code colours.
- `Modal` and `Drawer` render full-viewport `position: fixed` overlays. Render them conditionally (or pass `open={false}`), never inline in a layout.

## Styling idiom: CSS custom properties, no utility classes
Lay out your own glue (flex or grid wrappers, spacing, card frames) with inline styles that read tokens. Never invent class names. The `vl-*` classes belong to the components, so don't apply them by hand.

| Family | Tokens |
|---|---|
| Surfaces | `--canvas` (page), `--surface-100/200/300` (raised), `--border`, `--border-strong`, `--scrim` |
| Text | `--ink`, `--ink-muted`, `--ink-subtle`; fonts `--font-sans`, `--font-mono` (hosts, IDs, CVEs), `--font-display` |
| Accent | `--signal` (amber brand accent), `--lens`, `--lens-soft`, `--focus-ring` |
| Severity | `--sev-critical/high/medium/low/info` plus `-soft` backgrounds |
| Threat / charts | `--threat-kev`, `--threat-zeroday`, `--threat-ransomware`; `--chart-1` … `--chart-6` |
| Spacing | `--space-0` … `--space-8`, `--space-10/12/16/20` |
| Shape | `--radius-xs/sm/md/lg/xl/2xl`, `--radius-card`, `--radius-control`, `--radius-badge`, `--radius-full`; `--shadow-xs/sm/md/lg/xl`, `--shadow-card`, `--shadow-overlay` |

## Domain vocabulary (string props)
- Severity (`SeverityBadge`, `SeverityMarker`, `FilterChip`, chart `data[].severity`): `'critical' | 'high' | 'medium' | 'low' | 'info'`
- `ThreatTag kind`: `'kev' | 'zeroday' | 'ransomware' | 'exploitable' | 'eol' | 'breached'`
- `SlaPill status`: `'met' | 'at-risk' | 'breached'` (+ `days`)
- `Button variant`: `'primary' | 'secondary' | 'ghost' | 'danger'`; `size`: `'sm' | 'md' | 'lg'`; `restricted` + `restrictedReason` for read-only roles
- `Icon name` (also `icon` props): `shield`, `shield-check`, `flame`, `skull`, `zap`, `clock`, `lock`, `ticket`, `server`, `database`, `globe`, `router`, `monitor`, `search`, `filter`, `upload`, `download`, `file`, `user`, `flag`, `target`, `trend-up`, `trend-down`, `check`, `x`. Unknown names render empty.

## Where the truth lives
- `styles.css` → `_ds_bundle.css`: every token and component class.
- `components/<group>/<Name>/<Name>.prompt.md` and `<Name>.d.ts`: per-component API and examples.
- `guidelines/design/DESIGN.md`: the VAPTLens design principles.

## Example
```jsx
const { WidgetCard, KpiCard, SeverityBadge, Button, VulnTable } = window.VAPTLens;

<div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink)', background: 'var(--canvas)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
  <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
    <KpiCard label="Active findings" value="1,284" sub="+36 since last scan" icon="shield" />
    <KpiCard label="SLA breached" value="47" tone="critical" sub="12 critical" icon="clock" />
  </div>
  <WidgetCard title="Open findings" actions={<Button variant="ghost" size="sm">Export</Button>}>
    <VulnTable rows={[{ id: 1, severity: 'critical', name: 'Apache Tomcat RCE', host: '10.100.1.10:8080', cvss: 9.8, lifecycle: 'New', tool: 'Nessus', tags: ['zeroday'] }]} />
  </WidgetCard>
</div>
```
