import { useMemo } from "react";
import { useDashboardStore } from "../../store/useDashboardStore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Flame, Ticket, Lock } from "lucide-react";
import { SeverityBadge } from "../severity-badge";
import { canPerform } from "../../lib/permissions";
import { PermissionTooltip } from "../RestrictedButton";
import type { Finding } from "../../lib/types";

export function TopCriticalBreachWidget({
  findings: findingsProp,
}: {
  findings?: Finding[];
}) {
  const storeFindings = useDashboardStore((s) => s.findings);
  const raiseTicket = useDashboardStore((s) => s.raiseTicket);
  const userRole = useDashboardStore((s) => s.userRole);
  const findings = findingsProp ?? storeFindings;
  const canTicket = canPerform(userRole, "ticket");

  const top10Breach = useMemo(() => {
    return [...findings]
      .filter((f) => f.lifecycle !== "Fixed")
      .sort((a, b) => {
        const scoreA = (a.cvss ?? 5) + (a.cisaKev === "CISA KEV" ? 5 : 0) + (a.isZeroDay === "Zero-day" ? 4 : 0);
        const scoreB = (b.cvss ?? 5) + (b.cisaKev === "CISA KEV" ? 5 : 0) + (b.isZeroDay === "Zero-day" ? 4 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }, [findings]);

  return (
    <Card className="h-full flex flex-col border-border bg-card">
      <CardHeader className="pb-2 border-b border-border">
        <CardTitle className="flex items-center justify-between text-[13px] font-semibold tracking-tight">
          <span className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" /> Top 10 Critical & Exploitable Breach Risks
          </span>
          <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
            High Priority
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-1 overflow-y-auto space-y-2">
        {top10Breach.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No critical breach risks detected.
          </div>
        ) : (
          top10Breach.map((f, idx) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-border bg-accent/20 p-2.5 text-xs gap-3 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-bold text-muted-foreground text-[11px] w-4 shrink-0">
                  #{idx + 1}
                </span>
                <SeverityBadge severity={f.severity} />
                <div className="min-w-0 leading-tight">
                  <div className="font-medium text-foreground truncate max-w-[280px]" title={f.name}>
                    {f.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                    <span>Host: {f.host}</span>
                    {f.cisaKev === "CISA KEV" && (
                      <span className="text-rose-500 font-bold flex items-center gap-0.5">
                        <Flame className="h-3 w-3" /> CISA KEV
                      </span>
                    )}
                    {f.isZeroDay === "Zero-day" && (
                      <span className="text-purple-500 font-bold">Zero-day</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs font-extrabold text-foreground">
                  CVSS {f.cvss ?? "—"}
                </span>

                {f.ticketId ? (
                  <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
                    {f.ticketId}
                  </Badge>
                ) : canTicket ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => raiseTicket(f.id)}
                  >
                    <Ticket className="h-3 w-3" />
                    Raise Ticket
                  </Button>
                ) : (
                  <PermissionTooltip
                    locked
                    reason="Your role cannot raise tickets — ask an Administrator or Remediation Lead"
                  >
                    <span
                      className="flex items-center gap-1 text-[10px] text-muted-foreground/60 cursor-not-allowed"
                      aria-label="Ticket action locked by role permissions"
                    >
                      <Lock className="h-3 w-3" />
                    </span>
                  </PermissionTooltip>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
