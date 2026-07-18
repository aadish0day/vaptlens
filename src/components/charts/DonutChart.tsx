import { Cell, Label, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ChartProps } from "./types";
import { useChartTheme, seriesColor } from "../../lib/chart-theme";
import { useTheme } from "../theme-provider";

export function DonutChartWidget({ widget, data, onSelect }: ChartProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const chart = useChartTheme();
  const series = data.series;

  const rows = data.pivot.map((p) => {
    let value = Number(p.value) || 0;
    if (widget.colorBy && data.series.length > 0) {
      value = data.series.reduce((sum, s) => sum + (Number(p[s]) || 0), 0);
    }
    return {
      name: String(p.key),
      value,
    };
  });
  const total = rows.reduce((sum, r) => sum + r.value, 0);

  const orderedNames = series.length
    ? series
    : Array.from(new Set(rows.map((r) => r.name)));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={rows}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="transparent"
          onClick={(e: { name?: string } | null) => {
            if (e && e.name) onSelect(widget.groupBy, e.name);
          }}
        >
          {rows.map((r) => (
            <Cell key={r.name} fill={seriesColor(r.name, orderedNames.indexOf(r.name), dark)} />
          ))}
          <Label
            value={total.toLocaleString()}
            position="center"
            fill={chart.tooltipText}
            style={{ fontSize: 22, fontWeight: 600, fontFamily: "Inter, sans-serif" }}
          />
        </Pie>
        <Tooltip
          contentStyle={{
            background: chart.tooltipBg,
            border: `1px solid ${chart.tooltipBorder}`,
            borderRadius: 10,
            fontFamily: "Inter, sans-serif",
            fontSize: 12,
            boxShadow:
              "0 8px 24px -6px rgb(16 24 40 / 0.18), 0 2px 6px -2px rgb(16 24 40 / 0.12)",
          }}
          itemStyle={{ color: chart.tooltipText }}
        />
        <Legend
          wrapperStyle={{
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            color: chart.axis,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
