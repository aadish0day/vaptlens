# VAPTLens — Comprehensive Feature Breakdown

VAPTLens is an enterprise-grade, zero-trust client-side VAPT (Vulnerability Assessment & Penetration Testing) analytics platform (Power BI-style). It processes vulnerability scan files directly in the browser—no scan data is ever transmitted to an external server or backend.

> The feature breakdown as provided, reformatted: the terminal line-wrapping is joined and the ASCII-drawn formulas are written out. It overlaps the product spec; where the two differ, the Spec coverage section lists it.

---

## 1. Data Ingestion, Scanner Presets & Normalization

### 1.1 Multi-Scanner Header Signature Auto-Detection
*Source: `presets.ts`, `parseCsv.ts`*

The detection engine (`detectTool`) evaluates CSV header sets against signatures for 10 major industry scanners:

1. **Tenable Nessus**: Matched on Plugin ID, Plugin Name, Risk, CVE, See Also. Maps plugin IDs, CVSS, port, protocol, solution, and risk levels.
2. **OpenVAS / Greenbone**: Matched on NVT, OID, Threat, QoD. Maps OIDs, threat levels, CVSS, and CVE lists.
3. **Qualys VM**: Matched on QID, Title, Severity, Solution. Auto-normalizes Qualys 1–5 numeric severity.
4. **PortSwigger Burp Suite**: Matched on Issue type, Issue Detail, Host, Path, Severity, Confidence.
5. **OWASP ZAP**: Matched on Alert, Risk, CWE ID, URL, Confidence.
6. **Nikto Web Scanner**: Matched on OSVDB, Target IP, Target Hostname, URI.
7. **Acunetix**: Matched on Vulnerability, CVSS3, CWE, CVE, Solution, Plugin.
8. **Wapiti**: Matched on module, http_request, http_response, wstg, references, cwe.
9. **ProjectDiscovery Nuclei**: Matched on template-id, info.name, info.severity, matched-at, matcher-name (flattened JSONL-to-CSV).
10. **OWASP Dependency-Check**: Matched on Vulnerable Software, CVSSv2, CVSSv3, CWE, Notes, References.

### 1.2 Fuzzy Header Detection & Custom Column Mapper
*Source: `ColumnMapper.tsx`, `presets.ts`*

- **28-Token Fuzzy Matcher (`guessMapping`)**: When headers don't match a known preset, fuzzy token heuristics inspect headers for terms like host, ip, target, sev, risk, cvss, cve, alert, desc, sol, port, plugin, etc.
- **Interactive Column Mapper Dialog**: Allows security engineers to map custom CSV columns to 12 canonical target fields (host, severity, cvss, name, url, cve, port, protocol, description, solution, pluginId, scanDate).
- **User Preset Persistence**: Custom column mappings can be saved with user-defined names to localStorage (`vaptlens.mappings.v1`) and reused across future sessions with 1-click pill buttons.

### 1.3 Normalization Pipeline & Severity Derivation
*Source: `presets.ts`, `aggregate.ts`*

- **Universal 5-Level Severity Scale**: Normalizes diverse vendor scales into Critical, High, Medium, Low, and Info.
- **Text & Numeric Mapping**: Maps labels like "crit", "moderate", "none" and numeric scales (5 → Critical, 4 → High, 3 → Medium, 1–2 → Low, < 1 → Info).
- **CVSS Score Fallback (`deriveFromCvss`)**: If severity is omitted, automatically classifies severity from CVSS:
  - ≥ 9.0: Critical
  - ≥ 7.0: High
  - ≥ 4.0: Medium
  - > 0.0: Low
  - 0.0 or missing: Info
- **CVE / CWE List Splitter**: Splits delimited strings (commas, semicolons, pipes) into clean, trimmed string arrays.
- **Robust CSV Sniffing**: PapaParse auto-detects delimiters (commas, tabs, semicolons, pipes) and filters out malformed lines.

---

## 2. Core BI Aggregation Engine & Filtering Architecture
*Source: `aggregate.ts`, `useDashboardStore.ts`*

The application features a custom multi-dimensional BI engine (`aggregate()`).

### 2.1 25 Analytic Dimensions (`FieldKey`)

