import { useMemo } from "react";
import { useDashboardStore } from "../store/useDashboardStore";
import type { EnterpriseRole, Finding, Severity } from "../lib/types";
import { canPerform } from "../lib/permissions";
import { RACI_TEAMS, RACI_ROLES, buildRaciMatrix } from "../lib/raci";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Shield, Clock, Users, Ticket, CheckCircle2, Lock, KeyRound, Eye, CalendarClock, TrendingUp, Crown, Search, Wrench } from "lucide-react";
import { RestrictedButton } from "./RestrictedButton";
import { TrendsDeep } from "./TrendsDeep";
import { SEVERITY_HEX } from "../lib/chart-theme";

export function GovernanceSLA() {
  const findings = useDashboardStore((s) => s.findings);
  const userRole = useDashboardStore((s) => s.userRole);
  const setUserRole = useDashboardStore((s) => s.setUserRole);
  const twoFactorEnabled = useDashboardStore((s) => s.twoFactorEnabled);
  const toggleTwoFactor = useDashboardStore((s) => s.toggleTwoFactor);
  const assignFindingTeam = useDashboardStore((s) => s.assignFindingTeam);
  const raiseTicket = useDashboardStore((s) => s.raiseTicket);

  const slaMetrics = useMemo(() => {
    const criticalBreached = findings.filter((f) => f.severity === "Critical" && f.slaStatus === "Breached").length;
    const highBreached = findings.filter((f) => f.severity === "High" && f.slaStatus === "Breached").length;
    const mediumBreached = findings.filter((f) => f.severity === "Medium" && f.slaStatus === "Breached").length;
    const lowBreached = findings.filter((f) => f.severity === "Low" && f.slaStatus === "Breached").length;

    const totalMet = findings.filter((f) => f.slaStatus === "Met").length;
    const totalBreached = findings.filter((f) => f.slaStatus === "Breached").length;
    const complianceRate = findings.length > 0 ? Math.round((totalMet / findings.length) * 100) : 100;

    return { criticalBreached, highBreached, mediumBreached, lowBreached, totalMet, totalBreached, complianceRate };
  }, [findings]);

  // C.H.I. (Critical / High / Important) SLA projection table
  const slaProjection = useMemo(() => {
    const active = findings.filter((f: Finding) => f.lifecycle !== "Fixed");
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
      const group = active.filter((f) => f.severity === sev);
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
    // Top 5 upcoming breaches (closest to expiry, not yet breached)
    const upcoming = active
      .filter((f) => f.slaStatus === "Met" && (f.slaDaysLeft ?? 0) <= 14)
      .sort((a, b) => (a.slaDaysLeft ?? 0) - (b.slaDaysLeft ?? 0))
      .slice(0, 5);
    return { chiRows, upcoming };
  }, [findings]);

  // SLA compliance trend per scan month (Met %) 
  const slaTrend = useMemo(() => {
    const byMonth = new Map<string, { met: number; total: number }>();
    for (const f of findings) {
      if (!f.scanDate) continue;
      const d = new Date(f.scanDate);
      if (Number.isNaN(d.getTime())) continue;
      const month = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const cur = byMonth.get(month) ?? { met: 0, total: 0 };
      cur.total += 1;
      if (f.slaStatus === "Met") cur.met += 1;
      byMonth.set(month, cur);
    }
    return Array.from(byMonth.entries())
      .map(([month, v]) => ({
        month,
        pct: v.total ? Math.round((v.met / v.total) * 100) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [findings]);

  // Full team × RACI-role matrix: row = owning team, column = R/A/C/I count
  const raciMatrix = useMemo(() => buildRaciMatrix(findings), [findings]);

  const raciTotals = useMemo(() => {
    const totals: Record<(typeof RACI_ROLES)[number], number> = {
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

  const unassignedCriticals = useMemo(() => {
    return findings.filter((f) => f.severity === "Critical" && !f.assignedTeam);
  }, [findings]);

  const canAssign = canPerform(userRole, "assign");
  const canTicket = canPerform(userRole, "ticket");
  const canToggle2FA = canPerform(userRole, "toggle2fa");
  const isReadOnly = userRole === "Security Auditor";

  const handleBulkAssignCriticals = () => {
    if (!canAssign || !canTicket) return;
    for (const f of unassignedCriticals) {
      assignFindingTeam(f.id, "Server Team", "Responsible");
      raiseTicket(f.id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Role-Based Access Control & 2FA Simulator Header */}
      <Card className="border-border bg-card/40">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">Enterprise Governance & Security Access Mode</h3>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                  <KeyRound className="h-3 w-3 mr-1" /> 2FA {twoFactorEnabled ? "Enforced & Active" : "Disabled"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Simulate role-based access permissions and corporate SLA governance rules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Current Role Simulator
              </label>
              <Select value={userRole} onValueChange={(val) => setUserRole(val as EnterpriseRole)}>
                <SelectTrigger className="h-9 min-w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">
                    <span className="flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-amber-500" /> Administrator
                    </span>
                  </SelectItem>
                  <SelectItem value="Security Auditor">
                    <span className="flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5" /> Security Auditor
                    </span>
                  </SelectItem>
                  <SelectItem value="Remediation Lead">
                    <span className="flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5" /> Remediation Lead
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <RestrictedButton
              variant="outline"
              size="sm"
              allowed={canToggle2FA}
              reason="Only Administrators can toggle 2FA"
              onClick={toggleTwoFactor}
              className="h-9 text-xs mt-4 gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
            </RestrictedButton>
          </div>
        </CardContent>
      </Card>

      {/* SLA Policy Target & Compliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
              <span>Critical SLA Target</span>
              <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">14 Days</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold font-mono text-rose-500">
              {slaMetrics.criticalBreached} Breached
            </div>
            <p className="text-[11px] text-muted-foreground">Critical vulnerabilities open &gt; 14 days</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
              <span>High SLA Target</span>
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">30 Days</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold font-mono text-amber-500">
              {slaMetrics.highBreached} Breached
            </div>
            <p className="text-[11px] text-muted-foreground">High severity vulnerabilities open &gt; 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
              <span>Medium SLA Target</span>
              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">90 Days</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold font-mono text-yellow-500">
              {slaMetrics.mediumBreached} Breached
            </div>
            <p className="text-[11px] text-muted-foreground">Medium vulnerabilities open &gt; 90 days</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
              <span>Overall SLA Compliance</span>
              <Clock className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold font-mono text-emerald-500">
              {slaMetrics.complianceRate}%
            </div>
            <p className="text-[11px] text-muted-foreground">{slaMetrics.totalMet} Met / {slaMetrics.totalBreached} Breached</p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Projection & C.H.I. Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card/30">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" /> SLA Projection — C.H.I. (Critical / High / Important)
              </span>
              <Badge variant="outline" className="text-[10px]">Days-to-breach</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-[1fr_repeat(4,1fr)] gap-1.5 px-1 text-[11px] font-semibold text-muted-foreground">
              <span>Severity</span>
              <span className="text-center">Target</span>
              <span className="text-center">Active</span>
              <span className="text-center">Breached</span>
              <span className="text-center">At-Risk ≤7d</span>
            </div>
            {slaProjection.chiRows.map((r) => (
              <div key={r.severity} className="grid grid-cols-[1fr_repeat(4,1fr)] items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2">
                <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_HEX[r.severity] }} />
                  {r.chi}
                  <span className="text-[9px] font-mono text-muted-foreground">({r.severity})</span>
                </span>
                <span className="text-center font-mono text-xs text-muted-foreground">{r.targetDays}d</span>
                <span className="text-center font-mono text-xs font-bold text-foreground">{r.active}</span>
                <span className={`text-center font-mono text-xs font-bold ${r.breached > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
                  {r.breached}
                </span>
                <span className={`text-center font-mono text-xs font-bold ${r.atRisk > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                  {r.atRisk}
                </span>
              </div>
            ))}
            <p className="text-[9px] text-muted-foreground italic">
              Avg days remaining: {slaProjection.chiRows.map((r) => `${r.chi} ${r.avgDaysLeft}d`).join(" · ")} — negative values indicate breach.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/30">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Upcoming SLA Breaches &amp; Compliance Trend
              </span>
              <Badge variant="outline" className="text-[10px]">Next 14 days</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              {slaProjection.upcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">No findings approaching SLA breach.</p>
              ) : (
                slaProjection.upcoming.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-xs">
                    <span className="min-w-0 truncate font-medium text-foreground">{f.name}</span>
                    <span className="shrink-0 font-mono text-[10px] text-amber-600 dark:text-amber-400">
                      {f.slaDaysLeft}d left · {f.slaDeadline}
                    </span>
                  </div>
                ))
              )}
            </div>
            {/* Compliance sparkbars per month */}
            <div className="space-y-1">
              {slaTrend.map((t) => (
                <div key={t.month} className="flex items-center gap-2 text-[10px]">
                  <span className="w-12 shrink-0 font-mono text-muted-foreground">{t.month}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${t.pct}%`, backgroundColor: t.pct >= 80 ? "#059669" : t.pct >= 50 ? "#EA580C" : "#DC2626" }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right font-mono font-bold text-foreground">{t.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deep trends: aging + threat intel */}
      <TrendsDeep />

      {/* RACI Matrix & Patch Ticket Dispatcher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RACI Matrix Card */}
        <Card className="border-border bg-card/30">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Corporate RACI Responsibility Matrix
              </span>
              <Badge variant="outline" className="text-[10px]">
                Team × Role
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {isReadOnly && (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                <Eye className="h-3 w-3" />
                Read-only view — assignments are managed by Remediation Leads &amp; Administrators.
              </div>
            )}

            {/* Matrix header row */}
            <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] gap-1.5 px-1 text-[11px] font-semibold text-muted-foreground">
              <span>Team</span>
              {RACI_ROLES.map((r) => (
                <span key={r} className="text-center">{r.slice(0, 1)} — {r}</span>
              ))}
            </div>

            {/* Matrix rows */}
            <div className="space-y-1.5">
              {RACI_TEAMS.map((team) => {
                const row = raciMatrix.get(team)!;
                const accent =
                  team === "Server Team"
                    ? "border-primary/20 bg-primary/5"
                    : team === "Database DBAs"
                    ? "border-purple-500/20 bg-purple-500/5"
                    : team === "SecOps"
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : team === "Application Dev"
                    ? "border-blue-500/20 bg-blue-500/5"
                    : "border-amber-500/20 bg-amber-500/5";
                return (
                  <div
                    key={team}
                    className={`grid grid-cols-[1.4fr_repeat(4,1fr)] items-center gap-1.5 rounded-lg border px-2.5 py-2 ${accent}`}
                  >
                    <span className="truncate text-[11px] font-semibold text-foreground">
                      {team}
                    </span>
                    {RACI_ROLES.map((r) => (
                      <span
                        key={r}
                        className={`text-center font-mono text-xs font-bold ${
                          row[r] > 0 ? "text-foreground" : "text-muted-foreground/40"
                        }`}
                      >
                        {row[r] > 0 ? row[r] : "—"}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Totals row */}
            <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Total
              </span>
              {RACI_ROLES.map((r) => (
                <span key={r} className="text-center font-mono text-xs font-extrabold text-foreground">
                  {raciTotals[r]}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patch Ticket Dispatcher Card */}
        <Card className="border-border bg-card/30">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
              <span className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" /> Jira / GitHub Patching Ticket Dispatcher
              </span>
              <Badge variant="outline" className="border-rose-500/30 text-rose-500">
                {unassignedCriticals.length} Unassigned Criticals
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automate engineering backlog assignment by generating Jira/GitHub tickets for unassigned Critical vulnerabilities across all server teams.
            </p>

            <div className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">Auto-Assign Unassigned Criticals</span>
                <p className="text-[11px] text-muted-foreground">Dispatches ticket IDs (SEC-XXXX) and assigns to Server Team</p>
              </div>
              <RestrictedButton
                size="sm"
                allowed={canAssign && canTicket}
                reason="Your role cannot assign teams or raise tickets — ask an Administrator or Remediation Lead"
                disabled={unassignedCriticals.length === 0}
                onClick={handleBulkAssignCriticals}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                Dispatch {unassignedCriticals.length} Tickets
              </RestrictedButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
