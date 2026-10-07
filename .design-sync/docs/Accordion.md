---
category: Layout
---
# Accordion

Collapsible sections. One open at a time unless `multiple`.

## Props

```ts
{
  sections: Array<{ id: string; title: React.ReactNode; meta?: React.ReactNode; content: React.ReactNode }>;
  /** ids open initially */
  defaultOpen?: string[];
  /** controlled open ids */
  open?: string[];
  onChange?: (openIds: string[]) => void;
  multiple?: boolean;
}
```

## Example

```jsx
<Accordion defaultOpen={['ev']} sections={[{ id: 'ev', title: 'Evidence', meta: '3 files', content: <p>…</p> }, { id: 'fix', title: 'Remediation', content: <p>…</p> }]} />
```
