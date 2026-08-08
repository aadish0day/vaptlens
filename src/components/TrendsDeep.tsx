import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useDashboardStore } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import { useChartTheme, SEVERITY_HEX } from "../lib/chart-theme";
import type { Finding } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, Layers } from "lucide-react";

const AGING_ORDER = ["0–30 Days", "31–90 Days", "91–180 Days", "180+ Days"];
const AGING_COLORS: Record<string, string> = {
  "0–30 Days": "#059669",
  "31–90 Days": "#0D9488",
  "91–180 Days": "#EA580C",
  "180+ Days": "#DC2626",
};

const INTEL_LINES: { key: string; label: string; match: (f: Finding) => boolean; color: string }[] = [
  { key: "kev", label: "CISA KEV", match: (f) => f.cisaKev === "CISA KEV", color: "#DC2626" },
  { key: "zeroDay", label: "Zero-day", match: (f) => f.isZeroDay === "Zero-day", color: "#4F46E5" },
  { key: "ransomware", label: "Ransomware", match: (f) => f.ransomwareVector === "Ransomware Threat", color: "#7C3AED" },
  { key: "exploitable", label: "Exploitable", match: (f) => f.isExploitable === "Exploitable", color: "#EA580C" },
];

/**
 * Deep trends panel:
 *  - Left: aging-bucket composition per scan month (stacked bars)
 *  - Right: threat-intel / exploitability counts per scan month (multi-line)
 */
export function TrendsDeep() {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const chart = useChartTheme();

  const { agingData, intelData } = useMemo(() => {
    const filtered = applyFilters(findings, filters).filter(
      (f: Finding) => f.lifecycle !== "Fixed"
    );

    const monthOf = (f: Finding) => {
      if (!f.scanDate) return "Unknown";
      const d = new Date(f.scanDate);
      if (Number.isNaN(d.getTime())) return f.scanDate.slice(0, 7);
      return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    };

    // Aging stacked data: month -> bucket -> count
    const agingMap = new Map<string, Record<string, number>>();
    for (const f of filtered) {
      const month = monthOf(f);
      if (!agingMap.has(month)) {
        agingMap.set(month, { "0–30 Days": 0, "31–90 Days": 0, "91–180 Days": 0, "180+ Days": 0 });
      }
      const row = agingMap.get(month)!;
      const bucket = f.agingBucket ?? "0–30 Days";
      if (bucket in row) row[bucket] += 1;
    }
    const agingData = Array.from(agingMap.entries())
      .map(([month, buckets]) => ({ month, ...buckets }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Intel trend data: month -> intel key -> count
    const intelMap = new Map<string, Record<string, number>>();
    for (const f of filtered) {
      const month = monthOf(f);
      if (!intelMap.has(month)) {
        intelMap.set(month, { kev: 0, zeroDay: 0, ransomware: 0, exploitable: 0 });
      }
      const row = intelMap.get(month)!;
      for (const l of INTEL_LINES) {
        if (l.match(f)) row[l.key] += 1;
      }
    }
    const intelData = Array.from(intelMap.entries())
      .map(([month, counts]) => ({ month, ...counts }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { agingData, intelData };
  }, [findings, filters]);

  const axisTick = { fill: chart.axis, fontSize: 11, fontFamily: "Inter, sans-serif" };
  const tooltipStyle = {
    background: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: 10,
    fontFamily: "Inter, sans-serif",
    fontSize: 12,
    boxShadow: "0 8px 24px -6px rgb(16 24 40 / 0.18)",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Aging by severity / bucket per month */}
      <Card className="border-border bg-card/30">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
            <Layers className="h-4 w-4 text-primary" /> Vulnerability Aging by Scan Month
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 h-64">
          {agingData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No trend data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid stroke={chart.grid} vertical={false} />
                <XAxis dataKey="month" tick={axisTick} stroke={chart.grid} tickLine={false} />
                <YAxis tick={axisTick} stroke={chart.grid} tickLine={false} allowDecimals={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: chart.crosshair, opacity: 0.2 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {AGING_ORDER.map((b) => (
                  <Bar
                    key={b}
                    dataKey={b}
                    stackId="aging"
                    fill={AGING_COLORS[b]}
                    radius={b === AGING_ORDER[AGING_ORDER.length - 1] ? [4, 4, 0, 0] : 0}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Threat-intel trend lines */}
      <Card className="border-border bg-card/30">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
            <TrendingUp className="h-4 w-4 text-primary" /> Threat Intel &amp; Exploit Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 h-64">
          {intelData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No trend data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={intelData} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid stroke={chart.grid} vertical={false} />
                <XAxis dataKey="month" tick={axisTick} stroke={chart.grid} tickLine={false} />
                <YAxis tick={axisTick} stroke={chart.grid} tickLine={false} allowDecimals={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: chart.crosshair, strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {INTEL_LINES.map((l) => (
                  <Line
                    key={l.key}
                    type="monotone"
                    dataKey={l.key}
                    name={l.label}
                    stroke={l.color}
                    strokeWidth={2}
                    dot={{ r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4.5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Severity legend strip */}
      <div className="lg:col-span-2 flex flex-wrap items-center gap-3 px-1">
        {INTEL_LINES.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
        <span className="mx-1 h-3 w-px bg-border" />
        {Object.entries(SEVERITY_HEX).map(([sev, hex]) => (
          <span key={sev} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
            {sev}
          </span>
        ))}
      </div>
    </div>
  );
}