1. `severity` (Critical, High, Medium, Low, Info)
2. `host` (Target IP or FQDN)
3. `tool` (Scanner tool name)
4. `scanLabel` (Scan batch name)
5. `port` (Target network port)
6. `protocol` (tcp, udp)
7. `cve` (Unnested CVE identifier)
8. `pluginId` (Scanner plugin / QID / OID)
9. `name` (Vulnerability title)
10. `cvssBucket` (0.0, 0.1–3.9, 4.0–6.9, 7.0–8.9, 9.0–10.0)
11. `scanDate` (YYYY-MM-DD date)
12. `scanMonth` (e.g., "Nov 2025", "Feb 2026")
13. `lifecycle` (New, Open, Fixed)
14. `slaStatus` (Met, Breached)
15. `isExploitable` (Exploitable, Not Exploitable)
16. `isEol` (EOL/Obsolete, Supported)
17. `isZeroDay` (Zero-day, Known)
18. `unpatchedAge` (Unpatched > 6 Months, Unpatched < 6 Months)
19. `url` (Target endpoint)
20. `owaspCategory` (OWASP Top 10 2021 categories)
21. `agingBucket` (0–30 Days, 31–90 Days, 91–180 Days, 180+ Days, Remediated)
22. `subnet` (CIDR /24 or External Asset)
23. `cisaKev` (CISA KEV, Not in KEV)
24. `ransomwareVector` (Ransomware Threat, Standard Risk)
25. `publicExploit` (Public Exploit (PoC/Metasploit), No Public Exploit)

### 2.2 Aggregation Metrics (`computeMeasure`)
- `count`: Total active vulnerability occurrences.
- `avgCvss`: Mean CVSS score across matching findings.
- `maxCvss`: Peak CVSS score in the group.
- `distinctHosts`: Unique host count.
- `distinctFindings`: Unique vulnerability definition count.
- **Fixed Metric Isolation**: Unless grouping explicitly by lifecycle, findings marked as Fixed are excluded to prevent resolved items from inflating active risk posture.

### 2.3 Cross-Filtering & Slicer Conjunction
- **Bidirectional Cross-Filtering**: Clicking any chart bar, donut slice, treemap cell, scatter point, or host row instantly sets a global cross-filter that cascades across all other widgets and tables.
- **Single-Select Replacement**: Clicking a new value on an existing field cleanly replaces it, preventing impossible Boolean intersections.
- **Global Slicers (`SlicerPanel.tsx`)**: Free-text search, quick threat filters (CISA KEV, Ransomware, 0-Day, EOL, >6 Months), multi-select checkboxes for Severity, Tool, Host, Port, and scan date range presets (7 Days, 15 Days, 30 Weeks, 6 Months).
- **Filter Chips Bar (`FilterChips.tsx`)**: Animated ribbon showing all active filters with individual removals and one-click "Clear all".

---

## 3. Risk Scoring & Threat Intelligence Heuristics
*Source: `risk.ts`, `aggregate.ts`*

### 3.1 Finding-Level Compounded Risk Formula
Each vulnerability's risk score is computed dynamically via `findingRiskContribution()`:

```
Base Score = SEVERITY_WEIGHT[severity] + (CVSS ?? 0)
```

(Base Weights: Critical = 10, High = 7, Medium = 5, Low = 3, Info = 1)

Multipliers compound multiplicatively:
- Exploitable: × 1.6
- CISA KEV: × 1.5
- Zero-Day: × 1.4
- Ransomware Threat Vector: × 1.3
- EOL / Obsolete Software: × 1.2
- SLA Breached: × 1.25
- Unpatched > 6 Months: × 1.1
- Fixed: Immediately sets contribution to 0.

(A critical zero-day CISA KEV finding can reach a risk score of ≈ 193.54 vs. baseline 20.)

### 3.2 Host-Level Weighted Risk Score
A host's cumulative risk score is the integer sum of active finding risk contributions:

```
HostRiskScore(h) = round( Σ f ∈ Active(h) findingRiskContribution(f) )
```

