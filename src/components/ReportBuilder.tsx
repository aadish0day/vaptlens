import { useState, useMemo } from "react";
import { useDashboardStore } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import { findingRiskContribution } from "../lib/risk";
import type { Finding, Severity } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { FileText, Printer, FileCheck } from "lucide-react";
import { SeverityBadge } from "./severity-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { cn } from "../lib/utils";
import { RACI_TEAMS, RACI_ROLES, buildRaciMatrix, type RaciRole } from "../lib/raci";

const THEMES = {
  slate: {
    accent: "border-slate-900 text-slate-900",
    border: "border-slate-200",
    bg: "bg-slate-50/50",
    hex: "#0F172A",
  },
  navy: {
    accent: "border-indigo-900 text-indigo-950",
    border: "border-indigo-100",
    bg: "bg-indigo-50/30",
    hex: "#1E3A8A",
  },
  crimson: {
    accent: "border-red-900 text-red-950",
    border: "border-red-100",
    bg: "bg-red-50/20",
    hex: "#991B1B",
  },
} as const;

const SEVERITY_COLORS = {
  Critical: "#DC2626",
  High: "#EA580C",
  Medium: "#D97706",
  Low: "#0D9488",
  Info: "#78716C",
};

export function ReportBuilder() {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const batches = useDashboardStore((s) => s.batches);

  // States for report customizations
  const [reportTitle, setReportTitle] = useState("Vulnerability Assessment & Analytics Report");
  const [targetCompany, setTargetCompany] = useState("Security Infrastructure Assessment");
  const [authorName, setAuthorName] = useState("VAPTLens Security Auditor");
  const [reportTheme, setReportTheme] = useState<keyof typeof THEMES>("slate");
  const [execSummary, setExecSummary] = useState(
    "This report provides an executive overview of the security vulnerabilities discovered during the infrastructure assessment. Active threat metrics indicate critical exposure areas including End-of-Life (EOL) software versions, zero-day threat definitions, and active SLA compliance breaches. Immediate remediation sprints should target 'Quick Wins' to drastically reduce the organizational attack surface."
  );
  const [scopeDetails, setScopeDetails] = useState(
    "The scope of this audit covers active segments, open ports, and services identified across the uploaded scans. Data processing and metric aggregates have been calculated in a zero-trust, client-side browser environment."
  );

  // Apply active global filters, excluding Fixed placeholders
  const filteredFindings = useMemo(() => {
    return applyFilters(findings, filters).filter((f: Finding) => f.lifecycle !== "Fixed");
  }, [findings, filters]);

  // Aggregate findings by severity
  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
    filteredFindings.forEach((f: Finding) => {
      if (f.severity in counts) {
        counts[f.severity as keyof typeof counts]++;
      }
    });
    return counts;
  }, [filteredFindings]);

  const totalFindings = filteredFindings.length;

  // RACI responsibility matrix (respects active filters)
  const raciMatrix = useMemo(() => buildRaciMatrix(filteredFindings), [filteredFindings]);

  const raciTotals = useMemo(() => {
    const totals: Record<RaciRole, number> = {
      Responsible: 0,
      Accountable: 0,
      Consulted: 0,
      Informed: 0,
    };
    for (const row of raciMatrix.values()) {
      for (const role of RACI_ROLES) totals[role] += row[role];
    }
    return totals;
  }, [raciMatrix]);

  // C.H.I. (Critical / High / Important) SLA projection
  const slaProjection = useMemo(() => {
    const chiRows: {
      severity: Severity;
      chi: "Critical" | "High" | "Important";
      targetDays: number;
      active: number;
      breached: number;
      atRisk: number;
      avgDaysLeft: number;
    }[] = [];
    for (const sev of ["Critical", "High", "Medium"] as Severity[]) {
      const group = filteredFindings.filter((f) => f.severity === sev);
      const targetDays = sev === "Critical" ? 14 : sev === "High" ? 30 : 90;
      const breached = group.filter((f) => f.slaStatus === "Breached").length;
      const daysLeft = group.map((f) => f.slaDaysLeft ?? 0);
      chiRows.push({
        severity: sev,
        chi: (sev === "Medium" ? "Important" : sev) as "Critical" | "High" | "Important",
        targetDays,
        active: group.length,
        breached,
        atRisk: daysLeft.filter((d) => d > 0 && d <= 7).length,
        avgDaysLeft: daysLeft.length
          ? Math.round(daysLeft.reduce((a, b) => a + b, 0) / daysLeft.length)
          : 0,
      });
    }
    const upcoming = filteredFindings
      .filter((f) => f.slaStatus === "Met" && (f.slaDaysLeft ?? 0) <= 14)
      .sort((a, b) => (a.slaDaysLeft ?? 0) - (b.slaDaysLeft ?? 0))
      .slice(0, 5);
    return { chiRows, upcoming };
  }, [filteredFindings]);

  // Weighted host risk leaderboard
  const hostRisk = useMemo(() => {
    const byHost = new Map<string, Finding[]>();
    for (const f of filteredFindings) {
      if (!byHost.has(f.host)) byHost.set(f.host, []);
      byHost.get(f.host)!.push(f);
    }
    return Array.from(byHost.entries())
      .map(([host, list]) => ({
        host,
        score: Math.round(list.reduce((s, f) => s + findingRiskContribution(f), 0)),
        count: list.length,
        critical: list.filter((f) => f.severity === "Critical").length,
        exploitable: list.filter((f) => f.isExploitable === "Exploitable").length,
        kev: list.filter((f) => f.cisaKev === "CISA KEV").length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [filteredFindings]);
  const hostRiskMax = Math.max(1, ...hostRisk.map((r) => r.score));

  // Threat-intel trend per scan month
  const intelTrend = useMemo(() => {
    const INTEL_MATCHES = [
      { key: "kev", label: "CISA KEV", match: (f: Finding) => f.cisaKev === "CISA KEV" },
      { key: "zeroDay", label: "Zero-day", match: (f: Finding) => f.isZeroDay === "Zero-day" },
      { key: "ransomware", label: "Ransomware", match: (f: Finding) => f.ransomwareVector === "Ransomware Threat" },
      { key: "exploitable", label: "Exploitable", match: (f: Finding) => f.isExploitable === "Exploitable" },
    ] as const;
    type IntelMonth = {
      month: string;
      kev: number;
      zeroDay: number;
      ransomware: number;
      exploitable: number;
    };
    const byMonth = new Map<string, IntelMonth>();
    for (const f of filteredFindings) {
      if (!f.scanDate) continue;
      const d = new Date(f.scanDate);
      if (Number.isNaN(d.getTime())) continue;
      const month = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!byMonth.has(month)) {
        byMonth.set(month, { month, kev: 0, zeroDay: 0, ransomware: 0, exploitable: 0 });
      }
      const row = byMonth.get(month)!;
      for (const l of INTEL_MATCHES) if (l.match(f)) row[l.key] += 1;
    }
    return Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredFindings]);

  // 6-month VA / data-leak assessment window
  const vaWindow = useMemo(() => {
    const dates = filteredFindings
      .map((f) => f.scanDate?.slice(0, 10))
      .filter((d): d is string => !!d)
      .sort();
    const end = dates.length ? dates[dates.length - 1] : null;
    let start: string | null = null;
    if (end) {
      const maxDate = new Date(end);
      const minDate = new Date(maxDate);
      minDate.setMonth(maxDate.getMonth() - 6);
      start = minDate.toISOString().slice(0, 10);
    }
    const inWindow =
      start && end
        ? filteredFindings.filter((f) => {
            const d = f.scanDate?.slice(0, 10);
            return !!d && d >= start && d <= end;
          })
        : [];
    const dataLeak = filteredFindings
      .filter((f) => f.unpatchedAge === "Unpatched > 6 Months")
      .sort((a, b) => (b.cvss ?? 0) - (a.cvss ?? 0));
    return { start, end, inWindow, dataLeak };
  }, [filteredFindings]);

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  const themeStyle = THEMES[reportTheme];

  return (
    <div className="flex h-full flex-col gap-6 lg:flex-row">
      {/* Print stylesheet override */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all application layout elements */
          body * {
            visibility: hidden;
          }
          /* Show only the print report container and all its children */
          .vaptlens-print-report, .vaptlens-print-report * {
            visibility: visible;
          }
          .vaptlens-print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .print-header {
            display: none !important;
          }
          .print-break {
            page-break-after: always;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}} />

      {/* Editor Panel */}
      <Card className="w-full shrink-0 border-border bg-card/40 lg:w-[26rem] print:hidden">
        <CardHeader className="pb-3 border-b border-border bg-card/30">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" /> Report Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto">
          {/* Metadata */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="rep-title" className="text-xs">Report Title</Label>
              <Input
                id="rep-title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rep-company" className="text-xs">Scope / Target Organization</Label>
              <Input
                id="rep-company"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rep-author" className="text-xs">Prepared By</Label>
              <Input
                id="rep-author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="mt-1"
              />
            </div>
            
            {/* Theme Selector */}
            <div>
              <Label className="text-xs">Report Visual Theme</Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setReportTheme(t)}
                    className={cn(
                      "rounded border py-1 px-2 text-[10px] font-bold transition-all",
                      reportTheme === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exec Summary */}
          <div>
            <Label htmlFor="rep-exec" className="text-xs">Executive Summary</Label>
            <textarea
              id="rep-exec"
              value={execSummary}
              onChange={(e) => setExecSummary(e.target.value)}
              className="mt-1 w-full min-h-[6rem] rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Scope */}
          <div>
            <Label htmlFor="rep-scope" className="text-xs">Audit Scope &amp; Methodology</Label>
            <textarea
              id="rep-scope"
              value={scopeDetails}
              onChange={(e) => setScopeDetails(e.target.value)}
              className="mt-1 w-full min-h-[5rem] rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <Button onClick={handlePrint} className="w-full flex gap-1.5 items-center">
            <Printer className="h-4 w-4" /> Print / Export PDF
          </Button>
        </CardContent>
      </Card>

      {/* Preview Sheet Panel */}
      <Card className="flex-1 border-border bg-card/20 print:border-none print:bg-transparent overflow-hidden">
        <CardHeader className="pb-2 border-b border-border bg-card/30 flex flex-row items-center justify-between print:hidden">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <FileCheck className="h-4 w-4 text-primary" /> Document Preview
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">Standard A4 margins applied during print</span>
        </CardHeader>
        <CardContent className="p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-14rem)] print:max-h-none print:overflow-visible bg-muted/20">
          
          {/* Printable Container */}
          <div className="vaptlens-print-report mx-auto max-w-[720px] bg-white text-black p-10 shadow-lg rounded-md border border-gray-200 print:shadow-none print:border-none print:p-0">
            
            {/* Title / Cover Page Section */}
            <div className={cn("border-b-4 pb-8 mb-8 text-left relative", themeStyle.accent)}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-gray-500">
                    VAPTLENS Audit & Assessment Ledger
                  </span>
                  <h1 className="text-3xl font-extrabold tracking-tight mt-1 leading-snug text-black">
                    {reportTitle}
                  </h1>
                </div>
                <div className="text-right print:block hidden">
                  <div className="border border-black px-2.5 py-0.5 text-[9px] font-bold rounded">
                    Confidential
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200 text-xs font-mono">
                <div>
                  <p className="text-gray-400 font-semibold text-[9px]">Target organization</p>
                  <p className="font-semibold text-black mt-1">{targetCompany}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold text-[9px]">Prepared by</p>
                  <p className="font-semibold text-black mt-1">{authorName}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold text-[9px]">Assessment scope</p>
                  <p className="font-semibold text-black mt-1">{batches.length} Scan Batches</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-4 text-xs font-mono">
                <div>
                  <p className="text-gray-400 font-semibold text-[9px]">Report date</p>
                  <p className="font-semibold text-black mt-1">
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold text-[9px]">Active threat index</p>
                  <p className="font-semibold text-black mt-1">
                    {filteredFindings.filter(f => ["Critical", "High"].includes(f.severity)).length} Elevated Risk Nodes
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold text-[9px]">Status</p>
                  <p className="font-semibold text-green-700 mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600" /> VERIFIED
                  </p>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-3 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-sm font-bold border-b pb-1.5", themeStyle.accent)}>
                1. Executive Summary
              </h2>
              <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap font-sans">
                {execSummary}
              </p>
            </div>

            {/* Scope */}
            <div className="space-y-3 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-sm font-bold border-b pb-1.5", themeStyle.accent)}>
                2. Scope &amp; Methodology
              </h2>
              <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap font-sans">
                {scopeDetails}
              </p>
            </div>

            {/* Summary Findings Metrics */}
            <div className="space-y-5 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-sm font-bold border-b pb-1.5", themeStyle.accent)}>
                3. Vulnerability Distribution Metrics
              </h2>
              
              {/* Proportional Severity Density Bar */}
              {totalFindings > 0 && (
                <div className="space-y-1">
                  <div className="flex h-4 w-full overflow-hidden rounded bg-gray-100 border border-gray-200">
                    {(["Critical", "High", "Medium", "Low", "Info"] as const).map((sev) => {
                      const count = severityCounts[sev];
                      const pct = totalFindings > 0 ? (count / totalFindings) * 100 : 0;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={sev}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: SEVERITY_COLORS[sev],
                          }}
                          title={`${sev}: ${count} (${pct.toFixed(0)}%)`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] font-medium text-gray-400">
                    <span>Low Exposure</span>
                    <span>Proportional Severity Distribution Bar</span>
                    <span>High Exposure</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-5 gap-3 text-center">
                {(["Critical", "High", "Medium", "Low", "Info"] as const).map((sev) => {
                  const count = severityCounts[sev];
                  const hasValues = count > 0;
                  return (
                    <div 
                      key={sev} 
                      className={cn(
                        "border rounded p-3 transition-colors", 
                        hasValues ? themeStyle.border : "border-gray-100",
                        hasValues ? themeStyle.bg : "bg-gray-50/20"
                      )}
                    >
                      <p className="text-[10px] font-medium text-gray-500">{sev}</p>
                      <p className="text-xl font-extrabold mt-1 font-mono text-black">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* C.H.I. SLA Projection */}
            <div className="space-y-4 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-sm font-bold border-b pb-1.5", themeStyle.accent)}>
                4. SLA Compliance &amp; C.H.I. Projection
              </h2>
              <div className="overflow-hidden rounded border border-gray-100">
                <Table className="text-black">
                  <TableHeader className="bg-gray-50/80 border-b border-gray-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-black text-[10px] font-bold py-2.5">Class</TableHead>
                      <TableHead className="text-black text-[10px] font-bold py-2.5 text-center">SLA Target</TableHead>
                      <TableHead className="text-black text-[10px] font-bold py-2.5 text-center">Active</TableHead>
                      <TableHead className="text-black text-[10px] font-bold py-2.5 text-center">Breached</TableHead>
                      <TableHead className="text-black text-[10px] font-bold py-2.5 text-center">At-Risk ≤7d</TableHead>
                      <TableHead className="text-black text-[10px] font-bold py-2.5 text-right">Avg Days Left</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slaProjection.chiRows.map((r) => (
                      <TableRow key={r.severity} className="border-b border-gray-100 hover:bg-gray-50/20 even:bg-gray-50/30 text-xs">
                        <TableCell className="py-2 font-semibold text-black">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[r.severity] }} />
                            {r.chi}
                            <span className="text-[9px] font-mono text-gray-400">({r.severity})</span>
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-center font-mono text-gray-600">{r.targetDays}d</TableCell>
                        <TableCell className="py-2 text-center font-mono font-bold text-black">{r.active}</TableCell>
                        <TableCell className={`py-2 text-center font-mono font-bold ${r.breached > 0 ? "text-red-700" : "text-gray-400"}`}>
                          {r.breached}
                        </TableCell>
                        <TableCell className={`py-2 text-center font-mono font-bold ${r.atRisk > 0 ? "text-amber-600" : "text-gray-400"}`}>
                          {r.atRisk}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono font-bold text-gray-900">{r.avgDaysLeft}d</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-[9px] text-gray-400 italic font-mono">
                C.H.I. = Critical / High / Important severity classes. Negative avg days-left indicates SLA breach.
              </p>
              {slaProjection.upcoming.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-amber-600">
                    Upcoming breaches (≤14 days)
                  </p>
                  {slaProjection.upcoming.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50/60 px-2.5 py-1.5 text-xs"
                    >
                      <span className="min-w-0 truncate font-medium text-gray-900">{f.name}</span>
                      <span className="shrink-0 font-mono text-[10px] text-amber-700">
                        {f.slaDaysLeft}d left · {f.slaDeadline}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Most Vulnerable Hosts */}
            <div className="space-y-4 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-sm font-bold border-b pb-1.5", themeStyle.accent)}>
                5. Most Vulnerable Hosts (Weighted Risk)
              </h2>
              {hostRisk.length === 0 ? (
                <p className="text-xs text-gray-400 italic font-mono">No active findings to rank.</p>
              ) : (
                <div className="space-y-2">
                  {hostRisk.map((r, i) => (
                    <div key={r.host} className="rounded border border-gray-100 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-semibold text-black">
                          <span className="font-mono text-[10px] text-gray-400 mr-2">#{i + 1}</span>
                          {r.host}
                        </span>
                        <span className="shrink-0 font-mono text-sm font-extrabold text-gray-900">{r.score}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(r.score / hostRiskMax) * 100}%`,
                            backgroundColor:
                              r.score / hostRiskMax > 0.7
                                ? SEVERITY_COLORS.Critical
                                : r.score / hostRiskMax > 0.4
                                ? SEVERITY_COLORS.High
                                : SEVERITY_COLORS.Medium,
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-[9px] font-mono text-gray-500">
                        {r.count} findings · {r.critical} critical · {r.exploitable} exploitable · {r.kev} CISA KEV
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Threat-Intel Trends */}
            <div className="space-y-4 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-sm font-bold border-b pb-1.5", themeStyle.accent)}>
                6. Threat-Intel &amp; Exploitability Trends
              </h2>
              {intelTrend.length === 0 ? (
                <p className="text-xs text-gray-400 italic font-mono">No trend data available.</p>
              ) : (
                <div className="overflow-hidden rounded border border-gray-100">
                  <Table className="text-black">
                    <TableHeader className="bg-gray-50/80 border-b border-gray-200">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-black text-[10px] font-bold py-2.5">Scan Month</TableHead>
                        <TableHead className="text-black text-[10px] font-bold py-2.5 text-center">CISA KEV</TableHead>
                        <TableHead className="text-black text-[10px] font-bold py-2.5 text-center">Zero-day</TableHead>
                        <TableHead className="text-black text-[10px] font-bold py-2.5 text-center">Ransomware</TableHead>
                        <TableHead className="text-black text-[10px] font-bold py-2.5 text-center">Exploitable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {intelTrend.map((t) => (
                        <TableRow key={t.month} className="border-b border-gray-100 hover:bg-gray-50/20 even:bg-gray-50/30 text-xs">
                          <TableCell className="py-2 font-mono font-semibold text-black">{t.month}</TableCell>
                          <TableCell className="py-2 text-center font-mono font-bold text-red-700">{t.kev}</TableCell>
                          <TableCell className="py-2 text-center font-mono font-bold text-indigo-700">{t.zeroDay}</TableCell>
                          <TableCell className="py-2 text-center font-mono font-bold text-purple-700">{t.ransomware}</TableCell>
                          <TableCell className="py-2 text-center font-mono font-bold text-amber-700">{t.exploitable}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* RACI Responsibility Matrix */}
            <div className="space-y-4 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-sm font-bold border-b pb-1.5", themeStyle.accent)}>
                7. RACI Responsibility Matrix
              </h2>
              <div className="overflow-hidden rounded border border-gray-100">
                <Table className="text-black">
                  <TableHeader className="bg-gray-50/80 border-b border-gray-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-black text-[10px] font-bold py-2.5">Owning Team</TableHead>
                      {RACI_ROLES.map((r) => (
                        <TableHead key={r} className="text-black text-[10px] font-bold py-2.5 text-center">
                          {r.slice(0, 1)} — {r}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {RACI_TEAMS.map((team) => {
                      const row = raciMatrix.get(team)!;
                      return (
                        <TableRow key={team} className="border-b border-gray-100 hover:bg-gray-50/20 even:bg-gray-50/30 text-xs">
                          <TableCell className="py-2 font-semibold text-black">{team}</TableCell>
                          {RACI_ROLES.map((r) => (
                            <TableCell
                              key={r}
                              className={cn(
                                "py-2 text-center font-mono font-bold",
                                row[r] > 0 ? "text-black" : "text-gray-300"
                              )}
                            >
                              {row[r] > 0 ? row[r] : "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-gray-50/80 border-t border-gray-200 text-xs">
                      <TableCell className="py-2 text-[10px] font-bold text-gray-700">
                        Total
                      </TableCell>
                      {RACI_ROLES.map((r) => (
                        <TableCell key={r} className="py-2 text-center font-mono font-extrabold text-black">
                          {raciTotals[r]}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <p className="text-[9px] text-gray-400 italic font-mono">
                Responsibility assignments per owning team (R/A/C/I) derived from active findings in scope.
              </p>
            </div>

            {/* 6-Month VA / Data-Leak Window */}
            <div className="space-y-4 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-sm font-bold border-b pb-1.5", themeStyle.accent)}>
                8. Six-Month VA Window &amp; Data-Leak Exposure
              </h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="border rounded p-3 bg-gray-50/50 border-gray-200">
                  <p className="text-[10px] font-medium text-gray-500">Assessment Window</p>
                  <p className="text-xs font-extrabold mt-1 font-mono text-black">
                    {vaWindow.start ?? "—"} → {vaWindow.end ?? "—"}
                  </p>
                </div>
                <div className="border rounded p-3 bg-gray-50/50 border-gray-200">
                  <p className="text-[10px] font-medium text-gray-500">Findings in Window</p>
                  <p className="text-xl font-extrabold mt-1 font-mono text-black">{vaWindow.inWindow.length}</p>
                </div>
                <div className="border rounded p-3 border-rose-200 bg-rose-50/50">
                  <p className="text-[10px] font-medium text-rose-600">Unpatched &gt; 6 Mo (Data Leak)</p>
                  <p className="text-xl font-extrabold mt-1 font-mono text-rose-700">{vaWindow.dataLeak.length}</p>
                </div>
              </div>

              {vaWindow.dataLeak.length > 0 && (
                <div className="overflow-hidden rounded border border-gray-100">
                  <Table className="text-black">
                    <TableHeader className="bg-gray-50/80 border-b border-gray-200">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-black text-[10px] font-bold py-2.5">Severity</TableHead>
                        <TableHead className="text-black text-[10px] font-bold py-2.5">Host / IP</TableHead>
                        <TableHead className="text-black text-[10px] font-bold py-2.5">Vulnerability</TableHead>
                        <TableHead className="text-black text-[10px] font-bold py-2.5 text-right">CVSS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vaWindow.dataLeak.slice(0, 20).map((f) => (
                        <TableRow key={f.id} className="border-b border-gray-100 hover:bg-gray-50/20 even:bg-gray-50/30 text-xs">
                          <TableCell className="py-2 font-mono"><SeverityBadge severity={f.severity} /></TableCell>
                          <TableCell className="py-2 font-mono text-gray-700">{f.host}</TableCell>
                          <TableCell className="py-2 font-medium text-black font-sans">{f.name}</TableCell>
                          <TableCell className="py-2 text-right font-mono font-bold text-gray-900">{f.cvss ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {vaWindow.dataLeak.length > 20 && (
                    <div className="bg-gray-50/40 p-2.5 border-t border-gray-100">
                      <p className="text-[9px] text-gray-400 italic text-right font-mono">
                        * Top 20 unpatched findings shown.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Vulnerability Table details */}
            <div className="space-y-4 print-break-inside-avoid">
              <h2 className={cn("text-sm font-bold border-b pb-1.5", themeStyle.accent)}>
                9. Detailed Findings Ledger
              </h2>
              {filteredFindings.length === 0 ? (
                <p className="text-xs text-gray-400 italic font-mono">No active findings parsed in dataset.</p>
              ) : (
                <div className="overflow-hidden rounded border border-gray-100">
                  <Table className="text-black">
                    <TableHeader className="bg-gray-50/80 border-b border-gray-200">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-black text-[10px] font-bold py-3">Severity</TableHead>
                        <TableHead className="text-black text-[10px] font-bold py-3">Host / IP</TableHead>
                        <TableHead className="text-black text-[10px] font-bold py-3">Vulnerability</TableHead>
                        <TableHead className="text-black text-[10px] font-bold py-3">URL / Resource</TableHead>
                        <TableHead className="text-black text-[10px] font-bold text-right py-3">CVSS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFindings.slice(0, 50).map((f: Finding) => (
                        <TableRow key={f.id} className="border-b border-gray-100 hover:bg-gray-50/20 even:bg-gray-50/30 text-xs">
                          <TableCell className="py-2.5 font-mono"><SeverityBadge severity={f.severity} /></TableCell>
                          <TableCell className="py-2.5 font-mono text-gray-700">{f.host}</TableCell>
                          <TableCell className="py-2.5 font-medium text-black font-sans">{f.name}</TableCell>
                          <TableCell className="py-2.5 font-mono text-[9px] text-gray-500 break-all max-w-[200px] leading-relaxed">
                            {f.url ?? "—"}
                          </TableCell>
                          <TableCell className="py-2.5 text-right font-mono font-bold text-gray-900">{f.cvss ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredFindings.length > 50 && (
                    <div className="bg-gray-50/40 p-2.5 border-t border-gray-100">
                      <p className="text-[9px] text-gray-400 italic text-right font-mono">
                        * Ledger capped. Showing top 50 prioritized findings in export.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </CardContent>
      </Card>
    </div>
  );
}
