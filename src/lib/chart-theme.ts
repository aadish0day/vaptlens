import { useTheme } from "../components/theme-provider";
import { SEVERITIES, type Severity } from "./types";

/* ---------------------------------------------------------------------------
   Severity colors — used for chart fills, dots, and badges.
   Hex values read acceptably on both light and dark surfaces.
--------------------------------------------------------------------------- */
export const SEVERITY_HEX: Record<Severity, string> = {
  Critical: "#E5484D",
  High: "#F2994A",
  Medium: "#F2C94C",
  Low: "#56CCF2",
  Info: "#7D8CA3",
};

/* ---------------------------------------------------------------------------
   Badge treatment per theme — text + tinted background + border + dot.
   Tuned so every severity passes WCAG AA text contrast on its own chip.
--------------------------------------------------------------------------- */
type SeverityBadge = {
  text: string;
  bg: string;
  border: string;
  dot: string;
};

const SEVERITY_BADGE_LIGHT: Record<Severity, SeverityBadge> = {
  Critical: { text: "#B42318", bg: "#FEF3F2", border: "#FECDCA", dot: "#E5484D" },
  High: { text: "#B54708", bg: "#FFFAEB", border: "#FEDF89", dot: "#F2994A" },
  Medium: { text: "#8A5A00", bg: "#FEF9C3", border: "#F5E0A3", dot: "#F2C94C" },
  Low: { text: "#0369A1", bg: "#EFF8FF", border: "#B9E3FB", dot: "#56CCF2" },
  Info: { text: "#475467", bg: "#F2F4F7", border: "#E4E7EC", dot: "#7D8CA3" },
};

const SEVERITY_BADGE_DARK: Record<Severity, SeverityBadge> = {
  Critical: { text: "#FDA29B", bg: "rgba(229,72,77,0.14)", border: "rgba(229,72,77,0.28)", dot: "#F97066" },
  High: { text: "#FDBA74", bg: "rgba(242,153,74,0.14)", border: "rgba(242,153,74,0.28)", dot: "#FDBA74" },
  Medium: { text: "#FDE68A", bg: "rgba(242,201,76,0.12)", border: "rgba(242,201,76,0.24)", dot: "#F5D76B" },
  Low: { text: "#7DD3FC", bg: "rgba(86,204,242,0.14)", border: "rgba(86,204,242,0.26)", dot: "#7DD3FC" },
  Info: { text: "#98A2B3", bg: "rgba(125,140,163,0.14)", border: "rgba(125,140,163,0.26)", dot: "#98A2B3" },
};

export function severityBadge(sev: Severity, dark: boolean): SeverityBadge {
  return dark ? SEVERITY_BADGE_DARK[sev] : SEVERITY_BADGE_LIGHT[sev];
}

/* ---------------------------------------------------------------------------
   Categorical series palette for non-severity splits (tool, host, …).
--------------------------------------------------------------------------- */
const SERIES_LIGHT = [
  "#6366F1",
  "#8B5CF6",
  "#3B82F6",
  "#14B8A6",
  "#EC4899",
  "#F59E0B",
  "#06B6D4",
  "#94A3B8",
];
const SERIES_DARK = [
  "#818CF8",
  "#A78BFA",
  "#60A5FA",
  "#2DD4BF",
  "#F472B6",
  "#FBBF24",
  "#22D3EE",
  "#94A3B8",
];

const CUSTOM_SERIES_HEX: Record<string, string> = {
  Met: "#46A758",
  Breached: "#E5484D",
  Fixed: "#46A758",
  New: "#818CF8",
  Open: "#F2994A",
  Exploitable: "#F2994A",
  "Not Exploitable": "#94A3B8",
  "EOL/Obsolete": "#F2994A",
  Supported: "#94A3B8",
  "Zero-day": "#E5484D",
  Known: "#94A3B8",
  "Unpatched > 6 Months": "#F2994A",
  "Unpatched < 6 Months": "#94A3B8",
  "0–30 Days": "#46A758",
  "31–90 Days": "#818CF8",
  "91–180 Days": "#F2994A",
  "180+ Days": "#E5484D",
  Remediated: "#46A758",
};

export function seriesColor(name: string, index: number, dark: boolean): string {
  if (name in SEVERITY_HEX) return SEVERITY_HEX[name as Severity];
  if (name in CUSTOM_SERIES_HEX) return CUSTOM_SERIES_HEX[name];
  const palette = dark ? SERIES_DARK : SERIES_LIGHT;
  return palette[index % palette.length];
}

/* Brand color for single-series charts (no colorBy split). */
export const PRIMARY = { light: "#5B5BF6", dark: "#818CF8" };

export function primaryColor(dark: boolean): string {
  return dark ? PRIMARY.dark : PRIMARY.light;
}

/* ---------------------------------------------------------------------------
   Recharts theme — axis, grid, tooltip chrome per theme.
--------------------------------------------------------------------------- */
export interface ChartTheme {
  axis: string;
  grid: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  crosshair: string;
}

export function useChartTheme(): ChartTheme {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return {
    axis: dark ? "#8B93A1" : "#6B7280",
    grid: dark ? "#222831" : "#EAECF0",
    tooltipBg: dark ? "#141821" : "#FFFFFF",
    tooltipBorder: dark ? "#2A2F3A" : "#E4E7EC",
    tooltipText: dark ? "#E7EAF0" : "#14181F",
    crosshair: dark ? "#3A4150" : "#C9CED6",
  };
}

export { SEVERITIES };
