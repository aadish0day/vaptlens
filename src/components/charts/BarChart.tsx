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
import { colorForName } from "../../lib/colors";

export function BarChartWidget({ widget, data, onSelect }: ChartProps) {
  const isHistogram = widget.chartType === "histogram";
  const series = data.series;

  const handleClick = (e: { activePayload?: { payload: Record<string, unknown>; dataKey?: string | number }[] } | null) => {
    if (!e || !e.activePayload || !e.activePayload.length) return;
    const item = e.activePayload[0];
    const key = item.payload.key as string;
    onSelect(widget.groupBy, key);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data.pivot}
        margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
        onClick={handleClick}
        barCategoryGap={isHistogram ? "2%" : "20%"}
      >
        <CartesianGrid stroke="#212B3D" vertical={false} />
        <XAxis
          dataKey="key"
          tick={{ fill: "#7D8CA3", fontSize: 11, fontFamily: "IBM Plex Mono" }}
          interval={0}
          angle={widget.topN && widget.topN > 6 ? -35 : 0}
          textAnchor={widget.topN && widget.topN > 6 ? "end" : "middle"}
          height={widget.topN && widget.topN > 6 ? 56 : 28}
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
            <Bar key={s} dataKey={s} stackId="a" fill={colorForName(s, series)} />
          ))
        ) : (
          <Bar dataKey="value" fill="#3DDC97" />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
