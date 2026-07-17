import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartProps } from "./types";
import { useChartTheme, seriesColor, primaryColor } from "../../lib/chart-theme";
import { useTheme } from "../theme-provider";

export function RadarChartWidget({ widget, data, onSelect }: ChartProps) {
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

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data.pivot} onClick={handleClick} outerRadius="72%">
        <PolarGrid stroke={chart.grid} />
        <PolarAngleAxis
          dataKey="key"
          tick={{ fill: chart.axis, fontSize: 11, fontFamily: "Inter, sans-serif" }}
        />
        <PolarRadiusAxis
          tick={{ fill: chart.axis, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          stroke={chart.grid}
        />
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
          labelStyle={{ color: chart.tooltipText, fontWeight: 600 }}
          itemStyle={{ color: chart.tooltipText }}
        />
        {series.length > 0 ? (
          series.map((s) => {
            const c = seriesColor(s, series.indexOf(s), dark);
            return (
              <Radar
                key={s}
                name={s}
                dataKey={s}
                stroke={c}
                fill={c}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            );
          })
        ) : (
          <Radar
            name="value"
            dataKey="value"
            stroke={primaryColor(dark)}
            fill={primaryColor(dark)}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        )}
        {series.length > 1 && (
          <Legend
            wrapperStyle={{
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              color: chart.axis,
            }}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}
