# Logos

Placeholder identity: a lens reticle (ring, center pupil, four crosshair ticks) that reads as both "lens" and "scan target". Replace when a final mark exists.

- `vaptlens-mark-dark.svg`: single ink `#ffb020` (`signal`, dark theme). Use on `canvas` / `surface-100` in dark.
- `vaptlens-mark-light.svg`: single ink `#a15f00` (`signal`, light theme). Use on light grounds.
- `vaptlens-app-icon.svg`: mark in `#ffb020` on a `#0a0b0d` (`canvas` dark) tile, radius 14/64. Favicons, PWA icons, report cover.
- In the app, render the `Logo` component instead: it uses `currentColor` and follows the theme.
