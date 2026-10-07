# VAPTLens — Comprehensive Feature & Architectural Specification

VAPTLens is an enterprise-grade, **zero-trust, client-side Vulnerability Assessment & Penetration Testing (VAPT) scan analytics platform** (Power BI-style). It processes, analyzes, correlates, and visualizes vulnerability scan data entirely in the browser using Web standard APIs. **No scan findings, hostnames, or credentials ever leave the local machine.**

> The source specification, kept verbatim except that math notation is written out in plain text. The Spec coverage section maps each part to this design system's components and tokens.

## Contents

1. Core Architecture & Technology Stack
2. Data Ingestion, Scanner Presets & Normalization Engine
3. Core BI Aggregation & Slicing Engine
4. Risk Scoring Formulas & Threat Intelligence Heuristics
5. The Eight Primary Application Views (5.1 Dashboard Canvas & Grid Engine · 5.2 Asset Inventory & Crown Jewels · 5.3 Governance, SLA & RACI Matrix · 5.4 Prioritization Matrix · 5.5 Remediation Board · 5.6 Subnet Network Topology Map · 5.7 Re-Test Verification & Differential Auditor · 5.8 Executive Report Builder & Exporters)
6. Interactive Chart Visualizers Catalog (13 Engines)
7. Vulnerability Table, Noise Deduplication & Details Drawer
8. Automated Remediation Code & Config Snippets
9. Role-Based Access Control (RBAC) & Governance Audit Trails
10. Client-Side State Management & Persistence Schema
11. Multi-Quarter Historical Sample Dataset
12. Project File Tree & Module Mapping

---

## 1. Core Architecture & Technology Stack

- **Framework**: React 18 + TypeScript + Vite.
- **State Management**: Zustand 5 with synchronized local storage persistence.
- **Styling & Design Tokens**: Tailwind CSS v4 + Radix UI primitives (`@radix-ui/react-*`), Lucide Icons, and `@fontsource/inter` / `@fontsource/jetbrains-mono`.
- **Canvas & Layout**: `react-grid-layout` with responsive column compaction and resize observers.
- **Visualization Suite**: Recharts 2 + custom SVG renderers (Radial Network Map, Treemap Cells, Heatmap Matrix).
- **Data Parsing & Generation**: PapaParse (CSV sniffing/chunking), `html-to-image` (high-DPI canvas capture), and `jspdf` (client-side PDF synthesis).
- **Privacy & Security Guarantee**: Zero backend requirements. Static files served via Nginx or local dev server; scan ingestion, normalization, filtering, and exports occur strictly in browser memory.

---

## 2. Data Ingestion, Scanner Presets & Normalization Engine

### 2.1 Multi-Scanner Header Signature Auto-Detection
*Source Files*: `src/lib/presets.ts`, `src/lib/parseCsv.ts`

When a CSV file is dropped into VAPTLens, the engine inspects the trimmed header set against preset signatures with a threshold of ≥ 2 header matches (`detectTool`).

