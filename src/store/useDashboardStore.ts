import { create } from "zustand";
import type {
  AuditEntry,
  FieldKey,
  Finding,
  FilterState,
  SavedMapping,
  ScanBatch,
  Severity,
  WidgetConfig,
  EnterpriseRole,
} from "../lib/types";
import { loadLayout, loadMappings, saveLayout, saveMappings, loadRemediationStatuses, saveRemediationStatuses, loadGovernance, saveGovernance, loadAuditLog, saveAuditLog } from "../lib/storage";
import { generateSampleData } from "../lib/sampleData";
import { enrichFindings } from "../lib/aggregate";

function uid(prefix = "w"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export const PATCH_FLOW = [
  "Unassigned",
  "Assigned",
  "In Progress",
  "Pending Verification",
  "Resolved",
] as const;
type PatchStatus = (typeof PATCH_FLOW)[number];

function makeAudit(action: string, detail: string, actor: string): AuditEntry {
  return {
    id: uid("audit"),
    ts: new Date().toISOString(),
    action,
    detail,
    actor,
  };
}

export function defaultWidgets(): WidgetConfig[] {
  return [
    {
      id: uid(),
      title: "Total Findings",
      chartType: "kpi",
      groupBy: "severity",
      aggregation: "count",
      layout: { x: 0, y: 0, w: 2, h: 2 },
    },
    {
      id: uid(),
      title: "Zero-day",
      chartType: "kpi",
      groupBy: "isZeroDay",
      aggregation: "count",
      layout: { x: 2, y: 0, w: 2, h: 2 },
    },
    {
      id: uid(),
      title: "Exploitable",
      chartType: "kpi",
      groupBy: "isExploitable",
      aggregation: "count",
      layout: { x: 4, y: 0, w: 2, h: 2 },
    },
    {
      id: uid(),
      title: "Breached",
      chartType: "kpi",
      groupBy: "slaStatus",
      aggregation: "count",
      layout: { x: 6, y: 0, w: 2, h: 2 },
    },
    {
      id: uid(),
      title: "EOL/Obsolete",
      chartType: "kpi",
      groupBy: "isEol",
      aggregation: "count",
      layout: { x: 8, y: 0, w: 2, h: 2 },
    },
    {
      id: uid(),
      title: "Unpatched > 6 Months",
      chartType: "kpi",
      groupBy: "unpatchedAge",
      aggregation: "count",
      layout: { x: 10, y: 0, w: 2, h: 2 },
    },
    {
      id: uid(),
      title: "Severity Distribution",
      chartType: "donut",
      groupBy: "severity",
      aggregation: "count",
      sortBy: "label",
      layout: { x: 0, y: 2, w: 4, h: 4 },
    },
    {
      id: uid(),
      title: "SLA Compliance",
      chartType: "donut",
      groupBy: "slaStatus",
      aggregation: "count",
      sortBy: "label",
      layout: { x: 4, y: 2, w: 4, h: 4 },
    },
    {
      id: uid(),
      title: "Vulnerability Lifecycle",
      chartType: "donut",
      groupBy: "lifecycle",
      aggregation: "count",
      sortBy: "label",
      layout: { x: 8, y: 2, w: 4, h: 4 },
    },
    {
      id: uid(),
      title: "Top 10 IPs",
      chartType: "bar",
      groupBy: "host",
      colorBy: "severity",
      aggregation: "count",
      sortBy: "value",
      topN: 10,
      layout: { x: 0, y: 6, w: 6, h: 4 },
    },
    {
      id: uid(),
      title: "Trend Over Time",
      chartType: "line",
      groupBy: "scanMonth",
      colorBy: "severity",
      aggregation: "count",
      sortBy: "label",
      topN: 15,
      layout: { x: 6, y: 6, w: 6, h: 4 },
    },
    {
      id: uid(),
      title: "CVSS Score Histogram",
      chartType: "histogram",
      groupBy: "cvssBucket",
      aggregation: "count",
      layout: { x: 0, y: 10, w: 6, h: 4 },
    },
    {
      id: uid(),
      title: "Trend (Area)",
      chartType: "area",
      groupBy: "scanMonth",
      colorBy: "severity",
      aggregation: "count",
      sortBy: "label",
      topN: 15,
      layout: { x: 6, y: 10, w: 6, h: 4 },
    },
    {
      id: uid(),
      title: "Findings",
      chartType: "table",
      groupBy: "name",
      aggregation: "count",
      layout: { x: 0, y: 14, w: 12, h: 6 },
    },
  ];
}

const initialFilters: FilterState = {
  severities: [],
  hosts: [],
  tools: [],
  scanIds: [],
  ports: [],
  dateRange: undefined,
  search: "",
  crossFilters: [],
};

interface DashboardState {
  findings: Finding[];
  batches: ScanBatch[];
  filters: FilterState;
  widgets: WidgetConfig[];
  mappings: SavedMapping[];
  scanline: number;
  pendingUpload: {
    headers: string[];
    csvText: string;
    batch: ScanBatch;
    suggestedTool: string;
  } | null;

  addBatch: (findings: Finding[], batch: ScanBatch) => void;
  updateBatchLabel: (id: string, label: string) => void;
  setPendingUpload: (p: DashboardState["pendingUpload"]) => void;
  clearPendingUpload: () => void;

  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  toggleArrayFilter: <K extends "severities" | "hosts" | "tools" | "scanIds" | "ports">(
    key: K,
    value: FilterState[K][number]
  ) => void;
  clearFilters: () => void;

  addCrossFilter: (field: FieldKey, value: string) => void;
  removeCrossFilter: (field: FieldKey, value: string) => void;
  toggleCrossFilter: (field: FieldKey, value: string) => void;
  clearCrossFilters: () => void;

  addWidget: (widget: WidgetConfig) => void;
  updateWidget: (id: string, patch: Partial<WidgetConfig>) => void;
  removeWidget: (id: string) => void;
  setLayout: (layouts: { i: string; x: number; y: number; w: number; h: number }[]) => void;

  saveMapping: (mapping: SavedMapping) => void;
  loadSampleData: () => void;
  clearAllData: () => void;
  remediationStatuses: Record<string, "todo" | "in_progress" | "in_review" | "done">;
  updateRemediationStatus: (id: string, status: "todo" | "in_progress" | "in_review" | "done") => void;

  userRole: EnterpriseRole;
  twoFactorEnabled: boolean;
  setUserRole: (role: EnterpriseRole) => void;
  toggleTwoFactor: () => void;
  assignFindingTeam: (
    findingId: string,
    team: Finding["assignedTeam"],
    raci?: Finding["raciRole"]
  ) => void;
  raiseTicket: (findingId: string) => string;
  remediateAllFiltered: () => void;

  /** Per-host findings drawer state — survives tab switches (component unmounts). */
  hostDrawerHost: string | null;
  hostDrawerScroll: number;
  openHostDrawer: (host: string) => void;
  closeHostDrawer: () => void;
  setHostDrawerScroll: (scroll: number) => void;

  auditLog: AuditEntry[];
  clearAuditLog: () => void;
  /** Advances a finding through the patch verification pipeline. */
  advancePatchStatus: (findingId: string) => void;
}

const persistedGovernance = loadGovernance();

export const useDashboardStore = create<DashboardState>((set) => ({
  findings: [],
  batches: [],
  filters: initialFilters,
  widgets: loadLayout() ?? defaultWidgets(),
  mappings: loadMappings(),
  scanline: 0,
  pendingUpload: null,
  remediationStatuses: loadRemediationStatuses(),
  userRole: persistedGovernance?.userRole ?? "Administrator",
  twoFactorEnabled: persistedGovernance?.twoFactorEnabled ?? true,
  auditLog: loadAuditLog(),
  setUserRole: (role) =>
    set((s) => {
      const next = { userRole: role, twoFactorEnabled: s.twoFactorEnabled };
      saveGovernance(next);
      return next;
    }),
  toggleTwoFactor: () =>
    set((s) => {
      const next = { twoFactorEnabled: !s.twoFactorEnabled, userRole: s.userRole };
      saveGovernance(next);
      return next;
    }),

  clearAuditLog: () =>
    set(() => {
      saveAuditLog([]);
      return { auditLog: [] };
    }),

  assignFindingTeam: (findingId, team, raci) =>
    set((s) => {
      const findings = s.findings.map((f) =>
        f.id === findingId
          ? {
              ...f,
              assignedTeam: team,
              raciRole: raci ?? (team === "Server Team" ? "Responsible" : "Accountable"),
              patchStatus: "Assigned" as const,
            }
          : f
      );
      const target = findings.find((f) => f.id === findingId);
      const nextAudit = target
        ? [makeAudit("ASSIGN", `${target.name} → ${team} (${target.raciRole})`, s.userRole), ...s.auditLog].slice(0, 200)
        : s.auditLog;
      saveAuditLog(nextAudit);
      return { findings, auditLog: nextAudit };
    }),

  raiseTicket: (findingId) => {
    const ticketId = `SEC-${Math.floor(1000 + Math.random() * 9000)}`;
    set((s) => {
      const findings = s.findings.map((f) =>
        f.id === findingId ? { ...f, ticketId, patchStatus: "In Progress" as const } : f
      );
      const target = findings.find((f) => f.id === findingId);
      const nextAudit = target
        ? [makeAudit("TICKET", `${target.name} → ${ticketId} (${target.host})`, s.userRole), ...s.auditLog].slice(0, 200)
        : s.auditLog;
      saveAuditLog(nextAudit);
      return { findings, auditLog: nextAudit };
    });
    return ticketId;
  },

  advancePatchStatus: (findingId) =>
    set((s) => {
      const f = s.findings.find((x) => x.id === findingId);
      if (!f) return s;
      const current = (f.patchStatus ?? "Unassigned") as PatchStatus;
      const idx = PATCH_FLOW.indexOf(current);
      const nextStatus = PATCH_FLOW[Math.min(idx + 1, PATCH_FLOW.length - 1)];
      const findings = s.findings.map((x) =>
        x.id === findingId ? { ...x, patchStatus: nextStatus as Finding["patchStatus"] } : x
      );
      const nextAudit = [
        makeAudit("PATCH", `${f.name} → ${nextStatus} (${f.host})`, s.userRole),
        ...s.auditLog,
      ].slice(0, 200);
      saveAuditLog(nextAudit);
      return { findings, auditLog: nextAudit };
    }),

  remediateAllFiltered: () =>
    set((s) => {
      // Mark active findings as fixed
      return {
        findings: s.findings.map((f) => ({
          ...f,
          lifecycle: "Fixed" as const,
          patchStatus: "Resolved" as const,
        })),
      };
    }),

  hostDrawerHost: null,
  hostDrawerScroll: 0,
  openHostDrawer: (host) =>
    set((s) => ({
      hostDrawerHost: host,
      // Preserve scroll when re-opening the same host (e.g. tab-switch
      // remount re-reads the ?host= URL); reset it for a different host.
      hostDrawerScroll: s.hostDrawerHost === host ? s.hostDrawerScroll : 0,
    })),
  closeHostDrawer: () => set({ hostDrawerHost: null, hostDrawerScroll: 0 }),
  setHostDrawerScroll: (scroll) => set({ hostDrawerScroll: scroll }),

  updateRemediationStatus: (id, status) =>
    set((s) => {
      const next = { ...s.remediationStatuses, [id]: status };
      saveRemediationStatuses(next);
      return { remediationStatuses: next };
    }),

  addBatch: (findings, batch) =>
    set((s) => {
      const nextBatches = [...s.batches, batch];
      const nextFindings = enrichFindings([...s.findings, ...findings], nextBatches);
      const nextWidgets = s.widgets;
      saveLayout(nextWidgets);
      return {
        findings: nextFindings,
        batches: nextBatches,
        scanline: s.scanline + 1,
      };
    }),

  setPendingUpload: (p) => set({ pendingUpload: p }),
  clearPendingUpload: () => set({ pendingUpload: null }),

  updateBatchLabel: (id, label) =>
    set((s) => ({
      batches: s.batches.map((b) => (b.id === id ? { ...b, label } : b)),
      findings: s.findings.map((f) =>
        f.scanId === id ? { ...f, scanLabel: label } : f
      ),
    })),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  toggleArrayFilter: (key, value) =>
    set((s) => {
      const arr = s.filters[key] as unknown as string[];
      const exists = arr.includes(value);
      const next = exists ? arr.filter((v) => v !== value) : [...arr, value];
      return { filters: { ...s.filters, [key]: next } };
    }),

  clearFilters: () => set({ filters: initialFilters }),

  addCrossFilter: (field, value) =>
    set((s) => {
      const exists = s.filters.crossFilters.some(
        (c) => c.field === field && c.value === value
      );
      if (exists) return s;
      return {
        filters: {
          ...s.filters,
          crossFilters: [...s.filters.crossFilters, { field, value }],
        },
      };
    }),

  removeCrossFilter: (field, value) =>
    set((s) => ({
      filters: {
        ...s.filters,
        crossFilters: s.filters.crossFilters.filter(
          (c) => !(c.field === field && c.value === value)
        ),
      },
    })),

  toggleCrossFilter: (field, value) =>
    set((s) => {
      const exists = s.filters.crossFilters.some(
        (c) => c.field === field && c.value === value
      );
      if (exists) {
        return {
          filters: {
            ...s.filters,
            crossFilters: s.filters.crossFilters.filter(
              (c) => !(c.field === field && c.value === value)
            ),
          },
        };
      }
      // single-select per field: replace any existing entry of same field
      const filtered = s.filters.crossFilters.filter((c) => c.field !== field);
      return {
        filters: {
          ...s.filters,
          crossFilters: [...filtered, { field, value }],
        },
      };
    }),

  clearCrossFilters: () =>
    set((s) => ({ filters: { ...s.filters, crossFilters: [] } })),

  addWidget: (widget) =>
    set((s) => {
      const widgets = [...s.widgets, widget];
      saveLayout(widgets);
      return { widgets };
    }),

  updateWidget: (id, patch) =>
    set((s) => {
      const widgets = s.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w));
      saveLayout(widgets);
      return { widgets };
    }),

  removeWidget: (id) =>
    set((s) => {
      const widgets = s.widgets.filter((w) => w.id !== id);
      saveLayout(widgets);
      return { widgets };
    }),

  setLayout: (layouts) =>
    set((s) => {
      const byId = new Map(layouts.map((l) => [l.i, l]));
      const widgets = s.widgets.map((w) => {
        const l = byId.get(w.id);
        return l ? { ...w, layout: { x: l.x, y: l.y, w: l.w, h: l.h } } : w;
      });
      saveLayout(widgets);
      return { widgets };
    }),

  saveMapping: (mapping) =>
    set((s) => {
      const existing = s.mappings.findIndex((m) => m.name === mapping.name);
      let mappings: SavedMapping[];
      if (existing >= 0) {
        mappings = s.mappings.map((m, i) => (i === existing ? mapping : m));
      } else {
        mappings = [...s.mappings, mapping];
      }
      saveMappings(mappings);
      return { mappings };
    }),

  loadSampleData: () =>
    set((s) => {
      const { findings, batches } = generateSampleData();
      const enriched = enrichFindings(findings, batches);
      return {
        findings: enriched,
        batches,
        filters: initialFilters,
        scanline: s.scanline + 1,
      };
    }),

  clearAllData: () =>
    set({
      findings: [],
      batches: [],
      filters: initialFilters,
      remediationStatuses: {},
    }),
}));

export { uid };
export type { FilterState, Severity };
