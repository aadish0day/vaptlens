import { useMemo } from "react";
import { Grid2x2, Lock } from "lucide-react";
import { useDashboardStore, uid } from "../store/useDashboardStore";
import type { WidgetConfig } from "../lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

interface Template extends Omit<WidgetConfig, "id" | "layout"> {
  desc: string;
  requiresDated?: boolean;
}

const TEMPLATES: Template[] = [
  {
    title: "Severity Distribution",
    chartType: "donut",
    groupBy: "severity",
    aggregation: "count",
    sortBy: "label",
    desc: "Share of findings per severity level.",
  },
  {
    title: "SLA Compliance",
    chartType: "donut",
    groupBy: "slaStatus",
    aggregation: "count",
    sortBy: "label",
    desc: "Vulnerabilities within vs breaching SLA timelines.",
  },
  {
    title: "Vulnerability Lifecycle",
    chartType: "donut",
    groupBy: "lifecycle",
    aggregation: "count",
    sortBy: "label",
    desc: "Fixed vs. New vs. Open vulnerabilities across scans.",
  },
  {
    title: "Top 10 Vulnerable Hosts",
    chartType: "bar",
    groupBy: "host",
    colorBy: "severity",
    aggregation: "count",
    sortBy: "value",
    topN: 10,
    desc: "Hosts with the most findings, split by severity.",
  },
  {
    title: "Top 10 Recurring Findings",
    chartType: "bar",
    groupBy: "name",
    aggregation: "count",
    sortBy: "value",
    topN: 10,
    desc: "Most common finding names across the dataset.",
  },
  {
    title: "Port Distribution",
    chartType: "bar",
    groupBy: "port",
    aggregation: "count",
    sortBy: "value",
    desc: "Which ports surface the most findings.",
  },
  {
    title: "CVSS Score Histogram",
    chartType: "histogram",
    groupBy: "cvssBucket",
    aggregation: "count",
    desc: "Distribution of CVSS scores in severity bands.",
  },
  {
    title: "Tool Comparison",
    chartType: "bar",
    groupBy: "tool",
    colorBy: "severity",
    aggregation: "count",
    sortBy: "value",
    desc: "Findings per tool, stacked by severity.",
  },
  {
    title: "Trend Over Time",
    chartType: "line",
    groupBy: "scanMonth",
    colorBy: "severity",
    aggregation: "count",
    sortBy: "label",
    desc: "Findings by scan date — needs 2+ dated scans.",
    requiresDated: true,
  },
  {
    title: "Severity Heatmap",
    chartType: "heatmap",
    groupBy: "host",
    aggregation: "count",
    topN: 15,
    desc: "Per-host severity density — spot the riskiest assets at a glance.",
  },
  {
    title: "Risk Posture Radar",
    chartType: "radar",
    groupBy: "tool",
    colorBy: "severity",
    aggregation: "count",
    desc: "Severity footprint per scanning tool.",
  },
  {
    title: "Findings Treemap",
    chartType: "treemap",
    groupBy: "host",
    aggregation: "count",
    topN: 15,
    desc: "Hosts sized by total findings.",
  },
  {
    title: "CVSS × Host",
    chartType: "scatter",
    groupBy: "host",
    aggregation: "count",
    desc: "Every scored finding plotted by CVSS across hosts.",
  },
  {
    title: "Trend (Area)",
    chartType: "area",
    groupBy: "scanMonth",
    colorBy: "severity",
    aggregation: "count",
    sortBy: "label",
    desc: "Stacked severity trend — needs 2+ dated scans.",
    requiresDated: true,
  },
  {
    title: "OWASP Top 10 Compliance",
    chartType: "donut",
    groupBy: "owaspCategory",
    aggregation: "count",
    sortBy: "value",
    desc: "Vulnerabilities categorized by OWASP Top 10 (2021) categories.",
  },
  {
    title: "Vulnerability Aging Buckets",
    chartType: "bar",
    groupBy: "agingBucket",
    aggregation: "count",
    sortBy: "label",
    desc: "Active findings grouped by age (0-30d, 31-90d, 91-180d, 180d+).",
  },
  {
    title: "Subnet Vulnerability Density",
    chartType: "bar",
    groupBy: "subnet",
    colorBy: "severity",
    aggregation: "count",
    sortBy: "value",
    desc: "Findings density categorized by subnet ranges.",
  },
];

export function TemplateGallery({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const findings = useDashboardStore((s) => s.findings);
  const widgets = useDashboardStore((s) => s.widgets);
  const addWidget = useDashboardStore((s) => s.addWidget);

  const datedCount = useMemo(() => {
    const dates = new Set(
      findings.map((f) => f.scanDate?.slice(0, 10)).filter((d): d is string => !!d)
    );
    return dates.size;
  }, [findings]);

  const add = (t: Template) => {
    const maxY = widgets.reduce((m, w) => Math.max(m, w.layout.y + w.layout.h), 0);
    const { desc, requiresDated, ...rest } = t;
    void desc;
    void requiresDated;
    addWidget({
      ...rest,
      id: uid(),
      layout: {
        x: 0,
        y: maxY,
        w: rest.chartType === "kpi" ? 3 : 6,
        h: rest.chartType === "kpi" ? 2 : 6,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid2x2 className="h-4 w-4 text-primary" /> Template Gallery
          </DialogTitle>
          <DialogDescription>
            Start from a curated view, then customize it on the canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto py-1 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const locked = t.requiresDated && datedCount < 2;
            return (
              <button
                key={t.title}
                type="button"
                disabled={locked}
                onClick={() => add(t)}
                className={cn(
                  "group rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-150",
                  locked
                    ? "cursor-not-allowed opacity-50"
                    : "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    {t.title}
                  </span>
                  {locked ? (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Badge variant="muted" className="uppercase">
                      {t.chartType}
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
                  {t.desc}
                </p>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
