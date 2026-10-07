---
category: Charts
---
# Gauge

Semicircle score gauge with coloured bands; shows the value and the band word.

## Props

```ts
{
  value: number;
  min?: number;
  max?: number;
  /** default: Low ≤40, Elevated ≤70, High ≤90, Critical */
  bands?: Array<{ to: number; color: string; label: string }>;
  label?: string;
  caption?: React.ReactNode;
  format?: (value: number) => string;
  /** max width in px (default 200) */
  width?: number;
}
```

## Example

```jsx
<Gauge value={78} label="Exposure score" caption="Up 6 since last quarter" />
```
