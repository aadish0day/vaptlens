---
category: Status
---
# StatusIndicator

Status dot plus a word (never colour alone). Default words: ok Healthy, warn Degraded, danger Failing, info Info, pending Pending, off Off, running Running.

## Props

```ts
{
  status: 'ok' | 'warn' | 'danger' | 'info' | 'pending' | 'off' | 'running';
  /** overrides the default word */
  children?: React.ReactNode;
  className?: string;
}
```

## Example

```jsx
<StatusIndicator status="running">Scan in progress</StatusIndicator>
```
