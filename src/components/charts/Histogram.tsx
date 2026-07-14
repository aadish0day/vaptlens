import { BarChartWidget } from "./BarChart";
import type { ChartProps } from "./types";

// A histogram is a bar chart over a numeric bucket (e.g. CVSS score bands)
// with no series split and tightly packed bars. The shared BarChartWidget
// already handles the histogram presentation via the chartType flag.
export function HistogramWidget(props: ChartProps) {
  return <BarChartWidget {...props} />;
}
