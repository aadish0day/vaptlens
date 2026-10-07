---
category: Layout
---
# WidgetCard

The grid tile that holds every chart and list on the Dashboard canvas.

**Provide:** `title` (sentence case, names the measure and dimension: "Findings by severity"), `children` (the chart or list), optional `actions` (ghost `sm` Buttons or icon buttons), `draggable` (default true: shows the grip and a grab cursor; the header is the drag handle).

- Radius `radius-lg`, 1px `border`, `shadow-card`; header 44px with a hairline under it; body padding `space-4`.
- Grid gutters are `space-3`. The dragged tile takes `shadow-overlay`.
- The pinned Top Breach Headlines row uses `draggable={false}`.
- Empty state: one `ink-subtle` line centered in the body ("No findings match the current filters"), never an illustration.
