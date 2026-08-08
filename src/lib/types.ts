export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low", "Info"];

export const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "#DC2626",
  High: "#EA580C",
  Medium: "#D97706",
  Low: "#0D9488",
  Info: "#78716C",
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
  url?: string;

  // Computed fields
  lifecycle?: "New" | "Open" | "Fixed";
  slaStatus?: "Met" | "Breached";
  isExploitable?: "Exploitable" | "Not Exploitable";
  /** Scored exploitability confidence (0+; >= 3 is Exploitable). */
  exploitabilityScore?: number;
  isEol?: "EOL/Obsolete" | "Supported";
  isZeroDay?: "Zero-day" | "Known";
  unpatchedAge?: "Unpatched > 6 Months" | "Unpatched < 6 Months";
  owaspCategory?: string;
  agingBucket?: string;
  subnet?: string;

  // Threat Intel & Deduplication computed fields
  cisaKev?: "CISA KEV" | "Not in KEV";
  ransomwareVector?: "Ransomware Threat" | "Standard Risk";
  publicExploit?: "Public Exploit (PoC/Metasploit)" | "No Public Exploit";
  occurrenceCount?: number;
  affectedUrls?: string[];
  affectedPorts?: string[];
  toolsDetected?: string[];

  // Enterprise Governance, RACI & SLA fields
  assignedTeam?: "Server Team" | "DevOps / Cloud" | "Database DBAs" | "SecOps" | "Application Dev";
  raciRole?: "Responsible" | "Accountable" | "Consulted" | "Informed";
  ticketId?: string;
  patchStatus?: "Unassigned" | "Assigned" | "In Progress" | "Pending Verification" | "Resolved";

  // Deep enterprise analytics fields
  /** ISO date the SLA window expires (first-seen + severity target). */
  slaDeadline?: string;
  /** Days remaining until SLA breach (negative = already breached). */
  slaDaysLeft?: number;
  /** Version string extracted from the finding name (e.g. "Apache 2.4.41"). */
  extractedVersion?: string;
  /** Normalized 0–100 host risk contribution for this finding. */
  riskContribution?: number;
}

export interface AuditEntry {
  id: string;
  ts: string;
  action: string;
  detail: string;
  actor: string;
}

export interface AssetItem {
  id: string;
  host: string;
  ip: string;
  os: string;
  deviceType: "Web Server" | "Database" | "API Gateway" | "Domain Controller" | "Internal Subnet";
  tier: "Tier 1 - Crown Jewel" | "Tier 2 - Production" | "Tier 3 - Dev/Staging";
  ownerTeam: "Server Team" | "DevOps / Cloud" | "Database DBAs" | "SecOps" | "Application Dev";
  eolStatus: "Supported" | "EOS/EOL";
  activeVulnCount: number;
  criticalCount: number;
  riskScore: number;
}

export type EnterpriseRole = "Administrator" | "Security Auditor" | "Remediation Lead";


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
  | "scanDate"
  | "lifecycle"
  | "slaStatus"
  | "isExploitable"
  | "isEol"
  | "isZeroDay"
  | "unpatchedAge"
  | "url"
  | "scanMonth"
  | "owaspCategory"
  | "agingBucket"
  | "subnet"
  | "cisaKev"
  | "ransomwareVector"
  | "publicExploit";

export type Aggregation =
  | "count"
  | "avgCvss"
  | "maxCvss"
  | "distinctHosts"
  | "distinctFindings";

export const CHART_TYPES: ChartType[] = [
  "bar",
  "area",
  "donut",
  "line",
  "radar",
  "treemap",
  "heatmap",
  "scatter",
  "histogram",
  "table",
  "kpi",
  "slaBreach",
  "hostRisk",
];

export const FIELD_KEYS: FieldKey[] = [
  "severity",
  "host",
  "tool",
  "scanLabel",
  "port",
  "protocol",
  "cve",
  "pluginId",
  "name",
  "cvssBucket",
  "scanDate",
  "lifecycle",
  "slaStatus",
  "isExploitable",
  "isEol",
  "isZeroDay",
  "unpatchedAge",
  "url",
  "scanMonth",
  "owaspCategory",
  "agingBucket",
  "subnet",
  "cisaKev",
  "ransomwareVector",
  "publicExploit",
];

export const AGGREGATIONS: Aggregation[] = [
  "count",
  "avgCvss",
  "maxCvss",
  "distinctHosts",
  "distinctFindings",
];

export function isChartType(v: unknown): v is ChartType {
  return typeof v === "string" && (CHART_TYPES as string[]).includes(v);
}

export function isFieldKey(v: unknown): v is FieldKey {
  return typeof v === "string" && (FIELD_KEYS as string[]).includes(v);
}

export function isAggregation(v: unknown): v is Aggregation {
  return typeof v === "string" && (AGGREGATIONS as string[]).includes(v);
}

export type ChartType =
  | "bar"
  | "donut"
  | "line"
  | "area"
  | "histogram"
  | "radar"
  | "treemap"
  | "heatmap"
  | "scatter"
  | "table"
  | "kpi"
  | "slaBreach"
  | "hostRisk";

export interface WidgetConfig {
  id: string;
  title: string;
  chartType: ChartType;
  groupBy: FieldKey;
  colorBy?: FieldKey;
  aggregation: Aggregation;
  sortBy?: "value" | "label";
  topN?: number;
  barLayout?: "stacked" | "grouped";
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
  url?: string;
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
