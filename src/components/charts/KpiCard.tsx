import { aggregateGlobal } from "../../lib/aggregate";
import { severityColor } from "../../lib/colors";
import { SEVERITIES } from "../../lib/types";
import type { ChartProps } from "./types";

const AGG_LABEL: Record<string, string> = {
  count: "findings",
  avgCvss: "avg CVSS",
  maxCvss: "max CVSS",
  distinctHosts: "hosts",
  distinctFindings: "finding types",
};

export function KpiCardWidget({ widget, filtered }: ChartProps) {
  const value = aggregateGlobal(filtered, widget.aggregation);

  const formatted =
    widget.aggregation === "avgCvss" || widget.aggregation === "maxCvss"
      ? value.toFixed(1)
      : value.toLocaleString();

  // For severity-scoped KPIs, color the number by severity.
  const isSeverityKpi = widget.groupBy === "severity" && widget.topN === undefined;
  const color = isSeverityKpi && SEVERITIES.includes(widget.title as never)
    ? severityColor(widget.title)
    : "#3DDC97";

  return (
    <div className="flex h-full flex-col justify-center px-4 py-2">
      <div
        className="font-mono text-4xl font-bold leading-none tabular-nums"
        style={{ color }}
      >
        {formatted}
      </div>
      <div className="mt-2 font-mono text-xs uppercase tracking-wider text-muted">
        {AGG_LABEL[widget.aggregation] ?? widget.aggregation}
      </div>
    </div>
  );
}
