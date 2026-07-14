import type { SavedMapping, WidgetConfig } from "./types";

const LAYOUT_KEY = "vaptlens.layout.v1";
const MAPPING_KEY = "vaptlens.mappings.v1";

export function loadLayout(): WidgetConfig[] | null {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as WidgetConfig[];
  } catch {
    return null;
  }
}

export function saveLayout(widgets: WidgetConfig[]): void {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(widgets));
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
