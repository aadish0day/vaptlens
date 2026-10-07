---
category: Charts
---
# CalendarHeatmap

GitHub-style daily activity grid (scans, fixes, audit events) using the `--heat-0…5` scale.

## Props

```ts
{
  /** { "YYYY-MM-DD": count } */
  data: Record<string, number>;
  /** last day shown, YYYY-MM-DD (default today) */
  end?: string;
  /** columns (default 26) */
  weeks?: number;
  /** noun for tooltips (default "events") */
  unit?: string;
  label?: string;
  onSelect?: (day: string) => void;
}
```

## Example

```jsx
<CalendarHeatmap label="Fixes" unit="fixes" weeks={20} end="2026-07-01" data={{ '2026-06-30': 4, '2026-06-24': 9 }} />
```
