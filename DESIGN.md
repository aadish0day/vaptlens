# Design System — VAPTLens

## Product Context
- **What this is:** A client-side, Power BI-style analytics dashboard for vulnerability scan data. Upload any scanner's CSV; explore results on a draggable, cross-filtering canvas. No backend, no uploads — scan data never leaves the browser.
- **Who it's for:** Security students and pentesters who run scans with different tools and want to explore results like data, not view six fixed charts.
- **Space/industry:** Application security / VAPT (Vulnerability Assessment & Penetration Testing) tooling.
- **Project type:** Technical dashboard (web app), data-dense, multi-panel.

## Aesthetic Direction
- **Direction:** Forensic / terminal-grade. Instrumentation, not a consumer app.
- **Decoration level:** Minimal. The canvas is busy by nature; everything around it stays quiet. One signature moment only: the terminal-banner header + a one-time scanline sweep on import.
- **Mood:** Serious software for serious work. Near-black (not pure black) so it reads as a precision instrument, not a "hacker movie" green.
- **Memorable thing:** *Serious software for serious work.* The product should feel like instrumentation a professional reaches for, not a friendly SaaS dashboard.

## Typography
- **Display/Hero:** IBM Plex Mono (700) — hero text, product wordmark, big numbers.
- **Body:** Inter (400) — descriptions, helper copy, table prose.
- **UI/Labels:** IBM Plex Mono (500/600) — all labels, eyebrows, headers, severity tags, button text, axis ticks. The "voice of the data."
- **Data/Tables:** IBM Plex Mono — `font-variant-numeric: tabular-nums` for alignment of metrics and CVSS scores.
- **Code:** IBM Plex Mono.
- **Loading:** Google Fonts CDN (`family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600`). Self-host before shipping if offline use matters.
- **Scale:** display 32–38px / h1 20px / h3 (section labels) 14px uppercase / body 14px / data 11–14px mono / caption 11px.

## Color
- **Approach:** Restrained. One accent used *only* for interactive/active state. Severity colors reserved strictly for severity. Neutrals carry structure.
- **Background:** `#0B0E14` — near-black, not pure black (avoids the "hacker green" cliché).
- **Panel:** `#131826` — raised surfaces (widgets, sidebar, banner).
- **Border:** `#212B3D` — hairline structure.
- **Primary text:** `#E6EDF3`.
- **Muted text:** `#7D8CA3` — labels, captions, secondary.
- **Accent:** `#3DDC97` — used sparingly: active cross-filter chips, focus rings, primary button, selected state. Never as a decorative fill.
- **Semantic (severity only):** Critical `#E5484D`, High `#F2994A`, Medium `#F2C94C`, Low `#56CCF2`, Info `#7D8CA3`. Applied only to severity encoding (donut, bars, table tags, severity slicer).
- **Dark mode:** This is a dark-first product. Light mode (if ever needed) inverts neutrals: bg `#F4F6FA`, panel `#FFFFFF`, border `#D7DEE8`, text `#0B0E14`, muted `#5A6B82`, accent `#0BA968`. Severity hues stay constant.

## Spacing
- **Base unit:** 8px.
- **Density:** Compact / comfortable — analysts parse a lot at once; tight but never cramped.
- **Scale:** 2xs 2 · xs 4 · sm 8 · md 16 · lg 24 · xl 32 · 2xl 48.

## Layout
- **Approach:** Hybrid — strict grid for the app chrome (banner / sidebar / canvas), free canvas (react-grid-layout) for the widgets themselves. Power BI-style.
- **Grid:** Top banner (full width). Below: left slicer sidebar (fixed ~220–288px) + right canvas (fluid, 12-col grid inside react-grid-layout, collapses to 1 col on mobile).
- **Max content width:** fluid (fills viewport); canvas widgets bounded by grid.
- **Border radius:** hierarchical — controls/inputs 6px, cards/widgets 10px, pills/chips 9999px (full).

## Motion
- **Approach:** Minimal-functional. State transitions only; one expressive beat.
- **Easing:** enter ease-out, exit ease-in, move ease-in-out.
- **Duration:** micro 50–100ms · short 150–250ms · medium 250–400ms.
- **Signature:** a single **scanline sweep** (top→bottom accent gradient) when a scan finishes processing. Respects `prefers-reduced-motion` (disabled). The resting state is static — no ambient decoration.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-14 | Dark `#0B0E14` near-black, not pure black | Avoids "hacker green" cliché; reads as precision instrument |
| 2026-07-14 | IBM Plex Mono for all data/labels, Inter for body | Mono is the "voice of the data"; separates data from prose |
| 2026-07-14 | Accent `#3DDC97` used only for active/interactive state | Keeps severity colors + data as the loudest elements |
| 2026-07-14 | Terminal-banner header (`root@vaptlens:~$ vaptlens`) | Sets forensic tone in 3 seconds; signals power-user tooling |
| 2026-07-14 | One-time scanline sweep as the only animation | Gives client-side tool "alive" feedback without decorating rest state |
| 2026-07-14 | Resting UI stays quiet (no ambient motion) | Canvas is already busy; decoration would compete with data |
