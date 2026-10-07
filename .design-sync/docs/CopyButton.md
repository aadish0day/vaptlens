---
category: Actions
---
# CopyButton

Copies text to the clipboard with a live "Copied" confirmation.

## Props

```ts
{
  text: string | (() => string);
  label?: string;
  /** icon-only square button; label becomes the aria-label */
  iconOnly?: boolean;
  onCopy?: (text: string) => void;
  className?: string;
}
```

## Example

```jsx
<CopyButton text="CVE-2021-41773" label="Copy CVE" />
```
