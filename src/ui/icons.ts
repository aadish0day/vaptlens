import { AssetRow } from "@/ui/AssetRow";
import { AuditLogRow } from "@/ui/AuditLogRow";
import { Banner } from "@/ui/Banner";
import { BarChart } from "@/ui/BarChart";
import { BreachList } from "@/ui/BreachList";
import { Button } from "@/ui/Button";
import { ChartLegend } from "@/ui/ChartLegend";
import { Checkbox } from "@/ui/Checkbox";
import { CodeSnippet } from "@/ui/CodeSnippet";
import { ColumnMapRow } from "@/ui/ColumnMapRow";
import { DiffBadge } from "@/ui/DiffBadge";
import { DonutChart } from "@/ui/DonutChart";
import { Drawer } from "@/ui/Drawer";
import { DropdownMenu } from "@/ui/DropdownMenu";
import { EffortMeter } from "@/ui/EffortMeter";
import { EmptyState } from "@/ui/EmptyState";
import { ExposureBars } from "@/ui/ExposureBars";
import { ExposureRegistry } from "@/ui/ExposureRegistry";
import { FileDropzone } from "@/ui/FileDropzone";
import { FilterChip } from "@/ui/FilterChip";
import { FindingDetail } from "@/ui/FindingDetail";
import { Heatmap } from "@/ui/Heatmap";
import { Icon } from "@/ui/Icon";
import { Input } from "@/ui/Input";
import { KanbanCard } from "@/ui/KanbanCard";
import { KpiCard } from "@/ui/KpiCard";
import { LineChart } from "@/ui/LineChart";
import { Logo } from "@/ui/Logo";
import { Modal } from "@/ui/Modal";
import { MultiSelect } from "@/ui/MultiSelect";
import { NavTabs } from "@/ui/NavTabs";
import { PipelineStepper } from "@/ui/PipelineStepper";
import { QuadrantTile } from "@/ui/QuadrantTile";
import { RaciMatrix } from "@/ui/RaciMatrix";
import { RadarChart } from "@/ui/RadarChart";
import { ReportHeader } from "@/ui/ReportHeader";
import { RiskDelta } from "@/ui/RiskDelta";
import { RiskMeter } from "@/ui/RiskMeter";
import { RoleSwitcher } from "@/ui/RoleSwitcher";
import { ScannerBadge } from "@/ui/ScannerBadge";
import { ScatterChart } from "@/ui/ScatterChart";
import { SegmentedControl } from "@/ui/SegmentedControl";
import { SeverityBadge } from "@/ui/SeverityBadge";
import { SeverityMarker } from "@/ui/SeverityMarker";
import { Skeleton } from "@/ui/Skeleton";
import { SlaBreachCard } from "@/ui/SlaBreachCard";
import { SlaPill } from "@/ui/SlaPill";
import { SlaProjectionTable } from "@/ui/SlaProjectionTable";
import { SlaTrend } from "@/ui/SlaTrend";
import { Sparkline } from "@/ui/Sparkline";
import { StackedBarChart } from "@/ui/StackedBarChart";
import { Tabs } from "@/ui/Tabs";
import { TeamPicker } from "@/ui/TeamPicker";
import { TemplateCard } from "@/ui/TemplateCard";
import { ThreatTag } from "@/ui/ThreatTag";
import { TierBadge } from "@/ui/TierBadge";
import { Toast } from "@/ui/Toast";
import { Toggle } from "@/ui/Toggle";
import { Tooltip } from "@/ui/Tooltip";
import { TopologyMap } from "@/ui/TopologyMap";
import { Treemap } from "@/ui/Treemap";
import { VulnTable } from "@/ui/VulnTable";
import { WidgetCard } from "@/ui/WidgetCard";

