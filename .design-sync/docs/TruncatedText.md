---
category: Data display
---
# TruncatedText

Clamps long text to N lines with Show more / Show less (only when longer than `threshold` characters).

## Props

```ts
{
  text?: string;
  children?: string;
  /** lines when clamped (default 3) */
  lines?: number;
  /** characters before clamping applies (default 240) */
  threshold?: number;
}
```

## Example

```jsx
<TruncatedText lines={2} text={finding.description} />
```
