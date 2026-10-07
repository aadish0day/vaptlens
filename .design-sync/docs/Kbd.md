---
category: Data display
---
# Kbd

Keyboard shortcut chips. "mod" renders ⌘ on Mac and Ctrl elsewhere.

## Props

```ts
{
  /** e.g. ['mod', 'K'] */
  keys?: string[];
  /** alternative to keys: "mod+K" */
  children?: string;
}
```

## Example

```jsx
<Kbd keys={['mod', 'K']} />
```
