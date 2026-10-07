---
category: Workflow
---
# Wizard

Multi-step flow with a step rail, Back/Next and a final submit. A step can `validate()` → `true` or an error string; `onSubmit` may return a promise.

## Props

```ts
{
  steps: Array<{ title: string; description?: string; content: React.ReactNode; optional?: boolean; validate?: () => true | string | false }>;
  step?: number;
  defaultStep?: number;
  onStepChange?: (index: number) => void;
  onSubmit?: () => void | Promise<unknown>;
  onCancel?: () => void;
  submitLabel?: string;
}
```

## Example

```jsx
<Wizard submitLabel="Create engagement" onCancel={close} onSubmit={save} steps={[{ title: 'Scope', content: <TagInput label="Targets" /> }, { title: 'Schedule', content: <DateRangePicker label="Window" /> }, { title: 'Review', content: <p>…</p> }]} />
```
