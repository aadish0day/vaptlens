import type {
  Aggregation,
  ChartType,
  FieldKey,
  FilterState,
  Finding,
  Severity,
  ScanBatch,
} from "./types";

type FieldValues = string | string[] | undefined;

function bucketOfCvss(cvss?: number): string | undefined {
  if (cvss === undefined || Number.isNaN(cvss)) return undefined;
  if (cvss >= 9.0) return "9.0–10.0";
  if (cvss >= 7.0) return "7.0–8.9";
  if (cvss >= 4.0) return "4.0–6.9";
  if (cvss > 0) return "0.1–3.9";
  return "0.0";
}

export function getFieldValue(f: Finding, field: FieldKey): FieldValues {
  switch (field) {
    case "severity":
      return f.severity;
    case "host":
      return f.host;
    case "tool":
      return f.tool;
    case "scanLabel":
      return f.scanLabel;
    case "port":
      return f.port;
    case "protocol":
      return f.protocol;
    case "cve":
      return f.cve;
    case "pluginId":
      return f.pluginId;
    case "name":
      return f.name;
    case "cvssBucket":
      return bucketOfCvss(f.cvss);
    case "scanDate":
      return f.scanDate ? f.scanDate.slice(0, 10) : undefined;
    case "lifecycle":
      return f.lifecycle ?? "New";
    case "slaStatus":
      return f.slaStatus ?? "Met";
    case "isExploitable":
      return f.isExploitable ?? "Not Exploitable";
    case "isEol":
      return f.isEol ?? "Supported";
    case "isZeroDay":
      return f.isZeroDay ?? "Known";
    case "unpatchedAge":
      return f.unpatchedAge ?? "Unpatched < 6 Months";
    case "url":
      return f.url;
    case "scanMonth": {
      if (!f.scanDate) return undefined;
      const date = new Date(f.scanDate);
      if (Number.isNaN(date.getTime())) return f.scanDate.slice(0, 7);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    default:
      return undefined;
  }
}

function matchesValue(fieldValue: FieldValues, target: string): boolean {
  if (fieldValue === undefined) return false;
  if (Array.isArray(fieldValue)) return fieldValue.includes(target);
  return fieldValue === target;
}

function matchesSearch(f: Finding, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.toLowerCase();
  return (
    f.host.toLowerCase().includes(q) ||
    f.name.toLowerCase().includes(q) ||
    f.tool.toLowerCase().includes(q) ||
    (f.description?.toLowerCase().includes(q) ?? false) ||
    (f.pluginId?.toLowerCase().includes(q) ?? false) ||
    (f.cve?.some((c) => c.toLowerCase().includes(q)) ?? false)
  );
}

export function applyFilters(findings: Finding[], filters: FilterState): Finding[] {
  const { severities, hosts, tools, scanIds, ports, dateRange, search, crossFilters } =
    filters;

  const minDate = dateRange?.[0];
  const maxDate = dateRange?.[1];

  return findings.filter((f) => {
    if (severities.length && !severities.includes(f.severity)) return false;
    if (hosts.length && !hosts.includes(f.host)) return false;
    if (tools.length && !tools.includes(f.tool)) return false;
    if (scanIds.length && !scanIds.includes(f.scanId)) return false;
    if (ports.length && !(f.port && ports.includes(f.port))) return false;
    if (minDate || maxDate) {
      const d = f.scanDate ? f.scanDate.slice(0, 10) : "";
      if (minDate && (!d || d < minDate)) return false;
      if (maxDate && (!d || d > maxDate)) return false;
    }
    if (!matchesSearch(f, search)) return false;
    for (const cf of crossFilters) {
      if (!matchesValue(getFieldValue(f, cf.field), cf.value)) return false;
    }
    return true;
  });
}

interface AggInput {
  groupBy: FieldKey;
  colorBy?: FieldKey;
  aggregation: Aggregation;
  sortBy?: "value" | "label";
  topN?: number;
}

export interface AggRow {
  key: string;
  value: number;
  series: string;
}

export interface AggregateOutput {
  rows: AggRow[];
  series: string[];
  pivot: Array<Record<string, number | string>>;
}

const CVSS_BUCKETS = ["0.0", "0.1–3.9", "4.0–6.9", "7.0–8.9", "9.0–10.0"];
const SEVERITY_ORDER_INDEX: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Info: 4,
};