### 3.3 Threat Classification Heuristics
- **Exploitability Engine (`computeExploitability`)**: Confidence scoring inspecting titles, descriptions, and solutions. Awards points for CVE existence (+2), CVSS ≥ 9.0 (+2), high-risk keywords like RCE, SQLi, deserialization, Metasploit, PoC (+2), and penalizes purely informational items (−2). Scores ≥ 3 classify as Exploitable.
- **CISA KEV Detection**: Regex matching known weaponized campaigns (Log4Shell, EternalBlue, ProxyShell, Spring4Shell, MOVEit, CitrixBleed) or CVSS ≥ 9.0 + Exploitable.
- **Ransomware Vectors**: Flags SMBv1, EternalBlue, unauthenticated RCE, default credentials, exposed RDP, and VPN vulnerabilities.
- **EOL Detection (`EOL_VERSION_RULES`)**: Pattern matching 37 regexes plus semantic version evaluation for PHP (< 8.0, 8.1), Node.js (≤ 20), Python (≤ 3.9), Ubuntu (< 22.04), Debian (≤ 10), PostgreSQL (≤ 13), MySQL (≤ 8.0), and OpenSSL (≤ 1.1.1).
- **OWASP Top 10 (2021) Mapping**: Ordered evaluation categorizing issues into A01–A10 (Injection, Cryptographic Failures, Broken Access Control, SSRF, etc.).

---

## 4. Eight Dedicated Navigation Views

The top navigation bar provides access to 8 specialized operational views:

`Dashboard` · `Asset Inventory` · `SLA & RACI` · `Prioritization Matrix` · `Remediation Board` · `Network Map` · `Re-Test Verification` · `Executive Report`

### Tab 1: Dashboard Canvas
*Source: `DashboardCanvas.tsx`, `WidgetBuilder.tsx`, `TemplateGallery.tsx`*

- **Draggable & Resizable Grid (react-grid-layout)**: 12-column freeform grid layout. Drag handles on headers, south-east resize handles, vertical compaction, layout persistence to localStorage (`vaptlens.layout.v1`). Auto-collapses to a single-column stack on mobile devices (< 768px).
- **Top Breach Headlines Grid**: Fixed header row rendering TopCriticalBreachWidget (ranks top 10 exploitable breach risks with CISA KEV and Zero-day tags) and BreachBreakdownWidget (threat exposure meters).
- **Custom Widget Builder Modal**: Create custom analytics from scratch. Choose from 13 chart types, 21 grouping dimensions, 5 aggregations, secondary color splits, stacked vs. grouped toggles, top-N caps, and sort directions with real-time live preview.
- **Template Gallery**: 17 ready-to-use widgets (Severity Distribution, SLA Compliance, Vulnerability Lifecycle, Top 10 Hosts, Recurring Findings, Port Distribution, CVSS Histogram, Tool Comparison, Trend Over Time, Severity Heatmap, Risk Posture Radar, Treemap, Scatter, OWASP Compliance, Aging Buckets, Subnet Density). Gated templates (e.g. Trend Over Time) auto-lock unless ≥ 2 dated scans exist.
- **13 Specialized Chart Visualizers (`src/components/charts/*`)**:
  - BarChartWidget: Single or multi-series, stacked/grouped, auto-rotated axis labels (−35°).
  - DonutChartWidget: Inner radius 58%, total counter in center, slice cross-filtering.
  - AreaChartWidget: Monotone curves with SVG gradients.
  - LineChartWidget: Multi-series time-series tracking with active point expansion.
  - RadarChartWidget: Multi-variable polygonal risk footprints.
  - TreemapWidget: Custom SVG cells with rounded corners and proportional areas.
  - HeatmapWidget: Host vs. Severity density grid with dynamic opacity coloring.
  - ScatterChartWidget: CVSS score (0–10) vs. target dimensions.
  - HistogramWidget: CVSS distribution in tight 4% category gaps.
  - KpiCardWidget: High-impact numeric stats with icons and active filter rings.
  - SlaBreachKpiWidget: Breach totals with 5-tier severity breakdown and filter triggers.
  - HostRiskWidget: Weighted risk meters with top 5 host rankings.
  - TopCriticalBreachWidget & BreachBreakdownWidget: Active threat telemetry cards.

### Tab 2: Asset Inventory & Crown Jewels
*Source: `AssetInventory.tsx`, `HostRiskLeaderboard.tsx`, `ExposureRegistry.tsx`*

