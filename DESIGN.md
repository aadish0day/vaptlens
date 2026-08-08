# Design System — VAPTLens

> **Direction (2026-08-01):** Clean enterprise data platform — warm neutrals, deep teal
> accent, no decoration. Inspired by Retool / Linear — quiet, structured, purposeful.
> Replaces the earlier indigo/cyber aesthetic. Light + dark, fully responsive, WCAG AA.

## Product Context
- **What this is:** A client-side, Power BI-style analytics dashboard for vulnerability scan data.
  Upload any scanner's CSV; explore results on a draggable, cross-filtering canvas. No backend,
  no network calls — scan data never leaves the browser.
- **Who it's for:** Security students and pentesters who run scans with different tools and want
  to explore results like data, not view six fixed charts.
- **Project type:** Technical dashboard (web app), data-dense, multi-panel.

## Aesthetic Direction
- **Direction:** Clean enterprise data platform. Purposeful restraint — the craft is in
  consistent spacing, quiet borders, and legible type. No gradients, no glowing effects,
  no decorative animations. The interface should feel like a tool, not a showcase.
- **Decoration level:** None. No accent bars on cards, no pulsing dots, no background
  textures, no drop-shadow glows on hover. Borders and elevation do the separation work.
- **Mood:** Professional, trustworthy, fast. Reads like a tool a serious team reaches for daily.
- **Memorable thing:** *Warm neutrals.* The stone-tinted surfaces (not cold blue-gray) set this
  apart from generic dashboard templates. Data is the hero; chrome gets out of the way.

## Typography
- **UI / body:** **Inter** (400/500/600) for all labels, navigation, table prose, buttons.
  Sans-serif only for interface text — never monospace for navigation or headings.
- **Data / numbers / mono:** **JetBrains Mono** (400/500) for tabular alignment of metrics,
  CVSS scores, ports, IP addresses, and code-like content. Reserved strictly for data display.
- **Scale:** widget titles 13px semibold / body 14px / caption 11–12px / tabs 13px regular.
- **Numbers:** `tabular-nums` everywhere a figure can change, so columns don't jitter.
- **Anti-patterns:** No `uppercase tracking-wider` on UI labels. No `font-mono` on navigation
  or headings. These are AI slop patterns that make interfaces look generated rather than designed.

## Color
- **Approach:** Warm-tinted neutrals with a deep teal accent. Light-first with a warm dark mode.
  Teal is used for primary actions and focus states only. Severity colors are reserved
  strictly for severity encoding.
- **Brand (primary):** deep teal `#0F766E` (light) / `#2DD4BF` (dark).
- **Light surfaces:** page `hsl(40 6% 97%)` warm stone, card `#FFFFFF`, sidebar `hsl(40 6% 98%)`,
  border `hsl(30 6% 87%)`, text `hsl(20 14% 10%)`, muted `hsl(20 5% 46%)`.
- **Dark surfaces:** page `hsl(20 8% 6%)` warm black, card `hsl(20 8% 13%)`,
  sidebar `hsl(20 8% 9%)`, border `hsl(20 6% 26%)`, text `hsl(30 10% 90%)`,
  muted `hsl(20 6% 62%)`.
- **Severity (semantic, used only for severity):**
  Critical `#DC2626` · High `#EA580C` · Medium `#D97706` · Low `#0D9488` · Info `#78716C`.
  Badges use tinted backgrounds + darker text per theme so every chip passes AA.
- **Categorical series:** Teal → Blue → Purple → Pink → Amber → Emerald → Indigo → Stone.
  Dark mode uses lighter variants for contrast on dark surfaces.
- **Implementation:** CSS variables in `src/index.css` for `:root` and `.dark`, mapped into
  Tailwind v4 via `@theme inline`. Chart colors centralized in `src/lib/chart-theme.ts`.

## Spacing
- **Base unit:** 8px grid (Tailwind default 4px step, used at even multiples: 2/4/6/8).
- **Density:** Compact-comfortable. Sidebar 320px, header 56px, canvas padding 24px (16px mobile),
  widget gaps 16px, card padding 12px, widget header padding 12px × 8px.