| Scanner Preset | Header Signatures | Key Column Mappings |
| :--- | :--- | :--- |
| **Tenable Nessus** | `Plugin ID`, `Plugin Name`, `Risk`, `CVE`, `See Also` | `host` → Host, `severity` → Risk, `cvss` → CVSS, `cve` → CVE, `pluginId` → Plugin ID, `name` → Plugin Name, `solution` → Solution, `port` → Port, `protocol` → Protocol |
| **OpenVAS / Greenbone** | `NVT`, `OID`, `Threat`, `QoD` | `host` → IP, `severity` → Threat, `cvss` → CVSS, `cve` → CVEs, `pluginId` → OID, `name` → NVT, `description` → Summary |
| **Qualys VM** | `QID`, `Title`, `Severity`, `Solution` | `host` → IP, `severity` → Severity (numeric 1–5), `cvss` → CVSS_Base, `pluginId` → QID, `name` → Title |
| **PortSwigger Burp Suite** | `Issue type`, `Issue Detail`, `Host`, `Path`, `Severity`, `Confidence` | `host` → Host, `severity` → Severity, `name` → Issue type, `description` → Issue Detail, `port` → Port |
| **OWASP ZAP** | `Alert`, `Risk`, `CWE ID`, `URL`, `Confidence` | `host` → URL, `severity` → Risk, `name` → Alert, `description` → Description, `cve` → CWE ID |
| **Nikto Web Scanner** | `OSVDB`, `Target IP`, `Target Hostname`, `URI` | `host` → Target Hostname, `name` → Description, `port` → Port, `pluginId` → OSVDB |
| **Acunetix** | `Vulnerability`, `CVSS3`, `CWE`, `CVE`, `Solution`, `Plugin` | `host` → Host, `severity` → Severity, `cvss` → CVSS3, `cve` → CVE, `name` → Vulnerability, `solution` → Solution |
| **Wapiti** | `module`, `http_request`, `http_response`, `wstg`, `references`, `cwe` | `severity` → severity, `name` → name, `cve` → cwe, `host` defaults to `"unknown-host"` |
| **ProjectDiscovery Nuclei** | `template-id`, `info.name`, `info.severity`, `matched-at`, `matcher-name` | `host` → host, `port` → port, `name` → info.name, `severity` → info.severity, `url` → url, `pluginId` → template-id |
| **OWASP Dependency-Check** | `Vulnerable Software`, `CVSSv2`, `CVSSv3`, `CWE`, `Notes`, `References` | `name` → Vulnerable Software, `severity` → Severity, `cvss` → CVSSv3, `cve` → CVE |

### 2.2 Heuristic Fallback & Custom Column Mapper
*Source Files*: `src/components/ColumnMapper.tsx`, `src/lib/presets.ts`

- **Fuzzy Token Matching (`guessMapping`)**: When automatic signature detection fails, a 28-token dictionary scans header strings (`host`, `ip`, `target`, `sev`, `risk`, `cvss`, `cve`, `alert`, `desc`, `sol`, `port`, `plugin`, `date`, etc.) to generate preliminary mappings.
- **Manual Column Mapper UI**: Renders a dedicated modal for unrecognized CSVs allowing mapping across 12 canonical target fields (`host`, `severity`, `cvss`, `name`, `url`, `cve`, `port`, `protocol`, `description`, `solution`, `pluginId`, `scanDate`).
- **Saved Mapping Presets**: Users can name custom column mappings and persist them to `localStorage` (`vaptlens.mappings.v1`), allowing single-click application on subsequent uploads.

### 2.3 Data Normalization Pipeline
- **Unified 5-Level Severity**: Normalizes all external strings and numbers into `Critical`, `High`, `Medium`, `Low`, or `Info`.
- **CVSS Score Derivation Fallback (`deriveFromCvss`)**:
  - ≥ 9.0 ⇒ Critical
  - ≥ 7.0 ⇒ High
  - ≥ 4.0 ⇒ Medium
  - > 0.0 ⇒ Low
  - 0.0 or undefined ⇒ Info
- **List & Delimiter Parsing**: CVE/CWE strings are split on commas, semicolons, and pipes, trimmed, and unnested into arrays.
- **Encoding & Delimiter Sniffing**: PapaParse automatically detects commas, tabs, semicolons, and pipe delimiters while gracefully handling multi-line strings and quotes.

---

## 3. Core BI Aggregation & Slicing Engine

*Source Files*: `src/lib/aggregate.ts`, `src/store/useDashboardStore.ts`

The analytics core is driven by a single unified function:

```typescript
aggregate(findings: Finding[], input: AggInput): AggregateOutput
```

