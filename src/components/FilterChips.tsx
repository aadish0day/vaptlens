import { X } from "lucide-react";
import { useDashboardStore } from "../store/useDashboardStore";
import { severityColor } from "../lib/colors";

const FIELD_LABEL: Record<string, string> = {
  severity: "Severity",
  host: "Host",
  tool: "Tool",
  scanLabel: "Scan",
  port: "Port",
  protocol: "Protocol",
  cve: "CVE",
  pluginId: "Plugin",
  name: "Finding",
  cvssBucket: "CVSS",
  scanDate: "Date",
};

export function FilterChips() {
  const crossFilters = useDashboardStore((s) => s.filters.crossFilters);
  const removeCrossFilter = useDashboardStore((s) => s.removeCrossFilter);
  const clearCrossFilters = useDashboardStore((s) => s.clearCrossFilters);

  if (crossFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
        Cross-filters
      </span>
      {crossFilters.map((cf) => {
        const isSev = cf.field === "severity";
        const color = isSev ? severityColor(cf.value) : "#3DDC97";
        return (
          <button
            key={`${cf.field}:${cf.value}`}
            onClick={() => removeCrossFilter(cf.field, cf.value)}
            className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            style={{ borderColor: color, color }}
            title="Click to remove"
          >
            <span className="text-muted">{FIELD_LABEL[cf.field] ?? cf.field}:</span>
            <span className="font-semibold">{cf.value}</span>
            <X size={11} />
          </button>
        );
      })}
      <button
        onClick={clearCrossFilters}
        className="font-mono text-[10px] uppercase text-muted underline-offset-2 hover:underline"
      >
        clear all
      </button>
    </div>
  );
}
