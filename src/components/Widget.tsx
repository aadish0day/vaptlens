import { useMemo } from "react";
import { X } from "lucide-react";
import { aggregate } from "../lib/aggregate";
import type { Finding, WidgetConfig } from "../lib/types";
import { useDashboardStore } from "../store/useDashboardStore";
import { BarChartWidget } from "./charts/BarChart";
import { DonutChartWidget } from "./charts/DonutChart";
import { LineChartWidget } from "./charts/LineChart";
import { HistogramWidget } from "./charts/Histogram";
import { KpiCardWidget } from "./charts/KpiCard";
import type { ChartProps } from "./charts/types";
import { VulnTable } from "./VulnTable";

export function Widget({
  widget,
  filtered,
}: {
  widget: WidgetConfig;
  filtered: Finding[];
}) {
  const toggleCrossFilter = useDashboardStore((s) => s.toggleCrossFilter);
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const crossFilters = useDashboardStore((s) => s.filters.crossFilters);

  const data = useMemo(
    () =>
      widget.chartType === "table" || widget.chartType === "kpi"
        ? null
        : aggregate(filtered, widget),
    [filtered, widget]
  );

  const onSelect = (field: import("../lib/types").FieldKey, value: string) => {
    toggleCrossFilter(field, value);
  };

  const chartProps: ChartProps = {
    widget,
    data: data!,
    filtered,
    onSelect,
    activeCrossFilters: crossFilters,
  };

  let body: React.ReactNode;
  switch (widget.chartType) {
    case "bar":
      body = <BarChartWidget {...chartProps} />;
      break;
    case "histogram":
      body = <HistogramWidget {...chartProps} />;
      break;
    case "donut":
      body = <DonutChartWidget {...chartProps} />;
      break;
    case "line":
      body = <LineChartWidget {...chartProps} />;
      break;
    case "kpi":
      body = <KpiCardWidget {...chartProps} />;
      break;
    case "table":
      body = <VulnTable findings={filtered} />;
      break;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-panel">
      <div className="widget-drag flex cursor-move items-center justify-between border-b border-border px-3 py-2">
        <h3 className="truncate font-mono text-xs font-semibold uppercase tracking-wide text-text">
          {widget.title}
        </h3>
        <button
          onClick={() => removeWidget(widget.id)}
          className="rounded p-1 text-muted transition-colors hover:bg-border hover:text-sev-critical focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          aria-label={`Remove ${widget.title} widget`}
          title="Remove widget"
        >
          <X size={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1 p-2">{body}</div>
    </div>
  );
}
