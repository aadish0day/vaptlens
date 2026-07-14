import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartProps } from "./types";
import { colorForName } from "../../lib/colors";

export function LineChartWidget({ widget, data, onSelect }: ChartProps) {
  const series = data.series;

  const handleClick = (e: { activePayload?: { payload: Record<string, unknown> }[] } | null) => {
    if (!e || !e.activePayload || !e.activePayload.length) return;
    const key = e.activePayload[0].payload.key as string;
    onSelect(widget.groupBy, key);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data.pivot}
        margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
        onClick={handleClick}
      >
        <CartesianGrid stroke="#212B3D" vertical={false} />
        <XAxis
          dataKey="key"
          tick={{ fill: "#7D8CA3", fontSize: 11, fontFamily: "IBM Plex Mono" }}
          stroke="#212B3D"
        />
        <YAxis
          tick={{ fill: "#7D8CA3", fontSize: 11, fontFamily: "IBM Plex Mono" }}
          stroke="#212B3D"
          allowDecimals={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: "#0B0E14",
            border: "1px solid #212B3D",
            borderRadius: 6,
            fontFamily: "IBM Plex Mono",
            fontSize: 12,
          }}
          labelStyle={{ color: "#E6EDF3" }}
          itemStyle={{ color: "#E6EDF3" }}
        />
        {series.length > 0 ? (
          series.map((s) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              stroke={colorForName(s, series)}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          ))
        ) : (
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3DDC97"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
