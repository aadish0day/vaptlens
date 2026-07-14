export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low", "Info"];

export const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "#E5484D",
  High: "#F2994A",
  Medium: "#F2C94C",
  Low: "#56CCF2",
  Info: "#7D8CA3",
};

export const SEVERITY_ORDER: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Info: 4,
};

export interface Finding {
  id: string;
  host: string;
  port?: string;
  protocol?: string;
  name: string;
  severity: Severity;
  cvss?: number;
  cve?: string[];
  description?: string;
  solution?: string;
  pluginId?: string;
  scanId: string;
  scanLabel: string;
  scanDate?: string;
  tool: string;
}

export interface ScanBatch {
  id: string;
  label: string;
  date: string;
  tool: string;
  findingCount: number;
}

export type FieldKey =
  | "severity"
  | "host"
  | "tool"
  | "scanLabel"
  | "port"
  | "protocol"
  | "cve"
  | "pluginId"
  | "name"
  | "cvssBucket"
  | "scanDate";

export type Aggregation =
  | "count"
  | "avgCvss"
  | "maxCvss"
  | "distinctHosts"
  | "distinctFindings";

export type ChartType = "bar" | "donut" | "line" | "histogram" | "table" | "kpi";

export interface WidgetConfig {
  id: string;
  title: string;
  chartType: ChartType;
  groupBy: FieldKey;
  colorBy?: FieldKey;
  aggregation: Aggregation;
  sortBy?: "value" | "label";
  topN?: number;
  layout: { x: number; y: number; w: number; h: number };
}

export interface FilterState {
  severities: Severity[];
  hosts: string[];
  tools: string[];
  scanIds: string[];
  ports: string[];
  dateRange?: [string, string];
  search: string;
  crossFilters: { field: FieldKey; value: string }[];
}

export interface ColumnMapping {
  host?: string;
  port?: string;
  protocol?: string;
  name?: string;
  severity?: string;
  cvss?: string;
  cve?: string;
  description?: string;
  solution?: string;
  pluginId?: string;
  scanDate?: string;
}

export interface SavedMapping extends ColumnMapping {
  name: string;
  tool?: string;
}

export interface ChartDatum {
  key: string;
  value: number;
  series?: string;
}

export interface DetectionResult {
  tool: string;
  mapping: ColumnMapping;
  matched: number;
}
