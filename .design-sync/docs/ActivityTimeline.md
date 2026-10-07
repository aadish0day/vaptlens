---
category: Data display
---
# ActivityTimeline

Who did what and when, newest first, grouped by day.

## Props

```ts
{
  items: Array<{ id?: string; at: string; actor?: string; text: React.ReactNode; detail?: React.ReactNode; tone?: 'ok' | 'warn' | 'danger' | 'info' }>;
  /** text when there are no items */
  empty?: string;
}
```

## Example

```jsx
<ActivityTimeline items={[{ id: '1', at: '2026-07-01T14:20:00', actor: 'Priya Raman', text: 'raised ticket SEC-412', tone: 'info' }, { id: '2', at: '2026-07-01T09:05:00', actor: 'Tom Okafor', text: 'verified the fix', tone: 'ok' }]} />
```
