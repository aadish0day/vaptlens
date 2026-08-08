import type { AuditEntry, EnterpriseRole, SavedMapping, WidgetConfig } from "./types";
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

const GOVERNANCE_KEY = "vaptlens.governance.v1";
const GOVERNANCE_VERSION = 1;
const VALID_ROLES: readonly EnterpriseRole[] = [
  "Administrator",
  "Security Auditor",
  "Remediation Lead",
];

export interface GovernancePrefs {
  userRole: EnterpriseRole;
  twoFactorEnabled: boolean;
}

export function loadGovernance(): GovernancePrefs | null {
  try {
    const raw = localStorage.getItem(GOVERNANCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== GOVERNANCE_VERSION) return null;
    if (!VALID_ROLES.includes(parsed.userRole)) return null;
    if (typeof parsed.twoFactorEnabled !== "boolean") return null;
    return {
      userRole: parsed.userRole as EnterpriseRole,
      twoFactorEnabled: parsed.twoFactorEnabled,
    };
  } catch {
    return null;
  }
}

export function saveGovernance(prefs: GovernancePrefs): void {
  try {
    localStorage.setItem(
      GOVERNANCE_KEY,
      JSON.stringify({ v: GOVERNANCE_VERSION, ...prefs })
    );
  } catch {
    /* storage may be unavailable; ignore */
  }
}

const AUDIT_KEY = "vaptlens.audit.v1";

export function loadAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as AuditEntry[];
  } catch {
    return [];
  }
}

export function saveAuditLog(entries: AuditEntry[]): void {
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(0, 200)));
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
