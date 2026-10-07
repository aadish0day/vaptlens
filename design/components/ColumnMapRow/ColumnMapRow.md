---
category: Ingestion
---
# ColumnMapRow

One row of the Column Mapper: a canonical field, the CSV header mapped to it, and a sample value.

**Provide:** `field` (one of host, severity, cvss, name, url, cve, port, protocol, description, solution, pluginId, scanDate), `header` (mapped CSV header or empty), `options` (the CSV's headers), `sample` (first non-empty value), `required`, `onChange(header | null)`.

- The picker is a native `<select>` ("Not mapped" plus every header), so it works with the keyboard and screen readers and on phones. With `onChange` it is controlled; without, it keeps its own value.
- A required field with no header gets a danger border and the "Map a column to continue" hint.
- Below 640px the three columns stack.

- `host`, `severity` (or `cvss`) and `name` are required. An unmapped required field turns its picker border and note `status-danger`, and the Import button stays disabled.
- Pre-fill from the 28-token fuzzy guess; the user confirms.
