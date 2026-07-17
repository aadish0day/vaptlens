# Design System — VAPTLens

> **Direction (2026-07-14):** Rebuilt as a **premium SaaS analytics product** in the spirit of
> Linear / Vercel / Stripe — calm, precise, and confident. Replaces the earlier
> terminal/forensic concept. Light + dark, fully responsive, WCAG AA.

## Product Context
- **What this is:** A client-side, Power BI-style analytics dashboard for vulnerability scan data.
  Upload any scanner's CSV; explore results on a draggable, cross-filtering canvas. No backend,
  no network calls — scan data never leaves the browser.
- **Who it's for:** Security students and pentesters who run scans with different tools and want
  to explore results like data, not view six fixed charts.
- **Project type:** Technical dashboard (web app), data-dense, multi-panel.

## Aesthetic Direction
- **Direction:** Premium SaaS / "instrument-grade." Restrained, layered surfaces, generous
  whitespace, decisive accent. The craft is in the details (hairline borders, soft shadows,
  micro-interactions) — not in decoration.
- **Decoration level:** Minimal. One signature moment only: a subtle scanline sweep on scan
  import (handled in the upload flow), and quiet hover/active motion everywhere else.
- **Mood:** Professional, trustworthy, fast. Reads like a tool a serious team reaches for daily.
- **Memorable thing:** *Clarity over spectacle.* Data is the hero; the chrome gets out of the way.

## Typography
- **UI / body:** **Inter** (400/500/600/700). Used for all labels, nav, table prose, buttons.
- **Data / numbers / mono:** **JetBrains Mono** (400/500/600) for tabular alignment of metrics,
  CVSS scores, ports, and the KPI figures. Self-hosted via `@fontsource`.
- **Scale:** display 40px / h1 18px / h3 (widget titles) 13px semibold / body 14px / caption 11–12px.
- **Numbers:** `tabular-nums` everywhere a figure can change, so columns don't jitter.

## Color
- **Approach:** Light-first with a deep dark mode. A single indigo/violet brand accent used
  *only* for interactive/active state and key data highlights. Severity colors are reserved
  strictly for severity encoding.
- **Brand (primary):** indigo `#5B5BF6` (light) / `#818CF8` (dark) — Linear/Vercel-adjacent.
- **Light surfaces:** page `#F6F7F9`, card `#FFFFFF`, sidebar `#FCFCFD`, border `#E4E7EC`,
  text `#14181F`, muted `#6B7280`.
- **Dark surfaces:** page `#0B0D14`, card `#141821`, sidebar `#11141B`, border `#2A2F3A`,
  text `#E7EAF0`, muted `#98A2B3`.
- **Severity (semantic, used only for severity):**
  Critical `#E5484D` · High `#F2994A` · Medium `#F2C94C` · Low `#56CCF2` · Info `#7D8CA3`.
  Badges use tinted backgrounds + a darkened text token per theme so every chip passes AA.
- **Implementation:** Tokens are CSS variables (`--background`, `--primary`, …) defined in
  `src/index.css` for `:root` and `.dark`, mapped into Tailwind v4 via `@theme inline`. Opacity
  washes (e.g. `bg-primary-soft`) use `color-mix`.

## Spacing
- **Base unit:** 8px grid (Tailwind default 4px step, used at even multiples: 2/4/6/8).
- **Density:** Compact-comfortable. Sidebar 288px, header 56px, canvas padding 24px (16px mobile),
  widget gaps 16px, card padding 16–20px.

## Layout
- **Approach:** Strict app chrome (header / sidebar / canvas) + free canvas (react-grid-layout)
  for widgets — Power BI-style. The grid gives the "instrument" feel; the chrome stays quiet.
- **Responsive:** Sidebar is a static column ≥768px and a slide-in **Sheet** (<768px). Toolbar
  actions collapse labels to icons on small screens. Widgets collapse to a single column on mobile.
- **Max content width:** fluid (fills viewport); canvas widgets bounded by the 12-col grid.
- **Radii:** hierarchical — controls/inputs 8px, cards/widgets 12px, pills 9999px, Sheet 0.

## Motion (Framer Motion)
- **Approach:** Subtle, functional, never decorative for its own sake. All motion respects
  `prefers-reduced-motion` via `<MotionConfig reducedMotion="user">`.
- **Easing:** expressive ease-out `[0.22, 1, 0.36, 1]` for entrances; spring for dialogs.
- **Moments:** canvas fade/slide-in, widget card entrance, cross-filter pill add/remove
  (layout + scale), dialog zoom, dropzone active state, hover lift on template cards, error
  expand/collapse.
- **Duration:** micro 150ms · short 200–300ms · dialog 200–300ms.

## Components
- **Library:** **shadcn/ui** (Radix primitives + `class-variance-authority`) in `src/components/ui/`.
  Button, Card, Input, Label, Badge, Checkbox, Select, Dialog, Sheet, Tooltip, Separator,
  ScrollArea, Table, Skeleton.
- **Theme:** `ThemeProvider` (class-based `.dark`, persisted to `localStorage`, no-flash inline
  script in `index.html`). Toggle in the header. Charts read theme via `useChartTheme()`.
- **Charts:** Recharts, themed per `src/lib/chart-theme.ts` (axis/grid/tooltip tokens + severity
  and categorical palettes for light/dark). Donut shows a centered total; bars/lines have rounded
  caps and soft tooltips.

## Accessibility (WCAG AA)
- Visible focus rings (`box-shadow` ring, keyboard-only), labeled icon buttons, `aria-label` on
  all controls, `role="button"` + keyboard handlers on the dropzone, semantic `<table>` with
  sortable headers, AA-contrast severity badge text, reduced-motion honored.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-14 | Premium SaaS direction (Linear/Vercel/Stripe) | User asked for a senior-product-designer look; replaces terminal concept |
| 2026-07-14 | Light + dark toggle | Vercel/Stripe ship both; broadest fit |
| 2026-07-14 | Tailwind CSS v4 + `@tailwindcss/vite` | Modern tooling, CSS-first tokens, `color-mix` opacity |
| 2026-07-14 | shadcn/ui on Radix | Accessible, composable, premium baseline |
| 2026-07-14 | Framer Motion, subtle only | Motion as feedback, not spectacle |
| 2026-07-14 | Inter (UI) + JetBrains Mono (data) | Clear hierarchy; mono keeps numbers aligned |
| 2026-07-14 | Indigo/violet brand, severity colors reserved | Accent stays meaningful; data stays loud |
