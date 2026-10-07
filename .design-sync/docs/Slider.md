---
category: Filtering
---
# Slider

Labelled range slider with a value readout and optional marks.

## Props

```ts
{
  label: string;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  marks?: Array<{ value: number; label: string }>;
  disabled?: boolean;
}
```

## Example

```jsx
<Slider label="Minimum CVSS" min={0} max={10} step={0.1} defaultValue={7} format={(v) => v.toFixed(1)} marks={[{ value: 4, label: 'Med' }, { value: 7, label: 'High' }, { value: 9, label: 'Crit' }]} />
```