### 3.1 25 Analytic Dimensions (`FieldKey`)
1. `severity` (Critical, High, Medium, Low, Info)
2. `host` (Target IP or FQDN)
3. `tool` (Scanning tool name)
4. `scanLabel` (Scan batch name)
5. `port` (Target network port)
6. `protocol` (tcp, udp)
7. `cve` (Unnested individual CVE IDs)
8. `pluginId` (Plugin/QID/OID identifier)
9. `name` (Vulnerability title)
10. `cvssBucket` (`0.0`, `0.1–3.9`, `4.0–6.9`, `7.0–8.9`, `9.0–10.0`)
11. `scanDate` (YYYY-MM-DD date)
12. `scanMonth` (Formatted month-year e.g., `"Nov 2025"`, `"Feb 2026"`)
13. `lifecycle` (`New`, `Open`, `Fixed`)
14. `slaStatus` (`Met`, `Breached`)
15. `isExploitable` (`Exploitable`, `Not Exploitable`)
16. `isEol` (`EOL/Obsolete`, `Supported`)
17. `isZeroDay` (`Zero-day`, `Known`)
18. `unpatchedAge` (`Unpatched > 6 Months`, `Unpatched < 6 Months`)
19. `url` (Target endpoint URI)
20. `owaspCategory` (OWASP Top 10 2021 classifications)
21. `agingBucket` (`0–30 Days`, `31–90 Days`, `91–180 Days`, `180+ Days`, `Remediated`)
22. `subnet` (Extracted CIDR /24 or External Asset)
23. `cisaKev` (`CISA KEV`, `Not in KEV`)
24. `ransomwareVector` (`Ransomware Threat`, `Standard Risk`)
25. `publicExploit` (`Public Exploit (PoC/Metasploit)`, `No Public Exploit`)

### 3.2 Aggregation Metrics (`computeMeasure`)
- `count`: Total active vulnerability occurrences.
- `avgCvss`: Mean CVSS score across matching items.
- `maxCvss`: Maximum CVSS score in the group.
- `distinctHosts`: Count of unique target hosts.
- `distinctFindings`: Count of unique vulnerability names.
- **Active vs. Fixed Isolation**: Unless explicitly grouping by `lifecycle`, findings with `lifecycle === "Fixed"` are excluded from counts and CVSS calculations to prevent resolved items from distorting active posture.

### 3.3 Dynamic Cross-Filtering & Global Slicing
- **Conjunctive Filtering (`applyFilters`)**: Applies strict `AND` evaluation across severities, hosts, tools, ports, scan batch IDs, date bounds, free text, and dynamic cross-filters.
- **Single-Select Replacement**: Clicking a chart element updates cross-filters for that field, replacing existing values for that field rather than appending to avoid invalid Boolean intersections.
- **Slicer Panel (`SlicerPanel.tsx`)**: Quick-filter toggles for CISA KEV, Ransomware Threat, 0-Day, EOL, and >6 Months unpatched findings, alongside date presets (`7 Days`, `15 Days`, `30 Weeks`, `6 Months`).
- **Filter Chips Bar (`FilterChips.tsx`)**: Animated status bar showing active filters with color-coded severity borders and one-click removal.

---

## 4. Risk Scoring Formulas & Threat Intelligence Heuristics

*Source Files*: `src/lib/risk.ts`, `src/lib/aggregate.ts`

### 4.1 Finding-Level Compounded Risk Formula
VAPTLens computes individual vulnerability risk using a base severity weight plus CVSS score, scaled multiplicatively by threat attributes:

```
Base Score = SEVERITY_WEIGHT[severity] + (CVSS ?? 0)
```

**Base Severity Weights**: `Critical` 10 · `High` 7 · `Medium` 5 · `Low` 3 · `Info` 1

**Compounding Multipliers**:
- **Exploitable** (`isExploitable === "Exploitable"`): × 1.6
- **CISA KEV** (`cisaKev === "CISA KEV"`): × 1.5
- **Zero-Day** (`isZeroDay === "Zero-day"`): × 1.4
- **Ransomware Threat Vector** (`ransomwareVector === "Ransomware Threat"`): × 1.3
- **EOL / Obsolete Software** (`isEol === "EOL/Obsolete"`): × 1.2
- **SLA Breached** (`slaStatus === "Breached"`): × 1.25
- **Unpatched > 6 Months** (`unpatchedAge === "Unpatched > 6 Months"`): × 1.1
- **Fixed** (`lifecycle === "Fixed"`): Contribution immediately sets to **0**.

```
Final Finding Risk = round( Base Score × ∏ Multipliers )
```
*(Theoretical maximum for a single finding: ≈ 193.54)*

### 4.2 Host-Level Weighted Risk Score
A host's cumulative risk score is the integer sum of active finding risk contributions:

```
HostRiskScore(h) = round( Σ f ∈ Active(h) findingRiskContribution(f) )
```

