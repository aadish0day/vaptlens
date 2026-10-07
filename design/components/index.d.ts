import * as React from "react";
type Severity = "critical" | "high" | "medium" | "low" | "info";
type IconName =
  | "x"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "chevron-up"
  | "grip"
  | "lock"
  | "unlock"
  | "flame"
  | "skull"
  | "zap"
  | "clock"
  | "shield"
  | "shield-check"
  | "ticket"
  | "check"
  | "search"
  | "minus"
  | "info"
  | "upload"
  | "download"
  | "file"
  | "server"
  | "database"
  | "globe"
  | "router"
  | "key"
  | "monitor"
  | "user"
  | "ellipsis"
  | "template"
  | "trend-up"
  | "trend-down"
  | "gauge"
  | "paperclip"
  | "book"
  | "tag"
  | "refresh"
  | "message"
  | "briefcase"
  | "ban"
  | "plus"
  | "filter"
  | "route"
  | "sparkles"
  | "target"
  | "flag"
  | "workflow";
export declare function Icon(p: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}): React.ReactElement;
/** Lens-reticle mark + "VAPTLens" wordmark. */
export declare function Logo(p: {
  size?: number;
  wordmark?: boolean;
}): React.ReactElement;
/** Action button; `restricted` = RBAC-gated (aria-disabled + tooltip). */
export declare function Button(
  p: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    icon?: IconName;
    restricted?: boolean;
    restrictedReason?: string;
  },
): React.ReactElement;
/** Five-level severity label. */
export declare function SeverityBadge(p: {
  severity: Severity;
  count?: number;
  solid?: boolean;
}): React.ReactElement;
/** Threat-intel micro tag. */
export declare function ThreatTag(p: {
  kind: "kev" | "zeroday" | "ransomware" | "exploitable" | "eol" | "breached";
  label?: string;
}): React.ReactElement;
/** SLA state pill. */
export declare function SlaPill(p: {
  status: "met" | "at-risk" | "breached";
  days?: number;
}): React.ReactElement;
/** Removable active-filter chip. */
export declare function FilterChip(p: {
  value: string;
  field?: string;
  severity?: Severity;
  onRemove?: () => void;
}): React.ReactElement;
/** Single-metric KPI card. */
export declare function KpiCard(p: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: IconName;
  tone?: "critical" | "ok" | "warn";
  active?: boolean;
  onClick?: () => void;
}): React.ReactElement;
/** Dashboard grid tile; header is the drag handle. */
export declare function WidgetCard(p: {
  title: string;
  actions?: React.ReactNode;
  draggable?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}): React.ReactElement;
/** Top navigation across the eight views. */
export declare function NavTabs(p: {
  tabs?: string[];
  active?: string;
  onChange?: (tab: string) => void;
}): React.ReactElement;
/** Host risk score row with meter bar. */
export declare function RiskMeter(p: {
  host: string;
  score: number;
  max?: number;
  criticals?: number;
}): React.ReactElement;
/** Remediation Board finding card. */
export declare function KanbanCard(p: {
  severity: Severity;
  title: string;
  host: string;
  ticket?: string;
  tags?: Array<
    "kev" | "zeroday" | "ransomware" | "exploitable" | "eol" | "breached"
  >;
  team?: string;
  dragging?: boolean;
  dragProps?: React.HTMLAttributes<HTMLDivElement>;
  onOpen?: () => void;
  onBack?: () => void;
  onForward?: () => void;
}): React.ReactElement;
/** Remediation config/code box with platform tabs. */
export declare function CodeSnippet(p: {
  tabs: { label: string; code: string }[];
  title?: string;
}): React.ReactElement;

/** Shape marker per severity: ◆ ▲ ● ▼ ○. */
export declare function SeverityMarker(p: {
  severity: Severity;
  size?: number;
  label?: boolean;
}): React.ReactElement;
export declare function Tooltip(p: {
  content: React.ReactNode;
  side?: "top" | "bottom";
  children: React.ReactNode;
}): React.ReactElement;
export declare function Checkbox(p: {
  label: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  severity?: Severity;
  count?: number;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}): React.ReactElement;