## Layout
- **Approach:** Strict app chrome (header / sidebar / canvas) + free canvas (react-grid-layout)
  for widgets — Power BI-style. The grid gives the "instrument" feel; the chrome stays quiet.
- **Header:** 56px, solid card background, no blur effects. Flat teal logo mark (rounded-md),
  plain text "VAPTLens", short subtitle. No badges, no gradient logos, no pulsing indicators.
- **Sidebar:** 320px static column ≥768px, slide-in Sheet on mobile.
- **Tab bar:** Compact, icon + label buttons, no special font treatment. Active state uses
  `secondary` variant. No monospace, no uppercase, no tracking-wider.
- **Widget cards:** `rounded-lg`, 1px border, card background, subtle shadow-card. No top accent
  bars, no hover glows, no colored borders. Title is 13px semibold in the default sans-serif.
- **Radii:** controls 8px, cards 8px, pills 9999px.

## Motion (Framer Motion)
- **Approach:** Minimal, functional. All motion respects `prefers-reduced-motion`.
- **Easing:** `[0.22, 1, 0.36, 1]` for entrances.
- **Moments:** canvas fade-in, widget entrance, cross-filter pill transitions.
- **Duration:** micro 150ms · short 200–300ms.
- **Anti-patterns:** No `animate-pulse`, no `drop-shadow` glow effects, no background pattern
  animations. These read as decoration, not function.

## Components
- **Library:** **shadcn/ui** (Radix primitives + `class-variance-authority`) in `src/components/ui/`.
- **Theme:** `ThemeProvider` (class-based `.dark`, persisted to `localStorage`). Charts
  read theme via `useChartTheme()`.
- **Charts:** Recharts, themed per `src/lib/chart-theme.ts`. Warm stone axis colors,
  tinted grid lines, clean tooltips without glow effects.
- **Severity badges:** `rounded-full`, colored dot + tinted background. No pulse animation,
  no monospace, no uppercase tracking.

## Accessibility (WCAG AA)
- Visible focus rings (`box-shadow` ring, keyboard-only), labeled icon buttons, `aria-label` on
  all controls, semantic `<table>` with sortable headers, AA-contrast severity badge text,
  reduced-motion honored.

## Anti-Patterns (Do Not Add)
These patterns make the interface look AI-generated rather than designed:
- ❌ Gradient logo backgrounds (`bg-gradient-to-br from-X via-Y to-Z`)
- ❌ `font-mono uppercase tracking-wider` on navigation labels
- ❌ `animate-pulse` on status dots
- ❌ "SECURITY ANALYTICS" or similar self-labeling badges
- ❌ `border-t-2 border-t-primary` accent bars on cards
- ❌ Cyber glow `drop-shadow` on chart hover
- ❌ Background dot grids (`radial-gradient` patterns on body)
- ❌ `hover:border-primary/40` glow borders
- ❌ `backdrop-blur` on fixed headers (expensive, no visual benefit)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-14 | Premium SaaS direction (Linear/Vercel/Stripe) | User asked for a senior-product-designer look |
| 2026-07-14 | Light + dark toggle | Broadest fit for security professionals |
| 2026-07-14 | Tailwind CSS v4 + `@tailwindcss/vite` | Modern tooling, CSS-first tokens |
| 2026-07-14 | shadcn/ui on Radix | Accessible, composable, premium baseline |
| 2026-07-14 | Framer Motion, subtle only | Motion as feedback, not spectacle |
| 2026-07-14 | Inter (UI) + JetBrains Mono (data) | Clear hierarchy; mono keeps numbers aligned |
| 2026-08-01 | Deep teal primary, warm stone neutrals | Replaces cold indigo/cyan; distinctive without being decorative |
| 2026-08-01 | Strip all AI slop patterns | Removed gradients, pulse dots, mono nav, cyber glows, badge labels |
| 2026-08-01 | Anti-patterns section | Explicit list of patterns to avoid so future changes don't regress |
| 2026-08-01 | Dark-mode contrast pass | Raised card/popover elevation, AA-clean muted text, visible borders, `color-scheme: dark`; fixes muddy-brown, flat surfaces |
