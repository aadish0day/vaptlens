import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import type { ChartProps } from "./types";
import { useChartTheme, seriesColor, primaryColor } from "../../lib/chart-theme";
import { useTheme } from "../theme-provider";

interface TreemapDatum {
  name: string;
  value: number;
  fill: string;
}

function TreemapCell(props: Record<string, unknown>) {
  const x = Number(props.x);
  const y = Number(props.y);
  const w = Number(props.width);
  const h = Number(props.height);
  const name = String(props.name ?? "");
  const value = Number(props.value ?? 0);
  const fill = String(props.fill ?? primaryColor(false));
  if (w <= 0 || h <= 0) return null;
  const showLabel = w > 54 && h > 26;
  return (
    <g>
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(0, w - 4)}
        height={Math.max(0, h - 4)}
        rx={8}
        fill={fill}
        fillOpacity={0.85}
        stroke="transparent"
      />
      {showLabel && (
        <text
          x={x + 10}
          y={y + 20}
          fill="#fff"
          fontSize={12}
          fontWeight={600}
          fontFamily="Inter, sans-serif"
        >
          {name.length > 18 ? name.slice(0, 17) + "…" : name}
        </text>
      )}
      {showLabel && (
        <text
          x={x + 10}
          y={y + 36}
          fill="rgba(255,255,255,0.85)"
          fontSize={11}
          fontFamily="Inter, sans-serif"
        >
          {value.toLocaleString()}
        </text>
      )}
    </g>
  );
}

export function TreemapWidget({ widget, data, onSelect }: ChartProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const chart = useChartTheme();

  const tdata: TreemapDatum[] = data.pivot.map((row, i) => {
    const numeric = Object.entries(row)
      .filter(([k]) => k !== "key")
      .map(([, v]) => Number(v) || 0);
    const total = numeric.reduce((a, b) => a + b, 0);
    return {
      name: String(row.key),
      value: total,
      fill: seriesColor(String(row.key), i, dark),
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap
        data={tdata}
        dataKey="value"
        stroke={chart.grid}
        content={<TreemapCell />}
        isAnimationActive={false}
        onClick={(node: unknown) => {
          const n = node as { name?: string };
          if (n?.name) onSelect(widget.groupBy, n.name);
        }}
      >
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
      </Treemap>
    </ResponsiveContainer>
  );
}