### 4.3 Threat Intelligence Heuristics
- **Exploitability Engine (`computeExploitability`)**: Evaluates titles, descriptions, and solutions. Awards points for CVE existence (+2), CVSS ≥ 9.0 (+2), high-risk keywords like RCE, SQLi, deserialization, Metasploit, PoC (+2), and penalizes purely informational items (−2). Scores ≥ 3 classify as `Exploitable`.
- **CISA KEV Matcher**: Regex matching known weaponized campaigns (Log4Shell, EternalBlue, ProxyShell, Spring4Shell, MOVEit, CitrixBleed) or CVSS ≥ 9.0 + `Exploitable`.
- **Ransomware Vectors**: Flags SMBv1, EternalBlue, unauthenticated RCE, default credentials, exposed RDP, and VPN vulnerabilities.
- **EOL Software Rules (`EOL_VERSION_RULES`)**: Pattern matching 37 regexes plus semantic version evaluation for PHP (< 8.0, 8.1), Node.js (≤ 20), Python (≤ 3.9), Ubuntu (< 22.04), Debian (≤ 10), PostgreSQL (≤ 13), MySQL (≤ 8.0), and OpenSSL (≤ 1.1.1).
- **OWASP Top 10 (2021) Mapping**: Ordered evaluation categorizing issues into A01–A10 (Injection, Cryptographic Failures, Broken Access Control, SSRF, etc.).

---

## 5. The Eight Primary Application Views

### 5.1 Dashboard Canvas & Grid Engine
*Source Files*: `src/components/DashboardCanvas.tsx`, `src/components/WidgetBuilder.tsx`, `src/components/TemplateGallery.tsx`
- **12-Column Responsive Drag-and-Drop Canvas (`react-grid-layout`)**: Freely position, resize, and remove analytical widgets. Features drag handles on card headers, south-east resize handles, vertical compaction, and persistence in `localStorage`. Automatically collapses into a single-column layout on mobile viewports (< 768px).
- **Top Breach Headlines Row**: Pinned two-column executive telemetry header featuring `TopCriticalBreachWidget` (ranks top 10 exploitable breach risks with CISA KEV and Zero-day tags) and `BreachBreakdownWidget` (threat exposure meters).
- **Custom Widget Builder**: Build custom charts by selecting chart type (13 options), grouping dimension (21 options), aggregation measure (5 options), secondary series splits (`colorBy`), stacked vs. grouped layout toggles, top-N cardinality limits, and sort directions with real-time live preview.
- **Template Gallery (17 Security Templates)**: Instant one-click deployment of pre-configured charts. Time-series templates (e.g. Trend Over Time) dynamically disable and lock with a tooltip if fewer than 2 dated scan batches exist.

### 5.2 Asset Inventory & Crown Jewels
*Source Files*: `src/components/AssetInventory.tsx`, `src/components/HostRiskLeaderboard.tsx`, `src/components/ExposureRegistry.tsx`
- **Automated Host Profiling**: Analyzes finding distribution to classify infrastructure:
  - **Asset Tiers**: Tier 1 (Crown Jewel: ≥ 1 Critical finding, hostname containing "prod", or database), Tier 2 (Production: ≥ 1 High finding), Tier 3 (Dev/Staging).
  - **Device Type**: Matches keywords to identify Database, API Gateway, Domain Controller, or Web Server.
  - **Owner Team**: Automatically maps initial ownership by asset type.
  - **OS & EOL Detection**: Flags Linux vs. Windows and End-of-Life systems.
- **Host Risk Leaderboard**: Displays top 8 vulnerable hosts with relative risk gauges, telemetry micro-badges (Criticals, Exploits, KEV, 0-day, Ransomware, Breaches), and a slide-out host triage drawer with URL deep-linking (`?host=<ip>`).
- **Exposure Registry**: Catalog of End-of-Life (EOL) technologies and Zero-day exposures with affected host counts and critical totals.

