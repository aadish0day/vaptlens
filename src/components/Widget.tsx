import { useMemo } from "react";
import { motion } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import { aggregate } from "../lib/aggregate";
import type { Finding, WidgetConfig } from "../lib/types";
import { useDashboardStore } from "../store/useDashboardStore";
import { BarChartWidget } from "./charts/BarChart";
import { AreaChartWidget } from "./charts/AreaChart";
import { DonutChartWidget } from "./charts/DonutChart";
import { LineChartWidget } from "./charts/LineChart";
import { RadarChartWidget } from "./charts/RadarChart";
import { TreemapWidget } from "./charts/Treemap";
import { HeatmapWidget } from "./charts/Heatmap";
import { ScatterChartWidget } from "./charts/ScatterChart";
import { HistogramWidget } from "./charts/Histogram";
import { KpiCardWidget } from "./charts/KpiCard";
import { SlaBreachKpiWidget } from "./charts/SlaBreachKpi";
import { HostRiskWidget } from "./charts/HostRiskWidget";
import type { ChartProps } from "./charts/types";
import { VulnTable } from "./VulnTable";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

const chartMap: Record<
  WidgetConfig["chartType"],
  (p: ChartProps) => React.ReactNode
> = {
  bar: (p) => <BarChartWidget {...p} />,
  area: (p) => <AreaChartWidget {...p} />,
  histogram: (p) => <HistogramWidget {...p} />,
  donut: (p) => <DonutChartWidget {...p} />,
  line: (p) => <LineChartWidget {...p} />,
  radar: (p) => <RadarChartWidget {...p} />,
  treemap: (p) => <TreemapWidget {...p} />,
  heatmap: (p) => <HeatmapWidget {...p} />,
  scatter: (p) => <ScatterChartWidget {...p} />,
  kpi: (p) => <KpiCardWidget {...p} />,
  slaBreach: (p) => <SlaBreachKpiWidget {...p} />,
  hostRisk: (p) => <HostRiskWidget {...p} />,
  table: (p) => <VulnTable findings={p.filtered} />,
};

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

  const render = (chartMap as Record<
    string,
    ((p: ChartProps) => React.ReactNode) | undefined
  >)[widget.chartType];

  const data = useMemo(
    () =>
      render &&
      widget.chartType !== "table" &&
      widget.chartType !== "kpi" &&
      widget.chartType !== "slaBreach" &&
      widget.chartType !== "hostRisk"
        ? aggregate(filtered, widget)
        : null,
    [filtered, widget, render]
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

  const body = render ? (
    render(chartProps)
  ) : (
    <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
      Unknown chart type “{String(widget.chartType)}”. Remove this widget to
      dismiss.
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      data-testid="widget"
      className="widget-shell flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card"
    >
      <div className="widget-drag flex cursor-grab items-center gap-2 border-b border-border px-3 py-2 active:cursor-grabbing">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        <h3
          data-testid="widget-title"
          className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight text-foreground"
        >
          {widget.title}
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => removeWidget(widget.id)}
              className="widget-cancel rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Remove ${widget.title} widget`}
            >
              <X className="pointer-events-none h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Remove widget</TooltipContent>
        </Tooltip>
      </div>
      <div className="min-h-0 flex-1 p-3">{body}</div>
    </motion.div>
  );
}
