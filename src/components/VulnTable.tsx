import { Fragment, useMemo, useState } from "react";
import {
  Bug,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Gauge,
  Search,
  Server,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import type { Finding } from "../lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { SeverityBadge } from "./severity-badge";
import { cn } from "../lib/utils";

type SortKey = "severity" | "host" | "name" | "cvss" | "tool" | "lifecycle" | "slaStatus";

function StatusBadge({ status }: { status: "New" | "Open" | "Fixed" }) {
  const styles = {
    New: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    Open: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    Fixed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border uppercase tracking-wider", styles[status])}>
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

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    const filtered = findings.filter(
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
  }, [findings, query, sortKey, sortDir]);

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

  if (findings.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No findings match the current filters.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-1 pb-2.5">
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
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {rows.length} rows
        </span>
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
                        {f.isZeroDay === "Zero-day" && (
                          <span className="shrink-0 rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            Zero-day
                          </span>
                        )}
                        {f.isExploitable === "Exploitable" && (
                          <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-500/20">
                            Exploit
                          </span>
                        )}
                        {f.isEol === "EOL/Obsolete" && (
                          <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            EOL
                          </span>
                        )}
                        {f.slaStatus === "Breached" && (
                          <span className="shrink-0 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            SLA Breached
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {f.cvss ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{f.tool}</TableCell>
                  </TableRow>
                  {open && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell />
                      <TableCell colSpan={6} className="bg-accent/30 px-4 py-3">
                        <div className="space-y-1.5 text-sm">
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
                              {f.cve.join(", ")}
                            </p>
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
