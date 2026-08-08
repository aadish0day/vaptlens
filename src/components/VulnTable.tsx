import { Fragment, useMemo, useState } from "react";
import {
  Biohazard,
  Bug,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Gauge,
  Search,
  Server,
  ShieldAlert,
  Wrench,
  Copy,
  Check,
  Flame,
  Terminal,
  Layers,
  Ticket,
} from "lucide-react";
import type { Finding } from "../lib/types";
import { useDashboardStore } from "../store/useDashboardStore";
import { deduplicateFindings } from "../lib/aggregate";
import { findRemediationSnippet } from "../lib/remediationSnippets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { SeverityBadge } from "./severity-badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { canPerform } from "../lib/permissions";
import { RestrictedButton, PermissionTooltip } from "./RestrictedButton";

type SortKey = "severity" | "host" | "name" | "cvss" | "tool" | "lifecycle" | "slaStatus";

function StatusBadge({ status }: { status: "New" | "Open" | "Fixed" }) {
  const styles = {
    New: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    Open: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    Fixed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border", styles[status])}>
      {status}
    </span>
  );
}
const SEV_RANK: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Info: 4,
};

function SortHeader({
  label,
  icon,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <TableHead className={cn("cursor-pointer select-none", className)} onClick={onClick}>
      <span className="inline-flex items-center gap-1 hover:text-foreground">
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
        {label}
        {active ? (
          dir === "asc" ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 rotate-90" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </span>
    </TableHead>
  );
}

export function VulnTable({ findings }: { findings: Finding[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isDeduplicated, setIsDeduplicated] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const remediateAllFiltered = useDashboardStore((s) => s.remediateAllFiltered);
  const assignFindingTeam = useDashboardStore((s) => s.assignFindingTeam);
  const raiseTicket = useDashboardStore((s) => s.raiseTicket);
  const userRole = useDashboardStore((s) => s.userRole);
  const canRemediate = canPerform(userRole, "remediate");
  const canAssign = canPerform(userRole, "assign");
  const canTicket = canPerform(userRole, "ticket");

  const processedFindings = useMemo(() => {
    return isDeduplicated ? deduplicateFindings(findings) : findings;
  }, [findings, isDeduplicated]);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = processedFindings.filter(
      (f) =>
        !q ||
        f.host.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        (f.cve?.some((c) => c.toLowerCase().includes(q)) ?? false)
    );
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "severity":
          cmp = SEV_RANK[a.severity] - SEV_RANK[b.severity];
          break;
        case "cvss":
          cmp = (a.cvss ?? -1) - (b.cvss ?? -1);
          break;
        case "host":
          cmp = a.host.localeCompare(b.host);
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "tool":
          cmp = a.tool.localeCompare(b.tool);
          break;
        case "lifecycle":
          cmp = (a.lifecycle ?? "New").localeCompare(b.lifecycle ?? "New");
          break;
        case "slaStatus":
          cmp = (a.slaStatus ?? "Met").localeCompare(b.slaStatus ?? "Met");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [processedFindings, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (findings.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No findings match the current filters.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-1 pb-2.5">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-card px-2.5 py-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter table…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Filter findings table"
          />
        </div>

        <div className="flex items-center gap-2">
          <RestrictedButton
            variant="outline"
            size="sm"
            allowed={canRemediate}
            reason="Your role cannot remediate findings — ask an Administrator or Remediation Lead"
            title="Mark all active vulnerabilities in this view as fixed"
            onClick={remediateAllFiltered}
            className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            <Check className="h-3.5 w-3.5" />
            Remediate All
          </RestrictedButton>

          <Button
            variant={isDeduplicated ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsDeduplicated((v) => !v)}
            className="h-8 text-xs gap-1.5"
            title="Deduplicate vulnerabilities across URLs and tools"
          >
            <Layers className="h-3.5 w-3.5 text-primary" />
            {isDeduplicated ? "Deduplicated" : "Group Noise"}
          </Button>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground font-mono">
            {rows.length} rows
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8" />
              <SortHeader
                label="Sev"
                icon={<ShieldAlert className="h-3.5 w-3.5" />}
                active={sortKey === "severity"}
                dir={sortDir}
                onClick={() => toggleSort("severity")}
              />
              <SortHeader
                label="Host"
                icon={<Server className="h-3.5 w-3.5" />}
                active={sortKey === "host"}
                dir={sortDir}
                onClick={() => toggleSort("host")}
              />
              <SortHeader
                label="Status"
                active={sortKey === "lifecycle"}
                dir={sortDir}
                onClick={() => toggleSort("lifecycle")}
              />
              <SortHeader
                label="Finding"
                icon={<Bug className="h-3.5 w-3.5" />}
                active={sortKey === "name"}
                dir={sortDir}
                onClick={() => toggleSort("name")}
              />
              <SortHeader
                label="CVSS"
                icon={<Gauge className="h-3.5 w-3.5" />}
                active={sortKey === "cvss"}
                dir={sortDir}
                onClick={() => toggleSort("cvss")}
                className="text-right"
              />
              <SortHeader
                label="Tool"
                icon={<Wrench className="h-3.5 w-3.5" />}
                active={sortKey === "tool"}
                dir={sortDir}
                onClick={() => toggleSort("tool")}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => {
              const open = expanded.has(f.id);
              const snippet = findRemediationSnippet(f.name, f.description);
              return (
                <Fragment key={f.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggleExpand(f.id)}
                  >
                    <TableCell className="w-8 text-muted-foreground">
                      {open ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={f.severity} />
                    </TableCell>
                     <TableCell className="font-medium text-foreground">
                      {f.host}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={f.lifecycle ?? "New"} />
                    </TableCell>
                    <TableCell className="max-w-[400px] text-foreground" title={f.name}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn(f.lifecycle === "Fixed" && "line-through text-muted-foreground")}>
                          {f.name}
                        </span>
                        {f.cisaKev === "CISA KEV" && (
                          <span className="shrink-0 rounded bg-rose-600 text-white px-1.5 py-0.5 text-[9px] font-extrabold shadow-sm flex items-center gap-1">
                            <Flame className="h-3 w-3" /> CISA KEV
                          </span>
                        )}
                        {f.ransomwareVector === "Ransomware Threat" && (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 text-[9px] font-semibold border border-purple-500/20">
                            <Biohazard className="h-3 w-3" /> Ransomware
                          </span>
                        )}
                        {f.isZeroDay === "Zero-day" && (
                          <span className="shrink-0 rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Zero-day
                          </span>
                        )}
                        {f.isExploitable === "Exploitable" && (
                          <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
                            Exploit
                          </span>
                        )}
                        {f.isEol === "EOL/Obsolete" && (
                          <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            EOL
                          </span>
                        )}
                        {f.slaStatus === "Breached" && (
                          <span className="shrink-0 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            SLA Breached
                          </span>
                        )}
                        {f.occurrenceCount && f.occurrenceCount > 1 && (
                          <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground border">
                            {f.occurrenceCount}x merged
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {f.cvss ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.toolsDetected ? f.toolsDetected.join(", ") : f.tool}
                    </TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell />
                      <TableCell colSpan={6} className="bg-accent/30 px-4 py-3">
                        <div className="space-y-3 text-sm">
                          {/* Enterprise Team Assignment & RACI Ticket Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-muted-foreground">Assigned team:</span>
                              <div className="flex items-center gap-1.5">
                                {(["Server Team", "DevOps / Cloud", "Database DBAs", "SecOps", "Application Dev"] as const).map((t) => (
                                  <PermissionTooltip
                                    key={t}
                                    locked={!canAssign}
                                    reason={`Your role cannot assign teams — ask an Administrator or Remediation Lead`}
                                  >
                                    <button
                                      type="button"
                                      aria-disabled={!canAssign || undefined}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!canAssign) return;
                                        assignFindingTeam(f.id, t);
                                      }}
                                      title={canAssign ? `Assign to ${t}` : undefined}
                                      className={cn(
                                        "rounded px-2 py-0.5 text-[10px] font-semibold border transition-all",
                                        f.assignedTeam === t
                                          ? "bg-primary text-primary-foreground border-primary"
                                          : canAssign
                                          ? "bg-muted/50 text-muted-foreground border-border hover:bg-accent"
                                          : "bg-muted/30 text-muted-foreground/40 border-border cursor-not-allowed"
                                      )}
                                    >
                                      {t}
                                    </button>
                                  </PermissionTooltip>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {f.ticketId ? (
                                <span className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 font-mono text-xs font-bold">
                                  <Ticket className="h-3 w-3" /> Ticket {f.ticketId} ({f.patchStatus})
                                </span>
                              ) : (
                                <RestrictedButton
                                  size="sm"
                                  variant="secondary"
                                  allowed={canTicket}
                                  reason="Your role cannot raise tickets — ask an Administrator or Remediation Lead"
                                  className="h-7 text-xs gap-1.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    raiseTicket(f.id);
                                  }}
                                >
                                  Raise Jira/GitHub Ticket
                                </RestrictedButton>
                              )}
                            </div>
                          </div>

                          {f.description && (
                            <p className="text-muted-foreground">
                              <span className="font-semibold text-foreground">
                                Description:{" "}
                              </span>
                              {f.description}
                            </p>
                          )}
                          {f.solution && (
                            <p className="text-muted-foreground">
                              <span className="font-semibold text-foreground">
                                Remediation:{" "}
                              </span>
                              {f.solution}
                            </p>
                          )}
                          {f.url && (
                            <p className="text-muted-foreground break-all">
                              <span className="font-semibold text-foreground">
                                URL:{" "}
                              </span>
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-mono text-xs"
                              >
                                {f.url}
                              </a>
                            </p>
                          )}
                          {f.cve && f.cve.length > 0 && (
                            <p className="font-mono text-xs text-primary">
                              CVEs: {f.cve.join(", ")}
                            </p>
                          )}

                          {snippet && (
                            <div className="mt-3 rounded-lg border border-primary/20 bg-card p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                  <Terminal className="h-3.5 w-3.5 text-primary" /> Remediation Patch Snippet: {snippet.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{snippet.category}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">{snippet.description}</p>
                              
                              <div className="space-y-2 pt-1">
                                {snippet.snippets.map((s, idx) => (
                                  <div key={idx} className="rounded border border-border bg-muted/40 p-2 font-mono text-[11px] space-y-1">
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                      <span>{s.technology}</span>
                                      <button
                                        onClick={() => handleCopyCode(s.code)}
                                        className="flex items-center gap-1 text-primary hover:underline"
                                      >
                                        {copiedCode === s.code ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                        {copiedCode === s.code ? "Copied!" : "Copy Fix"}
                                      </button>
                                    </div>
                                    <pre className="whitespace-pre-wrap overflow-x-auto text-foreground p-1 bg-background rounded">
                                      {s.code}
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
