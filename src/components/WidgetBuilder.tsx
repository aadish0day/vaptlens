import { useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import { useDashboardStore, uid } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import type { Aggregation, ChartType, FieldKey, WidgetConfig } from "../lib/types";
import { Widget } from "./Widget";

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "donut", label: "Donut" },
  { value: "line", label: "Line" },
  { value: "histogram", label: "Histogram" },
  { value: "table", label: "Table" },
  { value: "kpi", label: "KPI" },
];

const FIELD_OPTIONS: { value: FieldKey; label: string }[] = [
  { value: "severity", label: "Severity" },
  { value: "host", label: "Host" },
  { value: "tool", label: "Tool" },
  { value: "scanLabel", label: "Scan" },
  { value: "port", label: "Port" },
  { value: "protocol", label: "Protocol" },
  { value: "cve", label: "CVE" },
  { value: "pluginId", label: "Plugin ID" },
  { value: "name", label: "Finding name" },
  { value: "cvssBucket", label: "CVSS band" },
  { value: "scanDate", label: "Scan date" },
];

const AGG_OPTIONS: { value: Aggregation; label: string }[] = [
  { value: "count", label: "Count" },
  { value: "avgCvss", label: "Average CVSS" },
  { value: "maxCvss", label: "Max CVSS" },
  { value: "distinctHosts", label: "Distinct hosts" },
  { value: "distinctFindings", label: "Distinct findings" },
];

export function WidgetBuilder({ onClose }: { onClose: () => void }) {
  const findings = useDashboardStore((s) => s.findings);
  const filters = useDashboardStore((s) => s.filters);
  const widgets = useDashboardStore((s) => s.widgets);
  const addWidget = useDashboardStore((s) => s.addWidget);

  const [title, setTitle] = useState("New Widget");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [groupBy, setGroupBy] = useState<FieldKey>("severity");
  const [colorBy, setColorBy] = useState<FieldKey | "">("");
  const [aggregation, setAggregation] = useState<Aggregation>("count");
  const [topN, setTopN] = useState<number>(10);
  const [sortBy, setSortBy] = useState<"value" | "label">("value");

  const filtered = useMemo(() => applyFilters(findings, filters), [findings, filters]);

  const previewWidget: WidgetConfig = {
    id: "preview",
    title,
    chartType,
    groupBy,
    colorBy: colorBy || undefined,
    aggregation,
    sortBy,
    topN: chartType === "bar" || chartType === "histogram" ? topN : undefined,
    layout: { x: 0, y: 0, w: 6, h: 6 },
  };

  const handleAdd = () => {
    const maxY = widgets.reduce((m, w) => Math.max(m, w.layout.y + w.layout.h), 0);
    addWidget({
      ...previewWidget,
      id: uid(),
      layout: { x: 0, y: maxY, w: chartType === "kpi" ? 3 : 6, h: chartType === "kpi" ? 2 : 6 },
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-text">
            Add Widget
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted hover:bg-border hover:text-text focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-4 md:grid-cols-2">
          <div className="space-y-3">
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 font-mono text-xs text-text focus:border-accent focus:outline-none"
              />
            </Field>

            <Field label="Chart type">
              <div className="flex flex-wrap gap-1.5">
                {CHART_TYPES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setChartType(c.value)}
                    className={`rounded border px-2 py-1 font-mono text-xs ${
                      chartType === c.value
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border text-muted hover:text-text"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Group by (X / category)">
              <Select
                value={groupBy}
                onChange={(v) => setGroupBy(v as FieldKey)}
                options={FIELD_OPTIONS}
              />
            </Field>

            {chartType !== "kpi" && chartType !== "table" && (
              <Field label="Aggregation (Y / measure)">
                <Select
                  value={aggregation}
                  onChange={(v) => setAggregation(v as Aggregation)}
                  options={AGG_OPTIONS}
                />
              </Field>
            )}

            {chartType !== "kpi" && chartType !== "table" && (
              <Field label="Color / split by (optional)">
                <Select
                  value={colorBy}
                  onChange={(v) => setColorBy(v as FieldKey | "")}
                  options={[{ value: "", label: "— none —" }, ...FIELD_OPTIONS]}
                />
              </Field>
            )}

            {(chartType === "bar" || chartType === "histogram" || chartType === "table") && (
              <Field label="Top N">
                <input
                  type="number"
                  min={0}
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value) || 0)}
                  className="w-24 rounded border border-border bg-bg px-2 py-1.5 font-mono text-xs text-text focus:border-accent focus:outline-none"
                />
                <span className="ml-2 font-mono text-[11px] text-muted">0 = all</span>
              </Field>
            )}

            {chartType !== "kpi" && chartType !== "table" && (
              <Field label="Sort by">
                <div className="flex gap-1.5">
                  {(["value", "label"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`rounded border px-2 py-1 font-mono text-xs ${
                        sortBy === s
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border text-muted hover:text-text"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </div>

          <div className="flex flex-col">
            <span className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              Live preview
            </span>
            <div className="min-h-[320px] flex-1 rounded border border-border bg-bg p-2">
              {filtered.length === 0 ? (
                <div className="flex h-full items-center justify-center font-mono text-xs text-muted">
                  Upload data to preview.
                </div>
              ) : (
                <Widget widget={previewWidget} filtered={filtered} />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 font-mono text-xs text-muted hover:text-text"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 font-mono text-xs font-semibold text-bg hover:bg-accent/85 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <Plus size={14} /> Add to canvas
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-border bg-bg px-2 py-1.5 font-mono text-xs text-text focus:border-accent focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