/* Lucide icon geometry (ISC), 24px grid, stroke 2 */
export var ICONS = {
  x: [
    [
      "path",
      {
        d: "M18 6 6 18",
      },
    ],
    [
      "path",
      {
        d: "m6 6 12 12",
      },
    ],
  ],
  "chevron-left": [
    [
      "path",
      {
        d: "m15 18-6-6 6-6",
      },
    ],
  ],
  "chevron-right": [
    [
      "path",
      {
        d: "m9 18 6-6-6-6",
      },
    ],
  ],
  grip: [
    [
      "circle",
      {
        cx: 9,
        cy: 12,
        r: 1,
      },
    ],
    [
      "circle",
      {
        cx: 9,
        cy: 5,
        r: 1,
      },
    ],
    [
      "circle",
      {
        cx: 9,
        cy: 19,
        r: 1,
      },
    ],
    [
      "circle",
      {
        cx: 15,
        cy: 12,
        r: 1,
      },
    ],
    [
      "circle",
      {
        cx: 15,
        cy: 5,
        r: 1,
      },
    ],
    [
      "circle",
      {
        cx: 15,
        cy: 19,
        r: 1,
      },
    ],
  ],
  lock: [
    [
      "rect",
      {
        width: 18,
        height: 11,
        x: 3,
        y: 11,
        rx: 2,
      },
    ],
    [
      "path",
      {
        d: "M7 11V7a5 5 0 0 1 10 0v4",
      },
    ],
  ],
  flame: [
    [
      "path",
      {
        d: "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",
      },
    ],
  ],
  skull: [
    [
      "path",
      {
        d: "m12.5 17-.5-1-.5 1h1z",
      },
    ],
    [
      "path",
      {
        d: "M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z",
      },
    ],
    [
      "circle",
      {
        cx: 15,
        cy: 12,
        r: 1,
      },
    ],
    [
      "circle",
      {
        cx: 9,
        cy: 12,
        r: 1,
      },
    ],
  ],
  zap: [
    [
      "path",
      {
        d: "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z",
      },
    ],
  ],
  clock: [
    [
      "path",
      {
        d: "M12 6v6l4 2",
      },
    ],
    [
      "path",
      {
        d: "M20 12v5",
      },
    ],
    [
      "path",
      {
        d: "M20 21h.01",
      },
    ],
    [
      "path",
      {
        d: "M21.25 8.2A10 10 0 1 0 16 21.16",
      },
    ],
  ],
  shield: [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      },
    ],
    [
      "path",
      {
        d: "M12 8v4",
      },
    ],
    [
      "path",
      {
        d: "M12 16h.01",
      },
    ],
  ],
  ticket: [
    [
      "path",
      {
        d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",
      },
    ],
    [
      "path",
      {
        d: "M13 5v2",
      },
    ],
    [
      "path",
      {
        d: "M13 17v2",
      },
    ],
    [
      "path",
      {
        d: "M13 11v2",
      },
    ],
  ],
  check: [
    [
      "path",
      {
        d: "M20 6 9 17l-5-5",
      },
    ],
  ],
};

Object.assign(ICONS, {
  "chevron-down": [
    [
      "path",
      {
        d: "m6 9 6 6 6-6",
      },
    ],
  ],
  "chevron-up": [
    [
      "path",
      {
        d: "m18 15-6-6-6 6",
      },
    ],
  ],
  search: [
    [
      "path",
      {
        d: "m21 21-4.34-4.34",
      },
    ],
    [
      "circle",
      {
        cx: 11,
        cy: 11,
        r: 8,
      },
    ],
  ],
  minus: [
    [
      "path",
      {
        d: "M5 12h14",
      },
    ],
  ],
  info: [
    [
      "circle",
      {
        cx: 12,
        cy: 12,
        r: 10,
      },
    ],
    [
      "path",
      {
        d: "M12 16v-4",
      },
    ],
    [
      "path",
      {
        d: "M12 8h.01",
      },
    ],
  ],
});

