import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartProps } from "./types";
import { useChartTheme, seriesColor, primaryColor } from "../../lib/chart-theme";
import { useTheme } from "../theme-provider";

export function BarChartWidget({ widget, data, onSelect }: ChartProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const chart = useChartTheme();
  const isHistogram = widget.chartType === "histogram";
  const series = data.series;

  const handleClick = (
    e: { activePayload?: { payload: Record<string, unknown> }[] } | null
  ) => {
    if (!e || !e.activePayload || !e.activePayload.length) return;
    const key = e.activePayload[0].payload.key as string;
    onSelect(widget.groupBy, key);
  };

  const axisTick = {
    fill: chart.axis,
    fontSize: 11,
    fontFamily: "Inter, sans-serif",
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data.pivot}
        margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
        onClick={handleClick}
        barCategoryGap={isHistogram ? "4%" : "22%"}
        maxBarSize={isHistogram ? 48 : 40}
      >
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis
          dataKey="key"
          tick={axisTick}
          interval={0}
          angle={widget.topN && widget.topN > 6 ? -35 : 0}
          textAnchor={widget.topN && widget.topN > 6 ? "end" : "middle"}
          height={widget.topN && widget.topN > 6 ? 56 : 28}
          stroke={chart.grid}
          tickLine={false}
        />
        <YAxis
          tick={axisTick}
          stroke={chart.grid}
          tickLine={false}
          allowDecimals={false}
          width={36}
        />
        <Tooltip
          cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(16,24,40,0.04)" }}
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
        />
        {series.length > 0 ? (
          series.map((s) => (
            <Bar
              key={s}
              dataKey={s}
              stackId="a"
              fill={seriesColor(s, series.indexOf(s), dark)}
              radius={[4, 4, 0, 0]}
            />
          ))
        ) : (
          <Bar
            dataKey="value"
            fill={primaryColor(dark)}
            radius={[4, 4, 0, 0]}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
