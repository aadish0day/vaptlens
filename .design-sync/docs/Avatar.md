---
category: Data display
---
# Avatar

Initials avatar with a stable per-name colour and optional presence dot.

## Props

```ts
{
  name: string;
  size?: number;
  status?: 'ok' | 'warn';
  title?: string;
  className?: string;
}
```

## Example

```jsx
<Avatar name="Priya Raman" size={32} status="ok" />
```
