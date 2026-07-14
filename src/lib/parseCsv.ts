import Papa from "papaparse";
import type { ColumnMapping, Finding, ScanBatch } from "./types";
import { normalizeSeverity } from "./presets";

export interface ParseResult {
  findings: Finding[];
  batch: ScanBatch;
  rowCount: number;
  error?: string;
}

function parseList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  const s = String(value).trim();
  if (!s) return [];
  if (s.includes(",")) return s.split(",").map((x) => x.trim()).filter(Boolean);
  if (s.includes(";")) return s.split(";").map((x) => x.trim()).filter(Boolean);
  if (s.includes("|")) return s.split("|").map((x) => x.trim()).filter(Boolean);
  return [s];
}

function parseCvss(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number(String(value).trim());
  return Number.isNaN(n) ? undefined : n;
}

export function parseCsv(
  csvText: string,
  mapping: ColumnMapping,
  batch: ScanBatch
): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    const fatal = parsed.errors.find((e) => e.type === "Delimiter" || e.type === "Quotes");
    if (fatal) {
      return {
        findings: [],
        batch: { ...batch, findingCount: 0 },
        rowCount: 0,
        error: `Could not parse CSV: ${fatal.message}`,
      };
    }
  }

  const rows = parsed.data;
  const findings: Finding[] = [];

  rows.forEach((row, i) => {
    const host = (mapping.host ? row[mapping.host] : undefined)?.trim() || "unknown-host";
    const cvss = parseCvss(mapping.cvss ? row[mapping.cvss] : undefined);
    const severity = normalizeSeverity(
      mapping.severity ? row[mapping.severity] : undefined,
      cvss
    );

    const name =
      (mapping.name ? row[mapping.name] : undefined)?.trim() || "Unnamed finding";

    const port = mapping.port ? (row[mapping.port]?.trim() || undefined) : undefined;
    const protocol = mapping.protocol
      ? (row[mapping.protocol]?.trim() || undefined)
      : undefined;
    const pluginId = mapping.pluginId
      ? (row[mapping.pluginId]?.trim() || undefined)
      : undefined;
    const scanDate = mapping.scanDate
      ? (row[mapping.scanDate]?.trim() || undefined)
      : undefined;

    findings.push({
      id: `${batch.id}-${i}`,
      host,
      port,
      protocol,
      name,
      severity,
      cvss,
      cve: mapping.cve ? parseList(row[mapping.cve]) : undefined,
      description: mapping.description
        ? (row[mapping.description]?.trim() || undefined)
        : undefined,
      solution: mapping.solution
        ? (row[mapping.solution]?.trim() || undefined)
        : undefined,
      pluginId,
      scanId: batch.id,
      scanLabel: batch.label,
      scanDate,
      tool: batch.tool,
    });
  });

  return {
    findings,
    batch: { ...batch, findingCount: findings.length },
    rowCount: rows.length,
  };
}
