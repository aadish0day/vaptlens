---
category: Ingestion
---
# FileDropzone

The scan-upload target on the empty dashboard and in the Upload dialog.

**Provide:** `state` (`idle` | `parsing` | `error`; drag-over is handled internally), `onFiles(FileList)`, `onBrowse`, and, while parsing, `fileName`, `progress` (0–100) and `rows`; on error, `error` (what broke).

- It always states that files stay local ("Files never leave this machine"). This line is the product's promise, so don't remove it.
- Drag-over turns the zone `lens-soft` with a solid `lens` border. Errors turn the border `status-danger` and name the problem ("Couldn't parse row 88: unbalanced quote").
- Accepts several files in one drop. The hint lists the supported formats: CSV from the 10 scanner presets, `.nessus`, OpenVAS/Greenbone XML, Burp XML, ZAP JSON/XML, Nuclei JSON/JSONL, Nikto JSON/XML, Wapiti JSON, Dependency-Check JSON, Trivy JSON, SARIF (Semgrep, CodeQL, Snyk…) and Nmap XML. Unknown CSV or JSON goes to the Column Mapper, not to an error.
- After a drop, show one row per file (name, size, detected format as a `ScannerBadge`, finding count, or the error) with a remove button, then "Add files" and "Import N findings from M files". Let the user choose "New scan batch" or "Merge into <latest>".
