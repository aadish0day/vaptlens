import { useMemo } from "react";
import {
  Search,
  X,
  ShieldAlert,
  Wrench,
  Server,
  Network,
  Layers,
  CalendarDays,
} from "lucide-react";
import { useDashboardStore } from "../store/useDashboardStore";
import { SEVERITIES, type Severity } from "../lib/types";
import { SEVERITY_HEX } from "../lib/chart-theme";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { cn } from "../lib/utils";

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {icon && <span className="text-muted-foreground/70">{icon}</span>}
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onToggle,
  dot,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
  dot?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors hover:bg-accent">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      {dot && (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: dot }}
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={label}>
        {label}
      </span>
      {count !== undefined && (
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </label>
  );
}

export function SlicerPanel() {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const toggleArrayFilter = useDashboardStore((s) => s.toggleArrayFilter);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const clearFilters = useDashboardStore((s) => s.clearFilters);
  const batches = useDashboardStore((s) => s.batches);

  const { options, counts } = useMemo(() => {
    const uniq = (f: (x: (typeof findings)[number]) => string | undefined) =>
      Array.from(new Set(findings.map(f).filter((v): v is string => !!v))).sort();
    const countBy = (f: (x: (typeof findings)[number]) => string | undefined) => {
      const m = new Map<string, number>();
      for (const x of findings) {
        const v = f(x);
        if (v) m.set(v, (m.get(v) ?? 0) + 1);
      }
      return m;
    };
    return {
      options: {
        hosts: uniq((x) => x.host),
        tools: uniq((x) => x.tool),
        ports: uniq((x) => x.port),
        dates: uniq((x) => x.scanDate?.slice(0, 10)),
      },
      counts: {
        severity: countBy((x) => x.severity) as Map<string, number>,
        hosts: countBy((x) => x.host),
        tools: countBy((x) => x.tool),
        ports: countBy((x) => x.port),
      },
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
    <ScrollArea className="h-full">
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-sm font-semibold tracking-tight">Filters</span>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3 w-3" /> Clear {activeCount}
          </button>
        )}
      </div>
      <Separator />

      <Section title="Search" icon={<Search className="h-3.5 w-3.5" />}>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-2.5 py-1.5 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="host, finding, CVE…"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Free-text search"
          />
        </div>
      </Section>
      <Separator />

      <Section title="Severity" icon={<ShieldAlert className="h-3.5 w-3.5" />} count={filters.severities.length}>
        <div className="space-y-0.5">
          {SEVERITIES.map((s) => (
            <CheckRow
              key={s}
              label={s}
              dot={SEVERITY_HEX[s]}
              count={counts.severity.get(s) ?? 0}
              checked={filters.severities.includes(s)}
              onToggle={() => toggleArrayFilter("severities", s as Severity)}
            />
          ))}
        </div>
      </Section>
      <Separator />

      <Section title="Tool" icon={<Wrench className="h-3.5 w-3.5" />} count={filters.tools.length}>
        <div className="max-h-44 space-y-0.5 overflow-auto pr-1">
          {options.tools.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">No values yet.</p>
          ) : (
            options.tools.map((t) => (
              <CheckRow
                key={t}
                label={t}
                count={counts.tools.get(t) ?? 0}
                checked={filters.tools.includes(t)}
                onToggle={() => toggleArrayFilter("tools", t)}
              />
            ))
          )}
        </div>
      </Section>
      <Separator />

      <Section title="Host" icon={<Server className="h-3.5 w-3.5" />} count={filters.hosts.length}>
        <div className="max-h-44 space-y-0.5 overflow-auto pr-1">
          {options.hosts.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">No values yet.</p>
          ) : (
            options.hosts.map((h) => (
              <CheckRow
                key={h}
                label={h}
                count={counts.hosts.get(h) ?? 0}
                checked={filters.hosts.includes(h)}
                onToggle={() => toggleArrayFilter("hosts", h)}
              />
            ))
          )}
        </div>
      </Section>
      <Separator />

      <Section title="Port" icon={<Network className="h-3.5 w-3.5" />} count={filters.ports.length}>
        <div className="max-h-32 space-y-0.5 overflow-auto pr-1">
          {options.ports.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">No values yet.</p>
          ) : (
            options.ports.map((p) => (
              <CheckRow
                key={p}
                label={p}
                count={counts.ports.get(p) ?? 0}
                checked={filters.ports.includes(p)}
                onToggle={() => toggleArrayFilter("ports", p)}
              />
            ))
          )}
        </div>
      </Section>
      <Separator />

      <Section title="Scan" icon={<Layers className="h-3.5 w-3.5" />} count={filters.scanIds.length}>
        <div className="space-y-0.5">
          <button
            onClick={() => setFilter("scanIds", [])}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
              filters.scanIds.length === 0
                ? "bg-primary-soft font-medium text-primary"
                : "text-foreground hover:bg-accent"
            )}
          >
            <span>All combined</span>
          </button>
          {batches.map((b) => {
            const active = filters.scanIds[0] === b.id;
            return (
              <button
                key={b.id}
                onClick={() =>
                  setFilter("scanIds", active ? [] : [b.id])
                }
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  active
                    ? "bg-primary-soft font-medium text-primary"
                    : "text-foreground hover:bg-accent"
                )}
              >
                <span className="min-w-0 truncate" title={b.label}>
                  {b.label}
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {b.findingCount}
                </span>
              </button>
            );
          })}
        </div>
      </Section>
      <Separator />

      <Section title="Date range" icon={<CalendarDays className="h-3.5 w-3.5" />}>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateRange?.[0] ?? ""}
            min={options.dates[0]}
            max={options.dates[options.dates.length - 1]}
            onChange={(e) =>
              setFilter("dateRange", [e.target.value, filters.dateRange?.[1] ?? ""])
            }
            className="w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Start date"
          />
          <span className="text-muted-foreground">→</span>
          <input
            type="date"
            value={filters.dateRange?.[1] ?? ""}
            min={options.dates[0]}
            max={options.dates[options.dates.length - 1]}
            onChange={(e) =>
              setFilter("dateRange", [filters.dateRange?.[0] ?? "", e.target.value])
            }
            className="w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="End date"
          />
        </div>
      </Section>
    </ScrollArea>
  );
}
