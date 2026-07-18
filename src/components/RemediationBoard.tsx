import { useMemo } from "react";
import { useDashboardStore } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import type { Finding } from "../lib/types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Play, CheckCircle2, FileSearch, HelpCircle } from "lucide-react";
import { SeverityBadge } from "./severity-badge";
import { cn } from "../lib/utils";

const COLUMNS = [
  { id: "todo", label: "To Do", color: "border-t-muted-foreground/30 bg-muted/5 text-muted-foreground", icon: <HelpCircle className="h-4 w-4 text-muted-foreground" /> },
  { id: "in_progress", label: "In Progress", color: "border-t-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400", icon: <Play className="h-4 w-4 text-blue-500 animate-pulse" /> },
  { id: "in_review", label: "In Review", color: "border-t-purple-500 bg-purple-500/5 text-purple-600 dark:text-purple-400", icon: <FileSearch className="h-4 w-4 text-purple-500" /> },
  { id: "done", label: "Remediated", color: "border-t-green-500 bg-green-500/5 text-green-600 dark:text-green-400", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

export function RemediationBoard() {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const remediationStatuses = useDashboardStore((s) => s.remediationStatuses);
  const updateRemediationStatus = useDashboardStore((s) => s.updateRemediationStatus);

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

  return (
    <div className="grid h-full grid-cols-1 gap-4 overflow-hidden md:grid-cols-4">
      {COLUMNS.map((col) => {
        const list = columnsData[col.id];
        return (
          <div key={col.id} className="flex flex-col h-full rounded-xl border border-border bg-card/40">
            {/* Column Header */}
            <div className={`flex items-center justify-between border-t-2 border-b border-border px-4 py-3 ${col.color}`}>
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
                      className={cn(
                        "group relative border hover:border-primary/25 hover:shadow-pop transition-all duration-200 hover:-translate-y-0.5 rounded-xl",
                        isCompleted 
                          ? "bg-emerald-500/[0.01] border-emerald-500/20 dark:bg-emerald-500/[0.03] opacity-80" 
                          : "bg-card border-border/80"
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
                            <span className="rounded bg-purple-500/10 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              Zero-day
                            </span>
                          )}
                          {f.isExploitable === "Exploitable" && (
                            <span className="rounded bg-red-500/10 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-500/20">
                              Exploit
                            </span>
                          )}
                          {f.isEol === "EOL/Obsolete" && (
                            <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              EOL
                            </span>
                          )}
                          {f.slaStatus === "Breached" && (
                            <span className="rounded bg-rose-500/10 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              SLA Breach
                            </span>
                          )}
                        </div>

                        {/* Action buttons (Move Card) */}
                        {!isFixedPlaceholder && (
                          <div className="flex items-center justify-end gap-1.5 border-t border-border/40 pt-2.5 mt-2">
                            {col.id !== "todo" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-md hover:bg-muted border border-border/30 hover:border-border text-muted-foreground transition-all flex items-center justify-center"
                                onClick={() => moveCard(f.id, col.id, "left")}
                                title="Move back"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {col.id !== "done" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-md hover:bg-muted border border-border/30 hover:border-border text-primary transition-all flex items-center justify-center"
                                onClick={() => moveCard(f.id, col.id, "right")}
                                title="Move forward"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
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
  );
}
