---
category: Charts
---
# FunnelChart

Stage funnel with stage-to-stage conversion %, e.g. found → triaged → ticketed → fixed → verified.

## Props

```ts
{
  stages: Array<{ label: string; value: number; color?: string }>;
  label?: string;
  /** label of the selected stage; with onSelect rows become toggle buttons */
  selected?: string | null;
  onSelect?: (label: string | null) => void;
}
```

## Example

```jsx
<FunnelChart label="Remediation funnel" stages={[{ label: 'Found', value: 212 }, { label: 'Triaged', value: 180 }, { label: 'Ticketed', value: 131 }, { label: 'Fixed', value: 94 }, { label: 'Verified', value: 71 }]} />
```
