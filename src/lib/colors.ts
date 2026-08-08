import { SEVERITY_COLORS, type Severity } from "./types";

const SERIES_PALETTE = [
  "#0F766E",
  "#1D4ED8",
  "#7C3AED",
  "#DB2777",
  "#B45309",
  "#059669",
  "#6366F1",
  "#78716C",
];

export function isSeverity(name: string): name is Severity {
  return name in SEVERITY_COLORS;
}

export function severityColor(name: string): string {
  return SEVERITY_COLORS[name as Severity] ?? "#7D8CA3";
}

export function seriesColor(series: string, index: number): string {
  if (isSeverity(series)) return severityColor(series);
  return SERIES_PALETTE[index % SERIES_PALETTE.length];
}

export function colorForName(name: string, orderedNames: string[]): string {
  const idx = orderedNames.indexOf(name);
  return seriesColor(name, idx < 0 ? 0 : idx);
}
