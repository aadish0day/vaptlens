---
category: Filtering
---
# QueryBuilder

Rule builder (field · operator · value rows, match ALL or ANY). Controlled: pass `value` and `onChange`. Operators per field type: text (contains, not_contains, eq, neq, starts, regex), number (gte, lte, eq, neq, between), enum (in, not_in), bool (is_true, is_false), date (after, before, within).

## Props

```ts
{
  fields: Array<{ key: string; label: string; type: 'text' | 'number' | 'enum' | 'bool' | 'date'; options?: Array<string | { value: string; label: string }> }>;
  value: { match: 'all' | 'any'; rules: Array<{ field: string; op: string; value?: unknown }> };
  onChange: (value: QueryBuilderProps['value']) => void;
  /** shows "N matches" in the header */
  count?: number;
}
```

## Example

```jsx
<QueryBuilder count={38} fields={[{ key: 'severity', label: 'Severity', type: 'enum', options: ['critical', 'high', 'medium'] }, { key: 'cvss', label: 'CVSS', type: 'number' }]} value={{ match: 'all', rules: [{ field: 'severity', op: 'in', value: ['critical'] }, { field: 'cvss', op: 'gte', value: '9' }] }} onChange={setQuery} />
```
