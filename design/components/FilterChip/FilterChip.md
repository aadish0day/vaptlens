---
category: Filtering
---
# FilterChip

A removable active-filter chip for the Filter Chips bar under the slicer panel.

**Provide:** `value`, optional `field` (the dimension label: "Host", "Tool", "Port"), optional `severity` (adds a 3px severity edge for severity filters), `onRemove`.

- Grounded in `lens-soft` so active filters read as the brand's selection color.
- One chip per field value. Cross-filter clicks replace that field's chip, never add a second.
- End the bar with a `ghost` `sm` "Clear all" `Button` when two or more chips are showing.
- The remove button's accessible name is "Remove filter <field>: <value>".
