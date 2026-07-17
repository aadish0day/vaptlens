import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useDashboardStore } from "../store/useDashboardStore";
import { SEVERITY_HEX } from "../lib/chart-theme";
import type { Severity } from "../lib/types";
import { cn } from "../lib/utils";

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
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/40 px-4 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Cross-filters
      </span>
      <AnimatePresence mode="popLayout">
        {crossFilters.map((cf) => {
          const isSev = cf.field === "severity";
          const color = isSev ? SEVERITY_HEX[cf.value as Severity] : undefined;
          return (
            <motion.button
              key={`${cf.field}:${cf.value}`}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              onClick={() => removeCrossFilter(cf.field, cf.value)}
              className={cn(
                "group flex items-center gap-1.5 rounded-full border bg-card py-1 pl-2.5 pr-1.5 text-xs shadow-sm transition-colors",
                "hover:border-destructive/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              style={
                color
                  ? { borderColor: `${color}66`, color }
                  : { borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }
              }
              title="Click to remove"
            >
              <span className="font-medium text-muted-foreground">
                {FIELD_LABEL[cf.field] ?? cf.field}:
              </span>
              <span className="font-semibold">{cf.value}</span>
              <span className="ml-0.5 grid h-4 w-4 place-items-center rounded-full bg-muted/60 text-muted-foreground transition-colors group-hover:bg-destructive group-hover:text-destructive-foreground">
                <X className="h-3 w-3" />
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
      <button
        onClick={clearCrossFilters}
        className="ml-1 text-[11px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-destructive hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
