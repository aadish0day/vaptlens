import { useMemo } from "react";
import type { ChartProps } from "./types";
import { useTheme } from "../theme-provider";
import { severityBadge, SEVERITY_HEX } from "../../lib/chart-theme";
import {
  SEVERITIES,
  type Severity,
} from "../../lib/types";
import { getFieldValue } from "../../lib/aggregate";
import { cn } from "../../lib/utils";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

export function HeatmapWidget({ widget, filtered, onSelect }: ChartProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const { rows, max } = useMemo(() => {
    const map = new Map<string, Record<Severity, number>>();
    for (const f of filtered) {
      const gv = getFieldValue(f, widget.groupBy);
      const keys = Array.isArray(gv) ? gv : gv ? [gv] : [];
      for (const k of keys) {
        if (!map.has(k)) {
          map.set(k, { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 });
        }
        map.get(k)![f.severity]++;
      }
    }
    const limit = widget.topN && widget.topN > 0 ? widget.topN : undefined;
    const built = Array.from(map.entries())
      .map(([key, sev]) => {
        const total = SEVERITIES.reduce((s, x) => s + sev[x], 0);
        return { key, sev, total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
    const m = built.reduce(
      (acc, r) => Math.max(acc, ...SEVERITIES.map((x) => r.sev[x])),
      0
    );
    return { rows: built, max: m || 1 };
  }, [filtered, widget.groupBy, widget.topN]);

  if (rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No findings match the current filters.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto pr-1">
      <div
        className="grid min-w-[420px] gap-1 text-xs"
        style={{
          gridTemplateColumns: "minmax(96px, 1.3fr) repeat(5, minmax(0, 1fr))",
        }}
      >
        <div />
        {SEVERITIES.map((s) => (
          <div
            key={s}
            className="flex items-center justify-center gap-1 pb-1 font-medium"
            style={{ color: severityBadge(s, dark).text }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: SEVERITY_HEX[s] }}
            />
          </div>
        ))}

        {rows.map((r) => (
          <Row
            key={r.key}
            label={r.key}
            sev={r.sev}
            max={max}
            dark={dark}
            onClick={() => onSelect(widget.groupBy, r.key)}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  label,
  sev,
  max,
  dark,
  onClick,
}: {
  label: string;
  sev: Record<Severity, number>;
  max: number;
  dark: boolean;
  onClick: () => void;
}) {
  return (
    <>
      <button
        onClick={onClick}
        className="flex items-center truncate rounded-md px-2 py-1.5 text-left font-medium text-foreground transition-colors hover:bg-accent"
        title={label}
      >
        <span className="truncate">{label}</span>
      </button>
      {SEVERITIES.map((s) => {
        const count = sev[s];
        const ratio = count / max;
        const bg =
          count === 0
            ? "transparent"
            : hexToRgba(SEVERITY_HEX[s], 0.14 + 0.74 * ratio);
        return (
          <div
            key={s}
            className={cn(
              "flex items-center justify-center rounded-md border tabular-nums",
              count === 0 ? "border-border/60" : "border-transparent"
            )}
            style={{ backgroundColor: bg, color: severityBadge(s, dark).text }}
            title={`${label} · ${s}: ${count}`}
          >
            {count > 0 ? count : ""}
          </div>
        );
      })}
    </>
  );
}