/* ================= v3 additions ================= */
Object.assign(ICONS, {
  gauge: [
    [
      "path",
      {
        d: "m12 14 4-4",
      },
    ],
    [
      "path",
      {
        d: "M3.34 19a10 10 0 1 1 17.32 0",
      },
    ],
  ],
  paperclip: [
    [
      "path",
      {
        d: "m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551",
      },
    ],
  ],
  book: [
    [
      "path",
      {
        d: "M12 7v14",
      },
    ],
    [
      "path",
      {
        d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
      },
    ],
  ],
  tag: [
    [
      "path",
      {
        d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
      },
    ],
    [
      "circle",
      {
        cx: 7.5,
        cy: 7.5,
        r: 1,
      },
    ],
  ],
  refresh: [
    [
      "path",
      {
        d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
      },
    ],
    [
      "path",
      {
        d: "M3 3v5h5",
      },
    ],
  ],
  message: [
    [
      "path",
      {
        d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",
      },
    ],
  ],
  briefcase: [
    [
      "path",
      {
        d: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
      },
    ],
    [
      "rect",
      {
        width: 20,
        height: 14,
        x: 2,
        y: 6,
        rx: 2,
      },
    ],
  ],
  ban: [
    [
      "circle",
      {
        cx: 12,
        cy: 12,
        r: 10,
      },
    ],
    [
      "path",
      {
        d: "m4.9 4.9 14.2 14.2",
      },
    ],
  ],
  unlock: [
    [
      "rect",
      {
        width: 18,
        height: 11,
        x: 3,
        y: 11,
        rx: 2,
      },
    ],
    [
      "path",
      {
        d: "M7 11V7a5 5 0 0 1 9.9-1",
      },
    ],
  ],
  plus: [
    [
      "path",
      {
        d: "M5 12h14",
      },
    ],
    [
      "path",
      {
        d: "M12 5v14",
      },
    ],
  ],
  filter: [
    [
      "path",
      {
        d: "M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",
      },
    ],
  ],
  route: [
    [
      "circle",
      {
        cx: 6,
        cy: 19,
        r: 3,
      },
    ],
    [
      "path",
      {
        d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15",
      },
    ],
    [
      "circle",
      {
        cx: 18,
        cy: 5,
        r: 3,
      },
    ],
  ],
  sparkles: [
    [
      "path",
      {
        d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
      },
    ],
    [
      "path",
      {
        d: "M20 3v4",
      },
    ],
    [
      "path",
      {
        d: "M22 5h-4",
      },
    ],
  ],
  target: [
    [
      "circle",
      {
        cx: 12,
        cy: 12,
        r: 10,
      },
    ],
    [
      "circle",
      {
        cx: 12,
        cy: 12,
        r: 6,
      },
    ],
    [
      "circle",
      {
        cx: 12,
        cy: 12,
        r: 2,
      },
    ],
  ],
  flag: [
    [
      "path",
      {
        d: "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528",
      },
    ],
  ],
  workflow: [
    [
      "rect",
      {
        width: 8,
        height: 8,
        x: 3,
        y: 3,
        rx: 2,
      },
    ],
    [
      "path",
      {
        d: "M7 11v4a2 2 0 0 0 2 2h4",
      },
    ],
    [
      "rect",
      {
        width: 8,
        height: 8,
        x: 13,
        y: 13,
        rx: 2,
      },
    ],
  ],
});

Object.assign(ICONS, {
  upload: [
    [
      "path",
      {
        d: "M12 3v12",
      },
    ],
    [
      "path",
      {
        d: "m17 8-5-5-5 5",
      },
    ],
    [
      "path",
      {
        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
      },
    ],
  ],
  download: [
    [
      "path",
      {
        d: "M12 15V3",
      },
    ],
    [
      "path",
      {
        d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
      },
    ],
    [
      "path",
      {
        d: "m7 10 5 5 5-5",
      },
    ],
  ],
  file: [
    [
      "path",
      {
        d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      },
    ],
    [
      "path",
      {
        d: "M14 2v5a1 1 0 0 0 1 1h5",
      },
    ],
    [
      "path",
      {
        d: "M8 13h2",
      },
    ],
    [
      "path",
      {
        d: "M14 13h2",
      },
    ],
    [
      "path",
      {
        d: "M8 17h2",
      },
    ],
    [
      "path",
      {
        d: "M14 17h2",
      },
    ],
  ],
  server: [
    [
      "rect",
      {
        width: 20,
        height: 8,
        x: 2,
        y: 2,
        rx: 2,
      },
    ],
    [
      "rect",
      {
        width: 20,
        height: 8,
        x: 2,
        y: 14,
        rx: 2,
      },
    ],
    [
      "path",
      {
        d: "M6 6h.01",
      },
    ],
    [
      "path",
      {
        d: "M6 18h.01",
      },
    ],
  ],
  database: [
    [
      "ellipse",
      {
        cx: 12,
        cy: 5,
        rx: 9,
        ry: 3,
      },
    ],
    [
      "path",
      {
        d: "M3 5V19A9 3 0 0 0 21 19V5",
      },
    ],
    [
      "path",
      {
        d: "M3 12A9 3 0 0 0 21 12",
      },
    ],
  ],
  globe: [
    [
      "circle",
      {
        cx: 12,
        cy: 12,
        r: 10,
      },
    ],
    [
      "path",
      {
        d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",
      },
    ],
    [
      "path",
      {
        d: "M2 12h20",
      },
    ],
  ],
  router: [
    [
      "rect",
      {
        width: 20,
        height: 8,
        x: 2,
        y: 14,
        rx: 2,
      },
    ],
    [
      "path",
      {
        d: "M6.01 18H6",
      },
    ],
    [
      "path",
      {
        d: "M10.01 18H10",
      },
    ],
    [
      "path",
      {
        d: "M15 10v4",
      },
    ],
    [
      "path",
      {
        d: "M17.84 7.17a4 4 0 0 0-5.66 0",
      },
    ],
    [
      "path",
      {
        d: "M20.66 4.34a8 8 0 0 0-11.31 0",
      },
    ],
  ],
  key: [
    [
      "path",
      {
        d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
      },
    ],
  ],
  monitor: [
    [
      "rect",
      {
        width: 20,
        height: 14,
        x: 2,
        y: 3,
        rx: 2,
      },
    ],
    [
      "path",
      {
        d: "M8 21h8",
      },
    ],
    [
      "path",
      {
        d: "M12 17v4",
      },
    ],
  ],
  user: [
    [
      "circle",
      {
        cx: 12,
        cy: 8,
        r: 5,
      },
    ],
    [
      "path",
      {
        d: "M20 21a8 8 0 0 0-16 0",
      },
    ],
  ],
  ellipsis: [
    [
      "circle",
      {
        cx: 12,
        cy: 12,
        r: 1,
      },
    ],
    [
      "circle",
      {
        cx: 19,
        cy: 12,
        r: 1,
      },
    ],
    [
      "circle",
      {
        cx: 5,
        cy: 12,
        r: 1,
      },
    ],
  ],
  template: [
    [
      "rect",
      {
        width: 18,
        height: 7,
        x: 3,
        y: 3,
        rx: 1,
      },
    ],
    [
      "rect",
      {
        width: 9,
        height: 7,
        x: 3,
        y: 14,
        rx: 1,
      },
    ],
    [
      "rect",
      {
        width: 5,
        height: 7,
        x: 16,
        y: 14,
        rx: 1,
      },
    ],
  ],
  "trend-up": [
    [
      "path",
      {
        d: "M16 7h6v6",
      },
    ],
    [
      "path",
      {
        d: "m22 7-8.5 8.5-5-5L2 17",
      },
    ],
  ],
  "trend-down": [
    [
      "path",
      {
        d: "M16 17h6v-6",
      },
    ],
    [
      "path",
      {
        d: "m22 17-8.5-8.5-5 5L2 7",
      },
    ],
  ],
  "shield-check": [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      },
    ],
    [
      "path",
      {
        d: "m9 12 2 2 4-4",
      },
    ],
  ],
});

