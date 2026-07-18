import { useMemo } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  Legend,
} from "recharts";
import type { ChartProps } from "./types";
import { useChartTheme, SEVERITY_HEX, seriesColor } from "../../lib/chart-theme";
import { getFieldValue } from "../../lib/aggregate";
import { useTheme } from "../theme-provider";
import type { Severity } from "../../lib/types";

export function ScatterChartWidget({ widget, filtered, onSelect }: ChartProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const chart = useChartTheme();

  const yField = widget.groupBy || "host";
  const colorField = widget.colorBy || "severity";

  // Get all unique values for colorField
  const seriesNames = useMemo(() => {
    const set = new Set(
      filtered.map((f) => String(getFieldValue(f, colorField) ?? "Unknown"))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filtered, colorField]);

  const points = useMemo(() => {
    return seriesNames.map((s, idx) => {
      const data = filtered
        .filter(
          (f) =>
            String(getFieldValue(f, colorField) ?? "Unknown") === s &&
            typeof f.cvss === "number"
        )
        .map((f) => ({
          x: f.cvss as number,
          y: String(getFieldValue(f, yField) ?? "Unknown"),
          seriesVal: s,
          finding: f,
        }));
      return {
        name: s,
        color:
          colorField === "severity" && s in SEVERITY_HEX
            ? SEVERITY_HEX[s as Severity]
            : seriesColor(s, idx, dark),
        data,
      };
    });
  }, [filtered, yField, colorField, seriesNames, dark]);

  const hasData = points.some((p) => p.data.length > 0);

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No CVSS-scored findings to plot.
      </div>
    );
  }

  // Get dynamic Y-axis label
  const yAxisLabel = widget.groupBy === "host" ? "Host" : String(widget.groupBy);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
        <CartesianGrid stroke={chart.grid} />
        <XAxis
          type="number"
          dataKey="x"
          name="CVSS"
          domain={[0, 10]}
          tick={{ fill: chart.axis, fontSize: 11, fontFamily: "Inter, sans-serif" }}
          stroke={chart.grid}
          tickLine={false}
          label={{
            value: "CVSS",
            position: "insideBottom",
            offset: -2,
            fill: chart.axis,
            fontSize: 11,
          }}
        />
        <YAxis
          type="category"
          dataKey="y"
          name={yAxisLabel}
          width={92}
          tick={{ fill: chart.axis, fontSize: 11, fontFamily: "Inter, sans-serif" }}
          stroke={chart.grid}
          tickLine={false}
        />
        <ZAxis range={[60, 60]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3", stroke: chart.crosshair }}
          contentStyle={{
            background: chart.tooltipBg,
            border: `1px solid ${chart.tooltipBorder}`,
            borderRadius: 10,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            boxShadow:
              "0 8px 24px -6px rgb(16 24 40 / 0.18), 0 2px 6px -2px rgb(16 24 40 / 0.12)",
          }}
          labelStyle={{ color: chart.tooltipText, fontWeight: 600 }}
          itemStyle={{ color: chart.tooltipText }}
          formatter={(
            value: unknown,
            _name: string,
            item: { payload?: { y?: string; seriesVal?: string } }
          ) => [`CVSS ${value} · ${item.payload?.seriesVal}`, item.payload?.y ?? ""]}
        />
        <Legend
          wrapperStyle={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: chart.axis,
          }}
        />
        {points.map((p) => (
          <Scatter
            key={p.name}
            name={p.name}
            data={p.data}
            fill={p.color}
            fillOpacity={0.75}
            onClick={(e: { y?: string } | null) => {
              if (e?.y) onSelect(widget.groupBy, e.y);
            }}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
