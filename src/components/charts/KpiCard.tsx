import { useMemo } from "react";
import { Layers, Gauge, Server, ListChecks, Hash } from "lucide-react";
import { aggregateGlobal, getFieldValue } from "../../lib/aggregate";
import { SEVERITIES } from "../../lib/types";
import { SEVERITY_HEX } from "../../lib/chart-theme";
import { useTheme } from "../theme-provider";
import type { ChartProps } from "./types";
import { cn } from "../../lib/utils";

const AGG_LABEL: Record<string, string> = {
  count: "findings",
  avgCvss: "avg CVSS",
  maxCvss: "max CVSS",
  distinctHosts: "hosts",
  distinctFindings: "finding types",
};

const AGG_ICON: Record<string, React.ReactNode> = {
  count: <Hash className="h-5 w-5" />,
  avgCvss: <Gauge className="h-5 w-5" />,
  maxCvss: <Gauge className="h-5 w-5" />,
  distinctHosts: <Server className="h-5 w-5" />,
  distinctFindings: <ListChecks className="h-5 w-5" />,
};

export function KpiCardWidget({ widget, filtered, onSelect, activeCrossFilters }: ChartProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  // Check if title matches a value for the groupBy field (e.g. title is "Critical", groupBy is "severity")
  const matchingValue = useMemo(() => {
    if (!widget.groupBy) return null;
    const matchTitle = widget.title.trim().toLowerCase();

    // Check if any finding has a value matching this title
    const hasMatch = filtered.some((f) => {
      const val = getFieldValue(f, widget.groupBy);
      return typeof val === "string" && val.toLowerCase() === matchTitle;
    });

    return hasMatch ? widget.title : null;
  }, [filtered, widget.groupBy, widget.title]);

  const cardFindings = useMemo(() => {
    if (matchingValue && widget.groupBy) {
      const matchTitle = matchingValue.toLowerCase();
      return filtered.filter((f) => {
        const val = getFieldValue(f, widget.groupBy);
        return typeof val === "string" && val.toLowerCase() === matchTitle;
      });
    }
    return filtered;
  }, [filtered, matchingValue, widget.groupBy]);

  const value = aggregateGlobal(cardFindings, widget.aggregation, widget.groupBy);

  const formatted =
    widget.aggregation === "avgCvss" || widget.aggregation === "maxCvss"
      ? value.toFixed(1)
      : value.toLocaleString();

  const isSeverityKpi = widget.groupBy === "severity" && widget.topN === undefined;
  const color = useMemo(() => {
    if (isSeverityKpi && SEVERITIES.includes(widget.title as never)) {
      return SEVERITY_HEX[widget.title as keyof typeof SEVERITY_HEX];
    }
    if (widget.groupBy === "slaStatus") {
      return widget.title === "Breached" ? "#E5484D" : "#46A758";
    }
    if (widget.groupBy === "lifecycle") {
      if (widget.title === "Fixed") return "#46A758";
      if (widget.title === "New") return "#818CF8";
      return "#F2994A";
    }
    if (widget.groupBy === "isExploitable") {
      return widget.title === "Exploitable" ? "#F2994A" : dark ? "#98A2B3" : "#6B7280";
    }
    if (widget.groupBy === "isZeroDay") {
      return widget.title === "Zero-day" ? "#E5484D" : dark ? "#98A2B3" : "#6B7280";
    }
    if (widget.groupBy === "isEol") {
      return widget.title === "EOL/Obsolete" ? "#F2994A" : dark ? "#98A2B3" : "#6B7280";
    }
    if (widget.groupBy === "unpatchedAge") {
      return widget.title === "Unpatched > 6 Months" ? "#F2994A" : dark ? "#98A2B3" : "#6B7280";
    }
    if (widget.groupBy === "agingBucket") {
      if (widget.title === "0–30 Days" || widget.title === "Remediated") return "#46A758";
      if (widget.title === "31–90 Days") return "#818CF8";
      if (widget.title === "91–180 Days") return "#F2994A";
      if (widget.title === "180+ Days") return "#E5484D";
    }
    if (widget.groupBy === "owaspCategory") {
      return "#8B5CF6";
    }
    return dark ? "#E7EAF0" : "#14181F";
  }, [widget.groupBy, widget.title, isSeverityKpi, dark]);

  const isFilterActive = useMemo(() => {
    if (!matchingValue || !widget.groupBy) return false;
    return activeCrossFilters.some(
      (cf) => cf.field === widget.groupBy && cf.value === matchingValue
    );
  }, [matchingValue, widget.groupBy, activeCrossFilters]);

  const handleClick = () => {
    if (matchingValue && widget.groupBy) {
      onSelect(widget.groupBy, matchingValue);
    }
  };

    return (
    <div
      onClick={matchingValue ? handleClick : undefined}
      className={cn(
        "relative flex h-full flex-col justify-center px-4 py-2 rounded-lg transition-all duration-200 select-none",
        matchingValue && "cursor-pointer hover:bg-accent/40",
        isFilterActive && (dark ? "bg-primary-soft-2 ring-1 ring-primary/40" : "bg-primary-soft ring-1 ring-primary/30")
      )}
    >
      <span className="pointer-events-none absolute right-3 top-3 text-muted-foreground/25">
        {AGG_ICON[widget.aggregation] ?? <Layers className="h-5 w-5" />}
      </span>
      <div
        className="text-4xl font-semibold tracking-tight tabular-nums"
        style={{ color }}
      >
        {formatted}
      </div>
      <div className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {matchingValue && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-primary"
            style={isSeverityKpi ? { backgroundColor: color } : undefined}
          />
        )}
        {AGG_LABEL[widget.aggregation] ?? widget.aggregation}
      </div>
    </div>
  );
}