- **Automated Host Profiling**: Analyzes scan data to classify:
  - Asset Tiers: Tier 1 (Crown Jewel: ≥ 1 Critical finding, "prod" host, or database), Tier 2 (Production: ≥ 1 High finding), Tier 3 (Dev/Staging).
  - Device Types: Automatically identifies Database, API Gateway, Domain Controller, or Web Server.
  - Owner Team: Maps ownership by asset type.
  - OS & EOL Detection: Flags Linux vs. Windows and End-of-Life systems.
- **Embedded Host Risk Leaderboard**: Displays top 8 highest-risk hosts with relative risk gauges, telemetry micro-badges (Criticals, Exploits, KEV, 0-day, Ransomware, Breaches), and a slide-out host triage drawer with URL deep-linking (`?host=<ip>`).
- **Embedded Exposure Registry**: Catalog of End-of-Life (EOL) technologies and Zero-day exposures with affected host counts and critical totals.

### Tab 3: Governance, SLA & RACI Matrix
*Source: `GovernanceSLA.tsx`, `raci.ts`, `TrendsDeep.tsx`*

- **SLA Threshold Engine**: Enforces corporate remediation timelines: Critical 14 Days · High 30 Days · Medium 90 Days · Low 180 Days · Info 360 Days.
- **C.H.I. (Critical / High / Important) SLA Projection Table**: Summarizes active findings, breached count, at-risk count (≤ 7 days left), and average days remaining.
- **SLA Compliance Trajectory**: Displays overall compliance % and monthly trend sparkbars (Emerald ≥ 80%, Amber 50–79%, Crimson < 50%).
- **RACI Assignment Matrix (`buildRaciMatrix`)**: Coordinates vulnerability ownership across 5 teams (Server Team, DevOps / Cloud, Database DBAs, SecOps, Application Dev), cross-tabulated against RACI roles: Responsible, Accountable, Consulted, Informed.
- **Automated Ticket Dispatcher**: One-click bulk action to identify unassigned Critical vulnerabilities, assign them to the Server Team, advance status to Assigned, generate SEC-XXXX ticket IDs, and log audit entries.
- **Deep Trend Analytics (TrendsDeep)**:
  - Stacked bar chart of vulnerability aging across scan months (0–30 Days, 31–90 Days, 91–180 Days, 180+ Days).
  - Multi-line chart tracking threat trajectories (CISA KEV, Zero-day, Ransomware, Exploitable).

### Tab 4: Prioritization Matrix
*Source: `PrioritizationMatrix.tsx`*

- **2×2 Risk vs. Remediation Effort Grid**:
  - Effort Scorer (1.0 to 10.0): Evaluates fix complexity heuristics (e.g. registry tweaks/headers score Low Effort ≈ 2.0–3.0; OS migrations/re-architecting score High Effort ≈ 7.0–8.0).
  - Four Decision Quadrants:
    1. Quick Wins (High Risk / Low Effort): Highest priority, immediate patching.
    2. Strategic (High Risk / High Effort): Dedicated re-architecture sprints.
    3. Mundane Fixes (Low Risk / Low Effort): Routine maintenance.
    4. Deferrable (Low Risk / High Effort): Deprioritize into backlog.
- **Interactive Triage Sidebar**: Selecting any quadrant filters the active triage queue, displays visual effort meters, and allows 1-click cross-filtering.

### Tab 5: Remediation Board (Kanban & Patch Pipeline)
*Source: `RemediationBoard.tsx`*

- **4-Column Kanban Workflow**: Columns for To Do, In Progress, In Review, and Remediated. Cards can be moved forward/backward via chevron buttons.
- **5-Stage Enterprise Patch Pipeline**: Header progress tracker showing active counts across Unassigned → Assigned → In Progress → Pending Verification → Resolved.
- **Governance Audit Trail Drawer**: Chronological log of team assignments, ticket creation events, and status transitions (stores up to 200 entries with ISO timestamps and user role tags).

### Tab 6: Subnet Network Topology Map
*Source: `NetworkMap.tsx`*

- **Radial SVG Topology Graph**:
  - Central scanner engine core node (x: 320, y: 240).
  - First concentric ring (R₁ = 125px) for CIDR /24 subnets and external zones.
  - Outer cluster ring (R₂ = 45px) for individual target hosts.
  - Node radii scale logarithmically with finding volume (r = min(12, 6 + log₂(count + 1) × 2)).
  - Animated pulsing SVG stroke dashes on scanning links.
