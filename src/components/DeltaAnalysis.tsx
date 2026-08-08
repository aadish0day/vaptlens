import { useMemo, useState } from "react";
import { useDashboardStore } from "../store/useDashboardStore";
import type { Finding } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CheckCircle2, AlertOctagon, Flame, ArrowRightLeft, Download } from "lucide-react";
import { SeverityBadge } from "./severity-badge";

export function DeltaAnalysis() {
  const batches = useDashboardStore((s) => s.batches);
  const findings = useDashboardStore((s) => s.findings);

  // Chronologically sorted batches
  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [batches]);

  const [batchAId, setBatchAId] = useState<string>(sortedBatches[0]?.id ?? "");
  const [batchBId, setBatchBId] = useState<string>(
    sortedBatches.length > 1 ? sortedBatches[sortedBatches.length - 1]?.id : sortedBatches[0]?.id ?? ""
  );

  // Diff findings between Scan A and Scan B
  const diffResult = useMemo(() => {
    if (!batchAId || !batchBId || batchAId === batchBId) {
      return { fixed: [], persistent: [], newFindings: [], riskDeltaPct: 0 };
    }

    const findingsA = findings.filter((f) => f.scanId === batchAId && f.lifecycle !== "Fixed");
    const findingsB = findings.filter((f) => f.scanId === batchBId && f.lifecycle !== "Fixed");

    const mapA = new Map<string, Finding>();
    for (const f of findingsA) {
      const key = `${f.host}|${f.name.toLowerCase()}|${f.port ?? ""}`;
      mapA.set(key, f);
    }

    const mapB = new Map<string, Finding>();
    for (const f of findingsB) {
      const key = `${f.host}|${f.name.toLowerCase()}|${f.port ?? ""}`;
      mapB.set(key, f);
    }

    const fixed: Finding[] = [];
    const persistent: Finding[] = [];
    const newFindings: Finding[] = [];

    // Fixed: in A but missing in B
    for (const [key, f] of mapA.entries()) {
      if (mapB.has(key)) {
        persistent.push(f);
      } else {
        fixed.push(f);
      }
    }

    // New: in B but missing in A
    for (const [key, f] of mapB.entries()) {
      if (!mapA.has(key)) {
        newFindings.push(f);
      }
    }

    // Risk delta score calculation
    const scoreA = findingsA.reduce((sum, f) => sum + (f.cvss ?? 3), 0);
    const scoreB = findingsB.reduce((sum, f) => sum + (f.cvss ?? 3), 0);
    const riskDeltaPct = scoreA > 0 ? Math.round(((scoreB - scoreA) / scoreA) * 100) : 0;

    return { fixed, persistent, newFindings, riskDeltaPct };
  }, [findings, batchAId, batchBId]);

  const handleExportVerificationCsv = () => {
    if (!diffResult) return;
    const header = "Status,Host,Port,Severity,CVSS,Finding Name\n";
    const rows = [
      ...diffResult.fixed.map((f) => `Remediated,"${f.host}","${f.port ?? ""}","${f.severity}",${f.cvss ?? ""},"${f.name.replace(/"/g, '""')}"`),
      ...diffResult.newFindings.map((f) => `New Introduced,"${f.host}","${f.port ?? ""}","${f.severity}",${f.cvss ?? ""},"${f.name.replace(/"/g, '""')}"`),
      ...diffResult.persistent.map((f) => `Persistent Unpatched,"${f.host}","${f.port ?? ""}","${f.severity}",${f.cvss ?? ""},"${f.name.replace(/"/g, '""')}"`),
    ].join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vaptlens-retest-verification-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (sortedBatches.length < 2) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 text-center p-6">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary mb-3">
          <ArrowRightLeft className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold tracking-tight">Re-Testing Verification & Differential Auditor</h3>
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
          Upload at least 2 vulnerability scans (e.g. Baseline vs. Re-test) to compare findings, verify fixed vulnerabilities, and detect regressions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Scan Selector Bar */}
      <Card className="border-border bg-card/40">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="space-y-1 min-w-[140px]">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Baseline Scan A
              </label>
              <Select value={batchAId} onValueChange={setBatchAId}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortedBatches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.label} ({b.date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-muted-foreground font-bold mt-4">VS</span>

            <div className="space-y-1 min-w-[140px]">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Re-Test Scan B
              </label>
              <Select value={batchBId} onValueChange={setBatchBId}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortedBatches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.label} ({b.date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Metric Summary Score Badges */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
            <div className="text-right">
              <span className="text-[10px] font-semibold text-muted-foreground">Net risk delta</span>
              <div className="text-lg font-extrabold font-mono flex items-center gap-1">
                <span className={diffResult.riskDeltaPct <= 0 ? "text-emerald-500" : "text-rose-500"}>
                  {diffResult.riskDeltaPct <= 0 ? "" : "+"}{diffResult.riskDeltaPct}%
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 py-1 font-mono text-xs">
                <CheckCircle2 className="h-3 w-3" /> {diffResult.fixed.length} Fixed
              </Badge>
              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 py-1 font-mono text-xs">
                <Flame className="h-3 w-3" /> {diffResult.newFindings.length} New
              </Badge>
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 py-1 font-mono text-xs">
                <AlertOctagon className="h-3 w-3" /> {diffResult.persistent.length} Persistent
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 ml-2"
                onClick={handleExportVerificationCsv}
              >
                <Download className="h-3.5 w-3.5" />
                Export Audit Log
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diff Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Verified Remediated / Fixed */}
        <Card className="border-border bg-card/30">
          <CardHeader className="pb-3 border-b border-border bg-emerald-500/5">
            <CardTitle className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Verified Remediated
              </span>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                {diffResult.fixed.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2.5 max-h-[calc(100vh-18rem)] overflow-y-auto">
            {diffResult.fixed.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No remediated vulnerabilities detected between these scans.</p>
            ) : (
              diffResult.fixed.map((f) => (
                <div key={f.id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.02] p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <SeverityBadge severity={f.severity} />
                    <span className="font-mono text-[10px] text-muted-foreground">Host: {f.host}</span>
                  </div>
                  <p className="font-medium text-foreground">{f.name}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 2: New Findings Introduced */}
        <Card className="border-border bg-card/30">
          <CardHeader className="pb-3 border-b border-border bg-rose-500/5">
            <CardTitle className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4" /> New Introduced Risk
              </span>
              <Badge variant="outline" className="border-rose-500/30 text-rose-600">
                {diffResult.newFindings.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2.5 max-h-[calc(100vh-18rem)] overflow-y-auto">
            {diffResult.newFindings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No new vulnerabilities introduced.</p>
            ) : (
              diffResult.newFindings.map((f) => (
                <div key={f.id} className="rounded-lg border border-rose-500/20 bg-rose-500/[0.02] p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <SeverityBadge severity={f.severity} />
                    <span className="font-mono text-[10px] text-muted-foreground">Host: {f.host}</span>
                  </div>
                  <p className="font-medium text-foreground">{f.name}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Column 3: Persistent / Unpatched */}
        <Card className="border-border bg-card/30">
          <CardHeader className="pb-3 border-b border-border bg-amber-500/5">
            <CardTitle className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
              <span className="flex items-center gap-1.5">
                <AlertOctagon className="h-4 w-4" /> Persistent / Unpatched
              </span>
              <Badge variant="outline" className="border-amber-500/30 text-amber-600">
                {diffResult.persistent.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2.5 max-h-[calc(100vh-18rem)] overflow-y-auto">
            {diffResult.persistent.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No persistent unpatched vulnerabilities.</p>
            ) : (
              diffResult.persistent.map((f) => (
                <div key={f.id} className="rounded-lg border border-border bg-card p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <SeverityBadge severity={f.severity} />
                    <span className="font-mono text-[10px] text-muted-foreground">Host: {f.host}</span>
                  </div>
                  <p className="font-medium text-foreground">{f.name}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
