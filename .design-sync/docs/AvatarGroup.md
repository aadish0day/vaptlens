---
category: Data display
---
# AvatarGroup

Overlapping avatars with a +N overflow chip.

## Props

```ts
{
  names: string[];
  /** shown before "+N" (default 4) */
  max?: number;
  size?: number;
}
```

## Example

```jsx
<AvatarGroup names={['Priya Raman', 'Tom Okafor', 'Lena Vogt', 'Sam Ito', 'Ana Ruiz']} max={3} />
```
