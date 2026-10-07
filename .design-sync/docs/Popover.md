---
category: Overlays
---
# Popover

Click-triggered floating panel anchored to its trigger; Escape or outside click closes it. `children` may be a function receiving `close`.

## Props

```ts
{
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  title?: string;
  side?: 'bottom' | 'top';
  align?: 'start' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** class for the trigger button (default "vl-pop-trigger"); e.g. "vl-btn vl-btn-secondary vl-btn-sm" */
  triggerClassName?: string;
}
```

## Example

```jsx
<Popover trigger="Columns" triggerClassName="vl-btn vl-btn-secondary vl-btn-sm" title="Visible columns">{(close) => <Button size="sm" onClick={close}>Done</Button>}</Popover>
```
