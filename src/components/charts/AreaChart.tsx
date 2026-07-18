import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartProps } from "./types";
import { useChartTheme, seriesColor, primaryColor } from "../../lib/chart-theme";
import { useTheme } from "../theme-provider";

export function AreaChartWidget({ widget, data, onSelect }: ChartProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const chart = useChartTheme();
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
      <AreaChart
        data={data.pivot}
        margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
        onClick={handleClick}
      >
        <defs>
          <linearGradient id="areaPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor(dark)} stopOpacity={0.35} />
            <stop offset="100%" stopColor={primaryColor(dark)} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chart.grid} vertical={false} />
        <XAxis
          dataKey="key"
          tick={axisTick}
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
          cursor={{ stroke: chart.crosshair, strokeWidth: 1 }}
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
          series.map((s) => {
            const c = seriesColor(s, series.indexOf(s), dark);
            return (
              <Area
                key={s}
                type="monotone"
                dataKey={s}
                stackId={widget.barLayout === "grouped" ? undefined : "a"}
                stroke={c}
                strokeWidth={2}
                fill={c}
                fillOpacity={0.18}
              />
            );
          })
        ) : (
          <Area
            type="monotone"
            dataKey="value"
            stroke={primaryColor(dark)}
            strokeWidth={2}
            fill="url(#areaPrimary)"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
