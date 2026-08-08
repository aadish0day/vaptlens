import { useMemo, useState } from "react";
import { useDashboardStore } from "../store/useDashboardStore";
import type { AssetItem } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Server, Database, ShieldAlert, Cpu, Search, Lock, Layers } from "lucide-react";
import { HostRiskLeaderboard } from "./HostRiskLeaderboard";
import { ExposureRegistry } from "./ExposureRegistry";

export function AssetInventory() {
  const findings = useDashboardStore((s) => s.findings);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("All");

  // Derive asset inventory from findings
  const assets: AssetItem[] = useMemo(() => {
    const map = new Map<string, {
      host: string;
      vulns: typeof findings;
      criticalCount: number;
      highCount: number;
      isEol: boolean;
    }>();

    for (const f of findings) {
      if (!map.has(f.host)) {
        map.set(f.host, {
          host: f.host,
          vulns: [],
          criticalCount: 0,
          highCount: 0,
          isEol: false,
        });
      }
      const item = map.get(f.host)!;
      item.vulns.push(f);
      if (f.severity === "Critical") item.criticalCount += 1;
      if (f.severity === "High") item.highCount += 1;
      if (f.isEol === "EOL/Obsolete") item.isEol = true;
    }

    return Array.from(map.values()).map((entry, idx) => {
      const isDb = entry.host.includes("db") || entry.host.includes("sql") || entry.host.includes("postgres");
      const isGateway = entry.host.includes("api") || entry.host.includes("gateway") || entry.host.includes("proxy");
      const isCrown = entry.criticalCount > 0 || entry.host.includes("prod") || isDb;

      const deviceType = isDb
        ? "Database"
        : isGateway
        ? "API Gateway"
        : entry.host.includes("dc") || entry.host.includes("ad")
        ? "Domain Controller"
        : "Web Server";

      const tier = isCrown
        ? "Tier 1 - Crown Jewel"
        : entry.highCount > 0
        ? "Tier 2 - Production"
        : "Tier 3 - Dev/Staging";

      const ownerTeam = isDb
        ? "Database DBAs"
        : isGateway
        ? "DevOps / Cloud"
        : entry.criticalCount > 0
        ? "SecOps"
        : "Server Team";

      const riskScore = entry.vulns.reduce((sum, v) => sum + (v.cvss ?? 3), 0);

      return {
        id: `asset-${idx}`,
        host: entry.host,
        ip: entry.host.match(/^\d/) ? entry.host : `10.0.${Math.floor(idx / 10)}.${(idx % 250) + 1}`,
        os: entry.host.includes("win") ? "Windows Server 2022" : "Ubuntu 22.04 LTS (Linux)",
        deviceType,
        tier,
        ownerTeam,
        eolStatus: entry.isEol ? "EOS/EOL" : "Supported",
        activeVulnCount: entry.vulns.filter((v) => v.lifecycle !== "Fixed").length,
        criticalCount: entry.criticalCount,
        riskScore: Math.round(riskScore),
      };
    });
  }, [findings]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchesSearch =
        !search ||
        a.host.toLowerCase().includes(search.toLowerCase()) ||
        a.ip.toLowerCase().includes(search.toLowerCase()) ||
        a.ownerTeam.toLowerCase().includes(search.toLowerCase());

      const matchesTier = tierFilter === "All" || a.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [assets, search, tierFilter]);

  const mostVulnerableHost = useMemo(() => {
    return [...assets].sort((a, b) => b.riskScore - a.riskScore)[0];
  }, [assets]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Asset Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                Total Assets Monitored
              </span>
              <div className="text-2xl font-extrabold font-mono mt-0.5">{assets.length}</div>
            </div>
            <Server className="h-8 w-8 text-primary opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                Crown Jewel Assets
              </span>
              <div className="text-2xl font-extrabold font-mono mt-0.5 text-rose-500">
                {assets.filter((a) => a.tier === "Tier 1 - Crown Jewel").length}
              </div>
            </div>
            <Lock className="h-8 w-8 text-rose-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Most Vulnerable Host
              </span>
              <div className="text-sm font-extrabold truncate max-w-[140px] mt-1" title={mostVulnerableHost?.host}>
                {mostVulnerableHost?.host ?? "—"}
              </div>
            </div>
            <ShieldAlert className="h-8 w-8 text-amber-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                EOS / EOL Assets
              </span>
              <div className="text-2xl font-extrabold font-mono mt-0.5 text-purple-500">
                {assets.filter((a) => a.eolStatus === "EOS/EOL").length}
              </div>
            </div>
            <Cpu className="h-8 w-8 text-purple-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Deep: weighted host risk leaderboard + EOL/0-day exposure registry */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <HostRiskLeaderboard />
        <ExposureRegistry />
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border bg-card/40">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-card px-2.5 py-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring w-full">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Host, IP, OS, or Owner Team..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center gap-2">
            {["All", "Tier 1 - Crown Jewel", "Tier 2 - Production", "Tier 3 - Dev/Staging"].map((t) => (
              <Button
                key={t}
                variant={tierFilter === t ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTierFilter(t)}
                className="text-xs h-8"
              >
                {t.replace("Tier ", "T")}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Asset Table */}
      <Card className="border-border bg-card/30">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
            <Layers className="h-4 w-4 text-primary" /> Active Infrastructure Asset Inventory ({filteredAssets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Host / Asset Name</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Device Type</TableHead>
                <TableHead>Asset Tier</TableHead>
                <TableHead>Owner Team</TableHead>
                <TableHead>OS / EOL Status</TableHead>
                <TableHead className="text-right">Active Vulns</TableHead>
                <TableHead className="text-right">Risk Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-semibold text-foreground flex items-center gap-2">
                    {a.deviceType === "Database" ? (
                      <Database className="h-4 w-4 text-purple-500" />
                    ) : (
                      <Server className="h-4 w-4 text-blue-500" />
                    )}
                    {a.host}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{a.ip}</TableCell>
                  <TableCell className="text-xs">{a.deviceType}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        a.tier.includes("Crown")
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : a.tier.includes("Production")
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {a.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-primary">{a.ownerTeam}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>{a.os}</span>
                      {a.eolStatus === "EOS/EOL" && (
                        <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-600">
                          EOL
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                    {a.activeVulnCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-extrabold text-rose-500">
                    {a.riskScore}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
