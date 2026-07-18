import type { SavedMapping, WidgetConfig } from "./types";
import { sanitizeWidgets } from "./validate";

const LAYOUT_KEY = "vaptlens.layout.v1";
const MAPPING_KEY = "vaptlens.mappings.v1";
const LAYOUT_VERSION = 2;

export function loadLayout(): WidgetConfig[] | null {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== LAYOUT_VERSION || !Array.isArray(parsed.widgets)) {
      return null;
    }
    return sanitizeWidgets(parsed.widgets);
  } catch {
    return null;
  }
}

export function saveLayout(widgets: WidgetConfig[]): void {
  try {
    localStorage.setItem(
      LAYOUT_KEY,
      JSON.stringify({ v: LAYOUT_VERSION, widgets })
    );
  } catch {
    /* storage may be unavailable; ignore */
  }
}

export function loadMappings(): SavedMapping[] {
  try {
    const raw = localStorage.getItem(MAPPING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedMapping[];
  } catch {
    return [];
  }
}

export function saveMappings(mappings: SavedMapping[]): void {
  try {
    localStorage.setItem(MAPPING_KEY, JSON.stringify(mappings));
  } catch {
    /* ignore */
  }
}

const STATUSES_KEY = "vaptlens.remediation.v1";

export function loadRemediationStatuses(): Record<string, "todo" | "in_progress" | "in_review" | "done"> {
  try {
    const raw = localStorage.getItem(STATUSES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, "todo" | "in_progress" | "in_review" | "done">;
  } catch {
    return {};
  }
}

export function saveRemediationStatuses(
  statuses: Record<string, "todo" | "in_progress" | "in_review" | "done">
): void {
  try {
    localStorage.setItem(STATUSES_KEY, JSON.stringify(statuses));
  } catch {
    /* ignore */
  }
}