### 5.3 Governance, SLA & RACI Matrix
*Source Files*: `src/components/GovernanceSLA.tsx`, `src/lib/raci.ts`, `src/components/TrendsDeep.tsx`
- **SLA Threshold Engine**: Enforces corporate remediation timelines: Critical 14 days · High 30 days · Medium 90 days · Low 180 days · Info 360 days.
- **C.H.I. (Critical / High / Important) SLA Projection Table**: Summarizes active findings, breached count, at-risk count (≤ 7 days left), and average days remaining.
- **SLA Compliance Trajectory**: Displays overall compliance % and monthly trend sparkbars (Emerald ≥ 80%, Amber 50–79%, Crimson < 50%).
- **RACI Assignment Matrix (`buildRaciMatrix`)**: Coordinates vulnerability ownership across 5 teams (`Server Team`, `DevOps / Cloud`, `Database DBAs`, `SecOps`, `Application Dev`) across RACI roles (`Responsible`, `Accountable`, `Consulted`, `Informed`).
- **Automated Ticket Dispatcher**: One-click bulk action to identify unassigned Critical vulnerabilities, assign them to the Server Team, advance status to `Assigned`, generate `SEC-XXXX` ticket IDs, and log audit entries.
- **Deep Trend Analytics (`TrendsDeep`)**:
  - Stacked bar chart of vulnerability aging across scan months (`0–30 Days`, `31–90 Days`, `91–180 Days`, `180+ Days`).
  - Multi-line chart tracking threat trajectories (CISA KEV, Zero-day, Ransomware, Exploitable).

### 5.4 Prioritization Matrix (2×2 Decision Grid)
*Source Files*: `src/components/PrioritizationMatrix.tsx`
- **Effort Scorer (1.0 to 10.0)**: Heuristic scoring engine evaluating fix complexity (e.g. registry tweaks/headers score Low Effort ≈ 2.0–3.0; OS migrations/re-architecting score High Effort ≈ 7.0–8.0).
- **Four Decision Quadrants**:
  1. **Quick Wins** (*High Risk / Low Effort*): Highest priority, immediate patching.
  2. **Strategic** (*High Risk / High Effort*): Dedicated re-architecture sprints.
  3. **Mundane Fixes** (*Low Risk / Low Effort*): Routine maintenance.
  4. **Deferrable** (*Low Risk / High Effort*): Deprioritize into backlog.
- **Interactive Triage Sidebar**: Selecting any quadrant filters the active triage queue, displays visual effort meters, and allows 1-click cross-filtering.

### 5.5 Remediation Board (Kanban & Patch Pipeline)
*Source Files*: `src/components/RemediationBoard.tsx`
- **4-Column Kanban Workflow**: Columns for `To Do`, `In Progress`, `In Review`, and `Remediated`. Cards can be moved forward/backward via chevron buttons.
- **5-Stage Enterprise Patch Pipeline**: Header progress tracker showing active counts across `Unassigned` → `Assigned` → `In Progress` → `Pending Verification` → `Resolved`.
- **Governance Audit Trail Drawer**: Chronological log of team assignments, ticket creation events, and status transitions (stores up to 200 entries with ISO timestamps and user role tags).

### 5.6 Subnet Network Topology Map
*Source Files*: `src/components/NetworkMap.tsx`
- **Radial SVG Topology Graph**:
  - Central scanner engine core node (`x: 320, y: 240`).
  - First concentric ring (R₁ = 125px) for CIDR `/24` subnets and external zones.
  - Outer cluster ring (R₂ = 45px) for individual target hosts.
  - Node radii scale logarithmically with finding volume: `r = min(12, 6 + log₂(count + 1) × 2)`.
  - Animated pulsing SVG stroke dashes on scanning links.
- **Node Intelligence Sidebar**: Clicking any host reveals its profile, device badge, finding counts, host filter toggle, and vulnerability list with clickable severity filters.

### 5.7 Re-Test Verification & Differential Auditor
*Source Files*: `src/components/DeltaAnalysis.tsx`
- **Scan-to-Scan Differential Engine**: Select Baseline Scan A vs. Re-test Scan B to verify remediation efficacy.
- **Finding Keying & Classification**: Matches on `${host}|${name.toLowerCase()}|${port}`:
  - **Verified Remediated / Fixed**: Existed in Scan A, absent in Scan B.
  - **New Introduced Risk**: Absent in Scan A, newly appeared in Scan B.
  - **Persistent / Unpatched**: Detected in both scans.
- **Net Risk Delta Percentage**:

  ```
  RiskDeltaPct = round( (Σ CVSS_B − Σ CVSS_A) / Σ CVSS_A × 100 ) %
  ```
