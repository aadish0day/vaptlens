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
import { useChartTheme, SEVERITIES, SEVERITY_HEX } from "../../lib/chart-theme";

export function ScatterChartWidget({ filtered, onSelect }: ChartProps) {
  const chart = useChartTheme();

  const points = SEVERITIES.map((s) => ({
    name: s,
    color: SEVERITY_HEX[s],
    data: filtered
      .filter((f) => f.severity === s && typeof f.cvss === "number")
      .map((f) => ({ x: f.cvss as number, y: f.host, severity: s })),
  }));

  const hasData = points.some((p) => p.data.length > 0);

  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No CVSS-scored findings to plot.
      </div>
    );
  }

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
          name="Host"
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
          formatter={(value: unknown, _name: string, item: { payload?: { y?: string; severity?: string } }) => [
            `CVSS ${value} · ${item.payload?.severity}`,
            item.payload?.y ?? "",
          ]}
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
              if (e?.y) onSelect("host", e.y);
            }}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
