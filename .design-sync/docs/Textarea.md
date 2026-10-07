---
category: Filtering
---
# Textarea

Multi-line text field with label, hint, error and character counter. Other props pass through to `<textarea>`.

## Props

```ts
{
  label?: string;
  hint?: string;
  /** replaces the hint and marks the field invalid */
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength?: number;
  /** show the counter even without maxLength */
  showCount?: boolean;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  id?: string;
  className?: string;
}
```

## Example

```jsx
<Textarea label="Risk acceptance reason" required maxLength={500} hint="Shown to auditors." value={text} onChange={(e) => setText(e.target.value)} />
```
