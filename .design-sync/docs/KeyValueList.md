---
category: Data display
---
# KeyValueList

Label/value pairs (a definition list). Empty values are hidden unless `showEmpty`.

## Props

```ts
{
  items: Array<{ label: React.ReactNode; value: React.ReactNode; key?: string; mono?: boolean; copy?: boolean | string }>;
  columns?: 1 | 2 | 3;
  showEmpty?: boolean;
  className?: string;
}
```

## Example

```jsx
<KeyValueList columns={2} items={[{ label: 'Host', value: '10.100.1.10', mono: true, copy: true }, { label: 'Owner', value: 'Server Team' }, { label: 'First seen', value: '2026-02-14' }]} />
```
