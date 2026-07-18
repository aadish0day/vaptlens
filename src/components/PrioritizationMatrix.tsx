import { useMemo, useState } from "react";
import { useDashboardStore } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import type { Finding } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Shield, Zap, Target, Sliders, Calendar } from "lucide-react";
import { SeverityBadge } from "./severity-badge";

type QuadrantId = "quick_wins" | "strategic" | "mundane" | "deferrable";

interface PrioritizedFinding extends Finding {
  effortScore: number; // 1 to 10
  effortLabel: "Low" | "Medium" | "High";
}

export function PrioritizationMatrix() {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantId | null>(null);

  // Apply active global filters, excluding Fixed placeholders
  const filteredFindings = useMemo(() => {
    return applyFilters(findings, filters).filter((f: Finding) => f.lifecycle !== "Fixed");
  }, [findings, filters]);

  // Heuristic effort score estimator
  const prioritizedFindings = useMemo<PrioritizedFinding[]>(() => {
    return filteredFindings.map((f: Finding) => {
      const text = `${f.name} ${f.description ?? ""} ${f.solution ?? ""}`.toLowerCase();
      let score = 5.0; // Default Medium Effort

      // Low Effort Heuristics: configurations, tweaks, parameter changes, simple updates
      if (
        text.includes("disable") ||
        text.includes("enable hsts") ||
        text.includes("configure") ||
        text.includes("registry") ||
        text.includes("port") ||
        text.includes("tls") ||
        text.includes("cipher") ||
        text.includes("hsts") ||
        text.includes("missing header") ||
        text.includes("banner")
      ) {
        score = 2.0 + (f.cvss ? (10 - f.cvss) / 10 : 0.5); // Low effort
      }
      // High Effort Heuristics: code architecture, EOL OS upgrades, database migrations, re-writing scripts
      else if (
        text.includes("upgrade operating system") ||
        text.includes("re-architect") ||
        text.includes("rewrite") ||
        text.includes("migrate") ||
        text.includes("replace hardware") ||
        text.includes("eol") ||
        text.includes("obsolete") ||
        text.includes("end of life") ||
        text.includes("deprecated")
      ) {
        score = 8.0 - (f.cvss ? f.cvss / 10 : 0.5); // High effort
      }

      let label: "Low" | "Medium" | "High" = "Medium";
      if (score < 4.0) label = "Low";
      else if (score > 7.0) label = "High";

      return {
        ...f,
        effortScore: score,
        effortLabel: label,
      };
    });
  }, [filteredFindings]);

  // Group into 2x2 quadrants
  // CVSS >= 7 is High Risk, Effort >= 5.0 is High Effort
  const quadrants = useMemo(() => {
    const quick_wins: PrioritizedFinding[] = []; // High Risk, Low Effort
    const strategic: PrioritizedFinding[] = [];  // High Risk, High Effort
    const mundane: PrioritizedFinding[] = [];    // Low Risk, Low Effort
    const deferrable: PrioritizedFinding[] = []; // Low Risk, High Effort

    prioritizedFindings.forEach((f) => {
      const isHighRisk = (f.cvss ?? 0) >= 7.0 || f.severity === "Critical" || f.severity === "High";
      const isHighEffort = f.effortScore >= 5.0;

      if (isHighRisk && !isHighEffort) quick_wins.push(f);
      else if (isHighRisk && isHighEffort) strategic.push(f);
      else if (!isHighRisk && !isHighEffort) mundane.push(f);
      else deferrable.push(f);
    });

    return { quick_wins, strategic, mundane, deferrable };
  }, [prioritizedFindings]);

  const activeList = selectedQuadrant ? quadrants[selectedQuadrant] : [];

  const getQuadrantTitle = (id: QuadrantId) => {
    if (id === "quick_wins") return "Quick Wins (High Impact, Low Effort)";
    if (id === "strategic") return "Strategic Tasks (High Impact, High Effort)";
    if (id === "mundane") return "Mundane Fixes (Low Impact, Low Effort)";
    return "Deferrable (Low Impact, High Effort)";
  };

  return (
    <div className="flex h-full flex-col gap-5 lg:flex-row">
      {/* 2x2 Quadrant Grid Panel */}
      <Card className="flex-1 border-border bg-card/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-primary" /> Risk vs. Effort Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="relative grid grid-cols-2 gap-3 rounded-xl bg-border/20 p-3 max-w-[640px] mx-auto">
            {/* Y-Axis Label (Severity / Risk) */}
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 select-none text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Vulnerability Risk (CVSS) →
            </div>

            {/* X-Axis Label (Remediation Effort) */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 select-none text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Remediation Effort →
            </div>

            {/* 1. Quick Wins (Top Left) */}
            <button
              onClick={() => setSelectedQuadrant("quick_wins")}
              className={`group flex h-48 flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.18)] ${
                selectedQuadrant === "quick_wins"
                  ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 dark:bg-emerald-500/[0.08]"
                  : "bg-card border-border hover:border-emerald-500/40 hover:bg-emerald-500/[0.01]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Zap className="h-3.5 w-3.5" /> Quick Wins
                </span>
                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {quadrants.quick_wins.length}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">
                High risk vulnerabilities that are easy to remediate. Patch these first to maximize immediate risk reduction.
              </p>
            </button>

            {/* 2. Strategic Projects (Top Right) */}
            <button
              onClick={() => setSelectedQuadrant("strategic")}
              className={`group flex h-48 flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(244,63,94,0.18)] ${
                selectedQuadrant === "strategic"
                  ? "bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/20 dark:bg-rose-500/[0.08]"
                  : "bg-card border-border hover:border-rose-500/40 hover:bg-rose-500/[0.01]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <Shield className="h-3.5 w-3.5" /> Strategic
                </span>
                <Badge variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  {quadrants.strategic.length}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Critical vulnerabilities that require high effort (e.g. system upgrades or script rewrites). Plan dedicated cycles.
              </p>
            </button>

            {/* 3. Mundane Fixes (Bottom Left) */}
            <button
              onClick={() => setSelectedQuadrant("mundane")}
              className={`group flex h-48 flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(59,130,246,0.18)] ${
                selectedQuadrant === "mundane"
                  ? "bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20 dark:bg-blue-500/[0.08]"
                  : "bg-card border-border hover:border-blue-500/40 hover:bg-blue-500/[0.01]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Sliders className="h-3.5 w-3.5" /> Mundane Fixes
                </span>
                <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {quadrants.mundane.length}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Low risk issues that are easy to fix. Knock these off during regular maintenance or patching windows.
              </p>
            </button>

            {/* 4. Deferrable / Out of Scope (Bottom Right) */}
            <button
              onClick={() => setSelectedQuadrant("deferrable")}
              className={`group flex h-48 flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(100,116,139,0.18)] ${
                selectedQuadrant === "deferrable"
                  ? "bg-slate-500/10 border-slate-500 ring-2 ring-slate-500/20 dark:bg-slate-500/[0.08]"
                  : "bg-card border-border hover:border-slate-500/40 hover:bg-slate-500/[0.01]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <Calendar className="h-3.5 w-3.5" /> Deferrable
                </span>
                <Badge variant="outline" className="border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400">
                  {quadrants.deferrable.length}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Low risk, complex issues. Can be deferred or marked out of scope for immediate mitigation sprints.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Target Findings List Sidebar Panel */}
      <Card className="w-full shrink-0 border-border bg-card/40 lg:w-[26rem]">
        <CardHeader className="pb-3 border-b border-border bg-card/30">
          <CardTitle className="text-sm font-semibold">Prioritization Slices</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto">
          {!selectedQuadrant ? (
            <div className="flex h-72 flex-col items-center justify-center text-center text-xs text-muted-foreground">
              Select one of the quadrants (like Quick Wins) to prioritize your patching plan.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-foreground leading-normal">
                  {getQuadrantTitle(selectedQuadrant)}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Showing {activeList.length} prioritized vulnerabilities
                </p>
              </div>

              <div className="space-y-2.5">
                {activeList.map((f: PrioritizedFinding) => (
                  <div 
                    key={f.id} 
                    className="rounded-xl border border-border bg-card/60 p-3.5 space-y-3 text-xs hover:border-primary/25 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <SeverityBadge severity={f.severity} />
                      <div className="flex items-center gap-1.5">
                        {f.cvss !== undefined && (
                          <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            CVSS {f.cvss.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground leading-normal">{f.name}</p>
                      <p className="font-mono text-[9px] text-muted-foreground mt-1">
                        IP: {f.host}
                      </p>
                    </div>
                    {/* Visual Effort Gauge */}
                    <div className="space-y-1 border-t border-border/30 pt-2.5 mt-2">
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <Sliders className="h-3 w-3" /> Effort: {f.effortLabel}
                        </span>
                        <span className="font-bold">{f.effortScore.toFixed(1)} / 10</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            f.effortLabel === "Low"
                              ? "bg-emerald-500"
                              : f.effortLabel === "High"
                              ? "bg-rose-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${f.effortScore * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
