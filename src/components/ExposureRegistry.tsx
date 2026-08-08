import { useMemo } from "react";
import { useDashboardStore } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import type { Finding } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { PackageX, Zap, Server } from "lucide-react";
import { SEVERITY_HEX } from "../lib/chart-theme";
import { cn } from "../lib/utils";

/**
 * EOL / 0-day exposure registry.
 * Left: per-software EOL inventory (extracted versions, affected hosts).
 * Right: 0-day exposure listing per asset.
 */
export function ExposureRegistry() {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);

  const { eolRows, zeroDayRows } = useMemo(() => {
    const filtered = applyFilters(findings, filters).filter(
      (f: Finding) => f.lifecycle !== "Fixed"
    );

    // Group EOL findings by extracted version
    const eolMap = new Map<string, Finding[]>();
    for (const f of filtered) {
      if (f.isEol !== "EOL/Obsolete") continue;
      const key = f.extractedVersion ?? f.name;
      if (!eolMap.has(key)) eolMap.set(key, []);
      eolMap.get(key)!.push(f);
    }
    const eolRows = Array.from(eolMap.entries())
      .map(([product, list]) => ({
        product,
        hosts: new Set(list.map((f) => f.host)).size,
        count: list.length,
        critical: list.filter((f) => f.severity === "Critical").length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 0-day findings grouped by host
    const zeroDayMap = new Map<string, Finding[]>();
    for (const f of filtered) {
      if (f.isZeroDay !== "Zero-day") continue;
      if (!zeroDayMap.has(f.host)) zeroDayMap.set(f.host, []);
      zeroDayMap.get(f.host)!.push(f);
    }
    const zeroDayRows = Array.from(zeroDayMap.entries())
      .map(([host, list]) => ({ host, count: list.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { eolRows, zeroDayRows };
  }, [findings, filters]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* EOL Software Inventory */}
      <Card className="border-border bg-card/30">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
            <span className="flex items-center gap-2">
              <PackageX className="h-4 w-4 text-primary" /> EOL / EOS Software Registry
            </span>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {eolRows.reduce((s, r) => s + r.count, 0)} EOL findings
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {eolRows.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No EOL / obsolete software detected.
            </p>
          ) : (
            eolRows.map((r) => (
              <div key={r.product} className="rounded-xl border border-border bg-card px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs font-semibold text-foreground" title={r.product}>
                    {r.product}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {r.critical > 0 && (
                      <span className="font-mono text-[9px] font-bold text-rose-600 dark:text-rose-400">
                        {r.critical} critical
                      </span>
                    )}
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                      {r.count}
                    </Badge>
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
                  <Server className="h-3 w-3" /> {r.hosts} affected {r.hosts === 1 ? "host" : "hosts"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Zero-day Exposure Listing */}
      <Card className="border-border bg-card/30">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> 0-day Exposure by Asset
            </span>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {zeroDayRows.reduce((s, r) => s + r.count, 0)} exposed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {zeroDayRows.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No zero-day exposure detected.
            </p>
          ) : (
            zeroDayRows.map((r) => (
              <div key={r.host} className="rounded-xl border border-border bg-card px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs font-semibold text-foreground">
                    {r.host}
                  </span>
                  <span
                    className={cn("h-1.5 w-12 overflow-hidden rounded-full bg-muted")}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (r.count / (zeroDayRows[0]?.count ?? 1)) * 100)}%`,
                        backgroundColor: SEVERITY_HEX.Critical,
                      }}
                    />
                  </span>
                </div>
                <p className="mt-1 text-[9px] font-medium text-muted-foreground">
                  {r.count} zero-day {r.count === 1 ? "finding" : "findings"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
