import { SEVERITY_COLORS, type Severity } from "./types";

const SERIES_PALETTE = [
  "#3DDC97",
  "#56CCF2",
  "#F2994A",
  "#F2C94C",
  "#B388FB",
  "#FF7AB6",
  "#7D8CA3",
  "#4ADE80",
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
