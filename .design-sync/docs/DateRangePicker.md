---
category: Filtering
---
# DateRangePicker

Date range trigger with relative presets (7d, 30d, 90d, 180d, 365d) and an absolute from/to range.

## Props

```ts
{
  value?: { type: 'relative'; key: '7d' | '30d' | '90d' | '180d' | '365d' } | { type: 'absolute'; from: string; to: string } | null;
  defaultValue?: DateRangePickerProps['value'];
  /** second arg is the resolved { from, to } ISO dates */
  onChange?: (value: DateRangePickerProps['value'], resolved: { from: string; to: string } | null) => void;
  label?: string;
  placeholder?: string;
  /** latest selectable date, YYYY-MM-DD */
  max?: string;
  /** "today" for relative ranges, YYYY-MM-DD */
  today?: string;
}
```

## Example

```jsx
<DateRangePicker label="Scan date" defaultValue={{ type: 'relative', key: '90d' }} onChange={(v, r) => setRange(r)} />
```