- **CSV Verification Export**: Generates and downloads RFC 4180-compliant audit CSV files (`vaptlens-retest-verification-*.csv`).

### 5.8 Executive Report Builder & Exporters
*Source Files*: `src/components/ReportBuilder.tsx`, `src/lib/exporter.ts`, `src/components/ExportMenu.tsx`
- **Executive Report Builder**: Interactive document editor with 3 themes (`slate`, `navy`, `crimson`) and 9 structured audit sections:
  1. Cover Page & Active Threat Index
  2. Executive Summary Narrative
  3. Scope & Zero-Trust Client Methodology
  4. Vulnerability Distribution Metrics
  5. SLA Compliance & C.H.I. Projection Table
  6. Most Vulnerable Hosts Leaderboard
  7. Threat-Intel & Exploitability Trends
  8. RACI Responsibility Matrix
  9. Six-Month VA Window & Top 20 Unpatched Risks
  10. Detailed Findings Ledger (top 50 prioritized findings)
- **High-DPI Canvas Exporters**:
  - **PNG Export (`exportDashboardPng`)**: Generates 2x pixel-ratio captures via `html-to-image`, filtering out UI controls.
  - **PDF Export (`exportDashboardPdf`)**: Generates print-ready PDFs via `jsPDF` with automatic landscape/portrait aspect ratio selection.

---

## 6. Interactive Chart Visualizers Catalog (13 Engines)

Located in `src/components/charts/*`:

| Component | Rendering Engine | Data Transformation | Interactions & Visual Features |
| :--- | :--- | :--- | :--- |
| **`BarChartWidget`** | Recharts `BarChart` | Multi-series pivot data | Stacked or grouped bars, auto-rotated labels (−35°) on high cardinality, click-to-filter. |
| **`DonutChartWidget`** | Recharts `PieChart` | Calculated proportions | Inner radius 58%, central total counter, slice cross-filtering, 2° padding angles. |
| **`AreaChartWidget`** | Recharts `AreaChart` | Time-series / category pivot | SVG linear gradients, crosshair cursor tracking, click-to-filter on data areas. |
| **`LineChartWidget`** | Recharts `LineChart` | Sequential pivot data | Monotone curves, active dots expand to radius 4.5 on hover, click-to-filter on points. |
| **`RadarChartWidget`** | Recharts `RadarChart` | Multi-axis polar pivot | Semi-transparent polygon fills (opacity 0.18), stroke width 2, vertex cross-filtering. |
| **`TreemapWidget`** | Recharts `Treemap` + custom SVG | Hierarchical counts | Custom SVG rounded cells (`rx: 8`), white font labels, proportional sizing, click-to-filter. |
| **`HeatmapWidget`** | CSS Grid Matrix | Host vs. Severity 2D grid | Dynamic cell background opacity (`0.14 + 0.74 * ratio`), hover effects, row cross-filtering. |
| **`ScatterChartWidget`** | Recharts `ScatterChart` | Numeric coordinate points | X-axis CVSS (0–10) vs. Y-axis category, color-coded severity dots, point cross-filtering. |
| **`HistogramWidget`** | Recharts `BarChart` | CVSS bucket distribution | Tight 4% category gap and max bar size 48px to simulate continuous histograms. |
| **`KpiCardWidget`** | React + Tailwind | Aggregated metric scalar | Prominent metric numbers with domain icons and active filter ring indicator when matched. |
| **`SlaBreachKpiWidget`** | Custom Enterprise Card | Breached finding subsets | Total breach counter with status icon and 5-tier severity breakdown list with filter triggers. |
| **`HostRiskWidget`** | Custom List Meter | Sum of finding risk weights | Ranks top 5 hosts with critical counts, numeric risk scores, and color-coded risk meter bars. |
| **`TopCriticalBreachWidget`** / **`BreachBreakdownWidget`** | Custom Telemetry Cards | Evaluates KEV, 0-day, Ransomware | Displays top 10 exploitable breach risks with fire/skull badges and horizontal exposure progress bars. |

---

## 7. Vulnerability Table, Noise Deduplication & Details Drawer

*Source File*: `src/components/VulnTable.tsx`

