---
category: Navigation
---
# Breadcrumbs

Trail of parent pages; the last item is the current page.

## Props

```ts
{
  items: Array<{ label: React.ReactNode; onClick?: () => void }>;
  /** aria-label for the nav (default "Breadcrumb") */
  label?: string;
}
```

## Example

```jsx
<Breadcrumbs items={[{ label: 'Workspaces', onClick: goHome }, { label: 'Q3 external test', onClick: goWs }, { label: 'Apache Tomcat RCE' }]} />
```