- **Node Intelligence Sidebar**: Clicking any host reveals its profile, device badge, finding counts, host filter toggle, and vulnerability list with clickable severity filters.

### Tab 7: Re-Test Verification & Differential Auditor
*Source: `DeltaAnalysis.tsx`*

- **Scan-to-Scan Differential Engine**: Select Baseline Scan A vs. Re-test Scan B to verify remediation efficacy.
- **Finding Keying & Classification**: Matches on `${host}|${name.toLowerCase()}|${port}`:
  - Verified Remediated / Fixed: Existed in Scan A, absent in Scan B.
  - New Introduced Risk: Absent in Scan A, newly appeared in Scan B.
  - Persistent / Unpatched: Detected in both scans.
- **Net Risk Delta Percentage**:

  ```
  RiskDeltaPct = round( (Σ CVSS_B − Σ CVSS_A) / Σ CVSS_A × 100 ) %
  ```
- **CSV Verification Export**: Generates and downloads RFC 4180-compliant audit CSV files (`vaptlens-retest-verification-*.csv`).

### Tab 8: Executive Report Builder & Exporters
*Source: `ReportBuilder.tsx`, `exporter.ts`, `ExportMenu.tsx`*

- **Executive Report Builder**: Interactive document editor with 3 themes (slate, navy, crimson) and 9 structured audit sections:
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
  - PNG Export (`exportDashboardPng`): Generates 2x pixel-ratio captures via html-to-image, filtering out UI controls.
  - PDF Export (`exportDashboardPdf`): Generates print-ready PDFs via jsPDF with automatic landscape/portrait aspect ratio selection.

---

## 5. Finding Table, Noise Grouping & Remediation Snippets

### 5.1 Interactive Vulnerability Table
*Source: `VulnTable.tsx`*

- **Multi-Column Sorting**: Sort by severity priority, host, lifecycle, title, CVSS, and tool.
- **"Group Noise" Deduplication (`deduplicateFindings`)**: Collapses duplicate finding names across different URLs, tools, and ports into a consolidated row with an `{occurrenceCount}x merged` badge.
- **Expandable Finding Drawer**:
  - Team assignment & RACI selector badges.
  - "Raise Jira/GitHub Ticket" button generating SEC-XXXX references.
  - Target URLs, technical descriptions, and solution text.
  - Direct CVE links to the NVD database.
  - Inline remediation patch snippets.

### 5.2 Automated Remediation Snippets Engine
*Source: `remediationSnippets.ts`*

Evaluates regex patterns on vulnerability titles to supply ready-to-deploy hardening configurations:

1. HTTP Security Headers: Nginx, Apache, and IIS configs for HSTS, CSP, and X-Frame-Options.
2. TLS / Cryptographic Hardening: Modern TLS 1.2/1.3 cipher suites for Nginx and Windows Registry PowerShell scripts disabling TLS 1.0/1.1.
3. Legacy SMB Hardening: PowerShell command disabling SMBv1 and Samba `min protocol = SMB2`.
4. CORS Restrictions: Whitelist origin handlers for Node.js Express and Nginx.
5. Session Cookie Flags: Hardened cookie configuration (HttpOnly, Secure, SameSite=Strict).
6. OpenSSH Server Hardening: Linux `/etc/ssh/sshd_config` disabling root login and weak KEX algorithms.
7. Database Port Hardening: Redis and MongoDB bind 127.0.0.1 and authorization directives.
8. SQL Injection Mitigation: Parameterized query examples in Node.js and Python.
9. XSS Mitigation: DOMPurify sanitization and `textContent` DOM patterns.

---

## 6. Role-Based Access Control (RBAC) & Governance
*Source: `permissions.ts`, `RestrictedButton.tsx`*

VAPTLens simulates enterprise access control across 3 roles:

- **Administrator**: Full privileges (remediate findings, assign teams, raise tickets, toggle simulated 2FA).
- **Remediation Lead**: Operational privileges (remediate findings, assign teams, raise tickets).
- **Security Auditor**: Read-only access (all mutating buttons disabled).
- **Accessible Permission Enforcement (`RestrictedButton`)**: Rather than using native disabled (which blocks pointer events and tooltips), sets `aria-disabled="true"` and displays explanatory permission tooltips when an unauthorized user hovers over a restricted action.
