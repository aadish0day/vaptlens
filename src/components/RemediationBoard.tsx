import { useMemo, useState } from "react";
import { useDashboardStore, PATCH_FLOW } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import type { Finding } from "../lib/types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { ChevronLeft, ChevronRight, Play, CheckCircle2, FileSearch, HelpCircle, Filter, Workflow, ScrollText, Trash2 } from "lucide-react";
import { SeverityBadge } from "./severity-badge";
import { cn } from "../lib/utils";
import { canPerform } from "../lib/permissions";
import { RestrictedButton } from "./RestrictedButton";
import { Button } from "./ui/button";

const COLUMNS = [
  { id: "todo", label: "To Do", color: "bg-muted/40 text-muted-foreground", icon: <HelpCircle className="h-4 w-4 text-muted-foreground" /> },
  { id: "in_progress", label: "In Progress", color: "bg-muted/40 text-muted-foreground", icon: <Play className="h-4 w-4 text-muted-foreground" /> },
  { id: "in_review", label: "In Review", color: "bg-muted/40 text-muted-foreground", icon: <FileSearch className="h-4 w-4 text-muted-foreground" /> },
  { id: "done", label: "Remediated", color: "bg-muted/40 text-muted-foreground", icon: <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

export function RemediationBoard() {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const remediationStatuses = useDashboardStore((s) => s.remediationStatuses);
  const updateRemediationStatus = useDashboardStore((s) => s.updateRemediationStatus);
  const toggleCrossFilter = useDashboardStore((s) => s.toggleCrossFilter);
  const crossFilters = useDashboardStore((s) => s.filters.crossFilters);
  const userRole = useDashboardStore((s) => s.userRole);
  const canRemediate = canPerform(userRole, "remediate");
  const auditLog = useDashboardStore((s) => s.auditLog);
  const clearAuditLog = useDashboardStore((s) => s.clearAuditLog);
  const advancePatchStatus = useDashboardStore((s) => s.advancePatchStatus);

  const [auditOpen, setAuditOpen] = useState(false);

  const isHostFiltered = (host: string) =>
    crossFilters.some((cf) => cf.field === "host" && cf.value === host);

  // Get globally sliced findings, excluding synthesized Fixed placeholders from active lists
  // since they are automatically handled
  const filteredFindings = useMemo(() => {
    return applyFilters(findings, filters).filter((f: Finding) => f.lifecycle !== "Fixed");
  }, [findings, filters]);

  // Group findings into Kanban columns
  const columnsData = useMemo(() => {
    const todo: typeof filteredFindings = [];
    const in_progress: typeof filteredFindings = [];
    const in_review: typeof filteredFindings = [];
    const done: typeof filteredFindings = [];

    // Also include actual synthesized Fixed findings globally in Remediated column
    const fixedFindings = applyFilters(findings, filters).filter((f: Finding) => f.lifecycle === "Fixed");

    for (const f of filteredFindings) {
      const status = remediationStatuses[f.id] || "todo";
      if (status === "todo") todo.push(f);
      else if (status === "in_progress") in_progress.push(f);
      else if (status === "in_review") in_review.push(f);
      else if (status === "done") done.push(f);
    }

    return {
      todo,
      in_progress,
      in_review,
      done: [...done, ...fixedFindings],
    };
  }, [filteredFindings, findings, filters, remediationStatuses]);

  const moveCard = (id: string, current: ColumnId, direction: "left" | "right") => {
    const colIds: ColumnId[] = ["todo", "in_progress", "in_review", "done"];
    const currentIndex = colIds.indexOf(current);
    if (direction === "left" && currentIndex > 0) {
      updateRemediationStatus(id, colIds[currentIndex - 1]);
    } else if (direction === "right" && currentIndex < colIds.length - 1) {
      updateRemediationStatus(id, colIds[currentIndex + 1]);
    }
  };

  // Patch verification pipeline counts (from finding.patchStatus)
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of PATCH_FLOW) counts[s] = 0;
    for (const f of filteredFindings) {
      const st = f.patchStatus ?? "Unassigned";
      counts[st] = (counts[st] ?? 0) + 1;
    }
    return counts;
  }, [filteredFindings]);

  const pipelineMax = Math.max(1, ...PATCH_FLOW.map((s) => pipelineCounts[s] ?? 0));

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {/* Patch Verification Pipeline header */}
      <Card className="border-border bg-card/40 shrink-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Workflow className="h-4 w-4 text-primary" /> Patch Verification Pipeline
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {auditLog.length} audit entries
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={() => setAuditOpen((o) => !o)}>
                <ScrollText className="h-3 w-3" />
                {auditOpen ? "Hide audit trail" : "Show audit trail"}
              </Button>
              {auditLog.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-destructive" onClick={clearAuditLog}>
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {PATCH_FLOW.map((stage, i) => (
              <div key={stage} className="flex flex-1 items-center gap-1.5">
                <div className="flex-1 rounded-lg border border-border bg-card px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground truncate">
                      {stage}
                    </span>
                    <span className="font-mono text-xs font-extrabold text-foreground">
                      {pipelineCounts[stage] ?? 0}
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${((pipelineCounts[stage] ?? 0) / pipelineMax) * 100}%`,
                        backgroundColor:
                          stage === "Resolved"
                            ? "#059669"
                            : stage === "Pending Verification"
                            ? "#6366F1"
                            : stage === "In Progress"
                            ? "#EA580C"
                            : "#A8A29E",
                      }}
                    />
                  </div>
                </div>
                {i < PATCH_FLOW.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit trail drawer */}
      {auditOpen && (
        <Card className="border-border bg-card/40 shrink-0 max-h-48">
          <CardContent className="p-3 space-y-1.5 overflow-y-auto max-h-40">
            {auditLog.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">No governance actions recorded yet.</p>
            ) : (
              auditLog.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-2 text-xs border-b border-border/40 pb-1.5">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-primary">{e.action}</span>{" "}
                    <span className="text-foreground">{e.detail}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
                    {e.actor} · {new Date(e.ts).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-4">
      {COLUMNS.map((col) => {
        const list = columnsData[col.id];
        return (
          <div key={col.id} className="flex flex-col h-full rounded-xl border border-border bg-card/40">
            {/* Column Header */}
            <div className={`flex items-center justify-between border-b border-border px-4 py-3 ${col.color}`}>
              <div className="flex items-center gap-2 font-semibold text-sm">
                {col.icon}
                {col.label}
              </div>
              <Badge variant="muted" className="font-mono text-xs text-foreground bg-border/40">
                {list.length}
              </Badge>
            </div>

            {/* Column Body / Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-14rem)] scrollbar-thin">
              {list.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No findings in this stage
                </div>
              ) : (
                list.map((f: Finding) => {
                  const isFixedPlaceholder = f.lifecycle === "Fixed";
                  const isCompleted = col.id === "done" || isFixedPlaceholder;
                  return (
                    <Card
                      key={f.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        // Guard against browser-synthesized clicks from Space/Enter
                        // on role="button" (detail === 0) — keydown already activates.
                        if (e.detail === 0) return;
                        toggleCrossFilter("host", f.host);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleCrossFilter("host", f.host);
                        }
                      }}
                      title="Click to cross-filter the dashboard by this host"
                      aria-pressed={isHostFiltered(f.host)}
                      className={cn(
                        "group relative cursor-pointer select-none border rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isCompleted 
                          ? "bg-emerald-500/[0.01] border-emerald-500/20 dark:bg-emerald-500/[0.03] opacity-80" 
                          : "bg-card border-border/80",
                        // Active host-filter styling only on non-completed cards to
                        // avoid conflicting background classes with the completed state.
                        !isCompleted &&
                          (isHostFiltered(f.host)
                            ? "border-primary/50 bg-primary-soft ring-1 ring-primary/30"
                            : "hover:border-foreground/20 hover:shadow-pop hover:-translate-y-0.5")
                      )}
                    >
                      <CardContent className="p-3.5 space-y-2.5">
                        {/* Meta Row */}
                        <div className="flex items-center justify-between gap-1">
                          <SeverityBadge severity={f.severity} />
                          <div className="flex items-center gap-1">
                            {f.cvss !== undefined && (
                              <span className="font-mono text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {f.cvss.toFixed(1)}
                              </span>
                            )}
                            {isCompleted && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className={cn(
                          "text-xs font-semibold leading-normal text-foreground group-hover:text-primary transition-colors",
                          isCompleted && "line-through text-muted-foreground"
                        )}>
                          {f.name}
                        </h4>

                        {/* Target Info */}
                        <div className="font-mono text-[10px] text-muted-foreground space-y-0.5">
                          <p className="truncate">Host: {f.host}</p>
                          {(f.port || f.protocol) && (
                            <p>
                              Port: {f.port ?? "—"} ({f.protocol ?? "—"})
                            </p>
                          )}
                        </div>

                        {/* Badges/Tags */}
                        <div className="flex flex-wrap gap-1">
                          {f.isZeroDay === "Zero-day" && (
                            <span className="rounded bg-purple-500/10 px-1 py-0.5 text-[9px] font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              Zero-day
                            </span>
                          )}
                          {f.isExploitable === "Exploitable" && (
                            <span className="rounded bg-red-500/10 px-1 py-0.5 text-[9px] font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
                              Exploit
                            </span>
                          )}
                          {f.isEol === "EOL/Obsolete" && (
                            <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              EOL
                            </span>
                          )}
                          {f.slaStatus === "Breached" && (
                            <span className="rounded bg-rose-500/10 px-1 py-0.5 text-[9px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              SLA Breach
                            </span>
                          )}
                        </div>

                        {/* Cross-filter hint */}
                        <div className="flex items-center gap-1 text-[9px] font-medium">
                          <span
                            className={cn(
                              "flex items-center gap-1",
                              isHostFiltered(f.host) ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            <Filter className="h-3 w-3" />
                            {isHostFiltered(f.host)
                              ? "Filtering dashboard by host — click card to remove"
                              : "Click card to filter dashboard by host"}
                          </span>
                        </div>

                        {/* Patch status quick-advance on non-completed cards */}
                        {!isCompleted && f.patchStatus && f.patchStatus !== "Resolved" && (
                          <RestrictedButton
                            variant="outline"
                            size="sm"
                            allowed={canRemediate}
                            reason="Your role cannot advance patch status — ask an Administrator or Remediation Lead"
                            title={`Advance patch status (currently ${f.patchStatus})`}
                            className="h-6 w-full text-[9px] gap-1 border-primary/20 text-primary hover:bg-primary/5"
                            onClick={(e) => {
                              e.stopPropagation();
                              advancePatchStatus(f.id);
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <Workflow className="h-3 w-3" />
                            {f.patchStatus} → next
                          </RestrictedButton>
                        )}

                        {/* Action buttons (Move Card) */}
                        {!isFixedPlaceholder && (
                          <div className="flex items-center justify-end gap-1.5 border-t border-border/40 pt-2.5 mt-2">
                            {col.id !== "todo" && (
                              <RestrictedButton
                                variant="ghost"
                                size="icon"
                                allowed={canRemediate}
                                reason="Your role cannot move cards — ask an Administrator or Remediation Lead"
                                title="Move back"
                                className="h-6 w-6 rounded-md hover:bg-muted border border-border/30 hover:border-border text-muted-foreground transition-all flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveCard(f.id, col.id, "left");
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </RestrictedButton>
                            )}
                            {col.id !== "done" && (
                              <RestrictedButton
                                variant="ghost"
                                size="icon"
                                allowed={canRemediate}
                                reason="Your role cannot move cards — ask an Administrator or Remediation Lead"
                                title="Move forward"
                                className="h-6 w-6 rounded-md hover:bg-muted border border-border/30 hover:border-border text-primary transition-all flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveCard(f.id, col.id, "right");
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </RestrictedButton>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
