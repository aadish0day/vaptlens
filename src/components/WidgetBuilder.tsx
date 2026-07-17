import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useDashboardStore, uid } from "../store/useDashboardStore";
import { applyFilters } from "../lib/aggregate";
import type { Aggregation, ChartType, FieldKey, WidgetConfig } from "../lib/types";
import { Widget } from "./Widget";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "../lib/utils";

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "area", label: "Area" },
  { value: "donut", label: "Donut" },
  { value: "line", label: "Line" },
  { value: "radar", label: "Radar" },
  { value: "treemap", label: "Treemap" },
  { value: "heatmap", label: "Heatmap" },
  { value: "scatter", label: "Scatter" },
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

export function WidgetBuilder({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
    topN:
      chartType === "bar" ||
      chartType === "histogram" ||
      chartType === "treemap" ||
      chartType === "heatmap"
        ? topN
        : undefined,
    layout: { x: 0, y: 0, w: 6, h: 6 },
  };

  const handleAdd = () => {
    const maxY = widgets.reduce((m, w) => Math.max(m, w.layout.y + w.layout.h), 0);
    addWidget({
      ...previewWidget,
      id: uid(),
      layout: {
        x: 0,
        y: maxY,
        w: chartType === "kpi" ? 3 : 6,
        h: chartType === "kpi" ? 2 : 6,
      },
    });
    onOpenChange(false);
  };

  const NO_MEASURE = ["kpi", "table", "heatmap", "scatter"];
  const showAgg = !NO_MEASURE.includes(chartType);
  const showSplit = ["bar", "area", "donut", "line", "radar", "treemap"].includes(
    chartType
  );
  const showTopN = [
    "bar",
    "histogram",
    "table",
    "treemap",
    "heatmap",
  ].includes(chartType);
  const showSort = ["bar", "histogram"].includes(chartType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Configure a visualization, then drop it onto your canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 grid-cols-1 gap-6 overflow-y-auto py-1 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="widget-title">Title</Label>
              <Input
                id="widget-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Chart type</Label>
              <div className="flex flex-wrap gap-1.5">
                {CHART_TYPES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setChartType(c.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      chartType === c.value
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Group by (category)</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as FieldKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showAgg && (
              <div className="space-y-1.5">
                <Label>Aggregation (measure)</Label>
                <Select
                  value={aggregation}
                  onValueChange={(v) => setAggregation(v as Aggregation)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGG_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showSplit && (
              <div className="space-y-1.5">
                <Label>Split / color by (optional)</Label>
                <Select
                  value={colorBy || "__none"}
                  onValueChange={(v) => setColorBy(v === "__none" ? "" : (v as FieldKey))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— none —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— none —</SelectItem>
                    {FIELD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showTopN && (
              <div className="space-y-1.5">
                <Label htmlFor="topn">Top N</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="topn"
                    type="number"
                    min={0}
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground">0 = all</span>
                </div>
              </div>
            )}

            {showSort && (
              <div className="space-y-1.5">
                <Label>Sort by</Label>
                <div className="flex gap-1.5">
                  {(["value", "label"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSortBy(s)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                        sortBy === s
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <Label className="mb-2">Live preview</Label>
            <div className="min-h-[340px] flex-1 rounded-xl border border-border bg-background p-3">
              {filtered.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Upload data to preview.
                </div>
              ) : (
                <Widget widget={previewWidget} filtered={filtered} />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Add to canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
