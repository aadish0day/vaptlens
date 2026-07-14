# VAPTLens — Universal VAPT Scan Analytics

A **client-side, Power BI-style dashboard** for vulnerability scan data. Drop in a CSV
export from *any* scanner, and explore the results on a draggable, cross-filtering canvas —
no backend, no uploads, **your scan data never leaves the browser**.

Built with Vite + React + TypeScript, `recharts`, `zustand`, `react-grid-layout`, and `papaparse`.

---

## Quick start

### Dev

```bash
npm install
npm run dev      # http://localhost:5173
```

### Docker (no build tooling needed)

```bash
docker compose up --build
# open http://localhost:8080
```

---

## How it works

1. **Upload** one or more CSVs (Nessus, OpenVAS/Greenbone, Qualys, Burp Suite, OWASP ZAP,
   Nikto, or anything else). Each file becomes a labeled *scan batch*.
2. The importer **auto-detects** the tool from its headers. If nothing matches, you get a
   manual column mapper with best-guess defaults — and you can save the mapping as a named
   preset for next time.
3. Every row is normalized into a common schema: a single 5-level severity scale
   (`Critical / High / Medium / Low / Info`), CVSS, CVE, host, port, tool, scan date.
4. Build your canvas: **drag, resize, remove, and add** widgets. Pick from the template
   gallery or build a chart from scratch (any field → any axis → any chart type).
5. Everything reacts to a shared **slicer panel** (severity, host, tool, port, scan,
   date range, free text) and to **click-driven cross-filters** — click a bar, slice, or
   point in any chart and every other widget + the findings table filters to match.

The whole thing is powered by one `aggregate()` function — templates and the custom widget
builder are the same engine, so they behave identically.

---

## Exporting CSVs from each tool

| Tool | How to get the CSV |
|---|---|
| **Nessus** | In a scan, go to *Results* → *Export* → **CSV** (not `.nessus`). Columns like `Host`, `Plugin ID`, `Risk`, `CVSS`, `CVE` are detected automatically. |
| **OpenVAS / Greenbone** | *Reports* → *Downloads* → **CSV**. Look for `IP`, `NVT`, `OID`, `Threat`, `CVSS`. |
| **Qualys** | *Vulnerability Management* → *Reports* → export as **CSV**. Severity is numeric (1–5) and is mapped automatically. |
| **Burp Suite** | *Target* / *Issue activity* → right-click → **Save selected issues** → **CSV**. |
| **OWASP ZAP** | *Alerts* tab → *Export* → **CSV**. |
| **Nikto** | Run with `-Format csv -o nikto.csv` (e.g. `nikto -h target -Format csv -o nikto.csv`). |
| **Anything else** | Any CSV with a host column (and ideally a severity/cvss column) works. The manual mapper handles the rest. |

If a file isn't recognized, the column mapper opens with sensible guesses. Required column:
a **Host / IP** column. Severity is derived from a severity column if present, otherwise
from CVSS (`≥9 Critical`, `≥7 High`, `≥4 Medium`, `>0 Low`, else `Info`).

---

## Using the widget builder

Click **+ Add Widget**. Choose:

- **Chart type** — Bar, Donut, Line, Histogram, Table, or KPI.
- **Group by** — the category axis (severity, host, tool, port, CVSS band, scan date, …).
- **Aggregation** — Count, Average/Max CVSS, Distinct hosts, Distinct findings.
- **Color / split by** (optional) — adds a stacked/series breakdown (e.g. split a host bar
  by severity).
- **Top N / Sort by** — for ranking charts.

A **live preview** updates as you change options. Adding it drops the widget onto the canvas
where you can drag, resize, or remove it.

The **Template Gallery** adds the same configs pre-filled (severity donut, top-10 hosts,
recurring findings, port distribution, CVSS histogram, tool comparison, and a trend line that
enables itself once you have 2+ dated scans).

Layout — which widgets exist and where they sit — is saved to `localStorage` and survives
reloads.

---

## Project layout

```
src/
  lib/            types, tool presets + severity normalization, CSV parser, the BI engine, storage
  store/          zustand store (findings, filters, widgets/layout, actions)
  components/      UploadZone, ColumnMapper, SlicerPanel, FilterChips, WidgetBuilder,
                   TemplateGallery, DashboardCanvas, Widget, VulnTable, charts/
  App.tsx         terminal-banner shell + layout + one-time scanline sweep on import
```

---

## Privacy

This app makes **no network requests** with your data. All parsing, aggregation, and storage
happen locally in the browser. You can confirm this by watching the Network tab while
uploading — only the static app assets load.
