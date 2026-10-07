---
category: Feedback
---
# ProgressBar

Determinate bar (pass `value`) or indeterminate (omit it), with label and status tone.

## Props

```ts
{
  value?: number;
  max?: number;
  label?: string;
  /** show the % readout (default when label is set) */
  showValue?: boolean;
  /** replaces the % readout, e.g. "142 / 212 rows" */
  valueText?: string;
  description?: string;
  tone?: 'ok' | 'warn' | 'danger';
  ariaLabel?: string;
}
```

## Example

```jsx
<ProgressBar label="Parsing scan-export.csv" value={142} max={212} valueText="142 / 212 rows" />
```
