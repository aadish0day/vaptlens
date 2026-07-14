import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { SEVERITY_COLORS, type Finding } from "../lib/types";

type SortKey = "severity" | "host" | "name" | "cvss" | "tool";
const SEV_RANK: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Info: 4,
};

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
      <div className="flex h-full items-center justify-center text-sm text-muted">
        No findings match the current filters.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search size={14} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter table…"
          className="w-full bg-transparent font-mono text-xs text-text outline-none placeholder:text-muted"
          aria-label="Filter findings table"
        />
        <span className="font-mono text-xs text-muted">{rows.length} rows</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead className="sticky top-0 bg-panel">
            <tr className="text-muted">
              <th className="w-6 px-2 py-1.5" />
              <SortHeader label="Sev" active={sortKey === "severity"} dir={sortDir} onClick={() => toggleSort("severity")} />
              <SortHeader label="Host" active={sortKey === "host"} dir={sortDir} onClick={() => toggleSort("host")} />
              <SortHeader label="Finding" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
              <SortHeader label="CVSS" active={sortKey === "cvss"} dir={sortDir} onClick={() => toggleSort("cvss")} />
              <SortHeader label="Tool" active={sortKey === "tool"} dir={sortDir} onClick={() => toggleSort("tool")} />
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const open = expanded.has(f.id);
              return (
                <Fragment key={f.id}>
                  <tr
                    key={f.id}
                    className="cursor-pointer border-t border-border/60 hover:bg-border/30"
                    onClick={() => toggleExpand(f.id)}
                  >
                    <td className="px-2 py-1.5 text-muted">
                      {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ color: SEVERITY_COLORS[f.severity], background: `${SEVERITY_COLORS[f.severity]}22` }}
                      >
                        {f.severity}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-text">{f.host}</td>
                    <td className="max-w-[280px] truncate px-2 py-1.5 text-text" title={f.name}>
                      {f.name}
                    </td>
                    <td className="px-2 py-1.5 text-muted">{f.cvss ?? "—"}</td>
                    <td className="px-2 py-1.5 text-muted">{f.tool}</td>
                  </tr>
                  {open && (
                    <tr key={`${f.id}-detail`} className="border-t border-border/60 bg-bg/40">
                      <td />
                      <td colSpan={5} className="px-4 py-3 font-sans text-xs leading-relaxed text-muted">
                        {f.description && (
                          <p className="mb-2">
                            <span className="font-mono text-accent">desc: </span>
                            {f.description}
                          </p>
                        )}
                        {f.solution && (
                          <p className="mb-2">
                            <span className="font-mono text-accent">fix: </span>
                            {f.solution}
                          </p>
                        )}
                        {f.cve && f.cve.length > 0 && (
                          <p className="font-mono">
                            <span className="text-accent">cve: </span>
                            {f.cve.join(", ")}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th
      className={`cursor-pointer px-2 py-1.5 font-semibold select-none ${active ? "text-accent" : ""}`}
      onClick={onClick}
    >
      {label}
      {active ? (dir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );
}
