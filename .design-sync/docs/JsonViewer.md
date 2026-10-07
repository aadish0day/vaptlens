---
category: Data display
---
# JsonViewer

Collapsible JSON tree (for raw scanner output and evidence) with a copy button. Accepts an object or a JSON string.

## Props

```ts
{
  data: unknown;
  title?: string;
  /** levels expanded initially (default 1) */
  openDepth?: number;
}
```

## Example

```jsx
<JsonViewer title="plugin_output" openDepth={2} data={{ plugin_id: 57582, port: 443, cves: ['CVE-2021-41773'] }} />
```
