import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { useDashboardStore } from "../store/useDashboardStore";
import { SEVERITIES, SEVERITY_COLORS } from "../lib/types";

function Section({
  title,
  children,
  count,
}: {
  title: string;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="border-b border-border px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
          {title}
        </span>
        {count !== undefined && (
          <span className="font-mono text-[10px] text-muted">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function CheckList({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  if (options.length === 0) {
    return <p className="font-mono text-[11px] text-muted">No values.</p>;
  }
  return (
    <div className="max-h-44 space-y-1 overflow-auto pr-1">
      {options.map((opt) => (
        <label
          key={opt}
          className="flex cursor-pointer items-center gap-2 font-mono text-xs text-text"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            className="accent-accent"
          />
          <span className="truncate" title={opt}>
            {opt}
          </span>
        </label>
      ))}
    </div>
  );
}

export function SlicerPanel() {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const toggleArrayFilter = useDashboardStore((s) => s.toggleArrayFilter);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const clearFilters = useDashboardStore((s) => s.clearFilters);
  const batches = useDashboardStore((s) => s.batches);

  const options = useMemo(() => {
    const uniq = (f: (x: typeof findings[number]) => string | undefined) =>
      Array.from(
        new Set(findings.map(f).filter((v): v is string => !!v))
      ).sort();
    return {
      hosts: uniq((x) => x.host),
      tools: uniq((x) => x.tool),
      ports: uniq((x) => x.port),
      dates: uniq((x) => x.scanDate?.slice(0, 10)),
    };
  }, [findings]);

  const activeCount =
    filters.severities.length +
    filters.hosts.length +
    filters.tools.length +
    filters.scanIds.length +
    filters.ports.length +
    (filters.search ? 1 : 0) +
    (filters.dateRange ? 1 : 0);

  return (
    <div className="flex h-full flex-col overflow-auto bg-panel">
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text">
          Slicers
        </span>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted hover:bg-border hover:text-sev-critical focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <X size={11} /> clear {activeCount}
          </button>
        )}
      </div>

      <Section title="Search">
        <div className="flex items-center gap-2 rounded border border-border px-2 py-1.5 focus-within:border-accent">
          <Search size={13} className="text-muted" />
          <input
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="host, finding, CVE…"
            className="w-full bg-transparent font-mono text-xs text-text outline-none placeholder:text-muted"
            aria-label="Free-text search"
          />
        </div>
      </Section>

      <Section title="Severity" count={filters.severities.length}>
        <CheckList
          options={SEVERITIES}
          selected={filters.severities}
          onToggle={(v) => toggleArrayFilter("severities", v as never)}
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {SEVERITIES.map((s) => (
            <span
              key={s}
              className="h-1.5 w-6 rounded-full"
              style={{ background: SEVERITY_COLORS[s] }}
              title={s}
            />
          ))}
        </div>
      </Section>

      <Section title="Tool" count={filters.tools.length}>
        <CheckList
          options={options.tools}
          selected={filters.tools}
          onToggle={(v) => toggleArrayFilter("tools", v)}
        />
      </Section>

      <Section title="Host" count={filters.hosts.length}>
        <CheckList
          options={options.hosts}
          selected={filters.hosts}
          onToggle={(v) => toggleArrayFilter("hosts", v)}
        />
      </Section>

      <Section title="Port" count={filters.ports.length}>
        <CheckList
          options={options.ports}
          selected={filters.ports}
          onToggle={(v) => toggleArrayFilter("ports", v)}
        />
      </Section>

      <Section title="Scan" count={filters.scanIds.length}>
        <div className="space-y-1">
          <button
            onClick={() => setFilter("scanIds", [])}
            className={`w-full rounded px-2 py-1 text-left font-mono text-xs ${
              filters.scanIds.length === 0
                ? "bg-accent/15 text-accent"
                : "text-text hover:bg-border"
            }`}
          >
            All combined
          </button>
          {batches.map((b) => (
            <button
              key={b.id}
              onClick={() =>
                setFilter("scanIds", filters.scanIds[0] === b.id ? [] : [b.id])
              }
              className={`w-full truncate rounded px-2 py-1 text-left font-mono text-xs ${
                filters.scanIds[0] === b.id
                  ? "bg-accent/15 text-accent"
                  : "text-text hover:bg-border"
              }`}
              title={b.label}
            >
              {b.label}
              <span className="ml-1 text-muted">({b.findingCount})</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Date range">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateRange?.[0] ?? ""}
            min={options.dates[0]}
            max={options.dates[options.dates.length - 1]}
            onChange={(e) =>
              setFilter("dateRange", [
                e.target.value,
                filters.dateRange?.[1] ?? "",
              ])
            }
            className="w-full rounded border border-border bg-bg px-2 py-1 font-mono text-xs text-text focus:border-accent focus:outline-none"
            aria-label="Start date"
          />
          <span className="font-mono text-xs text-muted">→</span>
          <input
            type="date"
            value={filters.dateRange?.[1] ?? ""}
            min={options.dates[0]}
            max={options.dates[options.dates.length - 1]}
            onChange={(e) =>
              setFilter("dateRange", [
                filters.dateRange?.[0] ?? "",
                e.target.value,
              ])
            }
            className="w-full rounded border border-border bg-bg px-2 py-1 font-mono text-xs text-text focus:border-accent focus:outline-none"
            aria-label="End date"
          />
        </div>
      </Section>
    </div>
  );
}