### 7.1 Data Grid Features
- **Multi-Column Sorting**: Sort by severity priority (`Critical` → `Info`), host, lifecycle, title, CVSS, and tool.
- **Search & In-Table Filtering**: Real-time filtering across hostnames, vulnerability titles, and CVE identifiers.
- **"Group Noise" Deduplication Engine (`deduplicateFindings`)**: Merges duplicate vulnerability titles across different URLs, tools, and ports into a single consolidated row displaying an `{occurrenceCount}x merged` badge.
- **Bulk Remediation Action**: "Remediate All" button transitions all in-scope findings to `Fixed` lifecycle and `Resolved` patch status (RBAC permission gated).

### 7.2 Expandable Finding Details Drawer
Clicking any table row expands a comprehensive sub-drawer:
- **Enterprise Team Assignment & RACI Selector**: Interactive badges to assign findings to Server Team, DevOps / Cloud, Database DBAs, SecOps, or Application Dev.
- **Ticket Management**: Displays existing ticket reference badges (`Ticket SEC-XXXX`) or provides a "Raise Ticket" button that generates a ticket reference and advances status to `In Progress`.
- **Technical Context**: Full text of descriptions, vendor solutions, target URLs, and direct CVE links to the National Vulnerability Database (NVD).
- **Remediation Patch Box**: Embedded configuration/code fixes for the detected vulnerability.

---

## 8. Automated Remediation Code & Config Snippets

*Source File*: `src/lib/remediationSnippets.ts`

The `findRemediationSnippet(name, description)` engine matches regex patterns to provide ready-to-deploy hardening configurations:

