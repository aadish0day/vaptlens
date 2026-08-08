import { useMemo } from "react";
import { useDashboardStore } from "../../store/useDashboardStore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Flame, Skull, Zap, Gauge, Radar } from "lucide-react";
import { SEVERITY_HEX, SEVERITIES } from "../../lib/chart-theme";
import type { Finding, Severity } from "../../lib/types";
import { cn } from "../../lib/utils";

interface CategoryDef {
  id: "cisaKev" | "ransomwareVector" | "isZeroDay";
  label: string;
  match: (f: Finding) => boolean;
  icon: typeof Flame;
  color: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "cisaKev",
    label: "CISA KEV",
    match: (f) => f.cisaKev === "CISA KEV",
    icon: Flame,
    color: "#DC2626",
  },
  {
    id: "ransomwareVector",
    label: "Ransomware",
    match: (f) => f.ransomwareVector === "Ransomware Threat",
    icon: Skull,
    color: "#7C3AED",
  },
  {
    id: "isZeroDay",
    label: "Zero-day",
    match: (f) => f.isZeroDay === "Zero-day",
    icon: Zap,
    color: "#4F46E5",
  },
];

/** Weighted severity weights used to derive the breach score. */
const BREACH_WEIGHT: Record<Severity, number> = {
  Critical: 10,
  High: 8,
  Medium: 6,
  Low: 4,
  Info: 2,
};

export function BreachBreakdownWidget({
  findings: findingsProp,
}: {
  findings?: Finding[];
}) {
  const storeFindings = useDashboardStore((s) => s.findings);
  const findings = findingsProp ?? storeFindings;

  const active = useMemo(
    () => findings.filter((f) => f.lifecycle !== "Fixed"),
    [findings]
  );

  const rows = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const members = active.filter(cat.match);
      const bySeverity = SEVERITIES.map((s) => ({
        severity: s,
        count: members.filter((f) => f.severity === s).length,
      }));
      const total = members.length;
      const breachScore = members.reduce(
        (sum, f) => sum + (f.cvss ?? 0) + BREACH_WEIGHT[f.severity],
        0
      );
      return { ...cat, bySeverity, total, breachScore };
    });
  }, [active]);

  const flaggedFindings = useMemo(
    () => active.filter((f) => CATEGORIES.some((c) => c.match(f))).length,
    [active]
  );

  const maxScore = Math.max(1, ...rows.map((r) => r.breachScore));

  return (
    <Card className="flex h-full flex-col border-border bg-card">
      <CardHeader className="pb-2 border-b border-border">
        <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
          <span className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" /> Threat Intel Breach Breakdown
          </span>
          <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
            {flaggedFindings} Flagged
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-1 overflow-y-auto space-y-3">
        {active.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No active findings to analyze.
          </div>
        ) : (
          <>
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.id} className="space-y-1.5">
                  {/* Category header */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Icon className="h-3.5 w-3.5" style={{ color: row.color }} />
                      {row.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{row.total}</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground" title="Weighted breach score (CVSS + severity)">
                        <Gauge className="h-3 w-3" />
                        {row.breachScore}
                      </span>
                    </span>
                  </div>

                  {/* Severity-stacked bar */}
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    {row.bySeverity.map(({ severity, count }) =>
                      count > 0 ? (
                        <div
                          key={severity}
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${(count / Math.max(1, row.total)) * 100}%`,
                            backgroundColor: SEVERITY_HEX[severity],
                          }}
                          title={`${severity}: ${count}`}
                        />
                      ) : null
                    )}
                  </div>

                  {/* Severity legend + score meter */}
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {row.bySeverity.map(({ severity, count }) =>
                        count > 0 ? (
                          <span key={severity} className="flex items-center gap-1">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: SEVERITY_HEX[severity] }}
                            />
                            {severity}: {count}
                          </span>
                        ) : null
                      )}
                    </div>
                    <span
                      className={cn(
                        "h-1 w-16 rounded-full bg-muted overflow-hidden",
                        "relative"
                      )}
                    >
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${(row.breachScore / maxScore) * 100}%`,
                          backgroundColor: row.color,
                        }}
                      />
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Aggregate breach exposure */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-[10px] font-medium text-muted-foreground">
              <span>Total breach exposure (all intel sources)</span>
              <span className="font-mono font-bold text-foreground">
                {rows.reduce((s, r) => s + r.breachScore, 0)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
