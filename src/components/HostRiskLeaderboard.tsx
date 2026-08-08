import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDashboardStore } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import { findingRiskContribution } from "../lib/risk";
import { SEVERITY_HEX } from "../lib/chart-theme";
import type { Finding } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Trophy, Flame, Zap, Skull, ChevronRight, Ticket, Users, Terminal, Copy, Check, AlertTriangle } from "lucide-react";
import { findRemediationSnippet } from "../lib/remediationSnippets";
import { cn } from "../lib/utils";
import { canPerform } from "../lib/permissions";
import { RestrictedButton, PermissionTooltip } from "./RestrictedButton";
import { SeverityBadge } from "./severity-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";

const TEAMS = ["Server Team", "DevOps / Cloud", "Database DBAs", "SecOps", "Application Dev"] as const;

/** Query param used to deep-link the drawer to a specific host. */
const HOST_PARAM = "host";

function readHostParam(): string | null {
  try {
    return new URLSearchParams(window.location.search).get(HOST_PARAM);
  } catch {
    return null;
  }
}

function syncHostParam(host: string | null): void {
  try {
    const url = new URL(window.location.href);
    if (host) url.searchParams.set(HOST_PARAM, host);
    else url.searchParams.delete(HOST_PARAM);
    window.history.replaceState(null, "", url.toString());
  } catch {
    /* ignore */
  }
}

interface HostRow {
  host: string;
  score: number;
  count: number;
  critical: number;
  exploitable: number;
  kev: number;
  zeroDay: number;
  ransomware: number;
  slaBreached: number;
  findings: Finding[];
}

/**
 * Weighted "Most Vulnerable Hosts" leaderboard.
 * Risk = Σ findingRiskContribution (severity × exploit × intel × aging).
 * Clicking a row cross-filters the dashboard by that host; clicking the
 * chevron opens a per-host findings drawer with assign/ticket actions.
 */
