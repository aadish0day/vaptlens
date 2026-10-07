---
category: Filtering
---
# TagInput

Free-form token input: Enter, comma or paste adds; Backspace removes the last tag.

## Props

```ts
{
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
  /** maximum number of tags */
  max?: number;
  /** return true, or an error message string */
  validate?: (tag: string) => true | string | false;
  disabled?: boolean;
  className?: string;
}
```

## Example

```jsx
<TagInput label="Scope (CIDR or host)" defaultValue={['10.100.1.0/24', 'app.internal.corp']} hint="Press Enter to add." />
```