1. **HTTP Security Headers**:
   - *Nginx*: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;` + X-Frame-Options + CSP.
   - *Apache*: `Header always set Strict-Transport-Security ...`
   - *IIS*: `<system.webServer><httpProtocol><customHeaders>...`
2. **Cryptographic Hardening (TLS / Ciphers)**:
   - *Nginx*: `ssl_protocols TLSv1.2 TLSv1.3; ssl_ciphers ECDHE-...; ssl_prefer_server_ciphers on;`
   - *Windows Registry (PowerShell)*: Disables TLS 1.0 and TLS 1.1 server protocols.
3. **Legacy SMB Hardening**:
   - *PowerShell*: `Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart`
   - *Linux Samba*: `min protocol = SMB2` in `smb.conf`.
4. **CORS Restrictions**:
   - *Node.js / Express*: Whitelist origin validation middleware.
   - *Nginx*: Origin header regex matching before echoing `Access-Control-Allow-Origin`.
5. **Session Cookie Flags**:
   - *Express.js*: `cookie: { httpOnly: true, secure: true, sameSite: 'strict' }`
   - *Nginx Proxy*: `proxy_cookie_flags ~ secure httponly samesite=strict;`
6. **OpenSSH Server Hardening**:
   - *Linux `/etc/ssh/sshd_config`*: `PermitRootLogin no`, `PasswordAuthentication no`, Curve25519 Kex algorithms.
7. **Database Port Hardening**:
   - *Redis*: `bind 127.0.0.1 ::1`, `protected-mode yes`, `requirepass ...`
   - *MongoDB*: `net.bindIp: 127.0.0.1`, `security.authorization: enabled`
8. **SQL Injection Mitigation**:
   - Parameterized queries in Node.js (`pg`) and Python (`psycopg2` / `SQLAlchemy`).
9. **XSS & Output Encoding**:
   - DOMPurify HTML sanitization and safe DOM text insertion (`textContent`).

---

## 9. Role-Based Access Control (RBAC) & Governance Audit Trails

*Source Files*: `src/lib/permissions.ts`, `src/components/RestrictedButton.tsx`, `src/store/useDashboardStore.ts`

### 9.1 Role Hierarchy & Permissions

```typescript
export type EnterpriseRole = "Administrator" | "Security Auditor" | "Remediation Lead";
```

| Governance Action | Administrator | Remediation Lead | Security Auditor |
| :--- | :---: | :---: | :---: |
| **Remediate Findings / Move Kanban Cards** | Yes | Yes | No (Read-Only) |
| **Assign Teams & RACI Roles** | Yes | Yes | No (Read-Only) |
| **Raise Jira/GitHub Patch Tickets** | Yes | Yes | No (Read-Only) |
| **Toggle Simulated 2-Factor Auth** | Yes | No | No (Read-Only) |

### 9.2 Accessible Permission Gating (`RestrictedButton`)
- Rather than setting HTML `disabled` (which suppresses pointer events and prevents tooltips from displaying), `RestrictedButton` sets `aria-disabled="true"`.
- Unauthorized clicks are prevented (`e.preventDefault()`, `e.stopPropagation()`).
- Renders an informative tooltip explaining why the action is restricted for the active role.

### 9.3 Immutable Audit Logging
- Captures all governance actions: `ASSIGN` (team/RACI assignment), `TICKET` (patch ticket created), and `PATCH` (status advancement).
- Records action type, finding detail, actor role, and ISO timestamp.
- Persists to `localStorage` (`vaptlens.audit.v1`), capped at 200 chronological entries to prevent browser storage quota issues.

---

## 10. Client-Side State Management & Persistence Schema

*Source Files*: `src/store/useDashboardStore.ts`, `src/lib/storage.ts`

### 10.1 In-Memory Session Store (`useDashboardStore`)
- `findings: Finding[]`: In-memory array of enriched vulnerability records.
- `batches: ScanBatch[]`: Ingested scan files with tool names, filenames, and dates.
- `filters: FilterState`: Active filter criteria (severities, hosts, tools, ports, date ranges, search query, cross-filters).
- `pendingUpload`: Transient state for files requiring manual column mapping.
- `hostDrawerHost: string | null`: Selected host for the triage drawer.
- `hostDrawerScroll: number`: Preserved scroll position for the host drawer across tab navigation.

### 10.2 Local Storage Persistence Schema
All persistent configuration is stored in `localStorage` with error handling:

| Key | Schema Version | Content Stored |
| :--- | :--- | :--- |
| `vaptlens.layout.v1` | `v: 2` | Active widget list, chart configurations, and grid positions. |
| `vaptlens.mappings.v1` | N/A | Custom CSV column-mapping presets (`SavedMapping[]`). |
| `vaptlens.governance.v1` | `v: 1` | Active enterprise role (`userRole`) and 2FA simulation state. |
| `vaptlens.audit.v1` | N/A | Chronological audit log entries (capped at 200 records). |
| `vaptlens.remediation.v1` | N/A | Kanban column status assignments (`Record<string, Status>`). |
| `vaptlens-theme` | N/A | Active UI theme (`"light"` or `"dark"`). |

---

## 11. Multi-Quarter Historical Sample Dataset

*Source File*: `src/lib/sampleData.ts`

Clicking **"Load Demo Scan Data"** populates 3 historical scan batches (34 findings) spanning three consecutive quarters:

1. **Batch 1 — Q4 2025 (`2025-11-15`)**:
   - Scanner: Tenable Nessus (6 findings).
   - Findings: MS17-010 EternalBlue (`10.100.1.25`), MySQL Default Root Password (`10.100.2.12`), SMB NULL Session, SSH Weak Algorithms, Self-Signed SSL, HTTP Banner Disclosure.
2. **Batch 2 — Q1 2026 (`2026-02-15`)**:
   - Scanner: Tenable Nessus (7 findings).
   - **Remediation**: EternalBlue is resolved, triggering automatic synthesis of a `Fixed` lifecycle finding.
   - **Persistence**: MySQL Empty Root, SMB NULL session, and SSH weak ciphers persist (`lifecycle: "Open"`).
   - **New Introductions**: Apache Path Traversal (`CVE-2021-41773`), Outdated MySQL, Missing HSTS Header.
3. **Batch 3 — Q2 2026 (`2026-07-01`)**:
   - Scanners: Tenable Nessus & Burp Suite (22 findings).
   - **SLA Breaches**: MySQL empty root finding exceeds 220 days unpatched, triggering SLA breach flags.
   - **Zero-Day Threat**: Apache Tomcat Zero-Day RCE (`CVE-2026-9999`) on `10.100.1.10:8080`.
   - **Web Exploits**: SQL Injection (`CVE-2026-8888`), Reflected XSS, BOLA, CSRF, and CORS Misconfigurations.
   - **EOL Software**: Apache Tomcat 6.0 End-of-Life detection.