export declare function Toggle(p: {
  label: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  icon?: IconName;
  count?: number;
  disabled?: boolean;
  title?: string;
  onChange?: (on: boolean) => void;
}): React.ReactElement;
export declare function SegmentedControl(p: {
  options?: string[];
  value?: string;
  defaultValue?: string;
  label?: string;
  onChange?: (v: string) => void;
}): React.ReactElement;
export declare function Input(
  p: React.InputHTMLAttributes<HTMLInputElement> & { icon?: IconName | false },
): React.ReactElement;
type Option =
  | string
  | { value: string; label?: string; severity?: Severity; count?: number };
export declare function MultiSelect(p: {
  options: Option[];
  value?: string[];
  defaultValue?: string[];
  label?: string;
  placeholder?: string;
  defaultOpen?: boolean;
  onChange?: (v: string[]) => void;
}): React.ReactElement;
export declare function Modal(p: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  open?: boolean;
  onClose?: () => void;
}): React.ReactElement | null;
export declare function Drawer(p: {
  title: string;
  eyebrow?: string;
  mono?: boolean;
  meta?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
}): React.ReactElement | null;
export interface FindingRow {
  id: string | number;
  severity: Severity;
  name: string;
  host: string;
  cvss?: number;
  lifecycle?: "New" | "Open" | "Fixed";
  tool?: string;
  merged?: number;
  tags?: Array<
    "kev" | "zeroday" | "ransomware" | "exploitable" | "eol" | "breached"
  >;
  description?: string;
  cves?: string[];
  team?: string;
  ticket?: string;
  sla?: { status: "met" | "at-risk" | "breached"; days?: number };
  snippet?: { label: string; code: string }[];
  readOnly?: boolean;
}
/** Sortable vulnerability grid with expandable detail rows. */
export declare function VulnTable(p: {
  rows: FindingRow[];
  density?: "compact" | "comfortable";
  defaultExpanded?: string | number;
  renderDetail?: (r: FindingRow) => React.ReactNode;
  onClearFilters?: () => void;
  sort?: { key: string; dir: 1 | -1 };
  onSortChange?: (s: { key: string; dir: 1 | -1 }) => void;
  extraCols?: {
    key: string;
    label: string;
    w?: string;
    mono?: boolean;
    num?: boolean;
  }[];
  limit?: number;
  selectable?: boolean;
  selected?: Array<string | number>;
  onSelectChange?: (ids: Array<string | number>) => void;
}): React.ReactElement;
export declare function FindingDetail(p: {
  finding: FindingRow;
}): React.ReactElement;
export declare function PipelineStepper(p: {
  counts: [number, number, number, number, number];
  current?: number;
  labels?: string[];
}): React.ReactElement;
export declare function DiffBadge(p: {
  kind: "fixed" | "new" | "persistent" | "reopened" | "unverified" | "accepted";
  count?: number;
  label?: string;
}): React.ReactElement;
export declare function QuadrantTile(p: {
  kind: "quickwins" | "strategic" | "mundane" | "deferrable";
  count?: number;
  selected?: boolean;
  onClick?: () => void;
}): React.ReactElement;
export declare function AuditLogRow(p: {
  action: "ASSIGN" | "TICKET" | "PATCH";
  detail: string;
  role: string;
  at?: string;
  time?: string;
}): React.ReactElement;
export declare function EmptyState(p: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}): React.ReactElement;
export declare function Skeleton(p: {
  variant?: "bar" | "rows";
  rows?: number;
  width?: string;
  height?: string;
}): React.ReactElement;
export declare function Toast(p: {
  title: string;
  message?: string;
  tone?: "ok" | "danger" | "info";
  action?: { label: string; onClick: () => void };
  onClose?: () => void;
}): React.ReactElement;
type Datum = {
  label: string;
  value: number;
  severity?: Severity;
  color?: string;
};
export declare function BarChart(p: {
  data: Datum[];
  height?: number;
  width?: number;
  legend?: boolean;
  static?: boolean;
  label?: string;
  selected?: string | null;
  onSelect?: (label: string | null) => void;
}): React.ReactElement;
export declare function DonutChart(p: {
  data: Datum[];
  static?: boolean;
  total?: React.ReactNode;
  totalLabel?: string;
  label?: string;
  selected?: string | null;
  onSelect?: (label: string | null) => void;
}): React.ReactElement;
export declare function ChartLegend(p: {
  items: {
    label: string;
    severity?: Severity;
    color?: string;
    value?: number;
  }[];
}): React.ReactElement;
export declare function Heatmap(p: {
  rows: { host: string; values: [number, number, number, number, number] }[];
  selected?: string | null;
  onSelect?: (host: string | null) => void;
}): React.ReactElement;
export declare function ReportHeader(p: {
  theme?: "slate" | "navy" | "crimson";
  title?: string;
  kind?: string;
  meta?: string;
}): React.ReactElement;

