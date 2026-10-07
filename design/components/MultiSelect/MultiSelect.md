---
category: Filtering
---
# MultiSelect

Dropdown multi-select for high-cardinality slicers (Host, Port, Tool, Scan batch) and Column Mapper field pickers.

**Provide:** `options` (strings or `{value, label, severity, count}`), `value` + `onChange` (or `defaultValue`), optional `label` ("Host"), `placeholder` (shown when nothing is selected, default "All").

- The trigger summarises: "All", the single value, or "3 selected". The menu lists `Checkbox` rows with facet counts.
- Put a search `Input` at the top of the menu above ~12 options (app responsibility).
