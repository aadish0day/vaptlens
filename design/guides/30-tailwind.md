# Using the tokens in code (Tailwind v4)

`exports/vaptlens-tailwind.css` is generated from `tokens.json`. Copy it into the app as `src/styles/vaptlens.css`, import it once from `main.tsx`, and put the four font files from `fonts/` (IBM Plex Sans variable, IBM Plex Mono 400/500/600) in `public/fonts/`. Or install `@fontsource-variable/ibm-plex-sans` and `@fontsource/ibm-plex-mono` and drop the `@font-face` lines.

```css
/* src/index.css */
@import "./styles/vaptlens.css";
```

```html
<html data-theme="dark" data-density="default">
```

## What it gives you

| Token | Utility | Example |
|---|---|---|
| Color tokens | `bg-*`, `text-*`, `border-*`, `fill-*`, `stroke-*`, `ring-*` | `bg-surface-100 text-ink border-border` |
| Severity | same | `text-sev-critical bg-sev-critical-soft` |
| Type styles | `text-<style>` sets size, line height and weight | `text-body-sm`, `text-kpi`, `text-label uppercase` |
| Families | `font-sans`, `font-mono` | `font-mono` for hosts, CVEs and ports |
| Spacing | `--spacing: 4px`, so step N = `space-N` | `p-4` = `space-4` = 16px, `gap-3` = 12px |
| Radii | `rounded-*` (from `radius-*`) | `rounded-sm` 4 · `rounded-md` 6 · `rounded-lg` 10 · `rounded-full` |
| Shadows | `shadow-*` (from `shadow-*`) | `shadow-card`, `shadow-overlay` |
| Breakpoints | `sm` 480 · `md` 768 · `lg` 1280 · `xl` 1600 | `md:grid-cols-12` |
| z-index, opacity, sizes | arbitrary-value utilities | `z-(--z-modal)`, `h-(--row-height)`, `opacity-(--opacity-dimmed)` |

Tailwind's default palette is removed (`--color-*: initial`), so only system colors exist. `bg-red-500` will not compile, which is intended.

## Themes and density

- Switch theme by setting `data-theme` on `<html>` to `dark`, `light`, `cvd` or `hc`. Store the choice as `vaptlens-theme`, as the spec says. The `dark:` variant covers every dark-based theme.
- Density: `data-density="compact"` or `"comfortable"` on the table or canvas root rewrites `--row-height`.
- The file already sets `html` background and text colors, the focus ring and reduced-motion handling.

## Recharts

Pass CSS variables straight in: `fill="var(--sev-critical)"`, `stroke="var(--chart-grid)"`, `tick={{ fill: "var(--chart-axis)", fontSize: 11 }}`. Colors then follow the theme with no re-render.
