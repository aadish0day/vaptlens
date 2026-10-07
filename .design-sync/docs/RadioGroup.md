---
category: Filtering
---
# RadioGroup

Accessible radio set (arrow keys move the choice).

## Props

```ts
{
  options: Array<string | { value: string; label: React.ReactNode; description?: string; disabled?: boolean }>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  /** set false to keep label for screen readers only */
  showLabel?: boolean;
  /** lay options out in a row */
  inline?: boolean;
}
```

## Example

```jsx
<RadioGroup label="Report audience" defaultValue="exec" options={[{ value: 'exec', label: 'Executive', description: 'Summary and trends' }, { value: 'tech', label: 'Technical', description: 'Every finding with evidence' }]} />
```
