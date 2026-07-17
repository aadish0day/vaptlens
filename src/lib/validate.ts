import type { WidgetConfig } from "./types";
import {
  isAggregation,
  isChartType,
  isFieldKey,
} from "./types";

const MAX_COLS = 12;
const MIN_DIM = 1;
const MAX_H = 24;

function sanitizeLayout(input: unknown): WidgetConfig["layout"] {
  const fallback: WidgetConfig["layout"] = { x: 0, y: 0, w: 6, h: 6 };
  if (!input || typeof input !== "object") return fallback;
  const o = input as Record<string, unknown>;
  const num = (v: unknown, d: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : d;

  let w = Math.round(num(o.w, fallback.w));
  let h = Math.round(num(o.h, fallback.h));
  w = Math.min(MAX_COLS, Math.max(MIN_DIM, w));
  h = Math.min(MAX_H, Math.max(MIN_DIM, h));
  const x = Math.min(MAX_COLS - w, Math.max(0, Math.round(num(o.x, 0))));
  const y = Math.max(0, Math.round(num(o.y, 0)));
  return { x, y, w, h };
}

/**
 * Coerce an untrusted value into a valid WidgetConfig, or return null if it
 * cannot be salvaged. Only fields that are valid for the chart type are kept.
 */
export function sanitizeWidget(input: unknown): WidgetConfig | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;

  if (!isChartType(o.chartType)) return null;

  const layout = sanitizeLayout(o.layout);
  const title =
    typeof o.title === "string" && o.title.trim().length > 0
      ? o.title.slice(0, 120)
      : "Widget";

  const widget: WidgetConfig = {
    id:
      typeof o.id === "string" && o.id.length > 0
        ? o.id.slice(0, 64)
        : `w_${Math.random().toString(36).slice(2, 9)}`,
    title,
    chartType: o.chartType,
    groupBy: isFieldKey(o.groupBy) ? o.groupBy : "severity",
    aggregation: isAggregation(o.aggregation) ? o.aggregation : "count",
    layout,
  };

  if (isFieldKey(o.colorBy)) widget.colorBy = o.colorBy;
  if (o.sortBy === "label" || o.sortBy === "value")
    widget.sortBy = o.sortBy;
  if (typeof o.topN === "number" && Number.isFinite(o.topN)) {
    widget.topN = Math.min(100, Math.max(1, Math.round(o.topN)));
  }

  return widget;
}

/**
 * Validate an array of widgets loaded from storage. Invalid entries are
 * dropped. Returns null when there are zero salvageable widgets so the caller
 * falls back to the built-in defaults instead of rendering an empty/broken
 * dashboard.
 */
export function sanitizeWidgets(input: unknown): WidgetConfig[] | null {
  if (!Array.isArray(input)) return null;
  const clean = input
    .map(sanitizeWidget)
    .filter((w): w is WidgetConfig => w !== null);
  if (clean.length === 0) return null;
  return clean;
}
