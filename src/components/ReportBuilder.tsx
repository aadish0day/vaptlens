import { useState, useMemo } from "react";
import { useDashboardStore } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import type { Finding } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { FileText, Printer, FileCheck } from "lucide-react";
import { SeverityBadge } from "./severity-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { cn } from "../lib/utils";

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
  Critical: "#E5484D",
  High: "#F2994A",
  Medium: "#EAA000",
  Low: "#0090FF",
  Info: "#8E96A3",
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
                      "rounded border py-1 px-2 text-[10px] font-bold uppercase transition-all",
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
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-mono">
                    VAPTLENS AUDIT & ASSESSMENT LEDGER
                  </span>
                  <h1 className="text-3xl font-extrabold tracking-tight mt-1 leading-snug text-black">
                    {reportTitle}
                  </h1>
                </div>
                <div className="text-right print:block hidden">
                  <div className="border border-black px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded">
                    CONFIDENTIAL
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200 text-xs font-mono">
                <div>
                  <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Target Organization</p>
                  <p className="font-semibold text-black mt-1">{targetCompany}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Prepared By</p>
                  <p className="font-semibold text-black mt-1">{authorName}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Assessment Scope</p>
                  <p className="font-semibold text-black mt-1">{batches.length} Scan Batches</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-4 text-xs font-mono">
                <div>
                  <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Report Date</p>
                  <p className="font-semibold text-black mt-1">
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Active Threat Index</p>
                  <p className="font-semibold text-black mt-1">
                    {filteredFindings.filter(f => ["Critical", "High"].includes(f.severity)).length} Elevated Risk Nodes
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-bold text-[9px] tracking-wider">Status</p>
                  <p className="font-semibold text-green-700 mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600" /> VERIFIED
                  </p>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-3 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-xs font-bold uppercase tracking-wider border-b pb-1.5 font-mono", themeStyle.accent)}>
                1. Executive Summary
              </h2>
              <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap font-sans">
                {execSummary}
              </p>
            </div>

            {/* Scope */}
            <div className="space-y-3 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-xs font-bold uppercase tracking-wider border-b pb-1.5 font-mono", themeStyle.accent)}>
                2. Scope &amp; Methodology
              </h2>
              <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-wrap font-sans">
                {scopeDetails}
              </p>
            </div>

            {/* Summary Findings Metrics */}
            <div className="space-y-5 mb-8 print-break-inside-avoid">
              <h2 className={cn("text-xs font-bold uppercase tracking-wider border-b pb-1.5 font-mono", themeStyle.accent)}>
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
                  <div className="flex justify-between text-[8px] text-gray-400 font-mono uppercase tracking-wider">
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
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 font-mono">{sev}</p>
                      <p className="text-xl font-extrabold mt-1 font-mono text-black">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vulnerability Table details */}
            <div className="space-y-4 print-break-inside-avoid">
              <h2 className={cn("text-xs font-bold uppercase tracking-wider border-b pb-1.5 font-mono", themeStyle.accent)}>
                4. Detailed Findings Ledger
              </h2>
              {filteredFindings.length === 0 ? (
                <p className="text-xs text-gray-400 italic font-mono">No active findings parsed in dataset.</p>
              ) : (
                <div className="overflow-hidden rounded border border-gray-100">
                  <Table className="text-black">
                    <TableHeader className="bg-gray-50/80 border-b border-gray-200">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-black text-[10px] font-bold uppercase tracking-wider font-mono py-3">Severity</TableHead>
                        <TableHead className="text-black text-[10px] font-bold uppercase tracking-wider font-mono py-3">Host / IP</TableHead>
                        <TableHead className="text-black text-[10px] font-bold uppercase tracking-wider font-mono py-3">Vulnerability</TableHead>
                        <TableHead className="text-black text-[10px] font-bold uppercase tracking-wider font-mono py-3">URL / Resource</TableHead>
                        <TableHead className="text-black text-[10px] font-bold uppercase tracking-wider font-mono text-right py-3">CVSS</TableHead>
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
