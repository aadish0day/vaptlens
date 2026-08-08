import { useTheme } from "../components/theme-provider";
import { SEVERITIES, type Severity } from "./types";

/* ---------------------------------------------------------------------------
   Severity colors — chart fills, dots, and badges.
--------------------------------------------------------------------------- */
export const SEVERITY_HEX: Record<Severity, string> = {
  Critical: "#DC2626",
  High: "#EA580C",
  Medium: "#D97706",
  Low: "#0D9488",
  Info: "#78716C",
};

type SeverityBadge = {
  text: string;
  bg: string;
  border: string;
  dot: string;
};

const SEVERITY_BADGE_LIGHT: Record<Severity, SeverityBadge> = {
  Critical: { text: "#991B1B", bg: "#FEF2F2", border: "#FECACA", dot: "#DC2626" },
  High: { text: "#9A3412", bg: "#FFF7ED", border: "#FED7AA", dot: "#EA580C" },
  Medium: { text: "#92400E", bg: "#FFFBEB", border: "#FDE68A", dot: "#D97706" },
  Low: { text: "#115E59", bg: "#F0FDFA", border: "#99F6E4", dot: "#0D9488" },
  Info: { text: "#44403C", bg: "#FAFAF9", border: "#E7E5E4", dot: "#78716C" },
};

const SEVERITY_BADGE_DARK: Record<Severity, SeverityBadge> = {
  Critical: { text: "#FCA5A5", bg: "rgba(220,38,38,0.14)", border: "rgba(220,38,38,0.28)", dot: "#EF4444" },
  High: { text: "#FDBA74", bg: "rgba(234,88,12,0.14)", border: "rgba(234,88,12,0.28)", dot: "#EA580C" },
  Medium: { text: "#FDE68A", bg: "rgba(217,119,6,0.12)", border: "rgba(217,119,6,0.24)", dot: "#F59E0B" },
  Low: { text: "#5EEAD4", bg: "rgba(13,148,136,0.14)", border: "rgba(13,148,136,0.26)", dot: "#14B8A6" },
  Info: { text: "#A8A29E", bg: "rgba(120,113,108,0.14)", border: "rgba(120,113,108,0.26)", dot: "#A8A29E" },
};

export function severityBadge(sev: Severity, dark: boolean): SeverityBadge {
  return dark ? SEVERITY_BADGE_DARK[sev] : SEVERITY_BADGE_LIGHT[sev];
}

/* ---------------------------------------------------------------------------
   Categorical series palette for non-severity splits (tool, host, …).
--------------------------------------------------------------------------- */
const SERIES_LIGHT = [
  "#0F766E",
  "#1D4ED8",
  "#7C3AED",
  "#DB2777",
  "#B45309",
  "#059669",
  "#6366F1",
  "#78716C",
];
const SERIES_DARK = [
  "#2DD4BF",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
  "#FBBF24",
  "#34D399",
  "#818CF8",
  "#A8A29E",
];

const CUSTOM_SERIES_HEX: Record<string, string> = {
  Met: "#059669",
  Breached: "#DC2626",
  Fixed: "#059669",
  New: "#6366F1",
  Open: "#EA580C",
  Exploitable: "#EA580C",
  "Not Exploitable": "#78716C",
  "EOL/Obsolete": "#EA580C",
  Supported: "#78716C",
  "Zero-day": "#DC2626",
  Known: "#78716C",
  "Unpatched > 6 Months": "#EA580C",
  "Unpatched < 6 Months": "#78716C",
  "0\u201330 Days": "#059669",
  "31\u201390 Days": "#6366F1",
  "91\u2013180 Days": "#EA580C",
  "180+ Days": "#DC2626",
  Remediated: "#059669",
};

export function seriesColor(name: string, index: number, dark: boolean): string {
  if (name in SEVERITY_HEX) return SEVERITY_HEX[name as Severity];
  if (name in CUSTOM_SERIES_HEX) return CUSTOM_SERIES_HEX[name];
  const palette = dark ? SERIES_DARK : SERIES_LIGHT;
  return palette[index % palette.length];
}

export const PRIMARY = { light: "#0F766E", dark: "#2DD4BF" };

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
    axis: dark ? "#A8A29E" : "#78716C",
    grid: dark ? "#2F2A28" : "#E7E5E4",
    tooltipBg: dark ? "#2C2826" : "#FFFFFF",
    tooltipBorder: dark ? "#46413E" : "#D6D3D1",
    tooltipText: dark ? "#EDEBE9" : "#1C1917",
    crosshair: dark ? "#46413E" : "#D6D3D1",
  };
}

export { SEVERITIES };
