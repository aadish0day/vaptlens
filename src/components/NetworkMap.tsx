import { useMemo, useState } from "react";
import { useDashboardStore } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import { SEVERITY_HEX } from "../lib/chart-theme";
import type { Finding, Severity } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Filter, FilterX, Network, Server, Cpu } from "lucide-react";
import { SeverityBadge } from "./severity-badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface NetworkNode {
  id: string;
  label: string;
  type: "center" | "subnet" | "host";
  x: number;
  y: number;
  severity: Severity | "Info" | "Remediated";
  count: number;
  parentId?: string;
  findings: Finding[];
}

interface NetworkLink {
  source: { x: number; y: number };
  target: { x: number; y: number };
  id: string;
  severity?: Severity;
}

export function NetworkMap() {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const toggleCrossFilter = useDashboardStore((s) => s.toggleCrossFilter);
  const crossFilters = useDashboardStore((s) => s.filters.crossFilters);
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);

  const isHostFiltered = (host: string) =>
    crossFilters.some((cf) => cf.field === "host" && cf.value === host);

  const isSeverityFiltered = (sev: string) =>
    crossFilters.some((cf) => cf.field === "severity" && cf.value === sev);

  // Apply active global filters, excluding Fixed placeholders from active risk topology
  const filteredFindings = useMemo(() => {
    return applyFilters(findings, filters).filter((f: Finding) => f.lifecycle !== "Fixed");
  }, [findings, filters]);

  // Dimensions of the SVG canvas
  const width = 640;
  const height = 480;
  const centerX = width / 2;
  const centerY = height / 2;

  // Process subnets and hosts into a coordinate layout
  const { nodes, links, hostsMap } = useMemo(() => {
    const list: NetworkNode[] = [];
    const connectionLines: NetworkLink[] = [];
    const tempHostsMap = new Map<string, Finding[]>();

    // Group findings by Host
    const findingsByHost = new Map<string, Finding[]>();
    for (const f of filteredFindings) {
      if (!findingsByHost.has(f.host)) {
        findingsByHost.set(f.host, []);
      }
      findingsByHost.get(f.host)!.push(f);
      tempHostsMap.set(f.host, findingsByHost.get(f.host)!);
    }

    // Determine subnets for each host
    const subnetsMap = new Map<string, { hostIPs: string[]; maxSeverity: Severity; totalCount: number }>();
    findingsByHost.forEach((hostFindings, hostIP) => {
      // Find max severity of the host
      let maxSev: Severity = "Info";
      const severityWeights: Record<Severity, number> = { Critical: 4, High: 3, Medium: 2, Low: 1, Info: 0 };
      for (const f of hostFindings) {
        if (severityWeights[f.severity] > severityWeights[maxSev]) {
          maxSev = f.severity;
        }
      }

      // Compute subnet (heuristic: take first 3 octets of IP)
      const ipMatch = hostIP.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
      const subnetName = ipMatch ? `${ipMatch[1]}.x /24` : "External Assets";

      if (!subnetsMap.has(subnetName)) {
        subnetsMap.set(subnetName, { hostIPs: [], maxSeverity: "Info", totalCount: 0 });
      }
      const sub = subnetsMap.get(subnetName)!;
      sub.hostIPs.push(hostIP);
      sub.totalCount += hostFindings.length;
      if (severityWeights[maxSev] > severityWeights[sub.maxSeverity]) {
        sub.maxSeverity = maxSev;
      }
    });

    // 1. Center scanner node
    const centerNode: NetworkNode = {
      id: "scanner-root",
      label: "Scanner Engine",
      type: "center",
      x: centerX,
      y: centerY,
      severity: "Info",
      count: filteredFindings.length,
      findings: [],
    };
    list.push(centerNode);

    // Radial calculation constants
    const R1 = 125; // Subnet circle radius
    const R2 = 45;  // Host circle offset from subnet center

    const subnets = Array.from(subnetsMap.entries());
    const subnetCount = subnets.length;

    subnets.forEach(([subName, subData], sIdx) => {
      // 2. Subnet Node coordinates
      const sAngle = (2 * Math.PI * sIdx) / subnetCount;
      const sx = centerX + R1 * Math.cos(sAngle);
      const sy = centerY + R1 * Math.sin(sAngle);
      const subNodeId = `subnet-${subName}`;

      const subnetNode: NetworkNode = {
        id: subNodeId,
        label: subName,
        type: "subnet",
        x: sx,
        y: sy,
        severity: subData.maxSeverity,
        count: subData.totalCount,
        parentId: "scanner-root",
        findings: [],
      };
      list.push(subnetNode);

      // Link from root to subnet
      connectionLines.push({
        id: `link-root-${subNodeId}`,
        source: { x: centerX, y: centerY },
        target: { x: sx, y: sy },
        severity: subData.maxSeverity,
      });

      // 3. Host Node coordinates clustered around subnet center
      const hostIPs = subData.hostIPs;
      const hostCount = hostIPs.length;

      hostIPs.forEach((hIP, hIdx) => {
        const hAngle = (2 * Math.PI * hIdx) / hostCount + sAngle; // Offset relative to subnet angle
        const hx = sx + R2 * Math.cos(hAngle);
        const hy = sy + R2 * Math.sin(hAngle);
        const hostFindings = findingsByHost.get(hIP) || [];

        // Max severity for host
        let hostMaxSev: Severity = "Info";
        const weights: Record<Severity, number> = { Critical: 4, High: 3, Medium: 2, Low: 1, Info: 0 };
        hostFindings.forEach((f) => {
          if (weights[f.severity] > weights[hostMaxSev]) {
            hostMaxSev = f.severity;
          }
        });

        const hostNode: NetworkNode = {
          id: hIP,
          label: hIP,
          type: "host",
          x: hx,
          y: hy,
          severity: hostMaxSev,
          count: hostFindings.length,
          parentId: subNodeId,
          findings: hostFindings,
        };
        list.push(hostNode);

        // Link from subnet to host
        connectionLines.push({
          id: `link-${subNodeId}-${hIP}`,
          source: { x: sx, y: sy },
          target: { x: hx, y: hy },
          severity: hostMaxSev,
        });
      });
    });

    return { nodes: list, links: connectionLines, hostsMap: tempHostsMap };
  }, [filteredFindings, centerX, centerY]);

  // Activate a host node: select it in the sidebar and toggle its cross-filter.
  const activateHost = (node: NetworkNode) => {
    if (node.type !== "host") return;
    setSelectedHostId(node.id === selectedHostId ? null : node.id);
    toggleCrossFilter("host", node.label);
  };

  // Detailed view of selected host findings
  const selectedHostFindings = selectedHostId ? hostsMap.get(selectedHostId) || [] : [];

  return (
    <div className="flex h-full flex-col gap-5 lg:flex-row">
      {/* Node Graph Panel */}
      <Card className="flex-1 border-border bg-card/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Network className="h-4 w-4 text-primary" /> Active Segment Map
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-3">
          {nodes.length <= 1 ? (
            <div className="flex h-96 w-full flex-col items-center justify-center text-center text-xs text-muted-foreground">
              No host topology to map. Upload a scan to generate network links.
            </div>
          ) : (
            <div className="relative overflow-auto rounded-lg border border-border bg-card/60">
              <svg width={width} height={height} className="max-w-full">
                {/* SVG Shadow definitions for node glow */}
                <defs>
                  {/* (glow filter removed — no decorative effects) */}
                </defs>

                {/* SVG Style definitions for running link flow animations */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes vaptlens-dash {
                    to {
                      stroke-dashoffset: -20;
                    }
                  }
                  .vaptlens-pulse-link {
                    animation: vaptlens-dash 4s linear infinite;
                  }
                `}} />

                {/* Render Links */}
                {links.map((lnk) => {
                  const strokeColor = lnk.severity ? SEVERITY_HEX[lnk.severity] : "hsl(var(--border))";
                  const isRoot = lnk.id.includes("root");
                  return (
                    <line
                      key={lnk.id}
                      x1={lnk.source.x}
                      y1={lnk.source.y}
                      x2={lnk.target.x}
                      y2={lnk.target.y}
                      stroke={strokeColor}
                      strokeWidth={isRoot ? "1.5" : "1"}
                      strokeOpacity={isRoot ? "0.3" : "0.15"}
                      strokeDasharray={isRoot ? "4 4" : undefined}
                      className={isRoot ? "vaptlens-pulse-link" : ""}
                    />
                  );
                })}

                {/* Render Nodes */}
                {nodes.map((node) => {
                  const isSelected = selectedHostId === node.id;
                  let r = 8;
                  let fill = "hsl(var(--muted-foreground))";
                  let stroke = "hsl(var(--border))";

                  if (node.type === "center") {
                    r = 13;
                    fill = "hsl(var(--card))";
                    stroke = "hsl(var(--primary))";
                  } else if (node.type === "subnet") {
                    r = 10;
                    fill = "hsl(var(--muted)/40)";
                    stroke = SEVERITY_HEX[node.severity as Severity] || fill;
                  } else {
                    r = Math.min(12, 6 + Math.log2(node.count + 1) * 2);
                    fill = SEVERITY_HEX[node.severity as Severity] || fill;
                    stroke = isSelected
                      ? "hsl(var(--foreground))"
                      : isHostFiltered(node.label)
                        ? "hsl(var(--primary))"
                        : "hsl(var(--card))";
                  }

                  const isHostNode = node.type === "host";

                  return (
                    <g
                      key={node.id}
                      role={isHostNode ? "button" : undefined}
                      tabIndex={isHostNode ? 0 : undefined}
                      aria-label={
                        isHostNode
                          ? `Host ${node.label}, ${node.count} findings, ${node.severity} severity`
                          : undefined
                      }
                      aria-pressed={isHostNode ? isHostFiltered(node.label) : undefined}
                      className={cn(
                        isHostNode ? "group cursor-pointer outline-none" : ""
                      )}
                      onClick={(e) => {
                        if (!isHostNode) return;
                        // Guard against browser-synthesized clicks from Space/Enter
                        // on role="button" (detail === 0) — keydown already activates.
                        if (e.detail === 0) return;
                        activateHost(node);
                      }}
                      onKeyDown={(e) => {
                        if (!isHostNode) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          activateHost(node);
                        }
                      }}
                    >
                      {/* Interactive hover/focus indicator ring */}
                      {isHostNode && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={r + 4}
                          className="fill-none stroke-primary/30 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                          strokeWidth="2"
                        />
                      )}

                      {/* Persistent ring when this host is cross-filtering the dashboard */}
                      {isHostNode && isHostFiltered(node.label) && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={r + 5}
                          className="fill-none stroke-primary/50"
                          strokeWidth="2"
                        />
                      )}

                      {/* Scanner center node */}
                      {node.type === "center" && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={r + 8}
                          className="fill-primary/5 stroke-primary/10 pointer-events-none"
                          strokeWidth="1"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={r}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="transition-all duration-150"
                      />

                      {/* Small center core for subnet nodes */}
                      {node.type === "subnet" && (
                        <circle cx={node.x} cy={node.y} r={3} className="fill-foreground/80" />
                      )}

                      {/* Node Text Label */}
                      <text
                        x={node.x}
                        y={node.y - r - 4}
                        textAnchor="middle"
                        className={`font-mono text-[9px] select-none ${
                          isSelected
                            ? "font-semibold fill-foreground"
                            : "fill-muted-foreground group-hover:fill-foreground group-focus-visible:fill-foreground"
                        }`}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Host Details Sidebar Panel */}
      <Card className="w-full shrink-0 border-border bg-card/40 lg:w-[26rem]">
        <CardHeader className="pb-3 border-b border-border bg-card/30">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Server className="h-4 w-4 text-primary" /> Node Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto">
          {!selectedHostId ? (
            <div className="flex h-72 flex-col items-center justify-center text-center text-xs text-muted-foreground px-4">
              Select a host node (IP) to inspect its findings and cross-filter the dashboard —
              click it, or Tab to it and press Enter/Space.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Host Headers */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold tracking-tight font-mono">{selectedHostId}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Host total: {selectedHostFindings.length} active findings
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs flex gap-1.5 items-center bg-border/20">
                  <Cpu className="h-3.5 w-3.5" /> HOST
                </Badge>
              </div>

              {/* Cross-filter action for the selected host */}
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {isHostFiltered(selectedHostId)
                    ? "Dashboard filtered by this host"
                    : "Dashboard filter"}
                </span>
                <Button
                  variant={isHostFiltered(selectedHostId) ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => toggleCrossFilter("host", selectedHostId)}
                  aria-pressed={isHostFiltered(selectedHostId)}
                >
                  {isHostFiltered(selectedHostId) ? (
                    <FilterX className="h-3.5 w-3.5" />
                  ) : (
                    <Filter className="h-3.5 w-3.5" />
                  )}
                  {isHostFiltered(selectedHostId) ? "Remove filter" : "Filter dashboard"}
                </Button>
              </div>

              {/* Finding Lists */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-muted-foreground">Vulnerabilities</h4>
                {selectedHostFindings.map((f: Finding) => (
                  <div key={f.id} className="rounded-lg border border-border bg-card p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <SeverityBadge
                        severity={f.severity}
                        onClick={() => toggleCrossFilter("severity", f.severity)}
                        ariaPressed={isSeverityFiltered(f.severity)}
                        title="Click to cross-filter the dashboard by this severity"
                      />
                      {f.cvss !== undefined && (
                        <span className="font-mono text-[10px] font-bold text-muted-foreground">
                          CVSS {f.cvss.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-foreground leading-normal">{f.name}</p>
                    {f.cve && f.cve.length > 0 && (
                      <p className="font-mono text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 inline-block">
                        {f.cve.join(", ")}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-1 border-t border-border/30 pt-2 text-[9px] font-medium">
                      <span
                        className={cn(
                          "flex items-center gap-1",
                          isSeverityFiltered(f.severity) ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        <Filter className="h-3 w-3" />
                        {isSeverityFiltered(f.severity)
                          ? `Filtering by ${f.severity} — click badge to remove`
                          : "Click badge to filter dashboard by severity"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