/* ---------- FileDropzone ---------- */

window.VAPTLens = Object.assign(window.VAPTLens || {}, {
  Icon: Icon,
  Logo: Logo,
  Button: Button,
  SeverityBadge: SeverityBadge,
  ThreatTag: ThreatTag,
  SlaPill: SlaPill,
  FilterChip: FilterChip,
  KpiCard: KpiCard,
  WidgetCard: WidgetCard,
  NavTabs: NavTabs,
  RiskMeter: RiskMeter,
  KanbanCard: KanbanCard,
  CodeSnippet: CodeSnippet,
  SeverityMarker: SeverityMarker,
  Tooltip: Tooltip,
  Checkbox: Checkbox,
  Toggle: Toggle,
  SegmentedControl: SegmentedControl,
  Input: Input,
  MultiSelect: MultiSelect,
  Modal: Modal,
  Drawer: Drawer,
  VulnTable: VulnTable,
  PipelineStepper: PipelineStepper,
  DiffBadge: DiffBadge,
  QuadrantTile: QuadrantTile,
  AuditLogRow: AuditLogRow,
  EmptyState: EmptyState,
  Skeleton: Skeleton,
  Toast: Toast,
  BarChart: BarChart,
  DonutChart: DonutChart,
  Heatmap: Heatmap,
  ReportHeader: ReportHeader,
  FindingDetail: FindingDetail,
  ChartLegend: ChartLegend,
  FileDropzone: FileDropzone,
  ScannerBadge: ScannerBadge,
  ColumnMapRow: ColumnMapRow,
  Tabs: Tabs,
  DropdownMenu: DropdownMenu,
  Banner: Banner,
  RoleSwitcher: RoleSwitcher,
  TeamPicker: TeamPicker,
  RaciMatrix: RaciMatrix,
  Sparkline: Sparkline,
  SlaTrend: SlaTrend,
  EffortMeter: EffortMeter,
  TierBadge: TierBadge,
  AssetRow: AssetRow,
  BreachList: BreachList,
  ExposureBars: ExposureBars,
  RiskDelta: RiskDelta,
  TopologyMap: TopologyMap,
  TemplateCard: TemplateCard,
  LineChart: LineChart,
  StackedBarChart: StackedBarChart,
  RadarChart: RadarChart,
  Treemap: Treemap,
  ScatterChart: ScatterChart,
  SlaBreachCard: SlaBreachCard,
  SlaProjectionTable: SlaProjectionTable,
  ExposureRegistry: ExposureRegistry,
});
