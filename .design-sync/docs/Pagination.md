---
category: Navigation
---
# Pagination

Page controls with range readout ("26–50 of 212") and an optional rows-per-page picker. `page` is 1-based and controlled.

## Props

```ts
{
  total: number;
  page: number;
  onChange: (page: number) => void;
  pageSize?: number;
  /** shows the rows-per-page select when set */
  onPageSizeChange?: (size: number) => void;
  pageSizes?: number[];
  label?: string;
}
```

## Example

```jsx
<Pagination total={212} page={page} pageSize={25} onChange={setPage} onPageSizeChange={setSize} />
```