export function HostRiskLeaderboard() {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const toggleCrossFilter = useDashboardStore((s) => s.toggleCrossFilter);
  const crossFilters = useDashboardStore((s) => s.filters.crossFilters);
  const userRole = useDashboardStore((s) => s.userRole);
  const assignFindingTeam = useDashboardStore((s) => s.assignFindingTeam);
  const raiseTicket = useDashboardStore((s) => s.raiseTicket);
  const hostDrawerHost = useDashboardStore((s) => s.hostDrawerHost);
  const hostDrawerScroll = useDashboardStore((s) => s.hostDrawerScroll);
  const openHostDrawer = useDashboardStore((s) => s.openHostDrawer);
  const closeHostDrawer = useDashboardStore((s) => s.closeHostDrawer);
  const setHostDrawerScroll = useDashboardStore((s) => s.setHostDrawerScroll);

  const canAssign = canPerform(userRole, "assign");
  const canTicket = canPerform(userRole, "ticket");

  // Drawer host lives in the store so it survives tab switches (unmounts).
  const selectedHost = hostDrawerHost;
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Scroll position is tracked in a ref (no re-renders on scroll), persisted
  // to the store on unmount, and restored when the drawer reopens.
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);

  // Deep-link: if the URL carries ?host=, open the drawer for that host on
  // mount (the URL wins over any previously stored host).
  useEffect(() => {
    const urlHost = readHostParam();
    if (urlHost) openHostDrawer(urlHost);
  }, [openHostDrawer]);

  // Persist the drawer's scroll position when the tab unmounts.
  useEffect(() => {
    return () => setHostDrawerScroll(scrollPosRef.current);
  }, [setHostDrawerScroll]);

  // Restore the saved scroll position once the drawer content is mounted.
  useLayoutEffect(() => {
    if (selectedHost && scrollRef.current) {
      scrollRef.current.scrollTop = hostDrawerScroll;
    }
  }, [selectedHost, hostDrawerScroll]);

  // Active findings (respects global filters) grouped per host. One map
  // feeds both the top-8 leaderboard and the drawer, so deep-linked hosts
  // outside the top 8 still resolve and the row shape stays in sync.
  const hostRows = useMemo(() => {
    const active = applyFilters(findings, filters).filter(
      (f: Finding) => f.lifecycle !== "Fixed"
    );
    const byHost = new Map<string, Finding[]>();
    for (const f of active) {
      if (!byHost.has(f.host)) byHost.set(f.host, []);
      byHost.get(f.host)!.push(f);
    }
    const buildRow = (host: string, list: Finding[]): HostRow => ({
      host,
      score: Math.round(list.reduce((s, f) => s + findingRiskContribution(f), 0)),
      count: list.length,
      critical: list.filter((f) => f.severity === "Critical").length,
      exploitable: list.filter((f) => f.isExploitable === "Exploitable").length,
      kev: list.filter((f) => f.cisaKev === "CISA KEV").length,
      zeroDay: list.filter((f) => f.isZeroDay === "Zero-day").length,
      ransomware: list.filter((f) => f.ransomwareVector === "Ransomware Threat").length,
      slaBreached: list.filter((f) => f.slaStatus === "Breached").length,
      findings: list,
    });
    const leaderboard = Array.from(byHost.entries())
      .map(([host, list]) => buildRow(host, list))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    return { byHost, leaderboard, buildRow };
  }, [findings, filters]);

  const rows = hostRows.leaderboard;

  const maxScore = Math.max(1, ...rows.map((r) => r.score));
  const isHostFiltered = (host: string) =>
    crossFilters.some((cf) => cf.field === "host" && cf.value === host);

  // Drawer host resolves across ALL active findings, so a ?host= deep link
  // opens even when the host isn't in the top-8 leaderboard rows.
  const selectedRow = useMemo(() => {
    if (!selectedHost) return null;
    const list = hostRows.byHost.get(selectedHost);
    if (!list || list.length === 0) return null;
    return hostRows.buildRow(selectedHost, list);
  }, [selectedHost, hostRows]);

  // Unassigned Critical findings on the selected host, for one-click bulk assign
  const criticalUnassigned = useMemo(() => {
    if (!selectedRow) return [];
    return selectedRow.findings.filter(
      (f) => f.severity === "Critical" && !f.assignedTeam
    );
  }, [selectedRow]);

  const handleBulkAssign = (team: (typeof TEAMS)[number]) => {
    if (!canAssign) return;
    for (const f of criticalUnassigned) {
      assignFindingTeam(f.id, team);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, host: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCrossFilter("host", host);
    }
  };

  const openDrawer = (host: string) => {
    scrollPosRef.current = 0;
    openHostDrawer(host);
    syncHostParam(host);
  };

  const closeDrawer = () => {
    scrollPosRef.current = 0;
    closeHostDrawer();
    syncHostParam(null);
  };

  return (
    <>
      <Card className="border-border bg-card/30">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Most Vulnerable Hosts
            </span>
            <Badge variant="outline" className="text-[10px]">Weighted Risk</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No active findings to rank.
            </p>
          ) : (
            rows.map((r, i) => {
              const active = isHostFiltered(r.host);
              return (
                <div
                  key={r.host}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleCrossFilter("host", r.host)}
                  onKeyDown={(e) => handleRowKeyDown(e, r.host)}
                  aria-pressed={active}
                  title={
                    active
                      ? "Filtering dashboard by host — click to remove"
                      : "Click to cross-filter the dashboard by this host"
                  }
                  className={cn(
                    "group w-full rounded-xl border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary/50 bg-primary-soft ring-1 ring-primary/30"
                      : "border-border bg-card hover:border-foreground/20 hover:shadow-pop"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground">
                        #{i + 1}
                      </span>
                      <span className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {r.host}
                      </span>
                      {r.critical > 0 && (
                        <span className="rounded bg-rose-500/10 px-1 py-0.5 text-[8px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {r.critical}C
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="font-mono text-sm font-extrabold text-foreground">
                        {r.score}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrawer(r.host);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        title={`Open ${r.host} findings`}
                        aria-label={`Open ${r.host} findings`}
                        className="rounded-md p-0.5 text-muted-foreground/70 transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(r.score / maxScore) * 100}%`,
                        backgroundColor:
                          r.score / maxScore > 0.7
                            ? SEVERITY_HEX.Critical
                            : r.score / maxScore > 0.4
                            ? SEVERITY_HEX.High
                            : SEVERITY_HEX.Medium,
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground">
                    <span>{r.count} findings</span>
                    {r.exploitable > 0 && (
                      <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                        <Flame className="h-3 w-3" /> {r.exploitable} exploit
                      </span>
                    )}
                    {r.kev > 0 && (
                      <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                        <Skull className="h-3 w-3" /> {r.kev} KEV
                      </span>
                    )}
                    {r.zeroDay > 0 && (
                      <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400">
                        <Zap className="h-3 w-3" /> {r.zeroDay} 0-day
                      </span>
                    )}
                    {r.ransomware > 0 && (
                      <span className="text-purple-600 dark:text-purple-400">
                        {r.ransomware} ransomware
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Per-host findings drawer */}
      <Sheet open={selectedRow !== null} onOpenChange={(o) => !o && closeDrawer()}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              {selectedRow?.host ?? ""}
            </SheetTitle>
            <SheetDescription>
              {selectedRow
                ? `${selectedRow.count} active findings · weighted risk ${selectedRow.score}`
                : ""}
            </SheetDescription>
            {selectedRow && (
              <span className="self-start sm:self-auto">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                    selectedRow.slaBreached > 0
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                      : "bg-muted/40 text-muted-foreground border-border"
                  )}
                  title="Findings past their C.H.I. SLA remediation deadline"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {selectedRow.slaBreached} SLA breach
                  {selectedRow.slaBreached === 1 ? "" : "es"}
                </span>
              </span>
            )}
          </SheetHeader>

          {/* Bulk-assign critical findings bar */}
          {criticalUnassigned.length > 0 && (
            <div className="mx-5 mb-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  <Users className="h-3.5 w-3.5" /> Bulk Assign Criticals
                </span>
                <Badge
                  variant="outline"
                  className="border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px]"
                >
                  {criticalUnassigned.length} unassigned
                </Badge>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Assign all unassigned Critical findings on this host to one team in a single click.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TEAMS.map((t) => (
                  <PermissionTooltip
                    key={t}
                    locked={!canAssign}
                    reason="Your role cannot assign teams — ask an Administrator or Remediation Lead"
                  >
                    <button
                      type="button"
                      aria-disabled={!canAssign || undefined}
                      onClick={() => handleBulkAssign(t)}
                      title={canAssign ? `Assign ${criticalUnassigned.length} criticals to ${t}` : undefined}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[10px] font-semibold transition-all",
                        canAssign
                          ? "bg-card text-foreground border-border hover:bg-accent hover:border-foreground/20"
                          : "bg-muted/30 text-muted-foreground/40 border-border cursor-not-allowed"
                      )}
                    >
                      {criticalUnassigned.length} → {t.replace(" / ", "/")}
                    </button>
                  </PermissionTooltip>
                ))}
              </div>
            </div>
          )}

          <div
            ref={scrollRef}
            onScroll={(e) => {
              scrollPosRef.current = e.currentTarget.scrollTop;
            }}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-6"
          >
            {selectedRow?.findings.map((f) => {
              const snippet = findRemediationSnippet(f.name, f.description);
              return (
              <div key={f.id} className="space-y-2.5 rounded-xl border border-border bg-card p-3">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <SeverityBadge severity={f.severity} />
                  <span className="font-mono text-xs font-bold text-foreground">
                    {f.cvss !== undefined ? f.cvss.toFixed(1) : "—"}
                  </span>
                </div>

                <h4 className="text-xs font-semibold leading-normal text-foreground">
                  {f.name}
                </h4>

                {/* Threat intel tags */}
                <div className="flex flex-wrap gap-1">
                  {f.cisaKev === "CISA KEV" && (
                    <span className="rounded bg-rose-600 text-white px-1.5 py-0.5 text-[9px] font-extrabold shadow-sm flex items-center gap-1">
                      <Skull className="h-3 w-3" /> CISA KEV
                    </span>
                  )}
                  {f.isZeroDay === "Zero-day" && (
                    <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      Zero-day
                    </span>
                  )}
                  {f.isExploitable === "Exploitable" && (
                    <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
                      Exploit
                    </span>
                  )}
                  {f.isEol === "EOL/Obsolete" && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      EOL
                    </span>
                  )}
                  {f.slaStatus === "Breached" && (
                    <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      SLA Breach
                    </span>
                  )}
                </div>

                {/* Assign + ticket bar (mirrors VulnTable pattern) */}
                <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                      Team:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {TEAMS.map((t) => (
                        <PermissionTooltip
                          key={t}
                          locked={!canAssign}
                          reason="Your role cannot assign teams — ask an Administrator or Remediation Lead"
                        >
                          <button
                            type="button"
                            aria-disabled={!canAssign || undefined}
                            onClick={() => {
                              if (!canAssign) return;
                              assignFindingTeam(f.id, t);
                            }}
                            title={canAssign ? `Assign to ${t}` : undefined}
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[9px] font-semibold border transition-all",
                              f.assignedTeam === t
                                ? "bg-primary text-primary-foreground border-primary"
                                : canAssign
                                ? "bg-card text-muted-foreground border-border hover:bg-accent"
                                : "bg-muted/30 text-muted-foreground/40 border-border cursor-not-allowed"
                            )}
                          >
                            {t.replace(" / ", "/")}
                          </button>
                        </PermissionTooltip>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {f.assignedTeam && (
                      <span className="truncate font-mono text-[9px] text-primary">
                        RACI: {f.raciRole ?? "—"} · {f.patchStatus ?? "Unassigned"}
                      </span>
                    )}
                    {f.ticketId ? (
                      <span className="shrink-0 rounded bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 font-mono text-[10px] font-bold flex items-center gap-1">
                        <Ticket className="h-3 w-3" /> {f.ticketId}
                      </span>
                    ) : (
                      <RestrictedButton
                        size="sm"
                        variant="secondary"
                        allowed={canTicket}
                        reason="Your role cannot raise tickets — ask an Administrator or Remediation Lead"
                        className="h-6 text-[10px] gap-1"
                        onClick={() => raiseTicket(f.id)}
                      >
                        <Ticket className="h-3 w-3" />
                        Raise Ticket
                      </RestrictedButton>
                    )}
                  </div>
                </div>

                {/* Remediation patch snippet */}
                {snippet && (
                  <div className="space-y-2 rounded-lg border border-primary/20 bg-card p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                        <Terminal className="h-3.5 w-3.5 text-primary" /> Remediation Patch Snippet: {snippet.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground shrink-0">{snippet.category}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{snippet.description}</p>
                    <div className="space-y-1.5 pt-0.5">
                      {snippet.snippets.map((s) => (
                        <div key={s.technology} className="rounded border border-border bg-muted/40 p-2 font-mono text-[10px] space-y-1">
                          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
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
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