/** Scan CSV drop target; states idle | parsing | error (drag handled internally). */
export declare function FileDropzone(p: {
  state?: "idle" | "parsing" | "error";
  fileName?: string;
  progress?: number;
  rows?: number;
  error?: string;
  onFiles?: (files: FileList) => void;
  onBrowse?: () => void;
}): React.ReactElement;
/** Auto-detected scanner preset with header-match confidence. */
export declare function ScannerBadge(p: {
  tool?: string;
  matched?: number;
  total?: number;
}): React.ReactElement;
type CanonicalField =
  | "host"
  | "severity"
  | "cvss"
  | "name"
  | "url"
  | "cve"
  | "port"
  | "protocol"
  | "description"
  | "solution"
  | "pluginId"
  | "scanDate";
export declare function ColumnMapRow(p: {
  field: CanonicalField;
  header?: string;
  options?: string[];
  sample?: string;
  required?: boolean;
  onChange?: (header: string | null) => void;
}): React.ReactElement;
export declare function Tabs(p: {
  tabs: { label: string; count?: number }[];
  value?: string;
  defaultValue?: string;
  onChange?: (label: string) => void;
}): React.ReactElement;
type MenuItem =
  | "-"
  | {
      label: string;
      icon?: string;
      hint?: string;
      danger?: boolean;
      onSelect?: () => void;
    };
export declare function DropdownMenu(p: {
  label: React.ReactNode;
  items: MenuItem[];
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: string;
  align?: "left" | "right";
  defaultOpen?: boolean;
}): React.ReactElement;
export declare function Banner(p: {
  tone?: "info" | "privacy" | "warn" | "danger";
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
}): React.ReactElement;
type Role = "Administrator" | "Remediation Lead" | "Security Auditor";
export declare function RoleSwitcher(p: {
  value?: Role;
  onChange?: (r: Role) => void;
  twoFactor?: boolean;
}): React.ReactElement;
type Team =
  | "Server Team"
  | "DevOps / Cloud"
  | "Database DBAs"
  | "SecOps"
  | "Application Dev";
type Raci = "R" | "A" | "C" | "I";
export declare function TeamPicker(p: {
  team?: Team;
  role?: Raci;
  readOnly?: boolean;
  onChange?: (team: Team | null, role: Raci) => void;
}): React.ReactElement;
export declare function RaciMatrix(p: {
  data: Partial<Record<Team, Partial<Record<Raci, number>>>>;
}): React.ReactElement;
export declare function Sparkline(p: {
  values: number[];
  tone?: "lens" | "ok" | "danger" | "muted";
  width?: number;
  height?: number;
  label?: string;
}): React.ReactElement;
export declare function SlaTrend(p: {
  months: { label: string; pct: number }[];
  label?: string;
}): React.ReactElement;
export declare function EffortMeter(p: { value: number }): React.ReactElement;
export declare function TierBadge(p: {
  tier: 1 | 2 | 3;
  short?: boolean;
}): React.ReactElement;
export declare function AssetRow(p: {
  host: string;
  device?:
    | "Database"
    | "API Gateway"
    | "Domain Controller"
    | "Web Server"
    | "Server"
    | "Workstation";
  os?: string;
  eol?: boolean;
  tier: 1 | 2 | 3;
  owner?: string;
  counts?: Partial<Record<Severity, number>>;
  score?: number;
  onClick?: () => void;
}): React.ReactElement;
type ThreatKind =
  "kev" | "zeroday" | "ransomware" | "exploitable" | "eol" | "breached";
