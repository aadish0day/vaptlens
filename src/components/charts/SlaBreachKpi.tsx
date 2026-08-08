import { useMemo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { SEVERITY_HEX } from "../../lib/chart-theme";
import type { Finding } from "../../lib/types";
import type { ChartProps } from "./types";
import { cn } from "../../lib/utils";

const BREACH_ROWS = ["Critical", "High", "Medium", "Low", "Info"] as const;

/**
 * SLA breach-count KPI widget.
 * Shows total breached findings with a per-severity breakdown.
 * Clicking cross-filters the dashboard by slaStatus = Breached (or by
 * severity when clicking a breakdown row).
 */
export function SlaBreachKpiWidget({ filtered, onSelect, activeCrossFilters }: ChartProps) {
  const active = useMemo(
    () => filtered.filter((f: Finding) => f.lifecycle !== "Fixed"),
    [filtered]
  );

  const breached = useMemo(
    () => active.filter((f) => f.slaStatus === "Breached"),
    [active]
  );

  const bySeverity = useMemo(() => {
    return BREACH_ROWS.map((sev) => ({
      severity: sev,
      count: breached.filter((f) => f.severity === sev).length,
    }));
  }, [breached]);

  const breachedFilterActive = activeCrossFilters.some(
    (cf) => cf.field === "slaStatus" && cf.value === "Breached"
  );

  const handleBreachedClick = () => {
    onSelect("slaStatus", "Breached");
  };

  return (
    <div className="flex h-full flex-col justify-center px-4 py-2">
      <div
        role="button"
        tabIndex={0}
        onClick={handleBreachedClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBreachedClick();
          }
        }}
        aria-pressed={breachedFilterActive}
        title={
          breachedFilterActive
            ? "Filtering by breached SLA — click to remove"
            : "Click to filter the dashboard to breached-SLA findings"
        }
        className={cn(
          "rounded-lg p-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
          breachedFilterActive && "bg-primary-soft ring-1 ring-primary/30"
        )}
      >
        <div className="flex items-end gap-2">
          <span
            className="text-4xl font-semibold tracking-tight tabular-nums"
            style={{ color: breached.length > 0 ? SEVERITY_HEX.Critical : "#059669" }}
          >
            {breached.length.toLocaleString()}
          </span>
          <span className="pb-1 text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            {breached.length > 0 ? (
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            )}
            SLA breaches
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {bySeverity.map((row) => {
          const severityActive = activeCrossFilters.some(
            (cf) => cf.field === "severity" && cf.value === row.severity
          );
          return (
            <button
              key={row.severity}
              type="button"
              onClick={() => onSelect("severity", row.severity)}
              aria-pressed={severityActive}
              title="Click to filter by severity"
              className={cn(
                "flex w-full items-center justify-between rounded px-1.5 py-0.5 text-left transition-colors hover:bg-accent",
                severityActive && "bg-primary-soft"
              )}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: SEVERITY_HEX[row.severity] }}
                />
                {row.severity}
              </span>
              <span className="font-mono text-xs font-bold text-foreground">
                {row.count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[9px] text-muted-foreground">
        SLA targets: Crit 14d · High 30d · Med 90d
      </p>
    </div>
  );
}
