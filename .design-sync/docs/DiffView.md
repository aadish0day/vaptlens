---
category: Data display
---
# DiffView

Unified line diff, e.g. original vs re-test evidence.

## Props

```ts
{
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}
```

## Example

```jsx
<DiffView beforeLabel="Initial scan" afterLabel="Re-test" before={"Server: Apache/2.4.49\nX-Powered-By: PHP/7.2"} after={"Server: Apache/2.4.58"} />
```
