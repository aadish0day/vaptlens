import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { findingRiskContribution } from "../../lib/risk";
import { SEVERITY_HEX } from "../../lib/chart-theme";
import type { Finding } from "../../lib/types";
import type { ChartProps } from "./types";
import { cn } from "../../lib/utils";

/**
 * Host-risk widget. Ranks the top hosts by weighted risk
 * (severity × exploit × intel × aging). Clicking a host
 * cross-filters the dashboard.
 */
export function HostRiskWidget({ widget, filtered, onSelect, activeCrossFilters }: ChartProps) {
  const rows = useMemo(() => {
    const active = filtered.filter((f: Finding) => f.lifecycle !== "Fixed");
    const byHost = new Map<string, Finding[]>();
    for (const f of active) {
      if (!byHost.has(f.host)) byHost.set(f.host, []);
      byHost.get(f.host)!.push(f);
    }
    return Array.from(byHost.entries())
      .map(([host, list]) => ({
        host,
        score: Math.round(list.reduce((s, f) => s + findingRiskContribution(f), 0)),
        count: list.length,
        critical: list.filter((f) => f.severity === "Critical").length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [filtered]);

  const maxScore = Math.max(1, ...rows.map((r) => r.score));

  return (
    <div className="flex h-full flex-col justify-center px-4 py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-2">
        <Trophy className="h-3.5 w-3.5 text-primary" />
        {widget.title}
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No active findings to rank.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const active = activeCrossFilters.some(
              (cf) => cf.field === "host" && cf.value === r.host
            );
            return (
              <button
                key={r.host}
                type="button"
                onClick={() => onSelect("host", r.host)}
                aria-pressed={active}
                title={
                  active
                    ? "Filtering dashboard by host — click to remove"
                    : "Click to cross-filter the dashboard by this host"
                }
                className={cn(
                  "w-full rounded-lg px-2 py-1.5 text-left transition-all",
                  active
                    ? "bg-primary-soft ring-1 ring-primary/30"
                    : "hover:bg-accent"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="font-mono text-[9px] font-bold text-muted-foreground">
                      #{i + 1}
                    </span>
                    <span className="truncate text-xs font-semibold text-foreground">
                      {r.host}
                    </span>
                    {r.critical > 0 && (
                      <span className="rounded bg-rose-500/10 px-1 py-0.5 text-[8px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {r.critical}C
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-sm font-extrabold text-foreground">
                    {r.score}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(r.score / maxScore) * 100}%`,
                      backgroundColor:
                        r.score / maxScore > 0.7
                          ? SEVERITY_HEX.Critical
                          : r.score / maxScore > 0.4
                          ? SEVERITY_HEX.High
                          : SEVERITY_HEX.Medium,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
      <p className="mt-2 text-[9px] text-muted-foreground">
        Weighted risk = severity × exploit × threat-intel × aging
      </p>
    </div>
  );
}