export declare function BreachList(p: {
  items: { title: string; host: string; risk: number; tags?: ThreatKind[] }[];
  onSelect?: (
    item: { title: string; host: string; risk: number; tags?: ThreatKind[] },
    index: number,
  ) => void;
}): React.ReactElement;
export declare function ExposureBars(p: {
  items: { kind: ThreatKind; value: number }[];
  total: number;
}): React.ReactElement;
export declare function RiskDelta(p: {
  pct: number;
  baseline?: string;
  retest?: string;
  before?: string | number;
  after?: string | number;
  label?: string;
}): React.ReactElement;
export declare function TopologyMap(p: {
  subnets: {
    name: string;
    hosts: { ip: string; count: number; severity: Severity }[];
  }[];
  selected?: string;
  onSelect?: (ip: string | null) => void;
}): React.ReactElement;
export declare function TemplateCard(p: {
  title: string;
  description?: string;
  chart?: "bar" | "donut" | "line" | "heatmap";
  chartLabel?: string;
  locked?: boolean;
  lockReason?: string;
  onAdd?: () => void;
}): React.ReactElement;

type Series = {
  label: string;
  values: number[];
  severity?: Severity;
  color?: string;
  dashed?: boolean;
};
/** Line / area chart (LineChartWidget, AreaChartWidget, threat trajectories). */
export declare function LineChart(p: {
  labels: string[];
  series: Series[];
  area?: boolean;
  height?: number;
  width?: number;
  label?: string;
  id?: string;
}): React.ReactElement;
/** Stacked bars (aging buckets, colorBy splits). */
export declare function StackedBarChart(p: {
  labels: string[];
  series: Series[];
  static?: boolean;
  height?: number;
  width?: number;
  label?: string;
  selected?: string | null;
  onSelect?: (label: string | null) => void;
}): React.ReactElement;
export declare function RadarChart(p: {
  axes: string[];
  series: Series[];
  max?: number;
  label?: string;
}): React.ReactElement;
export declare function Treemap(p: {
  data: Datum[];
  static?: boolean;
  height?: number;
  width?: number;
  label?: string;
  selected?: string | null;
  onSelect?: (label: string | null) => void;
}): React.ReactElement;
export declare function ScatterChart(p: {
  categories: string[];
  points: {
    category: string;
    cvss: number;
    severity: Severity;
    name?: string;
  }[];
  width?: number;
  label?: string;
  selected?: string | null;
  onSelect?: (category: string | null) => void;
}): React.ReactElement;
/** SlaBreachKpiWidget: breach total + per-severity filter rows. */
export declare function SlaBreachCard(p: {
  breakdown: Partial<Record<Severity, number>>;
  total?: number;
  onSelect?: (s: Severity) => void;
}): React.ReactElement;
/** C.H.I. SLA projection table. */
export declare function SlaProjectionTable(p: {
  rows: {
    severity: Severity;
    active: number;
    breached: number;
    atRisk: number;
    avgDays: number;
  }[];
}): React.ReactElement;
export declare function ExposureRegistry(p: {
  items: {
    kind: "eol" | "zeroday";
    name: string;
    detail?: string;
    hosts: number;
    criticals: number;
  }[];
}): React.ReactElement;
