import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ChartProps } from "./types";
import { colorForName } from "../../lib/colors";

export function DonutChartWidget({ widget, data, onSelect }: ChartProps) {
  const series = data.series;
  const rows = data.pivot.map((p) => ({
    name: String(p.key),
    value: Number(p.value) || 0,
  }));

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
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          stroke="#0B0E14"
          onClick={(e: { name?: string } | null) => {
            if (e && e.name) onSelect(widget.groupBy, e.name);
          }}
        >
          {rows.map((r) => (
            <Cell key={r.name} fill={colorForName(r.name, orderedNames)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#0B0E14",
            border: "1px solid #212B3D",
            borderRadius: 6,
            fontFamily: "IBM Plex Mono",
            fontSize: 12,
          }}
          itemStyle={{ color: "#E6EDF3" }}
        />
        <Legend
          wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: "#7D8CA3" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
