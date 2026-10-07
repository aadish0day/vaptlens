---
category: Ingestion
---
# ScannerBadge

Shows which scanner preset was auto-detected from a CSV's headers, and how confidently.

**Provide:** `tool` (preset name), `matched` / `total` (signature headers found / in the preset).

- Detection needs at least 2 matching headers. Below that, it reads "Unrecognised CSV" in `status-warn` and the Column Mapper opens.
- Place it next to the file name in the Upload list and in the scan batch picker.
