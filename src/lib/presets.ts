import type { ColumnMapping, DetectionResult, Severity } from "./types";

interface ToolPreset {
  name: string;
  signatures: string[];
  mapping: ColumnMapping;
}

const PRESETS: ToolPreset[] = [
  {
    name: "Nessus",
    signatures: ["Plugin ID", "Plugin Name", "Risk", "CVE", "See Also"],
    mapping: {
      host: "Host",
      severity: "Risk",
      cvss: "CVSS",
      cve: "CVE",
      pluginId: "Plugin ID",
      name: "Plugin Name",
      description: "Description",
      solution: "Solution",
      port: "Port",
      protocol: "Protocol",
    },
  },
  {
    name: "OpenVAS / Greenbone",
    signatures: ["NVT", "OID", "Threat", "QoD"],
    mapping: {
      host: "IP",
      severity: "Threat",
      cvss: "CVSS",
      cve: "CVEs",
      pluginId: "OID",
      name: "NVT",
      description: "Summary",
      solution: "Solution",
      port: "Port",
    },
  },
  {
    name: "Qualys",
    signatures: ["QID", "Title", "Severity", "Solution"],
    mapping: {
      host: "IP",
      severity: "Severity",
      cvss: "CVSS_Base",
      pluginId: "QID",
      name: "Title",
      solution: "Solution",
      port: "Port",
      description: "Description",
    },
  },
  {
    name: "Burp Suite",
    signatures: ["Issue type", "Issue Detail", "Host", "Path", "Severity", "Confidence"],
    mapping: {
      host: "Host",
      severity: "Severity",
      name: "Issue type",
      description: "Issue Detail",
      port: "Port",
    },
  },
  {
    name: "OWASP ZAP",
    signatures: ["Alert", "Risk", "CWE ID", "URL", "Confidence"],
    mapping: {
      host: "URL",
      severity: "Risk",
      name: "Alert",
      description: "Description",
      cve: "CWE ID",
    },
  },
  {
    name: "Nikto",
    signatures: ["OSVDB", "Target IP", "Target Hostname", "URI"],
    mapping: {
      host: "Target Hostname",
      name: "Description",
      port: "Port",
      pluginId: "OSVDB",
    },
  },
];

export function detectTool(headers: string[]): DetectionResult | null {
  const headerSet = new Set(headers.map((h) => h.trim()));
  let best: DetectionResult | null = null;
  for (const preset of PRESETS) {
    let matched = 0;
    for (const sig of preset.signatures) {
      if (headerSet.has(sig) || headerSet.has(sig.toLowerCase())) matched++;
    }
    if (matched >= 2 && (!best || matched > best.matched)) {
      best = { tool: preset.name, mapping: preset.mapping, matched };
    }
  }
  return best;
}

const TEXT_MAP: Record<string, Severity> = {
  crit: "Critical",
  critical: "Critical",
  high: "High",
  med: "Medium",
  medium: "Medium",
  moderate: "Medium",
  low: "Low",
  info: "Info",
  informational: "Info",
  none: "Info",
  log: "Info",
};

export function normalizeSeverity(raw: unknown, cvss?: number): Severity {
  if (raw === undefined || raw === null) {
    return deriveFromCvss(cvss);
  }
  const s = String(raw).trim();
  if (s === "") return deriveFromCvss(cvss);

  const lower = s.toLowerCase();
  if (lower in TEXT_MAP) return TEXT_MAP[lower];

  const num = Number(s);
  if (!Number.isNaN(num)) {
    if (num >= 5) return "Critical";
    if (num >= 4) return "High";
    if (num >= 3) return "Medium";
    if (num >= 1) return "Low";
    return "Info";
  }
  return deriveFromCvss(cvss);
}

export function deriveFromCvss(cvss?: number): Severity {
  if (cvss === undefined || Number.isNaN(cvss)) return "Info";
  if (cvss >= 9) return "Critical";
  if (cvss >= 7) return "High";
  if (cvss >= 4) return "Medium";
  if (cvss > 0) return "Low";
  return "Info";
}

const FUZZ_TOKENS: { token: string; field: keyof ColumnMapping }[] = [
  { token: "host", field: "host" },
  { token: "ip", field: "host" },
  { token: "hostname", field: "host" },
  { token: "target", field: "host" },
  { token: "url", field: "url" },
  { token: "port", field: "port" },
  { token: "protocol", field: "protocol" },
  { token: "sev", field: "severity" },
  { token: "risk", field: "severity" },
  { token: "threat", field: "severity" },
  { token: "level", field: "severity" },
  { token: "name", field: "name" },
  { token: "title", field: "name" },
  { token: "issue", field: "name" },
  { token: "alert", field: "name" },
  { token: "description", field: "description" },
  { token: "detail", field: "description" },
  { token: "summary", field: "description" },
  { token: "solution", field: "solution" },
  { token: "fix", field: "solution" },
  { token: "cvss", field: "cvss" },
  { token: "cve", field: "cve" },
  { token: "cwe", field: "cve" },
  { token: "plugin", field: "pluginId" },
  { token: "qid", field: "pluginId" },
  { token: "osvdb", field: "pluginId" },
  { token: "oid", field: "pluginId" },
  { token: "date", field: "scanDate" },
];

export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const header of headers) {
    const lower = header.toLowerCase();
    for (const { token, field } of FUZZ_TOKENS) {
      if (lower.includes(token)) {
        if (!mapping[field]) mapping[field] = header;
        break;
      }
    }
  }
  if (!mapping["host"] && mapping["url"]) {
    mapping["host"] = mapping["url"];
  }
  return mapping;
}
