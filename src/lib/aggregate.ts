import type {
  Aggregation,
  ChartType,
  FieldKey,
  FilterState,
  Finding,
  Severity,
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

function computeMeasure(group: Finding[], agg: Aggregation): number {
  switch (agg) {
    case "count":
      return group.length;
    case "avgCvss": {
      const vals = group.map((f) => f.cvss).filter((c): c is number => c !== undefined);
      if (!vals.length) return 0;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    case "maxCvss": {
      const vals = group.map((f) => f.cvss).filter((c): c is number => c !== undefined);
      return vals.length ? Math.max(...vals) : 0;
    }
    case "distinctHosts":
      return new Set(group.map((f) => f.host)).size;
    case "distinctFindings":
      return new Set(group.map((f) => f.name)).size;
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
  }

  return { rows, series, pivot };
}

export function aggregateGlobal(filtered: Finding[], aggregation: Aggregation): number {
  return computeMeasure(filtered, aggregation);
}

export function supportedChartTypes(): ChartType[] {
  return ["bar", "donut", "line", "histogram", "table", "kpi"];
}
