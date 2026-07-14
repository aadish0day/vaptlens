import { useMemo } from "react";
import { X, Grid2x2, Lock } from "lucide-react";
import { useDashboardStore, uid } from "../store/useDashboardStore";
import type { WidgetConfig } from "../lib/types";

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
    groupBy: "scanDate",
    colorBy: "severity",
    aggregation: "count",
    sortBy: "label",
    desc: "Findings by scan date — needs 2+ dated scans.",
    requiresDated: true,
  },
];

export function TemplateGallery({ onClose }: { onClose: () => void }) {
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
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-text">
            <Grid2x2 size={15} /> Template Gallery
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-border hover:text-text focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 overflow-auto p-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const locked = t.requiresDated && datedCount < 2;
            return (
              <button
                key={t.title}
                disabled={locked}
                onClick={() => add(t)}
                className={`group rounded-md border border-border bg-bg p-3 text-left transition-colors ${
                  locked
                    ? "cursor-not-allowed opacity-50"
                    : "hover:border-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-text">
                    {t.title}
                  </span>
                  {locked ? (
                    <Lock size={12} className="text-muted" />
                  ) : (
                    <span className="font-mono text-[10px] uppercase text-accent">
                      {t.chartType}
                    </span>
                  )}
                </div>
                <p className="mt-1 font-sans text-[11px] leading-snug text-muted">
                  {t.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
