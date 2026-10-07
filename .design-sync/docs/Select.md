---
category: Filtering
---
# Select

Single-choice dropdown (listbox) with optional type-to-filter. Use `MultiSelect` for several values.

## Props

```ts
{
  options: Array<string | { value: string; label: React.ReactNode; description?: string; disabled?: boolean }>;
  value?: string | null;
  defaultValue?: string;
  onChange?: (value: string, option: object) => void;
  /** inline label shown inside the trigger */
  label?: string;
  placeholder?: string;
  /** adds a filter box at the top of the menu */
  filterable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  className?: string;
}
```

## Example

```jsx
<Select label="Owner" placeholder="Unassigned" filterable options={[{ value: 'srv', label: 'Server Team', description: '14 open' }, { value: 'app', label: 'Application Dev' }]} value={owner} onChange={setOwner} />
```
