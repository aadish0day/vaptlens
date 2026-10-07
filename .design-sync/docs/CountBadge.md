---
category: Status
---
# CountBadge

Small numeric pill with a 99+ cap. Renders nothing at 0 unless `showZero`.

## Props

```ts
{
  count: number;
  tone?: 'neutral' | 'danger' | 'signal';
  /** cap; shows "99+" above it (default 99) */
  max?: number;
  showZero?: boolean;
  /** accessible noun, e.g. "unread" */
  label?: string;
}
```

## Example

```jsx
<CountBadge count={12} tone="danger" label="breached" />
```