function computeMeasure(group: Finding[], agg: Aggregation, groupBy?: FieldKey): number {
  // If we are not grouping by lifecycle, filter out Fixed findings so they don't count in active metrics
  const activeGroup = groupBy === "lifecycle" ? group : group.filter(f => f.lifecycle !== "Fixed");

  switch (agg) {
    case "count":
      return activeGroup.length;
    case "avgCvss": {
      const vals = activeGroup.map((f) => f.cvss).filter((c): c is number => c !== undefined);
      if (!vals.length) return 0;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    case "maxCvss": {
      const vals = activeGroup.map((f) => f.cvss).filter((c): c is number => c !== undefined);
      return vals.length ? Math.max(...vals) : 0;
    }
    case "distinctHosts":
      return new Set(activeGroup.map((f) => f.host)).size;
    case "distinctFindings":
      return new Set(activeGroup.map((f) => f.name)).size;
  }
}

export function aggregate(filtered: Finding[], input: AggInput): AggregateOutput {
  const { groupBy, colorBy, aggregation, sortBy, topN } = input;

  // Build groups: key -> series -> findings
  const groups = new Map<string, Map<string, Finding[]>>();

  for (const f of filtered) {
    const gvals = getFieldValue(f, groupBy);
    const garr = Array.isArray(gvals) ? gvals : gvals ? [gvals] : ["(none)"];
    for (const g of garr) {
      if (!groups.has(g)) groups.set(g, new Map());
      const seriesMap = groups.get(g)!;
      const svals = colorBy ? getFieldValue(f, colorBy) : "";
      const sarr = colorBy ? (Array.isArray(svals) ? svals : svals ? [svals] : ["(none)"]) : [""];
      for (const s of sarr) {
        if (!seriesMap.has(s)) seriesMap.set(s, []);
        seriesMap.get(s)!.push(f);
      }
    }
  }

  const rows: AggRow[] = [];
  for (const [key, seriesMap] of groups) {
    for (const [series, items] of seriesMap) {
      rows.push({ key, series, value: computeMeasure(items, aggregation) });
    }
  }

  // Sort rows
  if (sortBy === "label") {
    rows.sort((a, b) => a.key.localeCompare(b.key) || a.series.localeCompare(b.series));
  } else {
    rows.sort((a, b) => b.value - a.value || a.key.localeCompare(b.key));
  }

  const series = colorBy
    ? Array.from(new Set(rows.map((r) => r.series))).sort((a, b) => a.localeCompare(b))
    : [];

  // Pivot for recharts: one row per group with a column per series
  const pivotMap = new Map<string, Record<string, number | string>>();
  for (const r of rows) {
    if (!pivotMap.has(r.key)) pivotMap.set(r.key, { key: r.key });
    const row = pivotMap.get(r.key)!;
    if (colorBy) {
      row[r.series] = (typeof row[r.series] === "number" ? (row[r.series] as number) : 0) + r.value;
    } else {
      row.value = r.value;
    }
  }
  let pivot = Array.from(pivotMap.values());
  if (sortBy === "label") {
    pivot.sort((a, b) => String(a.key).localeCompare(String(b.key)));
  } else {
    pivot.sort(
      (a, b) =>
        (Number(b.value) || 0) - (Number(a.value) || 0) || String(a.key).localeCompare(String(b.key))
    );
  }

  if (topN && pivot.length > topN) pivot = pivot.slice(0, topN);

  // Stable ordering for known ordinal fields
  if (groupBy === "cvssBucket") {
    pivot.sort(
      (a, b) => CVSS_BUCKETS.indexOf(String(a.key)) - CVSS_BUCKETS.indexOf(String(b.key))
    );
  } else if (groupBy === "severity") {
    pivot.sort(
      (a, b) =>
        SEVERITY_ORDER_INDEX[a.key as Severity] - SEVERITY_ORDER_INDEX[b.key as Severity]
    );
  } else if (groupBy === "agingBucket") {
    const order = ["0–30 Days", "31–90 Days", "91–180 Days", "180+ Days", "Remediated"];
    pivot.sort(
      (a, b) => order.indexOf(String(a.key)) - order.indexOf(String(b.key))
    );
  }

  return { rows, series, pivot };
}

export function aggregateGlobal(filtered: Finding[], aggregation: Aggregation, groupBy?: FieldKey): number {
  return computeMeasure(filtered, aggregation, groupBy);
}

export function supportedChartTypes(): ChartType[] {
  return ["bar", "donut", "line", "histogram", "table", "kpi"];
}

export function enrichFindings(findings: Finding[], batches: ScanBatch[]): Finding[] {
  if (findings.length === 0) return [];

  // Sort batches chronologically
  const sortedBatches = [...batches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Reference/latest scan date
  const latestScanDateStr =
    sortedBatches.length > 0
      ? sortedBatches[sortedBatches.length - 1].date
      : new Date().toISOString().slice(0, 10);
  const latestTime = new Date(latestScanDateStr).getTime();

  // Keyword maps for EOL and Zero-day and Exploitable
  const eolKeywords = [
    /\beol\b/i,
    /end of life/i,
    /obsolete/i,
    /outdated/i,
    /deprecated/i,
    /unsupported/i,
    /expired/i,
    /old version/i,
    /legacy/i,
    /smbv1/i,
    /sslv3/i,
    /tls 1\.0/i,
    /tls 1\.1/i,
    /weak mac/i,
  ];

  const exploitableKeywords = [
    /exploit/i,
    /eternalblue/i,
    /injection/i,
    /rce/i,
    /traversal/i,
    /bola/i,
    /csrf/i,
    /weak credential/i,
    /default password/i,
    /backdoor/i,
    /malicious/i,
    /upload/i,
    /ssrf/i,
  ];

  const zeroDayKeywords = [
    /zero-day/i,
    /0-day/i,
    /zero day/i,
    /0day/i,
    /unpatched vulnerability/i,
  ];

  // Map to store first scan where a vulnerability key appeared
  // key: host|name|port|protocol|tool -> first scan details
  const vulnHistory = new Map<string, { firstScanDate: string; firstScanId: string }>();

  // Sort all findings chronologically based on their scan's date or scanDate field
  // Group findings by scanId
  const findingsByScan = new Map<string, Finding[]>();
  for (const f of findings) {
    // Exclude existing synthesized Fixed findings from reprocessing
    if (f.lifecycle === "Fixed") continue;
    if (!findingsByScan.has(f.scanId)) {
      findingsByScan.set(f.scanId, []);
    }
    findingsByScan.get(f.scanId)!.push(f);
  }

  // Track history batch by batch in chronological order
  for (const batch of sortedBatches) {
    const scanFindings = findingsByScan.get(batch.id) || [];
    const batchDate = batch.date;

    for (const f of scanFindings) {
      const fDate = f.scanDate ? f.scanDate.slice(0, 10) : batchDate;
      const key = `${f.host}|${f.name}|${f.port ?? ""}|${f.protocol ?? ""}|${f.tool}`;

      if (!vulnHistory.has(key)) {
        vulnHistory.set(key, { firstScanDate: fDate, firstScanId: batch.id });
      }
    }
  }

  // Build enriched findings list
  const enriched: Finding[] = [];

  // Enrich existing findings (excluding synthesized Fixed ones)
  const activeFindings = findings.filter(f => f.lifecycle !== "Fixed");
  for (const f of activeFindings) {
    const batch = batches.find((b) => b.id === f.scanId);
    const batchDate = batch?.date || latestScanDateStr;
    const fDateStr = f.scanDate ? f.scanDate.slice(0, 10) : batchDate;
    const fDate = new Date(fDateStr);
    const key = `${f.host}|${f.name}|${f.port ?? ""}|${f.protocol ?? ""}|${f.tool}`;

    // SLA Calculation
    // Critical: 14, High: 30, Medium: 90, Low: 180, Info: 360
    const ageInDays = Math.max(
      0,
      Math.floor((latestTime - fDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    let slaLimit = 90;
    if (f.severity === "Critical") slaLimit = 14;
    else if (f.severity === "High") slaLimit = 30;
    else if (f.severity === "Medium") slaLimit = 90;
    else if (f.severity === "Low") slaLimit = 180;
    else if (f.severity === "Info") slaLimit = 360;

    const slaStatus = ageInDays > slaLimit ? "Breached" : "Met";
    const unpatchedAge = ageInDays > 180 ? "Unpatched > 6 Months" : "Unpatched < 6 Months";

    // Exploitability
    const nameDesc = `${f.name} ${f.description ?? ""} ${f.solution ?? ""}`;
    const isExploitable =
      (f.cvss !== undefined && f.cvss >= 7.0) ||
      (f.cve && f.cve.length > 0) ||
      exploitableKeywords.some((r) => r.test(nameDesc))
        ? "Exploitable"
        : "Not Exploitable";

    // EOL
    const isEol = eolKeywords.some((r) => r.test(nameDesc)) ? "EOL/Obsolete" : "Supported";

    // Zero-day
    const isZeroDay =
      zeroDayKeywords.some((r) => r.test(nameDesc)) ||
      (f.cve && f.cve.some((c) => c.includes("2026") || c.includes("9999") || c.toLowerCase().includes("zero")))
        ? "Zero-day"
        : "Known";

    // Lifecycle: compare this finding's scanDate/scanId with the first time it appeared
    const hist = vulnHistory.get(key);
    let lifecycle: "New" | "Open" | "Fixed" = "New";
    if (hist && hist.firstScanId !== f.scanId) {
      lifecycle = "Open";
    }

    // New Computed Fields
    let agingBucket = "0–30 Days";
    if (ageInDays > 180) agingBucket = "180+ Days";
    else if (ageInDays > 90) agingBucket = "91–180 Days";
    else if (ageInDays > 30) agingBucket = "31–90 Days";

    const owaspCategory = getOwaspCategory(f);
    const subnet = getSubnet(f.host);

    enriched.push({
      ...f,
      lifecycle,
      slaStatus,
      isExploitable,
      isEol,
      isZeroDay,
      unpatchedAge,
      owaspCategory,
      agingBucket,
      subnet,
    });
  }

  // Synthesize "Fixed" findings
  // For each chronologically consecutive pair of batches:
  // if a vuln key is present in batch B_i but absent in batch B_{i+1}, then it is Fixed in B_{i+1}!
  for (let i = 0; i < sortedBatches.length - 1; i++) {
    const currentBatch = sortedBatches[i];
    const nextBatch = sortedBatches[i + 1];

    const currentFindings = findingsByScan.get(currentBatch.id) || [];
    const nextFindings = findingsByScan.get(nextBatch.id) || [];

    const nextKeys = new Set(
      nextFindings.map((f) => `${f.host}|${f.name}|${f.port ?? ""}|${f.protocol ?? ""}|${f.tool}`)
    );

    for (const f of currentFindings) {
      const key = `${f.host}|${f.name}|${f.port ?? ""}|${f.protocol ?? ""}|${f.tool}`;
      if (!nextKeys.has(key)) {
        // This vulnerability is fixed in the next batch!
        const placeholderId = `fixed-${currentBatch.id}-${nextBatch.id}-${f.id}`;
        enriched.push({
          ...f,
          id: placeholderId,
          scanId: nextBatch.id,
          scanLabel: nextBatch.label,
          scanDate: nextBatch.date,
          lifecycle: "Fixed",
          slaStatus: "Met",
          isExploitable: "Not Exploitable",
          isEol: "Supported",
          isZeroDay: "Known",
          unpatchedAge: "Unpatched < 6 Months",
          owaspCategory: getOwaspCategory(f),
          agingBucket: "Remediated",
          subnet: getSubnet(f.host),
        });
      }
    }
  }

  return enriched;
}

function getOwaspCategory(f: Finding): string {
  const text = `${f.name} ${f.description ?? ""} ${f.solution ?? ""}`.toLowerCase();
  if (text.includes("sql injection") || text.includes("sqli") || text.includes("command injection") || text.includes("ldap injection") || text.includes("html injection") || text.includes("xss") || text.includes("cross-site scripting")) {
    return "A03:2021-Injection";
  }
  if (text.includes("ssrf") || text.includes("server-side request forgery")) {
    return "A10:2021-SSRF";
  }
  if (text.includes("bola") || text.includes("broken object level") || text.includes("idor") || text.includes("cors") || text.includes("cross-origin resource sharing") || text.includes("authorization") || text.includes("privilege") || text.includes("directory index") || text.includes("path traversal") || text.includes("lfi") || text.includes("rfi")) {
    return "A01:2021-Broken Access Control";
  }
  if (text.includes("ssl") || text.includes("tls") || text.includes("cryptography") || text.includes("mac algorithm") || text.includes("self-signed") || text.includes("cipher") || text.includes("encryption in transit") || text.includes("beast") || text.includes("sweet32") || text.includes("poodle")) {
    return "A02:2021-Cryptographic Failures";
  }
  if (text.includes("password policy") || text.includes("weak password") || text.includes("password strength") || text.includes("insufficient validation")) {
    return "A04:2021-Insecure Design";
  }
  if (text.includes("outdated") || text.includes("eol") || text.includes("end of life") || text.includes("obsolete") || text.includes("deprecated") || text.includes("legacy") || text.includes("unsupported") || text.includes("eternalblue") || text.includes("smbv1")) {
    return "A06:2021-Vulnerable and Outdated Components";
  }
  if (text.includes("default account") || text.includes("empty root password") || text.includes("credentials") || text.includes("default password") || text.includes("admin session")) {
    return "A07:2021-Identification and Authentication Failures";
  }
  if (text.includes("stack trace") || text.includes("information disclosure") || text.includes("banner disclosure") || text.includes("leakage") || text.includes("verbose error")) {
    return "A09:2021-Security Logging and Monitoring Failures";
  }
  return "A05:2021-Security Misconfiguration";
}

function getSubnet(host: string): string {
  const ipRegex = /^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/;
  const match = host.match(ipRegex);
  if (match) {
    return `${match[1]}.x /24`;
  }
  if (host.includes(".") && !host.match(/^\d/)) {
    return "External Assets";
  }
  return "Localhost / Internal";
}
